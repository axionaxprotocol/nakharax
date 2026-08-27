"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  ExternalLink,
  Layers,
  LogOut,
  RefreshCw,
  Shield,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const NAKHARAX_CHAIN_ID_DEC = 86137;
export const NAKHARAX_CHAIN_ID_HEX = "0x15079"; // 86137 in hex
export const NAKHARAX_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const NAKHARAX_CHAIN_PARAMS = {
  chainId: NAKHARAX_CHAIN_ID_HEX,
  chainName: "NakharaX L1 Testnet",
  nativeCurrency: {
    name: "NakharaX Token",
    symbol: "tNAK",
    decimals: 18,
  },
  rpcUrls: ["http://127.0.0.1:8545", "https://rpc.nakharax.com"],
  blockExplorerUrls: ["http://localhost:3030/apps/explorer"],
};

export function WalletConnectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [tokenAdded, setTokenAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCorrectNetwork = chainId === NAKHARAX_CHAIN_ID_HEX || chainId === "86137";

  // Check existing connection on mount
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .catch(() => {});

      ethereum
        .request({ method: "eth_chainId" })
        .then((currentChainId: string) => {
          setChainId(currentChainId);
        })
        .catch(() => {});

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
      };

      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
          ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  const connectWallet = async () => {
    setErrorMessage(null);
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setErrorMessage("No Web3 wallet detected. Please install MetaMask, Coinbase Wallet, or Rabby.");
      return;
    }

    setIsConnecting(true);
    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentChainId = await ethereum.request({ method: "eth_chainId" });
        setChainId(currentChainId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    setIsSwitching(true);
    setErrorMessage(null);
    const ethereum = (window as any).ethereum;

    try {
      // Try switching first
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NAKHARAX_CHAIN_ID_HEX }],
      });
      setChainId(NAKHARAX_CHAIN_ID_HEX);
    } catch (switchError: any) {
      // Error code 4902 indicates that the chain has not been added yet
      if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain")) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [NAKHARAX_CHAIN_PARAMS],
          });
          setChainId(NAKHARAX_CHAIN_ID_HEX);
        } catch (addError: any) {
          setErrorMessage(addError.message || "Failed to add NakharaX Testnet to wallet.");
        }
      } else {
        setErrorMessage(switchError.message || "Failed to switch network.");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const addTokenToMetaMask = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    setIsAddingToken(true);
    const ethereum = (window as any).ethereum;

    try {
      const wasAdded = await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: NAKHARAX_TOKEN_ADDRESS,
            symbol: "tNAK",
            decimals: 18,
            image: "https://nakharax.com/brand/nakharax-token.svg",
          },
        },
      });

      if (wasAdded) {
        setTokenAdded(true);
        setTimeout(() => setTokenAdded(false), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to add $tNAK token to wallet.");
    } finally {
      setIsAddingToken(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
  };

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-slate-950 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all animate-scale-in">
        {/* Top ambient glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Wallet size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Web3 Sovereign Vault</h3>
              <p className="text-xs text-slate-400">Connect Browser Wallet to Chain 86137</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Body Content */}
        <div className="mt-5 space-y-4">
          {!account ? (
            /* Not Connected State */
            <div className="space-y-3 text-center py-2">
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Connect your Web3 browser extension to sign transactions, claim testnet tokens, and submit compute jobs directly on-chain.
              </p>

              <div className="pt-2">
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 p-3.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Requesting Connection...</span>
                    </>
                  ) : (
                    <>
                      <Wallet size={16} />
                      <span>Connect MetaMask / Web3</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                  <span className="text-slate-500 block text-[10px]">TARGET NETWORK</span>
                  <span className="text-emerald-300 font-bold">Chain ID 86137</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                  <span className="text-slate-500 block text-[10px]">NATIVE GAS TOKEN</span>
                  <span className="text-cyan-300 font-bold">$tNAK (18 Decimals)</span>
                </div>
              </div>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-4">
              {/* Account Address Card */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">CONNECTED ACCOUNT</span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-[11px] text-emerald-300">Active</span>
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-xs text-white bg-slate-900/90 rounded-xl p-2 border border-white/10">
                  <span className="truncate max-w-[240px]">
                    {account.slice(0, 8)}...{account.slice(-6)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors ml-2"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Network Status & Switcher */}
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[11px]">CURRENT NETWORK</span>
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold",
                      isCorrectNetwork ? "text-emerald-300" : "text-amber-400"
                    )}
                  >
                    {isCorrectNetwork ? "NakharaX L1 (86137)" : `Wrong Network (${chainId || "Unknown"})`}
                  </span>
                </div>

                {!isCorrectNetwork ? (
                  <button
                    onClick={switchNetwork}
                    disabled={isSwitching}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 p-2.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  >
                    {isSwitching ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Switching to Chain 86137...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>Switch Network to NakharaX Testnet</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/30">
                    <ShieldCheck size={15} />
                    <span>Connected to NakharaX Testnet (Chain ID 86137)</span>
                  </div>
                )}
              </div>

              {/* Quick Actions (Add Token to MetaMask & Faucet) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={addTokenToMetaMask}
                  disabled={isAddingToken}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 p-2.5 text-xs font-mono font-semibold text-cyan-300 transition-colors"
                >
                  <Coins size={13} />
                  <span>{tokenAdded ? "Token Added!" : "Add $tNAK Token"}</span>
                </button>

                <Link
                  href="/apps/faucet"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 p-2.5 text-xs font-mono font-semibold text-amber-300 transition-colors"
                >
                  <Zap size={13} />
                  <span>Get 1,000 $NAKt</span>
                </Link>
              </div>

              {/* Disconnect Button */}
              <button
                onClick={disconnectWallet}
                className="w-full flex items-center justify-center gap-2 text-xs font-mono text-slate-500 hover:text-rose-400 transition-colors pt-2"
              >
                <LogOut size={13} />
                <span>Disconnect Wallet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
