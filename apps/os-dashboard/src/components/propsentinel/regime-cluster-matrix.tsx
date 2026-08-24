"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Layers,
  LineChart,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Card, SectionHeader, StatusPill } from "@/components/card";

export interface MarketRegime {
  id: "trending_momentum" | "volatility_shock" | "range_consolidation" | "liquidity_vacuum";
  name: string;
  probability: number;
  volatilityAnnualized: number;
  hurstExponent: number; // >0.5 trending, <0.5 mean-reverting
  regimeColor: string;
  recommendedLotMultiplier: number;
  maxDrawdownCapPct: number;
  description: string;
}

const REGIMES: MarketRegime[] = [
  {
    id: "trending_momentum",
    name: "Persistent Trend Momentum",
    probability: 64.2,
    volatilityAnnualized: 14.8,
    hurstExponent: 0.68,
    regimeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    recommendedLotMultiplier: 1.0,
    maxDrawdownCapPct: 5.0,
    description: "Strong directional drift detected. Trend-following breakout strategies optimal. Trailing drawdown shield active.",
  },
  {
    id: "volatility_shock",
    name: "News Liquidity Shock (CPI / NFP)",
    probability: 18.5,
    volatilityAnnualized: 46.2,
    hurstExponent: 0.52,
    regimeColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    recommendedLotMultiplier: 0.25,
    maxDrawdownCapPct: 2.5,
    description: "Sudden orderbook imbalance. High tail-risk. Dynamic lot sizing throttled to 25% to protect funded challenge equity.",
  },
  {
    id: "range_consolidation",
    name: "Asian Session Consolidation",
    probability: 14.1,
    volatilityAnnualized: 7.4,
    hurstExponent: 0.38,
    regimeColor: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    recommendedLotMultiplier: 0.75,
    maxDrawdownCapPct: 4.0,
    description: "Low-volatility mean-reverting regime. Tight Bollinger bands. Grid and statistical arbitrage algorithms enabled.",
  },
  {
    id: "liquidity_vacuum",
    name: "Rollover Spread Vacuum / Gap",
    probability: 3.2,
    volatilityAnnualized: 84.0,
    hurstExponent: 0.85,
    regimeColor: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    recommendedLotMultiplier: 0.0,
    maxDrawdownCapPct: 1.0,
    description: "Severe broker spread widening (>4.5 pips). EA bridge auto-activates defensive hold to prevent slippage breach.",
  },
];

export function RegimeClusterMatrix() {
  const [activeRegimeId, setActiveRegimeId] = useState<string>("trending_momentum");
  const activeRegime = REGIMES.find((r) => r.id === activeRegimeId) || REGIMES[0];

  return (
    <Card className="space-y-4 border-white/10 bg-slate-950/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
            <Gauge size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Markov Regime-Switching & Quantitative Volatility Engine
            </h3>
            <p className="text-[11px] text-slate-400">
              ChromaDB vector clustering & real-time Hurst Exponent market state classifier.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill tone="ai" pulse>
            Regime: {activeRegime.name}
          </StatusPill>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-mono text-cyan-300">
            Hurst H = {activeRegime.hurstExponent}
          </span>
        </div>
      </div>

      {/* 4-State Probability Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REGIMES.map((regime) => {
          const isCurrent = regime.id === activeRegimeId;
          return (
            <button
              key={regime.id}
              type="button"
              onClick={() => setActiveRegimeId(regime.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                isCurrent
                  ? `${regime.regimeColor} shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20`
                  : "border-white/10 bg-slate-950 hover:bg-white/[0.03] text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-white truncate mr-1">{regime.name.split(" ")[0]}</span>
                <span className="font-bold">{regime.probability}% Prob</span>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <div>
                  <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Annualized Vol</div>
                  <div className="text-sm font-mono font-bold text-white">σ = {regime.volatilityAnnualized}%</div>
                </div>
                <div className="text-right">
                  <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Lot Scaling</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">{regime.recommendedLotMultiplier}x</div>
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-black/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                  style={{ width: `${regime.probability}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Regime Execution Constraints */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 rounded-xl border border-white/10 bg-slate-950 p-4 font-mono text-xs">
        <div className="lg:col-span-8 space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-bold text-[12.5px]">
            <Activity size={14} />
            <span>Active Quantitative Constraints: {activeRegime.name}</span>
          </div>
          <p className="text-[11.5px] text-slate-300 leading-relaxed font-sans">
            {activeRegime.description}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[10.5px] text-slate-400">
            <span>• Microstructure: <strong className="text-white">Continuous Orderbook Stream</strong></span>
            <span>• Half-life Mean Reversion: <strong className="text-white">{activeRegime.hurstExponent < 0.5 ? "14.2 mins" : "N/A (Trending)"}</strong></span>
            <span>• Max Drawdown Ceiling: <strong className="text-emerald-400">{activeRegime.maxDrawdownCapPct}%</strong></span>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-white/10 bg-black/60 p-3.5 flex flex-col justify-between space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Recommended Lot Sizing</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 flex items-center gap-2">
            {activeRegime.recommendedLotMultiplier}x
            <span className="text-[10px] text-slate-400 font-normal">of Base Risk</span>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-white/10 pt-1.5 flex items-center justify-between">
            <span>Citadel Auto-Shield:</span>
            <span className="text-emerald-400 font-bold">ARMED</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
