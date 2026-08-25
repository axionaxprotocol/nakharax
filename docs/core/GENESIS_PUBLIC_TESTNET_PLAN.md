# Genesis Public Testnet Implementation Blueprint

This document outlines the dual-VPS architecture: **2 Validator Nodes + Ingress Reverse Proxy + RPC + Faucet + Block Explorer + API Mesh** sharing Chain ID `86137`.

> **Production Topology:** AU (`46.250.244.4`) hosts the all-in-one infrastructure stack. EU (`217.216.109.5`) hosts Validator #1 + RPC Ingress. Refer to [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md).

---

## Immediate Action Matrix

| Step | Operation Target | Execution Command / Script Path |
|---|---|---|
| 1 | **Genesis Blueprint Initialized** | `services/core/tools/genesis.json` (SHA-256: `0xed1bdac7...`), Chain ID `86137` |
| 2 | **Distribute Genesis Blueprint** | From repository root: `.\services\core\ops\deploy\scripts\distribute-genesis.ps1` |
| 3 | **Update Node Daemons (EU + AU)**| `.\services\core\ops\deploy\scripts\run-update-both-vps.ps1` |
| 4 | **Verify JSON-RPC Endpoints** | `curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://217.216.109.5:8545` |
| 5 | **Deploy Service Stack on AU Host** | `docker compose -f docker-compose.vps.yml up -d` on `46.250.244.4` |
| 6 | **Configure DNS & SSL** | A Records → `46.250.244.4`; Certbot Auto-TLS via Nginx Compose |

---

## 1. Multi-Region VPS Resource Allocation

| Host Region | IP Address | Primary Infrastructure Role | Deployed Service Stack |
|---|---|---|---|
| **EU (Germany)** | `217.216.109.5` | Consensus Validator #1 + RPC + **NakharaX OS UI** | `nakharax-node` + `apps/os-dashboard` (Next.js `:3030`, Nginx → `app.nakharax.com`) |
| **AU (Australia)**| `46.250.244.4` | Consensus Validator #2 + Public Services | `docker-compose.vps.yml`: Validator/RPC, Nginx, Explorer, API, Faucet, PostgreSQL, Redis |

### Public Network Ingress Domains

| Canonical Domain | Internal Service Target | Host Node |
|---|---|---|
| `app.nakharax.com` | `os-dashboard:3030` | EU Node (`217.216.109.5`) |
| `rpc.nakharax.com` | `rpc-node:8545` | AU Node (`46.250.244.4`) |
| `rpc-au.nakharax.com` | `rpc-node:8545` | AU Node (`46.250.244.4`) |
| `explorer.nakharax.com` | `explorer-backend:3001` | AU Node (`46.250.244.4`) |
| `api.nakharax.com` | `explorer-backend:3001` | AU Node (`46.250.244.4`) |
| `faucet.nakharax.com` | `faucet:3002` | AU Node (`46.250.244.4`) |

---

## 2. Pre-Flight Prerequisites

- [ ] **Genesis Verification:** Enforce Chain ID `86137` across all node instances.
- [ ] **Validator Keystores:** Ensure validator identity keys are installed on EU and AU nodes.
- [ ] **Faucet Authority:** Define `FAUCET_PRIVATE_KEY` inside `.env` on the AU host.
- [ ] **Firewall Ingress Rules:** Allow ports `22`, `8545`, and `30303` on both nodes; enable `80` and `443` on AU.

---

## 3. Four-Week Rollout Schedule

### Phase 1: Validator Consensus & Genesis Sync
- Generate Genesis blueprint (`86137`), verify checksums, and distribute to `217.216.109.5` and `46.250.244.4`.
- Establish P2P mesh and verify block height synchronization.

### Phase 2: AU All-in-One Service Deployment
- Deploy container stack on `46.250.244.4` via `docker-compose.vps.yml`.
- Verify Faucet, Block Explorer, and Postgres database persistence.

### Phase 3: TLS Termination & Web Ingress
- Configure Certbot SSL certificates on Nginx ingress nodes.
- Deploy Next.js OS Dashboard on EU node (`app.nakharax.com`).

### Phase 4: Public Launch & Telemetry
- Execute `verify-launch-ready.sh` suite to certify network health.

---

*Certified & Maintained by Lead Systems Architect: August 2026*
