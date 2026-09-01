# Mainnet Genesis Checklist — Target 1 January 2027

Mainnet target: **`2027-01-01T00:00:00Z` (1 มกราคม 2570)**. This checklist is intentionally not marked ready: the Mainnet genesis artifact and production validator keys do not exist yet.

## Canonical separation

- [ ] Mainnet Chain ID is `86150` (`0x15086`), never testnet `86137`.
- [ ] Generate a dedicated `genesis_mainnet.json`; do not copy or rename testnet `genesis.json`.
- [ ] Use fresh Mainnet validator, treasury, foundation, and operational keys.
- [ ] Do not reuse Public Testnet IPs, Peer IDs, identity keys, faucet keys, or chain state.
- [ ] Mainnet faucet is disabled unless governance approves a separate production policy.

## T-90 to T-31 days

- [ ] Public Testnet has at least 30 consecutive days of stable block production.
- [ ] External security audit is complete; critical/high findings are closed.
- [ ] Backup, restore, validator replacement, and full-resync drills have passed.
- [ ] Final economic allocations and vesting schedule have legal/governance approval.
- [ ] Production providers and geographic failure domains are approved.

## T-30 to T-8 days

- [ ] Freeze consensus parameters and Mainnet client release candidate.
- [ ] Generate production keys on their final secure custody systems.
- [ ] Record validator addresses and public endpoints in an approved inventory.
- [ ] Generate the Mainnet genesis candidate with timestamp `2027-01-01T00:00:00Z`.
- [ ] Independently verify total supply, allocations, validator set, Chain ID, state root, and file SHA-256.
- [ ] Tag the immutable release commit and reproduce identical Linux binary hashes.

## T-7 days to T-1 hour

- [ ] Run an isolated full dress rehearsal from empty data directories.
- [ ] Distribute the exact genesis file and signed checksum to every operator.
- [ ] Every operator confirms genesis hash, binary hash, validator address, system clock, and firewall rules.
- [ ] RPC, monitoring, alert routing, status page, and incident channels pass end-to-end tests.
- [ ] At T-24h, freeze deployments except documented severity-one fixes.
- [ ] At T-1h, obtain signed go/no-go confirmation from the required operators.

## T-0 and post-launch

- [ ] Start validators at the agreed genesis time.
- [ ] Confirm Chain ID `86150`, block production, quorum, and matching finalized height.
- [ ] Activate public Mainnet RPC only after internal verification passes.
- [ ] Maintain staffed incident watch for at least 24 hours.
- [ ] Publish genesis hash, release tag, binary hashes, endpoints, and status page.
- [ ] Preserve launch logs and the signed go/no-go record.

Any failed critical gate is a no-go. The target date must not override safety or genesis correctness.
