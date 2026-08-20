import type { Config } from "tailwindcss";

/**
 * Nakharax OS — Modern Cybernetic & Frosted Glass Design Tokens.
 *
 * Typography: Plus Jakarta Sans / Inter (Display & Body), JetBrains Mono (Data & Code)
 * Palette: Obsidian Dark #020617 / #0B0B0B, Accent Neon #29F06A / #22D3EE
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#020617",
          card: "#0F172A",
          elev: "#1E293B",
        },
        border: "#334155",
        accent: {
          DEFAULT: "#29F06A",
          dim: "#16A34A",
          ai: "#29F06A",
          chain: "#22D3EE",
          info: "#38BDF8",
          warn: "#FF7A1A",
          danger: "#EF4444",
          ok: "#29F06A",
        },
        obsidian: {
          950: "#020617",
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
        },
        matte: {
          900: "#0F172A",
          800: "#1A1E2F",
          700: "#1E293B",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        display: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderColor: {
        hairline: "rgba(255, 255, 255, 0.08)",
      },
      spacing: {
        "os-0": "0",
        "os-px": "1px",
        "os-0.5": "2px",
        "os-1": "4px",
        "os-2": "6px",
        "os-3": "8px",
        "os-4": "12px",
        "os-5": "16px",
        "os-6": "20px",
        "os-8": "24px",
        "os-10": "32px",
        "os-12": "40px",
        "os-16": "48px",
        "os-section": "32px",
        "os-panel": "16px",
      },
      fontSize: {
        display: ["2rem", { lineHeight: "2.25rem", letterSpacing: "-0.03em", fontWeight: "700" }],
        headline: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.02em", fontWeight: "600" }],
        title: ["1rem", { lineHeight: "1.5rem", letterSpacing: "-0.01em", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.35rem" }],
        caption: ["0.75rem", { lineHeight: "1.1rem" }],
        micro: ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.08em" }],
        overline: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em", fontWeight: "600" }],
      },
      lineHeight: {
        tight: "1.15",
        normal: "1.5",
        relaxed: "1.75",
      },
      borderRadius: {
        "os-sm": "6px",
        "os-md": "8px",
        "os-lg": "12px",
        "os-xl": "16px",
        "os-2xl": "20px",
        "os-3xl": "24px",
      },
      keyframes: {
        "neon-pulse": {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
      },
      animation: {
        "neon-pulse": "neon-pulse 2.5s ease-in-out infinite",
        "fade-in": "fade-in 150ms ease-out both",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
      zIndex: {
        menubar: "40",
        dock: "30",
        window: "20",
        "window-active": "25",
      },
    },
  },
  plugins: [],
};
export default config;
