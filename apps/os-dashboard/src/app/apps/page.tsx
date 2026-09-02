"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Boxes,
  Building2,
  Cpu,
  Droplets,
  Eye,
  GitMerge,
  Network,
  Plug,
  Search,
  Shield,
  Trophy,
  Vote,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatusPill,
} from "@/components/card";

type Tone = "ai" | "chain" | "warn" | "danger" | "neutral" | "violet";
type ModuleCategory = "protocol" | "compute" | "infrastructure" | "developer";

type AppModule = {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  category: ModuleCategory;
  href: string;
};

const CATEGORY_FILTERS: Array<{ id: "all" | ModuleCategory; label: string }> = [
  { id: "all", label: "All modules" },
  { id: "protocol", label: "Protocol" },
  { id: "compute", label: "Compute & AI" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "developer", label: "Developer tools" },
];

const CATEGORY_LABELS: Record<ModuleCategory, string> = {
  protocol: "Protocol",
  compute: "Compute & AI",
  infrastructure: "Infrastructure",
  developer: "Developer tool",
};

// Each item below maps to a route that is present in this portal. Runtime and
// on-chain availability are reported by the individual module, not inferred here.
const APP_MODULES: AppModule[] = [
  {
    id: "treasury",
    name: "DAO Treasury & Burn Terminal",
    desc: "Review the treasury and fee-burn information exposed by the protocol dashboard.",
    icon: Building2,
    tone: "chain",
    category: "protocol",
    href: "/apps/treasury",
  },
  {
    id: "governance",
    name: "DAO Governance & Sovereign Council",
    desc: "Inspect governance proposals, protocol controls, and council-related information.",
    icon: Vote,
    tone: "chain",
    category: "protocol",
    href: "/apps/governance",
  },
  {
    id: "leaderboard",
    name: "DeAI Mining & Validator Leaderboard",
    desc: "View the rankings and compute activity published by the leaderboard route.",
    icon: Trophy,
    tone: "ai",
    category: "compute",
    href: "/apps/leaderboard",
  },
  {
    id: "worker",
    name: "DeAI Worker Config & CLI",
    desc: "Generate a worker configuration and review the CLI setup needed for a GPU worker.",
    icon: Cpu,
    tone: "ai",
    category: "compute",
    href: "/apps/worker",
  },
  {
    id: "mcp",
    name: "Universal MCP Skills",
    desc: "Explore the agent skills registry and its available tool connections.",
    icon: Plug,
    tone: "violet",
    category: "developer",
    href: "/apps/mcp",
  },
  {
    id: "lora",
    name: "LoRA Weight Merging Hub",
    desc: "Inspect and combine LoRA adapters through the weight-merging workspace.",
    icon: GitMerge,
    tone: "ai",
    category: "compute",
    href: "/apps/lora",
  },
  {
    id: "agents",
    name: "Sovereign Agent Fleet",
    desc: "Manage agent identities, skills, and workflows in the agent console.",
    icon: Bot,
    tone: "violet",
    category: "compute",
    href: "/apps/agents",
  },
  {
    id: "subnets",
    name: "Knowledge Subnets Mesh",
    desc: "Browse the knowledge-subnet workspace and its network topology tools.",
    icon: Network,
    tone: "chain",
    category: "infrastructure",
    href: "/apps/subnets",
  },
  {
    id: "sentinel",
    name: "Hydra Sentinel",
    desc: "Open the consensus-defense workspace for policy and telemetry inspection.",
    icon: Shield,
    tone: "violet",
    category: "infrastructure",
    href: "/apps/sentinel",
  },
  {
    id: "explorer",
    name: "Block Explorer",
    desc: "Inspect blocks, transactions, and contract-oriented network information.",
    icon: Eye,
    tone: "chain",
    category: "developer",
    href: "/apps/explorer",
  },
  {
    id: "faucet",
    name: "Testnet Faucet",
    desc: "Open the testnet token request flow. A connected wallet is required to submit a claim.",
    icon: Droplets,
    tone: "warn",
    category: "developer",
    href: "/apps/faucet",
  },
  {
    id: "router",
    name: "ASR Router & Scheduler",
    desc: "Configure compute-routing policies and inspect scheduler controls.",
    icon: Workflow,
    tone: "chain",
    category: "infrastructure",
    href: "/apps/router",
  },
];

export default function AppsPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | ModuleCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const visibleModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return APP_MODULES.filter((module) => {
      const matchesCategory = activeCategory === "all" || module.category === activeCategory;
      const matchesSearch = !query || [
        module.name,
        module.desc,
        CATEGORY_LABELS[module.category],
      ].some((value) => value.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const hasFilters = activeCategory !== "all" || Boolean(searchQuery);

  return (
    <PageShell
      eyebrow="Node Modules & Ecosystem Apps"
      title="Network module directory"
      description="Launch a module from its verified portal route. Each module reports its own runtime and on-chain state after it opens."
      meta={
        <>
          <StatusPill tone="ai">{APP_MODULES.length} available routes</StatusPill>
          <StatusPill tone="neutral">Searchable directory</StatusPill>
        </>
      }
    >
      <section className="space-y-os-4">
        <SectionHeader
          title="Browse modules"
          description="Filter by domain or search by a module name, capability, or workflow."
          action={
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {visibleModules.length} of {APP_MODULES.length} shown
            </span>
          }
        />

        <div className="rounded-os-2xl border border-[var(--hair)] bg-[var(--panel)] p-os-4 shadow-[var(--shadow-panel)]">
          <div className="flex flex-col gap-os-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" aria-label="Module categories">
              {CATEGORY_FILTERS.map((filter) => {
                const isActive = activeCategory === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveCategory(filter.id)}
                    className={[
                      "rounded-full border px-3 py-1.5 text-[11px] font-mono font-semibold transition-colors",
                      isActive
                        ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-200"
                        : "border-[var(--hair)] bg-[var(--panel-sunken)] text-[var(--text-muted)] hover:border-white/25 hover:text-[var(--text-strong)]",
                    ].join(" ")}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <label className="relative block w-full lg:w-80">
              <span className="sr-only">Search modules</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search modules..."
                className="w-full rounded-xl border border-[var(--hair)] bg-[var(--panel-sunken)] py-2 pl-9 pr-9 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-emerald-400/60 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[var(--text-muted)] hover:bg-white/10 hover:text-white"
                  aria-label="Clear module search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        </div>

        {visibleModules.length > 0 ? (
          <div className="grid grid-cols-1 gap-os-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleModules.map((module) => (
              <AppCard key={module.id} module={module} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-3 border-dashed py-12 text-center">
            <Boxes size={28} className="text-[var(--text-muted)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-strong)]">No modules match these filters</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Try another search term or return to all modules.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}
              className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/20"
            >
              Clear filters
            </button>
          </Card>
        )}

        {hasFilters && visibleModules.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="mx-auto flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-emerald-200"
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </section>
    </PageShell>
  );
}

function AppCard({ module }: { module: AppModule }) {
  const Icon = module.icon;

  return (
    <Link href={module.href} className="block h-full" aria-label={`Open ${module.name}`}>
      <Card interactive className="group flex h-full flex-col">
        <div className="flex flex-1 items-start gap-os-4">
          <IconBadge Icon={Icon} tone={module.tone} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-os-2">
              <h2 className="text-title font-semibold text-[var(--text-strong)]">{module.name}</h2>
              <StatusPill tone={module.tone}>available</StatusPill>
            </div>
            <p className="mt-os-2 text-body leading-relaxed text-[var(--text-muted)]">{module.desc}</p>
          </div>
        </div>
        <div className="mt-os-5 flex items-center justify-between border-t border-[var(--hair)] pt-os-3">
          <span className="rounded-full border border-[var(--hair)] bg-[var(--panel-sunken)] px-2.5 py-1 text-[10px] font-mono text-[var(--text-muted)]">
            {CATEGORY_LABELS[module.category]}
          </span>
          <span className="inline-flex items-center gap-os-2 text-[11px] font-semibold text-[var(--text-strong)] transition-colors group-hover:text-emerald-200">
            Open module
            <ArrowRight size={13} />
          </span>
        </div>
      </Card>
    </Link>
  );
}
