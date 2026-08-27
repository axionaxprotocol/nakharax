"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NakharaX Web OS Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <AlertTriangle size={38} className="animate-pulse" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-rose-300 mb-3">
        System Runtime Exception
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Autonomous Kernel Interrupted
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        {error.message || "An unexpected error occurred while executing the on-chain microservice state transition."}
      </p>

      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)]"
        >
          <RefreshCw size={14} />
          Retry Autonomous Execution
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 text-xs font-mono transition-colors"
        >
          <ArrowLeft size={14} />
          Return to Command Center
        </Link>
      </div>
    </div>
  );
}
