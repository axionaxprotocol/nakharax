#!/bin/bash
# Run nakharax full node.
#
# If you already ran: nakharax-node-bootstrap.sh setup …
#   ./run-full-node.sh --data-dir /var/lib/nakharax-node
#   (delegates to nakharax-node-bootstrap.sh run)
#
# Legacy (no setup / no genesis file on disk):
#   NAKHARAX_STATE_PATH=./data NAKHARAX_BOOTSTRAP_NODES=/ip4/… ./run-full-node.sh
#
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=node-runtime-common.sh
source "$SCRIPT_DIR/node-runtime-common.sh"
nakharax_resolve_paths

DATA_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --data-dir) DATA_DIR="$2"; shift 2 ;;
    *) break ;;
  esac
done

if [[ -z "${DATA_DIR:-}" ]]; then
  DATA_DIR="${NAKHARAX_STATE_PATH:-$NAKHARAX_REPO_ROOT/data}"
fi

if [[ -x "$DATA_DIR/run.sh" ]]; then
  exec "$SCRIPT_DIR/nakharax-node-bootstrap.sh" run --data-dir "$DATA_DIR"
fi

nakharax_require_binary
mkdir -p "$DATA_DIR"
echo "Starting nakharax-node (legacy: no genesis file; state=$DATA_DIR)"
echo "  For public testnet use: $SCRIPT_DIR/nakharax-node-bootstrap.sh setup --role full …"
exec "$NAKHARAX_NODE_BIN" \
  --role full \
  --chain-id 86137 \
  --rpc 0.0.0.0:8545 \
  --state-path "$DATA_DIR"
