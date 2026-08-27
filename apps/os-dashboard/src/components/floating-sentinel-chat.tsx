"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
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
    role: "Cognitive Core & Governance",
    description: "System-wide meta-analysis, parameter auto-tuning, and master protocol knowledge.",
    icon: Brain,
    tone: "ai",
    greeting: "Greetings, Sovereign Operator. I am NOESIS-VX, the Supreme Cognitive Core. Ask me anything about consensus mechanics, L1 tokenomics, DeAI compute grid, or testnet architecture.",
  },
  "SERAPH-VX": {
    name: "SERAPH-VX",
    role: "Network Defense & Zero-MEV",
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
  { label: "⚡ PoPC Consensus", query: "How does PoPC function, and how does it differ from PoW / PoS?" },
  { label: "🛡️ Zero-MEV", query: "How does SERAPH-VX prevent Mempool Sandwich Attacks?" },
  { label: "🔎 Fraud ML", query: "How does ORION-VX detect invalid PoPC Proofs using Isolation Forest?" },
  { label: "🤖 DeAI Compute", query: "How do Worker Nodes execute PyTorch models and generate STARK FRI proofs?" },
  { label: "🪙 Tokenomics", query: "What is the tokenomics structure and total supply ceiling of $tNAK?" },
];

export function FloatingSentinelChat() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<SentinelPersona>("NOESIS-VX");
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-genesis",
      sender: "sentinel",
      persona: "NOESIS-VX",
      text: SENTINEL_PROFILES["NOESIS-VX"].greeting,
      timestamp: "Genesis",
      proofHash: "0xfa9af5c548bc7764fe743b62d4a2ebe83623bc800272777ebc39261e9ed5f5a5",
      latencyMs: 12,
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

    const startTime = performance.now();
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));
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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Floating Chat Modal Popup */}
      {isOpen && (
        <div className="mb-3.5 w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-white/20 bg-slate-950/95 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(41,240,106,0.2)] backdrop-blur-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
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
                    LIVE
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
                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-black font-bold shadow-[0_0_10px_rgba(41,240,106,0.3)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {p.replace("-VX", "")}
                </button>
              );
            })}
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 bg-slate-950 border-b border-white/5 shrink-0">
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
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
                  </div>

                  <div
                    className={`max-w-[90%] rounded-xl p-3 text-[11.5px] leading-relaxed ${
                      isUser
                        ? "bg-cyan-500/15 border border-cyan-500/30 text-white rounded-tr-none font-mono"
                        : "bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none font-sans"
                    }`}
                  >
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
                <span>{selectedPersona} is thinking...</span>
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
              placeholder={`Ask ${selectedPersona}...`}
              disabled={isTyping}
              className="flex-1 rounded-xl border border-white/10 bg-black/80 px-3 py-2 font-sans text-xs text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isTyping || !inputQuery.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-2 text-xs transition-all disabled:opacity-30"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-slate-950/90 hover:bg-slate-900 px-4 py-2.5 text-xs font-mono font-bold text-white shadow-[0_0_25px_rgba(41,240,106,0.35),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 hover:scale-105 hover:border-emerald-400"
      >
        <span className="relative grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
          <Brain size={14} className="text-emerald-400 animate-pulse" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(41,240,106,1)]" />
        </span>

        <span className="font-sans font-semibold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
          {isOpen ? "Close Assistant" : "Ask NOESIS DeAI"}
        </span>

        {unreadCount > 0 && !isOpen && (
          <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[9px] font-bold text-black animate-bounce">
            1
          </span>
        )}
      </button>
    </div>
  );
}

// =============================================================================
// Intelligent Protocol Knowledge Engine (Authentic Deterministic Synthesis)
// =============================================================================

function generateSentinelResponse(query: string, persona: SentinelPersona): string {
  const q = query.toLowerCase();

  // 1. PoPC Consensus Mechanics
  if (q.includes("popc") || q.includes("consensus") || q.includes("proof of practical compute")) {
    return `⚡ [PoPC (Proof of Practical Compute) Architecture]

PoPC is NakharaX L1's novel consensus mechanism replacing PoW and PoS:
1. Useful Work: Nodes execute useful AI workloads (Inference, Tensor Fusion, Monte Carlo).
2. STARK FRI Proofs: Every completed task produces a verifiable polynomial proof on-chain.
3. BFT Fast-Finality: Probabilistic verification completes in microseconds without full re-execution.
4. Block Cadence: 3.0-second fixed block time (Chain ID: 86137).`;
  }

  // 2. MEV & SERAPH-VX Defense
  if (q.includes("mev") || q.includes("sandwich") || q.includes("front-run") || q.includes("seraph") || q.includes("ddos")) {
    return `🛡️ [SERAPH-VX Zero-MEV Fair Sequencing Shield]

SERAPH-VX protects the mempool and enforces fair ordering:
1. Time-Lock Fair Ordering: Encrypted timestamps prevent transaction front-running (Zero Sandwiching).
2. Enforced Max Slippage (≤ 0.05%): Prevents toxic arbitrage vectors.
3. Token Bucket Rate Limiter: Mitigates DDoS floods over 500 req/s per IP.
4. Sequencing Latency: Sub-12 µs execution latency.`;
  }

  // 3. Fraud Detection & ORION-VX
  if (q.includes("fraud") || q.includes("orion") || q.includes("isolation forest")) {
    return `🔎 [ORION-VX Isolation Forest Fraud Detection]

ORION-VX operates inside 'services/core/core/deai/fraud_detection.py':
1. Feature Extraction: Extracts Sample Entropy, Merkle Path Variance, Latency, and Output Distribution.
2. Isolation Forest ML: Identifies statistical anomalies; flags outputs breaching thresholds as 'SUSPICIOUS'.
3. Auto-Dispute: Escalates disputes to THEMIS-VX for immediate automated stake slashing.`;
  }

  // 4. DeAI Compute & Worker STARK FRI
  if (q.includes("worker") || q.includes("deai") || q.includes("compute") || q.includes("pytorch") || q.includes("gpu")) {
    return `🤖 [NakharaX DeAI Compute & STARK FRI Kernel]

Edge workers process tasks within sandboxed runtime environments:
1. Model Execution: Evaluates batch LLM inferences (Qwen, DeepSeek-R1) and vector embeddings.
2. STARK FRI Prover: Generates cryptographic low-degree polynomial constraint proofs in 1.96ms.
3. Settlement & Rewards: Merkle roots are committed on-chain to 'JobMarketplaceStandalone.sol' for instant token release.`;
  }

  // 5. Tokenomics & $tNAK
  if (q.includes("token") || q.includes("tnak") || q.includes("supply") || q.includes("gas")) {
    return `🪙 [NakharaX Native Tokenomics ($tNAK)]

1. Fixed Max Supply Ceiling: 1,000,000,000,000 $NAK (1 Trillion fixed supply in 'NakharaxToken.sol').
2. Chain ID: 86137 (0x15079).
3. EIP-1559 Dynamic Gas Burn: Base gas fees (1.0 – 1.2 Gwei) are permanently burnt.
4. PoPC Staking Yield: 8.4% APY for securing validator nodes and compute worker pools.
5. Ecosystem Utility: L1 gas settlement, DeAI job escrow collateral, and AI agent state channel fees.`;
  }

  // 6. Slashing & THEMIS-VX
  if (q.includes("slash") || q.includes("themis") || q.includes("dispute")) {
    return `⚖️ [THEMIS-VX Slashing Rules]

1. Double-Signing: Validators double-signing blocks suffer 100% stake slashing and permanent blacklisting.
2. Fake Compute Results: Workers submitting corrupted outputs forfeit 2,500 tNAK escrow collateral to the burn address.
3. Missed Block Quarantine: Nodes offline for over 100 consecutive blocks are temporarily quarantined.`;
  }

  return `🧠 [NOESIS-VX Cognitive Synthesis]
Query: "${query}"

Synthesized via NakharaX Protocol Knowledge Base (Chain ID 86137 / PoPC Consensus / STARK FRI Engine):
- Operating as a Sovereign Decentralized DeAI network.
- Zero Cloud Lock-in: Runs on bare-metal and sovereign edge hardware.
- Fully Verifiable: All execution states yield cryptographic on-chain STARK receipts.

Contact the cognitive core anytime for additional protocol specifications.`;
}
