import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/cn";

type Tone = "ai" | "chain" | "warn" | "danger" | "neutral" | "violet";

const TONE_STYLES: Record<Tone, string> = {
  ai: "border-emerald-500/20 bg-emerald-500/10 text-[var(--accent-ai)]",
  chain: "border-cyan-500/20 bg-cyan-500/10 text-[var(--accent-chain)]",
  warn: "border-amber-500/25 bg-amber-500/10 text-[var(--accent-warn)]",
  danger: "border-rose-500/25 bg-rose-500/10 text-[var(--accent-danger)]",
  neutral: "border-[var(--hair)] bg-[var(--panel-sunken)] text-[var(--text)]",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-500",
};

export function Card({
  className,
  children,
  interactive = false,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-panel rounded-os-xl",
        padded && "p-os-5",
        interactive &&
          "transition-all duration-base hover:-translate-y-0.5 hover:border-[var(--hair-strong)] hover:shadow-raise",
        className,
      )}
    >
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
      <header className="overflow-hidden rounded-os-2xl border border-[var(--hair)] bg-[var(--panel)] shadow-panel">
        <div className="relative p-os-6 sm:p-os-8">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-os-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {eyebrow && (
                <div className="mb-os-2 text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-[var(--accent-ai)]">
                  {eyebrow}
                </div>
              )}
              <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-strong)] sm:text-[2.35rem]">
                {title}
              </h1>
              {description && (
                <p className="mt-os-3 max-w-2xl text-body leading-relaxed text-[var(--text-muted)] sm:text-[0.95rem]">
                  {description}
                </p>
              )}
              {meta && <div className="mt-os-4 flex flex-wrap gap-os-2">{meta}</div>}
            </div>
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-os-2">
                {actions}
              </div>
            )}
          </div>
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
        <h2 className="text-title font-semibold text-[var(--text-strong)]">
          {title}
        </h2>
        {description && (
          <p className="mt-os-1 text-caption text-[var(--text-muted)]">
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
  return (
    <Card className="relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 bg-current opacity-70",
          TONE_STYLES[tone],
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-os-4">
        <div className="min-w-0">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {label}
          </div>
          <div className="mt-os-2 font-mono text-[1.75rem] font-semibold leading-none tabular-nums text-[var(--text-strong)]">
            {value}
          </div>
          {hint && (
            <div className="mt-os-2 text-caption text-[var(--text-muted)]">
              {hint}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-os-lg border",
              TONE_STYLES[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em]",
        TONE_STYLES[tone],
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-50" />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
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
        "grid h-10 w-10 shrink-0 place-items-center rounded-os-lg border",
        TONE_STYLES[tone],
        className,
      )}
    >
      <Icon size={18} strokeWidth={1.8} />
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
        "inline-flex items-center justify-center gap-os-2 rounded-full px-os-5 py-os-3 text-[12px] font-semibold transition-all duration-base",
        variant === "primary"
          ? "bg-[var(--text-strong)] text-[var(--canvas)] hover:translate-y-[-1px] hover:shadow-raise"
          : "border border-[var(--hair)] bg-[var(--panel-sunken)] text-[var(--text-strong)] hover:border-[var(--hair-strong)] hover:bg-[var(--panel-hover)]",
      )}
    >
      {children}
      <ArrowUpRight size={14} />
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
    <div className="flex items-center justify-between gap-os-4 rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-3">
      <div className="min-w-0">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </div>
        {detail && (
          <div className="mt-0.5 truncate text-caption text-[var(--text-muted)]">
            {detail}
          </div>
        )}
      </div>
      <div className="shrink-0 font-mono text-body font-semibold tabular-nums text-[var(--text-strong)]">
        {value}
      </div>
    </div>
  );
}
