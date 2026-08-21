"use client";

import { useState } from "react";
import { Download, Globe2, Network, Server, Settings, ShieldCheck, Terminal, Zap } from "lucide-react";

import {
  Card,
  DataRow,
  IconBadge,
  PageShell,
  SectionHeader,
  StatCard,
  StatusPill,
} from "@/components/card";
import { DEFAULT_NODES } from "@/lib/rpc";

const DOCKER_COMPOSE_TEMPLATE = `version: '3.8'

services:
  nakharax-node:
    image: ghcr.io/axionaxprotocol/nakharax-node:latest
    container_name: nakharax-validator
    restart: unless-stopped
    ports:
      - "8545:8545"
      - "8546:8546"
      - "30303:30303"
    environment:
      - CHAIN_ID=86137
      - NETWORK=nakharax-testnet
      - NODE_ROLE=validator
      - BLOCK_TIME=3000
    volumes:
      - nakharax-data:/root/.nakharax

volumes:
  nakharax-data:
`;

export default function SettingsPage() {
  const [selectedNetwork, setSelectedNetwork] = useState("local");
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const downloadDockerCompose = () => {
    const blob = new Blob([DOCKER_COMPOSE_TEMPLATE], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docker-compose.node.yml";
    a.click();
    URL.revokeObjectURL(url);
    setCopiedNotice("✅ Downloaded docker-compose.node.yml!");
    setTimeout(() => setCopiedNotice(null), 4000);
  };

  return (
    <PageShell
      eyebrow="System Configuration"
      title="Network, RPC Gateways, and Node Operator Defaults"
      description="Configure local and remote RPC ingress gateways, toggle testnet profiles, and export production Docker node templates."
      meta={
        <>
          <StatusPill tone="chain">Chain 86137</StatusPill>
          <StatusPill tone="ai">{selectedNetwork === "local" ? "Local Daemon (8545)" : "Public Cluster"}</StatusPill>
          {copiedNotice && <StatusPill tone="violet">{copiedNotice}</StatusPill>}
        </>
      }
      actions={
        <button
          type="button"
          onClick={downloadDockerCompose}
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-[11px] font-semibold text-emerald-300 transition-colors"
        >
          <Download size={13} />
          Export docker-compose.yml
        </button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Network Profile Selection */}
        <Card className="lg:col-span-7 space-y-4">
          <div className="flex items-start gap-3">
            <IconBadge Icon={Server} tone="chain" />
            <SectionHeader
              title="Active Ingress Gateway & Bootnodes"
              description="Configured RPC endpoints used across the Web Universe."
            />
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => setSelectedNetwork("local")}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                selectedNetwork === "local"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Local Sovereign Daemon</div>
                <div className="text-[11px] font-mono text-cyan-300">http://127.0.0.1:8545</div>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                Primary (1ms)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedNetwork("public")}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                selectedNetwork === "public"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                  : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">Public Testnet Cluster</div>
                <div className="text-[11px] font-mono text-cyan-300">https://rpc.nakharax.com</div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-slate-400">
                Genesis Target
              </span>
            </button>
          </div>

          <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
            {DEFAULT_NODES.map((node) => (
              <li
                key={node.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-[11px] font-mono"
              >
                <span className="text-slate-300 truncate max-w-[260px]">{node.url}</span>
                <span className="text-slate-500 uppercase">{node.name}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Network Parameters */}
        <Card className="lg:col-span-5 space-y-4">
          <div className="flex items-start gap-3">
            <IconBadge Icon={Network} tone="ai" />
            <SectionHeader
              title="Protocol Invariants"
              description="Hardcoded parameters for NakharaX L1 consensus."
            />
          </div>
          <div className="space-y-3 pt-2">
            <DataRow label="Chain ID" value="86137 (0x15079)" detail="Nakharax testnet identifier" />
            <DataRow label="Consensus" value="PoPC + BFT" detail="Proof of Practical Compute" />
            <DataRow label="Block Time" value="3.0s Cadence" detail="Sub-second fast-finality" />
            <DataRow label="Native Symbol" value="$tNAK / 18 Dec" detail="EVM compatible gas token" />
          </div>
        </Card>
      </div>

      {/* Production VPS Deployment Guide */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.04] to-transparent">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} className="text-emerald-400" />
              Run a Sovereign Validator on your VPS
            </h4>
            <p className="text-xs text-slate-300">
              Download the Docker Compose template and execute <code className="text-emerald-300">docker compose up -d</code> on any Ubuntu VPS.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadDockerCompose}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all"
          >
            <Download size={13} />
            Download Docker Template
          </button>
        </div>
      </Card>
    </PageShell>
  );
}
