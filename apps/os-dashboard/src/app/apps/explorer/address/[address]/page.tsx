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
  Cpu,
  ExternalLink,
  Layers3,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
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

interface ValidatorMeta {
  code: string;
  name: string;
  region: string;
  role: string;
}

const KNOWN_ENTITIES: Record<string, ValidatorMeta> = {
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": {
    code: "LOC-TH-01",
    name: "Localhost Sovereign Rig (Bangkok)",
    region: "Bangkok, TH",
    role: "Local Sovereign Master Live Host & Validator",
  },
  "0x26e714016c6a91b791bb440ca8db6cd7c4d1e6cb": {
    code: "EU-DE-01",
    name: "Frankfurt Genesis Master Ingress",
    region: "Frankfurt, DE",
    role: "Genesis Validator #1 & Public RPC",
  },
  "0x1a99805b71e0530f774e6b69546cd64e03fc3c33": {
    code: "NA-US-01",
    name: "Virginia PyTorch Worker",
    region: "Virginia, US",
    role: "Genesis Validator & DeAI GPU Worker",
  },
  "0x8a6bff3cedc3d1893740f2453424cd8be2965f1c": {
    code: "AP-SG-01",
    name: "Singapore Genesis L1",
    region: "Singapore, SG",
    role: "Genesis Validator #2",
  },
  "0x5d3bd7346255d06dbb130ff22ebdbcb2290a0338": {
    code: "FAUCET-01",
    name: "Sovereign Faucet Treasury",
    region: "Global Mesh",
    role: "Public Faucet Dispenser (100 $tNAK)",
  },
};

interface BlockProduced {
  height: number;
  hash: string;
  timestamp: string;
  reward: string;
}

export default function AddressDetailPage() {
  const params = useParams();
  const rawAddress = Array.isArray(params?.address) ? params.address[0] : params?.address || "";
  const address = rawAddress.toLowerCase();

  const [copied, setCopied] = useState(false);
  const [balanceNak, setBalanceNak] = useState<string>("0.00");
  const [balanceRawWei, setBalanceRawWei] = useState<string>("0x0");
  const [nonce, setNonce] = useState<number>(0);
  const [isValidator, setIsValidator] = useState<boolean>(false);
  const [validatorStats, setValidatorStats] = useState<{
    blocksProduced: number;
    totalRewardsNak: string;
    stakeNak: string;
  } | null>(null);
  const [stakedAmount, setStakedAmount] = useState<string>("0.00");
  const [sNakBalance, setSNakBalance] = useState<string>("0.00");
  const [recentBlocks, setRecentBlocks] = useState<BlockProduced[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rawRpcData, setRawRpcData] = useState<Record<string, any>>({});

  const entity = KNOWN_ENTITIES[address];

  const copyAddress = () => {
    if (!rawAddress) return;
    navigator.clipboard.writeText(rawAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchAddressData = useCallback(async () => {
    if (!address || !address.startsWith("0x") || address.length !== 42) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Fetch native account balance via eth_getBalance
      const balRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBalance",
          params: [rawAddress, "latest"],
          id: 1,
        }),
      });
      const balData = await balRes.json();
      const rawHex = balData.result || "0x0";
      setBalanceRawWei(rawHex);

      try {
        const cleanHex = rawHex.startsWith("0x") ? rawHex.slice(2) : rawHex;
        if (cleanHex && cleanHex !== "0") {
          const weiBigInt = BigInt("0x" + cleanHex);
          const divisor = BigInt(10 ** 18);
          const integerPart = weiBigInt / divisor;
          const remainder = weiBigInt % divisor;
          const decimalPart = remainder.toString().padStart(18, "0").slice(0, 4);
          setBalanceNak(`${integerPart.toLocaleString()}.${decimalPart}`);
        } else {
          setBalanceNak("0.00");
        }
      } catch (e) {
        setBalanceNak("0.00");
      }

      // 2. Fetch Nonce / Transaction Count
      const nonceRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getTransactionCount",
          params: [rawAddress, "latest"],
          id: 2,
        }),
      });
      const nonceData = await nonceRes.json();
      setNonce(nonceData.result ? parseInt(nonceData.result, 16) : 0);

      // 3. Query Active Validators in Staking Module
      const valRes = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "staking_getActiveValidators",
          params: [],
          id: 3,
        }),
      });
      const valData = await valRes.json();
      if (Array.isArray(valData.result)) {
        const found = valData.result.find(
          (v: any) => v.address && v.address.toLowerCase() === address
        );
        if (found) {
          setIsValidator(true);
          let rewStr = "0.00";
          if (found.total_rewards && found.total_rewards !== "0x0") {
            try {
              const rHex = found.total_rewards.startsWith("0x")
                ? found.total_rewards.slice(2)
                : found.total_rewards;
              const rBig = BigInt("0x" + rHex);
              const rInt = rBig / BigInt(10 ** 18);
              rewStr = rInt.toLocaleString();
            } catch {
              rewStr = "0.00";
            }
          }
          setValidatorStats({
            blocksProduced: found.blocks_produced || 0,
            totalRewardsNak: rewStr,
            stakeNak: found.stake && found.stake !== "0x0" ? "Active" : "Bootstrap",
          });
        }
      }

      // 4. Query Citadel Staking Info
      try {
        const stakeRes = await fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "nak_getStakeInfo",
            params: [rawAddress],
            id: 4,
          }),
        });
        const stakeData = await stakeRes.json();
        if (stakeData.result) {
          setStakedAmount(stakeData.result.stakedAmount || "0.00");
          setSNakBalance(stakeData.result.sNakBalance || "0.00");
        }
      } catch {
        /* ignore */
      }

      // 5. Query Recent Blocks to find blocks proposed by this address
      try {
        const bnRes = await fetch("/api/rpc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 5 }),
        });
        const bnData = await bnRes.json();
        if (bnData.result) {
          const cur = parseInt(bnData.result, 16);
          const blockChecks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(async (diff) => {
            const h = cur - diff;
            if (h < 0) return null;
            try {
              const bRes = await fetch("/api/rpc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  method: "eth_getBlockByNumber",
                  params: ["0x" + h.toString(16), false],
                  id: h,
                }),
              });
              const bData = await bRes.json();
              if (bData.result && bData.result.proposer && bData.result.proposer.toLowerCase() === address) {
                return {
                  height: h,
                  hash: bData.result.hash || "0x...",
                  timestamp: bData.result.timestamp
                    ? `${Math.max(0, Math.floor(Date.now() / 1000 - parseInt(bData.result.timestamp, 16)))}s ago`
                    : "Recently",
                  reward: "+2.00 tNAK",
                };
              }
            } catch {
              return null;
            }
            return null;
          });

          const foundBlocks = (await Promise.all(blockChecks)).filter(Boolean) as BlockProduced[];
          setRecentBlocks(foundBlocks);
        }
      } catch {
        /* ignore */
      }

      setRawRpcData({
        address: rawAddress,
        balanceWei: rawHex,
        balanceNak,
        nonce,
        isValidator,
      });
    } catch (e) {
      console.warn("Address fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [address, rawAddress, balanceNak, nonce, isValidator]);

  useEffect(() => {
    void fetchAddressData();
    const interval = setInterval(fetchAddressData, 4000);
    return () => clearInterval(interval);
  }, [fetchAddressData]);

  const isValidAddress = address.startsWith("0x") && address.length === 42;

  return (
    <PageShell
      eyebrow="Sovereign Ledger Account"
      title="Account & Ledger Explorer"
      description="Real-time on-chain balance, consensus validator telemetry, and recent blocks from NakharaX L1 StateDB"
      meta={
        <>
          <StatusPill tone="chain">Chain ID: 86137</StatusPill>
          <StatusPill tone={isValidator ? "violet" : "ai"}>
            {isValidator ? "Active Consensus Validator" : "Standard Account"}
          </StatusPill>
        </>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/apps/explorer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-white/10"
          >
            <ArrowLeft size={13} />
            Back to Explorer
          </Link>
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
          >
            <Coins size={13} />
            Open in Wallet
          </Link>
        </div>
      }
    >
      {!isValidAddress ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="font-mono text-sm font-bold text-red-300">Invalid Ethereum / NakharaX Address Format</p>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            Expected 42-character 0x-prefixed hex string. Provided: &quot;{rawAddress}&quot;
          </p>
          <Link
            href="/apps/explorer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
          >
            Return to Block Explorer
          </Link>
        </Card>
      ) : (
        <>
          {/* Address Hero Banner */}
          <Card className="border-white/10 bg-slate-950/80 p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Address</span>
                  {entity && (
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10.5px] font-bold text-cyan-300">
                      {entity.code} · {entity.name}
                    </span>
                  )}
                  {isValidator && (
                    <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10.5px] font-bold text-violet-300">
                      ⚡ PoPC Consensus Validator
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-white break-all">
                  <span>{rawAddress}</span>
                  <button
                    onClick={copyAddress}
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Copy Address"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                {entity && (
                  <p className="text-xs text-slate-400 font-mono">
                    Role: <strong className="text-slate-200">{entity.role}</strong> ({entity.region})
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-start md:self-center">
                <Link
                  href={`/apps/faucet`}
                  className="rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 px-3.5 py-2 text-xs font-mono text-slate-300 hover:text-white transition-colors"
                >
                  Faucet Claim
                </Link>
                <Link
                  href={`/wallet`}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-mono font-bold text-slate-950 transition-all hover:shadow-[0_0_15px_rgba(41,240,106,0.4)]"
                >
                  Stake $tNAK
                </Link>
              </div>
            </div>
          </Card>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label="Native Balance ($tNAK)"
              value={isLoading ? "Loading..." : `${balanceNak} tNAK`}
              hint="Direct StateDB Balance"
              icon={<Coins size={18} />}
              tone="chain"
            />
            <StatCard
              label="Transaction Nonce"
              value={isLoading ? "..." : nonce.toLocaleString()}
              hint="Outgoing Transactions Count"
              icon={<Activity size={18} />}
              tone="ai"
            />
            <StatCard
              label="Liquid Staked ($sNAK)"
              value={`${sNakBalance} sNAK`}
              hint="8.40% Net APY Yield"
              icon={<TrendingUp size={18} />}
              tone="violet"
            />
            <StatCard
              label="Validator Status"
              value={isValidator ? "Active Proposer" : "Standard Account"}
              hint={isValidator ? `${validatorStats?.totalRewardsNak || "0"} tNAK Rewards` : "Eligible for Staking"}
              icon={<ShieldCheck size={18} />}
              tone={isValidator ? "warn" : "chain"}
            />
          </div>

          {/* 2-Column Details: Validator & Staking Status / Recent Blocks */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Column 1: Account & Staking Telemetry */}
            <div className="space-y-3">
              <SectionHeader
                title="Account Protocol Metrics"
                description="Live balance settlement and cryptographic parameters"
              />

              <Card className="divide-y divide-white/[0.08] border-white/10 bg-slate-950/80 p-0 font-mono text-xs">
                <div className="flex items-center justify-between p-4">
                  <span className="text-slate-400">Total Liquid Balance:</span>
                  <span className="font-bold text-white">{balanceNak} $tNAK</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-slate-400">Raw Wei (18 decimals):</span>
                  <span className="text-emerald-300 text-[11px] truncate ml-4" title={balanceRawWei}>
                    {balanceRawWei}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-slate-400">Active Delegations:</span>
                  <span className="text-slate-200">{stakedAmount} $tNAK</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-slate-400">Consensus Role:</span>
                  <span className="font-bold text-violet-300">
                    {isValidator ? "PoPC BFT Consensus Proposer" : "Community Participant / Staker"}
                  </span>
                </div>
                {isValidator && validatorStats && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-violet-500/5">
                      <span className="text-violet-300">Total Rewards Earned:</span>
                      <span className="font-bold text-emerald-400">+{validatorStats.totalRewardsNak} $tNAK</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-violet-500/5">
                      <span className="text-violet-300">Block Reward Rate:</span>
                      <span className="font-bold text-white">2.00 $tNAK / block</span>
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Column 2: Blocks Produced or Activity */}
            <div className="space-y-3">
              <SectionHeader
                title={isValidator ? "Recent Blocks Produced" : "Ledger Activity"}
                description={
                  isValidator
                    ? "Blocks proposed and credited to this validator on the live mesh"
                    : "Recent on-chain interactions and state transitions"
                }
              />

              {isValidator ? (
                <div className="space-y-2.5">
                  {recentBlocks.length === 0 ? (
                    <Card className="border-white/10 bg-slate-950/80 p-5 text-center font-mono text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">Checking Live Block Stream...</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        This validator is registered and receiving block rewards (+2.0 $tNAK). Blocks produced in current round-robin cadence will appear here.
                      </p>
                    </Card>
                  ) : (
                    recentBlocks.map((b) => (
                      <Card
                        key={b.height}
                        className="flex items-center justify-between border-white/10 bg-slate-950/80 p-3.5 font-mono text-xs transition-all hover:border-emerald-500/30"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-bold text-cyan-300">
                            #{b.height.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400">{b.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                            {b.hash.slice(0, 14)}...
                          </span>
                          <span className="font-bold text-emerald-400">{b.reward}</span>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                <Card className="border-white/10 bg-slate-950/80 p-6 text-center font-mono text-xs text-slate-400 space-y-3">
                  <p className="font-semibold text-slate-200">Standard Account</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-md mx-auto">
                    This address has not produced blocks as a validator. To participate in PoPC consensus and earn block rewards, run a node with <code className="text-emerald-400">--role validator</code> or stake $tNAK to earn 8.40% APY.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/wallet"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Coins size={14} />
                      Stake in Citadel
                    </Link>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
