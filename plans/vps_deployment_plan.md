# Three-VPS Public Testnet Deployment Plan

Decision date: 2 September 2026.

Public Testnet runs on the existing three VPS instances. There is no AU RPC
node and no planned VPS-04 through VPS-07.

| Node | Role | Capacity | Public exposure |
|---|---|---|---|
| VPS-01 | Full node, bootnode, primary RPC/WSS, Web OS, HTTP API, faucet | 4 vCPU, 8 GB RAM, 100 GB SSD | 22, 80, 443, 30303 TCP/UDP |
| VPS-02 | Validator-01 | 2 vCPU, 8 GB RAM, 40 GB NVMe | 22, 30303 TCP/UDP |
| VPS-03 | Validator-02, private monitoring | 4 vCPU, 8 GB RAM, 100 GB SSD | 22, 30303 TCP/UDP |

VPS-01 must keep the node RPC and WebSocket listeners on loopback and publish
them only through Caddy. VPS-02 and VPS-03 run validator roles only; never
expose their RPC endpoints publicly. Monitoring on VPS-03 is reachable only by
SSH tunnel or VPN.

Create `app`, `rpc`, `api`, `explorer`, and `faucet` DNS records for VPS-01;
delete `rpc-au`. See the deployment-ready configuration and acceptance checks
in [three-vps](../services/core/ops/deploy/environments/testnet/three-vps/README.md).

Mainnet will use separate keys, identities, state, and genesis artifacts.
