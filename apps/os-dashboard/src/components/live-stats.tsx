"use client";

import { Layers3, RadioTower, Server, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/card";
import { useNetworkMesh } from "@/lib/use-network-mesh";

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
  const { blockNumber, isLive, latencyMs, totalActiveNodes, totalWorkersCount, totalNetworkHashrateMops } = useNetworkMesh();
  const currentBlock = isLive && blockNumber > 0 ? blockNumber : (initialBlock > 0 ? initialBlock : 1000);

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
        label="Active Cluster Nodes"
        value={`${totalActiveNodes} Nodes Active`}
        hint={totalWorkersCount > 0 ? `7 Genesis + ${totalWorkersCount} Live GPU Worker${totalWorkersCount > 1 ? "s" : ""}` : "7 Genesis Validators Active"}
        icon={<Server size={18} />}
        tone={totalActiveNodes > 0 ? "ai" : "danger"}
      />
      <StatCard
        label="DHT Peer Mesh & PoPC"
        value={totalWorkersCount > 0 ? `${totalNetworkHashrateMops.toFixed(0)} M-Ops/s` : `${totalActiveNodes} Connected`}
        hint={totalWorkersCount > 0 ? `Distributed PoPC Hashrate (${totalWorkersCount} Worker${totalWorkersCount > 1 ? "s" : ""})` : "Global BFT Mesh (Live)"}
        icon={<RadioTower size={18} />}
        tone="violet"
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
