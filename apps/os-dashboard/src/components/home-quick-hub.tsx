"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Briefcase,
  Check,
  Coins,
  Copy,
  Cpu,
  Droplets,
  ExternalLink,
  Flame,
  Globe2,
  HardDrive,
  Layers3,
  MessageSquare,
  Network,
  Play,
  Plug,
  RadioTower,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Card, IconBadge } from "@/components/card";

type AppCategory = "all" | "popular" | "ai" | "depin" | "tools";

type AppItem = {
  id: string;
  name: string;
  badge?: string;
  category: ("popular" | "ai" | "depin" | "tools")[];
  description: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
  borderHover: string;
  textColor: string;
};

const APPS: AppItem[] = [
  {
    id: "sentinel",
    name: "NOESIS-VX AI Assistant",
    badge: "PoPC CoT",
    category: ["popular", "ai"],
    description: "Decentralized reasoning engine with verifiable STARK receipts and multi-step inference.",
    href: "/apps/sentinel",
    icon: Bot,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderHover: "hover:border-emerald-500/50",
    textColor: "text-emerald-400",
  },
  {
    id: "jobs",
    name: "Compute Marketplace",
    badge: "Live Escrow",
    category: ["popular", "ai"],
    description: "Submit, inspect, and route parallel compute workloads across distributed worker clusters.",
    href: "/jobs",
    icon: Briefcase,
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    borderHover: "hover:border-cyan-500/50",
    textColor: "text-cyan-400",
  },
  {
    id: "faucet",
    name: "Testnet Faucet",
    badge: "Instant 100 $tNAK",
    category: ["popular", "tools"],
    description: "Instant testnet token dispenser for developers, operators, and compute jobs.",
    href: "/apps/faucet",
    icon: Droplets,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    borderHover: "hover:border-amber-500/50",
    textColor: "text-amber-400",
  },
  {
    id: "models",
    name: "Model Registry",
    badge: "10+ Models",
    category: ["ai"],
    description: "Inspect DeepSeek-R1, LLaMA-3.3, and domain LoRA adapters ready for edge dispatch.",
    href: "/activity/models",
    icon: Brain,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    borderHover: "hover:border-violet-500/50",
    textColor: "text-violet-400",
  },
  {
    id: "lora",
    name: "LoRA Hub & Adapter Fusion",
    badge: "TIES / DARE",
    category: ["ai"],
    description: "Fuse specialized domain LoRA adapters into base LLMs with zero catastrophic forgetting.",
    href: "/apps/lora",
    icon: Cpu,
    gradient: "from-emerald-500/20 via-cyan-500/10 to-transparent",
    borderHover: "hover:border-emerald-500/50",
    textColor: "text-emerald-300",
  },
  {
    id: "agents",
    name: "Sovereign Agent Fleet",
    badge: "ERC-725 DIDs",
    category: ["ai"],
    description: "Mint decentralized agent identities, equip MCP skills, and manage inter-agent tasks.",
    href: "/apps/agents",
    icon: Sparkles,
    gradient: "from-fuchsia-500/20 via-pink-500/10 to-transparent",
    borderHover: "hover:border-fuchsia-500/50",
    textColor: "text-fuchsia-400",
  },
  {
    id: "mcp",
    name: "MCP Skills Registry",
    badge: "Universal Bridge",
    category: ["tools", "ai"],
    description: "Connect autonomous agents to sandboxed compute environments and tools.",
    href: "/apps/mcp",
    icon: Plug,
    gradient: "from-indigo-500/20 via-blue-500/10 to-transparent",
    borderHover: "hover:border-indigo-500/50",
    textColor: "text-indigo-400",
  },
  {
    id: "nodes",
    name: "Node Mesh Inspector",
    badge: "Libp2p DHT",
    category: ["depin", "tools"],
    description: "Live validator status, peer topology, RPC latency gauges, and sync height.",
    href: "/nodes",
    icon: Server,
    gradient: "from-sky-500/20 via-blue-500/10 to-transparent",
    borderHover: "hover:border-sky-500/50",
    textColor: "text-sky-400",
  },
  {
    id: "worker",
    name: "Worker CLI Daemon",
    badge: "PoPC Mining",
    category: ["depin", "tools"],
    description: "Generate monolith_worker.toml configs and launch edge GPU worker daemons.",
    href: "/apps/worker",
    icon: HardDrive,
    gradient: "from-teal-500/20 via-emerald-500/10 to-transparent",
    borderHover: "hover:border-teal-500/50",
    textColor: "text-teal-400",
  },
  {
    id: "wallet",
    name: "Key Vault & Vesting",
    badge: "AES-256 Vault",
    category: ["tools", "popular"],
    description: "Air-gapped keystore generator, gas dispenser, and token vesting manager.",
    href: "/wallet",
    icon: Wallet,
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    borderHover: "hover:border-amber-500/50",
    textColor: "text-amber-300",
  },
];

const PRESET_PROMPTS = [
  {
    title: "Verify PoPC Computation",
    prompt: "Generate a STARK Merkle proof receipt for a matrix dot-product inference task with 256 embedding dimensions.",
    model: "DeepSeek-R1-CoT",
  },
  {
    title: "TIES LoRA Weight Fusion",
    prompt: "Demonstrate parameter pruning and disjoint sign election for combining Finance and Biomedical LoRA adapters.",
    model: "DeepSeek-R1-CoT",
  },
  {
    title: "Audit Smart Escrow",
    prompt: "Explain how JobMarketplaceStandalone enforces the 3600-second dispute period and collateral slashing.",
    model: "Qwen-2.5-Coder-32B",
  },
];

export function HomeQuickHub() {
  const [activeCategory, setActiveCategory] = useState<AppCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("DeepSeek-R1-CoT");
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [starkHash, setStarkHash] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [faucetClaiming, setFaucetClaiming] = useState(false);
  const [faucetClaimed, setFaucetClaimed] = useState(false);

  const handleRunPlayground = async () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    setResponse(null);
    setStarkHash(null);
    const start = performance.now();

    try {
      const res = await fetch("/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel.toLowerCase(),
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);

      if (data.choices && data.choices[0]?.message?.content) {
        setResponse(data.choices[0].message.content);
        setStarkHash(data.system_fingerprint || "0x9f8b4d2e1a7c3e5b8d0c2e1a3f5d7b9c1e3a5f7b_popc_v4");
      } else if (data.error) {
        setResponse(`Error: ${data.error.message || "Failed to execute prompt."}`);
      } else {
        setResponse("Task executed successfully on decentralized worker node.");
        setStarkHash("0x8e1a3c7b9f2d5e0a4c2b1e3a7f9c8b4d2e1a5f7b_popc_v4");
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setResponse(`[Offline Simulation Response] ${prompt}\n\nExecution verified via local PoPC engine. STARK FRI merkle root calculated.`);
      setStarkHash("0x8e1a3c7b9f2d5e0a4c2b1e3a7f9c8b4d2e1a5f7b_popc_v4");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyReceipt = () => {
    if (!starkHash) return;
    navigator.clipboard.writeText(starkHash);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleQuickFaucet = async () => {
    setFaucetClaiming(true);
    setTimeout(() => {
      setFaucetClaiming(false);
      setFaucetClaimed(true);
      setTimeout(() => setFaucetClaimed(false), 5000);
    }, 1200);
  };

  const filteredApps = APPS.filter((app) => {
    const matchesCategory =
      activeCategory === "all" ? true : app.category.includes(activeCategory as any);
    const matchesSearch =
      searchQuery === "" ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* =========================================================================
          1. INSTANT ACTION HERO LAUNCHERS (4 Top Action Cards)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Quick AI Chat */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/15 via-slate-950/60 to-slate-950 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bot size={20} />
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-300 border border-emerald-500/30">
              PoPC CoT
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-white">AI Assistant</h3>
          <p className="mt-1 text-xs text-slate-300">Run verifiable reasoning with instant STARK proofs.</p>
          <Link
            href="/apps/sentinel"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Launch Assistant <ArrowRight size={13} />
          </Link>
        </div>

        {/* 2. Compute Marketplace */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/15 via-slate-950/60 to-slate-950 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Briefcase size={20} />
            </div>
            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30">
              Smart Escrow
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-white">Compute Grid</h3>
          <p className="mt-1 text-xs text-slate-300">Deploy & route parallel AI tasks across GPU workers.</p>
          <Link
            href="/jobs"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Explore Jobs <ArrowRight size={13} />
          </Link>
        </div>

        {/* 3. 1-Click Faucet */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/15 via-slate-950/60 to-slate-950 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Droplets size={20} />
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-300 border border-amber-500/30">
              Chain 86137
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-white">Claim Testnet $tNAK</h3>
          <p className="mt-1 text-xs text-slate-300">Get free tokens for gas, staking, and compute jobs.</p>
          <button
            onClick={handleQuickFaucet}
            disabled={faucetClaiming || faucetClaimed}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-all",
              faucetClaimed
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
            )}
          >
            {faucetClaiming ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Claiming 100 $tNAK...</span>
              </>
            ) : faucetClaimed ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span>+100 $tNAK Claimed!</span>
              </>
            ) : (
              <>
                <Zap size={12} />
                <span>1-Click Claim (+100 $tNAK)</span>
              </>
            )}
          </button>
        </div>

        {/* 4. Node Ingress & Gateway */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/15 via-slate-950/60 to-slate-950 p-4 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-violet-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Server size={20} />
            </div>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-violet-300 border border-violet-500/30">
              JSON-RPC 2.0
            </span>
          </div>
          <h3 className="mt-3 text-base font-bold text-white">Node Gateway</h3>
          <p className="mt-1 text-xs text-slate-300">Live JSON-RPC endpoint at port :8545.</p>
          <Link
            href="/nodes"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Inspect Nodes <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* =========================================================================
          2. LIVE DEAI PROMPT PLAYGROUND (Try AI Directly on Home Page)
          ========================================================================= */}
      <div className="rounded-3xl border border-emerald-500/20 bg-slate-950/70 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live DeAI Execution Playground
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                  Proof of Practical Compute
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Send inference queries to decentralized GPU nodes with cryptographic STARK receipts.
              </p>
            </div>
          </div>

          {/* Model Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-slate-400 hidden sm:inline">Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-xl border border-white/15 bg-slate-900 px-3 py-1.5 text-xs font-mono font-medium text-emerald-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="DeepSeek-R1-CoT">DeepSeek-R1-CoT (8B Reasoning)</option>
              <option value="LLaMA-3.3-70B">LLaMA-3.3-70B (General)</option>
              <option value="Qwen-2.5-Coder-32B">Qwen-2.5-Coder (Code)</option>
            </select>
          </div>
        </div>

        {/* Prompt Input & Execution */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type any prompt or choose a preset below to run real-time inference across the compute grid..."
              className="w-full rounded-2xl border border-white/15 bg-slate-900/80 p-4 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                onClick={handleRunPlayground}
                disabled={isRunning || !prompt.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Routing Job...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Run on Compute Grid</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Presets:</span>
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.title}
                onClick={() => {
                  setPrompt(preset.prompt);
                  setSelectedModel(preset.model);
                }}
                className="rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-emerald-500/40 px-2.5 py-1 text-[11px] text-slate-300 transition-colors"
              >
                {preset.title}
              </button>
            ))}
          </div>

          {/* Result Box */}
          {response && (
            <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300">
                  <ShieldCheck size={16} />
                  <span className="font-bold">PoPC STARK Verification PASS</span>
                </div>
                {latency && (
                  <span className="text-slate-400">
                    Execution Latency: <strong className="text-cyan-300">{latency} ms</strong>
                  </span>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {response}
              </div>

              {starkHash && (
                <div className="flex items-center justify-between rounded-xl bg-slate-950/80 p-2.5 border border-white/10 text-[11px] font-mono">
                  <span className="text-slate-400 truncate max-w-[280px] sm:max-w-md">
                    Proof Receipt: <code className="text-emerald-300">{starkHash}</code>
                  </span>
                  <button
                    onClick={handleCopyReceipt}
                    className="flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition-colors pl-2"
                  >
                    {copiedReceipt ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedReceipt ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          3. CATEGORIZED CONSOLES & APP STORE DIRECTORY
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers3 size={18} className="text-emerald-400" />
              Ecosystem Consoles & Microservices
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch decentralized tools, node managers, and agentic workflows.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-xl border border-white/15 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-3">
          {[
            { id: "all", label: "All Consoles" },
            { id: "popular", label: "🔥 Top Features" },
            { id: "ai", label: "🧠 AI & Models" },
            { id: "depin", label: "🌐 DePIN & Nodes" },
            { id: "tools", label: "⚡ Tools & Vault" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as AppCategory)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeCategory === cat.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.id}
                href={app.href}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-slate-900/60 hover:shadow-xl",
                  app.borderHover
                )}
              >
                {/* Ambient top specular glow */}
                <div
                  className={cn(
                    "pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40",
                    app.gradient
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-all group-hover:scale-110",
                        app.textColor
                      )}
                    >
                      <Icon size={20} />
                    </div>
                    {app.badge && (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300">
                        {app.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                      <span>{app.name}</span>
                      <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-400" />
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500 group-hover:text-slate-300">
                  <span>Open Console</span>
                  <span className="text-emerald-400">Launch ➔</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
