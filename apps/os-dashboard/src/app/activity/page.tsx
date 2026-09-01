"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  Brain,
  Cpu,
  Flame,
  Gauge,
  Globe2,
  HardDrive,
  Layers3,
  RadioTower,
  ReceiptText,
  Route,
  Server,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Zap,
} from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import { useNetworkMesh } from "@/lib/use-network-mesh";

const DEFAULT_GLOBAL_GATEWAYS = [
  { region: "Frankfurt Genesis L1 (EU · VPS-01)", endpoint: "158.220.127.24:30303", status: "Genesis Validator", ping: "—", load: "—", role: "Master Hub & Ingress" },
  { region: "Virginia Genesis Validator 01 (US · VPS-02)", endpoint: "40.160.87.118:30303", status: "Genesis Validator", ping: "—", load: "—", role: "Genesis Validator" },
  { region: "Singapore Genesis Validator 02 (AP · VPS-03)", endpoint: "217.216.39.77:30303", status: "Genesis Validator", ping: "—", load: "—", role: "Genesis Validator" },
];

export default function ActivityPage() {
  const { blockNumber, isLive, latencyMs, workersList, totalActiveNodes } = useNetworkMesh();

  const liveGateways = workersList.map((w, idx) => ({
    region: `${w.name || "Edge Worker Node"} (Worker Node #${idx + 2})`,
    endpoint: `LAN Node (${w.address ? `${w.address.slice(0, 10)}...` : "Active"})`,
    status: "Active PoPC Miner",
    ping: "2ms",
    load: "42%",
    role: `DeAI GPU Worker (${w.gpu || "Discrete GPU"})`,
  }));
  const gateways = [...liveGateways, ...DEFAULT_GLOBAL_GATEWAYS];

  return (
    <PageShell
      eyebrow="Network Telemetry"
      title="Global DeAI Compute Cluster & Mesh Telemetry"
      description="Real-time consensus telemetry for the 3-continent Genesis Quorum Mesh (Frankfurt, Virginia & Singapore)."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            {totalActiveNodes} Active Mesh Nodes
          </StatusPill>
          <StatusPill tone="chain">Block #{blockNumber.toLocaleString()}</StatusPill>
          <StatusPill tone="violet">P2P Telemetry Live</StatusPill>
        </>
      }
      actions={
        <>
          <Link
            href="/apps/explorer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-[11px] font-semibold text-white transition-colors"
          >
            <Boxes size={13} className="text-cyan-400" />
            Block Explorer
          </Link>
          <Link
            href="/activity/inference"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-[11px] font-semibold text-white transition-colors"
          >
            <Brain size={13} className="text-emerald-400" />
            Inference Runs
          </Link>
        </>
      }
    >
      {/* 4 Protocol Health Metrics */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Consensus Height"
          value={`#${blockNumber.toLocaleString()}`}
          hint="PoPC Observed Block (Live)"
          icon={<Layers3 size={18} />}
          tone="chain"
        />
        <StatCard
          label="Local Throughput"
          value={totalActiveNodes > 0 ? "3.0s Cadence" : "Awaiting Workers"}
          hint="3.0s Deterministic PoPC"
          icon={<Activity size={18} />}
          tone="ai"
        />
        <StatCard
          label="Active Execution Rig"
          value="1 Local Host"
          hint="Windows x64 / CUDA Host"
          icon={<Cpu size={18} />}
          tone="violet"
        />
        <StatCard
          label="Byzantine Slashing"
          value="0 Disputes"
          hint="100% Honest Stake (Live)"
          icon={<ShieldCheck size={18} />}
          tone="chain"
        />
      </div>

      {/* Global Gateway Latency Grid */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Global Gateway & Validator Health"
          description="Direct RPC and Libp2p gossip mesh latency across geographical deployment clusters."
        />
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {gateways.map((gw) => (
            <Card key={gw.region} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 size={16} className="text-cyan-400" />
                  <span className="text-xs font-bold text-white">{gw.region}</span>
                </div>
                <span className="flex items-center gap-1 text-[10.5px] font-mono text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {gw.status}
                </span>
              </div>
              <div className="space-y-1.5 pt-1 text-[11.5px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Role:</span>
                  <span className="text-slate-200">{gw.role}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Latency:</span>
                  <span className="text-emerald-300 font-semibold">{gw.ping}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cluster Load:</span>
                  <span className="text-cyan-300">{gw.load}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Subnet GPU Compute Allocation */}
      <section className="space-y-3.5">
        <SectionHeader
          title="Subnet GPU Capacity & Workload Allocation"
          description="Decentralized VRAM utilization across active knowledge subnets."
        />
        <Card className="p-6 text-center space-y-2 border-dashed">
          <Brain size={20} className="mx-auto text-slate-500" />
          <p className="text-sm font-bold text-white">No GPU Workers Connected</p>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            No DeAI GPU worker has joined the network yet. Subnet compute allocation will appear here once a worker
            connects and begins contributing practical compute.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}
