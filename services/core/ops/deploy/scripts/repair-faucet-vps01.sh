#!/usr/bin/env bash
# Repair and verify the testnet faucet co-located with VPS-01's full node.
#
# The signer secret stays in ops/deploy/.env.faucet on the VPS and is never
# printed, copied, or stored in this repository.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.faucet.yml"
ENV_FILE="${FAUCET_ENV_FILE:-${DEPLOY_DIR}/.env.faucet}"
CORE_WORKSPACE="${DEPLOY_DIR}/../../core"
FAUCET_BIN="${FAUCET_BIN:-/usr/local/bin/nakharax-faucet}"
RPC_PAYLOAD='{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

fail() {
    echo "ERROR: $*" >&2
    exit 1
}

echo "================================================================="
echo "  NakharaX Testnet Faucet Repair — VPS-01"
echo "================================================================="

test -f "${ENV_FILE}" || fail "Secret env file not found: ${ENV_FILE}"

# Never source the file: it contains the faucet signing key. Check only that
# a non-empty assignment exists, without displaying its value.
grep -Eq '^[[:space:]]*FAUCET_PRIVATE_KEY=[^[:space:]#]+' "${ENV_FILE}" || \
    fail "FAUCET_PRIVATE_KEY is absent or empty in ${ENV_FILE}"
chmod 600 "${ENV_FILE}"

echo "[1/4] Checking the local testnet RPC..."
rpc_response="$(curl -fsS --max-time 8 -X POST http://127.0.0.1:8545 \
    -H 'Content-Type: application/json' --data "${RPC_PAYLOAD}")" || \
    fail "Local RPC at 127.0.0.1:8545 did not respond."
grep -Eq '"result"[[:space:]]*:[[:space:]]*"0x15079"' <<<"${rpc_response}" || \
    fail "Local RPC did not report chain ID 86137."

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    test -f "${COMPOSE_FILE}" || fail "Compose file not found: ${COMPOSE_FILE}"
    FAUCET_MODE="docker"
    echo "[2/4] Building and starting the faucet container..."
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --build
else
    FAUCET_MODE="systemd"
    echo "[2/4] Docker is unavailable; preparing the native faucet service..."

    if [[ ! -x "${FAUCET_BIN}" ]]; then
        command -v cargo >/dev/null 2>&1 || \
            fail "Docker is unavailable and cargo is required to build the native faucet."
        test -d "${CORE_WORKSPACE}" || fail "Core workspace not found: ${CORE_WORKSPACE}"
        echo "Building nakharax-faucet from source..."
        (
            cd "${CORE_WORKSPACE}"
            cargo build --release -p nakharax-faucet
        )
        sudo install -o root -g root -m 0755 \
            "${CORE_WORKSPACE}/target/release/nakharax-faucet" "${FAUCET_BIN}"
    fi

    if ! id -u nakharax-faucet >/dev/null 2>&1; then
        sudo useradd --system --home /var/lib/nakharax-faucet \
            --shell /usr/sbin/nologin nakharax-faucet
    fi
    sudo install -d -o nakharax-faucet -g nakharax-faucet -m 0750 \
        /var/lib/nakharax-faucet

    sudo tee /etc/systemd/system/nakharax-faucet.service >/dev/null <<EOF
[Unit]
Description=NakharaX Testnet Faucet
After=network-online.target nakharax-node.service
Wants=network-online.target

[Service]
Type=simple
User=nakharax-faucet
Group=nakharax-faucet
EnvironmentFile=${ENV_FILE}
Environment=RPC_URL=http://127.0.0.1:8545
Environment=CHAIN_ID=86137
Environment=PORT=3002
Environment=FAUCET_AMOUNT=100
Environment=RATE_LIMIT_MINUTES=1440
ExecStart=${FAUCET_BIN}
Restart=on-failure
RestartSec=5
TimeoutStartSec=30
MemoryMax=512M
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/nakharax-faucet

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable --now nakharax-faucet
fi

echo "[3/4] Waiting for the local faucet health endpoint..."
for attempt in {1..12}; do
    if curl -fsS --max-time 3 http://127.0.0.1:3002/health >/dev/null; then
        echo "Local faucet health check passed."
        break
    fi
    if [[ "${attempt}" -eq 12 ]]; then
        echo "Faucet diagnostics:" >&2
        if [[ "${FAUCET_MODE}" == "docker" ]]; then
            docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps >&2 || true
            docker logs --tail 80 nakharax-testnet-faucet >&2 || true
        else
            sudo systemctl status nakharax-faucet --no-pager >&2 || true
            sudo journalctl -u nakharax-faucet -n 80 --no-pager >&2 || true
        fi
        fail "Faucet did not become healthy on 127.0.0.1:3002."
    fi
    sleep 5
done

echo "[4/4] Reloading Caddy..."
if systemctl is-active --quiet caddy; then
    sudo systemctl reload caddy
else
    fail "Caddy is not active; local faucet is healthy but public routing remains unavailable."
fi

echo "================================================================="
echo "  Faucet is healthy locally and Caddy has been reloaded."
echo "  Verify externally: curl -fsS https://faucet.nakharax.com/health"
echo "================================================================="
