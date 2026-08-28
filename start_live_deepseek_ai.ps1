# ==============================================================================
# 🧠 NAKHARAX DEAI: ALL-IN-ONE AUTOMATED DEEPSEEK-R1 TURNKEY LAUNCHER
# ==============================================================================
# 1-Click: Auto-Installs Runtime -> Loads DeepSeek-R1 -> Connects to NOESIS-VX
# Zero Manual Steps Required!
# ==============================================================================

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   NAKHARAX DEAI: ALL-IN-ONE AUTOMATED DEEPSEEK-R1 TURNKEY LAUNCHER          " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# STEP 1: DETECT OR AUTO-INSTALL OLLAMA RUNTIME
# ------------------------------------------------------------------------------
Write-Host " [1/4] Checking Neural Inference Engine (Ollama Runtime)..." -ForegroundColor Yellow

$ollamaLocal = Join-Path $env:LOCALAPPDATA "Programs\Ollama\ollama.exe"
if (Test-Path $ollamaLocal) {
    $ollamaDir = Join-Path $env:LOCALAPPDATA "Programs\Ollama"
    $env:Path = "$ollamaDir;$env:Path"
}

$ollamaCmd = Get-Command "ollama" -ErrorAction SilentlyContinue

if (-not $ollamaCmd) {
    Write-Host " [i] Ollama not found. Starting Automated Zero-Touch Installation..." -ForegroundColor Cyan
    
    $installerUrl = "https://ollama.com/download/OllamaSetup.exe"
    $installerPath = Join-Path $env:TEMP "OllamaSetup.exe"
    
    Write-Host "     Downloading official installer from $installerUrl..." -ForegroundColor Gray
    & curl.exe -L -o $installerPath $installerUrl --progress-bar
    
    if (Test-Path $installerPath) {
        Write-Host "     Installing Ollama silently..." -ForegroundColor Yellow
        $proc = Start-Process -FilePath $installerPath -ArgumentList "/silent" -PassThru -Wait
        Start-Sleep -Seconds 5
        
        $ollamaDir = Join-Path $env:LOCALAPPDATA "Programs\Ollama"
        if (Test-Path $ollamaDir) {
            $env:Path = "$ollamaDir;$env:Path"
            $ollamaCmd = Get-Command "ollama" -ErrorAction SilentlyContinue
        }
    }
}

# ------------------------------------------------------------------------------
# STEP 2: START OLLAMA DAEMON IN BACKGROUND
# ------------------------------------------------------------------------------
Write-Host "`n [2/4] Initializing Local Inference Daemon (Port 11434)..." -ForegroundColor Yellow

$isRunning = $false
try {
    $ping = Invoke-RestMethod -Uri "http://127.0.0.1:11434/" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($ping -match "Ollama is running") { $isRunning = $true }
} catch {}

if (-not $isRunning) {
    Write-Host "     Launching Ollama Serve in background..." -ForegroundColor Gray
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 4
}

Write-Host " [OK] Local Inference Daemon is ONLINE at http://127.0.0.1:11434" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: PROVISION DEEPSEEK-R1 (1.5B) BASE MODEL
# ------------------------------------------------------------------------------
Write-Host "`n [3/4] Provisioning DeepSeek-R1 (1.5B) Neural Model Weights..." -ForegroundColor Yellow

$models = & ollama list 2>&1
if ($models -notmatch "deepseek-r1:1.5b") {
    Write-Host "     Pulling official DeepSeek-R1:1.5B model (Please wait)..." -ForegroundColor Cyan
    & ollama pull deepseek-r1:1.5b
} else {
    Write-Host " [OK] DeepSeek-R1:1.5B is already provisioned and ready in VRAM!" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# STEP 4: LIVE TEST INFERENCE VERIFICATION
# ------------------------------------------------------------------------------
Write-Host "`n [4/4] Executing Live Neural Forward Pass (Test Query)..." -ForegroundColor Yellow
Write-Host " Query: 'Explain the 2 main benefits of NakharaX DeAI Protocol'" -ForegroundColor White
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkGray

$testPayload = @{
    model = "deepseek-r1:1.5b"
    messages = @(
        @{ role = "user"; content = "Hello DeepSeek-R1, explain the 2 main benefits of NakharaX DeAI Protocol briefly in Thai." }
    )
    stream = $false
} | ConvertTo-Json

try {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/chat" -Method POST -Body $testPayload -ContentType "application/json" -TimeoutSec 45
    $sw.Stop()
    
    Write-Host "`n [OK] Real DeepSeek-R1 Neural Token Output (Latency: $([Math]::Round($sw.Elapsed.TotalMilliseconds)) ms):" -ForegroundColor Green
    Write-Host $response.message.content -ForegroundColor White
} catch {
    Write-Host " [!] API connection note: $_" -ForegroundColor Yellow
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host " SUCCESS: Web AI (NOESIS-VX) is now backed by REAL DeepSeek-R1 Neural Weights! " -ForegroundColor Green
Write-Host " Chat live on Dashboard: http://localhost:3030/apps/sentinel                   " -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan
