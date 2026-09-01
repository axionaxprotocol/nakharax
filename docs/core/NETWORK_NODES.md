# NakharaX Public Testnet Nodes

Live 3-Continent Global Quorum Mesh + Edge DeAI Workers on Public Testnet (Chain ID `86137`):

| Node | Geographic Location | Infrastructure Role | Public IPv4 / Ingress | P2P Port | Status |
|---|---|---|---|---|:---:|
| **VPS-01** | 🇪🇺 Frankfurt, Germany | Master Seed / Bootnode & Public RPC Ingress | `158.220.127.24` (`rpc.nakharax.com`) | `30303` | 🟢 **ONLINE** |
| **VPS-02** | 🇺🇸 Virginia, US East | Genesis Validator 01 (`0xca0e...3326`) | `40.160.87.118` | `30303` | 🟢 **PRODUCING** |
| **VPS-03** | 🇸🇬 Singapore, APAC | Genesis Validator 02 (`0x26e7...e6cb`) | `217.216.39.77` | `30303` | 🟢 **PRODUCING** |
| **PC-01** | 🇹🇭 Bangkok, Thailand | Primary DeAI GPU Worker (DirectML) | `127.0.0.1` | `30303` | 🟢 **ACTIVE** |
| **PC-02** | 🇹🇭 Chiang Mai, Thailand | Secondary Edge Worker (STARK-FRI ZK Prover) | `127.0.0.1` | `30303` | 🟢 **ACTIVE** |

Bootstrap multiaddrs registered in [PUBLIC_TESTNET_BOOTSTRAPS.txt](../../PUBLIC_TESTNET_BOOTSTRAPS.txt).
Canonical topology: [7_NODE_HYBRID_TOPOLOGY.md](../architecture/7_NODE_HYBRID_TOPOLOGY.md).
Mainnet Target: 1 January 2027 (`2027-01-01` / 1 ม.ค. 2570).
