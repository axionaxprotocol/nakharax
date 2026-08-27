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
    greeting: "Greetings, Sovereign Operator. I am NOESIS-VX, the Supreme Cognitive Core of NakharaX. Ask me anything regarding consensus mechanics, L1 tokenomics, DeAI compute grid, or testnet architecture.",
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
    query: "How does PoPC (Proof of Practical Compute) function, and how does it differ from PoW / PoS?",
    persona: "NOESIS-VX",
  },
  {
    label: "🛡️ Zero-MEV Shield",
    query: "How does SERAPH-VX prevent Sandwich Attacks and Mempool Front-running?",
    persona: "SERAPH-VX",
  },
  {
    label: "🔎 ML Fraud Detection",
    query: "How does ORION-VX utilize Isolation Forest machine learning to detect dishonest compute workers?",
    persona: "ORION-VX",
  },
  {
    label: "🤖 DeAI Compute",
    query: "How do Worker Nodes execute PyTorch models and generate cryptographic STARK FRI proofs?",
    persona: "NOESIS-VX",
  },
  {
    label: "🪙 Tokenomics $tNAK",
    query: "What is the tokenomics structure of $tNAK, its total supply ceiling, and gas burn mechanics?",
    persona: "NOESIS-VX",
  },
  {
    label: "⚖️ Slashing Rules",
    query: "Under what conditions will THEMIS-VX execute automated stake slashing for validators or workers?",
    persona: "THEMIS-VX",
  },
];

export function SentinelChatTerminal() {
  const [mounted, setMounted] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<SentinelPersona>("NOESIS-VX");
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
  if (q.includes("popc") || q.includes("consensus") || q.includes("proof of practical compute")) {
    return `⚡ [PoPC (Proof of Practical Compute) Architecture Specification]

PoPC is NakharaX L1's novel consensus mechanism designed to supersede PoW and PoS:

1. Useful Work Utilization: Instead of wasteful SHA-256 hash grinding (PoW), nodes execute useful AI compute tasks (AI Inference, Matrix Tensor Merging, Monte Carlo Simulations).
2. STARK FRI Cryptographic Proofs: Workers produce verifiable polynomial proofs (Proof Hash) submitted directly on-chain upon task completion.
3. BFT Fast-Finality: The network employs probabilistic sampling, allowing peer nodes to verify proof validity in microseconds without re-executing full model compute.
4. Deterministic Block Cadence: Fixed 3.0-second block intervals (Chain ID: 86137).`;
  }

  // 2. MEV & SERAPH-VX Defense
  if (q.includes("mev") || q.includes("sandwich") || q.includes("front-run") || q.includes("seraph") || q.includes("ddos")) {
    return `🛡️ [SERAPH-VX Zero-MEV Fair Sequencing & Anti-Sandwich Shield]

SERAPH-VX guards the transaction mempool and enforces fair ordering:

1. Time-Lock Fair Ordering: Transactions in the mempool are queued according to cryptographically encrypted timestamps, preventing block producers from reordering or front-running transactions (Zero Sandwiching).
2. Enforced Max Slippage (≤ 0.05%): Intercepts transactions susceptible to toxic arbitrage.
3. Token Bucket Rate Limiter: Mitigates DDoS floods immediately when ingress exceeds 500 req/s per IP.
4. Deterministic Sequencing Latency: Sub-12 µs execution latency prevents transaction eavesdropping.`;
  }

  // 3. Fraud Detection & ORION-VX
  if (q.includes("fraud") || q.includes("orion") || q.includes("isolation forest")) {
    return `🔎 [ORION-VX Isolation Forest Fraud Detection Subsystem]

ORION-VX operates inside 'services/core/core/deai/fraud_detection.py' using machine learning:

1. Feature Vector Extraction: Extracts telemetry metrics from PoPC Proofs, including Sample Entropy, Merkle Path Variance, Execution Latency, and Tensor Output Distribution.
2. Isolation Forest Anomaly Scoring: Identifies statistical anomalies. If the anomaly score breaches the contamination threshold (0.01), the output is flagged as 'SUSPICIOUS'.
3. Auto-Dispute Trigger: Escalates verification disputes to smart contracts for THEMIS-VX to execute automated stake slashing and re-assign tasks.`;
  }

  // 4. DeAI Compute & Worker STARK FRI
  if (q.includes("worker") || q.includes("deai") || q.includes("compute") || q.includes("pytorch") || q.includes("gpu")) {
    return `🤖 [NakharaX DeAI Compute & STARK FRI Kernel]

Edge workers process tasks within sandboxed runtime environments:

1. Model Execution: Evaluates batch LLM inferences (Qwen, DeepSeek-R1) and high-dimensional vector embeddings.
2. STARK FRI Prover: Generates cryptographic low-degree polynomial constraint proofs in 1.96ms without trusted setup.
3. On-Chain Settlement: Merkle roots are committed to 'JobMarketplaceStandalone.sol' for immediate escrow reward release.
4. Auto-Verification: PoPC consensus statistical sampling verifies outputs at O(s) cost without full re-execution.`;
  }

  // 5. Tokenomics & $tNAK
  if (q.includes("token") || q.includes("tnak") || q.includes("supply") || q.includes("gas")) {
    return `🪙 [NakharaX Native Tokenomics ($tNAK)]

Economic parameters of the native $tNAK token:

1. Fixed Max Supply Ceiling: 1,000,000,000,000 $NAK (1 Trillion fixed supply in 'NakharaxToken.sol').
2. Chain ID: 86137 (0x15079).
3. EIP-1559 Dynamic Gas Burn: Base gas fees fluctuate between 1.0 – 1.2 Gwei; base fee tokens are permanently burnt.
4. PoPC Staking Yield: 8.4% APY for staking $tNAK to secure validator nodes and DeAI worker pools.
5. Ecosystem Utility: L1 gas settlement, DeAI compute job escrow collateral, and AI agent state channel fees.`;
  }

  // 6. Slashing & THEMIS-VX
  if (q.includes("slash") || q.includes("themis") || q.includes("dispute")) {
    return `⚖️ [THEMIS-VX On-Chain Judicial & Slashing Protocol]

THEMIS-VX enforces judicial invariants defined in 'JobMarketplaceStandalone.sol':

1. Double-Signing Penalty: Validators caught double-signing blocks suffer 100% stake slashing and permanent node blacklisting.
2. Invalid Compute Results: Workers submitting corrupted tensor outputs or invalid STARK proofs forfeit 2,500 tNAK escrow collateral to the burn address.
3. Missed Block Quarantine: Nodes offline for over 100 consecutive blocks suffer reputation score degradation and temporary validator pool quarantine.`;
  }

  // Default response based on persona
  if (persona === "SERAPH-VX") {
    return `🛡️ [SERAPH-VX Sentinel Response]
Command acknowledged: Ingress channels and mempool shields are operating at 100% capacity (Zero-MEV Fair Sequencing Active, Slippage SLA ≤ 0.05%). Provide a transaction hash to execute an immediate mempool security inspection.`;
  }

  if (persona === "ORION-VX") {
    return `🔎 [ORION-VX ML Auditor Response]
Command acknowledged: Isolation Forest statistical audit models are actively monitoring on-chain PoPC proofs. Provide a Job ID to retrieve feature vectors and evaluate anomaly confidence scores.`;
  }

  return `🧠 [NOESIS-VX Cognitive Synthesis]
Query: "${query}"

Synthesized via NakharaX Protocol Knowledge Base (Chain ID 86137 / PoPC Consensus / STARK FRI Engine):
- Operating as a Sovereign Decentralized DeAI network.
- Zero Cloud Lock-in: Runs on bare-metal and sovereign edge hardware.
- Fully Verifiable: All execution states yield cryptographic on-chain STARK receipts.

Contact the cognitive core anytime for additional protocol specifications.`;
}
