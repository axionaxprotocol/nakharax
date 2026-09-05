import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";

type Tone = "ai" | "chain" | "warn" | "danger" | "neutral" | "violet";

const TONE_STYLES: Record<Tone, {
  pill: string;
  badge: string;
  glow: string;
  borderTop: string;
}> = {
  ai: {
    pill: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 backdrop-blur-xl",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 backdrop-blur-xl",
    glow: "hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(41,240,106,0.15)]",
    borderTop: "from-emerald-400 via-emerald-400/60 to-transparent",
  },
  chain: {
    pill: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 backdrop-blur-xl",
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 backdrop-blur-xl",
    glow: "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]",
    borderTop: "from-cyan-400 via-cyan-400/60 to-transparent",
  },
  warn: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-300 backdrop-blur-xl",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-400 backdrop-blur-xl",
    glow: "hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    borderTop: "from-amber-400 via-amber-400/60 to-transparent",
  },
  danger: {
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-300 backdrop-blur-xl",
    badge: "border-rose-500/30 bg-rose-500/10 text-rose-400 backdrop-blur-xl",
    glow: "hover:border-rose-500/40 hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
    borderTop: "from-rose-400 via-rose-400/60 to-transparent",
  },
  neutral: {
    pill: "border-white/15 bg-white/[0.04] text-slate-200 backdrop-blur-xl",
    badge: "border-white/15 bg-white/[0.04] text-slate-200 backdrop-blur-xl",
    glow: "hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]",
    borderTop: "from-white/40 via-white/20 to-transparent",
  },
  violet: {
    pill: "border-violet-500/30 bg-violet-500/10 text-violet-300 backdrop-blur-xl",
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-400 backdrop-blur-xl",
    glow: "hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    borderTop: "from-violet-400 via-violet-400/60 to-transparent",
  },
};

export function Card({
  className,
  children,
  interactive = false,
  padded = true,
  tone,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
  padded?: boolean;
  tone?: Tone;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border border-white/[0.12] bg-slate-950/40 backdrop-blur-2xl transition-all duration-300",
        padded && "p-5 sm:p-6",
        interactive &&
          "cursor-pointer hover:-translate-y-1 hover:border-white/25 hover:bg-slate-900/50 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
        tone && TONE_STYLES[tone].glow,
        className,
      )}
    >
      {/* Specular top-edge refraction */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
    <div className={cn("space-y-6 sm:space-y-8 animate-slide-up", className)}>
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-950/40 p-5 sm:p-8 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Dynamic atmospheric radial glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        </div>

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10.5px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-emerald-300 mb-3">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {eyebrow}
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold leading-tight tracking-[-0.025em] text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-300 sm:text-[15.5px]">
                {description}
              </p>
            )}
            {meta && <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
          {actions && (
            <div className="flex w-full sm:w-auto shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
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
  subtitle,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  const desc = description ?? subtitle;
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.08] pb-3">
      <div>
        <h2 className="text-[1.2rem] font-bold tracking-tight text-white sm:text-[1.35rem]">
          {title}
        </h2>
        {desc && (
          <p className="mt-0.5 text-[12.5px] sm:text-[13px] text-slate-400">
            {desc}
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
        "group relative overflow-hidden rounded-xl border border-white/[0.12] bg-slate-950/40 p-3.5 sm:p-5 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-slate-900/50",
        toneStyle.glow,
      )}
    >
      {/* Specular top refraction border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-[11px] font-mono font-medium uppercase tracking-[0.14em] text-slate-400 truncate">
            {label}
          </div>
          <div className="mt-1.5 sm:mt-2 font-mono text-xl sm:text-2xl lg:text-[1.75rem] font-bold leading-tight tabular-nums text-white tracking-tight break-words">
            {value}
          </div>
          {hint && (
            <div className="mt-1.5 sm:mt-2 text-[11px] sm:text-[12px] text-slate-400 leading-snug line-clamp-2">
              {hint}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "grid h-8 w-8 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-lg border transition-transform duration-300 group-hover:scale-105",
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
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-[11px] font-medium tracking-wide transition-all",
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
        "grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition-all duration-300",
        TONE_STYLES[tone].badge,
        className,
      )}
    >
      <Icon size={18} strokeWidth={2} />
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
        "group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13.5px] font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        variant === "primary"
          ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(41,240,106,0.3)] hover:shadow-[0_0_30px_rgba(41,240,106,0.5)]"
          : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/[0.08]",
      )}
    >
      <span>{children}</span>
      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
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
    <div className="group flex items-center justify-between gap-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.05]">
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
      <div className="shrink-0 font-mono text-[13px] font-bold tabular-nums text-white">
        {value}
      </div>
    </div>
  );
}
