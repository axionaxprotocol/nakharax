# Production VPS Web Deployment Playbook (NakharaX Universe)

This manual documents the standard deployment workflow: **Server Clone/Pull → `pnpm build` → Next.js Standalone + PM2 → Nginx Reverse Proxy (`127.0.0.1:3000`)**.

---

## 1. Prerequisites (Target VPS)

| Requirement | Inspection & Installation |
|---|---|
| **Node.js** | Node.js v20+ (`node -v`) |
| **pnpm** | `npm i -g pnpm` |
| **PM2** | `npm i -g pm2` |
| **Git** | SSH Authentication recommended (`git@github.com:...`) |
| **Nginx** | Reverse Proxy targeting `http://127.0.0.1:3000` |

---

## 2. Server Directory Topology

- **Root Application Path (`APP_DIR`):** `/opt/nakharax`
- **Standalone Execution Entry:** `apps/web/.next/standalone/apps/web/server.js`
- **Target Ingress Port:** `PORT=3000`

---

## 3. Environment Configuration

Create **`apps/web/.env.production`** on the target VPS prior to executing builds:

```env
NODE_ENV=production
NEXT_PUBLIC_CHAIN_ID=86137
NEXT_PUBLIC_RPC_URL=https://rpc.nakharax.com
NEXT_PUBLIC_FAUCET_URL=https://faucet.nakharax.com
FAUCET_API_URL=https://faucet-api.nakharax.com
```

If utilizing internal reverse proxies on identical domains, map `NEXT_PUBLIC_RPC_EU` / `NEXT_PUBLIC_RPC_AU` to path endpoints such as `/rpc/eu`.

### Site Visitor Analytics Persistence (Footer Counter)
Analytics data persists to `apps/web/data/site-visitors.json`. To prevent state loss across standalone rebuilds, set:

```env
VISITOR_DATA_DIR=/var/lib/nakharax-web
```

Initialize directory on VPS:
```bash
sudo mkdir -p /var/lib/nakharax-web && sudo chown $(whoami) /var/lib/nakharax-web
```

---

## 4. Initial Installation Workflow

Clone repository on target VPS and execute build steps:

```bash
git clone git@github.com:axionaxprotocol/nakharax.git /opt/nakharax
cd /opt/nakharax
```

---

## 5. Deployment Update Pipeline (Post-Push to `main`)

### Linux / macOS / Git Bash Execution

```bash
ssh root@YOUR_VPS_IP 'bash -s' < scripts/vps-update-and-restart.sh
```

### Windows PowerShell Execution

From root directory:

```powershell
cd D:\nakhara-io
.\scripts\vps-update-from-windows.ps1 -HostName root@YOUR_VPS_IP
```

### Manual SCP / SSH Deployment Workflow

```powershell
scp .\scripts\vps-update-and-restart.sh root@YOUR_VPS_IP:/tmp/vps-update.sh
ssh root@YOUR_VPS_IP "sed -i 's/\r$//' /tmp/vps-update.sh && bash /tmp/vps-update.sh"
```

Or execute manual step-by-step pipeline:

1. `cd /opt/nakharax && git pull origin main`
2. `pnpm install --frozen-lockfile`
3. `pnpm --filter @nakharax/blockchain-utils build`
4. `pnpm --filter @nakharax/sdk build`
5. `pnpm --filter @nakharax/web build`
6. Copy `.next/static` and `public` to standalone directory.
7. `pm2 restart nakharax-web`

---

## 6. Post-Deployment Verification

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
pm2 logs nakharax-web --lines 30
```

Nginx configuration templates: `apps/web/nginx/conf.d/nakharax-standalone.conf.example` and `apps/web/nginx/conf.d/nakharax.conf`.

---

## 7. Docker Compose Orchestration

The root `docker-compose.yml` prioritizes **FastAPI Backend + PostgreSQL + Redis**. Web interface standalone deployment utilizes the PM2 pipeline documented above.

---

## References

- `scripts/vps-update-and-restart.sh` — Pull, build, and restart script.
- `deploy-vps.ps1` (root) — Windows build & upload helper.
- `docs/DEPLOY.md` — Comprehensive deployment options index.
