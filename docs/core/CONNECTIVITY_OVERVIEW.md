# Connectivity: Local Full Node, VPS Validator, and Frontend

How **Local full node**, **VPS Validator nodes**, and **Frontend (hosted website)** connect, and what must be configured.

> **Production layout (2026-05):** User-facing services (rpc, explorer, api, faucet) run on **46.250.244.4 (AU)** via `docker-compose.vps.yml`. EU validator: **217.216.109.5**.

---

## Overview

| Component | Location / URL | Connects to |
|-----------|----------------|-------------|
| **VPS EU** | 217.216.109.5 | Validator #1, RPC, **Nakharax OS** (`app.nakharaxx.io` → :3030) |
| **VPS AU** | 46.250.244.4 | Validator #2; nginx, rpc, explorer, api, faucet |
| **DNS (chain)** | rpc / explorer / api / faucet `.nakharaxx.io` | → **46.250.244.4** |
| **DNS (OS)** | `app.nakharaxx.io` | → **217.216.109.5** |
| **Nakharax OS** | `apps/os-dashboard` on EU | RPC client → `https://rpc.nakharaxx.io` (AU) |
| **Local full node** | Your machine | Bootstrap to EU or AU; or use public RPC only |

---

## 1. Public Testnet (VPS Validators + Frontend)

### Intended connectivity

```
[User] → https://rpc.nakharaxx.io (nginx @ 46.250.244.4)
              ↓
         [AU rpc-node] ←P2P→ [EU validator @ 217.216.109.5]
              ↓
         Chain ID 86137

[Faucet / Explorer / API] → same host (46.250.244.4), RPC_URL=http://rpc-node:8545
```

- **Both validators** share genesis (86137) and sync on P2P **30303**.
- **Frontend** should use `NEXT_PUBLIC_RPC_URL=https://rpc.nakharaxx.io` (or `https://rpc-au.nakharaxx.io`).
- **Faucet** on AU uses internal RPC — no cross-VPS RPC URL needed when stack is all-in-one.
- **Direct IP RPC** (debug): `http://217.216.109.5:8545` (EU), `http://46.250.244.4:8545` (AU).

### What must be in place for "fully connected"

| Item | Host | Notes |
|------|------|-------|
| EU validator running | 217.216.109.5 | 8545, 30303 open |
| AU stack running | 46.250.244.4 | `docker-compose.vps.yml`, all containers healthy |
| DNS → AU | 46.250.244.4 | rpc, explorer, api, faucet subdomains |
| Frontend RPC env | build-time | `https://rpc.nakharaxx.io` |
| P2P between validators | both | `peers >= 1` on each node |

**Deploy guide:** [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md)

---

## 2. Local Full Node

### Option A: Connect to Public Testnet

- Bootstrap: `NAKHARAX_BOOTSTRAP_NODES` pointing at EU or AU peer ID on port 30303.
- Or skip local sync and use public RPC only.

### Option B: Separate local chain

- Standalone genesis / chain_id — not connected to public testnet.

---

## 3. Frontend (hosted)

- RPC URL at build/runtime determines which chain the UI uses.
- Production: `https://rpc.nakharaxx.io` → testnet 86137 on AU/EU validators.

---

## 4. Summary: "Is everything connected?"

| Pair | Connected? | Condition |
|------|------------|-----------|
| **EU ↔ AU validators** | Yes | P2P 30303; same genesis |
| **Frontend ↔ testnet** | Yes | RPC URL points to rpc.nakharaxx.io (AU nginx → local node) |
| **Faucet ↔ testnet** | Yes | Faucet on AU, `RPC_URL=http://rpc-node:8545` |
| **Explorer/API ↔ testnet** | Yes | `explorer-backend` on AU, same internal RPC |

---

## 5. Quick verification

```bash
# EU validator
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://217.216.109.5:8545

# AU validator (direct)
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://46.250.244.4:8545

# Public HTTPS (after DNS + SSL on AU)
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://rpc.nakharaxx.io
```

Full script: `ops/deploy/scripts/verify-launch-ready.sh`
