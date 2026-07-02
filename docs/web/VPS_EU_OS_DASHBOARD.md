# Deploy Nakharax OS Dashboard on EU (217.216.109.5)

**Host:** `217.216.109.5` (EU)  
**App:** `apps/os-dashboard` (Next.js 14, Obsidian OS UI)  
**Suggested domain:** `https://app.nakharax.io` (หรือ `https://os.nakharax.io`)

Chain services (RPC, explorer, faucet) อยู่บน **46.250.244.4 (AU)** — OS dashboard บน EU เรียก RPC ผ่าน HTTPS สาธารณะ

---

## สถาปัตยกรรม

| VPS | IP | บทบาท |
|-----|-----|--------|
| **EU** | 217.216.109.5 | Validator #1 + RPC + **Nakharax OS** (port 3030) |
| **AU** | 46.250.244.4 | Validator #2 + rpc / explorer / api / faucet |

---

## 1. สิ่งที่ต้องมีบน EU

| รายการ | หมายเหตุ |
|--------|----------|
| Node.js 20+ | `node -v` |
| pnpm 10+ | `npm i -g pnpm` |
| PM2 | `npm i -g pm2` |
| Nginx | TLS + `proxy_pass` → `127.0.0.1:3030` |
| Git | clone monorepo |

---

## 2. Environment

```bash
cd /opt/nakharax/apps/os-dashboard
cp .env.example .env.production
nano .env.production
```

อย่างน้อย:

```env
NODE_ENV=production
NEXT_PUBLIC_CHAIN_ID=86137
NEXT_PUBLIC_RPC_URL=https://rpc.nakharax.io
NEXT_PUBLIC_RPC_EU=http://217.216.109.5:8545
NEXT_PUBLIC_RPC_AU=http://46.250.244.4:8545
PORT=3030
```

---

## 3. Build & run (standalone)

จาก **repo root** (`/opt/nakharax`):

```bash
pnpm install
pnpm --filter nakharax-os-dashboard build

# Standalone output
cd apps/os-dashboard
cp -r .next/static .next/standalone/apps/os-dashboard/.next/static
cp -r public .next/standalone/apps/os-dashboard/public

PORT=3030 pm2 start .next/standalone/apps/os-dashboard/server.js --name nakharax-os
pm2 save
```

หรือใช้สคริปต์:

```bash
bash apps/os-dashboard/scripts/vps-deploy.sh
```

---

## 4. Nginx (ตัวอย่าง)

คัดลอก [`apps/os-dashboard/nginx/app.nakharax.io.conf.example`](../../apps/os-dashboard/nginx/app.nakharax.io.conf.example) ไป `/etc/nginx/sites-enabled/` แล้ว:

```bash
certbot certonly --nginx -d app.nakharax.io
nginx -t && systemctl reload nginx
```

DNS: **A record** `app.nakharax.io` → `217.216.109.5`

---

## 5. Firewall (EU)

| พอร์ต | บริการ |
|------|--------|
| 22 | SSH |
| 80, 443 | Nginx → OS dashboard |
| 8545, 30303 | Validator RPC + P2P (ถ้ารัน node บนเครื่องเดียวกัน) |

---

## 6. ตรวจสอบ

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3030/
# คาดหวัง 200

curl -sI https://app.nakharax.io | head -1
```

---

## อ้างอิง

- [apps/os-dashboard/README.md](../../apps/os-dashboard/README.md)
- AU chain stack: [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md)
- Validator update: [VPS_VALIDATOR_UPDATE.md](../../services/core/ops/deploy/VPS_VALIDATOR_UPDATE.md)
