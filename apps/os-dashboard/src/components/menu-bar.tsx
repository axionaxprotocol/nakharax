"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";

export function MenuBar() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
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
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-40 h-11 border-b border-white/[0.12] bg-slate-950/60 shadow-[0_4px_30px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.2] to-transparent" />
      <div className="flex h-full items-center gap-os-4 px-os-4 text-[11px] text-[var(--text)] sm:px-os-6">
        <Link href="/" className="group flex items-center gap-2 font-semibold">
          <span className="relative grid h-7 w-7 place-items-center rounded-lg border border-white/20 bg-white/[0.06] shadow-[0_0_15px_rgba(41,240,106,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_20px_rgba(41,240,106,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/nakharax-token.svg"
              alt="NakharaX Quantum Hex-Core"
              className="h-5 w-5 object-contain"
            />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-slate-950 bg-[var(--accent-ai)] shadow-[0_0_6px_rgba(41,240,106,0.8)]" />
          </span>
          <span className="hidden font-mono text-[11.5px] font-bold uppercase tracking-[0.18em] text-white group-hover:text-emerald-300 transition-colors sm:inline">
            Nakharax Compute OS
          </span>
          <span className="font-mono text-[11.5px] font-bold uppercase tracking-[0.18em] text-white group-hover:text-emerald-300 transition-colors sm:hidden">
            NakharaX
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 text-[var(--text-muted)] md:flex"
          aria-label="Primary"
        >
          {[
            ["Compute", "/jobs"],
            ["Models", "/activity/models"],
            ["Mesh", "/nodes"],
            ["Vault", "/wallet"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 transition-colors duration-fast hover:bg-[var(--panel-hover)] hover:text-[var(--text-strong)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--accent-ai)] sm:inline-flex">
            <Activity size={11} />
            Local-first DeAI
          </span>

          <span className="hidden h-4 w-px bg-[var(--hair-strong)] sm:block" />

          <ThemeSwitcher />

          <span className="h-4 w-px bg-[var(--hair-strong)]" />

          <div className="hidden items-center gap-2 px-1 text-[11px] sm:flex">
            <span className="font-mono text-[var(--text-muted)]">{date}</span>
            <span className="font-mono font-medium tabular-nums text-[var(--text-strong)]">
              {time || "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
