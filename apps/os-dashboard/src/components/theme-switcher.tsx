"use client";

import { useEffect, useRef, useState } from "react";
import { Palette, Check, Sparkles, Pause } from "lucide-react";

type Theme = { id: string; name: string; swatch: string };

const THEMES: Theme[] = [
  { id: "aurora", name: "Aurora", swatch: "linear-gradient(135deg, #5eead4 0%, #6366f1 50%, #ec4899 100%)" },
  { id: "midnight", name: "Midnight", swatch: "linear-gradient(135deg, #1f2937 0%, #0f172a 50%, #020617 100%)" },
  { id: "ocean", name: "Ocean", swatch: "linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #22d3ee 100%)" },
  { id: "forest", name: "Forest", swatch: "linear-gradient(135deg, #22c55e 0%, #10b981 50%, #14b8a6 100%)" },
  { id: "cyberpunk", name: "Cyberpunk", swatch: "linear-gradient(135deg, #ec4899 0%, #22d3ee 50%, #facc15 100%)" },
  { id: "sunset", name: "Sunset", swatch: "linear-gradient(135deg, #fb923c 0%, #f43f5e 50%, #a855f7 100%)" },
  { id: "rose", name: "Rose", swatch: "linear-gradient(135deg, #f472b6 0%, #ec4899 50%, #a855f7 100%)" },
  { id: "pastel", name: "Pastel", swatch: "linear-gradient(135deg, #c4b5fd 0%, #fcd3c4 50%, #a5f3fc 100%)" },
];

type Anim = "on" | "off";

type CustomColors = {
  base: string;
  blob1: string;
  blob2: string;
  blob3: string;
  blob4: string;
};

const KEY_THEME = "nakharax-theme";
const KEY_ANIM = "nakharax-anim";
const KEY_CUSTOM = "nakharax-custom";

const DEFAULT_CUSTOM: CustomColors = {
  base: "#020617",
  blob1: "#29F06A",
  blob2: "#22D3EE",
  blob3: "#A855F7",
  blob4: "#FF7A1A",
};

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m || m.length < 3) return `rgba(0,0,0,${alpha})`;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyTheme(id: string) {
  const html = document.documentElement;
  ["--wp-base-from", "--wp-base-to", "--wp-blob-1", "--wp-blob-2", "--wp-blob-3", "--wp-blob-4"].forEach(
    (v) => html.style.removeProperty(v)
  );
  if (id === "aurora") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", id);
}

function applyCustom(c: CustomColors) {
  const html = document.documentElement;
  html.setAttribute("data-theme", "custom");
  html.style.setProperty("--wp-base-from", c.base);
  html.style.setProperty("--wp-base-to", c.base);
  html.style.setProperty("--wp-blob-1", hexToRgba(c.blob1, 0.22));
  html.style.setProperty("--wp-blob-2", hexToRgba(c.blob2, 0.22));
  html.style.setProperty("--wp-blob-3", hexToRgba(c.blob3, 0.2));
  html.style.setProperty("--wp-blob-4", hexToRgba(c.blob4, 0.2));
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
  const [custom, setCustom] = useState<CustomColors>(DEFAULT_CUSTOM);
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage and ensure Pure Dark Obsidian Theme
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-mode", "dark");
    html.classList.add("dark");
    localStorage.setItem("nakharax-mode", "dark");

    const t = localStorage.getItem(KEY_THEME) || "aurora";
    const a = (localStorage.getItem(KEY_ANIM) as Anim) || "on";
    const cRaw = localStorage.getItem(KEY_CUSTOM);
    setActive(t);
    setAnim(a);
    applyAnim(a);
    if (t === "custom" && cRaw) {
      try {
        const c = JSON.parse(cRaw) as CustomColors;
        setCustom(c);
        applyCustom(c);
        return;
      } catch {
        /* fallthrough */
      }
    }
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
    setShowCustom(false);
  };

  const toggleAnim = () => {
    const next: Anim = anim === "on" ? "off" : "on";
    setAnim(next);
    applyAnim(next);
    localStorage.setItem(KEY_ANIM, next);
  };

  const updateCustom = (patch: Partial<CustomColors>) => {
    const next = { ...custom, ...patch };
    setCustom(next);
    applyCustom(next);
    setActive("custom");
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(next));
    localStorage.setItem(KEY_THEME, "custom");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
        aria-label="Wallpaper Atmosphere"
        title="Atmospheric Lighting"
      >
        <Palette size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 w-72 rounded-2xl border border-white/15 bg-slate-950/85 p-3.5 shadow-2xl backdrop-blur-3xl">
          {/* Header & Animation toggle */}
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300">
              Plasma Auras
            </span>
            <button
              onClick={toggleAnim}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 text-[11px] font-mono transition-colors"
            >
              {anim === "on" ? <Sparkles size={12} className="text-emerald-400" /> : <Pause size={12} />}
              {anim === "on" ? "Drift: ON" : "Drift: OFF"}
            </button>
          </div>

          {/* Wallpaper presets */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTheme(t.id)}
                title={t.name}
                className="group relative aspect-square rounded-xl ring-1 ring-white/15 overflow-hidden transition-all hover:scale-105 hover:ring-emerald-400"
              >
                <div className="absolute inset-0" style={{ background: t.swatch }} />
                {active === t.id && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Check size={14} className="text-white drop-shadow" />
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm text-[9px] text-center text-white py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.name}
                </span>
              </button>
            ))}
          </div>

          {/* Custom color picker toggle */}
          <button
            onClick={() => setShowCustom((v) => !v)}
            className="w-full text-center text-[11px] font-mono text-emerald-400 hover:text-emerald-300 py-1 rounded border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
          >
            {showCustom ? "Close Custom Palette" : "Customize Light Spectrum"}
          </button>

          {showCustom && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <ColorRow label="Background" value={custom.base} onChange={(v) => updateCustom({ base: v })} />
              <ColorRow label="Aura 1 (Green)" value={custom.blob1} onChange={(v) => updateCustom({ blob1: v })} />
              <ColorRow label="Aura 2 (Cyan)" value={custom.blob2} onChange={(v) => updateCustom({ blob2: v })} />
              <ColorRow label="Aura 3 (Purple)" value={custom.blob3} onChange={(v) => updateCustom({ blob3: v })} />
              <ColorRow label="Aura 4 (Orange)" value={custom.blob4} onChange={(v) => updateCustom({ blob4: v })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between text-xs font-mono">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 rounded border-0 bg-transparent cursor-pointer"
        />
        <span className="text-slate-300 uppercase text-[10px]">{value}</span>
      </div>
    </div>
  );
}
