import { Network, Server, Settings } from "lucide-react";

import {
  Card,
  DataRow,
  IconBadge,
  PageShell,
  SectionHeader,
  StatusPill,
} from "@/components/card";
import { DEFAULT_NODES } from "@/lib/rpc";

export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="System Configuration"
      title="Network, RPC, and worker defaults."
      description="Settings should make the local-first assumption explicit: operators control endpoints, bootnodes, data boundaries, and worker policy."
      meta={
        <>
          <StatusPill tone="chain">chain 86137</StatusPill>
          <StatusPill tone="ai">nakharax-testnet</StatusPill>
        </>
      }
    >
      <div className="grid gap-os-5 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <div className="flex items-start gap-os-3">
            <IconBadge Icon={Server} tone="chain" />
            <SectionHeader
              title="Bootnodes"
              description="Configured endpoints used by the dashboard and SDK."
            />
          </div>
          <ul className="mt-os-5 space-y-os-2">
            {DEFAULT_NODES.map((node) => (
              <li
                key={node.id}
                className="flex flex-col gap-os-2 rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="truncate font-mono text-caption text-[var(--text-strong)]">
                  {node.url}
                </span>
                <span className="shrink-0 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {node.name}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-os-4 text-caption text-[var(--text-muted)]">
            Change worker-side defaults in{" "}
            <code className="rounded-os-sm border border-[var(--hair)] bg-[var(--panel-sunken)] px-1.5 py-0.5 font-mono text-[var(--text-strong)]">
              configs/monolith_worker.toml
            </code>
            .
          </p>
        </Card>

        <Card className="lg:col-span-5">
          <div className="flex items-start gap-os-3">
            <IconBadge Icon={Network} tone="ai" />
            <SectionHeader
              title="Network parameters"
              description="Human-readable defaults for testnet operation."
            />
          </div>
          <div className="mt-os-5 space-y-os-3">
            <DataRow label="Chain ID" value="86137" detail="Nakharax testnet identifier" />
            <DataRow label="Network" value="nakharax-testnet" detail="Current dashboard target" />
            <DataRow label="Block time" value="3s" detail="Expected local configuration" />
            <DataRow label="VRF delay" value="k = 2" detail="Assignment delay parameter" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start gap-os-3">
          <IconBadge Icon={Settings} tone="warn" />
          <div>
            <h2 className="text-title font-semibold text-[var(--text-strong)]">
              Operator policy still needs product wiring
            </h2>
            <p className="mt-os-2 text-body leading-relaxed text-[var(--text-muted)]">
              The UI should later expose price caps, geography rules, accepted
              workload types, hardware limits, and auto-update policy directly
              from node configuration rather than hardcoded labels.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
