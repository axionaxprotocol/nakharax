import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  ChevronRight,
  Cpu,
  Droplets,
  Eye,
  Gauge,
  HardDrive,
  Layers3,
  RadioTower,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_NODES, getNodeStatus } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const statuses = await Promise.all(
    DEFAULT_NODES.map((ep) => getNodeStatus(ep, { timeoutMs: 2_000 })),
  );
  const online = statuses.filter((s) => s.online).length;
  const totalPeers = statuses.reduce((a, s) => a + (s.peerCount ?? 0), 0);
  const maxBlock = statuses.reduce(
    (a, s) => Math.max(a, s.blockNumber ?? 0),
    0,
  );
  const totalNodes = statuses.length;
  const isOnline = online > 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── Header row ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight text-[var(--text-strong)]">
            Network Overview
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
            Live status of the Nakharax testnet
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hair)] bg-[var(--panel)] px-3 py-1.5 shadow-[var(--shadow-sm)]">
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-zinc-400"}`}
              />
            </span>
            <span
              className={`text-[11px] font-semibold tracking-wide ${isOnline ? "text-emerald-600" : "text-zinc-500"}`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair)] bg-[var(--panel)] px-3 py-1.5 text-[11px] font-mono text-[var(--text-muted)] shadow-[var(--shadow-sm)]">
            Chain{" "}
            <span className="font-semibold text-[var(--text-strong)]">86137</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-600">
            Testnet
          </span>
        </div>
      </div>

      {/* ── Metric cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Block Height"
          value={maxBlock.toLocaleString()}
          Icon={Layers3}
          accent="emerald"
          featured
        />
        <MetricCard
          label="Validators"
          value={`${online}/${totalNodes}`}
          Icon={Shield}
          accent="cyan"
        />
        <MetricCard
          label="Connected Peers"
          value={totalPeers.toString()}
          Icon={RadioTower}
          accent="violet"
        />
        <MetricCard
          label="Block Time"
          value="~5s"
          Icon={Gauge}
          accent="amber"
        />
      </div>

      {/* ── Activity + System ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Chain Activity"
          Icon={Activity}
          accent="emerald"
          href="/activity"
        >
          <div className="divide-y divide-[var(--hair)]">
            <EventRow
              color="emerald"
              icon={<Zap size={14} />}
              title="Block produced"
              detail={`#${maxBlock.toLocaleString()}`}
              time="just now"
            />
            <EventRow
              color="amber"
              icon={<Wallet size={14} />}
              title="Worker rewarded"
              detail="+0.42 NAK"
              time="2m ago"
            />
            <EventRow
              color="cyan"
              icon={<Shield size={14} />}
              title="Validator confirmed"
              detail="EU node"
              time="5m ago"
            />
            <EventRow
              color="violet"
              icon={<Cpu size={14} />}
              title="Job submitted"
              detail="batch-inference-042"
              time="12m ago"
            />
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="System"
          Icon={Server}
          accent="cyan"
          href="/settings"
          linkLabel="Settings"
        >
          <div className="space-y-5 p-5">
            <ResourceBar label="CPU" value={32} detail="32%" color="emerald" />
            <ResourceBar
              label="Memory"
              value={72}
              detail="5.8 / 8 GB"
              color="cyan"
            />
            <ResourceBar
              label="Disk"
              value={21}
              detail="1.7 / 8 TB"
              color="violet"
            />
            <div className="flex items-center justify-between rounded-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-mono font-medium text-[var(--text)]">
                  HAILO-NPU
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                4 GB available
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Modules ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Modules
          </span>
          <div className="h-px flex-1 bg-[var(--hair)]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <ModuleTile key={mod.label} mod={mod} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════════════════ */

interface Module {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  accent: string;
  iconBg: string;
}

const MODULES: Module[] = [
  { href: "/nodes", label: "Nodes", desc: "Monitor validators & RPC", Icon: Server, accent: "text-emerald-600", iconBg: "bg-emerald-500/10" },
  { href: "/jobs", label: "Jobs", desc: "Compute job queue", Icon: Briefcase, accent: "text-amber-600", iconBg: "bg-amber-500/10" },
  { href: "/wallet", label: "Wallet", desc: "NAK balance & transfers", Icon: Wallet, accent: "text-orange-600", iconBg: "bg-orange-500/10" },
  { href: "/activity", label: "Activity", desc: "Chain & worker events", Icon: Activity, accent: "text-cyan-600", iconBg: "bg-cyan-500/10" },
  { href: "/apps", label: "Explorer", desc: "Browse blocks & txns", Icon: Eye, accent: "text-blue-600", iconBg: "bg-blue-500/10" },
  { href: "/apps", label: "Faucet", desc: "Get testnet NAK", Icon: Droplets, accent: "text-teal-600", iconBg: "bg-teal-500/10" },
  { href: "/logs", label: "Logs", desc: "Node & system logs", Icon: Terminal, accent: "text-lime-600", iconBg: "bg-lime-500/10" },
  { href: "/apps", label: "AI Hub", desc: "Models & inference", Icon: Sparkles, accent: "text-violet-600", iconBg: "bg-violet-500/10" },
  { href: "/apps", label: "Network", desc: "P2P topology", Icon: Wifi, accent: "text-sky-600", iconBg: "bg-sky-500/10" },
  { href: "/apps", label: "Sentinel", desc: "Security monitoring", Icon: Shield, accent: "text-rose-600", iconBg: "bg-rose-500/10" },
  { href: "/apps", label: "Storage", desc: "DA & file management", Icon: HardDrive, accent: "text-slate-600", iconBg: "bg-slate-500/10" },
  { href: "/settings", label: "Settings", desc: "Node configuration", Icon: Settings, accent: "text-zinc-600", iconBg: "bg-zinc-500/10" },
];

/* ═══════════════════════════════════════════════════════════════════════
   Components
   ═══════════════════════════════════════════════════════════════════════ */

const ACCENT = {
  emerald: {
    text: "text-emerald-600",
    bg: "bg-emerald-500/10",
    bar: "from-emerald-500 to-emerald-400",
    line: "via-emerald-500/60",
  },
  cyan: {
    text: "text-cyan-600",
    bg: "bg-cyan-500/10",
    bar: "from-cyan-500 to-cyan-400",
    line: "via-cyan-500/60",
  },
  violet: {
    text: "text-violet-600",
    bg: "bg-violet-500/10",
    bar: "from-violet-500 to-violet-400",
    line: "via-violet-500/60",
  },
  amber: {
    text: "text-amber-600",
    bg: "bg-amber-500/10",
    bar: "from-amber-500 to-amber-400",
    line: "via-amber-500/60",
  },
} as const;

function MetricCard({
  label,
  value,
  Icon,
  accent,
  featured,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
  accent: keyof typeof ACCENT;
  featured?: boolean;
}) {
  const c = ACCENT[accent];
  return (
    <div className="group relative overflow-hidden rounded-xl border border-[var(--hair)] bg-[var(--panel)] p-5 shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raise">
      <div
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent ${c.line} to-transparent`}
      />
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${c.bg}`}>
          <Icon size={15} className={c.text} strokeWidth={2} />
        </div>
      </div>
      <div
        className={`mt-3 font-mono font-bold tabular-nums text-[var(--text-strong)] ${featured ? "text-[2rem] leading-none" : "text-2xl leading-none"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Panel({
  children,
  className = "",
  title,
  Icon,
  accent,
  href,
  linkLabel = "View all",
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  Icon: LucideIcon;
  accent: "emerald" | "cyan";
  href: string;
  linkLabel?: string;
}) {
  const c = ACCENT[accent];
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--hair)] bg-[var(--panel)] shadow-[var(--shadow-panel)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--hair)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className={`grid h-7 w-7 place-items-center rounded-lg ${c.bg}`}>
            <Icon size={14} className={c.text} />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-strong)]">
            {title}
          </span>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
        >
          {linkLabel} <ArrowUpRight size={11} />
        </Link>
      </div>
      {children}
    </div>
  );
}

const EVENT_COLORS = {
  emerald: { text: "text-emerald-600", bg: "bg-emerald-500/10" },
  cyan: { text: "text-cyan-600", bg: "bg-cyan-500/10" },
  violet: { text: "text-violet-600", bg: "bg-violet-500/10" },
  amber: { text: "text-amber-600", bg: "bg-amber-500/10" },
} as const;

function EventRow({
  color,
  icon,
  title,
  detail,
  time,
}: {
  color: keyof typeof EVENT_COLORS;
  icon: React.ReactNode;
  title: string;
  detail: string;
  time: string;
}) {
  const c = EVENT_COLORS[color];
  return (
    <div className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[var(--panel-sunken)]">
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${c.bg}`}
      >
        <span className={c.text}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-[var(--text-strong)]">
          {title}
        </span>
      </div>
      <span className="shrink-0 text-[12px] font-mono text-[var(--text)]">
        {detail}
      </span>
      <span className="w-14 shrink-0 text-right text-[11px] font-mono text-[var(--text-faint)]">
        {time}
      </span>
    </div>
  );
}

function ResourceBar({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number;
  detail: string;
  color: "emerald" | "cyan" | "violet";
}) {
  const c = ACCENT[color];
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--text)]">
          {label}
        </span>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {detail}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ModuleTile({ mod }: { mod: Module }) {
  return (
    <Link
      href={mod.href}
      className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-[var(--hair)] bg-[var(--panel)] px-4 py-3.5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--hair-strong)] hover:shadow-[var(--shadow-panel)]"
    >
      <div
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${mod.iconBg} transition-transform duration-200 group-hover:scale-[1.06]`}
      >
        <mod.Icon size={17} className={mod.accent} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[var(--text-strong)]">
          {mod.label}
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
          {mod.desc}
        </div>
      </div>
      <ChevronRight
        size={14}
        className="shrink-0 text-[var(--text-faint)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--text-muted)]"
      />
    </Link>
  );
}
