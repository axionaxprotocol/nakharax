# 📘 NakharaX Protocol: Master Operator, Wallet & Genesis Playbook

**Document ID:** `NAK-PLAYBOOK-2026-V1`  
**Classification:** Official Developer, Operator & Validator Manual  
**Target Chain ID:** `86137` (Public Testnet)  

---

## 🧭 Quick Links & Core Resources

| หมวดหมู่ (Category) | เอกสารและคู่มือหลัก (Documentation Path) | สคริปต์อัตโนมัติ (Automated Scripts) |
| :--- | :--- | :--- |
| **1. ตัวติดตั้ง & สคริปต์รัน Node** | [RUN_PUBLIC_FULL_NODE.md](file:///d:/nakhara-io/docs/core/RUN_PUBLIC_FULL_NODE.md) | [nakharax-node-bootstrap.sh](file:///d:/nakhara-io/services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh) |
| **2. การสร้างกระเป๋า & คีย์** | [WALLET_AND_KEYS_READINESS.md](file:///d:/nakhara-io/docs/core/WALLET_AND_KEYS_READINESS.md) | `generate-faucet-key.py` / `wallet_manager.py` |
| **3. การเปิดตัว Genesis Block** | [GENESIS_LAUNCH_DAY_CHECKLIST.md](file:///d:/nakhara-io/docs/core/GENESIS_LAUNCH_DAY_CHECKLIST.md) | `distribute-genesis.ps1` / `create_genesis.py` |
| **4. การวัดผล Performance & Audit** | [EMPIRICAL_BENCHMARK_REPORT.md](file:///d:/nakhara-io/docs/EMPIRICAL_BENCHMARK_REPORT.md) | `check_testnet_production_readiness.py` / `verify-launch-ready.sh` |
| **5. การเพิ่ม Network ใน MetaMask** | [ADD_NETWORK_AND_TOKEN.md](file:///d:/nakhara-io/docs/core/ADD_NETWORK_AND_TOKEN.md) | `https://rpc.nakharax.com` (Chain ID: `86137`) |

---

## 🛠️ 1. คู่มือสคริปต์ตัวติดตั้ง (Installer & Runtime Commands)

### 🔹 การบิวด์และรัน Node อัตโนมัติคำสั่งเดียว (Automated Node Bootstrap)
```bash
# 1. เข้าสู่ไดเรกทอรีสคริปต์
cd services/core/ops/deploy/scripts

# 2. บิวด์ Binary (Release Mode)
./nakharax-node-bootstrap.sh build

# 3. ตั้งค่า Node (ระบุ Role: validator | full | rpc | bootnode)
sudo ./nakharax-node-bootstrap.sh setup --role validator \
  --data-dir /var/lib/nakharax-node \
  --validator-address 0x...

# 4. ติดตั้งเป็น Daemon Service (Auto-restart)
sudo ./nakharax-node-bootstrap.sh install-systemd --data-dir /var/lib/nakharax-node
sudo systemctl start nakharax-node
```

---

## 🔑 2. คู่มือการสร้างกระเป๋าเงิน และจัดการ คีย์ (Wallet & Key Management)

### 🔹 2.1 กระเป๋า Faucet & Admin Key Generator
```bash
# สร้าง Private Key ใหม่สำหรับ Faucet (Testnet Deterministic / Mainnet Random)
python services/core/scripts/generate-faucet-key.py --testnet

# หรือสร้างไฟล์ .env สำหรับ Faucet Service
python services/core/scripts/generate-faucet-key.py --env
```

### 🔹 2.2 คีย์ประจำโหนด Validator (P2P Identity Key)
Validator ทุกโหนดจะรักษาสถานะ PeerId คงที่ผ่านไฟล์ `--identity-key`:
```bash
./target/release/nakharax-node --role validator \
  --chain services/core/tools/genesis.json \
  --identity-key /var/lib/nakharax-node/identity.key
```

---

## 🚀 3. คู่มือการเริ่มต้น Genesis & Sync เครือข่าย (Genesis Initiation)

1. **ตรวจสอบ Genesis Integrity:**
   ```bash
   python services/core/core/tools/verify_genesis.py
   ```
2. **กระจาย Genesis ไปยังโหนดทั้งหมด:**
   ```powershell
   .\services\core\ops\deploy\scripts\distribute-genesis.ps1
   ```
3. **ตรวจสอบ Chain ID และ Sync Height:**
   ```bash
   ./nakharax-node-bootstrap.sh doctor --rpc http://127.0.0.1:8545
   ```

---

## 📊 4. คู่มือการวัดผลและประเมินประสิทธิภาพ (Benchmark & Telemetry)

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

**สรุป:** เอกสาร คู่มือ และสคริปต์ทั้งหมดถูกรวมศูนย์ไว้อย่างเป็นระบบใน **[NAKHARAX_OPERATOR_PLAYBOOK.md](file:///d:/nakhara-io/docs/NAKHARAX_OPERATOR_PLAYBOOK.md)** พร้อมใช้งานสำหรับการเปิดตัว Public Testnet อย่างสมบูรณ์!
