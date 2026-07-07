import Link from "next/link";
import { ArrowRight, Boxes, Brain, Cpu, FileCheck2, Gauge } from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";

export const dynamic = "force-dynamic";

const JOB_LINKS = [
  {
    href: "/activity/inference",
    title: "Inference runs",
    desc: "Inspect recent model execution, latency, receipts, and RPC-backed probes.",
    Icon: Brain,
    tone: "ai" as const,
  },
  {
    href: "/activity/models",
    title: "Model registry",
    desc: "Match workload type against registered model capabilities and precision.",
    Icon: Cpu,
    tone: "violet" as const,
  },
  {
    href: "/apps",
    title: "Worker modules",
    desc: "Open the module catalog. Unwired worker services are marked demo-only.",
    Icon: Boxes,
    tone: "chain" as const,
  },
];

export default function JobsPage() {
  return (
    <PageShell
      eyebrow="Compute Marketplace"
      title="Route work to affordable owned compute."
      description="This screen is the operator entry point for DeAI workloads: inference, model matching, job receipts, and worker activation."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            worker-ready path
          </StatusPill>
          <StatusPill tone="warn">demo routing</StatusPill>
        </>
      }
    >
      <div className="grid gap-os-4 md:grid-cols-3">
        <StatCard
          label="Primary workload"
          value="Inference"
          hint="Text, image, audio, vector"
          icon={<Brain size={18} />}
          tone="ai"
        />
        <StatCard
          label="Settlement mode"
          value="Escrow"
          hint="NAK-backed job agreement"
          icon={<FileCheck2 size={18} />}
          tone="warn"
        />
        <StatCard
          label="Design priority"
          value="Cost"
          hint="Accessible compute before raw TPS claims"
          icon={<Gauge size={18} />}
          tone="chain"
        />
      </div>

      <section className="space-y-os-4">
        <SectionHeader
          title="Workload command center"
          description="Open the screens that turn compute demand into verifiable execution."
        />
        <div className="grid grid-cols-1 gap-os-4 md:grid-cols-3">
          {JOB_LINKS.map(({ href, title, desc, Icon, tone }) => (
            <Link key={href} href={href} className="group block">
              <Card interactive className="h-full">
                <IconBadge Icon={Icon} tone={tone} />
                <h2 className="mt-os-4 text-title font-semibold text-[var(--text-strong)]">
                  {title}
                </h2>
                <p className="mt-os-2 text-body leading-relaxed text-[var(--text-muted)]">
                  {desc}
                </p>
                <div className="mt-os-5 flex items-center justify-between border-t border-[var(--hair)] pt-os-3">
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    open
                  </span>
                  <span className="inline-flex items-center gap-os-1 text-[11px] font-semibold text-[var(--accent-ai)]">
                    launch
                    <ArrowRight
                      size={13}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <div className="flex flex-col gap-os-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[var(--accent-ai)]">
              demo workload path
            </div>
            <p className="mt-os-2 max-w-3xl text-body leading-relaxed text-[var(--text-muted)]">
              End-to-end Python workload flow is documented under{" "}
              <code className="rounded-os-sm border border-[var(--hair)] bg-[var(--panel-sunken)] px-1.5 py-0.5 font-mono text-[var(--text-strong)]">
                services/core/core/deai/RUNBOOK.md
              </code>
              : submit → worker → result JSON → receipt.
            </p>
          </div>
          <Link
            href="/logs"
            className="inline-flex items-center justify-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-5 py-os-3 text-caption font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
          >
            Check runtime logs
            <ArrowRight size={14} />
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
