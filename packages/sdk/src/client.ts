// NakharaxClient - Unified TypeScript Client for Nakharax Protocol & DeAI Compute Layer

import {
  rpcCall,
  getBlockNumber,
  getPeerCount,
  getChainId,
  getBalance,
  getBlockByNumber,
  getNodeStatus,
  sendRawTransaction,
  getKadRoutingTable,
  DEFAULT_NODES,
} from "./rpc";
import type {
  NodeEndpoint,
  NodeStatus,
  Result,
  KadPeer,
  NodeTelemetry,
  DeAIJobStatus,
} from "./types";
import { TESTNET_CHAIN_ID } from "./types";

export interface ClientConfig {
  endpoint?: NodeEndpoint | string;
  wsUrl?: string;
  timeoutMs?: number;
}

/**
 * Main SDK Client for Nakharax Protocol.
 * Supports typed RPC operations, DeAI compute queries, and live telemetry log streaming.
 */
export class NakharaxClient {
  public readonly endpoint: NodeEndpoint;
  private readonly timeoutMs: number;

  constructor(config: ClientConfig = {}) {
    if (typeof config.endpoint === "string") {
      this.endpoint = {
        id: "custom-node",
        name: "Custom Node",
        url: config.endpoint,
        wsUrl: config.wsUrl,
      };
    } else if (config.endpoint) {
      this.endpoint = config.endpoint;
    } else {
      this.endpoint = DEFAULT_NODES[0] ?? {
        id: "rpc-public",
        name: "Public RPC (AU)",
        url: "https://rpc.nakharax.com",
      };
    }
    this.timeoutMs = config.timeoutMs ?? 5000;
  }

  /** Get the current block number */
  async getBlockNumber(): Promise<Result<number>> {
    return getBlockNumber(this.endpoint.url, { timeoutMs: this.timeoutMs });
  }

  /** Get current peer count */
  async getPeerCount(): Promise<Result<number>> {
    return getPeerCount(this.endpoint.url, { timeoutMs: this.timeoutMs });
  }

  /** Get network chain ID */
  async getChainId(): Promise<Result<string>> {
    return getChainId(this.endpoint.url, { timeoutMs: this.timeoutMs });
  }

  /** Get account balance in wei */
  async getBalance(address: string): Promise<Result<bigint>> {
    return getBalance(this.endpoint.url, address);
  }

  /** Get lightweight node status */
  async getNodeStatus(): Promise<NodeStatus> {
    return getNodeStatus(this.endpoint, { timeoutMs: this.timeoutMs });
  }

  /** Fetch rich real-time node telemetry */
  async getNodeTelemetry(): Promise<Result<NodeTelemetry>> {
    return rpcCall<NodeTelemetry>(this.endpoint.url, "nak_getNodeTelemetry", [], {
      timeoutMs: this.timeoutMs,
    });
  }

  /** Query DeAI compute job status */
  async getJobStatus(jobId: string): Promise<Result<DeAIJobStatus>> {
    return rpcCall<DeAIJobStatus>(this.endpoint.url, "nak_getJobStatus", [jobId], {
      timeoutMs: this.timeoutMs,
    });
  }

  /** Broadcast raw signed transaction */
  async sendRawTransaction(signedHex: string): Promise<Result<string>> {
    return sendRawTransaction(this.endpoint.url, signedHex);
  }

  /** Query Kademlia DHT routing table */
  async getKadRoutingTable(): Promise<Result<KadPeer[]>> {
    return getKadRoutingTable(this.endpoint.url);
  }

  /**
   * Connect to WebSocket log stream.
   * Returns a cleanup function that closes the connection when called.
   */
  subscribeWsLogs(
    onMessage: (logLine: string) => void,
    onError?: (error: unknown) => void,
  ): () => void {
    const wsUrl = this.endpoint.wsUrl || this.endpoint.url.replace(/^http/, "ws") + "/logs";
    
    if (typeof WebSocket === "undefined") {
      console.warn("WebSocket is not supported in this runtime environment.");
      return () => {};
    }

    try {
      const socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        if (typeof event.data === "string") {
          onMessage(event.data);
        }
      };

      socket.onerror = (err) => {
        if (onError) onError(err);
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    } catch (e) {
      if (onError) onError(e);
      return () => {};
    }
  }
}
