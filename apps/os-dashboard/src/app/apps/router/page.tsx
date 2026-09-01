"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Globe2,
  Layers3,
  Network,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Split,
  Workflow,
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

interface RoutingRule {
  id: string;
  taskType: string;
  preferredHardware: string;
  maxLatencyMs: number;
  maxCostWei: string;
  verificationLevel: "LIGHT_SAMPLING" | "FULL_STARK" | "OPTIMISTIC_DISPUTE";
  activeRoute: string;
}

const INITIAL_ROUTING_RULES: RoutingRule[] = [
  {
    id: "rule-llm-70b",
    taskType: "70B+ Foundation Model Inference",
    preferredHardware: "High-End GPU Clustered (A100 / RTX 5090)",
    maxLatencyMs: 250,
    maxCostWei: "0.15 tNAK",
    verificationLevel: "FULL_STARK",
    activeRoute: "Cloud-Pro-Cluster-EU",
  },
  {
    id: "rule-reasoning-8b",
    taskType: "DeepSeek-R1 CoT Math/Logic",
    preferredHardware: "Mid-Tier Workstation / Mac M4 Max",
    maxLatencyMs: 500,
    maxCostWei: "0.05 tNAK",
    verificationLevel: "LIGHT_SAMPLING",
    activeRoute: "Universal-Edge-Mesh-AP",
  },
  {
    id: "rule-vision-yolo",
    taskType: "Edge Vision & Object Detection",
    preferredHardware: "Raspberry Pi 5 + Hailo-10H NPU",
    maxLatencyMs: 30,
    maxCostWei: "0.01 tNAK",
    verificationLevel: "OPTIMISTIC_DISPUTE",
    activeRoute: "Local-Edge-Sentinel-01",
  },
  {
    id: "rule-lora-merge",
    taskType: "TIES/DARE Tensor Merging",
    preferredHardware: "Validator Core High-RAM (32GB+)",
    maxLatencyMs: 1200,
    maxCostWei: "0.50 tNAK",
    verificationLevel: "FULL_STARK",
    activeRoute: "Validator-Consensus-Pool",
  },
];

export default function ASRComputeRouterPage() {
  const [rules, setRules] = useState<RoutingRule[]>(INITIAL_ROUTING_RULES);
  const [costWeight, setCostWeight] = useState(0.40);
  const [latencyWeight, setLatencyWeight] = useState(0.40);
  const [proofWeight, setProofWeight] = useState(0.20);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  async function handleOptimizePolicy() {
    try {
      setIsSimulating(true);
      setSimulationResult(
        `ASR Policy Matrix\nObjective Function: R = -${costWeight.toFixed(2)}*(Cost) - ${latencyWeight.toFixed(2)}*(Latency) + ${proofWeight.toFixed(2)}*(Reputation)\n\n⚠️ No live compute cluster is connected yet.\nPolicy weights saved locally. Real throughput/cost optimization requires connected GPU workers.`
      );
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <PageShell
      eyebrow="Compute Orchestration"
      title="ASR Compute Policy Router & Scheduler"
      description="Action-State-Reward (ASR) reinforcement policy scheduler for dynamic workload partitioning across heterogeneous GPU clusters, workstations, and edge NPUs."
      meta={
        <>
          <StatusPill tone="chain" pulse>
            ASR Dynamic Routing Active
          </StatusPill>
          <StatusPill tone="ai">Sub-millisecond Dispatch</StatusPill>
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
          label="Routing Strategy"
          value="ASR Reinforcement"
          hint="Dynamic Pareto optimization"
          icon={<Workflow size={18} />}
          tone="chain"
        />
        <StatCard
          label="Dispatch Latency"
          value="1.42 ms"
          hint="Decision time per task"
          icon={<Zap size={18} />}
          tone="ai"
        />
        <StatCard
          label="Active Routes"
          value="4 Pipelines"
          hint="Heterogeneous hardware tiering"
          icon={<Split size={18} />}
          tone="violet"
        />
        <StatCard
          label="Cost Efficiency"
          value="+24.8%"
          hint="Over centralized cloud GPUs"
          icon={<Sparkles size={18} />}
          tone="warn"
        />
      </div>

      {/* 2-Column Grid: Left Rules List, Right ASR Hyperparameter Tuning */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: Active Routing Rules */}
        <div className="space-y-3 lg:col-span-7">
          <SectionHeader
            title="Active Hardware & Policy Routing Rules"
            subtitle="Automatic dispatching based on model size and latency SLA"
          />

          <div className="space-y-3">
            {rules.map((rule) => (
              <Card key={rule.id} className="space-y-2.5 border-white/10 bg-slate-950/80 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <IconBadge Icon={Workflow} tone="chain" className="h-9 w-9" />
                    <div>
                      <h3 className="text-[13.5px] font-bold text-white">{rule.taskType}</h3>
                      <span className="text-[10.5px] font-mono text-emerald-400">
                        Target: {rule.preferredHardware}
                      </span>
                    </div>
                  </div>
                  <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[9.5px] font-mono font-semibold text-cyan-300">
                    {rule.verificationLevel}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.08] pt-2 text-[11px] font-mono text-slate-300">
                  <span>Max Latency: <strong className="text-white">{rule.maxLatencyMs} ms</strong></span>
                  <span>Max Cost: <strong className="text-emerald-300">{rule.maxCostWei}</strong></span>
                  <span>Route: <strong className="text-violet-300">{rule.activeRoute}</strong></span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: ASR Policy Multi-Objective Sliders */}
        <div className="space-y-4 lg:col-span-5">
          <SectionHeader
            title="ASR Multi-Objective Policy Tuning"
            subtitle="Adjust tradeoff weights between Cost, Latency, and Proof Security"
          />

          <Card className="space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>Cost Optimization Weight (Beta-Cost):</span>
                <span className="font-bold text-emerald-400">{(costWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={costWeight}
                onChange={(e) => setCostWeight(parseFloat(e.target.value))}
                className="mt-2 w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>Latency Minimization Weight (Beta-Latency):</span>
                <span className="font-bold text-cyan-400">{(latencyWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={latencyWeight}
                onChange={(e) => setLatencyWeight(parseFloat(e.target.value))}
                className="mt-2 w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-300">
                <span>Proof & Security Weight (Beta-Proof):</span>
                <span className="font-bold text-violet-400">{(proofWeight * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={proofWeight}
                onChange={(e) => setProofWeight(parseFloat(e.target.value))}
                className="mt-2 w-full accent-violet-500"
              />
            </div>

            <button
              type="button"
              onClick={handleOptimizePolicy}
              disabled={isSimulating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 text-[12px] font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)] disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
              {isSimulating ? "Recalibrating Routing Model..." : "Recalibrate ASR Routing Model"}
            </button>

            {simulationResult && (
              <pre className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
                {simulationResult}
              </pre>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
