import Link from "next/link";
import {
  Boxes,
  Cpu,
  Droplets,
  Eye,
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
  state: "live" | "demo";
  href?: string;
};

const APPS: App[] = [
  {
    id: "propsentinel",
    name: "PropSentinel Risk",
    desc: "Live route. Opens telemetry, drawdown limits, kill-switch events, and account risk monitoring.",
    icon: Skull,
    tone: "danger",
    state: "live",
    href: "/apps/propsentinel",
  },
  {
    id: "worker",
    name: "DeAI Worker",
    desc: "Demo card only. Worker install/config flow is not wired to node services yet.",
    icon: Cpu,
    tone: "ai",
    state: "demo",
  },
  {
    id: "sentinel",
    name: "Hydra Sentinel",
    desc: "Demo card only. Abuse control and quota safety need service bindings before launch.",
    icon: Shield,
    tone: "violet",
    state: "demo",
  },
  {
    id: "explorer",
    name: "Block Explorer",
    desc: "Demo card only. Explorer route is not implemented yet.",
    icon: Eye,
    tone: "chain",
    state: "demo",
  },
  {
    id: "faucet",
    name: "Testnet Faucet",
    desc: "Demo card only. Faucet backend and rate limits are not connected yet.",
    icon: Droplets,
    tone: "warn",
    state: "demo",
  },
  {
    id: "router",
    name: "ASR Router",
    desc: "Demo card only. Routing policy editor is not connected to worker assignment yet.",
    icon: Workflow,
    tone: "chain",
    state: "demo",
  },
];

export default function AppsPage() {
  const liveCount = APPS.filter((app) => app.state === "live").length;
  const demoCount = APPS.filter((app) => app.state === "demo").length;

  return (
    <PageShell
      eyebrow="Node Modules"
      title="Only launch what is wired. Demo cards are explicitly marked."
      description="This page now avoids fake install/config actions. Live modules have a route; unavailable modules are clearly marked as demo-only."
      meta={
        <>
          <StatusPill tone="ai">{liveCount} live</StatusPill>
          <StatusPill tone="warn">{demoCount} demo</StatusPill>
        </>
      }
    >
      <section className="space-y-os-4">
        <SectionHeader
          title="Available modules"
          description="Cards without a working route are informational only and not clickable."
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
              {app.state}
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
            Demo only
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
