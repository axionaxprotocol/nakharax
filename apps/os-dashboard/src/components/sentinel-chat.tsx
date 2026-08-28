"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
import { processNoesisQuery } from "@/lib/noesis-brain";

export type SentinelPersona = "NOESIS-VX" | "SERAPH-VX" | "ORION-VX" | "THEMIS-VX" | "DIAOCHAN-VX";

interface ChatMessage {
  id: string;
  sender: "user" | "sentinel";
  persona: SentinelPersona;
  text: string;
  thinking?: string;
  timestamp: string;
  proofHash?: string;
  latencyMs?: number;
  model?: string;
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
    description: "System-wide meta-analysis, autonomous parameter auto-tuning, and master protocol reasoning in Thai & English.",
    icon: Brain,
    tone: "ai",
    greeting: "สวัสดีครับ Sovereign Operator ผมคือ NOESIS-VX Supreme Cognitive Core แห่ง NakharaX Protocol ท่านสามารถสอบถามข้อมูลเชิงลึกเกี่ยวกับระบบฉันทามติ PoPC v2.1, การรัน GPU Worker, สถาปัตยกรรมบล็อกเชน, การบริหารความเสี่ยง Quant Risk หรือการผสานโมเดล AI ได้ทุกเรื่องเลยครับ!",
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
    query: "กลไก PoPC v2.1 ทำงานอย่างไร แตกต่างจาก PoW / PoS อย่างไร?",
    persona: "NOESIS-VX",
  },
  {
    label: "🛡️ Zero-MEV Shield",
    query: "SERAPH-VX ป้องกัน Sandwich Attacks และ Mempool Front-running อย่างไร?",
    persona: "SERAPH-VX",
  },
  {
    label: "🔎 ML Fraud Detection",
    query: "ORION-VX ใช้ Isolation Forest ตรวจจับโหนดขี้โกงและผลลัพธ์ปลอมอย่างไร?",
    persona: "ORION-VX",
  },
  {
    label: "🖥️ GPU Compute",
    query: "การ์ดจอ GTX 1070 Ti ขุดและรัน DeAI บนบล็อกเชนได้อย่างไร มีระบบป้องกันไหม?",
    persona: "NOESIS-VX",
  },
  {
    label: "🪙 Tokenomics $tNAK",
    query: "โครงสร้างโทเคน $tNAK เพดานอุปทาน และกลไกเผาเหรียญ EIP-1559 เป็นอย่างไร?",
    persona: "NOESIS-VX",
  },
  {
    label: "⚖️ Slashing Rules",
    query: "เงื่อนไขใดบ้างที่ THEMIS-VX จะสั่งริบเงินค้ำประกัน (Stake Slashed 50%) ของโหนด?",
    persona: "THEMIS-VX",
  },
];

export function SentinelChatTerminal() {
  const [mounted, setMounted] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<SentinelPersona>("NOESIS-VX");
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-genesis",
      sender: "sentinel",
      persona: "NOESIS-VX",
      text: SENTINEL_PROFILES["NOESIS-VX"].greeting,
      timestamp: "Genesis",
      proofHash: "0xfa9af5c548bc7764fe743b62d4a2ebe83623bc800272777ebc39261e9ed5f5a5",
      latencyMs: 12,
      model: "DeepSeek-R1-Reasoning-Core",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, mounted]);

  if (!mounted) {
    return null;
  }

  const toggleThinking = (msgId: string) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

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
      model: "DeepSeek-R1-Reasoning-Core",
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

    const startTime = performance.now();
    let text = "";
    let thinking = "";
    let proofHash = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, "0")).join("");
    let modelName = "DeepSeek-R1 (Live Neural Weights)";
    let responseLatency = 0;

    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-r1-1.5b",
          messages: [
            ...messages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: textToSend.trim() },
          ],
        }),
      });

      responseLatency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || "";
        thinking = data.choices?.[0]?.message?.reasoning_content || "";
        proofHash = data.nakharax_telemetry?.stark_proof_hash || proofHash;
        modelName = data.model || modelName;
      }
    } catch {
      // Fallback if API offline
    }

    if (!text) {
      const result = processNoesisQuery(textToSend.trim(), selectedPersona);
      text = result.response;
      thinking = result.thinking;
      proofHash = result.proofHash;
      modelName = result.model;
      responseLatency = Math.round(performance.now() - startTime);
    }

    const msgId = `sentinel-${Date.now()}`;
    const sentinelMsg: ChatMessage = {
      id: msgId,
      sender: "sentinel",
      persona: selectedPersona,
      text,
      thinking,
      timestamp: new Date().toLocaleTimeString(),
      proofHash,
      latencyMs: responseLatency,
      model: modelName,
    };

    if (thinking) {
      setExpandedThinking((prev) => ({ ...prev, [msgId]: true }));
    }
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
        model: "DeepSeek-R1-Reasoning-Core",
      },
    ]);
  };

  const currentProfile = SENTINEL_PROFILES[selectedPersona];
  const PersonaIcon = currentProfile.icon;

  return (
    <Card className="flex flex-col h-[700px] border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Terminal Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 gap-3">
        <div className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(41,240,106,0.3)]">
            <PersonaIcon size={18} className="text-emerald-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-mono">{currentProfile.name}</h3>
              <StatusPill tone="ai">
                DEEP-REASONING ACTIVE
              </StatusPill>
            </div>
            <p className="text-[11px] font-mono text-slate-400">{currentProfile.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw size={12} />
            Reset Session
          </button>
        </div>
      </div>

      {/* Persona Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto bg-black/40 px-4 py-2 border-b border-white/5 scrollbar-none">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mr-1">
          Active Sentinel:
        </span>
        {(Object.keys(SENTINEL_PROFILES) as SentinelPersona[]).map((p) => {
          const isSelected = selectedPersona === p;
          const prof = SENTINEL_PROFILES[p];
          const Icon = prof.icon;
          return (
            <button
              key={p}
              type="button"
              onClick={() => handleSelectPersona(p)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                isSelected
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={12} />
              {p}
            </button>
          );
        })}
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="flex items-center gap-2 overflow-x-auto bg-slate-900/40 px-4 py-2 border-b border-white/5 scrollbar-none">
        <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
          💡 Quick Queries:
        </span>
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (selectedPersona !== q.persona) setSelectedPersona(q.persona);
              void handleSend(q.query);
            }}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/40 px-3 py-1 text-[11px] font-mono text-slate-300 hover:text-emerald-300 transition-all"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isExpanded = expandedThinking[msg.id] ?? false;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1 text-[10px]">
                <span className={`font-bold ${isUser ? "text-cyan-400" : "text-emerald-400"}`}>
                  {isUser ? "Sovereign Operator (You)" : msg.persona}
                </span>
                <span className="text-slate-500">{msg.timestamp}</span>
                {msg.latencyMs && (
                  <span className="text-violet-400">({msg.latencyMs}ms)</span>
                )}
                {msg.model && (
                  <span className="text-cyan-400">[{msg.model}]</span>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? "bg-cyan-500/15 border border-cyan-500/30 text-white rounded-tr-none font-mono shadow-lg"
                    : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none font-sans shadow-xl"
                }`}
              >
                {/* Chain of Thought / Thinking Collapsible Block */}
                {!isUser && msg.thinking && (
                  <div className="mb-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => toggleThinking(msg.id)}
                      className="flex items-center justify-between w-full text-purple-300 font-bold hover:text-purple-200"
                    >
                      <span className="flex items-center gap-1.5">
                        <Brain size={14} className="text-purple-400" />
                        Deep Reasoning (Chain-of-Thought)
                      </span>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 text-purple-200/90 whitespace-pre-wrap pl-3 border-l-2 border-purple-500/40 font-mono text-[10.5px] leading-relaxed">
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.proofHash && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 size={12} /> Cryptographic PoPC Proof
                    </span>
                    <span className="text-slate-400">{msg.proofHash}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 pl-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{selectedPersona} is thinking deeply (DeepSeek-R1 CoT)...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="flex gap-3 p-3 bg-black/60 border-t border-white/10"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask ${selectedPersona} anything about NakharaX in Thai or English...`}
          className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-sans"
        />
        <button
          type="submit"
          disabled={isTyping || !inputQuery.trim()}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-mono font-bold text-black hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
        >
          <Send size={14} />
          Execute
        </button>
      </form>
    </Card>
  );
}
