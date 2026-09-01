#!/usr/bin/env bash
# =============================================================================
# 🚀 NakharaX Protocol — Automated Multi-Node Continuous Deployment (CD)
# Deploys latest master commit across the 3 Cloud VPS Cluster via SSH
# =============================================================================

set -uo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TARGET="${1:-all}"
USER="${2:-root}"

VPS01="158.220.127.24" # Germany Master Hub
VPS02="40.160.87.118"  # Virginia Validator 01
VPS03="217.216.39.77"  # Singapore Validator 02

echo -e "${BOLD}${BLUE}======================================================================${NC}"
echo -e "${BOLD}${CYAN}   🚀 NAKHARAX PROTOCOL: 1-CLICK CONTINUOUS DEPLOYMENT (CD)           ${NC}"
echo -e "${BOLD}${BLUE}======================================================================${NC}"
echo -e "  • Target Scope : ${TARGET}"
echo -e "  • VPS-01 Hub   : ${VPS01} (Germany)"
echo -e "  • VPS-02 Val01 : ${VPS02} (Virginia)"
echo -e "  • VPS-03 Val02 : ${VPS03} (Singapore)"
echo -e "${BOLD}${BLUE}======================================================================${NC}\n"

deploy_vps01() {
    echo -e "${BOLD}${YELLOW}⏳ [1/3] Deploying Web OS Dashboard update to VPS-01 (${VPS01})...${NC}"
    local cmd="cd /opt/nakharax && git fetch --all && git reset --hard origin/master && pnpm --filter nakharax-os-dashboard build && pm2 restart nakharax-dashboard"
    if ssh -o StrictHostKeyChecking=no "${USER}@${VPS01}" "$cmd"; then
        echo -e "${GREEN}  ✓ [PASS] VPS-01 Web OS Dashboard Updated & Live!${NC}\n"
    else
        echo -e "${RED}  ✗ [FAIL] VPS-01 Deploy encountered an error.${NC}\n"
    fi
}

deploy_vps02() {
    echo -e "${BOLD}${YELLOW}⏳ [2/3] Deploying Core Node update to VPS-02 (${VPS02})...${NC}"
    local cmd="cd /opt/nakharax && git fetch --all && git reset --hard origin/master && cd services/core/core && cargo build --release -p node && sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node && sudo systemctl restart nakharax-node"
    if ssh -o StrictHostKeyChecking=no "ubuntu@${VPS02}" "$cmd"; then
        echo -e "${GREEN}  ✓ [PASS] VPS-02 Validator 01 Updated & Live!${NC}\n"
    else
        echo -e "${RED}  ✗ [FAIL] VPS-02 Deploy encountered an error.${NC}\n"
    fi
}

deploy_vps03() {
    echo -e "${BOLD}${YELLOW}⏳ [3/3] Deploying Core Node update to VPS-03 (${VPS03})...${NC}"
    local cmd="cd /opt/nakharax && git fetch --all && git reset --hard origin/master && cd services/core/core && cargo build --release -p node && sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node && sudo systemctl restart nakharax-node"
    if ssh -o StrictHostKeyChecking=no "${USER}@${VPS03}" "$cmd"; then
        echo -e "${GREEN}  ✓ [PASS] VPS-03 Validator 02 Updated & Live!${NC}\n"
    else
        echo -e "${RED}  ✗ [FAIL] VPS-03 Deploy encountered an error.${NC}\n"
    fi
}

if [ "$TARGET" = "all" ] || [ "$TARGET" = "dashboard" ] || [ "$TARGET" = "vps01" ]; then
    deploy_vps01
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "vps02" ]; then
    deploy_vps02
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "vps03" ]; then
    deploy_vps03
fi

echo -e "${BOLD}${BLUE}======================================================================${NC}"
echo -e "${BOLD}${GREEN}  🏆 CONTINUOUS DEPLOYMENT CYCLE COMPLETE!${NC}"
echo -e "${BOLD}${BLUE}======================================================================${NC}"
