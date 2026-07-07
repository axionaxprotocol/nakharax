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
    <div className="fixed inset-x-0 top-0 z-40 h-11 border-b border-[var(--hair)] bg-[var(--chrome)] shadow-[var(--shadow-chrome)] backdrop-blur-xl">
      <div className="flex h-full items-center gap-os-4 px-os-4 text-[11px] text-[var(--text)] sm:px-os-6">
        <Link href="/" className="flex items-center gap-os-2 font-semibold">
          <span className="relative grid h-7 w-7 place-items-center rounded-os-lg border border-emerald-500/20 bg-emerald-500/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/nakharax-token.svg"
              alt=""
              className="h-4.5 w-4.5 object-contain"
            />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[var(--panel)] bg-emerald-500" />
          </span>
          <span className="hidden font-mono uppercase tracking-[0.16em] text-[var(--text-strong)] sm:inline">
            Nakharax Compute OS
          </span>
          <span className="font-mono uppercase tracking-[0.16em] text-[var(--text-strong)] sm:hidden">
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
