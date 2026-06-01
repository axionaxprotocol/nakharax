# 🌐 วงจรการทำงานของระบบนิเวศ Axionax Protocol (Ecosystem Lifecycle & Workflow)

ยินดีต้อนรับสู่คู่มือคำอธิบายโครงสร้างสถาปัตยกรรมเครือข่ายและวงจรการทำงานตั้งแต่ต้นจนจบ (End-to-End Workflow) ของ **Axionax Protocol** เอกสารนี้จัดทำขึ้นตามแนวทางปฏิบัติของระบบ Blockchain Layer 1 สำหรับ DeAI (Decentralized Artificial Intelligence)

---

## 1. 🔗 ตรวจสอบสถาปัตยกรรม P2P & Bootstrapping (การเข้าร่วมของโหนดใหม่)

เมื่อโหนดใหม่ทำการรันในระบบนิเวศของ Axionax ระบบจะใช้วิธี **Bootstrapping** ผ่าน [libp2p](https://libp2p.io/) ร่วมกับ **Kademlia DHT** โดยมีกลไกการค้นหาโหนดและเชื่อมต่อกันดังนี้:

1. **Bootstrap Node Entry**: โหนดใหม่ต้องการเพียงแค่ที่อยู่ของ **Bootstrap Node** อย่างน้อย 1 โหนด ซึ่งตั้งค่าไว้ในไฟล์คอนฟิก [protocol.testnet.yaml](file:///D:/axionax-monolith/services/core/core/configs/protocol.testnet.yaml) หรือผ่านตัวแปรสภาพแวดล้อม `AXIONAX_BOOTSTRAP_NODES` ในรูปแบบ Multiaddress (เช่น `/ip4/46.250.244.4/tcp/30303/p2p/12D3KooWQY...`)
2. **Kademlia DHT Lookup**: หลังจากต่อเข้ากับ Bootstrap Node สำเร็จ ฟังก์ชัน `swarm.behaviour_mut().kad.bootstrap()` ใน [manager.rs](file:///D:/axionax-monolith/services/core/core/core/network/src/manager.rs#L337-L343) จะถูกเรียกเพื่อสืบค้นข้อมูลตารางเส้นทาง (Routing Table) จาก Peer ที่เชื่อมต่อ
3. **Peer Discovery & Identify**: ระบบจะใช้โปรโตคอล `Identify` และ `mDNS` (สำหรับวง Local) ในการแลกเปลี่ยน Multiaddress และ Peer ID ของโหนดอื่นๆ ในเครือข่ายอัตโนมัติ ทำให้โหนดใหม่รู้จักและเชื่อมต่อกับเครือข่ายทั้งหมดได้เองโดยไม่ต้องระบุ IP ของโหนดอื่นๆ ในตอนแรก

> [!NOTE]
> ระบบของเราเป็นแบบ **Fully Decentralized P2P Overlay Network** โหนดใหม่จึงไม่ต้องลงทะเบียน IP ล่วงหน้า เพียงแค่ชี้ไปยัง Bootstrap Node เพื่อเข้าร่วมการ Sync บล็อกและการรับส่งข้อมูลธุรกรรมได้ทันที

---

## 2. 📊 แผนภาพวงจรการทำงานภาพรวม (Ecosystem End-to-End Flow)

แผนภาพด้านล่างจำลองกระบวนการตั้งแต่โหนดเปิดทำงาน, ผู้ใช้ส่งคำสั่งประมวลผลโมเดล AI, การเลือก Worker, การประมวลผลในระดับฮาร์ดแวร์ (HAL), ตลอดจนการทำ Consensus ด้วย PoPC (Proof-of-Probabilistic-Checking) และจบที่การเคลมรางวัลหรือการลงโทษ Slash

```mermaid
flowchart TD
    %% Nodes & Styling
    classDef infra fill:#1e1e2f,stroke:#6c5ce7,stroke-width:2px,color:#fff;
    classDef client fill:#2d3436,stroke:#0984e3,stroke-width:2px,color:#fff;
    classDef smartcontract fill:#2d3436,stroke:#00cec9,stroke-width:2px,color:#fff;
    classDef worker fill:#2d3436,stroke:#ffeaa7,stroke-width:2px,color:#d63031;
    classDef consensus fill:#2d3436,stroke:#2ecc71,stroke-width:2px,color:#fff;

    subgraph Network_Init ["1. โครงข่าย P2P & โครงสร้างพื้นฐาน"]
        B[Bootstrap Nodes / Validators]:::infra
        N[New Node / Validator]:::infra
        N -- 1. Dial Bootstrap --▶ B
        B -- 2. Kademlia DHT Exchange --▶ N
        N -- 3. Synced Block & Gossipsub --▶ B
    end

    subgraph Staking_Reg ["2. การลงทะเบียน Worker Node"]
        W[Worker Node]:::worker
        SC[JobMarketplace Contract]:::smartcontract
        AXX[AXX ERC20 Token]:::smartcontract
        
        W -- 4. Approve & Stake AXX --▶ AXX
        W -- 5. registerWorker --▶ SC
        SC -- 6. Store Stake & Set Active --▶ SC
    end

    subgraph Job_Lifecycle ["3. การสร้างงานและการจับคู่ (ASR)"]
        User[User / Client OS Dashboard]:::client
        Router[Auto-Selection Router - ASR]:::infra
        
        User -- 7. createJob + Pay AXX --▶ SC
        SC -- 8. Emit JobCreated event --▶ Router
        Router -- 9. Select Best Worker <br> VRF Weighted Match --▶ SC
        SC -- 10. assignJob to Worker --▶ SC
    end

    subgraph Execution ["4. การประมวลผล DeAI (Off-Chain Execution)"]
        DP[Python Worker Daemon]:::worker
        HAL[HAL: Silicon / NPU / Photonic]:::infra
        
        SC -- 11. Listen JobAssigned --▶ DP
        DP -- 12. Run Job Sandbox --▶ HAL
        HAL -- 13. Output Result & Merkle Root --▶ DP
        DP -- 14. submitResult to chain --▶ SC
    end

    subgraph Consensus_PoPC ["5. ตรวจสอบความถูกต้องและแจกจ่ายผลตอบแทน (PoPC Consensus)"]
        Val[Validator Node]:::infra
        
        SC -- 15. Challenge Window Triggered --▶ Val
        Val -- 16. ECVRF Deterministic Selection --▶ Val
        Val -- 17. Sample N Indices Challenge --▶ DP
        DP -- 18. Return Merkle Proofs --▶ Val
        
        Val -- 19. verify_sample_proofs --▶ Val
        
        alt Success (ผลลัพธ์ถูกต้อง)
            Val -- 20a. Verify Passed --▶ SC
            SC -- 21a. Release Reward to Worker <br> Return Deposit to User --▶ SC
            User -- 22a. Claim Result --▶ User
        else Fraud Detected (ทุจริต / ข้อมูลผิดพลาด)
            Val -- 20b. Fraud Flagged --▶ SC
            SC -- 21b. Slash Stake of Worker <br> Refund Submitter --▶ SC
        end
    end

    %% Apply Classes
    class B,N,Router,Val,HAL infra;
    class User client;
    class SC,AXX smartcontract;
    class W,DP worker;
```

---

## 3. 🚀 คำอธิบายการทำงานแบบเจาะลึกในแต่ละขั้นตอน (Step-by-Step Breakdown)

| ขั้นตอน | ส่วนที่เกี่ยวข้อง | คำอธิบายรายละเอียดกระบวนการทำงาน |
| :--- | :--- | :--- |
| **Step 1-3** | **P2P Peering** | โหนดใหม่ทำการรันและเชื่อมต่อไปยัง Bootstrap Node เพื่อดึงข้อมูลตารางเส้นทางผ่าน Kademlia DHT และเริ่มทำการ Synchronize บล็อกล่าสุด รวมถึงการเข้าสมัครรับข้อมูลข่าวสาร (Gossipsub) สำหรับ Blocks และ Transactions |
| **Step 4-6** | **Worker Registration** | ผู้ให้บริการประมวลผล (DeAI Worker) ฝากเหรียญค้ำประกันขั้นต่ำ (AXX Tokens) ใน Smart Contract `JobMarketplace` เพื่อแสดงความน่าเชื่อถือทางเศรษฐกิจ และระบุสเปคเครื่อง (GPU VRAM, CPU, NPU) เข้าระบบ |
| **Step 7-8** | **Job Creation** | ผู้ใช้สร้างงานประเภทประมวลผล AI (Inference, Training, Data Processing) ผ่านหน้าจอแดชบอร์ด โดยกำหนดค่าจ้าง (Reward) + เงินมัดจำ (Deposit 10%) และส่งคำสั่งเข้าระบบทำให้ Smart Contract ปล่อย Event `JobCreated` ออกมา |
| **Step 9-10** | **ASR Matching** | เครือข่ายใช้ระบบ **Auto-Selection Router (ASR)** ทำการคำนวณถ่วงน้ำหนักด้วยคะแนนชื่อเสียง (Reputation) และกำลังของฮาร์ดแวร์เพื่อเลือก Worker ที่เหมาะสมที่สุดในการจัดสรรงาน |
| **Step 11-14** | **Off-chain AI Compute** | Python Worker Daemon ตรวจพบงานที่ได้รับมอบหมาย จึงทำการดึงข้อมูลมาประมวลผลภายใน Sandbox โดยประสานงานกับ Hardware Abstraction Layer (HAL) เมื่อได้ผลลัพธ์แล้วจะทำการสร้าง Merkle Tree จากขั้นตอนประมวลผลทั้งหมดเพื่อทำเป็น Proof และส่ง `submitResult` กลับขึ้นบล็อกเชน |
| **Step 15-18** | **PoPC Challenge** | Validator ใช้ระบบ **Proof-of-Probabilistic-Checking (PoPC)** สุ่มท้าทายชุดข้อมูลแบบความน่าจะเป็นตามค่าความเชื่อมั่นที่กำหนด (Deterministic VRF Sampling) โดย Worker จะต้องส่ง Merkle Proof เฉพาะส่วนที่ถูกเลือกยืนยันกลับมา |
| **Step 19-22** | **Consensus Resolution** | ถ้าตรวจสอบผ่านทั้งหมด (All Proofs Valid) ระบบจะจ่ายผลตอบแทนแก่ Worker และส่งผลลัพธ์ให้ผู้ใช้งาน แต่หากพบการโกงหรือส่งคำตอบผิดพลาด Validator จะทำข้อตกลงริบเงินค้ำประกัน (Slash) ของ Worker สูงสุด 50% ทันที |

---

## 4. 🛠️ ตารางเทคโนโลยีที่สนับสนุนในแต่ละจุดของ Ecosystem

| มิติ (Dimension) | เทคโนโลยีที่ถูกใช้ (Technology Stack) | หน้าที่ในการทำงาน |
| :--- | :--- | :--- |
| **เครือข่ายบล็อกเชน** | Rust, libp2p, Kademlia DHT, Gossipsub | เชื่อมโยง Validator Node ทั้งหมดเป็นเครือข่ายแบบไร้ศูนย์กลาง (Decentralized Network) |
| **ความมั่นคงทางเศรษฐกิจ** | Solidity Smart Contracts, AXX ERC20, Hardhat | บริหารจัดการการวางค้ำประกัน (Staking), การทำข้อตกลงจ้างงาน และการลงโทษหักเงินค้ำประกัน (Slashing) |
| **การประสานงานประมวลผล** | Python Core Node API, WebOS (Next.js SDK) | ติดต่อสื่อสารแบบสองทางระหว่างโมดูลหน้าบ้าน (Web/Wallet) และหลังบ้าน (JSON-RPC) |
| **การประมวลผล AI & Edge** | Python Daemon, Docker Sandbox, HAILO NPU SDK | ควบคุมความปลอดภัยในการรันคำสั่งประมวลผลปัญญาประดิษฐ์และเรียกใช้ความสามารถของฮาร์ดแวร์ |
| **ชั้นความปลอดภัยทางคณิตศาสตร์** | ECVRF (Schnorrkel) & Merkle Trees | คำนวณแบบสุ่มและให้ค่าความน่าจะเป็นที่ทุจริตได้ยากยิ่ง (>99.99% Fraud Detection) |
