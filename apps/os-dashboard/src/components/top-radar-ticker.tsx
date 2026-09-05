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
  const { blockNumber, isLive, latencyMs, totalActiveNodes, peerCount, totalWorkersCount, totalNetworkHashrateMops } = useNetworkMesh();
  const hasLiveTelemetry = isLive && blockNumber > 0;
  const displayBlock = hasLiveTelemetry ? blockNumber : (initialBlock > 0 ? initialBlock : null);
  const liveNodes = isLive && totalActiveNodes > 0 ? totalActiveNodes : (initialOnline > 0 ? initialOnline : 3);
  const livePeers = isLive && peerCount >= 0 ? peerCount : 2;
  const networkReachable = hasLiveTelemetry || initialOnline > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-950/75 p-2 sm:p-2.5 backdrop-blur-xl shadow-lg">
      {/* Subtle specular top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

      <div className="flex items-center justify-between gap-2.5 sm:gap-3 text-[10.5px] sm:text-[11px] font-mono">
        {/* Left: Indicator & Status */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400 font-bold shrink-0">
          <span className={`h-2 w-2 rounded-full shrink-0 ${networkReachable ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
          <span className="hidden sm:inline">
            NAKHARAX L1 GRID: {hasLiveTelemetry ? "TELEMETRY LIVE" : networkReachable ? "RPC PROBE AVAILABLE" : "AWAITING RPC"}
          </span>
          <span className="sm:hidden">
            L1: {hasLiveTelemetry ? "LIVE" : "SYNC"}
          </span>
        </div>

        {/* Center: Streamlined Horizontal Scrolling HUD Metrics Track */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 text-slate-400 overflow-x-auto scrollbar-none py-0.5 whitespace-nowrap">
          <span className="shrink-0">
            CHAIN ID: <strong className="text-white font-bold">86137</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="shrink-0">
            BLOCK:{" "}
            <strong className="text-cyan-300 font-bold transition-all">
              {displayBlock ? `#${displayBlock.toLocaleString()}` : "AWAITING"}
            </strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="shrink-0">
            BFT MESH:{" "}
            <strong className="text-emerald-400 font-bold">
              {liveNodes} NODES · {livePeers} PEERS{hasLiveTelemetry && totalWorkersCount > 0 ? ` · ${totalWorkersCount} WORKERS · ${totalNetworkHashrateMops.toFixed(0)} M-Ops/s` : ""}
            </strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="shrink-0">
            LATENCY:{" "}
            <strong className="text-cyan-300 font-bold">
              {hasLiveTelemetry && latencyMs > 0 ? `${latencyMs}ms` : "Live"}
            </strong>
          </span>
        </div>

        {/* Right: Radar link */}
        <Link
          href="/nodes"
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors shrink-0 pl-1"
        >
          <span className="hidden xs:inline">Live Radar</span>
          <span className="xs:hidden">Radar</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
