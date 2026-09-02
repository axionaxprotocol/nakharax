# Three-VPS Public Testnet Topology

This is the active testnet target as of 2 September 2026. It supersedes the
seven-VPS procurement plan and deliberately has no AU RPC endpoint.

| Host | Capacity | Assigned role | Public exposure |
| --- | --- | --- | --- |
| VPS-01 | 4 vCPU, 8 GB RAM, 100 GB SSD | Full node, bootnode, primary RPC/WSS ingress, Caddy, Web OS, HTTP API gateway, faucet | 22, 80, 443, 30303 TCP/UDP |
| VPS-02 | 2 vCPU, 8 GB RAM, 40 GB NVMe | Validator 01 | 22, 30303 TCP/UDP |
| VPS-03 | 4 vCPU, 8 GB RAM, 100 GB SSD | Validator 02, private Prometheus/Grafana collector | 22, 30303 TCP/UDP |

Keep RPC, WebSocket, faucet, Prometheus and Grafana bound to loopback or the
private mesh on every host. Only VPS-01's Caddy process accepts public HTTP/S.
VPS-02 and VPS-03 must not expose unauthenticated RPC ports to the Internet.

## DNS to create or update

Create `A` records to the public IPv4 of VPS-01. Do this before reloading
Caddy so it can obtain TLS certificates.

| Record | Target | Purpose |
| --- | --- | --- |
| `@` | VPS-01 | Landing site |
| `www` | VPS-01 | Landing alias |
| `app` | VPS-01 | Web OS |
| `rpc` | VPS-01 | JSON-RPC and WSS (`/ws`) |
| `api` | VPS-01 | HTTP API (`/v1/*`, `/rpc`) |
| `explorer` | VPS-01 | Web OS explorer route |
| `faucet` | VPS-01 | Testnet faucet |

Delete the `rpc-au` record. Do **not** create public `grafana`, `metrics`,
`postgres`, `redis`, or `mcp` records: Grafana is SSH/VPN-only, metrics and
datastores are private, and the current MCP package is a local STDIO server.

`explorer` intentionally routes to `/apps/explorer` in Web OS. A dedicated
Blockscout service requires its own PostgreSQL capacity and is not safe to
co-locate with the full node and dashboard on VPS-01's 8 GB RAM.

## VPS-01 update procedure

1. Populate the DNS records above and wait for them to resolve to VPS-01.
2. On VPS-01, create the untracked faucet environment file from
   `ops/deploy/env.faucet.example`; set the faucet signer and Redis password
   only on the host.
3. Run `ops/deploy/scripts/deploy-dashboard-vps01.sh` from a clean clone.
   The script fast-forwards from `origin/master`, builds the dashboard, installs
   `vps01/Caddyfile`, and reloads Caddy.
4. Ensure the full-node systemd service is active and its RPC/WSS ports listen
   only on `127.0.0.1`. Start the faucet compose service separately after its
   secret file is present.
5. On VPS-03, run Prometheus/Grafana only after private reachability to all
   three node metrics endpoints is configured. Access Grafana through an SSH
   tunnel or VPN.

## Acceptance checks

Run these from an external machine after DNS and TLS propagation:

```bash
curl -sS -X POST https://rpc.nakharax.com \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

curl -fsS https://app.nakharax.com/
curl -fsS https://explorer.nakharax.com/apps/explorer
curl -fsS https://api.nakharax.com/v1/models
curl -fsS https://faucet.nakharax.com/health
```

The testnet is not launch-ready until all checks succeed, the faucet can make a
funded request without exposing its key, and the three nodes show persistent
peer identities and mutual P2P connectivity.
