"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Binary,
  Boxes,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  FileCode,
  Flame,
  Layers3,
  RefreshCw,
  Search,
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

interface BlockData {
  height: number;
  hash: string;
  validator: string;
  txsCount: number;
  gasUsed: string;
  computeProofHash: string;
  timestamp: string;
  rewardNak: string;
}

interface TransactionData {
  txHash: string;
  blockHeight: number;
  from: string;
  to: string;
  valueNak: string;
  type: "DEAI_COMPUTE_JOB" | "TRANSFER" | "MCP_TOOL_CALL" | "LORA_WEIGHT_MERGE" | "STAKE_DEPOSIT";
  status: "CONFIRMED_POPC" | "FINALIZED";
  age: string;
}

const RECENT_BLOCKS: BlockData[] = [
  {
    height: 148920,
    hash: "0x8fa1b209e7c114ad8901c64a10e7b89104fa281b37819ad0",
    validator: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    txsCount: 14,
    gasUsed: "1,420,000 (28.4%)",
    computeProofHash: "0x3a9f11bc048291e0a811",
    timestamp: "3s ago",
    rewardNak: "2.5 tNAK",
  },
  {
    height: 148919,
    hash: "0x7bb02194ad821bc08910fa3781290bb0a7192bc01827391a",
    validator: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    txsCount: 22,
    gasUsed: "2,180,000 (43.6%)",
    computeProofHash: "0x91c08273bba1048e91fa",
    timestamp: "6s ago",
    rewardNak: "2.5 tNAK",
  },
  {
    height: 148918,
    hash: "0x12a9bc04810291e84710bc8921049ad810471b029384710a",
    validator: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    txsCount: 9,
    gasUsed: "890,000 (17.8%)",
    computeProofHash: "0x55bc01928374a81092eb",
    timestamp: "9s ago",
    rewardNak: "2.5 tNAK",
  },
  {
    height: 148917,
    hash: "0x44a108e92817290bc018273b0918273ab01928374a819283",
    validator: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    txsCount: 31,
    gasUsed: "3,120,000 (62.4%)",
    computeProofHash: "0x89aa1029384710ba0192",
    timestamp: "12s ago",
    rewardNak: "2.5 tNAK",
  },
];

const RECENT_TRANSACTIONS: TransactionData[] = [
  {
    txHash: "0x9fa10b29837410eb01928374a81029384710bc89",
    blockHeight: 148920,
    from: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    valueNak: "15.00 tNAK",
    type: "DEAI_COMPUTE_JOB",
    status: "CONFIRMED_POPC",
    age: "3s ago",
  },
  {
    txHash: "0x33b01928374a81092eb01928374a81029384710a",
    blockHeight: 148920,
    from: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    valueNak: "0.08 tNAK",
    type: "MCP_TOOL_CALL",
    status: "CONFIRMED_POPC",
    age: "3s ago",
  },
  {
    txHash: "0x88c01928374a81029384710bc8921049ad810471",
    blockHeight: 148919,
    from: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    to: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    valueNak: "50.00 tNAK",
    type: "LORA_WEIGHT_MERGE",
    status: "FINALIZED",
    age: "6s ago",
  },
  {
    txHash: "0x11d01928374a81029384710ba01928374a810293",
    blockHeight: 148918,
    from: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    to: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    valueNak: "100.00 tNAK",
    type: "TRANSFER",
    status: "FINALIZED",
    age: "9s ago",
  },
];

export default function BlockExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchQuery.startsWith("0x") && searchQuery.length > 30) {
      setSearchResult(`🔍 Transaction/Hash Query: ${searchQuery}\nStatus: FINALIZED (2-Block Confirmation)\nGas Used: 21,000 | PoPC Verification: O(s) STARK-VERIFIED\nTimestamp: 2026-08-20T08:15:00Z`);
    } else if (!isNaN(Number(searchQuery))) {
      setSearchResult(`🔍 Block #${searchQuery} Query:\nHash: 0x8fa1b209e7c114ad8901c64a10e7b89104fa281b37819ad0\nValidator: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8\nTxs: 14 | Proof: VALID`);
    } else {
      setSearchResult(`🔍 Account Query: ${searchQuery}\nBalance: 1,450.50 tNAK\nNonce: 42 | DeAI Tasks Executed: 180`);
    }
  };

  return (
    <PageShell
      eyebrow="On-Chain Telemetry"
      title="NakharaX Block Explorer & Transaction Tracer"
      description="Real-time transaction tracing, PoPC compute proof inspection, block cadence verification, and smart contract state analytics."
      meta={
        <>
          <StatusPill tone="chain" pulse>
            Block #148,920
          </StatusPill>
          <StatusPill tone="ai">PoPC Fast-Finality</StatusPill>
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
          label="Block Height"
          value="148,920"
          hint="Cadence: 2.84s (P95)"
          icon={<Boxes size={18} />}
          tone="chain"
        />
        <StatCard
          label="Total Transactions"
          value="1.84M"
          hint="Zero failed settlements"
          icon={<Activity size={18} />}
          tone="ai"
        />
        <StatCard
          label="Active Validators"
          value="10 Nodes"
          hint="Global BFT Mesh"
          icon={<ShieldCheck size={18} />}
          tone="violet"
        />
        <StatCard
          label="Gas Price"
          value="1.2 Gwei"
          hint="Fixed micro-fee"
          icon={<Zap size={18} />}
          tone="warn"
        />
      </div>

      {/* Global Explorer Search Bar */}
      <Card className="border-white/10 bg-slate-950/80 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Block Height / Transaction Hash / Account Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 pl-10 pr-4 py-2.5 font-mono text-[12px] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 text-[12px] font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)]"
          >
            Trace
          </button>
        </form>

        {searchResult && (
          <pre className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
            {searchResult}
          </pre>
        )}
      </Card>

      {/* 2-Column Live Feed: Blocks & Transactions */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column: Recent Blocks */}
        <div className="space-y-3 lg:col-span-6">
          <SectionHeader
            title="Latest Mined Blocks (PoPC)"
            subtitle="Blocks verified via Proof of Practical Compute consensus"
          />

          <div className="space-y-2.5">
            {RECENT_BLOCKS.map((block) => (
              <Card key={block.height} className="border-white/10 bg-slate-950/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11.5px] font-mono font-bold text-cyan-300">
                      #{block.height}
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-400">{block.timestamp}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">+{block.rewardNak}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                  <span>Validator: <code className="text-slate-400">{block.validator.slice(0, 12)}...</code></span>
                  <span>{block.txsCount} Txs · {block.gasUsed}</span>
                </div>

                <div className="truncate text-[10px] font-mono text-slate-500 border-t border-white/[0.06] pt-1.5">
                  Proof: {block.computeProofHash}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="space-y-3 lg:col-span-6">
          <SectionHeader
            title="Live Mempool & Transactions"
            subtitle="Micro-settlement, DeAI compute jobs, and MCP tool calls"
          />

          <div className="space-y-2.5">
            {RECENT_TRANSACTIONS.map((tx) => (
              <Card key={tx.txHash} className="border-white/10 bg-slate-950/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-mono font-semibold ${
                      tx.type === "DEAI_COMPUTE_JOB"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : tx.type === "MCP_TOOL_CALL"
                        ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                        : tx.type === "LORA_WEIGHT_MERGE"
                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        : "border-white/20 bg-white/5 text-slate-300"
                    }`}>
                      {tx.type}
                    </span>
                    <span className="text-[10.5px] font-mono text-slate-400">{tx.age}</span>
                  </div>
                  <span className="text-[11.5px] font-mono font-bold text-white">{tx.valueNak}</span>
                </div>

                <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400">
                  <span>From: <code className="text-slate-300">{tx.from.slice(0, 10)}...</code></span>
                  <span>To: <code className="text-slate-300">{tx.to.slice(0, 10)}...</code></span>
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-1.5 text-[10px] font-mono text-slate-500">
                  <span className="truncate max-w-[220px]">Hash: {tx.txHash}</span>
                  <span className="text-emerald-400 font-semibold">● {tx.status}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
