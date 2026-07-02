# nakharax Core Testnet Deployment Guide

## 🚀 Quick Start

### Prerequisites

#### For Linux/Mac:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential clang libclang-dev pkg-config libssl-dev

# For Mac:
brew install llvm pkg-config openssl
```

#### For Windows:
```powershell
# Install Rust from https://rustup.rs/

# Install LLVM (required for libp2p)
# Download from: https://github.com/llvm/llvm-project/releases
# Add LLVM\bin to PATH
# Set environment variable: LIBCLANG_PATH=C:\Program Files\LLVM\bin
```

### Build from Source

```bash
# Clone repository
git clone https://github.com/nakharax-io/nakharax.git
cd nakharax-core

# Build release version
cargo build --release

# Run tests
cargo test --workspace

# Run specific module tests
cargo test -p blockchain
cargo test -p rpc
cargo test -p crypto
```

---

## ⚙️ Configuration

### 1. Environment Variables

Create `.env` file:
```bash
# Network Configuration
NAKHARAX_CHAIN_ID=86137
NAKHARAX_NETWORK_PORT=30303
NAKHARAX_BOOTSTRAP_NODES="/ip4/bootstrap1.nakharax.io/tcp/30303/p2p/...,/ip4/bootstrap2.nakharax.io/tcp/30303/p2p/..."

# RPC Configuration
NAKHARAX_RPC_ADDR=0.0.0.0:8545
NAKHARAX_RPC_CORS_ORIGINS=https://app.nakharax.io,https://wallet.nakharax.io

# Security Configuration
NAKHARAX_RATE_LIMIT_MAX_REQUESTS=100
NAKHARAX_RATE_LIMIT_WINDOW_SECS=60
NAKHARAX_RATE_LIMIT_BURST=20

# Database Configuration
NAKHARAX_STATE_PATH=/var/lib/nakharax/testnet

# Logging
RUST_LOG=info,nakharax=debug
```

### 2. Configuration Files

#### `config/testnet.toml`
```toml
[network]
chain_id = 86137
port = 30303
bootstrap_nodes = [
    "/ip4/testnet1.nakharax.io/tcp/30303/p2p/12D3KooW...",
    "/ip4/testnet2.nakharax.io/tcp/30303/p2p/12D3KooW...",
]
max_peers = 50

[rpc]
addr = "0.0.0.0:8545"
cors_origins = [
    "https://testnet.nakharax.io",
    "https://wallet-testnet.nakharax.io"
]
rate_limit = 100
max_batch_size = 50

[blockchain]
block_time_secs = 5
max_block_size = 1048576
gas_limit = 30000000

[state]
path = "/var/lib/nakharax/testnet"
cache_size_mb = 512

[consensus]
sample_size = 1000
min_confidence = 0.999
fraud_window_blocks = 720
min_validator_stake = "10000000000000000000000"  # 10,000 tokens

[security]
max_transaction_size = 131072  # 128 KB
max_transactions_per_block = 10000
min_gas_price = "1000000000"  # 1 Gwei
```

---

## 🏃 Running the Node

### Development Mode
```bash
# Run with default dev config
cargo run --release -- --config dev

# With custom config
cargo run --release -- --config config/custom.toml

# With environment overrides
RUST_LOG=debug NAKHARAX_RPC_ADDR=127.0.0.1:8545 cargo run --release
```

### Production Mode (Testnet)
```bash
# Using systemd service
sudo systemctl start nakharax-node

# Or directly
./target/release/node --config /etc/nakharax/testnet.toml

# With custom log level
RUST_LOG=info ./target/release/node --config testnet
```

---

## 🐳 Docker Deployment

### Build Docker Image
```bash
# Build image
docker build -t nakharax/node:testnet .

# Run container
docker run -d \
  --name nakharax-node \
  -p 8545:8545 \
  -p 30303:30303 \
  -v /var/lib/nakharax:/var/lib/nakharax \
  -e RUST_LOG=info \
  nakharax/node:testnet --config testnet
```

### Docker Compose
```yaml
version: '3.8'

services:
  nakharax-node:
    image: nakharax/node:testnet
    container_name: nakharax-testnet
    restart: unless-stopped
    ports:
      - "8545:8545"
      - "30303:30303"
    volumes:
      - nakharax-data:/var/lib/nakharax
      - ./config:/etc/nakharax:ro
    environment:
      - RUST_LOG=info,nakharax=debug
      - NAKHARAX_CHAIN_ID=86137
    command: --config /etc/nakharax/testnet.toml
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8545/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  nakharax-data:
```

---

## 🔧 Systemd Service (Linux)

### `/etc/systemd/system/nakharax-node.service`
```ini
[Unit]
Description=nakharax Blockchain Node (Testnet)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=nakharax
Group=nakharax

# Working directory
WorkingDirectory=/opt/nakharax

# Environment
EnvironmentFile=/etc/nakharax/environment
Environment=RUST_LOG=info

# Execution
ExecStart=/opt/nakharax/bin/node --config /etc/nakharax/testnet.toml
ExecReload=/bin/kill -HUP $MAINPID

# Restart policy
Restart=always
RestartSec=10
StartLimitInterval=200
StartLimitBurst=5

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/nakharax /var/log/nakharax
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictNamespaces=true
LockPersonality=true

# Resource limits
LimitNOFILE=65536
LimitNPROC=512

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=nakharax-node

[Install]
WantedBy=multi-user.target
```

### Setup and Start
```bash
# Create user
sudo useradd -r -s /bin/false nakharax

# Create directories
sudo mkdir -p /opt/nakharax/bin /etc/nakharax /var/lib/nakharax /var/log/nakharax
sudo chown -R nakharax:nakharax /var/lib/nakharax /var/log/nakharax

# Copy binary
sudo cp target/release/node /opt/nakharax/bin/
sudo chmod +x /opt/nakharax/bin/node

# Copy configuration
sudo cp config/testnet.toml /etc/nakharax/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable nakharax-node
sudo systemctl start nakharax-node

# Check status
sudo systemctl status nakharax-node

# View logs
sudo journalctl -u nakharax-node -f
```

---

## 📊 Monitoring

### Health Checks
```bash
# Node health
curl http://localhost:8545/health

# Node status
curl http://localhost:8545/status

# Block height
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Prometheus Metrics (Future)
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nakharax'
    static_configs:
      - targets: ['localhost:9090']
```

### Log Aggregation
```bash
# Using journald
sudo journalctl -u nakharax-node -o json | jq

# Export to file
sudo journalctl -u nakharax-node --since today > nakharax-$(date +%Y%m%d).log

# Follow logs with filter
sudo journalctl -u nakharax-node -f | grep -i error
```

---

## 🔐 Security Best Practices

### 1. Firewall Configuration
```bash
# Allow RPC (only from trusted IPs in production)
sudo ufw allow from 10.0.0.0/8 to any port 8545 proto tcp

# Allow P2P
sudo ufw allow 30303/tcp
sudo ufw allow 30303/udp

# Enable firewall
sudo ufw enable
```

### 2. Rate Limiting (nginx)
```nginx
limit_req_zone $binary_remote_addr zone=rpc_limit:10m rate=10r/s;

server {
    listen 80;
    server_name rpc.testnet.nakharax.io;

    location / {
        limit_req zone=rpc_limit burst=20 nodelay;
        
        proxy_pass http://127.0.0.1:8545;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. TLS/SSL (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d rpc.testnet.nakharax.io

# Auto-renewal
sudo certbot renew --dry-run
```

### 4. Secrets Management
```bash
# Never commit sensitive data to git
# Use environment variables or secrets manager

# AWS Secrets Manager example
aws secretsmanager get-secret-value --secret-id nakharax/testnet/jwt-secret

# HashiCorp Vault example
vault kv get secret/nakharax/testnet
```

---

## 🧪 Testing the Deployment

### Basic Connectivity Test
```bash
#!/bin/bash

# Test RPC endpoint
echo "Testing RPC endpoint..."
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Test health endpoint
echo -e "\n\nTesting health endpoint..."
curl http://localhost:8545/health

# Test CORS
echo -e "\n\nTesting CORS..."
curl -H "Origin: https://app.nakharax.io" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:8545 -v
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 -p request.json -T application/json http://localhost:8545/

# request.json content:
# {"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}

# Using wrk
wrk -t4 -c100 -d30s --latency http://localhost:8545/health
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo lsof -i :8545

# Kill the process
sudo kill -9 <PID>
```

#### 2. Permission Denied
```bash
# Fix ownership
sudo chown -R nakharax:nakharax /var/lib/nakharax

# Fix permissions
sudo chmod -R 755 /var/lib/nakharax
```

#### 3. Database Corruption
```bash
# Backup first
cp -r /var/lib/nakharax/testnet /backup/

# Remove and resync
rm -rf /var/lib/nakharax/testnet/*
sudo systemctl restart nakharax-node
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h

# Increase swap (if needed)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Log Analysis
```bash
# Find errors
sudo journalctl -u nakharax-node | grep -i error

# Check panic messages
sudo journalctl -u nakharax-node | grep -i panic

# Performance issues
sudo journalctl -u nakharax-node | grep -i "slow\|timeout"

# Network issues
sudo journalctl -u nakharax-node | grep -i "peer\|connection"
```

---

## 📈 Performance Tuning

### System Limits
```bash
# /etc/security/limits.conf
nakharax soft nofile 65536
nakharax hard nofile 65536
nakharax soft nproc 4096
nakharax hard nproc 4096
```

### Kernel Parameters
```bash
# /etc/sysctl.conf
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.core.netdev_max_backlog = 4096
net.ipv4.ip_local_port_range = 1024 65535

# Apply changes
sudo sysctl -p
```

---

## 🎯 Production Checklist

- [ ] Binary compiled with `--release` flag
- [ ] Configuration reviewed and secured
- [ ] Firewall rules configured
- [ ] TLS/SSL certificates installed
- [ ] Monitoring system setup
- [ ] Log rotation configured
- [ ] Backup system in place
- [ ] Disaster recovery plan documented
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated
- [ ] Team trained on operations

---

## 📞 Support

- **Documentation**: https://docs.nakharax.io
- **GitHub Issues**: https://github.com/nakharax-io/nakharax/issues
- **Discord**: https://discord.gg/nakharax
- **Telegram**: https://t.me/nakharax

---

**Last Updated**: November 5, 2025  
**Version**: v0.1.0-testnet
