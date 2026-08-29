import { generateEphemeralKeypair } from "../crypto-vault";
import { privateKeyToAccount } from "viem/accounts";
import { parseGwei } from "viem";

export interface BroadcastTxParams {
  to?: `0x${string}`;
  value?: bigint;
  data?: `0x${string}`;
  privateKey?: `0x${string}`;
}

/**
 * Sign and broadcast a transaction client-side using eth_sendRawTransaction
 * Guarantees zero private key leakage to RPC gateways.
 */
export async function broadcastRawTransaction(params: BroadcastTxParams): Promise<string> {
  const pk = params.privateKey || generateEphemeralKeypair().privateKey;
  const account = privateKeyToAccount(pk);

  let nonce = 0;
  try {
    const nonceRes = await fetch("/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionCount",
        params: [account.address, "pending"],
        id: 1,
      }),
    });
    const nonceJson = await nonceRes.json();
    if (nonceJson.result) nonce = parseInt(nonceJson.result, 16);
  } catch {
    /* fallback nonce 0 */
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
