import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Cpu,
  Globe2,
  Shield,
  type LucideIcon,
} from "lucide-react";

import {
  ActionLink,
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";

export const metadata = {
  title: "Nakharax Protocol | Sovereign DeAI Compute",
  description: "Local-first decentralized AI compute network and operating environment.",
};

export default function WelcomePage() {
  return (
    <PageShell
      eyebrow="Nakharax Protocol"
      title="Affordable compute should be a network people can own."
      description="Nakharax is positioned as a DeAI compute protocol: edge workers, sovereign routing, verifiable receipts, and settlement rails for workloads that should not depend only on hyperscale clouds."
      meta={
        <>
          <StatusPill tone="ai" pulse>
            local-first
          </StatusPill>
          <StatusPill tone="chain">deai compute</StatusPill>
          <StatusPill tone="warn">evidence-led claims</StatusPill>
        </>
      }
      actions={
        <>
          <ActionLink href="/">Initialize OS</ActionLink>
          <ActionLink href="/jobs" variant="secondary">
            View compute flow
          </ActionLink>
        </>
      }
    >
      <div className="grid gap-os-5 lg:grid-cols-3">
        <FeatureBlock
          icon={Cpu}
          title="Edge workers"
          desc="Turn reachable PCs, mini PCs, and private accelerators into useful inference capacity."
          tone="ai"
        />
        <FeatureBlock
          icon={Brain}
          title="Research workloads"
          desc="Queue simulation, model inference, and batch tasks where accessibility and price matter."
          tone="violet"
        />
        <FeatureBlock
          icon={Shield}
          title="Verifiable settlement"
          desc="Use the chain for escrow, receipts, verification, and reward distribution."
          tone="chain"
        />
      </div>

      <div className="grid gap-os-4 md:grid-cols-4">
        <StatCard
          label="Initial focus"
          value="Inference"
          hint="Practical path before large training"
          icon={<Brain size={18} />}
          tone="ai"
        />
        <StatCard
          label="Data posture"
          value="Sovereign"
          hint="Route by operator and geography"
          icon={<Globe2 size={18} />}
          tone="chain"
        />
        <StatCard
          label="Claims"
          value="Measured"
          hint="No public TPS claim without reproducible benchmark"
          icon={<Activity size={18} />}
          tone="warn"
        />
        <StatCard
          label="Token"
          value="NAK"
          hint="Compute escrow and rewards"
          icon={<Shield size={18} />}
          tone="violet"
        />
      </div>

      <Card>
        <SectionHeader
          title="What success should look like"
          description="A researcher can run a solar-system simulation, an SME can run private inference, and a household device can become a paid worker without the product pretending raw blockchain TPS is the only metric."
          action={
            <Link
              href="https://github.com/axionaxprotocol/nakharax"
              className="inline-flex items-center gap-os-2 rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-os-4 py-os-2 text-caption font-semibold text-[var(--text-strong)] transition-colors hover:bg-[var(--panel-hover)]"
            >
              GitHub
              <ArrowRight size={14} />
            </Link>
          }
        />
      </Card>
    </PageShell>
  );
}

function FeatureBlock({
  icon: Icon,
  title,
  desc,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: "ai" | "chain" | "violet";
}) {
  return (
    <Card interactive className="h-full">
      <IconBadge Icon={Icon} tone={tone} />
      <h2 className="mt-os-4 text-title font-semibold text-[var(--text-strong)]">
        {title}
      </h2>
      <p className="mt-os-2 text-body leading-relaxed text-[var(--text-muted)]">
        {desc}
      </p>
    </Card>
  );
}
