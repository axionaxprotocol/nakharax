# NakharaX Core — Public Testnet Execution & Testing Manual

**Document Date:** October 22, 2025  
**Target Specification:** NakharaX Testnet Ingress & Simulation Harness  

---

## 🎯 Testnet Verification Methods

Testing NakharaX Core can be executed via 2 distinct methodologies:

---

## Method 1: Full Testnet Stack (Recommended) ✨

### Prerequisites & Initialization

#### 1. Launch Docker Engine
- Open Docker Desktop.
- Verify status indicator displays active status.

#### 2. Verify Docker Engine Environment
```powershell
docker --version
docker ps
```

Expected Output:
```text
Docker version 24.x.x
CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
```

### Launch Testnet Stack

```powershell
# 1. Navigate to Testnet directory
cd nakharax_v1.5_Testnet_in_a_Box

# 2. Launch all stack services
docker compose up -d

# 3. Verify running service containers
docker compose ps
```

**Required Container Services:**
- ✅ `hardhat` — Anvil JSON-RPC Server (`:8545`)
- ✅ `blockscout` — Block Explorer (`:4000-4001`)
- ✅ `faucet` — Token Faucet Service (`:8080-8081`)
- ✅ `reverse-proxy` — Nginx Ingress Gateway (`:80`, `:443`)

### Verify Network Endpoints

#### 1. Test RPC Ingress:
```powershell
# Verify Chain ID
curl -X POST http://localhost:8545 `
  -H "Content-Type: application/json" `
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

Expected Output:
```json
{ "jsonrpc": "2.0", "result": "0x7a69", "id": 1 }
```
*(0x7a69 = 31337 decimal)*

#### 2. Access Blockscout Explorer UI:
```text
http://localhost:4001
```

#### 3. Access Faucet Web UI:
```text
http://localhost:8080
```

### Launch Local NakharaX Node Daemon

```powershell
# Return to repository root
cd ..

# Start Node connected to Anvil RPC
.\build\nakharax-core.exe start --network testnet
```

Expected Terminal Output:
```text
🚀 Starting nakharax Core v1.5.0-testnet
📂 Data directory: .nakharax
🌐 Network: testnet
🔌 RPC address: 127.0.0.1:8545

✅ Node started successfully!
📡 RPC endpoint: 127.0.0.1:8545
🔗 Chain ID: 31337

Press Ctrl+C to stop...
```

---

## Method 2: Standalone CLI Demo Mode 🎮

Verify CLI functions without requiring an active blockchain connection.

### 1. Verify Configuration Subsystem

```powershell
# Initialize configuration blueprint
.\build\nakharax-core.exe config init

# Display active configuration
.\build\nakharax-core.exe config show
```

Output:
```text
📋 Current Configuration:
  Chain ID: 31337
  Network: testnet
  Data Dir: .nakharax
  PoPC Sample Size: 1000
  ASR Top K: 64
```

### 2. Verify Key Management Subsystem

```powershell
# Generate Validator keypair
.\build\nakharax-core.exe keys generate --type validator

# Generate Worker keypair
.\build\nakharax-core.exe keys generate --type worker

# List registered keystores
.\build\nakharax-core.exe keys list
```

### 3. Verify Validator Subsystem

```powershell
# Inspect Validator status
.\build\nakharax-core.exe validator status

# Simulate Validator start
.\build\nakharax-core.exe validator start
```

Output:
```text
🏛️  Starting validator node...
✅ Validator started successfully!
📊 PoPC validation enabled
```

### 4. Verify Worker Registration Subsystem

```powershell
# Create worker specification file
$specs = @"
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
  "region": "us-west"
}
"@
$specs | Out-File -FilePath worker-specs.json -Encoding UTF8

# Register Worker
.\build\nakharax-core.exe worker register --specs worker-specs.json

# Inspect Worker Status
.\build\nakharax-core.exe worker status
```

Output:
```text
📊 Worker Status:
  Status: Active
  Jobs Completed: 567
  Success Rate: 99.5%
  Current Quota: 8.2%
```

### 5. Verify Staking Subsystem

```powershell
# Check stake balance
.\build\nakharax-core.exe stake balance

# Deposit stake collateral
.\build\nakharax-core.exe stake deposit 10000 --address 0x1234...

# Withdraw stake collateral
.\build\nakharax-core.exe stake withdraw 5000
```

---

## 🔬 Advanced Feature Verification

### PoPC Consensus Verification
```powershell
.\build\nakharax-core.exe config show
```
- **Sample Size:** Number of verification samples ($s=1000$).
- **Fraud Window:** Open challenge window for Byzantine fault reports.

### ASR Worker Selection Verification
```powershell
.\build\nakharax-core.exe worker register --specs worker-specs.json
```
Evaluates:
- Suitability score calculation
- VRF-backed probabilistic worker selection

---

## 📊 Testing Against Active Testnet RPC

### 1. Request Tokens from Faucet

#### Method A: Web UI
1. Open `http://localhost:8080`
2. Enter target wallet address.
3. Click "Request Tokens".

#### Method B: cURL API Call
```powershell
curl -H "Authorization: Basic YWRtaW46cGFzc3dvcmQ=" `
  "http://localhost:8081/request?address=0xYourAddress"
```

### 2. Verify Account Balance
```powershell
curl -X POST http://localhost:8545 `
  -H "Content-Type: application/json" `
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xYourAddress", "latest"],
    "id":1
  }'
```

### 3. Submit DeAI Job Payload
```powershell
$jobSpec = @"
{
  "jsonrpc": "2.0",
  "method": "axn_submitJob",
  "params": [{
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
  }],
  "id": 1
}
"@

curl -X POST http://localhost:8545 `
  -H "Content-Type: application/json" `
  -d $jobSpec
```

---

## 🛠️ Troubleshooting

### Docker Engine Offline
- **Error:** `The system cannot find the file specified`
- **Solution:** Open Docker Desktop, wait for engine start, and verify via `docker ps`.

### Port Allocation Collision
- **Error:** `port is already allocated`
- **Solution:** Identify PID holding port 8545 via `netstat -ano | findstr :8545` and terminate via `taskkill /PID <PID> /F`.

---

## References

- `QUICKSTART.md` — Quick start guide
- `docs/API_REFERENCE.md` — Complete RPC specification
- `docs/TESTNET_INTEGRATION.md` — Testnet integration manual
