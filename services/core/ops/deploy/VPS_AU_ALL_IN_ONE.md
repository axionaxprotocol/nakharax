# VPS AU — All-in-One Service Node (46.250.244.4)

**Last updated:** 2026-05-24

โหนด **46.250.244.4 (AU)** รัน stack บริการ testnet แบบรวมศูนย์ด้วย `docker-compose.vps.yml`:

| บทบาท | Container | พอร์ตภายใน | โดเมน (DNS → 46.250.244.4) |
|--------|-----------|------------|----------------------------|
| Validator + RPC + P2P | `nakharax-rpc` | 8545, 8546, 30303 | `rpc.nakharaxx.io`, `rpc-au.nakharaxx.io` |
| Explorer (backend + UI proxy) | `nakharax-explorer-backend` | 3001 | `explorer.nakharaxx.io` |
| REST / indexer API | same as explorer | 3001 | `api.nakharaxx.io` |
| Faucet | `nakharax-faucet` | 3002 | `faucet.nakharaxx.io` |
| TLS + reverse proxy | `nakharax-nginx` | 80, 443 | ทุก subdomain ด้านบน |
| Postgres / Redis | internal | — | ไม่เปิดสู่ internet |

โหนด **217.216.109.5 (EU)** เป็น **Validator #1 + RPC** และโฮสต์ **Nakharax OS** (`apps/os-dashboard`) — ดู [VPS_EU_OS_DASHBOARD.md](../../../docs/web/VPS_EU_OS_DASHBOARD.md)

---

## Quick deploy

```bash
# บน VPS AU
ssh root@46.250.244.4
mkdir -p /opt/nakharax && cd /opt/nakharax
# copy ops/deploy/* (compose, nginx, configs, .env.example) หรือ clone repo

cp .env.example .env
nano .env   # DB_PASSWORD, REDIS_PASSWORD, FAUCET_PRIVATE_KEY, GRAFANA_PASSWORD
# VPS_IP=46.250.244.4

# เปิดใช้ explorer nginx (ถ้ายัง disabled)
mv nginx/conf.d/explorer.conf.disabled nginx/conf.d/explorer.conf

docker compose -f docker-compose.vps.yml up -d
bash scripts/check-vps-status.sh --detailed
```

---

## DNS (A record → 46.250.244.4)

| Host | ใช้สำหรับ |
|------|-----------|
| `rpc.nakharaxx.io` | JSON-RPC HTTPS (+ `/ws` WebSocket) |
| `rpc-au.nakharaxx.io` | RPC สำรอง / region AU |
| `explorer.nakharaxx.io` | Block explorer UI |
| `api.nakharaxx.io` | Explorer REST API (proxy ไป `explorer-backend:3001`) |
| `faucet.nakharaxx.io` | Testnet faucet |

---

## Firewall

| พอร์ต | บริการ |
|------|--------|
| 22 | SSH |
| 80, 443 | nginx + Certbot |
| 8545 | RPC ตรง (optional — แนะนำใช้ HTTPS ผ่าน nginx) |
| 30303/tcp+udp | P2P ระหว่าง EU ↔ AU |

---

## ตรวจสอบหลัง deploy

```bash
# บน VPS
curl -s -X POST http://localhost:8545 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
# คาดหวัง "0x15079" (86137)

# จากภายนอก (หลัง DNS + SSL)
curl -s -X POST https://rpc.nakharaxx.io \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

---

## ทรัพยากร

Stack เต็ม (node + explorer + postgres + faucet + monitoring) บน **8 GB RAM** จะแน่น — monitor ด้วย `check-vps-status.sh` และ Grafana (localhost:3030 ผ่าน SSH tunnel)

---

## ไฟล์อ้างอิง

| ไฟล์ | หมายเหตุ |
|------|----------|
| `docker-compose.vps.yml` | Compose หลัก |
| `nginx/conf.d/*.conf` | rpc, api, faucet, explorer |
| `configs/rpc-config.toml` | chain_id 86137 |
| `scripts/check-vps-status.sh` | health check |
| `VPS_VALIDATOR_UPDATE.md` | อัปเดตทั้ง EU + AU |

**แผนเก่า (VPS3 แยก infra ที่ EU):** deprecated — ดู `VPS3_FAUCET_DEPLOY.md`

**เอกสารสถาปัตยกรรม:** [GENESIS_PUBLIC_TESTNET_PLAN.md](../../../docs/core/GENESIS_PUBLIC_TESTNET_PLAN.md) · [CONNECTIVITY_OVERVIEW.md](../../../docs/core/CONNECTIVITY_OVERVIEW.md)
