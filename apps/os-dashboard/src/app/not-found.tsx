import Link from "next/link";
import { ArrowLeft, Compass, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl text-emerald-400 shadow-[0_0_30px_rgba(41,240,106,0.2)]">
          <Compass size={38} className="animate-spin-slow" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-rose-300 mb-3">
        <ShieldAlert size={12} />
        404 — Node Module Not Found
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Autonomous Coordinate Unreachable
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        The requested microservice route or on-chain module does not exist on the Nakharax testnet network.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 text-xs font-mono transition-all hover:shadow-[0_0_20px_rgba(41,240,106,0.3)]"
        >
          <ArrowLeft size={14} />
          Return to Command Center
        </Link>
        <Link
          href="/apps"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold px-5 py-2.5 text-xs font-mono transition-colors"
        >
          Browse All 10 Microservices
        </Link>
      </div>
    </div>
  );
}
