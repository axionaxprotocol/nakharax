import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: "llm" | "vision" | "audio" | "embedding" | "depth";
  size: string;
  precision: "FP16" | "INT8" | "INT4" | "FP32";
  status: "active" | "deprecated" | "beta";
  deployedOn: string[];
  totalInferences: number;
  avgLatencyMs: number;
  lastUsed: number;
}

const MODEL_CATALOG: Omit<
  ModelInfo,
  "deployedOn" | "totalInferences" | "avgLatencyMs" | "lastUsed"
>[] = [
  { id: "m-llama70b", name: "DeAI-LLaMA-3-70B", version: "3.2", type: "llm", size: "70B", precision: "INT8", status: "active" },
  { id: "m-llama8b", name: "DeAI-LLaMA-3-8B", version: "3.1", type: "llm", size: "8B", precision: "INT4", status: "active" },
  { id: "m-sdxl", name: "DeAI-SDXL", version: "v3.2", type: "vision", size: "v3", precision: "FP16", status: "active" },
  { id: "m-yolo", name: "DeAI-YOLOv11", version: "nano", type: "vision", size: "nano", precision: "INT8", status: "active" },
  { id: "m-whisper", name: "DeAI-Whisper", version: "Medium", type: "audio", size: "Medium", precision: "FP16", status: "active" },
  { id: "m-bge", name: "DeAI-BGE-M3", version: "1.0", type: "embedding", size: "M3", precision: "INT8", status: "active" },
  { id: "m-zoe", name: "DeAI-ZoeDepth", version: "v2.1", type: "depth", size: "v2", precision: "FP16", status: "active" },
  { id: "m-llama13b", name: "DeAI-LLaMA-2-13B", version: "2.0", type: "llm", size: "13B", precision: "INT8", status: "deprecated" },
  { id: "m-sam", name: "DeAI-SAM", version: "beta1", type: "vision", size: "base", precision: "FP16", status: "beta" },
  { id: "m-ast", name: "DeAI-AST", version: "v1", type: "audio", size: "Large", precision: "FP32", status: "beta" },
];

const NODES = [
  "Nakharax-Sentinel-Alpha",
  "Nakharax-Sentinel-Beta",
  "Nakharax-Worker-Gamma",
  "Node 1 (EU)",
  "Node 2 (ES)",
];

function buildModelRegistry(): ModelInfo[] {
  const now = Date.now();
  return MODEL_CATALOG.map((model) => {
    const deployedOn =
      model.status === "deprecated"
        ? NODES.slice(0, 1)
        : model.status === "beta"
          ? NODES.slice(0, 2)
          : NODES.slice(0, 3 + Math.floor(Math.random() * 2));
    return {
      ...model,
      deployedOn,
      totalInferences: Math.floor(Math.random() * 50_000 + 1_000),
      avgLatencyMs: Math.floor(Math.random() * 3_000 + 100),
      lastUsed: now - Math.floor(Math.random() * 86_400_000),
    };
  }).sort((a, b) => b.totalInferences - a.totalInferences);
}

export default async function ModelRegistryPage() {
  const models = buildModelRegistry();
  const active = models.filter((model) => model.status === "active").length;
  const beta = models.filter((model) => model.status === "beta").length;
  const totalInferences = models.reduce(
    (sum, model) => sum + model.totalInferences,
    0,
  );
  const deployedCount = models.reduce(
    (sum, model) => sum + model.deployedOn.length,
    0,
  );

  return (
    <PageShell
      eyebrow="Model Registry"
      title="Capabilities workers can actually run."
      description="The registry connects user intent to available models, precision, deployment footprint, and observed latency."
      meta={
        <>
          <StatusPill tone="ai">{active} active</StatusPill>
          <StatusPill tone="warn">{beta} beta</StatusPill>
          <StatusPill tone="warn">testnet catalog</StatusPill>
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
          label="Models"
          value={models.length}
          hint="LLM, vision, audio, embedding"
          icon={<Brain size={18} />}
          tone="violet"
        />
        <StatCard
          label="Active"
          value={active}
          hint="Ready for routing"
          icon={<CheckCircle2 size={18} />}
          tone="ai"
        />
        <StatCard
          label="Deployments"
          value={deployedCount}
          hint="Model-worker placements"
          icon={<Cpu size={18} />}
          tone="chain"
        />
        <StatCard
          label="Inferences"
          value={`${(totalInferences / 1_000).toFixed(0)}k`}
          hint="Testnet sample volume"
          icon={<Zap size={18} />}
          tone="warn"
        />
      </div>

      <section className="space-y-os-4">
        <SectionHeader
          title="Catalog"
          description="Use this as the visible contract between workload requests and worker capabilities."
        />
        <div className="grid gap-os-3">
          {models.map((model) => (
            <Card key={model.id} className="p-os-4">
              <div className="grid gap-os-4 lg:grid-cols-[minmax(260px,1.2fr)_minmax(220px,1fr)_minmax(240px,1fr)] lg:items-center">
                <div className="flex items-center gap-os-3">
                  <IconBadge Icon={typeIcon(model.type)} tone={typeTone(model.type)} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-os-2">
                      <h2 className="truncate text-title font-semibold text-[var(--text-strong)]">
                        {model.name}
                      </h2>
                      <span className="text-caption text-[var(--text-muted)]">
                        v{model.version}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-os-2">
                      <ModelStatus status={model.status} />
                      <TypeBadge type={model.type} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-os-2">
                  <MiniStat label="Size" value={model.size} />
                  <MiniStat label="Precision" value={model.precision} />
                  <MiniStat label="Latency" value={`${model.avgLatencyMs}ms`} />
                </div>

                <div>
                  <div className="mb-os-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    <span>worker placements</span>
                    <span>{model.deployedOn.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-os-1">
                    {model.deployedOn.map((node) => (
                      <span
                        key={node}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-2 py-1 text-[10px] text-[var(--text-muted)]"
                      >
                        <Cpu size={10} />
                        {node}
                      </span>
                    ))}
                  </div>
                  <div className="mt-os-2 text-[11px] text-[var(--text-muted)]">
                    {(model.totalInferences / 1_000).toFixed(1)}k runs · last used{" "}
                    {new Date(model.lastUsed).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function typeTone(type: ModelInfo["type"]) {
  return type === "llm"
    ? "violet"
    : type === "vision"
      ? "chain"
      : type === "audio"
        ? "warn"
        : "ai";
}

function typeIcon(type: ModelInfo["type"]): LucideIcon {
  return type === "llm" ? Brain : type === "vision" ? Database : Cpu;
}

function ModelStatus({ status }: { status: ModelInfo["status"] }) {
  const tone = status === "active" ? "ai" : status === "beta" ? "warn" : "neutral";
  const Icon = status === "active" ? CheckCircle2 : status === "beta" ? Loader2 : XCircle;
  return (
    <StatusPill tone={tone} pulse={status === "beta"}>
      <Icon size={11} />
      {status}
    </StatusPill>
  );
}

function TypeBadge({ type }: { type: ModelInfo["type"] }) {
  return (
    <span className="inline-flex items-center gap-os-1 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--text)]">
      <Database size={11} />
      {type}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-os-lg border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-3 py-os-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-caption font-semibold text-[var(--text-strong)]">
        {value}
      </div>
    </div>
  );
}
