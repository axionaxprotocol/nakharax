# Testnet production readiness (automated)

**UTC:** 2026-08-24T08:50:55.463886+00:00
**Overall:** FAIL

Criteria: **validators** height/hash among themselves; **public RPC** tip lag vs validators; **faucet** HTTP; all **chainId** match.

## Checks

| OK | Check | Detail |
|----|-------|--------|
| yes | eth_chainId http://127.0.0.1:8545 | match |
| no | eth_chainId https://rpc.nakharax.com | expected 0x15079, got '' err='HTTPSConnectionPool(host=\'rpc.nakharax.com\', port=443): Max retries exceeded with url: / (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x0000020F3BCFD400>: Failed to resolve \'rpc.nakharax.com\' ([Errno 11001] getaddrinfo failed)"))' |
| yes | eth_blockNumber http://127.0.0.1:8545 | height=1638 |
| no | eth_blockNumber https://rpc.nakharax.com | fail HTTPSConnectionPool(host='rpc.nakharax.com', port=443): Max retries exceeded with url: / (Caused by NameResolutionError("<urllib3.connection.HTTPSConnection object at 0x0000020F3BD00910>: Failed to resolve 'rpc.nakharax.com' ([Errno 11001] getaddrinfo failed)")) |
| yes | faucet_http | skipped |

## Manual follow-up

See [docs/TESTNET_PRODUCTION_READINESS.md](../docs/TESTNET_PRODUCTION_READINESS.md) and [TESTNET_OPTIMIZATION_CHECKLIST.md](../docs/TESTNET_OPTIMIZATION_CHECKLIST.md).
