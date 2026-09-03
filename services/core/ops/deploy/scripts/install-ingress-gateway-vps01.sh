#!/usr/bin/env bash
# Install the loopback-only Nginx rate-limit gateway used by VPS-01 Caddy.
# Run as root (or with sudo) from a checked-out NakharaX repository.

set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
    echo "Run as root: sudo bash $0" >&2
    exit 1
fi

REPO_DIR="${NAKHARAX_REPO_DIR:-/opt/nakharax}"
SOURCE_CONFIG="${REPO_DIR}/services/core/ops/deploy/environments/testnet/three-vps/vps01/nginx-ingress-gateway.conf"
CONFIG_DIR="/etc/nakharax-ingress-gateway"
CONFIG_PATH="${CONFIG_DIR}/nginx.conf"
UNIT_PATH="/etc/systemd/system/nakharax-ingress-gateway.service"

test -f "${SOURCE_CONFIG}"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx

# The distribution service owns public port 80 by default; Caddy owns public
# ingress here, so keep that service disabled and run only our loopback unit.
systemctl disable --now nginx || true

install -d -o root -g root -m 0755 "${CONFIG_DIR}"
install -d -o www-data -g adm -m 0750 /var/log/nakharax-ingress-gateway
install -o root -g root -m 0644 "${SOURCE_CONFIG}" "${CONFIG_PATH}"

cat >"${UNIT_PATH}" <<'EOF'
[Unit]
Description=NakharaX VPS-01 loopback ingress rate-limit gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
RuntimeDirectory=nakharax-ingress-gateway
RuntimeDirectoryMode=0755
ExecStartPre=/usr/sbin/nginx -t -c /etc/nakharax-ingress-gateway/nginx.conf
ExecStart=/usr/sbin/nginx -c /etc/nakharax-ingress-gateway/nginx.conf -g 'daemon off;'
ExecReload=/usr/sbin/nginx -s reload -c /etc/nakharax-ingress-gateway/nginx.conf
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=full
ReadWritePaths=/run/nakharax-ingress-gateway /var/log/nakharax-ingress-gateway /var/lib/nginx

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now nakharax-ingress-gateway
systemctl --no-pager --full status nakharax-ingress-gateway
ss -ltnp | grep -F '127.0.0.1:8081'

# Verify that the gateway can reach the loopback-only node before Caddy is
# reloaded to use it. This is read-only and fails closed on a bad deployment.
curl -fsS --max-time 5 \
    -H 'Host: rpc.nakharax.com' \
    -H 'Content-Type: application/json' \
    -X POST http://127.0.0.1:8081 \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    | grep -q '"result"'
