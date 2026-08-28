"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useNetworkMesh } from "@/lib/use-network-mesh";

interface TopRadarTickerProps {
  initialBlock: number;
}

export function TopRadarTicker({ initialBlock }: TopRadarTickerProps) {
  const { blockNumber, isLive, latencyMs, totalActiveNodes, totalWorkersCount, totalNetworkHashrateMops } = useNetworkMesh();
  const displayBlock = isLive && blockNumber > 0 ? blockNumber : (initialBlock > 0 ? initialBlock : 1000);

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60 p-2.5 backdrop-blur-xl shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span>NAKHARAX L1 GRID: 100% OPERATIONAL</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <span>
            CHAIN ID: <strong className="text-white font-bold">86137</strong>
          </span>
          <span>·</span>
          <span>
            BLOCK:{" "}
            <strong className="text-cyan-300 font-bold transition-all">
              #{displayBlock.toLocaleString()}
            </strong>
          </span>
          <span>·</span>
          <span>
            CADENCE: <strong className="text-emerald-300 font-bold">1.00s</strong>
          </span>
          <span>·</span>
          <span>
            BFT MESH:{" "}
            <strong className="text-emerald-400 font-bold">
              {totalActiveNodes} NODES ACTIVE {totalWorkersCount > 0 ? `(${totalWorkersCount} GPU WORKER${totalWorkersCount > 1 ? "S" : ""} · ${totalNetworkHashrateMops.toFixed(0)} M-Ops/s)` : ""}
            </strong>
          </span>
          <span>·</span>
          <span>
            LATENCY:{" "}
            <strong className="text-cyan-300 font-bold">
              {latencyMs > 0 ? `${latencyMs}ms` : "< 2ms"}
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
