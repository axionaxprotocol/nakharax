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
            Live WebSocket (Port 8546)
          </StatusPill>
          <StatusPill tone="chain">PoPC Telemetry Stream</StatusPill>
        </>
      }
    >
      <div className="grid gap-os-4 md:grid-cols-3">
        <StatCard
          label="Source"
          value="Node RPC"
          hint="ws://127.0.0.1:8546 stream"
          icon={<Terminal size={18} />}
          tone="chain"
        />
        <StatCard
          label="Stream Mode"
          value="Live"
          hint="Real-time event broadcast"
          icon={<Terminal size={18} />}
          tone="ai"
        />
        <StatCard
          label="Buffer Cap"
          value="500 Lines"
          hint="Client-side ring buffer"
          icon={<Terminal size={18} />}
          tone="violet"
        />
      </div>

      <LogViewer seedLines={seedLines} />
    </PageShell>
  );
}
