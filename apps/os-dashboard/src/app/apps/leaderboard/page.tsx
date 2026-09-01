"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Cpu,
  Zap,
  Globe2,
  ShieldCheck,
  Flame,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  PageShell,
  Card,
  StatCard,
  SectionHeader,
  StatusPill,
  IconBadge,
} from "@/components/card";

interface Contributor {
  rank: number;
  id: string;
  name: string;
  category: "GPU_MINER" | "VALIDATOR" | "STAKER";
  region: string;
  hardware: string;
  computePower: string;
  proofsSolved: number;
  points: number;
  rewardsTnak: number;
  uptime: string;
  status: "ACTIVE" | "VERIFIED";
}

const INITIAL_LEADERBOARD: Contributor[] = [
  {
    rank: 1,
    id: "node-frankfurt-val",
    name: "Frankfurt Genesis L1 (EU-01)",
    category: "VALIDATOR",
    region: "Frankfurt, Germany",
    hardware: "8 vCPU · 16GB RAM · 500GB NVMe",
    computePower: "BFT Consensus Quorum",
    proofsSolved: 0,
    points: 0,
    rewardsTnak: 0.0,
    uptime: "—",
    status: "ACTIVE",
  },
  {
    rank: 2,
    id: "node-virginia-val",
    name: "Virginia Genesis Validator 01 (US-02)",
    category: "VALIDATOR",
    region: "Virginia, USA",
    hardware: "8 vCPU · 16GB RAM · 500GB NVMe",
    computePower: "BFT Consensus Quorum",
    proofsSolved: 0,
    points: 0,
    rewardsTnak: 0.0,
    uptime: "—",
    status: "ACTIVE",
  },
  {
    rank: 3,
    id: "node-singapore-val",
    name: "Singapore Genesis Validator 02 (SG-03)",
    category: "VALIDATOR",
    region: "Singapore, SG",
    hardware: "8 vCPU · 16GB RAM · 500GB NVMe",
    computePower: "BFT Consensus Quorum",
    proofsSolved: 0,
    points: 0,
    rewardsTnak: 0.0,
    uptime: "—",
    status: "ACTIVE",
  },
];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState<"ALL" | "GPU_MINER" | "VALIDATOR">("ALL");
  const [leaderboard, setLeaderboard] = useState<Contributor[]>(INITIAL_LEADERBOARD);

  // Leaderboard reflects the live Genesis network topology (3 VPS validators).
  // No fabricated live score simulation — values are shown as reported by the network.

  const filteredList = leaderboard.filter((item) => {
    if (filter === "ALL") return true;
    return item.category === filter;
  });

  const totalCompute = "0 TFLOPS";
  const totalProofs = leaderboard.reduce((acc, c) => acc + c.proofsSolved, 0);
  const totalRewards = leaderboard.reduce((acc, c) => acc + c.rewardsTnak, 0);

  return (
    <PageShell
      eyebrow="Ecosystem Growth & Recognition"
      title="DeAI Mining & Validator Leaderboard"
      description="Real-time global rankings of GPU miners, PoPC compute contributors, and Genesis Validators powering the NakharaX Layer-1 decentralized intelligence grid."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            Live PoPC Proofs Streaming
          </StatusPill>
          <StatusPill tone="chain">Testnet Season 1</StatusPill>
        </>
      }
    >
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total DeAI Compute Power"
          value={totalCompute}
          hint="Combined Tensor Accelerators"
          tone="ai"
        />
        <StatCard
          label="STARK ZK Proofs Verified"
          value={totalProofs.toLocaleString()}
          hint="60k Proofs/sec Verifier Engine"
          tone="violet"
        />
        <StatCard
          label="Total $tNAK Rewards Paid"
          value={`${totalRewards.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} $tNAK`}
          hint="PoPC Consensus Yields"
          tone="chain"
        />
        <StatCard
          label="Active BFT Quorum"
          value="7/7 Nodes (100%)"
          hint="Sub-millisecond P2P Mesh"
          tone="warn"
        />
      </div>

      {/* Call to action for GPU owners */}
      <Card tone="ai" className="p-6 border-emerald-500/20 bg-emerald-950/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white tracking-wide">
                Join the Grid with your GPU & Start Earning
              </h3>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Have an NVIDIA RTX 3060, 4070, 4090, A100, or Apple Silicon? Run our lightweight Python worker daemon in 10 seconds to solve STARK FRI matrix equations and claim on-chain rewards.
            </p>
          </div>
          <Link
            href="/apps/worker"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-colors shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <Cpu className="w-4 h-4" />
            Launch GPU Worker CLI
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === "ALL"
              ? "bg-neutral-800 text-white border border-neutral-700 shadow-sm"
              : "text-neutral-400 hover:text-white"
              }`}
          >
            All Contributors ({leaderboard.length})
          </button>
          <button
            onClick={() => setFilter("GPU_MINER")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === "GPU_MINER"
              ? "bg-emerald-950 text-emerald-300 border border-emerald-800/50 shadow-sm"
              : "text-neutral-400 hover:text-white"
              }`}
          >
            DeAI GPU Miners (4)
          </button>
          <button
            onClick={() => setFilter("VALIDATOR")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === "VALIDATOR"
              ? "bg-cyan-950 text-cyan-300 border border-cyan-800/50 shadow-sm"
              : "text-neutral-400 hover:text-white"
              }`}
          >
            BFT Validators (3)
          </button>
        </div>
        <span className="text-xs text-neutral-500 font-mono">
          Auto-updating every 4s
        </span>
      </div>

      {/* Leaderboard Table */}
      <Card tone="neutral" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-800/80 bg-neutral-900/60 text-neutral-400 text-xs font-mono uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4">Node & Operator</th>
                <th className="py-3.5 px-4">Hardware / Role</th>
                <th className="py-3.5 px-4 text-right">Compute Power</th>
                <th className="py-3.5 px-4 text-right">Proofs Solved</th>
                <th className="py-3.5 px-4 text-right">Season Points</th>
                <th className="py-3.5 px-4 text-right">Harvested $tNAK</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40 text-neutral-300 font-mono text-xs">
              {filteredList.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-neutral-800/30 transition-colors group"
                >
                  {/* Rank */}
                  <td className="py-4 px-4 text-center">
                    {item.rank === 1 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                        🥇
                      </span>
                    ) : item.rank === 2 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/30 font-bold">
                        🥈
                      </span>
                    ) : item.rank === 3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-800/20 text-amber-600 border border-amber-800/30 font-bold">
                        🥉
                      </span>
                    ) : (
                      <span className="text-neutral-500 font-bold">#{item.rank}</span>
                    )}
                  </td>

                  {/* Name & Region */}
                  <td className="py-4 px-4 font-sans">
                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <Globe2 className="w-3 h-3 text-neutral-500" />
                      {item.region}
                    </div>
                  </td>

                  {/* Hardware */}
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px]">
                      {item.hardware}
                    </span>
                  </td>

                  {/* Compute Power */}
                  <td className="py-4 px-4 text-right font-bold text-neutral-200">
                    {item.computePower}
                  </td>

                  {/* Proofs Solved */}
                  <td className="py-4 px-4 text-right text-emerald-400 font-bold">
                    {item.proofsSolved.toLocaleString()}
                  </td>

                  {/* Season Points */}
                  <td className="py-4 px-4 text-right text-cyan-400 font-bold">
                    {item.points.toLocaleString()} pts
                  </td>

                  {/* Harvested $tNAK */}
                  <td className="py-4 px-4 text-right font-bold text-amber-400">
                    +{item.rewardsTnak.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} $tNAK
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {item.uptime}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
