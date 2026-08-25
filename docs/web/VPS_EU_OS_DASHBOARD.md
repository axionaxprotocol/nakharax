# Deploying NakharaX OS Dashboard on EU VPS (217.216.109.5)

**Target Host:** `217.216.109.5` (Frankfurt, EU)  
**Application Target:** `apps/os-dashboard` (Next.js 14 App Router, Obsidian UI)  
**Target Domain:** `https://app.nakharax.com` (or `https://os.nakharax.com`)  

Chain services (RPC, Explorer, Faucet) reside on **`46.250.244.4` (AU)**. The EU OS Dashboard communicates with the public RPC over HTTPS.

---

## Topology Overview

| VPS Region | IP Address | Primary Roles & Services |
|---|---|---|
| **EU (Germany)** | `217.216.109.5` | Validator #1 + RPC Ingress + **NakharaX OS Dashboard** (`:3030`) |
| **AU (Australia)**| `46.250.244.4` | Validator #2 + RPC + Block Explorer + Faucet API |

---

## 1. Environment Requirements (EU VPS)

| Dependency | Inspection Command / Action |
|---|---|
| **Node.js 20+** | `node -v` |
| **pnpm 10+** | `npm i -g pnpm` |
| **PM2** | `npm i -g pm2` |
| **Nginx** | TLS Termination + `proxy_pass` → `127.0.0.1:3030` |
| **Git** | Repository clone |

---

## 2. Environment Configuration

```bash
cd /opt/nakharax/apps/os-dashboard
cp .env.example .env.production
nano .env.production
```

Minimal `.env.production` setup:

```env
NODE_ENV=production
NEXT_PUBLIC_CHAIN_ID=86137
NEXT_PUBLIC_RPC_URL=https://rpc.nakharax.com
NEXT_PUBLIC_RPC_EU=http://217.216.109.5:8545
NEXT_PUBLIC_RPC_AU=http://46.250.244.4:8545
PORT=3030
```

---

## 3. Build & Standalone Deployment

From the **Monorepo Root** (`/opt/nakharax`):

```bash
pnpm install
pnpm --filter nakharax-os-dashboard build

# Standalone Bundle Output Configuration
cd apps/os-dashboard
cp -r .next/static .next/standalone/apps/os-dashboard/.next/static
cp -r public .next/standalone/apps/os-dashboard/public

PORT=3030 pm2 start .next/standalone/apps/os-dashboard/server.js --name nakharax-os
pm2 save
```

Or execute automated script:

```bash
bash apps/os-dashboard/scripts/vps-deploy.sh
```

---

## 4. Nginx Configuration & SSL

Copy [`apps/os-dashboard/nginx/app.nakharax.com.conf.example`](../../apps/os-dashboard/nginx/app.nakharax.com.conf.example) to `/etc/nginx/sites-enabled/`, then execute:

```bash
certbot certonly --nginx -d app.nakharax.com
nginx -t && systemctl reload nginx
```

DNS Requirement: **A Record** `app.nakharax.com` → `217.216.109.5`

---

## 5. Firewall Specification (EU VPS)

| Port | Protocol / Service |
|---|---|
| **22** | SSH Management |
| **80, 443** | Nginx Reverse Proxy (HTTPS Dashboard) |
| **8545, 30303** | Validator RPC + P2P Swarm |

---

## 6. Health & Ingress Verification

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/
# Expected Output: 200

curl -sI https://app.nakharax.com | head -1
```

---

## Related References

- [apps/os-dashboard/README.md](../../apps/os-dashboard/README.md)
- AU Chain Stack: [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md)
- Validator Update Manual: [VPS_VALIDATOR_UPDATE.md](../../services/core/ops/deploy/VPS_VALIDATOR_UPDATE.md)
