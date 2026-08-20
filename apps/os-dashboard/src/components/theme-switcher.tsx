"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Check, Sparkles, Pause } from "lucide-react";

type Theme = { id: string; name: string; swatch: string; desc: string };

const CURATED_THEMES: Theme[] = [
  {
    id: "aurora",
    name: "Aurora (Default)",
    desc: "Quantum Emerald & Cyan",
    swatch: "linear-gradient(135deg, #29F06A 0%, #22D3EE 50%, #A855F7 100%)",
  },
  {
    id: "ocean",
    name: "Deep Pacific",
    desc: "Institutional Cobalt & Sky",
    swatch: "linear-gradient(135deg, #38BDF8 0%, #3B82F6 50%, #6366F1 100%)",
  },
  {
    id: "emerald",
    name: "Sovereign Mesh",
    desc: "Matrix Emerald & Mint",
    swatch: "linear-gradient(135deg, #10B981 0%, #22C55E 50%, #14B8A6 100%)",
  },
  {
    id: "cyberpunk",
    name: "Cyber Matrix",
    desc: "Neon Cyan & Magenta",
    swatch: "linear-gradient(135deg, #22D3EE 0%, #EC4899 50%, #FACC15 100%)",
  },
  {
    id: "vapor",
    name: "Electric Vapor",
    desc: "Deep Purple & Neon Cyan",
    swatch: "linear-gradient(135deg, #A855F7 0%, #06B6D4 50%, #EC4899 100%)",
  },
  {
    id: "sunset",
    name: "Solar Flare",
    desc: "Warm Twilight & Amber",
    swatch: "linear-gradient(135deg, #FB923C 0%, #F43F5E 50%, #A855F7 100%)",
  },
  {
    id: "gold",
    name: "Prestige Gold",
    desc: "Executive Gold & Amber",
    swatch: "linear-gradient(135deg, #EAB308 0%, #F97316 50%, #D97706 100%)",
  },
  {
    id: "midnight",
    name: "Obsidian Stealth",
    desc: "Ultra Dark Monochrome",
    swatch: "linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #020617 100%)",
  },
];

type Anim = "on" | "off";

const KEY_THEME = "nakharax-theme";
const KEY_ANIM = "nakharax-anim";

function applyTheme(id: string) {
  const html = document.documentElement;
  ["--wp-base-from", "--wp-base-to", "--wp-blob-1", "--wp-blob-2", "--wp-blob-3", "--wp-blob-4"].forEach(
    (v) => html.style.removeProperty(v)
  );
  if (id === "aurora") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", id);
}

function applyAnim(a: Anim) {
  const html = document.documentElement;
  if (a === "off") html.setAttribute("data-anim", "off");
  else html.removeAttribute("data-anim");
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("aurora");
  const [anim, setAnim] = useState<Anim>("on");
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage and enforce Dark Obsidian
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-mode", "dark");
    html.classList.add("dark");
    localStorage.setItem("nakharax-mode", "dark");

    const t = localStorage.getItem(KEY_THEME) || "aurora";
    const a = (localStorage.getItem(KEY_ANIM) as Anim) || "on";
    setActive(t);
    setAnim(a);
    applyAnim(a);
    applyTheme(t);
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectTheme = (id: string) => {
    setActive(id);
    applyTheme(id);
    localStorage.setItem(KEY_THEME, id);
  };

  const toggleAnim = () => {
    const next: Anim = anim === "on" ? "off" : "on";
    setAnim(next);
    applyAnim(next);
    localStorage.setItem(KEY_ANIM, next);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/[0.08] transition-all backdrop-blur-xl"
        aria-label="Plasma Atmosphere Palette"
        title="Atmospheric Color Themes"
      >
        <Palette size={13} className="text-emerald-400" />
        <span className="text-[11px] font-mono font-medium hidden sm:inline">Atmosphere</span>
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-80 rounded-2xl border border-white/20 bg-slate-950/90 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-3xl z-50 animate-scale-in">
          {/* Header & Drift Switch */}
          <div className="flex items-center justify-between mb-3.5 border-b border-white/10 pb-2.5">
            <div>
              <div className="text-[12px] font-bold text-white tracking-wide">
                Plasma Atmosphere
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Curated Refraction Palettes
              </div>
            </div>
            <button
              onClick={toggleAnim}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 px-2.5 py-1 text-[10.5px] font-mono transition-colors"
            >
              {anim === "on" ? <Sparkles size={11} className="text-emerald-400" /> : <Pause size={11} />}
              {anim === "on" ? "Motion: ON" : "Motion: OFF"}
            </button>
          </div>

          {/* 8 Curated Atmosphere Presets */}
          <div className="grid grid-cols-2 gap-2">
            {CURATED_THEMES.map((t) => {
              const isSelected = active === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTheme(t.id)}
                  className={`group relative flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-400/80 bg-emerald-500/10 shadow-[0_0_20px_rgba(41,240,106,0.2)]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]"
                  }`}
                >
                  <div
                    className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-white/20 shadow-sm relative overflow-hidden"
                    style={{ background: t.swatch }}
                  >
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Check size={13} className="text-white drop-shadow" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[11.5px] font-bold truncate ${isSelected ? "text-emerald-300" : "text-white"}`}>
                      {t.name}
                    </div>
                    <div className="text-[9.5px] text-slate-400 truncate">
                      {t.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
