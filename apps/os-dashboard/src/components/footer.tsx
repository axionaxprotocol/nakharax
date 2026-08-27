import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Brain,
  Briefcase,
  Cpu,
  Droplets,
  ExternalLink,
  Github,
  Globe2,
  HardDrive,
  Lock,
  RadioTower,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-white/[0.10] bg-slate-950/80 backdrop-blur-3xl text-slate-400">
      {/* Specular top border highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="mx-auto max-w-[1450px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-white/[0.08]">
          {/* Col 1 & 2: Brand Lockup & Ecosystem Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/[0.06] shadow-[0_0_15px_rgba(41,240,106,0.3)] backdrop-blur-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/nakharax-token.svg"
                  alt="NakharaX Core"
                  className="h-5 w-5 object-contain"
                />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-slate-950 bg-emerald-400 shadow-[0_0_6px_rgba(41,240,106,0.8)]" />
              </span>
              <div>
                <span className="font-sans text-base font-extrabold tracking-tight text-white">
                  NAKHARAX PROTOCOL
                </span>
                <span className="ml-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  CIVILIZATION OS
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Sovereign Layer-1 DeAI Compute Grid & DePIN Infrastructure Network. Verifiable execution via Proof of Practical Compute (PoPC) and decentralized edge worker routing.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Chain ID 86137 (Live)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-cyan-300">
                <Zap size={11} />
                Ingress P50: 1.92ms
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-violet-300">
                <ShieldCheck size={11} />
                PoPC Fast Finality
              </span>
            </div>
          </div>

          {/* Col 3: Protocol & DeAI Compute */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Brain size={13} className="text-emerald-400" />
              DeAI Ecosystem
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/jobs" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Compute Marketplace</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/activity/models" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Model Registry</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/sentinel" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>NOESIS-VX AI Assistant</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/lora" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>LoRA Hub & Adapter Fusion</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/agents" className="hover:text-emerald-300 transition-colors flex items-center justify-between group">
                  <span>Sovereign Agent Fleet</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: DePIN & Node Mesh */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Server size={13} className="text-cyan-400" />
              DePIN & Nodes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/nodes" className="hover:text-cyan-300 transition-colors flex items-center justify-between group">
                  <span>Node Mesh & Topology</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/worker" className="hover:text-cyan-300 transition-colors flex items-center justify-between group">
                  <span>Worker CLI Daemon</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/explorer" className="hover:text-cyan-300 transition-colors flex items-center justify-between group">
                  <span>Block Explorer</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/logs" className="hover:text-slate-200 transition-colors flex items-center justify-between group">
                  <span>Realtime Log Streams</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-slate-200 transition-colors flex items-center justify-between group">
                  <span>Core Node Settings</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Tools & Key Vault */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Wallet size={13} className="text-amber-400" />
              Tools & Vault
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/wallet" className="hover:text-amber-300 transition-colors flex items-center justify-between group">
                  <span>Key Vault & Vesting</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/faucet" className="hover:text-amber-300 transition-colors flex items-center justify-between group">
                  <span>Testnet Faucet (1,000 $NAKt)</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <Link href="/apps/mcp" className="hover:text-violet-300 transition-colors flex items-center justify-between group">
                  <span>MCP Universal Skills</span>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
              <li>
                <a
                  href="https://nakharax.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center justify-between group"
                >
                  <span>Protocol Portal</span>
                  <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/axionaxprotocol/nakharax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Compliance Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 NakharaX Protocol. All rights reserved.</span>
            <span className="hidden sm:inline">·</span>
            <span className="text-slate-400">Pure Non-Custodial Layer-1 & DePIN Infrastructure.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={13} />
              <span>100% Safe Memory (0 Unsafe Blocks)</span>
            </span>
            <span>·</span>
            <span className="text-slate-400">PoPC Consensus Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
