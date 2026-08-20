"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

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
    <div className="relative overflow-hidden rounded-os-xl border border-white/[0.08] bg-slate-950/80 p-os-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_25px_-5px_rgba(41,240,106,0.15)]">
      {/* Top terminal bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-os-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-medium text-slate-400">
            nakharax-rpc-ingress
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-ai)]">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--accent-ai)]" />
            JSON-RPC 2.0
          </span>
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 rounded-os-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-mono text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            title="Copy command"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
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
      <div className="mt-os-3 flex items-center gap-2 font-mono text-[12px] text-slate-200">
        <span className="select-none font-bold text-[var(--accent-chain)]">$</span>
        <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-emerald-400">curl</span>{" "}
          <span className="text-amber-300">-X POST</span>{" "}
          <span className="text-cyan-300">https://rpc.nakharax.com</span>{" "}
          <span className="text-slate-400">-d</span>{" "}
          <span className="text-violet-300">&apos;&#123;&quot;method&quot;:&quot;system_status&quot;&#125;&apos;</span>
          <span className="inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-emerald-400 ml-1" />
        </div>
      </div>
    </div>
  );
}
