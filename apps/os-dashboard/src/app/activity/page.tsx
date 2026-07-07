import Link from "next/link";
import { Cpu, ExternalLink, FileClock, ReceiptText, Route } from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import { fetchChainActivity } from "@/lib/activity-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTime(date: Date | null): string {
  if (!date) return "—";
  return `${date.toISOString().replace("T", " ").slice(0, 19)}Z`;
}

export default async function ActivityPage() {
  const { rows, rpcLabel, rpcUrl, error } = await fetchChainActivity({
    maxBlocks: 16,
    maxTxRows: 40,
  });

  const blockRows = rows.filter((row) => row.kind === "block").length;
  const txRows = rows.filter((row) => row.kind === "tx").length;

  return (
    <PageShell
      eyebrow="Audit Trail"
      title="Chain activity, job receipts, and operator evidence."
      description="Activity is the proof layer for the compute marketplace: block progression, transactions, and eventually verifiable workload receipts."
      meta={
        <>
          <StatusPill tone={error ? "warn" : "chain"} pulse={!error}>
            {error ? "fallback view" : "live rpc"}
          </StatusPill>
          {rpcUrl && <StatusPill tone="neutral">{rpcLabel}</StatusPill>}
        </>
      }
      actions={
        <>
          <LinkButton href="/activity/inference">Inference runs</LinkButton>
          <LinkButton href="/activity/models">Model registry</LinkButton>
          <LinkButton href="/jobs">Jobs hub</LinkButton>
        </>
      }
    >
      <div className="grid gap-os-4 md:grid-cols-3">
        <StatCard
          label="Rows observed"
          value={rows.length}
          hint="Recent block and transaction rows"
          icon={<FileClock size={18} />}
          tone="chain"
        />
        <StatCard
          label="Blocks"
          value={blockRows}
          hint="Block headers in this sample"
          icon={<Route size={18} />}
          tone="ai"
        />
        <StatCard
          label="Transactions"
          value={txRows}
          hint="Potential job or settlement activity"
          icon={<ReceiptText size={18} />}
          tone="violet"
        />
      </div>

      {error && (
        <Card className="border-amber-500/25 bg-amber-500/10">
          <p className="text-body font-medium text-[var(--accent-warn)]">
            RPC warning: {error}
          </p>
          <p className="mt-os-2 text-caption text-[var(--text-muted)]">
            Check that nodes in{" "}
            <code className="rounded-os-sm border border-[var(--hair)] bg-[var(--panel-sunken)] px-1.5 py-0.5 font-mono">
              @nakharax/sdk DEFAULT_NODES
            </code>{" "}
            match the active testnet.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-os-5 lg:grid-cols-12">
        <Card className="overflow-hidden p-0 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-[var(--hair)] bg-[var(--panel-sunken)] px-os-5 py-os-4">
            <SectionHeader
              title="Event stream"
              description="Recent rows observed from configured validator RPCs."
            />
            <span className="hidden items-center gap-os-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--accent-ai)] sm:inline-flex">
              <Cpu size={11} />
              rpc data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-[var(--hair)] bg-[var(--panel)] text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <th className="px-os-5 py-os-3 font-mono font-semibold">Type</th>
                  <th className="px-os-5 py-os-3 font-mono font-semibold">Block</th>
                  <th className="px-os-5 py-os-3 font-mono font-semibold">Time UTC</th>
                  <th className="px-os-5 py-os-3 font-mono font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hair)]">
                {rows.length === 0 && !error ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-os-5 py-os-10 text-center text-caption uppercase tracking-[0.16em] text-[var(--text-muted)]"
                    >
                      No blocks returned
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[var(--panel-sunken)]"
                    >
                      <td className="px-os-5 py-os-3">
                        <StatusPill tone={row.kind === "block" ? "chain" : "ai"}>
                          {row.kind === "block" ? "block" : "tx"}
                        </StatusPill>
                      </td>
                      <td className="px-os-5 py-os-3 font-mono text-body tabular-nums text-[var(--text-strong)]">
                        {row.blockNumber.toLocaleString()}
                      </td>
                      <td className="px-os-5 py-os-3 font-mono text-caption text-[var(--text-muted)]">
                        {formatTime(row.at)}
                      </td>
                      <td className="px-os-5 py-os-3 text-body text-[var(--text)]">
                        {row.kind === "tx" && row.txHash ? (
                          <span className="font-mono text-caption break-all">
                            {row.txHash.slice(0, 24)}…
                          </span>
                        ) : (
                          row.detail
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit lg:col-span-4">
          <IconBadge Icon={ExternalLink} tone="chain" />
          <h2 className="mt-os-4 text-title font-semibold text-[var(--text-strong)]">
            Operator tools
          </h2>
          <p className="mt-os-2 text-body leading-relaxed text-[var(--text-muted)]">
            Cross-check activity with node health and logs before trusting any
            performance or availability claim.
          </p>
          <div className="mt-os-5 space-y-os-2">
            <ToolLink href="/nodes" label="Node health" />
            <ToolLink href="/logs" label="Log stream" />
            <ToolLink href="/wallet" label="Vault and settlement" />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
    >
      {children}
    </Link>
  );
}

function ToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-3 text-caption font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
    >
      {label}
      <ExternalLink size={13} className="text-[var(--text-muted)]" />
    </Link>
  );
}
