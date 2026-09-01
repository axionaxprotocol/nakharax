# Core ↔ Web compatibility record

**Human-maintained.** Update whenever you sync chain-related constants from **nakharax** into this repo.

| Last updated | Core reference (tag or SHA)                                      | Web reference (tag or SHA) | Notes                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-01   | Public Testnet Genesis (Chain ID 86137)                          | `main` — 7 VPS Topology    | Canonical 7 VPS topology: unassigned IPs until provisioning. Mainnet target: 1 Jan 2027. |
| 2026-05-24   | Legacy AU chain + EU OS deploy docs (archival)                   | `main` — docs sync         | *Legacy reference (superseded by 7 VPS architecture)* |
| 2026-04-24   | `28f42cf` — docs: enhance GENESIS_PUBLIC_TESTNET_PLAN + ulimits  | `main` — docs sync pass    | Testnet (chain_id 86137). Genesis SHA-256 `0xed1bdac7...`. Legacy 3-VPS plan (superseded). |

## Genesis parameters

| Item                     | Value                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Chain ID                 | `86137` (`0x15079`)                                                                      |
| Native token             | NAK (18 decimals)                                                                        |
| Genesis file             | `services/core/core/tools/genesis.json`                                                  |
| Block time               | 3 s (genesis)                                                                            |
| Validator Node 01        | VPS-02 (`0xca0e4e60f8ce825dbb820c72a7e28e28cdae3326`)                                    |
| Validator Node 02        | VPS-03 (`0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb`)                                    |
| OS Web Terminal          | VPS-05 (`app.nakharax.com`)                                                              |
| Public RPC Primary       | VPS-04 (`rpc.nakharax.com`)                                                              |

See [SOLO_CORE_WEB_SYNC.md](SOLO_CORE_WEB_SYNC.md) for the checklist and [PARAMETERS_SYNC.md](../packages/blockchain-utils/PARAMETERS_SYNC.md) for the field map.
