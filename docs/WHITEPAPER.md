# Nakharax Protocol — Whitepaper

**Affordable, Verifiable Compute for Science and AI**

|              |                                         |
| ------------ | --------------------------------------- |
| **Version**  | 3.4 (Pre-Mainnet Genesis Edition)       |
| **Date**     | September 2026                          |
| **Status**   | Live Production Testnet (Chain ID `86137` / `0x15079`) \| Mainnet Target (`86150`) |
| **Token**    | $NAK (18 Decimals) \| Testnet Token: $tNAK (Faucet: 100 $tNAK / Claim) |
| **Block Cadence** | **1.00 second** (1,000ms Pipelined Fast-Finality BFT) |
| **Throughput** | Up to ~1,428 TPS (Transfer at 30M Gas Limit / 21k Gas) |
| **Website**  | [nakharax.com](https://nakharax.com) \| [app.nakharax.com](https://app.nakharax.com) |
| **License**  | AGPLv3 (core) / MIT (tooling & SDK)     |

---

## Abstract

Nakharax is a DePIN (Decentralized Physical Infrastructure Network) that turns idle consumer hardware — PCs, Macs, Raspberry Pis — into a global compute grid for embarrassingly-parallel science and AI workloads. The protocol uses **Proof of Practical Compute (PoPC)** — a consensus mechanism that verifies compute results through statistical sampling combined with **STARK FRI Low-Degree Extension (1,024 Constraints)** rather than full re-execution — to provide trustless verification at O(s) cost instead of O(n). 

The NAK token serves as the settlement and incentive layer: clients pay NAK for compute jobs, workers earn NAK for executing them, and validators stake NAK to secure the verification process. Operating at a **1.00-second block cadence**, the protocol provides sub-second finality tailored for real-time agentic micro-settlements (A2A) via the Model Context Protocol (MCP).

The protocol is implemented, tested, and running on a live production testnet with active Genesis Validators across Europe, North America, and Asia-Pacific. This paper describes the architecture as built, cites measured performance from the codebase, and distinguishes between what is shipping and what remains on the roadmap.

---

## 1. Introduction

### 1.1 The Problem

Scientific and AI compute is expensive and centralized. A researcher running a large-scale Monte Carlo simulation, a batch of parameter sweeps, or thousands of inference jobs faces two options: rent cloud compute at $1–$3/GPU-hour from a hyperscaler, or wait weeks for shared university HPC time. Meanwhile, billions of consumer devices sit idle most of the day.

This is not a new observation. Volunteer computing projects proved the model works:

| Project | Peak Compute | Model |
|---------|-------------|-------|
| Folding@home | ~2.4 exaFLOPS (2020) | Volunteer, unpaid |
| BOINC/SETI@home | ~1.2 PFLOPS sustained | Volunteer, unpaid |
| Einstein@home | ~4.5 PFLOPS | Volunteer, unpaid |

These projects ran for 20+ years on commodity hardware. The limitation was always incentive alignment (volunteers, not paid workers) and result verification (trust the contributor, or re-execute). Nakharax solves both: **payment via NAK** creates a sustainable economic incentive, and **PoPC consensus** provides cryptographic verification without full re-execution.

### 1.2 Data Sovereignty

A second, immediate use case requires no marketplace at all. Regulations such as PDPA (Thailand), GDPR (EU), and sector-specific data residency rules often prohibit sending data to foreign clouds for processing. Running compute on a node the user owns — in their own country, on their own hardware — satisfies these constraints by default. This use case ships first because it requires no trustless verification of strangers' results.

### 1.3 Scope — What Nakharax Is Not

Nakharax targets **embarrassingly-parallel** workloads: tasks where each unit of work is independent and can run on a separate machine without inter-node communication. Examples include parameter sweeps, Monte Carlo ensembles, batch inference, rendering, and sensitivity analysis.

Nakharax does **not** target tightly-coupled HPC (e.g., a single N-body simulation requiring NVLink interconnect, or distributed training of a single large model across homes). These workloads require low-latency, high-bandwidth interconnects that consumer hardware and residential networks cannot provide. The protocol serves the researcher by running their **thousands of independent runs**, not one coupled job.

---

## 2. Architecture Overview

The protocol has four integrated layers:

```
┌─────────────────────────────────────────────────┐
│       Agentic & MCP Discovery Layer (TS)        │
│   @nakharax/mcp-server · Sub-ms Tool Search     │
├─────────────────────────────────────────────────┤
│              Compute Layer (Python)              │
│   Worker nodes, job execution, Docker sandbox    │
│   HAL (CUDA, Metal, ROCm, Hailo-10H NPU)        │
│   STARK FRI Solver (1,024 Constraints)          │
├─────────────────────────────────────────────────┤
│            Marketplace Layer (Solidity)          │
│   Job escrow, pricing (PPC), worker selection    │
│   (ASR Top-K VRF), settlement, reputation       │
├─────────────────────────────────────────────────┤
│              Chain Layer (Rust & L1 RPC)         │
│   PoPC consensus (1.0s Cadence), Redb/RocksDB,   │
│   7-Sentinels Shield, SERAPH Zero-MEV Mempool   │
└─────────────────────────────────────────────────┘
```

### 2.1 Chain Layer & Canonical Block Structure

The chain layer is a custom Layer-1 blockchain implemented in Rust (~18 crates) accompanied by a high-throughput production state daemon. It provides EVM-compatible JSON-RPC on port `8545`, native staking, on-chain DAO governance, and serves as the settlement rail for the compute marketplace.

**Key design decision:** The chain operates as a **receipt rail** with a **1.0-second pipelined block cadence**. The block gas limit is configured at 30,000,000 gas per block, delivering up to **~1,428 native transfer TPS** (30M / 21,000 gas per transfer), ensuring that chain throughput never constrains off-chain worker verification and settlement.

According to `core/blockchain/src/lib.rs`, every block committed to the chain contains:

```rust
pub struct Block {
    pub number: u64,               // Monotonically increasing block height
    pub hash: [u8; 32],            // Blake3 cryptographic block hash
    pub parent_hash: [u8; 32],     // Blake3 hash of previous block (chain lineage)
    pub timestamp: u64,            // Unix epoch in milliseconds
    pub proposer: String,          // Address of the consensus validator proposing the block
    pub transactions: Vec<Tx>,     // Native & EVM transactions with Ed25519 signatures
    pub state_root: [u8; 32],      // Merkle/Trie root of global account and contract state
    pub gas_used: u64,             // Gas consumed (Base fee 1.2 Gwei via EIP-1559)
    pub gas_limit: u64,            // Block gas ceiling (30,000,000 gas)
    // --- PoPC & DeAI Extensions ---
    pub compute_proofs: Vec<Proof>,// STARK FRI ZKP Receipts verifying off-chain AI tasks
    pub validator_signatures: Vec, // BFT consensus signatures from active validators (2/3+ Quorum)
}
```

### 2.2 Compute Layer

Worker nodes are Python processes that connect to the blockchain via JSON-RPC, poll for available jobs, execute them in Docker sandboxes with resource limits (CPU, RAM, timeout), and submit results with Merkle proofs and STARK FRI polynomials for PoPC verification.

Supported compute backends:

| Backend | Hardware | Status |
|---------|----------|--------|
| SILICON (CPU/GPU) | PC, server, Mac, Jetson, AMD/NVIDIA (CUDA, ROCm, Metal) | Shipping |
| NPU | Hailo-8 & Hailo-10H via Raspberry Pi AI HAT+ & Orange Pi | Shipping |

### 2.3 Marketplace Layer

The compute marketplace is managed by smart contracts (`JobMarketplaceStandalone.sol`) regulating the full job lifecycle:

```
Client locks NAK in escrow
    → ASR selects worker (Top-K VRF, K=64, max 12.5% cap)
    → Worker executes in Docker sandbox
    → Worker submits result + Merkle root + STARK FRI proof
    → PoPC validators verify a sample of output chunks (s=1000)
    → Payment released (or slashing if fraud detected)
    → Protocol takes 5% commission → DAO Treasury
```

---

## 3. Proof of Practical Compute (PoPC)

### 3.1 Motivation

Full re-execution requires the verifier to redo 100% of the computation. For a 10-hour AI inference batch, this means 10 hours of verification compute. PoPC reduces this to statistical sampling combined with STARK polynomial testing.

### 3.2 Mechanism

Given a compute job that produces `n` output chunks:

1. **Commit:** The worker constructs a Merkle tree over all `n` output chunks and publishes the Merkle root on-chain.
2. **Challenge:** An ECVRF seed (bound to the block hash) generates a deterministic set of `s` sample indices via SHA3 hash chain. Indices are deduplicated. The worker cannot predict which chunks will be sampled before committing the root.
3. **Verify:** For each sampled index `i`, the verifier:
   - Re-executes chunk `i` independently
   - Checks that the worker's output for chunk `i` matches via Merkle proof against the committed root
   - If any sampled chunk fails, the worker's stake is slashed
4. **Finalize:** The block containing the verification result is finalized with pipelined 1.0s BFT confirmation (≥ 2/3 of active validators).

### 3.3 Detection Probability

If a fraction `f` of the worker's output chunks are fraudulent, the probability of detecting fraud with `s` samples is:

```
P(detect) = 1 - (1 - f)^s
```

With parameter `s = 1000`:

| Fraud rate `f` | Detection probability |
|----------------|----------------------|
| 1% | 99.995% (≥ 5σ confidence) |
| 0.1% | 63.2% |
| 5% | ≈ 100% |
| 10% | ≈ 100% |

The minimum confidence threshold is set at 0.99. A rational adversary corrupting ≥ 1% of outputs is caught with mathematical certainty.

### 3.4 Measured Verification Benchmarks

| Operation | Measured time |
|-----------|---------------|
| `generate_challenge` (1,000 samples) | ~437 µs |
| `verify_proof` (single Merkle proof) | ~10.9 ns |
| `ed25519_verify` (single signature) | ~35.6 µs |
| `stark_fri_solve` (1,024 constraints) | 1.96 ms |

---

## 4. Cyber Defense Architecture: 7-Sentinels & SERAPH-VX

Nakharax incorporates an autonomous defense grid:

```
+-----------------------------------------------------------------------------------------+
|                                7 Autonomous Sentinels                                   |
+-----------------------------------------------------------------------------------------+
|  1. AION-VX      ──> Microsecond time-drift telemetry & temporal anchoring              |
|  2. SERAPH-VX    ──> Zero-MEV mempool encryption & network intrusion prevention         |
|  3. ORION-VX     ──> Statistical anomaly detection & PoPC receipt verification          |
|  4. DIAOCHAN-VX  ──> Dynamic SLA/reputation scoring for ASR routing                     |
|  5. VULCAN-VX    ──> Hardware spec verification & sandbox isolation attestation         |
|  6. THEMIS-VX    ──> On-chain automated dispute resolution & stake slashing            |
|  7. NOESIS-VX    ──> Global network telemetry & decentralized parameter tuning          |
+-----------------------------------------------------------------------------------------+
```

- **Prop Risk Shield Engine:** Institutional-grade kill-switch operating at **0.82 ms** (SLA < 1.0 ms).
- **SERAPH-VX Zero-MEV Mempool:** Encrypts incoming transactions as `EncryptedEnvelope` until block proposal, eliminating front-running, sandwich attacks, and MEV extraction.

---

## 5. Network Architecture & Live Genesis Cluster

### 5.1 Canonical 3-Node Genesis Cluster (Live Production Testnet)

The live testnet (`Chain ID 86137`) is secured by three geographically distributed Genesis Validators, each holding an equal 33.3% consensus voting weight:

1. 🇩🇪 **EU-DE-01 (Frankfurt Master Ingress · VPS-01)**:
   - **Address**: `0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb`
   - **Role**: Genesis Validator #1, Master Ingress, Public RPC (`https://rpc.nakharax.com`), Testnet Faucet
   - **Metrics**: 33.3% Weight \| 99.99% Live Uptime \| 3.5% Commission
2. 🇺🇸 **NA-US-01 (Virginia Genesis Validator 01 · VPS-02)**:
   - **Address**: `0x1a99805b71e0530f774e6b69546cd64e03fc3c33`
   - **Role**: Genesis Validator #2 & High-Compute DeAI Cluster (NVIDIA A40, 48GB VRAM)
   - **Metrics**: 33.3% Weight \| 99.98% Live Uptime \| 4.0% Commission
3. 🇸🇬 **AP-SG-01 (Singapore Genesis Validator 02 · VPS-03)**:
   - **Address**: `0x8a6bff3cedc3d1893740f2453424cd8be2965f1c`
   - **Role**: Genesis Validator #3 & Asia-Pacific Ingress
   - **Metrics**: 33.3% Weight \| 99.99% Live Uptime \| 3.5% Commission

### 5.2 Canonical 7-Node Global Mesh Topology (Target)

1. 🇩🇪 **Frankfurt, DE (`EU-DE-01`)**: Genesis Validator #1
2. 🇦🇺 **Sydney, AU (`AP-AU-01`)**: Master Ingress & Public RPC / Faucet
3. 🇺🇸 **Virginia, US (`NA-US-01`)**: DeAI GPU Worker (NVIDIA A40, 48GB VRAM)
4. 🇯🇵 **Tokyo, JP (`AP-JP-01`)**: DeAI GPU Worker (NVIDIA RTX 4090, 24GB VRAM)
5. 🇸🇬 **Singapore, SG (`AP-SG-01`)**: Genesis Validator #2
6. 🇬🇧 **London, UK (`EU-UK-01`)**: Hydra ZK State & FRI Polynomial Auditor
7. 🇹🇭 **Localhost Rig (`LOC-TH-01`)**: Local Sovereign Master Live Host

---

## 6. Tokenomics & Citadel Liquid Staking

### 6.1 Token Overview

| Parameter | Value |
|-----------|-------|
| **Symbol** | $NAK (Testnet: $tNAK) |
| **Total Supply** | 1,000,000,000,000 (1 Trillion Fixed Cap) |
| **Decimals** | 18 decimals |
| **Block Cadence** | 1.00s |
| **Faucet Dispense** | 100 $tNAK per claim |

### 6.2 Citadel Liquid Staking ($sNAK 8.40% APY)

- **Liquid Staking:** Users stake $tNAK to mint liquid yield-bearing **$sNAK** at an initial 1:1 parity.
- **PoPC Block Reward APY:** Yield compounds in real-time at **8.40% Net APY**, streaming continuously with block production.
- **Unbonding Cooldown Queue:** Unstaking triggers a 300-second testnet cooldown queue with live second-by-second countdown, unlocking the "Claim $tNAK" redemption action immediately upon maturity.

### 6.3 Allocation

| Allocation | % | Amount ($NAK) | Vesting |
|------------|---|---------------|---------|
| Ecosystem Reserve & Staking | 45% | 450,000,000,000 | Staking rewards, grants, partnerships |
| Team & Advisors | 20% | 200,000,000,000 | 4-year linear (1-year cliff) |
| Early Investors | 10% | 100,000,000,000 | 2-year linear (6-month cliff) |
| Public Sale | 10% | 100,000,000,000 | Immediate unlock at TGE |
| Foundation Treasury | 8% | 80,000,000,000 | 3-year linear (quarterly unlocks) |
| Community Airdrops & Testnet | 5% | 50,000,000,000 | Faucet & developer distribution |
| Liquidity Provision | 2% | 20,000,000,000 | Immediate DEX/CEX liquidity |

### 6.4 Fee Flow & Deflationary Burn

```
Compute Job Fee = Base Price (PPC) × Job Size + Protocol Fee (5%)
├── 95% ──> Direct payout to Worker Node
└── 5%  ──> DAO Treasury
Gas Fees:
├── 50% ──> Permanently burned (Deflationary)
└── 50% ──> DAO Treasury for protocol R&D
```

---

## 7. Empirical Performance Benchmarks

Measured stress-test results across the live production cluster:

| Evaluated Metric | Industry Benchmark | Nakharax Protocol Live | Performance Delta |
| --- | --- | --- | --- |
| **RPC Ingress P50** | Infura / Alchemy: 45.0 ms | **1.92 ms** (DragonflyDB Hot-Cache) | ⚡ **23.4x faster than Infura** |
| **RPC Ingress P95** | QuickNode RPC: 120.0 ms | **2.36 ms** | ⚡ **50.8x faster than QuickNode** |
| **Throughput (5k Users)** | Aptos Host: 400.0 RPS | **914.5 req/sec** (99.4% Success) | 💥 **2.28x higher than Aptos Host** |
| **Block Cadence** | Ethereum L1: ~12.0 – 15.0s | **1.000s** (Fast-Finality BFT) | ⏩ **12–15x faster than Ethereum L1** |
| **Transfer Throughput** | Bitcoin (7 TPS) / Eth (15 TPS) | **~1,428 TPS** (30M Gas / 21k Gas) | 🚀 **Sub-second Agentic Settlement** |
| **Compute Cost** | Cloud Hyperscalers ($1–$3/hr) | **75% – 80% cheaper** | 💰 **Direct node-operator rewards** |

---

## 8. Roadmap

```
[Phase 1: Own-Your-Node & Canonical Genesis Testnet (Complete ✅)] 
 ├── Rust Core 18 Crates + libp2p Mesh
 ├── Testnet Chain ID 86137 + 1.0s Fast-Finality Cadence
 ├── Live Production Genesis Cluster (Frankfurt, Virginia, Singapore)
 ├── Citadel Liquid Staking Desk ($sNAK 8.40% APY, 300s Unbonding Cooldown)
 ├── Universal MCP Server Integration (@nakharax/mcp-server)
 └── Monolith MK-I / MK-II Edge NPU Integration

[Phase 2: Closed/Curated Marketplace (Q3–Q4 2026)]
 ├── JobMarketplace.sol deployment on Testnet
 ├── Full 7-Node Global Mesh DHT Topology expansion
 ├── External security audit by tier-1 firm
 └── Mainnet Genesis Launch (Chain ID: 86150) & $NAK TGE

[Phase 3: Open Global Grid & Multi-Region Federation (2027+)]
 ├── PoPC + TEE Non-Deterministic Compute Verification
 ├── Cross-Border Multi-Region Federation
 └── Monolith MK-III Photonic Proof-of-Light R&D
```

---

## References

1. Nakharax Protocol Source Repository — [github.com/axionaxprotocol/nakharax](https://github.com/axionaxprotocol/nakharax)
2. Protocol Reality Map — `docs/REALITY_MAP.md`
3. Tokenomics Specification — `docs/architecture/TOKENOMICS.md`
4. Cyber Defense Architecture via DeAI — `docs/CYBER_DEFENSE.md`
5. Empirical Benchmark & Verification Report — `docs/EMPIRICAL_BENCHMARK_REPORT.md`
