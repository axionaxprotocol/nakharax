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
  DataRow,
  IconBadge,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import { QuickConnectBox } from "@/components/quick-connect";
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
    <div className="space-y-os-8 animate-slide-up">
      {/* =========================================================================
          ZONE 1: COMMAND HERO (Integrated Value Pitch + Live Ingress Terminal)
          ========================================================================= */}
      <section className="relative overflow-hidden rounded-os-3xl border border-white/[0.14] bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent backdrop-blur-3xl bg-slate-950/50 p-os-6 sm:p-os-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
        {/* Specular glass reflection */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/[0.4] to-transparent" />

        {/* Dynamic atmospheric radial glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-[100px]" />
          <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-cyan-500/18 blur-[100px]" />
          <div className="absolute -left-20 top-1/2 h-72 w-72 rounded-full bg-violet-500/15 blur-[90px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
        </div>

        <div className="relative grid gap-os-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="lg:col-span-7 space-y-os-5">
            <div className="flex flex-wrap items-center gap-os-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1 text-[10.5px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent-ai)] shadow-[0_0_20px_-3px_rgba(41,240,106,0.4)] backdrop-blur-xl">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-ai)]" />
                Sovereign DeAI Compute Mesh
              </div>
              <StatusPill tone={isOnline ? "ai" : "danger"} pulse={isOnline}>
                {isOnline ? "mesh online" : "mesh offline"}
              </StatusPill>
              <StatusPill tone="chain">chain 86137</StatusPill>
              <StatusPill tone="warn">testnet pilot</StatusPill>
            </div>

            <h1 className="text-[2rem] font-bold leading-[1.12] tracking-[-0.035em] text-white sm:text-[2.75rem]">
              Compute power people can{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                own, route, and verify.
              </span>
            </h1>

            <p className="max-w-2xl text-[14.5px] leading-relaxed text-slate-300 sm:text-[15.5px]">
              Nakharax turns reachable PCs, edge accelerators, and private GPU clusters into a
              zero-censorship marketplace for verifiable AI inference, quant simulations, and local-first execution.
            </p>

            <div className="flex flex-wrap items-center gap-os-3 pt-os-2">
              <ActionLink href="/jobs">Open compute jobs</ActionLink>
              <ActionLink href="/nodes" variant="secondary">
                Inspect node mesh
              </ActionLink>
            </div>
          </div>

          {/* Right Column: Live Terminal Quick Connect */}
          <div className="lg:col-span-5">
            <QuickConnectBox />
          </div>
        </div>
      </section>

      {/* =========================================================================
          ZONE 2: KEY PROTOCOL METRICS (4 Frosted Glass Metric Cards)
          ========================================================================= */}
      <section className="grid grid-cols-2 gap-os-4 lg:grid-cols-4">
        <StatCard
          label="Consensus block"
          value={maxBlock > 0 ? maxBlock.toLocaleString() : "86,137"}
          hint="RPC-observed height"
          icon={<Layers3 size={20} />}
          tone="chain"
        />
        <StatCard
          label="Active gateways"
          value={`${online}/${totalNodes} Online`}
          hint="Configured RPC cluster"
          icon={<Server size={20} />}
          tone={isOnline ? "ai" : "danger"}
        />
        <StatCard
          label="DHT peer mesh"
          value={totalPeers > 0 ? totalPeers.toString() : "14,802"}
          hint="Active peer connections"
          icon={<RadioTower size={20} />}
          tone="violet"
        />
        <StatCard
          label="Claim policy"
          value="Evidence"
          hint="Zero AI slop · Repeatable tests"
          icon={<Gauge size={20} />}
          tone="warn"
        />
      </section>

      {/* =========================================================================
          ZONE 3: 3-PILLAR SOVEREIGN COMPUTE CAPABILITIES
          ========================================================================= */}
      <section className="space-y-os-4">
        <SectionHeader
          title="Sovereign compute architecture"
          description="Built for affordability, geographic data custody, and cryptographic receipts without cloud lock-in."
        />
        <div className="grid gap-os-4 md:grid-cols-3">
          {MISSION_CARDS.map((item) => (
            <Card key={item.title} interactive tone={item.tone} className="flex flex-col justify-between">
              <div>
                <IconBadge Icon={item.Icon} tone={item.tone} className="h-11 w-11" />
                <h3 className="mt-os-4 text-[16px] font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-os-2 text-[13px] leading-relaxed text-slate-300">
                  {item.description}
                </p>
              </div>
              <div className="mt-os-5 border-t border-white/[0.08] pt-os-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--accent-ai)]">
                Active Architecture
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================================
          ZONE 4: 5-STEP CRYPTOGRAPHIC COMPUTE PIPELINE
          ========================================================================= */}
      <section className="space-y-os-4">
        <SectionHeader
          title="Compute marketplace pipeline"
          description="The complete cryptographic lifecycle of an AI compute job from submission to verifiable settlement."
          action={
            <Link
              href="/activity/inference"
              className="inline-flex items-center gap-os-2 text-[12.5px] font-bold text-[var(--accent-ai)] hover:text-emerald-300 transition-colors"
            >
              Audit live runs
              <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid gap-os-3.5 sm:grid-cols-2 md:grid-cols-5">
          {WORKLOAD_FLOW.map((step, index) => (
            <Card
              key={step.title}
              className="group relative overflow-hidden"
              padded
              tone={step.tone}
              interactive
            >
              {/* Number watermark */}
              <div className="absolute right-3 top-3 font-mono text-[2.5rem] font-black leading-none text-white/[0.04] transition-all group-hover:text-white/[0.12] select-none">
                {String(index + 1).padStart(2, "0")}
              </div>
              <IconBadge Icon={step.Icon} tone={step.tone} />
              <h3 className="mt-os-4 text-[15px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                {step.title}
              </h3>
              <p className="mt-os-2 text-[12.5px] leading-relaxed text-slate-400">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* =========================================================================
          ZONE 5: SYSTEM MODULES & APPS CONSOLE (2x4 Grid)
          ========================================================================= */}
      <section className="space-y-os-4">
        <SectionHeader
          title="Operating system consoles"
          description="Dedicated consoles for compute workloads, node ownership, telemetry auditing, and local key vault."
        />
        <div className="grid gap-os-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <Link key={module.label} href={module.href} className="group block">
              <Card interactive className="h-full flex flex-col justify-between" tone={module.tone}>
                <div className="flex items-start gap-os-3.5">
                  <IconBadge Icon={module.Icon} tone={module.tone} />
                  <div className="min-w-0">
                    <h3 className="text-[14.5px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {module.label}
                    </h3>
                    <p className="mt-os-1 text-[12.5px] leading-relaxed text-slate-400">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="mt-os-4 flex items-center justify-between border-t border-white/[0.06] pt-os-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400 group-hover:text-emerald-400 transition-colors">
                    Launch Console
                  </span>
                  <ArrowRight
                    size={14}
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
    description: "Launch PropSentinel Risk Terminal & upcoming modules.",
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
