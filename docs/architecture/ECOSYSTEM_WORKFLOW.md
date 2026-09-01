# 🌐 NakharaX Protocol Ecosystem Lifecycle & Workflow Specification

Welcome to the canonical end-to-end workflow manual for the **NakharaX Protocol**. This whitepaper documents the complete operational lifecycle of a Layer-1 Decentralized Artificial Intelligence (DeAI) blockchain network.

---

## 1. 🔗 P2P Network Architecture & Bootstrapping Protocol

When a new node joins the NakharaX mesh, it initiates peer discovery via **Libp2p Bootstrapping** integrated with **Kademlia DHT**:

1. **Bootstrap Node Entry:** The joining node specifies at least one active **Bootstrap Node** multiaddr in `protocol.testnet.yaml` or via `NAKHARAX_BOOTSTRAP_NODES` (for example `/ip4/<NEW_SEED_IP>/tcp/30303/p2p/<REAL_NEW_SEED_PEER_ID>`).
2. **Kademlia DHT Routing Table Query:** Upon connecting to the bootstrap peer, `swarm.behaviour_mut().kad.bootstrap()` inside [`manager.rs`](file:///D:/nakharax/services/core/core/core/network/src/manager.rs) queries active routing table peers.
3. **Peer Discovery & Identification:** The node utilizes `Identify` and `mDNS` protocols to exchange multiaddresses and PeerIDs automatically, discovering network peers without requiring pre-registered IP addresses.

> [!NOTE]
> NakharaX operates as a **Fully Decentralized P2P Overlay Network**. New nodes require zero IP pre-registration; specifying a bootstrap multiaddr is sufficient to synchronize blocks and broadcast transactions.

---

## 2. 📊 End-to-End Ecosystem Flow Diagram

```mermaid
flowchart TD
    %% Nodes & Styling
    classDef infra fill:#1e1e2f,stroke:#6c5ce7,stroke-width:2px,color:#fff;
    classDef client fill:#2d3436,stroke:#0984e3,stroke-width:2px,color:#fff;
    classDef smartcontract fill:#2d3436,stroke:#00cec9,stroke-width:2px,color:#fff;
    classDef worker fill:#2d3436,stroke:#ffeaa7,stroke-width:2px,color:#d63031;

    subgraph Network_Init ["1. P2P Swarm & Infrastructure Initialization"]
        B["Bootstrap Nodes / Validators"]:::infra
        N["New Node / Validator"]:::infra
        N -- 1. Dial Bootstrap --▶ B
        B -- 2. Kademlia DHT Exchange --▶ N
        N -- 3. Synced Block & Gossipsub --▶ B
    end

    subgraph Staking_Reg ["2. Worker Node Collateral Registration"]
        W["Worker Node"]:::worker
        SC["JobMarketplace Contract"]:::smartcontract
        NAK["NAK ERC20 Token"]:::smartcontract
        
        W -- 4. Approve & Stake NAK --▶ NAK
        W -- 5. registerWorker --▶ SC
        SC -- 6. Store Stake & Set Active --▶ SC
    end

    subgraph Job_Lifecycle ["3. Job Creation & ASR Routing"]
        User["User / Client OS Dashboard"]:::client
        Router["Auto-Selection Router (ASR)"]:::infra
        
        User -- 7. createJob + Pay NAK --▶ SC
        SC -- 8. Emit JobCreated Event --▶ Router
        Router -- 9. Select Best Worker via VRF --▶ SC
        SC -- 10. assignJob to Worker --▶ SC
    end

    subgraph Execution ["4. Off-Chain DeAI Compute Execution"]
        DP["Python Worker Daemon"]:::worker
        HAL["HAL: Silicon / NPU / Photonic"]:::infra
        
        SC -- 11. Listen JobAssigned --▶ DP
        DP -- 12. Run Job Sandbox --▶ HAL
        HAL -- 13. Output Result & Merkle Root --▶ DP
        DP -- 14. submitResult to Chain --▶ SC
    end

    subgraph Consensus_PoPC ["5. PoPC Verification & Reward Settlement"]
        Val["Validator Node"]:::infra
        
        SC -- 15. Challenge Window Triggered --▶ Val
        Val -- 16. ECVRF Deterministic Selection --▶ Val
        Val -- 17. Sample N Indices Challenge --▶ DP
        DP -- 18. Return Merkle Proofs --▶ Val
        
        Val -- 19. verify_sample_proofs --▶ Val
        
        alt Verification Passed (Compute Output Valid)
            Val -- 20a. Verification Success --▶ SC
            SC -- 21a. Release Reward to Worker --▶ SC
            User -- 22a. Claim Result Output --▶ User
        else Fraud Detected (Invalid Proof / Dishonest Worker)
            Val -- 20b. Fraud Flagged --▶ SC
            SC -- 21b. Slash Stake Collateral --▶ SC
        end
    end

    %% Apply Classes
    class B,N,Router,Val,HAL infra;
    class User client;
    class SC,NAK smartcontract;
    class W,DP worker;
```

---

## 3. 🚀 Detailed Execution Lifecycle Breakdown

| Lifecycle Step | Subsystem Component | Operational Execution Summary |
|:---|:---|:---|
| **Step 1–3** | **P2P Swarm Peering** | Joining node dials bootstrap multiaddrs, queries Kademlia DHT routing tables, and subscribes to Gossipsub topics for instant block and transaction propagation. |
| **Step 4–6** | **Worker Registration** | Compute workers deposit mandatory $NAK token collateral into `JobMarketplace.sol`, registering hardware capability specs (GPU VRAM, CPU, NPU). |
| **Step 7–8** | **Job Dispatch & Escrow** | Clients submit DeAI compute jobs (Inference, Training, Data Processing) via the OS Dashboard, locking reward fees into escrow and emitting `JobCreated` events. |
| **Step 9–10** | **ASR Worker Selection** | The **Auto-Selection Router (ASR)** executes weighted selection scoring based on worker reputation, latency SLA, and hardware specifications. |
| **Step 11–14** | **Off-Chain Execution** | Python Worker Daemons execute tasks inside isolated Docker containers via the Hardware Abstraction Layer (HAL), producing Merkle root proofs submitted on-chain via `submitResult`. |
| **Step 15–18** | **PoPC Challenge Window** | Validators trigger **Proof of Practical Compute (PoPC)** verification, executing deterministic ECVRF sampling challenges requiring Merkle proof responses. |
| **Step 19–22** | **Settlement & Slashing** | Valid compute receipts trigger automated escrow reward release to workers. Invalid proofs trigger automated stake slashing up to 50% collateral. |

---

## 4. 🛠️ Ecosystem Technology Matrix

| Subsystem Dimension | Technology Stack | Core Functional Role |
|:---|:---|:---|
| **Blockchain Infrastructure** | Rust, Libp2p, Kademlia DHT, Gossipsub | Sovereign Layer-1 consensus and P2P communication mesh. |
| **Economic Escrow & Safety** | Solidity, ERC-20 OpenZeppelin, Hardhat | Escrow collateral management, reward distribution, automated stake slashing. |
| **Client Ingress & OS** | Next.js 14, TypeScript SDK, Web3 Modal | Sub-second JSON-RPC client interaction and system telemetry visualization. |
| **DeAI Compute & HAL** | Python 3.11+, PyTorch CUDA, Hailo SDK, Docker | Containerized hardware-accelerated model execution. |
| **Cryptographic Verification** | ECVRF (Schnorrkel), STARK FRI, Merkle Trees | Probabilistic fraud detection with >99.99% statistical verification guarantee. |

---

*Certified & Maintained by Lead Systems Architect: August 2026*
