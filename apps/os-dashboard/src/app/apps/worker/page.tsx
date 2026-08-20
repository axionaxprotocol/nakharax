"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  Flame,
  HardDrive,
  Play,
  Power,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
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

export default function WorkerManagerPage() {
  const [workerAddress, setWorkerAddress] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [gpuName, setGpuName] = useState("NVIDIA GeForce RTX 4090");
  const [vramAllocated, setVramAllocated] = useState("16");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "DeAI-LLaMA-3-8B",
    "DeAI-SDXL-v3",
    "DeAI-Whisper-Medium",
  ]);
  const [copied, setCopied] = useState(false);
  const [isSimulatedRunning, setIsSimulatedRunning] = useState(false);

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  // Generate real monolith_worker.toml configuration string
  const generatedToml = `[worker]
name = "nakharax-worker-${workerAddress.slice(2, 8).toLowerCase()}"
version = "1.0.0-hydra"
environment = "testnet"
payout_address = "${workerAddress}"

[network]
bootnodes = [
    "https://rpc.nakharax.com",
    "http://127.0.0.1:8545"
]
chain_id = 86137

[hardware]
accelerator = "${gpuName}"
max_memory_gb = ${vramAllocated}
force_cpu = false

[limits]
default_memory_mb = 4096
max_memory_mb = ${Number(vramAllocated) * 1024}
max_models_in_memory = ${selectedModels.length}

[models]
preload = [
${selectedModels.map((m) => `    "${m}"`).join(",\n")}
]

[cache]
enable_model_cache = true
max_cache_size_gb = 10
`;

  const copyToml = async () => {
    try {
      await navigator.clipboard.writeText(generatedToml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const downloadToml = () => {
    const blob = new Blob([generatedToml], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monolith_worker.toml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell
      eyebrow="Worker CLI & Sandbox"
      title="DeAI Worker Configuration Generator"
      description="Web interfaces cannot execute native GPU workloads directly without the background daemon. Use this console to configure hardware limits, generate your worker TOML, and launch the node CLI."
      meta={
        <>
          <StatusPill tone="warn">
            <AlertTriangle size={11} className="mr-1 inline text-amber-400" />
            Daemon CLI Required for Live GPU
          </StatusPill>
          <StatusPill tone="neutral">config builder</StatusPill>
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
      {/* Reality Check Alert Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-xl shadow-lg">
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
              Architecture Notice: Background Node Daemon is Required
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              To actually process live decentralized AI inference and earn $tNAK, your machine must run the 
              native Rust/Python background daemon (<code className="text-amber-200">python3 scripts/run-worker.py</code> or Docker). 
              A web browser cannot bind low-level Nvidia CUDA/NPU drivers on its own.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Architecture Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Target Hardware"
          value={gpuName.includes("4090") ? "24 GB VRAM" : "16 GB VRAM"}
          hint="Configured hardware profile"
          icon={<Cpu size={18} />}
          tone="ai"
        />
        <StatCard
          label="Execution Mode"
          value="Native CLI"
          hint="Requires monolith_worker.toml"
          icon={<Terminal size={18} />}
          tone="warn"
        />
        <StatCard
          label="Targeted Models"
          value={`${selectedModels.length} Selected`}
          hint="Preload candidate weights"
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

      {/* Main Configuration Console */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Hardware & Sandbox Configuration */}
        <Card className="lg:col-span-6 space-y-4">
          <SectionHeader
            title="1. Configure Hardware Profile"
            description="Adjust parameters for your local GPU/NPU and memory capacity."
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
                  <option value="NVIDIA GeForce RTX 5090">NVIDIA RTX 5090 (32GB Blackwell)</option>
                  <option value="NVIDIA GeForce RTX 4090">NVIDIA RTX 4090 (24GB Ada)</option>
                  <option value="NVIDIA A100 / H100 Tensor">NVIDIA A100/H100 (80GB SXM)</option>
                  <option value="AMD Radeon RX 7900 XTX">AMD RX 7900 XTX (24GB ROCm)</option>
                  <option value="Apple Silicon M4 Max">Apple Silicon M4 Max (Unified)</option>
                  <option value="Ryzen AI / Lunar Lake NPU">AMD / Intel NPU (50+ TOPS)</option>
                  <option value="Hailo-10H Edge NPU">Hailo-10H NPU (40 TOPS Edge)</option>
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
                  <option value="24">24 GB (Pro GPU)</option>
                  <option value="32">32 GB (RTX 5090)</option>
                  <option value="48">48 GB (Dual GPU)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Select Model Weights to Pre-load
              </label>
              <div className="space-y-1.5">
                {[
                  { id: "DeAI-DeepSeek-R1-8B", type: "Reasoning LLM", vram: "5.8 GB" },
                  { id: "DeAI-LLaMA-3.3-70B", type: "Flagship LLM", vram: "22.4 GB" },
                  { id: "DeAI-Flux.1-Schnell", type: "Vision (Image)", vram: "9.6 GB" },
                  { id: "DeAI-Whisper-Turbo", type: "Audio (Speech)", vram: "2.1 GB" },
                  { id: "DeAI-BGE-M3", type: "Embedding", vram: "1.8 GB" },
                ].map((model) => {
                  const isSelected = selectedModels.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => toggleModel(model.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="text-[11.5px] font-bold">{model.id} <span className="text-[10px] font-normal text-slate-400">({model.type})</span></span>
                      {isSelected && <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Generated TOML & Terminal Launch Command */}
        <Card className="lg:col-span-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <SectionHeader
                title="2. Generated monolith_worker.toml"
                description="Save this file to configs/monolith_worker.toml"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyToml}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10.5px] font-mono text-slate-300 transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={downloadToml}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[10.5px] font-mono text-slate-300 transition-colors"
                >
                  <Download size={12} className="text-cyan-400" />
                  Save
                </button>
              </div>
            </div>

            <pre className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-slate-200">
              {generatedToml}
            </pre>
          </div>

          {/* Terminal Launch Step */}
          <div className="border-t border-white/10 pt-3">
            <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              3. Launch Worker Daemon via Terminal
            </label>
            <div className="rounded-xl border border-white/10 bg-black/60 p-2.5 font-mono text-[11px] text-emerald-300 break-all select-all flex items-center justify-between">
              <code>python3 scripts/run-worker.py --config monolith_worker.toml</code>
              <Terminal size={14} className="text-slate-500 shrink-0 ml-2" />
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
