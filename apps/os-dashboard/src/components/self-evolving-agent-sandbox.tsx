"use client";

import { useState } from "react";
import {
  Activity,
  Brain,
  Cpu,
  Dna,
  Layers3,
  Network,
  Plug,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, IconBadge } from "@/components/card";

interface EvolutionStep {
  generation: number;
  accuracy: number;
  latencyMs: number;
  loss: number;
  newSkill?: string;
  proofHash: string;
  timestamp: string;
  notes: string;
}

// No fabricated genesis state or evolution tiers are injected. The sandbox starts
// empty and only reflects real on-chain self-evolution records once a sovereign
// agent registers and reports actual training/evolution proof on-chain.
const EMPTY_STATE = {
  name: "Self-Evolving Agent Sandbox",
  currentGen: 0,
  accuracy: 0,
  latencyMs: 0,
  loss: 0,
  skills: [] as string[],
  history: [] as EvolutionStep[],
};

export function SelfEvolvingAgentSandbox() {
  const [state, setState] = useState(EMPTY_STATE);
  const [evolutionLog, setEvolutionLog] = useState<string | null>(null);

  const handleReset = () => {
    setState(EMPTY_STATE);
    setEvolutionLog(null);
  };

  return (
    <Card className="space-y-4 border-white/10 bg-slate-950/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <IconBadge Icon={Dna} tone="ai" className="h-11 w-11" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{state.name}</h3>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9.5px] font-bold text-cyan-300">
                Generation {state.currentGen}
              </span>
            </div>
            <p className="text-[11px] font-sans text-slate-400">
              Recursive Self-Improvement & Neural Delta Merging Proving Grounds
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10.5px] text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>

      {/* 4 Live Empirical Metrics Display */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="text-[10px] uppercase text-slate-400">Benchmark Accuracy</div>
          <div className="text-lg font-bold text-emerald-400">—</div>
          <div className="text-[9px] text-emerald-300 font-sans mt-0.5">Awaiting on-chain agent</div>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
          <div className="text-[10px] uppercase text-slate-400">Inference Latency</div>
          <div className="text-lg font-bold text-cyan-300">—</div>
          <div className="text-[9px] text-cyan-300 font-sans mt-0.5">Awaiting on-chain agent</div>
        </div>

        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
          <div className="text-[10px] uppercase text-slate-400">Cross-Entropy Loss</div>
          <div className="text-lg font-bold text-violet-300">—</div>
          <div className="text-[9px] text-violet-400 font-sans mt-0.5">Awaiting on-chain agent</div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="text-[10px] uppercase text-slate-400">Installed MCP Skills</div>
          <div className="text-lg font-bold text-amber-300">0 Tools</div>
          <div className="text-[9px] text-amber-400 font-sans mt-0.5">Awaiting on-chain agent</div>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-8 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400/60">
          <Brain size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-200">No Self-Evolving Agent Registered</p>
          <p className="mx-auto mt-1 max-w-sm text-[11px] font-mono leading-relaxed text-slate-500">
            No sovereign agent has registered on-chain with real evolution proof yet. This sandbox
            reflects only actual on-chain training/evolution records — no fabricated accuracy,
            latency, loss, or proof hashes are injected.
          </p>
        </div>
      </div>

      {/* Active Skills Belt */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase tracking-wider text-slate-500">
          Acquired Skill Belt:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {state.skills.length === 0 ? (
            <span className="text-[10.5px] text-slate-600">No skills acquired yet.</span>
          ) : (
            state.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10.5px] text-slate-300"
              >
                <Plug size={10} className="text-emerald-400" />
                {skill}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Evolution Lineage History */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
          Empirical Lineage Tree ({state.history.length} Generations Recorded)
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {state.history.length === 0 ? (
            <p className="text-[10.5px] text-slate-600">
              No evolution generations recorded yet. Lineage is populated only from real on-chain
              evolution proof submissions.
            </p>
          ) : (
            state.history.map((step) => (
              <div
                key={step.generation}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[10.5px] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    Generation {step.generation} {step.generation === 0 && "(Genesis)"}
                  </span>
                  <span className="text-slate-500 text-[9.5px]">{step.timestamp}</span>
                </div>
                <p className="text-slate-300 font-sans text-[11px]">{step.notes}</p>
                <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-0.5">
                  <span>Accuracy: <strong className="text-emerald-400">{step.accuracy}%</strong> | Latency: <strong className="text-cyan-300">{step.latencyMs}ms</strong></span>
                  <span className="truncate max-w-[150px] text-slate-400">{step.proofHash}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
