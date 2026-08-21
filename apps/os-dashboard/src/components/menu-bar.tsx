"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Cpu, Layers, Wallet } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Compute Jobs" },
  { href: "/activity/models", label: "Models" },
  { href: "/nodes", label: "Node Mesh" },
  { href: "/apps", label: "Microservices" },
  { href: "/wallet", label: "Wallet & Vault" },
  { href: "/activity", label: "Telemetry" },
];

export function MenuBar() {
  const pathname = usePathname();
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setDate(
        now.toLocaleDateString([], {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-white/[0.12] bg-slate-950/70 shadow-[0_4px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
      {/* Specular glass reflection line */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.2] to-transparent" />

      <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity Lockup */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-3 font-semibold">
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
                DEAI OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary Navigation"
          >
            {NAV_LINKS.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                    active
                      ? "bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-xl"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Telemetry status, Palette, Time, CTA */}
        <div className="flex items-center gap-3">
          {/* PoPC Live Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-mono backdrop-blur-xl">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(41,240,106,0.8)]" />
            <span className="text-slate-300 font-medium">PoPC Live</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-300 font-semibold">Chain 86137</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-white/10" />

          {/* Atmospheric Lighting Picker */}
          <ThemeSwitcher />

          <div className="hidden sm:block h-4 w-px bg-white/10" />

          {/* Live UTC System Clock */}
          <div className="hidden md:flex flex-col text-right font-mono leading-tight">
            <span className="text-[11px] font-bold text-white tabular-nums">
              {time || "--:--:--"}
            </span>
            <span className="text-[9.5px] text-slate-400">
              {date}
            </span>
          </div>

          {/* Wallet / Key Vault Pill */}
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 text-xs font-mono font-semibold text-cyan-300 transition-all hover:shadow-[0_0_12px_rgba(34,211,238,0.25)]"
          >
            <Wallet size={13} />
            <span className="hidden sm:inline">Wallet</span>
          </Link>

          {/* Action CTA */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all hover:shadow-[0_0_15px_rgba(41,240,106,0.4)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Run Jobs</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  );
}
