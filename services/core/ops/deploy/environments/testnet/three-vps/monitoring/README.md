# Private monitoring and alerting for the active three-VPS testnet

VPS-03 is the collector. Prometheus, Alertmanager and Grafana bind only to
`127.0.0.1`; they have no public DNS record and no public listener. Each node
keeps `/metrics` on its existing `127.0.0.1:8080` health server. VPS-01 and
VPS-02 make outbound-only, restricted reverse SSH tunnels to collector-local
ports on VPS-03. This needs no new inbound firewall rule on either source node.

```text
VPS-01 127.0.0.1:8080,9100 -- restricted SSH -R --> VPS-03 127.0.0.1:18081,19101
VPS-02 127.0.0.1:8080,9100 -- restricted SSH -R --> VPS-03 127.0.0.1:18082,19102
VPS-03 127.0.0.1:8080,9100 ---------------------> Prometheus on the same host
```

The SSH authorization for each source key permits exactly two **reverse
listener** ports on VPS-03, has no shell, agent forwarding, X11, TTY, or
user-rc access, and is bound to the source VPS's public IP/CIDR. The source
agent verifies VPS-03's **ED25519 SSH host-key fingerprint** before it stores
`known_hosts` or starts a tunnel.

## Install order

All commands use a clean checkout at `/opt/nakharax`; run them as `root` or
with `sudo`. Before step 1, create a root-only file on VPS-03:

```bash
sudo install -d -o root -g root -m 0750 /etc/nakharax-monitoring
sudo install -o root -g root -m 0600 /dev/null /etc/nakharax-monitoring/monitoring.env
sudoedit /etc/nakharax-monitoring/monitoring.env
```

Its only required values are shown in `monitoring.env.example`:

```dotenv
GRAFANA_ADMIN_PASSWORD=<long unique password>
ALERT_WEBHOOK_URL=<approved operations webhook accepting Alertmanager JSON>
```

1. On VPS-03, install the collector and record the printed ED25519 host-key
   fingerprint. The installer validates Prometheus and Alertmanager config in
   their pinned container images before it starts the stack.

   ```bash
   cd /opt/nakharax
   sudo NAKHARAX_REPO_DIR="$PWD" \
     bash services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/install-collector-vps03.sh
   ```

2. On VPS-01 and VPS-02, install the loopback-only exporter first. Each command
   prints one public ED25519 tunnel key; copy that single **public** line to a
   temporary file on VPS-03. No private key leaves the source VPS.

   ```bash
   # VPS-01, then VPS-02
   cd /opt/nakharax
   sudo bash services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/install-node-monitoring-agent.sh --node vps01
   ```

3. On VPS-03, register each public key. The port policy is determined by the
   node name, not by user input.

   ```bash
   sudo bash /opt/nakharax/services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/register-tunnel-key-vps03.sh \
     --node vps01 --source-address <VPS-01-public-IP-or-CIDR> --public-key-file /root/vps01-monitoring.pub
   sudo bash /opt/nakharax/services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/register-tunnel-key-vps03.sh \
     --node vps02 --source-address <VPS-02-public-IP-or-CIDR> --public-key-file /root/vps02-monitoring.pub
   ```

4. On VPS-01 and VPS-02, rerun the source installer with the **verified**
   collector fingerprint from step 1. Substitute the actual VPS-03 address;
   do not accept an unverified `ssh-keyscan` result.

   ```bash
   sudo bash services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/install-node-monitoring-agent.sh \
     --node vps01 \
     --collector-host <VPS-03-public-IP-or-DNS> \
     --collector-host-fingerprint SHA256:<verified-vps03-ed25519-fingerprint>
   ```

5. On VPS-03, install its local loopback-only host exporter:

   ```bash
   sudo bash /opt/nakharax/services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/install-node-monitoring-agent.sh --node vps03
   ```

## Verification and alert delivery

On VPS-03, ensure every target is healthy and only loopback monitoring ports
are listening:

```bash
curl -fsS http://127.0.0.1:9090/api/v1/targets | jq '.data.activeTargets[] | {health, labels}'
ss -ltnp | grep -E '127\.0\.0\.1:(3000|8080|8081|8082|9100|9090|9093|18081|18082|19101|19102)'
```

Open Grafana only through SSH or VPN:

```bash
ssh -N -L 3000:127.0.0.1:3000 root@<VPS-03-public-IP>
```

Then browse `http://127.0.0.1:3000`. After confirming the operations webhook,
send one explicit low-severity test and verify both delivery and resolution:

```bash
sudo bash /opt/nakharax/services/core/ops/deploy/environments/testnet/three-vps/monitoring/scripts/send-test-alert-vps03.sh \
  --confirm-send-test-alert
```

Never run the test command until the destination is the intended operations
receiver. It sends an external notification by design.
