# =============================================================================
# 🚀 NakharaX Protocol — Automated Multi-Node Continuous Deployment (CD)
# Deploys latest master commit across the 3 Cloud VPS Cluster via SSH
# =============================================================================

[CmdletBinding()]
param(
    [string]$Target = "all", # "all", "vps01", "vps02", "vps03", "dashboard"
    [string]$User = "root"
)

$ErrorActionPreference = "Continue"

$VPS01 = "158.220.127.24" # Germany Master Hub
$VPS02 = "40.160.87.118"  # Virginia Validator 01
$VPS03 = "217.216.39.77"  # Singapore Validator 02

Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "   🚀 NAKHARAX PROTOCOL: 1-CLICK CONTINUOUS DEPLOYMENT (CD)           " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "  • Target Scope : $Target"
Write-Host "  • VPS-01 Hub   : $VPS01 (Germany)"
Write-Host "  • VPS-02 Val01 : $VPS02 (Virginia)"
Write-Host "  • VPS-03 Val02 : $VPS03 (Singapore)"
Write-Host "======================================================================`n" -ForegroundColor Blue

function Deploy-VPS01-Dashboard {
    Write-Host "⏳ [1/3] Deploying Web OS Dashboard update to VPS-01 ($VPS01)..." -ForegroundColor Yellow
    $cmd = "cd /opt/nakharax && git fetch --all && git reset --hard origin/master && pnpm --filter nakharax-os-dashboard build && pm2 restart nakharax-dashboard"
    ssh "$User@$VPS01" $cmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ [PASS] VPS-01 Web OS Dashboard Updated & Live!`n" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ [FAIL] VPS-01 Deploy encountered an error.`n" -ForegroundColor Red
    }
}

function Deploy-VPS02-Validator {
    Write-Host "⏳ [2/3] Deploying Core Node update to VPS-02 ($VPS02)..." -ForegroundColor Yellow
    $cmd = "cd /opt/nakharax && git fetch --all && git reset --hard origin/master && cd services/core/core && cargo build --release -p node && sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node && sudo systemctl restart nakharax-node"
    ssh "ubuntu@$VPS02" $cmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ [PASS] VPS-02 Validator 01 Updated & Live!`n" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ [FAIL] VPS-02 Deploy encountered an error.`n" -ForegroundColor Red
    }
}

function Deploy-VPS03-Validator {
    Write-Host "⏳ [3/3] Deploying Core Node update to VPS-03 ($VPS03)..." -ForegroundColor Yellow
    $cmd = "cd /opt/nakharax && git fetch --all && git reset --hard origin/master && cd services/core/core && cargo build --release -p node && sudo install -o root -g root -m 0755 target/release/nakharax-node /usr/local/bin/nakharax-node && sudo systemctl restart nakharax-node"
    ssh "$User@$VPS03" $cmd
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ [PASS] VPS-03 Validator 02 Updated & Live!`n" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ [FAIL] VPS-03 Deploy encountered an error.`n" -ForegroundColor Red
    }
}

if ($Target -eq "all" -or $Target -eq "dashboard" -or $Target -eq "vps01") {
    Deploy-VPS01-Dashboard
}

if ($Target -eq "all" -or $Target -eq "vps02") {
    Deploy-VPS02-Validator
}

if ($Target -eq "all" -or $Target -eq "vps03") {
    Deploy-VPS03-Validator
}

Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "  🏆 CONTINUOUS DEPLOYMENT CYCLE COMPLETE!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Blue
