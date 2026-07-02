#!/usr/bin/env bash
# shellcheck shell=bash
# Shared helpers for nakharax-node-bootstrap.sh and run-full-node.sh.
# Do not execute directly; use: source "$(dirname "$0")/node-runtime-common.sh"

# When sourced: BASH_SOURCE[0] is this file; parent dir is scripts/.
nakharax_resolve_paths() {
  local _here
  _here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  NAKHARAX_SCRIPTS_DIR="${NAKHARAX_SCRIPTS_DIR:-$_here}"
  NAKHARAX_DEPLOY_DIR="$(cd "$NAKHARAX_SCRIPTS_DIR/.." && pwd)"
  NAKHARAX_REPO_ROOT="${NAKHARAX_REPO_ROOT:-$(cd "$NAKHARAX_DEPLOY_DIR/../.." && pwd)}"
  NAKHARAX_CORE_DIR="$NAKHARAX_REPO_ROOT/core"
  NAKHARAX_NODE_BIN="${NAKHARAX_NODE_BIN:-$NAKHARAX_CORE_DIR/target/release/nakharax-node}"
  NAKHARAX_DEFAULT_GENESIS="${NAKHARAX_DEFAULT_GENESIS:-$NAKHARAX_CORE_DIR/tools/genesis.json}"
}

nakharax_require_binary() {
  if [[ ! -x "$NAKHARAX_NODE_BIN" ]]; then
    echo "error: nakharax-node not found or not executable: $NAKHARAX_NODE_BIN" >&2
    echo "  Run: $NAKHARAX_SCRIPTS_DIR/nakharax-node-bootstrap.sh build" >&2
    return 1
  fi
}

nakharax_require_genesis_src() {
  if [[ ! -f "$NAKHARAX_DEFAULT_GENESIS" ]]; then
    echo "error: genesis not found: $NAKHARAX_DEFAULT_GENESIS" >&2
    echo "  Set NAKHARAX_DEFAULT_GENESIS or clone repo with core/tools/genesis.json" >&2
    return 1
  fi
}
