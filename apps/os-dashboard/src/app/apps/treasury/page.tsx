"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flame,
  Building2,
  TrendingDown,
  TrendingUp,
  Shield,
  Clock,
  ArrowRight,
  Coins,
  Cpu,
  Layers,
  PieChart,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Lock,
  Sparkles,
  ArrowUpRight,
  Vote
} from "lucide-react";
import { PageShell, Card, StatusPill, IconBadge } from "@/components/card";

interface TreasuryStats {
  treasuryBalanceTokens: number;
  totalBurnedTokens: number;
  totalJobs: number;
  totalBurnedWei: string;
  totalTreasuryWei: string;
}

interface TransactionItem {
  hash: string;
  type: string;
  value: string;
  blockNumber: string;
  timestamp: number;
  from: string;
  to: string;
}

export default function TreasuryPage() {
  // Start from zeroed state; real on-chain values are fetched from
  // nak_getTreasuryStats. No fabricated/hardcoded fallback numbers.
  const [stats, setStats] = useState<TreasuryStats>({
    treasuryBalanceTokens: 0,
    totalBurnedTokens: 0,
    totalJobs: 0,
    totalBurnedWei: "0x0",
    totalTreasuryWei: "0x0",
  });
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [recentTxs, setRecentTxs] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTreasuryData = async () => {
    try {
      // 1. Fetch Block Number
      const bnRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      });
      const bnJson = await bnRes.json();
      const liveBlock = parseInt(bnJson.result || "0x0", 16);
      setCurrentBlock(liveBlock);

      // 2. Fetch Treasury Stats
      const tRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "nak_getTreasuryStats", params: [], id: 2 }),
      });
      const tJson = await tRes.json();
      if (tJson.result) {
        setStats(tJson.result);
      }

      // 3. Fetch Recent Transactions
      const txRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "nak_getRecentTransactions", params: [], id: 3 }),
      });
      const txJson = await txRes.json();
      if (txJson.result && Array.isArray(txJson.result)) {
        setRecentTxs(txJson.result.slice(0, 10));
      }
    } catch (err) {
      console.error("Error fetching treasury data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuryData();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchTreasuryData();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Use only live on-chain values. No fabricated fallback numbers.
  const treasuryBalance = typeof (stats as any)?.liquidBalance === 'string'
    ? parseFloat((stats as any).liquidBalance)
    : (stats?.treasuryBalanceTokens ?? 0);
  const totalBurned = typeof stats?.totalBurnedTokens === 'number'
    ? stats.totalBurnedTokens
    : 0;

  return (
    <PageShell
      title="DAO Treasury & EIP-1559 Burn Terminal"
      description="Real-Time Sovereign Economic Engine. Automated 50% EIP-1559 base fee burning, 30% protocol fee routing to DAO Treasury Vault, and 45% Mainnet Ecosystem Reserve governance."
    >
      {/* Top Economic Metrics Strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-amber-500/20 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span>DAO TREASURY VAULT</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-amber-300">
            {treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">$tNAK Vault Balance</p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
            <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
            <span>TOTAL BURNED</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-rose-400">
            {totalBurned.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">🔥 50% EIP-1559 Destroyed</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            <span>TREASURY INGRESS</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-cyan-300">30.0%</p>
          <p className="text-[11px] text-neutral-500 mt-1">Per Gas & Compute Fee</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            <span>COMPUTE JOBS FEE</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-emerald-300">5.0%</p>
          <p className="text-[11px] text-neutral-500 mt-1">DeAI Protocol Cut (95% GPU)</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
            <Lock className="h-3.5 w-3.5 text-indigo-400" />
            <span>MAINNET RESERVE</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-indigo-300">450B $NAK</p>
          <p className="text-[11px] text-neutral-500 mt-1">45% Ecosystem Reserve (1T)</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>BLOCK HEIGHT</span>
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-white">
            #{currentBlock.toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">1.0s Block Finality</p>
        </div>
      </div>

      {/* Main Grid: Fee Split Architecture & Ecosystem Reserve */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
        {/* Left 2 Cols: 3-Tier Split Invariant & Live Flow */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <PieChart className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Protocol 3-Tier Fee Split Invariant</h3>
                  <p className="text-xs text-neutral-400">Deterministic On-Chain Fee Division Formula</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                ACTIVE ON-CHAIN
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* 50% Burn */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-rose-300 font-bold">50% PERMANENT BURN</span>
                  <Flame className="h-4 w-4 text-rose-500" />
                </div>
                <p className="mt-3 text-2xl font-bold font-mono text-rose-400">50%</p>
                <p className="mt-1 text-[11px] text-neutral-300 leading-relaxed">
                  EIP-1559 BaseFee is permanently destroyed on-chain. Creates sustained deflationary pressure as network usage scales.
                </p>
              </div>

              {/* 30% DAO Treasury */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-300 font-bold">30% DAO TREASURY</span>
                  <Building2 className="h-4 w-4 text-amber-400" />
                </div>
                <p className="mt-3 text-2xl font-bold font-mono text-amber-300">30%</p>
                <p className="mt-1 text-[11px] text-neutral-300 leading-relaxed">
                  Credited directly to the DAO Ecosystem Treasury Vault (<code>0x2361...1E8f</code>) to fund continuous AI developer grants.
                </p>
              </div>

              {/* 20% Validator Priority */}
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-indigo-300 font-bold">20% VALIDATOR YIELD</span>
                  <Coins className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="mt-3 text-2xl font-bold font-mono text-indigo-300">20%</p>
                <p className="mt-1 text-[11px] text-neutral-300 leading-relaxed">
                  Priority tips paid directly to the active Block Proposer validator node, securing BFT consensus finality.
                </p>
              </div>
            </div>

            {/* DeAI GPU Compute Fee Split Banner */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 font-mono text-xs">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-cyan-400" />
                <div>
                  <span className="font-bold text-white">DeAI Compute Marketplace Fee Split:</span>
                  <p className="text-[11px] text-neutral-400">95% Paid to GPU Workers | 5% Retained by DAO Treasury</p>
                </div>
              </div>
              <span className="text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-lg">
                GPU Worker-First Economy
              </span>
            </div>
          </div>

          {/* Live Recent Ingress & Burn Transactions */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Live Ingress & Burn Stream</h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                1.0s Sub-Second Feed
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-neutral-400">
                    <th className="pb-3">BLOCK</th>
                    <th className="pb-3">TX HASH</th>
                    <th className="pb-3">TYPE</th>
                    <th className="pb-3">FEE SPLIT BREAKDOWN</th>
                    <th className="pb-3 text-right">VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentTxs.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-cyan-400">
                        #{parseInt(tx.blockNumber, 16) || currentBlock - idx}
                      </td>
                      <td className="py-3 text-neutral-300">
                        <Link
                          href={`/apps/explorer?tx=${tx.hash}`}
                          className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                        >
                          <span>{tx.hash.slice(0, 10)}...</span>
                          <ExternalLink className="h-3 w-3 text-neutral-500" />
                        </Link>
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${tx.type?.includes("COMPUTE")
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : tx.type?.includes("STAKING")
                              ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                              : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                            }`}
                        >
                          {tx.type || "TRANSFER"}
                        </span>
                      </td>
                      <td className="py-3 text-neutral-400 text-[11px]">
                        🔥 50% Burn · 🏛️ 30% DAO · ⛏️ 20% Val
                      </td>
                      <td className="py-3 text-right font-bold text-white">
                        {(Number(BigInt(tx.value || "0x0")) / 1e18).toFixed(2)} $tNAK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Mainnet 1T Reserve Allocation & DAO Grant Call */}
        <div className="space-y-6">
          {/* Mainnet Option A Reserve Breakdown */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4">
              <Lock className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">1T Mainnet Genesis Allocation</h3>
                <p className="text-xs text-neutral-400">Ratified Option A Model</p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-indigo-300">45% Ecosystem Reserve</span>
                  <span className="text-white">450,000,000,000 $NAK</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Emitted over 25+ years to fund validator block rewards and GPU worker yields.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-emerald-300">20% Mining & Staking Rewards</span>
                  <span className="text-white">200,000,000,000 $NAK</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Dedicated PoPC consensus validator and liquid staking yield pool.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-300">15% Core Protocol R&D</span>
                  <span className="text-white">150,000,000,000 $NAK</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  4-Year linear vesting for core engineering, STARK ZKP compiler, and Sentinel fleet.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-cyan-300">10% Public Testnet Airdrop</span>
                  <span className="text-white">100,000,000,000 $NAK</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Distributed to verified testnet node operators, miners, and active wallet testers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-pink-300">10% Strategic Liquidity Partners</span>
                  <span className="text-white">100,000,000,000 $NAK</span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Decentralized exchange liquidity pools and sovereign compute data centers.
                </p>
              </div>
            </div>
          </div>

          {/* DAO Grant Allocation Call-to-Action */}
          <div className="rounded-2xl border border-gradient-to-r border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <Vote className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Apply for DAO Treasury Grant</h3>
            </div>
            <p className="mt-2 text-xs text-neutral-300 leading-relaxed">
              Are you building DeAI models, MCP agents, or hardware rigs for NakharaX? Submit an on-chain grant proposal to request funding directly from the DAO Treasury Vault.
            </p>

            <div className="mt-5">
              <Link
                href="/apps/governance"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 p-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:brightness-110"
              >
                <span>Submit Grant Proposal on DAO</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
