// Shared chain primitives. Keep this file dependency-free so it can be
// imported from the browser, the node, the OS dashboard, and Edge runtimes.

/** Chain identifier of the network the client is connected to. */
export const TESTNET_CHAIN_ID = 86137;
export const MAINNET_CHAIN_ID = 86150;
export const DEV_CHAIN_ID = 31337;

/** A node operator can label endpoints however they like. */
export interface NodeEndpoint {
  id: string;
  name: string;
  /** HTTP JSON-RPC URL, e.g. `http://127.0.0.1:8545` */
  url: string;
  /** Optional WebSocket URL, e.g. `ws://127.0.0.1:8546` */
  wsUrl?: string;
}

/**
 * Result wrapper used everywhere instead of throwing.
 *
 * Callers should pattern-match on the discriminator instead of relying on
 * try/catch — exceptions only fire for truly unrecoverable bugs.
 */
export type Result<T, E = RpcError> =
  | { ok: true; data: T; latencyMs: number }
  | { ok: false; error: E; latencyMs: number };

export interface RpcError {
  /** Human-readable summary. */
  message: string;
  /** EIP-1474 error code if returned by the node, otherwise a synthetic kind. */
  code: number | "timeout" | "offline" | "malformed" | "unknown";
  /** Optional structured payload from the JSON-RPC response. */
  data?: unknown;
}

/** Lightweight summary of a node — what the dashboard widgets render. */
export interface NodeStatus {
  endpoint: NodeEndpoint;
  online: boolean;
  blockNumber: number | null;
  peerCount: number | null;
  /** Hex chain ID exactly as returned by `eth_chainId`. */
  chainId: string | null;
  latencyMs: number;
  error?: string;
}

/** Information about a peer in the Kademlia DHT routing table. */
export interface KadPeer {
  peer_id: string;
  addresses: string[];
}

/** Comprehensive real-time telemetry metrics emitted by the node. */
export interface NodeTelemetry {
  chain_id: string;
  chain_name?: string;
  block_height: number;
  peer_count: number;
  tps: number;
  mempool_size: number;
  validators_active: number;
  uptime_seconds: number;
  consensus: string;
  version: string;
  status: string;
}

/** DeAI Job status record for compute lifecycle tracking. */
export interface DeAIJobStatus {
  job_id: string;
  status: "pending" | "assigned" | "completed" | "verified" | "disputed" | "cancelled" | string;
  proof_type?: string;
  confidence?: number;
  verified_at?: number;
}

/** Compute job submission parameters. */
export interface DeAIJobParams {
  jobType: number; // 0=Inference, 1=Training, 2=DataProcessing, 3=Custom
  rewardWei: string;
  timeoutSeconds: number;
  inputHash: string;
}

/** Model Context Protocol (MCP) Skill Descriptor for Universal Agent Tooling. */
export interface MCPSkillDescriptor {
  id: string;
  name: string;
  description: string;
  category: "analytics" | "security" | "finance" | "crawler" | "sandbox" | "scientific" | "general";
  providerAddress: string;
  feePerCallWei: string;
  rating: number;
  totalCalls: number;
  verified: boolean;
  endpointUrl: string;
  transport: "sse" | "websocket" | "stdio";
  schema: {
    input: Record<string, unknown>;
    output: Record<string, unknown>;
  };
}

/** Sovereign Agent On-Chain Identity */
export interface SovereignAgentIdentity {
  agentId: string;
  name: string;
  ownerAddress: string;
  balanceWei: string;
  reputationScore: number;
  activeSkills: string[];
  totalJobsExecuted: number;
  createdAt: number;
}

/** Agent MCP Tool Execution Receipt */
export interface AgentToolExecutionReceipt {
  executionId: string;
  skillId: string;
  callerAgentId: string;
  providerAddress: string;
  outputHash: string;
  costWei: string;
  latencyMs: number;
  timestamp: number;
  verifiedOnChain: boolean;
}

/** LoRA Domain Adapter Descriptor for Continual Learning */
export interface LoRAAdapterDescriptor {
  id: string;
  name: string;
  domain: "quant_trading" | "smart_contract_audit" | "medical_bio" | "formal_logic" | "chip_design" | "general";
  baseModel: string;
  rank: number; // e.g. 16, 32, 64
  alpha: number; // e.g. 32, 64, 128
  sizeMb: number;
  authorAddress: string;
  mergeCount: number;
  verifiedProofHash: string;
  rating: number;
  downloadUrl: string;
}

/** Weight Merging Job Configuration (TIES / DARE) */
export interface WeightMergeJobConfig {
  jobId: string;
  baseModelId: string;
  targetModelName: string;
  adapters: { adapterId: string; weight: number }[];
  algorithm: "ties" | "dare" | "linear_slerp";
  density: number; // 0.1 to 1.0 (for TIES)
  dropRate: number; // 0.1 to 0.9 (for DARE)
}

/** Cryptographic Merged Model Receipt */
export interface WeightMergeReceipt {
  receiptId: string;
  jobId: string;
  mergedModelHash: string;
  totalParametersMerged: number;
  algorithmUsed: string;
  gasCostNak: string;
  timestamp: number;
  verifiedOnChain: boolean;
}



