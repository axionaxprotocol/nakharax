# nakharax Core v1.8.0 - Quick Start Guide

**Last Updated**: December 5, 2025 | **Protocol Version**: v1.8.0-testnet

Welcome to nakharax! This guide will help you get started with running a node, validator, or worker on the nakharax testnet.

## 🎯 What You'll Learn

- Start a local testnet environment
- Run an nakharax node
- Become a validator
- Register as a compute worker
- Submit and monitor jobs

## ⚡ Quick Setup (5 minutes)

### Step 1: Prerequisites

Ensure you have:

- **Docker Desktop** installed and running
- **Go 1.21+** (for building from source)
- **16GB RAM** available

### Step 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/axionaxprotocol/nakharax.git
cd nakharax-core

# Build nakharax Core
make build
```

### Step 3: Start Testnet

```bash
# Start local testnet (Anvil + Explorer + Faucet)
cd nakharax_v1.5_Testnet_in_a_Box
docker compose up -d

# Verify services
docker compose ps
```

You should see:

- ✅ hardhat (Anvil) - http://localhost:8545
- ✅ blockscout - http://localhost:4001
- ✅ faucet - http://localhost:8080

### Step 4: Configure nakharax Node

```bash
cd ..
./build/nakharax-core config init
```

Edit `config.yaml` to connect to local testnet (already configured by default).

### Step 5: Start Your Node

```bash
./build/nakharax-core start --network testnet
```

🎉 **Success!** Your nakharax node is now running!

---

## 👤 User Paths

Choose your path:

### Path A: 🏛️ Run a Validator

Validators secure the network by performing PoPC validation.

**Requirements:**

- Minimum 10,000 NAK stake
- Reliable uptime
- Fast verification capabilities

**Steps:**

1. **Generate keys:**

```bash
./build/nakharax-core keys generate --type validator
# Your address: 0xYourValidatorAddress
```

2. **Get testnet NAK:**

```bash
# Using curl
curl -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  "http://localhost:8081/request?address=0xYourValidatorAddress"

# Or visit http://localhost:8080 in browser
```

3. **Stake NAK:**

```bash
./build/nakharax-core stake deposit 10000 --address 0xYourValidatorAddress
```

4. **Start validating:**

```bash
./build/nakharax-core validator start
```

5. **Check status:**

```bash
./build/nakharax-core validator status
```

**Expected output:**

```
📊 Validator Status:
  Status: Active
  Stake: 10,000 NAK
  Validations: 0
  Success Rate: N/A (new validator)
```

### Path B: 🔧 Run a Worker

Workers provide compute power and earn rewards.

**Requirements:**

- Capable hardware (GPU recommended)
- Stable internet connection
- Minimum stake for registration

**Steps:**

1. **Create hardware spec:**

```bash
cat > worker-specs.json <<EOF
{
  "gpus": [{
    "model": "NVIDIA RTX 4090",
    "vram": 24,
    "count": 1
  }],
  "cpu_cores": 16,
  "ram": 64,
  "storage": 1000,
  "bandwidth": 1000,
  "region": "us-west",
  "asn": "AS15169",
  "organization": "my-org"
}
EOF
```

2. **Generate worker keys:**

```bash
./build/nakharax-core keys generate --type worker
```

3. **Get testnet NAK from faucet** (same as validator)

4. **Register as worker:**

```bash
./build/nakharax-core worker register --specs worker-specs.json
```

5. **Start worker:**

```bash
./build/nakharax-core worker start
```

6. **Monitor status:**

```bash
./build/nakharax-core worker status
```

**Expected output:**

```
📊 Worker Status:
  Status: Active
  Jobs Completed: 0
  Success Rate: N/A (new worker)
  Current Quota: 0%
```

### Path C: 💼 Submit Jobs (Client)

Submit compute jobs to the network.

**Steps:**

1. **Create job specification:**

```json
{
  "specs": {
    "gpu": "NVIDIA RTX 4090",
    "vram": 24,
    "framework": "PyTorch",
    "region": "us-west"
  },
  "sla": {
    "max_latency": "30s",
    "max_retries": 3,
    "timeout": "300s",
    "required_uptime": 0.99
  }
}
```

2. **Submit via RPC:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "axn_submitJob",
    "params": [/* job spec here */],
    "id": 1
  }'
```

3. **Monitor job:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "axn_getJobStatus",
    "params": ["job_abc123"],
    "id": 1
  }'
```

---

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Node logs
tail -f ~/.nakharax/logs/node.log

# Docker logs
cd nakharax_v1.5_Testnet_in_a_Box
docker compose logs -f hardhat
```

### Check Metrics

Visit http://localhost:9090/metrics for Prometheus metrics.

### Explore Blockchain

Visit http://localhost:4001 for Blockscout explorer.

### Query Pricing

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"axn_getPricingInfo","params":[],"id":1}'
```

---

## 🛠️ Common Commands

### Configuration

```bash
# Show current config
./build/nakharax-core config show

# Initialize default config
./build/nakharax-core config init
```

### Keys Management

```bash
# Generate new key
./build/nakharax-core keys generate --type validator

# List keys
./build/nakharax-core keys list
```

### Staking

```bash
# Check balance
./build/nakharax-core stake balance

# Deposit stake
./build/nakharax-core stake deposit 10000 --address 0x...

# Withdraw stake
./build/nakharax-core stake withdraw 5000
```

### Status Checks

```bash
# Node version
./build/nakharax-core version

# Validator status
./build/nakharax-core validator status

# Worker status
./build/nakharax-core worker status
```

---

## 🐛 Troubleshooting

### Connection Refused

**Problem:** Cannot connect to RPC endpoint

**Solution:**

```bash
# Check if testnet is running
cd nakharax_v1.5_Testnet_in_a_Box
docker compose ps

# Restart if needed
docker compose restart
```

### Chain ID Mismatch

**Problem:** Wrong chain ID

**Solution:** Check config.yaml has `chain_id: 31337`

### Insufficient Funds

**Problem:** Not enough NAK for transactions

**Solution:** Request more from faucet:

```bash
curl -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" \
  "http://localhost:8081/request?address=0xYourAddress"
```

### Docker Issues

**Problem:** Docker containers not starting

**Solution:**

```bash
# Clean up
docker compose down -v

# Restart
docker compose up -d
```

---

## 📚 Next Steps

- **Deep Dive:** Read [Architecture Overview](../ARCHITECTURE.md)
- **API Reference:** See [API Documentation](./API_REFERENCE.md)
- **Build from Source:** Follow [Build Guide](./BUILD.md)
- **Production Deploy:** Check [Testnet Integration](./TESTNET_INTEGRATION.md)
- **Join Community:** Discord at https://discord.gg/nakharax

---

## 🆘 Getting Help

- **Documentation:** https://docs.nakharax.io
- **GitHub Issues:** https://github.com/axionaxprotocol/nakharax/issues
- **Discord:** https://discord.gg/nakharax
- **Telegram:** https://t.me/nakharax

---

## ⚠️ Testnet Disclaimer

This is a **testnet** environment. Do not use real assets or run this in production without proper security audits.

---

**Made with 💜 by the nakharax community**

Happy building! 🚀
