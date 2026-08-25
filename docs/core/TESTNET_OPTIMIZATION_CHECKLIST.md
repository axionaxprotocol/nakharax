# Public Testnet Optimization & Operations Manual

This manual provides operational procedures for tuning node stability, consensus synchronization, RPC ingress throughput, faucet liquidity, and monitoring infrastructure during the **Genesis Public Testnet** phase.

---

## 1. System Stability & Uptime Inspection

### Validator Node Infrastructure (`217.216.109.5`, `46.250.244.4`)

- [ ] **Disk Capacity Audit:** Verify available storage thresholds on host machines.
  ```bash
  ssh root@217.216.109.5 'df -h'
  ssh root@46.250.244.4 'df -h'
  ```
- [ ] **Memory Consumption:** Audit RAM utilization to prevent Out-Of-Memory (OOM) killer terminations.
  ```bash
  ssh root@217.216.109.5 'free -h'
  ssh root@46.250.244.4 'free -h'
  ```
- [ ] **Container Runtime Uptime:** Confirm daemon containers execute continuously without restart loops.
  ```bash
  docker ps -a --format '{{.Names}}\t{{.Status}}'
  ```
- [ ] **File Descriptor Limits (ulimit):** Ensure limits prevent "Too many open files" exceptions (`ulimit -n 65536`).

### Ingress & RPC Stack (`46.250.244.4`)

- [ ] **Public Ingress Verification:** Confirm HTTPS responses from `https://rpc.nakharax.com`.
  ```bash
  curl -s -X POST -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    https://rpc.nakharax.com
  # Expected: "result":"0x15079" (86137 decimal)
  ```

---

## 2. Consensus & Synchronization Audit

- [ ] **Chain ID Enforcement:** Both validators must return `0x15079` (`86137`).
- [ ] **Block Height Parity:** Confirm height delta between validators is $\le 10$ blocks.
- [ ] **State Trie Hash Parity:** Verify identical block hashes for matching block heights across nodes.
- [ ] **Deterministic Block Cadence:** Confirm block generation occurs at $\approx 3.0$-second intervals.

---

## 3. Ingress Telemetry & Automation Scripts

Run automated verification scripts from the **Monorepo Root**:

```bash
# Execute RPC Optimization & Ingress Smoke Test
python services/core/scripts/run_optimize_suite.py --mode smoke --rpc https://rpc.nakharax.com

# Generate Comprehensive Performance Benchmark Summary
python services/core/scripts/generate_network_performance_report.py --rpc https://rpc.nakharax.com

# Verify Production-Like Testnet Readiness
python services/core/scripts/check_testnet_production_readiness.py --validator http://127.0.0.1:8545 --public-rpc https://rpc.nakharax.com
```

---

## Priority Optimization Matrix

| Order | Priority Focus | Execution Goal |
|---|---|---|
| 1 | **System Uptime & Stability** | Maintain continuous node execution without OOM panics. |
| 2 | **Consensus Parity** | Enforce zero-fork synchronization between EU and AU nodes. |
| 3 | **RPC Performance** | Maintain sub-second JSON-RPC ingress latency ($P_{95} < 500\text{ms}$). |
| 4 | **Faucet Liquidity** | Ensure testnet treasury accounts remain funded. |
| 5 | **Telemetry & Monitoring** | Maintain active alert rules for disk and block height halts. |

---

*Certified & Maintained by Lead Systems Engineer: August 2026*
