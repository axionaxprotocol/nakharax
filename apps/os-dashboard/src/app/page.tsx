import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Briefcase,
  CheckCircle2,
  Cpu,
  Dna,
  GitMerge,
  Globe2,
  Lock,
  Network,
  Radio,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Vault,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  ActionLink,
  Card,
  IconBadge,
  SectionHeader,
} from "@/components/card";
import { QuickConnectBox } from "@/components/quick-connect";
import { LiveStatsSection } from "@/components/live-stats";
import { TopRadarTicker } from "@/components/top-radar-ticker";
import { HomeQuickHub } from "@/components/home-quick-hub";
import { DEFAULT_NODES, getNodeStatus } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const statuses = await Promise.all(
    DEFAULT_NODES.map((endpoint) =>
      getNodeStatus(endpoint, { timeoutMs: 2_000 }),
    ),
  );

  const online = statuses.filter((status) => status.online).length;
  const totalPeers = statuses.reduce(
    (sum, status) => sum + (status.peerCount ?? 0),
    0,
  );
  const maxBlock = statuses.reduce(
    (max, status) => Math.max(max, status.blockNumber ?? 0),
    0,
  );
  const totalNodes = statuses.length;
  const rpcEndpoint = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.nakharax.com";

  return (
    <div className="space-y-10 sm:space-y-12 animate-slide-up pb-20">
      {/* =========================================================================
          HIGH-FPS LIVE INGRESS TICKER STRIP (TOP RADAR)
          ========================================================================= */}
      <TopRadarTicker
        initialBlock={maxBlock}
        initialOnline={online}
        initialTotalNodes={totalNodes}
      />

      {/* =========================================================================
          HERO: INSTITUTIONAL COMMAND CENTER & SOVEREIGN DEAI GRID
          ========================================================================= */}
      <section className="relative px-4 py-10 sm:px-12 sm:py-16 text-center overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-slate-950/90 via-[#030712] to-slate-950/90 backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.85)]">
        {/* Holographic Glowing Ambient Backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 w-[700px] sm:w-[900px] h-[320px] bg-emerald-500/15 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[4000ms]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="relative z-10 mx-auto max-w-4xl space-y-5 sm:space-y-6">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 sm:px-4 py-1.5 text-[10.5px] sm:text-xs font-mono font-bold tracking-wider text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400 shrink-0" />
            <span>SOVEREIGN DEAI COMPUTE PROTOCOL & MULTI-REGION BFT GRID</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] sm:leading-[1.1]">
            Verifiable AI Compute &{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 drop-shadow-[0_0_35px_rgba(41,240,106,0.3)]">
              Sovereign Execution.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 max-w-2xl mx-auto text-[13.5px] sm:text-base md:text-lg font-normal leading-relaxed">
            Harness high-performance GPUs, neural accelerators, and validator nodes into a decentralized L1 grid for verifiable STARK ZK inference, continual LoRA weight fusion, and autonomous agent settlement.
          </p>

          {/* Quick-Action Command Matrix */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-2">
            <Link
              href="/apps/sentinel"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-xs sm:text-sm font-mono font-bold text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]"
            >
              <Brain size={16} />
              <span>Launch AI Risk Brain</span>
            </Link>

            <Link
              href="/nodes"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-3 text-xs sm:text-sm font-mono font-bold text-cyan-300 transition-all hover:bg-cyan-500/20 hover:border-cyan-400"
            >
              <Globe2 size={16} />
              <span>Open Node Radar</span>
            </Link>

            <Link
              href="/wallet"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs sm:text-sm font-mono font-semibold text-white transition-all hover:bg-white/10"
            >
              <Vault size={16} className="text-emerald-400" />
              <span>Citadel Vault (8.40%)</span>
            </Link>

            <Link
              href="/apps/faucet"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm font-mono font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-400"
            >
              <Zap size={14} />
              <span>+100 $tNAK Faucet</span>
            </Link>
          </div>

          {/* Cryptographic Proof & Performance Invariants Strip */}
          <div className="pt-2 sm:pt-3 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 sm:px-5 py-2 text-[11px] sm:text-xs font-mono text-slate-300 shadow-sm backdrop-blur-xl">
              <span className="font-semibold text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={13} />
                Proof of Practical Compute (PoPC v2.1)
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-300 font-semibold">STARK FRI 1,024 ZKP</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-300 font-semibold">Zero-MEV Mempool</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-300 font-medium">Sub-Millisecond Redis P99 &lt; 1ms</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE TELEMETRY: 4 STREAMLINED METRIC GAUGES
          ========================================================================= */}
      <LiveStatsSection
        initialBlock={maxBlock}
        initialOnline={online}
        initialTotalNodes={totalNodes}
        initialPeers={totalPeers}
      />

      {/* =========================================================================
          4 FLAGSHIP ECOSYSTEM BENTO HUBS (MISSION CONTROL)
          ========================================================================= */}
      <section className="space-y-4">
        <SectionHeader
          title="Sovereign Protocol Core Engines"
          description="Institutional Layer-1 infrastructure powering autonomous DeAI compute, continual learning, and zero-trust settlement."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {/* Hub 1: PoPC Compute Engine */}
          <Link
            href="/jobs"
            className="group rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-5 transition-all hover:border-emerald-400 hover:bg-emerald-500/[0.06] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Cpu size={20} />
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
                  PoPC v2.1
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Autonomous DeAI Compute Grid
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                  ASR VRF worker dispatching with STARK FRI low-degree polynomial validation and instant escrow release.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-emerald-400">
              <span>Explore Marketplace</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Hub 2: LoRA Fusion Studio */}
          <Link
            href="/apps/lora"
            className="group rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-5 transition-all hover:border-cyan-400 hover:bg-cyan-500/[0.06] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <GitMerge size={20} />
                </span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                  TIES / DARE
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  LoRA Weight Fusion Studio
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                  Continual model adaptation via tensor sparsification with 99.4% zero catastrophic forgetting score.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-cyan-400">
              <span>Open Fusion Studio</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Hub 3: Institutional Citadel Vault */}
          <Link
            href="/wallet"
            className="group rounded-2xl border border-purple-500/30 bg-slate-950/80 p-5 transition-all hover:border-purple-400 hover:bg-purple-500/[0.06] hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                  <Lock size={20} />
                </span>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/40">
                  8.40% APY
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Citadel Vault & Staking Pool
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                  12-Word BIP-39 encryption + PBKDF2 with live streaming PoPC yield harvest and unbonding vaults.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-purple-400">
              <span>Manage Vault</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Hub 4: Global Quorum Radar */}
          <Link
            href="/nodes"
            className="group rounded-2xl border border-amber-500/30 bg-slate-950/80 p-5 transition-all hover:border-amber-400 hover:bg-amber-500/[0.06] hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Network size={20} />
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  3-Node Mesh
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Global Consensus Radar
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
                  React-Simple-Maps World Atlas topology connecting Frankfurt, Virginia & Singapore.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-amber-400">
              <span>Inspect P2P Mesh</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE QUICK HUB: 4 ACTIONS + LIVE AI PLAYGROUND + APP CONSOLES
          ========================================================================= */}
      <HomeQuickHub />

      {/* =========================================================================
          COMPUTE PIPELINE: HORIZONTAL SLEEK CRYPTOGRAPHIC STEPPER
          ========================================================================= */}
      <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 backdrop-blur-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider text-slate-300">
              <Activity size={15} className="text-emerald-400" />
              Cryptographic Compute Pipeline Lifecycle
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-end verifiable state progression from job discovery to on-chain settlement.
            </p>
          </div>
          <Link
            href="/jobs"
            className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
          >
            Open Marketplace <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {[
            { step: "01", name: "Discover", desc: "ASR VRF worker match", icon: Route, color: "text-cyan-400" },
            { step: "02", name: "Escrow", desc: "tNAK locked in contract", icon: Wallet, color: "text-amber-400" },
            { step: "03", name: "Execute", desc: "Sandbox model execution", icon: Zap, color: "text-emerald-400" },
            { step: "04", name: "Verify", desc: "PoPC STARK FRI audit", icon: ShieldCheck, color: "text-violet-400" },
            { step: "05", name: "Settle", desc: "Instant on-chain payout", icon: CheckCircle2, color: "text-emerald-400" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.05] hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">{item.step}</span>
                  <Icon size={16} className={item.color} />
                </div>
                <div className="mt-2 font-bold text-xs text-white">{item.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          DEVELOPER INGRESS: COMPACT JSON-RPC BOX
          ========================================================================= */}
      <section className="space-y-3">
        <SectionHeader
          title="Developer JSON-RPC Ingress"
          description="Submit cryptographic jobs or query node state directly over HTTP JSON-RPC 2.0."
          action={
            <span className="text-[11px] font-mono text-slate-400">
              RPC: <code className="text-cyan-300">{rpcEndpoint}</code>
            </span>
          }
        />
        <QuickConnectBox endpoint={rpcEndpoint} />
      </section>
    </div>
  );
}
