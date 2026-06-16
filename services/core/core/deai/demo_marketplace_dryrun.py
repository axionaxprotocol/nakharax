"""
Axionax — Marketplace end-to-end DRY-RUN (safe, offline).

Proves the honest proof-point from docs/REALITY_MAP.md without deploying or
touching the network:

    submit job -> worker runs it (real torch compute) -> result hashed
               -> settle via JobMarketplace in MOCK mode (logged, never sent)

SAFETY GUARANTEES
  * ContractManager runs in MOCK mode (zero address) — no transactions are sent.
  * The signing key is generated in memory (eth_account) and never written to disk.
  * No RPC call is made; the dummy URL is only used to build the Web3 object.

Run:
    cd services/core/core/deai
    python demo_marketplace_dryrun.py
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from eth_account import Account

from compute_backend import ComputeBackend
from contract_manager import ContractManager, ZERO_ADDRESS

logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(name)s | %(message)s")
log = logging.getLogger("demo")


def _hash(obj) -> str:
    payload = json.dumps(obj, sort_keys=True, default=str).encode()
    return "0x" + hashlib.sha3_256(payload).hexdigest()


def run_inference_job(job: dict) -> dict:
    """The 'AI compute' — a real torch matmul through the SILICON backend."""
    backend = ComputeBackend({"compute_type": "SILICON", "force_cpu": True})
    log.info("Compute backend: %s", backend.capabilities_dict())

    try:
        import torch

        # Deterministic toy "inference": y = relu(x @ W) for the job's input size.
        n = int(job["params"]["dim"])
        torch.manual_seed(int(job["params"]["seed"]))
        x = torch.randn(1, n)
        w = torch.randn(n, n)
        y = torch.relu(backend.matrix_multiply(x, w))
        out = {"output_norm": float(y.norm()), "nonzero": int((y > 0).sum())}
    except Exception as e:  # pragma: no cover - torch always present in this env
        log.warning("torch path unavailable (%s); using scalar fallback", e)
        out = {"output_norm": 0.0, "nonzero": 0}
    return out


def main() -> int:
    print("=" * 70)
    print("AXIONAX MARKETPLACE — END-TO-END DRY-RUN (MOCK, no deploy)")
    print("=" * 70)

    # 1) Ephemeral in-memory worker identity (never persisted)
    worker = Account.create()
    log.info("Ephemeral worker address: %s", worker.address)

    # 2) Marketplace client in MOCK mode (zero address => no on-chain writes)
    cm = ContractManager(
        rpc_url="http://localhost:8545",  # never contacted in MOCK
        account=worker,
        contract_address=ZERO_ADDRESS,
    )
    assert cm.is_mock, "demo must run in MOCK mode"

    # 3) Worker registers (MOCK: logged, no tx)
    specs = {"compute_type": "SILICON", "ram_gb": 8, "cores": 4}
    cm.register_worker(specs, stake_amount=0)
    log.info("Worker on-chain view: %s", cm.get_worker_info())

    # 4) A requester submits a job
    job = {
        "id": 1,
        "type": "inference",
        "model": "toy-linear",
        "params": {"dim": 256, "seed": 42},
    }
    job_input_hash = _hash(job)
    print(f"\n[1] Job submitted     id={job['id']}  inputHash={job_input_hash}")

    # 5) Worker claims it (MOCK)
    cm.assign_job(job["id"])
    print(f"[2] Job assigned      worker={worker.address}")

    # 6) Worker runs the REAL compute
    result = run_inference_job(job)
    result_hash = _hash(result)
    print(f"[3] Compute finished  result={result}")
    print(f"                      resultHash={result_hash}")

    # 7) Worker settles the result on the marketplace (MOCK: logged, no tx)
    cm.submit_result(job["id"], result)
    print(f"[4] Result settled    (MOCK — nothing broadcast to chain)")

    print("\n" + "-" * 70)
    print("DRY-RUN COMPLETE — full lifecycle exercised, zero on-chain side effects.")
    print("To go LIVE later: deploy JobMarketplaceStandalone.sol and set")
    print("AXIONAX_MARKETPLACE_ADDRESS to the deployed address.")
    print("-" * 70)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
