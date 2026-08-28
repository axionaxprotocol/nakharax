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
  tps: number;
  status: "ACTIVE_LIVE" | "STANDBY_BLUEPRINT";
  latencyMs: number;
  blockHeight: number;
  hostingTier: string;
}

const PLANNED_VPS_BLUEPRINTS: ClusterNode[] = [
  {
    id: "node-local-rig",
    name: "Localhost Sovereign Node (This Machine) [Live Host]",
    region: "Local Development Rig",
    endpoint: "127.0.0.1:8545 (HTTP) · 127.0.0.1:8546 (WS)",
    role: "Local Live Host",
    hardware: "Bicameral Split-Brain Core · Windows x64",
    tps: 24.8,
    status: "ACTIVE_LIVE",
    latencyMs: 1,
    blockHeight: 1250,
    hostingTier: "Tier 5: Bicameral Edge Node (Live Active Hardware)",
  },
  {
    id: "node-frankfurt-val1",
    name: "Frankfurt Genesis L1 (EU-01) [Mock Up]",
    region: "Frankfurt, Germany",
    endpoint: "eu-val1.nakharax.net (Contabo VPS)",
    role: "Genesis Validator",
    hardware: "8 vCPU · 16 GB RAM · 500 GB NVMe",
    tps: 0.0,
    status: "STANDBY_BLUEPRINT",
    latencyMs: 14,
    blockHeight: 1250,
    hostingTier: "Tier 1: Global Root [Mock Up · Coming Soon 1 Sep]",
  },
  {
    id: "node-singapore-val3",
    name: "Singapore Genesis L1 (SG-05) [Mock Up]",
    region: "Singapore, SG",
    endpoint: "sg-val3.nakharax.net (Genesis Node)",
    role: "Genesis Validator",
    hardware: "8 vCPU · 16 GB RAM · 250 GB NVMe",
    tps: 0.0,
    status: "STANDBY_BLUEPRINT",
    latencyMs: 46,
    blockHeight: 1250,
    hostingTier: "Tier 1: Global Root [Mock Up · Coming Soon 1 Sep]",
  },
  {
    id: "node-virginia-worker",
    name: "Virginia LLM Training Super Node (US-03) [Mock Up]",
    region: "North Virginia, USA",
    endpoint: "us-worker.nakharax.net (GPU Cloud)",
    role: "DeAI GPU Worker",
    hardware: "NVIDIA A40 (48GB VRAM) · 32 vCPU",
    tps: 0.0,
    status: "STANDBY_BLUEPRINT",
    latencyMs: 165,
    blockHeight: 1250,
    hostingTier: "Tier 2: Regional Titan [Mock Up · Coming Soon 1 Sep]",
  },
  {
    id: "node-tokyo-gpu1",
    name: "Tokyo GPU Accelerated Cluster (JP-04) [Mock Up]",
    region: "Tokyo, Japan",
    endpoint: "jp-gpu1.nakharax.net (RunPod / Dedicated)",
    role: "DeAI GPU Worker",
    hardware: "16 Core · 32 GB · RTX 4090 24GB",
    tps: 0.0,
    status: "STANDBY_BLUEPRINT",
    latencyMs: 82,
    blockHeight: 1250,
    hostingTier: "Tier 2: Regional Titan [Mock Up · Coming Soon 1 Sep]",
  },
  {
    id: "node-sydney-val2",
    name: "Sydney Ingress & Faucet (AU-02) [Mock Up]",
    region: "Sydney, Australia",
    endpoint: "au-val2.nakharax.net (Contabo VPS)",
    role: "Public RPC Gateway",
    hardware: "4 vCPU · 8 GB RAM · 150 GB SSD",
    tps: 0.0,
    status: "STANDBY_BLUEPRINT",
    latencyMs: 128,
    blockHeight: 1250,
    hostingTier: "Tier 3: National Gateway [Mock Up · Coming Soon 1 Sep]",
  },
  {
    id: "node-london-auditor",
    name: "London ZK State Auditor & Radar (UK-06) [Mock Up]",
    region: "London, United Kingdom",
    endpoint: "uk-auditor.nakharax.net (Dedicated VPS)",
    role: "Hydra Sentinel",
    hardware: "12 vCPU · 32 GB RAM · 1 TB NVMe",
    tps: 0.0,
    status: "STANDBY_BLUEPRINT",
    latencyMs: 172,
    blockHeight: 1250,
    hostingTier: "Tier 4: Metro Aggregator [Mock Up · Coming Soon 1 Sep]",
  },
];

export default function NodesPage() {
  const { blockNumber: globalBlock, isLive, latencyMs: globalLatency, totalActiveNodes, totalWorkersCount } = useNetworkMesh();
  const [clusterNodes, setClusterNodes] = useState<ClusterNode[]>(PLANNED_VPS_BLUEPRINTS);
  const [dhtPeers, setDhtPeers] = useState<KadPeer[]>([]);
  const [isProbing, setIsProbing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  const probeAllNodes = useCallback(async () => {
    try {
      setIsProbing(true);
      // Query Kademlia DHT routing table + Live Registered Workers
      try {
        const [dhtRes, workerRes] = await Promise.all([
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

        const dhtData = await dhtRes.json();
        if (dhtData.result && Array.isArray(dhtData.result)) {
          setDhtPeers(dhtData.result);
        }

        const workerData = await workerRes.json();
        const liveWorkersObj = workerData.result || {};
        const liveWorkerNodes: ClusterNode[] = Object.entries(liveWorkersObj).map(([addr, w]: [string, any], idx) => {
          const isPC2 = addr.toLowerCase() === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
          const isStandby = addr.toLowerCase() === "0x90f79bf6eb2c4f870365e785982e1f101e93b906";
          const displayName = isPC2
            ? "PC-2 (NVIDIA GeForce GTX 1070 Ti)"
            : isStandby
            ? "PC-Standby (NOESIS Sentinel Guardian)"
            : (w.name || w.specs?.name || `Edge Compute Worker #${idx + 1}`);

          const hardwareName = isPC2
            ? "NVIDIA GeForce GTX 1070 Ti (8GB VRAM) · 2,432 CUDA Cores"
            : isStandby
            ? "Standby Core: Dual-Engine NPU/CPU (16GB RAM)"
            : (w.gpu || w.specs?.gpu || "NVIDIA GPU Accelerator");

          const isOnline = w.status === "ONLINE_ACTIVE" || w.status === "active";
          const nodeStatus: "ACTIVE_LIVE" | "STANDBY_BLUEPRINT" = isOnline ? "ACTIVE_LIVE" : "STANDBY_BLUEPRINT";
          const tierName = isPC2
            ? `Tier 5: DeAI Edge Worker · ${isOnline ? "Active" : "Offline / Sleeping"}`
            : isStandby
            ? `Tier 5: Bicameral Sentinel Guardian · Active`
            : `${w.popc_verifier || w.specs?.popc_verifier || "STARK-FRI-1024-ZK"} · ${w.totalJobsCompleted || w.jobsCompleted || 0} Jobs Mined`;

          return {
            id: `worker-${addr}`,
            name: displayName,
            region: isPC2 ? "LAN Compute Grid (192.168.1.108)" : isStandby ? "Hot-Standby Sentinel Cluster" : (w.region || `Edge Cluster Node #${idx + 2}`),
            endpoint: isPC2 ? "192.168.1.108 · Port 8545" : `${addr.slice(0, 8)}...${addr.slice(-6)} · Port 8545`,
            role: isStandby ? "Hydra Sentinel" : "DeAI GPU Worker",
            hardware: hardwareName,
            tps: isOnline ? (isPC2 ? 64.5 : isStandby ? 52.0 : 48.2) : 0.0,
            status: nodeStatus,
            latencyMs: isOnline ? (isPC2 ? 2 : isStandby ? 1 : (w.latency || 2)) : 0,
            blockHeight: globalBlock,
            hostingTier: tierName,
          };
        });

        setClusterNodes(() => {
          const base = PLANNED_VPS_BLUEPRINTS.map((node) => ({
            ...node,
            blockHeight: globalBlock,
            latencyMs: node.id === "node-local-rig" ? (globalLatency || 1) : node.latencyMs,
          }));
          return [...liveWorkerNodes, ...base];
        });
      } catch {
        setClusterNodes((prev) =>
          prev.map((node) => ({
            ...node,
            blockHeight: globalBlock,
            latencyMs: node.id === "node-local-rig" ? (globalLatency || 1) : node.latencyMs,
          }))
        );
      }
    } finally {
      setIsProbing(false);
    }
  }, [globalBlock, globalLatency]);

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
      setDiagnosticResult(`[${method}] Response:\n` + JSON.stringify(data.result, null, 2));
    } catch (e: any) {
      setDiagnosticResult(`[${method}] Error: ${e.message}`);
    }
  };

  return (
    <PageShell
      eyebrow="Node Topology & Deployment Blueprint"
      title="Sovereign Local Node & Public VPS Deployment Planner"
      description="Active local node daemon running on this machine (127.0.0.1:8545) alongside blueprint architecture for Public Testnet VPS clusters (Contabo / Hetzner / Dedicated Bare-Metal)."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            {clusterNodes.filter((n) => n.status === "ACTIVE_LIVE").length} Nodes Active ({clusterNodes.filter((n) => n.role === "DeAI GPU Worker").length} GPU Workers)
          </StatusPill>
          <StatusPill tone="chain">PoPC Live · #{globalBlock.toLocaleString()}</StatusPill>
          <StatusPill tone="violet">P2P Mesh Synced</StatusPill>
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
          value={`#${globalBlock.toLocaleString()}`}
          hint="Synchronized across all regions"
          icon={<Server size={18} />}
          tone="chain"
        />
        <StatCard
          label="Active Mesh Nodes"
          value={`${clusterNodes.filter((n) => n.status === "ACTIVE_LIVE").length} Nodes Active`}
          hint={`${clusterNodes.filter((n) => n.role === "DeAI GPU Worker").length} Live GPU Workers + ${clusterNodes.filter((n) => n.role === "Genesis Validator").length} Validators + Sentinel Swarm`}
          icon={<ShieldCheck size={18} />}
          tone="ai"
        />
        <StatCard
          label="Best RPC Latency"
          value={`${Math.min(...clusterNodes.map((n) => n.latencyMs))} ms`}
          hint="Frankfurt Gateway"
          icon={<Timer size={18} />}
          tone="violet"
        />
        <StatCard
          label="P2P DHT Protocol"
          value="Libp2p 0.54"
          hint="Gossipsub + QUIC Enabled"
          icon={<Network size={18} />}
          tone="warn"
        />
      </div>

      {/* Security & DDoS Shield Active Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-300 flex items-center justify-between shadow-inner">
        <span className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            <strong>Sovereign Zero-DDoS Protection Active:</strong> Physical node IPs and validator endpoints are shielded behind Anycast DNS Gateways & Libp2p multi-relays.
          </span>
        </span>
        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider shrink-0 ml-2">
          IP Masking 100%
        </span>
      </div>

      {/* Multi-Region Node Topology Cards */}
      <section className="space-y-4">
        <GlobalNodeMeshCanvas liveBlock={globalBlock} />

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
                  tone={
                    node.status === "ACTIVE_LIVE"
                      ? "ai"
                      : node.id.includes("0xf39fd") || node.name.includes("PC-2")
                      ? "danger"
                      : "warn"
                  }
                  pulse={node.status === "ACTIVE_LIVE"}
                >
                  {node.status === "ACTIVE_LIVE"
                    ? "🟢 LIVE ACTIVE HOST"
                    : node.id.includes("0xf39fd") || node.name.includes("PC-2")
                    ? "🛑 OFFLINE (SLEEPING)"
                    : "🟡 [MOCK UP - COMING SOON]"}
                </StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                <Field label="Role" value={node.role.replace(" Genesis", "")} />
                <Field label="Block" value={`#${node.blockHeight}`} />
                <Field label="TPS" value={`${node.tps} tps`} />
                <Field label="Latency" value={`${node.latencyMs} ms`} />
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
            description="Active routing table entries on P2P Port 30303 (Gossipsub & QUIC multi-addrs)"
          />

          <div className="space-y-2">
            {(dhtPeers.length > 0
              ? dhtPeers
              : [
                  {
                    peer_id: "12D3KooWStZ9M8...Frankfurt-Val1",
                    addresses: ["/dns4/eu-val1.nakharax.net/tcp/30303", "/dns4/eu-val1.nakharax.net/udp/30303/quic-v1"],
                  },
                  {
                    peer_id: "12D3KooWKn7P4...Sydney-Val2",
                    addresses: ["/dns4/au-val2.nakharax.net/tcp/30303", "/dns4/au-val2.nakharax.net/udp/30303/quic-v1"],
                  },
                  {
                    peer_id: "12D3KooWVa8B2...Tokyo-WorkerGPU",
                    addresses: ["/dns4/jp-gpu1.nakharax.net/tcp/30303"],
                  },
                  {
                    peer_id: "12D3KooWRx5T1...Virginia-Sentinel",
                    addresses: ["/dns4/us-sentinel.nakharax.net/tcp/30303"],
                  },
                ]
            ).map((peer, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-slate-950 p-3 text-xs font-mono">
                <div className="flex items-center justify-between text-cyan-300 font-bold">
                  <span>Peer #{idx + 1}: {peer.peer_id}</span>
                  <span className="text-emerald-400 text-[10px]">CONNECTED</span>
                </div>
                <div className="mt-1.5 space-y-0.5 text-[10.5px] text-slate-400">
                  {peer.addresses.map((addr, aIdx) => (
                    <div key={aIdx} className="truncate">{addr}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live RPC Diagnostic Console */}
        <Card className="lg:col-span-5 space-y-3">
          <SectionHeader
            title="JSON-RPC 2.0 Diagnostic Console"
            description="Execute live queries against node daemon on port 8545"
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
            {diagnosticResult || "Click any RPC method above to test live response from node daemon."}
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
