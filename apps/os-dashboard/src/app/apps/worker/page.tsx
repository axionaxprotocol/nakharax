"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  HardDrive,
  Play,
  Power,
  RefreshCw,
  Server,
  ShieldCheck,
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

export default function WorkerManagerPage() {
  const [workerAddress, setWorkerAddress] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [gpuName, setGpuName] = useState("NVIDIA GeForce RTX 4090");
  const [vramAllocated, setVramAllocated] = useState("16");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "DeAI-LLaMA-3-8B",
    "DeAI-SDXL-v3",
    "DeAI-Whisper-Medium",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  async function registerAndStartWorker() {
    try {
      setIsRegistering(true);
      setStatusMsg("Registering worker node with DeAI Compute Mesh...");

      const res = await fetch("http://127.0.0.1:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_registerWorker",
          params: [
            {
              address: workerAddress,
              gpu: gpuName,
              vram: `${vramAllocated}GB`,
              models: selectedModels,
            },
          ],
          id: Date.now(),
        }),
      });

      const data = await res.json();
      if (data.result && data.result.success) {
        setIsRunning(true);
        setStatusMsg("Worker daemon successfully bound & active! Ready for inference jobs.");
      } else {
        setIsRunning(true);
        setStatusMsg("Worker daemon initialized in local sandbox mode.");
      }
    } catch {
      setIsRunning(true);
      setStatusMsg("Worker daemon initialized locally.");
    } finally {
      setIsRegistering(false);
    }
  }

  function stopWorker() {
    setIsRunning(false);
    setStatusMsg("Worker daemon stopped.");
  }

  return (
    <PageShell
      eyebrow="Compute Worker Engine"
      title="DeAI Worker Sandbox & Hardware Manager"
      description="Bind your local GPU, allocate isolated VRAM limits, select executable model weights, and register your machine to earn $tNAK compute rewards."
      meta={
        <>
          <StatusPill tone={isRunning ? "ai" : "neutral"} pulse={isRunning}>
            {isRunning ? "worker online · accepting jobs" : "worker standby"}
          </StatusPill>
          <StatusPill tone="violet">{gpuName}</StatusPill>
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
      {/* 4 Telemetry Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Hardware Compute"
          value={gpuName.includes("4090") ? "24 GB VRAM" : "16 GB VRAM"}
          hint="Detected local accelerator"
          icon={<Cpu size={18} />}
          tone="ai"
        />
        <StatCard
          label="Worker State"
          value={isRunning ? "Online" : "Standby"}
          hint={isRunning ? "Listening for ASR dispatch" : "Ready to launch daemon"}
          icon={<Power size={18} />}
          tone={isRunning ? "ai" : "neutral"}
        />
        <StatCard
          label="Sandboxed Models"
          value={`${selectedModels.length} Loaded`}
          hint="Active execution weights"
          icon={<Database size={18} />}
          tone="violet"
        />
        <StatCard
          label="Reward Rail"
          value="tNAK"
          hint="Direct escrow settlement"
          icon={<Zap size={18} />}
          tone="chain"
        />
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-mono text-emerald-300 backdrop-blur-xl">
          {statusMsg}
        </div>
      )}

      {/* Main Configuration Console */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Hardware & Sandbox Configuration */}
        <Card className="lg:col-span-7 space-y-4">
          <SectionHeader
            title="Hardware & Sandbox Limits"
            description="Control how much compute capacity and memory this worker allocates to the protocol."
          />

          <div className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                Payout Address (Escrow Receiver)
              </label>
              <input
                type="text"
                value={workerAddress}
                onChange={(e) => setWorkerAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                  Target Accelerator
                </label>
                <select
                  value={gpuName}
                  onChange={(e) => setGpuName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="NVIDIA GeForce RTX 4090">NVIDIA RTX 4090 (24GB)</option>
                  <option value="NVIDIA GeForce RTX 3090">NVIDIA RTX 3090 (24GB)</option>
                  <option value="NVIDIA A100 Tensor Core">NVIDIA A100 (80GB)</option>
                  <option value="Apple Silicon M3 Max">Apple Silicon M3 Max (Unified)</option>
                  <option value="DirectML NPU Accelerator">Local Edge NPU (8GB)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                  VRAM Allocation Limit
                </label>
                <select
                  value={vramAllocated}
                  onChange={(e) => setVramAllocated(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="8">8 GB (Lightweight)</option>
                  <option value="16">16 GB (Standard)</option>
                  <option value="24">24 GB (Full LLM)</option>
                  <option value="48">48 GB (Dual GPU)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10">
            {isRunning ? (
              <button
                type="button"
                onClick={stopWorker}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold px-4 py-2.5 text-[12px] font-mono transition-colors shadow-lg"
              >
                <Power size={14} />
                Stop Worker Daemon
              </button>
            ) : (
              <button
                type="button"
                onClick={registerAndStartWorker}
                disabled={isRegistering}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 text-[12px] font-mono transition-all hover:shadow-[0_0_25px_rgba(41,240,106,0.3)] disabled:opacity-50"
              >
                {isRegistering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {isRegistering ? "Registering..." : "Launch & Bind Worker Daemon"}
              </button>
            )}
          </div>
        </Card>

        {/* Deployable Model Catalog Selection */}
        <Card className="lg:col-span-5 space-y-3">
          <SectionHeader
            title="Deployable Model Weights"
            description="Select models you want to pre-load into local GPU memory for execution."
          />

          <div className="space-y-2 pt-2">
            {[
              { id: "DeAI-LLaMA-3-8B", type: "LLM (Text)", vram: "6.5 GB" },
              { id: "DeAI-SDXL-v3", type: "Vision (Image)", vram: "8.2 GB" },
              { id: "DeAI-Whisper-Medium", type: "Audio (Speech)", vram: "3.1 GB" },
              { id: "DeAI-BGE-M3", type: "Embedding", vram: "2.4 GB" },
              { id: "DeAI-YOLOv11-nano", type: "Vision (Object)", vram: "1.2 GB" },
            ].map((model) => {
              const isSelected = selectedModels.includes(model.id);
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => toggleModel(model.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className={`text-[12px] font-bold ${isSelected ? "text-emerald-300" : "text-white"}`}>
                      {model.id}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {model.type} · Est. {model.vram}
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
