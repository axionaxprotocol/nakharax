# Genesis Public Testnet Plan — Within This Month

Use **two VPS** (spec: 4 vCPU, 8 GB RAM, 75 GB NVMe / 150 GB SSD, 200 Mbit/s) plus optional frontend hosting to complete the loop: Validators + RPC + Faucet + Explorer + API on the same chain.

> **Current layout (2026-05):** AU (`46.250.244.4`) runs the **all-in-one** stack. EU (`217.216.109.5`) runs **Validator #1 + RPC** only. See [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md).

---

## เริ่มเลย — สิ่งที่รันได้ทันที

| # | ขั้นตอน | คำสั่ง / ไฟล์ |
|---|--------|----------------|
| 1 | **Genesis พร้อมแล้ว** | `core/tools/genesis.json` (SHA-256: `0xed1bdac7...`), Chain ID 86137 |
| 2 | **ส่ง genesis ไปทั้งสอง VPS** | จาก repo root: `.\ops\deploy\scripts\distribute-genesis.ps1` |
| 3 | **อัปเดต node บน EU + AU** | `.\ops\deploy\scripts\run-update-both-vps.ps1` (SSH: `217.216.109.5`, `46.250.244.4`) |
| 4 | **ตรวจ RPC** | `curl ... http://217.216.109.5:8545` และ `http://46.250.244.4:8545` → `"result":"0x15079"` |
| 5 | **Deploy stack บน AU** | `docker compose -f docker-compose.vps.yml up -d` บน `46.250.244.4` — ดู [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md) |
| 6 | **DNS + SSL** | A record โดเมน → `46.250.244.4`; Certbot ผ่าน compose |

**ก่อนรัน:** เปิด firewall (22, 80, 443, 8545, 30303 บน validator); genesis + validator key ตรงกัน; `.env` บน AU มี `FAUCET_PRIVATE_KEY`

---

## 1. Allocation of Two VPS

| VPS | IP | Role | Services |
|-----|-----|------|----------|
| **EU — Validator #1 + OS** | **217.216.109.5** | Consensus + RPC + **Nakharax OS UI** | `nakharax-node` + `apps/os-dashboard` (Next.js :3030, nginx → `app.nakharax.com`) |
| **AU — Validator #2 + Infra** | **46.250.244.4** | Consensus + public services | `docker-compose.vps.yml`: validator/RPC, nginx, explorer, api, faucet, postgres, redis, monitoring |

### Public endpoints

| Domain | Backend | Host |
|--------|---------|------|
| `app.nakharax.com` | os-dashboard :3030 | EU `217.216.109.5` |
| `rpc.nakharax.com` | `rpc-node:8545` | AU `46.250.244.4` |
| `rpc-au.nakharax.com` | `rpc-node:8545` | AU |
| `explorer.nakharax.com` | `explorer-backend:3001` | AU |
| `api.nakharax.com` | `explorer-backend:3001` | AU |
| `faucet.nakharax.com` | `faucet:3002` | AU |

### Rationale

- **Two validators** required for consensus (EU + AU in genesis).
- **All user-facing services on AU** — single `docker-compose.vps.yml`, one TLS termination point, faucet uses local RPC (`http://rpc-node:8545`).
- **EU** — validator + RPC + Obsidian OS dashboard (user-facing control plane).
- **AU** — chain infra (rpc HTTPS, explorer, api, faucet); no duplicate OS UI.

### Approximate resources

| VPS | CPU | RAM | Notes |
|-----|-----|-----|-------|
| EU | 4 vCPU | ~6–8 GB | node + RPC + OS |
| AU | 4 vCPU | **8 GB+ recommended** | node + nginx + explorer + postgres + faucet + redis — monitor RAM |

---

## 2. Prerequisites Before Genesis

- [ ] **Genesis file** — chain_id 86137, validators EU + AU
- [ ] **Validator keys** — แต่ละ VPS มี key ตรง genesis
- [ ] **Faucet key** — `FAUCET_PRIVATE_KEY` ใน `.env` บน AU (`46.250.244.4`)
- [ ] **Firewall** — EU & AU: 22, 8545, 30303; AU เพิ่ม 80, 443
- [ ] **Explorer nginx** — rename `explorer.conf.disabled` → `explorer.conf` ก่อน reload nginx

---

## 3. Timeline — Complete Within This Month

### Week 1: Validators + Genesis

| Day | Task |
|-----|------|
| 1–2 | Genesis (86137), validator keys, IPs 217.216.109.5 + 46.250.244.4 |
| 2–3 | Deploy node EU + AU; same genesis |
| 3–5 | P2P peers, block production, height match ทั้งสอง RPC |

### Week 2: AU all-in-one stack

| Day | Task |
|-----|------|
| 1–2 | Copy `ops/deploy` to `/opt/nakharax` on AU; `cp .env.example .env` |
| 2–3 | `docker compose -f docker-compose.vps.yml up -d` |
| 3–4 | DNS: rpc, explorer, api, faucet → `46.250.244.4` |
| 4–5 | Test faucet + explorer; `check-vps-status.sh --detailed` |

### Week 3: SSL + Frontend

| Day | Task |
|-----|------|
| 1–2 | Certbot certificates (setup-vps.sh หรือ manual) |
| 2–4 | Deploy OS on EU: [VPS_EU_OS_DASHBOARD.md](../web/VPS_EU_OS_DASHBOARD.md); `NEXT_PUBLIC_RPC_URL=https://rpc.nakharax.com` |
| 4–5 | MetaMask add network + faucet flow |

### Week 4: Go live

| Day | Task |
|-----|------|
| 1–2 | `verify-launch-ready.sh` |
| 2–7 | Announce + monitor (Grafana on AU via SSH tunnel) |

---

## 4. Commands / Reference Files

- Genesis: `core/tools/create_genesis.py`, `core/core/genesis/src/lib.rs`
- Validator update: `ops/deploy/scripts/update-validator-vps.sh`, `VPS_VALIDATOR_UPDATE.md`
- **AU deploy:** `ops/deploy/VPS_AU_ALL_IN_ONE.md`, `docker-compose.vps.yml`
- RPC check: `curl` eth_chainId ที่ `http://46.250.244.4:8545` หรือ `https://rpc.nakharax.com`
- Nginx: `ops/deploy/nginx/conf.d/`
- Connectivity: `docs/core/CONNECTIVITY_OVERVIEW.md`

---

## 5. Allocation Summary

- **217.216.109.5 (EU):** Validator #1 + RPC + Nakharax OS (`app.nakharax.com`)
- **46.250.244.4 (AU):** Validator #2 + RPC + nginx + explorer + api + faucet + DB

**See also:** [TESTNET_READINESS.md](../TESTNET_READINESS.md) · [GITHUB_READINESS.md](GITHUB_READINESS.md)
