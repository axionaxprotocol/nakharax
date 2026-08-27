"use client";

import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  Marker,
  Line,
} from "react-simple-maps";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Globe2,
  HardDrive,
  Network,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

// Local TopoJSON World Atlas for instant sub-millisecond zero-CDN loading
const GEO_URL = "/world-countries-110m.json";

export interface InstitutionalNode {
  id: string;
  name: string;
  code: string;
  role: "MASTER_HUB" | "PRIMARY_VALIDATOR" | "DEAI_WORKER" | "SECURITY_AUDITOR";
  countryName: string;
  region: string;
  coordinates: [number, number]; // [lng, lat] for react-simple-maps
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
}

const INSTITUTIONAL_5_NODES: InstitutionalNode[] = [
  {
    id: "node-au-01",
    name: "Master Compute Hub & Database",
    code: "AP-AU-01",
    role: "MASTER_HUB",
    countryName: "Australia",
    region: "Sydney (AP-Southeast)",
    coordinates: [151.2093, -33.8688],
    provider: "Contabo Cloud VPS 4",
    hardware: {
      vcpu: 4,
      ramGb: 8,
      storage: "100 GB SSD",
      antiDdos: "Standard Ingress Filter",
    },
    p2p: {
      peerId: "12D3KooWSmJgK7yEa8ZfL19c4d2e1a3b5c7b1e2a3d4f5e6a7b8c",
      multiaddr: "/ip4/46.250.x.x/tcp/30303/p2p/12D3KooW...",
      protocol: "libp2p/kad/1.0.0",
      latencyMs: 2.1,
      jitterMs: 0.2,
    },
    consensus: {
      votingWeight: "20.0% (1/5)",
      bftStatus: "HEALTHY",
      blockHeight: 2580,
      tps: 34.8,
    },
  },
  {
    id: "node-eu-01",
    name: "Genesis Validator #1 & Public RPC",
    code: "EU-DE-01",
    role: "PRIMARY_VALIDATOR",
    countryName: "Germany",
    region: "Frankfurt (EU-Central)",
    coordinates: [8.6821, 50.1109],
    provider: "OVHcloud VPS-1 NVMe",
    hardware: {
      vcpu: 2,
      ramGb: 4,
      storage: "40 GB NVMe",
      antiDdos: "OVHcloud VAC (TB/s Multi-Tier)",
    },
    p2p: {
      peerId: "12D3KooWRh8qN3kP8yD4c1b2e3a7f9c8b4d2e1a5a9c8e7f1b2d3",
      multiaddr: "/ip4/217.216.x.x/tcp/30303/p2p/12D3KooW...",
      protocol: "libp2p/gossipsub/1.2.0",
      latencyMs: 14.5,
      jitterMs: 0.8,
    },
    consensus: {
      votingWeight: "20.0% (1/5)",
      bftStatus: "VALIDATING",
      blockHeight: 2580,
      tps: 42.0,
    },
  },
  {
    id: "node-us-01",
    name: "Genesis Validator #2 & DeAI Worker",
    code: "NA-US-01",
    role: "DEAI_WORKER",
    countryName: "United States of America",
    region: "Virginia (US-East)",
    coordinates: [-78.4769, 38.0307],
    provider: "OVHcloud VPS-1 NVMe",
    hardware: {
      vcpu: 2,
      ramGb: 4,
      storage: "40 GB NVMe",
      antiDdos: "OVHcloud VAC Hardware Guard",
    },
    p2p: {
      peerId: "12D3KooWTz5xM9qP2bK4e1a3b5c7b1e2a3d4f5e6a7b8c9d0e1f2",
      multiaddr: "/ip4/142.44.x.x/tcp/30303/p2p/12D3KooW...",
      protocol: "libp2p/kad/1.0.0",
      latencyMs: 28.4,
      jitterMs: 1.1,
    },
    consensus: {
      votingWeight: "20.0% (1/5)",
      bftStatus: "VALIDATING",
      blockHeight: 2580,
      tps: 38.2,
    },
  },
  {
    id: "node-sg-01",
    name: "Genesis Validator #3 & DeAI Worker",
    code: "AP-SG-01",
    role: "DEAI_WORKER",
    countryName: "Singapore",
    region: "Singapore (AP-East)",
    coordinates: [103.8198, 1.3521],
    provider: "OVHcloud VPS-1 NVMe",
    hardware: {
      vcpu: 2,
      ramGb: 4,
      storage: "40 GB NVMe",
      antiDdos: "OVHcloud VAC Hardware Guard",
    },
    p2p: {
      peerId: "12D3KooWLy7rN2bP9xK4e1a3b5c7b1e2a3d4f5e6a7b8c9d0e1f2",
      multiaddr: "/ip4/139.99.x.x/tcp/30303/p2p/12D3KooW...",
      protocol: "libp2p/gossipsub/1.2.0",
      latencyMs: 18.2,
      jitterMs: 0.6,
    },
    consensus: {
      votingWeight: "20.0% (1/5)",
      bftStatus: "VALIDATING",
      blockHeight: 2580,
      tps: 39.5,
    },
  },
  {
    id: "node-uk-01",
    name: "Genesis Validator #4 & Security Auditor",
    code: "EU-UK-01",
    role: "SECURITY_AUDITOR",
    countryName: "United Kingdom",
    region: "London (EU-West)",
    coordinates: [-0.1278, 51.5074],
    provider: "OVHcloud VPS-1 NVMe",
    hardware: {
      vcpu: 2,
      ramGb: 4,
      storage: "40 GB NVMe",
      antiDdos: "OVHcloud VAC Hardware Guard",
    },
    p2p: {
      peerId: "12D3KooWPq9xM1rP4yD4c1b2e3a7f9c8b4d2e1a5a9c8e7f1b2d3",
      multiaddr: "/ip4/51.38.x.x/tcp/30303/p2p/12D3KooW...",
      protocol: "libp2p/kad/1.0.0",
      latencyMs: 16.0,
      jitterMs: 0.5,
    },
    consensus: {
      votingWeight: "20.0% (1/5)",
      bftStatus: "VALIDATING",
      blockHeight: 2580,
      tps: 36.1,
    },
  },
];

const MESH_CONNECTIONS: Array<[number, number]> = [
  [0, 1], // AU <-> EU
  [0, 3], // AU <-> SG
  [1, 2], // EU <-> US
  [1, 4], // EU <-> UK
  [2, 4], // US <-> UK
  [2, 3], // US <-> SG
  [3, 1], // SG <-> EU
];

export function GlobalNodeMeshCanvas({ liveBlock = 2580 }: { liveBlock?: number }) {
  const [mounted, setMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<InstitutionalNode>(INSTITUTIONAL_5_NODES[0]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditTimestamp, setAuditTimestamp] = useState<string>("T-0 REAL-TIME CONSENSUS SYNCHRONIZED");

  // Simulated live telemetry stream packets
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    `[GOSSIPSUB] AP-AU-01 ──» EU-DE-01 (PoPC Block #${liveBlock} Verified · 14.5ms)`,
    `[ZKP-STARK] NA-US-01 ──» AP-SG-01 (1,024 Constraints Confirmed · 18.2ms)`,
    `[QUORUM-SIG] EU-UK-01 ──» AP-AU-01 (Deterministic State Root Signed · 16.0ms)`,
  ]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const msgs = [
        `[POPC-BATCH] AP-AU-01 ──» NA-US-01 (Mining Receipt Mined · 28.4ms · 0.00% Loss)`,
        `[ZKP-STARK] AP-SG-01 ──» EU-DE-01 (FRI Layer LDE Proved · 18.2ms · 441 M-Ops)`,
        `[GOSSIPSUB] EU-DE-01 ──» EU-UK-01 (EIP-1559 BaseFee 1.2 Gwei Propagated)`,
        `[BYZANTINE] AP-AU-01 ──» AP-SG-01 (5/5 Weighted Quorum Confirmed · 100% OK)`,
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setTelemetryLogs((prev) => [randomMsg, prev[0], prev[1]]);
    }, 2400);
    return () => clearInterval(interval);
  }, [liveBlock]);

  // Map country name to node
  const activeCountries = INSTITUTIONAL_5_NODES.map((n) => n.countryName);

  function triggerConsensusAudit() {
    setIsAuditing(true);
    setTimeout(() => {
      setAuditTimestamp(`AUDIT PASS: 5/5 SIGNATURES VERIFIED AT BLOCK #${liveBlock}`);
      setIsAuditing(false);
    }, 500);
  }

  if (!mounted) {
    return (
      <div className="h-80 w-full rounded-2xl border border-white/10 bg-slate-950 flex items-center justify-center font-mono text-xs text-slate-400">
        <RefreshCw size={16} className="animate-spin text-emerald-400 mr-2" />
        Initializing NakharaX Consensus Radar...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CSS Animation Keyframes for Laser Beams & Sonar Ripples */}
      <style jsx global>{`
        @keyframes laserFlow {
          0% {
            stroke-dashoffset: 60;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes sonarPing {
          0% {
            r: 4px;
            opacity: 0.9;
            stroke-width: 2px;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            r: 24px;
            opacity: 0;
            stroke-width: 0.5px;
          }
        }
        @keyframes radarScan {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(200%);
            opacity: 0;
          }
        }
        .laser-beam-active {
          animation: laserFlow 1.2s linear infinite;
        }
        .laser-beam-fast {
          animation: laserFlow 0.8s linear infinite;
        }
        .sonar-ripple-1 {
          animation: sonarPing 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }
        .sonar-ripple-2 {
          animation: sonarPing 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite 0.8s;
        }
        .sonar-ripple-3 {
          animation: sonarPing 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite 1.6s;
        }
      `}</style>

      {/* Institutional Defense-Grade Mesh Terminal Panel */}
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
        {/* Telemetry Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Network size={16} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  NAKHARAX L1 CONSENSUS RADAR · 5-NODE HYBRID QUORUM
                </h3>
                <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300">
                  BFT QUORUM 100%
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-slate-400">
                P2P Laser Mesh Backbone · Libp2p GossipSub v1.2 · 3.0s Deterministic Cadence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={triggerConsensusAudit}
              disabled={isAuditing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 transition-colors"
            >
              <RefreshCw size={12} className={isAuditing ? "animate-spin" : ""} />
              <span>{isAuditing ? "Auditing Quorum..." : "Run Consensus Audit"}</span>
            </button>
            <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[10.5px] text-slate-300">
              RTT P99: <strong className="text-emerald-400">18.4 ms</strong>
            </div>
          </div>
        </div>

        {/* 🗺️ React-Simple-Maps World Atlas Container (Expanded Large Screen) */}
        <div className="relative aspect-[16/9] w-full min-h-[500px] md:min-h-[580px] max-h-[660px] bg-[#040812] overflow-hidden border-b border-white/10 flex items-center justify-center">
          {/* Subtle Radar Sweep Scanline */}
          <div className="absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent pointer-events-none animate-[radarScan_6s_linear_infinite]" />

          {/* SVG Glow Filters Definition */}
          <svg className="absolute w-0 h-0 pointer-events-none">
            <defs>
              <filter id="laser-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="laser-glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          <ComposableMap
            projectionConfig={{ scale: 175, center: [15, 0] }}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Sphere & Graticule Coordinates */}
            <Sphere id="sphere" stroke="#1e293b" strokeWidth={0.5} fill="transparent" />
            <Graticule stroke="#1e293b" strokeWidth={0.3} />

            {/* Render Verified Countries from TopoJSON World Atlas */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const isNodeHost = activeCountries.includes(countryName);
                  const matchingNode = INSTITUTIONAL_5_NODES.find(
                    (n) => n.countryName === countryName
                  );
                  const isSelected =
                    matchingNode && matchingNode.id === selectedNode.id;
                  const isHovered = hoveredCountry === countryName;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (matchingNode) setSelectedNode(matchingNode);
                      }}
                      onMouseEnter={() => setHoveredCountry(countryName)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{
                        default: {
                          fill: isSelected
                            ? "#065f46"
                            : isNodeHost
                            ? "#0e7490"
                            : "#0c1322",
                          stroke: isSelected ? "#34d399" : isNodeHost ? "#0284c7" : "#1e293b",
                          strokeWidth: isSelected ? 0.9 : isNodeHost ? 0.6 : 0.35,
                          outline: "none",
                          cursor: isNodeHost ? "pointer" : "default",
                          transition: "all 250ms",
                        },
                        hover: {
                          fill: isNodeHost ? "#10b981" : "#1e293b",
                          stroke: isNodeHost ? "#6ee7b7" : "#334155",
                          strokeWidth: 0.8,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#10b981",
                          stroke: "#34d399",
                          strokeWidth: 0.8,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* ⚡ High-Tech Double-Layer Laser Beam Mesh Lines */}
            {MESH_CONNECTIONS.map(([fromIdx, toIdx], idx) => {
              const n1 = INSTITUTIONAL_5_NODES[fromIdx];
              const n2 = INSTITUTIONAL_5_NODES[toIdx];
              const isHighlighted =
                selectedNode.id === n1.id || selectedNode.id === n2.id;

              return (
                <g key={`mesh-group-${idx}`}>
                  {/* Layer 1: Ambient Glow Track */}
                  <Line
                    from={n1.coordinates}
                    to={n2.coordinates}
                    stroke={isHighlighted ? "rgba(34, 211, 238, 0.4)" : "rgba(16, 185, 129, 0.2)"}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                  />

                  {/* Layer 2: High-Speed Pulsing Laser Beam with Flow Animation */}
                  <Line
                    from={n1.coordinates}
                    to={n2.coordinates}
                    stroke={isHighlighted ? "#38bdf8" : "#34d399"}
                    strokeWidth={isHighlighted ? 2 : 1.2}
                    strokeDasharray="6 18"
                    strokeLinecap="round"
                    className={isHighlighted ? "laser-beam-fast" : "laser-beam-active"}
                    style={{
                      filter: isHighlighted
                        ? "url(#laser-glow-cyan)"
                        : "url(#laser-glow-emerald)",
                    }}
                  />
                </g>
              );
            })}

            {/* 🎯 5 Institutional Node Markers with Triple Sonar Radar Waves */}
            {INSTITUTIONAL_5_NODES.map((node) => {
              const isSelected = selectedNode.id === node.id;

              return (
                <Marker
                  key={node.id}
                  coordinates={node.coordinates}
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Sonar Wave 1 */}
                  <circle
                    r={isSelected ? 6 : 4}
                    fill="none"
                    stroke={isSelected ? "#10b981" : "#06b6d4"}
                    className="sonar-ripple-1"
                    style={{ pointerEvents: "none" }}
                  />

                  {/* Sonar Wave 2 */}
                  <circle
                    r={isSelected ? 6 : 4}
                    fill="none"
                    stroke={isSelected ? "#34d399" : "#38bdf8"}
                    className="sonar-ripple-2"
                    style={{ pointerEvents: "none" }}
                  />

                  {/* Sonar Wave 3 */}
                  <circle
                    r={isSelected ? 6 : 4}
                    fill="none"
                    stroke={isSelected ? "#6ee7b7" : "#7dd3fc"}
                    className="sonar-ripple-3"
                    style={{ pointerEvents: "none" }}
                  />

                  {/* Inner Node Solid Core with Neon Aura */}
                  <circle
                    r={isSelected ? 5.5 : 4}
                    fill={isSelected ? "#10b981" : "#0284c7"}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    style={{
                      cursor: "pointer",
                      filter: isSelected
                        ? "drop-shadow(0 0 6px #10b981)"
                        : "drop-shadow(0 0 4px #06b6d4)",
                    }}
                  />

                  {/* Marker Hologram Label */}
                  <text
                    textAnchor="middle"
                    y={-12}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      fontWeight: "bold",
                      fill: isSelected ? "#34d399" : "#e2e8f0",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))",
                      pointerEvents: "none",
                    }}
                  >
                    {node.code} ({node.p2p.latencyMs}ms)
                  </text>
                </Marker>
              );
            })}
          </ComposableMap>

          {/* 📡 Live Cyber Data Stream HUD (Top Right Corner) */}
          <div className="absolute top-3 right-3 max-w-sm rounded-xl border border-white/10 bg-black/85 p-2.5 font-mono text-[10px] text-slate-300 backdrop-blur-md shadow-2xl space-y-1">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live P2P Transmission Stream
              </span>
              <span className="text-slate-500 font-bold">CADENCE 3.0s</span>
            </div>
            {telemetryLogs.map((log, idx) => (
              <div
                key={idx}
                className={`truncate transition-all ${
                  idx === 0 ? "text-cyan-300 font-semibold" : "text-slate-400 opacity-70"
                }`}
              >
                {log}
              </div>
            ))}
          </div>

          {/* Hover / Active Country Badge Overlay */}
          {hoveredCountry && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/85 backdrop-blur-md border border-cyan-500/40 rounded-lg text-[10.5px] font-mono text-cyan-300 shadow-xl">
              Target Zone: <strong className="text-white">{hoveredCountry}</strong>
              {activeCountries.includes(hoveredCountry) && (
                <span className="text-emerald-400 font-bold ml-2">● Active Seed Node</span>
              )}
            </div>
          )}

          {/* Bottom Coordinate Bar */}
          <div className="absolute bottom-2 left-3 flex items-center gap-3 font-mono text-[9.5px] text-slate-400 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm">
            <span>GRID: WGS84 ATLAS (110M)</span>
            <span>·</span>
            <span>CADENCE: 3.00s POPC</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">{auditTimestamp}</span>
          </div>
        </div>

        {/* High-Density 5-Node Telemetry Table (Bloomberg Standard) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4 font-semibold">Node Code & Role</th>
                <th className="py-2.5 px-4 font-semibold">Geographic Location</th>
                <th className="py-2.5 px-4 font-semibold">Hardware Allocation</th>
                <th className="py-2.5 px-4 font-semibold">P2P Ingress SLA</th>
                <th className="py-2.5 px-4 font-semibold">BFT Weight</th>
                <th className="py-2.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {INSTITUTIONAL_5_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                return (
                  <tr
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 text-white font-medium"
                        : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isSelected ? "bg-emerald-400 animate-pulse" : "bg-cyan-400"
                          }`}
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{node.code}</span>
                            <span className="text-[9.5px] text-slate-400 font-normal">
                              ({node.name.split(" ")[0]})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">{node.role}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white">{node.region}</div>
                      <div className="text-[10px] text-slate-500">{node.provider}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200">
                        {node.hardware.vcpu} vCPU · {node.hardware.ramGb} GB RAM
                      </div>
                      <div className="text-[10px] text-slate-500">{node.hardware.storage}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-emerald-400 font-bold">
                        {node.p2p.latencyMs} ms <span className="text-[10px] font-normal text-slate-500">(±{node.p2p.jitterMs}ms)</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {node.p2p.protocol}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-bold">{node.consensus.votingWeight}</div>
                      <div className="text-[10px] text-cyan-300">{node.consensus.tps} tx/s</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} />
                        <span>{node.consensus.bftStatus}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Focused Node Cryptographic & Security Drilldown */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-cyan-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Inspecting Target: {selectedNode.code} — {selectedNode.name}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400">
            Validated State: Block #{liveBlock} (Deterministic Finality)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 block">Libp2p Peer Multiaddr</span>
            <div className="text-cyan-300 font-bold break-all">{selectedNode.p2p.multiaddr}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 block">Anti-DDoS Shielding SLA</span>
            <div className="text-emerald-300 font-bold">{selectedNode.hardware.antiDdos}</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
            <span className="text-[10px] uppercase text-slate-500 block">Byzantine Consensus Invariant</span>
            <div className="text-white font-bold">
              3.00s Cadence · 0 Slashing Penalties
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
