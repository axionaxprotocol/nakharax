"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Search, Terminal, Trash2, Wifi, WifiOff } from "lucide-react";

const SYNTH_FALLBACK = [
  "mempool    INFO  bundle acceptance window 2s",
  "consensus  INFO  validator set unchanged [PoPC active]",
  "rpc        INFO  eth_chainId cache hit (chain 86137)",
  "network    INFO  gossipsub mesh diameter <= 3",
  "worker     INFO  sandbox heartbeat OK",
];

interface LogViewerProps {
  seedLines: string[];
  wsUrl?: string;
}

export function LogViewer({ seedLines, wsUrl = "ws://127.0.0.1:8546" }: LogViewerProps) {
  const [lines, setLines] = useState<string[]>(() => [...seedLines]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Real-time WebSocket connection to Node Daemon
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isUnmounted) {
            setIsConnected(true);
            const ts = new Date().toISOString();
            setLines((prev) => [...prev, `${ts}  system     INFO  ● WebSocket connected to live node stream (${wsUrl})`]);
          }
        };

        ws.onmessage = (event) => {
          if (isPausedRef.current || isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "log" && data.line) {
              setLines((prev) => {
                const next = [...prev, data.line];
                return next.length > 500 ? next.slice(-500) : next;
              });
            } else if (data.method === "eth_subscription" && data.params?.result) {
              const block = data.params.result;
              const ts = new Date().toISOString();
              const blockNum = parseInt(block.number, 16);
              setLines((prev) => {
                const next = [...prev, `${ts}  consensus  INFO  mined block #${blockNum} hash=${block.hash?.slice(0, 18)}...`];
                return next.length > 500 ? next.slice(-500) : next;
              });
            }
          } catch {
            // raw string log
            if (typeof event.data === "string" && !isPausedRef.current) {
              setLines((prev) => [...prev, event.data]);
            }
          }
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            setIsConnected(false);
            reconnectTimeout = setTimeout(connect, 4000);
          }
        };

        ws.onerror = () => {
          if (!isUnmounted) {
            setIsConnected(false);
          }
        };
      } catch {
        if (!isUnmounted) {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [wsUrl]);

  // Synthetic fallback heartbeats when offline
  useEffect(() => {
    if (isConnected) return;

    let tick = 0;
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      const message = SYNTH_FALLBACK[tick % SYNTH_FALLBACK.length];
      tick += 1;
      const timestamp = new Date().toISOString();
      setLines((prev) => {
        const next = [...prev, `${timestamp}  ${message}`];
        return next.length > 500 ? next.slice(-500) : next;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines.length, isPaused]);

  const filteredLines = filter
    ? lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  const downloadLogs = () => {
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nakharax-node-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-950/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-slate-300">
            <Terminal size={14} className="text-emerald-400" />
            nakharax-node.log
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${
              isConnected
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            {isConnected ? (
              <>
                <Wifi size={11} className="text-emerald-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                WebSocket Live
              </>
            ) : (
              <>
                <WifiOff size={11} className="text-amber-400" />
                Demo Tail (Simulated)
              </>
            )}
          </span>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-2">
          {/* Search / Filter input */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 w-32 sm:w-44 rounded-lg border border-white/10 bg-black/40 pl-7 pr-2.5 text-[11px] font-mono text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsPaused((v) => !v)}
            title={isPaused ? "Resume log stream" : "Pause log stream"}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-mono transition-colors ${
              isPaused
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {isPaused ? <Play size={11} /> : <Pause size={11} />}
            <span className="hidden sm:inline">{isPaused ? "Resume" : "Pause"}</span>
          </button>

          <button
            onClick={() => setLines([])}
            title="Clear visible logs"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-mono text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Trash2 size={11} />
          </button>

          <button
            onClick={downloadLogs}
            title="Download log file"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-mono text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Download size={11} />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <pre
        className="max-h-[min(560px,58vh)] overflow-y-auto p-5 font-mono text-[12px] leading-relaxed text-slate-200 whitespace-pre-wrap break-all selection:bg-emerald-500/30"
        aria-live="polite"
      >
        {filteredLines.length === 0 ? (
          <span className="text-slate-500 italic">No log lines matching filter &quot;{filter}&quot;</span>
        ) : (
          filteredLines.map((line, idx) => {
            let color = "text-slate-300";
            if (line.includes("ERROR") || line.includes("failed")) color = "text-rose-400 font-semibold";
            else if (line.includes("WARN")) color = "text-amber-300";
            else if (line.includes("consensus") || line.includes("mined block")) color = "text-cyan-300 font-medium";
            else if (line.includes("worker") || line.includes("faucet")) color = "text-emerald-300 font-medium";
            else if (line.includes("asr") || line.includes("job")) color = "text-violet-300";

            return (
              <div key={idx} className={`${color} py-0.5 hover:bg-white/[0.03] px-1 rounded transition-colors`}>
                {line}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </pre>
    </div>
  );
}
