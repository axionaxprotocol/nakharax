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
      eyebrow="Risk Module"
      title="PropSentinel risk engine."
      description="A specialist module for account telemetry, drawdown limits, kill-switch events, and risk timeline monitoring."
      meta={
        <>
          <StatusPill tone={initialData ? "ai" : "danger"} pulse={Boolean(initialData)}>
            {initialData ? "telemetry loaded" : "engine offline"}
          </StatusPill>
          <StatusPill tone="danger">high-signal module</StatusPill>
        </>
      }
      actions={
        <Link
          href="/apps"
          className="inline-flex items-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
        >
          <ArrowLeft size={13} />
          Modules
        </Link>
      }
    >
      <div className="flex items-center gap-os-3">
        <IconBadge Icon={Skull} tone="danger" />
        <div className="text-caption text-[var(--text-muted)]">
          Client telemetry is isolated behind an error boundary so the module
          cannot take down the OS shell.
        </div>
      </div>

      <OErrorBoundary moduleName="PROPSENTINEL_RISK">
        <PropsentinelClient initialData={initialData} />
      </OErrorBoundary>
    </PageShell>
  );
}
