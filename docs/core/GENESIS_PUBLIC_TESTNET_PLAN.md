# Genesis Public Testnet Implementation Plan

Status on 1 September 2026: genesis artifacts are prepared, but the public network is **not online** because the domain and all seven replacement VPS instances are not yet provisioned.

## Fixed network parameters

| Parameter | Value |
|---|---|
| Network | NakharaX Public Testnet |
| Chain ID | `86137` (`0x15079`) |
| Genesis time | `2026-09-01T00:00:00Z` |
| Block cadence | 3 seconds |
| P2P | `30303/TCP+UDP` |
| Genesis validators | 2 |

## Infrastructure

Use seven entirely new VPS instances. Their IP addresses, providers, regions, Peer IDs, and identity keys are not assigned yet. The roles are defined in [7_NODE_HYBRID_TOPOLOGY.md](../architecture/7_NODE_HYBRID_TOPOLOGY.md).

## Execution order

1. Register the production domain and provision seven VPS instances.
2. Record new IPs in `services/core/ops/deploy/environments/testnet/public/inventory.yaml`.
3. Freeze the release commit and verify both genesis checksums.
4. Start VPS-01, read its real Peer ID, and record the seed multiaddress.
5. Start VPS-02 and VPS-03 with their distinct genesis validator addresses.
6. Start RPC/observer nodes VPS-04 through VPS-07.
7. Configure DNS/TLS, then activate RPC and faucet ingress.
8. Complete internal and external go/no-go verification before announcement.

The executable source of truth is [1_SEP_GENESIS_RUNBOOK.md](../ops/1_SEP_GENESIS_RUNBOOK.md). Legacy dual-VPS and three-VPS instructions are retired.
