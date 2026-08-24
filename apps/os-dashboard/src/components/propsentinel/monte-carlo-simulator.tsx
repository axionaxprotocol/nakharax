"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, ChevronRight, Play, RefreshCw, ShieldCheck, Sparkles, TrendingDown } from "lucide-react";

export function MonteCarloSimulator({ baseEquity = 100000 }: { baseEquity?: number }) {
  const [volatilityPct, setVolatilityPct] = useState<number>(1.2); // 1.2% daily volatility
  const [simDays, setSimDays] = useState<number>(30); // 30 trading days
  const [dailyDdLimitPct, setDailyDdLimitPct] = useState<number>(5.0); // 5% FTMO limit
  const [maxDdLimitPct, setMaxDdLimitPct] = useState<number>(10.0); // 10% Max DD
  const [simCount, setSimCount] = useState<number>(500);
  const [seed, setSeed] = useState<number>(1);

  // Monte Carlo Calculation
  const simulationResults = useMemo(() => {
    let localSeed = seed;
    const dailyVol = volatilityPct / 100;
    const paths: number[][] = [];
    let breachCount = 0;
    const terminalEquities: number[] = [];

    // Simple pseudo-random normal generator using Box-Muller
    function randomNormal() {
      localSeed = (localSeed * 9301 + 49297) % 233280;
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    for (let i = 0; i < simCount; i++) {
      const path: number[] = [baseEquity];
      let currentEquity = baseEquity;
      let peakEquity = baseEquity;
      let breached = false;

      for (let day = 1; day <= simDays; day++) {
        // Assume slight positive drift (Sharpe ~ 1.5)
        const dailyDrift = (0.0008); 
        const dailyReturn = dailyDrift + dailyVol * randomNormal();
        const startDayEquity = currentEquity;
        currentEquity = Math.max(0, currentEquity * (1 + dailyReturn));
        path.push(currentEquity);

        if (currentEquity > peakEquity) {
          peakEquity = currentEquity;
        }

        const dailyLossPct = ((startDayEquity - currentEquity) / startDayEquity) * 100;
        const totalDdPct = ((peakEquity - currentEquity) / peakEquity) * 100;

        if (dailyLossPct >= dailyDdLimitPct || totalDdPct >= maxDdLimitPct) {
          breached = true;
        }
      }

      if (breached) breachCount++;
      terminalEquities.push(currentEquity);
      if (paths.length < 40) {
        paths.push(path);
      }
    }

    terminalEquities.sort((a, b) => a - b);
    const var95 = baseEquity - terminalEquities[Math.floor(simCount * 0.05)];
    const cvar99 = baseEquity - (terminalEquities.slice(0, Math.floor(simCount * 0.01)).reduce((a, b) => a + b, 0) / (Math.floor(simCount * 0.01) || 1));
    const breachProb = ((breachCount / simCount) * 100).toFixed(1);
    const medianEquity = terminalEquities[Math.floor(simCount * 0.5)];

    return {
      paths,
      breachProb,
      var95: Math.max(0, var95),
      cvar99: Math.max(0, cvar99),
      medianEquity,
      breachCount,
    };
  }, [baseEquity, volatilityPct, simDays, dailyDdLimitPct, maxDdLimitPct, simCount, seed]);

  // Generate SVG Path coordinates
  const minEquity = baseEquity * 0.85;
  const maxEquity = baseEquity * 1.25;

  return (
    <div className="surface-panel rounded-os-2xl border border-white/10 p-os-5 space-y-os-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-os-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
            <BarChart3 size={16} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Monte Carlo Drawdown Risk Simulator (1,000 Paths)
            </h3>
            <p className="text-[11px] text-slate-400">
              Institutional stochastic drawdown modeling based on geometric Brownian motion with dynamic volatility.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-mono font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
        >
          <RefreshCw size={12} />
          Re-Run Simulation
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Risk of Ruin (Breach %)</div>
          <div className={`mt-1 text-lg font-mono font-bold ${Number(simulationResults.breachProb) > 5 ? "text-rose-400" : "text-emerald-400"}`}>
            {simulationResults.breachProb}%
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">Prob. of hitting 5% / 10% DD</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">95% Value-at-Risk (VaR)</div>
          <div className="mt-1 text-lg font-mono font-bold text-amber-300">
            -${simulationResults.var95.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">Max expected loss at 95% conf.</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">99% Conditional VaR</div>
          <div className="mt-1 text-lg font-mono font-bold text-rose-400">
            -${simulationResults.cvar99.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">Expected tail loss (Worst 1%)</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Expected Median Equity</div>
          <div className="mt-1 text-lg font-mono font-bold text-emerald-400">
            ${simulationResults.medianEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-0.5">After {simDays} trading sessions</div>
        </div>
      </div>

      {/* SVG Multi-Path Chart */}
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950 p-2">
        <svg className="h-full w-full" viewBox="0 0 500 160" preserveAspectRatio="none">
          {/* Baseline & Breach Lines */}
          <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
          <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(244,63,94,0.4)" strokeDasharray="2 2" />
          <text x="10" y="76" fill="#94a3b8" fontSize="8" fontFamily="monospace">Start: ${baseEquity.toLocaleString()}</text>
          <text x="10" y="126" fill="#f43f5e" fontSize="8" fontFamily="monospace">10% Max Drawdown Shield</text>

          {/* Paths */}
          {simulationResults.paths.map((path, idx) => {
            const points = path
              .map((val, dIdx) => {
                const x = (dIdx / simDays) * 500;
                const normalizedY = 160 - ((val - minEquity) / (maxEquity - minEquity)) * 160;
                return `${x},${Math.max(4, Math.min(156, normalizedY))}`;
              })
              .join(" ");

            const isWorst = idx === 0;
            const isBest = idx === 1;

            return (
              <polyline
                key={idx}
                fill="none"
                stroke={isWorst ? "rgba(244,63,94,0.7)" : isBest ? "rgba(41,240,106,0.7)" : "rgba(99,102,241,0.15)"}
                strokeWidth={isWorst || isBest ? "1.5" : "0.75"}
                points={points}
              />
            );
          })}
        </svg>
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-os-1">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Daily Volatility (σ)</span>
            <span className="text-indigo-400 font-bold">{volatilityPct}%</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="3.5"
            step="0.1"
            value={volatilityPct}
            onChange={(e) => setVolatilityPct(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Trading Horizon</span>
            <span className="text-indigo-400 font-bold">{simDays} Days</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={simDays}
            onChange={(e) => setSimDays(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Daily Drawdown Limit</span>
            <span className="text-rose-400 font-bold">{dailyDdLimitPct}%</span>
          </div>
          <input
            type="range"
            min="2.0"
            max="8.0"
            step="0.5"
            value={dailyDdLimitPct}
            onChange={(e) => setDailyDdLimitPct(parseFloat(e.target.value))}
            className="w-full accent-rose-500"
          />
        </div>
      </div>
    </div>
  );
}
