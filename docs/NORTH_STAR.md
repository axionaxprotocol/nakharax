# nakharax.io — North Star

> The one-page compass. Every decision checks against this. If a feature does not serve
> the sentence below, **cut it.**

---

## The vision (one sentence)

**Give everyone cheap, accessible computing power** — so a researcher who could never afford a
supercomputer can rent thousands of idle home machines to run their simulations (think: modelling
the solar system), and anyone with a PC, Mac, or Pi can earn by lending its spare cycles.

## What we actually are

**A paid, verifiable, modern BOINC / Folding@home** — a decentralized grid for
**embarrassingly-parallel** science and AI compute. The blockchain is *only* the trust +
settlement rail (job escrow, payment in **NAK**, reputation). It is **not** the product, and it
does **not** need to be a fast L1.

Proof the model works at scale: Folding@home reached **~2.4 exaFLOPS** on volunteer PCs (more than
the top supercomputers combined). BOINC / SETI@home / Einstein@home ran this way for 20+ years.
What nakharax.io adds: **payment** (incentive, not charity), **verification** (trust a stranger's
result), and a **marketplace**.

---

## ✅ What we build (serves the vision)

- **Embarrassingly-parallel workloads** — parameter sweeps, Monte Carlo ensembles, batch
  inference, rendering, sensitivity analysis. Each task independent → distributes perfectly.
- **The compute marketplace** — submit job → worker runs it → result settled in NAK (escrow).
- **Own-your-node compute** — on-device LLM/inference; in-org / in-country private inference
  (PDPA/GDPR data sovereignty — the wedge where decentralized beats foreign cloud by default).
- **Verification (PoPC)** — so results from strangers can be trusted (the real moat).

## 🔴 What we do NOT build (the trap)

- **Tightly-coupled HPC** — a single high-res N-body solar-system sim, or large-model *training*
  across homes. These need fast interconnect (NVLink/InfiniBand); decentralized loses. We serve
  the researcher by running their **thousands of independent runs**, not one coupled job.
- **Vanity narrative** — photonic "Proof-of-Light", space nodes, 45,000 TPS, "Civilization OS",
  11M-node Geo-Hierarchy, 7 Sentinels-as-headline. Park as long-term research; keep out of the
  plan and the pitch.

---

## Sequencing (de-risked)

The hardest unsolved problem — **trustless verification of non-deterministic compute** — is only
needed when *strangers* run jobs. So we ship the parts that don't need it **first**:

1. **Phase 1 — own-your-node** (no trustless verification required): on-device + in-org/in-country
   private inference. Delivers "cheap accessible compute" immediately.
2. **Phase 2 — closed marketplace**: known/reputation-gated workers, optimistic + challenge.
3. **Phase 3 — open marketplace**: full PoPC verification once non-determinism is solved
   (deterministic inference mode / tolerance-based checks / TEE / optimistic-fraud-proofs).

---

## The scoreboard (measure us by these, not TPS)

| Metric | Why it matters |
|---|---|
| **$ / unit of compute vs AWS/GCP** | The whole thesis. Must be provably cheaper (cost model still TODO). |
| **Verifiable-compute success rate** | Can requesters trust results? |
| **Active worker nodes / onboarding friction** | Can anyone plug in and earn? |
| **Real jobs run** | Demand is the only validation. |

## Honest numbers (use these, not the old claims)

| Don't say | Say instead | Basis |
|---|---|---|
| "45,000 TPS" | "~280 TPS settlement at current config; the chain is a receipt rail, not the product" | 30M gas/block ÷ 21k ÷ 5s |
| "<0.5s finality" | "~5s block time" | `configs/protocol.mainnet.yaml` |
| "<10ms LLM latency" | "~20–100ms/token on edge" | LLM inference reality |
| "fastest blockchain" | "verifiable, cheap, distributed compute" | right category |

Real strengths to show: PoPC verifies 1000 samples in ~437µs; signature verify ~45k/s across a
few cores; in-memory tx processing in the millions/s. The Rust core is genuinely fast.

---

## Competitive set (not Solana / Ethereum)

Render · Akash · io.net (decentralized GPU) · **Bittensor · Gensyn** (verifiable AI compute —
our real rivals) · Filecoin/Arweave (DePIN storage). In this arena, "TPS" is not a question anyone
asks.

---

*Rebrand status & migration: see [README → Naming & rebrand](../README.md#naming--rebrand).
Current verified state of the code: see [REALITY_MAP.md](REALITY_MAP.md).*
