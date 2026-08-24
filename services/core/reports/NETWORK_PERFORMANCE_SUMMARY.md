# สรุปผลทดสอบ Performance เครือข่าย (Nakharax)

**สร้างอัตโนมัติ:** 2026-08-24 08:46:09 UTC
**RPC ที่ทดสอบ:** `http://127.0.0.1:8545`

---

## 1. Optimize suite

คำสั่ง: `python scripts/run_optimize_suite.py -q --mode full --rpc http://127.0.0.1:8545 --light-duration 45.0 --light-rps 2.5 --json-out reports/optimize_suite_last.json`

- **สถานะรวม:** PASS

### smoke

- ผล: **PASS** — smoke OK

| Metric | ค่า |
|--------|-----|
| `eth_chainId_ms` | 3.55 |
| `eth_blockNumber_ms` | 1.91 |
| `chain_id_hex` | 0x15079 |
| `block_number_hex` | 0x5f7 |

### light_usage

- ผล: **PASS** — light: 96 core ok, 0 core fail over 45s (p50 2ms)

| Metric | ค่า |
|--------|-----|
| `core_successes` | 96 |
| `core_failures` | 0 |
| `optional_attempts` | 16 |
| `optional_ok` | 0 |
| `latency_p50_ms` | 1.92 |
| `latency_p95_ms` | 2.36 |
| `latency_mean_ms` | 1.98 |

รายงานดิบ: `reports/optimize_suite_last.json`

---

## 2. Block timing (`tps_finality_test.py` — block-time)

*ไม่ได้รันหรือล้มเหลว:* skipped (--skip-block-time)


---

## 3. ขั้นถัดไป

- รันซ้ำจากเครื่อง/VPS ใกล้ RPC เพื่อลด latency ที่วัด
- เพิ่ม `--block-duration` เพื่อให้ค่าเฉลี่ยเสถียรขึ้น
- โหมด TPS ต้องมี funded key — ดู `scripts/load_test/tps_finality_test.py --help`
