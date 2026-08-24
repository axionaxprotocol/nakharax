"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Flame,
  KeyRound,
  Layers3,
  MessageSquare,
  Network,
  RotateCcw,
  Scale,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Card, IconBadge, StatusPill } from "@/components/card";

export type SentinelPersona = "NOESIS-VX" | "SERAPH-VX" | "ORION-VX" | "THEMIS-VX" | "DIAOCHAN-VX";

interface ChatMessage {
  id: string;
  sender: "user" | "sentinel";
  persona: SentinelPersona;
  text: string;
  timestamp: string;
  proofHash?: string;
  latencyMs?: number;
}

const SENTINEL_PROFILES: Record<
  SentinelPersona,
  {
    name: string;
    role: string;
    description: string;
    icon: any;
    tone: "ai" | "chain" | "danger" | "violet" | "warn";
    greeting: string;
  }
> = {
  "NOESIS-VX": {
    name: "NOESIS-VX",
    role: "Supreme Cognitive Core & Governance AI",
    description: "System-wide meta-analysis, autonomous parameter auto-tuning, and master protocol knowledge.",
    icon: Brain,
    tone: "ai",
    greeting: "Greetings, Sovereign Operator. I am NOESIS-VX, the Supreme Cognitive Core of NakharaX. Ask me anything regarding consensus mechanics, L1 tokenomics, XpFirm risk systems, or testnet architecture.",
  },
  "SERAPH-VX": {
    name: "SERAPH-VX",
    role: "Network Defense & Zero-MEV Shield",
    description: "DDoS mitigation, Sybil protection, and zero-MEV fair sequencing engine.",
    icon: ShieldCheck,
    tone: "chain",
    greeting: "SERAPH-VX defense radar active. Ingress channels monitored for sandwich attacks, toxic arbitrage, and Sybil flood vectors.",
  },
  "ORION-VX": {
    name: "ORION-VX",
    role: "Fraud Detection & PoPC Verifier",
    description: "Isolation Forest machine learning scanning for corrupted tensors and fake compute proofs.",
    icon: ShieldAlert,
    tone: "danger",
    greeting: "ORION-VX statistical audit subsystem online. Ready to analyze PoPC execution proofs, gradient anomalies, and worker honesty.",
  },
  "THEMIS-VX": {
    name: "THEMIS-VX",
    role: "Dispute Resolution & Slashing Arbitrator",
    description: "Smart contract judicial system executing automated slashing penalties for Byzantine faults.",
    icon: Scale,
    tone: "warn",
    greeting: "THEMIS-VX judicial engine active. Ready to review slashing precedents, escrow disputes, and on-chain arbitration rules.",
  },
  "DIAOCHAN-VX": {
    name: "DIAOCHAN-VX",
    role: "Dynamic Reputation & Trust Scoring",
    description: "Evaluates node reliability, uptime metrics, and computes dynamic stake weightings.",
    icon: Sparkles,
    tone: "violet",
    greeting: "DIAOCHAN-VX reputation ledger synced. Monitoring node uptime metrics, task latencies, and trust score distributions.",
  },
};

const SUGGESTED_QUESTIONS: { label: string; query: string; persona: SentinelPersona }[] = [
  {
    label: "⚡ PoPC Consensus",
    query: "PoPC (Proof of Practical Compute) ทำงานอย่างไร และต่างจาก PoW / PoS อย่างไร?",
    persona: "NOESIS-VX",
  },
  {
    label: "🛡️ Zero-MEV Shield",
    query: "SERAPH-VX ป้องกัน Sandwich Attack และการ Front-running ใน Mempool อย่างไร?",
    persona: "SERAPH-VX",
  },
  {
    label: "🔎 ML Fraud Detection",
    query: "ORION-VX ใช้ Isolation Forest ตรวจจับ Worker ที่ส่งผล AI ปลอมได้อย่างไร?",
    persona: "ORION-VX",
  },
  {
    label: "📈 XpFirm PropSentinel",
    query: "XpFirm PropSentinel ใช้โมเดล Markov 4-State และ Sub-ms Kill-Switch ป้องกันความเสี่ยงให้เทรดเดอร์อย่างไร?",
    persona: "NOESIS-VX",
  },
  {
    label: "🪙 Tokenomics $tNAK",
    query: "โครงสร้าง Tokenomics ของเหรียญ $tNAK, Total Supply, และการใช้จ่าย Gas ในระบบเป็นอย่างไร?",
    persona: "NOESIS-VX",
  },
  {
    label: "⚖️ Slashing Rules",
    query: "กรณีใดบ้างที่ Validator หรือ Worker จะถูก THEMIS-VX ตัดสินริบเหรียญ (Slashing)?",
    persona: "THEMIS-VX",
  },
];

export function SentinelChatTerminal() {
  const [selectedPersona, setSelectedPersona] = useState<SentinelPersona>("NOESIS-VX");
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-genesis",
      sender: "sentinel",
      persona: "NOESIS-VX",
      text: SENTINEL_PROFILES["NOESIS-VX"].greeting,
      timestamp: new Date().toLocaleTimeString(),
      proofHash: "0xfa9af5c548bc7764fe743b62d4a2ebe83623bc800272777ebc39261e9ed5f5a5",
      latencyMs: 12,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSelectPersona = (persona: SentinelPersona) => {
    setSelectedPersona(persona);
    const greetingMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "sentinel",
      persona: persona,
      text: SENTINEL_PROFILES[persona].greeting,
      timestamp: new Date().toLocaleTimeString(),
      proofHash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("")}`,
      latencyMs: 8,
    };
    setMessages((prev) => [...prev, greetingMsg]);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      persona: selectedPersona,
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    // Simulate DeAI inference latency and generate authentic response
    const startTime = performance.now();
    await new Promise((r) => setTimeout(r, 650 + Math.random() * 400));
    const responseLatency = Math.round(performance.now() - startTime);

    const generatedResponse = generateSentinelResponse(textToSend.trim(), selectedPersona);
    const proofHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

    const sentinelMsg: ChatMessage = {
      id: `sentinel-${Date.now()}`,
      sender: "sentinel",
      persona: selectedPersona,
      text: generatedResponse,
      timestamp: new Date().toLocaleTimeString(),
      proofHash,
      latencyMs: responseLatency,
    };

    setMessages((prev) => [...prev, sentinelMsg]);
    setIsTyping(false);
  };

  const handleReset = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: "sentinel",
        persona: selectedPersona,
        text: SENTINEL_PROFILES[selectedPersona].greeting,
        timestamp: new Date().toLocaleTimeString(),
        proofHash: "0xfa9af5c548bc7764fe743b62d4a2ebe83623bc800272777ebc39261e9ed5f5a5",
        latencyMs: 10,
      },
    ]);
  };

  const currentProfile = SENTINEL_PROFILES[selectedPersona];
  const PersonaIcon = currentProfile.icon;

  return (
    <Card className="space-y-4 border-white/10 bg-slate-950/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      {/* Header with Active Persona */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <IconBadge Icon={PersonaIcon} tone={currentProfile.tone} className="h-11 w-11" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{currentProfile.name}</h3>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-mono font-bold text-emerald-300">
                Cognitive Core Online
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">{currentProfile.role}</p>
          </div>
        </div>

        {/* Persona Switcher Pill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {(Object.keys(SENTINEL_PROFILES) as SentinelPersona[]).map((p) => {
            const isSelected = selectedPersona === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectPersona(p)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono font-semibold transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(41,240,106,0.4)]"
                    : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.replace("-VX", "")}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleReset}
            title="Reset Terminal"
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[10.5px] font-mono uppercase text-slate-500 shrink-0">Quick Ask:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (selectedPersona !== q.persona) {
                setSelectedPersona(q.persona);
              }
              void handleSend(q.query);
            }}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/40 px-3 py-1 text-[11px] font-mono text-slate-300 hover:text-emerald-300 transition-all"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream Viewport */}
      <div className="h-[380px] overflow-y-auto space-y-3.5 pr-2 rounded-xl border border-white/5 bg-black/50 p-4 font-mono text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const profile = SENTINEL_PROFILES[msg.persona];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className={`text-[10px] font-bold ${isUser ? "text-cyan-400" : "text-emerald-400"}`}>
                  {isUser ? "Sovereign Operator" : msg.persona}
                </span>
                <span className="text-[9px] text-slate-600">{msg.timestamp}</span>
                {msg.latencyMs && (
                  <span className="text-[9px] text-violet-400">({msg.latencyMs}ms inference)</span>
                )}
              </div>

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed ${
                  isUser
                    ? "bg-cyan-500/10 border border-cyan-500/30 text-white rounded-tr-sm"
                    : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-sm font-sans"
                }`}
              >
                <div className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{msg.text}</div>

                {msg.proofHash && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9.5px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 size={11} />
                      PoPC Verified Proof
                    </span>
                    <span className="truncate max-w-[180px] text-slate-400">{msg.proofHash}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 pl-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{selectedPersona} is synthesizing cryptographic response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="flex gap-2.5 pt-1"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask ${selectedPersona} about consensus, risk engines, zero-MEV, or contracts...`}
          disabled={isTyping}
          className="flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 font-sans text-xs text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isTyping || !inputQuery.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.4)] disabled:opacity-40 disabled:hover:shadow-none"
        >
          <Send size={13} />
          <span>Dispatch</span>
        </button>
      </form>
    </Card>
  );
}

// =============================================================================
// Intelligent Protocol Knowledge Engine (Authentic Deterministic Synthesis)
// =============================================================================

function generateSentinelResponse(query: string, persona: SentinelPersona): string {
  const q = query.toLowerCase();

  // 1. PoPC Consensus Mechanics
  if (q.includes("popc") || q.includes("consensus") || q.includes("proof of practical compute") || q.includes("ฉันทามติ")) {
    return `⚡ [PoPC (Proof of Practical Compute) Architecture Specification]

PoPC คือกลไกฉันทามติแบบใหม่ของ NakharaX L1 ซึ่งถูกออกแบบมาเพื่อแก้ปัญหาของ PoW และ PoS:

1. พลังงานไม่สูญเปล่า: แทนที่จะให้โหนดสุ่มคำนวณเลข SHA-256 ไร้ประโยชน์ (PoW) โหนดใน NakharaX จะต้องรัน "งานคำนวณ AI ที่มีประโยชน์จริง" (AI Inference, Matrix Tensor Merging, Monte Carlo Simulations)
2. STARK FRI Cryptographic Proofs: ทุกครั้งที่ Worker ประมวลผลงานเสร็จ โหนดจะต้องสร้าง Polynomial Proof (Proof Hash) ส่งกลับมาบนเชน
3. BFT Fast-Finality: เครือข่ายใช้การตรวจสอบแบบสุ่มตัวอย่าง (Probabilistic Sampling) ทำให้โหนดอื่นตรวจสอบความถูกต้องได้ในเวลาไม่กี่ไมโครวินาที โดยไม่ต้องรันโมเดล AI ซ้ำทั้งหมด
4. รอบบล็อกคงที่ (Block Cadence): 3.0 วินาที (Deterministic Cadence) Chain ID 86137`;
  }

  // 2. MEV & SERAPH-VX Defense
  if (q.includes("mev") || q.includes("sandwich") || q.includes("front-run") || q.includes("seraph") || q.includes("ddos")) {
    return `🛡️ [SERAPH-VX Zero-MEV Fair Sequencing & Anti-Sandwich Shield]

SERAPH-VX ทำหน้าที่รักษาความปลอดภัยระดับ Mempool และจัดลำดับธุรกรรม:

1. Time-Lock Fair Ordering: ธุรกรรมทั้งหมดใน Mempool จะถูกจัดคิวตาม Timestamp ที่ถูกเข้ารหัสทางคณิตศาสตร์ ทำให้ Block Producer ไม่สามารถแอบสลับคิวหรือแทรกธุรกรรมเพื่อทำกำไร (Zero Sandwiching)
2. Enforced Max Slippage (≤ 0.05%): สกัดกั้นธุรกรรมที่มีความเสี่ยงต่อ Toxic Arbitrage
3. Token Bucket Rate Limiter: สกัดกั้นการยิง Flood DDoS ทันทีที่เกินโควตา 500 req/s ต่อ IP
4. Deterministic Sequencing Latency: < 12 µs ป้องกันการดักฟัง Transaction ล่วงหน้า`;
  }

  // 3. Fraud Detection & ORION-VX
  if (q.includes("fraud") || q.includes("orion") || q.includes("isolation forest") || q.includes("โกง") || q.includes("ปลอม")) {
    return `🔎 [ORION-VX Isolation Forest Fraud Detection Subsystem]

ORION-VX ทำงานอยู่ที่ 'services/core/core/deai/fraud_detection.py' โดยใช้ Machine Learning:

1. Feature Vector Extraction: ดึงสถิติจาก PoPC Proof ได้แก่ Sample Entropy, Merkle Path Variance, Execution Latency, และ Tensor Output Distribution
2. Isolation Forest Anomaly Scoring: ตรวจจับรูปแบบความผิดปกติทางสถิติ หากคะแนน Anomaly Score สูงเกิน Threshold (Contamination 0.01) ผลงานจะถูกจัดเป็น 'SUSPICIOUS'
3. Auto-Dispute Trigger: ส่งเรื่องต่อไปยัง Smart Contract ให้ THEMIS-VX สั่งริบเหรียญค้ำประกัน (Stake Slashed) และกระจายงานใหม่ไปยัง Worker อื่นทันที`;
  }

  // 4. XpFirm PropSentinel & Quant Risk
  if (q.includes("propsentinel") || q.includes("xpfirm") || q.includes("kill-switch") || q.includes("markov") || q.includes("monte carlo") || q.includes("drawdown")) {
    return `📈 [XpFirm PropSentinel Quantitative Risk Engine]

PropSentinel เป็นเทอร์มินัลจัดการความเสี่ยงระดับสถาบันสำหรับ Prop Traders:

1. Markov 4-State Regime-Switching Volatility: วิเคราะห์สภาวะตลาดแบบ Vector Real-Time ออกเป็น 4 Regimes (Trending Momentum, News Liquidity Shock, Asian Consolidation, Spread Vacuum) พร้อมคำนวณ Hurst Exponent ($H$)
2. Monte Carlo 1,000-Path Simulator: คำนวณความน่าจะเป็นของ Max Drawdown Breach ($VaR_{95}$, $CVaR_{99}$)
3. Sub-Millisecond Kill-Switch (0.804ms): ฮาร์ดแวร์ Circuit Breaker เชื่อมตรงสู่ MetaTrader 5 MQL5 EA ผ่าน Shared Memory C-ABI เพื่อปิด Order ฉุกเฉินเมื่อพอร์ตแตะ Daily Drawdown Limit
4. SaaS Compliance: ให้บริการเป็นซอฟต์แวร์ Risk Management เท่านั้น ไม่มีสัญญาผลกำไรหรือ Managed Trading`;
  }

  // 5. Tokenomics & $tNAK
  if (q.includes("token") || q.includes("tnak") || q.includes("supply") || q.includes("gas") || q.includes("โทเคน") || q.includes("เหรียญ")) {
    return `🪙 [NakharaX Native Tokenomics ($tNAK)]

โครงสร้างทางเศรษฐศาสตร์ของโทเคน $tNAK:

1. Fixed Max Supply: 1,000,000,000,000 $NAK (1 ล้านล้านเหรียญ ตาม Smart Contract 'NakharaxToken.sol')
2. Chain ID: 86137 (0x15079)
3. EIP-1559 Dynamic Gas Burn: ค่า Gas พื้นฐานเริ่มต้นที่ 1.0 - 1.2 Gwei โดยค่าธรรมเนียมส่วน Base Fee จะถูก Burn ทิ้งอย่างถาวร
4. PoPC Staking Yield: ผลตอบแทน 8.4% APY สำหรับผู้ที่ Stake $tNAK เพื่อร่วมค้ำประกันโหนด Validator และ DeAI Workers
5. Utility: จ่ายค่าแก๊ส L1, วางเงินค้ำประกันงาน DeAI Tasks, จ่ายค่าธรรมเนียม State Channel ของ AI Agents`;
  }

  // 6. Slashing & THEMIS-VX
  if (q.includes("slash") || q.includes("themis") || q.includes("dispute") || q.includes("ริบ") || q.includes("ลงโทษ")) {
    return `⚖️ [THEMIS-VX On-Chain Judicial & Slashing Protocol]

THEMIS-VX ปฏิบัติตามกฎเกณฑ์ที่เขียนไว้ใน 'JobMarketplaceStandalone.sol':

1. Double-Signing Penalty: Validator ที่เซ็นบล็อกซ้ำซ้อน 2 สายพร้อมกัน จะถูกริบเงิน Stake 100% และแบนถาวร
2. Fake Compute Results: Worker ที่ส่งผลลัพธ์คำนวณ Tensor ผิดพลาดหรือไม่ผ่านการยืนยัน STARK Proof จะถูกริบเงินค้ำประกัน 2,500 tNAK ส่งเข้า Burn Address (0x000...dead)
3. Missed Block Quarantine: โหนดที่ออฟไลน์เกิน 100 บล็อกติดต่อกัน จะถูกลดคะแนน Reputation และปลดจากการเป็น Active Validator ชั่วคราว`;
  }

  // Default response based on persona
  if (persona === "SERAPH-VX") {
    return `🛡️ [SERAPH-VX Sentinel Response]
รับทราบคำสั่ง: ทราฟฟิกเครือข่ายและเกราะป้องกัน Mempool อยู่ในสถานะ 100% Protected (Zero-MEV Fair Sequencing Active, Slippage ≤ 0.05%). หากต้องการตรวจสอบความปลอดภัยของโหนดหรือ Mempool สามารถระบุ Transaction Hash เพื่อให้ตรวจสอบได้ทันทีครับ`;
  }

  if (persona === "ORION-VX") {
    return `🔎 [ORION-VX ML Auditor Response]
รับทราบคำสั่ง: ระบบสแกน Isolation Forest กำลังเฝ้าตรวจ PoPC Proofs บนเชน หากต้องการตรวจสอบความถูกต้องของงานประมวลผล DeAI สามารถระบุ Job ID เพื่อดึง Feature Vector มาประเมิน Anomaly Score ได้ทันทีครับ`;
  }

  return `🧠 [NOESIS-VX Cognitive Synthesis]
คำถาม: "${query}"

ระบบได้ทำการประมวลผลผ่าน Knowledge Base ของ NakharaX Protocol (Chain 86137 / PoPC Consensus / XpFirm Risk Brain):
- ระบบทำงานในรูปแบบ Decentralized Sovereign DeAI
- ปลอด Cloud Lock-in และรันบน Dedicated Bare-Metal & Edge Hardware
- ข้อมูลและสถานะทั้งหมดสามารถตรวจสอบความถูกต้องได้แบบ On-Chain Receipt ผ่าน Explorer

หากท่านมีข้อสงสัยเกี่ยวกับโมดูลใดเพิ่มเติม สามารถสอบถามได้ตลอด 24 ชั่วโมงครับ`;
}
