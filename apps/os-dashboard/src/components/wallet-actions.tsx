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
  LogOut,
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

import { generateEphemeralKeypair, encryptKeystore, decryptKeystore, type KeystoreV3 } from "@/lib/crypto-vault";
import { broadcastRawTransaction } from "@/lib/web3/tx-broadcaster";
import { InstitutionalVaultModal, VaultCreationResult } from "@/components/institutional-vault-modal";

const KEY_STORE_LOCAL = "nakharax-active-vault";
const NAKHARAX_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.nakharax.com";

function parseBlockNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim();
  const parsed = Number.parseInt(normalized, normalized.startsWith("0x") ? 16 : 10);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function blockContext(blockNumber: number | null): string {
  return blockNumber === null ? "pending block inclusion" : `Block #${blockNumber.toLocaleString()}`;
}

function requireRpcTxHash(data: any, operation: string): string {
  if (data?.error) {
    throw new Error(data.error.message || `${operation} RPC error`);
  }

  const txHash = typeof data?.result === "string" ? data.result : data?.result?.txHash;
  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error(`${operation} did not return a valid on-chain transaction hash.`);
  }

  return txHash;
}

interface TxHistoryItem {
  id: string;
  hash: string;
  type: "FAUCET" | "TRANSFER" | "ESCROW_LOCK" | "STAKING_DEPOSIT" | "UNSTAKE_INITIATED" | "UNSTAKE_CLAIMED" | "REWARD";
  amount: string;
  symbol: string;
  timestamp: string;
  blockNumber: number | null;
  status: "CONFIRMED" | "PENDING";
  to: string;
}

type WalletTab = "overview" | "transfer" | "staking" | "keystore" | "web3";

export function WalletActions() {
  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [address, setAddress] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Transfer Form State
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [gasPreset, setGasPreset] = useState<"standard" | "fast" | "instant">("fast");

  // Staking Form State
  const [stakingMode, setStakingMode] = useState<"stake" | "unstake" | "validators">("stake");
  const [selectedValidator, setSelectedValidator] = useState<string>("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [stakedBalance, setStakedBalance] = useState("0.00");
  const [escrowLocked, setEscrowLocked] = useState("0.00");
  const [unbondingQueue, setUnbondingQueue] = useState<
    Array<{ id: string; amount: number; releaseTime: number; claimed: boolean }>
  >([]);

  const [balance, setBalance] = useState("0.00");
  const [accruedYield, setAccruedYield] = useState<number>(0.0);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaimingUnbonded, setIsClaimingUnbonded] = useState(false);
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false);
  const [metaMaskConnected, setMetaMaskConnected] = useState(false);
  const [isInstitutionalModalOpen, setIsInstitutionalModalOpen] = useState(false);
  const [txHistory, setTxHistory] = useState<TxHistoryItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [rpcStatus, setRpcStatus] = useState<"syncing" | "connected" | "unavailable">("syncing");
  const [hint, setHint] = useState<{
    type: "error" | "success" | "info";
    msg: string;
  } | null>(null);

  // ⚡ High-FPS Real-time PoPC Accrued Yield Streaming Ticker (8.4% APY)
  useEffect(() => {
    const stakedVal = parseFloat(stakedBalance || "0");
    if (stakedVal <= 0) return;

    // 8.4% APY = (stakedVal * 0.084) / (365 * 86400) per second
    const yieldPerSec = (stakedVal * 0.084) / (365 * 86400);

    const interval = setInterval(() => {
      setAccruedYield((prev) => prev + yieldPerSec * 0.1);
    }, 100); // 100ms real-time smooth animation

    return () => clearInterval(interval);
  }, [stakedBalance]);

  // Restore active account from localStorage if exists or initialize clean ephemeral session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY_STORE_LOCAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Security migration: Purge legacy plaintext privateKey from localStorage
        if (parsed.privateKey) {
          delete parsed.privateKey;
          localStorage.setItem(KEY_STORE_LOCAL, JSON.stringify(parsed));
        }
        if (parsed.address) {
          setAddress(parsed.address);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    const pair = generateEphemeralKeypair();
    setAddress(pair.address);
    setPrivateKey(pair.privateKey);
  }, []);

  const fetchBalance = useCallback(async (walletAddress = address) => {
    if (!walletAddress) return;

    try {
      setIsRefreshing(true);
      const rpcCall = async (body: Record<string, unknown>) => {
        const response = await fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok || data?.error) {
          throw new Error(data?.error?.message || `RPC request failed (${response.status}).`);
        }
        return data;
      };

      // 1. Fetch Liquid Balance
      const balPromise = rpcCall({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
        id: 1,
      });

      // 2. Fetch Staked Balance & Unbonding Queue from On-Chain Staking Pool
      const stakePromise = rpcCall({
        jsonrpc: "2.0",
        method: "nak_getStakeInfo",
        params: [walletAddress],
        id: 2,
      });

      const [balanceResult, stakeResult] = await Promise.allSettled([balPromise, stakePromise]);

      if (balanceResult.status === "fulfilled" && typeof balanceResult.value?.result === "string") {
        const wei = BigInt(balanceResult.value.result);
        const val = Number(formatEther(wei));
        setBalance(val.toFixed(2));
        setRpcStatus("connected");
      } else {
        setRpcStatus("unavailable");
      }

      if (stakeResult.status === "fulfilled" && stakeResult.value?.result) {
        const stakeData = stakeResult.value;
        if (stakeData.result.sNakBalance !== undefined) {
          setStakedBalance(stakeData.result.sNakBalance);
        } else if (stakeData.result.staked !== undefined) {
          setStakedBalance(stakeData.result.staked);
        }
        if (stakeData.result.claimableReward !== undefined) {
          const claimable = parseFloat(stakeData.result.claimableReward);
          if (!isNaN(claimable) && claimable >= 0) {
            setAccruedYield(claimable);
          }
        }
        if (Array.isArray(stakeData.result.unbondingQueue)) {
          setUnbondingQueue(stakeData.result.unbondingQueue);
        }
      }
    } catch {
      setRpcStatus("unavailable");
    } finally {
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchBalance();
    // ⚡ Real-Time Auto-Polling: Refresh Sovereign Treasury Valuation every 2.5s
    const interval = setInterval(() => {
      void fetchBalance();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  // 🦊 Listen to MetaMask Account & Chain Switching in Real-Time
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      // 1. Immediately check if MetaMask is already connected & unlocked
      ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setMetaMaskConnected(true);
            void fetchBalance(accounts[0]);
          }
        })
        .catch(() => { });

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setMetaMaskConnected(true);
          void fetchBalance(accounts[0]);
        } else {
          setMetaMaskConnected(false);
        }
      };
      const handleChainChanged = () => {
        void fetchBalance();
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
        await fetchBalance(accounts[0]);
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
              rpcUrls: [NAKHARAX_RPC_URL],
              blockExplorerUrls: [`${window.location.origin}/apps/explorer`],
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
      await fetchBalance(accounts?.[0]);
    } catch (err: any) {
      setHint({ type: "error", msg: `MetaMask Error: ${err.message || String(err)}` });
    }
  }

  // Sync real on-chain transactions directly from node RPC
  const syncTransactions = useCallback(async () => {
    if (!address) {
      setTxHistory([]);
      return;
    }

    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_getRecentTransactions",
          params: [],
          id: Date.now(),
        }),
      });
      if (!res.ok) throw new Error(`RPC request failed (${res.status}).`);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "Ledger RPC error");
      if (Array.isArray(data.result)) {
        const walletAddress = address.toLowerCase();
        const mapped: TxHistoryItem[] = data.result
          .filter((tx: any) => tx.from?.toLowerCase() === walletAddress || tx.to?.toLowerCase() === walletAddress)
          .map((tx: any) => {
            const blockNumber = parseBlockNumber(tx.blockNumber);
            return {
          id: tx.hash,
          hash: tx.hash,
          type: (tx.type?.replace("_DISPENSE", "") || "TRANSFER") as any,
          amount: `${Number(formatEther(BigInt(tx.value || "0x0"))).toFixed(2)}`,
          symbol: "tNAK",
          timestamp: tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleTimeString() : "Just now",
          blockNumber,
          status: blockNumber === null ? "PENDING" : "CONFIRMED",
          to: tx.to,
            };
          });
        setTxHistory(mapped);
      }
    } catch {
      /* ignore */
    }
  }, [address]);

  useEffect(() => {
    void syncTransactions();
    const interval = setInterval(syncTransactions, 5000);
    return () => clearInterval(interval);
  }, [syncTransactions]);

  // Generate new cryptographic keypair locally on device
  function generateNewAccount() {
    const pair = generateEphemeralKeypair();
    setPrivateKey(pair.privateKey);
    setAddress(pair.address);
    try {
      localStorage.setItem(
        KEY_STORE_LOCAL,
        JSON.stringify({ address: pair.address, createdAt: Date.now() })
      );
    } catch {
      /* ignore */
    }
    setHint({ type: "success", msg: "Generated new cryptographic keypair on device!" });
    void fetchBalance(pair.address);
  }

  // Fetch current block number helper
  const getLiveBlockNumber = async (): Promise<number | null> => {
    try {
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: Date.now() }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.error) return null;
      return parseBlockNumber(data.result);
    } catch {
      /* ignore */
    }
    return null;
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
      const txHash = requireRpcTxHash(data, "Faucet request");
      const currentLiveBlock = parseBlockNumber(data.result?.blockNumber) ?? (await getLiveBlockNumber());

      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "FAUCET",
        amount: "+100.00",
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: address,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      await fetchBalance();
      setHint({
        type: "success",
        msg: `🎉 Faucet transaction accepted (${blockContext(currentLiveBlock)}). Tx: ${txHash.slice(0, 16)}...`,
      });
    } catch (err: any) {
      setHint({ type: "error", msg: `Faucet request failed: ${err?.message || "RPC error"}` });
    } finally {
      setIsRequestingFaucet(false);
    }
  }

  // Export genuine password-encrypted JSON keystore (PBKDF2 + AES-256-GCM)
  async function exportKeystore() {
    if (!privateKey) {
      setHint({ type: "error", msg: "No private key loaded in active session to export." });
      return;
    }
    const pass = prompt("Set a Master Password (min 6 characters) to encrypt your Keystore JSON:");
    if (!pass || pass.length < 6) {
      setHint({ type: "error", msg: "Password must be at least 6 characters long." });
      return;
    }
    try {
      const keystore = await encryptKeystore(privateKey as `0x${string}`, pass);
      const blob = new Blob([JSON.stringify(keystore, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nakharax-keystore-${address.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setHint({ type: "success", msg: "Institutional Keystore JSON encrypted with AES-256-GCM & exported securely!" });
    } catch (err: any) {
      setHint({ type: "error", msg: `Failed to export encrypted keystore: ${err?.message || "Encryption error"}` });
    }
  }

  // Import encrypted Keystore JSON file
  async function handleImportKeystoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as KeystoreV3;
      if (!parsed.crypto || !parsed.address) {
        setHint({ type: "error", msg: "Invalid Keystore file format." });
        return;
      }
      const pass = prompt(`Enter Master Password to decrypt Keystore for ${parsed.address.slice(0, 10)}...:`);
      if (!pass) return;

      const decryptedKey = await decryptKeystore(parsed, pass);
      setPrivateKey(decryptedKey);
      setAddress(parsed.address);
      try {
        localStorage.setItem(
          KEY_STORE_LOCAL,
          JSON.stringify({ address: parsed.address, keystore: parsed, createdAt: Date.now() })
        );
      } catch { }
      setHint({ type: "success", msg: `🔓 Keystore decrypted successfully! Loaded wallet ${parsed.address.slice(0, 10)}...` });
      void fetchBalance(parsed.address);
    } catch (err: any) {
      setHint({ type: "error", msg: `Keystore import failed: ${err?.message || "Decryption error"}` });
    } finally {
      e.target.value = "";
    }
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
      setHint({ type: "info", msg: "Signing & broadcasting eth_sendRawTransaction to node RPC..." });

      const valWei = BigInt(Math.floor(amountNumber * 1e18));
      const txHash = await broadcastRawTransaction({
        to: to as `0x${string}`,
        value: valWei,
        privateKey: privateKey ? (privateKey as `0x${string}`) : undefined,
      });

      const currentLiveBlock = await getLiveBlockNumber();
      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "TRANSFER",
        amount: `-${amountNumber.toFixed(2)}`,
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: to,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      setLastReceipt(txHash);
      await fetchBalance();
      setHint({ type: "success", msg: `🎉 Raw transaction signed & broadcast (${blockContext(currentLiveBlock)}). Hash: ${txHash.slice(0, 18)}...` });
      setTo("");
      setAmount("");
    } catch (err: any) {
      setHint({ type: "error", msg: `Transfer broadcast failed: ${err?.message || "Error"}` });
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
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nak_stake",
          params: [address, val, selectedValidator],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Staking RPC error");
      }
      const rpcResult = data.result;

      const currentLiveBlock = parseBlockNumber(rpcResult?.blockNumber) ?? (await getLiveBlockNumber());
      const txHash = requireRpcTxHash(data, "Staking transaction");

      const newStaked = (parseFloat(stakedBalance) + val).toFixed(2);
      const newBal = (parseFloat(balance) - val).toFixed(2);
      setStakedBalance(newStaked);
      setBalance(newBal);

      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "STAKING_DEPOSIT",
        amount: `-${val.toFixed(2)}`,
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: selectedValidator,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      await fetchBalance();
      setHint({
        type: "success",
        msg: `🎉 Stake transaction accepted (${blockContext(currentLiveBlock)}). Minted ${val} sNAK shares. Tx: ${txHash.slice(0, 16)}...`,
      });
      setStakeAmount("");
    } catch (err: any) {
      setHint({ type: "error", msg: `Staking transaction failed: ${err?.message || "Broadcast error"}` });
    } finally {
      setIsStaking(false);
    }
  }

  async function handleUnstake(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(unstakeAmount);
    if (isNaN(val) || val <= 0) {
      setHint({ type: "error", msg: "Enter valid unstaking amount." });
      return;
    }
    if (val > parseFloat(stakedBalance)) {
      setHint({ type: "error", msg: "Insufficient sNAK staked balance." });
      return;
    }

    try {
      setIsUnstaking(true);
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nak_unstake",
          params: [address, val],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Unstaking RPC error");
      }
      const rpcResult = data.result;

      const currentLiveBlock = parseBlockNumber(rpcResult?.blockNumber) ?? (await getLiveBlockNumber());
      const txHash = requireRpcTxHash(data, "Unstaking transaction");

      if (typeof rpcResult?.unbondId !== "string" || !Number.isFinite(rpcResult?.releaseTime)) {
        throw new Error("Unstaking RPC did not return a valid unbonding schedule.");
      }
      const unbondId = rpcResult.unbondId;
      const releaseTime = rpcResult.releaseTime;

      const newStaked = (parseFloat(stakedBalance) - val).toFixed(2);
      setStakedBalance(newStaked);

      setUnbondingQueue((prev) => [
        { id: unbondId, amount: val, releaseTime, claimed: false },
        ...prev,
      ]);

      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "UNSTAKE_INITIATED" as any,
        amount: `-${val.toFixed(2)}`,
        symbol: "sNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: "0x0000000000000000000000000000000000000008",
      };

      setTxHistory((prev) => [newTx, ...prev]);

      setHint({
        type: "success",
        msg: `🔓 Unstake transaction accepted (${blockContext(currentLiveBlock)}). Cooldown active (300s). Tx: ${txHash.slice(0, 16)}...`,
      });
      setUnstakeAmount("");
    } catch (err: any) {
      setHint({ type: "error", msg: `Unstaking transaction failed: ${err?.message || "Broadcast error"}` });
    } finally {
      setIsUnstaking(false);
    }
  }

  async function handleClaimUnbonded(id: string) {
    const item = unbondingQueue.find((u) => u.id === id);
    if (!item || item.claimed) return;

    try {
      setIsClaimingUnbonded(true);
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nak_claimUnbonded",
          params: [address, id],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Claim RPC error");
      }
      const rpcResult = data.result;

      const currentLiveBlock = parseBlockNumber(rpcResult?.blockNumber) ?? (await getLiveBlockNumber());
      const txHash = requireRpcTxHash(data, "Claim transaction");

      setUnbondingQueue((prev) =>
        prev.map((u) => (u.id === id ? { ...u, claimed: true } : u))
      );

      const newBal = (parseFloat(balance) + item.amount).toFixed(2);
      setBalance(newBal);

      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "UNSTAKE_CLAIMED" as any,
        amount: `+${item.amount.toFixed(2)}`,
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: address,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      await fetchBalance();

      setHint({
        type: "success",
        msg: `✅ Claimed ${item.amount} tNAK (${blockContext(currentLiveBlock)}). Released to wallet.`,
      });
    } catch (err: any) {
      setHint({ type: "error", msg: `Claim unbonded transaction failed: ${err?.message || "Broadcast error"}` });
    } finally {
      setIsClaimingUnbonded(false);
    }
  }

  async function handleHarvestRewards() {
    if (accruedYield <= 0.0001) {
      setHint({ type: "info", msg: "No accrued PoPC rewards ready to harvest yet." });
      return;
    }
    try {
      setIsHarvesting(true);
      const harvested = accruedYield;
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nak_harvestRewards",
          params: [address, harvested],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "Harvest RPC error");
      }
      const rpcResult = data.result;

      const currentLiveBlock = parseBlockNumber(rpcResult?.blockNumber) ?? (await getLiveBlockNumber());
      const txHash = requireRpcTxHash(data, "Harvest transaction");

      const actualHarvested = rpcResult?.harvestedAmount !== undefined ? rpcResult.harvestedAmount : harvested;
      setAccruedYield(0.0);

      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "REWARD",
        amount: `+${Number(actualHarvested).toFixed(4)}`,
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: address,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      await fetchBalance();
      setHint({
        type: "success",
        msg: `🌾 Harvested +${Number(actualHarvested).toFixed(6)} tNAK (${blockContext(currentLiveBlock)}) across ${rpcResult?.blocksPassed || 1} blocks.`,
      });
    } catch (err: any) {
      setHint({ type: "error", msg: `Harvest transaction failed: ${err?.message || "Broadcast error"}` });
    } finally {
      setIsHarvesting(false);
    }
  }

  async function addNakharaXNetworkToWeb3() {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setHint({ type: "error", msg: "🦊 No Web3 wallet extension detected. Please ensure MetaMask, Rabby, or Coinbase Wallet is installed and unlocked." });
      return;
    }
    const ethereum = (window as any).ethereum;
    try {
      // 1. Request account permission first so MetaMask popup opens reliably
      await ethereum.request({ method: "eth_requestAccounts" });
      const origin = window.location.origin;

      // 2. Add Network via EIP-3085
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x15079", // 86137 in hex
            chainName: "NakharaX L1 Testnet",
            nativeCurrency: {
              name: "NakharaX Token",
              symbol: "tNAK",
              decimals: 18,
            },
            rpcUrls: [NAKHARAX_RPC_URL],
            blockExplorerUrls: [`${origin}/apps/explorer`],
            iconUrls: [`${origin}/icon.png`],
          },
        ],
      });
      setHint({ type: "success", msg: "🎉 NakharaX L1 Testnet (Chain ID 86137) added to your Web3 Wallet successfully!" });
    } catch (err: any) {
      // If already added, attempt switching to it
      if (err.code === 4902 || err.code === -32603 || err.message?.includes("already") || err.message?.includes("switch")) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x15079" }],
          });
          setHint({ type: "success", msg: "🦊 Switched active wallet network to NakharaX L1 Testnet (Chain ID 86137)!" });
          return;
        } catch {
          /* ignore */
        }
      }
      setHint({ type: "error", msg: `MetaMask: ${err.message || "Failed to add network"}` });
    }
  }

  async function addTokenToWeb3(tokenType: "tNAK" | "sNAK") {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setHint({ type: "error", msg: "🦊 No Web3 wallet detected. Please install MetaMask, Rabby, or Coinbase Wallet." });
      return;
    }
    const ethereum = (window as any).ethereum;
    const tokenAddress =
      tokenType === "tNAK"
        ? "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        : "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    try {
      // 1. Request account permission first
      await ethereum.request({ method: "eth_requestAccounts" });
      const origin = window.location.origin;

      // 2. Watch Asset via EIP-747
      const wasAdded = await ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenType,
            decimals: 18,
            image: `${origin}/icon.png`,
          },
        },
      });
      if (wasAdded) {
        setHint({ type: "success", msg: `🪙 $${tokenType} Token successfully imported into your Web3 Wallet!` });
      }
    } catch (err: any) {
      setHint({ type: "error", msg: `MetaMask Token Import: ${err.message || "Action cancelled or failed"}` });
    }
  }

  async function fundConnectedMetaMask() {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setHint({ type: "error", msg: "🦊 No Web3 wallet detected. Please install and unlock MetaMask." });
      return;
    }
    const ethereum = (window as any).ethereum;
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        setHint({ type: "error", msg: "No active account selected in MetaMask." });
        return;
      }
      const targetMetaMaskAddr = accounts[0];
      setHint({ type: "info", msg: `⚡ Airdropping +500.00 $tNAK directly to MetaMask (${targetMetaMaskAddr.slice(0, 8)}...)...` });

      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nakharax_faucet",
          params: [targetMetaMaskAddr, 500],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      const txHash = requireRpcTxHash(data, "MetaMask faucet request");

      const currentLiveBlock = parseBlockNumber(data.result?.blockNumber) ?? (await getLiveBlockNumber());
      const newTx: TxHistoryItem = {
        id: txHash,
        hash: txHash,
        type: "FAUCET",
        amount: "+500.00",
        symbol: "tNAK",
        timestamp: "Just now",
        blockNumber: currentLiveBlock,
        status: currentLiveBlock === null ? "PENDING" : "CONFIRMED",
        to: targetMetaMaskAddr,
      };

      setTxHistory((prev) => [newTx, ...prev]);
      setAddress(targetMetaMaskAddr);
      await fetchBalance(targetMetaMaskAddr);
      setHint({
        type: "success",
        msg: `🎉 Successfully Airdropped +500.00 $tNAK to your MetaMask account (${targetMetaMaskAddr.slice(0, 10)}...)! Sovereign Treasury Valuation synced in real-time.`,
      });
    } catch (err: any) {
      setHint({ type: "error", msg: err.message || "Failed to airdrop to MetaMask." });
    }
  }

  async function handleResetWallet() {
    if (!window.confirm("Reset the active wallet's balance, staking positions, and local transaction list? This cannot be undone.")) {
      return;
    }

    try {
      setIsRefreshing(true);
      const res = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "nak_resetWallet",
          params: [address],
          id: Date.now(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error || data?.result?.success !== true) {
        throw new Error(data?.error?.message || "The node did not confirm the wallet reset.");
      }
      setBalance("0.00");
      setStakedBalance("0.00");
      setEscrowLocked("0.00");
      setAccruedYield(0.0);
      setTxHistory([]);
      setHint({
        type: "info",
        msg: "✨ The node confirmed that this wallet's balance and staking positions were reset to 0.00 tNAK.",
      });
    } catch {
      setHint({ type: "error", msg: "Failed to reset wallet." });
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleVaultCreated(result: VaultCreationResult) {
    setAddress(result.address);
    setPrivateKey(result.privateKey);
    try {
      localStorage.setItem(
        KEY_STORE_LOCAL,
        JSON.stringify({
          address: result.address,
          keystore: result.keystore,
          did: result.did,
          createdAt: result.createdAt,
        })
      );
    } catch {
      /* ignore */
    }
    setHint({
      type: "success",
      msg: `🏛️ Institutional Citadel Vault Created & BIP-39 Seed Verified! Address: ${result.address.slice(0, 10)}...`,
    });
    void fetchBalance(result.address);
  }

  const totalPortfolioValue = (
    parseFloat(balance || "0") +
    parseFloat(stakedBalance || "0") +
    parseFloat(escrowLocked || "0")
  ).toFixed(2);
  const rpcStatusLabel = rpcStatus === "connected" ? "RPC CONNECTED" : rpcStatus === "syncing" ? "SYNCING" : "RPC UNAVAILABLE";
  const rpcStatusClass = rpcStatus === "connected" ? "text-emerald-400" : rpcStatus === "syncing" ? "text-cyan-300" : "text-rose-300";
  const rpcStatusDetail = rpcStatus === "connected"
    ? "Live balance and wallet-state reads are active."
    : rpcStatus === "syncing"
      ? "Syncing wallet state through the RPC gateway."
      : "Wallet RPC is unavailable; balances may be stale.";

  return (
    <div className="space-y-6">
      {/* 🛡️ Sovereign Node Mesh Health & Operator Sentinel Banner */}
      <div className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-4 h-4 shrink-0 ${rpcStatusClass}`} />
          <span className={`font-semibold ${rpcStatusClass}`}>
            NETWORK RPC:
          </span>
          <span className="text-neutral-300 font-mono">
            {rpcStatusDetail}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[11px] font-mono ${rpcStatusClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${rpcStatus === "connected" ? "bg-emerald-400 animate-pulse" : rpcStatus === "syncing" ? "bg-cyan-400 animate-pulse" : "bg-rose-400"}`} />
            {rpcStatusLabel}
          </span>
          <Link
            href="/nodes"
            className="text-neutral-400 hover:text-white underline text-[11px] transition-colors"
          >
            Inspect 3D Node Radar →
          </Link>
        </div>
      </div>

      {/* 👑 Institutional Treasury & Net Worth Overview Strip */}
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-slate-950 via-black to-slate-950 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-4">
            {/* 🪙 Official NakharaX Protocol Token Logo Badge */}
            <div className="relative grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/40 bg-black/70 p-2.5 shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/nakharax-token.svg"
                alt="NakharaX Official Token Logo"
                className="h-full w-full object-contain"
              />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-400">
                <Vault size={14} className="text-emerald-400" />
                <span>Sovereign Treasury Valuation</span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                  L1 Native
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-white">
                  {totalPortfolioValue} <span className="text-emerald-400 text-2xl font-bold">$tNAK</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ≈ ${(parseFloat(totalPortfolioValue) * 0.42).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
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
              onClick={() => setActiveTab("web3")}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold px-4 py-2.5 text-xs font-mono transition-all"
            >
              <span>🦊</span>
              <span>Web3 Wallet Bridge</span>
            </button>

            <button
              type="button"
              onClick={handleResetWallet}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold px-3 py-2.5 text-xs font-mono transition-all"
              title="Reset wallet to 0.00 tNAK (Clean Genesis State)"
            >
              <span>🔄</span>
              <span>Reset 0.00</span>
            </button>

            <button
              type="button"
              onClick={() => void fetchBalance()}
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
              <span className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/nakharax-token.svg" alt="tNAK" className="h-3.5 w-3.5 object-contain" />
                <span>Liquid Gas</span>
              </span>
              <span className="text-emerald-400 font-bold">100% Free</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-white">{balance}</div>
            <div className="text-[10px] font-mono text-emerald-400 mt-0.5">$tNAK Available</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/nakharax-token.svg" alt="sNAK" className="h-3.5 w-3.5 object-contain" />
                <span>Staked Pool</span>
              </span>
              <span className="text-cyan-400 font-bold">8.4% APY</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-cyan-300">{stakedBalance}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">$sNAK Yield Shares</div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3.5">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/nakharax-token.svg" alt="Escrow" className="h-3.5 w-3.5 object-contain" />
                <span>DeAI Escrow</span>
              </span>
              <span className="text-amber-400 font-bold">PoPC Lock</span>
            </div>
            <div className="mt-1.5 text-xl font-mono font-bold text-amber-300">{escrowLocked}</div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">$tNAK in Compute</div>
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
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {[
          { id: "overview", label: "Vault & Keypair", icon: KeyRound },
          { id: "transfer", label: "Instant Transfer", icon: Send },
          { id: "staking", label: "Staking & DeAI Escrow", icon: Layers },
          { id: "web3", label: "🦊 Web3 Wallet Bridge", icon: Wallet },
          { id: "keystore", label: "Security & Cold Storage", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as WalletTab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all ${isActive
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
          className={`rounded-xl border p-3 text-xs font-mono leading-relaxed flex items-center justify-between ${hint.type === "error"
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
                onClick={() => setIsInstitutionalModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-mono font-bold text-emerald-300 transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              >
                <ShieldCheck size={14} className="text-emerald-400" />
                Create Institutional Citadel Vault (12-Word BIP-39)
              </button>
              <button
                type="button"
                onClick={exportKeystore}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-mono text-cyan-300 transition-colors"
              >
                <Download size={13} />
                Export Encrypted Keystore (JSON)
              </button>
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-3.5 py-2 text-xs font-mono text-purple-300 transition-colors cursor-pointer">
                <Upload size={13} />
                Import Keystore (JSON)
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportKeystoreFile}
                />
              </label>
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
                <span className={`text-[10px] font-mono font-bold ${rpcStatusClass}`}>● {rpcStatusLabel}</span>
              </div>

              <div className="mt-4 space-y-2.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Chain ID:</span>
                  <span className="text-white font-bold">86137 (0x15079)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Native RPC:</span>
                  <span className="max-w-[220px] truncate text-cyan-300 font-bold" title={NAKHARAX_RPC_URL}>{NAKHARAX_RPC_URL}</span>
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
                    className={`rounded-xl border p-2.5 text-left font-mono transition-all ${gasPreset === preset.id
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

          {lastReceipt && (
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="truncate mr-2">Receipt Hash: <strong className="text-white">{lastReceipt}</strong></span>
              <Link href="/apps/explorer" className="text-cyan-300 hover:underline shrink-0">Inspect</Link>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Staking & DeAI Escrow Desk */}
      {activeTab === "staking" && (
        <div className="space-y-5">
          {/* Staking Action Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            {[
              { id: "stake", label: "🥩 Stake & Delegate $tNAK" },
              { id: "unstake", label: "🔓 Unstake $sNAK & Cooldown" },
              { id: "validators", label: "🏛️ Active Validators (3)" },
            ].map((subTab) => (
              <button
                key={subTab.id}
                type="button"
                onClick={() => setStakingMode(subTab.id as any)}
                className={`rounded-xl px-3.5 py-2 text-xs font-mono font-semibold transition-all ${stakingMode === subTab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>

          {/* ⚡ REAL-TIME STREAMING POPC REWARDS TICKER BANNER */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 p-5 shadow-[0_15px_40px_rgba(16,185,129,0.15)] backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Live Ticker */}
              <div>
                <div className="flex items-center gap-2 text-[10.5px] font-mono text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="font-bold uppercase tracking-wider">LIVE STREAMING POPC REWARDS</span>
                  <span className="text-slate-500">·</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] text-emerald-300 border border-emerald-500/30">
                    8.40% Net APY
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-white">
                    +{accruedYield.toFixed(6)}
                  </span>
                  <span className="text-emerald-400 font-bold font-mono text-lg">$tNAK</span>
                  <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">
                    (≈ ${(accruedYield * 0.42).toFixed(4)} USD)
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Compounding real-time with continuous PoPC block validation.
                </div>
              </div>

              {/* Center: Projections */}
              <div className="hidden md:grid grid-cols-2 gap-3 text-xs font-mono border-x border-white/10 px-5">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Daily Projected</span>
                  <span className="text-emerald-300 font-bold">
                    +{((parseFloat(stakedBalance || "0") * 0.084) / 365).toFixed(4)} tNAK
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Monthly Projected</span>
                  <span className="text-cyan-300 font-bold">
                    +{(((parseFloat(stakedBalance || "0") * 0.084) / 365) * 30).toFixed(2)} tNAK
                  </span>
                </div>
              </div>

              {/* Right: Harvest Button */}
              <button
                type="button"
                onClick={handleHarvestRewards}
                disabled={isHarvesting || accruedYield <= 0.0001}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold px-4 py-2.5 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isHarvesting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={14} className="fill-slate-950" />
                )}
                <span>Harvest & Claim Rewards</span>
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {/* Mode 1: Stake & Delegate */}
            {stakingMode === "stake" && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-7">
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
                  Stake native $tNAK to mint liquid $sNAK. Accrue daily yield distributed from Proof-of-Practical-Compute (PoPC) validator block rewards.
                </p>

                <form onSubmit={handleStakeDeposit} className="space-y-3.5 pt-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      Delegate to Target Validator
                    </label>
                    <select
                      value={selectedValidator}
                      onChange={(e) => setSelectedValidator(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500/50 focus:outline-none"
                    >
                      <option value="0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb">
                        EU-DE-01 (Frankfurt Genesis L1 · VPS-01) — Genesis Validator
                      </option>
                      <option value="0xca0e4e60f8ce825dbb820c72a7e28e28cdae3326">
                        NA-US-01 (Virginia Genesis Validator 01 · VPS-02) — Genesis Validator
                      </option>
                      <option value="0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb">
                        AP-SG-01 (Singapore Genesis Validator 02 · VPS-03) — Genesis Validator
                      </option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Stake Amount ($tNAK)
                      </label>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        Available: <strong className="text-white">{balance}</strong> tNAK
                      </span>
                    </div>
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
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-4 py-3 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                  >
                    {isStaking ? <RefreshCw size={13} className="animate-spin" /> : <Lock size={13} />}
                    {isStaking ? "Staking in Smart Contract..." : "Stake $tNAK & Mint Liquid $sNAK"}
                  </button>
                </form>
              </div>
            )}

            {/* Mode 2: Unstake & Cooldown */}
            {stakingMode === "unstake" && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <LogOut size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Unstake & Unbonding Cooldown</h3>
                  </div>
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                    300s Testnet Cooldown
                  </span>
                </div>

                <form onSubmit={handleUnstake} className="space-y-3.5 pt-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Unstake Amount ($sNAK)
                      </label>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        Staked: <strong className="text-white">{stakedBalance}</strong> sNAK
                      </span>
                    </div>
                    <input
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="250.0"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3.5 py-2 font-mono text-xs text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUnstaking}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-3 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                  >
                    {isUnstaking ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
                    {isUnstaking ? "Initiating Unbonding..." : "Burn $sNAK & Start 300s Cooldown"}
                  </button>
                </form>

                {/* Unbonding Requests Queue */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Unbonding Requests Queue
                  </div>
                  {unbondingQueue.length === 0 ? (
                    <div className="text-xs text-slate-500 font-mono py-2">No active unbonding requests.</div>
                  ) : (
                    <div className="space-y-2">
                      {unbondingQueue.map((item) => {
                        const isUnlocked = Date.now() >= item.releaseTime;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/50 text-xs font-mono"
                          >
                            <div>
                              <div className="text-white font-bold">{item.amount} $tNAK</div>
                              <div className="text-[10px] text-slate-400">
                                {item.claimed
                                  ? "Claimed & Transferred"
                                  : isUnlocked
                                    ? "🟢 Mature (Ready to claim)"
                                    : "⏳ Cooldown in progress"}
                              </div>
                            </div>
                            {!item.claimed && isUnlocked && (
                              <button
                                type="button"
                                onClick={() => handleClaimUnbonded(item.id)}
                                disabled={isClaimingUnbonded}
                                className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 text-xs font-bold transition-colors"
                              >
                                {isClaimingUnbonded ? "Claiming..." : "Claim $tNAK"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Active Validators List */}
            {stakingMode === "validators" && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-3.5 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Active PoPC Consensus Validators</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">100% Up</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    { name: "EU-DE-01 (Frankfurt Genesis L1 · VPS-01)", addr: "0x26e7...e6cb", stake: "Genesis Validator", comm: "—", uptime: "Live" },
                    { name: "NA-US-01 (Virginia Genesis Validator 01 · VPS-02)", addr: "0xca0e...3326", stake: "Genesis Validator", comm: "—", uptime: "Live" },
                    { name: "AP-SG-01 (Singapore Genesis Validator 02 · VPS-03)", addr: "217.216.39.77:30303", stake: "Genesis Validator", comm: "—", uptime: "Live" },
                  ].map((val, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-white/10 bg-black/50 flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="text-white font-bold">{val.name}</div>
                        <div className="text-slate-500 text-[10.5px]">{val.addr} · Uptime: {val.uptime}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-300 font-bold">{val.stake}</div>
                        <div className="text-[10px] text-slate-400">Commission: {val.comm}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right: DeAI Compute Escrow Collateral */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 space-y-4 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">DeAI Escrow Collateral</h3>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold px-4 py-2.5 text-xs font-mono transition-colors"
              >
                <span>View DeAI Compute Marketplace</span>
                <ChevronRight size={14} />
              </Link>
            </div>
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

      {/* TAB CONTENT: Web3 Wallet Direct Bridge & 1-Click Exporter */}
      {activeTab === "web3" && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🦊</span>
                <h3 className="text-base font-bold text-white">
                  Web3 Direct Wallet Bridge (MetaMask / Rabby / Coinbase)
                </h3>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Add NakharaX L1 Testnet (Chain ID 86137) and export native ERC-20 token contracts with 1-click EIP-3085 & EIP-747 integration.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[10.5px] font-mono font-bold text-emerald-300">
                EIP-3085 & EIP-747 Ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            {/* Action 1: Add Network to Web3 */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 space-y-4 flex flex-col justify-between hover:border-amber-400/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🌐</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/40">
                    Step 1 · Network
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Add NakharaX L1 Network</h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Adds Chain ID <strong className="text-white">86137 (0x15079)</strong> with native currency <strong className="text-white">tNAK</strong> and RPC <code className="text-cyan-300">{NAKHARAX_RPC_URL}</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={addNakharaXNetworkToWeb3}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold px-4 py-2.5 text-xs transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <span>🦊</span>
                <span>Add NakharaX Network</span>
              </button>
            </div>

            {/* Action 2: Add $tNAK Liquid Token */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 space-y-4 flex flex-col justify-between hover:border-emerald-400/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg border border-emerald-500/40 bg-black/80 p-1 flex items-center justify-center shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/nakharax-token.svg" alt="tNAK" className="h-full w-full object-contain" />
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40">
                    Step 2 · Token
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Add $tNAK (Liquid Token)</h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Imports the official <strong className="text-emerald-300">$tNAK</strong> token contract and new vector icon to your MetaMask wallet asset list.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addTokenToWeb3("tNAK")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <span>➕</span>
                <span>Add $tNAK to Wallet</span>
              </button>
            </div>

            {/* Action 3: Add $sNAK Staked Token */}
            <div className="rounded-2xl border border-white/10 bg-black/50 p-5 space-y-4 flex flex-col justify-between hover:border-cyan-400/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg border border-cyan-500/40 bg-black/80 p-1 flex items-center justify-center shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/nakharax-token.svg" alt="sNAK" className="h-full w-full object-contain" />
                  </div>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-500/40">
                    Step 3 · Yield
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">Add $sNAK (Staked Token)</h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Imports the yield-bearing <strong className="text-cyan-300">$sNAK</strong> staking pool share contract (8.40% APY) into your Web3 portfolio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => addTokenToWeb3("sNAK")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2.5 text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
              >
                <span>➕</span>
                <span>Add $sNAK to Wallet</span>
              </button>
            </div>
          </div>

          {/* Quick Balance Sync & Account Import Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick 1: Airdrop funds directly to connected MetaMask */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300">
                  <Droplets size={14} />
                  <span>Option A: Instant MetaMask Airdrop</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Fund Connected MetaMask (+500 $tNAK)</h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mt-1">
                  Click below to transfer 500 testnet $tNAK directly into whichever address is currently selected in your MetaMask extension.
                </p>
              </div>

              <button
                type="button"
                onClick={fundConnectedMetaMask}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 text-xs font-mono transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Zap size={14} />
                <span>Airdrop +500 $tNAK to MetaMask</span>
              </button>
            </div>

            {/* Quick 2: Import Citadel Vault into MetaMask */}
            <div className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-violet-300">
                  <KeyRound size={14} />
                  <span>Option B: Import Dashboard Vault</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Import Dashboard Private Key</h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mt-1">
                  In MetaMask: Click <strong className="text-white">Account Menu ▾ → Add account → Import account</strong> and paste this vault&apos;s Private Key.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(privateKey);
                  setHint({ type: "success", msg: "🔑 Copied Private Key to clipboard! Go to MetaMask -> Import Account and paste it." });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 font-bold px-4 py-2.5 text-xs font-mono transition-all"
              >
                <Copy size={13} />
                <span>Copy Vault Private Key for MetaMask</span>
              </button>
            </div>
          </div>

          {/* Network Parameter Reference Box with 1-Click Copy */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="text-[10.5px] uppercase tracking-wider text-slate-400 font-bold">
                Manual MetaMask / Web3 Network Configuration
              </div>
              <span className="text-[10px] text-emerald-400">Click any field to copy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              {[
                { label: "Network Name", value: "NakharaX L1 Testnet" },
                { label: "RPC URL", value: NAKHARAX_RPC_URL },
                { label: "Chain ID", value: "86137" },
                { label: "Currency Symbol", value: "tNAK" },
                { label: "$tNAK Token Address", value: "0x5FbDB2315678afecb367f032d93F642f64180aa3" },
                { label: "$sNAK Token Address", value: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(item.value);
                    setHint({ type: "info", msg: `📋 Copied ${item.label}: "${item.value}" to clipboard!` });
                  }}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left hover:border-emerald-500/50 hover:bg-white/5 transition-all group"
                >
                  <span className="text-slate-400 text-[10.5px]">{item.label}: <strong className="text-white ml-1">{item.value}</strong></span>
                  <Copy size={12} className="text-slate-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                </button>
              ))}
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
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${tx.type === "FAUCET"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : tx.type === "TRANSFER"
                          ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                          : tx.type === "STAKING_DEPOSIT"
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                            : tx.type === "UNSTAKE_INITIATED"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : tx.type === "UNSTAKE_CLAIMED"
                                ? "bg-teal-500/10 text-teal-300 border border-teal-500/30"
                                : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
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
                  <td className="py-3 px-4 text-slate-400">{tx.blockNumber === null ? "Awaiting inclusion" : `#${tx.blockNumber.toLocaleString()}`}</td>
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

      {/* Institutional Citadel Vault Modal */}
      <InstitutionalVaultModal
        isOpen={isInstitutionalModalOpen}
        onClose={() => setIsInstitutionalModalOpen(false)}
        onVaultCreated={handleVaultCreated}
      />
    </div>
  );
}
