import Link from "next/link";
import { ArrowLeft, Skull } from "lucide-react";

import {
  IconBadge,
  PageShell,
  StatusPill,
} from "@/components/card";
import { OErrorBoundary } from "@/components/error-boundary";
import { PropsentinelClient } from "@/components/propsentinel/dashboard-client";
import { fetchPropsentinelDashboard } from "@/lib/propsentinel";

export const dynamic = "force-dynamic";

export default async function PropsentinelPage() {
  const initialData = await fetchPropsentinelDashboard();

  return (
    <PageShell
      eyebrow="XpFirm SaaS Infrastructure (xpfirm.com)"
      title="XpFirm PropSentinel — Quantitative Risk Management Terminal"
      description="Real-time Monte Carlo drawdown shields, sub-millisecond MT5 Kill-Switch circuit breakers, and institutional prop firm risk telemetry powered by xpfirm.com."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            xpfirm.com Live
          </StatusPill>
          <StatusPill tone="danger">Sub-ms Kill-Switch (&lt;1ms)</StatusPill>
          <StatusPill tone="chain">MT5 EA Bridge Active</StatusPill>
        </>
      }
      actions={
        <>
          <a
            href="https://xpfirm.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-os-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-os-4 py-os-2 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            Visit xpfirm.com ↗
          </a>
          <Link
            href="/apps"
            className="inline-flex items-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
          >
            <ArrowLeft size={13} />
            Modules
          </Link>
        </>
      }
    >
      <div className="flex items-center gap-os-3">
        <IconBadge Icon={Skull} tone="danger" />
        <div className="text-caption text-[var(--text-muted)]">
          XpFirm PropSentinel is strictly a Quantitative Risk Management SaaS Platform for Prop Traders & Quantitative Fund Managers. Powered by xpfirm.com.
        </div>
      </div>

      <OErrorBoundary moduleName="PROPSENTINEL_RISK">
        <PropsentinelClient initialData={initialData} />
      </OErrorBoundary>
    </PageShell>
  );
}
