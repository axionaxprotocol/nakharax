const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

const PORT = process.env.PORT || 8545;
const WS_PORT = process.env.WS_PORT || 8546;
const HOST = process.env.HOST || '127.0.0.1';
const CHAIN_ID = process.env.CHAIN_ID || '86137';
const NETWORK = process.env.NETWORK || 'nakharax-testnet';
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || '3000'); // 3 seconds block cadence
// Enable full CORS for browser dashboards & MetaMask
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ strict: false, type: 'application/json' }));

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
let jobs = {};

// Network stats
let networkStats = {
  totalTransactions: 0,
  totalBlocks: blockNumber,
  activeValidators: 5,
  activeWorkers: 0,
  tps: 0,
  lastTpsUpdate: Date.now()
};

// =============================================================================
// Helper Functions
// =============================================================================

function generateAddress() {
  return '0x' + [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function generateHash() {
  return '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function toHex(num) {
  return '0x' + num.toString(16);
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

function initMockState() {
  // Create mock accounts with balances
  const knownAddresses = [
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000003',
  ];
  
  knownAddresses.forEach((addr, i) => {
    accounts[addr.toLowerCase()] = {
      balance: toHex(BigInt('50000000000000000000000')), // 50,000 NAK
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
  
  // Initialize validators
  validators = [
    { address: knownAddresses[0], name: 'Validator-EU-01', stake: '50000000000000000000000', active: true },
    { address: knownAddresses[1], name: 'Validator-US-01', stake: '50000000000000000000000', active: true },
    { address: knownAddresses[2], name: 'Validator-AS-01', stake: '50000000000000000000000', active: true },
  ];
  
  console.log(`[Init] Created ${Object.keys(accounts).length} accounts`);
  console.log(`[Init] Initialized ${validators.length} validators`);
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

app.post('/', (req, res) => {
  const { jsonrpc, method, params = [], id } = req.body;

  if (jsonrpc !== '2.0') {
    return res.json(jsonRpcError(id, -32600, 'Invalid Request'));
  }

  console.log(`[RPC] ${method}`);

  try {
    const result = handleRpcMethod(method, params, id);
    return res.json(result);
  } catch (error) {
    console.error(`[RPC Error] ${method}:`, error.message);
    return res.json(jsonRpcError(id, -32603, error.message));
  }
});

function handleRpcMethod(method, params, id) {
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
      const acc = accounts[address.toLowerCase()];
      return jsonRpcResponse(id, acc?.balance || '0x0');
    }

    case 'eth_getTransactionCount': {
      const [address, block] = params;
      const acc = accounts[address.toLowerCase()];
      return jsonRpcResponse(id, toHex(acc?.nonce || 0));
    }

    case 'eth_getCode': {
      const [address, block] = params;
      const acc = accounts[address.toLowerCase()];
      return jsonRpcResponse(id, acc?.code || '0x');
    }

    case 'eth_getStorageAt': {
      const [address, position, block] = params;
      // Return empty storage
      return jsonRpcResponse(id, '0x' + '0'.repeat(64));
    }

    // =========================================================================
    // Gas Methods
    // =========================================================================
    case 'eth_gasPrice':
      return jsonRpcResponse(id, '0x3b9aca00'); // 1 Gwei

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
      const [signedTx] = params;
      const txHash = generateHash();
      
      const tx = {
        hash: txHash,
        nonce: toHex(Math.floor(Math.random() * 1000)),
        blockHash: null,
        blockNumber: null,
        transactionIndex: null,
        from: generateAddress(),
        to: params.to || generateAddress(),
        value: '0x0',
        gas: '0x5208',
        gasPrice: '0x3b9aca00',
        input: signedTx.slice(0, 100),
        v: '0x1b',
        r: generateHash(),
        s: generateHash(),
        type: '0x0'
      };
      
      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      networkStats.totalTransactions++;
      return jsonRpcResponse(id, txHash);
    }
      
    case 'eth_sendTransaction': {
      const [txObj] = params;
      const txHash = generateHash();
      const fromAddr = (txObj?.from || generateAddress()).toLowerCase();
      const toAddr = (txObj?.to || generateAddress()).toLowerCase();
      const valHex = txObj?.value || '0x0';
      const valWei = BigInt(valHex);

      // Deduct balance from sender if account exists
      if (accounts[fromAddr]) {
        const curBal = BigInt(accounts[fromAddr].balance || '0x0');
        if (curBal >= valWei) {
          accounts[fromAddr].balance = '0x' + (curBal - valWei).toString(16);
        }
      }

      // Credit balance to recipient
      if (!accounts[toAddr]) {
        accounts[toAddr] = { balance: '0x0', nonce: '0x0' };
      }
      const recBal = BigInt(accounts[toAddr].balance || '0x0');
      accounts[toAddr].balance = '0x' + (recBal + valWei).toString(16);

      const curBlock = blockCache[blockNumber] || generateBlock(blockNumber);
      const tx = {
        hash: txHash,
        nonce: toHex(accounts[fromAddr]?.nonce || 0),
        blockHash: curBlock.hash,
        blockNumber: toHex(blockNumber),
        transactionIndex: toHex(curBlock.transactions.length),
        from: fromAddr,
        to: toAddr,
        value: valHex,
        gas: '0x5208',
        gasPrice: '0x470de4df82', // 1.2 Gwei
        input: txObj?.data || '0x',
        v: '0x1b',
        r: generateHash(),
        s: generateHash(),
        type: txObj?.data?.length > 10 ? 'DEAI_COMPUTE_JOB' : 'TRANSFER',
        timestamp: Math.floor(Date.now() / 1000)
      };

      transactions[txHash] = tx;
      pendingTransactions.push(tx);
      curBlock.transactions.push(txHash);
      networkStats.totalTransactions++;

      broadcastLog(`${new Date().toISOString()}  tx         INFO  mined tx ${txHash.slice(0, 16)}... from=${fromAddr.slice(0, 10)}... to=${toAddr.slice(0, 10)}... value=${valHex}`);
      return jsonRpcResponse(id, txHash);
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
    // Call & Logs
    // =========================================================================
    case 'eth_call': {
      const [txObj, block] = params;
      // Return empty for unknown contracts, or mock response
      if (txObj.data?.startsWith('0x70a08231')) {
        // balanceOf(address) - return mock balance
        return jsonRpcResponse(id, '0x' + '0'.repeat(56) + 'de0b6b3a7640000'); // 1 token
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

    case 'axn_getWorkerStats': {
      const [address] = params;
      if (address) {
        return jsonRpcResponse(id, workers[address.toLowerCase()] || null);
      }
      return jsonRpcResponse(id, {
        total: Object.keys(workers).length,
        active: Object.values(workers).filter(w => w.status === 'active').length,
        workers: Object.values(workers)
      });
    }

    case 'nakharax_registerWorker':
    case 'axn_registerWorker': {
      const [specs] = params;
      const address = specs?.address || generateAddress();
      workers[address.toLowerCase()] = {
        address: address,
        status: 'active',
        specs: specs || {},
        registeredAt: Date.now(),
        jobsCompleted: 0,
        reputation: 100
      };
      broadcastLog(`${new Date().toISOString()}  worker     INFO  registered worker ${address.slice(0, 10)}... vram=${specs?.vram || '16GB'}`);
      return jsonRpcResponse(id, { success: true, address });
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
      jobs[jobId] = {
        id: jobId,
        type: jobSpec?.type || 'inference',
        model: jobSpec?.model || 'DeAI-LLaMA-3-8B',
        status: 'pending',
        reward: jobSpec?.reward || '0x0',
        submitter: jobSpec?.from || generateAddress(),
        worker: null,
        createdAt: Date.now(),
        completedAt: null,
        result: null
      };
      broadcastLog(`${new Date().toISOString()}  asr        INFO  dispatched job ${jobId.slice(0, 12)}... type=${jobSpec?.type || 'inference'} model=${jobSpec?.model || 'LLaMA-3-8B'}`);
      return jsonRpcResponse(id, { jobId, status: 'pending' });
    }

    case 'faucet_requestTokens':
    case 'nakharax_faucet': {
      const [recipientAddress, amountTokens] = params;
      const addr = (recipientAddress || '').toLowerCase();
      const amount = amountTokens ? parseFloat(amountTokens) : 100;
      if (!addr || !addr.startsWith('0x') || addr.length < 10) {
        return jsonRpcError(id, -32602, 'Invalid recipient address');
      }
      const current = accounts[addr] ? BigInt(accounts[addr].balance) : 0n;
      const addedWei = BigInt(Math.floor(amount * 1e18));
      const newBal = (current + addedWei).toString(16);
      accounts[addr] = { balance: '0x' + newBal, nonce: '0x0' };
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
          addresses: ["/ip4/217.216.109.5/tcp/30303", "/ip4/217.216.109.5/udp/30303/quic-v1"]
        },
        {
          peer_id: "12D3KooWKn7P4...Sydney-Val2",
          addresses: ["/ip4/46.250.244.4/tcp/30303", "/ip4/46.250.244.4/udp/30303/quic-v1"]
        },
        {
          peer_id: "12D3KooWVa8B2...Tokyo-WorkerGPU",
          addresses: ["/ip4/142.93.18.90/tcp/30303"]
        },
        {
          peer_id: "12D3KooWRx5T1...Virginia-Sentinel",
          addresses: ["/ip4/198.51.100.42/tcp/30303"]
        }
      ];
      return jsonRpcResponse(id, routingPeers);
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

process.on('SIGTERM', () => {
  console.log('[Shutdown] Graceful shutdown...');
  wss.close();
  server.close(() => process.exit(0));
});

module.exports = { app, handleRpcMethod };
