#!/usr/bin/env bash
# Install the private Prometheus, Alertmanager and Grafana collector on VPS-03.

set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
    echo "Run as root." >&2
    exit 1
fi

REPO_DIR="${NAKHARAX_REPO_DIR:-/opt/nakharax}"
SOURCE_DIR="${REPO_DIR}/services/core/ops/deploy/environments/testnet/three-vps/monitoring"
CONFIG_DIR="/etc/nakharax-monitoring"
ENV_FILE="${NAKHARAX_MONITORING_ENV:-${CONFIG_DIR}/monitoring.env}"

if [[ ! -d "${SOURCE_DIR}" ]]; then
    echo "Monitoring source directory not found: ${SOURCE_DIR}" >&2
    exit 1
fi
if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Create ${ENV_FILE} from ${SOURCE_DIR}/monitoring.env.example first." >&2
    exit 1
fi

read_env_value() {
    local key="$1"
    sed -n "s/^${key}=//p" "${ENV_FILE}" | tail -n 1
}

GRAFANA_ADMIN_PASSWORD="$(read_env_value GRAFANA_ADMIN_PASSWORD)"
ALERT_WEBHOOK_URL="$(read_env_value ALERT_WEBHOOK_URL)"

if [[ -z "${GRAFANA_ADMIN_PASSWORD:-}" || "${GRAFANA_ADMIN_PASSWORD}" == "replace-with-a-long-unique-password" ]]; then
    echo "Set a unique GRAFANA_ADMIN_PASSWORD in ${ENV_FILE}." >&2
    exit 1
fi
if [[ -z "${ALERT_WEBHOOK_URL:-}" || "${ALERT_WEBHOOK_URL}" == "https://alerts.example.invalid/nakharax" ]]; then
    echo "Set ALERT_WEBHOOK_URL to the approved operations webhook in ${ENV_FILE}." >&2
    exit 1
fi
if [[ "${ALERT_WEBHOOK_URL}" == *$'\n'* || "${ALERT_WEBHOOK_URL}" == *$'\r'* ]]; then
    echo "ALERT_WEBHOOK_URL must not contain a newline." >&2
    exit 1
fi

export DEBIAN_FRONTEND=noninteractive
if ! command -v docker >/dev/null 2>&1; then
    apt-get update
    apt-get install -y docker.io
fi
systemctl enable --now docker

if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
else
    apt-get update
    apt-get install -y docker-compose-v2 || apt-get install -y docker-compose-plugin
    COMPOSE=(docker compose)
fi

if ! id nakharax-monitor >/dev/null 2>&1; then
    useradd --system --user-group --create-home --home-dir /var/lib/nakharax-monitor --shell /usr/sbin/nologin nakharax-monitor
fi

install -d -o root -g root -m 0750 "${CONFIG_DIR}"
install -d -o root -g root -m 0755 "${CONFIG_DIR}/grafana/provisioning/datasources"
install -d -o root -g root -m 0755 "${CONFIG_DIR}/grafana/provisioning/dashboards"
install -d -o root -g root -m 0755 "${CONFIG_DIR}/grafana/dashboards"
install -o root -g root -m 0644 "${SOURCE_DIR}/docker-compose.yml" "${CONFIG_DIR}/docker-compose.yml"
install -o root -g root -m 0644 "${SOURCE_DIR}/prometheus.yml" "${CONFIG_DIR}/prometheus.yml"
install -o root -g root -m 0644 "${SOURCE_DIR}/alerts.yml" "${CONFIG_DIR}/alerts.yml"
install -o root -g root -m 0644 "${SOURCE_DIR}/blackbox.yml" "${CONFIG_DIR}/blackbox.yml"
install -o root -g root -m 0644 "${SOURCE_DIR}/grafana/provisioning/datasources/prometheus.yml" "${CONFIG_DIR}/grafana/provisioning/datasources/prometheus.yml"
install -o root -g root -m 0644 "${SOURCE_DIR}/grafana/provisioning/dashboards/dashboard.yml" "${CONFIG_DIR}/grafana/provisioning/dashboards/dashboard.yml"
install -o root -g root -m 0644 "${SOURCE_DIR}/grafana/dashboards/three-vps-overview.json" "${CONFIG_DIR}/grafana/dashboards/three-vps-overview.json"

escaped_webhook="$(printf '%s' "${ALERT_WEBHOOK_URL}" | sed 's/[&|\\]/\\&/g')"
sed "s|__ALERT_WEBHOOK_URL__|${escaped_webhook}|g" "${SOURCE_DIR}/alertmanager.yml.template" >"${CONFIG_DIR}/alertmanager.yml"
chmod 0600 "${CONFIG_DIR}/alertmanager.yml"

"${COMPOSE[@]}" --env-file "${ENV_FILE}" -f "${CONFIG_DIR}/docker-compose.yml" config -q
docker run --rm --network none --entrypoint /bin/promtool \
    -v "${CONFIG_DIR}/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
    -v "${CONFIG_DIR}/alerts.yml:/etc/prometheus/alerts.yml:ro" \
    prom/prometheus:v2.53.0 check config /etc/prometheus/prometheus.yml
docker run --rm --network none --entrypoint /bin/amtool \
    -v "${CONFIG_DIR}/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro" \
    prom/alertmanager:v0.27.0 check-config /etc/alertmanager/alertmanager.yml

"${COMPOSE[@]}" --env-file "${ENV_FILE}" -f "${CONFIG_DIR}/docker-compose.yml" up -d

for _ in $(seq 1 20); do
    if curl -fsS --max-time 3 http://127.0.0.1:9090/-/ready >/dev/null \
        && curl -fsS --max-time 3 http://127.0.0.1:9093/-/ready >/dev/null \
        && curl -fsS --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then
        break
    fi
    sleep 2
done

curl -fsS --max-time 3 http://127.0.0.1:9090/-/ready >/dev/null
curl -fsS --max-time 3 http://127.0.0.1:9093/-/ready >/dev/null
curl -fsS --max-time 3 http://127.0.0.1:3000/api/health >/dev/null

echo "Collector is ready. Grafana is private: ssh -L 3000:127.0.0.1:3000 root@VPS-03"
echo "Verify this VPS-03 ED25519 SSH host-key fingerprint before configuring other nodes:"
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub -E sha256
