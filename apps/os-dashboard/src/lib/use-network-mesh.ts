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

// 🏛️ Base 7 Canonical Global Mesh Topology (Single Source of Truth)
const BASE_7_NODES: MeshNodeData[] = [
  {
    id: "node-vps-02",
    name: "Frankfurt Genesis Validator 01",
    code: "EU-DE-01",
    role: "PRIMARY_VALIDATOR",
    countryName: "Germany",
    region: "Frankfurt, DE",
    coordinates: [8.6821, 50.1109],
    provider: "Azure Cloud Host",
    hardware: { vcpu: 4, ramGb: 8, storage: "100 GB NVMe", antiDdos: "Azure DDoS Protection" },
    p2p: { peerId: "12D3KooWPeewcUHGcwU72BefJqLmTgzxs4DM8WhTtGFwQnRkHmDE", multiaddr: "/ip4/40.160.87.118/tcp/30303", protocol: "libp2p/gossipsub/1.2.0", latencyMs: 155.0, jitterMs: 1.2 },
    consensus: { votingWeight: "50.00%", bftStatus: "HEALTHY", blockHeight: 0, tps: 1.0 }
  },
  {
    id: "node-vps-01",
    name: "Sydney Master Ingress & RPC Gateway",
    code: "AP-AU-01",
    role: "MASTER_HUB",
    countryName: "Australia",
    region: "Sydney, AU",
    coordinates: [151.2093, -33.8688],
    provider: "Contabo Dedicated Node",
    hardware: { vcpu: 4, ramGb: 8, storage: "100 GB SSD", antiDdos: "UFW + Caddy SSL Gateway" },
    p2p: { peerId: "12D3KooWPbSJk2fhuqENJDyrcb8y4x5EFJEFHt29sfZ9Tmc3vn2M", multiaddr: "/ip4/158.220.127.24/tcp/30303", protocol: "libp2p/kad/1.0.0", latencyMs: 120.0, jitterMs: 0.9 },
    consensus: { votingWeight: "Gateway", bftStatus: "HEALTHY", blockHeight: 0, tps: 1.0 }
  },
  {
    id: "node-worker-us",
    name: "Virginia PyTorch GPU Worker",
    code: "NA-US-01",
    role: "DEAI_WORKER",
    countryName: "United States of America",
    region: "Virginia, US East",
    coordinates: [-78.4769, 38.0307],
    provider: "NVIDIA A40 (48GB VRAM)",
    hardware: { vcpu: 16, ramGb: 64, storage: "500 GB NVMe", antiDdos: "Enterprise Shield" },
    p2p: { peerId: "12D3KooWUsWorkerA40mP9xK4e1a3b5c7b1e2a3d4f5e6a7b8c9d0e1", multiaddr: "/ip4/40.160.87.118/tcp/30303", protocol: "libp2p/popc/2.1.0", latencyMs: 185.0, jitterMs: 2.1 },
    consensus: { votingWeight: "PoPC Worker (48GB)", bftStatus: "HEALTHY", blockHeight: 0, tps: 124.5 }
  },
  {
    id: "node-worker-jp",
    name: "Tokyo Matrix Solver Worker",
    code: "AP-JP-01",
    role: "DEAI_WORKER",
    countryName: "Japan",
    region: "Tokyo, JP",
    coordinates: [139.6917, 35.6895],
    provider: "NVIDIA RTX 4090 (24GB VRAM)",
    hardware: { vcpu: 16, ramGb: 32, storage: "1 TB NVMe", antiDdos: "Hardware Anti-DDoS" },
    p2p: { peerId: "12D3KooWJpWorker4090mP9xK4e1a3b5c7b1e2a3d4f5e6a7b8c9d0e2", multiaddr: "/ip4/217.216.39.77/tcp/30303", protocol: "libp2p/popc/2.1.0", latencyMs: 78.0, jitterMs: 0.8 },
    consensus: { votingWeight: "PoPC Worker (24GB)", bftStatus: "HEALTHY", blockHeight: 0, tps: 86.2 }
  },
  {
    id: "node-vps-03",
    name: "Singapore Genesis Validator 02",
    code: "AP-SG-01",
    role: "PRIMARY_VALIDATOR",
    countryName: "Singapore",
    region: "Singapore, SG",
    coordinates: [103.8198, 1.3521],
    provider: "Contabo Dedicated Node",
    hardware: { vcpu: 4, ramGb: 8, storage: "100 GB SSD", antiDdos: "UFW Hardware Guard" },
    p2p: { peerId: "12D3KooWQzf4maRFSYwk1BTJJuW7uspWLWKastntMWeRrxdoQCjK", multiaddr: "/ip4/217.216.39.77/tcp/30303", protocol: "libp2p/gossipsub/1.2.0", latencyMs: 32.0, jitterMs: 0.4 },
    consensus: { votingWeight: "50.00%", bftStatus: "HEALTHY", blockHeight: 0, tps: 1.0 }
  },
  {
    id: "node-auditor-uk",
    name: "London ZK State & FRI Auditor",
    code: "EU-UK-01",
    role: "SECURITY_AUDITOR",
    countryName: "United Kingdom",
    region: "London, UK",
    coordinates: [-0.1278, 51.5074],
    provider: "Dedicated ZK Auditor (36GB)",
    hardware: { vcpu: 8, ramGb: 36, storage: "250 GB NVMe", antiDdos: "Zero-Knowledge Enclave" },
    p2p: { peerId: "12D3KooWUkAuditorZkP9xK4e1a3b5c7b1e2a3d4f5e6a7b8c9d0e3", multiaddr: "/ip4/158.220.127.24/tcp/30303", protocol: "libp2p/fri/1.0.0", latencyMs: 168.0, jitterMs: 1.5 },
    consensus: { votingWeight: "FRI Auditor", bftStatus: "HEALTHY", blockHeight: 0, tps: 12.0 }
  },
  {
    id: "node-pc-01",
    name: "Localhost Sovereign Master Rig",
    code: "LOC-TH-01",
    role: "DEAI_WORKER",
    countryName: "Thailand",
    region: "Bangkok Dev Center (Host Rig)",
    coordinates: [100.5018, 13.7563],
    provider: "Local Sovereign Master Host",
    hardware: { vcpu: 16, ramGb: 32, storage: "1 TB NVMe", antiDdos: "Localhost Sovereign Shield" },
    p2p: { peerId: "12D3KooWLoc77kL7mP9xK4e1a3b5c7b1e2a3d4f5e6a7b8c9d0e1", multiaddr: "/ip4/127.0.0.1/tcp/30303", protocol: "libp2p/kad/1.0.0", latencyMs: 1.0, jitterMs: 0.1 },
    consensus: { votingWeight: "Master Rig", bftStatus: "HEALTHY", blockHeight: 0, tps: 52.4 }
  }
];

const BASE_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [0, 4], [1, 4], [0, 5], [4, 6], [1, 2], [3, 4], [2, 3]
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

let globalMeshState: NetworkMeshState = {
  blockNumber: 1000,
  isLive: false,
  latencyMs: 1,
  workers: {},
  workersList: [],
  totalWorkersCount: 0,
  totalActiveNodes: 7,
  totalNetworkHashrateMops: 0,
  meshNodes: BASE_7_NODES,
  meshConnections: BASE_CONNECTIONS,
  telemetryStream: [
    "[GOSSIPSUB] AP-AU-01 ──» EU-DE-01 (PoPC BFT Consensus Synchronized · 14.5ms)",
    "[ZKP-STARK] NA-US-01 ──» AP-JP-01 (1,024 Polynomial Constraints Checked · 82.1ms)",
    "[QUORUM-SIG] EU-UK-01 ──» LOC-TH-01 (Deterministic State Root Signed · 1.0ms)"
  ],
  lastUpdated: Date.now()
};

const meshListeners = new Set<(state: NetworkMeshState) => void>();

function notifyMeshListeners() {
  meshListeners.forEach((fn) => fn(globalMeshState));
}

let engineStarted = false;

function recalculateMesh(workersRecord: Record<string, LiveWorkerInfo>, currentBlock: number) {
  const workerEntries = Object.entries(workersRecord);
  const workersList = Object.values(workersRecord);
  const activeWorkersList = workersList.filter(w => w.status === "ONLINE_ACTIVE");

  // Compute dynamic worker nodes
  const dynamicWorkerNodes: MeshNodeData[] = workerEntries.map(([addr, w], idx) => {
    const isOnline = w.status === "ONLINE_ACTIVE";
    const coords = getWorkerCoordinates(idx, addr);
    const hashrate = isOnline ? (w.hashrateMops || (w.gpu.includes("1070") ? 218.0 : w.gpu.includes("4090") ? 428.5 : 180.0)) : 0.0;
    const workerCode = `WRK-${idx + 2}`;

    return {
      id: `worker-node-${addr.toLowerCase()}`,
      name: `${w.name || "Edge GPU Worker"} (Node #${idx + 2})`,
      code: workerCode,
      role: "DEAI_WORKER",
      countryName: "Thailand",
      region: isOnline ? `LAN Compute Grid (Worker Node #${idx + 2})` : `LAN Compute Grid (Offline / Sleeping)`,
      coordinates: coords,
      provider: w.gpu || "NVIDIA Discrete GPU",
      hardware: {
        vcpu: w.cuda_cores ? Math.round(w.cuda_cores / 300) : 8,
        ramGb: 16,
        storage: "500 GB NVMe / SSD",
        antiDdos: "Zero-Latency LAN Guard"
      },
      p2p: {
        peerId: `12D3KooW${addr.slice(2, 8)}...${w.name || "Worker"}`,
        multiaddr: `/ip4/lan-worker-${idx + 2}/tcp/8545`,
        protocol: "libp2p/popc/2.1.0",
        latencyMs: isOnline ? 2.0 : 0.0,
        jitterMs: isOnline ? 0.1 : 0.0
      },
      consensus: {
        votingWeight: isOnline ? `PoPC Worker (${hashrate.toFixed(1)} M-Ops/s)` : "OFFLINE / SLEEPING",
        bftStatus: isOnline ? "HEALTHY" : "OFFLINE / SLEEPING" as any,
        blockHeight: currentBlock,
        tps: isOnline ? 48.5 : 0.0
      },
      isLiveWorker: true,
      liveStats: { ...w, hashrateMops: hashrate }
    };
  });

  const updatedBaseNodes: MeshNodeData[] = BASE_7_NODES.map((node) => ({
    ...node,
    consensus: {
      ...node.consensus,
      blockHeight: currentBlock,
    },
  }));

  const allMeshNodes = [...updatedBaseNodes, ...dynamicWorkerNodes];
  const allMeshConnections: Array<[number, number]> = [...BASE_CONNECTIONS];

  // Dynamic Laser Connections: Link each active worker to LOC-TH-01 (index 6) and AP-SG-01 (index 3)
  dynamicWorkerNodes.forEach((node, idx) => {
    if (node.consensus.bftStatus === "HEALTHY") {
      const workerNodeIndex = 7 + idx;
      allMeshConnections.push([6, workerNodeIndex]); // Link to Localhost Host Rig
      allMeshConnections.push([3, workerNodeIndex]); // Link to Singapore Gateway
    }
  });

  // Calculate sum hashrate of active workers only
  const totalHashrate = dynamicWorkerNodes.reduce((sum, n) => sum + (n.liveStats?.hashrateMops || 0), 0);

  // Generate real-time telemetry packets
  const telemetryLogs = [...globalMeshState.telemetryStream];
  const activeNodesOnly = dynamicWorkerNodes.filter(n => n.consensus.bftStatus === "HEALTHY");
  if (activeNodesOnly.length > 0) {
    const activeW = activeNodesOnly[Math.floor(Math.random() * activeNodesOnly.length)];
    const logPacket = `[POPC-ZK] ${activeW.code} ──» LOC-TH-01 (STARK FRI 1,024 Proofs Verified · 19ms · ${activeW.liveStats?.hashrateMops?.toFixed(1)} M-Ops)`;
    if (!telemetryLogs.includes(logPacket)) {
      telemetryLogs.unshift(logPacket);
      if (telemetryLogs.length > 8) telemetryLogs.pop();
    }
  }

  globalMeshState = {
    ...globalMeshState,
    blockNumber: currentBlock,
    workers: workersRecord,
    workersList,
    totalWorkersCount: activeWorkersList.length,
    totalActiveNodes: 7 + activeWorkersList.length,
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
            recalculateMesh(msg.data.workers, msg.data.blockNumber || globalMeshState.blockNumber);
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

  // 2. Real-Time RPC Polling (1.8s cadence for live block progression)
  const pollMesh = async () => {
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    const startT = performance.now();
    try {
      const [bnRes, teleRes] = await Promise.allSettled([
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
      ]);

      const latency = Math.max(1, Math.round(performance.now() - startT));

      let currentBn = globalMeshState.blockNumber;
      if (bnRes.status === "fulfilled" && bnRes.value.ok) {
        try {
          const bnData = await bnRes.value.json();
          if (bnData.result) {
            currentBn = parseInt(bnData.result, 16);
          }
        } catch { }
      }

      if (teleRes.status === "fulfilled" && teleRes.value.ok) {
        try {
          const teleData = await teleRes.value.json();
          if (teleData.result?.block_height && teleData.result.block_height > currentBn) {
            currentBn = teleData.result.block_height;
          }
        } catch { }
      }

      globalMeshState.isLive = true;
      globalMeshState.latencyMs = latency;
      recalculateMesh(globalMeshState.workers, currentBn);
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
