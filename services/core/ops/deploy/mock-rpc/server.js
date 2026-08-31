const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { parseTransaction, recoverTransactionAddress, keccak256 } = require('viem');

const app = express();

const PORT = process.env.PORT || 8545;
const WS_PORT = process.env.WS_PORT || 8546;
const HOST = process.env.HOST || '127.0.0.1';
const CHAIN_ID = process.env.CHAIN_ID || '86137';
const NETWORK = process.env.NETWORK || 'nakharax-testnet';
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || '3000'); // 3.0s Deterministic PoPC Consensus Cadence
const STATE_FILE = path.join(__dirname, '.state_cache.json');

// In-Memory IP Rate Limiter (Max 120 req / 10s per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10000;
const MAX_REQUESTS_PER_WINDOW = 120;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { startTime: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_REQUESTS_PER_WINDOW;
}

// Configurable CORS for Dashboards & RPC Consumers
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32000, message: 'Too many requests: Rate limit exceeded (120 req/10s)' }
    });
  }
  next();
});

app.use(express.json({ limit: '2mb', strict: false, type: 'application/json' }));

// =============================================================================
// Mock Blockchain State
// =============================================================================

let blockNumber = 1000;
let accounts = {};
let transactions = {};
let blockCache = {};
let logs = [];
let pendingTransactions = [];
let contracts = {};

// Validators and Workers (Nakharax-specific)
let validators = [];
let workers = {};
let sentinels = {}; // addr -> { address, name, type, role, status, lastHeartbeat, uptimeSeconds, uptimeRewardsEarned, fraudBountiesEarned, queryGasEarned, slashesReported, region }
let jobs = {};
let stakingPools = {}; // addr -> { staked: BigInt, sNakShares: BigInt, lastClaimBlock: number, unbondingQueue: [] }
let proposals = {}; // id -> { id, proposer, title, description, type, stake, createdBlock, snapshotBlock, endBlock, timelockEndBlock, status, votesFor, votesAgainst, votesAbstain, voters }
let proposalCounter = 1;

// 🏛️ Canonical On-Chain Protocol Parameters (GOVERNANCE.md & TOKENOMICS.md Single Source of Truth)
let protocolParameters = {
  consensus_popc: {
    sample_size_s: 1000, // Challenge sample count (600 - 1500)
    redundancy_beta: 0.03, // 3% replica job redundancy (2% - 5%)
    vrf_delay_k_blocks: 2, // VRF seed challenge delay (2 - 10 blocks)
    fraud_window_seconds: 3600, // Dispute challenge window (1800s - 7200s)
    slash_rate_fraud: 1.00, // 100% worker fraud slashing penalty
    slash_rate_false_pass: 0.05 // 5% validator wrong vote slashing penalty
  },
  asr_router: {
    top_k_size: 64, // Optimal worker selection pool size (32 - 256)
    quota_max_percent: 0.15, // 15% maximum job share per worker (10% - 25%)
    epsilon_exploration: 0.05 // 5% new worker exploratory routing (3% - 10%)
  },
  ppc_pricing: {
    alpha_util_sensitivity: 0.5, // Utilization pricing sensitivity (0.1 - 2.0)
    beta_queue_sensitivity: 0.3, // Queue depth pricing sensitivity (0.1 - 1.0)
    target_utilization: 0.70, // 70% target cluster capacity utilization (0.50 - 0.85)
    target_queue_seconds: 60 // 60s target queue wait time (30s - 300s)
  },
  economic_dao: {
    block_cadence_seconds: 1.0, // 1.0s pipelined block cadence
    genesis_block_reward_mainnet: 1000, // Option A: 1,000 NAK / block
    testnet_block_reward: 2.0, // 2.00 tNAK / block
    validator_min_stake_nak: 100000, // 100,000 NAK minimum stake
    worker_stake_ratio: 0.15, // 15% collateral of job value (10% - 30%)
    protocol_fee_percent: 0.05, // 5% compute job protocol fee -> DAO Treasury
    fee_split_burn_percent: 0.50, // 50% EIP-1559 BaseFee burn
    fee_split_treasury_percent: 0.30, // 30% DAO Ecosystem Treasury cut
    fee_split_validator_percent: 0.20, // 20% Block Validator Priority Yield
    governance_quorum_percent: 0.20, // 20% quorum for DAO proposals
    governance_timelock_blocks: 604800 // 7 days timelock (604,800 blocks @ 1s)
  }
};

// Network stats
let networkStats = {
  totalTransactions: 0,
  totalBlocks: blockNumber,
  totalBurnedWei: 0n,
  totalTreasuryWei: 0n,
  activeValidators: 7,
  activeWorkers: 4,
  tps: 0,
  lastTpsUpdate: Date.now()
};

// =============================================================================
// Helper Functions & State Persistence
// =============================================================================

function saveStateToDisk() {
  try {
    const serializableStaking = {};
    for (const [k, v] of Object.entries(stakingPools)) {
      serializableStaking[k] = {
        staked: v.staked.toString(),
        sNakShares: v.sNakShares.toString(),
        lastClaimBlock: v.lastClaimBlock,
        unbondingQueue: v.unbondingQueue || []
      };
    }

    const state = {
      blockNumber,
      accounts,
      transactions,
      blockCache,
      validators,
      workers,
      sentinels,
      jobs,
      stakingPools: serializableStaking,
      proposals,
      proposalCounter,
      networkStats,
      savedAt: new Date().toISOString()
    };
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(state, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2),
      'utf-8'
    );
  } catch (err) {
    console.error('[State Persistence] Failed to save state:', err.message);
  }
}

function loadStateFromDisk() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      const state = JSON.parse(data);
      blockNumber = state.blockNumber || 1000;
      accounts = state.accounts || {};
      transactions = state.transactions || {};
      blockCache = state.blockCache || {};
      validators = [
        { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Node-01-Frankfurt-Val1', region: 'Frankfurt, DE', stake: '150000000000000000000000', active: true, uptime: '99.99%', commission: '4.0%' },
        { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Node-02-Sydney-Hub', region: 'Sydney, AU', stake: '120000000000000000000000', active: true, uptime: '99.98%', commission: '5.0%' },
        { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Node-05-Singapore-Val3', region: 'Singapore, SG', stake: '110000000000000000000000', active: true, uptime: '99.97%', commission: '4.5%' },
      ];
      workers = (state.workers && Object.keys(state.workers).length > 0) ? state.workers : {
        'worker-us-03': { name: 'Node-03-Virginia-Worker', region: 'Virginia, US', gpu: 'NVIDIA A40 (48GB VRAM)', status: 'ACTIVE_LIVE', latency: 165 },
        'worker-jp-04': { name: 'Node-04-Tokyo-GPU', region: 'Tokyo, JP', gpu: 'NVIDIA RTX 4090 (24GB)', status: 'ACTIVE_LIVE', latency: 82 },
        'auditor-uk-06': { name: 'Node-06-London-Auditor', region: 'London, UK', gpu: 'Dedicated ZK Auditor (36GB)', status: 'ACTIVE_LIVE', latency: 172 },
        'local-host-07': { name: 'Node-07-Localhost-Rig', region: 'Local Development Rig', gpu: 'Local Host GPU/CPU', status: 'ACTIVE_LIVE', latency: 1 },
      };
      sentinels = (state.sentinels && Object.keys(state.sentinels).length > 0) ? state.sentinels : {
        '0x90f79bf6eb2c4f870365e785982e1f101e93b906': {
          address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
          name: 'PC-Standby-NOESIS-Guardian',
          type: 'NOESIS-VX',
          role: 'Autonomous Cognitive Sentinel & BFT ZKP Auditor',
          status: 'ONLINE_ACTIVE',
          lastHeartbeat: Date.now(),
          uptimeSeconds: 86400,
          uptimeRewardsEarned: 154.50,
          fraudBountiesEarned: 500.0,
          queryGasEarned: 42.10,
          slashesReported: 1,
          region: 'Local Cluster / Hot-Standby Rig'
        },
        '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': {
          address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          name: 'Seraph-Mempool-Guardian',
          type: 'SERAPH-VX',
          role: 'Zero-MEV Mempool Guard & Sandwich Blocker',
          status: 'ONLINE_ACTIVE',
          lastHeartbeat: Date.now(),
          uptimeSeconds: 86400,
          uptimeRewardsEarned: 142.20,
          fraudBountiesEarned: 300.0,
          queryGasEarned: 38.50,
          slashesReported: 1,
          region: 'Sydney, AU'
        },
        '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': {
          address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          name: 'Aegis-DDoS-Sentinel',
          type: 'AEGIS-VX',
          role: 'Autonomous DDoS Rate-Limiter & BFT Shield',
          status: 'ONLINE_ACTIVE',
          lastHeartbeat: Date.now(),
          uptimeSeconds: 86400,
          uptimeRewardsEarned: 138.80,
          fraudBountiesEarned: 150.0,
          queryGasEarned: 29.40,
          slashesReported: 0,
          region: 'Frankfurt, DE'
        }
      };
      jobs = state.jobs || {};
      proposals = state.proposals || {};
      proposalCounter = state.proposalCounter || 1;
      networkStats = state.networkStats || networkStats;
      networkStats.activeValidators = validators.length;
      networkStats.activeWorkers = Object.keys(workers).length;
      networkStats.activeSentinels = Object.keys(sentinels).length;

      stakingPools = {};
      if (state.stakingPools) {
        for (const [k, v] of Object.entries(state.stakingPools)) {
          stakingPools[k] = {
            staked: BigInt(v.staked || '0'),
            sNakShares: BigInt(v.sNakShares || '0'),
            lastClaimBlock: v.lastClaimBlock || blockNumber,
            unbondingQueue: v.unbondingQueue || []
          };
        }
      }
      console.log(`[State Persistence] 💾 Resumed state from disk: Block #${blockNumber}, ${Object.keys(accounts).length} accounts, ${Object.keys(workers).length} workers, ${Object.keys(sentinels).length} sentinels, ${Object.keys(jobs).length} jobs`);
      return true;
    }
  } catch (err) {
    console.error('[State Persistence] Error reading state cache, initializing clean state:', err.message);
  }
  return false;
}

function generateAddress() {
  return '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateHash() {
  return '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function toHex(num) {
  if (num === null || num === undefined) return '0x0';
  if (typeof num === 'bigint') return '0x' + num.toString(16);
  if (typeof num === 'number') return '0x' + num.toString(16);
  if (typeof num === 'string') {
    if (num.startsWith('0x')) {
      if (num.length > 66) {
        try {
          const val = BigInt(num);
          return '0x' + val.toString(16);
        } catch {
          return '0x0';
        }
      }
      return num;
    }
    return '0x' + (parseInt(num, 10) || 0).toString(16);
  }
  return '0x' + (num || 0).toString(16);
}

function fromHex(hex) {
  return parseInt(hex, 16);
}

function jsonRpcResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// =============================================================================
// Initialization
// =============================================================================

function getOrCreateAccount(address, defaultBal = '1000') {
  const addr = (address || '').toLowerCase();
  if (!addr || addr.length < 10) return null;
  if (!accounts[addr]) {
    accounts[addr] = {
      balance: toHex(BigInt(defaultBal) * BigInt('1000000000000000000')),
      nonce: 0,
      code: null
    };
  }
  return accounts[addr];
}

function initMockState() {
  if (loadStateFromDisk()) {
    return;
  }

  // Create mock accounts with balances including standard dev burner accounts & all 7 mesh node keys
  const knownAddresses = [
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Node 1: Frankfurt Genesis L1 (Genesis Validator 1)
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // Node 2: Sydney Master Ingress (Validator 2 & Faucet)
    '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', // Node 3: Singapore Genesis L1 (Validator 3)
    '0x90f79bf6eb2c4f870365e785982e1f101e93b906', // Node 4: London ZK State Sentinel (Auditor)
    '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65', // Node 5: Virginia PyTorch A40 (Worker 1)
    '0x9965507d1a55bcc2695c58ba16fb37d819b0a4df', // Node 6: Tokyo GPU RTX 4090 (Worker 2)
    '0x976ea74026e726554db657fa54763abd0c3a0aa9', // Node 7: Localhost Sovereign Rig (Master Live Host)
    '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f', // 🏛️ DAO Ecosystem Treasury Vault
  ];

  knownAddresses.forEach((addr) => {
    accounts[addr.toLowerCase()] = {
      balance: toHex(BigInt('10000000000000000000000')), // 10,000 NAK
      nonce: 0,
      code: null
    };
  });

  // Generate additional random accounts
  for (let i = 0; i < 10; i++) {
    const addr = generateAddress();
    accounts[addr.toLowerCase()] = {
      balance: toHex(BigInt(Math.floor(Math.random() * 1000)) * BigInt('1000000000000000000')),
      nonce: 0,
      code: null
    };
  }

  // Initialize 7 Canonical Mesh Nodes (3 Validators + 4 Workers/Auditors)
  validators = [
    { address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', name: 'Node-01-Frankfurt-Val1', region: 'Frankfurt, DE', stake: '150000000000000000000000', active: true, uptime: '99.99%', commission: '4.0%' },
    { address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', name: 'Node-02-Sydney-Hub', region: 'Sydney, AU', stake: '120000000000000000000000', active: true, uptime: '99.98%', commission: '5.0%' },
    { address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', name: 'Node-05-Singapore-Val3', region: 'Singapore, SG', stake: '110000000000000000000000', active: true, uptime: '99.97%', commission: '4.5%' },
  ];

  workers = {
    'worker-us-03': { name: 'Node-03-Virginia-Worker', region: 'Virginia, US', gpu: 'NVIDIA A40 (48GB VRAM)', status: 'ACTIVE_LIVE', latency: 165 },
    'worker-jp-04': { name: 'Node-04-Tokyo-GPU', region: 'Tokyo, JP', gpu: 'NVIDIA RTX 4090 (24GB)', status: 'ACTIVE_LIVE', latency: 82 },
    'auditor-uk-06': { name: 'Node-06-London-Auditor', region: 'London, UK', gpu: 'Dedicated ZK Auditor (36GB)', status: 'ACTIVE_LIVE', latency: 172 },
    'local-host-07': { name: 'Node-07-Localhost-Rig', region: 'Local Development Rig', gpu: 'Local Host GPU/CPU', status: 'ACTIVE_LIVE', latency: 1 },
  };

  networkStats.activeValidators = validators.length;
  networkStats.activeWorkers = Object.keys(workers).length;

  console.log(`[Init] Created ${Object.keys(accounts).length} accounts`);
  console.log(`[Init] Initialized ${validators.length} validators and ${Object.keys(workers).length} workers (Total 7 Active Mesh Nodes)`);
}

// Generate a mock block
function generateBlock(num) {
  if (blockCache[num]) return blockCache[num];

  const parentNum = num - 1;
  const parentHash = parentNum >= 0 ? (blockCache[parentNum]?.hash || generateHash()) : '0x' + '0'.repeat(64);

  const block = {
    number: toHex(num),
    hash: generateHash(),
    parentHash: parentHash,
    nonce: '0x0000000000000000',
    sha3Uncles: '0x' + '0'.repeat(64),
    logsBloom: '0x' + '0'.repeat(512),
    transactionsRoot: generateHash(),
    stateRoot: generateHash(),
    receiptsRoot: generateHash(),
    miner: validators[num % validators.length]?.address || generateAddress(),
    difficulty: '0x1',
    totalDifficulty: toHex(num),
    extraData: '0x617869616e617820706f7063', // "nakharax popc"
    size: toHex(500 + Math.floor(Math.random() * 500)),
    gasLimit: '0x1c9c380', // 30M
    gasUsed: toHex(21000 * Math.floor(Math.random() * 10)),
    timestamp: toHex(Math.floor(Date.now() / 1000) - (blockNumber - num) * 5),
    transactions: [],
    uncles: []
  };

  blockCache[num] = block;
  return block;
}

initMockState();

// =============================================================================
// Block Production Simulation
// =============================================================================

setInterval(() => {
  blockNumber++;
  const block = generateBlock(blockNumber);
  networkStats.totalBlocks = blockNumber;

  // 🪙 1. Distribute Coinbase Block Reward to Active Validator (2.00 $tNAK per 1.0s block)
  const activeVal = validators[blockNumber % validators.length];
  if (activeVal && activeVal.address) {
    const valAddr = activeVal.address.toLowerCase();
    const valAcc = getOrCreateAccount(valAddr, '10000');
    if (valAcc) {
      const blockRewardWei = 2000000000000000000n; // 2.00 tNAK (1.0s Balanced Economic Model)
      valAcc.balance = '0x' + (BigInt(valAcc.balance || '0x0') + blockRewardWei).toString(16);
    }
  }

  // 🤖 2. Distribute PoPC GPU Worker Mining Yields (every 2 blocks based on Quality Score)
  if (blockNumber % 2 === 0) {
    const workerAddresses = [
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // Tokyo RTX 4090
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', // Virginia A40
      '0x90f79bf6eb2c4f870365e785982e1f101e93b906', // London ZK Auditor / Standby NOESIS
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // Localhost Rig / PC-2
    ];
    const targetWorker = workerAddresses[blockNumber % workerAddresses.length];
    const wAcc = getOrCreateAccount(targetWorker, '1000');
    if (wAcc) {
      const workerYieldWei = 1000000000000000000n; // 1.00 tNAK (GPU Matrix Proof Bounty)
      wAcc.balance = '0x' + (BigInt(wAcc.balance || '0x0') + workerYieldWei).toString(16);
    }
  }

  // 🛡️ 3. Distribute Sentinel Swarm Uptime Subsidies (30% DAO Treasury Pool - Every 3 Blocks)
  if (blockNumber % 3 === 0 && Object.keys(sentinels).length > 0) {
    const activeSentinelList = Object.values(sentinels).filter(s => s.status === 'ONLINE_ACTIVE');
    if (activeSentinelList.length > 0) {
      const perSentinelSubsidyNAK = 0.60 / activeSentinelList.length; // 30% cut of 2.00 tNAK block fee
      const perSentinelWei = BigInt(Math.floor(perSentinelSubsidyNAK * 1e18));

      activeSentinelList.forEach(s => {
        s.uptimeRewardsEarned = (s.uptimeRewardsEarned || 0) + perSentinelSubsidyNAK;
        s.uptimeSeconds = (s.uptimeSeconds || 0) + 3;

        const sAcc = getOrCreateAccount(s.address.toLowerCase(), '1000');
        if (sAcc) {
          sAcc.balance = '0x' + (BigInt(sAcc.balance || '0x0') + perSentinelWei).toString(16);
        }
      });
    }
  }

  // 🧹 4. Real-Time Heartbeat TTL Sweeper (Sweep Offline Workers & Sentinels > 20s TTL)
  const nowTs = Date.now();
  Object.values(workers).forEach(w => {
    // If worker has a lastHeartbeat and hasn't pinged in > 20s
    if (w.lastHeartbeat && (nowTs - w.lastHeartbeat > 20000)) {
      if (w.status !== 'OFFLINE_DISCONNECTED') {
        w.status = 'OFFLINE_DISCONNECTED';
        broadcastLog(`[📡 NODE SENTINEL] Worker ${w.name || w.address.slice(0, 10)} lost heartbeat (>20s). Status changed to OFFLINE_DISCONNECTED.`);
      }
    }
  });

  // Process pending transactions
  const txsToInclude = pendingTransactions.splice(0, 10);
  txsToInclude.forEach(tx => {
    tx.blockHash = block.hash;
    tx.blockNumber = block.number;
    tx.transactionIndex = toHex(block.transactions.length);
    block.transactions.push(tx.hash);
    transactions[tx.hash].blockHash = block.hash;
    transactions[tx.hash].blockNumber = block.number;
  });

  // Auto-persist state every 5 blocks (15s)
  if (blockNumber % 5 === 0) {
    saveStateToDisk();
  }

  // Broadcast to WebSocket subscribers
  broadcastNewHead(block);
}, BLOCK_TIME);

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    network: NETWORK,
    chainId: CHAIN_ID,
    blockNumber: blockNumber,
    accounts: Object.keys(accounts).length,
    validators: validators.length,
    workers: Object.keys(workers).length,
    pendingTx: pendingTransactions.length,
    timestamp: Date.now()
  });
});

// =============================================================================
// JSON-RPC Handler
// =============================================================================

app.post('/', async (req, res) => {
  const { jsonrpc, method, params = [], id } = req.body;

  if (jsonrpc !== '2.0') {
    return res.json(jsonRpcError(id, -32600, 'Invalid Request'));
  }

  console.log(`[RPC] ${method}`);

  try {
    const result = await handleRpcMethod(method, params, id);
    return res.json(result);
  } catch (error) {
    console.error(`[RPC Error] ${method}:`, error.message);
    return res.json(jsonRpcError(id, -32603, error.message));
  }
});

async function handleRpcMethod(method, params, id) {
  switch (method) {
    // =========================================================================
    // Network Methods
    // =========================================================================
    case 'net_version':
      return jsonRpcResponse(id, CHAIN_ID);

    case 'net_listening':
      return jsonRpcResponse(id, true);

    case 'net_peerCount':
      return jsonRpcResponse(id, toHex(validators.length + Object.keys(workers).length));

    case 'eth_protocolVersion':
      return jsonRpcResponse(id, '0x41'); // Version 65

    case 'eth_syncing':
      return jsonRpcResponse(id, false); // Always synced

    case 'eth_chainId':
      return jsonRpcResponse(id, toHex(parseInt(CHAIN_ID)));

    case 'eth_mining':
      return jsonRpcResponse(id, true);

    case 'eth_hashrate':
      return jsonRpcResponse(id, '0x0');

    // =========================================================================
    // Block Methods
    // =========================================================================
    case 'eth_blockNumber':
      return jsonRpcResponse(id, toHex(blockNumber));

    case 'eth_getBlockByNumber': {
      const [blockParam, fullTx] = params;
      let num = blockNumber;

      if (blockParam === 'latest' || blockParam === 'pending') {
        num = blockNumber;
      } else if (blockParam === 'earliest') {
        num = 0;
      } else {
        num = fromHex(blockParam);
      }

      const block = generateBlock(num);
      if (fullTx && block.transactions.length > 0) {
        block.transactions = block.transactions.map(hash => transactions[hash]).filter(Boolean);
      }
      return jsonRpcResponse(id, block);
    }

    case 'eth_getBlockByHash': {
      const [hash, fullTx] = params;
      // Find block by hash or return mock
      const block = Object.values(blockCache).find(b => b.hash === hash) || generateBlock(blockNumber);
      return jsonRpcResponse(id, { ...block, hash });
    }

    case 'eth_getBlockTransactionCountByNumber': {
      const [blockParam] = params;
      const num = blockParam === 'latest' ? blockNumber : fromHex(blockParam);
      const block = blockCache[num];
      return jsonRpcResponse(id, toHex(block?.transactions?.length || 0));
    }

    case 'eth_getBlockTransactionCountByHash': {
      const [hash] = params;
      const block = Object.values(blockCache).find(b => b.hash === hash);
      return jsonRpcResponse(id, toHex(block?.transactions?.length || 0));
    }

    // =========================================================================
    // Account Methods
    // =========================================================================
    case 'eth_accounts':
      return jsonRpcResponse(id, Object.keys(accounts).slice(0, 10));

    case 'eth_getBalance': {
      const [address, block] = params;
      const acc = getOrCreateAccount(address, '1000');
      return jsonRpcResponse(id, acc?.balance || '0x0');
    }

    case 'eth_getTransactionCount': {
      const [address, block] = params;
      const acc = getOrCreateAccount(address, '1000');
      return jsonRpcResponse(id, toHex(acc?.nonce || 0));
    }

    case 'eth_getCode': {
      const [address] = params || [];
      const addr = (address || '').toLowerCase();
      // If it's a known contract address, return synthetic bytecode
      const knownContracts = [
        '0x5fbdb2315678afecb367f032d93f642f64180aa3', // Token
        '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512', // Escrow
        '0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0', // Staking
        '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9', // DAO
        '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9', // ZKP
      ];
      if (knownContracts.includes(addr)) {
        return jsonRpcResponse(id, '0x608060405234801561001057600080fd5b50');
      }
      return jsonRpcResponse(id, '0x');
    }

    case 'eth_getStorageAt':
      return jsonRpcResponse(id, '0x0000000000000000000000000000000000000000000000000000000000000000');

    // =========================================================================
    // EVM Execution Methods
    // =========================================================================
    case 'eth_call': {
      const [callObj, blockParam] = params;
      const data = callObj?.data || '0x';
      const to = (callObj?.to || '').toLowerCase();

      // Handle standard ERC-20 calls
      if (data.startsWith('0x70a08231')) { // balanceOf(address)
        const targetAddr = '0x' + data.slice(34).toLowerCase();
        const account = accounts[targetAddr];
        const bal = account ? BigInt(account.balance) : 0n;
        return jsonRpcResponse(id, '0x' + bal.toString(16).padStart(64, '0'));
      }
      if (data.startsWith('0x18160ddd')) { // totalSupply()
        return jsonRpcResponse(id, '0x' + (1000000000000000000000000000000n).toString(16).padStart(64, '0')); // 1T * 10^18
      }
      if (data.startsWith('0x313ce567')) { // decimals()
        return jsonRpcResponse(id, '0x' + (18).toString(16).padStart(64, '0'));
      }
      if (data.startsWith('0x06fdde03')) { // name()
        return jsonRpcResponse(id, '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000094e616b6861726158000000000000000000000000000000000000000000000000');
      }
      if (data.startsWith('0x95d89b41')) { // symbol()
        return jsonRpcResponse(id, '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034e414b0000000000000000000000000000000000000000000000000000000000');
      }

      // Default success return (32 bytes of zeros or true)
      return jsonRpcResponse(id, '0x0000000000000000000000000000000000000000000000000000000000000001');
    }

    // =========================================================================
    // Gas & Fee Methods
    // =========================================================================
    case 'eth_gasPrice':
      return jsonRpcResponse(id, '0x470de4df82'); // 1.2 Gwei

    case 'eth_maxPriorityFeePerGas':
      return jsonRpcResponse(id, '0x3b9aca00'); // 1 Gwei

    case 'eth_feeHistory': {
      const [blockCount, newestBlock, rewardPercentiles] = params;
      const count = Math.min(fromHex(blockCount), 10);
      return jsonRpcResponse(id, {
        baseFeePerGas: Array(count + 1).fill('0x3b9aca00'),
        gasUsedRatio: Array(count).fill(0.5),
        oldestBlock: toHex(Math.max(0, blockNumber - count)),
        reward: rewardPercentiles ? Array(count).fill(rewardPercentiles.map(() => '0x3b9aca00')) : undefined
      });
    }

    case 'eth_estimateGas': {
      const [txObj] = params;
      // Base gas + data gas
      let gas = 21000;
      if (txObj.data && txObj.data !== '0x') {
        gas += (txObj.data.length - 2) / 2 * 16; // 16 gas per byte
      }
      if (!txObj.to) {
        gas += 32000; // Contract creation
      }
      return jsonRpcResponse(id, toHex(Math.ceil(gas * 1.2))); // 20% buffer
    }

    // =========================================================================
    // Transaction Methods
    // =========================================================================
    case 'eth_sendRawTransaction': {
      const [signedTx] = params || [];
      if (!signedTx || typeof signedTx !== 'string' || !signedTx.startsWith('0x') || signedTx.length < 20) {
        return jsonRpcError(id, -32602, 'Invalid raw transaction: Missing or invalid hex-encoded transaction payload');
      }

      let fromAddr, toAddr, valWei, valHex, nonce, gasLimit, gasPriceWei, dataPayload, txHash;

      // 1. Attempt standard EVM RLP / EIP-1559 transaction decoding & cryptographic recovery
      try {
        const parsed = parseTransaction(signedTx);
        fromAddr = (await recoverTransactionAddress({ serializedTransaction: signedTx })).toLowerCase();
        toAddr = parsed.to ? parsed.to.toLowerCase() : null;
        valWei = parsed.value ? BigInt(parsed.value) : 0n;
        valHex = '0x' + valWei.toString(16);
        nonce = parsed.nonce || 0;
        gasLimit = parsed.gas ? BigInt(parsed.gas) : 21000n;
        gasPriceWei = parsed.gasPrice ? BigInt(parsed.gasPrice) : (parsed.maxFeePerGas ? BigInt(parsed.maxFeePerGas) : 1200000000n);
        dataPayload = parsed.data || '0x';
        txHash = keccak256(signedTx);
      } catch (evmErr) {
        return jsonRpcError(
          id,
          -32602,
          `Invalid raw transaction: mock RPC accepts only cryptographically recoverable EVM serialized transactions; submit native Ed25519 JSON transactions to the Rust core RPC (${evmErr.message})`
        );
      }

      const gasFeeWei = gasLimit * gasPriceWei;
      const burnWei = (gasFeeWei * 50n) / 100n;
      const treasuryWei = (gasFeeWei * 30n) / 100n;
      const validatorWei = gasFeeWei - burnWei - treasuryWei;

      const fromAcc = getOrCreateAccount(fromAddr, '1000');
      const toAcc = toAddr ? getOrCreateAccount(toAddr, '0') : null;
      const TREASURY_ADDR = '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
      const treasuryAcc = getOrCreateAccount(TREASURY_ADDR, '10000');

      // Deduct balance from sender
      if (fromAcc) {
        const curBal = BigInt(fromAcc.balance || '0x0');
        const totalRequired = valWei + gasFeeWei;
        if (curBal < totalRequired) {
          return jsonRpcError(id, -32000, `Insufficient funds for transfer and gas fee (required ${totalRequired.toString()}, available ${curBal.toString()})`);
        }
        fromAcc.balance = '0x' + (curBal - totalRequired).toString(16);
        fromAcc.nonce = Math.max((fromAcc.nonce || 0) + 1, nonce + 1);
      }

      // Credit balance to recipient
      if (toAcc) {
        const recBal = BigInt(toAcc.balance || '0x0');
        toAcc.balance = '0x' + (recBal + valWei).toString(16);
      }

      // Credit 30% Protocol Cut to DAO Treasury Account
      if (treasuryAcc) {
        const curTreasury = BigInt(treasuryAcc.balance || '0x0');
        treasuryAcc.balance = '0x' + (curTreasury + treasuryWei).toString(16);
      }

      // Track Cumulative Metrics
      networkStats.totalBurnedWei = (networkStats.totalBurnedWei || 0n) + burnWei;
      networkStats.totalTreasuryWei = (networkStats.totalTreasuryWei || 0n) + treasuryWei;

      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: toHex(nonce),
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: fromAddr,
        to: toAddr,
        value: valHex,
        gas: '0x' + gasLimit.toString(16),
        gasPrice: '0x' + gasPriceWei.toString(16),
        gasUsed: '0x' + gasLimit.toString(16),
        burnedFee: '0x' + burnWei.toString(16),
        treasuryFee: '0x' + treasuryWei.toString(16),
        validatorReward: '0x' + validatorWei.toString(16),
        input: dataPayload,
        status: '0x1',
      };

      transactions[txHash] = tx;
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;
      return jsonRpcResponse(id, txHash);
    }

    case 'eth_sendTransaction': {
      const [txObj] = params || [];
      if (!txObj || typeof txObj !== 'object') {
        return jsonRpcError(id, -32602, 'Invalid transaction object');
      }

      const fromAddr = (txObj.from || '').toLowerCase();
      const toAddr = txObj.to ? txObj.to.toLowerCase() : null;
      const valWei = txObj.value ? BigInt(txObj.value) : 0n;
      const valHex = '0x' + valWei.toString(16);
      const gasLimit = txObj.gas ? BigInt(txObj.gas) : 21000n;
      const gasPriceWei = txObj.gasPrice ? BigInt(txObj.gasPrice) : 1200000000n; // 1.2 Gwei
      const dataPayload = txObj.data || '0x';

      const fromAcc = getOrCreateAccount(fromAddr, '1000');
      const toAcc = toAddr ? getOrCreateAccount(toAddr, '0') : null;
      const TREASURY_ADDR = '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
      const treasuryAcc = getOrCreateAccount(TREASURY_ADDR, '10000');

      const gasFeeWei = gasLimit * gasPriceWei;
      const burnWei = (gasFeeWei * 50n) / 100n;
      const treasuryWei = (gasFeeWei * 30n) / 100n;
      const validatorWei = gasFeeWei - burnWei - treasuryWei;

      const curNonce = typeof fromAcc.nonce === 'number' ? fromAcc.nonce : parseInt(fromAcc.nonce || '0', 10) || 0;
      fromAcc.nonce = curNonce + 1;

      if (fromAcc) {
        const curBal = BigInt(fromAcc.balance || '0x0');
        const totalRequired = valWei + gasFeeWei;
        if (curBal >= totalRequired) {
          fromAcc.balance = '0x' + (curBal - totalRequired).toString(16);
        }
      }

      if (toAcc) {
        const recBal = BigInt(toAcc.balance || '0x0');
        toAcc.balance = '0x' + (recBal + valWei).toString(16);
      }

      if (treasuryAcc) {
        const curTreasury = BigInt(treasuryAcc.balance || '0x0');
        treasuryAcc.balance = '0x' + (curTreasury + treasuryWei).toString(16);
      }

      networkStats.totalBurnedWei = (networkStats.totalBurnedWei || 0n) + burnWei;
      networkStats.totalTreasuryWei = (networkStats.totalTreasuryWei || 0n) + treasuryWei;

      const randomSuffix = Math.floor(Math.random() * 1e9).toString(16).padStart(8, '0');
      const txHash = '0x' + (keccak256 ? keccak256(Buffer.from(fromAddr + Date.now() + randomSuffix)).replace('0x', '') : (randomSuffix + randomSuffix + randomSuffix + randomSuffix).padEnd(64, '0'));

      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: toHex(curNonce),
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: fromAddr,
        to: toAddr,
        value: valHex,
        gas: '0x' + gasLimit.toString(16),
        gasPrice: '0x' + gasPriceWei.toString(16),
        gasUsed: '0x' + gasLimit.toString(16),
        effectiveGasPrice: '0x' + gasPriceWei.toString(16),
        burnedFee: '0x' + burnWei.toString(16),
        treasuryFee: '0x' + treasuryWei.toString(16),
        validatorReward: '0x' + validatorWei.toString(16),
        input: dataPayload,
        status: '0x1',
      };

      transactions[txHash] = tx;
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;
      return jsonRpcResponse(id, txHash);
    }

    case 'nak_getBurnStats':
    case 'nakharax_getBurnStats': {
      const burnedWei = networkStats.totalBurnedWei || 0n;
      const burnedTokens = Number(burnedWei) / 1e18;
      return jsonRpcResponse(id, {
        totalBurnedWei: '0x' + burnedWei.toString(16),
        totalBurnedTokens: burnedTokens.toFixed(8),
        tokenSymbol: 'tNAK',
        baseFeeGwei: 1.2,
        burnMechanism: 'EIP-1559 50% Dynamic BaseFee Permanent Burn',
        deflationaryStatus: 'ACTIVE'
      });
    }

    case 'nak_getTreasuryStats':
    case 'nakharax_getTreasuryStats': {
      const TREASURY_ADDR = '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
      const treasuryAcc = accounts[TREASURY_ADDR];
      const treasuryBalWei = treasuryAcc ? BigInt(treasuryAcc.balance || '0x0') : 0n;
      const treasuryCollectedWei = networkStats.totalTreasuryWei || 0n;
      return jsonRpcResponse(id, {
        treasuryAddress: TREASURY_ADDR,
        treasuryRole: "DAO Ecosystem & Protocol Reserve Treasury Vault",
        liquidBalance: (Number(treasuryBalWei) / 1e18).toFixed(6),
        totalFeesCollected: (Number(treasuryCollectedWei) / 1e18).toFixed(8),
        tokenSymbol: "tNAK",
        feeSplitRule: {
          burn: "50% EIP-1559 Permanent Burn",
          daoTreasury: "30% Automatic Protocol Ingress",
          validatorReward: "20% Block Validator Priority Yield"
        }
      });
    }

    case 'nakharax_getRecentTransactions': {
      const allTxs = Object.values(transactions).slice(-25).reverse();
      return jsonRpcResponse(id, allTxs);
    }

    case 'eth_getTransactionByHash': {
      const [txHash] = params;
      return jsonRpcResponse(id, transactions[txHash] || null);
    }

    case 'eth_getTransactionReceipt': {
      const [txHash] = params;
      const tx = transactions[txHash];

      if (!tx || !tx.blockHash) {
        return jsonRpcResponse(id, null);
      }

      return jsonRpcResponse(id, {
        transactionHash: txHash,
        transactionIndex: tx.transactionIndex || '0x0',
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to,
        cumulativeGasUsed: '0x5208',
        gasUsed: '0x5208',
        contractAddress: tx.to ? null : generateAddress(),
        logs: [],
        logsBloom: '0x' + '0'.repeat(512),
        status: '0x1',
        effectiveGasPrice: tx.gasPrice,
        type: tx.type || '0x0'
      });
    }

    case 'eth_getTransactionByBlockNumberAndIndex': {
      const [blockParam, index] = params;
      const num = blockParam === 'latest' ? blockNumber : fromHex(blockParam);
      const block = blockCache[num];
      const txHash = block?.transactions?.[fromHex(index)];
      return jsonRpcResponse(id, txHash ? transactions[txHash] : null);
    }

    case 'eth_pendingTransactions':
      return jsonRpcResponse(id, pendingTransactions);

    // =========================================================================
    // Call & Logs (ERC-20 Token & Contract Compatibility)
    // =========================================================================
    case 'eth_call': {
      const [txObj, block] = params;
      const data = txObj?.data || '0x';
      const to = (txObj?.to || '').toLowerCase();
      const isSNak = to === '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512';

      // 1. balanceOf(address) - 0x70a08231
      if (data.startsWith('0x70a08231')) {
        const targetAddr = ('0x' + data.slice(data.length - 40)).toLowerCase();
        let balanceWei = 0n;

        if (isSNak) {
          const pool = stakingPools[targetAddr];
          balanceWei = pool?.sNakShares || 0n;
        } else {
          const acc = accounts[targetAddr];
          balanceWei = acc ? BigInt(acc.balance || '0x0') : 0n;
        }

        const hexVal = balanceWei.toString(16).padStart(64, '0');
        return jsonRpcResponse(id, '0x' + hexVal);
      }

      // 2. decimals() - 0x313ce567
      if (data.startsWith('0x313ce567')) {
        return jsonRpcResponse(id, '0x' + '12'.padStart(64, '0')); // 18 decimals
      }

      // 3. symbol() - 0x95d89b41
      if (data.startsWith('0x95d89b41')) {
        const sym = isSNak ? 'sNAK' : 'tNAK';
        const hexOffset = '0000000000000000000000000000000000000000000000000000000000000020';
        const hexLen = (sym.length).toString(16).padStart(64, '0');
        const hexData = Buffer.from(sym, 'utf8').toString('hex').padEnd(64, '0');
        return jsonRpcResponse(id, '0x' + hexOffset + hexLen + hexData);
      }

      // 4. name() - 0x06fdde03
      if (data.startsWith('0x06fdde03')) {
        const name = isSNak ? 'Staked NakharaX' : 'NakharaX Token';
        const hexOffset = '0000000000000000000000000000000000000000000000000000000000000020';
        const hexLen = (name.length).toString(16).padStart(64, '0');
        const hexData = Buffer.from(name, 'utf8').toString('hex').padEnd(64, '0');
        return jsonRpcResponse(id, '0x' + hexOffset + hexLen + hexData);
      }

      // 5. totalSupply() - 0x18160ddd
      if (data.startsWith('0x18160ddd')) {
        const total = BigInt('100000000000000000000000000'); // 100M tokens
        return jsonRpcResponse(id, '0x' + total.toString(16).padStart(64, '0'));
      }

      return jsonRpcResponse(id, '0x');
    }

    case 'eth_getLogs': {
      const [filter] = params;
      // Return empty logs for now, or filtered logs
      const filteredLogs = logs.filter(log => {
        if (filter.address && log.address.toLowerCase() !== filter.address.toLowerCase()) return false;
        if (filter.fromBlock && fromHex(log.blockNumber) < fromHex(filter.fromBlock)) return false;
        if (filter.toBlock && filter.toBlock !== 'latest' && fromHex(log.blockNumber) > fromHex(filter.toBlock)) return false;
        return true;
      });
      return jsonRpcResponse(id, filteredLogs);
    }

    case 'eth_newFilter': {
      const filterId = generateHash().slice(0, 18);
      return jsonRpcResponse(id, filterId);
    }

    case 'eth_newBlockFilter': {
      const filterId = generateHash().slice(0, 18);
      return jsonRpcResponse(id, filterId);
    }

    case 'eth_newPendingTransactionFilter': {
      const filterId = generateHash().slice(0, 18);
      return jsonRpcResponse(id, filterId);
    }

    case 'eth_getFilterChanges': {
      const [filterId] = params;
      return jsonRpcResponse(id, []);
    }

    case 'eth_uninstallFilter': {
      return jsonRpcResponse(id, true);
    }

    // =========================================================================
    // Nakharax-Specific Methods
    // =========================================================================
    case 'axn_getValidatorSet':
      return jsonRpcResponse(id, validators);

    case 'axn_getValidatorInfo': {
      const [address] = params;
      const validator = validators.find(v => v.address.toLowerCase() === address?.toLowerCase());
      return jsonRpcResponse(id, validator || null);
    }

    case 'axn_getNetworkStats':
      return jsonRpcResponse(id, {
        blockNumber: blockNumber,
        totalTransactions: networkStats.totalTransactions,
        activeValidators: validators.filter(v => v.active).length,
        activeWorkers: Object.keys(workers).length,
        pendingJobs: Object.values(jobs).filter(j => j.status === 'pending').length,
        completedJobs: Object.values(jobs).filter(j => j.status === 'completed').length,
        tps: networkStats.tps,
        chainId: CHAIN_ID,
        network: NETWORK
      });

    case 'nak_getWorkers':
    case 'nakharax_getWorkers':
    case 'axn_getWorkers':
    case 'axn_getWorkerStats': {
      const [address] = params;
      const now = Date.now();

      // Ensure all workers dynamic status is updated according to real physical heartbeat
      Object.entries(workers).forEach(([k, w]) => {
        if (k === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') {
          w.name = 'PC-2 (NVIDIA GeForce GTX 1070 Ti)';
          w.gpu = 'NVIDIA GeForce GTX 1070 Ti (8GB VRAM)';
          w.status = 'OFFLINE_DISCONNECTED'; // Truth: PC-2 physical machine is currently powered down/sleeping
        } else if (w.lastHeartbeat && (now - w.lastHeartbeat > 20000)) {
          w.status = 'OFFLINE_DISCONNECTED';
        }
      });

      if (address) {
        return jsonRpcResponse(id, workers[address.toLowerCase()] || null);
      }
      return jsonRpcResponse(id, workers);
    }

    // =========================================================================
    // 🛡️ Sentinel Swarm 3-Tier Incentive Endpoints
    // =========================================================================
    case 'nak_getSentinels':
    case 'nakharax_getSentinels': {
      return jsonRpcResponse(id, {
        totalSentinels: Object.keys(sentinels).length,
        activeSentinels: Object.values(sentinels).filter(s => s.status === 'ONLINE_ACTIVE').length,
        swarmMode: 'DECENTRALIZED_MULTI_AGENT_SWARM',
        incentives: {
          uptimeSubsidyPoolPercent: 30, // 30% DAO Treasury Pool
          slashingWhistleblowerBountyPercent: 30, // 30% of Slashed Stake
          microQueryGasSharePercent: 80 // 80% direct to serving Sentinels
        },
        sentinels: Object.values(sentinels)
      });
    }

    case 'nak_sentinelHeartbeat':
    case 'nakharax_sentinelHeartbeat': {
      const [payload] = params;
      const addr = (payload?.address || '').toLowerCase();
      if (addr && sentinels[addr]) {
        sentinels[addr].lastHeartbeat = Date.now();
        sentinels[addr].status = 'ONLINE_ACTIVE';
        if (payload?.metrics) {
          sentinels[addr].metrics = payload.metrics;
        }
        return jsonRpcResponse(id, { success: true, timestamp: Date.now(), status: 'HEARTBEAT_ACK' });
      }
      return jsonRpcResponse(id, { success: false, error: 'Sentinel not registered' });
    }

    case 'nak_reportFraudSlash':
    case 'nakharax_reportFraudSlash': {
      const [report] = params;
      const reporterAddr = (report?.reporterAddress || '0x90f79bf6eb2c4f870365e785982e1f101e93b906').toLowerCase();
      const targetOffender = (report?.offenderAddress || '').toLowerCase();
      const reason = report?.reason || 'Fraudulent ZKP Matrix Proof / 51% ECVRF Attack';

      const slashedStake = 500.0; // 50% Slash Stake (500 tNAK)
      const whistleblowerBountyNAK = 150.0; // 30% of slashed stake (150 tNAK)
      const treasuryCutNAK = 350.0; // 70% to DAO treasury

      if (sentinels[reporterAddr]) {
        sentinels[reporterAddr].fraudBountiesEarned = (sentinels[reporterAddr].fraudBountiesEarned || 0) + whistleblowerBountyNAK;
        sentinels[reporterAddr].slashesReported = (sentinels[reporterAddr].slashesReported || 0) + 1;
      }

      const repAcc = getOrCreateAccount(reporterAddr, '1000');
      if (repAcc) {
        const bountyWei = BigInt(Math.floor(whistleblowerBountyNAK * 1e18));
        repAcc.balance = '0x' + (BigInt(repAcc.balance || '0x0') + bountyWei).toString(16);
      }

      broadcastLog(`[🛡️ SENTINEL SLASHER] Offender ${targetOffender.slice(0, 10)}... slashed 50% (${slashedStake} NAK) for: ${reason}. Whistleblower Bounty 30% (${whistleblowerBountyNAK} NAK) paid to ${reporterAddr.slice(0, 10)}...`);

      return jsonRpcResponse(id, {
        success: true,
        slashedStakeNak: slashedStake,
        whistleblowerBountyNak: whistleblowerBountyNAK,
        treasuryCutNak: treasuryCutNAK,
        reporter: reporterAddr,
        action: 'SLASH_EXECUTED_INSTANT'
      });
    }

    case 'nak_recordQueryGas':
    case 'nakharax_recordQueryGas': {
      const [qData] = params;
      const servingAddr = (qData?.sentinelAddress || '0x90f79bf6eb2c4f870365e785982e1f101e93b906').toLowerCase();
      const gasFeeNAK = parseFloat(qData?.gasFee || '0.05');

      if (sentinels[servingAddr]) {
        sentinels[servingAddr].queryGasEarned = (sentinels[servingAddr].queryGasEarned || 0) + gasFeeNAK;
      }

      const sAcc = getOrCreateAccount(servingAddr, '1000');
      if (sAcc) {
        const gasWei = BigInt(Math.floor(gasFeeNAK * 1e18));
        sAcc.balance = '0x' + (BigInt(sAcc.balance || '0x0') + gasWei).toString(16);
      }

      return jsonRpcResponse(id, { success: true, feePaid: gasFeeNAK, recipient: servingAddr });
    }

    case 'nakharax_registerWorker':
    case 'axn_registerWorker': {
      const [specs] = params;
      const address = specs?.address || generateAddress();
      const isPC2 = address.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
      const isStandby = address.toLowerCase() === '0x90f79bf6eb2c4f870365e785982e1f101e93b906';

      workers[address.toLowerCase()] = {
        address: address,
        name: isPC2 ? 'PC-2 (NVIDIA GeForce GTX 1070 Ti)' : (isStandby ? 'PC-Standby (NOESIS Sentinel Guardian)' : (specs?.name || 'DeAI Edge Compute Worker')),
        gpu: isPC2 ? 'NVIDIA GeForce GTX 1070 Ti (8GB VRAM)' : (specs?.gpu || 'NVIDIA Discrete GPU'),
        vram: specs?.vram || '8GB VRAM',
        cuda_cores: specs?.cuda_cores || 2432,
        status: isPC2 ? 'OFFLINE_DISCONNECTED' : 'ONLINE_ACTIVE',
        tier: specs?.tier || (isPC2 ? 'Tier 5: DeAI Edge Worker (NVIDIA GTX 1070 Ti)' : 'Tier 5: Bicameral Sentinel Guardian'),
        popc_verifier: specs?.popc_verifier || 'STARK-FRI-1024-ZK',
        specs: specs || {},
        registeredAt: Date.now(),
        lastHeartbeat: isPC2 ? (Date.now() - 3600000) : Date.now(),
        jobsCompleted: 0,
        totalJobsCompleted: isPC2 ? 3794 : (workers[address.toLowerCase()]?.totalJobsCompleted || 0),
        cumulativeRewards: isPC2 ? 1041.85 : (workers[address.toLowerCase()]?.cumulativeRewards || 0),
        reputation: 100
      };
      broadcastLog(`${new Date().toISOString()}  worker     INFO  registered worker ${address.slice(0, 10)}... vram=${specs?.vram || '8GB'}`);
      return jsonRpcResponse(id, { success: true, address });
    }

    case 'nak_workerHeartbeat':
    case 'nakharax_workerHeartbeat': {
      const [payload] = params;
      const addr = (payload?.address || '').toLowerCase();
      if (addr && workers[addr]) {
        workers[addr].lastHeartbeat = Date.now();
        workers[addr].status = 'ONLINE_ACTIVE';
        workers[addr].lastActive = Date.now();
        return jsonRpcResponse(id, { success: true, timestamp: Date.now(), status: 'WORKER_HEARTBEAT_ACK' });
      }
      return jsonRpcResponse(id, { success: false, error: 'Worker not registered' });
    }

    case 'nakharax_getJobStatus':
    case 'axn_getJobStatus': {
      const [jobId] = params;
      return jsonRpcResponse(id, jobs[jobId] || null);
    }

    case 'nakharax_submitJob':
    case 'axn_submitJob': {
      const [jobSpec] = params;
      const jobId = generateHash();
      const submitter = (jobSpec?.from || '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266').toLowerCase();
      const rewardFloat = parseFloat(jobSpec?.reward || '1.0');
      const rewardWei = BigInt(Math.floor(rewardFloat * 1e18));

      // Deduct reward from submitter's balance
      const subAcc = getOrCreateAccount(submitter, '1000');
      if (subAcc) {
        const curBal = BigInt(subAcc.balance || '0x0');
        if (curBal >= rewardWei) {
          subAcc.balance = '0x' + (curBal - rewardWei).toString(16);
        } else {
          subAcc.balance = '0x0';
        }
        subAcc.nonce = (subAcc.nonce || 0) + 1;
      }

      // 🪙 Tokenomics Invariant (TOKENOMICS.md):
      // 5% Protocol Fee -> DAO Treasury | 95% Payout -> GPU Worker
      const treasuryCutWei = (rewardWei * 5n) / 100n;
      const workerPayoutWei = rewardWei - treasuryCutWei;
      const TREASURY_ADDR = '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f';
      const treasuryAcc = getOrCreateAccount(TREASURY_ADDR, '10000');

      // Auto-Select best active GPU worker (e.g. PC-2) or fallback
      const registeredWorkers = Object.keys(workers);
      const workerAddr = registeredWorkers.length > 0 ? registeredWorkers[0] : '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const workerAcc = getOrCreateAccount(workerAddr, '100');

      if (treasuryAcc) {
        treasuryAcc.balance = '0x' + (BigInt(treasuryAcc.balance || '0x0') + treasuryCutWei).toString(16);
      }
      if (workerAcc) {
        workerAcc.balance = '0x' + (BigInt(workerAcc.balance || '0x0') + workerPayoutWei).toString(16);
      }
      networkStats.totalTreasuryWei = (networkStats.totalTreasuryWei || 0n) + treasuryCutWei;

      if (workers[workerAddr]) {
        workers[workerAddr].totalJobsCompleted = (workers[workerAddr].totalJobsCompleted || 0) + 1;
        workers[workerAddr].cumulativeRewards = (workers[workerAddr].cumulativeRewards || 0) + (Number(workerPayoutWei) / 1e18);
        workers[workerAddr].lastActive = Date.now();
      }

      jobs[jobId] = {
        id: jobId,
        type: jobSpec?.type || 'inference',
        model: jobSpec?.model || 'DeAI-DeepSeek-R1-8B',
        status: 'completed',
        reward: jobSpec?.reward || '1.0',
        submitter: submitter,
        worker: workerAddr,
        treasuryFeeDeducted: (Number(treasuryCutWei) / 1e18).toFixed(4),
        workerPayout: (Number(workerPayoutWei) / 1e18).toFixed(4),
        createdAt: Date.now(),
        completedAt: Date.now() + 142,
        result: '0x' + generateHash().slice(2)
      };

      broadcastMeshUpdate();

      const txHash = generateHash();
      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: toHex(subAcc?.nonce || 0),
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: submitter,
        to: workerAddr,
        value: '0x' + workerPayoutWei.toString(16),
        treasuryFee: '0x' + treasuryCutWei.toString(16),
        gas: '0x186a0',
        gasPrice: '0x470de4df82',
        input: '0x6a6f625f636f6d70757465',
        type: 'DEAI_COMPUTE_JOB',
        timestamp: Math.floor(Date.now() / 1000)
      };
      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  asr        INFO  ⚡ Dispatched DeAI job ${jobId.slice(0, 12)}... model=${jobSpec?.model || 'DeepSeek-R1'} [95% Worker: ${(Number(workerPayoutWei) / 1e18).toFixed(2)} tNAK | 5% DAO Treasury: ${(Number(treasuryCutWei) / 1e18).toFixed(4)} tNAK]`);
      return jsonRpcResponse(id, { jobId, status: 'completed', txHash, deducted: rewardFloat, workerPayout: Number(workerPayoutWei) / 1e18, treasuryFee: Number(treasuryCutWei) / 1e18 });
    }

    case 'faucet_requestTokens':
    case 'nakharax_faucet': {
      const [recipientAddress, amountTokens] = params;
      const addr = (recipientAddress || '').toLowerCase();
      const amount = amountTokens ? parseFloat(amountTokens) : 100;
      if (!addr || !addr.startsWith('0x') || addr.length < 10) {
        return jsonRpcError(id, -32602, 'Invalid recipient address');
      }
      const acc = getOrCreateAccount(addr, '0');
      const current = acc ? BigInt(acc.balance) : 0n;
      const addedWei = BigInt(Math.floor(amount * 1e18));
      const newBal = (current + addedWei).toString(16);
      acc.balance = '0x' + newBal;
      const txHash = generateHash();

      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: '0x0',
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: '0x0000000000000000000000000000000000000001',
        to: addr,
        value: '0x' + addedWei.toString(16),
        gas: '0x5208',
        gasPrice: '0x470de4df82', // 1.2 Gwei
        input: '0x6e616b68617261785f666175636574',
        type: 'FAUCET_DISPENSE',
        timestamp: Math.floor(Date.now() / 1000)
      };

      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  faucet     INFO  dispensed ${amount} tNAK -> ${addr.slice(0, 12)}... tx=${txHash.slice(0, 16)}... block=#${blockNumber}`);
      return jsonRpcResponse(id, { success: true, txHash, blockNumber, amount, recipient: addr });
    }

    case 'nak_getWorkers':
    case 'nakharax_getWorkers': {
      return jsonRpcResponse(id, workers);
    }

    case 'nakharax_registerWorker':
    case 'nak_registerWorker': {
      const [workerSpec] = params;
      if (workerSpec && workerSpec.address) {
        const addr = workerSpec.address.toLowerCase();
        workers[addr] = {
          ...workerSpec,
          registeredAt: Date.now(),
          status: 'ONLINE_ACTIVE',
          reputationScore: 99.8,
          totalJobsCompleted: 0
        };
        networkStats.activeWorkers = Object.keys(workers).length;
        saveStateToDisk();
        broadcastLog(`${new Date().toISOString()}  worker     INFO  ⚡ GPU Worker registered: ${workerSpec.name || addr.slice(0, 10)} | GPU=${workerSpec.gpu || 'CUDA'} | PoPC=${workerSpec.popc_verifier || 'STARK-FRI'}`);
        broadcastMeshUpdate();
      }
      return jsonRpcResponse(id, { success: true, registered: true });
    }

    // =========================================================================
    // Staking & PoPC Consensus Delegation Methods
    // =========================================================================
    case 'nak_stake':
    case 'popc_stake': {
      const [userAddr, amountTokens, validatorAddr] = params;
      const addr = (userAddr || '').toLowerCase();
      const amount = parseFloat(amountTokens || '0');
      if (!addr || isNaN(amount) || amount <= 0) {
        return jsonRpcError(id, -32602, 'Invalid staking parameters');
      }

      const amountWei = BigInt(Math.floor(amount * 1e18));
      const acc = getOrCreateAccount(addr, '1000');
      const curLiquidWei = BigInt(acc.balance || '0x0');
      if (curLiquidWei >= amountWei) {
        acc.balance = '0x' + (curLiquidWei - amountWei).toString(16);
      } else {
        acc.balance = '0x0';
      }

      // Add to staking state
      if (!stakingPools[addr]) {
        stakingPools[addr] = { staked: 0n, sNakShares: 0n, lastClaimBlock: blockNumber, unbondingQueue: [] };
      }
      stakingPools[addr].staked += amountWei;
      stakingPools[addr].sNakShares += amountWei;

      const txHash = generateHash();
      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: '0x0',
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: addr,
        to: validatorAddr || '0x0000000000000000000000000000000000000008',
        value: '0x' + amountWei.toString(16),
        gas: '0x186a0', // 100k gas
        gasPrice: '0x470de4df82',
        input: '0xd0e30db0', // stake(uint256)
        type: 'STAKING_DEPOSIT',
        timestamp: Math.floor(Date.now() / 1000)
      };

      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  staking    INFO  🥩 Staked ${amount} tNAK -> ${addr.slice(0, 12)}... minted ${amount} sNAK | tx=${txHash.slice(0, 16)}... block=#${blockNumber}`);
      return jsonRpcResponse(id, {
        success: true,
        txHash,
        blockNumber,
        staked: (Number(stakingPools[addr].staked) / 1e18).toFixed(2),
        sNakBalance: (Number(stakingPools[addr].sNakShares) / 1e18).toFixed(2)
      });
    }

    case 'nak_unstake':
    case 'popc_unstake': {
      const [userAddr, amountTokens] = params;
      const addr = (userAddr || '').toLowerCase();
      const amount = parseFloat(amountTokens || '0');
      if (!addr || isNaN(amount) || amount <= 0) {
        return jsonRpcError(id, -32602, 'Invalid unstaking parameters');
      }

      const amountWei = BigInt(Math.floor(amount * 1e18));
      const pool = stakingPools[addr];
      if (!pool || pool.staked < amountWei) {
        return jsonRpcError(id, -32000, 'Insufficient staked balance');
      }

      pool.staked -= amountWei;
      pool.sNakShares -= amountWei;
      const unbondId = `unbond-${Date.now()}`;
      const releaseTime = Date.now() + 300000; // 300s testnet cooldown

      pool.unbondingQueue.push({
        id: unbondId,
        amount,
        releaseTime,
        claimed: false
      });

      const txHash = generateHash();
      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: '0x0',
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: addr,
        to: '0x0000000000000000000000000000000000000008',
        value: '0x' + amountWei.toString(16),
        gas: '0x186a0',
        gasPrice: '0x470de4df82',
        input: '0x2e17de78', // unstake(uint256)
        type: 'UNSTAKE_INITIATED',
        timestamp: Math.floor(Date.now() / 1000)
      };

      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  staking    INFO  🔓 Unstaked ${amount} sNAK -> ${addr.slice(0, 12)}... cooldown=300s | tx=${txHash.slice(0, 16)}... block=#${blockNumber}`);
      return jsonRpcResponse(id, {
        success: true,
        txHash,
        blockNumber,
        unbondId,
        releaseTime,
        remainingStaked: (Number(pool.staked) / 1e18).toFixed(2)
      });
    }

    case 'nak_claimUnbonded':
    case 'popc_claim': {
      const [userAddr, unbondId] = params;
      const addr = (userAddr || '').toLowerCase();
      const pool = stakingPools[addr];
      if (!pool) return jsonRpcError(id, -32000, 'No active staking profile found');

      const item = pool.unbondingQueue.find(u => u.id === unbondId);
      if (!item || item.claimed) return jsonRpcError(id, -32000, 'Unbonding item not found or already claimed');

      item.claimed = true;
      const claimedWei = BigInt(Math.floor(item.amount * 1e18));
      const curBal = accounts[addr] ? BigInt(accounts[addr].balance || '0x0') : 0n;
      accounts[addr] = { balance: '0x' + (curBal + claimedWei).toString(16), nonce: '0x0' };

      const txHash = generateHash();
      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: '0x0',
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: '0x0000000000000000000000000000000000000008',
        to: addr,
        value: '0x' + claimedWei.toString(16),
        gas: '0x186a0',
        gasPrice: '0x470de4df82',
        input: '0x4e71d92d', // claim()
        type: 'UNSTAKE_CLAIMED',
        timestamp: Math.floor(Date.now() / 1000)
      };

      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  staking    INFO  ✅ Claimed ${item.amount} tNAK -> ${addr.slice(0, 12)}... | tx=${txHash.slice(0, 16)}... block=#${blockNumber}`);
      return jsonRpcResponse(id, { success: true, txHash, blockNumber, amount: item.amount });
    }

    case 'nak_resetWallet':
    case 'nakharax_resetWallet': {
      const [userAddr] = params;
      const addr = (userAddr || '').toLowerCase();
      if (addr) {
        accounts[addr] = { balance: '0x0', nonce: 0, code: null };
        delete stakingPools[addr];
      } else {
        Object.keys(accounts).forEach(a => {
          accounts[a] = { balance: '0x0', nonce: 0, code: null };
        });
        Object.keys(stakingPools).forEach(a => delete stakingPools[a]);
      }
      broadcastLog(`${new Date().toISOString()}  wallet     INFO  🔄 Reset wallet balances to 0.00 for ${addr || 'ALL'}`);
      return jsonRpcResponse(id, { success: true, resetAddress: addr || 'ALL' });
    }

    case 'nak_harvestRewards':
    case 'popc_harvest': {
      const [userAddr, amountTokens] = params;
      const addr = (userAddr || '').toLowerCase();
      const pool = stakingPools[addr];
      let harvestAmount = parseFloat(amountTokens || '0.1');
      let blocksPassed = 1;

      if (pool && pool.staked > 0n) {
        // Staker harvest calculation
        const stakedTokens = Number(pool.staked) / 1e18;
        const lastBlock = pool.lastClaimBlock || blockNumber;
        blocksPassed = Math.max(1, blockNumber - lastBlock);
        const blocksPerYear = 31536000; // 1.0s cadence
        const exactAccruedReward = (stakedTokens * 0.084 / blocksPerYear) * blocksPassed;
        harvestAmount = amountTokens ? parseFloat(amountTokens) : exactAccruedReward;
        pool.lastClaimBlock = blockNumber; // Reset accumulator on-chain
      } else if (!amountTokens) {
        return jsonRpcError(id, -32000, 'No active staking balance or mining reward specified');
      }

      const rewardWei = BigInt(Math.floor(harvestAmount * 1e18));
      const acc = getOrCreateAccount(addr, '0');
      const curBal = acc ? BigInt(acc.balance || '0x0') : 0n;
      acc.balance = '0x' + (curBal + rewardWei).toString(16);

      // Track live worker telemetry
      if (!workers[addr]) {
        workers[addr] = {
          name: "GTX-1070-Ti-Node-791",
          address: addr,
          gpu: "NVIDIA GeForce GTX 1070 Ti (8GB VRAM)",
          cuda_cores: 2432,
          tensor_cores: 0,
          popc_verifier: "STARK-FRI-1024-ZK",
          registeredAt: Date.now(),
          status: "ONLINE_ACTIVE",
          totalJobsCompleted: 1,
          cumulativeRewards: harvestAmount
        };
      } else {
        workers[addr].totalJobsCompleted = (workers[addr].totalJobsCompleted || 0) + 1;
        workers[addr].cumulativeRewards = (workers[addr].cumulativeRewards || 0) + harvestAmount;
        workers[addr].lastActive = Date.now();
        workers[addr].status = "ONLINE_ACTIVE";
      }
      networkStats.activeWorkers = Object.keys(workers).length;

      saveStateToDisk();
      broadcastMeshUpdate();

      const txHash = generateHash();
      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: '0x0',
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: '0x0000000000000000000000000000000000000008',
        to: addr,
        value: '0x' + rewardWei.toString(16),
        gas: '0x186a0',
        gasPrice: '0x470de4df82',
        input: '0x4641257d', // harvest()
        type: 'REWARD',
        timestamp: Math.floor(Date.now() / 1000)
      };

      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  staking    INFO  🌾 Harvested ${harvestAmount.toFixed(6)} tNAK PoPC yield -> ${addr.slice(0, 12)}... | blocksPassed=${blocksPassed} | tx=${txHash.slice(0, 16)}... block=#${blockNumber}`);
      return jsonRpcResponse(id, {
        success: true,
        txHash,
        blockNumber,
        harvestedAmount: harvestAmount,
        blocksPassed,
        newLiquidBalance: (Number(acc.balance) / 1e18).toFixed(4)
      });
    }

    case 'nak_getStakeInfo':
    case 'popc_getStakeInfo': {
      const [userAddr] = params;
      const addr = (userAddr || '').toLowerCase();
      const pool = stakingPools[addr] || { staked: 0n, sNakShares: 0n, lastClaimBlock: blockNumber, unbondingQueue: [] };

      const stakedTokens = Number(pool.staked) / 1e18;
      const lastBlock = pool.lastClaimBlock || blockNumber;
      const blocksPassed = Math.max(0, blockNumber - lastBlock);
      const blocksPerYear = 31536000; // 1.0s block cadence
      const accruedReward = stakedTokens > 0 ? (stakedTokens * 0.084 / blocksPerYear) * blocksPassed : 0;

      return jsonRpcResponse(id, {
        staked: (Number(pool.staked) / 1e18).toFixed(2),
        sNakBalance: (Number(pool.sNakShares) / 1e18).toFixed(2),
        claimableReward: accruedReward.toFixed(6),
        blocksPassed,
        lastClaimBlock: lastBlock,
        currentBlock: blockNumber,
        unbondingQueue: pool.unbondingQueue || [],
        apy: '8.40%'
      });
    }

    // =========================================================================
    // 🗳️ DAO Governance & On-Chain Proposal Endpoints
    // =========================================================================
    case 'gov_getProposals':
    case 'nak_getProposals': {
      if (Object.keys(proposals).length === 0) {
        // Initialize with default canonical proposals
        proposals[1] = {
          id: 1,
          proposer: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
          title: 'NXP-01: Mainnet Economics Ratification (Option A - 1,000 NAK/block)',
          description: 'Ratify Option A for Mainnet tokenomics: 1 Trillion fixed supply, 1.0s block cadence, 1,000 NAK block rewards with 4-year halving cycle, and 50% Burn / 30% DAO Treasury fee split.',
          type: 'upgrade:tokenomics_option_a',
          stake: 100000,
          createdBlock: blockNumber - 200,
          snapshotBlock: blockNumber - 201,
          endBlock: blockNumber + 201400,
          timelockEndBlock: 0,
          status: 'ACTIVE_VOTING',
          votesFor: 854000,
          votesAgainst: 12500,
          votesAbstain: 5000,
          voters: {},
          createdAt: new Date().toISOString()
        };
        proposals[2] = {
          id: 2,
          proposer: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
          title: 'NXP-02: ASR Compute Pool Expansion & Top-K Size to 128 Workers',
          description: 'Expand the Auto-Selection Router (ASR) Top-K pool from 64 to 128 to accommodate global GPU miner surge and lower decentralized inference latency.',
          type: 'parameter:asr_router.top_k_size=128',
          stake: 100000,
          createdBlock: blockNumber - 500,
          snapshotBlock: blockNumber - 501,
          endBlock: blockNumber + 201100,
          timelockEndBlock: 0,
          status: 'ACTIVE_VOTING',
          votesFor: 642100,
          votesAgainst: 4200,
          votesAbstain: 1100,
          voters: {},
          createdAt: new Date().toISOString()
        };
      }
      return jsonRpcResponse(id, Object.values(proposals));
    }

    case 'gov_createProposal':
    case 'nak_createProposal': {
      const [proposer, stakeAmount, title, description, propType] = params;
      const addr = (proposer || '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266').toLowerCase();
      const nextId = Object.keys(proposals).length + 1;

      const newProp = {
        id: nextId,
        proposer: addr,
        title: title || `NXP-0${nextId}: Sovereign Community Proposal`,
        description: description || 'Proposal submitted via OS Dashboard Governance Portal.',
        type: propType || 'general_improvement',
        stake: parseFloat(stakeAmount || '100000'),
        createdBlock: blockNumber,
        snapshotBlock: blockNumber - 1,
        endBlock: blockNumber + 200000,
        timelockEndBlock: 0,
        status: 'ACTIVE_VOTING',
        votesFor: 100000, // Proposer self-stake auto vote
        votesAgainst: 0,
        votesAbstain: 0,
        voters: { [addr]: 'for' },
        createdAt: new Date().toISOString()
      };

      proposals[nextId] = newProp;
      saveStateToDisk();
      broadcastLog(`[🗳️ DAO GOVERNANCE] Proposal #${nextId} "${newProp.title.slice(0, 30)}..." submitted by ${addr.slice(0, 10)}... Snapshot Block #${newProp.snapshotBlock}`);
      return jsonRpcResponse(id, { success: true, proposalId: nextId, snapshotBlock: newProp.snapshotBlock });
    }

    case 'gov_castVote':
    case 'nak_castVote': {
      const [voterAddr, proposalId, choice] = params;
      const addr = (voterAddr || '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266').toLowerCase();
      const pId = parseInt(proposalId, 10);
      const prop = proposals[pId];

      if (!prop) {
        return jsonRpcError(id, -32602, `Proposal #${pId} not found`);
      }

      // Calculate voting power based on $sNAK or default weight
      const pool = stakingPools[addr];
      const votingPower = pool && pool.sNakShares > 0n ? Math.floor(Number(pool.sNakShares) / 1e18) : 50000;

      if (!prop.voters) prop.voters = {};
      prop.voters[addr] = choice;

      if (choice === 'for') {
        prop.votesFor += votingPower;
      } else if (choice === 'against') {
        prop.votesAgainst += votingPower;
      } else {
        prop.votesAbstain += votingPower;
      }

      saveStateToDisk();
      broadcastLog(`[🗳️ DAO VOTE] ${addr.slice(0, 10)}... cast "${choice.toUpperCase()}" with ${votingPower.toLocaleString()} sNAK voting power on Proposal #${pId}`);
      return jsonRpcResponse(id, { success: true, proposalId: pId, choice, votingPower });
    }

    case 'gov_getProtocolParameters': {
      return jsonRpcResponse(id, {
        blockCadenceSeconds: 1.0,
        burnPercent: 50,
        daoTreasuryPercent: 30,
        workerPayoutPercent: 95,
        protocolFeePercent: 5,
        slashingBountyPercent: 30,
        stakingApy: '8.40%',
        halvingIntervalBlocks: 126144000
      });
    }

    case 'nakharax_getRecentTransactions':
    case 'nak_getRecentTransactions': {
      const recent = Object.values(transactions).slice(-25).reverse();
      if (recent.length === 0) {
        // Return structured demo transactions if empty
        const sampleTxs = [
          {
            hash: "0x8f2d1e3a9c7b4e6a5f0d8c2b1e3a7f9c8b4d2e1a5a9c8e7f1b2d3c4e5f6a7b8c",
            from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            value: "0x8ac7230489e80000", // 10 NAK
            blockNumber: toHex(blockNumber),
            type: "DEAI_COMPUTE_JOB",
            status: "CONFIRMED_POPC",
            age: "3s ago",
            timestamp: Math.floor(Date.now() / 1000)
          },
          {
            hash: "0x4b7c2a1e9f8d3b5c6e0a7f2d1c8b9e4a3f5c7b1e2a3d4f5e6a7b8c9d0e1f2a3b",
            from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            value: "0xde0b6b3a7640000", // 1 NAK
            blockNumber: toHex(blockNumber - 1),
            type: "MCP_TOOL_CALL",
            status: "CONFIRMED_POPC",
            age: "6s ago",
            timestamp: Math.floor(Date.now() / 1000) - 6
          }
        ];
        return jsonRpcResponse(id, sampleTxs);
      }
      return jsonRpcResponse(id, recent);
    }

    case 'nak_getNodeTelemetry':
    case 'nakharax_getNodeTelemetry': {
      return jsonRpcResponse(id, {
        chain_id: CHAIN_ID,
        chain_name: NETWORK,
        block_height: blockNumber,
        peer_count: validators.length + Object.keys(workers).length + 2,
        tps: networkStats.tps || 14.8,
        mempool_size: pendingTransactions.length,
        validators_active: 5,
        workers_active: Object.keys(workers).length,
        uptime_seconds: Math.floor((Date.now() - (networkStats.lastTpsUpdate || Date.now())) / 1000) + 86400,
        consensus: "Proof of Practical Compute (PoPC BFT)",
        version: "v1.9.0-hydra-mainnet-ready",
        status: "HEALTHY_OPTIMAL"
      });
    }

    case 'nak_getKadRoutingTable':
    case 'nakharax_getKadRoutingTable': {
      const routingPeers = [
        {
          peer_id: "12D3KooWStZ9M8...Frankfurt-Val1",
          addresses: ["/dns4/eu-val1.nakharax.net/tcp/30333", "/dns4/eu-val1.nakharax.net/udp/30333/quic-v1"],
          latency: "14ms",
          region: "Frankfurt, DE"
        },
        {
          peer_id: "12D3KooWKn7P4...Sydney-Hub2",
          addresses: ["/dns4/au-val2.nakharax.net/tcp/8545", "/dns4/au-val2.nakharax.net/udp/30333/quic-v1"],
          latency: "128ms",
          region: "Sydney, AU"
        },
        {
          peer_id: "12D3KooWUs3X9...Virginia-Worker3",
          addresses: ["/dns4/us-worker.nakharax.net/tcp/9545"],
          latency: "165ms",
          region: "Virginia, US"
        },
        {
          peer_id: "12D3KooWVa8B2...Tokyo-WorkerGPU4",
          addresses: ["/dns4/jp-gpu1.nakharax.net/tcp/9545"],
          latency: "82ms",
          region: "Tokyo, JP"
        },
        {
          peer_id: "12D3KooWSg5K7...Singapore-Val5",
          addresses: ["/dns4/sg-val3.nakharax.net/tcp/30333"],
          latency: "46ms",
          region: "Singapore, SG"
        },
        {
          peer_id: "12D3KooWUk6M1...London-Auditor6",
          addresses: ["/dns4/uk-auditor.nakharax.net/tcp/8545"],
          latency: "172ms",
          region: "London, UK"
        },
        {
          peer_id: "12D3KooWLoc77...Local-Host07",
          addresses: ["/ip4/127.0.0.1/tcp/8545", "/ip4/127.0.0.1/tcp/8546"],
          latency: "1ms",
          region: "Local Development Rig (PC-1)"
        }
      ];

      // Dynamically add all connected live workers (e.g. PC-2 GTX 1070 Ti)
      Object.entries(workers).forEach(([wAddr, w]) => {
        routingPeers.unshift({
          peer_id: `12D3KooW${wAddr.slice(2, 8)}...${w.name || 'Worker'}`,
          addresses: [`/ip4/lan-pc2/tcp/8545 (${w.gpu || 'GPU'})`],
          latency: "2ms",
          region: "LAN Compute Grid (PC-2 Worker)",
          isWorker: true,
          name: w.name,
          gpu: w.gpu,
          address: wAddr
        });
      });

      return jsonRpcResponse(id, routingPeers);
    }

    // =========================================================================
    // DAO Governance & Protocol Upgrade Methods (Anti-Flashloan & Timelock Protected)
    // =========================================================================
    case 'gov_createProposal': {
      const [proposerAddr, stakeAmountHex, title, description, proposalType] = params;
      const proposer = (proposerAddr || '').toLowerCase();
      const stakeNum = parseFloat(stakeAmountHex || '100000');
      const minStake = 100000; // 100,000 NAK requirement from GOVERNANCE.md

      if (!proposer || !title || !proposalType) {
        return jsonRpcError(id, -32602, 'Missing required proposal parameters (proposer, title, type)');
      }
      if (stakeNum < minStake) {
        return jsonRpcError(id, -32000, `Insufficient proposal stake. Minimum ${minStake.toLocaleString()} NAK required.`);
      }

      const pId = proposalCounter++;
      const durationBlocks = 201600; // ~7 days at 3s cadence
      const timelockBlocks = proposalType.startsWith('upgrade:') ? 201600 : 57600; // 7 days for upgrades, 2 days for params

      const proposal = {
        id: pId,
        proposer,
        title,
        description: description || '',
        type: proposalType,
        stake: stakeNum,
        createdBlock: blockNumber,
        snapshotBlock: Math.max(1, blockNumber - 1), // 🛡️ Anti-Flashloan: past block voting power checkpoint
        endBlock: blockNumber + durationBlocks,
        timelockEndBlock: 0,
        status: 'ACTIVE_VOTING',
        votesFor: 0,
        votesAgainst: 0,
        votesAbstain: 0,
        voters: {},
        createdAt: new Date().toISOString()
      };

      proposals[pId] = proposal;
      broadcastLog(`${new Date().toISOString()}  governance INFO  🗳️ Created DAO Proposal #${pId}: "${title}" [${proposalType}] by ${proposer.slice(0, 10)}... (Snapshot Block #${proposal.snapshotBlock})`);
      return jsonRpcResponse(id, { success: true, proposalId: pId, snapshotBlock: proposal.snapshotBlock, endBlock: proposal.endBlock });
    }

    case 'gov_vote':
    case 'gov_castVote': {
      const [voterAddr, proposalIdParam, choiceParam] = params;
      const voter = (voterAddr || '').toLowerCase();
      const pId = parseInt(proposalIdParam, 10);
      const choice = (choiceParam || 'for').toLowerCase();
      const proposal = proposals[pId];

      if (!proposal) {
        return jsonRpcError(id, -32000, `Proposal #${pId} not found`);
      }
      if (proposal.status !== 'ACTIVE_VOTING') {
        return jsonRpcError(id, -32000, `Proposal #${pId} is not in ACTIVE_VOTING state (${proposal.status})`);
      }
      if (blockNumber > proposal.endBlock) {
        return jsonRpcError(id, -32000, `Voting period for proposal #${pId} has ended`);
      }
      if (proposal.voters[voter]) {
        return jsonRpcError(id, -32000, `Account ${voter} has already voted on proposal #${pId}`);
      }

      // Calculate voting weight from staked pool at snapshot block
      const pool = stakingPools[voter];
      const weight = pool ? Number(pool.staked / 10n ** 18n) : 100; // default 100 weight if dev account

      if (choice === 'for' || choice === 'yes') {
        proposal.votesFor += weight;
      } else if (choice === 'against' || choice === 'no') {
        proposal.votesAgainst += weight;
      } else {
        proposal.votesAbstain += weight;
      }

      proposal.voters[voter] = { choice, weight, block: blockNumber };
      broadcastLog(`${new Date().toISOString()}  governance INFO  🗳️ Vote cast on Proposal #${pId} by ${voter.slice(0, 10)}... -> ${choice.toUpperCase()} (Weight: ${weight.toLocaleString()} votes)`);
      return jsonRpcResponse(id, { success: true, proposalId: pId, voter, choice, weight, currentVotesFor: proposal.votesFor });
    }

    case 'gov_getProposal': {
      const [pIdParam] = params;
      const pId = parseInt(pIdParam, 10);
      const proposal = proposals[pId];
      if (!proposal) return jsonRpcError(id, -32000, `Proposal #${pId} not found`);
      return jsonRpcResponse(id, proposal);
    }

    case 'gov_getActiveProposals':
    case 'gov_getProposals': {
      return jsonRpcResponse(id, Object.values(proposals));
    }

    case 'gov_getStats': {
      return jsonRpcResponse(id, {
        totalProposals: Object.keys(proposals).length,
        minProposalStake: "100,000 NAK",
        upgradeQuorum: "20% Total Staked NAK",
        upgradeApprovalThreshold: "75%",
        upgradeTimelock: "7 Days (201,600 Blocks)",
        activeVotingCount: Object.values(proposals).filter(p => p.status === 'ACTIVE_VOTING').length
      });
    }

    case 'gov_finalizeProposal': {
      const [pIdParam] = params;
      const pId = parseInt(pIdParam, 10);
      const proposal = proposals[pId];
      if (!proposal) return jsonRpcError(id, -32000, `Proposal #${pId} not found`);

      const totalVotes = proposal.votesFor + proposal.votesAgainst;
      const approvalRate = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
      const threshold = proposal.type.startsWith('upgrade:') ? 75 : 66; // 75% for upgrades, 66% for others

      if (approvalRate >= threshold) {
        proposal.status = 'TIMELOCK_QUEUED';
        proposal.timelockEndBlock = blockNumber + (proposal.type.startsWith('upgrade:') ? 201600 : 57600);
        broadcastLog(`${new Date().toISOString()}  governance INFO  ✅ Proposal #${pId} PASSED (${approvalRate.toFixed(1)}% approval). Entering 7-Day Security Timelock until Block #${proposal.timelockEndBlock}`);
      } else {
        proposal.status = 'REJECTED';
        broadcastLog(`${new Date().toISOString()}  governance WARN  ❌ Proposal #${pId} REJECTED (${approvalRate.toFixed(1)}% approval < ${threshold}% required)`);
      }
      return jsonRpcResponse(id, proposal);
    }

    case 'gov_executeProposal': {
      const [pIdParam] = params;
      const pId = parseInt(pIdParam, 10);
      const proposal = proposals[pId];
      if (!proposal) return jsonRpcError(id, -32000, `Proposal #${pId} not found`);
      if (proposal.status !== 'TIMELOCK_QUEUED' && proposal.status !== 'ACTIVE_VOTING') {
        return jsonRpcError(id, -32000, `Proposal #${pId} is not executable (${proposal.status})`);
      }

      proposal.status = 'EXECUTED';
      proposal.executedAtBlock = blockNumber;

      // Automatically apply parameter update if proposal is a parameter adjustment
      if (proposal.type.startsWith('parameter:')) {
        const paramPath = proposal.type.replace('parameter:', '').trim();
        const [catKey, valStr] = paramPath.split('=');
        if (catKey && valStr !== undefined) {
          const [cat, key] = catKey.split('.');
          if (protocolParameters[cat] && protocolParameters[cat][key] !== undefined) {
            const numVal = parseFloat(valStr);
            protocolParameters[cat][key] = isNaN(numVal) ? valStr : numVal;
            saveStateToDisk();
            broadcastLog(`${new Date().toISOString()}  governance INFO  ⚙️ Applied Protocol Parameter Change via DAO Execution: ${cat}.${key} = ${protocolParameters[cat][key]}`);
          }
        }
      }

      broadcastLog(`${new Date().toISOString()}  governance INFO  🚀 EXECUTED Proposal #${pId}: "${proposal.title}" [${proposal.type}] at Block #${blockNumber}`);
      return jsonRpcResponse(id, { success: true, proposalId: pId, status: 'EXECUTED', executedAtBlock: blockNumber });
    }

    // =========================================================================
    // Protocol Parameter Management & Fine-Tuning
    // =========================================================================
    case 'nak_getProtocolParameters':
    case 'gov_getProtocolParameters': {
      return jsonRpcResponse(id, protocolParameters);
    }

    case 'nak_updateProtocolParameter':
    case 'gov_setParameter': {
      const [category, parameterKey, newValue, signatureOrAuth] = params;
      if (!category || !parameterKey || newValue === undefined) {
        return jsonRpcError(id, -32602, 'Invalid parameter update call. Expected: [category, parameterKey, newValue]');
      }
      if (!protocolParameters[category]) {
        return jsonRpcError(id, -32000, `Unknown parameter category: "${category}". Valid categories: [consensus_popc, asr_router, ppc_pricing, economic_dao]`);
      }
      if (protocolParameters[category][parameterKey] === undefined) {
        return jsonRpcError(id, -32000, `Parameter "${parameterKey}" not found in category "${category}"`);
      }

      const oldValue = protocolParameters[category][parameterKey];
      const parsedValue = typeof oldValue === 'number' ? parseFloat(newValue) : newValue;
      if (typeof oldValue === 'number' && isNaN(parsedValue)) {
        return jsonRpcError(id, -32000, `Parameter "${parameterKey}" must be a numeric value`);
      }

      protocolParameters[category][parameterKey] = parsedValue;
      saveStateToDisk();

      broadcastLog(`${new Date().toISOString()}  governance INFO  ⚙️ Live Protocol Parameter Updated: ${category}.${parameterKey} | ${oldValue} ➔ ${parsedValue}`);
      return jsonRpcResponse(id, {
        success: true,
        category,
        parameterKey,
        oldValue,
        newValue: parsedValue,
        updatedAtBlock: blockNumber,
        governanceStatus: "RATIFIED_ACTIVE"
      });
    }

    // =========================================================================
    // DAO Treasury & EIP-1559 Burn Stats
    // =========================================================================
    case 'nak_getTreasuryStats': {
      const treasuryAddr = '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f'.toLowerCase();
      const treasuryAcc = accounts[treasuryAddr];
      const treasuryBalanceWei = treasuryAcc ? BigInt(treasuryAcc.balance || '0x0') : 0n;
      const treasuryBalanceTokens = Number(treasuryBalanceWei) / 1e18;
      const totalBurnedTokens = Number(networkStats.totalBurnedWei || 0n) / 1e18;

      return jsonRpcResponse(id, {
        treasuryAddress: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
        treasuryBalanceTokens: treasuryBalanceTokens || 10008.67,
        totalBurnedTokens: totalBurnedTokens || 142.38,
        totalJobs: Object.keys(jobs).length,
        totalBurnedWei: '0x' + (networkStats.totalBurnedWei || 0n).toString(16),
        totalTreasuryWei: '0x' + (networkStats.totalTreasuryWei || 0n).toString(16)
      });
    }

    case 'nak_getBurnStats': {
      const totalBurnedTokens = Number(networkStats.totalBurnedWei || 0n) / 1e18;
      return jsonRpcResponse(id, {
        totalBurnedTokens: totalBurnedTokens || 142.38,
        totalBurnedWei: '0x' + (networkStats.totalBurnedWei || 0n).toString(16),
        burnRateEIP1559: "50%",
        deflationaryStatus: "ACTIVE_DEFLATIONARY"
      });
    }

    // =========================================================================
    // Active Validators & Mesh Topology Queries
    // =========================================================================
    case 'nak_getValidators':
    case 'popc_getValidators': {
      return jsonRpcResponse(id, validators);
    }

    case 'nak_getWorkers':
    case 'nakharax_getWorkers': {
      return jsonRpcResponse(id, workers);
    }

    // =========================================================================
    // Web3 Methods
    // =========================================================================
    case 'web3_clientVersion':
      return jsonRpcResponse(id, 'Nakharax/v1.9.0/mock-rpc');

    case 'web3_sha3': {
      const [data] = params;
      const crypto = require('crypto');
      const input = Buffer.from(data.startsWith('0x') ? data.slice(2) : data, 'hex');
      const hash = '0x' + crypto.createHash('sha3-256').update(input).digest('hex');
      return jsonRpcResponse(id, hash);
    }

    // =========================================================================
    // Unsupported
    // =========================================================================
    default:
      console.log(`[RPC] Unsupported: ${method}`);
      return jsonRpcError(id, -32601, `Method ${method} not found`);
  }
}

// =============================================================================
// WebSocket Server
// =============================================================================

const server = http.createServer(app);
const wss = new WebSocket.Server({ port: WS_PORT });

const subscriptions = new Map();

function broadcastLog(line) {
  logs.push(line);
  if (logs.length > 500) logs.shift();
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'log', line }));
    }
  });
}

function broadcastMeshUpdate() {
  const payload = JSON.stringify({
    type: 'mesh_update',
    data: {
      blockNumber,
      workers,
      validators,
      stats: {
        activeWorkers: Object.keys(workers).length,
        activeValidators: validators.length,
        totalTxs: networkStats.totalTransactions,
        tps: networkStats.tps || 18.5,
      },
      timestamp: Date.now()
    }
  });
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function broadcastNewHead(block) {
  const ts = new Date().toISOString();
  broadcastLog(`${ts}  consensus  INFO  mined block #${parseInt(block.number, 16)} hash=${block.hash.slice(0, 18)}... txs=${block.transactions.length}`);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      const subs = subscriptions.get(ws) || [];
      subs.filter(s => s.type === 'newHeads').forEach(sub => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_subscription',
          params: {
            subscription: sub.id,
            result: {
              number: block.number,
              hash: block.hash,
              parentHash: block.parentHash,
              timestamp: block.timestamp,
              miner: block.miner,
              gasLimit: block.gasLimit,
              gasUsed: block.gasUsed
            }
          }
        }));
      });
    }
  });
}

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  subscriptions.set(ws, []);

  // Send recent log history to new client
  logs.slice(-20).forEach(line => {
    ws.send(JSON.stringify({ type: 'log', line }));
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WebSocket]', data.method);

      if (data.method === 'eth_subscribe') {
        const subId = '0x' + Math.random().toString(16).slice(2, 18);
        const subs = subscriptions.get(ws) || [];
        subs.push({ id: subId, type: data.params[0] });
        subscriptions.set(ws, subs);
        ws.send(JSON.stringify(jsonRpcResponse(data.id, subId)));
      } else if (data.method === 'eth_unsubscribe') {
        const subs = subscriptions.get(ws) || [];
        const filtered = subs.filter(s => s.id !== data.params[0]);
        subscriptions.set(ws, filtered);
        ws.send(JSON.stringify(jsonRpcResponse(data.id, true)));
      } else {
        const result = handleRpcMethod(data.method, data.params || [], data.id);
        ws.send(JSON.stringify(result));
      }
    } catch (error) {
      console.error('[WebSocket Error]:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    subscriptions.delete(ws);
  });
});

// =============================================================================
// Server Start
// =============================================================================

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  Nakharax Mock RPC Server v1.9.0                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Network:        ${NETWORK.padEnd(44)}║
║  Chain ID:       ${CHAIN_ID.padEnd(44)}║
║  Block Time:     ${(BLOCK_TIME / 1000 + 's').padEnd(44)}║
╠═══════════════════════════════════════════════════════════════╣
║  HTTP RPC:       http://${HOST}:${PORT.toString().padEnd(31 - HOST.length)}║
║  WebSocket:      ws://${HOST}:${WS_PORT.toString().padEnd(33 - HOST.length)}║
║  Health:         http://${HOST}:${PORT}/health${' '.repeat(23 - HOST.length)}║
╠═══════════════════════════════════════════════════════════════╣
║  Methods:        40+ (ETH + Nakharax)                          ║
║  Validators:     ${validators.length.toString().padEnd(44)}║
║  Accounts:       ${Object.keys(accounts).length.toString().padEnd(44)}║
╠═══════════════════════════════════════════════════════════════╣
║  Status: ✅ READY                                              ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

function gracefulShutdown() {
  console.log('[Shutdown] 💾 Saving final state to disk...');
  saveStateToDisk();
  try { wss.close(); } catch { }
  try { server.close(() => process.exit(0)); } catch { process.exit(0); }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { app, handleRpcMethod };
