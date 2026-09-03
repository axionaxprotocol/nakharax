#!/usr/bin/env bash
# Write a small, atomically-updated Prometheus textfile for the native node.

set -euo pipefail

SERVICE_NAME="${NAKHARAX_NODE_SERVICE:-nakharax-node}"
METRICS_DIR="/var/lib/nakharax-node-exporter/textfile"
METRICS_FILE="${METRICS_DIR}/nakharax_node_service.prom"

case "${SERVICE_NAME}" in
    *[!a-zA-Z0-9_.@-]* | '')
        echo "Invalid NAKHARAX_NODE_SERVICE value" >&2
        exit 1
        ;;
esac

if systemctl is-active --quiet "${SERVICE_NAME}"; then
    active=1
else
    active=0
fi

restarts="$(systemctl show --property=NRestarts --value "${SERVICE_NAME}" 2>/dev/null || true)"
case "${restarts}" in
    '' | *[!0-9]*) restarts=0 ;;
esac

install -d -o root -g prometheus -m 0750 "${METRICS_DIR}"
temporary_file="$(mktemp "${METRICS_DIR}/.nakharax_node_service.XXXXXX")"
trap 'rm -f "${temporary_file}"' EXIT

cat >"${temporary_file}" <<EOF
# HELP nakharax_systemd_service_active Whether the native NakharaX node service is active.
# TYPE nakharax_systemd_service_active gauge
nakharax_systemd_service_active{service="${SERVICE_NAME}"} ${active}
# HELP nakharax_systemd_service_restarts_total Native NakharaX node service restart count from systemd.
# TYPE nakharax_systemd_service_restarts_total counter
nakharax_systemd_service_restarts_total{service="${SERVICE_NAME}"} ${restarts}
EOF

chown root:prometheus "${temporary_file}"
chmod 0640 "${temporary_file}"
mv -f "${temporary_file}" "${METRICS_FILE}"
