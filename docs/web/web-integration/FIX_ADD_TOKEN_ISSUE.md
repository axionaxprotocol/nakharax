# 🔧 Fix Specification: MetaMask Token Registration Integration (`wallet_watchAsset`)

## Issue Summary

Users encountered failures when attempting to register $NAK tokens on MetaMask via `wallet_watchAsset` UI prompts.

## Root Cause Analysis

### Identified Failure Modes:

1. **Inconsistent Configuration Schema**
   - The deployment script (`deploy_token.js`) emitted `config.json` with an `erc20` object schema:
     ```json
     {
       "erc20": {
         "symbol": "NAK",
         "address": "0x...",
         "decimals": 18
       }
     }
     ```
   - However, legacy UI scripts expected `cfg.erc20` as a raw address string.

2. **Insufficient Ingress Exception Handling**
   - Lack of session status validation prior to invoking `wallet_watchAsset`.
   - Missing handling for user cancellation responses.

---

## Technical Remediation Specs

### 1. ✅ Universal Config Parsing (`index.html`)

**Affected Targets:**
- `/services/core/ops/deploy/environments/testnet/Nakharax_v1.6_Testnet_in_a_Box/ui/index.html`
- `/services/core/ops/deploy/environments/testnet/Nakharax_v1.5_Testnet_in_a_Box/ui/index.html`

```javascript
// Supports both Object schema and raw String address formats
const erc20Addr =
  typeof cfg.erc20 === 'object' && cfg.erc20?.address
    ? cfg.erc20.address
    : typeof cfg.erc20 === 'string'
      ? cfg.erc20
      : null;
const erc20Symbol = typeof cfg.erc20 === 'object' && cfg.erc20?.symbol ? cfg.erc20.symbol : 'NAK';
const erc20Decimals =
  typeof cfg.erc20 === 'object' && cfg.erc20?.decimals ? cfg.erc20.decimals : 18;

CFG = {
  erc20: erc20Addr,
  erc20Symbol: erc20Symbol,
  erc20Decimals: erc20Decimals,
};
```

### 2. ✅ Robust `wallet_watchAsset` Handler

```javascript
async function addToken() {
  try {
    if (!CFG?.erc20) throw new Error('ERC20 contract address undefined in config.json');
    if (!window.ethereum) throw new Error('MetaMask web3 provider unavailable');

    const tokenAddress = CFG.erc20;
    const tokenSymbol = CFG.erc20Symbol || 'NAK';
    const tokenDecimals = CFG.erc20Decimals || 18;

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
      console.log(`[ok] Added token ${tokenSymbol} to MetaMask ✅`);
    } else {
      console.warn('[warn] User rejected watchAsset prompt');
    }
  } catch (e) {
    console.error('Add token exception:', e);
  }
}
```

### 3. ✅ Web3 Library Helper Export

**File:** `apps/web/src/lib/web3.ts`

```typescript
export interface AddTokenParams {
  address: string;
  symbol: string;
  decimals: number;
  image?: string;
}

export const addTokenToMetaMask = async (params: AddTokenParams): Promise<boolean> => {
  if (!window.ethereum) {
    throw new Error('MetaMask provider is not installed');
  }

  try {
    const wasAdded = (await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: params.address,
          symbol: params.symbol,
          decimals: params.decimals,
          image: params.image,
        },
      },
    })) as boolean;

    return wasAdded;
  } catch (error) {
    console.error('Error executing watchAsset:', error);
    throw error;
  }
};
```

---

## Verification & Audit Checklist

- [x] Verify configuration parser supports both Object and String schemas.
- [x] Validate error handling when MetaMask provider is absent.
- [x] Verify user cancellation (`wasAdded === false`) returns clean feedback.
- [x] Verify `wallet_watchAsset` successfully registers NAK on Chain ID `86137`.

---

**Fixed By:** Lead Protocol Architect  
**Specification Version:** v1.0.0
