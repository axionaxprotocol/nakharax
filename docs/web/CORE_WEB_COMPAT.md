# Core ↔ Web compatibility record

**Human-maintained.** Update whenever you sync chain-related constants from **nakhara-monolith** into this repo.

| Last updated | Core reference (tag or SHA)                                      | Web reference (tag or SHA) | Notes                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-24   | monolith `master` — AU chain + EU OS deploy docs                 | `main` — docs sync         | **AU** `46.250.244.4`: rpc, explorer, api, faucet. **EU** `217.216.109.5`: validator + `apps/os-dashboard` (`app.nakhara.io`). |
| 2026-04-24   | `28f42cf` — docs: enhance GENESIS_PUBLIC_TESTNET_PLAN + ulimits  | `main` — docs sync pass    | Testnet (chain_id 86137). Genesis SHA-256 `0xed1bdac7...`. Legacy 3-VPS plan (superseded by AU all-in-one). |

## Genesis parameters (from core `28f42cf`)

| Item                     | Value                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Chain ID                 | `86137` (`0x15079`)                                                                      |
| Native token             | AXX (18 decimals)                                                                        |
| Genesis file             | `core/tools/genesis.json`                                                                |
| Genesis SHA-256          | `0xed1bdac7c278e5b4f58a1eceb7594a4238e39bb63e1018e38ec18a555c762b55`                     |
| Block time               | 2 s (genesis)                                                                            |
| Validator EU + OS       | `217.216.109.5` — RPC 8545, P2P 30303, `app.nakhara.io` → os-dashboard :3030          |
| Validator AU + chain    | `46.250.244.4` — RPC 8545, P2P 30303, rpc/explorer/api/faucet via compose              |
| OS deploy               | `docs/web/VPS_EU_OS_DASHBOARD.md`                                                        |
| Chain deploy (AU)       | `ops/deploy/VPS_AU_ALL_IN_ONE.md`                                                        |

See [SOLO_CORE_WEB_SYNC.md](SOLO_CORE_WEB_SYNC.md) for the checklist and [PARAMETERS_SYNC.md](../packages/blockchain-utils/PARAMETERS_SYNC.md) for the field map.
