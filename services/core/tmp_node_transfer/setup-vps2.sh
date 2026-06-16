#!/usr/bin/env bash
set -euo pipefail

# Setup VPS2 (217.216.109.5) as a full node bootstrapping to VPS3 (46.250.244.4)

VPS3_PEER_ID="12D3KooWQY4NaM13vP6Vrx5Q4MWFQHGKj5qigtg81WC2J1Cca7ZK"
VPS3_IP="46.250.244.4"
BOOTSTRAP_MULTIADDR="/ip4/${VPS3_IP}/tcp/30303/p2p/${VPS3_PEER_ID}"

echo "[1/6] Making binary executable..."
chmod +x /usr/local/bin/nakhara-node

echo "[2/6] Generating libp2p identity key (32 random bytes)..."
if [[ ! -f /var/lib/nakhara-node/identity.key ]]; then
  openssl rand -out /var/lib/nakhara-node/identity.key 32
  chmod 600 /var/lib/nakhara-node/identity.key
fi

echo "[3/6] Writing /var/lib/nakhara-node/node.env..."
cat > /var/lib/nakhara-node/node.env <<EOF
# Nakhara full node config (bootstrap → VPS3)
NAKHARA_ROLE=full
NAKHARA_STATE_PATH=/var/lib/nakhara-node
NAKHARA_GENESIS=/var/lib/nakhara-node/genesis.json
NAKHARA_RPC=0.0.0.0:8545
NAKHARA_P2P=0.0.0.0:30303
NAKHARA_BOOTSTRAP_NODES=${BOOTSTRAP_MULTIADDR}
NAKHARA_VALIDATOR_ADDRESS=
NAKHARA_IDENTITY_KEY=/var/lib/nakhara-node/identity.key
NAKHARA_NODE_BIN=/usr/local/bin/nakhara-node
EOF

echo "[4/6] Writing /var/lib/nakhara-node/run.sh..."
cat > /var/lib/nakhara-node/run.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1090
source "$HERE/node.env"
set +a
if [[ -z "${NAKHARA_BOOTSTRAP_NODES:-}" ]]; then
  echo "warning: NAKHARA_BOOTSTRAP_NODES is empty — public testnet peers may not connect" >&2
fi
export NAKHARA_BOOTSTRAP_NODES
ARGS=(
  --role "$NAKHARA_ROLE"
  --chain "$NAKHARA_GENESIS"
  --rpc "$NAKHARA_RPC"
  --state-path "$NAKHARA_STATE_PATH"
  --identity-key "$NAKHARA_IDENTITY_KEY"
)
if [[ -n "${NAKHARA_P2P:-}" ]]; then
  ARGS+=(--p2p "$NAKHARA_P2P")
fi
if [[ -n "${NAKHARA_VALIDATOR_ADDRESS:-}" ]]; then
  ARGS+=(--validator-address "$NAKHARA_VALIDATOR_ADDRESS")
fi
exec "$NAKHARA_NODE_BIN" "${ARGS[@]}"
EOF
chmod +x /var/lib/nakhara-node/run.sh

echo "[5/6] Writing /etc/systemd/system/nakhara-node.service..."
cat > /etc/systemd/system/nakhara-node.service <<'EOF'
[Unit]
Description=Nakhara nakhara-node (/var/lib/nakhara-node)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/var/lib/nakhara-node/run.sh
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
systemctl enable nakhara-node
systemctl restart nakhara-node
sleep 5
systemctl status nakhara-node --no-pager | head -20
echo
echo "=== Recent logs ==="
journalctl -u nakhara-node --no-pager -n 30
