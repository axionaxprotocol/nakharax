#!/bin/bash
# Systemd Service Setup for nakhara Validator
# Run as root: sudo bash setup_systemd.sh

set -e

NAKHARA_USER="nakhara"
SERVICE_FILE="/etc/systemd/system/nakhara-validator.service"

echo "Setting up nakhara Validator systemd service..."

# Create service file
cat > $SERVICE_FILE << 'EOF'
[Unit]
Description=nakhara Validator Node
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=nakhara
Group=nakhara
WorkingDirectory=/home/nakhara/nakhara-monolith

# Environment
Environment="NAKHARA_HOME=/home/nakhara/.nakhara"
Environment="RUST_LOG=info"
Environment="RUST_BACKTRACE=1"
Environment="PYTHONPATH=/home/nakhara/nakhara-monolith/services/core/core/deai"

# Start command
ExecStart=/usr/local/bin/nakhara-core start \
    --config /home/nakhara/.nakhara/config/config.yaml \
    --validator

# Restart policy
Restart=always
RestartSec=10
LimitNOFILE=65535

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only

# Logging
StandardOutput=append:/home/nakhara/.nakhara/logs/validator.log
StandardError=append:/home/nakhara/.nakhara/logs/validator.error.log
SyslogIdentifier=nakhara-validator

[Install]
WantedBy=multi-user.target
EOF

echo "Service file created at $SERVICE_FILE"

# Reload systemd
systemctl daemon-reload
echo "Systemd reloaded"

# Enable service
systemctl enable nakhara-validator
echo "Service enabled (will start on boot)"

echo ""
echo "Setup complete! To control the validator:"
echo "  Start:   sudo systemctl start nakhara-validator"
echo "  Stop:    sudo systemctl stop nakhara-validator"
echo "  Restart: sudo systemctl restart nakhara-validator"
echo "  Status:  sudo systemctl status nakhara-validator"
echo "  Logs:    journalctl -u nakhara-validator -f"
echo ""
