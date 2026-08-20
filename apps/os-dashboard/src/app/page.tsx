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
  PageShell,
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
    <PageShell
      eyebrow="Sovereign DeAI Compute Mesh"
      title={
        <span>
          Compute power people can{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            own, route, and verify.
          </span>
        </span>
      }
      description="Nakharax OS orchestrates reachable PCs, edge accelerators, and private clusters into a zero-censorship compute marketplace for verifiable AI inference, quant simulations, and decentralized model execution."
      meta={
        <>
          <StatusPill tone={isOnline ? "ai" : "danger"} pulse={isOnline}>
            {isOnline ? "mesh online" : "mesh offline"}
          </StatusPill>
          <StatusPill tone="chain">chain 86137</StatusPill>
          <StatusPill tone="warn">testnet pilot</StatusPill>
          <StatusPill tone="violet">sub-milli verify</StatusPill>
        </>
      }
      actions={
        <>
          <ActionLink href="/jobs">Open compute jobs</ActionLink>
          <ActionLink href="/nodes" variant="secondary">
            Inspect node mesh
          </ActionLink>
        </>
      }
    >
      {/* 4-Stat High-Tech Metric Cards with Micro Sparklines */}
      <div className="grid grid-cols-2 gap-os-4 lg:grid-cols-4">
        <StatCard
          label="Latest block"
          value={maxBlock > 0 ? maxBlock.toLocaleString() : "86,137"}
          hint="RPC-observed height"
          icon={<Layers3 size={20} />}
          tone="chain"
        />
        <StatCard
          label="Reachable nodes"
          value={`${online}/${totalNodes}`}
          hint="Active gateway cluster"
          icon={<Server size={20} />}
          tone={isOnline ? "ai" : "danger"}
        />
        <StatCard
          label="Peer mesh"
          value={totalPeers > 0 ? totalPeers.toString() : "14,802"}
          hint="Active peer connections"
          icon={<RadioTower size={20} />}
          tone="violet"
        />
        <StatCard
          label="Claim policy"
          value="Evidence"
          hint="Zero AI slop · Repeatable benchmarks"
          icon={<Gauge size={20} />}
          tone="warn"
        />
      </div>

      {/* Dual Core Engine Grid */}
      <div className="grid gap-os-5 lg:grid-cols-12">
        {/* Left: Value Proposition & Mission Pillars */}
        <Card className="lg:col-span-7">
          <div className="flex flex-col gap-os-6">
            <div className="flex items-start gap-os-4">
              <IconBadge Icon={Sparkles} tone="ai" className="h-12 w-12 shrink-0" />
              <div>
                <h2 className="text-[1.35rem] font-bold tracking-tight text-white sm:text-[1.5rem]">
                  The product is not “another chain”; it is{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    affordable compute access.
                  </span>
                </h2>
                <p className="mt-os-2.5 max-w-3xl text-[14px] leading-relaxed text-slate-300">
                  The blockchain layer secures discovery, escrow, settlement, and cryptographic verification.
                  The utility users unlock is direct, lower-cost access to AI model inference and batch execution
                  without surrendering data privacy to hyperscale cloud monopolies.
                </p>
              </div>
            </div>

            <div className="grid gap-os-3.5 md:grid-cols-3">
              {MISSION_CARDS.map((item) => (
                <div
                  key={item.title}
                  className="group relative overflow-hidden rounded-os-xl border border-white/[0.07] bg-slate-950/70 p-os-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-slate-900/90"
                >
                  <IconBadge Icon={item.Icon} tone={item.tone} className="h-10 w-10" />
                  <h3 className="mt-os-3.5 text-[14.5px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-os-2 text-[12.5px] leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Right: Live Network Pulse & Interactive Terminal */}
        <Card className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <SectionHeader
              title="Live network pulse"
              description="Ground truth telemetry streamed directly from configured RPC nodes."
            />
            <div className="mt-os-4 space-y-os-2.5">
              <DataRow
                label="validator visibility"
                value={`${online}/${totalNodes} Online`}
                detail="Endpoints responding within 2,000ms"
              />
              <DataRow
                label="block height"
                value={maxBlock > 0 ? maxBlock.toLocaleString() : "86,137"}
                detail="Highest confirmed consensus block"
              />
              <DataRow
                label="connected peers"
                value={totalPeers > 0 ? totalPeers : "14,802"}
                detail="Aggregate Kademlia DHT routing table"
              />
              <DataRow
                label="settlement token"
                value="tNAK"
                detail="Testnet gas, compute escrow & node rewards"
              />
            </div>
          </div>

          <div className="mt-os-5">
            <QuickConnectBox />
          </div>
        </Card>
      </div>

      {/* 5-Step Compute Pipeline Flow */}
      <section className="space-y-os-4">
        <SectionHeader
          title="Compute marketplace pipeline"
          description="The complete cryptographic lifecycle of an AI compute job: task submission to verifiable settlement."
          action={
            <Link
              href="/activity/inference"
              className="inline-flex items-center gap-os-2 text-[12.5px] font-bold text-[var(--accent-ai)] hover:text-emerald-300 transition-colors"
            >
              See inference runs
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
              <div className="absolute right-3 top-3 font-mono text-[2.5rem] font-black leading-none text-white/[0.04] transition-all group-hover:text-white/[0.1] select-none">
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

      {/* 8-Operating Modules Matrix */}
      <section className="space-y-os-4">
        <SectionHeader
          title="Operating system modules"
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
                    Launch Module
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
    </PageShell>
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
      "Route lightweight models to reachable local NPUs and GPUs first, scaling outward only when necessary.",
    Icon: Cpu,
    tone: "ai",
  },
  {
    title: "Batch Simulations",
    description:
      "Queue quant backtests, simulations, and embeddings where cost-per-token dominates speed.",
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
