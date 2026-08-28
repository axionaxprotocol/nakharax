"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Minimize2,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { IconBadge } from "@/components/card";
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
    role: "Supreme Cognitive Core & Governance",
    description: "System-wide meta-analysis, parameter auto-tuning, and master protocol reasoning in Thai & English.",
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
    role: "Fraud Detection & PoPC ML",
    description: "Isolation Forest ML scanning for corrupted tensors and fake compute proofs.",
    icon: ShieldAlert,
    tone: "danger",
    greeting: "ORION-VX statistical audit subsystem online. Ready to analyze PoPC execution proofs, gradient anomalies, and worker honesty.",
  },
  "THEMIS-VX": {
    name: "THEMIS-VX",
    role: "Dispute Arbitrator",
    description: "Smart contract judicial system executing automated slashing penalties for Byzantine faults.",
    icon: Scale,
    tone: "warn",
    greeting: "THEMIS-VX judicial engine active. Ready to review slashing precedents, escrow disputes, and on-chain arbitration rules.",
  },
  "DIAOCHAN-VX": {
    name: "DIAOCHAN-VX",
    role: "Reputation Engine",
    description: "Evaluates node reliability, uptime metrics, and computes dynamic stake weightings.",
    icon: Sparkles,
    tone: "violet",
    greeting: "DIAOCHAN-VX reputation ledger synced. Monitoring node uptime metrics, task latencies, and trust score distributions.",
  },
};

const QUICK_PROMPTS = [
  { label: "⚡ PoPC Consensus", query: "กลไก PoPC v2.1 ทำงานอย่างไร แตกต่างจาก PoW / PoS อย่างไร?" },
  { label: "🖥️ GPU Worker", query: "การ์ดจอ GTX 1070 Ti ขุดและรัน DeAI บนบล็อกเชนได้อย่างไร มีระบบป้องกันไหม?" },
  { label: "🧬 LoRA Merging", query: "TIES-DARE Tensor Merging รวมสมอง AI ข้ามสายพันธุ์อย่างไร ไม่ให้ลืมความรู้เดิม?" },
  { label: "🛡️ Zero-MEV Shield", query: "SERAPH-VX ป้องกัน Sandwich Attack และ DDoS ใน Mempool อย่างไร?" },
  { label: "🪙 Tokenomics $tNAK", query: "โครงสร้างโทเคน $tNAK และกลไกเผาเหรียญ EIP-1559 เป็นอย่างไร?" },
];

export function FloatingSentinelChat() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<SentinelPersona>("NOESIS-VX");
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
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
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isTyping]);

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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Chat Modal Popup */}
      {isOpen && (
        <div className="mb-3.5 w-[460px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-white/20 bg-slate-950/95 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(41,240,106,0.2)] backdrop-blur-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="relative grid h-8 w-8 place-items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_10px_rgba(41,240,106,0.3)]">
                <PersonaIcon size={16} className="text-emerald-400" />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{currentProfile.name}</span>
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.2 text-[8.5px] font-mono text-emerald-300 font-bold">
                    DEEP-REASONING
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">{currentProfile.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <RotateCcw size={13} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Persona Switcher Strip */}
          <div className="flex items-center gap-1 overflow-x-auto bg-black/60 px-3 py-1.5 border-b border-white/5 shrink-0">
            {(Object.keys(SENTINEL_PROFILES) as SentinelPersona[]).map((p) => {
              const isSelected = selectedPersona === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPersona(p)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0 ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900/50 px-3 py-1.5 border-b border-white/5 shrink-0 scrollbar-none">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => void handleSend(q.query)}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] hover:bg-emerald-500/10 hover:border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-mono text-slate-300 hover:text-emerald-300 transition-all"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isExpanded = expandedThinking[msg.id] ?? false;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[9.5px]">
                    <span className={`font-bold ${isUser ? "text-cyan-400" : "text-emerald-400"}`}>
                      {isUser ? "You" : msg.persona}
                    </span>
                    <span className="text-slate-600">{msg.timestamp}</span>
                    {msg.latencyMs && (
                      <span className="text-violet-400">({msg.latencyMs}ms)</span>
                    )}
                    {msg.model && (
                      <span className="text-cyan-400 text-[9px]">[{msg.model}]</span>
                    )}
                  </div>

                  <div
                    className={`max-w-[92%] rounded-xl p-3 text-[11.5px] leading-relaxed ${
                      isUser
                        ? "bg-cyan-500/15 border border-cyan-500/30 text-white rounded-tr-none font-mono"
                        : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none font-sans"
                    }`}
                  >
                    {/* Chain of Thought / Thinking Collapsible Block */}
                    {!isUser && msg.thinking && (
                      <div className="mb-2.5 rounded-lg border border-purple-500/30 bg-purple-950/20 p-2 text-[10.5px] font-mono">
                        <button
                          type="button"
                          onClick={() => toggleThinking(msg.id)}
                          className="flex items-center justify-between w-full text-purple-300 font-bold hover:text-purple-200"
                        >
                          <span className="flex items-center gap-1">
                            <Brain size={12} className="text-purple-400" />
                            Deep Reasoning (Chain-of-Thought)
                          </span>
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        {isExpanded && (
                          <div className="mt-1.5 text-purple-200/90 whitespace-pre-wrap pl-3 border-l-2 border-purple-500/40 font-mono text-[10px] leading-relaxed">
                            {msg.thinking}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.proofHash && (
                      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                          <CheckCircle2 size={10} /> PoPC Proof
                        </span>
                        <span className="truncate max-w-[140px] text-slate-400">{msg.proofHash}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 pl-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{selectedPersona} is thinking deeply (DeepSeek-R1 CoT)...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex gap-2 p-2.5 bg-black/60 border-t border-white/10 shrink-0"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask ${selectedPersona} anything in Thai or English...`}
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-sans"
            />
            <button
              type="submit"
              disabled={isTyping || !inputQuery.trim()}
              className="flex items-center justify-center rounded-xl bg-emerald-500 px-3.5 py-2 text-black hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2.5 rounded-full border border-emerald-500/50 bg-black/90 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(41,240,106,0.3)] hover:scale-105 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(41,240,106,0.5)] transition-all duration-300 backdrop-blur-xl"
      >
        <span className="relative grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
          <Brain size={14} />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        </span>
        <span className="bg-gradient-to-r from-white via-slate-200 to-emerald-300 bg-clip-text text-transparent">
          {isOpen ? "Close Assistant" : "Ask NOESIS DeAI"}
        </span>
        {unreadCount > 0 && !isOpen && (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-black animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
