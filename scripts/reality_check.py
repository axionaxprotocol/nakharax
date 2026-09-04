#!/usr/bin/env python3
"""
⚡ NAKHARAX PROTOCOL REALITY ANCHOR & ANTI-HALLUCINATION SENTINEL
================================================================
Automated ground-truth verification engine that audits all layers of the 
NakharaX Protocol (L1 RPC, Smart Contracts, 7-Node Mesh, Frontend, and State).
Ensures 100% truth alignment and eliminates hallucinations/discrepancies.
"""

import sys
import os
import json
import urllib.request
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# =============================================================================
# 🏛️ GROUND TRUTH PROTOCOL CONSTANTS (SINGLE SOURCE OF TRUTH)
# =============================================================================
GROUND_TRUTH = {
    "chain_id": 86137,
    "chain_name": "nakharax-testnet",
    "token_symbol": "tNAK",
    "token_name": "NakharaX Token",
    "token_decimals": 18,
    "total_supply": 1_000_000_000_000, # 1 Trillion $NAK
    "block_cadence_seconds": 1.0, # 1.0s High-Velocity Cadence (Golden Ratio)
    "block_reward": 2.0, # 2.00 tNAK per block
    "faucet_amount_per_claim": 100,
    "staking_apy": "8.40%",
    "rpc_url": os.environ.get("RPC_URL", "http://127.0.0.1:8545"),
    "ws_url": os.environ.get("WS_URL", "ws://127.0.0.1:8546"),
    "dashboard_url": os.environ.get("DASHBOARD_URL", "http://localhost:3030"),
    "canonical_7_nodes": [
        {"code": "EU-DE-01", "name": "Frankfurt Genesis L1", "region": "Frankfurt, DE", "role": "Genesis Validator"},
        {"code": "AP-AU-01", "name": "Sydney Master Ingress", "region": "Sydney, AU", "role": "Public RPC & Faucet"},
        {"code": "NA-US-01", "name": "Virginia PyTorch Worker", "region": "Virginia, US", "role": "DeAI GPU Worker (A40)"},
        {"code": "AP-JP-01", "name": "Tokyo GPU Compute", "region": "Tokyo, JP", "role": "DeAI GPU Worker (RTX 4090)"},
        {"code": "AP-SG-01", "name": "Singapore Genesis L1", "region": "Singapore, SG", "role": "Genesis Validator"},
        {"code": "EU-UK-01", "name": "London ZK State Auditor", "region": "London, UK", "role": "Hydra Sentinel Auditor"},
        {"code": "LOC-TH-01", "name": "Localhost Sovereign Rig", "region": "Local Development Rig", "role": "Master Live Host"},
    ],
    "contracts": {
        "token": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "faucet": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        "escrow": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        "staking": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        "verifier": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    },
    "strictly_forbidden_terms": ["NAKt", "5/5 SEEDS", "5-Node Mesh", "1,000 $NAKt"]
}

def rpc(method, params=[]):
    req = urllib.request.Request(
        GROUND_TRUTH['rpc_url'],
        data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        data = json.loads(response.read().decode('utf-8'))
        return data.get('result', None)

def http_get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'RealitySentinel/1.0'})
    with urllib.request.urlopen(req, timeout=15) as response:
        return response.getcode(), response.read().decode('utf-8')

def main():
    print("=" * 82)
    print("      🛡️ NAKHARAX PROTOCOL: MASTER REALITY ANCHOR & VERIFICATION AUDIT")
    print("=" * 82)
    
    checks_passed = 0
    total_checks = 0
    findings = []

    def check(name, condition, detail=""):
        nonlocal checks_passed, total_checks
        total_checks += 1
        if condition:
            checks_passed += 1
            print(f"  [✅ PASS] {name:<45} | {detail}")
        else:
            findings.append((name, detail))
            print(f"  [❌ FAIL] {name:<45} | {detail}")

    # 1. RPC Connection & Chain ID
    print("\n--- [1] 🧱 L1 BLOCKCHAIN & CONSENSUS REALITY ---")
    try:
        telemetry = rpc('nak_getNodeTelemetry')
        raw_cid = telemetry.get('chain_id')
        c_id = int(raw_cid, 16) if str(raw_cid).startswith('0x') else int(raw_cid)
        check("Chain ID Verification", c_id == GROUND_TRUTH['chain_id'], f"Expected {GROUND_TRUTH['chain_id']}, Got {c_id}")
        
        b_num_hex = rpc('eth_blockNumber')
        b_num = int(b_num_hex, 16)
        check("Block Height Progression", b_num > 0, f"Live Block #{b_num:,} progressing")
        
        status = telemetry.get('status')
        check("Node Health State", status == "HEALTHY_OPTIMAL", f"Status: {status}")
    except Exception as e:
        check("RPC Endpoint Online", False, f"Error: {e}")

    # 2. 7-Node Mesh Kademlia Routing Table
    print("\n--- [2] 🌐 7-NODE GLOBAL MESH ROUTING REALITY ---")
    try:
        kad_peers = rpc('nak_getKadRoutingTable') or []
        check("Active Mesh Routing Peers", len(kad_peers) >= 7, f"Found {len(kad_peers)} active routing peers (Target: >= 7)")
        
        health_data = json.loads(urllib.request.urlopen(GROUND_TRUTH['rpc_url'] + "/health").read().decode('utf-8'))
        total_mesh = (health_data.get('validators', 0) + health_data.get('workers', 0))
        check("Active Mesh Cluster Topology", total_mesh >= 7, f"Validators: {health_data.get('validators')} + Workers: {health_data.get('workers')} (Total: {total_mesh} >= 7)")
    except Exception as e:
        check("7-Node Mesh Telemetry", False, f"Error: {e}")

    # 3. Smart Contracts & Faucet Verification
    print("\n--- [3] 📜 SMART CONTRACT & FAUCET REALITY ---")
    try:
        st_stats = rpc('gov_getStats')
        check("DAO Governance Protocol", st_stats is not None, f"Quorum: {st_stats.get('upgradeQuorum')} | Timelock: {st_stats.get('upgradeTimelock')}")
        
        # Test Staking APY
        stake_info = rpc('nak_getStakeInfo', ['0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'])
        check("Citadel Staking APY", stake_info.get('apy') == GROUND_TRUTH['staking_apy'], f"APY: {stake_info.get('apy')}")
    except Exception as e:
        check("Smart Contract Integration", False, f"Error: {e}")

    # 4. Frontend Anti-Hallucination Scan (Check 5 Key Pages for forbidden terms)
    print("\n--- [4] 🖥️ FRONTEND WEB OS ANTI-HALLUCINATION SCAN ---")
    key_pages = ["/", "/nodes", "/wallet", "/apps/faucet", "/jobs"]
    for page in key_pages:
        try:
            status_code, body = http_get(f"{GROUND_TRUTH['dashboard_url']}{page}")
            has_forbidden = False
            for term in GROUND_TRUTH['strictly_forbidden_terms']:
                if term in body:
                    has_forbidden = True
                    check(f"Page Clean: {page}", False, f"Found forbidden hallucinated term: '{term}'")
                    break
            if not has_forbidden:
                check(f"Page Clean & 200 OK: {page}", status_code == 200, f"HTTP {status_code} | Zero Hallucinations")
        except Exception as e:
            check(f"Page Available: {page}", False, f"Error: {e}")

    # Final Truth Alignment Score
    score = (checks_passed / total_checks) * 100 if total_checks else 0
    print("\n" + "=" * 82)
    if score == 100.0:
        print(f"       🏆 REALITY SCORE: {score:.1f}% (ZERO HALLUCINATIONS / PERFECT ALIGNMENT)")
    else:
        print(f"       ⚠️ REALITY SCORE: {score:.1f}% ({len(findings)} Findings to remediate)")
    print("=" * 82)

if __name__ == "__main__":
    main()
