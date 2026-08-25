# Security Audit & Remediation Master Plan

**Document ID:** `NAK-SEC-REMEDIATION-PLAN`  
**Classification:** Core Security & Engineering Remediation Blueprint  
**Status:** Active Execution Plan  

---

## Executive Overview

This plan categorizes security hardening tasks across **4 Phases** based on severity and urgency. Each task specifies the affected target files, code modification specifications, and estimated engineering effort.

### Execution Phases & Priority Matrix

| Phase | Priority Level | Target Timeline | Total Issues Covered |
|---|---|---|---|
| **Phase 0** | **P0 (Critical)** — Mandatory before public testnet launch | Week 1 | 11 Critical Findings |
| **Phase 1** | **P1 (High)** — Mandatory within Sprint 1 | Weeks 2–3 | 22 High Findings |
| **Phase 2** | **P2 (Medium)** — Target completion within 1 Month | Weeks 4–6 | 30 Medium Findings |
| **Phase 3** | **P3 (Low / Informational)** — Ongoing security hardening | Week 7+ | 34 Low/Info Findings |

---

## Phase 0: CRITICAL — Pre-Deployment Hardening (Week 1)

### P0-T1: Implement Transaction Signing & Verification Module
- **Estimated Effort:** 3–4 Days
- **Dependencies:** None
- **Root Cause:** RPC endpoints previously accepted plaintext `address` payloads without cryptographic signature verification, allowing unauthorized identity spoofing.

#### Target Files to Create:
- `core/core/crypto/src/signature.rs` — Signature verification and address derivation logic.

#### Target Files to Update:
1. **`core/core/rpc/src/staking_rpc.rs`** — Enforce signed transaction payloads across RPC trait definitions.
2. **`core/core/rpc/src/governance_rpc.rs`** — Enforce signed transaction payloads and retrieve active stake directly from Staking module.
3. **`core/core/rpc/src/lib.rs`** — Add signature verification in `send_raw_transaction`.

---

### P0-T2: Network Identity Hardening — Bind Keypair to Node Identity
- **Estimated Effort:** 0.5 Days
- **Dependencies:** None

#### Target Files to Update:
1. **`core/core/network/src/behaviour.rs`** — Require active keypair parameter during swarm initialization.
2. **`core/core/network/src/manager.rs`** — Pass valid keypair to network behaviour module.

---

### P0-T3: Legacy VRF Deprecation & Cleanup
- **Estimated Effort:** 0.5 Days
- **Dependencies:** None

#### Target Files to Update:
- **`core/core/crypto/src/lib.rs`** — Remove deprecated `VRF` struct entirely in favor of battle-tested ECVRF.

---

### P0-T4: Elimination of Hardcoded Plaintext Credentials
- **Estimated Effort:** 1 Day
- **Dependencies:** None

#### Target Files to Update & Scrub:
1. Remove plaintext secrets across `services/core/ops/deploy/mock-rpc/server.js`.
2. Generate `.env.example` template file.
3. Update `.gitignore` to prevent secret ingestion.
4. Purge sensitive credentials file `ops/deploy/VPS_CONNECTION.txt`.

---

*Certified & Maintained by Lead Security Architect & Antigravity AI Engine.*
