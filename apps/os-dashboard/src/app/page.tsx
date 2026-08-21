import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Briefcase,
  Cpu,
  Gauge,
  Globe2,
  HardDrive,
  Layers3,
  RadioTower,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  ActionLink,
  Card,
  IconBadge,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import { QuickConnectBox } from "@/components/quick-connect";
import { LiveStatsSection } from "@/components/live-stats";
import { DEFAULT_NODES, getNodeStatus } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Tone = "ai" | "chain" | "warn" | "danger" | "neutral" | "violet";

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
  const isOnline = online > 0;

  return (
    <div className="space-y-8 sm:space-y-10 animate-slide-up">
      {/* =========================================================================
          SECTION 1: XPFIRM-STYLE CENTERED INSTITUTIONAL HERO
          ========================================================================= */}
      <section className="relative px-2 py-8 sm:px-4 sm:py-12 text-center overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-950/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Ambient background glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-[600px] sm:w-[800px] h-[320px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[4000ms]" />

        <div className="relative z-10 mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-semibold tracking-wide text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Sovereign DeAI Compute Protocol
          </div>

          <h1 className="text-[32px]/[1.15] sm:text-[44px]/[1.12] md:text-[52px]/[1.12] font-bold text-white tracking-normal max-w-[24rem] sm:max-w-none mx-auto">
            Compute power people can{" "}
            <span className="inline-block text-emerald-400">
              own, route, and verify.
            </span>
          </h1>

          <p className="text-slate-300 max-w-[22rem] sm:max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium leading-relaxed">
            Nakharax turns reachable PCs, edge accelerators, and private GPU clusters into a
            zero-censorship compute marketplace for verifiable AI inference, quant simulations, and local-first execution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 w-full max-w-xs sm:max-w-none mx-auto">
            <ActionLink href="/jobs" variant="primary">
              Open compute jobs
            </ActionLink>
            <ActionLink href="/nodes" variant="secondary">
              Inspect node mesh
            </ActionLink>
          </div>

          <div className="pt-3 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-mono text-slate-300 shadow-sm backdrop-blur-xl">
              <span className="font-semibold text-emerald-300">✓ Proof of Practical Compute (PoPC)</span>
              <span className="text-slate-500">·</span>
              <span className={isOnline ? "text-cyan-300 font-semibold" : "text-amber-400 font-semibold"}>
                {isOnline ? "Chain 86137 Live" : "Testnet Genesis (Simulation Mode)"}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Verifiable Execution</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: 4 INSTITUTIONAL STAT BLOCKS (REAL-TIME LIVE SYNC)
          ========================================================================= */}
      <LiveStatsSection
        initialBlock={maxBlock}
        initialOnline={online}
        initialTotalNodes={totalNodes}
        initialPeers={totalPeers}
      />

      {/* =========================================================================
          SECTION 3: DEVELOPER INGRESS & TERMINAL QUICK-CONNECT
          ========================================================================= */}
      <section className="space-y-3">
        <SectionHeader
          title="Direct JSON-RPC Ingress"
          description="Send raw cryptographic inference jobs or query node topology via standard curl or SDK."
          action={
            <span className="text-[11px] font-mono text-slate-400">
              Target: <code className="text-cyan-300">https://rpc.nakharax.com</code>
            </span>
          }
        />
        <QuickConnectBox />
      </section>

      {/* =========================================================================
          SECTION 4: 3-PILLAR SOVEREIGN COMPUTE CAPABILITIES
          ========================================================================= */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Sovereign compute architecture"
          description="Built for affordability, geographic data custody, and cryptographic receipts without cloud lock-in."
        />
        <div className="grid gap-3.5 md:grid-cols-3">
          {MISSION_CARDS.map((item) => (
            <Card key={item.title} interactive tone={item.tone} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <IconBadge Icon={item.Icon} tone={item.tone} className="h-10 w-10" />
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9.5px] font-mono text-slate-400 uppercase">
                    Protocol Spec
                  </span>
                </div>
                <h3 className="mt-3.5 text-[15.5px] font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
                  {item.description}
                </p>
              </div>
              <div className="mt-4 border-t border-white/[0.08] pt-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                Institutional Standard
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: 5-STEP CRYPTOGRAPHIC PIPELINE
          ========================================================================= */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Compute marketplace pipeline"
          description="The complete cryptographic lifecycle of an AI compute job from submission to verifiable settlement."
          action={
            <Link
              href="/activity/inference"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Audit simulated runs
              <ArrowRight size={13} />
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {WORKLOAD_FLOW.map((step, index) => (
            <Card
              key={step.title}
              className="group relative overflow-hidden"
              padded
              tone={step.tone}
              interactive
            >
              {/* Watermark number */}
              <div className="absolute right-2.5 top-2.5 font-mono text-[2.2rem] font-black leading-none text-white/[0.05] transition-all group-hover:text-white/[0.12] select-none">
                {String(index + 1).padStart(2, "0")}
              </div>
              <IconBadge Icon={step.Icon} tone={step.tone} className="h-9 w-9" />
              <h3 className="mt-3 text-[14.5px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: OPERATING SYSTEM CONSOLES MATRIX (2x4 Grid)
          ========================================================================= */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Operating system consoles"
          description="Dedicated consoles for compute workloads, node ownership, telemetry auditing, and local key vault."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <Link key={module.label} href={module.href} className="group block">
              <Card interactive className="h-full flex flex-col justify-between" tone={module.tone}>
                <div className="flex items-start gap-3">
                  <IconBadge Icon={module.Icon} tone={module.tone} className="h-9 w-9" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14.5px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {module.label}
                      </h3>
                      {module.status && (
                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-amber-300 uppercase">
                          {module.status}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-400 group-hover:text-emerald-400 transition-colors">
                    Launch Console
                  </span>
                  <ArrowRight
                    size={13}
                    className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-400"
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const MISSION_CARDS: {
  title: string;
  description: string;
  Icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    title: "Edge Inference",
    description:
      "Route lightweight models to reachable local NPUs and GPUs first, scaling outward to cluster only when required.",
    Icon: Cpu,
    tone: "ai",
  },
  {
    title: "Batch Simulations",
    description:
      "Queue quant backtests, simulations, and embeddings where cost-per-token dominates raw latency.",
    Icon: Brain,
    tone: "violet",
  },
  {
    title: "Sovereign Mesh",
    description:
      "Confine proprietary workloads strictly inside selected geographic boundaries or private bare-metal nodes.",
    Icon: Globe2,
    tone: "chain",
  },
];

const WORKLOAD_FLOW: {
  title: string;
  description: string;
  Icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    title: "01. Discover",
    description: "Locate compute workers by VRAM, latency, benchmark score, and jurisdiction.",
    Icon: Route,
    tone: "chain",
  },
  {
    title: "02. Escrow",
    description: "Lock tNAK in smart escrow contract against signed job specifications.",
    Icon: Wallet,
    tone: "warn",
  },
  {
    title: "03. Execute",
    description: "Run isolated model inference or batch container inside secure worker sandboxes.",
    Icon: Zap,
    tone: "ai",
  },
  {
    title: "04. Verify",
    description: "Validate cryptographic receipts, output hashes, and anomaly signals before payout.",
    Icon: ShieldCheck,
    tone: "violet",
  },
  {
    title: "05. Settle",
    description: "Release tNAK reward to worker and commit auditable execution receipt on-chain.",
    Icon: Activity,
    tone: "chain",
  },
];

const MODULES: {
  href: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  tone: Tone;
  status?: string;
}[] = [
  {
    href: "/jobs",
    label: "Compute Jobs",
    description: "Submit, inspect, and route decentralized AI workloads.",
    Icon: Briefcase,
    tone: "ai",
  },
  {
    href: "/activity/models",
    label: "Model Registry",
    description: "Inspect deployable LLM, vision, audio, and embedding models.",
    Icon: Brain,
    tone: "violet",
  },
  {
    href: "/nodes",
    label: "Node Mesh",
    description: "Monitor gateways, peer topology, block height, and DHT.",
    Icon: Server,
    tone: "chain",
  },
  {
    href: "/apps",
    label: "Microservices",
    description: "Launch PropSentinel Risk Terminal & ecosystem services.",
    Icon: Sparkles,
    tone: "warn",
  },
  {
    href: "/wallet",
    label: "Key Vault",
    description: "Inspect on-chain balances and sign local raw transfers.",
    Icon: Wallet,
    tone: "ai",
  },
  {
    href: "/activity",
    label: "Telemetry Ledger",
    description: "Audit consensus events and verified compute receipts.",
    Icon: Activity,
    tone: "chain",
  },
  {
    href: "/logs",
    label: "Realtime Logs",
    description: "Tail node ingress and worker execution streams.",
    Icon: Terminal,
    tone: "neutral",
  },
  {
    href: "/settings",
    label: "Core Settings",
    description: "Configure JSON-RPC endpoints and network bootnodes.",
    Icon: HardDrive,
    tone: "neutral",
  },
];
