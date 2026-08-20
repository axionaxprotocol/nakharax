import "./globals.css";
import type { Metadata, Viewport } from "next";
import { MenuBar } from "@/components/menu-bar";
import { Dock } from "@/components/dock";

export const metadata: Metadata = {
  title: {
    default: "Nakharax OS",
    template: "%s · Nakharax OS",
  },
  description:
    "Local-first DeAI compute OS for self-owned nodes, affordable inference, and sovereign workloads.",
  applicationName: "Nakharax OS",
  openGraph: {
    title: "Nakharax OS",
    description:
      "Self-owned DeAI compute console for Nakharax nodes, workers, jobs, and wallet operations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nakharax OS",
    description:
      "Self-owned DeAI compute console for Nakharax nodes, workers, jobs, and wallet operations.",
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
        <div
          aria-hidden="true"
          className="protocol-grid pointer-events-none fixed inset-x-0 top-10 z-[-1] h-[520px] opacity-70"
        />
        <MenuBar />
        <main
          id="main-content"
          className="min-h-screen pb-32 pt-14"
          tabIndex={-1}
        >
          <div className="mx-auto max-w-[1500px] px-os-4 py-os-5 sm:px-os-6 lg:px-os-8">
            {children}
          </div>
        </main>
        <Dock />
      </body>
    </html>
  );
}
