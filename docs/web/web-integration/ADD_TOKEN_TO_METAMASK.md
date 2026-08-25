# How to Register & Add NAK Tokens on MetaMask 🦊

## Common Configuration Issues

If you experience issues registering NAK Tokens on MetaMask, verify the following configuration vectors:

### 1. ⚠️ Unverified Network Connection

**Remediation Steps:**

1. Open MetaMask.
2. Click the network selection dropdown at the top of the interface.
3. Click **"Add Network"** or **"Custom RPC"**.
4. Enter the following parameters:

```text
Network Name: NakharaX Testnet
RPC URL: https://rpc.nakharax.com
Chain ID: 86137
Currency Symbol: NAK
Block Explorer: https://explorer.nakharax.com
```

### 2. ⚠️ Incorrect Contract Address Specification

**Canonical Contract Address:**

```text
Mainnet Deployment Target: 0x0000000000000000000000000000000000001000
Testnet Deployment Target: Refer to deployed-contracts.json
```

### 3. ⚠️ Active Network Mismatch

**Remediation Steps:**

- Confirm your active wallet session is bound to NakharaX Testnet (`86137`).
- Assets are displayed exclusively when connected to the corresponding network.

---

## Manual Asset Import Workflow

### Step 1: Initialize MetaMask Interface
1. Click the MetaMask browser extension icon.
2. Confirm active connection to **NakharaX Testnet**.

### Step 2: Navigate to Import Panel
1. Scroll to the bottom of the **Assets** tab.
2. Click **"Import tokens"**.
3. Select the **"Custom Token"** tab.

### Step 3: Input Contract Specifications

```text
Token Contract Address: 0x0000000000000000000000000000000000001000
Token Symbol: NAK
Token Decimals: 18
```

4. Click **"Add Custom Token"**.
5. Click **"Import Tokens"** to confirm registration.

### ✅ Registration Complete

The $NAK asset token is now visible in your MetaMask asset portfolio.

---

## Automated Asset Import Workflow (Recommended)

### Via Web Interface
1. Connect your wallet at `https://nakharax.com`.
2. Click **"Connect Wallet"**.
3. Upon successful connection, open the wallet dropdown menu.
4. Click **"Add NAK Token"**.
5. Approve the `wallet_watchAsset` prompt in MetaMask.

---

## Developer Code Integration

### Programmatic EIP-747 Asset Addition (`wallet_watchAsset`)

```javascript
async function addNAKToken() {
  const tokenAddress = '0x0000000000000000000000000000000000001000';
  const tokenSymbol = 'NAK';
  const tokenDecimals = 18;

  try {
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
        },
      },
    });

    if (wasAdded) {
      console.log('✅ NAK Token added successfully!');
    } else {
      console.log('❌ User declined token addition');
    }
  } catch (error) {
    console.error('Error adding token:', error);
  }
}
```

### React & TypeScript Integration Pattern

```typescript
import { addTokenToMetaMask } from '@/lib/web3';

const handleAddToken = async () => {
  try {
    const wasAdded = await addTokenToMetaMask({
      address: '0x0000000000000000000000000000000000001000',
      symbol: 'NAK',
      decimals: 18,
    });

    if (wasAdded) {
      console.log('Token successfully registered!');
    }
  } catch (error) {
    console.error('MetaMask watchAsset error:', error);
  }
};
```

---

## Troubleshooting Guide

### ❌ "Invalid address" Exception
- **Root Cause:** Malformed contract address checksum or cross-chain address mismatch.
- **Resolution:** Verify address string against canonical contract deployment outputs.

### ❌ Zero Asset Visibility
- **Root Cause:** Wallet is connected to wrong chain ID or balance is 0.
- **Resolution:** Switch network to Chain ID `86137` and request test tokens from `https://faucet.nakharax.com`.

---

## Standard Specification References

- [MetaMask Developer Documentation](https://docs.metamask.io/)
- [EIP-747 Specification](https://eips.ethereum.org/EIPS/eip-747)
- [NakharaX Chain ID Configuration](./CHAIN_ID_CONFIGURATION.md)

---

**Last Updated:** April 2026  
**Synced Core Commit:** `nakharax@28f42cf`  
**Specification Version:** v1.1.0 (Genesis Public Testnet)
