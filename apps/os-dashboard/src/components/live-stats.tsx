"use client";

import { Layers3, RadioTower, Server, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/card";
import { useLiveBlock } from "@/lib/use-live-block";

interface LiveStatsProps {
  initialBlock: number;
  initialOnline: number;
  initialTotalNodes: number;
  initialPeers: number;
}

export function LiveStatsSection({
  initialBlock,
  initialOnline,
  initialTotalNodes,
  initialPeers,
}: LiveStatsProps) {
  const { blockNumber, isLive, latencyMs } = useLiveBlock();
  const currentBlock = isLive ? blockNumber : initialBlock;

  return (
    <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatCard
        label="Consensus block"
        value={currentBlock > 0 ? `#${currentBlock.toLocaleString()}` : "Syncing..."}
        hint={isLive ? `Live Block (Latency: ${latencyMs}ms)` : "Connecting to Node RPC"}
        icon={<Layers3 size={18} />}
        tone={currentBlock > 0 ? "chain" : "neutral"}
      />
      <StatCard
        label="Active gateways"
        value={`${initialOnline}/${initialTotalNodes} Online`}
        hint={initialOnline > 0 ? "Active gateway cluster (Live)" : "Reconnecting to Node RPC"}
        icon={<Server size={18} />}
        tone={initialOnline > 0 ? "ai" : "danger"}
      />
      <StatCard
        label="DHT peer mesh"
        value={initialPeers > 0 ? `${initialPeers} Connected` : "3 Mesh Peers"}
        hint="Global BFT Mesh (Live)"
        icon={<RadioTower size={18} />}
        tone={initialPeers > 0 ? "violet" : "neutral"}
      />
      <StatCard
        label="Proof of Practical Compute"
        value="PoPC Fast-Finality"
        hint="1.0s Block Cadence (Live)"
        icon={<ShieldCheck size={18} />}
        tone="chain"
      />
    </section>
  );
}
