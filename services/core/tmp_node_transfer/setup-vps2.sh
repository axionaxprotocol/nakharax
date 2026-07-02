#!/usr/bin/env bash
set -euo pipefail

# Setup VPS2 (217.216.109.5) as a full node bootstrapping to VPS3 (46.250.244.4)

VPS3_PEER_ID="12D3KooWQY4NaM13vP6Vrx5Q4MWFQHGKj5qigtg81WC2J1Cca7ZK"
VPS3_IP="46.250.244.4"
BOOTSTRAP_MULTIADDR="/ip4/${VPS3_IP}/tcp/30303/p2p/${VPS3_PEER_ID}"

echo "[1/6] Making binary executable..."
chmod +x /usr/local/bin/nakharax-node

echo "[2/6] Generating libp2p identity key (32 random bytes)..."
if [[ ! -f /var/lib/nakharax-node/identity.key ]]; then
  openssl rand -out /var/lib/nakharax-node/identity.key 32
  chmod 600 /var/lib/nakharax-node/identity.key
fi

echo "[3/6] Writing /var/lib/nakharax-node/node.env..."
cat > /var/lib/nakharax-node/node.env <<EOF
# Nakharax full node config (bootstrap → VPS3)
NAKHARAX_ROLE=full
NAKHARAX_STATE_PATH=/var/lib/nakharax-node
NAKHARAX_GENESIS=/var/lib/nakharax-node/genesis.json
NAKHARAX_RPC=0.0.0.0:8545
NAKHARAX_P2P=0.0.0.0:30303
NAKHARAX_BOOTSTRAP_NODES=${BOOTSTRAP_MULTIADDR}
NAKHARAX_VALIDATOR_ADDRESS=
NAKHARAX_IDENTITY_KEY=/var/lib/nakharax-node/identity.key
NAKHARAX_NODE_BIN=/usr/local/bin/nakharax-node
EOF

echo "[4/6] Writing /var/lib/nakharax-node/run.sh..."
cat > /var/lib/nakharax-node/run.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1090
source "$HERE/node.env"
set +a
if [[ -z "${NAKHARAX_BOOTSTRAP_NODES:-}" ]]; then
  echo "warning: NAKHARAX_BOOTSTRAP_NODES is empty — public testnet peers may not connect" >&2
fi
export NAKHARAX_BOOTSTRAP_NODES
ARGS=(
  --role "$NAKHARAX_ROLE"
  --chain "$NAKHARAX_GENESIS"
  --rpc "$NAKHARAX_RPC"
  --state-path "$NAKHARAX_STATE_PATH"
  --identity-key "$NAKHARAX_IDENTITY_KEY"
)
if [[ -n "${NAKHARAX_P2P:-}" ]]; then
  ARGS+=(--p2p "$NAKHARAX_P2P")
fi
if [[ -n "${NAKHARAX_VALIDATOR_ADDRESS:-}" ]]; then
  ARGS+=(--validator-address "$NAKHARAX_VALIDATOR_ADDRESS")
fi
exec "$NAKHARAX_NODE_BIN" "${ARGS[@]}"
EOF
chmod +x /var/lib/nakharax-node/run.sh

echo "[5/6] Writing /etc/systemd/system/nakharax-node.service..."
cat > /etc/systemd/system/nakharax-node.service <<'EOF'
[Unit]
Description=Nakharax nakharax-node (/var/lib/nakharax-node)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/var/lib/nakharax-node/run.sh
Restart=always
RestartSec=10
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "[6/6] Reloading systemd + enabling/starting service..."
systemctl daemon-reload
systemctl enable nakharax-node
systemctl restart nakharax-node
sleep 5
systemctl status nakharax-node --no-pager | head -20
echo
echo "=== Recent logs ==="
journalctl -u nakharax-node --no-pager -n 30
