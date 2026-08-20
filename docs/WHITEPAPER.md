# Nakharax Protocol — Whitepaper

**Affordable, Verifiable Compute for Science and AI**

|              |                                         |
| ------------ | --------------------------------------- |
| **Version**  | 3.0                                     |
| **Date**     | July 2026                               |
| **Status**   | Testnet (Chain ID 86137)                |
| **Token**    | NAK                                     |
| **Website**  | [nakhara.io](https://nakhara.io)        |
| **License**  | AGPLv3 (core) / MIT (tooling)           |

---

## Abstract

Nakharax is a DePIN (Decentralized Physical Infrastructure Network) that turns idle consumer hardware — PCs, Macs, Raspberry Pis — into a global compute grid for embarrassingly-parallel science and AI workloads. The protocol uses **Proof of Probabilistic Checking (PoPC)** — a consensus mechanism that verifies compute results through statistical sampling rather than full re-execution — to provide trustless verification at O(s) cost instead of O(n). The NAK token serves as the settlement and incentive layer: clients pay NAK for compute jobs, workers earn NAK for executing them, and validators stake NAK to secure the verification process. The blockchain is the trust and settlement rail, not the product; the product is cheap, verifiable compute.

The protocol is implemented, tested, and running on a live testnet. This paper describes the architecture as built, cites measured performance from the codebase, and distinguishes between what is shipping and what remains on the roadmap.

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

The protocol has three layers:

```
┌─────────────────────────────────────────────────┐
│              Compute Layer (Python)              │
│   Worker nodes, job execution, Docker sandbox    │
│   AI inference (PyTorch, ONNX, Hailo NPU)       │
├─────────────────────────────────────────────────┤
│            Marketplace Layer (Solidity)           │
│   Job escrow, pricing (PPC), worker selection    │
│   (ASR + VRF), settlement, reputation            │
├─────────────────────────────────────────────────┤
│              Chain Layer (Rust)                   │
│   PoPC consensus, block production, staking,     │
│   governance, P2P (libp2p), EVM execution        │
└─────────────────────────────────────────────────┘
```

### 2.1 Chain Layer

The chain layer is a custom Layer-1 blockchain implemented in Rust (~19 crates). It provides EVM-compatible smart contract execution, native staking and governance, and serves as the settlement rail for the compute marketplace.

**Key design decision:** The chain is a **receipt rail**. It records job commitments, result hashes, and payment settlements. The actual compute happens off-chain on worker nodes. The chain does not need to be a fast L1 — throughput is governed by block gas limit, currently configured at ~286 TPS on testnet (30M gas per block, 5-second block time, 21,000 gas per transfer). This is sufficient for settlement transactions; the compute throughput scales horizontally with worker count, independent of chain TPS.

### 2.2 Compute Layer

Worker nodes are Python processes that connect to the blockchain via JSON-RPC, poll for available jobs, execute them in Docker sandboxes with resource limits (CPU, RAM, timeout), and submit results with Merkle proofs for PoPC verification.

Supported compute backends:

| Backend | Hardware | Status |
|---------|----------|--------|
| SILICON (CPU/GPU) | PC, server, Mac, Jetson, AMD/NVIDIA | Shipping |
| NPU | Hailo-10H via Raspberry Pi AI HAT+ | Shipping |

### 2.3 Marketplace Layer

The compute marketplace is a smart contract (`JobMarketplaceStandalone.sol`) that manages the job lifecycle:

```
Client locks NAK in escrow
    → ASR selects worker (VRF + reputation)
    → Worker executes in Docker sandbox
    → Worker submits result + Merkle root
    → PoPC validators verify a sample of output chunks
    → Payment released (or slashing if fraud detected)
    → Protocol takes 5% commission → DAO Treasury
```

**Current status:** The contract is written and matches the worker ABI. It defaults to mock mode on testnet; deployment to a live on-chain address is pending.

---

## 3. Proof of Probabilistic Checking (PoPC)

### 3.1 Motivation

Full re-execution — the approach used by Ethereum's optimistic rollups — requires the verifier to redo 100% of the computation. For a 10-hour AI inference batch, this means 10 hours of verification compute. PoPC reduces this to statistical sampling.

### 3.2 Mechanism

Given a compute job that produces `n` output chunks:

1. **Commit:** The worker constructs a Merkle tree over all `n` output chunks and publishes the Merkle root on-chain.

2. **Challenge:** A VRF seed (bound to the block hash) generates a deterministic set of `s` sample indices via SHA3 hash chain. Indices are deduplicated. The worker cannot predict which chunks will be sampled before committing the root.

3. **Verify:** For each sampled index `i`, the verifier:
   - Re-executes chunk `i` independently
   - Checks that the worker's output for chunk `i` matches via Merkle proof against the committed root
   - If any sampled chunk fails, the worker's stake is slashed

4. **Finalize:** The block containing the verification result is finalized when ≥ 2/3 of active validators send `BlockConfirmation` messages.

### 3.3 Detection Probability

If a fraction `f` of the worker's output chunks are fraudulent, the probability of detecting fraud with `s` samples is:

```
P(detect) = 1 - (1 - f)^s
```

With the current parameter `s = 1000`:

| Fraud rate `f` | Detection probability |
|----------------|----------------------|
| 1% | 99.995% |
| 0.1% | 63.2% |
| 5% | ≈ 100% |
| 10% | ≈ 100% |

The minimum confidence threshold is set at 0.99. A rational adversary who corrupts ≥ 1% of outputs is detected with near-certainty. The false-pass penalty is 500 basis points (5%) of the validator's stake.

### 3.4 Verification Cost

PoPC verification is O(s) — constant with respect to job size. The verifier re-executes `s` chunks regardless of whether the job has 1,000 or 1,000,000 total chunks. On the current implementation:

| Operation | Measured time |
|-----------|---------------|
| `generate_challenge` (1,000 samples) | ~437 µs |
| `verify_proof` (single Merkle proof) | ~10.9 ns |
| `ed25519_verify` (single signature) | ~35.6 µs |

These are per-operation timings from `cargo bench` on the live codebase. The cryptographic layer is not the bottleneck; the cost is dominated by re-executing the sampled compute chunks.

### 3.5 Open Problem — Non-Deterministic Compute

PoPC assumes that re-executing a chunk produces the same output. This holds for deterministic workloads (integer arithmetic, fixed-seed simulations, rendering). It does **not** hold for floating-point AI inference across different hardware, where GPU non-determinism can produce bitwise-different outputs.

Approaches under investigation:

- **Deterministic inference mode:** Disable non-deterministic CUDA operations; accept performance penalty
- **Tolerance-based checking:** Accept outputs within an ε-ball rather than requiring bitwise match
- **Trusted Execution Environments (TEE):** Hardware attestation removes the need for re-execution
- **Optimistic fraud proofs:** Assume correctness; challenge window with bond

This is the hardest unsolved problem in the protocol design. The product sequencing (Section 7) is structured so that deployment phases requiring trustless verification of non-deterministic compute come last.

---

## 4. Cryptographic Primitives

| Primitive | Library | Usage |
|-----------|---------|-------|
| Ed25519 | `ed25519-dalek` | Transaction signing, node identity |
| SHA3-256 | `sha3` | Block hash, state root, PoPC sample generation |
| Blake2s-256 | `blake2` | Transaction hash, address derivation |
| Blake2b-512 | `blake2` | Data integrity |
| VRF (ECVRF) | Custom (`core/vrf/`) | Validator committee selection, PoPC seed |
| Merkle Trees | Custom (`core/consensus/src/merkle.rs`) | Output integrity proofs |
| KDF (Argon2-like) | Custom (`core/crypto/src/kdf.rs`) | Wallet key derivation |

**Transaction signing flow:**

1. Construct `signing_payload` = `from ‖ to ‖ value ‖ gas_price ‖ gas_limit ‖ nonce ‖ data`
2. Sign with Ed25519 `SigningKey` → 64-byte signature
3. Derive address from `VerifyingKey` → Blake2s hash → `0x`-prefixed 40-character hex
4. Attach signature (64 bytes) + `signer_public_key` (32 bytes) to transaction

**Address format:** EVM-compatible — `0x` + 40 hex characters (Blake2s hash of Ed25519 public key). Compatible with MetaMask and standard Ethereum tooling.

---

## 5. Network Architecture

### 5.1 P2P Layer

The network uses **libp2p** with the following configuration:

| Component | Implementation |
|-----------|---------------|
| Transport | TCP + Noise encryption + Yamux multiplexing |
| Discovery | mDNS (local networks) + Kademlia DHT (remote bootstrap) |
| Messaging | GossipSub with topics: `nakharax/blocks`, `nakharax/transactions`, `nakharax/confirmations` |
| Reputation | Per-peer scoring; failures decrease score; ban threshold enforced |
| Identity | Ed25519 keypair, persisted to file when `--identity-key` is set |

### 5.2 Node Roles

| Role | Behavior |
|------|----------|
| **Full** (default) | Sync chain, serve RPC, no block production |
| **Validator** | Sync + produce blocks (round-robin) + earn staking rewards |
| **RPC** | RPC endpoint only (no P2P block production) |
| **Bootnode** | P2P relay for network discovery |

### 5.3 Geo-Hierarchy (Design)

The network is designed in 5 geographic tiers to reduce data transit and support data sovereignty:

| Tier | Role |
|------|------|
| Tier 5 (Edge) | Worker nodes — AI inference on consumer hardware |
| Tier 4 (Metro) | Aggregate proofs from edge workers, metro-level batching |
| Tier 3 (National) | Traffic routing and data sovereignty at country level |
| Tier 2 (Regional) | High-capacity nodes for large workloads |
| Tier 1 (Global Root) | Foundation nodes maintaining global state root |

**Current status:** Testnet runs as a flat topology with 2 validators (AU + ES). The tiered hierarchy is a design target, not a current deployment.

---

## 6. Tokenomics

### 6.1 Token Overview

| Parameter | Value |
|-----------|-------|
| **Symbol** | NAK |
| **Total supply** | 1,000,000,000,000 (1 Trillion) |
| **Supply model** | Fixed cap, no inflation beyond initial distribution |
| **Precision** | 18 decimals |

### 6.2 Token Utility

1. **Gas:** All on-chain transactions require NAK for gas fees.
2. **Staking:** Validators stake NAK to participate in consensus; workers stake NAK as collateral for compute jobs.
3. **Payment:** Workers receive NAK for completed compute jobs; clients pay NAK for compute resources.
4. **Governance:** NAK holders vote on protocol parameters, upgrades, and treasury allocation.

### 6.3 Allocation

| Allocation | % | Vesting |
|------------|---|---------|
| Ecosystem Reserve | 45% | N/A — staking rewards, grants, partnerships |
| Team & Advisors | 20% | 4-year linear (1-year cliff) |
| Early Investors | 10% | 2-year linear (6-month cliff) |
| Public Sale | 10% | Immediate |
| Foundation | 8% | 3-year linear (quarterly unlocks) |
| Community Airdrops | 5% | Various |
| Liquidity Provision | 2% | Immediate |

### 6.4 Economic Parameters (Governance-Controlled)

| Parameter | Initial Value |
|-----------|---------------|
| Validator minimum stake | 100,000 NAK |
| Worker stake ratio | 10–20% of job value |
| Protocol fee | 5% of compute job value |
| Slash rate (fraud) | 100% of stake |
| Slash rate (DA failure) | 50% of stake |
| Slash rate (false pass) | 5% (500 bps) of validator stake |
| Target staking APY | ~2.25% |

### 6.5 Fee Flow

```
Compute Job Fee = Base Price (PPC) × Job Size + Protocol Fee (5%)

Worker payout  = Job Fee × 0.95 × Quality Multiplier
Protocol fee   → DAO Treasury

Transaction fees:  50% burn / 50% treasury (governance-controlled)
Slashing:          50% reporter / 30% treasury / 20% validator pool
```

---

## 7. Roadmap

The roadmap is sequenced to de-risk the hardest technical challenge — trustless verification of non-deterministic compute — by shipping use cases that don't require it first.

### Phase 1 — Own-Your-Node (Current)

Deploy own-node inference for data sovereignty and private compute. No trustless verification needed — the user trusts their own hardware.

| Milestone | Status |
|-----------|--------|
| Rust core (19 crates, ~360 tests) | ✅ Shipping |
| Testnet (chain 86137, 2 validators) | ✅ Live |
| PoPC consensus (sample + Merkle + VRF) | ✅ Shipping |
| Native staking and governance | ✅ Shipping |
| EVM-compatible RPC + auth | ✅ Shipping |
| DeAI worker (SILICON backend) | ✅ Shipping |
| TypeScript SDK | ✅ Shipping |
| Monolith MK-I hardware (Raspberry Pi + Hailo NPU) | ✅ Shipping |

### Phase 2 — Closed Marketplace (Q3–Q4 2026)

Known or reputation-gated workers; optimistic execution with challenge window.

| Milestone | Status |
|-----------|--------|
| JobMarketplace contract deployment | 🟡 Written, not deployed |
| External security audit | 🟡 Planned Q4 2026 |
| Mainnet genesis | 📅 Planned |
| NAK token launch | 📅 Planned |

### Phase 3 — Open Marketplace (2027+)

Full PoPC verification for non-deterministic compute once the verification problem is solved.

| Milestone | Status |
|-----------|--------|
| Enterprise API | 📅 Planned |
| Multi-region federation | 📅 Planned |
| Hardware acceleration R&D | 📅 Planned |

---

## 8. Security

### 8.1 Current Posture

An internal security audit identified 97 findings. As of June 2026:

| Area | Status |
|------|--------|
| Rust core (consensus, crypto, network) | Critical/High remediated — checked/saturating arithmetic, VRF forgery fix, OOM DoS fix, duplicate-tx guard |
| RPC / staking / governance | Write paths require signature auth; read paths open (standard for public RPC) |
| Python DeAI layer | Encrypted keystore + secure overwrite; focused re-audit pending |
| Deploy / Docker / Nginx | Env-injected secrets (no hardcoded keys); operational gaps remain (TLS, image tags, metrics auth) |
| External audit | **Not yet performed** — hard gate before mainnet |

### 8.2 Security Requirements Before Mainnet

1. External audit by a reputable firm (e.g., Trail of Bits, OpenZeppelin, Consensys Diligence)
2. Python DeAI focused re-audit
3. Deployment security hardening (TLS termination, image pinning, authenticated metrics)
4. Bug bounty program launch

---

## 9. Hardware — Monolith MK-I

Nakharax produces purpose-built edge compute hardware for node operators:

### MK-I "Scout+" (Starter Edition)

| Component | Specification |
|-----------|---------------|
| Base | Raspberry Pi 5 (8GB) |
| AI Engine | Raspberry Pi AI HAT+ 2 (Hailo-10H, 8GB on-board RAM) |
| Capabilities | On-device LLM (Llama-3-8B), VLM, batch inference |
| Target | Mass adoption, Tier 5 edge worker |

### MK-I "Vanguard" (Pro Edition)

| Component | Specification |
|-----------|---------------|
| Base | Raspberry Pi 5 (8GB) |
| AI Engine | Dual Hailo-10H (via PCIe Switch HAT) |
| Architecture | Split-brain: left core (Sentinel/validator) + right core (Worker/mining) |
| Target | Power users, Tier 4 candidate |

### BYOD (Bring Your Own Device)

Any device with a CPU or GPU can join as a worker node. Configuration is a single TOML file; the `join-nakharax.py` script handles system checks and dependency installation.

---

## 10. Competitive Landscape

Nakharax competes in the **decentralized compute** category, not the general-purpose L1 blockchain category. The relevant competitive set:

| Project | Focus | Differentiation |
|---------|-------|-----------------|
| **Render** | Decentralized GPU rendering | GPU-specific; Nakharax is workload-agnostic |
| **Akash** | Decentralized cloud (containers) | General cloud; Nakharax targets embarrassingly-parallel science/AI |
| **io.net** | Decentralized GPU clusters | GPU-heavy; Nakharax includes NPU + CPU edge devices |
| **Bittensor** | Decentralized AI network | AI-specific incentive mechanism; Nakharax is compute-general |
| **Gensyn** | Verifiable AI compute | Closest competitor — also solving the verification problem |
| **BOINC / Folding@home** | Volunteer computing | Volunteer (unpaid, unverified); Nakharax adds payment + verification |

In this arena, the relevant metric is **cost per unit of compute vs. cloud providers** — not TPS, which is a settlement-layer concern.

---

## 11. Risks and Limitations

### 11.1 Technical Risks

- **Non-deterministic verification** is unsolved for GPU floating-point workloads. This is the primary technical risk and gates the open marketplace.
- **Bus factor = 1.** The protocol is primarily developed by a single contributor plus AI agents. Hiring 1–2 core engineers is a priority use of funds.
- **No external security audit** has been performed. This gates mainnet deployment.

### 11.2 Market Risks

- Decentralized compute must demonstrate a measurable cost advantage over centralized cloud providers. A rigorous cost model ($/FLOP) has not yet been published.
- Network effects: the marketplace requires both supply (workers) and demand (job submitters) to reach critical mass simultaneously.

### 11.3 Regulatory Risks

- Token classification varies by jurisdiction. Legal opinion pending.
- Data sovereignty regulations may restrict certain cross-border compute flows, which the geo-hierarchy design addresses.

---

## 12. Current Testnet

The protocol is live on a public testnet:

| Parameter | Value |
|-----------|-------|
| Chain ID | 86137 |
| Validators | 2 (AU: 46.250.244.4, ES: 217.216.109.5) |
| RPC | `https://rpc.nakharax.com` |
| Dashboard | `https://app.nakharax.com` |
| Block time | ~5 seconds |
| Consensus | PoPC (s=1000, confidence=0.99) |
| Token (testnet) | NAKt (1 Billion supply for testing) |

Anyone can run a full node or worker by cloning the repository and running `python3 scripts/join-nakharax.py`.

---

## 13. Team and Fundraising

| Item | Value |
|------|-------|
| Seed Round Target | $2,000,000 (10% equity/tokens) |
| Use of Funds | 40% R&D (incl. hiring), 30% Manufacturing, 30% Ecosystem |
| Priority hire | 1–2 core Rust/blockchain engineers (bus factor mitigation) |

---

## References

1. Nakharax source code — [github.com/axionaxprotocol/nakharax](https://github.com/axionaxprotocol/nakharax)
2. Protocol Reality Map — `docs/REALITY_MAP.md` (evidence-based subsystem status)
3. North Star — `docs/NORTH_STAR.md` (strategic compass)
4. Tokenomics — `docs/architecture/TOKENOMICS.md`
5. Governance — `docs/architecture/GOVERNANCE.md`
6. Anderson, D.P. "BOINC: A Platform for Volunteer Computing." Journal of Grid Computing, 2020.
7. Shirts, M. & Pande, V.S. "Screen Savers of the World Unite!" Science, 2000.

---

*This whitepaper describes the Nakharax Protocol as implemented and tested. Claims are traced to source code and measured benchmarks. Items marked as planned, designed, or pending are clearly labeled as such. For the living source-of-truth on what is shipping vs. what is vision, see `docs/REALITY_MAP.md`.*
