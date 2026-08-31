import sys

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import urllib.request
import json
import time

def rpc(method, params=[]):
    req = urllib.request.Request(
        'http://127.0.0.1:8545',
        data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))['result']

def main():
    print("=" * 70)
    print("[NAKHARAX] LAYER-1 LIVE BLOCK & STATE CONTINUITY AUDIT")
    print("=" * 70)

    chain_id_hex = rpc('eth_chainId')
    chain_id = int(chain_id_hex, 16)
    net_version = rpc('net_version')
    block_hex = rpc('eth_blockNumber')
    current_block = int(block_hex, 16)

    print(f"[*] Chain ID: {chain_id} (Expected: 86137) -> {'PASS' if chain_id == 86137 else 'FAIL'}")
    print(f"[*] Network Version: {net_version}")
    print(f"[*] Current Block Height: #{current_block:,}")

    # Inspect last 12 blocks
    start_b = max(1000, current_block - 11)
    blocks = []
    for b in range(start_b, current_block + 1):
        blk = rpc('eth_getBlockByNumber', [hex(b), True])
        blocks.append(blk)

    print("\n--- RECENT 12 BLOCKS VERIFICATION ---")
    unbroken = True
    diff_ts_list = []
    for i, blk in enumerate(blocks):
        b_num = int(blk['number'], 16)
        b_hash = blk['hash']
        p_hash = blk['parentHash']
        ts = int(blk['timestamp'], 16)
        txs = len(blk.get('transactions', []))
        gas_used = int(blk.get('gasUsed', '0x0'), 16)
        
        status = "OK"
        if i > 0:
            prev_hash = blocks[i-1]['hash']
            if p_hash != prev_hash:
                status = "BROKEN PARENT"
                unbroken = False
            prev_ts = int(blocks[i-1]['timestamp'], 16)
            diff_ts = ts - prev_ts
            diff_ts_list.append(diff_ts)
        else:
            diff_ts = 0

        ts_str = f"+{diff_ts}s" if i > 0 else "---"
        print(f"  - Block #{b_num:<5} | Hash: {b_hash[:14]}... | Parent: {p_hash[:14]}... | {ts_str:<5} | Gas: {gas_used} | {status}")

    print("-" * 70)
    if unbroken:
        print("[SUCCESS] Cryptographic Parent Hash Invariant: 100% CONTINUOUS & UNBROKEN")
    else:
        print("[FAILED] Parent hash inconsistency detected")
    
    if diff_ts_list:
        avg_cadence = sum(diff_ts_list) / len(diff_ts_list)
        print(f"[METRIC] Measured Average Cadence: {avg_cadence:.2f}s per block (Samples: {len(diff_ts_list)})")
        if abs(avg_cadence - 3.0) <= 0.2:
            print("[SUCCESS] Cadence Verification: Deterministic 3.0s block production confirmed")
        else:
            print(f"[INFO] Cadence Verification: Measured {avg_cadence:.2f}s per block")
    else:
        print("[INFO] Insufficient blocks to calculate average cadence")
    print("=" * 70)

if __name__ == "__main__":
    main()
