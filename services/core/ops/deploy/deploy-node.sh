#!/bin/bash
# Deploy nakharax node to VPS
# Usage: ./deploy-node.sh <PUBLIC_IP> [BOOTSTRAP_MULTIADDR]

set -e

PUBLIC_IP=${1:-$(curl -s ifconfig.me)}
BOOTSTRAP_NODE=${2:-""}

echo "=== Nakharax Monolith Node Deployment ==="
echo "Public IP: $PUBLIC_IP"
echo "Bootstrap Node: ${BOOTSTRAP_NODE:-None (bootstrapping as first node)}"
echo ""

# Clone or update repository
if [ -d "nakharax" ]; then
    echo "Updating existing repository..."
    cd nakharax
    git pull
else
    echo "Cloning nakharax..."
    git clone https://github.com/nakharax-io/nakharax.git
    cd nakharax
fi

# Create .env file
echo "Creating .env file..."
cd services/core/ops/deploy
cat > .env << EOF
NAKHARAX_PUBLIC_IP=$PUBLIC_IP
EOF

if [ -n "$BOOTSTRAP_NODE" ]; then
    echo "NAKHARAX_BOOTSTRAP_NODES=$BOOTSTRAP_NODE" >> .env
fi

# Detect docker compose command
echo "Detecting Docker Compose..."
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif docker-compose version &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "Error: docker compose not found. Please install Docker Compose."
    exit 1
fi
echo "Using: $COMPOSE_CMD"

# Build and start node
echo "Building Docker image (this may take 10-20 minutes)..."
$COMPOSE_CMD -f docker-compose.yaml build

echo "Starting node..."
$COMPOSE_CMD -f docker-compose.yaml up -d

echo ""
echo "=== Deployment Complete ==="
echo "Check logs: docker logs -f nakharax-node"
echo "Get Peer ID: docker logs nakharax-node 2>&1 | grep 'Local peer ID'"
