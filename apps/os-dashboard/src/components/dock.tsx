"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Brain,
  Briefcase,
  Home,
  Server,
  Settings,
  Terminal,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

type DockApp = {
  href: string;
  label: string;
  Icon: LucideIcon;
  activeColor: string;
  glowColor: string;
};

const DOCK_APPS: readonly DockApp[] = [
  {
    href: "/",
    label: "Overview",
    Icon: Home,
    activeColor: "from-emerald-500/40 via-teal-500/25 to-emerald-500/10 border-emerald-400/80 text-emerald-300",
    glowColor: "rgba(41, 240, 106, 0.5)",
  },
  {
    href: "/jobs",
    label: "Compute Jobs",
    Icon: Briefcase,
    activeColor: "from-emerald-500/40 via-teal-500/25 to-cyan-500/10 border-emerald-400/80 text-emerald-300",
    glowColor: "rgba(41, 240, 106, 0.5)",
  },
  {
    href: "/activity/models",
    label: "Model Registry",
    Icon: Brain,
    activeColor: "from-violet-500/40 via-fuchsia-500/25 to-purple-500/10 border-violet-400/80 text-violet-200",
    glowColor: "rgba(168, 85, 247, 0.5)",
  },
  {
    href: "/nodes",
    label: "Node Mesh",
    Icon: Server,
    activeColor: "from-cyan-500/40 via-blue-500/25 to-cyan-500/10 border-cyan-400/80 text-cyan-200",
    glowColor: "rgba(34, 211, 238, 0.5)",
  },
  {
    href: "/apps",
    label: "Microservices",
    Icon: Boxes,
    activeColor: "from-amber-500/40 via-orange-500/25 to-amber-500/10 border-amber-400/80 text-amber-200",
    glowColor: "rgba(245, 158, 11, 0.5)",
  },
  {
    href: "/wallet",
    label: "Key Vault",
    Icon: Wallet,
    activeColor: "from-emerald-500/40 via-lime-500/25 to-teal-500/10 border-emerald-400/80 text-emerald-200",
    glowColor: "rgba(41, 240, 106, 0.5)",
  },
  {
    href: "/activity",
    label: "Telemetry",
    Icon: Activity,
    activeColor: "from-sky-500/40 via-cyan-500/25 to-blue-500/10 border-sky-400/80 text-sky-200",
    glowColor: "rgba(56, 189, 248, 0.5)",
  },
  {
    href: "/logs",
    label: "Realtime Logs",
    Icon: Terminal,
    activeColor: "from-slate-500/40 via-slate-600/25 to-slate-500/10 border-slate-300/80 text-slate-100",
    glowColor: "rgba(203, 213, 225, 0.4)",
  },
  {
    href: "/settings",
    label: "Settings",
    Icon: Settings,
    activeColor: "from-zinc-500/40 via-zinc-600/25 to-zinc-500/10 border-zinc-300/80 text-zinc-100",
    glowColor: "rgba(228, 228, 231, 0.4)",
  },
];

export function Dock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-os-3 pointer-events-none"
      aria-label="Application dock"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1.5 sm:gap-2 overflow-x-auto rounded-full border border-white/25 border-t-white/40 bg-white/[0.05] p-2 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.75),inset_0_1px_2px_rgba(255,255,255,0.3)] backdrop-blur-3xl">
        {DOCK_APPS.map((app) => {
          const active =
            app.href === "/" ? pathname === "/" : pathname?.startsWith(app.href);
          return <DockAppIcon key={app.href} app={app} active={!!active} />;
        })}
      </div>
    </nav>
  );
}

function DockAppIcon({ app, active }: { app: DockApp; active: boolean }) {
  const { href, label, Icon, activeColor, glowColor } = app;
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="group relative flex flex-col items-center focus:outline-none"
    >
      <div
        style={{
          boxShadow: active ? `0 0 25px ${glowColor}, inset 0 1px 1.5px rgba(255,255,255,0.5)` : undefined,
        }}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border transition-all duration-300 sm:h-11 sm:w-11",
          active
            ? `bg-gradient-to-br ${activeColor} scale-110 -translate-y-1`
            : "border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-xl hover:-translate-y-1.5 hover:scale-110 hover:border-white/35 hover:bg-white/[0.12] hover:text-white hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]",
        )}
      >
        <Icon size={19} strokeWidth={2} />
      </div>

      {/* Active Indicator Micro-dot */}
      {active && (
        <span
          style={{ backgroundColor: glowColor, boxShadow: `0 0 8px ${glowColor}` }}
          className="absolute -bottom-1 h-1 w-1 rounded-full"
        />
      )}

      {/* Floating Tooltip */}
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/25 bg-slate-950/85 backdrop-blur-2xl px-2.5 py-1 text-[10.5px] font-mono font-semibold text-white opacity-0 shadow-2xl transition-all duration-200 group-hover:-top-10 group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}
