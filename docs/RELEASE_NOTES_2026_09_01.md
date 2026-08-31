# 🚀 NakharaX Protocol — Genesis Public Testnet Release Notes
**Release Version:** `v1.9.0-testnet`  
**Network Identity:** NakharaX L1 Public Testnet  
**Chain ID:** `86137` (`0x15079`)  
**Launch Date:** September 1, 2026 (07:00 BKK / 00:00 UTC)  
**Consensus Engine:** Proof of Practical Compute (PoPC) — 3.0s Deterministic Block Cadence  

---

## 🌟 Overview & Mission

We are proud to officially launch the **NakharaX L1 Public Testnet**, the sovereign decentralized artificial intelligence (DeAI) compute and verification blockchain designed for ultra-low-latency zero-knowledge AI inference and verifiable GPU execution.

---

## 🌐 Network Configuration & Connection Details

| Configuration Field | Network Parameter |
| :--- | :--- |
| **Network Name** | NakharaX Public Testnet |
| **New RPC URL** | `https://rpc.nakharax.com` |
| **Direct Validator Fallback** | `http://46.250.244.4:8545` |
| **Chain ID** | `86137` (Hex: `0x15079`) |
| **Currency Symbol** | `$tNAK` |
| **Block Explorer** | `https://explorer.nakharax.com` |
| **Web OS Terminal** | `https://app.nakharax.com` |
| **Public Faucet API** | `https://faucet.nakharax.com` (100 $tNAK / 24h) |

---

## 🦊 1-Click MetaMask / Web3 Wallet Setup

Users can instantly add NakharaX Testnet to MetaMask or Rabby by navigating to [`https://app.nakharax.com`](https://app.nakharax.com) and clicking **"Add NakharaX Testnet"**.

For manual wallet configuration guides, refer to:
- [`docs/web/web-integration/GETTING_STARTED.md`](web/web-integration/GETTING_STARTED.md)
- [`docs/web/web-integration/ADD_TOKEN_TO_METAMASK.md`](web/web-integration/ADD_TOKEN_TO_METAMASK.md)
- [`docs/web/web-integration/JOIN_TESTNET.md`](web/web-integration/JOIN_TESTNET.md)

---

## 🤖 GPU Worker & Node Operator Onboarding

Community miners and compute providers can join the decentralized worker swarm with 1 command:

```bash
# Run Turnkey DeAI GPU Worker
docker run -d --gpus all \
  --name nakharax-worker \
  --restart unless-stopped \
  -e RPC_URL="https://rpc.nakharax.com" \
  -e WORKER_PRIVATE_KEY="0x..." \
  -e STAKE_AMOUNT="1000" \
  nakharax/deai-worker:latest
```

Operator Guides:
- Worker Setup: [`docs/guides/WORKER_SETUP.md`](guides/WORKER_SETUP.md)
- Validator Setup: [`docs/guides/VALIDATOR_SETUP.md`](guides/VALIDATOR_SETUP.md)
- Node Integration: [`docs/web/web-integration/NODE_INTEGRATION.md`](web/web-integration/NODE_INTEGRATION.md)

---

## 💎 Testnet Tokenomics & Core Smart Contracts

- **Native Testnet Token:** `$tNAK` (Fixed initial genesis supply: 1,000,000,000,000)
- **Liquid Staked Token:** `$sNAK` (8.40% APY real-time streaming reward)
- **EIP-1559 Fee Burn:** 50% base fee burned permanently on-chain
- **DeAI Execution Proofs:** Zero-Knowledge STARK-FRI-1024 constraint verifier

### Core Contract Registry
- `NakharaxToken.sol` — ERC-20 Native Token
- `PoPCStakingPool.sol` — Liquid Staking & Yield Accumulator
- `JobMarketplaceStandalone.sol` — Compute Escrow & Worker Staking
- `FaucetTreasury.sol` — Testnet Faucet Controller
- `StarkFRIVerifier.sol` — STARK FRI ZKP Verifier
- `LoRAAdapterHub.sol` — Merkle Weight Fusion Registry
- `SovereignAgentRegistry.sol` — Decentralized Identity & Agent Registry

---

## 🛡️ Security & Support

- Technical Documentation: [`docs/README.md`](README.md)
- Runbook & Deployment Plan: [`docs/ops/1_SEP_GENESIS_RUNBOOK.md`](ops/1_SEP_GENESIS_RUNBOOK.md)
- Report Issues & Inquiries: Submit tickets via GitHub Issues or contact security@nakharax.com.
