"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  FileCheck2,
  RefreshCw,
} from "lucide-react";
import {
  createPublicClient,
  formatEther,
  http,
} from "viem";

import { burnerAccount, nakharaxLocal } from "@/lib/web3/config";

const publicClient = createPublicClient({
  chain: nakharaxLocal,
  transport: http(),
});

export function WalletActions() {
  const [copied, setCopied] = useState(false);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [hint, setHint] = useState<{
    type: "error" | "success" | "info";
    msg: string;
  } | null>(null);
  const [balance, setBalance] = useState("0");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [demoReceipt, setDemoReceipt] = useState<string | null>(null);

  const address = burnerAccount.address;

  const fetchBalance = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const wei = await publicClient.getBalance({ address });
      setBalance(formatEther(wei));
      setHint(null);
    } catch {
      setHint({
        type: "error",
        msg: "RPC connection failed. Check https://rpc.nakharax.io or your configured node.",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setHint({ type: "error", msg: "Clipboard unavailable." });
    }
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!to || !amount) {
      setHint({ type: "error", msg: "Address and amount are required." });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      setHint({ type: "error", msg: "Enter a valid 0x wallet address for the demo receipt." });
      return;
    }
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setHint({ type: "error", msg: "Enter a positive NAK amount for the demo receipt." });
      return;
    }

    try {
      setIsSending(true);
      setHint({ type: "info", msg: "Creating demo transfer receipt..." });
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const receipt = `demo-${Date.now().toString(36)}-${to.slice(-6)}`;
      setDemoReceipt(receipt);
      setHint({ type: "success", msg: `Demo transfer receipt created: ${receipt}` });
      setTo("");
      setAmount("");
    } catch (error) {
      setHint({ type: "error", msg: `Demo transfer failed: ${readError(error)}` });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-os-5 lg:grid-cols-12">
      <section className="surface-panel rounded-os-2xl p-os-5 lg:col-span-5">
        <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Active account · dev burner
        </div>
        <div className="mt-os-3 flex flex-col gap-os-3">
          <code className="rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-3 font-mono text-caption text-[var(--text-strong)] break-all">
            {address}
          </code>
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="inline-flex items-center justify-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
          >
            {copied ? <Check size={14} className="text-[var(--accent-ok)]" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
      </section>

      <section className="surface-panel rounded-os-2xl p-os-5 lg:col-span-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            On-chain balance
          </div>
          <button
            type="button"
            onClick={() => void fetchBalance()}
            disabled={isRefreshing}
            className="grid h-8 w-8 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--panel-hover)] hover:text-[var(--text-strong)] disabled:opacity-50"
            aria-label="Refresh balance"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="mt-os-5 flex items-baseline gap-os-3">
          <span className="font-mono text-[2rem] font-semibold leading-none tabular-nums text-[var(--text-strong)]">
            {Number(balance).toFixed(4)}
          </span>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            NAK
          </span>
        </div>
      </section>

      <section className="surface-panel rounded-os-2xl p-os-5 lg:col-span-4">
        <div className="flex items-center gap-os-2 text-title font-semibold text-[var(--text-strong)]">
          <ArrowUpRight size={16} className="text-[var(--accent-ai)]" />
          Demo transfer
        </div>
        <p className="mt-os-2 text-caption text-[var(--text-muted)]">
          This form validates input and creates a local demo receipt. It does not broadcast a transaction.
        </p>
        <form onSubmit={handleSend} className="mt-os-4 space-y-os-4">
          <div>
            <label className="mb-os-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]" htmlFor="to">
              Target address
            </label>
            <input
              id="to"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="0x..."
              className="w-full rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-3 font-mono text-caption text-[var(--text-strong)] placeholder:text-[var(--text-faint)] outline-none transition-colors focus:border-emerald-500/50"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-os-1 block text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]" htmlFor="amount">
              Amount (NAK)
            </label>
            <input
              id="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              className="w-full rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-3 font-mono text-caption text-[var(--text-strong)] placeholder:text-[var(--text-faint)] outline-none transition-colors focus:border-emerald-500/50"
            />
          </div>

          {hint && (
            <p
              className={`rounded-os-lg border px-os-3 py-os-2 text-caption ${
                hint.type === "error"
                  ? "border-rose-500/25 bg-rose-500/10 text-[var(--accent-danger)]"
                  : hint.type === "success"
                    ? "border-emerald-500/25 bg-emerald-500/10 text-[var(--accent-ok)]"
                    : "border-cyan-500/25 bg-cyan-500/10 text-[var(--accent-chain)]"
              }`}
            >
              {hint.msg}
            </p>
          )}

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex items-center justify-center gap-os-2 rounded-full bg-[var(--text-strong)] px-os-5 py-os-3 text-[12px] font-semibold text-[var(--canvas)] transition-all hover:-translate-y-0.5 hover:shadow-raise disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <ArrowDownLeft size={14} />
            )}
            {isSending ? "Creating receipt" : "Create demo receipt"}
          </button>
        </form>
        {demoReceipt && (
          <div className="mt-os-4 flex items-start gap-os-2 rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-2 text-caption text-[var(--text-muted)]">
            <FileCheck2 size={14} className="mt-0.5 shrink-0 text-[var(--accent-ok)]" />
            <span>
              Last demo receipt:{" "}
              <code className="font-mono text-[var(--text-strong)]">{demoReceipt}</code>
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function readError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "shortMessage" in error &&
    typeof (error as { shortMessage?: unknown }).shortMessage === "string"
  ) {
    return (error as { shortMessage: string }).shortMessage;
  }
  return error instanceof Error ? error.message : String(error);
}
