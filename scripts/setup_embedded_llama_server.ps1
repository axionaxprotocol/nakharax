# ==============================================================================
# NAKHARAX DEAI: EMBEDDED LLAMA.CPP INFERENCE SERVER RUNNER
# ==============================================================================
# Binds DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf directly into port 8080/11434
# ==============================================================================

$binDir = "D:\nakhara-io\bin"
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }

$serverExe = Join-Path $binDir "llama-server.exe"
$modelPath = "D:\nakhara-io\models\deepseek-r1-distill-qwen-1.5b\DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf"

if (-not (Test-Path $modelPath)) {
    Write-Host "[!] Model not found at $modelPath. Please download first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $serverExe)) {
    Write-Host "[1/2] Fetching standalone llama.cpp Windows runner..." -ForegroundColor Cyan
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest" -Headers @{ "User-Agent" = "NakharaX" }
        $asset = $release.assets | Where-Object { $_.name -match "bin-win-avx2-x64\.zip" -or $_.name -match "bin-win-x64\.zip" } | Select-Object -First 1
        
        if ($asset) {
            $zipPath = Join-Path $binDir "llama-win.zip"
            Write-Host "Downloading $($asset.name)..." -ForegroundColor Gray
            & curl.exe -L -o $zipPath $asset.browser_download_url
            
            Expand-Archive -Path $zipPath -DestinationPath $binDir -Force
            Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
            Write-Host "[OK] Standalone llama-server installed!" -ForegroundColor Green
        }
    } catch {
        Write-Host "[i] Could not download llama.cpp binary from github releases: $_" -ForegroundColor Yellow
    }
}

if (Test-Path $serverExe) {
    Write-Host "`n================================================================================" -ForegroundColor Green
    Write-Host "   LAUNCHING NATIVE EMBEDDED DEEPSEEK-R1 (1.5B) BASE MODEL SERVER               " -ForegroundColor Cyan
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host " Model: $modelPath" -ForegroundColor White
    Write-Host " Port:  http://127.0.0.1:8080 (OpenAI Compatible API)" -ForegroundColor Yellow
    Write-Host "================================================================================`n" -ForegroundColor Green

    # Launch native server with 2048 context window and 4 threads
    & $serverExe -m $modelPath --port 8080 -c 2048 -t 4 --host 127.0.0.1
} else {
    Write-Host "[i] Standalone binary unavailable. You can launch using Ollama:" -ForegroundColor Yellow
    Write-Host "    ollama create deepseek-r1-1.5b -f Modelfile" -ForegroundColor Gray
}
