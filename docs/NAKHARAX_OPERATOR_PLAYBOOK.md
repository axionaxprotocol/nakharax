# 📘 NakharaX Protocol: Master Operator, Wallet & Genesis Playbook

**Document ID:** `NAK-PLAYBOOK-2026-V1`  
**Classification:** Official Developer, Operator & Validator Manual  
**Target Chain ID:** `86137` (Public Testnet)  

---

## 🧭 Quick Links & Core Resources

| Category | Canonical Manual Path | Automated Scripts |
|:---|:---|:---|
| **1. Node Setup & Installers** | [RUN_PUBLIC_FULL_NODE.md](file:///d:/nakhara-io/docs/core/RUN_PUBLIC_FULL_NODE.md) | [nakharax-node-bootstrap.sh](file:///d:/nakhara-io/services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh) |
| **2. Wallet & Key Generation** | [WALLET_AND_KEYS_READINESS.md](file:///d:/nakhara-io/docs/core/WALLET_AND_KEYS_READINESS.md) | `generate-faucet-key.py` / `wallet_manager.py` |
| **3. Genesis Block Initiation** | [GENESIS_LAUNCH_DAY_CHECKLIST.md](file:///d:/nakhara-io/docs/core/GENESIS_LAUNCH_DAY_CHECKLIST.md) | `distribute-genesis.ps1` / `create_genesis.py` |
| **4. Benchmark & Audit Reporting**| [EMPIRICAL_BENCHMARK_REPORT.md](file:///d:/nakhara-io/docs/EMPIRICAL_BENCHMARK_REPORT.md) | `check_testnet_production_readiness.py` / `verify-launch-ready.sh` |
| **5. Network Client Integration** | [ADD_NETWORK_AND_TOKEN.md](file:///d:/nakhara-io/docs/core/ADD_NETWORK_AND_TOKEN.md) | `https://rpc.nakharax.com` (Chain ID: `86137`) |

---

## 🛠️ 1. Node Installer & Runtime Commands

### 🔹 Single-Command Automated Node Bootstrap
```bash
# 1. Navigate to deployment scripts directory
cd services/core/ops/deploy/scripts

# 2. Compile node binary in Release Mode
./nakharax-node-bootstrap.sh build

# 3. Configure Node Role (Roles: validator | full | rpc | bootnode)
sudo ./nakharax-node-bootstrap.sh setup --role validator \
  --data-dir /var/lib/nakharax-node \
  --validator-address 0x...

# 4. Install Systemd Service for Auto-Restart
sudo ./nakharax-node-bootstrap.sh install-systemd --data-dir /var/lib/nakharax-node
sudo systemctl start nakharax-node
```

---

## 🔑 2. Wallet & Key Management Specification

### 🔹 2.1 Faucet Treasury & Admin Key Generation
```bash
# Generate a CSPRNG Ed25519 faucet key in an owner-only file.
python services/core/scripts/generate-faucet-key.py --env-file /secure/faucet.env

# Or retrieve the faucet key generated with the offline sovereign master wallet.
python services/core/scripts/generate-faucet-key.py \
  --from-master-wallet /secure/master_wallet_secrets.json \
  --env-file /secure/faucet.env
```

### 🔹 2.2 Validator Identity Keys (P2P Identity Management)
Validator nodes maintain fixed P2P PeerId state via the `--identity-key` flag:
```bash
./target/release/nakharax-node --role validator \
  --chain services/core/tools/genesis.json \
  --identity-key /var/lib/nakharax-node/identity.key
```

---

## 🚀 3. Genesis Initiation & Network Sync

1. **Verify Genesis Integrity:**
   ```bash
   python services/core/core/tools/verify_genesis.py
   ```
2. **Distribute Genesis Blueprint to Peer Nodes:**
   ```powershell
   .\services\core\ops\deploy\scripts\distribute-genesis.ps1
   ```
3. **Verify Chain ID & Sync Height:**
   ```bash
   ./nakharax-node-bootstrap.sh doctor --rpc http://127.0.0.1:8545
   ```

---

## 📊 4. Telemetry & Production Readiness Verification

### 🔹 4.1 Automated Production Readiness Checker
```bash
python services/core/scripts/check_testnet_production_readiness.py \
  --validator http://127.0.0.1:8545 \
  --public-rpc https://rpc.nakharax.com
```

### 🔹 4.2 Pre-Flight Launch Verification Checklist
```bash
./services/core/ops/deploy/scripts/verify-launch-ready.sh
```

---

*Certified & Maintained in NakharaX Protocol Repository: August 2026*
