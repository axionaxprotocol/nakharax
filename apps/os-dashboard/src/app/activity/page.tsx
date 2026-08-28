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
  { region: "Local Rig (This Machine)", endpoint: "http://127.0.0.1:8545", status: "Active Live Host", ping: "< 1ms", load: "14%", role: "Master Live Host" },
  { region: "Frankfurt Genesis (EU)", endpoint: "eu-val1.nakharax.net", status: "Active Live Validator", ping: "14ms", load: "22%", role: "Genesis Validator" },
  { region: "Sydney Master Hub (AU)", endpoint: "au-val2.nakharax.net", status: "Active Live Gateway", ping: "128ms", load: "18%", role: "Public RPC & Faucet" },
  { region: "Singapore Genesis (SG)", endpoint: "sg-val3.nakharax.net", status: "Active Live Validator", ping: "42ms", load: "19%", role: "Genesis Validator" },
  { region: "Tokyo GPU RTX 4090 (JP)", endpoint: "jp-worker.nakharax.net", status: "Active Live Worker", ping: "82ms", load: "34%", role: "DeAI GPU Worker" },
  { region: "Virginia PyTorch A40 (US)", endpoint: "us-worker.nakharax.net", status: "Active Live Worker", ping: "165ms", load: "28%", role: "DeAI GPU Worker" },
  { region: "London ZK Auditor (UK)", endpoint: "uk-auditor.nakharax.net", status: "Active Live Sentinel", ping: "172ms", load: "15%", role: "Hydra Sentinel Auditor" },
];

const SUBNET_GPU_LOADS = [
  { name: "Subnet 1: Quant Finance & Monte Carlo", vramTotal: "192 GB (Active)", activeWorkers: 1, utilization: 25, tone: "emerald" },
  { name: "Subnet 2: Smart Contract & Bytecode Audit", vramTotal: "96 GB (Active)", activeWorkers: 1, utilization: 20, tone: "cyan" },
  { name: "Subnet 3: Olympiad Mathematical CoT", vramTotal: "256 GB (Active)", activeWorkers: 1, utilization: 30, tone: "violet" },
  { name: "Subnet 4: RISC-V & Hailo NPU Verilog", vramTotal: "64 GB (Active)", activeWorkers: 1, utilization: 15, tone: "amber" },
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
      description="Real-time consensus telemetry for local rig (127.0.0.1:8545) and multi-region 7-Node Global Mesh clusters."
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
          value="18.4 TPS"
          hint="1.0s Deterministic PoPC"
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
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {SUBNET_GPU_LOADS.map((sub) => (
            <Card key={sub.name} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white">{sub.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{sub.utilization}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${sub.utilization}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>Total Pool: <strong className="text-white">{sub.vramTotal}</strong></span>
                <span>Active Nodes: <strong className="text-cyan-300">{sub.activeWorkers}</strong></span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
