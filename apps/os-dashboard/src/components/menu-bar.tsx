"use client";

import { useEffect, useState } from "react";
import { Activity, Bell, Search } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

/**
 * MenuBar — the persistent top chrome for Nakharax OS.
 *
 * Information architecture (left → right):
 *   brand · menus · right cluster (status, actions, clock)
 */
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
    <div className="fixed top-0 inset-x-0 z-40 h-10 glass border-b">
      <div className="flex h-full items-center px-os-4 text-[11px] text-[var(--text)]">
        {/* Brand */}
        <div className="flex items-center gap-2.5 font-semibold tracking-tight">
          <div className="relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/nakharax-token.svg"
              alt="Nakharax OS"
              className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.28)]"
            />
            <span
              className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse"
              aria-label="Node online"
            />
          </div>
          <span className="text-[var(--text-strong)] font-mono tracking-tight uppercase">Nakharax OS</span>
        </div>

        {/* App menus */}
        <nav className="ml-os-6 flex items-center gap-1 text-[var(--text-muted)]" aria-label="Application menu">
          {["File", "View", "Network", "Help"].map((item) => (
            <button
              key={item}
              type="button"
              className="px-2 py-1 rounded-os-sm hover:bg-[var(--panel-hover)] hover:text-[var(--text-strong)] transition-colors duration-fast"
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Single live status */}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-os-sm border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 text-[10px] font-mono uppercase tracking-wide">
            <Activity size={10} />
            Testnet
          </span>

          <span className="w-px h-4 bg-[var(--hair-strong)] mx-1" aria-hidden="true" />

          <MenuIconButton label="Notifications" icon={<Bell size={13} />} />
          <MenuIconButton label="Spotlight search" icon={<Search size={13} />} />

          <ThemeSwitcher />

          <span className="w-px h-4 bg-[var(--hair-strong)] mx-1" aria-hidden="true" />

          {/* Date · time */}
          <div className="flex items-center gap-2 px-1 text-[11px]">
            <span className="text-[var(--text-muted)] font-mono">{date}</span>
            <span className="font-mono tabular-nums text-[var(--text-strong)] font-medium">
              {time || "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuIconButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="grid h-7 w-7 place-items-center rounded-os-sm hover:bg-[var(--panel-hover)] text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors duration-fast"
    >
      {icon}
    </button>
  );
}
