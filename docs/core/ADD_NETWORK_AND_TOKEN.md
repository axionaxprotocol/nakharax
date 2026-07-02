# Add Nakharax Network and NAK Token in MetaMask and Other Wallets

How to add **Nakharax Testnet** and the **NAK** token in MetaMask, Rabby, Coinbase Wallet, and similar wallets.

**Web UI guide (with Add Token button):** [nakharax → Add Token to MetaMask](https://github.com/nakharax-io/nakharax/blob/main/apps/docs/ADD_TOKEN_TO_METAMASK.md)

---

## Network parameters (Testnet)

| Item | Value |
|------|-------|
| **Network name** | Nakharax Testnet |
| **RPC URL** | `https://rpc.nakharax.io` (or `http://217.216.109.5:8545` / `http://46.250.244.4:8545`) |
| **Chain ID** | `86137` |
| **Currency symbol** | NAK |
| **Decimals** | 18 |
| **Block explorer** | https://explorer.nakharax.io |

---

## 1. MetaMask

### Add network (Custom Network)

1. Open **MetaMask** → click the network dropdown (top) → **Add network** or **Add a network manually**.
2. Enter:

   | Field | Value |
   |-------|-------|
   | **Network name** | `Nakharax Testnet` |
   | **RPC URL** | `https://rpc.nakharax.io` |
   | **Chain ID** | `86137` |
   | **Currency symbol** | `NAK` |
   | **Block explorer URL** | Leave blank or set when available |

3. Click **Save** and switch to **Nakharax Testnet**.

After adding the network, **native NAK** appears in the wallet automatically; no separate "Import token" is required for the native token.

### Adding an ERC-20 token (separate contract)

If you have another ERC-20 contract (e.g. a test token) to show in MetaMask:

1. Ensure the network is **Nakharax Testnet**.
2. Click **Import tokens** (or **Add token**) at the bottom.
3. Enter the **Token contract address** from the team or docs.
4. MetaMask will fill **Token symbol** and **Decimals** if the contract is standard; otherwise set them (e.g. Symbol `TEST`, Decimals `18`).
5. Click **Add custom token**.

---

## 2. Other wallets (Rabby, Coinbase Wallet, Frame, etc.)

Same idea: add a **Custom network / Custom RPC** with the parameters above.

- **Rabby:** Settings → Network → Add a custom network  
- **Coinbase Wallet:** Settings → Networks → Add custom network  
- **Frame:** Settings → Networks → Add network  
- **WalletConnect-compatible:** Most have "Add network" / "Custom RPC" — use the same values.

| Field | Value |
|-------|-------|
| Network name | Nakharax Testnet |
| RPC URL | `https://rpc.nakharax.io` |
| Chain ID | `86137` |
| Symbol | NAK |

**Native NAK** is shown when this network is selected; no separate token import is needed.

---

## 3. Receive NAK Testnet (Claim from Faucet)

A zero balance is resolved by **receiving from the Faucet** only. The "Add funds" button in MetaMask is for buying with fiat, not for testnet tokens.

### Option 1: Web Faucet (recommended)

1. Open the **official Faucet** (from [nakharax](https://github.com/nakharax-io/nakharax)):
   - **https://faucet.nakharax.io**
2. **Copy your wallet address** from MetaMask (click "Account 1" or the address at the top → Copy).
3. Paste the address into the Faucet page → click Request / Claim.
4. Wait a moment (typically 100 NAK per request; 24h cooldown per address).

### Option 2: Faucet API (when a Faucet is running)

If a Faucet is running at the given URL (e.g. `https://faucet.nakharax.io`):

```bash
# Replace 0xYOUR_METAMASK_ADDRESS with your address from MetaMask
curl -X POST https://faucet.nakharax.io/request \
  -H "Content-Type: application/json" \
  -d '{"address": "0xYOUR_METAMASK_ADDRESS"}'
```

A successful response includes `"success": true` and `tx_hash`; the NAK balance in MetaMask should update shortly (refresh if needed).

### If claim fails or no tokens appear

| Cause | Action |
|-------|--------|
| **Faucet web not available or URL changed** | Check [nakharax.io](https://nakharax.io), Discord, or GitHub for the current Faucet URL |
| **Invalid address** | Must be EVM format: `0x` + 40 hex characters (42 total) — copy directly from MetaMask |
| **24h cooldown** | Faucet limits one request per address per 24h — wait or use another address |
| **Faucet out of funds** | Contact the team/community to refill the Faucet |
| **RPC mismatch** | MetaMask must use **Nakharax Testnet** (Chain ID 86137) and the RPC specified by the team (e.g. `http://217.216.109.5:8545`) |

---

## 4. Summary

| Goal | Method |
|------|--------|
| **See NAK in MetaMask/wallet** | Add Nakharax Testnet (RPC + Chain ID 86137 + symbol NAK) → native NAK appears automatically |
| **See another ERC-20 token** | On Nakharax Testnet → Import token with contract address |
| **Mainnet (future)** | Chain ID will be `86150` — same add-network steps with the announced Chain ID and RPC |

---

*Updated from README and genesis: Chain ID 86137, symbol NAK, decimals 18.*
