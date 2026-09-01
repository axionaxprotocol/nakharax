# Public Testnet Optimization Checklist

Run this checklist only after all seven new VPS instances are recorded in the canonical inventory.

- [ ] Disk, RAM, CPU, clock sync, and provider console access checked on VPS-01..VPS-07.
- [ ] Validator nodes use distinct approved validator addresses and persistent identity keys.
- [ ] All seven nodes report Chain ID `86137` and the same genesis checksum.
- [ ] RPC primary and secondary remain synchronized to the validator tip.
- [ ] RPC latency, rate limits, request-size limits, and error handling pass load tests.
- [ ] P2P peer recovery succeeds after restarting seed, validator, and observer nodes independently.
- [ ] Faucet limits, funded address, CORS, and transaction receipts pass end-to-end testing.
- [ ] Metrics and alerts cover block stalls, peer loss, disk pressure, memory, CPU, and process restart loops.
- [ ] Restore/resync exercise succeeds from documented backups.
- [ ] No direct IP is published as a client RPC endpoint.

Use [1_SEP_GENESIS_RUNBOOK.md](../ops/1_SEP_GENESIS_RUNBOOK.md) for commands and launch gates.
