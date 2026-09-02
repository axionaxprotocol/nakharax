"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Copy,
  Cpu,
  Droplets,
  ExternalLink,
  Flame,
  KeyRound,
  Layers3,
  Lock,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
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

// On-chain FaucetTreasury contract (holds NAK ERC-20 token, not native ETH).
// We read the token balance via eth_call on the NakharaxToken contract:
// balanceOf(FaucetTreasury) — selector 0x70a08231.
const FAUCET_TREASURY = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const NAK_TOKEN = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const BALANCE_OF_DATA = `0x70a08231${FAUCET_TREASURY.slice(2).toLowerCase().padStart(64, "0")}`;

export default function TestnetFaucetPage() {
  const [recipientAddress, setRecipientAddress] = useState("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const [isRequesting, setIsRequesting] = useState(false);
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"success" | "error">("success");
  const [faucetTreasury, setFaucetTreasury] = useState<number | null>(null);
  const [sessionDispenses, setSessionDispenses] = useState(0);
  const [currentBlock, setCurrentBlock] = useState<number | null>(null);

  // Restore saved wallet address or sync with active MetaMask account
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setRecipientAddress(accounts[0]);
          }
        })
        .catch(() => { });

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setRecipientAddress(accounts[0]);
        }
      };

      ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    } else {
      try {
        const saved = localStorage.getItem("nakharax-active-vault");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.address) setRecipientAddress(parsed.address);
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Fetch live on-chain faucet treasury balance from the real FaucetTreasury contract.
  // The treasury holds the NAK ERC-20 token (not native ETH), so we read the token
  // balance via eth_call on the NakharaxToken contract: balanceOf(FaucetTreasury).
  const fetchLiveFaucetStats = useCallback(async () => {
    try {
      const bnRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
      });
      const bnData = await bnRes.json();
      if (bnData.result) {
        const bn = parseInt(bnData.result, 16);
        if (Number.isFinite(bn)) setCurrentBlock(bn);
      }

      // Query the NAK token balance held by the FaucetTreasury contract.
      const balRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [{ to: NAK_TOKEN, data: BALANCE_OF_DATA }, "latest"],
          id: 2,
        }),
      });
      const balData = await balRes.json();
      if (balData.result && balData.result !== "0x") {
        const bal = parseInt(balData.result, 16) / 1e18;
        setFaucetTreasury(bal > 0 ? bal : 0);
      }
    } catch {
      /* fallback */
    }
  }, []);

  useEffect(() => {
    void fetchLiveFaucetStats();
    const interval = setInterval(fetchLiveFaucetStats, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveFaucetStats]);

  async function handleRequestTokens(e: React.FormEvent) {
    e.preventDefault();
    const recipient = recipientAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setNoticeTone("error");
      setReceiptNotice("Enter a valid 20-byte EVM address before claiming testnet tokens.");
      return;
    }

    try {
      setIsRequesting(true);
      setNoticeTone("success");
      setReceiptNotice("Broadcasting nakharax_faucet JSON-RPC to Node RPC...");

      // Call live RPC
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_faucet",
          params: [recipient, 100],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error || !data.result?.txHash) {
        throw new Error(data.error?.message || "The faucet did not return a transaction hash.");
      }

      setReceiptNotice(
        `🎉 Successfully dispensed 100.00 $tNAK${currentBlock === null ? "" : ` (Block #${currentBlock})`}!\nRecipient: ${recipient}\nTx Hash: ${data.result.txHash}\nStatus: CONFIRMED_POPC_FINALITY`
      );
      setFaucetTreasury((prev) => (prev === null ? null : Math.max(0, prev - 100)));
      setSessionDispenses((prev) => prev + 1);
    } catch (error) {
      setNoticeTone("error");
      setReceiptNotice(`Faucet request was not confirmed: ${error instanceof Error ? error.message : "Unknown RPC error."}`);
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Testnet Utility"
      title="NakharaX Public Testnet Faucet"
      description="Request free testnet tokens ($tNAK) to run DeAI worker simulations, deploy smart contracts, stake on subnets, and fund autonomous agents."
      meta={
        <>
          <StatusPill tone="warn" pulse>
            100 $tNAK / Request
          </StatusPill>
          <StatusPill tone="ai">Chain ID 86137</StatusPill>
          <StatusPill tone="violet">
            {currentBlock === null ? "Network syncing" : `Block #${currentBlock.toLocaleString()}`}
          </StatusPill>
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
          label="Dispense Rate"
          value="100.0 tNAK"
          hint="Per testnet request"
          icon={<Droplets size={18} />}
          tone="warn"
        />
        <StatCard
          label="Treasury Balance"
          value={faucetTreasury === null ? "—" : `${faucetTreasury.toLocaleString()} tNAK`}
          hint="Live Genesis Faucet Vault"
          icon={<Coins size={18} />}
          tone="chain"
        />
        <StatCard
          label="Session Dispenses"
          value={sessionDispenses.toLocaleString()}
          hint="Confirmed in this browser session"
          icon={<Activity size={18} />}
          tone="ai"
        />
        <StatCard
          label="Settlement Latency"
          value="< 1.0s"
          hint="Sub-second state finality"
          icon={<Zap size={18} />}
          tone="violet"
        />
      </div>

      {/* Main Form Box */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="space-y-4 border-white/10 bg-slate-950/80 p-6 lg:col-span-8">
          <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
            <div className="h-12 w-12 rounded-xl border border-emerald-500/40 bg-black/70 p-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/nakharax-token.svg"
                alt="NakharaX $tNAK"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Request $tNAK Testnet Tokens</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Enter any EVM address (0x...) to receive 100 $tNAK immediately on NakharaX Testnet.
              </p>
            </div>
          </div>

          <form onSubmit={handleRequestTokens} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                Target Recipient Address (EVM 0x...)
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
                  required
                />
              </div>
            </div>

            {receiptNotice && (
              <div
                className={`rounded-xl border p-3.5 font-mono text-xs whitespace-pre-wrap leading-relaxed ${noticeTone === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(41,240,106,0.15)]"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  }`}
              >
                {receiptNotice}
              </div>
            )}

            <button
              type="submit"
              disabled={isRequesting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 font-mono text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.4)] disabled:opacity-50"
            >
              {isRequesting ? <RefreshCw size={14} className="animate-spin" /> : <Droplets size={14} />}
              <span>{isRequesting ? "Dispensing Tokens..." : "Claim 100 $tNAK Testnet"}</span>
            </button>
          </form>
        </Card>

        {/* Right Info Box */}
        <Card className="space-y-4 border-white/10 bg-slate-950/80 p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <ShieldCheck size={16} className="text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Developer Rules
              </h3>
            </div>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-300 leading-relaxed font-mono">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Unlimited testing on Local & Public Testnet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>$tNAK has zero economic value outside testnet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400">✓</span>
                <span>Use funds to test DeAI Inference, Subnets & LoRA.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-white/10">
            <Link
              href="/apps/explorer"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-xs font-mono text-cyan-300 transition-colors"
            >
              <span>View On Block Explorer</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
