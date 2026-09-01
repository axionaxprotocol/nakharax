# Mainnet Production Release Strategy — 1 January 2027

This document is the operational roadmap for NakharaX Production Mainnet. The target genesis date is **1 January 2027 (`2027-01-01`, 1 มกราคม 2570)**.

Public Testnet remains Chain ID `86137`. Mainnet is a separate chain with canonical Chain ID `86150` (`0x15086`); testnet genesis, validator keys, faucet keys, state, and Peer IDs must never be reused for Mainnet.

## Release gates

| Gate | Required evidence |
|---|---|
| Public Testnet stability | At least 30 consecutive days without an unexplained consensus halt |
| Recovery | Restore drill from backups and successful node resync |
| Security | Critical/high findings remediated and independently reviewed |
| Genesis | Mainnet-only manifest, allocations, validator set, timestamp, and published checksum approved |
| Keys | Fresh production validator keys in HSM/offline custody; documented quorum and recovery |
| Infrastructure | Production inventory, monitoring, alerts, incident ownership, and provider failure-domain review |
| Release | Immutable commit/tag and reproducible Linux binaries |

## Timeline

| Window | Milestone |
|---|---|
| 1 Sep-31 Oct 2026 | Stabilize Public Testnet; provision and soak the seven new VPS instances |
| Oct-Nov 2026 | External audit, remediation, recovery drills, and validator onboarding |
| 1-15 Dec 2026 | Freeze Mainnet protocol parameters and candidate validator set |
| 16-24 Dec 2026 | Generate Mainnet genesis candidate and perform independent checksum/key review |
| 25-30 Dec 2026 | Full dress rehearsal on an isolated network; publish operator package |
| 31 Dec 2026 | Final signed go/no-go; no feature changes |
| **1 Jan 2027** | Mainnet genesis, public RPC activation, monitoring, and incident watch |

## Mainnet parameters

| Parameter | Public Testnet | Production Mainnet |
|---|---|---|
| Chain ID | `86137` (`0x15079`) | `86150` (`0x15086`) |
| Genesis artifact | `genesis.json` | not generated yet; future `genesis_mainnet.json` |
| Validator keys | testnet-only | fresh production HSM/offline keys |
| Peer identities | seven new testnet VPS identities | fresh Mainnet identities |
| Faucet | enabled | disabled unless a separately approved policy exists |

## Go/no-go authority

The date is a target, not permission to bypass a failed release gate. Any unresolved critical/high security issue, unapproved genesis checksum, missing validator quorum, or failed dress rehearsal produces a no-go and a formally announced replacement date.
