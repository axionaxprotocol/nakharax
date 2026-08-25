import "./globals.css";
import type { Metadata, Viewport } from "next";
import { MenuBar } from "@/components/menu-bar";
import { FloatingSentinelChat } from "@/components/floating-sentinel-chat";

export const metadata: Metadata = {
  title: {
    default: "Nakharax Protocol Portal",
    template: "%s · Nakharax Protocol Portal",
  },
  description:
    "Sovereign DeAI compute portal for self-owned nodes, affordable inference, and verifiable workloads.",
  applicationName: "Nakharax Protocol Portal",
  openGraph: {
    title: "Nakharax Protocol Portal",
    description:
      "Sovereign DeAI compute console for Nakharax nodes, workers, jobs, and wallet operations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nakharax Protocol Portal",
    description:
      "Sovereign DeAI compute console for Nakharax nodes, workers, jobs, and wallet operations.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-mode="dark" className="dark">
      <body className="font-sans antialiased text-[var(--text)] bg-[var(--canvas)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-os-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          Skip to content
        </a>
        {/* Luminous Ambient Plasma Orbs for True Frosted Glass Refraction */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-2] overflow-hidden">
          <div className="absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-[130px] animate-pulse" />
          <div className="absolute right-[-10%] top-1/4 h-[620px] w-[620px] rounded-full bg-cyan-500/18 blur-[150px]" />
          <div className="absolute left-1/4 bottom-10 h-[560px] w-[560px] rounded-full bg-violet-600/15 blur-[140px]" />
          <div className="absolute right-1/3 -top-20 h-[480px] w-[480px] rounded-full bg-amber-500/12 blur-[120px]" />
        </div>
        <div
          aria-hidden="true"
          className="protocol-grid pointer-events-none fixed inset-0 z-[-1] opacity-45"
        />
        <MenuBar />
        <main
          id="main-content"
          className="min-h-screen pb-14 pt-16 sm:pt-20"
          tabIndex={-1}
        >
          <div className="mx-auto max-w-[1450px] px-4 py-2 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
        {/* Global Floating DeAI Sentinel & NOESIS-VX Assistant */}
        <FloatingSentinelChat />
      </body>
    </html>
  );
}
