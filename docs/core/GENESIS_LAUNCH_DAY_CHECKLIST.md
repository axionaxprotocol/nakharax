# Genesis Testnet — Launch Day Checklist

ใช้เมื่อพร้อม **เปิด genesis testnet** ตาม [GENESIS_PUBLIC_TESTNET_PLAN.md](GENESIS_PUBLIC_TESTNET_PLAN.md)

---

## สถานะ Genesis (สร้างแล้ว)

| รายการ | ค่า |
|--------|-----|
| **Chain ID** | 86137 |
| **Genesis file** | `core/tools/genesis.json` |
| **Genesis SHA-256** | `0xed1bdac7c278e5b4f58a1eceb7594a4238e39bb63e1018e38ec18a555c762b55` |
| **Validators** | Validator-EU-01 (217.216.109.5), Validator-AU-01 (46.250.244.4) |
| **validators-active.json** | `core/tools/validators-active.json` (สำหรับ launch script) |

---

## ก่อน Launch (Pre-flight)

- [ ] **Validator keys** — แต่ละ VPS (EU, AU) มี key สำหรับ block production ตรงกับ address ใน genesis
- [ ] **Faucet key** — AU (`46.250.244.4`) ตั้ง `FAUCET_PRIVATE_KEY` ใน `.env` ให้ตรงกับ genesis (deterministic จาก seed `nakharax_faucet_mainnet_q2_2026` ถ้าใช้ default)
- [ ] **Firewall** — VPS1 & VPS2 เปิด 22, 8545, 30303 (และ 8546 ถ้าใช้ WS)
- [ ] **Genesis hash** — ทุก validator ใช้ genesis ชุดเดียวกัน; ตรวจด้วย `sha256sum genesis.json`

---

## ขั้นตอน Launch (สั่งจากเครื่องที่มี SSH ไปยัง validators)

### 1. Generate / Verify Genesis (ทำแล้ว)

```bash
cd core/tools
python create_genesis.py --verify
# ได้ genesis.json และ SHA-256 ด้านบน
```

### 2. Distribute Genesis ไปยัง Validators

**Option A — ใช้ launch script (ต้องมี validators-active.json และ SSH ไปยัง root@217.216.109.5, root@46.250.244.4):**

```bash
cd core/tools
bash launch_genesis.sh
# เลือก distribute genesis เมื่อถาม
```

**Option B — Manual:**

```bash
scp core/tools/genesis.json root@217.216.109.5:~/.nakharax/config/
scp core/tools/genesis.json root@46.250.244.4:~/.nakharax/config/
# บนแต่ละ VPS: sha256sum ~/.nakharax/config/genesis.json ต้องตรงกับ 0xed1bdac7...
```

### 3. Deploy / Update Node บน VPS1 & VPS2

จาก repo root:

```bash
# ส่งและรัน update script บนทั้งสอง VPS
scp ops/deploy/scripts/update-validator-vps.sh root@217.216.109.5:/tmp/
scp ops/deploy/scripts/update-validator-vps.sh root@46.250.244.4:/tmp/
ssh root@217.216.109.5 'bash /tmp/update-validator-vps.sh'
ssh root@46.250.244.4 'bash /tmp/update-validator-vps.sh'
```

หรือใช้ PowerShell (จาก `ops/deploy`):

```powershell
.\scripts\run-update-both-vps.ps1
```

ตรวจว่า config ใช้ **chain_id 86137** และ node อ่าน genesis จาก `~/.nakharax/config/genesis.json`

### 4. ตรวจ RPC และ P2P

```bash
# Chain ID
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://217.216.109.5:8545
# คาดหวัง: "result":"0x15079" (86137)

# Block number (หลัง genesis แล้วควร > 0)
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://217.216.109.5:8545
```

ทำซ้ำกับ `http://46.250.244.4:8545` และตรวจว่า block height สูงขึ้นใกล้เคียงกัน (sync กัน)

#### ตรวจ Sync ระหว่าง VPS1 กับ VPS2 (รันจากเครื่องคุณ)

```powershell
# Chain ID ทั้งคู่ต้องได้ 0x15079 (86137)
curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://217.216.109.5:8545
curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' http://46.250.244.4:8545

# Block number — ถ้า sync กันตัวเลขควรใกล้เคียง (ต่างกันไม่เกินหลักสิบเมื่อรอสักพัก)
curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://217.216.109.5:8545
curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://46.250.244.4:8545
```

ถ้า VPS2 block ต่ำมาก (เช่น 10 ขณะที่ VPS1 หลักแสน) แปลว่ายัง sync ไม่ทันหรือ P2P ไม่ต่อกัน — บน VPS นั้นให้ตรวจ:

```bash
# ตรวจ port P2P 30303 เปิด (docker-proxy = รันใน Docker)
ss -tlnp | grep 30303

# หาชื่อ container ของ node (แล้วใช้ชื่อนั้นในคำสั่งถัดไป)
docker ps --format '{{.Names}}\t{{.Image}}'

# ดู log ของ node (แทน <CONTAINER> ด้วยชื่อจากด้านบน เช่น nakharax-rpc หรือ rpc-node)
docker logs <CONTAINER> --tail 50

# ตรวจ config ว่า chain_id 86137 (path ขึ้นกับที่ deploy — มักอยู่ข้าง docker-compose)
grep -E "chain_id|genesis" /opt/nakharax-deploy/configs/rpc-config.toml 2>/dev/null || \
grep -E "chain_id|genesis" ~/nakharax/services/core/ops/deploy/configs/rpc-config.toml 2>/dev/null || \
find /opt /root -name "rpc-config.toml" -o -name "config.toml" 2>/dev/null | head -5
```

### 5. Coordinated Start (ถ้ายังไม่ start)

- Start validator แรก (EU) ก่อน → หา enode
- จากนั้น start validator ที่สอง (AU) โดยให้ bootstrap ไปที่ enode ของ EU
- หรือใช้ `launch_genesis.sh` เพื่อให้ script จัดการลำดับการ start

---

## หลัง Launch

- [ ] ตรวจ block ถูก produce สม่ำเสมอ (block time 2s ตาม genesis)
- [ ] ตรวจ P2P peer count = 1 ระหว่างสอง validator
- [ ] เปิด stack บน AU (`46.250.244.4`): [VPS_AU_ALL_IN_ONE.md](../../services/core/ops/deploy/VPS_AU_ALL_IN_ONE.md) — `docker-compose.vps.yml`, DNS rpc / explorer / api / faucet → AU
- [ ] ตั้ง `FAUCET_PRIVATE_KEY` ใน `.env` บน AU
- [ ] Frontend ตั้ง `NEXT_PUBLIC_RPC_URL=https://rpc.nakharax.io` และทดสอบ Add Network (86137) + รับ NAK จาก Faucet
- [ ] รัน verify-launch-ready (หลัง RPC/DNS พร้อม): จาก repo root  
  `bash ops/deploy/scripts/verify-launch-ready.sh`

---

## แก้ปัญหา: Too many open files (os error 24)

ถ้า log แสดง `axum::serve: accept error: Too many open files` แปลว่า process ถึงขีดจำกัด file descriptor

**วิธีแก้ (รันบน VPS ที่รัน validator):**

```bash
# 1) เพิ่ม limit ที่ host (ใช้ได้ถาวร)
echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf

# 2) แก้ container — ส่ง script ไปรันบน VPS (จากเครื่องคุณ)
scp ops/deploy/scripts/fix-validator-ulimit.sh root@217.216.109.5:/tmp/
ssh root@217.216.109.5 'bash /tmp/fix-validator-ulimit.sh nakharax-validator-eu'
```

หรือถ้า SSH เข้า VPS อยู่แล้ว:

```bash
cd /root/nakharax
bash ops/deploy/scripts/fix-validator-ulimit.sh nakharax-validator-eu
```

**เช็ก AU stack (จากเครื่องคุณ):**

```powershell
scp services\core\ops\deploy\scripts\check-vps-status.sh root@46.250.244.4:/tmp/
ssh root@46.250.244.4 'sed -i "s/\r$//" /tmp/check-vps-status.sh; bash /tmp/check-vps-status.sh --detailed'
```

Script จะ recreate container ด้วย `--ulimit nofile=65536:65536` อัตโนมัติ หลังรันตรวจ: `docker logs nakharax-validator-eu --tail 20`

**หมายเหตุ:** compose ใน repo มี ulimits แล้ว — deploy ใหม่จะไม่เจอปัญหานี้

---

## อ้างอิง

- Genesis tools: `core/tools/GENESIS_LAUNCH_README.md`
- Validator update: `ops/deploy/VPS_VALIDATOR_UPDATE.md`
- Plan: `docs/GENESIS_PUBLIC_TESTNET_PLAN.md`
- Add network: `docs/ADD_NETWORK_AND_TOKEN.md`
