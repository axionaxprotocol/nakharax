#!/usr/bin/env bash
# Send an explicit, low-severity test alert after the operator has configured
# a real Alertmanager receiver. It never runs as part of installation.

set -euo pipefail

if [[ "${1:-}" != "--confirm-send-test-alert" ]]; then
    echo "Refusing to notify the external alert receiver without --confirm-send-test-alert." >&2
    exit 1
fi

starts_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ends_at="$(date -u -d '+2 minutes' +%Y-%m-%dT%H:%M:%SZ)"
curl -fsS --max-time 10 -X POST http://127.0.0.1:9093/api/v2/alerts \
    -H 'Content-Type: application/json' \
    --data "[{\"labels\":{\"alertname\":\"NakharaxMonitoringDeliveryTest\",\"severity\":\"info\"},\"annotations\":{\"summary\":\"NakharaX monitoring delivery test\",\"description\":\"Operator-triggered test; this alert resolves automatically.\"},\"startsAt\":\"${starts_at}\",\"endsAt\":\"${ends_at}\"}]"
echo "Test alert accepted by local Alertmanager. Confirm delivery and resolution with the operations receiver."
