"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useNetworkMesh } from "@/lib/use-network-mesh";

interface TopRadarTickerProps {
  initialBlock: number;
  initialOnline: number;
  initialTotalNodes: number;
}

export function TopRadarTicker({ initialBlock, initialOnline, initialTotalNodes }: TopRadarTickerProps) {
  const { blockNumber, isLive, latencyMs, totalWorkersCount, totalNetworkHashrateMops } = useNetworkMesh();
  const hasLiveTelemetry = isLive && blockNumber > 0;
  const displayBlock = hasLiveTelemetry ? blockNumber : (initialBlock > 0 ? initialBlock : null);
  const networkReachable = hasLiveTelemetry || initialOnline > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 p-2.5 backdrop-blur-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <span className={`h-2 w-2 rounded-full ${networkReachable ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
          <span>NAKHARAX L1 GRID: {hasLiveTelemetry ? "TELEMETRY LIVE" : networkReachable ? "RPC PROBE AVAILABLE" : "AWAITING RPC"}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <span>
            CHAIN ID: <strong className="text-white font-bold">86137</strong>
          </span>
          <span>·</span>
          <span>
            BLOCK:{" "}
            <strong className="text-cyan-300 font-bold transition-all">
              {displayBlock ? `#${displayBlock.toLocaleString()}` : "AWAITING"}
            </strong>
          </span>
          <span>·</span>
          <span>
            TELEMETRY: <strong className="text-emerald-300 font-bold">{hasLiveTelemetry ? "CONNECTED" : "PENDING"}</strong>
          </span>
          <span>·</span>
          <span>
            BFT MESH:{" "}
            <strong className="text-emerald-400 font-bold">
              {initialTotalNodes > 0 ? `${initialOnline}/${initialTotalNodes} RPC NODES ONLINE` : "NO RPC NODES CONFIGURED"}{hasLiveTelemetry && totalWorkersCount > 0 ? ` · ${totalWorkersCount} GPU WORKER${totalWorkersCount > 1 ? "S" : ""} · ${totalNetworkHashrateMops.toFixed(0)} M-Ops/s` : ""}
            </strong>
          </span>
          <span>·</span>
          <span>
            LATENCY:{" "}
            <strong className="text-cyan-300 font-bold">
              {hasLiveTelemetry && latencyMs > 0 ? `${latencyMs}ms` : "AWAITING SAMPLE"}
            </strong>
          </span>
        </div>

        <Link
          href="/nodes"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
        >
          <span>Live Radar</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
