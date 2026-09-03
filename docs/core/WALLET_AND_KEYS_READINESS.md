# Sovereign Key Management & Wallet Readiness Specification

This document summarizes key management readiness, private key storage paradigms, and P2P cryptographic identities across the **NakharaX Protocol Core Infrastructure**.

---

## Executive Summary Matrix

| Infrastructure Domain | Private Key Storage | Public Identity Paradigm | Operational Status |
|---|---|---|---|
| **DeAI Compute Worker** | ✅ EVM Private Key | ✅ EVM Wallet Address (`0x...`) | **PRODUCTION READY** (`wallet_manager.py`) |
| **Faucet Treasury** | ✅ Faucet Private Key | ✅ Treasury Address (`0x...`) | **PRODUCTION READY** (`generate-faucet-key.py`) |
| **Validator Node (P2P Mesh)** | ✅ Libp2p Ed25519 Key | ✅ PeerId | **PRODUCTION READY** (`--identity-key`) |

---

## 1. DeAI Compute Worker Subsystem

- **Module Target:** `services/core/core/deai/wallet_manager.py`
- **Key Schema:** EVM-compatible secp256k1 key pairs (via `eth_account`).
- **Private Key Storage Paradigms:**
  - **Option 1 (Environment Ingress):** `WORKER_PRIVATE_KEY=0x...`
  - **Option 2 (Encrypted Keystore Vault):** AES-128-CTR + scrypt encrypted JSON keystores.
  - **Option 3 (Runtime Keystore Generation):** Programmatic keystore creation during worker setup.

---

## 2. Faucet Treasury Subsystem

- **Script Target:** `services/core/scripts/generate-faucet-key.py`
- **Key source:** Uses fresh CSPRNG Ed25519 entropy or the faucet key from the offline sovereign master wallet.
- **No deterministic faucet seed:** `--testnet` is retired to prevent a publicly derivable faucet private key.

```bash
python services/core/scripts/generate-faucet-key.py --env-file /secure/faucet.env
python services/core/scripts/generate-faucet-key.py \
  --from-master-wallet /secure/master_wallet_secrets.json \
  --env-file /secure/faucet.env
```

---

## 3. Validator Node P2P Swarm Identity

- **P2P Identity Schema:** Libp2p Ed25519 keypairs producing deterministic **PeerIds**.
- **Persistence Mechanism:** Programmatically loaded via the `--identity-key` CLI flag:

```bash
./target/release/nakharax-node --role validator \
  --chain-id 86137 \
  --rpc 0.0.0.0:8545 \
  --identity-key /var/lib/nakharax-node/identity.key
```

If `/var/lib/nakharax-node/identity.key` does not exist on initial start, the node generates a new Ed25519 key pair, serializes it to Protobuf format, and sets file permissions to `0o600` (Unix).

---

## 4. Wallet State Settlement & Balance Workflow

1. **Genesis Initialization:** Upon initialization, initial balances are seeded directly from `genesis.json` (`seed_genesis_balances`).
2. **State Querying:** `eth_getBalance(address)` and `eth_getTransactionCount(address)` read directly from the RocksDB state trie (`CHAIN_STATE`).
3. **Transaction Execution:** `eth_sendRawTransaction` submits signed raw transactions to the mempool, updating state trie balances deterministically.

---

*Certified & Maintained by Lead Cryptographic Architect: August 2026*
