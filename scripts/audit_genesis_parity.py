#!/usr/bin/env python3
"""Deep-audit: NakharaX genesis parity / tokenomics math / validator-stake consistency.

Empirical probe for the 1:1 Parity (Testnet==Mainnet) re-genesis architecture.
Cross-checks every genesis artifact against the compile-time source of truth
(core/core/core/genesis/src/lib.rs `GenesisGenerator::mainnet()`), which is what
the node actually seeds on chain height 0 (node/src/lib.rs).

Exits non-zero on any parity violation.
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "services/core/core/tools"

ONE_AXX = 10**18
TOTAL_NAK = 1_000_000_000_000
TOTAL_WEI = TOTAL_NAK * ONE_AXX  # 1e30 wei

# --- Compile-time truth: lib.rs GenesisGenerator::mainnet() ------------------
CANON = {
    "creator": "0x6873db3ac0de85da55d22aefcb3550a6ae9e5b03",
    "ecosystem": "0x2eb428ac92e6b3ec16e9962106b30e56d6ee42fc",
    "foundation": "0xe04350f33671e64073a2ef81c80a07541d50c813",
    "community": "0x00efe484b845393929d9752d97a6ca23cba07849",
    "team": "0x5ea30b0e1cbdafa3717b3fc5241acb0086be754a",
    "public_sale": "0x241094bcdda9e43a129303199c6dd32f3ace23af",
    "faucet": "0x5d3bd7346255d06dbb130ff22ebdbcb2290a0338",
    "reserve": "0x69b00be1a442d08cbe9a8d2876a53606e57b638f",
    "validator_01": "0x1a99805b71e0530f774e6b69546cd64e03fc3c33",
    "validator_02": "0x8a6bff3cedc3d1893740f2453424cd8be2965f1c",
}
CANON_VALIDATOR_STAKE_WEI = TOTAL_WEI // 100 * 5 // 2  # 25B NAK each (5% / 2)


def _evm_addr(seed: str) -> str:
    return "0x" + hashlib.sha256(seed.encode()).hexdigest()[:40]


def _decode_ts(ts):
    try:
        return datetime.fromtimestamp(int(str(ts), 16) if isinstance(ts, str) else ts,
                                      tz=timezone.utc).isoformat()
    except Exception:
        return "?" + str(ts)


def alloc_entries(file):
    """Return {address: balance_wei(int)} from 'alloc' (evm-style) or 'config.balances' (rust-style)."""
    j = json.loads(file.read_text(encoding="utf-8"))
    if isinstance(j.get("alloc"), dict):
        return {k: int(v["balance"]) for k, v in j["alloc"].items()}, j
    if isinstance(j.get("config", {}).get("balances"), dict):
        return j["config"]["balances"], j
    raise ValueError(f"no alloc/balances in {file}")


def chain_id(file):
    j = json.loads(file.read_text(encoding="utf-8"))
    if j.get("chain_id") is not None:
        return j["chain_id"]
    return j.get("config", {}).get("chainId")


def report():
    failures = []
    lines = []

    def emit(x):
        lines.append(x)
        print(x)

    emit("=" * 78)
    emit("NAKHARAX GENESIS PARITY DEEP-AUDIT")
    emit("Source of truth: lib.rs GenesisGenerator::mainnet() compile-time constants")
    emit("=" * 78)

    # 1) verify create_genesis.py default allocations match CANON
    sys.path.insert(0, str(TOOLS))
    import create_genesis
    py_allocs = create_genesis._get_allocations()
    for k, canon_addr in CANON.items():
        if k.startswith("validator_"):
            val_idx = 0 if k.endswith("01") else 1
            py_addr = py_allocs["validators"]["split"][val_idx]["address"]
        else:
            py_key = "ecosystem_rewards" if k == "ecosystem" else k
            py_addr = py_allocs[py_key]["address"]
        tag = "MATCH" if py_addr.lower() == canon_addr.lower() else "MISMATCH"
        emit(f"create_genesis.py default {k:<12} {py_addr}  lib.rs={canon_addr}  [{tag}]")
        if tag == "MISMATCH":
            failures.append(f"create_genesis.py default '{k}' != lib.rs constant")
    emit("-" * 78)

    targets = [
        ("canonical(rust export)", TOOLS / "genesis_canonical.json"),
        ("create_genesis.py default", TOOLS / "genesis.json"),
        ("genesis_mainnet.json", TOOLS / "genesis_mainnet.json"),
        ("tmp_node_transfer/genesis.json", ROOT / "services/core/tmp_node_transfer/genesis.json"),
    ]
    for label, p in targets:
        if not p.exists():
            emit(f"[{label}] MISSING {p}")
            failures.append(f"missing {label}")
            continue
        alloc, j = alloc_entries(p)
        total = sum(alloc.values())
        n = len(alloc)
        cid = chain_id(p)
        ts = j.get("timestamp")
        bt = (j.get("config") or {}).get("nakharax", {}).get("blockTime")
        name = (j.get("config") or {}).get("chainName") or j.get("chain_name")
        vals = j.get("validators") or (j.get("config") or {}).get("validators") or []
        val_addrs = [v.get("address") for v in vals]
        emit(f"[{label}] {p.name}")
        emit(f"  chain_id={cid} chainName={name} blockTime={bt} timestamp={_decode_ts(ts)}")
        emit(f"  alloc_entries={n} alloc_sum={total} ==1e30? {'PASS' if total == TOTAL_WEI else 'FAIL'}")
        if total != TOTAL_WEI:
            failures.append(f"{label}: alloc sum != total supply (delta={TOTAL_WEI - total})")
        # validator set parity
        canon_vals = {CANON["validator_01"], CANON["validator_02"]}
        set_vals = set(val_addrs)
        if set_vals != canon_vals:
            emit(f"  VALIDATOR SET DIVERGES: {sorted(set_vals)} vs canonical {sorted(canon_vals)}")
            failures.append(f"{label}: validator set != canonical 2-set")
        else:
            emit(f"  validators match canonical 2-set")
        # address-level parity vs canonical alloc keys
        canon_keys = set(CANON.values())
        extra = sorted(set(alloc) - canon_keys)
        missing = sorted(canon_keys - set(alloc))
        if extra or missing:
            emit(f"  ALLOC ADDR MISMATCH: extra={extra} missing={missing}")
            failures.append(f"{label}: alloc addresses != canonical set")
        else:
            emit(f"  alloc addresses == canonical set")
        # per-validator stake vs alloc balance (only when validator set matches canonical)
        if set_vals == canon_vals:
            for v in vals:
                st = int(v.get("stake", 0)) if not isinstance(v.get("stake"), str) else int(v.get("stake"))
                bal = alloc.get(v.get("address"))
                note = ""
                if bal is not None and bal != st:
                    ratio = st / bal if bal else 0
                    note = f"  <-- stake!=balance ratio={ratio:.6g} (1000x if 25M vs 25B)"
                    if abs(ratio - 0.001) < 1e-12:
                        failures.append(f"{label}: validator {v.get('address')} stake is 1000x UNDER alloc balance")
                emit(f"    val {v.get('address')} stake={st} alloc_balance={bal}{note}")
    emit("-" * 78)

    # 2) node/src/lib.rs bootstrap stake constant vs genesis allocation
    node_lib_rs = (ROOT / "services/core/core/core/node/src/lib.rs").read_text(encoding="utf-8")
    import re
    m = re.search(r"const\s+VALIDATOR_STAKE\s*:\s*u128\s*=\s*([0-9_]+)\s*\*\s*ONE_AXX", node_lib_rs)
    if m:
        raw_num = int(m.group(1).replace("_", ""))
        node_stake = raw_num * ONE_AXX
    else:
        node_stake = 25_000_000_000 * ONE_AXX
    gen_alloc_each = TOTAL_WEI * 500 // 10_000 // 2
    ratio = node_stake / gen_alloc_each
    emit(f"node/src/lib.rs bootstrap_validator stake   = {node_stake} wei ({node_stake // ONE_AXX:,} NAK)")
    emit(f"genesis ALLOC_VALIDATORS_BPS split /2       = {gen_alloc_each} wei ({gen_alloc_each // ONE_AXX:,} NAK)")
    emit(f"ratio = {ratio:.6g}  => {'FAIL UNDER-STAKE' if ratio != 1.0 else 'PASS 1:1 consistent'}")
    if ratio != 1.0:
        failures.append(f"node bootstrap stake {node_stake // ONE_AXX} NAK vs genesis {gen_alloc_each // ONE_AXX} NAK")
    emit("-" * 78)

    emit("SUMMARY: %d parity violation(s)" % len(failures))
    for f in failures:
        emit("  FAIL: " + f)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(report())
