# =============================================================================
# NakharaX Protocol — Enterprise Local CI/CD Pipeline (PowerShell / Windows)
# Standard: Fast-Fail, Hermetic, Multi-Layer Monorepo Verification
# Stages: Quality Gate -> Smart Contracts -> Rust Core -> Genesis Gate -> Web Build
# =============================================================================

[CmdletBinding()]
param(
    [switch]$FastFail = $true,
    [switch]$Quick = $false
)

$ErrorActionPreference = "Stop"
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$RootDir = (Get-Item $PSScriptRoot).Parent.FullName
$TotalStages = if ($Quick) { 3 } else { 5 }
$FailedStages = 0

Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "   NAKHARAX PROTOCOL: ENTERPRISE LOCAL CI/CD PIPELINE (WINDOWS)    " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Blue
Write-Host "  * Monorepo Root : $RootDir"
Write-Host "  * Mode          : $(if ($Quick) { 'Quick Mode' } else { 'Full Release Gate' })"
Write-Host "  * Target Branch : $(git rev-parse --abbrev-ref HEAD 2>$null)"
Write-Host "  * Commit SHA    : $(git rev-parse --short HEAD 2>$null)"
Write-Host "  * Timestamp     : $((Get-Date).ToUniversalTime().ToString('u'))"
Write-Host "======================================================================`n" -ForegroundColor Blue

function Invoke-Stage {
    param(
        [int]$StageNum,
        [string]$StageName,
        [scriptblock]$Action
    )

    Write-Host "[Stage $StageNum/$TotalStages] $StageName..." -ForegroundColor Yellow
    $stageSw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        & $Action
        $stageSw.Stop()
        $duration = [Math]::Round($stageSw.Elapsed.TotalSeconds, 1)
        Write-Host "  + [PASS] $StageName (${duration}s)`n" -ForegroundColor Green
    }
    catch {
        $stageSw.Stop()
        $duration = [Math]::Round($stageSw.Elapsed.TotalSeconds, 1)
        Write-Host "  - [FAIL] $StageName (${duration}s)`n" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $script:FailedStages++
        if ($FastFail) {
            Invoke-Summary
            exit 1
        }
    }
}

function Invoke-Summary {
    $sw.Stop()
    $totalDuration = [Math]::Round($sw.Elapsed.TotalSeconds, 1)
    Write-Host "======================================================================" -ForegroundColor Blue
    if ($script:FailedStages -eq 0) {
        Write-Host "  ALL $TotalStages CI/CD STAGES PASSED SUCCESSFULLY! (${totalDuration}s)" -ForegroundColor Green
        Write-Host "  Codebase is 100% compliant with enterprise release standards." -ForegroundColor Green
    }
    else {
        Write-Host "  CI/CD PIPELINE FAILED: $script:FailedStages Stage(s) with errors. (${totalDuration}s)" -ForegroundColor Red
        Write-Host "  Please remediate the failed checks before pushing or deploying." -ForegroundColor Red
    }
    Write-Host "======================================================================" -ForegroundColor Blue
}

# --- Ensure Rust Toolchain in PATH ---
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:USERPROFILE\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;$env:PATH"

# Stage 1: Static Lint & Typecheck Gate
Invoke-Stage 1 "Static Lint, Typecheck & Rust Formatting" {
    pnpm --filter @nakharax/sdk typecheck
    Push-Location (Join-Path $RootDir "services/core/core")
    try {
        cargo fmt --all -- --check
        if ($LASTEXITCODE -ne 0) { throw "cargo fmt failed" }
        cargo clippy --workspace --all-targets -- -D warnings
        if ($LASTEXITCODE -ne 0) { throw "cargo clippy failed" }
    }
    finally {
        Pop-Location
    }
}

# Stage 2: Hardhat Smart Contracts Verification
Invoke-Stage 2 "Smart Contracts Unit & Fuzz Verification" {
    pnpm --filter @nakharax/contracts compile
    if ($LASTEXITCODE -ne 0) { throw "Hardhat compilation failed" }
    pnpm --filter @nakharax/contracts test
    if ($LASTEXITCODE -ne 0) { throw "Hardhat unit tests failed" }
}

# Stage 3: Layer-1 Rust Core Workspace Tests
Invoke-Stage 3 "Layer-1 Consensus & P2P Rust Test Suite (320+ Tests)" {
    Push-Location (Join-Path $RootDir "services/core/core")
    try {
        cargo test --workspace --all-features --quiet
        if ($LASTEXITCODE -ne 0) { throw "cargo test failed" }
    }
    finally {
        Pop-Location
    }
}

if (-not $Quick) {
    # Stage 4: Genesis Invariants & Protocol Integrity
    Invoke-Stage 4 "Genesis Manifest & Protocol Integrity Gate" {
        python (Join-Path $RootDir "services/core/core/tools/create_genesis.py") --verify
        if ($LASTEXITCODE -ne 0) { throw "create_genesis.py verify failed" }
        
        Push-Location (Join-Path $RootDir "services/core/core")
        try {
            cargo run -p genesis --bin genesis-export -- tools/genesis_canonical.json
            if ($LASTEXITCODE -ne 0) { throw "genesis-export failed" }
        }
        finally {
            Pop-Location
        }
    }

    # Stage 5: Web OS Dashboard Production Build
    Invoke-Stage 5 "Next.js Web OS Dashboard Production Build" {
        pnpm --filter nakharax-os-dashboard build
        if ($LASTEXITCODE -ne 0) { throw "Next.js production build failed" }
    }
}

Invoke-Summary
if ($FailedStages -gt 0) { exit 1 } else { exit 0 }
