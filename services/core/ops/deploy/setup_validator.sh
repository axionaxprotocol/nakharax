#!/bin/bash
# VPS Validator Automated Setup Script
# nakhara v1.6 Testnet
# Usage: bash setup_validator.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAKHARA_USER="nakhara"
NAKHARA_HOME="/home/$NAKHARA_USER/.nakhara"
REPO_URL="https://github.com/nakhara-io/nakhara-monolith.git"
REPO_DIR="nakhara-monolith"
BRANCH="main"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   nakhara Validator Setup Script v1.0        ${NC}"
echo -e "${GREEN}================================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Step 1: System Update
echo -e "\n${YELLOW}[1/9] Updating system packages...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential pkg-config libssl-dev \
    ufw htop net-tools software-properties-common jq python3-pip \
    python3-venv python3-dev protobuf-compiler

# Step 2: Create User
echo -e "\n${YELLOW}[2/9] Creating nakhara user...${NC}"
if id "$NAKHARA_USER" &>/dev/null; then
    echo "User $NAKHARA_USER already exists"
else
    useradd -m -s /bin/bash $NAKHARA_USER
    usermod -aG sudo $NAKHARA_USER
    GENERATED_PASSWORD=$(openssl rand -base64 24)
    echo "$NAKHARA_USER:$GENERATED_PASSWORD" | chpasswd
    chage -d 0 $NAKHARA_USER
    echo -e "${GREEN}User $NAKHARA_USER created. Initial password:${NC}"
    echo -e "${YELLOW}  $GENERATED_PASSWORD${NC}"
    echo -e "${RED}⚠️  Password change will be forced on first login.${NC}"
fi

# Step 3: Configure Firewall
echo -e "\n${YELLOW}[3/9] Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp     # SSH
ufw allow 30303/tcp  # P2P
ufw allow 30303/udp  # P2P Discovery
echo "Firewall configured (SSH + P2P ports open)"

# Step 4: Install Rust
echo -e "\n${YELLOW}[4/9] Installing Rust...${NC}"
su - $NAKHARA_USER << 'EOF'
if command -v rustc &> /dev/null; then
    echo "Rust already installed: $(rustc --version)"
else
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    rustup install nightly
    rustup default nightly
    echo "Rust installed successfully"
fi
EOF

# Step 5: Install Node.js
echo -e "\n${YELLOW}[5/9] Installing Node.js...${NC}"
if command -v node &> /dev/null; then
    echo "Node.js already installed: $(node --version)"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "Node.js installed: $(node --version)"
fi

# Step 6: Clone Repository
echo -e "\n${YELLOW}[6/9] Cloning nakhara repository...${NC}"
su - $NAKHARA_USER << EOF
if [ -d "$REPO_DIR" ]; then
    echo "Repository already cloned, pulling latest changes..."
    cd $REPO_DIR
    git pull origin $BRANCH
else
    git clone $REPO_URL
    cd $REPO_DIR
    git checkout $BRANCH
    echo "Repository cloned successfully"
fi
EOF

# Step 7: Build Node
echo -e "\n${YELLOW}[7/9] Building nakhara node (this may take 10-15 minutes)...${NC}"
su - $NAKHARA_USER << 'EOF'
cd ~/nakhara-monolith/services/core/core
source $HOME/.cargo/env
cargo build --release
echo "Build completed successfully"
EOF

# Install binary to system path
cp /home/$NAKHARA_USER/nakhara-monolith/services/core/core/target/release/nakhara-core /usr/local/bin/
chmod +x /usr/local/bin/nakhara-core
echo "Binary installed to /usr/local/bin/nakhara-core"

# Step 8: Setup Python Environment
echo -e "\n${YELLOW}[8/9] Setting up Python DeAI environment...${NC}"
su - $NAKHARA_USER << 'EOF'
cd ~/nakhara-monolith/services/core/core/deai
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
echo "Python environment setup complete"
EOF

# Step 9: Initialize Directory Structure
echo -e "\n${YELLOW}[9/9] Initializing directory structure...${NC}"
su - $NAKHARA_USER << 'EOF'
mkdir -p ~/.nakhara/{keystore,config,data,logs}
chmod 700 ~/.nakhara
chmod 700 ~/.nakhara/keystore

# Copy example config if present (else user creates manually)
if [ -f "$HOME/nakhara-monolith/services/core/ops/deploy/configs/rpc-config.toml" ]; then
    cp "$HOME/nakhara-monolith/services/core/ops/deploy/configs/rpc-config.toml" ~/.nakhara/config/
fi
if [ ! -f ~/.nakhara/config/config.yaml ]; then
    echo "Create ~/.nakhara/config/config.yaml (validator mode, bootstrap nodes). See docs."
fi

# Add environment variables to .bashrc
cat >> ~/.bashrc << 'ENVEOF'

# nakhara Environment
export NAKHARA_HOME="$HOME/.nakhara"
export NAKHARA_CONFIG="$NAKHARA_HOME/config/config.yaml"
export NAKHARA_KEYSTORE="$NAKHARA_HOME/keystore"
export RUST_LOG=info
export RUST_BACKTRACE=1
export PYTHONPATH="$HOME/nakhara-monolith/services/core/core/deai:$PYTHONPATH"
ENVEOF

source ~/.bashrc
echo "Directory structure initialized"
EOF

# Final Steps Summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}   Setup Complete! Next Steps:                 ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "1. Switch to nakhara user:"
echo -e "   ${YELLOW}su - nakhara${NC}"
echo ""
echo -e "2. Generate validator keys:"
echo -e "   ${YELLOW}nakhara-core keys generate --output ~/.nakhara/keystore/validator.json${NC}"
echo ""
echo -e "3. Edit configuration:"
echo -e "   ${YELLOW}nano ~/.nakhara/config/config.yaml${NC}"
echo -e "   - Set mode: 'validator'"
echo -e "   - Set validator name"
echo -e "   - Configure bootstrap nodes"
echo ""
echo -e "4. Wait for genesis.json from coordinator:"
echo -e "   ${YELLOW}wget https://testnet.nakhara.io/genesis.json -O ~/.nakhara/config/genesis.json${NC}"
echo ""
echo -e "5. Initialize node:"
echo -e "   ${YELLOW}nakhara-core init --config ~/.nakhara/config/config.yaml --genesis ~/.nakhara/config/genesis.json${NC}"
echo ""
echo -e "6. Setup systemd service (as root):"
echo -e "   ${YELLOW}sudo bash ~/nakhara-monolith/services/core/ops/deploy/scripts/setup_systemd.sh${NC}"
echo ""
echo -e "7. Start validator:"
echo -e "   ${YELLOW}sudo systemctl start nakhara-validator${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo -e "   - Change nakhara user password: ${YELLOW}passwd${NC}"
echo -e "   - Backup validator.json securely (offline)"
echo -e "   - Never share private keys"
echo -e "   - Setup SSH key authentication"
echo -e "   - Disable password SSH login"
echo ""
echo -e "For support: validators@nakhara.io"
echo -e "Documentation: https://docs.nakhara.io"
echo ""
