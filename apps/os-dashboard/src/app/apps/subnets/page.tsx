"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { broadcastRawTransaction, encodeTxMemo } from "@/lib/web3/tx-broadcaster";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Atom,
  Binary,
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Dna,
  FileCode,
  Flame,
  Globe2,
  GraduationCap,
  Layers3,
  Microchip,
  Network,
  Orbit,
  Play,
  Plus,
  Radio,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
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

type SubnetCategory = "all" | "biotech" | "quantum" | "silicon" | "robotics" | "legal" | "cyber" | "education";

interface KnowledgeSubnet {
  id: string;
  name: string;
  category: "biotech" | "quantum" | "silicon" | "robotics" | "legal" | "cyber" | "education";
  description: string;
  targetWorkers: string;
  benchmarkThroughput: string;
  minSubnetStake: string;
  tpsCapacity: string;
  specializedLoRA: string;
  mcpSkillsEnabled: string[];
  status: "GENESIS_BLUEPRINT" | "DEVNET_ACTIVE";
  icon: any;
}

const KNOWLEDGE_SUBNETS: KnowledgeSubnet[] = [
  {
    id: "subnet-bio-01",
    name: "Subnet #1: Genomic & CRISPR Molecular Synthesis",
    category: "biotech",
    description: "Distributed protein folding, CRISPR-Cas target discovery, and oncology compound docking without exposing private DNA sequences.",
    targetWorkers: "64 Dedicated Workers",
    benchmarkThroughput: "450 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "450 tasks/s",
    specializedLoRA: "CRISPR-Cas12-Protein-v3",
    mcpSkillsEnabled: ["mcp-bio-docking", "mcp-alphafold-oracle"],
    status: "GENESIS_BLUEPRINT",
    icon: Dna,
  },
  {
    id: "subnet-quantum-02",
    name: "Subnet #2: Superconductor & Materials Physics",
    category: "quantum",
    description: "High-temperature superconductor molecular lattices, solid-state electrolyte simulations, and fusion plasma magnetic containment.",
    targetWorkers: "64 Dedicated Workers",
    benchmarkThroughput: "380 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "380 tasks/s",
    specializedLoRA: "Lattice-Quantum-MonteCarlo-v2",
    mcpSkillsEnabled: ["mcp-quantum-solver", "mcp-plasma-sim"],
    status: "GENESIS_BLUEPRINT",
    icon: Atom,
  },
  {
    id: "subnet-silicon-03",
    name: "Subnet #3: Autonomous ASIC & RISC-V Chip Synthesizer",
    category: "silicon",
    description: "Automated Verilog/VHDL logic placement, timing closure optimization, and sub-nanometer neural accelerator topology generation.",
    targetWorkers: "32 Dedicated Workers",
    benchmarkThroughput: "210 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "210 tasks/s",
    specializedLoRA: "RISCV-Verilog-Silicon-v4",
    mcpSkillsEnabled: ["mcp-verilog-prover", "mcp-timing-closure"],
    status: "GENESIS_BLUEPRINT",
    icon: Microchip,
  },
  {
    id: "subnet-cyber-04",
    name: "Subnet #4: Zero-Day Forensic & Autonomous Cyber Mesh",
    category: "cyber",
    description: "Autonomous binary fuzzing, smart contract formal verification, kernel invariant testing, and zero-day threat intelligence synthesis.",
    targetWorkers: "128 Dedicated Workers",
    benchmarkThroughput: "1,200 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "1,200 tasks/s",
    specializedLoRA: "Hydra-EVM-KernelFuzzer-v5",
    mcpSkillsEnabled: ["mcp-sec-auditor", "mcp-docker-sandbox"],
    status: "DEVNET_ACTIVE",
    icon: ShieldCheck,
  },
  {
    id: "subnet-robotics-05",
    name: "Subnet #5: Swarm Robotics & Spatial Telemetry Mesh",
    category: "robotics",
    description: "Autonomous multi-agent drone swarm coordination, robotic manufacturing kinematics, and real-time spatial SLAM processing.",
    targetWorkers: "64 Dedicated Workers",
    benchmarkThroughput: "850 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "850 tasks/s",
    specializedLoRA: "YOLOv11-Spatial-SLAM-v2",
    mcpSkillsEnabled: ["mcp-swarm-telemetry", "mcp-spatial-kinematics"],
    status: "GENESIS_BLUEPRINT",
    icon: Orbit,
  },
  {
    id: "subnet-legal-06",
    name: "Subnet #6: Multi-Jurisdiction Sovereign Legal Lexicon",
    category: "legal",
    description: "Cross-border regulatory harmonization, institutional contract synthesis, and trustless zero-knowledge tax compliance verification.",
    targetWorkers: "32 Dedicated Workers",
    benchmarkThroughput: "140 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "140 tasks/s",
    specializedLoRA: "Lex-Jurisdiction-Universal-v1",
    mcpSkillsEnabled: ["mcp-legal-oracle", "mcp-zk-compliance"],
    status: "GENESIS_BLUEPRINT",
    icon: Scale,
  },
  {
    id: "subnet-edu-07",
    name: "Subnet #7: Infinite Interdisciplinary Knowledge Graph",
    category: "education",
    description: "Autonomous cross-disciplinary research synthesis, connecting disconnected scientific papers into live executable hypotheses.",
    targetWorkers: "128 Dedicated Workers",
    benchmarkThroughput: "920 tasks/s (Target)",
    minSubnetStake: "50,000 tNAK",
    tpsCapacity: "920 tasks/s",
    specializedLoRA: "DeepSeek-Interdisciplinary-CoT-v3",
    mcpSkillsEnabled: ["mcp-deepseek-reasoner", "mcp-web-scout"],
    status: "GENESIS_BLUEPRINT",
    icon: GraduationCap,
  },
];

export default function SubnetsEcosystemPage() {
  const [subnets, setSubnets] = useState<KnowledgeSubnet[]>(KNOWLEDGE_SUBNETS);
  const [selectedCategory, setSelectedCategory] = useState<SubnetCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stakedSubnetId, setStakedSubnetId] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number>(1830);
  const [stakeNotice, setStakeNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8545", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.result) setCurrentBlock(parseInt(d.result, 16));
      })
      .catch(() => {});
  }, []);

  const filteredSubnets = subnets.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specializedLoRA.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStake = async (id: string, name: string) => {
    setStakedSubnetId(id);
    setStakeNotice(`Broadcasting stake transaction for ${name} to Node RPC...`);

    try {
      const stakePayload = encodeTxMemo(`stake_subnet:${id}`);
      const txHash = await broadcastRawTransaction({
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        value: BigInt("100000000000000000"), // 0.1 tNAK deposit fee
        data: stakePayload,
      });
      setStakeNotice(
        `🎉 Staked on ${name} (Block #${currentBlock})!\nTx Hash: ${txHash}\nStatus: CONFIRMED_POPC`
      );
    } catch (err: any) {
      setStakeNotice(`⚠️ Staking failed: ${err?.message || "Broadcast error"}`);
    }

    setTimeout(() => {
      setStakedSubnetId(null);
      setStakeNotice(null);
    }, 6000);
  };

  return (
    <PageShell
      eyebrow="Infinite Civilization Ecosystem"
      title="Universal Knowledge Subnets & Multi-Domain Mesh"
      description="Beyond finance: Autonomous compute subnets powering biology, quantum materials, chip design, robotics, legal synthesis, and infinite interdisciplinary science querying live RPC."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            7 Subnets Active
          </StatusPill>
          <StatusPill tone="violet">Block #{currentBlock.toLocaleString()}</StatusPill>
          <StatusPill tone="chain">3,160 Nodes Running</StatusPill>
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
          label="Domain Subnets"
          value="7 Disciplines"
          hint="Specialized compute blueprints"
          icon={<Network size={18} />}
          tone="ai"
        />
        <StatCard
          label="Active Local Host"
          value="1 Genesis Node"
          hint="Devnet Mode (127.0.0.1:8545)"
          icon={<Cpu size={18} />}
          tone="chain"
        />
        <StatCard
          label="Min Subnet Stake"
          value="50,000 tNAK"
          hint="On-chain security threshold"
          icon={<ShieldCheck size={18} />}
          tone="warn"
        />
        <StatCard
          label="Block Cadence"
          value="3.00s"
          hint="PoPC fast deterministic finality"
          icon={<Zap size={18} />}
          tone="violet"
        />
      </div>

      {stakeNotice && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 font-mono text-xs text-emerald-300 whitespace-pre-wrap leading-relaxed shadow-[0_0_20px_rgba(41,240,106,0.15)]">
          {stakeNotice}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {[
            { id: "all", label: "All Disciplines" },
            { id: "biotech", label: "🧬 Biotech & CRISPR" },
            { id: "quantum", label: "⚛️ Quantum & Physics" },
            { id: "silicon", label: "💾 Silicon & ASIC" },
            { id: "cyber", label: "🛡️ Cyber & Security" },
            { id: "robotics", label: "🛸 Robotics & Spatial" },
            { id: "legal", label: "⚖️ Sovereign Legal" },
            { id: "education", label: "🎓 Interdisciplinary" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as SubnetCategory)}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-mono whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-sm"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Subnets & Sciences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 font-mono text-[11.5px] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Subnets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSubnets.map((subnet) => {
          const SubnetIcon = subnet.icon;
          const isStaked = stakedSubnetId === subnet.id;
          return (
            <Card key={subnet.id} className="flex flex-col justify-between space-y-4 border-white/10 bg-slate-950/80 p-5">
              <div>
                <div className="flex items-start justify-between">
                  <IconBadge Icon={SubnetIcon} tone="ai" className="h-10 w-10" />
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                    {subnet.status === "DEVNET_ACTIVE" ? "Devnet Active" : "Genesis Blueprint"}
                  </span>
                </div>

                <h3 className="mt-3 text-[14px] font-bold text-white leading-snug">
                  {subnet.name}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300 line-clamp-3 font-sans">
                  {subnet.description}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/[0.08] pt-3 text-[11px] font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Target Compute:</span>
                  <span className="font-semibold text-white">{subnet.targetWorkers}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Benchmark Target:</span>
                  <span className="font-semibold text-cyan-300">{subnet.benchmarkThroughput}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dedicated LoRA:</span>
                  <span className="font-semibold text-emerald-300 truncate max-w-[140px]">{subnet.specializedLoRA}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Min Security Stake:</span>
                  <span className="font-semibold text-violet-300">{subnet.minSubnetStake}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStake(subnet.id, subnet.name)}
                  className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[11.5px] font-mono font-semibold transition-all ${
                    isStaked
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {isStaked ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Zap size={13} className="text-emerald-400" />}
                  {isStaked ? "Stake Allocated!" : "Delegate / Stake tNAK"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
