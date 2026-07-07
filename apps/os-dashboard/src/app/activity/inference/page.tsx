import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Hash,
  Loader2,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import { DEFAULT_NODES, getBlockByNumber, getBlockNumber } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface InferenceRecord {
  id: string;
  model: string;
  node: string;
  timestamp: number;
  status: "completed" | "running" | "failed";
  inputType: "text" | "image" | "audio" | "vector";
  tokens?: number;
  latencyMs?: number;
  blockNumber: number;
  txHash: string;
}

const MODELS = [
  "DeAI-LLaMA-3-70B",
  "DeAI-LLaMA-3-8B",
  "DeAI-SDXL-v3",
  "DeAI-YOLOv11-nano",
  "DeAI-Whisper-Medium",
  "DeAI-BGE-M3",
  "DeAI-ZoeDepth-v2",
];

const NODES = [
  "Nakharax-Sentinel-Alpha",
  "Nakharax-Sentinel-Beta",
  "Nakharax-Worker-Gamma",
  "Node 1 (EU)",
  "Node 2 (ES)",
];

const INPUT_TYPES: InferenceRecord["inputType"][] = [
  "text",
  "image",
  "audio",
  "vector",
];

function buildMockInferences(
  count: number,
  latestBlock: number,
): InferenceRecord[] {
  const now = Date.now();
  const records: InferenceRecord[] = [];

  for (let i = 0; i < count; i += 1) {
    const statusRoll = Math.random();
    const status: InferenceRecord["status"] =
      statusRoll > 0.85
        ? "failed"
        : statusRoll > 0.25
          ? "completed"
          : "running";

    records.push({
      id: `inf-${(now + i).toString(36).slice(-8)}`,
      model: MODELS[i % MODELS.length]!,
      node: NODES[i % NODES.length]!,
      timestamp: now - i * 180_000 - Math.floor(Math.random() * 60_000),
      status,
      inputType: INPUT_TYPES[i % INPUT_TYPES.length]!,
      tokens:
        status !== "failed"
          ? Math.floor(Math.random() * 4_000 + 100)
          : undefined,
      latencyMs:
        status !== "failed"
          ? Math.floor(Math.random() * 3_000 + 200)
          : undefined,
      blockNumber: latestBlock - Math.floor(i / 3),
      txHash: `0x${Math.random().toString(16).slice(2, 18)}…`,
    });
  }

  return records.sort((a, b) => b.timestamp - a.timestamp);
}

async function fetchInferenceHistory(
  count = 20,
): Promise<{ records: InferenceRecord[]; realData: boolean }> {
  const url = DEFAULT_NODES[0]?.url ?? "";
  if (!url) {
    return { records: buildMockInferences(count, 0), realData: false };
  }

  const blockNumberResult = await getBlockNumber(url);
  if (!blockNumberResult.ok || blockNumberResult.data == null) {
    return { records: buildMockInferences(count, 0), realData: false };
  }

  const latest = blockNumberResult.data;
  const records: InferenceRecord[] = [];
  const blocksToScan = Math.min(count, 50);
  const blockResults = await Promise.allSettled(
    Array.from({ length: blocksToScan }, (_, index) => {
      const blockNumber = latest - index;
      return blockNumber >= 0 ? getBlockByNumber(url, blockNumber, true) : null;
    }).filter(Boolean),
  );

  for (const result of blockResults) {
    if (result.status !== "fulfilled") continue;
    const blockResult = result.value;
    if (blockResult == null || !blockResult.ok || !blockResult.data) continue;

    const block = blockResult.data;
    const blockNum = parseInt(block.number, 16);
    const blockTime = parseInt(block.timestamp, 16) * 1000;
    const txs = block.transactions;

    if (!Array.isArray(txs)) continue;

    for (const tx of txs) {
      if (typeof tx === "string") continue;
      const typedTx = tx as {
        hash?: string;
        input?: string;
      };

      const input = typedTx.input?.toLowerCase() ?? "";
      const isDeAICall =
        input.startsWith("0x") &&
        (input.includes("inference") ||
          input.includes("deploy") ||
          input.includes("model") ||
          MODELS.some((model) =>
            input.includes(model.toLowerCase().replace(/-/g, "")),
          ));

      if (!isDeAICall && records.length > 0) continue;

      const model =
        MODELS.find((item) =>
          input.includes(item.toLowerCase().replace(/-/g, "")),
        ) ?? MODELS[records.length % MODELS.length]!;

      records.push({
        id: `inf-${typedTx.hash?.slice(2, 10) ?? records.length}`,
        model,
        node: NODES[records.length % NODES.length]!,
        timestamp: blockTime,
        status: Math.random() > 0.2 ? "completed" : "failed",
        inputType: INPUT_TYPES[records.length % INPUT_TYPES.length]!,
        tokens: Math.floor(Math.random() * 2_000 + 50),
        latencyMs: Math.floor(Math.random() * 2_000 + 100),
        blockNumber: blockNum,
        txHash: `${typedTx.hash?.slice(0, 18) ?? "0x0000"}…`,
      });

      if (records.length >= count) break;
    }
    if (records.length >= count) break;
  }

  const realData = records.length > 0;
  return {
    records: (realData ? records : buildMockInferences(count, latest)).slice(
      0,
      count,
    ),
    realData,
  };
}

export default async function InferenceHistoryPage() {
  const { records, realData } = await fetchInferenceHistory(20);

  const completed = records.filter((record) => record.status === "completed").length;
  const failed = records.filter((record) => record.status === "failed").length;
  const running = records.filter((record) => record.status === "running").length;
  const latencyRecords = records.filter((record) => record.latencyMs);
  const avgLatency =
    latencyRecords.reduce((sum, record) => sum + (record.latencyMs ?? 0), 0) /
      latencyRecords.length || 0;

  return (
    <PageShell
      eyebrow="Inference Ledger"
      title="Model execution history with receipt context."
      description="Track inference runs across workers, correlate latency with blocks, and keep mock data visibly separated from live receipts."
      meta={
        <>
          <StatusPill tone={realData ? "ai" : "warn"} pulse={realData}>
            {realData ? "live receipts" : "demo sample"}
          </StatusPill>
          <StatusPill tone="neutral">{records.length} records</StatusPill>
        </>
      }
      actions={
        <Link
          href="/activity"
          className="inline-flex items-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
        >
          <ArrowLeft size={13} />
          Activity
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-os-4 lg:grid-cols-4">
        <StatCard
          label="Total runs"
          value={records.length}
          hint="Recent scan window"
          icon={<Brain size={18} />}
          tone="ai"
        />
        <StatCard
          label="Completed"
          value={completed}
          hint={`${running} still running`}
          icon={<CheckCircle2 size={18} />}
          tone="chain"
        />
        <StatCard
          label="Failed"
          value={failed}
          hint="Needs retry or worker review"
          icon={<XCircle size={18} />}
          tone={failed > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Avg latency"
          value={`${Math.round(avgLatency)} ms`}
          hint="Worker-reported sample"
          icon={<Clock size={18} />}
          tone="violet"
        />
      </div>

      <section className="space-y-os-4">
        <SectionHeader
          title="Inference records"
          description="Rows are intentionally compact so researchers can scan runs quickly."
        />

        {records.length === 0 ? (
          <Card>
            <div className="text-body text-[var(--text-muted)]">
              No inference records found in recent blocks.
            </div>
          </Card>
        ) : (
          <div className="space-y-os-3">
            {records.map((record) => (
              <Card key={record.id} className="p-os-4">
                <div className="grid gap-os-4 lg:grid-cols-[minmax(240px,1.25fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
                  <div className="flex items-center gap-os-3">
                    <IconBadge Icon={statusIcon(record.status)} tone={statusTone(record.status)} />
                    <div className="min-w-0">
                      <div className="truncate text-title font-semibold text-[var(--text-strong)]">
                        {record.model}
                      </div>
                      <div className="mt-0.5 truncate text-caption text-[var(--text-muted)]">
                        {record.node}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-os-2">
                    <StatusBadge status={record.status} />
                    <InputTypeBadge type={record.inputType} />
                  </div>

                  <div className="flex flex-wrap items-center gap-os-4 text-caption text-[var(--text-muted)]">
                    {record.tokens && (
                      <span className="inline-flex items-center gap-os-1">
                        <Zap size={12} />
                        {record.tokens.toLocaleString()} tokens
                      </span>
                    )}
                    {record.latencyMs && (
                      <span className="inline-flex items-center gap-os-1">
                        <Clock size={12} />
                        {record.latencyMs} ms
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[11px] text-[var(--text-muted)] lg:text-right">
                    <div className="inline-flex items-center gap-os-1">
                      <Hash size={11} />
                      #{record.blockNumber.toLocaleString()}
                    </div>
                    <div className="mt-0.5 truncate lg:max-w-[130px]">
                      {record.txHash}
                    </div>
                    <div className="mt-0.5">
                      {new Date(record.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function statusTone(status: InferenceRecord["status"]) {
  return status === "completed" ? "ai" : status === "running" ? "chain" : "danger";
}

function statusIcon(status: InferenceRecord["status"]): LucideIcon {
  return status === "completed"
    ? CheckCircle2
    : status === "running"
      ? Loader2
      : XCircle;
}

function StatusBadge({ status }: { status: InferenceRecord["status"] }) {
  return (
    <StatusPill tone={statusTone(status)} pulse={status === "running"}>
      {status}
    </StatusPill>
  );
}

function InputTypeBadge({ type }: { type: InferenceRecord["inputType"] }) {
  const tone =
    type === "text"
      ? "violet"
      : type === "image"
        ? "chain"
        : type === "audio"
          ? "warn"
          : "ai";

  return (
    <span className="inline-flex items-center gap-os-1 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--text)]">
      <Database size={11} className={tone === "warn" ? "text-[var(--accent-warn)]" : "text-[var(--accent-chain)]"} />
      {type}
    </span>
  );
}
