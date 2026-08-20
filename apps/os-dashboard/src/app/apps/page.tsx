import {
  Boxes,
  Cpu,
  Droplets,
  Eye,
  Plug,
  Shield,
  Skull,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatusPill,
} from "@/components/card";

type Tone = "ai" | "chain" | "warn" | "danger" | "neutral" | "violet";

type App = {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  state: "live" | "coming_soon";
  href?: string;
};

const APPS: App[] = [
  {
    id: "propsentinel",
    name: "PropSentinel Risk",
    desc: "Live microservice route. Opens telemetry, drawdown limits, kill-switch events, and account risk monitoring.",
    icon: Skull,
    tone: "danger",
    state: "live",
    href: "/apps/propsentinel",
  },
  {
    id: "worker",
    name: "DeAI Worker Config & CLI",
    desc: "CLI Configuration generator. Generates monolith_worker.toml for GPU driver binding and worker daemon launch.",
    icon: Cpu,
    tone: "ai",
    state: "live",
    href: "/apps/worker",
  },
  {
    id: "mcp",
    name: "Universal MCP Skills",
    desc: "Live Agentic Registry. Connect Autonomous Agents to specialized tools, risk brains, and sandboxes via Model Context Protocol.",
    icon: Plug,
    tone: "violet",
    state: "live",
    href: "/apps/mcp",
  },
  {
    id: "sentinel",
    name: "Hydra Sentinel",
    desc: "Coming Soon. Advanced Sybil abuse control, rate limit policies, and validator slashing telemetry.",
    icon: Shield,
    tone: "violet",
    state: "coming_soon",
  },
  {
    id: "explorer",
    name: "Block Explorer",
    desc: "Coming Soon. Dedicated on-chain explorer for transaction traces, block inspection, and contract verification.",
    icon: Eye,
    tone: "chain",
    state: "coming_soon",
  },
  {
    id: "faucet",
    name: "Testnet Faucet",
    desc: "Coming Soon. Interactive faucet UI with captcha validation and automated $tNAK token distribution.",
    icon: Droplets,
    tone: "warn",
    state: "coming_soon",
  },
  {
    id: "router",
    name: "ASR Router & Scheduler",
    desc: "Coming Soon. Visual policy editor for Action-State-Reward model routing and compute task dispatching.",
    icon: Workflow,
    tone: "chain",
    state: "coming_soon",
  },
];

export default function AppsPage() {
  const liveCount = APPS.filter((app) => app.state === "live").length;
  const comingSoonCount = APPS.filter((app) => app.state === "coming_soon").length;

  return (
    <PageShell
      eyebrow="Node Modules & Ecosystem Apps"
      title="Verified live routes and upcoming network modules."
      description="Only live, wired services can be launched. Features currently in active development or testnet staging are clearly marked as Coming Soon."
      meta={
        <>
          <StatusPill tone="ai">{liveCount} live</StatusPill>
          <StatusPill tone="warn">{comingSoonCount} coming soon</StatusPill>
        </>
      }
    >
      <section className="space-y-os-4">
        <SectionHeader
          title="Available & upcoming modules"
          description="Click to launch live microservices. Upcoming modules are listed for roadmap transparency."
        />
        <div className="grid grid-cols-1 gap-os-4 md:grid-cols-2 xl:grid-cols-3">
          {APPS.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function AppCard({ app }: { app: App }) {
  const Icon = app.icon;
  const content = (
    <Card interactive={app.state === "live"} className="group flex h-full flex-col">
      <div className="flex flex-1 items-start gap-os-4">
        <IconBadge Icon={Icon} tone={app.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-os-2">
            <h2 className="truncate text-title font-semibold text-[var(--text-strong)]">
              {app.name}
            </h2>
            <StatusPill tone={app.state === "live" ? "ai" : "warn"}>
              {app.state === "live" ? "live" : "coming soon"}
            </StatusPill>
          </div>
          <p className="mt-os-2 text-body leading-relaxed text-[var(--text-muted)]">
            {app.desc}
          </p>
        </div>
      </div>
      <div className="mt-os-5 flex justify-end border-t border-[var(--hair)] pt-os-3">
        {app.state === "live" ? (
          <span className="inline-flex items-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors group-hover:bg-[var(--panel-hover)]">
            Launch
            <Boxes size={13} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-os-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-os-4 py-os-2 text-[11px] font-semibold text-[var(--accent-warn)]">
            Coming Soon
            <Boxes size={13} />
          </span>
        )}
      </div>
    </Card>
  );

  return app.href ? (
    <Link href={app.href} className="block h-full">
      {content}
    </Link>
  ) : (
    <div className="h-full">{content}</div>
  );
}
