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
  const { blockNumber, isLive, latencyMs, totalWorkersCount, totalNetworkHashrateMops } = useNetworkMesh();
  const currentBlock = isLive && blockNumber > 0 ? blockNumber : (initialBlock > 0 ? initialBlock : null);
  const hasLiveTelemetry = isLive && blockNumber > 0;
  const nodeStatus = initialTotalNodes > 0
    ? `${initialOnline}/${initialTotalNodes} RPC Nodes Online`
    : "No RPC Nodes Configured";
  const hasLiveWorkers = hasLiveTelemetry && totalWorkersCount > 0;

  return (
    <section className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatCard
        label="Consensus block"
        value={currentBlock ? `#${currentBlock.toLocaleString()}` : "Awaiting block"}
        hint={hasLiveTelemetry ? `Live RPC sample (${latencyMs}ms)` : "Awaiting RPC telemetry"}
        icon={<Layers3 size={18} />}
        tone={currentBlock ? "chain" : "neutral"}
      />
      <StatCard
        label="Active Cluster Nodes"
        value={nodeStatus}
        hint={hasLiveWorkers ? `${totalWorkersCount} live GPU worker${totalWorkersCount > 1 ? "s" : ""} reported by telemetry` : "Status from the latest server-side node probe"}
        icon={<Server size={18} />}
        tone={initialOnline > 0 ? "ai" : "danger"}
      />
      <StatCard
        label="DHT Peer Mesh & PoPC"
        value={hasLiveWorkers ? `${totalNetworkHashrateMops.toFixed(0)} M-Ops/s` : initialPeers > 0 ? `${initialPeers} Peers Observed` : "Awaiting peer data"}
        hint={hasLiveWorkers ? `Reported hash rate (${totalWorkersCount} worker${totalWorkersCount > 1 ? "s" : ""})` : "Peer count from the latest server-side node probe"}
        icon={<RadioTower size={18} />}
        tone={hasLiveWorkers || initialPeers > 0 ? "violet" : "neutral"}
      />
      <StatCard
        label="Proof of Practical Compute"
        value={hasLiveTelemetry ? "Telemetry Connected" : "Awaiting telemetry"}
        hint={hasLiveTelemetry ? "Current block data is available from the RPC gateway" : "No finality or cadence claim is shown until telemetry is available"}
        icon={<ShieldCheck size={18} />}
        tone={hasLiveTelemetry ? "chain" : "neutral"}
      />
    </section>
  );
}
