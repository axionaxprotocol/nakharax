# Testnet production readiness (automated)

**UTC:** 2026-05-20T13:29:10.731929+00:00
**Overall:** FAIL

Criteria: **validators** height/hash among themselves; **public RPC** tip lag vs validators; **faucet** HTTP; all **chainId** match.

## Checks

| OK | Check | Detail |
|----|-------|--------|
| yes | eth_chainId http://217.216.109.5:8545 | match |
| yes | eth_chainId http://46.250.244.4:8545 | match |
| yes | eth_chainId https://rpc.axionax.org | match |
| yes | eth_blockNumber http://217.216.109.5:8545 | height=556529 |
| yes | eth_blockNumber http://46.250.244.4:8545 | height=556529 |
| yes | eth_blockNumber https://rpc.axionax.org | height=556529 |
| yes | validators_height_consensus | min=556529 max=556529 diff=0 (max_allowed=25) |
| yes | validators_block_hash @0x87df1 | all match |
| yes | public_rpc_tip_lag | public=556529 validator_min=556529 validator_max=556529 lag_behind_max_tip=0 (max_allowed=40) |
| yes | full_stack_block_hash @0x87df1 | validators+public match |
| no | faucet_http https://faucet.axionax.org | status=502 |

## Manual follow-up

See [docs/TESTNET_PRODUCTION_READINESS.md](../docs/TESTNET_PRODUCTION_READINESS.md) and [TESTNET_OPTIMIZATION_CHECKLIST.md](../docs/TESTNET_OPTIMIZATION_CHECKLIST.md).
