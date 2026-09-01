"use client";

import { useState } from "react";
import Link from "next/link";
import { broadcastRawTransaction, encodeTxMemo } from "@/lib/web3/tx-broadcaster";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  CreditCard,
  Database,
  Flame,
  KeyRound,
  Layers3,
  Lock,
  Play,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  Wallet,
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
import { SelfEvolvingAgentSandbox } from "@/components/self-evolving-agent-sandbox";
import type { SovereignAgentIdentity } from "@nakharax/sdk";

const INITIAL_AGENTS: SovereignAgentIdentity[] = [
  {
    agentId: "did:nakharax:0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    name: "NOESIS-VX Reasoning Prover",
    ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    balanceWei: "250.0",
    reputationScore: 99.9,
    activeSkills: ["mcp-deepseek-reasoner", "mcp-onchain-indexer"],
    totalJobsExecuted: 1420,
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    agentId: "did:nakharax:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    name: "Hydra Security Auditor Agent",
    ownerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    balanceWei: "180.5",
    reputationScore: 99.4,
    activeSkills: ["mcp-sec-auditor", "mcp-docker-sandbox"],
    totalJobsExecuted: 890,
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    agentId: "did:nakharax:0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    name: "TIES Weight Merger Specialist",
    ownerAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    balanceWei: "420.0",
    reputationScore: 99.8,
    activeSkills: ["mcp-ties-weight-merger", "mcp-web-scout"],
    totalJobsExecuted: 3120,
    createdAt: Date.now() - 86400000 * 21,
  },
];

export default function SovereignAgentsPage() {
  const [agents, setAgents] = useState<SovereignAgentIdentity[]>(INITIAL_AGENTS);
  const [newAgentName, setNewAgentName] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["mcp-quant-risk"]);
  const [initialFund, setInitialFund] = useState("50.0");
  const [isMinting, setIsMinting] = useState(false);
  const [mintReceipt, setMintReceipt] = useState<string | null>(null);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  async function handleMintAgent() {
    if (!newAgentName.trim()) return;
    try {
      setIsMinting(true);

      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const agentDid = `did:nakharax:0x${randomBytes}`;

      // Broadcast on-chain transaction for agent DID mint
      const mintPayload = encodeTxMemo(`agent_mint:${randomBytes}`);
      const txHash = await broadcastRawTransaction({
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        value: BigInt(500000000000000000), // 0.5 tNAK mint fee
        data: mintPayload,
      });

      const createdAgent: SovereignAgentIdentity = {
        agentId: agentDid,
        name: newAgentName,
        ownerAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        balanceWei: initialFund,
        reputationScore: 100.0,
        activeSkills: selectedSkills,
        totalJobsExecuted: 0,
        createdAt: Date.now(),
      };

      setAgents([createdAgent, ...agents]);
      setMintReceipt(`✅ Sovereign Agent Minted On-Chain!\nDID: ${agentDid}\nTx Hash: ${txHash}\nInitial Balance: ${initialFund} tNAK\nEquipped Skills: ${selectedSkills.join(", ")}`);
      setNewAgentName("");
    } catch (err: any) {
      setMintReceipt(`❌ Agent mint failed: ${err?.message || "Transaction rejected"}`);
    } finally {
      setIsMinting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Autonomous Agent Runtime"
      title="Sovereign Agent Fleet & DID Registry"
      description="Deploy autonomous on-chain agents with sovereign keypairs, equip specialized MCP skills, and manage real-time state channel micro-economies."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            AEE Runtime Live
          </StatusPill>
          <StatusPill tone="violet">{agents.length} Sovereign Agents</StatusPill>
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
          label="Sovereign Agents"
          value={agents.length}
          hint="Autonomous on-chain identities"
          icon={<Bot size={18} />}
          tone="ai"
        />
        <StatCard
          label="Total Tasks Completed"
          value={agents.reduce((acc, a) => acc + (a.totalJobsExecuted || 0), 0)}
          hint="Verified on-chain executions"
          icon={<Activity size={18} />}
          tone="chain"
        />
        <StatCard
          label="Agent Vaults"
          value={`${agents.reduce((acc, a) => acc + (parseFloat(a.balanceWei) || 0), 0).toFixed(1)} tNAK`}
          hint="Total locked liquidity"
          icon={<Wallet size={18} />}
          tone="violet"
        />
        <StatCard
          label="Identity Standard"
          value="W3C DID + ECDSA"
          hint="Self-sovereign cryptographic keys"
          icon={<KeyRound size={18} />}
          tone="warn"
        />
      </div>

      {/* =========================================================================
          SECTION: RECURSIVE SELF-EVOLVING AGENT PROVING GROUNDS
          ========================================================================= */}
      <section className="space-y-3">
        <SectionHeader
          title="Recursive Self-Evolving Agent Proving Grounds"
          subtitle="Empirical demonstration of autonomous neural adaptation, LoRA delta merging, and skill acquisition on L1"
        />
        <SelfEvolvingAgentSandbox />
      </section>

      {/* 2-Column Layout: Left Fleet List, Right Minting Studio */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: Active Sovereign Agent Fleet */}
        <div className="space-y-3 lg:col-span-7">
          <SectionHeader
            title="Active Sovereign Agent Fleet"
            subtitle="Autonomous on-chain identities executing tasks and micro-payments"
          />

          {agents.map((agent) => (
            <Card key={agent.agentId} className="space-y-3 border-white/10 bg-slate-950/80">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <IconBadge Icon={Bot} tone="ai" className="h-10 w-10" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-bold text-white">{agent.name}</h3>
                      <span className="inline-flex items-center gap-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-mono text-emerald-300">
                        {agent.reputationScore}% Rep
                      </span>
                    </div>
                    <code className="text-[10.5px] font-mono text-cyan-400">
                      {agent.agentId}
                    </code>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[13px] font-mono font-bold text-emerald-400">
                    {agent.balanceWei} tNAK
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-500">
                    Agent Vault
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {agent.activeSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono text-slate-300"
                  >
                    <Plug size={10} className="text-emerald-400" />
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2 text-[10.5px] font-mono text-slate-400">
                <span>Owner: {agent.ownerAddress.slice(0, 10)}...</span>
                <span>{agent.totalJobsExecuted.toLocaleString()} tasks completed</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Right Column: Mint New Sovereign Agent */}
        <div className="space-y-4 lg:col-span-5">
          <SectionHeader
            title="Mint Sovereign Agent DID"
            subtitle="Deploy a new on-chain identity with dedicated keypair and skills"
          />

          <Card className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                placeholder="e.g. Citadel Risk Arbiter"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Initial Vault Funding (tNAK)
              </label>
              <input
                type="number"
                value={initialFund}
                onChange={(e) => setInitialFund(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-emerald-300 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Equip MCP Skills Belt
              </label>
              <div className="space-y-1.5">
                {[
                  { id: "mcp-sec-auditor", label: "Hydra Smart Contract Auditor" },
                  { id: "mcp-deepseek-reasoner", label: "DeepSeek-R1 CoT Prover" },
                  { id: "mcp-onchain-indexer", label: "Nakharax Topology Indexer" },
                  { id: "mcp-docker-sandbox", label: "Isolated Code Sandbox" },
                ].map((skill) => {
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${isSelected
                          ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                        }`}
                    >
                      <span className="text-[11px] font-semibold">{skill.label}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleMintAgent}
              disabled={isMinting || !newAgentName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 text-[12px] font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)] disabled:opacity-50"
            >
              {isMinting ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
              {isMinting ? "Minting Sovereign DID on Chain..." : "Mint Sovereign Agent DID"}
            </button>

            {mintReceipt && (
              <pre className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
                {mintReceipt}
              </pre>
            )}
          </Card>

          {/* Autonomous Task Dispatcher Sandbox */}
          <AgentTaskSandbox agents={agents} />
        </div>
      </div>
    </PageShell>
  );
}

function AgentTaskSandbox({ agents }: { agents: SovereignAgentIdentity[] }) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.agentId || "");
  const [prompt, setPrompt] = useState("Evaluate real-time XAUUSD orderbook imbalance and simulate 1,000 Monte Carlo drawdown paths.");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.agentId === selectedAgentId) || agents[0];

  const handleDispatch = async () => {
    try {
      setIsExecuting(true);
      // No autonomous execution engine is connected yet. Show an honest empty state
      // instead of fabricating a fake execution trace.
      setExecutionOutput(
        `[AEE AUTONOMOUS EXECUTION ENGINE]\nAgent DID: ${selectedAgent.agentId} (${selectedAgent.name})\nInstruction: "${prompt}"\n\n⚠️ No autonomous execution engine is currently connected.\nThe Sovereign Agent execution backend is not yet available on this network.\nPlease connect a worker node to enable real on-chain task dispatch.`
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <Card className="space-y-4 border-white/10 bg-slate-950/80 p-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Play size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Autonomous Task Dispatcher</h3>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 font-semibold">State Channel Execution</span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Select Executing Agent
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-white focus:outline-none"
          >
            {agents.map((a) => (
              <option key={a.agentId} value={a.agentId}>
                {a.name} ({a.balanceWei} tNAK)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
            Task Prompt & Directive
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-white focus:outline-none text-[11.5px]"
          />
        </div>

        <button
          type="button"
          onClick={handleDispatch}
          disabled={isExecuting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 text-xs font-mono transition-all disabled:opacity-50"
        >
          {isExecuting ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
          {isExecuting ? "Executing Agent Workflow..." : "Dispatch Autonomous Workflow"}
        </button>

        {executionOutput && (
          <pre className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-black/80 p-3 font-mono text-[10.5px] leading-relaxed text-emerald-300 whitespace-pre-wrap">
            {executionOutput}
          </pre>
        )}
      </div>
    </Card>
  );
}
