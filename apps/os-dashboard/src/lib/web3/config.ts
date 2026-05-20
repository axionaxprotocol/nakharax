import { defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Define Custom Live Node
export const axionaxLocal = defineChain({
  id: 86137, // Adjusted to match the live node's likely chain id (assuming testnet) or fallback to 1337 if needed. We'll use 86137 based on previous knowledge of Axionax Testnet
  name: "Axionax Network",
  network: "axionax-net",
  nativeCurrency: {
    decimals: 18,
    name: "Axionax",
    symbol: "AXIO",
  },
  rpcUrls: {
    default: { http: ["https://rpc.axionax.org"] },
    public: { http: ["https://rpc.axionax.org"] },
  },
});

// DEV ONLY: Default burner account (Hardhat/Anvil Account #0)
// NEVER USE THIS ON MAINNET/TESTNET
export const DEV_BURNER_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const burnerAccount = privateKeyToAccount(DEV_BURNER_KEY);


