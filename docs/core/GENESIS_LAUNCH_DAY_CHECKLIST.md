# Genesis Public Testnet — Launch Execution Checklist

This checklist documents the operational steps required to initialize and verify the **Genesis Public Testnet** in accordance with [GENESIS_PUBLIC_TESTNET_PLAN.md](GENESIS_PUBLIC_TESTNET_PLAN.md).

---

## Active Genesis Parameters

| Configuration Field | Target Parameter Value |
|---|---|
| **Chain ID** | `86137` |
| **Genesis Specification File** | `services/core/tools/genesis.json` |
| **Genesis Blueprint SHA-256** | `0xed1bdac7c278e5b4f58a1eceb7594a4238e39bb63e1018e38ec18a555c762b55` |
| **Initial Validator Cluster** | Validator-EU-01 (`217.216.109.5`), Validator-AU-01 (`46.250.244.4`) |
| **Active Validator Blueprint** | `services/core/tools/validators-active.json` |

---

## Pre-Flight Verification Checklist

- [ ] **Validator Private Keys:** Verify corresponding validator keys exist on EU (`217.216.109.5`) and AU (`46.250.244.4`) hosts.
- [ ] **Faucet Treasury Key:** Configure `FAUCET_PRIVATE_KEY` on AU (`46.250.244.4`) matching the genesis allocation address.
- [ ] **Firewall Ingress Rules:** Confirm ports `22`, `8545`, `8546`, and `30303` are open on both validator nodes.
- [ ] **Genesis Hash Verification:** Run `sha256sum genesis.json` on all nodes to ensure 100% digest match.

---

## Launch Day Execution Pipeline

### 1. Generate & Verify Genesis Blueprint
```bash
cd services/core/tools
python create_genesis.py --verify
```

### 2. Distribute Genesis Blueprint to Validator Mesh

#### Option A — Automated Deployment Script
```bash
cd services/core/tools
bash launch_genesis.sh
```

#### Option B — Manual SCP Transfer
```bash
scp services/core/tools/genesis.json root@217.216.109.5:~/.nakharax/config/
scp services/core/tools/genesis.json root@46.250.244.4:~/.nakharax/config/
```

### 3. Deploy & Update Validator Node Daemons
From **Repository Root**:
```bash
scp services/core/ops/deploy/scripts/update-validator-vps.sh root@217.216.109.5:/tmp/
scp services/core/ops/deploy/scripts/update-validator-vps.sh root@46.250.244.4:/tmp/
ssh root@217.216.109.5 'bash /tmp/update-validator-vps.sh'
ssh root@46.250.244.4 'bash /tmp/update-validator-vps.sh'
```

### 4. Verify RPC & P2P Swarm Synchronization

#### Verify Chain ID:
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://217.216.109.5:8545
# Expected: "result":"0x15079" (86137 decimal)
```

#### Verify Block Height Ticking:
```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://217.216.109.5:8545
```

---

## Post-Launch Operations

- [ ] Confirm deterministic 3.0-second block production across validators.
- [ ] Confirm active P2P peer connection count ≥ 1 between EU and AU nodes.
- [ ] Launch AU service stack ([VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md)).
- [ ] Execute `verify-launch-ready.sh` script to certify production readiness.

---

*Certified & Maintained by Lead Operations Engineer: August 2026*
