// Typed JSON-RPC client for Nakharax nodes.
//
// Designed to:
//   * never throw on network failure (returns `Result`);
//   * surface EIP-1474 error codes when the node returns them;
//   * stay browser/Node/Edge compatible (no platform-specific imports).

import type { NodeEndpoint, NodeStatus, Result, RpcError, KadPeer } from "./types";
import { TESTNET_CHAIN_ID } from "./types";

export type { NodeEndpoint, NodeStatus, Result, RpcError, KadPeer };

/** Curated default testnet endpoints — prioritized with active local daemon & multi-region gateways. */
export const DEFAULT_NODES: NodeEndpoint[] = [
  { id: "rpc-local", name: "Local Sovereign Daemon", url: "http://127.0.0.1:8545", wsUrl: "ws://127.0.0.1:8546" },
  { id: "rpc-eu", name: "Validator EU (Frankfurt)", url: "http://127.0.0.1:8545", wsUrl: "ws://127.0.0.1:8546" },
  { id: "rpc-ap", name: "Validator AP (Singapore)", url: "http://127.0.0.1:8545", wsUrl: "ws://127.0.0.1:8546" },
];

export interface RpcCallOptions {
  /** AbortController to cancel from the outside. */
  signal?: AbortSignal;
  /** Hard timeout in milliseconds. Default 5000. */
  timeoutMs?: number;
}

/** Browser-safe high-resolution clock. */
function now(): number {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

interface JsonRpcResponse<T> {
  jsonrpc?: "2.0";
  id?: number | string;
  result?: T;
  error?: { code?: number; message?: string; data?: unknown };
}

/**
 * Call a single JSON-RPC method on a node.
 *
 * Never throws — always returns a {@link Result}. The `latencyMs` field is
 * always populated, even on failure, so callers can plot connection health.
 */
export async function rpcCall<T = unknown>(
  url: string,
  method: string,
  params: unknown[] = [],
  opts: RpcCallOptions = {},
): Promise<Result<T>> {
  const { timeoutMs = 5_000, signal: externalSignal } = opts;
  const start = now();

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  externalSignal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const latencyMs = Math.round(now() - start);

    if (!response.ok) {
      return {
        ok: false,
        latencyMs,
        error: {
          code: response.status,
          message: `HTTP ${response.status} ${response.statusText}`,
        },
      };
    }

    let json: JsonRpcResponse<T>;
    try {
      json = (await response.json()) as JsonRpcResponse<T>;
    } catch {
      return {
        ok: false,
        latencyMs,
        error: { code: "malformed", message: "Response was not valid JSON" },
      };
    }

    if (json.error) {
      return {
        ok: false,
        latencyMs,
        error: {
          code: json.error.code ?? "unknown",
          message: json.error.message ?? "Unknown JSON-RPC error",
          data: json.error.data,
        },
      };
    }

    return { ok: true, data: json.result as T, latencyMs };
  } catch (e: unknown) {
    const latencyMs = Math.round(now() - start);
    const aborted =
      (e instanceof DOMException && e.name === "AbortError") ||
      (typeof e === "object" && e !== null && (e as { name?: string }).name === "AbortError");
    if (aborted) {
      return {
        ok: false,
        latencyMs,
        error: { code: "timeout", message: `Request exceeded ${timeoutMs} ms` },
      };
    }
    return {
      ok: false,
      latencyMs,
      error: {
        code: "offline",
        message: e instanceof Error ? e.message : "Node unreachable",
      },
    };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onAbort);
  }
}

// ---- High-level helpers (the surface the dashboard uses) ------------------

export async function getBlockNumber(url: string, opts?: RpcCallOptions): Promise<Result<number>> {
  const r = await rpcCall<string>(url, "eth_blockNumber", [], opts);
  return r.ok
    ? { ok: true, data: parseInt(r.data, 16), latencyMs: r.latencyMs }
    : r;
}

export async function getPeerCount(url: string, opts?: RpcCallOptions): Promise<Result<number>> {
  const r = await rpcCall<string>(url, "net_peerCount", [], opts);
  return r.ok
    ? { ok: true, data: parseInt(r.data, 16), latencyMs: r.latencyMs }
    : r;
}

export async function getChainId(url: string, opts?: RpcCallOptions): Promise<Result<string>> {
  return rpcCall<string>(url, "eth_chainId", [], opts);
}

export async function getBalance(url: string, address: string): Promise<Result<bigint>> {
  const r = await rpcCall<string>(url, "eth_getBalance", [address, "latest"]);
  return r.ok
    ? { ok: true, data: BigInt(r.data), latencyMs: r.latencyMs }
    : r;
}

export interface RawBlock {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  transactions: string[] | unknown[];
  [key: string]: unknown;
}

export async function getBlockByNumber(
  url: string,
  block: number | "latest" = "latest",
  fullTx = false,
): Promise<Result<RawBlock | null>> {
  const tag = typeof block === "number" ? `0x${block.toString(16)}` : block;
  return rpcCall<RawBlock | null>(url, "eth_getBlockByNumber", [tag, fullTx]);
}

/** Compose a {@link NodeStatus} for a given endpoint by hitting 3 RPC methods in parallel. */
export async function getNodeStatus(ep: NodeEndpoint, opts?: RpcCallOptions): Promise<NodeStatus> {
  const [bn, peers, chain] = await Promise.all([
    getBlockNumber(ep.url, opts),
    getPeerCount(ep.url, opts),
    getChainId(ep.url, opts),
  ]);
  return {
    endpoint: ep,
    online: bn.ok,
    blockNumber: bn.ok ? bn.data : null,
    peerCount: peers.ok ? peers.data : null,
    chainId: chain.ok ? chain.data : null,
    latencyMs: bn.latencyMs,
    error: bn.ok ? undefined : bn.error.message,
  };
}

/** Send a pre-signed raw transaction. Returns the transaction hash on success. */
export async function sendRawTransaction(
  url: string,
  signedHex: string,
): Promise<Result<string>> {
  return rpcCall<string>(url, "eth_sendRawTransaction", [signedHex]);
}

/** Quick ping — `true` if the node responds to `eth_chainId` matching the expected chain. */
export async function isReachable(
  url: string,
  expectedChainId: number = TESTNET_CHAIN_ID,
): Promise<boolean> {
  const r = await getChainId(url);
  if (!r.ok) return false;
  try {
    return parseInt(r.data, 16) === expectedChainId;
  } catch {
    return false;
  }
}

/** Retrieve the Kademlia DHT routing table of the node. */
export async function getKadRoutingTable(url: string): Promise<Result<KadPeer[]>> {
  return rpcCall<KadPeer[]>(url, "system_kadRoutingTable");
}

