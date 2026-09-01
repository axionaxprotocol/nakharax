# Distribute the canonical Public Testnet genesis to all seven new VPS nodes.
# No host defaults are permitted. Example:
# .\ops\deploy\scripts\distribute-genesis.ps1 -Hosts @('<VPS01_IP>', ..., '<VPS07_IP>')

param(
    [string]$User = "root",
    [Parameter(Mandatory = $true)]
    [ValidateCount(7, 7)]
    [string[]]$Hosts
)

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
for ($i = 0; $i -lt 3; $i++) { $RepoRoot = Split-Path -Parent $RepoRoot }
$GenesisPath = Join-Path $RepoRoot "core\tools\genesis.json"
$RemoteDir = "~/.nakharax/config"
$RemotePath = "$RemoteDir/genesis.json"

if (-not (Test-Path $GenesisPath)) {
    Write-Host "Error: genesis.json not found at $GenesisPath" -ForegroundColor Red
    Write-Host "Run: cd core\tools; python create_genesis.py --verify" -ForegroundColor Yellow
    exit 1
}

$hash = (Get-FileHash -Path $GenesisPath -Algorithm SHA256).Hash.ToLower()
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Distribute Genesis to Seven New VPS Nodes" -ForegroundColor Cyan
Write-Host "  Genesis: $GenesisPath" -ForegroundColor Cyan
Write-Host "  SHA-256: 0x$hash" -ForegroundColor Cyan
Write-Host "  VPS: $($Hosts -join ', ')" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

if (($Hosts | Sort-Object -Unique).Count -ne 7) {
    throw "All seven VPS host values must be unique."
}

foreach ($vps in $Hosts) {
    Write-Host "`n--- $vps ---" -ForegroundColor Yellow
    Write-Host "Creating $RemoteDir if needed..."
    ssh "${User}@${vps}" "mkdir -p $RemoteDir"
    Write-Host "Uploading genesis.json..."
    scp $GenesisPath "${User}@${vps}:${RemotePath}"
    Write-Host "Verifying hash on remote..."
    $remoteHash = ssh "${User}@${vps}" "sha256sum $RemotePath 2>/dev/null | awk '{print `$1}'"
    if ($remoteHash -eq $hash) {
        Write-Host "  OK: Hash matches on $vps" -ForegroundColor Green
    } else {
        throw "Hash mismatch on $vps (local $hash vs remote $remoteHash)"
    }
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "  Done. All seven nodes have the same genesis hash." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
