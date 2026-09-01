# Public Testnet Genesis Launch-Day Checklist

Network: NakharaX Public Testnet, Chain ID `86137`. Infrastructure status: **blocked pending domain and seven new VPS instances**.

## Procurement and inventory

- [ ] Domain registered and operator controls DNS.
- [ ] Seven new VPS instances have static public IPv4 addresses.
- [ ] Provider, region, console access, expiry, and recovery contact are recorded.
- [ ] No retired IP, Peer ID, or identity key is present in active configuration.

## Release

- [ ] Immutable launch commit/tag selected.
- [ ] CI, Rust format/clippy/tests, release build, and genesis verification pass.
- [ ] Deployment genesis and canonical manifest checksums match the runbook.
- [ ] Same Linux node binary checksum recorded on all seven VPS instances.

## Network startup

- [ ] VPS-01 seed identity is generated and its real multiaddress recorded.
- [ ] VPS-02 and VPS-03 use different approved genesis validator addresses.
- [ ] VPS-04 through VPS-07 connect and sync to the same tip.
- [ ] Chain ID is `0x15079`; block height advances at approximately 3-second cadence.
- [ ] P2P peer count and recovery/resync checks pass.

## Public ingress

- [ ] DNS points only to the newly provisioned ingress VPS instances.
- [ ] TLS is valid for RPC and faucet endpoints.
- [ ] Backend RPC and health ports are not publicly reachable.
- [ ] External RPC and faucet checks pass.
- [ ] Monitoring and incident watch are staffed for at least 60 minutes after activation.

Run every command from [1_SEP_GENESIS_RUNBOOK.md](../ops/1_SEP_GENESIS_RUNBOOK.md); it is the canonical procedure.
