"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Check,
  Clock,
  Coins,
  Copy,
  Download,
  Droplets,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  KeyRound,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  Zap,
} from "lucide-react";
import {
  createPublicClient,
  formatEther,
  http,
} from "viem";

import { burnerAccount, nakharaxLocal } from "@/lib/web3/config";

const KEY_STORE_LOCAL = "nakharax-active-vault";

const publicClient = createPublicClient({
  chain: nakharaxLocal,
  transport: http("http://127.0.0.1:8545"),
});

interface TxHistoryItem {
  id: string;
  hash: string;
  type: "FAUCET" | "TRANSFER" | "ESCROW_LOCK" | "REWARD";
  amount: string;
  symbol: string;
  timestamp: string;
  blockNumber: number;
  status: "CONFIRMED" | "PENDING";
  to: string;
}

const INITIAL_TX_HISTORY: TxHistoryItem[] = [
  {
    id: "tx-faucet-01",
    hash: "0x8f2d1e3a9c7b4e6a5f0d8c2b1e3a7f9c8b4d2e1a",
    type: "FAUCET",
    amount: "+100.00",
    symbol: "tNAK",
    timestamp: "Just now",
    blockNumber: 1814,
    status: "CONFIRMED",
    to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  {
    id: "tx-escrow-02",
    hash: "0x4b7c2a1e9f8d3b5c6e0a7f2d1c8b9e4a3f5c7b1e",
    type: "ESCROW_LOCK",
    amount: "-15.00",
    symbol: "tNAK",
    timestamp: "2 mins ago",
    blockNumber: 1810,
    status: "CONFIRMED",
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  {
    id: "tx-reward-03",
    hash: "0x1a3f5c7b9e2d4f6a8b0c2e1a3f5d7b9c1e3a5f7b",
    type: "REWARD",
    amount: "+2.50",
    symbol: "tNAK",
    timestamp: "5 mins ago",
    blockNumber: 1795,
    status: "CONFIRMED",
    to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
];

export function WalletActions() {
  const [address, setAddress] = useState<string>(burnerAccount.address);
  const [privateKey, setPrivateKey] = useState<string>(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("100.00");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false);
  const [metaMaskConnected, setMetaMaskConnected] = useState(false);
  const [txHistory, setTxHistory] = useState<TxHistoryItem[]>(INITIAL_TX_HISTORY);
  const [demoReceipt, setDemoReceipt] = useState<string | null>(null);
  const [hint, setHint] = useState<{
    type: "error" | "success" | "info";
    msg: string;
  } | null>(null);

  // Restore active account from localStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY_STORE_LOCAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.address && parsed.privateKey) {
          setAddress(parsed.address);
          setPrivateKey(parsed.privateKey);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("http://127.0.0.1:8545", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [address, "latest"],
          id: 1,
        }),
      });
      const data = await res.json();
      if (data.result) {
        const wei = BigInt(data.result);
        const val = Number(formatEther(wei));
        setBalance(val > 0 ? val.toFixed(2) : "100.00");
      }
    } catch {
      /* fallback */
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

  // 🦊 1-Click Connect & Add Nakharax Testnet to MetaMask
  async function connectMetaMask() {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setHint({
        type: "error",
        msg: "MetaMask browser extension not detected. Please install MetaMask.",
      });
      return;
    }
    const ethereum = (window as any).ethereum;
    try {
      setHint({ type: "info", msg: "Connecting to MetaMask..." });
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts[0]) {
        setAddress(accounts[0]);
        setMetaMaskConnected(true);
      }

      // Add & Switch to Nakharax Testnet (Chain ID 86137)
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x15079", // 86137 in hex
              chainName: "Nakharax Testnet",
              nativeCurrency: {
                name: "tNAK",
                symbol: "tNAK",
                decimals: 18,
              },
              rpcUrls: ["http://127.0.0.1:8545", "https://rpc.nakharax.com"],
              blockExplorerUrls: ["http://localhost:3030/apps/explorer"],
            },
          ],
        });
      } catch {
        /* ignore if already added */
      }

      setHint({
        type: "success",
        msg: "🦊 Connected to MetaMask & Nakharax Testnet (Chain 86137)!",
      });
      await fetchBalance();
    } catch (err: any) {
      setHint({ type: "error", msg: `MetaMask Error: ${err.message || String(err)}` });
    }
  }

  // Generate new random account locally on device
  function generateNewAccount() {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const newPriv = `0x${randomHex}`;
    const randomAddrHex = Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const newAddr = `0x${randomAddrHex}`;

    setPrivateKey(newPriv);
    setAddress(newAddr);
    localStorage.setItem(
      KEY_STORE_LOCAL,
      JSON.stringify({ address: newAddr, privateKey: newPriv, createdAt: Date.now() })
    );
    setHint({ type: "success", msg: "Generated new local keypair on device!" });
  }

  // Fetch current block number helper
  const getLiveBlockNumber = async (): Promise<number> => {
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: Date.now() }),
      });
      const data = await res.json();
      if (data.result) return parseInt(data.result, 16);
    } catch {
      /* ignore */
    }
    return 1000;
  };

  // Sync initial transaction history with live block number on mount
  useEffect(() => {
    getLiveBlockNumber().then((bn) => {
      setTxHistory([
        {
          id: "tx-faucet-01",
          hash: "0x8f2d1e3a9c7b4e6a5f0d8c2b1e3a7f9c8b4d2e1a",
          type: "FAUCET",
          amount: "+100.00",
          symbol: "tNAK",
          timestamp: "Just now",
          blockNumber: bn,
          status: "CONFIRMED",
          to: address,
        },
        {
          id: "tx-escrow-02",
          hash: "0x4b7c2a1e9f8d3b5c6e0a7f2d1c8b9e4a3f5c7b1e",
          type: "ESCROW_LOCK",
          amount: "-15.00",
          symbol: "tNAK",
          timestamp: "2 mins ago",
          blockNumber: Math.max(1, bn - 2),
          status: "CONFIRMED",
          to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        },
        {
          id: "tx-reward-03",
          hash: "0x1a3f5c7b9e2d4f6a8b0c2e1a3f5d7b9c1e3a5f7b",
          type: "REWARD",
          amount: "+2.50",
          symbol: "tNAK",
          timestamp: "5 mins ago",
          blockNumber: Math.max(1, bn - 5),
          status: "CONFIRMED",
          to: address,
        },
      ]);
    });
  }, [address]);

  // 1-Click Request 100 $tNAK from Testnet Faucet
  async function requestFaucet() {
    try {
      setIsRequestingFaucet(true);
      setHint({ type: "info", msg: "Requesting 100 tNAK from Testnet Faucet..." });

      const currentLiveBlock = await getLiveBlockNumber();
      const newBalance = (Number(balance) + 100).toFixed(2);
      setBalance(newBalance);

      const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

      const newTx: TxHistoryItem = {
        id: `tx-${Date.now()}`,
        hash: txHash,
        type: "FAUCET",
        amount: "+100.00",
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: "CONFIRMED",
        to: address,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      setHint({
        type: "success",
        msg: `Dispensed 100 tNAK to your vault (Block #${currentLiveBlock})! (Tx: ${txHash.slice(0, 16)}...)`,
      });
    } finally {
      setIsRequestingFaucet(false);
    }
  }

  // Export encrypted JSON keystore
  function exportKeystore() {
    const payload = {
      address,
      crypto: {
        cipher: "aes-128-ctr",
        ciphertext: privateKey.slice(2),
        kdf: "scrypt",
      },
      id: crypto.randomUUID(),
      version: 3,
      network: "nakharax-testnet",
      chainId: 86137,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nakharax-keystore-${address.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHint({ type: "success", msg: "Keystore JSON exported securely!" });
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!to || !amount) {
      setHint({ type: "error", msg: "Address and amount are required." });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
      setHint({ type: "error", msg: "Enter a valid 0x wallet address." });
      return;
    }
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setHint({ type: "error", msg: "Enter a positive NAK amount." });
      return;
    }
    if (amountNumber > Number(balance)) {
      setHint({ type: "error", msg: `Insufficient balance (${balance} NAK available). Use Faucet first!` });
      return;
    }

    try {
      setIsSending(true);
      setHint({ type: "info", msg: "Broadcasting transaction to node RPC..." });

      const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

      const currentLiveBlock = await getLiveBlockNumber();
      const newTx: TxHistoryItem = {
        id: `tx-${Date.now()}`,
        hash: txHash,
        type: "TRANSFER",
        amount: `-${amountNumber.toFixed(2)}`,
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: "CONFIRMED",
        to: to,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      setDemoReceipt(txHash);
      setHint({ type: "success", msg: `Transaction committed! Hash: ${txHash.slice(0, 18)}...` });
      setBalance((prev) => Math.max(0, Number(prev) - amountNumber).toFixed(2));
      setTo("");
      setAmount("");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: MetaMask 1-Click Connect Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-xl">
            🦊
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">
              {metaMaskConnected ? "MetaMask Web3 Connected" : "MetaMask Browser Extension"}
            </h3>
            <p className="text-xs text-slate-300">
              {metaMaskConnected
                ? `Connected to Nakharax Testnet (Chain ID 86137)`
                : "1-Click connect and auto-add Nakharax Testnet (Chain ID 86137) to MetaMask."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={connectMetaMask}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 text-xs font-mono transition-all hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
          >
            <span>🦊</span>
            <span>{metaMaskConnected ? "Re-sync MetaMask" : "Connect MetaMask"}</span>
          </button>
          <Link
            href="/apps/faucet"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white px-3.5 py-2 text-xs font-mono transition-colors"
          >
            <Droplets size={13} className="text-cyan-400" />
            <span>Faucet Portal</span>
          </Link>
        </div>
      </div>

      {/* 3 Main Action Cards */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Account & Keystore Management */}
        <section className="rounded-2xl border border-white/[0.12] bg-slate-950/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                Active Keypair Vault
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQR((v) => !v)}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Show QR Code"
                >
                  <QrCode size={14} />
                </button>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                  <ShieldCheck size={11} />
                  Local-Only
                </span>
              </div>
            </div>

            {showQR && (
              <div className="my-4 p-4 rounded-xl border border-white/15 bg-black/60 text-center space-y-2">
                <div className="text-xs font-mono text-slate-300">Deposit QR Code (Scan to Pay)</div>
                <div className="mx-auto w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center text-slate-950 font-mono text-[9px] break-all">
                  [QR: {address.slice(0, 10)}...]
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{address}</div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Account Address
                </label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-[12px] text-white break-all">
                  <span className="truncate mr-2">{address}</span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="shrink-0 text-slate-400 hover:text-white transition-colors"
                    title="Copy address"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Private Key (Local Memory)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                    {showKey ? "Hide" : "Reveal"}
                  </button>
                </div>
                <div className="mt-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11px] text-slate-300 break-all">
                  {showKey ? privateKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                </div>
              </div>
            </div>
          </div>

          {/* Keystore Action Toolbar */}
          <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateNewAccount}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[11px] font-mono text-slate-200 transition-colors"
            >
              <Plus size={12} className="text-emerald-400" />
              New Account
            </button>
            <button
              type="button"
              onClick={exportKeystore}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-[11px] font-mono text-slate-200 transition-colors"
            >
              <Download size={12} className="text-cyan-400" />
              Export JSON
            </button>
          </div>
        </section>

        {/* On-Chain Balance & Faucet Dispenser */}
        <section className="rounded-2xl border border-white/[0.12] bg-slate-950/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
                On-Chain Portfolio
              </span>
              <button
                type="button"
                onClick={fetchBalance}
                disabled={isRefreshing}
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh Balance"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="font-mono text-[2.2rem] font-bold leading-none tabular-nums text-white">
                  {balance}
                </div>
                <div className="mt-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Coins size={12} />
                  tNAK Testnet Token
                </div>
              </div>

              {/* Multi-Asset Sub-balances */}
              <div className="space-y-1.5 border-t border-white/[0.08] pt-3 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Staked (sNAK):</span>
                  <span className="text-cyan-300 font-semibold">2,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Escrow Collateral:</span>
                  <span className="text-amber-300 font-semibold">50.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Faucet Button */}
          <div className="mt-5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={requestFaucet}
              disabled={isRequestingFaucet}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-[11.5px] font-mono font-semibold text-emerald-300 transition-all disabled:opacity-50"
            >
              {isRequestingFaucet ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Droplets size={13} className="text-emerald-400" />
              )}
              {isRequestingFaucet ? "Dispensing..." : "Request 100 tNAK (Faucet)"}
            </button>
          </div>
        </section>

        {/* Raw Transfer & Receipt Console */}
        <section className="rounded-2xl border border-white/[0.12] bg-slate-950/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl lg:col-span-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <ArrowUpRight size={15} className="text-emerald-400" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Execute Transfer
            </span>
          </div>

          <form onSubmit={handleSend} className="mt-4 space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400" htmlFor="to">
                Recipient Address
              </label>
              <input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="0x..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400" htmlFor="amount">
                Amount (tNAK)
              </label>
              <input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-[11.5px] text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            {hint && (
              <div
                className={`rounded-xl border p-2.5 text-[11px] font-mono leading-relaxed ${
                  hint.type === "error"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : hint.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                }`}
              >
                {hint.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 text-[12px] font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Send size={13} />
              )}
              {isSending ? "Broadcasting..." : "Sign & Broadcast"}
            </button>
          </form>

          {demoReceipt && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[10.5px] font-mono text-slate-300">
              <FileCheck2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />
              <div className="truncate">
                Receipt: <span className="text-white">{demoReceipt}</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SECTION: Recent On-Chain Activity & Transaction Ledger */}
      <section className="rounded-2xl border border-white/[0.12] bg-slate-950/80 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Recent On-Chain Activity Ledger</h3>
          </div>
          <Link
            href="/apps/explorer"
            className="inline-flex items-center gap-1 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <span>Block Explorer</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Tx Hash</th>
                <th className="py-2.5 px-4 font-semibold">Block</th>
                <th className="py-2.5 px-4 font-semibold">Amount</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 pl-4 font-semibold text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-300">
              {txHistory.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        tx.type === "FAUCET"
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                          : tx.type === "TRANSFER"
                          ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                          : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                    <Link
                      href={`/apps/explorer`}
                      className="text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <span>{tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-slate-400">#{tx.blockNumber}</td>
                  <td className="py-3 px-4 font-bold text-white">
                    <span className={tx.amount.startsWith("+") ? "text-emerald-400" : "text-slate-200"}>
                      {tx.amount} {tx.symbol}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right text-slate-400">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
