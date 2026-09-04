import subprocess
import sys

hosts = [
    ('158.220.127.24', 'VPS-01 Frankfurt (Ingress & RPC)'),
    ('40.160.87.118', 'VPS-02 Virginia (Validator 1)'),
    ('217.216.39.77', 'VPS-03 Singapore (Validator 2 & Monitoring)')
]

for ip, name in hosts:
    print(f"\n==================== {name} ({ip}) ====================", flush=True)
    remote_cmd = "SYSTEMD_PAGER=cat systemctl list-units --type=service --state=running --no-pager | grep -E 'nakharax|node|rpc|faucet' || true; ps -eo pid,user,args | grep -E 'nakharax|node|python|server.js' | grep -v grep || true"
    cmd = ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'ConnectTimeout=5', f'root@{ip}', remote_cmd]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        print("--- Services & Processes ---", flush=True)
        print(res.stdout.strip(), flush=True)
        if res.stderr.strip():
            print("STDERR:", res.stderr.strip()[:200], flush=True)
    except Exception as e:
        print(f"Error connecting to {ip}: {e}", flush=True)
