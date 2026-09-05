"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Cpu, Globe2, Layers, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

const BOTTOM_ITEMS = [
  { href: "/", label: "Overview", icon: Activity },
  { href: "/jobs", label: "Compute", icon: Cpu },
  { href: "/nodes", label: "Nodes", icon: Globe2 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/apps", label: "Apps", icon: Layers },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.12] bg-slate-950/90 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] backdrop-blur-2xl pb-[max(env(safe-area-inset-bottom),0.35rem)]"
    >
      {/* Specular top-edge refraction highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="grid grid-cols-5 items-center justify-around px-2 py-1.5">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : href === "/apps"
              ? pathname === "/apps" || pathname?.startsWith("/apps/")
              : pathname === href || pathname?.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200",
                isActive
                  ? "text-emerald-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {/* Active luminous indicator background pill */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1.5 inset-y-1 -z-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                />
              )}

              <span className="relative">
                <Icon
                  size={19}
                  className={cn(
                    "transition-transform duration-200 group-active:scale-90",
                    isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {isActive && (
                  <span className="absolute -top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(41,240,106,0.9)] animate-pulse" />
                )}
              </span>

              <span className="mt-1 text-[10.5px] font-mono tracking-tight leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
