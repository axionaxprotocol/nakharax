# NakharaX Network Performance Benchmark Summary

**Generated At:** 2026-08-24 08:46:09 UTC  
**Tested RPC Target:** `http://127.0.0.1:8545`  

---

## 1. Optimization Test Suite

**Execution Command:** `python scripts/run_optimize_suite.py -q --mode full --rpc http://127.0.0.1:8545 --light-duration 45.0 --light-rps 2.5 --json-out reports/optimize_suite_last.json`

- **Overall Status:** **PASS**

### Smoke Test Phase

- **Result:** **PASS** — Smoke check verified.

| Metric | Value |
|--------|-------|
| `eth_chainId_ms` | 3.55 ms |
| `eth_blockNumber_ms` | 1.91 ms |
| `chain_id_hex` | 0x15079 |
| `block_number_hex` | 0x5f7 |

### Light Workload Ingress

- **Result:** **PASS** — Light load: 96 core requests OK, 0 failures over 45s (P50 1.92ms).

| Metric | Value |
|--------|-------|
| `core_successes` | 96 |
| `core_failures` | 0 |
| `optional_attempts` | 16 |
| `optional_ok` | 0 |
| `latency_p50_ms` | 1.92 ms |
| `latency_p95_ms` | 2.36 ms |
| `latency_mean_ms` | 1.98 ms |

**Raw Benchmark Artifact:** `reports/optimize_suite_last.json`

---

## 2. Block Timing Metrics (`tps_finality_test.py` — Block Production)

- **Status:** Skipped (`--skip-block-time`)

---

## 3. Next Steps & Recommendations

- Execute repeat runs directly from edge VPS instances adjacent to the target RPC node.
- Increase `--block-duration` to ensure long-term variance stabilization.
- TPS load testing mode requires a funded private key — refer to `scripts/load_test/tps_finality_test.py --help`.
