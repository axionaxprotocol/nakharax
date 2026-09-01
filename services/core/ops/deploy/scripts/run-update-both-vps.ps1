# Run update on the two new Validator VPS instances. No legacy host defaults.
# Usage: from repo root or from ops/deploy:
#   .\scripts\run-update-both-vps.ps1 -ValidatorHosts @('<VPS02_IP>', '<VPS03_IP>')

param(
    [string]$User = "root",
    [Parameter(Mandatory = $true)]
    [ValidateCount(2, 2)]
    [string[]]$ValidatorHosts,
    [switch]$SkipApt,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DeployDir = Split-Path -Parent $ScriptDir
$ScriptName = "update-validator-vps.sh"

$args = @()
if ($SkipApt) { $args += "--skip-apt" }
if ($DryRun)  { $args += "--dry-run" }
$argStr = $args -join " "

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  Update both Validator VPS" -ForegroundColor Cyan
Write-Host "  $($ValidatorHosts -join ', ')" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$scriptPath = Join-Path $ScriptDir $ScriptName
if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: $scriptPath not found" -ForegroundColor Red
    exit 1
}

if (($ValidatorHosts | Sort-Object -Unique).Count -ne 2) {
    throw "The two validator host values must be unique."
}

foreach ($vps in $ValidatorHosts) {
    Write-Host "`n--- $vps ---" -ForegroundColor Yellow
    Write-Host "Copying script..."
    scp $scriptPath "${User}@${vps}:/tmp/$ScriptName"
    Write-Host "Running update..."
    if ($argStr) {
        ssh "${User}@${vps}" "bash /tmp/$ScriptName $argStr"
    } else {
        ssh "${User}@${vps}" "bash /tmp/$ScriptName"
    }
}

Write-Host "`n==============================================" -ForegroundColor Green
Write-Host "  Done both new Validator VPS instances" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
