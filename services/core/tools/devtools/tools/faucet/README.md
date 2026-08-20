# nakharax Testnet Faucet

Web application for distributing testnet NAK tokens to developers and testers.

## Features

- 🚰 **Automated Distribution**: Send 100 NAK tokens per request
- ⏰ **Rate Limiting**: 24-hour cooldown per address, 3 requests per IP
- 🦊 **MetaMask Integration**: One-click wallet connection
- 🛡️ **Security**: Rate limiting, input validation, transaction signing
- 📊 **Statistics**: Real-time faucet stats and balance
- 🎨 **Modern UI**: Responsive design with dark theme
- 🔗 **Explorer Integration**: Direct links to transaction details

## Architecture

### Backend (Rust + Axum)
- RESTful API with JSON responses
- In-memory request tracking
- Ethereum transaction signing
- CORS enabled for frontend

### Frontend (HTML + Vanilla JS)
- Single-page application
- MetaMask Web3 integration
- Real-time updates
- Mobile-responsive

## Quick Deploy

### Using Setup Script (Recommended)

```bash
# Generate faucet wallet private key first
# KEEP THIS SECURE!

# Deploy faucet
sudo bash scripts/setup_faucet.sh \
  --domain testnet-faucet.nakharax.com \
  --ssl-email admin@nakharax.com \
  --rpc-url https://testnet-rpc.nakharax.com \
  --chain-id 86137 \
  --private-key "YOUR_PRIVATE_KEY_HERE"
```

The script will:
1. Install Rust and dependencies
2. Build faucet binary
3. Setup systemd service
4. Configure nginx with SSL
5. Deploy frontend files
6. Configure firewall

### Manual Deployment

#### 1. Build Backend

```bash
cd tools/faucet
cargo build --release
```

#### 2. Configure Environment

```bash
# EXAMPLE - Replace with your actual values (NEVER commit real keys)
export FAUCET_PRIVATE_KEY="0x0000000000000000000000000000000000000000000000000000000000000000"
export RPC_URL="https://testnet-rpc.nakharax.com"
export CHAIN_ID="86137"
```

#### 3. Run Backend

```bash
./target/release/nakharax-faucet
```

Backend runs on port 3000 by default.

#### 4. Serve Frontend

```bash
cd public/
python3 -m http.server 8080
```

Or use nginx to serve static files.

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "nakharax-faucet",
  "version": "1.0.0"
}
```

### GET /info

Get faucet configuration.

**Response:**
```json
{
  "chain_id": 86137,
  "amount": "100 NAK",
  "cooldown_hours": 24,
  "network": "nakharax Testnet"
}
```

### POST /request

Request testnet tokens.

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Success Response:**
```json
{
  "success": true,
  "tx_hash": "0xabc123...",
  "amount": "100 NAK",
  "message": "Tokens sent successfully!"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Please wait 23 hours before requesting again"
}
```

### GET /stats

Get faucet statistics.

**Response:**
```json
{
  "total_requests": 1234,
  "total_distributed": "123400 NAK",
  "faucet_balance": "10000 NAK",
  "cooldown_hours": 24,
  "amount_per_request": "100 NAK"
}
```

## Configuration

### Rate Limits

Edit `src/main.rs`:

```rust
const FAUCET_AMOUNT: u64 = 100_000_000_000_000_000_000; // 100 NAK
const COOLDOWN_HOURS: u64 = 24;
const MAX_REQUESTS_PER_IP: usize = 3;
```

### Frontend Configuration

Edit `public/index.html`:

```javascript
const FAUCET_API = 'https://testnet-faucet.nakharax.com';
const EXPLORER_URL = 'https://testnet-explorer.nakharax.com';
```

## Security

### Private Key Management

**CRITICAL**: Never commit private keys to version control!

- Store in environment variable
- Use `.env` file (gitignored)
- Restrict file permissions: `chmod 600 .env`
- Rotate keys periodically

### Rate Limiting

Multiple layers of protection:
1. **Address cooldown**: 24 hours per wallet
2. **IP limiting**: 3 requests per IP per 24 hours
3. **Nginx rate limiting**: 10 req/min at proxy level

### Input Validation

- Ethereum address format validation
- XSS protection
- CORS configuration
- Request size limits

## Monitoring

### Check Status

```bash
# Service status
sudo systemctl status nakharax-faucet

# Logs
sudo journalctl -u nakharax-faucet -f

# API health
curl https://testnet-faucet.nakharax.com/health
```

### Monitor Balance

```bash
# Get faucet wallet address from private key
# Check balance via RPC
curl -X POST https://testnet-rpc.nakharax.com \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xYOUR_FAUCET_ADDRESS", "latest"],
    "id":1
  }'
```

### Refill Faucet

When balance is low, send tokens to faucet address:

```bash
# From funded wallet, send NAK to faucet address
# Amount: 10,000+ NAK recommended
```

## Troubleshooting

### Faucet Not Starting

```bash
# Check logs
sudo journalctl -u nakharax-faucet -n 50

# Verify environment variables
cat /var/lib/nakharax-faucet/.env

# Test binary manually
sudo -u faucet /usr/local/bin/nakharax-faucet
```

### Frontend Not Loading

```bash
# Check nginx config
sudo nginx -t

# Check file permissions
ls -la /var/www/faucet/

# Restart nginx
sudo systemctl restart nginx
```

### Transactions Failing

- Check RPC endpoint is accessible
- Verify faucet has sufficient balance
- Check gas price settings
- Verify chain ID matches

### Rate Limit Issues

```bash
# View rate limit settings
grep -A 5 "limit_req_zone" /etc/nginx/sites-available/nakharax-faucet

# Adjust if needed
sudo nano /etc/nginx/sites-available/nakharax-faucet
sudo systemctl reload nginx
```

## Development

### Build and Test Locally

```bash
# Backend
cd tools/faucet
cargo build
cargo test
cargo run

# Frontend (in separate terminal)
cd public/
python3 -m http.server 8080
```

### Add Features

Common enhancements:
- CAPTCHA integration (hCaptcha/reCAPTCHA)
- Social media verification
- Wallet balance checking
- Transaction queue system
- Admin dashboard
- Metrics/analytics

## Production Checklist

- [ ] Generate secure private key
- [ ] Fund faucet wallet (10,000+ NAK)
- [ ] Deploy with setup script
- [ ] Configure DNS records
- [ ] Setup SSL certificates
- [ ] Test token requests
- [ ] Configure monitoring/alerts
- [ ] Setup log rotation
- [ ] Document refill procedures
- [ ] Test rate limiting
- [ ] Backup private key securely
- [ ] Update website with faucet link
- [ ] Announce to community

## Support

- **Documentation**: https://docs.nakharax.com
- **Issues**: https://github.com/axionaxprotocol/nakharax/issues
- **Discord**: https://discord.gg/nakharax

## License

MIT License - see LICENSE file for details
