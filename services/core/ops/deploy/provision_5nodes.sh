#!/usr/bin/env bash

set -euo pipefail

cat >&2 <<'EOF'
ERROR: provision_5nodes.sh is retired.

The Public Testnet topology now requires seven entirely new VPS instances.
Do not reuse IP addresses, Peer IDs, or identity keys from the former five-node
deployment. Follow docs/ops/1_SEP_GENESIS_RUNBOOK.md and populate
services/core/ops/deploy/environments/testnet/public/inventory.yaml only after
all seven new static IPv4 addresses are assigned.
EOF

exit 1
