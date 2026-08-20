import { KeyRound, ShieldCheck, Wallet } from "lucide-react";

import {
  Card,
  IconBadge,
  PageShell,
  SectionHeader,
  StatusPill,
} from "@/components/card";
import { OErrorBoundary } from "@/components/error-boundary";
import { WalletActions } from "@/components/wallet-actions";

export const dynamic = "force-dynamic";

export default function WalletPage() {
  return (
      <PageShell
        eyebrow="Vault"
      title="Inspect testnet balances and execute raw transfers."
      description="The wallet view reads the configured RPC balance when available. Key management is strictly kept local on-device without third-party key storage."
      meta={
        <>
          <StatusPill tone="chain">testnet vault</StatusPill>
          <StatusPill tone="ai">local keypair</StatusPill>
        </>
      }
    >
      <OErrorBoundary moduleName="WALLET_ACTIONS">
        <WalletActions />
      </OErrorBoundary>

      <div className="grid gap-os-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-start gap-os-4">
            <IconBadge Icon={KeyRound} tone="ai" className="h-12 w-12" />
            <div>
              <SectionHeader
                title="Keys stay on device"
                description="Create/import keystore support is not shown until it is wired. Until then, this page only exposes the configured dev burner account and demo transfer flow."
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-os-4">
            <IconBadge Icon={ShieldCheck} tone="chain" className="h-12 w-12" />
            <div>
              <h2 className="text-title font-semibold text-[var(--text-strong)]">
                Security checklist
              </h2>
              <ul className="mt-os-3 space-y-os-2 text-body text-[var(--text-muted)]">
                <ChecklistItem>Back up keystore JSON offline.</ChecklistItem>
                <ChecklistItem>Never share wallet password or burner keys.</ChecklistItem>
                <ChecklistItem>Use VPN or private networking before exposing RPC publicly.</ChecklistItem>
                <ChecklistItem>Rotate keys after suspected compromise.</ChecklistItem>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-os-2">
      <Wallet size={14} className="mt-0.5 shrink-0 text-[var(--accent-ai)]" />
      <span>{children}</span>
    </li>
  );
}
