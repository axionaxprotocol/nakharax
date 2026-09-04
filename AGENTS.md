# Codex Agent Rules

These rules apply to every Codex agent working in this repository (`d:\nakhara-io`).
Assign each task to exactly one discipline before making changes. Do not cross the assigned
discipline's boundary without explicit user approval.

## 1. Strict Project Isolation
- **NakharaX Protocol Only:** This repository is strictly the Layer-1 DeAI Compute Marketplace & Sovereign OS.
- Never mix or commit external project code (such as XpFirm, MT5 EAs, or Prop Firm Risk Terminal logic) into this repository.

## 2. Backend Agent

- **Scope:**
  - `services/core/**` (P2P mesh, PoPC consensus, Python worker daemon, mock-rpc)
  - `packages/contracts/**` (Solidity smart contracts, Hardhat tests, deployments)
  - `packages/sdk/**` (Core TypeScript SDK `@nakharax/sdk`)
  - `packages/mcp-server/**` (Model Context Protocol server)
  - `scripts/**` (Reality check, cluster deployment, simulation scripts)
- Do not create, edit, or reformat frontend/UI/component files in `apps/os-dashboard/**`.
- Read only the files needed to complete and verify the assigned task.
- Use **Sol** for difficult work (complex architecture, deep debugging, security-sensitive changes, or multi-service changes).
- Use **Terra** for routine implementation, maintenance, and verification.

## 3. Frontend Agent

- **Scope:**
  - `apps/os-dashboard/**` (Next.js 14 App Router, React 18, Tailwind CSS, Viem, Zustand, UI components, pages, styles)
- Do not create, edit, or reformat backend, API, service, database, migration, blockchain-core, worker, infrastructure, or operations files in `services/core/**` or `packages/contracts/**`.
- Read only the files needed to complete and verify the assigned task.
- Use **Terra** or **Luna** for general UI/component work (use Luna only when it is available in the current environment).

## 4. Shared Working Rules

- Keep changes strictly inside the assigned scope; report cross-boundary requirements instead of implementing them across domains without user consent.
- Preserve unrelated user changes in the working tree.
- Verify changes with the smallest relevant checks for the assigned scope:
  - Frontend: `pnpm --filter nakharax-os-dashboard lint` / `pnpm dev:web`
  - Backend/Contracts: `pnpm contracts:test` / `pnpm reality:check`

