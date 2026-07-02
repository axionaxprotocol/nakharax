# Testnet production readiness (automated)

**UTC:** 2026-05-27T14:18:39.011306+00:00
**Overall:** FAIL

Criteria: **validators** height/hash among themselves; **public RPC** tip lag vs validators; **faucet** HTTP; all **chainId** match.

## Checks

| OK | Check | Detail |
|----|-------|--------|
| no | eth_chainId https://rpc.nakharax.io | expected 0x15079, got '' err="HTTPSConnectionPool(host='rpc.nakharax.io', port=443): Max retries exceeded with url: / (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self-signed certificate (_ssl.c:1032)')))" |
| no | eth_chainId https://rpc-au.nakharax.io | expected 0x15079, got '' err='HTTPSConnectionPool(host=\'rpc-au.nakharax.io\', port=443): Max retries exceeded with url: / (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x0000025A88B796D0>: Failed to resolve \'rpc-au.nakharax.io\' ([Errno 11001] getaddrinfo failed)"))' |
| no | eth_blockNumber https://rpc.nakharax.io | fail HTTPSConnectionPool(host='rpc.nakharax.io', port=443): Max retries exceeded with url: / (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self-signed certificate (_ssl.c:1032)'))) |
| no | eth_blockNumber https://rpc-au.nakharax.io | fail HTTPSConnectionPool(host='rpc-au.nakharax.io', port=443): Max retries exceeded with url: / (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x0000025A88B7A990>: Failed to resolve 'rpc-au.nakharax.io' ([Errno 11001] getaddrinfo failed)")) |
| no | validators_height_consensus | one or more endpoints failed eth_blockNumber |
| no | faucet_http https://faucet.nakharax.io | HTTPSConnectionPool(host='faucet.nakharax.io', port=443): Max retries exceeded with url: / (Caused by SSLError(SSLCertVerificationError(1, '[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self-signed certificate (_ssl.c:1032)'))) |

## Manual follow-up

See [docs/TESTNET_PRODUCTION_READINESS.md](../docs/TESTNET_PRODUCTION_READINESS.md) and [TESTNET_OPTIMIZATION_CHECKLIST.md](../docs/TESTNET_OPTIMIZATION_CHECKLIST.md).
