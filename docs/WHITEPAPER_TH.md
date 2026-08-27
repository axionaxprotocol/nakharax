# เอกสารสมุดปกขาว: Nakharax Protocol (ฉบับปรับปรุง v3.3)

**โครงสร้างพื้นฐานการประมวลผล AI แบบกระจายศูนย์และตรวจสอบได้สำหรับวิทยาศาสตร์และปัญญาประดิษฐ์**

*(Verifiable DePIN Compute Grid & Autonomous Agentic Nervous System)*

---

### ข้อมูลจำเพาะของโปรโตคอล (Protocol Metadata)

| หัวข้อ | รายละเอียด |
| --- | --- |
| **เวอร์ชัน (Version)** | 3.3 (August 2026 Edition — Pre-Mainnet Genesis) |
| **สถานะโครงข่าย (Network Status)** | Testnet Active (Chain ID: `86137` / `0x15079`) \| Mainnet Target (`86150`) |
| **เหรียญประจำเครือข่าย (Native Token)** | **$NAK** (18 Decimals) \| Testnet Token: **$tNAK** / **$tNAK** |
| **ระยะเวลาต่อบล็อก (Block Time)** | ~2.88 – 3.00 วินาที (P95 Constant Cadence) |
| **กลไกฉันทามติ (Consensus)** | **PoPC** (Proof of Practical Compute (PoPC), $s=1000$, $\alpha=0.99$) |
| **ใบอนุญาตซอฟต์แวร์ (License)** | AGPLv3 (Core Engine) / MIT (Tooling & SDK) |
| **เว็บไซต์ & แดชบอร์ดหลัก** | [nakharax.com](https://nakharax.com) \| [app.nakharax.com](https://app.nakharax.com) (Nakharax OS) |
| **การเชื่อมต่อมาตรฐาน (Ports)** | P2P: `30303` \| RPC HTTP: `8545` \| WebSocket: `8546` \| OS Dashboard: `3030` |

---

### บทคัดย่อ (Abstract)

**Nakharax Protocol** เป็นเครือข่ายโครงสร้างพื้นฐานทางกายภาพแบบกระจายศูนย์ (DePIN) ที่เปลี่ยนทรัพยากรประมวลผลที่ไม่ได้ใช้งานจากฮาร์ดแวร์ระดับผู้บริโภค (Consumer Hardware) เช่น พีซี, เวิร์กสเตชัน, เครื่อง Mac และบอร์ด Edge NPU (เช่น Raspberry Pi + Hailo, Orange Pi, Arduino VENTUNO Q) ให้กลายเป็นโครงข่ายซูเปอร์คอมพิวเตอร์ระดับโลก สำหรับงานประมวลผล AI และงานวิจัยวิทยาศาสตร์ที่มีลักษณะอิสระต่อกัน (Embarrassingly-Parallel Workloads)

โปรโตคอลใช้กลไกฉันทามติและการพิสูจน์ผลลัพธ์แบบ **Proof of Practical Compute (PoPC) (PoPC)** ซึ่งตรวจสอบความถูกต้องของการประมวลผลผ่านการสุ่มตรวจทางสถิติ (Statistical Sampling) ช่วยลดความซับซ้อนในการตรวจสอบจาก $O(n)$ เหลือเพียง $O(s)$ ($s \ll n$) ทำให้การยืนยันผลลัพธ์งาน AI ขนาดใหญ่เกิดขึ้นบนบล็อกเชนได้จริงโดยไม่ต้องรันซ้ำทั้งหมด พร้อมเชื่อมต่อเข้ากับ **Model Context Protocol (MCP)** และระบบรักษาความปลอดภัยอัตโนมัติด้วย **DeAI 7-Sentinels Shield**

---

### 1. บทนำและวิสัยทัศน์ (Introduction & Problem Framing)

#### 1.1 วิกฤตต้นทุนและการรวมศูนย์ของการประมวลผล AI (The Centralized Compute Bottleneck)

* การเช่าเครื่องเซิร์ฟเวอร์ GPU จากผู้ให้บริการคลาวด์ขนาดใหญ่ (Hyperscalers) มีราคาสูงถึง $1–$3 ต่อ GPU-ชั่วโมง และเข้าถึงได้ยากสำหรับนักวิจัยอิสระหรือสตาร์ตอัปขนาดเล็ก
* การประมวลผลวิทยาศาสตร์และ AI จำนวนมาก (เช่น Monte Carlo Simulations, Parameter Sweeps, Batch LLM Inference) เป็นงานที่แต่ละส่วนไม่จำเป็นต้องสื่อสารกันแบบเรียลไทม์ (Embarrassingly-Parallel) ซึ่งไม่จำเป็นต้องพึ่งพา Supercomputer ขนาดใหญ่ที่มีอินเตอร์คอนเนกต์แบบ NVLink ความหน่วงต่ำมาก
* โครงการในอดีตอย่าง Folding@home (พลังประมวลผลสูงสุด ~2.4 exaFLOPS) และ BOINC พิสูจน์แล้วว่าการระดมฮาร์ดแวร์ระดับบ้านเรือนสามารถสร้างพลังประมวลผลมหาศาลได้ แต่ขาด **ระบบแรงจูงใจทางการเงิน (Economic Incentives)** และ **กลไกการตรวจสอบผลลัพธ์แบบไม่พึ่งพาความเชื่อใจ (Trustless Verification)**

```
+-----------------------------------------------------------------------------------------+
|                               Nakharax Protocol Ecosystem                               |
+-----------------------------------------------------------------------------------------+
|  [Clients / Researchers] ──(จ้างงาน AI / ข้อมูล)──> [Smart Escrow & PPC Pricing]        |
|                                                               │                         |
|  [ASR Weighted VRF Router] ──(จัดสรรงานตาม SLA)───> [Worker Nodes (Docker/HAL Sandbox)] |
|                                                               │                         |
|  [PoPC Consensus Engine] <──(ส่งผลลัพธ์ + Merkle Proofs)──────┘                         |
|         │                                                                               |
|         ├──> ตรวจสอบผ่านสถิติ O(s) ──> ปล่อยรางวัล $NAK สู่ Worker                       |
|         └──> พบการทุจริต ─────────────> ยึดเงินค้ำประกัน (Slashing สูงสุด 100%)         |
+-----------------------------------------------------------------------------------------+
```

#### 1.2 การรักษาอธิปไตยของข้อมูล (Data Sovereignty)

เพื่อปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (เช่น PDPA ของไทย หรือ GDPR ของสหภาพยุโรป) เครือข่าย Nakharax รองรับโมเดล **"Own-Your-Node"** ที่เปิดให้องค์กรและบุคคลสามารถประมวลผลข้อมูลภายในเครื่องของตนเองหรือภายในประเทศ โดยไม่ต้องส่งข้อมูลส่วนบุคคลออกไปยังเซิร์ฟเวอร์คลาวด์ต่างชาติ

---

### 2. สถาปัตยกรรมระบบ 4 เลเยอร์ (4-Layer Technical Architecture)

```
┌───────────────────────────────────────────────────────────────────┐
│            1. Agentic & MCP Discovery Layer (TypeScript)          │
│     @nakharax/mcp-server · Sub-ms Tool Search · Streaming QUIC     │
├───────────────────────────────────────────────────────────────────┤
│               2. Compute & DeAI Worker Layer (Python)             │
│   HAL (CUDA / Metal / ROCm / Hailo NPU) · STARK FRI Solver · Sandbox│
├───────────────────────────────────────────────────────────────────┤
│             3. Marketplace & Economic Layer (Solidity)            │
│   Job Escrow · PPC Dynamic Pricing · ASR Top-K VRF Router (K=64)  │
├───────────────────────────────────────────────────────────────────┤
│                 4. Blockchain Core Layer (Rust L1)                │
│    PoPC Consensus · RocksDB/redb · libp2p Mesh · 7 Sentinels      │
└───────────────────────────────────────────────────────────────────┘
```

1. **Agentic & MCP Discovery Layer (`@nakharax/mcp-server`)**:
   - เชื่อมต่อ AI Agents เข้ากับโปรโตคอลตามมาตรฐาน **Model Context Protocol (MCP)** ผ่าน STDIO และ QUIC/WebSockets ความหน่วงต่ำ
   - ลดการบวมของ Context Window และเปิดให้เกิดการชำระเงินอัตโนมัติแบบ Agent-to-Agent (A2A Micro-Settlement)

2. **Compute & DeAI Worker Layer (Python Subsystem)**:
   - รันงานประมวลผลผ่าน Hardware Abstraction Layer (HAL) รองรับ NVIDIA CUDA, Apple Metal, AMD ROCm 6 และ Hailo-8/Hailo-10H NPU
   - ติดตั้งระบบแก้โจทย์พหุนาม **STARK FRI Low-Degree Extension (1,024 Constraints)** ความเร็ว 1.96ms ภายใน `worker_daemon.py`
   - แยกสภาพแวดล้อมการประมวลผลให้ปลอดภัยด้วย Docker Container Isolation และ Cgroups

3. **Marketplace & Economic Settlement Layer (Solidity)**:
   - สัญญาอัจฉริยะ `JobMarketplace.sol` บริหารจัดการ Escrow, การวางเงินค้ำประกัน (Collateral), และการจ่ายผลตอบแทน
   - **ASR (Auto-Selection Router)**: คัดเลือก Worker ที่เหมาะสมด้วยฟังก์ชัน Top-K Weighted VRF ($K=64$, โควตาจำกัดสูงสุดไม่เกิน 12.5% ต่อโหนดเพื่อป้องกันการผูกขาด)
   - **PPC (Posted Price Controller)**: ปรับคำนวณราคาประมวลผลตามปริมาณความต้องการและคิวงานในระบบ

4. **Blockchain Core Layer (Rust Workspace - 18 Crates)**:
   - ดูแลโครงสร้างบล็อกเชน Layer-1 ด้วยภาษา Rust ที่ปลอดภัย ปราศจาก `unsafe` blocks
   - จัดการ P2P Swarm ผ่าน `libp2p` (GossipSub, Kademlia DHT, mDNS) บนพอร์ต `30303`
   - ให้บริการ JSON-RPC แบบมาตรฐาน Ethereum (EVM-Compatible) และ OpenAI-Compatible API (`/v1/chat/completions`) บนพอร์ต `8545`

---

### 3. กลไกฉันทามติ PoPC และการแก้ปัญหา Non-Deterministic AI Compute

#### 3.1 หลักการทางคณิตศาสตร์ของ PoPC (Proof of Practical Compute (PoPC))

การคำนวณแบบเดิมบังคับให้โหนดตรวจสอบต้องรันซ้ำ 100% ทำให้สิ้นเปลืองพลังงานแบบ $O(n)$ Nakharax PoPC แบ่งงานเป็นชิ้นย่อยและสร้าง Merkle Tree จากผลลัพธ์ จากนั้นเปิดให้ Validator สุ่มตรวจสอบเพียง $s$ ตัวอย่าง ($s=1000$) โดยใช้ค่าสุ่มที่สร้างจาก **ECVRF**

$$\text{Probability of Detection: } P(\text{detect}) = 1 - (1 - \mu)^s$$

- หาก Worker ทุจริตผลลัพธ์เพียง $\mu = 1\%$ ของงานทั้งหมด และกำหนด $s = 1000$ ตัวอย่าง:

$$P(\text{detect}) = 1 - (1 - 0.01)^{1000} \approx 99.995\% \quad (\ge 5\sigma \text{ Statistical Confidence})$$

- **ผลลัพธ์ประสิทธิภาพ**: ลดภาระงานของ Validator เหลือเพียง **1.2% ของพลังงาน Worker** (ประหยัดพลังงาน 83.3 เท่า) และลดเวลาตัดสินข้อพิพาทลงเหลือเพียง 4 บล็อก (~12 วินาที)

#### 3.2 การแก้ปัญหา Non-Deterministic Floating-Point บน GPU/NPU

ความแตกต่างของสถาปัตยกรรมฮาร์ดแวร์ GPU/CUDA ส่งผลให้ผลลัพธ์ Floating-Point ของโมเดล AI อาจต่างกันเล็กน้อยในระดับบิตท้าย (LSB) Nakharax แก้ไขปัญหานี้ผ่าน 3 กลไกผสานกัน:
1. **Deterministic Inference Kernels**: บังคับใช้เคอร์เนลการคำนวณมาตรฐานที่ปิดฟังก์ชันแบบสุ่ม
2. **$\varepsilon$-Bounded Metric Verification**: ตรวจสอบผลลัพธ์ด้วยระยะห่างของเวกเตอร์ (Cosine Distance หรือ $L_\infty$-norm) ให้อยู่ในขอบเขต $\varepsilon$ ที่ยอมรับได้
3. **Hardware TEE Remote Attestation**: รองรับ ARM TrustZone, AMD SEV และ Intel SGX เพื่อยืนยันว่าการประมวลผลเกิดขึ้นบนสภาพแวดล้อมที่ถูกต้องจริง

---

### 4. สถาปัตยกรรมความมั่นคงปลอดภัยไซเบอร์: DeAI 7-Sentinels & Prop Risk Shield

เครือข่าย Nakharax มีระบบป้องกันตนเองแบบอัตโนมัติ (Autonomous Cyber Resilience) โดยไม่พึ่งพาระบบรักษาความปลอดภัยแบบรวมศูนย์:

```
+-----------------------------------------------------------------------------------------+
|                                7 Autonomous Sentinels                                   |
+-----------------------------------------------------------------------------------------+
|  1. AION-VX      ──> ตรวจสอบลำดับเวลาและความเบี่ยงเบนของเวลาระดับ Microsecond (Time-Drift)|
|  2. SERAPH-VX    ──> ป้องกันการโจมตีเครือข่าย, ป้องกัน DDoS และตรวจจับการบุกรุก (Intrusion)|
|  3. ORION-VX     ──> ตรวจจับความผิดปกติทางสถิติและตรวจสอบหลักฐาน PoPC Compute Receipts   |
|  4. DIAOCHAN-VX  ──> คำนวณคะแนนความน่าเชื่อถือ Uptime/SLA และส่งค่าให้ระบบ ASR Routing  |
|  5. VULCAN-VX    ──> ตรวจสอบความถูกต้องของสเปกฮาร์ดแวร์และการแยก Sandbox                |
|  6. THEMIS-VX    ──> ตัดสินข้อพิพาทบนเชนและสั่งยึดเงินค้ำประกัน (Automated Slashing)     |
|  7. NOESIS-VX    ──> วิเคราะห์สถานะโครงข่ายภาพรวมและปรับแต่งพารามิเตอร์แบบกระจายศูนย์     |
+-----------------------------------------------------------------------------------------+
```

- **Prop Risk Shield Engine**: มีระบบตัดวงจรความเสี่ยงระดับสถาบัน (Sub-millisecond Kill-Switch) ด้วยความเร็ว **0.82 ms** (SLA < 1.0 ms)

---

### 5. แผนผังอุปกรณ์ฮาร์ดแวร์ (Hardware Generations: Monolith MK-II)

เพื่อรองรับทั้งโหนดตรวจสอบ (Validators) และโหนดประมวลผลระดับ Edge ทั่วโลก Nakharax ได้กำหนดมาตรฐานฮาร์ดแวร์รุ่น Monolith MK-II:

| รุ่นฮาร์ดแวร์ (Model) | สเปกหลัก (Hardware Architecture) | พลังประมวลผล / บทบาท | กลุ่มเป้าหมาย (Target) |
| --- | --- | --- | --- |
| **MK-II Scout+** | Orange Pi 5 Max / RPi 5 (8–32GB RAM) + Hailo-8/10H NPU (M.2) | **26–32 TOPS** (Int8) <br><br>รัน Batch LLM (8B) / VLM | Mass Adoption, Edge Worker (Tier 5) |
| **MK-II Vanguard** | Arduino VENTUNO Q (Qualcomm Hexagon 40 TOPS + STM32H5 MCU) | **40 TOPS + Real-time I/O** <br><br>Cyber-Physical Actuation | หุ่นยนต์, IoT และ Smart City Nodes |
| **MK-II Sentinel (Hydra)** | Intel Core i7/i9 หรือ AMD Ryzen Mini PC (12 Cores, 32GB RAM, 1TB NVMe) | **x86 High-Throughput** <br><br>Full Validator + Sentinel Node | Validator ประจำเครือข่าย, Tier 4 Metro Hub |
| **BYOD (Custom Grid)** | พีซีหรือเซิร์ฟเวอร์ใดๆ ที่มี NVIDIA CUDA, AMD ROCm หรือ Apple Silicon | **แปรผันตาม GPU** <br><br>รันงานผ่านสคริปต์ `join-nakharax.py` | นักขุด, Data Centers และผู้ใช้ทั่วไป |

---

### 6. ผลการทดสอบประสิทธิภาพเชิงประจักษ์ (Empirical Performance Benchmarks)

จากการทดสอบความเค้น (Stress Test) บนชุดโค้ดจริงในเดือนสิงหาคม 2026:

| ตัวชี้วัด (Evaluated Metric) | มาตรฐานผู้นำตลาด (World Benchmark) | ผลลัพธ์จริงของ Nakharax Protocol | บันทึกอ้างอิง / ประสิทธิภาพ |
| --- | --- | --- | --- |
| **RPC Ingress P50** | Infura / Alchemy: 45.0 ms | **1.92 ms** (DragonflyDB Hot-Cache) | ⚡ **เร็วกว่า Infura 23.4 เท่า** |
| **RPC Ingress P95** | QuickNode RPC: 120.0 ms | **2.36 ms** | ⚡ **เร็วกว่า QuickNode 50.8 เท่า** |
| **Throughput (5k Virtual Users)** | Aptos Host: 400.0 RPS | **914.5 req/sec** (Success 99.4%) | 💥 **สูงกว่า Aptos Host 2.28 เท่า** |
| **ความเร็วสร้างบล็อก (Block Time)** | Ethereum L1: ~15.0 วินาที | **2.8889 วินาที** (Target $\le 5.0$s) | ⏩ **เร็วกว่า Ethereum L1 5.19 เท่า** |
| **ต้นทุนประมวลผล (Cost Model)** | AWS / GCP Cloud ($1–$3/GPU-hr) | **ประหยัดกว่า 75% – 80%** | 💰 **คืนผลตอบแทนตรงสู่เจ้าของโหนด** |

---

### 7. โทเคโนมิกส์และการจัดสรรเหรียญ (Tokenomics & Economic Model)

#### 7.1 ข้อมูลพื้นฐานของเหรียญ $NAK

- **อุปทานรวม (Total Supply)**: 1,000,000,000,000 NAK (1 ล้านล้านเหรียญ — คงที่ไม่มีการเสกเพิ่ม)
- **การใช้งานหลัก (Utility)**:
  1. **Gas Fees**: ชำระค่าธรรมเนียมการทำธุรกรรมบนบล็อกเชน
  2. **Staking & Collateral**: Validator ต้องวางขั้นต่ำ 100,000 NAK; Worker วางเงินค้ำประกัน 10–20% ของมูลค่างาน
  3. **Compute Payment**: ชำระค่าประมวลผล AI/วิทยาศาสตร์แก่นักขุด
  4. **DAO Governance**: ออกเสียงกำหนดค่าพารามิเตอร์ของระบบและบริหารเงินคลัง

#### 7.2 สัดส่วนการจัดสรรเหรียญ (Token Allocation)

| หมวดหมู่ (Allocation) | สัดส่วน (%) | จำนวนเหรียญ (NAK) | เงื่อนไขการปลดล็อก (Vesting) |
| --- | --- | --- | --- |
| **Ecosystem Reserve & Staking** | 45% | 450,000,000,000 | สำหรับ Staking Rewards, Grants และพันธมิตร |
| **Team & Advisors** | 20% | 200,000,000,000 | ทยอยปลด 4 ปี (Lock 1 ปีแรก - Cliff) |
| **Early Investors (Seed Round)** | 10% | 100,000,000,000 | ทยอยปลด 2 ปี (Lock 6 เดือนแรก) |
| **Public Sale** | 10% | 100,000,000,000 | ปลดล็อกทันทีเมื่อเปิดตัว |
| **Foundation Treasury** | 8% | 80,000,000,000 | ทยอยปลด 3 ปี (รายไตรมาส) |
| **Community Airdrops & Testnet** | 5% | 50,000,000,000 | ทยอยแจกจ่ายตามกิจกรรม |
| **Liquidity Provision (DEX/CEX)** | 2% | 20,000,000,000 | ปลดล็อกทันทีเพื่อสภาพคล่องเริ่มต้น |

#### 7.3 กระแสการหมุนเวียนค่าธรรมเนียม (Fee Flow & Burn Mechanism)

```
ค่าจ้างประมวลผล (Compute Job Fee) = Base Price (PPC) + Protocol Fee (5%)
├── 95% ──> จ่ายตรงให้ Worker Node ตามคุณภาพงาน (Quality Multiplier)
└── 5%  ──> ส่งเข้า DAO Treasury
ค่าธรรมเนียมธุรกรรมบนเชน (Gas Fees):
├── 50% ──> เผาทำลายทิ้งถาวร (Deflationary Burn)
└── 50% ──> ส่งเข้า DAO Treasury สำหรับพัฒนาเครือข่าย
```

---

### 8. โทโปโลยีเครือข่ายและแผนการปล่อยตัว (Genesis Launch Plan)

- **โครงสร้างทดสอบ (5-Node Hybrid Quorum Mesh)**: เครือข่ายรันอยู่บนโหนดประสานงาน 5 โหนดทั่วโลก (1 Master Hub + 4 Satellites) ด้วยต้นทุนโครงสร้างพื้นฐานประหยัดเพียง **$23.44 ต่อเดือน**
- **กำหนดการ Genesis Public Testnet**: วันที่ **1 กันยายน 2026** (Chain ID: `86137`) พร้อมเปิด Faucet แจก $tNAK สำหรับนักพัฒนา

---

### 9. แผนผังการพัฒนา (Roadmap)

```
[Phase 1: Own-Your-Node (สำเร็จแล้ว)] 
 ├── Rust Core 18 Crates + libp2p Mesh
 ├── Testnet Chain ID 86137 + Nakharax OS Dashboard
 ├── Universal MCP Server Integration (@nakharax/mcp-server)
 └── Monolith MK-I / MK-II Edge NPU Integration

[Phase 2: Closed/Curated Marketplace (Q3–Q4 2026)]
 ├── ปล่อยตัวสัญญาอัจฉริยะ JobMarketplace.sol บน Testnet
 ├── การตรวจประเมินความปลอดภัยจากผู้ตรวจสอบภายนอก (External Audit)
 └── Mainnet Genesis Launch (Chain ID: 86150) & การเปิดตัวเหรียญ $NAK

[Phase 3: Open Global Grid & Multi-Region Federation (2027+)]
 ├── ตรวจสอบการประมวลผล Non-Deterministic เต็มรูปแบบด้วย PoPC + TEE
 ├── เชื่อมต่อโครงข่ายข้ามภูมิภาค (Multi-Region Federation)
 └── ฮาร์ดแวร์คำนวณยุคถัดไป (Monolith MK-III Photonic Proof-of-Light R&D)
```

---

### เอกสารอ้างอิง (Canonical References)

1. Nakharax Protocol Source Repository — [github.com/axionaxprotocol/nakharax](https://github.com/axionaxprotocol/nakharax)
2. Nakharax Reality Map & Disruption Matrix (`docs/100_DISRUPTION_INVENTORY_MASTER.md`)
3. Tokenomics & Governance Specification (`docs/architecture/TOKENOMICS.md`)
4. Cyber Defense Architecture via DeAI (`docs/CYBER_DEFENSE.md`)
5. Empirical Benchmark & Verification Report (`docs/EMPIRICAL_BENCHMARK_REPORT.md`)
