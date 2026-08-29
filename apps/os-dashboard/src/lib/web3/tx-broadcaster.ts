import { privateKeyToAccount } from "viem/accounts";
import { parseGwei } from "viem";

export interface BroadcastTxParams {
  to?: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  privateKey?: `0x${string}`;
}

export function encodeTxMemo(memo: string): `0x${string}` {
  const bytes = new TextEncoder().encode(memo);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `0x${hex}` as `0x${string}`;
}

/**
 * Sign and broadcast a transaction client-side using eth_sendRawTransaction
 * Guarantees zero private key leakage to RPC gateways.
 */
export async function broadcastRawTransaction(params: BroadcastTxParams): Promise<string> {
  if (!params.privateKey) {
    throw new Error("A wallet private key is required to authorize this transaction.");
  }

  if (params.data && !/^0x(?:[0-9a-fA-F]{2})*$/.test(params.data)) {
    throw new Error("Transaction data must be 0x-prefixed even-length hex.");
  }

  const account = privateKeyToAccount(params.privateKey);
  const nonceRes = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionCount",
      params: [account.address, "pending"],
      id: Date.now(),
    }),
  });

  if (!nonceRes.ok) {
    throw new Error(`Failed to fetch account nonce: RPC returned HTTP ${nonceRes.status}`);
  }

  const nonceJson = await nonceRes.json();
  if (nonceJson.error) {
    throw new Error(nonceJson.error.message || `Failed to fetch account nonce: RPC Error code ${nonceJson.error.code}`);
  }

  if (typeof nonceJson.result !== "string" || !/^0x[0-9a-fA-F]+$/.test(nonceJson.result)) {
    throw new Error("Failed to fetch account nonce: RPC returned an invalid nonce.");
  }

  const nonce = parseInt(nonceJson.result, 16);
  if (!Number.isSafeInteger(nonce) || nonce < 0) {
    throw new Error("Failed to fetch account nonce: nonce is outside the safe integer range.");
  }

  const rawTx = await account.signTransaction({
    to: params.to || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    value: params.value ?? BigInt(0),
    data: params.data,
    chainId: 86137,
    nonce: nonce,
    maxFeePerGas: parseGwei("2.5"),
    maxPriorityFeePerGas: parseGwei("1.5"),
    gas: BigInt(params.data ? 100000 : 21000),
  });

  const res = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [rawTx],
      id: Date.now(),
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || `RPC Error code: ${data.error.code}`);
  }

  if (!data.result || typeof data.result !== "string" || !data.result.startsWith("0x")) {
    throw new Error("RPC gateway did not return a valid on-chain transaction hash receipt.");
  }

  return data.result;
}
