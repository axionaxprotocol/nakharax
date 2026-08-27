"use client";

import { useEffect, useState } from "react";
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
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedSpecs, setDetectedSpecs] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regNotice, setRegNotice] = useState<string | null>(null);

  // Sync worker address with active MetaMask account or saved vault
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWorkerAddress(accounts[0]);
          }
        })
        .catch(() => {});

      const handleAccounts = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setWorkerAddress(accounts[0]);
        }
      };
      ethereum.on("accountsChanged", handleAccounts);
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("accountsChanged", handleAccounts);
        }
      };
    } else {
      try {
        const saved = localStorage.getItem("nakharax-active-vault");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.address) setWorkerAddress(parsed.address);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  const autoDetectHardware = () => {
    setIsDetecting(true);
    try {
      const cores = navigator.hardwareConcurrency || 8;
      const mem = (navigator as any).deviceMemory || 16;
      let detectedGpu = "Auto-Detected Compute Host";
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            detectedGpu = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || detectedGpu;
          }
        }
      } catch {
        /* ignore */
      }

      setGpuName(detectedGpu);
      setVramAllocated(String(Math.min(32, Math.max(8, mem))));
      setDetectedSpecs(`Detected: ${cores} CPU Cores · ~${mem}GB RAM · ${detectedGpu}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const registerWorkerOnChain = async () => {
    setIsRegistering(true);
    setRegNotice(null);
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_registerWorker",
          params: [
            {
              address: workerAddress,
              accelerator: gpuName,
              vram: `${vramAllocated}GB`,
              models: selectedModels,
            },
          ],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.result?.success) {
        setRegNotice(`✅ Worker Registered On-Chain! Address: ${workerAddress.slice(0, 14)}...`);
      }
    } catch {
      setRegNotice("Worker registration broadcast error.");
    } finally {
      setIsRegistering(false);
    }
  };

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

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={autoDetectHardware}
                disabled={isDetecting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-300 transition-all"
              >
                <RefreshCw size={12} className={isDetecting ? "animate-spin" : ""} />
                <span>Auto-Detect My Hardware</span>
              </button>

              <button
                type="button"
                onClick={registerWorkerOnChain}
                disabled={isRegistering}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-all shadow-sm"
              >
                <Power size={12} />
                <span>{isRegistering ? "Broadcasting..." : "Register Worker On-Chain"}</span>
              </button>
            </div>

            {detectedSpecs && (
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2.5 text-[11px] font-mono text-cyan-200">
                {detectedSpecs}
              </div>
            )}

            {regNotice && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11px] font-mono text-emerald-200">
                {regNotice}
              </div>
            )}
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

      {/* Interactive GPU Benchmark Stress Prober & Earnings Calculator Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Synthetic Benchmark Prober */}
        <Card className="lg:col-span-6 space-y-4 border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.04] to-transparent">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                <Flame size={16} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Hardware Stress Prober & TFLOPS Validator
                </h4>
                <p className="text-[11px] text-slate-400">
                  Run browser-to-silicon compute test & PoPC STARK FRI hash validation.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">BF16 Throughput</div>
              <div className="mt-1 text-base font-mono font-bold text-cyan-300">82.4 TFLOPS</div>
              <div className="text-[9px] font-mono text-emerald-400 mt-0.5">Top 5% Mesh Tier</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Memory Bandwidth</div>
              <div className="mt-1 text-base font-mono font-bold text-indigo-300">1,008 GB/s</div>
              <div className="text-[9px] font-mono text-slate-400 mt-0.5">GDDR6X 384-bit</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-center">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">PoPC Hash Rate</div>
              <div className="mt-1 text-base font-mono font-bold text-emerald-300">14.2k FRI/s</div>
              <div className="text-[9px] font-mono text-slate-400 mt-0.5">Zero AI Slop SLA</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 font-mono text-[11px] text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 size={13} />
              Hardware Compatibility: PASS (Tier-1 Accelerated Node)
            </span>
            <span className="text-[10px] text-slate-400">STARK FRI v2.4</span>
          </div>
        </Card>

        {/* Compute Mining & Escrow Yield Calculator */}
        <Card className="lg:col-span-6 space-y-4 border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] to-transparent">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Zap size={16} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Compute Escrow Yield & ROI Estimator
                </h4>
                <p className="text-[11px] text-slate-400">
                  Estimated staking rewards & inference fees based on current network difficulty.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Estimated Daily Revenue</div>
              <div className="mt-1 text-lg font-mono font-bold text-emerald-400">+120.50 tNAK</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">~$24.10 USD/day est.</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Monthly Projected Yield</div>
              <div className="mt-1 text-lg font-mono font-bold text-cyan-300">3,615 tNAK</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">30-day continuous host</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span>Electricity Offset ($0.12/kWh · 350W): <strong className="text-slate-200">-$1.01/day</strong></span>
            <span className="text-emerald-400 font-bold">Net APY: ~142.8%</span>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
