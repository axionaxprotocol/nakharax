import { defineChain } from "viem";

/**
 * NakharaX L1 Testnet Chain Configuration
 * Chain ID: 86137
 */
export const nakharaxTestnet = defineChain({
  id: 86137,
  name: "NakharaX Testnet",
  network: "nakharax-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "NakharaX Testnet Token",
    symbol: "tNAK",
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.nakharax.com"] },
    public: { http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.nakharax.com"] },
  },
  blockExplorers: {
    default: { name: "NakharaX Explorer", url: "https://explorer.nakharax.com" },
  },
});

export const nakharaxLocal = nakharaxTestnet;



