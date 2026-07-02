#!/bin/bash

# VPS Deployment Setup Script
# This script sets up the nakharax protocol infrastructure on a VPS

set -e

echo "=== nakharax VPS Deployment Setup ==="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system...${NC}"
apt-get update
apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

# Create deployment directory
DEPLOY_DIR="/opt/nakharax"
echo -e "${YELLOW}Creating deployment directory: ${DEPLOY_DIR}${NC}"
mkdir -p ${DEPLOY_DIR}
cd ${DEPLOY_DIR}

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}.env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with required variables${NC}"
    echo "Copy from .env.example and fill in your values"
    exit 1
fi

# Load environment variables
source .env

# Setup SSL certificates with Certbot
echo -e "${YELLOW}Setting up SSL certificates...${NC}"
mkdir -p ./certbot/conf ./certbot/www

# Initial certificate request (HTTP challenge)
docker-compose -f docker-compose.vps.yml up -d nginx certbot

# Request certificates for each subdomain
DOMAINS=("rpc" "faucet" "faucet-api" "api")
for domain in "${DOMAINS[@]}"; do
    FULL_DOMAIN="${domain}.${DOMAIN}"
    echo -e "${YELLOW}Requesting certificate for ${FULL_DOMAIN}${NC}"
    
    docker-compose -f docker-compose.vps.yml run --rm certbot \
        certonly --webroot \
        -w /var/www/certbot \
        --email admin@${DOMAIN} \
        --agree-tos \
        --no-eff-email \
        -d ${FULL_DOMAIN}
done

# Start all services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose -f docker-compose.vps.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
# Health checks use container_name from docker-compose.vps.yml
health_checks=(
    "nakharax-rpc:8545/health:RPC Node"
    "nakharax-explorer-backend:3001/api/health:Explorer Backend"
    "nakharax-faucet:3002/health:Faucet"
)
for entry in "${health_checks[@]}"; do
    IFS=':' read -r container port_path label <<< "$entry"
    if docker exec "$container" curl -sf "http://localhost:${port_path}" &>/dev/null; then
        echo -e "${GREEN}✓ ${label} is healthy${NC}"
    else
        echo -e "${RED}✗ ${label} is not responding (container: ${container})${NC}"
    fi
done

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 8545/tcp   # RPC direct access
    ufw allow 30303/tcp  # P2P
    ufw allow 30303/udp
    ufw reload
    echo -e "${GREEN}Firewall configured${NC}"
fi

# Print service URLs
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Services are available at:"
echo -e "${GREEN}RPC Node:${NC}      https://rpc.${DOMAIN}"
echo -e "${GREEN}RPC Direct:${NC}    http://${VPS_IP}:8545"
echo -e "${GREEN}API:${NC}           https://api.${DOMAIN}"
echo -e "${GREEN}Faucet:${NC}        https://faucet.${DOMAIN}"
echo -e "${GREEN}Faucet API:${NC}    https://faucet-api.${DOMAIN}"
echo -e "${GREEN}Grafana:${NC}       http://127.0.0.1:3030 (SSH tunnel required)"
echo ""
echo "To view logs:"
echo "  docker compose -f docker-compose.vps.yml logs -f [service-name]"
echo ""
echo "To restart services:"
echo "  docker compose -f docker-compose.vps.yml restart"
echo ""
echo -e "${YELLOW}Note: Make sure DNS records are configured correctly${NC}"
echo "A records for rpc/faucet/faucet-api/api should point to: ${VPS_IP}"
