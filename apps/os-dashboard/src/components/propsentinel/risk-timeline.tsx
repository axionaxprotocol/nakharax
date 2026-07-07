import type { RiskEvent } from "@/lib/propsentinel";

export function RiskTimeline({ events }: { events: RiskEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-os-xl border border-[var(--hair)] bg-[var(--panel)] p-os-5 text-center text-caption text-[var(--text-muted)]">
        No events.
      </div>
    );
  }

  return (
    <div className="max-h-[800px] overflow-y-auto rounded-os-xl border border-[var(--hair)] bg-[var(--panel)] shadow-panel">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-start gap-os-3 border-b border-[var(--hair)] p-os-3 last:border-b-0 transition-colors hover:bg-[var(--panel-sunken)]"
        >
          <span className="mt-1 block h-2 w-2 shrink-0 rounded-full bg-[var(--accent-danger)] shadow-[0_0_10px_rgba(239,68,68,0.35)]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-os-2">
              <span className="truncate font-mono text-caption font-semibold uppercase tracking-[0.08em] text-[var(--text-strong)]">
                {event.account_number}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-[var(--text-muted)]">
                {new Date(event.created_at).toLocaleTimeString([], {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <div className="mt-1 truncate text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--accent-danger)]">
              {event.trigger_type.replace("_", " ")}
            </div>
            <div className="mt-1 truncate text-[10px] font-mono text-[var(--text-muted)]">
              limit {event.threshold} · actual {event.actual_value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
