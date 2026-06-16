#!/bin/bash
# Run nakhara full node.
#
# If you already ran: nakhara-node-bootstrap.sh setup …
#   ./run-full-node.sh --data-dir /var/lib/nakhara-node
#   (delegates to nakhara-node-bootstrap.sh run)
#
# Legacy (no setup / no genesis file on disk):
#   NAKHARA_STATE_PATH=./data NAKHARA_BOOTSTRAP_NODES=/ip4/… ./run-full-node.sh
#
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=node-runtime-common.sh
source "$SCRIPT_DIR/node-runtime-common.sh"
nakhara_resolve_paths

DATA_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    *) break ;;
  esac
done

if [[ -z "${DATA_DIR:-}" ]]; then
  DATA_DIR="${NAKHARA_STATE_PATH:-$NAKHARA_REPO_ROOT/data}"
fi

if [[ -x "$DATA_DIR/run.sh" ]]; then
  exec "$SCRIPT_DIR/nakhara-node-bootstrap.sh" run --data-dir "$DATA_DIR"
fi

nakhara_require_binary
mkdir -p "$DATA_DIR"
echo "Starting nakhara-node (legacy: no genesis file; state=$DATA_DIR)"
echo "  For public testnet use: $SCRIPT_DIR/nakhara-node-bootstrap.sh setup --role full …"
exec "$NAKHARA_NODE_BIN" \
  --role full \
  --chain-id 86137 \
  --rpc 0.0.0.0:8545 \
  --state-path "$DATA_DIR"
