#!/usr/bin/env bash
# =============================================================================
# NakharaX Genesis Public Testnet — VPS-03 Validator 02 1-Click Setup Script
# Host: 217.216.39.77 | Role: Genesis Validator 02 | Address: 0x8a6bff3cedc3d1893740f2453424cd8be2965f1c
# Seeds:
#   VPS-01: /ip4/158.220.127.24/tcp/30303/p2p/12D3KooWPbSJk2fhuqENJDyrcb8y4x5EFJEFHt29sfZ9Tmc3vn2M
#   VPS-02: /ip4/40.160.87.118/tcp/30303/p2p/12D3KooWPeewcUHGcwU72BefJqLmTgzxs4DM8WhTtGFwQnRkHmDE
# =============================================================================

set -euo pipefail

echo "================================================================="
echo "  🚀 NakharaX Genesis Public Testnet — VPS-03 Validator 02 Setup"
echo "================================================================="

# 1. Update OS & Install Tools
echo "[1/5] Installing system packages and dependencies..."
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libssl-dev clang cmake git curl jq ufw ca-certificates

# Install Rust Toolchain if not present
if ! command -v cargo >/dev/null 2>&1; then
    echo "Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
    source "$HOME/.cargo/env"
fi

# 2. Configure Firewall (UFW)
echo "[2/5] Configuring Firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp
sudo ufw --force enable
sudo ufw status verbose

# 3. Clone / Update Repository
echo "[3/5] Fetching NakharaX codebase..."
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
echo "[4/5] Compiling nakharax-node release binary..."
cd "$REPO_DIR/services/core/core"
cargo build --release -p node
sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node

# 5. Bootstrap Node Runtime & Systemd as Validator 02
echo "[5/5] Initializing Validator 02 data and systemd service..."
sudo useradd --system --home /var/lib/nakharax-node --shell /usr/sbin/nologin nakharax 2>/dev/null || true
sudo install -d -o nakharax -g nakharax -m 0750 /var/lib/nakharax-node

BOOTSTRAP_SCRIPT="$REPO_DIR/services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh"
GENESIS="$REPO_DIR/services/core/core/tools/genesis.json"
BOOTSTRAP_NODES="/ip4/158.220.127.24/tcp/30303/p2p/12D3KooWPbSJk2fhuqENJDyrcb8y4x5EFJEFHt29sfZ9Tmc3vn2M,/ip4/40.160.87.118/tcp/30303/p2p/12D3KooWPeewcUHGcwU72BefJqLmTgzxs4DM8WhTtGFwQnRkHmDE"
VALIDATOR_ADDR="0x8a6bff3cedc3d1893740f2453424cd8be2965f1c"

sudo env NAKHARAX_NODE_BIN=/usr/local/bin/nakharax-node \
  NAKHARAX_BOOTSTRAP_NODES="$BOOTSTRAP_NODES" \
  bash "$BOOTSTRAP_SCRIPT" setup \
  --role validator \
  --data-dir /var/lib/nakharax-node \
  --genesis "$GENESIS" \
  --rpc 127.0.0.1:8545 \
  --p2p 0.0.0.0:30303 \
  --validator-address "$VALIDATOR_ADDR"

sudo chown -R nakharax:nakharax /var/lib/nakharax-node

sudo tee /etc/systemd/system/nakharax-node.service >/dev/null <<'EOF'
[Unit]
Description=NakharaX Public Testnet Genesis Validator 02
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

sleep 3

echo "================================================================="
echo "  ✅ VPS-03 Validator 02 Bootstrap Complete!"
echo "================================================================="
echo ""
echo "Local Peer ID:"
VALIDATOR_PEER_ID="$(sudo journalctl -u nakharax-node --no-pager | sed -n 's/.*Local peer ID: \([[:alnum:]]\+\).*/\1/p' | tail -n 1)"
echo "Peer ID: $VALIDATOR_PEER_ID"
echo "Validator Multiaddr: /ip4/217.216.39.77/tcp/30303/p2p/$VALIDATOR_PEER_ID"
echo ""
echo "Validator Status Check:"
curl -s -X POST http://127.0.0.1:8545 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq || true
echo "================================================================="
