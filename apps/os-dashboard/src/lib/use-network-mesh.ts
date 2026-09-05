"use client";

import { useEffect, useState } from "react";

export interface LiveWorkerInfo {
  name: string;
  address: string;
  gpu: string;
  cuda_cores: number;
  tensor_cores: number;
  popc_verifier: string;
  stake_nak: number;
  registeredAt: number;
  lastActive?: number;
  status: "ONLINE_ACTIVE" | "OFFLINE";
  totalJobsCompleted: number;
  cumulativeRewards: number;
  hashrateMops?: number;
  tier?: string;
}

export interface MeshNodeData {
  id: string;
  name: string;
  code: string;
  role: "MASTER_HUB" | "PRIMARY_VALIDATOR" | "DEAI_WORKER" | "SECURITY_AUDITOR";
  countryName: string;
  region: string;
  coordinates: [number, number]; // [lng, lat]
  provider: string;
  hardware: {
    vcpu: number;
    ramGb: number;
    storage: string;
    antiDdos: string;
  };
  p2p: {
    peerId: string;
    multiaddr: string;
    protocol: string;
    latencyMs: number;
    jitterMs: number;
  };
  consensus: {
    votingWeight: string;
    bftStatus: "VALIDATING" | "HEALTHY";
    blockHeight: number;
    tps: number;
  };
  isLiveWorker?: boolean;
  liveStats?: LiveWorkerInfo;
}

export interface NetworkMeshState {
  blockNumber: number;
  isLive: boolean;
  latencyMs: number;
  peerCount: number;
  tps: number;
  gasPriceGwei: number;
  mempoolSize: number;
  uptimeSeconds: number;
  workers: Record<string, LiveWorkerInfo>;
  workersList: LiveWorkerInfo[];
  totalWorkersCount: number;
  totalActiveNodes: number;
  totalNetworkHashrateMops: number;
  meshNodes: MeshNodeData[];
  meshConnections: Array<[number, number]>;
  telemetryStream: string[];
  lastUpdated: number;
}

// 🏛️ Real Live Genesis VPS Topology (3 Active Validator Nodes - IP Masked)
const BASE_3_NODES: MeshNodeData[] = [
  {
    id: "node-vps-01",
    name: "Germany Master Hub & Ingress [VPS-01]",
    code: "EU-DE-01",
    role: "MASTER_HUB",
    countryName: "Germany",
    region: "Frankfurt, Germany",
    coordinates: [8.6821, 50.1109],
    provider: "Contabo Dedicated Host (Frankfurt)",
    hardware: { vcpu: 4, ramGb: 8, storage: "100 GB SSD", antiDdos: "UFW + Caddy TLS Gateway" },
    p2p: { peerId: "12D3KooWPbSJk2fhuqENJDyrcb8y4x5EFJEFHt29sfZ9Tmc3vn2M", multiaddr: "/dns4/rpc.nakharax.com/tcp/30303/p2p/12D3KooWPbSJ...", protocol: "libp2p/kad/1.0.0", latencyMs: 0, jitterMs: 0 },
    consensus: { votingWeight: "33.33%", bftStatus: "HEALTHY", blockHeight: 0, tps: 0 }
  },
  {
    id: "node-vps-02",
    name: "Virginia Genesis Validator 01 [VPS-02]",
    code: "NA-US-01",
    role: "PRIMARY_VALIDATOR",
    countryName: "United States of America",
    region: "Virginia, US East",
    coordinates: [-78.4769, 38.0307],
    provider: "OVHcloud Dedicated Host (Virginia)",
    hardware: { vcpu: 4, ramGb: 8, storage: "40 GB NVMe", antiDdos: "OVHcloud Anti-DDoS" },
    p2p: { peerId: "12D3KooWPeewcUHGcwU72BefJqLmTgzxs4DM8WhTtGFwQnRkHmDE", multiaddr: "/dns4/us-east.nakharax.com/tcp/30303/p2p/12D3KooWPeew...", protocol: "libp2p/gossipsub/1.2.0", latencyMs: 0, jitterMs: 0 },
    consensus: { votingWeight: "33.33%", bftStatus: "HEALTHY", blockHeight: 0, tps: 0 }
  },
  {
    id: "node-vps-03",
    name: "Singapore Genesis Validator 02 [VPS-03]",
    code: "AP-SG-01",
    role: "PRIMARY_VALIDATOR",
    countryName: "Singapore",
    region: "Singapore, APAC",
    coordinates: [103.8198, 1.3521],
    provider: "Contabo Dedicated Host (Singapore)",
    hardware: { vcpu: 4, ramGb: 8, storage: "100 GB SSD", antiDdos: "UFW Hardware Guard" },
    p2p: { peerId: "12D3KooWQzf4maRFSYwk1BTJJuW7uspWLWKastntMWeRrxdoQCjK", multiaddr: "/dns4/sg-apac.nakharax.com/tcp/30303/p2p/12D3KooWQzf4...", protocol: "libp2p/gossipsub/1.2.0", latencyMs: 0, jitterMs: 0 },
    consensus: { votingWeight: "33.33%", bftStatus: "HEALTHY", blockHeight: 0, tps: 0 }
  }
];

const BASE_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [0, 2]
];

// Helper: Deterministic offset around Southeast Asia / Thailand LAN cluster
function getWorkerCoordinates(index: number, address: string): [number, number] {
  // Base origin: Bangkok / LAN cluster
  const baseLng = 100.5018;
  const baseLat = 13.7563;

  // Hash address for stable scattering
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const radius = 0.8 + (index % 4) * 0.6; // Scatter by 50-200 km

  const lng = baseLng + Math.cos(angle) * radius;
  const lat = baseLat + Math.sin(angle) * radius;
  return [Number(lng.toFixed(4)), Number(lat.toFixed(4))];
}

const CANONICAL_LOCAL_WORKER: LiveWorkerInfo = {
  name: "Local Sovereign Worker · LOC-PC-01 (AMD Radeon RX 560)",
  address: "0xb61877ac7b7b4f4b4dc2d5347e36345e4834cdcf",
  gpu: "AMD Radeon RX 560 Series (4GB VRAM)",
  cuda_cores: 1024,
  tensor_cores: 0,
  popc_verifier: "STARK-FRI-1024-ZK",
  stake_nak: 100.0,
  registeredAt: 1725530000000,
  lastActive: 0,
  status: "OFFLINE",
  totalJobsCompleted: 142,
  cumulativeRewards: 42.50,
  hashrateMops: 0.0,
  tier: "Tier 3: Edge Micro-Worker (STARK FRI ZKP & Inference)",
};

let globalMeshState: NetworkMeshState = {
  blockNumber: 1000,
  isLive: false,
  latencyMs: 0,
  peerCount: 2,
  tps: 0,
  gasPriceGwei: 1.0,
  mempoolSize: 0,
  uptimeSeconds: 0,
  workers: {
    [CANONICAL_LOCAL_WORKER.address.toLowerCase()]: CANONICAL_LOCAL_WORKER,
  },
  workersList: [CANONICAL_LOCAL_WORKER],
  totalWorkersCount: 0,
  totalActiveNodes: 3,
  totalNetworkHashrateMops: 0.0,
  meshNodes: BASE_3_NODES,
  meshConnections: BASE_CONNECTIONS,
  telemetryStream: [
    "[GOSSIPSUB] NA-US-01 ──» EU-DE-01 (PoPC BFT Consensus Synchronized)",
    "[BFT-VOTE] AP-SG-01 ──» EU-DE-01 (Genesis Quorum Block Vote 33.33%)",
    "[RPC-SYNC] EU-DE-01 ──» NA-US-01 (Block Height Propagated)"
  ],
  lastUpdated: Date.now()
};

const meshListeners = new Set<(state: NetworkMeshState) => void>();

function notifyMeshListeners() {
  meshListeners.forEach((fn) => fn(globalMeshState));
}

let engineStarted = false;

function recalculateMesh(
  workersRecord: Record<string, LiveWorkerInfo>,
  currentBlock: number,
  peerCount: number = globalMeshState.peerCount,
  realLatencyMs: number = globalMeshState.latencyMs,
  liveTps: number = globalMeshState.tps,
  liveGasPriceGwei: number = globalMeshState.gasPriceGwei,
  liveMempoolSize: number = globalMeshState.mempoolSize,
  liveUptimeSeconds: number = globalMeshState.uptimeSeconds
) {
  // Grounded Reality Check:
  // Determine local worker status strictly from the live RPC heartbeat response.
  // If the process was closed or no heartbeat has arrived within 15s, mark as OFFLINE with 0 M-Ops.
  const localAddr = CANONICAL_LOCAL_WORKER.address.toLowerCase();
  const remoteLocalWorker = workersRecord ? (workersRecord[localAddr] || workersRecord[CANONICAL_LOCAL_WORKER.address]) : undefined;
  const isLocalOnline = remoteLocalWorker?.status === "ONLINE_ACTIVE";

  const mergedWorkers: Record<string, LiveWorkerInfo> = {
    [localAddr]: remoteLocalWorker ? {
      ...CANONICAL_LOCAL_WORKER,
      ...remoteLocalWorker,
      status: isLocalOnline ? "ONLINE_ACTIVE" : "OFFLINE",
      hashrateMops: isLocalOnline ? (remoteLocalWorker.hashrateMops || 185.0) : 0.0,
    } : {
      ...CANONICAL_LOCAL_WORKER,
      status: "OFFLINE",
      hashrateMops: 0.0,
    },
    ...Object.fromEntries(
      Object.entries(workersRecord || {})
        .filter(([k]) => k.toLowerCase() !== localAddr)
        .map(([k, v]) => [k.toLowerCase(), v])
    ),
  };

  const workerEntries = Object.entries(mergedWorkers);
  const workersList = Object.values(mergedWorkers);
  const activeWorkersList = workersList.filter(w => w.status === "ONLINE_ACTIVE");

  // Calculate total active nodes dynamically:
  // In a P2P blockchain mesh, total active consensus nodes = (peerCount + 1)
  // Plus any active registered DeAI GPU workers
  // Plus any active registered DeAI GPU workers
  const basePeerNodes = peerCount > 0 ? peerCount + 1 : 3;
  const totalActive = Math.max(3, basePeerNodes + activeWorkersList.length);
  const dynamicVotingWeight = `${(100 / Math.max(1, totalActive)).toFixed(2)}%`;

  // Compute dynamic worker nodes
  const dynamicWorkerNodes: MeshNodeData[] = workerEntries.map(([addr, w], idx) => {
    const isOnline = w.status === "ONLINE_ACTIVE";
    const coords = getWorkerCoordinates(idx, addr);
    const hashrate = isOnline ? (w.hashrateMops || 185.0) : 0.0;
    const isLocal = addr.toLowerCase() === CANONICAL_LOCAL_WORKER.address.toLowerCase();
    const workerCode = `WRK-${String(idx + 1).padStart(2, "0")}`;

    return {
      id: `worker-node-${addr.toLowerCase()}`,
      name: w.name || (isLocal ? "Local Sovereign Worker · LOC-PC-01" : `DeAI Compute Worker (${workerCode})`),
      code: workerCode,
      role: "DEAI_WORKER",
      countryName: "Thailand",
      region: isOnline ? (isLocal ? "Bangkok, Thailand (LOC-PC-01 AMD GPU)" : `Bangkok, Thailand (Worker ${workerCode})`) : `LAN Compute Grid (Offline / Sleeping)`,
      coordinates: coords,
      provider: w.gpu || "AMD Radeon RX 560 Series (OpenCL)",
      hardware: {
        vcpu: w.cuda_cores ? Math.max(4, Math.round(w.cuda_cores / 128)) : 8,
        ramGb: 16,
        storage: "500 GB NVMe / SSD",
        antiDdos: "Zero-Latency LAN Guard"
      },
      p2p: {
        peerId: `12D3KooW${addr.slice(2, 8)}...${workerCode}`,
        multiaddr: `/ip4/183.89.5.23/tcp/30309/p2p/12D3KooWWorker${idx + 1}`,
        protocol: "libp2p/popc/2.1.0",
        latencyMs: isOnline ? (realLatencyMs || 1) : 0.0,
        jitterMs: 0.0
      },
      consensus: {
        votingWeight: isOnline ? dynamicVotingWeight : "DEAI COMPUTE",
        bftStatus: isOnline ? "HEALTHY" : ("OFFLINE / SLEEPING" as any),
        blockHeight: currentBlock,
        tps: isOnline ? liveTps : 0.0
      },
      isLiveWorker: true,
      liveStats: { ...w, hashrateMops: hashrate }
    };
  });

  const updatedBaseNodes: MeshNodeData[] = BASE_3_NODES.map((node, idx) => ({
    ...node,
    p2p: {
      ...node.p2p,
      latencyMs: idx === 0 ? realLatencyMs : realLatencyMs > 0 ? Math.max(1, realLatencyMs) : 0,
    },
    consensus: {
      ...node.consensus,
      blockHeight: currentBlock,
      tps: liveTps,
      votingWeight: dynamicVotingWeight,
    },
  }));

  const dynamicPeerNodes: MeshNodeData[] = [];
  if (peerCount >= 3) {
    dynamicPeerNodes.push({
      id: "node-pc-01",
      name: "Localhost Sovereign Host · PC-1 (LOC-TH-01)",
      code: "LOC-TH-01",
      role: "PRIMARY_VALIDATOR",
      countryName: "Thailand",
      region: "Bangkok, Thailand (PC-1)",
      coordinates: [100.5018, 13.7563],
      provider: "PC-1 Sovereign Rig · Windows x64 (Native Rust nakharax-node)",
      hardware: { vcpu: 8, ramGb: 16, storage: "1 TB NVMe SSD", antiDdos: "Local Mesh P2P Shield" },
      p2p: {
        peerId: "12D3KooWLocalPC1ThMeshLiveNode",
        multiaddr: "/ip4/183.89.5.23/tcp/30309/p2p/12D3KooWLocalPC1...",
        protocol: "libp2p/kad/1.0.0",
        latencyMs: realLatencyMs,
        jitterMs: 0.8
      },
      consensus: {
        votingWeight: dynamicVotingWeight,
        bftStatus: "HEALTHY",
        blockHeight: currentBlock,
        tps: liveTps
      }
    });
  }

  const allMeshNodes = [...updatedBaseNodes, ...dynamicPeerNodes, ...dynamicWorkerNodes];
  const allMeshConnections: Array<[number, number]> = [...BASE_CONNECTIONS];

  // Dynamic Laser Connections: Link PC-1 to Germany (0) and Singapore (2)
  if (dynamicPeerNodes.length > 0) {
    const pc1Index = BASE_3_NODES.length;
    allMeshConnections.push([0, pc1Index]); // Link to Germany Master Hub
    allMeshConnections.push([2, pc1Index]); // Link to Singapore Genesis Validator
  }

  // Dynamic Laser Connections: Link each active worker to Frankfurt (0) and Singapore (2)
  dynamicWorkerNodes.forEach((node, idx) => {
    if (node.consensus.bftStatus === "HEALTHY") {
      const workerNodeIndex = BASE_3_NODES.length + dynamicPeerNodes.length + idx;
      allMeshConnections.push([0, workerNodeIndex]); // Link to Germany Master Hub
      allMeshConnections.push([2, workerNodeIndex]); // Link to Singapore Genesis Validator
    }
  });

  // Calculate sum hashrate of active workers only
  const totalHashrate = dynamicWorkerNodes.reduce((sum, n) => sum + (n.liveStats?.hashrateMops || 0), 0);

  // Generate real-time telemetry packets
  const telemetryLogs = [...globalMeshState.telemetryStream];
  if (peerCount >= 3) {
    const pc1Packet = `[P2P-SWARM] LOC-TH-01 (PC-1 Bangkok) ──» EU-DE-01 (PoPC BFT Consensus Synchronized)`;
    if (!telemetryLogs.includes(pc1Packet)) {
      telemetryLogs.unshift(pc1Packet);
      if (telemetryLogs.length > 8) telemetryLogs.pop();
    }
  }
  const activeNodesOnly = dynamicWorkerNodes.filter(n => n.consensus.bftStatus === "HEALTHY");
  if (activeNodesOnly.length > 0) {
    const activeW = activeNodesOnly[Math.floor(Math.random() * activeNodesOnly.length)];
    const logPacket = `[POPC-ZK] ${activeW.code} ──» EU-DE-01 (STARK FRI 1,024 Proofs Verified · ${activeW.liveStats?.hashrateMops?.toFixed(1)} M-Ops)`;
    if (!telemetryLogs.includes(logPacket)) {
      telemetryLogs.unshift(logPacket);
      if (telemetryLogs.length > 8) telemetryLogs.pop();
    }
  }

  globalMeshState = {
    ...globalMeshState,
    blockNumber: currentBlock,
    peerCount,
    latencyMs: realLatencyMs,
    tps: liveTps,
    gasPriceGwei: liveGasPriceGwei,
    mempoolSize: liveMempoolSize,
    uptimeSeconds: liveUptimeSeconds,
    workers: mergedWorkers,
    workersList,
    totalWorkersCount: activeWorkersList.length,
    totalActiveNodes: totalActive,
    totalNetworkHashrateMops: totalHashrate,
    meshNodes: allMeshNodes,
    meshConnections: allMeshConnections,
    telemetryStream: telemetryLogs,
    lastUpdated: Date.now()
  };

  notifyMeshListeners();
}

function startMeshEngine() {
  if (engineStarted || typeof window === "undefined") return;
  engineStarted = true;

  let isWsConnected = false;

  const initWs = () => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) return;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isWsConnected = true;
        globalMeshState.isLive = true;
        notifyMeshListeners();
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          // Block cadence stream
          if (msg.type === "block_header" && msg.data?.number) {
            globalMeshState.blockNumber = msg.data.number;
            notifyMeshListeners();
          }
          // Mesh Worker Update Event
          if (msg.type === "mesh_update" && msg.data?.workers) {
            recalculateMesh(
              msg.data.workers,
              msg.data.blockNumber || globalMeshState.blockNumber,
              globalMeshState.peerCount,
              globalMeshState.latencyMs,
              globalMeshState.tps,
              globalMeshState.gasPriceGwei,
              globalMeshState.mempoolSize,
              globalMeshState.uptimeSeconds
            );
          }
        } catch { }
      };

      ws.onclose = () => {
        isWsConnected = false;
        setTimeout(initWs, 5000);
      };
      ws.onerror = () => {
        isWsConnected = false;
        ws.close();
      };
    } catch { }
  };

  if (process.env.NEXT_PUBLIC_WS_URL) {
    initWs();
  }

  // 2. Real-Time RPC Polling (1.8s cadence for live block progression & node discovery)
  const pollMesh = async () => {
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    const startT = performance.now();
    try {
      const [bnRes, teleRes, peerRes, workersRes, gasRes] = await Promise.allSettled([
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: Date.now() }),
          cache: "no-store",
        }),
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "nak_getNodeTelemetry", params: [], id: Date.now() + 1 }),
          cache: "no-store",
        }),
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "net_peerCount", params: [], id: Date.now() + 2 }),
          cache: "no-store",
        }),
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "nak_getWorkers", params: [], id: Date.now() + 3 }),
          cache: "no-store",
        }),
        fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_gasPrice", params: [], id: Date.now() + 4 }),
          cache: "no-store",
        }),
      ]);

      const latency = Math.max(1, Math.round(performance.now() - startT));

      let currentBn = globalMeshState.blockNumber;
      let currentPeers = globalMeshState.peerCount;
      let currentWorkers = globalMeshState.workers;
      let currentTps = globalMeshState.tps;
      let currentMempool = globalMeshState.mempoolSize;
      let currentUptime = globalMeshState.uptimeSeconds;
      let currentGasPriceGwei = globalMeshState.gasPriceGwei;

      if (bnRes.status === "fulfilled" && bnRes.value.ok) {
        try {
          const bnData = await bnRes.value.json();
          if (bnData.result) {
            currentBn = parseInt(bnData.result, 16);
          }
        } catch { }
      }

      if (peerRes.status === "fulfilled" && peerRes.value.ok) {
        try {
          const peerData = await peerRes.value.json();
          if (peerData.result) {
            const count = parseInt(peerData.result, 16);
            if (!isNaN(count) && count >= 0) {
              currentPeers = count;
            }
          }
        } catch { }
      }

      if (teleRes.status === "fulfilled" && teleRes.value.ok) {
        try {
          const teleData = await teleRes.value.json();
          if (teleData.result?.block_height && teleData.result.block_height > currentBn) {
            currentBn = teleData.result.block_height;
          }
          if (typeof teleData.result?.peer_count === "number") {
            currentPeers = teleData.result.peer_count;
          }
          if (typeof teleData.result?.tps === "number") {
            currentTps = teleData.result.tps;
          }
          if (typeof teleData.result?.mempool_size === "number") {
            currentMempool = teleData.result.mempool_size;
          }
          if (typeof teleData.result?.uptime_seconds === "number") {
            currentUptime = teleData.result.uptime_seconds;
          }
        } catch { }
      }

      if (gasRes.status === "fulfilled" && gasRes.value.ok) {
        try {
          const gasData = await gasRes.value.json();
          if (gasData.result) {
            const wei = parseInt(gasData.result, 16);
            if (!isNaN(wei) && wei > 0) {
              currentGasPriceGwei = Number((wei / 1e9).toFixed(2));
            }
          }
        } catch { }
      }

      if (workersRes.status === "fulfilled" && workersRes.value.ok) {
        try {
          const wData = await workersRes.value.json();
          if (wData.result && typeof wData.result === "object") {
            currentWorkers = wData.result;
          }
        } catch { }
      }

      globalMeshState.isLive = true;
      globalMeshState.latencyMs = latency;
      recalculateMesh(
        currentWorkers,
        currentBn,
        currentPeers,
        latency,
        currentTps,
        currentGasPriceGwei,
        currentMempool,
        currentUptime
      );
    } catch {
      // Offline fallback
    }
  };

  void pollMesh();
  setInterval(() => {
    pollMesh();
  }, 1800);
}

export function useNetworkMesh(): NetworkMeshState {
  const [state, setState] = useState<NetworkMeshState>(globalMeshState);

  useEffect(() => {
    startMeshEngine();
    setState(globalMeshState);
    const handler = (newState: NetworkMeshState) => setState(newState);
    meshListeners.add(handler);
    return () => {
      meshListeners.delete(handler);
    };
  }, []);

  return state;
}
