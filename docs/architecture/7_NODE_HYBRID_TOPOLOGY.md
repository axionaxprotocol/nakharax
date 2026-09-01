# NakharaX Public Testnet — 3 Cloud VPS + 2 Local PC Hybrid Topology

Canonical infrastructure topology for Public Testnet launch on 1 September 2026.

- Active Genesis Quorum: 3 Cloud VPS (Europe, US East, Singapore) + 2 Local DeAI GPU Workers (Thailand).
- Chain ID: `86137` (`0x15079`).
- Block Cadence: 3.0 seconds (Proof of Practical Compute - PoPC).
- Mainnet target: 1 January 2027 (`2027-01-01`, 1 มกราคม 2570).

## 1. Live Deployed Nodes

| Node | Region / Location | Role & Consensus | Static IPv4 | Live Peer ID & Port |
|---|---|---|---|---|
| **VPS-01** | 🇪🇺 Germany (Frankfurt) | Master Seed / Bootnode & Public RPC Ingress Gateway | `158.220.127.24` | `12D3KooWPbSJk2fhuqENJDyrcb8y4x5EFJEFHt29sfZ9Tmc3vn2M` (30303) |
| **VPS-02** | 🇺🇸 Virginia (US East) | Genesis Validator 01 (`0xca0e4e60f8ce825dbb820c72a7e28e28cdae3326`) | `40.160.87.118` | `12D3KooWPeewcUHGcwU72BefJqLmTgzxs4DM8WhTtGFwQnRkHmDE` (30303) |
| **VPS-03** | 🇸🇬 Singapore (APAC) | Genesis Validator 02 (`0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb`) | `217.216.39.77` | `12D3KooWQzf4maRFSYwk1BTJJuW7uspWLWKastntMWeRrxdoQCjK` (30303) |
| **PC-01** | 🇹🇭 Thailand (Bangkok) | Primary DeAI Compute Worker (AMD Ryzen 5 4500 + RX 560 DirectML) | `127.0.0.1` | Local Worker Daemon (P2P 30303 / RPC 8545) |
| **PC-02** | 🇹🇭 Thailand (Chiang Mai) | Secondary DeAI ZK-FRI Compute Worker / Prover Swarm | `127.0.0.1` | Local Worker Daemon (P2P 30303 / RPC 8545) |

## 2. Ingress & Routing Flow

```text
Internet Users & Web3 Wallets (MetaMask / Rabby / Web OS)
   |-- https://rpc.nakharax.com ------> VPS-01 (158.220.127.24:443 Caddy) -> Local RPC :8545
   |-- https://faucet.nakharax.com ---> VPS-01 (158.220.127.24:443 Caddy) -> Faucet API :3002
   `-- https://app.nakharax.com ------> VPS-01 (158.220.127.24:443 Caddy) -> Next.js :3030

VPS-01 (Germany Seed) <==== P2P Mesh 30303 ====> VPS-02 (Virginia Val 01)
     ^                                                 ||
     ||============= P2P Mesh 30303 ===================||
     v                                                 v
VPS-03 (Singapore Val 02) <=== Consensus Quorum ======> VPS-02
     ^
     ||============= DeAI Job Execution Trace =========
Local PC Workers (PC-01 / PC-02 Thailand) ---> Claim & Settle via RPC
```

## 3. Scale-out Roadmap (7-Node Future Expansion)

As transaction volume and ZK verification workloads increase, the cluster seamlessly expands by provisioning additional observer / RPC satellite nodes:
- VPS-04: Secondary RPC Gateway (Europe West)
- VPS-05: Dedicated Block Explorer & Graph Indexer
- VPS-06: Dedicated High-Throughput Faucet Controller
- VPS-07: Isolated Monitoring Cluster (Prometheus / Grafana Guard)
| Faucet/observer | 2 vCPU, 4 GB RAM, 100 GB NVMe |
| Monitoring/observer | 4 vCPU, 8 GB RAM, 200 GB NVMe |

Use Ubuntu 22.04 or 24.04 LTS consistently, static IPv4, provider console access, automated snapshots, and at least three geographic/provider failure domains. Final region placement is intentionally undecided until procurement.

## Activation rule

Deployment remains blocked while any of the seven IPs is `UNASSIGNED`, the domain is unregistered, or the seed Peer ID has not been read from the new node. The executable procedure is [1_SEP_GENESIS_RUNBOOK.md](../ops/1_SEP_GENESIS_RUNBOOK.md).
