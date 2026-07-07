import type { Account } from "@/lib/propsentinel";

interface Props {
  account: Account;
}

const STATUS_BORDER: Record<string, string> = {
  active: "border-[var(--hair)]",
  warning: "border-amber-500/35 shadow-[0_0_0_1px_rgba(245,158,11,0.18)]",
  breached: "border-rose-500/45 shadow-[0_0_0_1px_rgba(239,68,68,0.24)]",
  offline: "border-[var(--hair)] border-dashed opacity-80",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-[var(--accent-ok)]",
  warning: "bg-[var(--accent-warn)]",
  breached: "bg-[var(--accent-danger)] animate-pulse-glow",
  offline: "bg-[var(--text-faint)]",
};

function formatNumber(value: number, decimals = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AccountCard({ account }: Props) {
  const { portfolio, risk_profile, drawdown, terminals, status } = account;
  const activeTerminals = terminals.filter((terminal) => terminal.is_active).length;

  return (
    <div
      className={`flex flex-col gap-os-3 rounded-os-xl border bg-[var(--panel)] p-os-4 shadow-panel ${STATUS_BORDER[status]}`}
    >
      <div className="flex items-center justify-between gap-os-3">
        <div className="min-w-0">
          <div className="truncate font-mono text-body font-semibold uppercase tracking-[0.08em] text-[var(--text-strong)]">
            {account.account_number}
          </div>
          <div className="mt-0.5 truncate text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {account.broker_name} · {account.platform.toUpperCase()}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-2 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {activeTerminals}T
          </span>
        </div>
      </div>

      <div>
        <div className="font-mono text-[1.55rem] font-semibold leading-none tabular-nums text-[var(--text-strong)]">
          {formatNumber(portfolio.equity)}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`font-mono text-caption font-semibold tabular-nums ${
              portfolio.floating_pl >= 0
                ? "text-[var(--accent-ok)]"
                : "text-[var(--accent-danger)]"
            }`}
          >
            {portfolio.floating_pl >= 0 ? "+" : ""}
            {formatNumber(portfolio.floating_pl)}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {portfolio.open_positions} pos
          </span>
        </div>
      </div>

      <div className="space-y-os-2 border-t border-[var(--hair)] pt-os-3">
        <DrawdownBar
          label="daily dd"
          pct={drawdown.daily_pct}
          limit={risk_profile.daily_drawdown_pct}
        />
        <DrawdownBar
          label="max dd"
          pct={drawdown.all_time_pct}
          limit={risk_profile.max_drawdown_pct}
        />
      </div>
    </div>
  );
}

function DrawdownBar({
  label,
  pct,
  limit,
}: {
  label: string;
  pct: number;
  limit: number | null;
}) {
  const ratio = limit != null && limit > 0 ? Math.min(pct / limit, 1) : 0;
  const danger = ratio >= 0.9;
  const warn = ratio >= 0.7 && ratio < 0.9;
  const barClass = danger
    ? "bg-[var(--accent-danger)]"
    : warn
      ? "bg-[var(--accent-warn)]"
      : "bg-[var(--accent-ok)]";
  const textClass = danger
    ? "text-[var(--accent-danger)]"
    : warn
      ? "text-[var(--accent-warn)]"
      : "text-[var(--text)]";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-mono">
        <span className="uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {label}
        </span>
        <span className={`font-semibold tabular-nums ${textClass}`}>
          {pct.toFixed(2)}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--track)]">
        <div
          className={`h-full rounded-full transition-all duration-fast ${barClass}`}
          style={{ width: `${Math.max(ratio * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}
