# Mainnet Production Release Strategy — Q3 2026 Target

This document specifies the operational roadmap for launching the **NakharaX Production Mainnet** (Canonical Chain ID `86150` / `0x15086`) following Public Testnet stabilization.

---

## 1. Core Target Parameters

| Metric / Parameter | Target Mainnet Value |
|---|---|
| **Mainnet Chain ID** | `86150` (`0x15086`) |
| **Genesis Specification** | Production Genesis Blueprint (Isolated from Testnet `86137`) |
| **Validator Keystores** | Isolated HSM / Cold-stored Mainnet Keystores |
| **Target Release Window** | Q3 2026 |

---

## 2. Strategic Timeline

| Phase | Milestone Focus |
|---|---|
| **Phase I (Q1 2026)** | Public Testnet stabilization; completion of [TESTNET_OPTIMIZATION_CHECKLIST.md](TESTNET_OPTIMIZATION_CHECKLIST.md). |
| **Phase II (Q2 2026)** | Pre-mainnet preparation: Generate Mainnet Genesis (`86150`), execute security audit remediations, deploy HSM keystores. |
| **Phase III (Q3 2026)** | Production Mainnet Launch: Genesis block initialization, public RPC activation (`86150`), client onboarding. |

---

## 3. Pre-Mainnet Verification Checklist

### 3.1 Network Stability & Testnet Certification
- [ ] Achieve 100% testnet uptime with zero block production halts across 30 consecutive days.
- [ ] Complete all optimization items in [TESTNET_OPTIMIZATION_CHECKLIST.md](TESTNET_OPTIMIZATION_CHECKLIST.md).

### 3.2 Genesis & Key Management
- [ ] **Dedicated Mainnet Genesis:** Initialize Genesis blueprint bound strictly to Chain ID `86150`.
- [ ] **Isolated Validator Keystores:** Generate distinct production key pairs; enforce complete isolation from testnet keys.

### 3.3 Security & Audit Compliance
- [ ] Complete external security audit as defined in [SECURITY_AUDIT_SCOPE.md](SECURITY_AUDIT_SCOPE.md).
- [ ] Remediate all critical and high-severity findings per [SECURITY_REMEDIATION_PLAN.md](../SECURITY_REMEDIATION_PLAN.md).

---

## 4. Mainnet vs Testnet Infrastructure Parameters

| Parameter | Public Testnet | Production Mainnet |
|---|---|---|
| **Chain ID** | `86137` | `86150` |
| **Genesis Target** | `genesis.json` (Testnet) | `genesis_mainnet.json` |
| **Validator Keystores** | Testnet Development Keys | Dedicated Production Keys |
| **Public Faucet** | Enabled | Disabled / Strict Collateral Escrow |

---

*Certified & Maintained by Lead Systems Architect: August 2026*
