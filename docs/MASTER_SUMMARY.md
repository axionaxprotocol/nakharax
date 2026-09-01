# Nakharax Protocol — Master Summary

|             |                                                     |
| ----------- | --------------------------------------------------- |
| **Status**  | Series Seed Preparation                             |
| **Version** | 2.1                                                 |
| **Updated** | May 3, 2026                                        |
| **Source**  | Compiled from source code and project documentation |

---

## 1. Introduction & Vision

**Nakharax Protocol** is a **DePIN (Decentralized Physical Infrastructure Network)** — affordable, verifiable compute for science and AI workloads. Think paid BOINC/Folding@home on a blockchain: anyone can contribute idle hardware, anyone can run embarrassingly-parallel jobs (parameter sweeps, Monte Carlo, batch inference) without renting a data center.

### The Problem

| Problem                 | Details                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| **AI Compute Crisis**   | Chip shortage and resource monopolization by Big Tech (Centralized AI) |
| **Data Privacy**        | Risk of sending personal data to foreign clouds for processing         |
| **Energy Inefficiency** | Traditional data centers consume massive energy                        |

### The Solution

- Build **Universal Grid** that turns Edge devices (Raspberry Pi, PC, Mac) into AI compute nodes
- Use **Geo-Hierarchy** architecture for geographic scaling
- Verify correctness with **PoPC** (Proof of Practical Compute (PoPC))

---

## 2. Technical Architecture

### 2.1 The Core Protocol (Layer 1)

| Item                    | Details                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **Repository**          | [nakharax](https://github.com/axionaxprotocol/nakharax)      |
| **Languages**           | Rust (80% — Core Logic) + Python (20% — DeAI Layer)                                    |
| **Consensus**           | PoPC (Proof of Practical Compute (PoPC))                                                 |
| **Verification**        | Statistical probabilistic checking instead of full re-execution — \(O(s)\) vs \(O(n)\) |
| **Finality**            | ~2–5s (1-block confirmation on testnet)                                                |
| **Validator Committee** | VRF (Verifiable Random Function) for selection                                         |
| **Interoperability**    | Rust ↔ Python via **PyO3 Bridge** — Smart contracts call AI models directly            |

### 2.2 Network Topology: The Hive (Geo-Hierarchy)

Network organized in 5 geographic tiers to reduce data density:

| Tier       | Name              | Role                                                |
| ---------- | ----------------- | --------------------------------------------------- |
| **Tier 5** | Edge Workers      | Monolith Scout/Vanguard — AI inference              |
| **Tier 4** | Metro Aggregators | Aggregate proofs from Tier 5, metro-level batching  |
| **Tier 3** | National Gateways | Traffic and data sovereignty at country level       |
| **Tier 2** | Regional Titans   | Super nodes for LLM training                        |
| **Tier 1** | Global Root       | Foundation nodes — global state root                |

---

## 3. Hardware Ecosystem

### 3.1 Monolith MK-I "Vanguard" (Pro Edition)

- **Concept:** "The Bicameral Mind" (Split-Brain Architecture)
- **Base:** Raspberry Pi 5 (8GB)
- **AI Engine:** Dual Hailo-10H (via PCIe Switch HAT)
- **Left Brain (Sentinel):** Security/Validator workloads 24/7
- **Right Brain (Worker):** Mining and heavy Marketplace jobs
- **Target:** Power User / Tier 4 Candidate

### 3.2 Monolith MK-I "Scout+" (Starter GenAI Edition)

- **Concept:** "Personal AI Companion"
- **Base:** Raspberry Pi 5
- **AI Engine:** Raspberry Pi AI HAT+ 2 (Hailo-10H + 8GB on-board RAM)
- **Capabilities:** Run LLM (Llama-3-8B), VLM, Chatbot on-device without taxing host RAM
- **Target:** Mass Adoption / Tier 5

### 3.3 The Universal Grid (BYOD)

External hardware support:

| Name                   | Hardware                      | Role              |
| ---------------------- | ----------------------------- | ----------------- |
| **The Chimera**        | Orange Pi 5 Plus (3 AI Chips) | Tier 4 Aggregator |
| **The Silicon Archon** | Mac Mini/Studio               | Elite Worker      |
| **The Leviathan**      | Enterprise Server             | Tier 2/3          |

---

## 4. DeAI & Sentinels

### 4.1 Network Security (Conceptual — Not Yet Implemented)

Planned AI-assisted security modules for Sentinel nodes. Currently at design stage; anomaly detection (`fraud_detection.py`) exists but the full suite is not deployed.

| Module Area         | Status      |
| ------------------- | ----------- |
| Fraud detection     | Prototype   |
| Reputation scoring  | Design only |
| Hardware verification | Design only |

### 4.2 Project HYDRA (Resource Manager)

- **Software:** `hydra_manager.py`
- **Function:** Resource allocation on hardware (e.g. left Hailo for Sentinel, right for Worker) and thermal management

---

## 5. Web & Application Universe

| Item           | Details                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------ |
| **Repository** | [nakharax](https://github.com/axionaxprotocol/nakharax) (Monorepo) |
| **Stack**      | Next.js, Tailwind CSS, TypeScript, pnpm                                                    |

### Key Components

- **Web Portal:** Dashboard, Explorer, Faucet
- **Marketplace:** Compute power trading (Escrow supported)
- **Sales Page:** Monolith hardware sales (Infrastructure Page)
- **API Service:** Blockchain indexer and backend API

---

## 6. Tokenomics & Roadmap

### 6.1 Revenue Model

- **Hardware Sales:** Monolith unit sales
- **Network Fees:** Share of transaction gas
- **Compute Commission:** Marketplace fees (5–10%)

### 6.2 Roadmap (Project Ascension)

| Phase       | Name            | Timeline | Key Goals                                                           |
| ----------- | --------------- | -------- | ------------------------------------------------------------------- |
| **Phase 1** | The Incarnation | Sep 2026 | Public Testnet genesis artifacts and seven-new-VPS rollout          |
| **Phase 2** | Genesis         | 1 Jan 2027 | Mainnet target, NAK listing, live Marketplace                     |
| **Phase 3** | Evolution       | 2027     | Enterprise API, open compute marketplace                            |
| **Phase 4** | Expansion       | 2028+    | Hardware acceleration R&D, multi-region federation                  |

---

## 7. Fundraising Data

| Item                  | Value                                     |
| --------------------- | ----------------------------------------- |
| **Seed Round Target** | $2,000,000 (for 10% Equity/Tokens)        |
| **Use of Funds**      | 40% R&D, 30% Manufacturing, 30% Ecosystem |

### Competitive Advantage

- Targets lower cost than cloud providers for embarrassingly-parallel workloads
- **Hardware-Native Security** (Split-Brain)
- **Privacy-focused** local inference

---

_This document is compiled from Nakharax Protocol source code and internal documentation._
