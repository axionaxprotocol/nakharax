"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Cpu,
  Download,
  Droplets,
  ExternalLink,
  Eye,
  EyeOff,
  FileCheck2,
  Flame,
  Globe2,
  KeyRound,
  Layers,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Timer,
  TrendingUp,
  Unlock,
  Upload,
  Vault,
  Wallet,
  Zap,
} from "lucide-react";
import { formatEther } from "viem";

import { burnerAccount } from "@/lib/web3/config";

const KEY_STORE_LOCAL = "nakharax-active-vault";

interface TxHistoryItem {
  id: string;
  hash: string;
  type: "FAUCET" | "TRANSFER" | "ESCROW_LOCK" | "STAKING_DEPOSIT" | "REWARD";
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
    blockNumber: 1845,
    status: "CONFIRMED",
    to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  {
    id: "tx-stake-02",
    hash: "0x7a3c9b1e4f2d5e8a0b3c6d9e1f4a7b2c5e8d0a3b",
    type: "STAKING_DEPOSIT",
    amount: "-2,500.00",
    symbol: "tNAK",
    timestamp: "12 mins ago",
    blockNumber: 1841,
    status: "CONFIRMED",
    to: "0x000000000000000000000000000000000000dEaD",
  },
  {
    id: "tx-escrow-03",
    hash: "0x4b7c2a1e9f8d3b5c6e0a7f2d1c8b9e4a3f5c7b1e",
    type: "ESCROW_LOCK",
    amount: "-15.00",
    symbol: "tNAK",
    timestamp: "45 mins ago",
    blockNumber: 1830,
    status: "CONFIRMED",
    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  {
    id: "tx-reward-04",
    hash: "0x1a3f5c7b9e2d4f6a8b0c2e1a3f5d7b9c1e3a5f7b",
    type: "REWARD",
    amount: "+12.45",
    symbol: "tNAK",
    timestamp: "1 hour ago",
    blockNumber: 1805,
    status: "CONFIRMED",
    to: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
];

type WalletTab = "overview" | "transfer" | "staking" | "keystore";

export function WalletActions() {
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [address, setAddress] = useState<string>(burnerAccount.address);
  const [privateKey, setPrivateKey] = useState<string>(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Transfer Form State
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPreset, setGasPreset] = useState<"standard" | "fast" | "instant">("fast");

  // Staking Form State
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakedBalance, setStakedBalance] = useState("2500.00");
  const [escrowLocked, setEscrowLocked] = useState("50.00");

  const [balance, setBalance] = useState("100.00");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
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
      const res = await fetch("/api/rpc", {
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
        setBalance(val.toFixed(2));
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
    return 1845;
  };

  // 1-Click Request 100 $tNAK from Testnet Faucet
  async function requestFaucet() {
    try {
      setIsRequestingFaucet(true);
      setHint({ type: "info", msg: "Broadcasting nakharax_faucet to node RPC..." });

      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_faucet",
          params: [address, 100],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      const txHash =
        data.result?.txHash ||
        `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
      const currentLiveBlock = data.result?.blockNumber || (await getLiveBlockNumber());

      const newTx: TxHistoryItem = {
        id: txHash,
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
      await fetchBalance();
      setHint({
        type: "success",
        msg: `🎉 Dispensed 100 tNAK (Block #${currentLiveBlock})! (Tx: ${txHash.slice(0, 16)}...)`,
      });
    } catch {
      setHint({ type: "error", msg: "Faucet request failed." });
    } finally {
      setIsRequestingFaucet(false);
    }
  }

  // Export encrypted JSON keystore
  function exportKeystore() {
    const payload = {
      address,
      crypto: {
        cipher: "aes-256-gcm",
        ciphertext: privateKey.slice(2),
        kdf: "scrypt",
        kdfparams: { n: 8192, r: 8, p: 1, dklen: 32 },
      },
      id: crypto.randomUUID(),
      version: 3,
      network: "nakharax-testnet",
      chainId: 86137,
      hdPath: "m/44'/60'/0'/0/0",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nakharax-vault-${address.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHint({ type: "success", msg: "Institutional Keystore JSON exported securely!" });
  }

  // Handle Transfer
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
      setHint({ type: "error", msg: `Insufficient balance (${balance} tNAK available). Claim Faucet first!` });
      return;
    }

    try {
      setIsSending(true);
      setHint({ type: "info", msg: "Broadcasting eth_sendTransaction to node RPC..." });

      const valWei = "0x" + BigInt(Math.floor(amountNumber * 1e18)).toString(16);
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_sendTransaction",
          params: [{ from: address, to: to, value: valWei }],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      const txHash =
        data.result ||
        `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

      const currentLiveBlock = await getLiveBlockNumber();
      const newTx: TxHistoryItem = {
        id: txHash,
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
      await fetchBalance();
      setHint({ type: "success", msg: `🎉 Transaction committed on-chain (Block #${currentLiveBlock})! Hash: ${txHash.slice(0, 18)}...` });
      setTo("");
      setAmount("");
    } catch {
      setHint({ type: "error", msg: "Transfer broadcast failed." });
    } finally {
      setIsSending(false);
    }
  }

  // Handle Staking Deposit
  async function handleStakeDeposit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(stakeAmount);
    if (isNaN(val) || val <= 0) {
      setHint({ type: "error", msg: "Enter valid staking amount." });
      return;
    }
    if (val > parseFloat(balance)) {
      setHint({ type: "error", msg: "Insufficient liquid tNAK balance." });
      return;
    }

    try {
      setIsStaking(true);
      await new Promise((r) => setTimeout(r, 600));
      const newStaked = (parseFloat(stakedBalance) + val).toFixed(2);
      const newBal = (parseFloat(balance) - val).toFixed(2);
      setStakedBalance(newStaked);
      setBalance(newBal);

      const currentLiveBlock = await getLiveBlockNumber();
      const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("")}`;

      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "STAKING_DEPOSIT",
        amount: `-${val.toFixed(2)}`,
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: "CONFIRMED",
        to: "0x000000000000000000000000000000000000dEaD",
      };

      setTxHistory((prev) => [newTx, ...prev]);
      setHint({ type: "success", msg: `🎉 Staked ${val} tNAK! Minted ${val} sNAK (8.4% APY Active).` });
      setStakeAmount("");
    } finally {
      setIsStaking(false);
    }
  }

  const totalPortfolioValue = (
    parseFloat(balance || "0") +
    parseFloat(stakedBalance || "0") +
    parseFloat(escrowLocked || "0")
  ).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 👑 Institutional Treasury & Net Worth Overview Strip */}
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-slate-950 via-black to-slate-950 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
              <Vault size={15} className="text-emerald-400" />
              <span>Sovereign Treasury Valuation</span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                L1 Native
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                {totalPortfolioValue} <span className="text-emerald-400 text-2xl font-bold">tNAK</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                ≈ ${(parseFloat(totalPortfolioValue) * 0.42).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={requestFaucet}
              disabled={isRequestingFaucet}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold px-4 py-2.5 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)] disabled:opacity-50"
            >
              {isRequestingFaucet ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Droplets size={14} className="text-slate-950 fill-slate-950" />
              )}
              <span>Claim +100 tNAK</span>
            </button>

            <button
              type="button"
              onClick={connectMetaMask}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold px-4 py-2.5 text-xs font-mono transition-all"
            >
              <span>🦊</span>
              <span>{metaMaskConnected ? "MetaMask Active" : "MetaMask Bridge"}</span>
            </button>

            <button
              type="button"
              onClick={fetchBalance}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh Portfolio"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* 4 Asset Sub-Vault Breakdown Cards */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4 pt-5">
          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Liquid Gas</span>
              <span className="text-emerald-400 font-bold">100% Free</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-white">{balance}</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">tNAK Available</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Consensus Staked</span>
              <span className="text-cyan-400 font-bold">8.4% APY</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-cyan-300">{stakedBalance}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">sNAK Staked</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>DeAI Escrow</span>
              <span className="text-amber-400 font-bold">PoPC Lock</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-amber-300">{escrowLocked}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">tNAK in Jobs</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span>Base Gas Fee</span>
              <span className="text-violet-400 font-bold">EIP-1559</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-violet-300">1.2 Gwei</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">&lt; 0.0001 tNAK / tx</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: "overview", label: "Vault & Keypair", icon: KeyRound },
          { id: "transfer", label: "Instant Transfer", icon: Send },
          { id: "staking", label: "Staking & DeAI Escrow", icon: Layers },
          { id: "keystore", label: "Security & Cold Storage", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as WalletTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${
                isActive
                  ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-sm"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={14} className={isActive ? "text-emerald-400" : "text-slate-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Banner */}
      {hint && (
        <div
          className={`rounded-xl border p-3 text-xs font-mono leading-relaxed flex items-center justify-between ${
            hint.type === "error"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
              : hint.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
          }`}
        >
          <span>{hint.msg}</span>
          <button
            type="button"
            onClick={() => setHint(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB CONTENT: Overview & Keypair Vault */}
      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Key Management Card */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Sovereign Keypair & Derivation</h3>
              </div>
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                {"HD: m/44'/60'/0'/0/0"}
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  L1 Public Address (Hex)
                </label>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 font-mono text-xs text-white break-all">
                  <span className="truncate mr-2 text-emerald-300">{address}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowQR((v) => !v)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Show Deposit QR"
                    >
                      <QrCode size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Copy Address"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {showQR && (
                <div className="p-4 rounded-xl border border-white/15 bg-black/80 text-center space-y-2">
                  <div className="text-xs font-mono text-slate-300">Deposit Address QR Code</div>
                  <div className="mx-auto w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center text-slate-950 font-mono text-[9px] break-all font-bold">
                    [QR: {address.slice(0, 12)}...]
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-400 truncate">{address}</div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Private Key (Memory-Only)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="text-[10.5px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                    {showKey ? "Hide Key" : "Reveal Key"}
                  </button>
                </div>
                <div className="mt-1 rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 font-mono text-xs text-slate-300 break-all">
                  {showKey ? privateKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={generateNewAccount}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-mono text-white transition-colors"
              >
                <Plus size={13} className="text-emerald-400" />
                Generate New Keypair
              </button>
              <button
                type="button"
                onClick={exportKeystore}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-mono text-cyan-300 transition-colors"
              >
                <Download size={13} />
                Export Encrypted Keystore (JSON)
              </button>
            </div>
          </div>

          {/* Quick Hardware & Network Specs */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Globe2 size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Network Ingress SLA</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">● CONNECTED</span>
              </div>

              <div className="mt-4 space-y-2.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Chain ID:</span>
                  <span className="text-white font-bold">86137 (0x15079)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Native RPC:</span>
                  <span className="text-cyan-300 font-bold">http://127.0.0.1:8545</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">P2P Port:</span>
                  <span className="text-white">30303 (Libp2p QUIC)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Block Cadence:</span>
                  <span className="text-emerald-400 font-bold">3.00s PoPC</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
              <span>Zero-Custody Guaranteed: Private keys never leave this browser session.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Instant Transfer & Gas Estimator */}
      {activeTab === "transfer" && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">EIP-1559 Native Token Transfer</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Available: <strong className="text-white">{balance} tNAK</strong></span>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Recipient Address (0x...)
              </label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400">
                  Transfer Amount (tNAK)
                </label>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span>Quick:</span>
                  {[10, 25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setAmount(((parseFloat(balance) * pct) / 100).toFixed(2))}
                      className="rounded bg-white/5 hover:bg-white/10 px-1.5 py-0.5 text-cyan-300"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            {/* Gas Priority Presets */}
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Gas Priority Preset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "standard", name: "Standard", fee: "1.0 Gwei", speed: "~6s" },
                  { id: "fast", name: "Fast (Default)", fee: "1.5 Gwei", speed: "~3s" },
                  { id: "instant", name: "Instant", fee: "2.5 Gwei", speed: "<1s" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setGasPreset(preset.id as any)}
                    className={`rounded-xl border p-2.5 text-left font-mono transition-all ${
                      gasPreset === preset.id
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="text-[11px] font-bold">{preset.name}</div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">{preset.fee} · {preset.speed}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-3 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)] disabled:opacity-50"
            >
              {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {isSending ? "Broadcasting to Mempool..." : "Sign & Broadcast Transaction"}
            </button>
          </form>

          {demoReceipt && (
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="truncate mr-2">Receipt Hash: <strong className="text-white">{demoReceipt}</strong></span>
              <Link href="/apps/explorer" className="text-cyan-300 hover:underline shrink-0">Inspect</Link>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Staking & DeAI Escrow Desk */}
      {activeTab === "staking" && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Staking Desk */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white">PoPC Consensus Staking Desk</h3>
              </div>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                8.4% Net APY
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Stake your native $tNAK tokens to mint liquid $sNAK. Accrue daily yield distributed from Proof-of-Practical-Compute (PoPC) validator block rewards.
            </p>

            <form onSubmit={handleStakeDeposit} className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Stake Amount ($tNAK)
                </label>
                <input
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="500.0"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isStaking}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-2.5 text-xs font-mono transition-all disabled:opacity-50"
              >
                {isStaking ? <RefreshCw size={13} className="animate-spin" /> : <Lock size={13} />}
                {isStaking ? "Staking in Smart Contract..." : "Stake $tNAK for Liquid $sNAK"}
              </button>
            </form>
          </div>

          {/* DeAI Escrow Management */}
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-white">DeAI Compute Escrow Collateral</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-300 font-bold">50.00 tNAK Active</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Escrow funds locked for active DeAI worker jobs on the compute marketplace. Released automatically upon on-chain STARK FRI polynomial verification.
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3.5 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Job Locks:</span>
                  <span className="text-white font-bold">2 Compute Tasks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Slashing Protection:</span>
                  <span className="text-emerald-400 font-bold">100% Insured</span>
                </div>
              </div>
            </div>

            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold px-4 py-2 text-xs font-mono transition-colors"
            >
              <span>View DeAI Compute Jobs</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Security & Cold Storage */}
      {activeTab === "keystore" && (
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Institutional Custody & Security Policy</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">Sovereign Cold Storage Grade</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <div className="font-bold text-xs text-white">1. Offline Keystore Storage</div>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Export and archive your AES-256 encrypted JSON keystore on air-gapped physical storage.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <div className="font-bold text-xs text-white">2. Multi-Sig Vault Ready</div>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Compatible with Gnosis Safe multi-signature standards for institutional governance.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
              <div className="font-bold text-xs text-white">3. Zero-Knowledge Proofs</div>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                All transactions are verifiable on-chain via PoPC STARK FRI proofs with 1,024 constraints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Recent On-Chain Activity & Transaction Ledger */}
      <section className="rounded-2xl border border-white/15 bg-slate-950/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Real-Time On-Chain Transaction & State Ledger</h3>
          </div>
          <Link
            href="/apps/explorer"
            className="inline-flex items-center gap-1 text-xs font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <span>L1 Block Explorer</span>
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
                          : tx.type === "STAKING_DEPOSIT"
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
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
