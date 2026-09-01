# NakharaX Public Testnet Genesis Runbook

คู่มือฉบับ canonical สำหรับเตรียมและเปิด NakharaX Public Testnet บน Linux VPS

- Launch date: 1 September 2026
- Genesis time: `2026-09-01T00:00:00Z`
- Chain ID: `86137` (`0x15079`)
- P2P: `30303/TCP` and `30303/UDP`
- Local JSON-RPC: `127.0.0.1:8545`
- Local health/metrics: `127.0.0.1:8080`
- Block time: 3 seconds
- Runtime: native `nakharax-node` managed by systemd

คู่มือนี้แทนเอกสาร deployment รุ่นเก่าที่ใช้ `mock-rpc`, พอร์ต `30333`, repository เก่า หรือ container image tag `latest` ห้ามใช้ mock RPC เป็น Genesis node

## 1. Topology ที่รองรับโดย runtime ปัจจุบัน

โครงสร้าง launch ใช้ VPS ใหม่ 7 เครื่องทั้งหมด ไม่มีการ reuse IP, Peer ID หรือ identity key จากระบบเดิม ทั้ง 7 เครื่องเป็น network nodes แต่ runtime bootstrap validator จริงยังมี 2 ราย

| Host | Role | Public ingress | Genesis validator address |
|---|---|---|---|
| VPS-01 | Seed/bootnode | P2P `30303` | — |
| VPS-02 | Validator-01 | P2P `30303` | `0xca0e4e60f8ce825dbb820c72a7e28e28cdae3326` |
| VPS-03 | Validator-02 | P2P `30303` | `0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb` |
| VPS-04 | Public RPC primary | HTTPS `443`, P2P `30303` | — |
| VPS-05 | Public RPC secondary + observer | HTTPS `443`, P2P `30303` | — |
| VPS-06 | Faucet + observer | HTTPS `443`, P2P `30303` | — |
| VPS-07 | Monitoring + observer | P2P `30303`; monitoring ผ่าน private access | — |

ขั้นต่ำสำหรับ validator คือ 4 vCPU, RAM 8 GB, NVMe 100 GB และ public IPv4 แบบคงที่ ใช้ Ubuntu 22.04/24.04 LTS รุ่นเดียวกันทุกเครื่องเพื่อลดความต่างของ runtime

## 2. Source of truth และค่าที่ต้อง freeze

Source code และ genesis ต้องมาจาก launch commit เดียวกัน

| Artifact | Path | Release-candidate value |
|---|---|---|
| Deployment genesis | `services/core/core/tools/genesis.json` | SHA-256 `AFD34AFD2D22A5D9C963B2C481C028399AF6F2DF602F39248BD044F30762A0AA` |
| Native genesis manifest | `services/core/core/tools/genesis_canonical.json` | SHA-256 `D2123DE821980AD617D6EFC007EDAB7E5DDC386140A5449118223F7BE4FA1D5B` |
| Genesis block hash | native manifest | `0x6e93b29d01abe7ea88ab5d9890b9b4b0a682dcad782a4d7cf43076a29df4eafe` |
| Genesis state root | native manifest | `0x0f5780715afc3c02910afb737a54270a50d20336608bf740f5f0686f2bbbb300` |

ค่าด้านบนเป็น release candidate ถ้าแก้ genesis source ต้อง regenerate, ทดสอบ และบันทึก hash ใหม่ ห้ามแก้ genesis หลัง node ใด node หนึ่งเริ่มสร้าง block แล้ว

บันทึก launch manifest ก่อน deploy:

```bash
git rev-parse HEAD
sha256sum services/core/core/tools/genesis.json
sha256sum services/core/core/tools/genesis_canonical.json
```

## 3. Go/No-Go ก่อนซื้อหรือเปิด VPS

จาก repository root:

```bash
cd services/core/core
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace --all-features
python3 tools/create_genesis.py --verify
cargo run -p genesis --bin genesis-export -- tools/genesis_canonical.json
git diff --check
```

ทุกคำสั่งต้อง exit `0` และ working tree ต้องมีเฉพาะการเปลี่ยนแปลงที่ตั้งใจจะรวมใน launch commit

ก่อน deploy ให้ commit/tag release candidate แล้วแทนค่าในทุกเครื่อง:

```bash
export LAUNCH_COMMIT='<FULL_GIT_COMMIT_SHA>'
```

ห้าม deploy จาก `master` ที่เคลื่อนไหวหรือ image tag `latest`

## 4. ข้อมูลที่ต้องเตรียม

กรอกตารางนี้ก่อนเริ่ม:

| Variable | Value |
|---|---|
| `ADMIN_IP` | Public IP ของผู้ดูแลที่อนุญาต SSH |
| `VPS01_IP` / `SEED_IP` | VPS-01 |
| `VPS02_IP` / `VALIDATOR_01_IP` | VPS-02 |
| `VPS03_IP` / `VALIDATOR_02_IP` | VPS-03 |
| `VPS04_IP` / `RPC_PRIMARY_IP` | VPS-04 |
| `VPS05_IP` / `RPC_SECONDARY_IP` | VPS-05 |
| `VPS06_IP` / `FAUCET_IP` | VPS-06 |
| `VPS07_IP` / `MONITORING_IP` | VPS-07 |
| `DOMAIN` | โดเมนที่จดจริง |
| `LAUNCH_COMMIT` | full 40-character commit SHA |

สถานะก่อนซื้อ VPS ต้องเป็น `UNASSIGNED` ทุก IP เมื่อได้เครื่องใหม่แล้วจึงกรอก static public IPv4 ทั้ง 7 ค่า ตรวจว่าไม่ซ้ำกัน และบันทึก provider, region, hostname, rescue console และวันหมดอายุไว้ใน inventory ห้ามคัดลอก Peer ID จาก deployment เก่า เพราะ Peer ID ต้องอ่านจาก identity key ที่สร้างบนเครื่องใหม่เท่านั้น

สร้าง SSH key เฉพาะ testnet และเก็บสำรองแบบเข้ารหัส ห้ามใส่ private key, `.env`, `identity.key` หรือ mnemonic ใน Git

## 5. DNS

สร้าง A records หลังได้รับ VPS IP:

| Record | Target | หมายเหตุ |
|---|---|---|
| `rpc.<DOMAIN>` | `RPC_PRIMARY_IP` | Public JSON-RPC |
| `rpc-backup.<DOMAIN>` | `RPC_SECONDARY_IP` | Secondary JSON-RPC; ยังไม่ใส่ใน client default จนผ่าน soak test |
| `faucet.<DOMAIN>` | `FAUCET_IP` | Faucet API |
| `explorer.<DOMAIN>` | host ที่ deploy explorer ภายหลัง | อย่า publish จน explorer ผ่าน E2E |
| `app.<DOMAIN>` | frontend host | deploy จาก frontend repository แยก |
| `<DOMAIN>` / `www` | website host | ไม่ใช่หน้าที่ของ Core VPS |

ใช้ DNS-only ระหว่างออก TLS certificate ครั้งแรก เปิด CDN/proxy หลัง HTTPS ผ่านแล้วและทดสอบ JSON-RPC POST สำเร็จ

## 6. Base OS บน VPS ทั้ง 7

รันทีละเครื่อง:

```bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y build-essential pkg-config libssl-dev clang cmake git curl jq ufw ca-certificates

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
source "$HOME/.cargo/env"
rustup component add rustfmt clippy
rustc --version
cargo --version
```

Clone และ pin commit เดียวกันทุกเครื่อง:

```bash
sudo git clone https://github.com/axionaxprotocol/nakharax.git /opt/nakharax
sudo chown -R "$USER":"$USER" /opt/nakharax
cd /opt/nakharax
git fetch --all --tags
git checkout --detach "$LAUNCH_COMMIT"
test "$(git rev-parse HEAD)" = "$LAUNCH_COMMIT"
```

Build Linux release และติดตั้ง binary:

```bash
cd /opt/nakharax/services/core/core
cargo build --release -p node
sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node
sha256sum /usr/local/bin/nakharax-node
```

บันทึก SHA-256 ของ Linux binary จากทุกเครื่องใน launch log ควรใช้ source commit และ toolchain รุ่นเดียวกัน

## 7. Firewall

อย่าเปิด `8545`, `8080`, `3000`, `3002`, `9090` หรือ `9100` สู่สาธารณะ ให้ Caddy รับเฉพาะ `80/443`

รันทุกเครื่องโดยแทน `ADMIN_IP` ก่อน ห้าม enable firewall จนตรวจว่า SSH rule ถูกต้อง:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from "$ADMIN_IP" to any port 22 proto tcp
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp
sudo ufw enable
sudo ufw status numbered
```

เฉพาะ VPS-04, VPS-05 และ VPS-06:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

เปิด SSH session ใหม่ทดสอบก่อนปิด session เดิม

## 8. System user และ systemd hardening

รันทุกเครื่อง:

```bash
sudo useradd --system --home /var/lib/nakharax-node --shell /usr/sbin/nologin nakharax 2>/dev/null || true
sudo install -d -o nakharax -g nakharax -m 0750 /var/lib/nakharax-node
```

หลังรัน `setup` ในแต่ละ role ตามหัวข้อถัดไป ให้ติดตั้ง unit นี้:

```bash
sudo tee /etc/systemd/system/nakharax-node.service >/dev/null <<'EOF'
[Unit]
Description=NakharaX Public Testnet Node
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=nakharax
Group=nakharax
WorkingDirectory=/var/lib/nakharax-node
ExecStart=/var/lib/nakharax-node/run.sh
Restart=always
RestartSec=10
LimitNOFILE=65536
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/nakharax-node

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nakharax-node
```

## 9. Start VPS-01 seed node

```bash
cd /opt/nakharax
BOOTSTRAP_SCRIPT='services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh'
GENESIS='/opt/nakharax/services/core/core/tools/genesis.json'

sudo env NAKHARAX_NODE_BIN=/usr/local/bin/nakharax-node \
  bash "$BOOTSTRAP_SCRIPT" setup \
  --role bootnode \
  --data-dir /var/lib/nakharax-node \
  --genesis "$GENESIS" \
  --rpc 127.0.0.1:8545 \
  --p2p 0.0.0.0:30303

sudo chown -R nakharax:nakharax /var/lib/nakharax-node
sudo systemctl start nakharax-node
sudo journalctl -u nakharax-node -n 100 --no-pager
```

ดึง Peer ID จาก log:

```bash
SEED_PEER_ID="$(sudo journalctl -u nakharax-node --no-pager | sed -n 's/.*Local peer ID: \([[:alnum:]]\+\).*/\1/p' | tail -n 1)"
test -n "$SEED_PEER_ID"
echo "/ip4/${SEED_IP}/tcp/30303/p2p/${SEED_PEER_ID}"
```

เก็บค่าที่ได้เป็น:

```bash
export SEED_MULTIADDR='/ip4/<SEED_IP>/tcp/30303/p2p/<REAL_SEED_PEER_ID>'
```

ห้ามใช้ peer IDs เดิมจาก `PUBLIC_TESTNET_BOOTSTRAPS.txt` จนกว่าจะสร้างและยืนยัน identity keys บน VPS จริง

## 10. Start genesis validators

VPS-02:

```bash
cd /opt/nakharax
sudo env NAKHARAX_NODE_BIN=/usr/local/bin/nakharax-node \
  NAKHARAX_BOOTSTRAP_NODES="$SEED_MULTIADDR" \
  bash services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh setup \
  --role validator \
  --data-dir /var/lib/nakharax-node \
  --genesis /opt/nakharax/services/core/core/tools/genesis.json \
  --rpc 127.0.0.1:8545 \
  --p2p 0.0.0.0:30303 \
  --validator-address 0xca0e4e60f8ce825dbb820c72a7e28e28cdae3326

sudo chown -R nakharax:nakharax /var/lib/nakharax-node
sudo systemctl start nakharax-node
```

VPS-03 ใช้คำสั่งเดียวกันแต่เปลี่ยน validator address เป็น:

```text
0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb
```

ตรวจทั้งสองเครื่อง:

```bash
sudo journalctl -u nakharax-node -f
```

ต้องเห็น chain ID `86137`, bootstrap peer connection และ block producer interval 3 วินาที ห้ามเดินหน้าหาก validator ใช้ address ซ้ำกัน

## 11. Start public RPC และ observer

VPS-04 ใช้ role `rpc`:

```bash
cd /opt/nakharax
sudo env NAKHARAX_NODE_BIN=/usr/local/bin/nakharax-node \
  NAKHARAX_BOOTSTRAP_NODES="$SEED_MULTIADDR" \
  bash services/core/ops/deploy/scripts/nakharax-node-bootstrap.sh setup \
  --role rpc \
  --data-dir /var/lib/nakharax-node \
  --genesis /opt/nakharax/services/core/core/tools/genesis.json \
  --rpc 127.0.0.1:8545 \
  --p2p 0.0.0.0:30303

sudo chown -R nakharax:nakharax /var/lib/nakharax-node
sudo systemctl start nakharax-node
```

VPS-05 ใช้คำสั่งเดียวกันด้วย role `rpc` เพื่อเป็น secondary RPC

VPS-06 และ VPS-07 ใช้คำสั่งเดียวกันแต่เปลี่ยน `--role rpc` เป็น `--role full` จากนั้น VPS-06 จึงติดตั้ง faucet และ VPS-07 จึงติดตั้ง monitoring stack ห้ามเปิด monitoring dashboard สู่ public internet โดยตรง

## 12. Local chain verification

รันทุกเครื่อง:

```bash
curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq

curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":2}' | jq

curl -fsS -X POST http://127.0.0.1:8545 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":3}' | jq

curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/ready | jq
```

Expected:

- `eth_chainId.result == "0x15079"`
- block height เพิ่มขึ้น
- validator/RPC/observer มี peer อย่างน้อย 1 ราย
- `/health` ตอบ HTTP 200

ตรวจ cadence บน VPS-04:

```bash
H1="$(curl -fsS -X POST http://127.0.0.1:8545 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r .result)"
sleep 12
H2="$(curl -fsS -X POST http://127.0.0.1:8545 -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":2}' | jq -r .result)"
printf 'before=%s after=%s\n' "$H1" "$H2"
test "$H1" != "$H2"
```

## 13. Public RPC with Caddy

บน VPS-04:

```bash
sudo apt-get install -y caddy
```

สร้าง `/etc/caddy/Caddyfile`:

```caddy
{
    email admin@<DOMAIN>
}

rpc.<DOMAIN> {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    reverse_proxy 127.0.0.1:8545
}
```

แทน `<DOMAIN>` ก่อน validate:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable --now caddy
sudo journalctl -u caddy -n 100 --no-pager
```

ตรวจจากเครื่องภายนอก:

```bash
curl -fsS -X POST "https://rpc.<DOMAIN>" \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -e '.result == "0x15079"'
```

บน VPS-05 ใช้ Caddy configuration แบบเดียวกันแต่เปลี่ยน hostname เป็น `rpc-backup.<DOMAIN>` และ reverse proxy ไป `127.0.0.1:8545` อย่าใส่ secondary endpoint เป็น client default จน node sync ถึง tip และผ่าน soak test อย่างน้อย 24 ชั่วโมง

## 14. Faucet บน VPS-06

Build และติดตั้ง:

```bash
cd /opt/nakharax/services/core/core
cargo build --release -p nakharax-faucet
sudo install -o root -g root -m 0755 target/release/nakharax-faucet /usr/local/bin/nakharax-faucet
```

Faucet testnet key ต้อง derive เป็น address ที่ได้รับ genesis allocation นี้เท่านั้น:

```text
0x9dd7e28ccd04cfb6547adc7be2a8cf2beb434a1c
```

Derive testnet key บน VPS-06 เท่านั้น แล้วใส่ผลลัพธ์ลง root-only env file ห้าม commit หรือส่งผ่าน chat:

```bash
python3 -c "import hashlib; print(hashlib.sha256(b'nakharax_faucet_mainnet_q2_2026').hexdigest())"
sudo install -d -o root -g nakharax -m 0750 /etc/nakharax
sudo install -o root -g nakharax -m 0640 /dev/null /etc/nakharax/faucet.env
sudoedit /etc/nakharax/faucet.env
```

สร้าง `/etc/nakharax/faucet.env` แบบ permission `0600` โดยตั้งค่า:

```dotenv
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=86137
FAUCET_PRIVATE_KEY=<32-byte Ed25519 testnet key; never commit>
PORT=3002
FAUCET_AMOUNT=100
FAUCET_GAS_PRICE=1000000000
RATE_LIMIT_MINUTES=1440
CORS_ORIGINS=https://app.<DOMAIN>,https://faucet.<DOMAIN>
RUST_LOG=info
```

ติดตั้ง systemd service:

```bash
sudo tee /etc/systemd/system/nakharax-faucet.service >/dev/null <<'EOF'
[Unit]
Description=NakharaX Testnet Faucet
After=network-online.target nakharax-node.service
Wants=network-online.target

[Service]
Type=simple
User=nakharax
Group=nakharax
EnvironmentFile=/etc/nakharax/faucet.env
ExecStart=/usr/local/bin/nakharax-faucet
Restart=always
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now nakharax-faucet
curl -fsS http://127.0.0.1:3002/health
curl -fsS http://127.0.0.1:3002/info | jq
```

ค่า `address` จาก `/info` ต้องตรง `0x9dd7...` ก่อนเปิด public endpoint ถ้าไม่ตรงให้หยุด service และแก้ key ห้ามเติมเงินให้ address ใหม่แบบข้าม genesis manifest

ติดตั้ง Caddy และเพิ่ม public faucet route บน VPS-06:

```bash
sudo apt-get install -y caddy
```

เพิ่มลง `/etc/caddy/Caddyfile`:

```caddy
faucet.<DOMAIN> {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3002
}
```

Validate และ reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### Monitoring บน VPS-07

ให้ VPS-07 รัน observer node ก่อน แล้วติดตั้ง monitoring stack ที่เลือกภายหลังโดยยึดกฎต่อไปนี้:

- scrape node health/metrics ผ่าน private network, SSH tunnel หรือ authenticated overlay เท่านั้น
- ห้ามเปิด Grafana, Prometheus หรือ node exporter สู่ public internet
- alert อย่างน้อยเมื่อ block ไม่เดิน, peer เป็นศูนย์, process restart loop, disk เหลือน้อยกว่า 20%, memory pressure และ TLS ใกล้หมดอายุ
- ทดสอบ alert delivery จริงก่อนเปิด public announcement

## 15. Explorer และ frontend

Explorer และ Web OS ไม่ใช่ launch blocker ของ consensus core

- อย่าใช้ mock explorer หรือ redirect `explorer` ไป dashboard แล้วประกาศว่าเป็น block explorer
- Deploy Blockscout หลังยืนยันว่า RPC methods ที่ indexer ต้องใช้ครบ
- Deploy `app.<DOMAIN>` จาก frontend repository แยก
- ระหว่างยังไม่พร้อม ให้ DNS record ไม่ตอบหรือแสดง maintenance page ที่ระบุสถานะตรงไปตรงมา

## 16. Final public verification

จากเครื่องที่อยู่นอก VPS network:

```bash
dig +short rpc.<DOMAIN>
dig +short faucet.<DOMAIN>

curl -fsS -X POST https://rpc.<DOMAIN> \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | jq -e '.result == "0x15079"'

curl -fsS -X POST https://rpc.<DOMAIN> \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":2}' | jq -e '.result != null'

curl -fsS https://faucet.<DOMAIN>/health
curl -fsS https://faucet.<DOMAIN>/info | jq -e '.chain_id == 86137'
```

ถ้าโดเมนจริงคือ `nakharax.com` ให้รัน repository readiness checker จากเครื่อง operator หลัง DNS พร้อม:

```bash
cd /opt/nakharax/services/core
bash ops/deploy/scripts/verify-launch-ready.sh
```

สคริปต์นี้มี DNS/SSL hostnames ของ `nakharax.com` ฝังอยู่ หากใช้โดเมนอื่นให้ใช้คำสั่ง public verification ด้านบนจนกว่าจะปรับ checker ให้รองรับ domain override

## 17. Go/No-Go checklist

เปิด public announcement ได้เมื่อครบทุกข้อ:

- [ ] launch commit ถูก tag และเหมือนกันทุก VPS
- [ ] inventory มี public IPv4 ใหม่ครบทั้ง 7 เครื่องและไม่มี IP เดิมหลงเหลือ
- [ ] genesis JSON และ native manifest hashes ตรง launch manifest
- [ ] Linux node binary hash ถูกบันทึก
- [ ] identity keys ถูกเก็บถาวรและ backup แบบเข้ารหัส
- [ ] seed multiaddr มาจาก Peer ID จริง ไม่ใช่ placeholder
- [ ] validator EU/AU ใช้ address ไม่ซ้ำกัน
- [ ] validator ทั้งสองสร้างและรับ block ต่อเนื่อง
- [ ] RPC primary, RPC secondary และ observer ทั้งสามเครื่อง sync ถึง tip เดียวกัน
- [ ] Chain ID ภายในและภายนอกเป็น `0x15079`
- [ ] P2P เปิดเฉพาะ `30303/TCP+UDP`
- [ ] RPC backend `8545` ไม่เปิดสาธารณะ
- [ ] TLS certificate ถูกต้อง
- [ ] Faucet `/info` แสดง funded genesis address
- [ ] Faucet request จริงหนึ่งครั้งสำเร็จและ receipt ถูกค้นได้
- [ ] ไม่มี secret ถูก track โดย Git
- [ ] มีผู้ดูแลเฝ้า logs และ resource usage หลังเปิดอย่างน้อย 60 นาที

## 18. Recovery

Restart service:

```bash
sudo systemctl restart nakharax-node
sudo journalctl -u nakharax-node -f
```

เก็บไฟล์เหล่านี้ก่อนซ่อมหรือย้ายเครื่อง:

```text
/var/lib/nakharax-node/identity.key
/var/lib/nakharax-node/genesis.json
/var/lib/nakharax-node/node.env
/var/lib/nakharax-node/state.redb
```

ก่อน Genesis สามารถหยุดทุก node และเริ่ม state ใหม่ได้ หลัง Genesis ห้ามแก้ genesis หรือ identity key แบบเงียบ ๆ หากต้อง resync ให้หยุด node, backup data directory, เก็บ identity key เดิม แล้ว resync จาก peer ที่ตรวจ hash แล้ว

Emergency stop:

```bash
sudo systemctl stop nakharax-faucet 2>/dev/null || true
sudo systemctl stop caddy 2>/dev/null || true
sudo systemctl stop nakharax-node
```

การหยุด service ไม่ลบ state หรือ keys และสามารถย้อนกลับได้
