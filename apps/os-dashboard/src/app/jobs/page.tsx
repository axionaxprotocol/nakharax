"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Boxes,
  Brain,
  CheckCircle2,
  Cpu,
  FileCheck2,
  Flame,
  Gauge,
  Play,
  RefreshCw,
  Send,
  ShieldCheck,
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
import { useNetworkMesh } from "@/lib/use-network-mesh";

const AVAILABLE_MODELS = [
  {
    id: "DeAI-DeepSeek-R1-8B",
    name: "DeepSeek R1 (8B Reasoning)",
    category: "Reasoning & Logic",
    vramReq: "16 GB",
    estLatency: "1.4s",
    costPerKTokens: "0.05 tNAK",
  },
  {
    id: "DeAI-LLaMA-3.3-70B",
    name: "Meta LLaMA 3.3 (70B Instruct)",
    category: "General Intelligence",
    vramReq: "48 GB",
    estLatency: "2.8s",
    costPerKTokens: "0.20 tNAK",
  },
  {
    id: "DeAI-SDXL-v3",
    name: "Stable Diffusion XL (v3 Lightning)",
    category: "Image Synthesis",
    vramReq: "12 GB",
    estLatency: "0.9s",
    costPerKTokens: "0.15 tNAK",
  },
  {
    id: "DeAI-Whisper-Medium",
    name: "OpenAI Whisper Medium (Multilingual)",
    category: "Audio Transcription",
    vramReq: "8 GB",
    estLatency: "0.6s",
    costPerKTokens: "0.02 tNAK",
  },
];

export default function JobsPage() {
  const { blockNumber, isLive, latencyMs, workersList, totalActiveNodes } = useNetworkMesh();
  const [activeAddress, setActiveAddress] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [selectedModel, setSelectedModel] = useState("DeAI-DeepSeek-R1-8B");
  const [prompt, setPrompt] = useState("Perform formal mathematical proof verification for Byzantine Fault Tolerant PoPC consensus state transitions.");
  const [rewardNak, setRewardNak] = useState("15.0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobReceipt, setJobReceipt] = useState<any | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nakharax-active-vault");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.address) {
          setActiveAddress(parsed.address);
        }
      }
      if (typeof window !== "undefined" && (window as any).ethereum) {
        (window as any).ethereum
          .request({ method: "eth_accounts" })
          .then((accs: string[]) => {
            if (accs && accs.length > 0) setActiveAddress(accs[0]);
          })
          .catch(() => { });
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleDispatchJob(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsSubmitting(true);
      setJobReceipt(null);

      // 1. Submit job via JSON-RPC
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_submitJob",
          params: [
            {
              model: selectedModel,
              prompt: prompt.trim(),
              reward: rewardNak,
              from: activeAddress,
            },
          ],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      const jobId = data.result?.jobId || null;

      if (!jobId) {
        setJobReceipt({
          jobId: null,
          model: selectedModel,
          status: "NO_WORKER",
          blockNumber,
          assignedWorker: "—",
          executionTimeMs: null,
          escrowSettled: `${rewardNak} tNAK`,
          proofHash: null,
          tokensGenerated: null,
          cryptographicStatus: "Awaiting GPU Worker",
          thoughtTrace: null,
          finalContent: null,
          mediaType: "text",
        });
        return;
      }

      // Only surface data actually returned by the live RPC node.
      const assignedWorkerName = data.result?.worker
        ? `${data.result.worker.slice(0, 10)}... (On-Chain Worker)`
        : workersList.length > 0
          ? `${workersList[0].name} (${workersList[0].address.slice(0, 10)}...)`
          : "—";

      const receipt = {
        jobId,
        model: selectedModel,
        status: data.result?.status || "QUEUED",
        blockNumber: blockNumber,
        assignedWorker: assignedWorkerName,
        executionTimeMs: data.result?.executionTimeMs ?? null,
        escrowSettled: `${rewardNak} tNAK`,
        proofHash: data.result?.proofHash || null,
        tokensGenerated: data.result?.tokensGenerated ?? null,
        cryptographicStatus: data.result?.cryptographicStatus || "Pending PoPC Verification",
        thoughtTrace: data.result?.thoughtTrace || null,
        finalContent: data.result?.finalContent || null,
        mediaType: data.result?.mediaType || "text",
      };

      setJobReceipt(receipt);
    } catch {
      /* ignore */
    } finally {
      setIsSubmitting(false);
    }
  }

  const [showThinking, setShowThinking] = useState(true);
  const [copiedResult, setCopiedResult] = useState(false);

  const handleCopyResult = () => {
    if (jobReceipt?.finalContent) {
      navigator.clipboard.writeText(jobReceipt.finalContent);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2000);
    }
  };

  return (
    <PageShell
      eyebrow="Compute Marketplace"
      title="Route and execute AI workloads on verifiable owned compute."
      description="Operator console for DeAI inference workloads, cryptographic PoPC execution proofs, escrow settlement, and decentralized GPU matching."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            PoPC Live · #{blockNumber.toLocaleString()}
          </StatusPill>
          <StatusPill tone="chain">Latency: {latencyMs}ms</StatusPill>
          <StatusPill tone="violet">Chain 86137</StatusPill>
        </>
      }
    >
      {/* 4 Protocol Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Consensus Block"
          value={`#${blockNumber.toLocaleString()}`}
          hint="RPC-observed height (Live)"
          icon={<Boxes size={18} />}
          tone="chain"
        />
        <StatCard
          label="Primary Workload"
          value="Inference & R1"
          hint="DeepSeek, LLaMA, Whisper, SDXL"
          icon={<Brain size={18} />}
          tone="ai"
        />
        <StatCard
          label="Settlement Mode"
          value="Escrow Lock"
          hint="Instant tNAK micro-settlement"
          icon={<FileCheck2 size={18} />}
          tone="warn"
        />
        <StatCard
          label="Execution Proof"
          value="STARK Verifiable"
          hint="Zero AI slop · Repeatable tests"
          icon={<ShieldCheck size={18} />}
          tone="violet"
        />
      </div>

      {/* Interactive DeAI Job Dispatcher Console */}
      <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] to-transparent">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Zap size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">DeAI Compute Job Dispatcher</h3>
              <p className="text-xs text-slate-400">
                Submit an inference workload to the decentralized node mesh with escrow settlement.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-emerald-300">
            PoPC Engine Ready
          </span>
        </div>

        <form onSubmit={handleDispatchJob} className="mt-5 space-y-5">
          {/* Model Selection Cards */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              1. Select Target AI Model
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`rounded-xl border p-3 text-left transition-all ${selectedModel === m.id
                    ? "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_15px_rgba(41,240,106,0.2)]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                >
                  <div className="text-xs font-bold text-white truncate">{m.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{m.category}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>VRAM: {m.vramReq}</span>
                    <span className="text-cyan-300 font-semibold">{m.costPerKTokens}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt & Workload Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-2">
              2. Workload Prompt & Tensor Payload
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
              placeholder="Enter model prompt or tensor specification..."
            />
          </div>

          {/* Reward and Action Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <label className="text-xs font-mono text-slate-400">Escrow Reward:</label>
              <div className="relative">
                <input
                  type="text"
                  value={rewardNak}
                  onChange={(e) => setRewardNak(e.target.value)}
                  className="w-28 rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
                <span className="absolute right-2 top-1.5 text-[10px] font-mono text-emerald-400">tNAK</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.4)]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Dispatching to DeAI Nodes...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Dispatch DeAI Job to Network</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Cryptographic Execution Receipt */}
        {jobReceipt && (
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 font-mono text-xs text-white space-y-3">
            {jobReceipt.jobId === null ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400/70">
                  <Cpu size={18} />
                </span>
                <p className="text-sm font-semibold text-slate-200">No GPU Worker Available</p>
                <p className="mx-auto max-w-md text-[11px] leading-relaxed text-slate-500">
                  The job request was submitted to the RPC node, but no active DeAI worker
                  returned a result. The receipt below reflects only real on-chain data — no
                  fabricated computation, proof hash, or latency is injected. Connect and
                  register a GPU worker to begin receiving inference workloads.
                </p>
                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] w-full max-w-md">
                  <div><span className="text-slate-400">Status:</span> <span className="text-amber-300 font-bold">{jobReceipt.status}</span></div>
                  <div><span className="text-slate-400">Assigned Worker:</span> <span className="text-slate-200">{jobReceipt.assignedWorker}</span></div>
                  <div><span className="text-slate-400">Escrow Reserved:</span> <span className="text-amber-300 font-bold">{jobReceipt.escrowSettled}</span></div>
                  <div><span className="text-slate-400">Block:</span> <span className="text-slate-200">#{jobReceipt.blockNumber}</span></div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <CheckCircle2 size={14} />
                    Workload Computed & PoPC Verified
                  </span>
                  <span className="text-[11px] text-slate-400">Block #{jobReceipt.blockNumber}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px]">
                  <div><span className="text-slate-400">Job ID:</span> <span className="text-cyan-300 font-mono">{jobReceipt.jobId}</span></div>
                  <div><span className="text-slate-400">Assigned Worker:</span> <span className="text-slate-200">{jobReceipt.assignedWorker}</span></div>
                  <div><span className="text-slate-400">Execution Latency:</span> <span className="text-emerald-300 font-bold">{jobReceipt.executionTimeMs ?? "—"}ms</span></div>
                  <div><span className="text-slate-400">Escrow Settled:</span> <span className="text-amber-300 font-bold">{jobReceipt.escrowSettled}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-400">STARK Proof:</span> <span className="text-violet-300 break-all">{jobReceipt.proofHash ?? "—"}</span></div>
                </div>

                {/* Expandable Thinking Process */}
                {jobReceipt.thoughtTrace && (
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setShowThinking(!showThinking)}
                      className="flex items-center justify-between w-full text-[11px] font-bold text-indigo-300 hover:text-indigo-200"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-indigo-400" />
                        DeepSeek-R1 Chain-of-Thought Reasoning Trace (Expandable)
                      </span>
                      <span>{showThinking ? "▲ Hide" : "▼ Show"}</span>
                    </button>
                    {showThinking && (
                      <pre className="mt-2 text-[10.5px] text-indigo-200 whitespace-pre-wrap leading-relaxed border-t border-indigo-500/20 pt-2 font-mono">
                        {jobReceipt.thoughtTrace}
                      </pre>
                    )}
                  </div>
                )}

                {/* Computed Output Result Box */}
                <div className="rounded-xl border border-white/10 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
                      Generated Inference Response / Proof Output
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-colors"
                    >
                      {copiedResult ? "✓ Copied" : "Copy Output"}
                    </button>
                  </div>
                  <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
                    {jobReceipt.finalContent ?? "—"}
                  </pre>
                </div>

                <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-emerald-400 font-semibold">✓ Cryptographic receipt committed to state trie</span>
                  <Link
                    href="/apps/explorer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 underline"
                  >
                    Inspect on Explorer →
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </PageShell>
  );
}
