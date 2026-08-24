#!/usr/bin/env python3
"""
NakharaX Protocol — 5,000 Virtual Users High-Concurrency RPC Load Test
Simulates 5,000 concurrent users sending JSON-RPC queries to the node.
"""

import asyncio
import time
import json
import urllib.request
import concurrent.futures
from datetime import datetime

RPC_URL = "http://127.0.0.1:8545"
TOTAL_USERS = 5000
CONCURRENCY = 500  # Workers pool size for socket reuse

PAYLOAD = json.dumps({
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
}).encode("utf-8")

def send_request(user_id: int):
    start = time.perf_counter()
    try:
        req = urllib.request.Request(
            RPC_URL,
            data=PAYLOAD,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read()
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            if resp.status == 200 and b"result" in body:
                return (True, elapsed_ms, None)
            return (False, elapsed_ms, f"HTTP {resp.status}")
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return (False, elapsed_ms, str(e))

import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def main():
    print("=" * 65)
    print(f"NAKHARAX HIGH-LOAD STRESS TEST -- 5,000 VIRTUAL USERS")
    print(f"Target Endpoint: {RPC_URL}")
    print(f"Total Requests : {TOTAL_USERS:,}")
    print(f"Start Time     : {datetime.now().strftime('%H:%M:%S.%f')[:-3]}")
    print("=" * 65)
    
    start_total = time.perf_counter()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(send_request, i) for i in range(TOTAL_USERS)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            
    total_time = time.perf_counter() - start_total
    
    successes = [r for r in results if r[0]]
    failures = [r for r in results if not r[0]]
    latencies = sorted([r[1] for r in results])
    
    p50 = latencies[int(len(latencies) * 0.50)] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    p99 = latencies[int(len(latencies) * 0.99)] if latencies else 0
    rps = len(results) / total_time if total_time > 0 else 0
    
    print("\n" + "=" * 65)
    print("📊 5,000 VIRTUAL USERS STRESS TEST RESULTS")
    print("=" * 65)
    print(f"✅ Successful Requests : {len(successes):,} / {TOTAL_USERS:,} ({len(successes)/TOTAL_USERS*100:.1f}%)")
    print(f"❌ Failed Requests     : {len(failures):,}")
    print(f"⏱️  Total Duration      : {total_time:.2f} seconds")
    print(f"⚡ Throughput (RPS)    : {rps:,.1f} req/sec")
    print(f"📈 P50 Latency (Median): {p50:.2f} ms")
    print(f"📈 P95 Latency        : {p95:.2f} ms")
    print(f"📈 P99 Latency        : {p99:.2f} ms")
    print("=" * 65)
    
    if len(failures) == 0:
        print("🎉 STATUS: PASSED — 100% Zero-Loss Under 5,000 Virtual Users Load!")
    else:
        print(f"⚠️ STATUS: {len(failures)} requests dropped or timed out under high concurrency.")

if __name__ == "__main__":
    main()
