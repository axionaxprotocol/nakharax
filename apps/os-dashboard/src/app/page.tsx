import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
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
  const maxBlock = statuses.reduce((a, s) => Math.max(a, s.blockNumber ?? 0), 0);
  const totalNodes = statuses.length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip
          color="emerald"
          label="Chain"
          value={online > 0 ? "Synced" : "Offline"}
          pulse={online > 0}
        />
        <StatusChip color="cyan" label="Chain ID" value="86137" />
        <StatusChip color="amber" label="Network" value="Testnet" />
        <div className="ml-auto text-[11px] font-mono text-zinc-600">
          nakharax-node v1.9.0
        </div>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Latest Block"
          value={maxBlock.toLocaleString()}
          subtitle="height"
          Icon={Layers3}
          accent="emerald"
          large
        />
        <MetricCard
          label="Validators"
          value={`${online}`}
          subtitle={`of ${totalNodes} online`}
          Icon={Shield}
          accent="cyan"
        />
        <MetricCard
          label="Connected Peers"
          value={totalPeers.toString()}
          subtitle="p2p network"
          Icon={RadioTower}
          accent="violet"
        />
        <MetricCard
          label="Block Time"
          value="~5s"
          subtitle="avg finality"
          Icon={Gauge}
          accent="amber"
        />
      </div>

      {/* Two-column: Chain + System */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Chain overview — wider */}
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10">
                <Activity size={14} className="text-emerald-400" />
              </div>
              <span className="text-[13px] font-medium text-zinc-300">Chain Activity</span>
            </div>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              View all <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            <EventRow
              icon={<Zap size={13} className="text-emerald-400" />}
              title="Block produced"
              detail={`#${maxBlock.toLocaleString()}`}
              time="just now"
            />
            <EventRow
              icon={<Wallet size={13} className="text-amber-400" />}
              title="Worker rewarded"
              detail="+0.42 NAK"
              time="2m ago"
            />
            <EventRow
              icon={<Shield size={13} className="text-cyan-400" />}
              title="Validator confirmed"
              detail="EU node"
              time="5m ago"
            />
            <EventRow
              icon={<Cpu size={13} className="text-violet-400" />}
              title="Job submitted"
              detail="batch-inference-042"
              time="12m ago"
            />
          </div>
        </div>

        {/* System resources — narrower */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-500/10">
                <Server size={14} className="text-cyan-400" />
              </div>
              <span className="text-[13px] font-medium text-zinc-300">System</span>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Settings <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="p-5 space-y-4">
            <ResourceBar label="CPU" value={32} unit="%" color="emerald" />
            <ResourceBar label="Memory" value={72} unit="5.8 / 8 GB" color="cyan" />
            <ResourceBar label="Disk" value={21} unit="1.7 / 8 TB" color="violet" />
            <div className="mt-1 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                <span className="text-[12px] font-mono text-zinc-400">HAILO-NPU</span>
              </div>
              <span className="text-[12px] font-mono text-zinc-500">4 GB available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Modules</span>
          <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <ModuleTile key={mod.label} mod={mod} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Types & data                                                              */
/* -------------------------------------------------------------------------- */

interface Module {
  href: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
  accent: string;
  iconBg: string;
}

const MODULES: Module[] = [
  { href: "/nodes", label: "Nodes", desc: "Monitor validators & RPC", Icon: Server, accent: "text-emerald-400", iconBg: "bg-emerald-500/10" },
  { href: "/jobs", label: "Jobs", desc: "Compute job queue", Icon: Briefcase, accent: "text-amber-400", iconBg: "bg-amber-500/10" },
  { href: "/wallet", label: "Wallet", desc: "NAK balance & transfers", Icon: Wallet, accent: "text-orange-400", iconBg: "bg-orange-500/10" },
  { href: "/activity", label: "Activity", desc: "Chain & worker events", Icon: Activity, accent: "text-cyan-400", iconBg: "bg-cyan-500/10" },
  { href: "/apps", label: "Explorer", desc: "Browse blocks & txns", Icon: Eye, accent: "text-blue-400", iconBg: "bg-blue-500/10" },
  { href: "/apps", label: "Faucet", desc: "Get testnet NAK", Icon: Droplets, accent: "text-teal-400", iconBg: "bg-teal-500/10" },
  { href: "/logs", label: "Logs", desc: "Node & system logs", Icon: Terminal, accent: "text-lime-400", iconBg: "bg-lime-500/10" },
  { href: "/apps", label: "AI Hub", desc: "Models & inference", Icon: Sparkles, accent: "text-violet-400", iconBg: "bg-violet-500/10" },
  { href: "/apps", label: "Network", desc: "P2P topology", Icon: Wifi, accent: "text-sky-400", iconBg: "bg-sky-500/10" },
  { href: "/apps", label: "Sentinel", desc: "Security monitoring", Icon: Shield, accent: "text-rose-400", iconBg: "bg-rose-500/10" },
  { href: "/apps", label: "Storage", desc: "DA & file management", Icon: HardDrive, accent: "text-slate-400", iconBg: "bg-slate-500/10" },
  { href: "/settings", label: "Settings", desc: "Node configuration", Icon: Settings, accent: "text-zinc-400", iconBg: "bg-zinc-500/10" },
];

/* -------------------------------------------------------------------------- */
/*  Components                                                                */
/* -------------------------------------------------------------------------- */

function StatusChip({
  color,
  label,
  value,
  pulse,
}: {
  color: "emerald" | "cyan" | "amber";
  label: string;
  value: string;
  pulse?: boolean;
}) {
  const dotColor = {
    emerald: "bg-emerald-400",
    cyan: "bg-cyan-400",
    amber: "bg-amber-400",
  }[color];

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? "animate-pulse-glow" : ""}`} />
      <span className="text-[11px] font-mono text-zinc-500">{label}</span>
      <span className="text-[11px] font-mono font-medium text-zinc-300">{value}</span>
    </div>
  );
}

const ACCENT_COLORS = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-[0_0_20px_rgba(52,211,153,0.08)]" },
  cyan: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "shadow-[0_0_20px_rgba(34,211,238,0.08)]" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", glow: "shadow-[0_0_20px_rgba(167,139,250,0.08)]" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-[0_0_20px_rgba(251,191,36,0.08)]" },
};

function MetricCard({
  label,
  value,
  subtitle,
  Icon,
  accent,
  large,
}: {
  label: string;
  value: string;
  subtitle: string;
  Icon: LucideIcon;
  accent: keyof typeof ACCENT_COLORS;
  large?: boolean;
}) {
  const c = ACCENT_COLORS[accent];
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.03] ${c.glow}`}>
      <div className="absolute right-0 top-0 h-px w-1/2 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${c.bg}`}>
          <Icon size={15} className={c.text} />
        </div>
      </div>
      <div className={`mt-3 font-mono font-semibold tabular-nums text-zinc-100 ${large ? "text-[2rem] leading-none" : "text-[1.5rem] leading-none"}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[12px] font-mono text-zinc-500">{subtitle}</div>
    </div>
  );
}

function EventRow({
  icon,
  title,
  detail,
  time,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.015]">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.04]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-zinc-300">{title}</div>
      </div>
      <span className="shrink-0 text-[12px] font-mono text-zinc-400">{detail}</span>
      <span className="shrink-0 text-[11px] font-mono text-zinc-600">{time}</span>
    </div>
  );
}

function ResourceBar({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: "emerald" | "cyan" | "violet";
}) {
  const barColor = {
    emerald: "bg-emerald-500",
    cyan: "bg-cyan-500",
    violet: "bg-violet-500",
  }[color];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-mono text-zinc-400">{label}</span>
        <span className="text-[11px] font-mono text-zinc-500">{unit}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
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
      className="group relative flex items-start gap-3.5 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.035] hover:-translate-y-0.5"
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${mod.iconBg} transition-transform duration-200 group-hover:scale-105`}>
        <mod.Icon size={18} className={mod.accent} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 pt-0.5">
        <div className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors">
          {mod.label}
        </div>
        <div className="mt-0.5 text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">
          {mod.desc}
        </div>
      </div>
    </Link>
  );
}
