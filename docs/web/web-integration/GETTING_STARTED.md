# Getting Started — NakharaX Core Testnet Verification

## Quick Status Overview

- ✅ **Compiled Core Binaries Ready:** (`build/nakharax-core.exe`)
- ✅ **CLI Subsystem Operational:** Verified across node, validator, and key management subcommands.
- ⚠️ **Docker Engine Required:** Necessary for full multi-container testnet initialization.

---

## Verification Procedures

### 1. CLI Subsystem Verification (Offline / Local Mode)

Execute automated test suite:

```powershell
powershell -ExecutionPolicy Bypass -File quick-test.ps1
```

### 2. Full Testnet Infrastructure (Docker Container Mode)

#### Step 1: Launch Docker Engine
- Launch Docker Desktop.
- Wait for status indicator to show active/running engine.

#### Step 2: Initialize Testnet Infrastructure

```powershell
cd nakharax_v1.5_Testnet_in_a_Box
powershell -ExecutionPolicy Bypass -File start-testnet.ps1
```

#### Step 3: Launch Local Node Daemon

```powershell
cd ..
.\build\nakharax-core.exe start --network testnet
```

---

## Active Testnet Endpoints

Upon infrastructure initialization, the following local endpoints become active:

- **JSON-RPC Node:** `http://localhost:8545`
- **Block Explorer:** `http://localhost:4001`
- **Token Faucet:** `http://localhost:8080`

---

## Frequently Used Commands

```powershell
# Display Core Version
.\build\nakharax-core.exe version

# Generate Validator Keypair
.\build\nakharax-core.exe keys generate --type validator

# Launch Validator Node
.\build\nakharax-core.exe validator start

# Inspect Telemetry & Status
.\build\nakharax-core.exe validator status
.\build\nakharax-core.exe worker status

# Display Active Configuration
.\build\nakharax-core.exe config show
```

---

## Related Documentation

- `TESTING_GUIDE.md` — Comprehensive testing playbook
- `QUICKSTART.md` — Developer quickstart guide
- `docs/API_REFERENCE.md` — Complete RPC API specifications
- `docs/BUILD.md` — Source compilation manual

---

## Troubleshooting Guide

### Docker Engine Offline
- **Error:** `error during connect: docker daemon is not running`
- **Resolution:** Launch Docker Desktop and wait for engine status indicator to turn green.

### Ingress Port Collision
- **Error:** `port 8545 is already in use`
- **Resolution:** Terminate conflicting process on port 8545 or update RPC port in config.
