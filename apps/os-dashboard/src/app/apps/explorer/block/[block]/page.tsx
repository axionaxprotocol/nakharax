"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Boxes,
  Check,
  Coins,
  Copy,
  Cpu,
  Layers3,
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

export default function BlockDetailPage() {
  const params = useParams();
  const rawBlock = Array.isArray(params?.block) ? params.block[0] : params?.block || "";

  const [copied, setCopied] = useState(false);
  const [blockData, setBlockData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchBlock = useCallback(async () => {
    try {
      setIsLoading(true);
      const isHex = rawBlock.startsWith("0x");
      const hexParam = isHex ? rawBlock : "0x" + parseInt(rawBlock, 10).toString(16);

      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: isHex && rawBlock.length === 66 ? "eth_getBlockByHash" : "eth_getBlockByNumber",
          params: [hexParam, true],
          id: 1,
        }),
      });
      const data = await res.json();
      setBlockData(data.result || null);
    } catch (e) {
      console.warn("Failed to fetch block:", e);
    } finally {
      setIsLoading(false);
    }
  }, [rawBlock]);

  useEffect(() => {
    void fetchBlock();
  }, [fetchBlock]);

  const heightNum = blockData?.number ? parseInt(blockData.number, 16) : null;
  const gasUsedNum = blockData?.gasUsed ? parseInt(blockData.gasUsed, 16) : 0;
  const gasLimitNum = blockData?.gasLimit ? parseInt(blockData.gasLimit, 16) : 30_000_000;
  const timestampNum = blockData?.timestamp ? parseInt(blockData.timestamp, 16) : null;
  const proposerAddr = blockData?.proposer || blockData?.miner || "0x...";

  return (
    <PageShell
      eyebrow="PoPC Consensus Block"
      title={heightNum != null ? `Block #${heightNum.toLocaleString()}` : `Block Details`}
      description="Cryptographic block receipt, Merkle state root, and transaction executions from NakharaX L1"
      meta={
        <>
          <StatusPill tone="chain">Chain ID: 86137</StatusPill>
          <StatusPill tone="ai">Finalized (PoPC BFT)</StatusPill>
        </>
      }
      actions={
        <Link
          href="/apps/explorer"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft size={13} />
          Back to Explorer
        </Link>
      }
    >
      {isLoading ? (
        <Card className="border-white/10 bg-slate-950/80 p-8 text-center font-mono text-xs text-slate-400">
          <p className="animate-pulse font-semibold text-slate-200">Loading block data from RPC...</p>
        </Card>
      ) : !blockData ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6 text-center font-mono text-xs text-slate-300">
          <p className="font-bold text-red-300">Block Not Found</p>
          <p className="mt-1 text-slate-400">Could not find block &quot;{rawBlock}&quot; on the current chain.</p>
        </Card>
      ) : (
        <>
          {/* Hero Stats */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label="Block Height"
              value={`#${heightNum?.toLocaleString()}`}
              hint="Monotonically increasing"
              icon={<Boxes size={18} />}
              tone="chain"
            />
            <StatCard
              label="Transactions"
              value={Array.isArray(blockData.transactions) ? blockData.transactions.length.toString() : "0"}
              hint="Included transactions"
              icon={<Activity size={18} />}
              tone="ai"
            />
            <StatCard
              label="Block Reward"
              value="2.00 tNAK"
              hint="Minted to Proposer"
              icon={<Coins size={18} />}
              tone="ai"
            />
            <StatCard
              label="Gas Used"
              value={`${gasUsedNum.toLocaleString()}`}
              hint={`Limit: ${gasLimitNum.toLocaleString()}`}
              icon={<Zap size={18} />}
              tone="warn"
            />
          </div>

          {/* Block Detailed Ledger Table */}
          <Card className="divide-y divide-white/[0.08] border-white/10 bg-slate-950/80 p-0 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">Block Hash:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white break-all">{blockData.hash}</span>
                <button
                  onClick={() => copyText(blockData.hash)}
                  className="rounded p-1 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">Parent Hash:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 break-all">{blockData.parentHash || blockData.parent_hash}</span>
                <button
                  onClick={() => copyText(blockData.parentHash || blockData.parent_hash)}
                  className="rounded p-1 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">Block Proposer (Validator):</span>
              <Link
                href={`/apps/explorer/address/${proposerAddr}`}
                className="font-bold text-emerald-400 hover:underline break-all"
              >
                {proposerAddr}
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">Merkle State Root:</span>
              <span className="text-violet-300 break-all">{blockData.stateRoot || blockData.state_root}</span>
            </div>

            <div className="flex items-center justify-between p-4">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-slate-200">
                {timestampNum ? new Date(timestampNum * 1000).toUTCString() : "N/A"}
              </span>
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}
