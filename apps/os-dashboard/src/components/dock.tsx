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
  tone: string;
};

const DOCK_APPS: readonly DockApp[] = [
  { href: "/", label: "Overview", Icon: Home, tone: "from-emerald-500 to-teal-500" },
  { href: "/jobs", label: "Compute", Icon: Briefcase, tone: "from-amber-500 to-orange-500" },
  { href: "/activity/models", label: "Models", Icon: Brain, tone: "from-violet-500 to-fuchsia-500" },
  { href: "/nodes", label: "Mesh", Icon: Server, tone: "from-cyan-500 to-blue-500" },
  { href: "/apps", label: "Apps", Icon: Boxes, tone: "from-rose-500 to-red-500" },
  { href: "/wallet", label: "Vault", Icon: Wallet, tone: "from-lime-500 to-emerald-500" },
  { href: "/activity", label: "Activity", Icon: Activity, tone: "from-sky-500 to-cyan-500" },
  { href: "/logs", label: "Logs", Icon: Terminal, tone: "from-slate-500 to-slate-700" },
  { href: "/settings", label: "Settings", Icon: Settings, tone: "from-zinc-500 to-zinc-700" },
];

export function Dock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-os-3 pointer-events-none"
      aria-label="Application dock"
    >
      <div className="pointer-events-auto flex max-w-full items-end gap-1 overflow-x-auto rounded-full border border-[var(--hair)] bg-[var(--chrome)] px-os-2 py-os-2 shadow-[var(--shadow-chrome)] backdrop-blur-xl">
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
  const { href, label, Icon, tone } = app;
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className="group relative flex flex-col items-center focus:outline-none"
    >
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full border transition-all duration-base sm:h-11 sm:w-11",
          active
            ? `border-white/10 bg-gradient-to-br ${tone} text-white shadow-raise`
            : "border-[var(--hair)] bg-[var(--panel-sunken)] text-[var(--text-muted)] hover:-translate-y-0.5 hover:bg-[var(--panel-hover)] hover:text-[var(--text-strong)]",
        )}
      >
        <Icon size={18} strokeWidth={1.9} />
      </div>

      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--hair)] bg-[var(--panel)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-strong)] opacity-0 shadow-panel transition-opacity duration-fast group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </Link>
  );
}
