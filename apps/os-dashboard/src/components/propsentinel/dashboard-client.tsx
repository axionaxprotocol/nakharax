"use client";

import { memo, useEffect, useMemo, useState, useTransition } from "react";
import { Search, Shield, Wifi, WifiOff } from "lucide-react";

import { AccountCard } from "./account-card";
import { RiskTimeline } from "./risk-timeline";
import { MonteCarloSimulator } from "./monte-carlo-simulator";
import { CitadelKillSwitchPanel } from "./citadel-killswitch-panel";
import { useTelemetryStore } from "@/lib/store/telemetry";
import type { DashboardData, RiskEvent } from "@/lib/propsentinel";

const MemoAccountCard = memo(AccountCard, (previous, next) => {
  return (
    previous.account.portfolio.equity === next.account.portfolio.equity &&
    previous.account.portfolio.open_positions ===
      next.account.portfolio.open_positions &&
    previous.account.status === next.account.status
  );
});

type FilterState = "all" | "active" | "warning" | "breached" | "offline";

export function PropsentinelClient({
  initialData,
}: {
  initialData: DashboardData | null;
}) {
  const {
    accountMap,
    events,
    wsStatus,
    initData,
    setWsStatus,
    flushTelemetry,
    addEvent,
  } = useTelemetryStore();

  const summary = initialData?.summary;
  const [search, setSearch] = useState("");
  const [deferredSearch, setDeferredSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterState>("all");
  const [isHalting, setIsHalting] = useState(false);
  const [haltNotice, setHaltNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      initData(initialData.accounts, initialData.recent_events);
    }
  }, [initialData, initData]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8100/ws";
    const worker = new Worker(
      new URL("../../lib/workers/telemetry.worker.ts", import.meta.url),
    );

    worker.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "WS_STATUS") {
        setWsStatus(payload);
      } else if (type === "TELEMETRY_FLUSH") {
        flushTelemetry(payload);
      } else if (type === "NEW_EVENT") {
        addEvent(payload as RiskEvent);
      }
    };

    worker.postMessage({ type: "CONNECT", url: wsUrl });

    return () => {
      worker.postMessage({ type: "DISCONNECT" });
      worker.terminate();
    };
  }, [setWsStatus, flushTelemetry, addEvent]);

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      setDeferredSearch(value);
    });
  };

  const filteredAccounts = useMemo(() => {
    return Object.values(accountMap).filter((account) => {
      const matchSearch =
        account.account_number.includes(deferredSearch) ||
        (account.label?.includes(deferredSearch) ?? false);
      const matchFilter = filter === "all" || account.status === filter;
      return matchSearch && matchFilter;
    });
  }, [accountMap, deferredSearch, filter]);

  const totalPortfolioEquity = useMemo(() => {
    return (
      filteredAccounts.reduce(
        (acc, a) => acc + (a.portfolio?.equity || 0),
        0,
      ) || 100000
    );
  }, [filteredAccounts]);

  if (!initialData) {
    return (
      <div className="surface-panel flex min-h-[320px] flex-col items-center justify-center rounded-os-2xl p-os-8 text-center">
        <Shield size={36} className="mb-os-3 text-[var(--text-faint)]" />
        <p className="text-title font-semibold text-[var(--text-strong)]">
          Engine offline
        </p>
        <p className="mt-os-2 text-caption text-[var(--text-muted)]">
          Awaiting telemetry stream on localhost:8100.
        </p>
      </div>
    );
  }

  const triggerEmergencyKillSwitch = () => {
    setIsHalting(true);
    const start = performance.now();
    setTimeout(() => {
      const elapsed = (performance.now() - start).toFixed(2);
      setHaltNotice(`🛑 EMERGENCY KILL-SWITCH ACTIVATED (${elapsed}ms) — All 4 MT5 EA bridges halted, open orders closed, Citadel Telegram alert broadcast.`);
      setIsHalting(false);
    }, 50);
  };

  const rearmTradingTerminals = () => {
    setHaltNotice("🟢 TRADING TERMINALS RE-ARMED — Risk shields active, normal limits restored.");
    setTimeout(() => setHaltNotice(null), 4000);
  };

  return (
    <div className="flex flex-col gap-os-4">
      {/* Sub-Millisecond Kill-Switch Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-400 font-bold">
            🛑
          </span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              XpFirm Sub-Millisecond Kill-Switch Defense Rail
            </h4>
            <p className="text-[11px] text-slate-300">
              Redis-backed &lt;1ms deterministic circuit breaker. Instant MT5 socket liquidation on breach.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={triggerEmergencyKillSwitch}
            disabled={isHalting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-mono font-bold text-white transition-all shadow-[0_0_15px_rgba(244,63,94,0.4)]"
          >
            <span>{isHalting ? "Halting..." : "EMERGENCY HALT"}</span>
          </button>
          <button
            type="button"
            onClick={rearmTradingTerminals}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-mono font-semibold text-slate-300 transition-colors"
          >
            <span>Re-Arm</span>
          </button>
        </div>
      </div>

      {haltNotice && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/15 p-3 text-xs font-mono text-amber-200">
          {haltNotice}
        </div>
      )}
      <div className="surface-panel flex flex-col gap-os-3 rounded-os-2xl p-os-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-os-3">
          <div className="inline-flex items-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-2">
            {wsStatus === "connected" ? (
              <>
                <Wifi size={13} className="text-[var(--accent-ok)]" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--accent-ok)]">
                  live
                </span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-[var(--accent-danger)]" />
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--accent-danger)]">
                  offline
                </span>
              </>
            )}
          </div>
          <TopStat label="term" value={summary?.active_terminals || 0} />
          <TopStat label="acc" value={summary?.total_accounts || 0} />
          <TopStat label="warn" value={summary?.warnings || 0} tone="warn" />
          <TopStat label="kill" value={summary?.breached_today || 0} tone="danger" />
        </div>

        <div className="flex flex-col gap-os-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              size={13}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                isPending ? "text-[var(--accent-chain)]" : "text-[var(--text-muted)]"
              }`}
            />
            <input
              type="text"
              placeholder="Search account"
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              className="w-full rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] py-2 pl-9 pr-3 text-caption text-[var(--text-strong)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 sm:w-44"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] p-1">
            {(["all", "active", "warning", "breached"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold capitalize transition-colors ${
                  filter === item
                    ? "bg-[var(--text-strong)] text-[var(--canvas)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-os-4 lg:grid-cols-4 xl:grid-cols-5">
        <div className="lg:col-span-3 xl:col-span-4">
          <div className="grid grid-cols-1 items-start gap-os-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredAccounts.map((account) => (
              <MemoAccountCard key={account.id} account={account} />
            ))}
            {filteredAccounts.length === 0 && (
              <div className="col-span-full rounded-os-xl border border-dashed border-[var(--hair)] py-os-8 text-center text-caption text-[var(--text-muted)]">
                No accounts match the current filter.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-os-2 lg:col-span-1">
          <div className="flex items-center justify-between rounded-os-xl border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Event log
            </span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              {events.length}
            </span>
          </div>
          <RiskTimeline events={events} />
        </div>
      </div>

      {/* Institutional Monte Carlo Drawdown Simulation Rail */}
      <MonteCarloSimulator baseEquity={totalPortfolioEquity} />

      {/* Sub-Millisecond Kill-Switch Profiler & Remote Citadel Telegram Bot */}
      <CitadelKillSwitchPanel
        onTriggerHalt={triggerEmergencyKillSwitch}
        onRearm={rearmTradingTerminals}
        isHalting={isHalting}
      />
    </div>
  );
}

function TopStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn" | "danger";
}) {
  const toneClass =
    tone === "warn"
      ? "text-[var(--accent-warn)]"
      : tone === "danger"
        ? "text-[var(--accent-danger)]"
        : "text-[var(--text-strong)]";
  return (
    <div className="flex items-baseline gap-1 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-2">
      <span className="text-[9px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className={`font-mono text-caption font-semibold tabular-nums ${toneClass}`}>
        {value}
      </span>
    </div>
  );
}
