"use client";

import { useEffect, useRef, useState } from "react";

const SYNTH = [
  "mempool    INFO  bundle acceptance window 2s",
  "consensus  INFO  validator set unchanged",
  "rpc        INFO  eth_chainId cache hit",
  "network    INFO  gossipsub mesh diameter <= 3",
  "worker     INFO  sandbox heartbeat OK",
];

interface LogViewerProps {
  seedLines: string[];
}

export function LogViewer({ seedLines }: LogViewerProps) {
  const [lines, setLines] = useState<string[]>(() => [...seedLines]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tick = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      const message = SYNTH[tick.current % SYNTH.length];
      tick.current += 1;
      const timestamp = new Date().toISOString();
      setLines((previous) => {
        const next = [...previous, `${timestamp}  ${message}`];
        return next.length > 400 ? next.slice(-400) : next;
      });
    }, 9_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines.length]);

  return (
    <div className="overflow-hidden rounded-os-2xl border border-[var(--hair)] bg-[var(--panel)] shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-os-2 border-b border-[var(--hair)] bg-[var(--panel-sunken)] px-os-5 py-os-3">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          node.log
        </span>
        <span className="inline-flex items-center gap-os-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--accent-ai)]">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-glow" />
          streaming demo tail
        </span>
      </div>
      <pre
        className="max-h-[min(560px,58vh)] overflow-y-auto p-os-5 font-mono text-[12px] leading-relaxed text-[var(--text)] whitespace-pre-wrap break-all"
        aria-live="polite"
      >
        {lines.join("\n")}
        <div ref={bottomRef} />
      </pre>
    </div>
  );
}
