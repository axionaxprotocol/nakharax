#!/bin/bash
#
# nakhara RPC Node Setup Script
# Sets up a dedicated RPC/WebSocket node for public testnet access
#
# Usage: bash setup_rpc_node.sh [OPTIONS]
# Options:
#   --rpc-port PORT        RPC HTTP port (default: 8545)
#   --ws-port PORT         WebSocket port (default: 8546)
#   --data-dir PATH        Data directory (default: /var/lib/nakhara)
#   --chain-id ID          Chain ID (default: 86137)
#   --domain DOMAIN        Domain for nginx config (e.g., testnet-rpc.nakhara.io)
#   --ssl-email EMAIL      Email for Let's Encrypt SSL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
RPC_PORT=8545
WS_PORT=8546
DATA_DIR="/var/lib/nakhara"
CHAIN_ID=86137
DOMAIN=""
SSL_EMAIL=""
MAX_CONNECTIONS=1000
RATE_LIMIT=1000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --rpc-port)
      RPC_PORT="$2"
      shift 2
      ;;
    --ws-port)
      WS_PORT="$2"
      shift 2
      ;;
    --data-dir)
      DATA_DIR="$2"
      shift 2
      ;;
    --chain-id)
      CHAIN_ID="$2"
      shift 2
      ;;
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --ssl-email)
      SSL_EMAIL="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   nakhara RPC Node Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  RPC Port: $RPC_PORT"
echo "  WebSocket Port: $WS_PORT"
echo "  Data Directory: $DATA_DIR"
echo "  Chain ID: $CHAIN_ID"
echo "  Domain: ${DOMAIN:-"Not configured"}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: This script must be run as root${NC}"
   exit 1
fi

# Update system
echo -e "${BLUE}[1/8]${NC} Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install dependencies
echo -e "${BLUE}[2/8]${NC} Installing dependencies..."
apt-get install -y -qq \
  curl \
  wget \
  git \
  build-essential \
  pkg-config \
  libssl-dev \
  nginx \
  certbot \
  python3-certbot-nginx \
  ufw \
  jq

# Install Rust if not already installed
if ! command -v rustc &> /dev/null; then
  echo -e "${BLUE}[3/8]${NC} Installing Rust..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo -e "${BLUE}[3/8]${NC} Rust already installed ($(rustc --version))"
fi

# Create nakhara user if doesn't exist
if ! id -u nakhara &> /dev/null; then
  echo -e "${BLUE}[4/8]${NC} Creating nakhara user..."
  useradd -r -m -s /bin/bash nakhara
else
  echo -e "${BLUE}[4/8]${NC} User nakhara already exists"
fi

# Create data directory
echo -e "${BLUE}[5/8]${NC} Setting up data directory..."
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/state"
mkdir -p "$DATA_DIR/logs"
chown -R nakhara:nakhara "$DATA_DIR"
chmod 755 "$DATA_DIR"

# Clone and build nakhara (if not already built)
NAKHARA_HOME="/home/nakhara/nakhara-monolith"
if [ ! -d "$NAKHARA_HOME" ]; then
  echo -e "${BLUE}[6/8]${NC} Cloning nakhara repository..."
  sudo -u nakhara git clone https://github.com/nakhara-io/nakhara-monolith.git "$NAKHARA_HOME"
else
  echo -e "${BLUE}[6/8]${NC} Updating nakhara repository..."
  cd "$NAKHARA_HOME"
  sudo -u nakhara git pull
fi

cd "$NAKHARA_HOME/core"

# Build in release mode
echo -e "${BLUE}[7/8]${NC} Building nakhara (this may take 10-15 minutes)..."
sudo -u nakhara cargo build --release

# Copy binary to /usr/local/bin
cp target/release/nakhara-core /usr/local/bin/
chmod +x /usr/local/bin/nakhara-core

# Create configuration file
echo -e "${BLUE}[8/8]${NC} Creating configuration..."

cat > "$DATA_DIR/config.toml" <<EOF
# nakhara RPC Node Configuration
# Generated: $(date)

[network]
chain_id = $CHAIN_ID
listen_addr = "0.0.0.0:30303"
max_peers = 50
bootstrap_nodes = []

[rpc]
enabled = true
http_addr = "127.0.0.1:$RPC_PORT"
http_cors = ["*"]
http_methods = ["eth", "web3", "net", "popc"]
max_connections = $MAX_CONNECTIONS

[websocket]
enabled = true
ws_addr = "127.0.0.1:$WS_PORT"
ws_origins = ["*"]
max_connections = 500

[state]
db_path = "$DATA_DIR/state"
cache_size = 1024  # MB

[logging]
level = "info"
log_file = "$DATA_DIR/logs/nakhara.log"
max_size = 100  # MB
max_backups = 10

[metrics]
enabled = true
listen_addr = "127.0.0.1:9090"
EOF

chown nakhara:nakhara "$DATA_DIR/config.toml"

# Create systemd service
cat > /etc/systemd/system/nakhara-rpc.service <<EOF
[Unit]
Description=nakhara RPC Node
After=network.target

[Service]
Type=simple
User=nakhara
Group=nakhara
WorkingDirectory=$DATA_DIR
ExecStart=/usr/local/bin/nakhara-core --config $DATA_DIR/config.toml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=nakhara-rpc

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true

# Resource limits
LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Configure firewall
echo -e "${GREEN}Configuring firewall...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 30303/tcp comment 'nakhara P2P'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Configure nginx if domain is provided
if [ -n "$DOMAIN" ]; then
  echo -e "${GREEN}Configuring nginx for $DOMAIN...${NC}"
  
  # Create nginx config
  cat > /etc/nginx/sites-available/nakhara-rpc <<EOF
# nakhara RPC Reverse Proxy
# HTTP RPC endpoint
upstream nakhara_rpc {
    server 127.0.0.1:$RPC_PORT;
}

# WebSocket endpoint
upstream nakhara_ws {
    server 127.0.0.1:$WS_PORT;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=rpc_limit:10m rate=${RATE_LIMIT}r/m;
limit_req_status 429;

server {
    listen 80;
    server_name $DOMAIN;

    # Rate limiting
    limit_req zone=rpc_limit burst=100 nodelay;

    # RPC endpoint
    location / {
        proxy_pass http://nakhara_rpc;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        
        # Handle OPTIONS requests
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Health check endpoint (no rate limit)
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}

# WebSocket server (separate subdomain or port)
server {
    listen 80;
    server_name ws.$DOMAIN;

    location / {
        proxy_pass http://nakhara_ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }
}
EOF

  # Enable site
  ln -sf /etc/nginx/sites-available/nakhara-rpc /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  
  # Test nginx config
  nginx -t
  
  # Restart nginx
  systemctl restart nginx
  
  # Setup SSL if email provided
  if [ -n "$SSL_EMAIL" ]; then
    echo -e "${GREEN}Setting up SSL certificates...${NC}"
    certbot --nginx -d "$DOMAIN" -d "ws.$DOMAIN" --email "$SSL_EMAIL" --agree-tos --non-interactive
  fi
fi

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable nakhara-rpc

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Setup Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Start the RPC node:"
echo "   ${BLUE}sudo systemctl start nakhara-rpc${NC}"
echo ""
echo "2. Check status:"
echo "   ${BLUE}sudo systemctl status nakhara-rpc${NC}"
echo ""
echo "3. View logs:"
echo "   ${BLUE}sudo journalctl -u nakhara-rpc -f${NC}"
echo ""
echo "4. Test RPC endpoint:"
echo "   ${BLUE}curl -X POST http://localhost:$RPC_PORT \\${NC}"
echo "   ${BLUE}  -H 'Content-Type: application/json' \\${NC}"
echo "   ${BLUE}  -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}'${NC}"
echo ""

if [ -n "$DOMAIN" ]; then
  echo "5. Test public endpoint:"
  echo "   ${BLUE}curl -X POST https://$DOMAIN \\${NC}"
  echo "   ${BLUE}  -H 'Content-Type: application/json' \\${NC}"
  echo "   ${BLUE}  -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}'${NC}"
  echo ""
  echo -e "${GREEN}Public Endpoints:${NC}"
  echo "  RPC: https://$DOMAIN"
  echo "  WebSocket: wss://ws.$DOMAIN"
fi

echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  - Genesis file will be needed before first start"
echo "  - Bootstrap nodes should be added to config.toml"
echo "  - Monitor resource usage (CPU, RAM, disk)"
echo "  - Setup monitoring/alerting (Grafana recommended)"
echo ""
