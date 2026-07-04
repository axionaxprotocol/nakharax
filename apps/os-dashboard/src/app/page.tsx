import Link from "next/link";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleDot,
  Cpu,
  Droplets,
  Eye,
  Gauge,
  HardDrive,
  Layers3,
  RadioTower,
  Server,
  Shield,
  Sparkles,
  Wallet,
  Wifi,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_NODES, getNodeStatus } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AppTone = "ai" | "chain" | "warn" | "danger" | "neutral";

interface LauncherApp {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: string;
  tone: AppTone;
}

const APP_LAUNCHER: readonly LauncherApp[] = [
  { href: "/apps", label: "Worker", Icon: Cpu, color: "text-[#29F06A] bg-[#29F06A]/10", tone: "ai" },
  { href: "/apps", label: "Sentinel", Icon: Shield, color: "text-sky-300 bg-sky-400/10", tone: "chain" },
  { href: "/apps", label: "Explorer", Icon: Eye, color: "text-cyan-300 bg-cyan-400/10", tone: "chain" },
  { href: "/apps", label: "Faucet", Icon: Droplets, color: "text-teal-300 bg-teal-400/10", tone: "ai" },
  { href: "/apps", label: "Router", Icon: Workflow, color: "text-[#FF7A1A] bg-[#FF7A1A]/10", tone: "warn" },
  { href: "/wallet", label: "Wallet", Icon: Wallet, color: "text-amber-300 bg-amber-400/10", tone: "warn" },
  { href: "/nodes", label: "Nodes", Icon: Server, color: "text-emerald-300 bg-emerald-400/10", tone: "ai" },
  { href: "/apps", label: "App Store", Icon: Boxes, color: "text-rose-300 bg-rose-400/10", tone: "danger" },
  { href: "/apps", label: "Storage", Icon: HardDrive, color: "text-slate-300 bg-slate-400/10", tone: "neutral" },
  { href: "/activity", label: "Activity", Icon: Activity, color: "text-blue-300 bg-blue-400/10", tone: "chain" },
  { href: "/apps", label: "Network", Icon: Wifi, color: "text-cyan-300 bg-cyan-400/10", tone: "ai" },
  { href: "/apps", label: "AI Hub", Icon: Sparkles, color: "text-lime-300 bg-lime-400/10", tone: "chain" },
];

const CONSENSUS_LANES = [
  { label: "proposal", value: 72 },
  { label: "pre-vote", value: 88 },
  { label: "commit", value: 96 },
  { label: "verify", value: 91 },
];

const NODE_RING = [
  "left-[48%] top-[5%]",
  "left-[75%] top-[18%]",
  "left-[85%] top-[50%]",
  "left-[68%] top-[76%]",
  "left-[36%] top-[80%]",
  "left-[13%] top-[55%]",
  "left-[20%] top-[22%]",
];

export default async function Home() {
  const statuses = await Promise.all(DEFAULT_NODES.map(getNodeStatus));
  const online = statuses.filter((s) => s.online).length;
  const totalPeers = statuses.reduce((a, s) => a + (s.peerCount ?? 0), 0);
  const maxBlock = statuses.reduce((a, s) => Math.max(a, s.blockNumber ?? 0), 0);
  const totalNodes = statuses.length;
  const onlineRatio = totalNodes > 0 ? Math.round((online / totalNodes) * 100) : 0;
  const consensusScore = Math.min(99, Math.max(68, onlineRatio + Math.min(totalPeers, 18)));

  return (
    <div className="space-y-os-8 animate-slide-up">
      <header className="relative overflow-hidden rounded-os-lg border border-white/10 bg-[#080D14]/95 shadow-glass-strong">
        <div className="protocol-grid absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="protocol-sweep absolute inset-x-0 top-0 h-px" aria-hidden="true" />
        <div className="relative grid gap-os-6 p-os-5 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:p-os-8">
          <div className="min-w-0">
            <div className="flex items-center gap-os-4">
              <Image
                src="/brand/nakharax-token.svg"
                alt="Nakharax"
                width={56}
                height={56}
                className="h-14 w-14 rounded-os-lg shadow-[0_0_28px_rgba(41,240,106,0.18)]"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-os-sm border border-[#29F06A]/25 bg-[#29F06A]/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#29F06A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#29F06A] animate-pulse-glow" />
                    Layer 1
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-os-sm border border-[#FF7A1A]/25 bg-[#FF7A1A]/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#FFB17A]">
                    Verifiable compute
                  </span>
                </div>
                <h1 className="mt-os-3 text-[2.15rem] font-mono font-semibold leading-tight tracking-normal text-zinc-50 sm:text-[2.75rem]">
                  NAKHARAX_OS
                </h1>
              </div>
            </div>
            <p className="mt-os-4 max-w-3xl text-[0.95rem] leading-relaxed text-zinc-400">
              Fast consensus, verifiable execution, and distributed compute coordination in one operator console.
            </p>
            <div className="mt-os-6 grid grid-cols-2 gap-os-3 sm:grid-cols-4">
              <HeroMetric label="Block" value={maxBlock.toLocaleString()} Icon={Layers3} tone="green" />
              <HeroMetric label="Health" value={`${consensusScore}%`} Icon={Gauge} tone="orange" />
              <HeroMetric label="Nodes" value={`${online}/${totalNodes}`} Icon={Server} tone="green" />
              <HeroMetric label="Peers" value={totalPeers} Icon={RadioTower} tone="blue" />
            </div>
          </div>
          <ConsensusPanel score={consensusScore} online={online} total={totalNodes} />
        </div>
      </header>

      {/* Live widgets */}
      <section aria-label="System overview">
        <div className="grid grid-cols-1 gap-os-4 lg:grid-cols-3">
          <NetworkWidget
            block={maxBlock}
            online={online}
            total={statuses.length}
            peers={totalPeers}
          />
          <SystemWidget />
          <NotificationsWidget lastBlock={maxBlock} />
        </div>
      </section>

      {/* App launcher */}
      <section aria-label="Applications">
        <SectionDivider label="MODULES" />
        <div className="grid grid-cols-2 gap-os-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {APP_LAUNCHER.map((app, index) => (
            <AppTile key={`${app.label}-${index}`} app={app} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Widgets                                                                   */
/* -------------------------------------------------------------------------- */

function HeroMetric({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  Icon: LucideIcon;
  tone: "green" | "orange" | "blue";
}) {
  const toneClass = {
    green: "text-[#29F06A]",
    orange: "text-[#FFB17A]",
    blue: "text-cyan-300",
  }[tone];

  return (
    <div className="rounded-os-md border border-white/10 bg-white/[0.035] px-os-3 py-os-3">
      <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        {label}
        <Icon size={13} className={toneClass} />
      </div>
      <div className="mt-os-2 truncate font-mono text-title font-semibold tabular-nums text-zinc-100">
        {value}
      </div>
    </div>
  );
}

function ConsensusPanel({
  score,
  online,
  total,
}: {
  score: number;
  online: number;
  total: number;
}) {
  return (
    <div className="relative min-h-[310px] overflow-hidden rounded-os-md border border-white/10 bg-[#0C121B]/80 p-os-5">
      <div className="flex items-start justify-between gap-os-4">
        <div>
          <div className="text-overline uppercase tracking-wider text-zinc-500">Consensus mesh</div>
          <div className="mt-os-1 font-mono text-headline text-zinc-100">Fast finality lane</div>
        </div>
        <div className="rounded-os-sm border border-[#29F06A]/25 bg-[#29F06A]/10 px-2 py-1 font-mono text-caption text-[#29F06A]">
          {score}%
        </div>
      </div>

      <div className="relative mx-auto mt-os-5 h-40 max-w-[330px]" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#29F06A]/25" />
        <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FF7A1A]/20" />
        <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-os-md border border-white/10 bg-white/[0.035]">
          <Image
            src="/brand/nakharax-mark-transparent.svg"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12"
          />
        </div>
        <span className="consensus-orbit absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-[#FF7A1A] shadow-[0_0_14px_rgba(255,122,26,0.65)]" />
        {NODE_RING.map((pos, index) => (
          <span
            key={pos}
            className={`absolute ${pos} h-3 w-3 rounded-full border border-[#29F06A]/50 bg-[#29F06A] shadow-[0_0_12px_rgba(41,240,106,0.55)]`}
            style={{ animationDelay: `${index * 140}ms` }}
          />
        ))}
      </div>

      <div className="mt-os-4 space-y-os-2">
        {CONSENSUS_LANES.map((lane, index) => (
          <div key={lane.label} className="grid grid-cols-[74px_1fr_36px] items-center gap-2">
            <span className="font-mono text-[10px] uppercase text-zinc-500">{lane.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="consensus-bar block h-full rounded-full bg-[#29F06A]"
                style={{ width: `${lane.value}%`, animationDelay: `${index * 120}ms` }}
              />
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-zinc-400">{lane.value}%</span>
          </div>
        ))}
      </div>

      <div className="mt-os-4 flex items-center justify-between border-t border-white/10 pt-os-3 text-caption text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-[#29F06A]" />
          {online}/{total} validators online
        </span>
        <span className="font-mono text-[#FFB17A]">NAK testnet</span>
      </div>
    </div>
  );
}

function NetworkWidget({
  block,
  online,
  total,
  peers,
}: {
  block: number;
  online: number;
  total: number;
  peers: number;
}) {
  return (
    <WidgetShell accent="green" eyebrow="NETWORK_SYNC" Icon={Layers3}>
      <div className="mt-os-2 flex items-end justify-between gap-os-3">
        <div>
          <span className="text-[2rem] font-mono font-bold leading-none tabular-nums text-zinc-100">
          {block.toLocaleString()}
          </span>
          <span className="ml-2 text-micro uppercase text-zinc-500">BLK</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-os-sm border border-[#29F06A]/20 bg-[#29F06A]/10 px-2 py-1 text-micro font-mono text-[#29F06A]">
          <CircleDot size={11} />
          synced
        </span>
      </div>
      <div className="mt-os-4 grid grid-cols-2 gap-os-4">
        <Stat label="Nodes" value={`${online}/${total}`} dot="emerald" />
        <Stat label="Peers" value={peers} dot="orange" />
      </div>
    </WidgetShell>
  );
}

function SystemWidget() {
  return (
    <WidgetShell accent="blue" eyebrow="RESOURCES" Icon={Cpu}>
      <div className="mt-os-2 grid grid-cols-3 gap-os-3">
        <SysStat label="CPU" value="32%" Icon={Cpu} tone="emerald" />
        <SysStat label="MEM" value="5.8G" Icon={Activity} tone="orange" />
        <SysStat label="DSK" value="1.7T" Icon={HardDrive} tone="cyan" />
      </div>
      <div className="mt-os-4 flex items-center justify-between border-t border-white/10 pt-os-3">
        <span className="text-micro font-mono text-zinc-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#29F06A] animate-pulse-glow" />
          HAILO-NPU
        </span>
        <span className="text-micro font-mono text-zinc-500">POOL: 4GB</span>
      </div>
    </WidgetShell>
  );
}

function NotificationsWidget({ lastBlock }: { lastBlock: number }) {
  return (
    <WidgetShell accent="orange" eyebrow="EVENT_LOG" Icon={Activity}>
      <ul className="mt-os-2 space-y-2">
        <NotificationItem
          dot="emerald"
          title="Worker rewarded"
          subtitle="+0.42 NAK"
        />
        <NotificationItem
          dot="cyan"
          title="Block produced"
          subtitle={`#${lastBlock.toLocaleString()}`}
        />
        <NotificationItem
          dot="amber"
          title="Update available"
          subtitle="v0.1.2"
        />
      </ul>
    </WidgetShell>
  );
}

const ACCENT_DOT: Record<string, string> = {
  green: "bg-[#29F06A] shadow-[0_0_8px_rgba(41,240,106,0.55)]",
  blue: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.45)]",
  orange: "bg-[#FF7A1A] shadow-[0_0_8px_rgba(255,122,26,0.55)]",
};

function WidgetShell({
  accent,
  eyebrow,
  Icon,
  children,
}: {
  accent: keyof typeof ACCENT_DOT;
  eyebrow: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-os-md border border-white/10 bg-bg-card/85 p-os-4 shadow-glass transition-colors duration-fast hover:border-white/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-fast group-hover:opacity-100" />
      <div className="mb-os-2 flex items-center justify-between text-micro font-mono text-zinc-500">
        <span className="inline-flex items-center gap-2">
          <Icon size={13} className="text-zinc-400" />
          {eyebrow}
        </span>
        <span className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[accent]}`} />
      </div>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Primitives                                                                */
/* -------------------------------------------------------------------------- */

const DOT_CLS: Record<string, string> = {
  emerald: "bg-[#29F06A]",
  orange: "bg-[#FF7A1A]",
  cyan: "bg-cyan-500",
  amber: "bg-amber-500",
};

function Stat({
  label,
  value,
  dot,
}: {
  label: string;
  value: React.ReactNode;
  dot: keyof typeof DOT_CLS;
}) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 py-2 first:border-t-0">
      <div className="flex items-center gap-1.5 text-micro font-mono uppercase text-zinc-400">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLS[dot]}`} />
        {label}
      </div>
      <span className="font-mono text-caption text-zinc-200 font-medium">{value}</span>
    </div>
  );
}

function NotificationItem({
  dot,
  title,
  subtitle,
}: {
  dot: keyof typeof DOT_CLS;
  title: string;
  subtitle: string;
}) {
  return (
    <li className="flex items-center justify-between group">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLS[dot]} flex-shrink-0`} />
        <span className="text-body font-mono text-zinc-300 truncate">{title}</span>
      </div>
      <span className="text-micro font-mono text-zinc-500 shrink-0">{subtitle}</span>
    </li>
  );
}

const SYS_TONES: Record<string, string> = {
  emerald: "text-[#29F06A]",
  orange: "text-[#FFB17A]",
  cyan: "text-cyan-400",
};

function SysStat({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  Icon: LucideIcon;
  tone: keyof typeof SYS_TONES;
}) {
  return (
    <div className="flex flex-col items-center border-r border-white/10 px-2 last:border-r-0">
      <Icon size={14} className={`mb-1 ${SYS_TONES[tone]}`} strokeWidth={2} />
      <div className="text-body font-mono font-semibold tabular-nums text-zinc-100 leading-tight">{value}</div>
      <div className="text-[9px] uppercase font-mono text-zinc-500">{label}</div>
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-os-4">
      <span className="text-micro font-mono text-zinc-500">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-border via-[#29F06A]/30 to-transparent" />
    </div>
  );
}

function AppTile({ app, index }: { app: LauncherApp; index: number }) {
  return (
    <Link
      href={app.href}
      className="group relative flex min-h-[72px] items-center gap-os-3 overflow-hidden rounded-os-md border border-white/10 bg-bg-elev/80 p-os-3 transition-all duration-fast animate-slide-up hover:-translate-y-0.5 hover:border-white/20 hover:bg-bg-elev focus:outline-none"
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
    >
      <div
        className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-os-sm ${app.color} transition-transform duration-fast group-hover:scale-105`}
      >
        <app.Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-body font-mono text-zinc-200 group-hover:text-white transition-colors duration-fast truncate">
          {app.label}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono uppercase text-zinc-600 group-hover:text-zinc-500">
          open
          <ArrowRight size={10} className="transition-transform duration-fast group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
