#!/usr/bin/env bash
# =============================================================================
# NakharaX Genesis Public Testnet — VPS-01 Web OS Dashboard 1-Click Deploy
# Host: 158.220.127.24 | Ingress: app.nakharax.com, nakharax.com (Port 3030 -> Caddy 443)
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
git fetch --all
git reset --hard origin/master

pnpm install
pnpm --filter nakharax-os-dashboard build

# 3. Start Application with PM2
echo "[3/4] Starting Web OS Dashboard daemon with PM2..."
pm2 delete nakharax-dashboard 2>/dev/null || true
pm2 start pnpm --name "nakharax-dashboard" -- --filter nakharax-os-dashboard start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true

# 4. Update Caddy Reverse Proxy
echo "[4/4] Configuring Caddy Reverse Proxy for app.nakharax.com & nakharax.com..."
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
{
    email admin@nakharax.com
}

rpc.nakharax.com {
    encode zstd gzip
    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
    }
    reverse_proxy 127.0.0.1:8545
}

faucet.nakharax.com {
    encode zstd gzip
    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
    }
    reverse_proxy 127.0.0.1:3002
}

app.nakharax.com, nakharax.com, www.nakharax.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy 127.0.0.1:3030
}
EOF

sudo systemctl reload caddy || sudo systemctl restart caddy

sleep 3

echo "================================================================="
echo "  ✅ NakharaX Web OS Dashboard Live on Production!"
echo "================================================================="
echo ""
echo "  👉 Main App URL: https://app.nakharax.com"
echo "  👉 Landing URL:  https://nakharax.com"
echo "  👉 RPC Endpoint: https://rpc.nakharax.com"
echo "  👉 Faucet API:   https://faucet.nakharax.com"
echo ""
echo "PM2 Process Status:"
pm2 status
echo "================================================================="
