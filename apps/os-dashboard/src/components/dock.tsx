"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Briefcase,
  Home,
  Search,
  Server,
  Settings,
  Terminal,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Dock — primary app switcher, bottom-center.
 * Data-Dense style: minimal, small, solid borders.
 */

type DockApp = {
  href: string;
  label: string;
  Icon: LucideIcon;
  color: string;
};

const DOCK_APPS: readonly DockApp[] = [
  { href: "/", label: "Home", Icon: Home, color: "from-violet-500 to-indigo-600" },
  { href: "/nodes", label: "Nodes", Icon: Server, color: "from-emerald-500 to-green-600" },
  { href: "/jobs", label: "Jobs", Icon: Briefcase, color: "from-amber-500 to-yellow-600" },
  { href: "/apps", label: "Apps", Icon: Boxes, color: "from-rose-500 to-red-600" },
  { href: "/wallet", label: "Wallet", Icon: Wallet, color: "from-amber-500 to-orange-600" },
  { href: "/activity", label: "Activity", Icon: Activity, color: "from-cyan-500 to-blue-600" },
  { href: "/logs", label: "Logs", Icon: Terminal, color: "from-lime-500 to-emerald-600" },
  { href: "/settings", label: "Settings", Icon: Settings, color: "from-slate-500 to-slate-600" },
];

export function Dock() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-4 inset-x-0 z-30 flex justify-center pointer-events-none"
      aria-label="Application dock"
    >
      <div className="pointer-events-auto glass flex items-end gap-1 rounded-os-lg px-os-2 py-os-1">
        <DockButton label="Search" tooltip="Spotlight">
          <Search size={16} />
        </DockButton>

        <span
          className="mx-1 h-7 w-px bg-[var(--hair-strong)] self-center"
          aria-hidden="true"
        />

        {DOCK_APPS.map((app) => {
          const active = app.href === "/" ? pathname === "/" : pathname?.startsWith(app.href);
          return <DockAppIcon key={app.href} app={app} active={!!active} />;
        })}
      </div>
    </div>
  );
}

function DockAppIcon({ app, active }: { app: DockApp; active: boolean }) {
  const { href, label, Icon, color } = app;
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
          "grid h-10 w-10 place-items-center rounded-os-md transition-all duration-fast",
          active
            ? "bg-gradient-to-br text-white shadow-md border border-white/10 " + color
            : "bg-[var(--panel-sunken)] border border-[var(--hair)] text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--panel-hover)]",
        )}
      >
        <Icon size={18} strokeWidth={2} />
      </div>

      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--panel)] border border-[var(--hair)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-strong)] shadow-[var(--shadow-panel)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-fast">
        {label}
      </span>

      {/* Active indicator */}
      <span
        className={cn(
          "mt-0.5 h-0.5 rounded-full transition-all duration-base",
          active ? "w-3 bg-[var(--text-strong)]" : "w-0 bg-transparent",
        )}
        aria-hidden="true"
      />
    </Link>
  );
}

function DockButton({
  children,
  label,
  tooltip,
}: {
  children: React.ReactNode;
  label: string;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={tooltip ?? label}
      className="group relative flex flex-col items-center focus:outline-none"
    >
      <div className="grid h-10 w-10 place-items-center rounded-os-md bg-transparent hover:bg-[var(--panel-hover)] text-[var(--text-muted)] transition-all duration-fast group-hover:text-[var(--text-strong)]">
        {children}
      </div>
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--panel)] border border-[var(--hair)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-strong)] shadow-[var(--shadow-panel)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-fast">
        {tooltip ?? label}
      </span>
      <span className="mt-0.5 h-0.5 w-0" aria-hidden="true" />
    </button>
  );
}
