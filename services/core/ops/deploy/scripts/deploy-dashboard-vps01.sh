#!/usr/bin/env bash
# =============================================================================
# NakharaX Genesis Public Testnet — VPS-01 Web OS Dashboard 1-Click Deploy
# Ingress: app.nakharax.com, nakharax.com (Port 3030 -> Caddy 443)
# =============================================================================

set -euo pipefail

echo "================================================================="
echo "  🚀 NakharaX Web OS Dashboard — VPS-01 Production Deployment"
echo "================================================================="

# 1. Install Node.js 20 LTS & pnpm & PM2
echo "[1/4] Installing Node.js 20 LTS, pnpm, and PM2..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

sudo npm install -g pnpm pm2

# 2. Build Dashboard Application
echo "[2/4] Updating repository and compiling Next.js dashboard..."
cd /opt/nakharax
git pull --ff-only origin master

pnpm install --frozen-lockfile
pnpm --filter nakharax-os-dashboard build

# 3. Start Application with PM2
echo "[3/4] Starting Web OS Dashboard daemon with PM2..."
if pm2 describe nakharax-dashboard >/dev/null 2>&1; then
    PORT=3030 pm2 reload nakharax-dashboard --update-env
else
    PORT=3030 pm2 start pnpm --name "nakharax-dashboard" -- --filter nakharax-os-dashboard start
fi
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true

# 4. Install the loopback-only rate-limit gateway, then update Caddy.
echo "[4/4] Installing the VPS-01 ingress gateway and Caddy configuration..."
sudo env NAKHARAX_REPO_DIR="$PWD" bash "$PWD/services/core/ops/deploy/scripts/install-ingress-gateway-vps01.sh"
CADDY_TEMPLATE="$PWD/services/core/ops/deploy/environments/testnet/three-vps/vps01/Caddyfile"
test -f "$CADDY_TEMPLATE"
sudo install -o root -g root -m 0644 "$CADDY_TEMPLATE" /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy

sleep 3

echo "================================================================="
echo "  ✅ NakharaX Web OS Dashboard Live on Production!"
echo "================================================================="
echo ""
echo "  👉 Main App URL: https://app.nakharax.com"
echo "  👉 Landing URL:  https://nakharax.com"
echo "  👉 RPC Endpoint: https://rpc.nakharax.com"
echo "  👉 Explorer:     https://explorer.nakharax.com"
echo "  👉 HTTP API:     https://api.nakharax.com/v1/models"
echo "  👉 Faucet API:   https://faucet.nakharax.com (requires a healthy local faucet)"
echo ""
echo "PM2 Process Status:"
pm2 status
echo "================================================================="
