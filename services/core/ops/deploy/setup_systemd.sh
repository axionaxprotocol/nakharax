#!/bin/bash
# Systemd Service Setup for nakharax Validator
# Run as root: sudo bash setup_systemd.sh

set -e

NAKHARAX_USER="nakharax"
SERVICE_FILE="/etc/systemd/system/nakharax-validator.service"

echo "Setting up nakharax Validator systemd service..."

# Create service file
cat > $SERVICE_FILE << 'EOF'
[Unit]
Description=nakharax Validator Node
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=nakharax
Group=nakharax
WorkingDirectory=/home/nakharax/nakharax-monolith

# Environment
Environment="NAKHARAX_HOME=/home/nakharax/.nakharax"
Environment="RUST_LOG=info"
Environment="RUST_BACKTRACE=1"
Environment="PYTHONPATH=/home/nakharax/nakharax-monolith/services/core/core/deai"

# Start command
ExecStart=/usr/local/bin/nakharax-core start \
    --config /home/nakharax/.nakharax/config/config.yaml \
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
StandardOutput=append:/home/nakharax/.nakharax/logs/validator.log
StandardError=append:/home/nakharax/.nakharax/logs/validator.error.log
SyslogIdentifier=nakharax-validator

[Install]
WantedBy=multi-user.target
EOF

echo "Service file created at $SERVICE_FILE"

# Reload systemd
systemctl daemon-reload
echo "Systemd reloaded"

# Enable service
systemctl enable nakharax-validator
echo "Service enabled (will start on boot)"

echo ""
echo "Setup complete! To control the validator:"
echo "  Start:   sudo systemctl start nakharax-validator"
echo "  Stop:    sudo systemctl stop nakharax-validator"
echo "  Restart: sudo systemctl restart nakharax-validator"
echo "  Status:  sudo systemctl status nakharax-validator"
echo "  Logs:    journalctl -u nakharax-validator -f"
echo ""
