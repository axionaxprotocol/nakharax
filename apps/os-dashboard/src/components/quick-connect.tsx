"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function QuickConnectBox({
  command = `curl -X POST https://rpc.nakharax.com -d '{"method":"system_status"}'`,
}: {
  command?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard fallback */
    }
  };

  return (
    <div className="relative overflow-hidden rounded-os-2xl border border-white/20 border-t-white/35 bg-white/[0.04] p-os-4 shadow-[0_12px_40px_0_rgba(0,0,0,0.45),inset_0_1px_1.5px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl transition-all duration-300 hover:border-emerald-400/50 hover:bg-white/[0.07] hover:shadow-[0_0_35px_-5px_rgba(41,240,106,0.25)]">
      {/* Top terminal bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-os-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-semibold text-slate-300">
            nakharax-rpc-ingress
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ai)] shadow-[0_0_15px_-2px_rgba(41,240,106,0.3)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--accent-ai)]" />
            JSON-RPC 2.0
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1.5 rounded-os-md border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-mono font-medium text-white transition-all hover:border-white/40 hover:bg-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            title="Copy command"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-300" />
                <span className="text-emerald-300 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="mt-os-3.5 flex items-center gap-2.5 font-mono text-[12.5px] text-slate-100">
        <span className="select-none font-bold text-[var(--accent-chain)] drop-shadow">$</span>
        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-emerald-300 font-semibold">curl</span>{" "}
          <span className="text-amber-300">-X POST</span>{" "}
          <span className="text-cyan-300">https://rpc.nakharax.com</span>{" "}
          <span className="text-slate-300">-d</span>{" "}
          <span className="text-violet-300">&apos;&#123;&quot;method&quot;:&quot;system_status&quot;&#125;&apos;</span>
          <span className="inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-emerald-400 ml-1 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </div>
      </div>
    </div>
  );
}
