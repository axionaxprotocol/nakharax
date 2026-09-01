# Public Testnet Connectivity Overview

Current status: all former VPS endpoints are retired. No public RPC, faucet, explorer, or dashboard endpoint should be considered live until the new domain and seven VPS instances are provisioned and verified.

```text
rpc.<domain> --------> VPS-04 Caddy :443 -> node RPC 127.0.0.1:8545
rpc-backup.<domain> -> VPS-05 Caddy :443 -> node RPC 127.0.0.1:8545
faucet.<domain> -----> VPS-06 Caddy :443 -> faucet 127.0.0.1:3002

VPS-01 seed <-------> VPS-02..VPS-07 over P2P 30303/TCP+UDP
```

Public exposure rules:

- `8545`, `8080`, `3002`, monitoring, and database ports stay private.
- Only `80/443` on ingress nodes and `30303/TCP+UDP` on network nodes are public.
- SSH is allowlisted to the operator IP.
- Peer IDs come from identities created on the corresponding new VPS.
- Clients use DNS names, never direct VPS IPs.

See [1_SEP_GENESIS_RUNBOOK.md](../ops/1_SEP_GENESIS_RUNBOOK.md) for deployment and verification.
