# Seven-New-VPS Public Testnet Deployment Plan

Decision date: 1 September 2026.

The former infrastructure is retired. Public Testnet will use seven entirely new VPS instances; provider, region, public IP, and Peer ID values are intentionally unset until procurement.

| Node | Role | Minimum sizing | Status |
|---|---|---|---|
| VPS-01 | Seed/bootnode | 2 vCPU, 4 GB RAM, 80 GB NVMe | pending purchase |
| VPS-02 | Validator-01 | 4 vCPU, 8 GB RAM, 100 GB NVMe | pending purchase |
| VPS-03 | Validator-02 | 4 vCPU, 8 GB RAM, 100 GB NVMe | pending purchase |
| VPS-04 | RPC primary | 4 vCPU, 8 GB RAM, 150 GB NVMe | pending purchase |
| VPS-05 | RPC secondary + observer | 4 vCPU, 8 GB RAM, 150 GB NVMe | pending purchase |
| VPS-06 | Faucet + observer | 2 vCPU, 4 GB RAM, 100 GB NVMe | pending purchase |
| VPS-07 | Monitoring + observer | 4 vCPU, 8 GB RAM, 200 GB NVMe | pending purchase |

Procurement requirements:

- Static IPv4 and provider rescue console for every VPS.
- Ubuntu 22.04 or 24.04 LTS consistently.
- At least three provider/geographic failure domains.
- Snapshot/backup capability and documented renewal dates.
- SSH key authentication and operator-IP allowlisting.
- No provider purchase or region is considered final until entered in the canonical inventory.

Deployment is blocked until the domain and all seven VPS instances exist. Follow [1_SEP_GENESIS_RUNBOOK.md](../docs/ops/1_SEP_GENESIS_RUNBOOK.md) after procurement.

Mainnet target is 1 January 2027 (`2027-01-01`, 1 มกราคม 2570); Mainnet will use separate keys, identities, state, and genesis artifacts.
