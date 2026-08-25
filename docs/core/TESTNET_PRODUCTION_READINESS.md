# Production-Grade Public Testnet Readiness Framework

This document outlines the evaluation framework for certifying that the **Genesis Public Testnet** satisfies production-grade operational standards (resilience, consensus parity, sub-second latency, and fault isolation) as defined in [TESTNET_OPTIMIZATION_CHECKLIST.md](TESTNET_OPTIMIZATION_CHECKLIST.md).

---

## 1. Production-Grade Definition & Scope

| Term | Operational Scope & Boundary |
|---|---|
| **Production-Grade** | Architecture, RPC throughput, Faucet liquidity, and observability are **operationally robust for continuous public usage** — featuring zero operational vulnerabilities, sub-3s finality, and 100% consensus parity. |
| **Public Testnet** | The active network environment — tokens hold zero real-world monetary value ($tNAK), enabling rapid protocol iteration and stress-testing. |

---

## 2. Automated Production Readiness Verification

The automated verification suite separates **validator consensus health** from **public RPC proxy lag**:

| Inspection Domain | Automated Verification Criteria |
|---|---|
| **Chain ID Enforcement** | All RPC endpoints must return `0x15079` (`86137` decimal). |
| **Validator Consensus Parity** | Height difference between validators must be $\le 25$ blocks; **state trie hashes must match 100%**. |
| **Public RPC Lag Threshold** | Public ingress lag relative to validator tip must satisfy $\Delta \text{height} \le 40$ blocks. |
| **Cross-Stack State Hash Match** | Matching block hashes across all RPC nodes at equivalent block heights. |
| **Faucet Health Check** | Faucet HTTP endpoint returns non-5xx responses. |

---

## 3. Automated Execution Commands

```bash
# Execute Automated Production Readiness Checker
python services/core/scripts/check_testnet_production_readiness.py \
  --validator http://127.0.0.1:8545 \
  --public-rpc https://rpc.nakharax.com

# Generate Network Performance Report
python services/core/scripts/generate_network_performance_report.py
```

Outputs are automatically generated at:
- `services/core/reports/TESTNET_PRODUCTION_READINESS_LAST.md`
- `services/core/reports/NETWORK_PERFORMANCE_SUMMARY.md`

---

*Certified & Maintained by Lead Systems Architect: August 2026*
