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
      eyebrow="Sovereign DeAI Compute"
      title="Compute power people can own, route, and verify."
      description="Nakharax OS turns reachable PCs, edge boxes, and private clusters into a local-first compute marketplace for inference, simulation, and sovereign AI workloads."
      meta={
        <>
          <StatusPill tone={isOnline ? "ai" : "danger"} pulse={isOnline}>
            {isOnline ? "mesh online" : "mesh offline"}
          </StatusPill>
          <StatusPill tone="chain">chain 86137</StatusPill>
          <StatusPill tone="warn">testnet</StatusPill>
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
      <div className="grid grid-cols-2 gap-os-4 lg:grid-cols-4">
        <StatCard
          label="Latest block"
          value={maxBlock.toLocaleString()}
          hint="RPC-observed height"
          icon={<Layers3 size={18} />}
          tone="chain"
        />
        <StatCard
          label="Reachable nodes"
          value={`${online}/${totalNodes}`}
          hint="Configured gateways"
          icon={<Server size={18} />}
          tone={isOnline ? "ai" : "danger"}
        />
        <StatCard
          label="Peer mesh"
          value={totalPeers.toString()}
          hint="Live peer count"
          icon={<RadioTower size={18} />}
          tone="violet"
        />
        <StatCard
          label="Claim policy"
          value="evidence"
          hint="Public TPS claims need repeatable benchmarks"
          icon={<Gauge size={18} />}
          tone="warn"
        />
      </div>

      <div className="grid gap-os-5 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex flex-col gap-os-6">
            <div className="flex items-start gap-os-4">
              <IconBadge Icon={Sparkles} tone="ai" className="h-12 w-12" />
              <div>
                <h2 className="text-[1.35rem] font-semibold tracking-tight text-[var(--text-strong)]">
                  The product is not “another chain”; it is affordable compute access.
                </h2>
                <p className="mt-os-2 max-w-3xl text-body leading-relaxed text-[var(--text-muted)]">
                  The chain secures discovery, escrow, settlement, and verification.
                  The value users feel is lower-friction access to inference and
                  batch compute without surrendering every workload to hyperscale clouds.
                </p>
              </div>
            </div>

            <div className="grid gap-os-3 md:grid-cols-3">
              {MISSION_CARDS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-os-xl border border-[var(--hair)] bg-[var(--panel-sunken)] p-os-4"
                >
                  <IconBadge Icon={item.Icon} tone={item.tone} className="h-9 w-9" />
                  <h3 className="mt-os-3 text-title font-semibold text-[var(--text-strong)]">
                    {item.title}
                  </h3>
                  <p className="mt-os-2 text-caption leading-relaxed text-[var(--text-muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <SectionHeader
            title="Live network pulse"
            description="Ground truth from configured RPC endpoints."
          />
          <div className="mt-os-4 space-y-os-3">
            <DataRow
              label="validator visibility"
              value={`${online}/${totalNodes}`}
              detail="Endpoints responding before timeout"
            />
            <DataRow
              label="block height"
              value={maxBlock.toLocaleString()}
              detail="Highest observed configured node"
            />
            <DataRow
              label="connected peers"
              value={totalPeers}
              detail="Reported peer count aggregate"
            />
            <DataRow
              label="settlement token"
              value="NAK"
              detail="Native unit for compute escrow and rewards"
            />
          </div>
        </Card>
      </div>

      <section className="space-y-os-4">
        <SectionHeader
          title="Compute marketplace flow"
          description="The UI now explains the product path users actually buy: work in, verified output out."
          action={
            <Link
              href="/activity/inference"
              className="inline-flex items-center gap-os-2 text-caption font-semibold text-[var(--accent-ai)]"
            >
              See inference runs
              <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid gap-os-3 md:grid-cols-5">
          {WORKLOAD_FLOW.map((step, index) => (
            <Card key={step.title} className="relative overflow-hidden" padded>
              <div className="absolute right-4 top-4 font-mono text-[2.75rem] font-semibold leading-none text-[var(--track)]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <IconBadge Icon={step.Icon} tone={step.tone} />
              <h3 className="mt-os-4 text-title font-semibold text-[var(--text-strong)]">
                {step.title}
              </h3>
              <p className="mt-os-2 text-caption leading-relaxed text-[var(--text-muted)]">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-os-4">
        <SectionHeader
          title="Operating modules"
          description="Every screen is now organized around compute, verification, node ownership, and settlement."
        />
        <div className="grid gap-os-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => (
            <Link key={module.label} href={module.href} className="group block">
              <Card interactive className="h-full">
                <div className="flex items-start gap-os-3">
                  <IconBadge Icon={module.Icon} tone={module.tone} />
                  <div className="min-w-0">
                    <h3 className="text-title font-semibold text-[var(--text-strong)]">
                      {module.label}
                    </h3>
                    <p className="mt-os-1 text-caption leading-relaxed text-[var(--text-muted)]">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="mt-os-4 flex items-center justify-between border-t border-[var(--hair)] pt-os-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Open
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-[var(--text-muted)] transition-transform group-hover:translate-x-1"
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
    title: "Edge inference",
    description:
      "Route lightweight models to local devices first, then scale outward only when needed.",
    Icon: Cpu,
    tone: "ai",
  },
  {
    title: "Research batches",
    description:
      "Support queued simulation and batch workloads where price matters more than hyperscale convenience.",
    Icon: Brain,
    tone: "violet",
  },
  {
    title: "Sovereign routing",
    description:
      "Keep sensitive workloads inside chosen geographies or operator-controlled infrastructure.",
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
    title: "Discover",
    description: "Find workers by capability, latency, price, and data boundary.",
    Icon: Route,
    tone: "chain",
  },
  {
    title: "Escrow",
    description: "Lock NAK against an agreed job spec before work begins.",
    Icon: Wallet,
    tone: "warn",
  },
  {
    title: "Execute",
    description: "Run inference, simulation, or batch jobs on matched workers.",
    Icon: Zap,
    tone: "ai",
  },
  {
    title: "Verify",
    description: "Check receipts, outputs, and anomaly signals before settlement.",
    Icon: ShieldCheck,
    tone: "violet",
  },
  {
    title: "Settle",
    description: "Release rewards to useful compute and record auditable activity.",
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
    label: "Compute jobs",
    description: "Submit, inspect, and route AI workloads.",
    Icon: Briefcase,
    tone: "ai",
  },
  {
    href: "/activity/models",
    label: "Model registry",
    description: "See deployable LLM, vision, audio, and embedding models.",
    Icon: Brain,
    tone: "violet",
  },
  {
    href: "/nodes",
    label: "Node mesh",
    description: "Monitor gateways, peers, height, and DHT routing.",
    Icon: Server,
    tone: "chain",
  },
  {
    href: "/apps",
    label: "Modules",
    description: "Open live modules and clearly marked demo modules.",
    Icon: Sparkles,
    tone: "warn",
  },
  {
    href: "/wallet",
    label: "Vault",
    description: "Read balance and create demo transfer receipts.",
    Icon: Wallet,
    tone: "ai",
  },
  {
    href: "/activity",
    label: "Activity",
    description: "Audit chain events and worker receipts.",
    Icon: Activity,
    tone: "chain",
  },
  {
    href: "/logs",
    label: "Logs",
    description: "Tail local node and synthetic runtime events.",
    Icon: Terminal,
    tone: "neutral",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Configure RPC, network parameters, and bootnodes.",
    Icon: HardDrive,
    tone: "neutral",
  },
];
