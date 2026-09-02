"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Globe2,
  HardDrive,
  Network,
  RadioTower,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Timer,
  Zap,
} from "lucide-react";

import {
  Card,
  DataRow,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import {
  DEFAULT_NODES,
  type KadPeer,
  type NodeStatus,
} from "@/lib/rpc";
import { useNetworkMesh } from "@/lib/use-network-mesh";
import { GlobalNodeMeshCanvas } from "@/components/global-node-mesh-canvas";

interface ClusterNode {
  id: string;
  name: string;
  region: string;
  endpoint: string;
  role: "Local Live Host" | "Genesis Validator" | "Public RPC Gateway" | "DeAI GPU Worker" | "Hydra Sentinel";
  hardware: string;
  tps: number | null;
  status: "ACTIVE_LIVE" | "CONFIGURED" | "STANDBY";
  latencyMs: number | null;
  blockHeight: number | null;
  hostingTier: string;
}

// Configured Genesis topology. Only the public gateway is marked live when the
// RPC telemetry hook confirms it; other validator hosts are not independently probed
// by this frontend. Workers appear only after the RPC reports a registration.
const CONFIGURED_VPS_NODES: ClusterNode[] = [
  {
    id: "node-vps01-germany",
    name: "Germany Master Hub & Ingress (VPS-01)",
    region: "Frankfurt, Germany",
    endpoint: "https://rpc.nakharax.com",
    role: "Public RPC Gateway",
    hardware: "4 vCPU · 8 GB RAM · 100 GB SSD",
    tps: null,
    status: "CONFIGURED",
    latencyMs: null,
    blockHeight: null,
    hostingTier: "Configured public RPC ingress",
  },
  {
    id: "node-vps02-virginia",
    name: "Virginia Genesis Validator 01 (VPS-02)",
    region: "Virginia, US East",
    endpoint: "P2P endpoint not independently probed",
    role: "Genesis Validator",
    hardware: "4 vCPU · 8 GB RAM · 40 GB NVMe",
    tps: null,
    status: "CONFIGURED",
    latencyMs: null,
    blockHeight: null,
    hostingTier: "Configured validator topology",
  },
  {
    id: "node-vps03-singapore",
    name: "Singapore Genesis Validator 02 (VPS-03)",
    region: "Singapore, APAC",
    endpoint: "P2P endpoint not independently probed",
    role: "Genesis Validator",
    hardware: "4 vCPU · 8 GB RAM · 100 GB SSD",
    tps: null,
    status: "CONFIGURED",
    latencyMs: null,
    blockHeight: null,
    hostingTier: "Configured validator topology",
  },
];

export default function NodesPage() {
  const { blockNumber: globalBlock, isLive, latencyMs: globalLatency } = useNetworkMesh();
  const [clusterNodes, setClusterNodes] = useState<ClusterNode[]>(CONFIGURED_VPS_NODES);
  const [dhtPeers, setDhtPeers] = useState<KadPeer[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const currentBlock = isLive && globalBlock > 0 ? globalBlock : null;
  const activeNodeCount = clusterNodes.filter((node) => node.status === "ACTIVE_LIVE").length;
  const liveWorkerCount = clusterNodes.filter(
    (node) => node.role === "DeAI GPU Worker" && node.status === "ACTIVE_LIVE",
  ).length;
  const reportedLatencies = clusterNodes
    .map((node) => node.latencyMs)
    .filter((latency): latency is number => latency !== null && latency > 0);

  const probeAllNodes = useCallback(async () => {
    try {
      setIsProbing(true);
      const telemetryLive = isLive && globalBlock > 0;
      const [dhtResult, workerResult] = await Promise.allSettled([
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "nak_getKadRoutingTable",
            params: [],
            id: Date.now(),
          }),
        }),
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "nak_getWorkers",
            params: [],
            id: Date.now() + 1,
          }),
        }),
      ]);

      let dhtData: any = null;
      if (dhtResult.status === "fulfilled" && dhtResult.value.ok) {
        try {
          dhtData = await dhtResult.value.json();
        } catch {
          dhtData = null;
        }
      }
      setDhtPeers(Array.isArray(dhtData?.result) ? dhtData.result : []);

      let workerData: any = null;
      if (workerResult.status === "fulfilled" && workerResult.value.ok) {
        try {
          workerData = await workerResult.value.json();
        } catch {
          workerData = null;
        }
      }
      const liveWorkersObj = workerData?.result && typeof workerData.result === "object"
        ? workerData.result
        : {};
      const liveWorkerNodes: ClusterNode[] = Object.entries(liveWorkersObj).map(([addr, w]: [string, any], idx) => {
        const isOnline = w.status === "ONLINE_ACTIVE" || w.status === "active";
        const reportedLatency = Number(w.latencyMs ?? w.latency);

        return {
          id: `worker-${addr}`,
          name: w.name || w.specs?.name || `Edge Compute Worker #${idx + 1}`,
          region: w.region || "Unknown Region",
          endpoint: `${addr.slice(0, 8)}...${addr.slice(-6)} · RPC-reported worker`,
          role: "DeAI GPU Worker",
          hardware: w.gpu || w.specs?.gpu || "GPU Accelerator",
          tps: null,
          status: isOnline ? "ACTIVE_LIVE" : "STANDBY",
          latencyMs: Number.isFinite(reportedLatency) && reportedLatency > 0 ? reportedLatency : null,
          blockHeight: telemetryLive ? globalBlock : null,
          hostingTier: `${w.popc_verifier || w.specs?.popc_verifier || "STARK-FRI-1024-ZK"} · ${w.totalJobsCompleted || w.jobsCompleted || 0} Jobs Mined`,
        };
      });

      const baseNodes = CONFIGURED_VPS_NODES.map((node) => ({
        ...node,
        status: node.id === "node-vps01-germany" && telemetryLive ? "ACTIVE_LIVE" as const : "CONFIGURED" as const,
        latencyMs: node.id === "node-vps01-germany" && telemetryLive && globalLatency > 0 ? globalLatency : null,
        blockHeight: node.id === "node-vps01-germany" && telemetryLive ? globalBlock : null,
      }));
      setClusterNodes([...liveWorkerNodes, ...baseNodes]);
    } finally {
      setIsProbing(false);
    }
  }, [globalBlock, globalLatency, isLive]);

  useEffect(() => {
    void probeAllNodes();
    const interval = setInterval(probeAllNodes, 3000);
    return () => clearInterval(interval);
  }, [probeAllNodes]);

  const testDiagnosticRpc = async (method: string) => {
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params: [],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error?.message || `RPC request failed (${res.status}).`);
      }
      setDiagnosticResult(`[${method}] Response:\n` + JSON.stringify(data.result, null, 2));
    } catch (e: any) {
      setDiagnosticResult(`[${method}] Error: ${e.message}`);
    }
  };

  return (
    <PageShell
      eyebrow="Node Topology & Deployment Blueprint"
      title="Network Node & Public VPS Deployment Planner"
      description="Monitor public RPC telemetry alongside the configured regional validator topology. Worker cards appear only after the RPC reports an on-chain registration."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            {activeNodeCount} RPC-Confirmed Nodes ({liveWorkerCount} GPU Workers)
          </StatusPill>
          <StatusPill tone="chain">{currentBlock ? `RPC Block · #${currentBlock.toLocaleString()}` : "RPC Block Pending"}</StatusPill>
          <StatusPill tone="violet">{isLive ? "RPC Telemetry Available" : "RPC Telemetry Pending"}</StatusPill>
        </>
      }
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={probeAllNodes}
            disabled={isProbing}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-mono font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <RefreshCw size={12} className={isProbing ? "animate-spin" : ""} />
            Probe All Nodes
          </button>
          <Link
            href="/apps"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            <ArrowLeft size={13} />
            Modules
          </Link>
        </div>
      }
    >
      {/* 4 Protocol Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Consensus Height"
          value={currentBlock ? `#${currentBlock.toLocaleString()}` : "Awaiting RPC"}
          hint={currentBlock ? "Latest block reported by the public RPC gateway" : "No RPC block sample is available yet"}
          icon={<Server size={18} />}
          tone="chain"
        />
        <StatCard
          label="Active Mesh Nodes"
          value={`${activeNodeCount} Confirmed Nodes`}
          hint={`${liveWorkerCount} live GPU workers; configured validators are labeled separately`}
          icon={<ShieldCheck size={18} />}
          tone="ai"
        />
        <StatCard
          label="Best RPC Latency"
          value={reportedLatencies.length > 0 ? `${Math.min(...reportedLatencies)} ms` : "Awaiting sample"}
          hint={reportedLatencies.length > 0 ? "Lowest currently reported RPC or worker latency" : "Latency is only shown after a telemetry report"}
          icon={<Timer size={18} />}
          tone="violet"
        />
        <StatCard
          label="Configured P2P Profile"
          value="Libp2p / GossipSub"
          hint="Live routing entries are shown below only when reported by RPC"
          icon={<Network size={18} />}
          tone="warn"
        />
      </div>

      {/* Public topology disclosure notice */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 font-mono text-xs text-cyan-200 flex items-center justify-between shadow-inner">
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-cyan-300 shrink-0" />
          <span>
            <strong>Topology disclosure:</strong> validator cards describe configured regions. Live status, blocks, peers, and workers are displayed only when reported by the public RPC gateway.
          </span>
        </span>
        <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider shrink-0 ml-2">
          RPC-SOURCED
        </span>
      </div>

      {/* Multi-Region Node Topology Cards */}
      <section className="space-y-4">
        <GlobalNodeMeshCanvas liveBlock={currentBlock ?? 0} />

        <SectionHeader
          title="Multi-Region L1 Node Cluster Topology"
          description="High-availability validator nodes and compute worker infrastructure powering testnet 86137."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {clusterNodes.map((node) => (
            <Card key={node.id} className="space-y-3.5 border-white/10 bg-slate-950/80 p-4 transition-all hover:border-emerald-500/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                    <Globe2 size={20} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{node.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{node.region} · {node.endpoint}</p>
                  </div>
                </div>
                <StatusPill
                  tone={node.status === "ACTIVE_LIVE" ? "ai" : node.status === "STANDBY" ? "warn" : "neutral"}
                  pulse={node.status === "ACTIVE_LIVE"}
                >
                  {node.status === "ACTIVE_LIVE"
                    ? "LIVE — RPC CONFIRMED"
                    : node.status === "STANDBY"
                      ? "STANDBY / OFFLINE"
                      : "CONFIGURED / NOT PROBED"}
                </StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                <Field label="Role" value={node.role.replace(" Genesis", "")} />
                <Field label="Block" value={node.blockHeight ? `#${node.blockHeight.toLocaleString()}` : "Not reported"} />
                <Field label="TPS" value={node.tps !== null ? `${node.tps} tps` : "Not reported"} />
                <Field label="Latency" value={node.latencyMs !== null ? `${node.latencyMs} ms` : "Not reported"} />
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950 p-2.5 text-[11px] font-mono text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Cpu size={13} className="text-cyan-400" />
                  Hardware: <strong className="text-white">{node.hardware}</strong>
                </span>
                <span className={node.status === "ACTIVE_LIVE" ? "text-emerald-400 font-semibold" : "text-slate-400 font-mono"}>
                  {node.hostingTier}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Kademlia DHT Discovery Mesh & Live Diagnostic Terminal */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Kademlia DHT Peer Table */}
        <Card className="lg:col-span-7 space-y-3">
          <SectionHeader
            title="Kademlia DHT Peer Discovery Mesh"
            description="Routing table entries reported by the RPC gateway (Gossipsub & QUIC multi-addrs)"
          />

          <div className="space-y-2">
            {dhtPeers.length > 0 ? dhtPeers.map((peer, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-slate-950 p-3 text-xs font-mono">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>Peer #{idx + 1}: {peer.peer_id.slice(0, 16)}…</span>
                  <span className="text-emerald-400 text-[10px]">BOOTSTRAP</span>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[10.5px] text-slate-400">
                  {peer.addresses.map((addr, aIdx) => (
                    <div key={aIdx} className="truncate">{addr}</div>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-white/15 bg-slate-950/50 p-4 text-xs font-mono text-slate-400">
                No DHT peers were reported by the RPC gateway on the latest probe.
              </div>
            )}
          </div>
        </Card>

        {/* Live RPC Diagnostic Console */}
        <Card className="lg:col-span-5 space-y-3">
          <SectionHeader
            title="JSON-RPC 2.0 Diagnostic Console"
            description="Execute read-only diagnostics through the configured public RPC gateway"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => testDiagnosticRpc("eth_blockNumber")}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-left text-[11px] font-mono hover:bg-white/10 transition-colors"
            >
              eth_blockNumber
            </button>
            <button
              type="button"
              onClick={() => testDiagnosticRpc("net_peerCount")}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-left text-[11px] font-mono hover:bg-white/10 transition-colors"
            >
              net_peerCount
            </button>
            <button
              type="button"
              onClick={() => testDiagnosticRpc("nak_getNodeTelemetry")}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-left text-[11px] font-mono hover:bg-white/10 transition-colors"
            >
              nak_getNodeTelemetry
            </button>
            <button
              type="button"
              onClick={() => testDiagnosticRpc("eth_gasPrice")}
              className="rounded-lg border border-white/10 bg-white/5 p-2 text-left text-[11px] font-mono hover:bg-white/10 transition-colors"
            >
              eth_gasPrice
            </button>
          </div>

          <pre className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-950 p-3 font-mono text-[10.5px] leading-relaxed text-emerald-300 whitespace-pre-wrap shadow-inner">
            {diagnosticResult || "Click any RPC method above to test a read-only response from the public RPC gateway."}
          </pre>
        </Card>
      </div>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2.5">
      <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-0.5 text-xs font-mono font-bold text-white truncate">{value}</div>
    </div>
  );
}
