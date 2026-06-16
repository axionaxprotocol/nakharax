# Axionax — Protocol Reality Map (State of the Protocol)

| | |
| --- | --- |
| **Status** | Internal source-of-truth — supersedes marketing claims where they conflict |
| **Generated** | 2026-06-16 (by running the build/tests, not from docs) |
| **Owner** | CEO / Eng lead |
| **Audience** | Founders, investors (diligence), new engineers |

> **Why this document exists.** Axionax has strong, working engineering **and** a marketing
> narrative that runs well ahead of the code. This map separates the two so that every
> external claim can be traced to a file. **If a statement is not in the 🟢 column, it must
> not be presented to investors in the present tense.**

---

## Legend

| Tier | Meaning |
| --- | --- |
| 🟢 **Shipping** | Exists in code, compiles, and is covered by passing tests or a live testnet. |
| 🟡 **In progress** | Code exists but is gated, mock-by-default, or not yet wired end-to-end. |
| 🔴 **Vision / research** | Narrative or roadmap item. No production implementation. Simulation or absent. |

---

## 0. Evidence of life (reproducible)

Run these to reproduce the verification behind this document:

```bash
cd services/core/core
cargo test --workspace --no-run   # → compiles 19 crates + PyO3 bridge (~37s)
cargo test --workspace            # → ~360 tests pass, 0 failed, 1 ignored
```

| Check | Result (2026-06-16) |
| --- | --- |
| Workspace compile (19 crates + PyO3 bridge) | ✅ clean, minor warnings only |
| Full test suite | ✅ ~360 passed / 0 failed / 1 ignored |
| `security_adversarial` suite | ✅ 31 passed |
| `integration_staking_governance` | ✅ 22 passed |
| Toolchain | Rust 1.94, Node 22, pnpm 10.32, Python 3.13 |
| Repo activity (trailing 90d) | 139 commits — actively developed |
| Contributor concentration | 1 primary author (~251 commits) + AI agents → **bus factor = 1** |
| Python DeAI suite | ✅ 30 passed / 2 skipped (Docker sandbox + bridge) |
| Marketplace lifecycle (MOCK dry-run) | ✅ end-to-end offline — `core/deai/demo_marketplace_dryrun.py` |

### 0.1 Measured performance (component microbench, 2026-06-16)

Real numbers from `cargo bench` on this machine. **These are per-operation timings, not an
end-to-end TPS figure** — system throughput depends on networking, mempool, and block assembly,
which are not captured here. Use these to *replace* invented multipliers, not to assert TPS.

| Operation | Median |
| --- | --- |
| `generate_challenge` (PoPC, 1000 samples) | ~437 µs |
| `verify_proof` (Merkle) | ~10.9 ns |
| `ed25519_sign` | ~19.9 µs |
| `ed25519_verify` | ~35.6 µs (≈ 28k verifies/core/s) |
| `sha3_256` | ~408 ns |
| `blake2s_256` | ~129 ns |

> The single-core ed25519 verify rate (~28k/s) is the honest ceiling to cite in throughput
> discussions — far more defensible than "45,000 TPS," which nothing in the repo measures.

---

## 1. Subsystem reality map

| Subsystem | Claim / narrative | Reality in code | Tier | Evidence |
| --- | --- | --- | --- | --- |
| **PoPC consensus** | Proof-of-Probabilistic-Checking, O(s) vs O(n) | Implemented: sample + Merkle proof + VRF; tests pass | 🟢 | `core/consensus/src/lib.rs`, `merkle.rs` |
| **Full node / block production** | Validator/RPC/bootnode/full roles | Real node binary, block producer + sync tasks | 🟢 | `core/node/src/main.rs`, `core/node/src/lib.rs:337` |
| **Staking / Governance** | Stake-weighted voting, proposals | Implemented; write paths require signature auth | 🟢 | `core/staking`, `core/governance`, `governance_rpc.rs` |
| **JSON-RPC + auth** | ETH-compatible + Axionax methods | Implemented; signed-request verification on write paths | 🟢 | `core/rpc/src/lib.rs`, `auth.rs` |
| **Testnet** | chain 86137, validators, faucet, explorer | Live: 2 validators (AU + ES), faucet, explorer | 🟢 | `docs/core/GENESIS_PUBLIC_TESTNET_PLAN.md` |
| **DeAI worker (AI compute)** | Decentralized AI inference at the edge | Real on **SILICON** backend (torch CPU/GPU) | 🟢 | `core/deai/compute_backend.py:71` |
| **TypeScript SDK** | Typed RPC client | Implemented, never-throw `Result<T>`, Kademlia helper | 🟢 | `packages/sdk/src/rpc.ts` |
| **JobMarketplace contract** | On-chain compute escrow | Written, but **defaults to MOCK** (zero address) — not deployed LIVE | 🟡 | `contracts/JobMarketplaceStandalone.sol`, `core/deai/contract_manager.py:35` |
| **Persistent node identity** | Sybil-resistant peer IDs | Persisted **only if `--identity-key` set**; ephemeral otherwise | 🟡 | `core/node/src/main.rs:64`, `network/src/manager.rs` |
| **Data Availability (erasure coding)** | "Production-grade, 10x efficiency" | Crate exists; encoder/decoder marked in-progress in roadmap | 🟡 | `core/da`, `docs/architecture/ROADMAP.md:99` |
| **Photonic "Proof-of-Light"** | Picosecond optical consensus, "security from quantum physics" | Explicitly `[SIMULATION]` — XOR/phase math, `#[allow(dead_code)]` | 🔴 | `core/consensus/src/proof_of_light.rs:1` |
| **PHOTONIC compute backend** | "Plug in light" hardware acceleration | Mock; always falls back to SILICON | 🔴 | `core/deai/compute_backend.py:82` |
| **45,000 TPS / <0.5s finality** | Headline performance | No measured evidence. **Protocol's own config sets `block_time_seconds: 5`**; string `45000`/`tps` absent from code | 🔴 | `configs/protocol.mainnet.yaml:37`, `core/config/src/lib.rs:213` |
| **11M nodes / Geo-Hierarchy (5 tiers) / 7 Sentinels** | Network topology | Architecture narrative; no implementation | 🔴 | `docs/MASTER_SUMMARY.md` |
| **Guardian nodes in space** | Starlink validators | Research phase, 2028+ | 🔴 | `docs/architecture/ROADMAP.md:274` |

---

## 2. Claims that must be corrected before any investor conversation

These conflict with the code **today**. Restate as research goals, not present-tense facts.

1. **"45,000 TPS · <0.5s finality."** The canonical mainnet config targets a **5-second block
   time** (`configs/protocol.mainnet.yaml:37`). The internal testnet-readiness doc itself
   states the `<0.5s` criterion is "not appropriate" and switches to a `≤5s` block-time check
   (`docs/core/TESTNET_PRODUCTION_READINESS.md`). → Replace with **measured** numbers once a
   benchmark harness publishes them.
2. **"Photonic Proof-of-Light consensus."** Source is labelled `[SIMULATION]`
   (`proof_of_light.rs:1`). The production consensus path is PoPC. → Frame photonics as a
   2027+ research track, never as the live consensus.
3. **"3x performance vs Go" / "10x DA efficiency" / "9/9 services."** No public benchmark
   backs these. → Either publish the benchmark or remove the multiplier.
4. **"Live marketplace."** Contract defaults to MOCK / zero address. → Say "testnet
   marketplace, contract deployment pending."

---

## 3. Security posture (one glance)

> Re-verified 2026-06-16 against current code. The April remediation-status doc **overstated open
> risk** — most code-level Critical/High/Medium are closed. What remains is operational hardening
> plus an external audit. See the re-verification block atop
> `reports/SECURITY_AUDIT_REMEDIATION_STATUS.md`.

| Zone | Status | Note |
| --- | --- | --- |
| Rust core (consensus/crypto/network) | 🟢 | Critical/High remediated (VRF forgery, OOM DoS, gossipsub identity, parent-hash); mempool/reputation use checked/saturating arithmetic; `panic = unwind` |
| Rust RPC / staking / governance | 🟡 | Write paths signed; read paths open (expected for public RPC) |
| **Python DeAI** | 🟡 | Better than the old doc claimed — encrypted keystore + secure overwrite present; no money-truncation casts. Still needs a **focused re-audit** (PM-2/PM-9 unverified) |
| **Deploy / Docker / Nginx** | 🟡 | No hardcoded keys found (env-injected). Genuine gaps are operational: no built-in TLS, `0.0.0.0` binding, `:latest` tags, unauthenticated metrics |
| External audit | ❌ | None yet. **Hard gate before mainnet.** Roadmap places it Q4 2026 (Trail of Bits / OpenZeppelin / Consensys) |

Source: `services/core/SECURITY_AUDIT_REPORT.md` (97 findings), `reports/SECURITY_AUDIT_REMEDIATION_STATUS.md` (+ 2026-06-16 re-verification).

**Hard gate:** no real-value / mainnet / token launch before (a) external audit and (b) clearing
Python DeAI + deploy-secret findings.

---

## 4. Top organizational risk

**Bus factor = 1.** The protocol is driven by a single primary author plus AI agents. This is the
single largest risk to delivery and to diligence. First use of Seed capital should fund 1–2 core
engineers before any new feature scope.

---

## 5. The honest pitch (what we can demo today without overclaiming)

> A working DePIN testnet (chain 86137) with PoPC verification, staking, governance, and a
> Python AI-compute worker — capable of running a real inference job end-to-end on commodity
> hardware. Photonics and global scale are the research roadmap, not the current product.

The highest-leverage proof-point is the **AI-compute marketplace, end-to-end**:
submit job → worker runs it (torch) → result committed on-chain → AXX settles. This lifecycle
**already runs offline today** via `core/deai/demo_marketplace_dryrun.py` (real torch compute,
MOCK contract, zero on-chain side effects). The only missing piece for a LIVE demo is deploying
the JobMarketplace contract (it already exists and matches the worker ABI) and setting
`AXIONAX_MARKETPLACE_ADDRESS`.

---

*Maintained alongside the code. When a 🔴/🟡 item ships, move it up and cite the test that proves it.*
