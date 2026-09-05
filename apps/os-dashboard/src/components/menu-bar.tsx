"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  Cpu,
  Globe2,
  Layers,
  Menu,
  Radio,
  ShieldCheck,
  Vote,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { useLiveBlock } from "@/lib/use-live-block";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Compute" },
  { href: "/nodes", label: "Nodes" },
  { href: "/wallet", label: "Wallet" },
  { href: "/apps/governance", label: "Governance" },
  { href: "/apps", label: "Apps" },
  { href: "/activity", label: "Telemetry" },
];

const MOBILE_EXPANDED_LINKS = [
  { href: "/", label: "Overview", icon: Activity, desc: "Network HUD & command matrix" },
  { href: "/jobs", label: "Compute Marketplace", icon: Cpu, desc: "ASR VRF worker dispatch & jobs" },
  { href: "/nodes", label: "Node Radar & P2P Mesh", icon: Globe2, desc: "BFT quorum & genesis nodes" },
  { href: "/wallet", label: "Citadel Vault & Staking", icon: Wallet, desc: "Liquid $sNAK 8.40% APY" },
  { href: "/apps/governance", label: "DAO Governance", icon: Vote, desc: "Voting & protocol proposals" },
  { href: "/apps/sentinel", label: "NOESIS-VX AI Sentinel", icon: Brain, desc: "Autonomous AI risk brain" },
  { href: "/apps/faucet", label: "Testnet Faucet", icon: Zap, desc: "Claim +100 $tNAK gas" },
  { href: "/apps/explorer", label: "Block Explorer", icon: Layers, desc: "Blocks, txs, & STARK FRI ZKP" },
  { href: "/apps", label: "All Ecosystem Modules", icon: Layers, desc: "Complete civilization OS suite" },
];

export function MenuBar() {
  const pathname = usePathname();
  const { blockNumber, isLive } = useLiveBlock();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setConnectedAccount(accounts[0]);
          }
        })
        .catch(() => {});

      const handleAccounts = (accounts: string[]) => {
        setConnectedAccount(accounts.length > 0 ? accounts[0] : null);
      };

      ethereum.on("accountsChanged", handleAccounts);
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener("accountsChanged", handleAccounts);
        }
      };
    }
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-white/[0.12] bg-slate-950/80 shadow-[0_4px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        {/* Specular glass reflection line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Left: Brand Identity Lockup */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="group flex items-center gap-2.5 font-semibold">
              <span className="relative grid h-8 w-8 place-items-center rounded-xl border border-white/20 bg-white/[0.06] shadow-[0_0_15px_rgba(41,240,106,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_20px_rgba(41,240,106,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/nakharax-token.svg"
                  alt="NakharaX Quantum Hex-Core"
                  className="h-5 w-5 object-contain"
                />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-slate-950 bg-[var(--accent-ai)] shadow-[0_0_6px_rgba(41,240,106,0.8)]" />
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-sans text-[14px] sm:text-[14.5px] font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  NAKHARAX
                </span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] sm:text-[9.5px] font-mono font-bold tracking-wider text-emerald-300 uppercase">
                  PORTAL
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Primary Navigation"
            >
              {NAV_LINKS.map(({ href, label }) => {
                const active =
                  href === "/"
                    ? pathname === "/"
                    : href === "/apps"
                    ? pathname === "/apps"
                    : href === "/activity"
                    ? pathname === "/activity" ||
                      (pathname?.startsWith("/activity/") &&
                        !pathname?.startsWith("/activity/models"))
                    : pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                      active
                        ? "bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-xl font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Clean Action Cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time PoPC Live Pill (Desktop) */}
            <Link
              href="/apps/explorer"
              className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-mono backdrop-blur-xl transition-all hover:bg-white/10 hover:border-emerald-500/40"
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shadow-[0_0_6px_rgba(41,240,106,0.8)]",
                  isLive ? "animate-pulse bg-emerald-400" : "bg-amber-400"
                )}
              />
              <span className="text-slate-300 font-medium">PoPC Live</span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-300 font-semibold">Chain 86137</span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400 font-bold">#{blockNumber.toLocaleString()}</span>
            </Link>

            {/* Atmospheric Lighting Picker */}
            <ThemeSwitcher />

            {/* Wallet Connector Button */}
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-mono font-semibold transition-all backdrop-blur-xl",
                connectedAccount
                  ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] hover:border-cyan-400/50"
              )}
            >
              <Wallet size={13} className={connectedAccount ? "text-emerald-400" : "text-cyan-400"} />
              <span className="hidden xs:inline">
                {connectedAccount
                  ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`
                  : "Connect"}
              </span>
              <span className="xs:hidden">
                {connectedAccount ? `${connectedAccount.slice(0, 4)}..` : "Wallet"}
              </span>
            </button>

            {/* Action CTA (Desktop) */}
            <Link
              href="/jobs"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_15px_rgba(41,240,106,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Run Jobs</span>
              <ArrowUpRight size={13} />
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen((prev) => !prev)}
              aria-label={isMobileDrawerOpen ? "Close mobile menu" : "Open mobile menu"}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/10 md:hidden transition-all active:scale-95"
            >
              {isMobileDrawerOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE CYBER-HUD SLIDE-OUT DRAWER OVERLAY
          ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 top-14 z-30 flex flex-col bg-slate-950/95 backdrop-blur-3xl md:hidden animate-fade-in overflow-y-auto">
          {/* Glowing Atmospheric Backlight */}
          <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full bg-emerald-500/15 blur-[80px]" />

          <div className="flex-1 space-y-4 p-4 pb-28">
            {/* Live PoPC Network HUD Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shadow-[0_0_6px_rgba(41,240,106,0.8)]",
                      isLive ? "animate-pulse bg-emerald-400" : "bg-amber-400"
                    )}
                  />
                  <span className="font-bold text-white">PoPC Mesh Live</span>
                </div>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Chain 86137
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-emerald-500/20 pt-2">
                <span>Consensus Tip:</span>
                <strong className="text-cyan-300 font-mono font-bold">
                  #{blockNumber.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Mobile Navigation List */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-slate-400 px-1 font-semibold">
                Sovereign OS Navigation
              </div>
              {MOBILE_EXPANDED_LINKS.map(({ href, label, icon: Icon, desc }) => {
                const isActive =
                  href === "/"
                    ? pathname === "/"
                    : href === "/apps"
                    ? pathname === "/apps"
                    : pathname === href || pathname?.startsWith(`${href}/`);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-2.5 transition-all duration-200 border",
                      isActive
                        ? "border-emerald-500/40 bg-emerald-500/10 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                        : "border-white/[0.06] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:border-white/15"
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg border",
                        isActive
                          ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                          : "border-white/10 bg-white/5 text-slate-400"
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white tracking-tight">{label}</span>
                        {isActive && (
                          <span className="text-[9px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-400 truncate">{desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Action Matrix in Drawer */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                href="/jobs"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 p-3 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(41,240,106,0.3)] active:scale-95 transition-all"
              >
                <span>Run Jobs</span>
                <ArrowUpRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  setIsWalletModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs font-mono font-bold text-cyan-300 active:scale-95 transition-all"
              >
                <Wallet size={14} />
                <span>{connectedAccount ? "Account" : "Connect"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
