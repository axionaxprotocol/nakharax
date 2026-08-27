"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Cpu, Layers, Wallet } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { useLiveBlock } from "@/lib/use-live-block";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Compute" },
  { href: "/activity/models", label: "Models" },
  { href: "/nodes", label: "Nodes" },
  { href: "/apps", label: "Apps" },
  { href: "/activity", label: "Telemetry" },
];

export function MenuBar() {
  const pathname = usePathname();
  const { blockNumber, isLive } = useLiveBlock();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);

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
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-white/[0.12] bg-slate-950/75 shadow-[0_4px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        {/* Specular glass reflection line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.2] to-transparent" />

        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Identity Lockup */}
          <div className="flex items-center gap-6">
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
              <div className="flex items-center gap-2">
                <span className="font-sans text-[14.5px] font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  NAKHARAX
                </span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-mono font-bold tracking-wider text-emerald-300 uppercase">
                  PORTAL
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Primary Navigation"
            >
              {NAV_LINKS.map(({ href, label }) => {
                const active =
                  href === "/"
                    ? pathname === "/"
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
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Real-time PoPC Live Pill */}
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
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold transition-all backdrop-blur-xl",
                connectedAccount
                  ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.25)] hover:border-cyan-400/50"
              )}
            >
              <Wallet size={13} className={connectedAccount ? "text-emerald-400" : "text-cyan-400"} />
              <span>
                {connectedAccount
                  ? `${connectedAccount.slice(0, 6)}...${connectedAccount.slice(-4)}`
                  : "Connect"}
              </span>
            </button>

            {/* Action CTA */}
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_15px_rgba(41,240,106,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Run Jobs</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Global Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
