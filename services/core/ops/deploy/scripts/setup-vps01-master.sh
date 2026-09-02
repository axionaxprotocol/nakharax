#!/usr/bin/env bash
# =============================================================================
# NakharaX Genesis Public Testnet — VPS-01 Master Hub 1-Click Bootstrap Script
# Chain ID: 86137 | Port: 30303 (P2P), 8545 (loopback RPC)
# =============================================================================

set -euo pipefail

echo "================================================================="
echo "  🚀 NakharaX Genesis Public Testnet — VPS-01 Full Node & Bootstrap Setup"
echo "================================================================="

# 1. Update OS & Install Tools
echo "[1/6] Installing system packages and dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libssl-dev clang cmake git curl jq ufw ca-certificates debian-keyring debian-archive-keyring apt-transport-https

# Install Caddy
if ! command -v caddy >/dev/null 2>&1; then
    echo "Installing Caddy web server..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt-get update
    sudo apt-get install -y caddy
fi

# Install Rust Toolchain if not present
if ! command -v cargo >/dev/null 2>&1; then
    echo "Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
    source "$HOME/.cargo/env"
fi

# 2. Configure Firewall (UFW)
echo "[2/6] Configuring Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose

# 3. Clone / Update Repository
echo "[3/6] Fetching NakharaX codebase..."
REPO_DIR="/opt/nakharax"
if [ ! -d "$REPO_DIR" ]; then
    sudo git clone https://github.com/axionaxprotocol/nakharax.git "$REPO_DIR"
    sudo chown -R "$USER":"$USER" "$REPO_DIR"
else
    cd "$REPO_DIR"
    git fetch --all
fi
cd "$REPO_DIR"

# 4. Build Release Binaries
echo "[4/6] Compiling nakharax-node and faucet release binaries..."
cd "$REPO_DIR/services/core/core"
cargo build --release -p node
sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node

cargo build --release -p nakharax-faucet
sudo install -o root -g root -m 0755 target/release/nakharax-faucet /usr/local/bin/nakharax-faucet

# 5. Bootstrap Node Runtime & Systemd
echo "[5/6] Initializing node data and systemd service..."
sudo useradd --system --home /var/lib/nakharax-node --shell /usr/sbin/nologin nakharax 2>/dev/null || true
sudo install -d -o nakharax -g nakharax -m 0750 /var/lib/nakharax-node

BOOTSTRAP_SCRIPT="$REPO_DIR/services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh"
GENESIS="$REPO_DIR/services/core/core/tools/genesis.json"

sudo env NAKHARAX_NODE_BIN=/usr/local/bin/nakharax-node \
  bash "$BOOTSTRAP_SCRIPT" setup \
  --role full \
  --data-dir /var/lib/nakharax-node \
  --genesis "$GENESIS" \
  --rpc 127.0.0.1:8545 \
  --p2p 0.0.0.0:30303

sudo chown -R nakharax:nakharax /var/lib/nakharax-node

sudo tee /etc/systemd/system/nakharax-node.service >/dev/null <<'EOF'
[Unit]
Description=NakharaX Public Testnet Full Node & Bootstrap Node
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=nakharax
Group=nakharax
WorkingDirectory=/var/lib/nakharax-node
ExecStart=/var/lib/nakharax-node/run.sh
Restart=always
RestartSec=10
LimitNOFILE=65536
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/nakharax-node

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now nakharax-node

# 6. Configure Caddy TLS Reverse Proxy
echo "[6/6] Installing the versioned VPS-01 Caddy configuration..."
CADDY_TEMPLATE="$REPO_DIR/ops/deploy/environments/testnet/three-vps/vps01/Caddyfile"
test -f "$CADDY_TEMPLATE"
sudo install -o root -g root -m 0644 "$CADDY_TEMPLATE" /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy

sleep 3

echo "================================================================="
echo "  ✅ VPS-01 Full Node & Bootstrap Setup Complete!"
echo "================================================================="
echo ""
echo "Local Peer ID:"
SEED_PEER_ID="$(sudo journalctl -u nakharax-node --no-pager | sed -n 's/.*Local peer ID: \([[:alnum:]]\+\).*/\1/p' | tail -n 1)"
echo "Peer ID: $SEED_PEER_ID"
echo "Bootstrap multiaddr: /ip4/<VPS-01_PUBLIC_IPV4>/tcp/30303/p2p/$SEED_PEER_ID"
echo ""
echo "RPC Health Check:"
curl -s -X POST http://127.0.0.1:8545 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq || true
echo "================================================================="
