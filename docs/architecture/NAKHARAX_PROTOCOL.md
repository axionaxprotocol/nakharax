# NakharaX Protocol — Architecture Specification v2.0.0 (August 2026)

This specification details the architectural components of the **NakharaX Protocol** (v2.0.0-testnet).

**Last Updated:** May 3, 2026 | **Protocol Version:** v2.0.0-testnet

---

## 0) High-Level Architecture Overview

```mermaid
flowchart LR
    %% Access
    Clients["Users, DApps & Wallets"] --> RPC["RPC Ingress Nodes"]

    %% Core Layer-1
    subgraph L1["NakharaX L1 Blockchain"]
        direction LR
        subgraph Market["Assignment & Pricing Subsystem"]
            ASR["Auto Selection Router (ASR)<br/>Top K Weighted VRF"]
            PPC["Posted Price Controller (PPC)<br/>Utilization & Queue Controller"]
        end
        subgraph Core["Integrated Core Execution Loop"]
            Exec["Execution Engine<br/>Deterministic Sandbox"]
            PoPC["PoPC Sampling<br/>Validation Engine"]
            DA["Data Availability (DA)<br/>Erasure Coding & Storage"]
            Settle["Settlement & Finality"]
        end
        Validators["Validator Set"]
        Auditors["DA Live Auditors"]
    end

    %% Flows
    RPC --> Exec
    Exec --> PoPC --> DA --> Settle
    Settle -.-> Exec

    %% Market control links
    PPC -.-> ASR
    ASR --> Exec

    %% Security and ops
    VRF["Delayed VRF"] -.-> PoPC
    Auditors -.-> DA
    Telemetry["Monitoring & Telemetry"] -.-> Exec
    Telemetry -.-> PoPC
    Telemetry -.-> DA
    Telemetry -.-> Settle
    Attest["Public Attestations"] -.-> Telemetry

    %% Governance and DeAI
    DAO["NakharaX DAO"] -.-> PPC
    DAO -.-> ASR
    DeAI["DeAI Sentinel"] -.-> Telemetry
    Telemetry -.-> DeAI
    DeAI --> DAO

    %% Decentralized DeAI E2E Pipeline
    subgraph DeAI_E2E["Decentralized DeAI E2E Subsystem"]
        Submit["deai_submit.py<br/>(Local Submitter)"]
        Queue["Queue Directory<br/>job-*.json"]
        Worker["deai_monitor.py<br/>(Cloud Worker)"]
        Result["result-*.json<br/>SHA256 Hash + Proof"]
    end
    Submit --> Queue --> Worker --> Result
    Result -.-> Clients
```

---

## 1) Core Execution Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant RPC as RPC Nodes
    participant ASR as ASR Router
    participant W as Compute Worker
    participant DA as DA Service
    participant VRF as Delayed VRF
    participant AUD as DA Auditors
    participant CH as Chain / Settlement

    Client->>RPC: Post Job & SLA Parameters
    RPC->>ASR: Enqueue Compute Job
    ASR-->>RPC: Assign Worker (Top-K Weighted VRF)
    RPC->>W: Dispatch Job Details & SLA

    W->>W: Execute Deterministic Compute Payload
    W->>DA: DA Pre-commit (Erasure Coded Chunks)
    W->>CH: Commit Output Merkle Root (o_root) & Stake

    Note over VRF,CH: Wait k blocks (Delayed VRF Challenge Window)
    VRF-->>V: Challenge Sample Index Set S

    W->>V: Provide Merkle Path Proofs for Samples
    V->>V: Verify Proof Integrity & Tally Votes
    V-->>CH: Seal Block if Verification Passes

    AUD-->>DA: Execute Continuous Availability Audits
    AUD-->>CH: Report Data Withholding Violations

    CH-->>Client: Final Receipt & State Status
    CH-->>W: Release Escrow Reward or Execute Slashing
    CH-->>V: Slash False-PASS Validator Votes

    par Fraud Window
        Client-->>CH: Submit Fraud Proof & Evidence
        CH-->>W: Execute Retroactive Slashing Penalty
        CH-->>V: Execute Validator Slashing
    end

    CH-->>CH: Finalize Block & State Transition
```

---

## 2) Auto-Selection Router (ASR)

```mermaid
flowchart LR
    subgraph Inputs["Telemetry Ingress"]
        HW["Hardware Specifications<br/>GPU, VRAM, Framework, Region"]
        Hist["Historical Telemetry<br/>PoPC Pass Rate, DA Reliability, Latency"]
        Quota["Quota Constraints<br/>Per Org, ASN, Region"]
        New["Newcomer Status"]
    end

    subgraph Scoring["Scoring & Eligibility"]
        Elig["Eligibility Filter"]
        Score["Score = Suitability x Performance x FairnessBoost"]
        TopK["Select Top K Candidates"]
        VRF["VRF Weighted Selection"]
    end

    subgraph Output["Execution Assignment"]
        Assign["Assigned Worker Node"]
    end

    HW --> Elig
    Hist --> Score
    Quota --> Score
    New --> Score
    Elig --> Score --> TopK --> VRF --> Assign
```

---

## 3) Posted Price Controller (PPC)

```mermaid
flowchart LR
    subgraph Metrics["Live Network Telemetry"]
        Util["System Utilization (util)"]
        Queue["Queue Length (q)"]
    end
    Controller["Price Controller<br/>Exponential Response & Clamps"]
    Prices["Per-Class Execution Price (p_c)"]
    Market["Market Execution Rate"]
    Target["Target Parameters<br/>Target Util (util*) & Target Queue (q*)"]

    Util --> Controller
    Queue --> Controller
    Target -.-> Controller
    Controller --> Prices --> Market --> Util
    Market --> Queue
```

---

## 4) Proof of Practical Compute (PoPC) Consensus

```mermaid
flowchart LR
    Client["Client"] --> W["Worker Node"]
    W -->|Deterministic Execution| Out["Compute Outputs"]
    Out -->|Merkle Tree Hash| Root["Output Merkle Root (o_root)"]
    W -->|Commit Root & Stake| Chain["Chain State"]

    subgraph Challenge["Delayed VRF Challenge Window"]
        VRF["Delayed VRF (k Blocks)"]
        S["Sample Index Set S (Size s)"]
    end

    Chain -.-> VRF --> S
    W -->|Submit Merkle Path Proofs| V["Validators"]
    V -->|Verify Merkle Proofs & Tally Votes| Chain

    PDetect["Statistical Fraud Detection<br/>P_detect = 1 - (1 - f)^s"]
    V -.-> PDetect
```

---

## 5) Data Availability (DA) Layer

```mermaid
flowchart LR
    subgraph DAFlow["Data Availability Pipeline"]
        Pre["DA Pre-commit<br/>Erasure Coded Chunks"]
        Store["Distributed Storage & Ingress"]
        Audit["Continuous Audit Swarm"]
    end

    W["Worker Node"] --> Pre --> Store
    Audit -.-> Store
    Audit -.-> Chain["Chain State"]
    Chain -.-> Pen["Automated DA Slashing"]
```

---

## 6) Security & Anti-Fraud Architecture

```mermaid
flowchart TB
    VRF["Delayed VRF & Anti-Grinding"]
    Strat["Stratified Sampling Engine"]
    Adapt["Adaptive Challenge Escalation"]
    Replica["Replica Diversity & Jury Panel"]
    FraudW["Fraud-Proof Window (3600s)"]
    SlashW["Worker Stake Slashing"]
    SlashV["Validator False-PASS Slashing"]

    VRF -.-> Challenge["Challenge Index Set S"]
    Strat -.-> Challenge
    Adapt -.-> Challenge
    Replica -.-> Verify["Cross-Check by Replicas"]
    FraudW -.-> SlashW
    FraudW -.-> SlashV
```

---

## 7) Recommended Protocol Parameters (v2.0.0 - August 2026)

| Parameter | Recommended Value | Specification & Description |
|---|---|---|
| **$s$ (PoPC Sample Size)** | `600` – `1500` | Sample size executed during PoPC verification challenges |
| **$\beta$ (Redundancy Ratio)** | `2%` – `3%` | Proportion of jobs dispatched for cross-replica verification |
| **$K$ (Top-K Pool)** | `64` | Candidate pool size selected by ASR prior to VRF draw |
| **$q_{\max}$ (Org Quota)** | `10%` – `15%` / epoch | Maximum allowable assignment quota per ASN / Organization |
| **$\epsilon$ (Exploration Ratio)** | `5%` | Epsilon-greedy allocation ratio reserved for newcomer nodes |
| **$util^*$ (Target Utilization)** | `0.70` (70%) | Target network compute utilization metric |
| **$q^*$ (Target Queue Time)** | `60s` | Target queue latency for incoming compute jobs |
| **$k$ (Delay Blocks)** | $\ge 2$ blocks | Delay interval applied to VRF seed generation |
| **$\Delta t_{\text{fraud}}$ (Fraud Window)** | `3600s` | Active Fraud-Proof challenge window duration |
| **False-PASS Slashing Penalty** | $\ge 500$ bps | Slashing penalty levied against validators approving invalid proofs |

---

*Certified & Maintained by Lead Protocol Architect: May 2026*
