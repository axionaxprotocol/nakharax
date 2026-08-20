"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Globe2,
  KeyRound,
  Layers3,
  Lock,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Slash,
  Sparkles,
  Terminal,
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

interface ValidatorNodeSecurity {
  nodeId: string;
  moniker: string;
  region: string;
  stakedNak: string;
  uptimePercent: number;
  missedBlocks: number;
  byzantineScore: number; // 0 (clean) to 100 (hostile)
  status: "ACTIVE_VALID" | "IN_ARBITRATION" | "SLASHED_PENALTY";
  lastProofValid: boolean;
}

const VALIDATOR_AUDIT_NODES: ValidatorNodeSecurity[] = [
  {
    nodeId: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    moniker: "Sentinel-Alpha (Frankfurt EU)",
    region: "EU-Central",
    stakedNak: "50,000 tNAK",
    uptimePercent: 99.98,
    missedBlocks: 1,
    byzantineScore: 0.02,
    status: "ACTIVE_VALID",
    lastProofValid: true,
  },
  {
    nodeId: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    moniker: "Sentinel-Beta (Sydney AU)",
    region: "AP-Southeast",
    stakedNak: "50,000 tNAK",
    uptimePercent: 99.95,
    missedBlocks: 2,
    byzantineScore: 0.05,
    status: "ACTIVE_VALID",
    lastProofValid: true,
  },
  {
    nodeId: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    moniker: "Sentinel-Gamma (N. Virginia US)",
    region: "US-East",
    stakedNak: "50,000 tNAK",
    uptimePercent: 100.0,
    missedBlocks: 0,
    byzantineScore: 0.01,
    status: "ACTIVE_VALID",
    lastProofValid: true,
  },
  {
    nodeId: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    moniker: "Sentinel-Delta (Tokyo JP)",
    region: "AP-Northeast",
    stakedNak: "50,000 tNAK",
    uptimePercent: 99.89,
    missedBlocks: 4,
    byzantineScore: 0.08,
    status: "ACTIVE_VALID",
    lastProofValid: true,
  },
  {
    nodeId: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    moniker: "Rogue-Worker-Test (Simulated)",
    region: "Unknown-TOR",
    stakedNak: "10,000 tNAK",
    uptimePercent: 42.10,
    missedBlocks: 89,
    byzantineScore: 88.5,
    status: "SLASHED_PENALTY",
    lastProofValid: false,
  },
];

export default function HydraSentinelPage() {
  const [nodes, setNodes] = useState<ValidatorNodeSecurity[]>(VALIDATOR_AUDIT_NODES);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [sybilShieldActive, setSybilShieldActive] = useState(true);
  const [ipBanInput, setIpBanInput] = useState("");
  const [bannedIps, setBannedIps] = useState<string[]>(["198.51.100.42", "203.0.113.19"]);
  const [arbitrationNotice, setArbitrationNotice] = useState<string | null>(null);

  const handleBanIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipBanInput.trim()) return;
    setBannedIps([ipBanInput.trim(), ...bannedIps]);
    setIpBanInput("");
  };

  const handleTriggerArbitration = (node: ValidatorNodeSecurity) => {
    setArbitrationNotice(`⚖️ Byzantine Slashing Dispute Triggered for ${node.moniker}!\nEvidence: Gradient Discrepancy > 5.0%\nAction: Escrow slashed 2,500 tNAK -> Burn Address 0x000...dead`);
    setTimeout(() => setArbitrationNotice(null), 6000);
  };

  return (
    <PageShell
      eyebrow="Consensus Defense"
      title="Hydra Sentinel & Sybil Slashing Radar"
      description="Real-time Byzantine fault detection, automated validator staking slashing, DDoS mitigation, and peer reputation management."
      meta={
        <>
          <StatusPill tone="danger" pulse>
            Slashing Engine Armed
          </StatusPill>
          <StatusPill tone="ai">Zero-Exploit Radar</StatusPill>
        </>
      }
      actions={
        <Link
          href="/apps"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft size={13} />
          Modules
        </Link>
      }
    >
      {/* 4 Architecture Metric Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Slashing Radar"
          value="100% Armed"
          hint="Byzantine fault detection"
          icon={<ShieldAlert size={18} />}
          tone="danger"
        />
        <StatCard
          label="Honest Validators"
          value="4 / 5 Nodes"
          hint="Consensus supermajority (>67%)"
          icon={<ShieldCheck size={18} />}
          tone="ai"
        />
        <StatCard
          label="Slashed Stake"
          value="2,500 tNAK"
          hint="Total penalties enforced"
          icon={<Flame size={18} />}
          tone="warn"
        />
        <StatCard
          label="Rate Limiting"
          value="100 req/s"
          hint="DDoS flood mitigation"
          icon={<Zap size={18} />}
          tone="violet"
        />
      </div>

      {arbitrationNotice && (
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 font-mono text-[11.5px] text-red-300 whitespace-pre-wrap shadow-[0_0_25px_rgba(239,68,68,0.2)]">
          {arbitrationNotice}
        </div>
      )}

      {/* 2-Column Grid: Left Validator Slashing List, Right DDoS Defense Control */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: Validator Nodes Security Matrix */}
        <div className="space-y-3 lg:col-span-7">
          <SectionHeader
            title="Validator Node Integrity & Byzantine Scores"
            subtitle="Automated spot-checking telemetry and slashing triggers"
          />

          <div className="space-y-3">
            {nodes.map((node) => (
              <Card
                key={node.nodeId}
                className={`space-y-3 border p-4 transition-all ${
                  node.status === "SLASHED_PENALTY"
                    ? "border-red-500/40 bg-red-500/5"
                    : "border-white/10 bg-slate-950/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <IconBadge
                      Icon={node.status === "SLASHED_PENALTY" ? ShieldAlert : ShieldCheck}
                      tone={node.status === "SLASHED_PENALTY" ? "danger" : "ai"}
                      className="h-9 w-9"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13.5px] font-bold text-white">{node.moniker}</h3>
                        <span className={`rounded px-1.5 py-0.2 text-[9.5px] font-mono font-semibold ${
                          node.status === "ACTIVE_VALID"
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border border-red-500/30 bg-red-500/10 text-red-300"
                        }`}>
                          {node.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Region: {node.region} · Stake: {node.stakedNak}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[12px] font-mono font-bold text-white">
                      {node.uptimePercent}%
                    </div>
                    <div className="text-[9.5px] font-mono text-slate-500">
                      Uptime SLA
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-[11px] font-mono text-slate-300">
                  <span>Byzantine Risk: <strong className={node.byzantineScore > 10 ? "text-red-400" : "text-emerald-400"}>{node.byzantineScore}%</strong></span>
                  <span>Missed Blocks: <strong className={node.missedBlocks > 10 ? "text-red-400" : "text-slate-400"}>{node.missedBlocks}</strong></span>
                  {node.status === "ACTIVE_VALID" && (
                    <button
                      type="button"
                      onClick={() => handleTriggerArbitration(node)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-mono font-semibold text-red-300 hover:bg-red-500/20"
                    >
                      Arbitrate Slashing
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: DDoS Defense & IP Firewall */}
        <div className="space-y-4 lg:col-span-5">
          <SectionHeader
            title="DDoS & Sybil Defense Firewall"
            subtitle="Configure ingress rate limits and peer ban rules"
          />

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-bold text-white">Ingress Rate Limiter</div>
                <div className="text-[10.5px] font-mono text-slate-400">Max 100 req/s per client IP</div>
              </div>
              <button
                type="button"
                onClick={() => setRateLimitEnabled(!rateLimitEnabled)}
                className={`rounded-xl border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all ${
                  rateLimitEnabled
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {rateLimitEnabled ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <div>
                <div className="text-[13px] font-bold text-white">Sybil Proof Filter</div>
                <div className="text-[10.5px] font-mono text-slate-400">Drop unverified DHT spoofed peers</div>
              </div>
              <button
                type="button"
                onClick={() => setSybilShieldActive(!sybilShieldActive)}
                className={`rounded-xl border px-3 py-1.5 font-mono text-[11px] font-semibold transition-all ${
                  sybilShieldActive
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {sybilShieldActive ? "ACTIVE" : "BYPASSED"}
              </button>
            </div>

            <div className="border-t border-white/10 pt-3">
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Blacklist Hostile IP / Peer ID
              </label>
              <form onSubmit={handleBanIp} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.42"
                  value={ipBanInput}
                  onChange={(e) => setIpBanInput(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white focus:border-red-500/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-300 font-mono text-[11.5px] font-semibold px-4 py-2"
                >
                  Ban
                </button>
              </form>

              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-slate-500">Active Banned Ingress List:</div>
                {bannedIps.map((ip) => (
                  <div key={ip} className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-[11px] font-mono text-red-300">
                    <span>{ip}</span>
                    <span className="text-[9.5px] text-slate-500">BLOCKED (0 ms)</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
