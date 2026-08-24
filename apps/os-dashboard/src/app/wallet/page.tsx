import {
  Coins,
  Cpu,
  FileCheck2,
  KeyRound,
  Layers,
  Lock,
  Shield,
  ShieldCheck,
  Vault,
  Wallet,
  Zap,
} from "lucide-react";

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
      eyebrow="Institutional Web3 Treasury"
      title="Sovereign Asset Vault & Cryptographic Keystore Terminal"
      description="Multi-asset treasury management, EIP-1559 gas station, PoPC consensus staking desk (8.4% APY), and AES-256 air-gapped keystore generator."
      meta={
        <>
          <StatusPill tone="chain" pulse>Chain ID: 86137</StatusPill>
          <StatusPill tone="ai">Gas: 1.2 Gwei (EIP-1559)</StatusPill>
          <StatusPill tone="violet">AES-256 Air-Gapped Vault</StatusPill>
        </>
      }
    >
      <OErrorBoundary moduleName="WALLET_ACTIONS">
        <WalletActions />
      </OErrorBoundary>

      {/* Institutional Security & Custody Matrix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-white/10 bg-slate-950/80 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <KeyRound size={20} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Zero-Custody Standard</h3>
              <p className="text-[11px] text-slate-400">Local entropy & memory-only keys</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Cryptographic private keys never leave local browser memory and are wiped upon tab closure unless saved into encrypted local storage.
          </p>
        </Card>

        <Card className="border-white/10 bg-slate-950/80 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <Layers size={20} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">PoPC Staking Yield</h3>
              <p className="text-[11px] text-slate-400">8.4% APY Liquid Consensus Staking</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Mint liquid $sNAK by staking native gas tokens. Yield is distributed automatically per 3.0-second block via verifiable PoPC proofs.
          </p>
        </Card>

        <Card className="border-white/10 bg-slate-950/80 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400">
              <FileCheck2 size={20} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">EIP-1559 Dynamic Burn</h3>
              <p className="text-[11px] text-slate-400">Deterministic transaction finality</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Base fee of 1.2 Gwei is algorithmically adjusted and burned every block, providing deflationary tokenomics for the 1 Trillion $NAK cap.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
