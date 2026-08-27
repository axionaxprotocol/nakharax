# 🌐 ผังการเชื่อมโยงเครือข่าย 7 โหนด Nakharax Protocol
### Hybrid Architecture: 5 VPS Cloud Backbone + 2 Local PC Heavy Nodes

**Target Network:** NakharaX Layer-1 Public Testnet (Chain ID: `86137`) & Mainnet Target (`86150`)  
**Target Launch Date:** 1 September 2026  
**Topology Type:** Hybrid Sovereign Quorum Mesh (5 Cloud Backbones + 2 Local High-Throughput Rigs)  

---

## 1. การแบ่งบทบาทของทั้ง 7 โหนด (Role Distribution Architecture)

```text
                       [ INTERNET / PUBLIC ACCESS ]
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
   │     VPS-1     │         │     VPS-2     │         │     VPS-3     │
   │  Public RPC   │         │  P2P Bootnode │         │   Meta-MCP    │
   │ & Explorer API│         │ & Relay Mesh  │         │ Search Server │
   └───────┬───────┘         └───────┬───────┘         └───────┬───────┘
           │                         │                         │
           └─────────────────────────┼─────────────────────────┘
                                     │
                         [ P2P GOSSIPSUB MESH ]
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
   │     VPS-4     │         │     VPS-5     │         │     PC-1      │
   │ Validator #1  │         │ Validator #2  │         │ Validator #3  │
   │  (Cloud AU)   │         │  (Cloud ES)   │         │ (Home Lab DEV)│
   └───────────────┘         └───────────────┘         └───────┬───────┘
                                                               │
                                                     [ Local High-Speed LAN ]
                                                               │
                                                               ▼
                                                       ┌───────────────┐
                                                       │     PC-2      │
                                                       │  DeAI Worker  │
                                                       │  (Qwen Flash) │
                                                       └───────────────┘
```

---

## 2. รายละเอียดสเปกและหน้าที่ของแต่ละเครื่อง (Node Specifications & Firewall Matrix)

| โหนด (Node) | ประเภท (Type) | บทบาทหน้าที่ (Primary Operational Role) | การเปิดพอร์ตที่จำเป็น (Firewall Rules) |
| :--- | :--- | :--- | :--- |
| **VPS-1** | **Cloud** | **Public JSON-RPC & Explorer:** จุดเชื่อมต่อ MetaMask, Web OS Dashboard, และ dApps สาธารณะ | `8545/tcp` (RPC/HTTP), `8546/tcp` (WS), `9000/tcp+udp` (P2P), `80,443/tcp` (TLS) |
| **VPS-2** | **Cloud** | **P2P Primary Bootnode:** โหนดกระจายพิกัด Peers ผ่าน Kademlia DHT และ Relay Mesh ทั่วโลก | `9000/tcp+udp` (libp2p Swarm & QUIC Discovery) |
| **VPS-3** | **Cloud** | **Meta-MCP Search Hub:** รันฐานข้อมูล Vector สำหรับ AI Agents เข้ามาค้นหา Dynamic Tools | `8000/tcp` (MCP Gateway API), `9000/tcp+udp` (P2P) |
| **VPS-4** | **Cloud** | **Consensus Validator #1 (Cloud AU):** ยืนยันบล็อกและรันฉันทามติ PoPC 24/7 (เซิร์ฟเวอร์ต่างประเทศ) | `9000/tcp+udp` (P2P Mesh เท่านั้น — ปิด RPC สู่สาธารณะ) |
| **VPS-5** | **Cloud** | **Consensus Validator #2 (Cloud ES):** รัน Validator สำรองเพื่อป้องกันการ Fork และให้ได้ $\ge 2/3$ Quorum | `9000/tcp+udp` (P2P Mesh เท่านั้น — ปิด RPC สู่สาธารณะ) |
| **PC-1** | **Local** | **Local Validator #3 & Core Dev (Home Lab):** ใช้ทดสอบโค้ด, อัปเกรด Rust Core และมอนิเตอร์เครือข่าย | `9000/tcp+udp` (P2P เชื่อมต่อออกไปยัง Bootnode) |
| **PC-2** | **Local** | **Heavy DeAI Worker Node (Home Lab):** รัน Qwen 3.8-Flash-Next / PyTorch บน GPU/NPU รับงาน Batch หนักๆ | **ไม่ต้องเปิดพอร์ตขาเข้า** (Outbound Job Polling ผ่าน RPC/WS) |

---

## 3. กลยุทธ์ความปลอดภัยและความทนทานต่อความผิดพลาด (Security & Fault Tolerance)

1. **Byzantine Fault Tolerance ($\ge 2/3$ BFT Quorum):**
   - มี Validator 3 โหนดหลัก (VPS-4, VPS-5, PC-1)
   - หากโหนดใดโหนดหนึ่งขัดข้อง เครือข่ายยังสามารถผลิตบล็อกและบรรลุฉันทามติได้อย่างต่อเนื่อง

2. **Isolation of Heavy AI Compute (การแยกส่วนประมวลผลหนัก):**
   - งาน AI Inference หนักๆ (Qwen 3.8-Flash / DeepSeek / PyTorch) ถูกส่งไปรันที่ **PC-2** โดยเฉพาะ
   - ตัวเครื่อง PC-2 ไม่ต้องเปิดพอร์ต Inbound ใดๆ สู่สาธารณะ (ทำงานผ่าน Polling Outbound) เพื่อความปลอดภัยสูงสุดจากการถูกโจมตีทางไซเบอร์

3. **Public Gateway Shielding:**
   - ผู้ใช้งานภายนอกและ MetaMask จะติดต่อผ่าน **VPS-1 (RPC & Dashboard)** และ **VPS-3 (MCP Hub)** เท่านั้น
   - Validator Nodes (VPS-4, VPS-5) จะสื่อสารผ่านโครงข่าย P2P Mesh แบบปิด ช่วยป้องกันการโจมตีแบบ DDoS ไปยังโหนดฉันทามติโดยตรง
