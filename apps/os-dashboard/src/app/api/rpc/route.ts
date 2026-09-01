import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_RPC = "http://127.0.0.1:8545";
const LIVE_GATEWAY_RPC = "http://158.220.127.24";
const DEFAULT_RPC = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.nakharax.com";
const ENABLE_MOCK_FALLBACK = process.env.ENABLE_DEV_MOCK_FALLBACK === "true" || process.env.NODE_ENV === "development";

/**
 * Strict Method Allowlist for public Ingress RPC Gateway
 * Prevents unauthorized internal or mutation methods (e.g. gov_setParameter) from passing through.
 */
const STRICT_ALLOWED_METHODS = new Set([
  // Standard EVM / Ethereum JSON-RPC Methods
  "eth_blockNumber",
  "eth_chainId",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_sendRawTransaction", // Client-side signed serialized transaction (Zero private key exposure to RPC)
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_syncing",
  "eth_mining",
  "eth_accounts",
  "eth_getLogs",
  "net_version",
  "net_peerCount",
  "net_listening",
  "web3_clientVersion",
  "web3_sha3",

  // Verified Protocol Telemetry & Read Query Methods
  "nak_getNodeTelemetry",
  "nakharax_getNodeTelemetry",
  "nak_getWorkers",
  "nakharax_getWorkers",
  "nak_getKadRoutingTable",
  "nakharax_getKadRoutingTable",
  "nak_getStakeInfo",
  "nakharax_getStakeInfo",
  "nak_getRecentTransactions",
  "nakharax_getRecentTransactions",
  "nak_getJobs",
  "nakharax_getJobs",
  "nak_getJob",
  "nakharax_getJob",
  "nak_getProtocolParameters",
  "nakharax_getProtocolParameters",
  "nak_getMeshTopology",
  "nakharax_getMeshTopology",
  "nak_getRecentBlocks",
  "nakharax_getRecentBlocks",
  "nak_getTreasuryStats",
  "nakharax_getTreasuryStats",
  "nak_getSentinels",
  "nakharax_getSentinels",

  // Verified Validator Set Methods
  "axn_getValidatorSet",
  "axn_getValidatorInfo",
  "axn_getNetworkStats",
  "axn_getWorkers",
  "axn_getWorkerStats",

  // Verified DAO Governance Read Query Methods
  "gov_getStats",
  "gov_getProposal",
  "gov_getProposals",
  "gov_getVotes",
  "nak_getProposals",
]);

function isMethodAllowed(method: string): boolean {
  if (!method || typeof method !== "string") return false;
  return STRICT_ALLOWED_METHODS.has(method);
}

function handleDevFallbackRpc(method: string, params: any[] = [], id: any = 1) {
  const baseTimestamp = 1787800000000;
  const currentElapsedSec = Math.max(0, Math.floor((Date.now() - baseTimestamp) / 1000));
  const currentBlockNumber = 1000 + Math.floor(currentElapsedSec / 3);

  switch (method) {
    case "eth_blockNumber":
      return { jsonrpc: "2.0", id, result: "0x" + currentBlockNumber.toString(16) };
    case "eth_chainId":
      return { jsonrpc: "2.0", id, result: "0x15079" }; // 86137
    case "net_version":
      return { jsonrpc: "2.0", id, result: "86137" };
    case "net_peerCount":
      return { jsonrpc: "2.0", id, result: "0x5" };
    case "net_listening":
    case "eth_mining":
      return { jsonrpc: "2.0", id, result: true };
    case "eth_syncing":
      return { jsonrpc: "2.0", id, result: false };
    case "eth_gasPrice":
    case "eth_maxPriorityFeePerGas":
      return { jsonrpc: "2.0", id, result: "0x3b9aca00" };
    case "eth_getBalance":
      return { jsonrpc: "2.0", id, result: "0x56bc75e2d63100000" };
    case "eth_getBlockByNumber": {
      const blockNum = params[0] === "latest" ? currentBlockNumber : parseInt(params[0], 16) || currentBlockNumber;
      return {
        jsonrpc: "2.0",
        id,
        result: {
          number: "0x" + blockNum.toString(16),
          hash: "0x" + blockNum.toString(16).padStart(64, "0"),
          parentHash: "0x" + (blockNum - 1).toString(16).padStart(64, "0"),
          miner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          gasLimit: "0x1c9c380",
          gasUsed: "0x15f90",
          timestamp: "0x" + Math.floor(Date.now() / 1000).toString(16),
          transactions: [],
        },
      };
    }
    case "nak_getStakeInfo":
    case "nakharax_getStakeInfo":
    case "popc_getStakeInfo":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          staked: "0.00",
          sNakBalance: "0.00",
          claimableReward: "0.000000",
          blocksPassed: 0,
          lastClaimBlock: currentBlockNumber,
          currentBlock: currentBlockNumber,
          unbondingQueue: [],
          apy: "8.40%",
        },
      };
    case "nak_getNodeTelemetry":
    case "nakharax_getNodeTelemetry":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          chain_id: "86137",
          chain_name: "nakharax-testnet",
          block_height: currentBlockNumber,
          peer_count: 7,
          tps: 18.4,
          mempool_size: 0,
          validators_active: 5,
          uptime_seconds: currentElapsedSec,
          consensus: "Proof of Practical Compute (PoPC BFT)",
          version: "v1.9.0-hydra-mainnet-ready",
          status: "HEALTHY_OPTIMAL",
        },
      };
    default:
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method '${method}' has no offline dev fallback implementation`,
        },
      };
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: Invalid JSON payload" } },
      { status: 400 }
    );
  }

  const { method, id = 1 } = body;

  // 1. Method Validation via Strict Allowlist
  if (!method || !isMethodAllowed(method)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method '${method}' is not allowed or unsupported by gateway proxy`,
        },
      },
      { status: 403 }
    );
  }

  // 2. Upstream Proxy Request with Isolated Timeout Controllers
  try {
    let res: Response | null = null;

    // First attempt: DEFAULT_RPC with independent timeout
    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 6000);
    try {
      res = await fetch(DEFAULT_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller1.signal,
      });
    } catch {
      res = null;
    } finally {
      clearTimeout(timeoutId1);
    }

    // Fallback attempt: LOCAL_RPC ONLY in development environment
    if (!res || !res.ok) {
      const isDev = process.env.NODE_ENV === "development";
      if (isDev && DEFAULT_RPC !== LOCAL_RPC) {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 4000);
        try {
          res = await fetch(LOCAL_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
            signal: controller2.signal,
          });
        } catch {
          res = null;
        } finally {
          clearTimeout(timeoutId2);
        }
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // 3. Fallback handling: ONLY when explicitly enabled for offline dev mode
    if (ENABLE_MOCK_FALLBACK) {
      const fallbackData = handleDevFallbackRpc(body.method, body.params, body.id);
      return NextResponse.json(fallbackData);
    }

    // Return honest JSON-RPC 2.0 error when upstream is unreachable
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: "Upstream Layer-1 RPC gateway unavailable or returned invalid response",
        },
      },
      { status: 502 }
    );
  } catch (error: any) {
    if (ENABLE_MOCK_FALLBACK) {
      const fallbackData = handleDevFallbackRpc(body?.method || "eth_blockNumber", body?.params || [], body?.id || 1);
      return NextResponse.json(fallbackData);
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message: `Internal RPC Proxy Error: ${error?.message || "Unknown error"}`,
        },
      },
      { status: 502 }
    );
  }
}
