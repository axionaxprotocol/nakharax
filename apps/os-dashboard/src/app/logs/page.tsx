import { Terminal } from "lucide-react";

import { PageShell, StatCard, StatusPill } from "@/components/card";
import { LogViewer } from "@/components/log-viewer";
import { buildLogSeedLines } from "@/lib/log-seed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LogsPage() {
  const seedLines = await buildLogSeedLines();

  return (
    <PageShell
      eyebrow="Runtime Logs"
      title="Local observability for node and worker operations."
      description="Logs make the compute marketplace debuggable: RPC status, synthetic tail lines, and eventually worker execution streams."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            demo tail active
          </StatusPill>
          <StatusPill tone="neutral">{seedLines.length} seed lines</StatusPill>
        </>
      }
    >
      <div className="grid gap-os-4 md:grid-cols-3">
        <StatCard
          label="Source"
          value="RPC"
          hint="Initial lines from live node probe"
          icon={<Terminal size={18} />}
          tone="chain"
        />
        <StatCard
          label="Tail mode"
          value="Demo"
          hint="Demo until WebSocket stream is wired"
          icon={<Terminal size={18} />}
          tone="warn"
        />
        <StatCard
          label="Retention"
          value="400"
          hint="Client-side visible line cap"
          icon={<Terminal size={18} />}
          tone="neutral"
        />
      </div>

      <LogViewer seedLines={seedLines} />
    </PageShell>
  );
}
