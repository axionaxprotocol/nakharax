# @nakharax/contracts
> **NakharaX Protocol & DeAI L1 Smart Contracts**

Smart contracts powering the **NakharaX DePIN & DeAI Compute Marketplace**, decentralized identity, LoRA weight registry, and native settlement rails on **Chain ID `86137`**.

---

## 📜 Contract Inventory

| Contract | File | Purpose | Security Patterns |
|---|---|---|---|
| **NakharaxToken** | [`contracts/NakharaxToken.sol`](contracts/NakharaxToken.sol) | Native $NAK ERC-20 Token (1 Trillion fixed supply, 18 decimals) | OpenZeppelin ERC20, `nonReentrant` |
| **FaucetTreasury** | [`contracts/FaucetTreasury.sol`](contracts/FaucetTreasury.sol) | Rate-limited testnet token distribution | Time-lock cooldown, daily caps |
| **JobMarketplaceStandalone** | [`contracts/JobMarketplaceStandalone.sol`](contracts/JobMarketplaceStandalone.sol) | PoPC compute job escrow, worker staking & settlement | ReentrancyGuard, Merkle proofs |
| **LoRAAdapterHub** | [`contracts/LoRAAdapterHub.sol`](contracts/LoRAAdapterHub.sol) | Decentralized LoRA model adapter registry & TIES/DARE weight fusion metadata | AccessControl, content-addressed IPFS hashes |
| **SovereignAgentRegistry** | [`contracts/SovereignAgentRegistry.sol`](contracts/SovereignAgentRegistry.sol) | Autonomous DeAI agent Decentralized Identity (DID) & capability manifest | ERC-725/DID compliant schemas |
| **TokenVesting** | [`contracts/TokenVesting.sol`](contracts/TokenVesting.sol) | 4-Year Linear Token Vesting & Cliff Lockup for Team/Investors ($NAK) | ReentrancyGuard, Cliff Timelock, Revocable/Non-revocable |
| **StarkFRIVerifier** | [`contracts/StarkFRIVerifier.sol`](contracts/StarkFRIVerifier.sol) | Cryptographic On-Chain STARK FRI Low-Degree Testing & Merkle Proof Verifier | Pure Math, Low-Degree Polynomial Testing, Multi-Query Batches |
| **PoPCStakingPool** | [`contracts/PoPCStakingPool.sol`](contracts/PoPCStakingPool.sol) | Liquid Staking ($sNAK), Validator Delegation, PoPC Rewards Injection & Unbonding | ReentrancyGuard, Cooldown Timelock, Liquid Derivative |

---

## ⚡ Quick Start

### 1. Installation
From the repository root:
```bash
pnpm install
```

### 2. Compile Contracts
```bash
pnpm --filter @nakharax/contracts compile
```

### 3. Run Hardhat Unit & Fuzz Tests
```bash
pnpm --filter @nakharax/contracts test
```

### 4. Deploy Contracts

**Local Hardhat Node:**
```bash
pnpm --filter @nakharax/contracts deploy:local
```

**NakharaX Public Testnet (Chain ID 86137):**
```bash
pnpm --filter @nakharax/contracts deploy:testnet
```

---

## 🌐 Testnet Deployments (Chain ID: `86137`)

Refer to [`deployed-contracts.json`](deployed-contracts.json) for live testnet addresses:

| Contract | Testnet Contract Address |
|---|---|
| `NakharaxToken` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `FaucetTreasury` | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| `JobMarketplaceStandalone` | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| `SovereignAgentRegistry` | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| `LoRAAdapterHub` | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |

---

## 🛡️ Security & Invariants

1. **Reentrancy Protection:** All fund transfers and escrow releases enforce OpenZeppelin's `ReentrancyGuard` (`nonReentrant`).
2. **Fixed Ceiling:** Token supply is hard-capped at $1,000,000,000,000 \times 10^{18}$ with no arbitrary mint capabilities.
3. **Decentralized Escrow:** Worker payouts and slashing are locked to Merkle-root verification and cryptographic dispute bounds ($5\sigma$).
