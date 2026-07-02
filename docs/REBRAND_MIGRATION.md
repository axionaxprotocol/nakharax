# Rebrand migration runbook — Axionax → nakharaxx.io

> Companion to [README → Naming & rebrand](../README.md#naming--rebrand). This is the **executable
> plan** for renaming code identifiers, env vars, the binary, the domain, and the token. It exists
> because a blanket find-replace would break the building workspace **and** the live testnet.
>
> Generated 2026-06-16 from a precise inventory (`axionax` = 784+ refs across 186 files).

## ✅ Status (2026-06-16): in-repo rename COMPLETE

All categories below (A–D) have been executed in the repository and verified green
(`cargo test --workspace`, `pytest` deai 30/2, frontend typecheck). The tables below are kept as
the historical plan. **What remains is external/coordinated, not a repo edit:**

- Rename the **GitHub repo/org** so `github.com/...` URLs resolve.
- Stand up **`nakharaxx.io` DNS + SSL**, then **redeploy** nodes from this renamed tree (the live
  VPS still serve `axionax.org` and read the old env-var names until redeployed).
- Regenerate build artifacts that can't be text-renamed: `README.pdf`, the bridge
  `nakharax_python.so` (rebuild PyO3), and the two `package-lock.json` (`npm install`).

## Risk categories

| Cat | Meaning | Action |
|---|---|---|
| **A — Safe / internal** | No live coupling; verifiable by rebuild/test in-repo | Rename now, gate on green tests |
| **B — Frontend internal** | Workspace-internal but needs `pnpm` relink + build to verify | Rename + `pnpm build`, then redeploy dashboard |
| **C — Deploy-coupled** | Read by running nodes / VPS / containers; repo-only change desyncs prod | Coordinated cut-over **with** server access |
| **D — On-chain** | Token symbol baked into contract/genesis | Token phase (testnet reset or migration) |

---

## A — Safe / internal

| Item | From → To | Refs | Status |
|---|---|---|---|
| Rust root workspace package | `axionax-core` → `nakharax-core` | `services/core/core/Cargo.toml` (no crate depends on it) | ✅ **done 2026-06-16, `cargo test --workspace` green** |
| Network-advertised identity strings | `"axionax-core"` → `"nakharax-core"` | `rpc/src/server.rs:143`, `rpc/src/lib.rs:666`, `network/src/behaviour.rs:83` (libp2p agent_version + RPC client name) | ⏳ functionally safe (informational, not used for peer filtering) — flip with the next node redeploy for a consistent network identity |
| Repo metadata URL | `github.com/.../axionax-core` | `Cargo.toml:92` | ⏳ flip when the GitHub repo itself is renamed (external) |

## B — Frontend internal (verify with pnpm)

| Item | From → To | Refs |
|---|---|---|
| SDK package | `@axionax/sdk` → `@nakharax/sdk` | `packages/sdk/package.json`, `apps/os-dashboard/package.json` (dep), `apps/os-dashboard/next.config.js` (transpilePackages), `src/lib/{activity-feed,log-seed,rpc}.ts`, `src/app/activity/page.tsx`, README (8 refs) |
| Dashboard package | `axionax-os-dashboard` → `nakharax-os-dashboard` | `apps/os-dashboard/package.json`, `pnpm --filter ...` in docs/scripts |

**Verify:** `pnpm install` (relink workspace) → `pnpm --filter @nakharax/sdk typecheck` → `pnpm --filter nakharax-os-dashboard build`. Only commit when all green.

## C — Deploy-coupled (need server access; do NOT change repo alone)

| Item | From → To | Why coupled |
|---|---|---|
| Node binary | `axionax-node` → `nakharax-node` | `docker-compose.yml` (container_name + build target), systemd units, deploy scripts, `/var/lib/axionax-node`, docs |
| **Env vars (13)** | `AXIONAX_*` → `NAKHARAX_*` | Set in VPS `.env` / worker configs. Renaming code-only breaks running nodes. |
| Live RPC/domain | `*.axionax.org` → `*.nakharaxx.io` | DNS/SSL on live VPS; SDK `DEFAULT_NODES`, nginx, configs |
| PyO3 bridge | `axionax-python` / `import axionax_python` | Built `.so` name; Python import in `bridge/` + tests |
| Log target / paths / containers | `axionax=debug`, `/var/lib/axionax-node`, container names | systemd, docker, runbooks on VPS |

**Env-var strategy (zero-downtime):** ship a release that reads `NAKHARAX_*` **with fallback to**
`AXIONAX_*`; deploy to all nodes; update VPS `.env` to `NAKHARAX_*`; drop the fallback in a later
release. The full env-var list:

```
AXIONAX_VALIDATOR_ADDRESS  AXIONAX_BOOTSTRAP_NODES   AXIONAX_EXTERNAL_ADDRS
AXIONAX_PUBLIC_IP          AXIONAX_RPC_CORS_ORIGINS  AXIONAX_RPC_RATE_LIMIT
AXIONAX_MARKETPLACE_ADDRESS AXIONAX_ABI_PATH         AXIONAX_CHAIN_ID
AXIONAX_RPC_URL            AXIONAX_BOOTNODES         AXIONAX_ENV   AXIONAX_WALLET_PATH
```

## D — On-chain (token phase)

| Item | From → To | Refs |
|---|---|---|
| Token symbol | `AXX` → `NAK` | `contracts/MockAXXToken.sol`, genesis JSON, `docs/architecture/TOKENOMICS*.md`, dashboard token config |
| Block reward / stake displays | `1.0 AXX` → `1.0 NAK` etc. | README key-constants, docs |

Testnet (chain 86137) uses `AXXt`. The symbol is cosmetic on the mock token but baked into
genesis allocations — flip during a **testnet reset** or a token-migration contract.

---

## Recommended cut-over order

1. ✅ Brand layer (README, North Star) — done.
2. ✅ Cat A: Rust root package — done & verified.
3. Cat B: frontend rename → `pnpm build` green → redeploy dashboard.
4. Cat C: env-var dual-read shim → deploy → switch VPS `.env` → drop fallback.
5. Cat C: binary + paths + container names → coordinated node redeploy.
6. Cat C: domain — stand up `nakharaxx.io` DNS/SSL alongside `axionax.org`, switch `DEFAULT_NODES` +
   nginx, keep a redirect.
7. Cat D: token `AXX → NAK` at the next testnet reset.

Use `scripts/rebrand-rename.ps1` (dry-run by default) to preview/apply each category. **Never run
`-Execute` on a Cat C/D scope without the corresponding server change staged.**
