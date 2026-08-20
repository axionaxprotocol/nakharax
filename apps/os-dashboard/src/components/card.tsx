import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";

type Tone = "ai" | "chain" | "warn" | "danger" | "neutral" | "violet";

const TONE_STYLES: Record<Tone, {
  pill: string;
  badge: string;
  glow: string;
  borderTop: string;
}> = {
  ai: {
    pill: "border-emerald-400/40 bg-emerald-500/10 text-[var(--accent-ai)] shadow-[0_0_20px_-3px_rgba(41,240,106,0.35)] backdrop-blur-2xl",
    badge: "border-emerald-400/40 bg-emerald-500/10 text-[var(--accent-ai)] shadow-[0_0_25px_-3px_rgba(41,240,106,0.45)] backdrop-blur-2xl",
    glow: "hover:shadow-[0_0_45px_-5px_rgba(41,240,106,0.35)] hover:border-emerald-400/60 hover:bg-white/[0.08]",
    borderTop: "from-emerald-400 via-emerald-400/60 to-transparent",
  },
  chain: {
    pill: "border-cyan-400/40 bg-cyan-500/10 text-[var(--accent-chain)] shadow-[0_0_20px_-3px_rgba(34,211,238,0.35)] backdrop-blur-2xl",
    badge: "border-cyan-400/40 bg-cyan-500/10 text-[var(--accent-chain)] shadow-[0_0_25px_-3px_rgba(34,211,238,0.45)] backdrop-blur-2xl",
    glow: "hover:shadow-[0_0_45px_-5px_rgba(34,211,238,0.35)] hover:border-cyan-400/60 hover:bg-white/[0.08]",
    borderTop: "from-cyan-400 via-cyan-400/60 to-transparent",
  },
  warn: {
    pill: "border-amber-400/45 bg-amber-500/10 text-[var(--accent-warn)] shadow-[0_0_20px_-3px_rgba(255,122,26,0.3)] backdrop-blur-2xl",
    badge: "border-amber-400/45 bg-amber-500/10 text-[var(--accent-warn)] shadow-[0_0_25px_-3px_rgba(255,122,26,0.4)] backdrop-blur-2xl",
    glow: "hover:shadow-[0_0_45px_-5px_rgba(255,122,26,0.3)] hover:border-amber-400/60 hover:bg-white/[0.08]",
    borderTop: "from-amber-400 via-amber-400/60 to-transparent",
  },
  danger: {
    pill: "border-rose-400/45 bg-rose-500/10 text-[var(--accent-danger)] shadow-[0_0_20px_-3px_rgba(239,68,68,0.3)] backdrop-blur-2xl",
    badge: "border-rose-400/45 bg-rose-500/10 text-[var(--accent-danger)] shadow-[0_0_25px_-3px_rgba(239,68,68,0.4)] backdrop-blur-2xl",
    glow: "hover:shadow-[0_0_45px_-5px_rgba(239,68,68,0.3)] hover:border-rose-400/60 hover:bg-white/[0.08]",
    borderTop: "from-rose-400 via-rose-400/60 to-transparent",
  },
  neutral: {
    pill: "border-white/20 bg-white/[0.05] text-slate-100 backdrop-blur-2xl",
    badge: "border-white/20 bg-white/[0.05] text-slate-100 backdrop-blur-2xl",
    glow: "hover:shadow-[0_0_35px_-5px_rgba(255,255,255,0.15)] hover:border-white/40 hover:bg-white/[0.08]",
    borderTop: "from-white/60 via-white/30 to-transparent",
  },
  violet: {
    pill: "border-violet-400/40 bg-violet-500/10 text-violet-300 shadow-[0_0_20px_-3px_rgba(168,85,247,0.35)] backdrop-blur-2xl",
    badge: "border-violet-400/40 bg-violet-500/10 text-violet-300 shadow-[0_0_25px_-3px_rgba(168,85,247,0.45)] backdrop-blur-2xl",
    glow: "hover:shadow-[0_0_45px_-5px_rgba(168,85,247,0.35)] hover:border-violet-400/60 hover:bg-white/[0.08]",
    borderTop: "from-violet-400 via-violet-400/60 to-transparent",
  },
};

export function Card({
  className,
  children,
  interactive = false,
  padded = true,
  tone,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
  padded?: boolean;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "relative rounded-os-2xl border border-white/20 border-t-white/35 bg-white/[0.035] backdrop-blur-2xl shadow-[0_12px_40px_0_rgba(0,0,0,0.45),inset_0_1px_1.5px_0_rgba(255,255,255,0.25)] transition-all duration-300",
        padded && "p-os-5 sm:p-os-6",
        interactive &&
          "cursor-pointer hover:-translate-y-1.5 hover:border-white/35 hover:bg-white/[0.075] hover:shadow-[0_0_40px_-5px_rgba(41,240,106,0.3)]",
        tone && TONE_STYLES[tone].glow,
        className,
      )}
    >
      {/* Brilliant specular top reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  );
}

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  meta,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-os-6 animate-slide-up", className)}>
      <header className="relative overflow-hidden rounded-os-3xl border border-white/20 border-t-white/40 bg-white/[0.035] backdrop-blur-3xl p-os-6 sm:p-os-8 shadow-[0_20px_60px_0_rgba(0,0,0,0.5),inset_0_1.5px_2px_0_rgba(255,255,255,0.3)]">
        {/* Specular glass reflection */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* Dynamic atmospheric radial glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-[100px]" />
          <div className="absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-cyan-500/18 blur-[100px]" />
          <div className="absolute -left-20 top-1/2 h-72 w-72 rounded-full bg-violet-500/15 blur-[90px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px] opacity-80" />
        </div>

        <div className="relative flex flex-col gap-os-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3.5 py-1 text-[10.5px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--accent-ai)] shadow-[0_0_20px_-3px_rgba(41,240,106,0.4)] backdrop-blur-2xl mb-os-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-ai)]" />
                {eyebrow}
              </div>
            )}
            <h1 className="text-[1.85rem] font-bold leading-tight tracking-[-0.035em] text-white sm:text-[2.65rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-os-3 max-w-2xl text-[14.5px] leading-relaxed text-slate-200 sm:text-[15.5px]">
                {description}
              </p>
            )}
            {meta && <div className="mt-os-5 flex flex-wrap items-center gap-os-2.5">{meta}</div>}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-os-3">
              {actions}
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-os-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[1.25rem] font-bold tracking-tight text-white sm:text-[1.4rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-os-1 text-[13.5px] text-slate-300">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "ai",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-os-2xl border border-white/20 border-t-white/35 bg-white/[0.035] backdrop-blur-2xl p-os-5 shadow-[0_12px_40px_0_rgba(0,0,0,0.45),inset_0_1px_1.5px_0_rgba(255,255,255,0.25)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/35 hover:bg-white/[0.075]",
        toneStyle.glow,
      )}
    >
      {/* Top glowing neon glass accent strip */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r",
          toneStyle.borderTop,
        )}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="flex items-start justify-between gap-os-4">
        <div className="min-w-0">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </div>
          <div className="mt-os-2 font-mono text-[1.85rem] font-bold leading-none tabular-nums text-white tracking-tight">
            {value}
          </div>
          {hint && (
            <div className="mt-os-2 text-[12px] text-slate-300 font-medium">
              {hint}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-os-xl border transition-transform duration-300 group-hover:scale-110",
              toneStyle.badge,
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
  pulse = false,
}: {
  tone?: Tone;
  children: ReactNode;
  pulse?: boolean;
}) {
  const toneStyle = TONE_STYLES[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] transition-all",
        toneStyle.pill,
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {children}
    </span>
  );
}

export function IconBadge({
  Icon,
  tone = "ai",
  className,
}: {
  Icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-11 w-11 shrink-0 place-items-center rounded-os-xl border transition-all duration-300",
        TONE_STYLES[tone].badge,
        className,
      )}
    >
      <Icon size={19} strokeWidth={2} />
    </div>
  );
}

export function ActionLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full px-os-6 py-os-3 text-[13px] font-bold tracking-wide transition-all duration-300",
        variant === "primary"
          ? "bg-gradient-to-r from-[var(--accent-ai)] via-emerald-400 to-teal-300 text-slate-950 shadow-[0_0_25px_rgba(41,240,106,0.4)] hover:shadow-[0_0_35px_rgba(41,240,106,0.65)] hover:scale-[1.03]"
          : "border border-white/25 bg-white/[0.06] text-white backdrop-blur-2xl hover:border-white/45 hover:bg-white/[0.14] hover:scale-[1.02] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]",
      )}
    >
      <span>{children}</span>
      <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

export function DataRow({
  label,
  value,
  detail,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="group flex items-center justify-between gap-os-4 rounded-os-xl border border-white/15 bg-white/[0.035] backdrop-blur-2xl px-os-4 py-os-3 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
      <div className="min-w-0">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400 group-hover:text-slate-200 transition-colors">
          {label}
        </div>
        {detail && (
          <div className="mt-0.5 truncate text-[12px] text-slate-400">
            {detail}
          </div>
        )}
      </div>
      <div className="shrink-0 font-mono text-[13.5px] font-bold tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}
