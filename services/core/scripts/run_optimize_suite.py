#!/usr/bin/env python3
"""
Entry point for the Nakhara optimization suite (adds scripts/ on sys.path).

Usage (from repo root):
  python scripts/run_optimize_suite.py --mode smoke --rpc https://rpc.nakhara.io
  python scripts/run_optimize_suite.py --mode full --cyber --json-out reports/optimize.json

If your shell is already in the ``scripts/`` folder, run ``python run_optimize_suite.py ...`` (not ``python scripts/run_optimize_suite.py``).

Environment:
  NAKHARA_RPC_URL — default RPC if --rpc omitted
"""

from __future__ import annotations

import sys
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
if str(_SCRIPTS) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS))

from optimize_suite.main import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
