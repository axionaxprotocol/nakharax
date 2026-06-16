#!/usr/bin/env bash
# shellcheck shell=bash
# Shared helpers for nakhara-node-bootstrap.sh and run-full-node.sh.
# Do not execute directly; use: source "$(dirname "$0")/node-runtime-common.sh"

# When sourced: BASH_SOURCE[0] is this file; parent dir is scripts/.
nakhara_resolve_paths() {
  local _here
  _here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  NAKHARA_SCRIPTS_DIR="${NAKHARA_SCRIPTS_DIR:-$_here}"
  NAKHARA_DEPLOY_DIR="$(cd "$NAKHARA_SCRIPTS_DIR/.." && pwd)"
  NAKHARA_REPO_ROOT="${NAKHARA_REPO_ROOT:-$(cd "$NAKHARA_DEPLOY_DIR/../.." && pwd)}"
  NAKHARA_CORE_DIR="$NAKHARA_REPO_ROOT/core"
  NAKHARA_NODE_BIN="${NAKHARA_NODE_BIN:-$NAKHARA_CORE_DIR/target/release/nakhara-node}"
  NAKHARA_DEFAULT_GENESIS="${NAKHARA_DEFAULT_GENESIS:-$NAKHARA_CORE_DIR/tools/genesis.json}"
}

nakhara_require_binary() {
  if [[ ! -x "$NAKHARA_NODE_BIN" ]]; then
    echo "error: nakhara-node not found or not executable: $NAKHARA_NODE_BIN" >&2
    echo "  Run: $NAKHARA_SCRIPTS_DIR/nakhara-node-bootstrap.sh build" >&2
    return 1
  fi
}

nakhara_require_genesis_src() {
  if [[ ! -f "$NAKHARA_DEFAULT_GENESIS" ]]; then
    echo "error: genesis not found: $NAKHARA_DEFAULT_GENESIS" >&2
    echo "  Set NAKHARA_DEFAULT_GENESIS or clone repo with core/tools/genesis.json" >&2
    return 1
  fi
}
