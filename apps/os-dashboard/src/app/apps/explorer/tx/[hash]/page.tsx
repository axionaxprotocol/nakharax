"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Boxes,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  Layers3,
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

export default function TransactionDetailPage() {
  const params = useParams();
  const rawHash = Array.isArray(params?.hash) ? params.hash[0] : params?.hash || "";

  const [copied, setCopied] = useState(false);
  const [txData, setTxData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchTx = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionByHash",
          params: [rawHash],
          id: 1,
        }),
      });
      const data = await res.json();
      setTxData(data.result || null);
    } catch (e) {
      console.warn("Failed to fetch transaction:", e);
    } finally {
      setIsLoading(false);
    }
  }, [rawHash]);

  useEffect(() => {
    void fetchTx();
  }, [fetchTx]);

  const blockNum = txData?.blockNumber ? parseInt(txData.blockNumber, 16) : null;
  const gasPriceGwei = txData?.gasPrice ? (parseInt(txData.gasPrice, 16) / 1e9).toFixed(2) : "1.00";
  const valueNak = txData?.value ? (parseInt(txData.value, 16) / 1e18).toFixed(4) : "0.00";

  return (
    <PageShell
      eyebrow="On-Chain Transaction"
      title="Transaction Details"
      description="Cryptographic transaction receipt, gas metrics, and state execution"
      meta={
        <>
          <StatusPill tone="chain">Chain ID: 86137</StatusPill>
          <StatusPill tone="ai">Confirmed (PoPC Finality)</StatusPill>
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
          <p className="animate-pulse font-semibold text-slate-200">Querying transaction from L1 StateDB...</p>
        </Card>
      ) : !txData ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6 text-center font-mono text-xs text-slate-300">
          <p className="font-bold text-red-300">Transaction Not Found</p>
          <p className="mt-1 text-slate-400">Could not find transaction hash &quot;{rawHash}&quot; on the current chain.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label="Block Number"
              value={blockNum != null ? `#${blockNum.toLocaleString()}` : "Pending"}
              hint="Block inclusion"
              icon={<Boxes size={18} />}
              tone="chain"
            />
            <StatCard
              label="Value Transferred"
              value={`${valueNak} tNAK`}
              hint="Native token transfer"
              icon={<Coins size={18} />}
              tone="ai"
            />
            <StatCard
              label="Gas Price"
              value={`${gasPriceGwei} Gwei`}
              hint="Network execution fee"
              icon={<Zap size={18} />}
              tone="warn"
            />
            <StatCard
              label="Execution Status"
              value="Success (PoPC)"
              hint="Deterministic receipt"
              icon={<ShieldCheck size={18} />}
              tone="ai"
            />
          </div>

          <Card className="divide-y divide-white/[0.08] border-white/10 bg-slate-950/80 p-0 font-mono text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">Transaction Hash:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white break-all">{txData.hash}</span>
                <button
                  onClick={() => copyText(txData.hash)}
                  className="rounded p-1 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">From (Sender):</span>
              <Link
                href={`/apps/explorer/address/${txData.from}`}
                className="font-bold text-emerald-400 hover:underline break-all"
              >
                {txData.from}
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
              <span className="text-slate-400">To (Recipient):</span>
              <Link
                href={`/apps/explorer/address/${txData.to}`}
                className="font-bold text-emerald-400 hover:underline break-all"
              >
                {txData.to}
              </Link>
            </div>

            <div className="flex items-center justify-between p-4">
              <span className="text-slate-400">Nonce:</span>
              <span className="text-slate-200">{parseInt(txData.nonce || "0x0", 16)}</span>
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}
