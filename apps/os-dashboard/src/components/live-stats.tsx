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
  const { blockNumber, isLive, latencyMs, totalActiveNodes, peerCount, totalWorkersCount, totalNetworkHashrateMops } = useNetworkMesh();
  const currentBlock = isLive && blockNumber > 0 ? blockNumber : (initialBlock > 0 ? initialBlock : null);
  const hasLiveTelemetry = isLive && blockNumber > 0;
  
  // Real-time dynamic node & peer counts
  const liveNodes = isLive && totalActiveNodes > 0 ? totalActiveNodes : (initialOnline > 0 ? initialOnline : 3);
  const livePeers = isLive && peerCount >= 0 ? peerCount : initialPeers;
  const hasLiveWorkers = hasLiveTelemetry && totalWorkersCount > 0;

  return (
    <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatCard
        label="Consensus Block"
        value={currentBlock ? `#${currentBlock.toLocaleString()}` : "Syncing..."}
        hint={hasLiveTelemetry ? `Live RPC sample (${latencyMs}ms)` : "Awaiting RPC telemetry"}
        icon={<Layers3 size={18} />}
        tone={currentBlock ? "chain" : "neutral"}
      />
      <StatCard
        label="Active Cluster Nodes"
        value={`${liveNodes} Nodes Online`}
        hint={`${livePeers} Live P2P BFT Consensus Peers`}
        icon={<Server size={18} />}
        tone={liveNodes > 0 ? "ai" : "danger"}
      />
      <StatCard
        label="DHT Peer Mesh & PoPC"
        value={hasLiveWorkers ? `${totalNetworkHashrateMops.toFixed(0)} M-Ops/s` : `${livePeers} Peers Connected`}
        hint={hasLiveWorkers ? `Reported hash rate (${totalWorkersCount} worker${totalWorkersCount > 1 ? "s" : ""})` : "Live P2P BFT Consensus Swarm"}
        icon={<RadioTower size={18} />}
        tone="violet"
      />
      <StatCard
        label="Proof of Practical Compute"
        value={hasLiveTelemetry ? "PoPC BFT Synchronized" : "Syncing Telemetry"}
        hint="1.0s High-Velocity Block Cadence"
        icon={<ShieldCheck size={18} />}
        tone={hasLiveTelemetry ? "chain" : "neutral"}
      />
    </section>
  );
}
