"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Root Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-rose-400 mb-2">Critical System Halt</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          {error.message || "An unrecoverable system exception occurred."}
        </p>
        <button
          onClick={() => reset()}
          type="button"
          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 text-xs font-mono transition-colors"
        >
          Re-initialize Root Kernel
        </button>
      </body>
    </html>
  );
}
