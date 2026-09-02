"use client";

import { useEffect, useState } from "react";
import { useNetworkMesh, MeshNodeData } from "@/lib/use-network-mesh";
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

export function GlobalNodeMeshCanvas({ liveBlock = 2580 }: { liveBlock?: number }) {
  const [mounted, setMounted] = useState(false);
  const { meshNodes, meshConnections, isLive } = useNetworkMesh();
  const [selectedNode, setSelectedNode] = useState<MeshNodeData | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const currentNode = selectedNode || meshNodes[0] || null;
  const hasRpcTelemetry = isLive && liveBlock > 0;
  const configuredCountries = meshNodes
    .filter((node) => !node.isLiveWorker)
    .map((node) => node.countryName);
  const liveWorkerCountries = meshNodes
    .filter((node) => node.isLiveWorker && node.liveStats?.status === "ONLINE_ACTIVE")
    .map((node) => node.countryName);
  const activeWorkerCount = meshNodes.filter(
    (node) => node.isLiveWorker && node.liveStats?.status === "ONLINE_ACTIVE",
  ).length;

  useEffect(() => {
    setMounted(true);
  }, []);

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
                  NAKHARAX NODE TOPOLOGY · CONFIGURED REGIONAL MAP
                </h3>
                <span className="rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-200">
                  {hasRpcTelemetry ? `${activeWorkerCount} RPC-REPORTED WORKERS` : "RPC TELEMETRY PENDING"}
                </span>
              </div>
              <p className="text-[10.5px] font-mono text-slate-400">
                Map markers describe configured regions; worker state is shown only when reported by the RPC gateway.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-[10.5px] text-slate-300">
              RPC: <strong className={hasRpcTelemetry ? "text-emerald-400" : "text-slate-400"}>{hasRpcTelemetry ? `Block #${liveBlock.toLocaleString()}` : "Awaiting sample"}</strong>
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
                  const isConfiguredNode = configuredCountries.includes(countryName);
                  const isLiveWorkerCountry = hasRpcTelemetry && liveWorkerCountries.includes(countryName);
                  const matchingNode = meshNodes.find(
                    (n) => n.countryName === countryName
                  );
                  const isSelected =
                    matchingNode && currentNode && matchingNode.id === currentNode.id;
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
                            : isLiveWorkerCountry
                              ? "#047857"
                              : isConfiguredNode
                              ? "#0e7490"
                              : "#0c1322",
                          stroke: isSelected ? "#34d399" : isLiveWorkerCountry ? "#34d399" : isConfiguredNode ? "#0284c7" : "#1e293b",
                          strokeWidth: isSelected ? 0.9 : isConfiguredNode || isLiveWorkerCountry ? 0.6 : 0.35,
                          outline: "none",
                          cursor: isConfiguredNode || isLiveWorkerCountry ? "pointer" : "default",
                          transition: "all 250ms",
                        },
                        hover: {
                          fill: isConfiguredNode || isLiveWorkerCountry ? "#10b981" : "#1e293b",
                          stroke: isConfiguredNode || isLiveWorkerCountry ? "#6ee7b7" : "#334155",
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
            {meshConnections.map(([fromIdx, toIdx], idx) => {
              const n1 = meshNodes[fromIdx];
              const n2 = meshNodes[toIdx];
              if (!n1 || !n2) return null;
              const isHighlighted =
                currentNode && (currentNode.id === n1.id || currentNode.id === n2.id);

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
                    className={isHighlighted && hasRpcTelemetry ? "laser-beam-fast" : undefined}
                    style={{
                      filter: isHighlighted
                        ? "url(#laser-glow-cyan)"
                        : "url(#laser-glow-emerald)",
                    }}
                  />
                </g>
              );
            })}

            {/* 🎯 Node Markers with Triple Sonar Radar Waves */}
            {meshNodes.map((node) => {
              const isSelected = currentNode && currentNode.id === node.id;
              const isReportedLiveWorker = hasRpcTelemetry && node.isLiveWorker && node.liveStats?.status === "ONLINE_ACTIVE";

              return (
                <Marker
                  key={node.id}
                  coordinates={node.coordinates}
                  onClick={() => setSelectedNode(node)}
                >
                  {isReportedLiveWorker && (
                    <>
                      <circle r={isSelected ? 6 : 4} fill="none" stroke={isSelected ? "#10b981" : "#06b6d4"} className="sonar-ripple-1" style={{ pointerEvents: "none" }} />
                      <circle r={isSelected ? 6 : 4} fill="none" stroke={isSelected ? "#34d399" : "#38bdf8"} className="sonar-ripple-2" style={{ pointerEvents: "none" }} />
                      <circle r={isSelected ? 6 : 4} fill="none" stroke={isSelected ? "#6ee7b7" : "#7dd3fc"} className="sonar-ripple-3" style={{ pointerEvents: "none" }} />
                    </>
                  )}

                  {/* Inner Node Solid Core with Neon Aura */}
                  <circle
                    r={isSelected ? 5.5 : 4}
                    fill={isSelected || isReportedLiveWorker ? "#10b981" : "#0284c7"}
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
                    {node.code}
                  </text>
                </Marker>
              );
            })}
          </ComposableMap>

          {/* RPC telemetry HUD (Top Right Corner) */}
          <div className="absolute top-3 right-3 max-w-sm rounded-xl border border-white/10 bg-black/85 p-2.5 font-mono text-[10px] text-slate-300 backdrop-blur-md shadow-2xl space-y-1">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 border-b border-white/10 pb-1">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <span className={`h-1.5 w-1.5 rounded-full ${hasRpcTelemetry ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
                Public RPC Telemetry
              </span>
              <span className="text-slate-500 font-bold">{hasRpcTelemetry ? "AVAILABLE" : "PENDING"}</span>
            </div>
            <div className="text-cyan-200 font-semibold">
              {hasRpcTelemetry ? `Latest block: #${liveBlock.toLocaleString()}` : "Awaiting a block sample from the RPC gateway."}
            </div>
            <div className="text-slate-400">
              {activeWorkerCount > 0 ? `${activeWorkerCount} worker${activeWorkerCount > 1 ? "s" : ""} reported by RPC.` : "No active worker is currently reported by RPC."}
            </div>
          </div>

          {/* Hover / Active Country Badge Overlay */}
          {hoveredCountry && (
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/85 backdrop-blur-md border border-cyan-500/40 rounded-lg text-[10.5px] font-mono text-cyan-300 shadow-xl">
              Target Zone: <strong className="text-white">{hoveredCountry}</strong>
              {liveWorkerCountries.includes(hoveredCountry) ? (
                <span className="text-emerald-400 font-bold ml-2">● RPC-REPORTED WORKER</span>
              ) : configuredCountries.includes(hoveredCountry) && (
                <span className="text-cyan-300 font-bold ml-2">● CONFIGURED REGION</span>
              )}
            </div>
          )}

          {/* Bottom Coordinate Bar */}
          <div className="absolute bottom-2 left-3 flex items-center gap-3 font-mono text-[9.5px] text-slate-400 bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm">
            <span>GRID: WGS84 ATLAS (110M)</span>
            <span>·</span>
            <span>TOPOLOGY: CONFIGURED</span>
            <span>·</span>
            <span className={hasRpcTelemetry ? "text-emerald-400 font-bold" : "text-slate-400 font-bold"}>
              {hasRpcTelemetry ? `RPC BLOCK #${liveBlock.toLocaleString()}` : "AWAITING RPC"}
            </span>
          </div>
        </div>

        {/* High-Density Mesh Telemetry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-4 font-semibold">Node Code & Role</th>
                <th className="py-2.5 px-4 font-semibold">Geographic Location</th>
                <th className="py-2.5 px-4 font-semibold">Hardware Allocation</th>
                <th className="py-2.5 px-4 font-semibold">P2P Details</th>
                <th className="py-2.5 px-4 font-semibold">Topology Role</th>
                <th className="py-2.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {meshNodes.map((node) => {
                const isSelected = currentNode && currentNode.id === node.id;
                const isReportedLiveWorker = hasRpcTelemetry && node.isLiveWorker && node.liveStats?.status === "ONLINE_ACTIVE";
                return (
                  <tr
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer transition-colors ${isSelected
                      ? "bg-emerald-500/10 text-white font-medium"
                      : "hover:bg-white/[0.02]"
                      }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${node.isLiveWorker
                            ? isReportedLiveWorker
                              ? "bg-emerald-400 animate-ping"
                              : "bg-amber-400"
                            : isSelected
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-cyan-400"
                            }`}
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{node.code}</span>
                            <span className="text-[9.5px] text-slate-400 font-normal">
                              ({node.name.split(" ")[0]})
                            </span>
                            {node.isLiveWorker && (
                              <span className={`rounded text-[8.5px] font-bold px-1.5 py-0.2 ${isReportedLiveWorker ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                                {isReportedLiveWorker ? "RPC WORKER" : "WORKER STANDBY"}
                              </span>
                            )}
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
                      <div className={isReportedLiveWorker ? "text-emerald-400 font-bold" : "text-slate-400"}>
                        {isReportedLiveWorker ? "Worker reported active" : "No live RTT reported"}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">Configured protocol: {node.p2p.protocol}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-bold">{node.role}</div>
                      <div className="text-[10px] text-cyan-300">{node.isLiveWorker ? `${node.liveStats?.totalJobsCompleted ?? 0} reported jobs` : "Configured node"}</div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${isReportedLiveWorker ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-cyan-500/10 text-cyan-200 border-cyan-500/30"}`}>
                        <CheckCircle2 size={11} />
                        <span>{isReportedLiveWorker ? "RPC ACTIVE" : node.isLiveWorker ? "STANDBY" : "CONFIGURED"}</span>
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
      {currentNode && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-cyan-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Inspecting Target: {currentNode.code} — {currentNode.name}
              </span>
            </div>
            <span className={hasRpcTelemetry ? "text-[10px] text-emerald-400" : "text-[10px] text-slate-400"}>
              {hasRpcTelemetry ? `Latest RPC block: #${liveBlock.toLocaleString()}` : "RPC block not available"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
            <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-500 block">Peer Multiaddr</span>
              <div className="text-cyan-300 font-bold break-all">Not supplied by the current RPC telemetry.</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-500 block">Configured Hardware Profile</span>
              <div className="text-emerald-300 font-bold">{currentNode.provider}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/50 p-3 space-y-1">
              <span className="text-[10px] uppercase text-slate-500 block">Verification Scope</span>
              <div className="text-white font-bold">
                Current gateway exposes block and worker telemetry; validator finality is not asserted here.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
