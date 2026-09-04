#!/usr/bin/env bash
# Install loopback-only host metrics and, for VPS-01/VPS-02, a restricted
# reverse SSH tunnel to the VPS-03 collector. Run as root on exactly one node.

set -euo pipefail

usage() {
    cat <<'EOF'
Usage:
  sudo bash install-node-monitoring-agent.sh --node vps01
  sudo bash install-node-monitoring-agent.sh --node vps02 \
    --collector-host <VPS-03-IP-or-name> \
    --collector-host-fingerprint SHA256:<ed25519-host-key-fingerprint>
  sudo bash install-node-monitoring-agent.sh --node vps03

The first run on VPS-01/VPS-02 without collector options installs the local
exporter and prints a public tunnel key. Register that public key on VPS-03,
then rerun with the collector host and its verified ED25519 host-key fingerprint.
EOF
}

if [[ ${EUID} -ne 0 ]]; then
    echo "Run as root." >&2
    exit 1
fi

NODE_NAME=""
COLLECTOR_HOST=""
COLLECTOR_FINGERPRINT=""
COLLECTOR_PORT="22"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --node)
            NODE_NAME="${2:-}"
            shift 2
            ;;
        --collector-host)
            COLLECTOR_HOST="${2:-}"
            shift 2
            ;;
        --collector-host-fingerprint)
            COLLECTOR_FINGERPRINT="${2:-}"
            shift 2
            ;;
        --collector-port)
            COLLECTOR_PORT="${2:-}"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

case "${NODE_NAME}" in
    vps01)
        NODE_METRICS_PORT=18081
        HOST_METRICS_PORT=19101
        ;;
    vps02)
        NODE_METRICS_PORT=18082
        HOST_METRICS_PORT=19102
        ;;
    vps03)
        NODE_METRICS_PORT=""
        HOST_METRICS_PORT=""
        ;;
    *)
        echo "--node must be vps01, vps02, or vps03" >&2
        exit 1
        ;;
esac

if [[ -n "${COLLECTOR_HOST}" || -n "${COLLECTOR_FINGERPRINT}" ]]; then
    if [[ "${NODE_NAME}" == "vps03" ]]; then
        echo "VPS-03 is the collector and must not create a reverse tunnel." >&2
        exit 1
    fi
    if [[ -z "${COLLECTOR_HOST}" || -z "${COLLECTOR_FINGERPRINT}" ]]; then
        echo "--collector-host and --collector-host-fingerprint must be supplied together." >&2
        exit 1
    fi
fi

if [[ ! "${COLLECTOR_PORT}" =~ ^[0-9]+$ ]] \
    || (( 10#${COLLECTOR_PORT} < 1 || 10#${COLLECTOR_PORT} > 65535 )); then
    echo "--collector-port must be a valid TCP port." >&2
    exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_DIR="${SCRIPT_DIR}/../systemd"
CONFIG_DIR="/etc/nakharax-monitoring"
TEXTFILE_DIR="/var/lib/nakharax-node-exporter/textfile"
SSH_KEY="${CONFIG_DIR}/tunnel_${NODE_NAME}_ed25519"
KNOWN_HOSTS="${CONFIG_DIR}/collector_known_hosts"

export DEBIAN_FRONTEND=noninteractive
systemctl mask prometheus-node-exporter.service 2>/dev/null || true
apt-get update
apt-get install -y openssh-client prometheus-node-exporter

if [[ ! -x /usr/bin/prometheus-node-exporter ]]; then
    echo "prometheus-node-exporter binary was not installed at the expected path." >&2
    exit 1
fi
if ! id prometheus >/dev/null 2>&1; then
    echo "prometheus service account was not created by the package." >&2
    exit 1
fi

install -d -o root -g root -m 0750 "${CONFIG_DIR}"
install -d -o root -g root -m 0755 /usr/local/libexec
install -d -o root -g prometheus -m 0750 "${TEXTFILE_DIR}"
install -o root -g root -m 0755 "${SCRIPT_DIR}/nakharax-node-service-metrics.sh" /usr/local/libexec/nakharax-node-service-metrics
install -o root -g root -m 0644 "${SYSTEMD_DIR}/nakharax-node-exporter.service" /etc/systemd/system/nakharax-node-exporter.service
install -o root -g root -m 0644 "${SYSTEMD_DIR}/nakharax-node-service-metrics.service" /etc/systemd/system/nakharax-node-service-metrics.service
install -o root -g root -m 0644 "${SYSTEMD_DIR}/nakharax-node-service-metrics.timer" /etc/systemd/system/nakharax-node-service-metrics.timer
printf 'NAKHARAX_NODE_SERVICE=nakharax-node\n' >/etc/nakharax-monitoring-agent.env
chown root:root /etc/nakharax-monitoring-agent.env
chmod 0644 /etc/nakharax-monitoring-agent.env

systemctl daemon-reload
systemctl disable --now prometheus-node-exporter.service || true
systemctl enable --now nakharax-node-exporter.service nakharax-node-service-metrics.timer
systemctl start nakharax-node-service-metrics.service

metrics="$(curl -fsS --max-time 5 http://127.0.0.1:9100/metrics)"
grep '^node_uname_info' <<< "${metrics}" >/dev/null
grep '^nakharax_systemd_service_active' <<< "${metrics}" >/dev/null
if ss -ltnH '( sport = :9100 )' | grep -vq '127.0.0.1:9100'; then
    echo "Node exporter is not loopback-only; refusing to continue." >&2
    exit 1
fi

if [[ -z "${COLLECTOR_HOST}" ]]; then
    if [[ "${NODE_NAME}" != "vps03" ]]; then
        if [[ ! -f "${SSH_KEY}" ]]; then
            ssh-keygen -q -t ed25519 -a 100 -f "${SSH_KEY}" -N '' -C "nakharax-monitoring-${NODE_NAME}"
            chmod 0600 "${SSH_KEY}"
        fi
        echo "Register this public key on VPS-03 before enabling the tunnel:"
        cat "${SSH_KEY}.pub"
    fi
    echo "Loopback-only monitoring agent is healthy on ${NODE_NAME}."
    exit 0
fi

if [[ ! -f "${SSH_KEY}" ]]; then
    ssh-keygen -q -t ed25519 -a 100 -f "${SSH_KEY}" -N '' -C "nakharax-monitoring-${NODE_NAME}"
    chmod 0600 "${SSH_KEY}"
fi

temporary_hosts="$(mktemp)"
trap 'rm -f "${temporary_hosts}"' EXIT
ssh-keyscan -T 5 -p "${COLLECTOR_PORT}" -t ed25519 "${COLLECTOR_HOST}" >"${temporary_hosts}" 2>/dev/null
actual_fingerprint="$(ssh-keygen -lf "${temporary_hosts}" -E sha256 | awk 'NR == 1 { print $2 }')"
if [[ -z "${actual_fingerprint}" || "${actual_fingerprint}" != "${COLLECTOR_FINGERPRINT}" ]]; then
    echo "Collector ED25519 host-key fingerprint mismatch." >&2
    echo "Expected: ${COLLECTOR_FINGERPRINT}" >&2
    echo "Actual:   ${actual_fingerprint:-unavailable}" >&2
    exit 1
fi
install -o root -g root -m 0600 "${temporary_hosts}" "${KNOWN_HOSTS}"

install -o root -g root -m 0644 "${SYSTEMD_DIR}/nakharax-monitoring-tunnel.service" /etc/systemd/system/nakharax-monitoring-tunnel.service
temporary_tunnel_env="$(mktemp "${CONFIG_DIR}/.tunnel.XXXXXX")"
cat >"${temporary_tunnel_env}" <<EOF
COLLECTOR_HOST=${COLLECTOR_HOST}
COLLECTOR_PORT=${COLLECTOR_PORT}
COLLECTOR_USER=nakharax-monitor
NODE_METRICS_PORT=${NODE_METRICS_PORT}
HOST_METRICS_PORT=${HOST_METRICS_PORT}
SSH_KEY_PATH=${SSH_KEY}
KNOWN_HOSTS_PATH=${KNOWN_HOSTS}
EOF
chown root:root "${temporary_tunnel_env}"
chmod 0600 "${temporary_tunnel_env}"
mv -f "${temporary_tunnel_env}" /etc/nakharax-monitoring-tunnel.env

systemctl daemon-reload
systemctl enable --now nakharax-monitoring-tunnel.service
systemctl is-active --quiet nakharax-monitoring-tunnel.service
echo "Restricted monitoring tunnel is active for ${NODE_NAME}."
