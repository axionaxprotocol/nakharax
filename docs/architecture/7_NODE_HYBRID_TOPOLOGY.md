# NakharaX Public Testnet — 7 VPS Topology

Canonical infrastructure topology for Public Testnet launch on 1 September 2026.

- All seven VPS instances are new.
- Public IPv4 addresses, Peer IDs, regions, and providers are `UNASSIGNED` until procurement.
- Legacy VPS addresses and identity keys must not be reused.
- The seven network nodes do not imply seven genesis validators. The current genesis has two validators.
- Mainnet target: 1 January 2027 (`2027-01-01`, 1 มกราคม 2570).

## Node roles

| Node | Primary role | Public ingress | Genesis validator address |
|---|---|---|---|
| VPS-01 | Seed/bootnode | `30303/TCP+UDP` | — |
| VPS-02 | Validator-01 | `30303/TCP+UDP` | `0xca0e4e60f8ce825dbb820c72a7e28e28cdae3326` |
| VPS-03 | Validator-02 | `30303/TCP+UDP` | `0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb` |
| VPS-04 | Public RPC primary | `80/443/TCP`, `30303/TCP+UDP` | — |
| VPS-05 | Public RPC secondary + observer | `80/443/TCP`, `30303/TCP+UDP` | — |
| VPS-06 | Faucet + observer | `80/443/TCP`, `30303/TCP+UDP` | — |
| VPS-07 | Monitoring + observer | `30303/TCP+UDP`; monitoring via private access | — |

All nodes bind JSON-RPC to `127.0.0.1:8545` and health/metrics to `127.0.0.1:8080`. Caddy is the only public HTTP ingress. SSH is restricted to the operator's allowlisted public IP.

## Network flow

```text
Internet users
   |-- rpc.<domain> --------> VPS-04 RPC primary
   |-- rpc-backup.<domain> -> VPS-05 RPC secondary
   `-- faucet.<domain> -----> VPS-06 faucet

VPS-01 seed <---- P2P 30303/TCP+UDP ----> VPS-02..VPS-07
                  VPS-02/03 produce blocks
                  VPS-04/05 serve RPC
                  VPS-06 serves faucet
                  VPS-07 observes and monitors
```

## Procurement inventory

Do not insert guessed or previously used values. Complete this table only after each new VPS exists.

| Node | Provider | Region | Static IPv4 | Peer ID | Status |
|---|---|---|---|---|---|
| VPS-01 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |
| VPS-02 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |
| VPS-03 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |
| VPS-04 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |
| VPS-05 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |
| VPS-06 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |
| VPS-07 | TBD | TBD | `UNASSIGNED` | generated after first start | not provisioned |

## Minimum sizing

| Role | Suggested minimum |
|---|---|
| Seed/observer | 2 vCPU, 4 GB RAM, 80 GB NVMe |
| Validator | 4 vCPU, 8 GB RAM, 100 GB NVMe |
| RPC | 4 vCPU, 8 GB RAM, 150 GB NVMe |
| Faucet/observer | 2 vCPU, 4 GB RAM, 100 GB NVMe |
| Monitoring/observer | 4 vCPU, 8 GB RAM, 200 GB NVMe |

Use Ubuntu 22.04 or 24.04 LTS consistently, static IPv4, provider console access, automated snapshots, and at least three geographic/provider failure domains. Final region placement is intentionally undecided until procurement.

## Activation rule

Deployment remains blocked while any of the seven IPs is `UNASSIGNED`, the domain is unregistered, or the seed Peer ID has not been read from the new node. The executable procedure is [1_SEP_GENESIS_RUNBOOK.md](../ops/1_SEP_GENESIS_RUNBOOK.md).
