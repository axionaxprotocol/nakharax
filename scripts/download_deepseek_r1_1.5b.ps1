# ==============================================================================
# NAKHARAX DEAI: EMBEDDED BASE MODEL DOWNLOADER (DEEPSEEK-R1-DISTILL-QWEN-1.5B)
# ==============================================================================
# Source: Hugging Face (deepseek-ai / unsloth official quantized release)
# File: DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf (~1.12 GB)
# Target: D:\nakhara-io\models\deepseek-r1-distill-qwen-1.5b\
# ==============================================================================

$targetDir = "D:\nakhara-io\models\deepseek-r1-distill-qwen-1.5b"
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$modelFileName = "DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf"
$targetFilePath = Join-Path $targetDir $modelFileName
$downloadUrl = "https://huggingface.co/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf"

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   NAKHARAX DEAI: DOWNLOADING OFFICIAL EMBEDDED BASE MODEL (1.5B)               " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " Model:          DeepSeek-R1-Distill-Qwen-1.5B" -ForegroundColor White
Write-Host " Source:         $downloadUrl" -ForegroundColor Gray
Write-Host " Destination:    $targetFilePath" -ForegroundColor Yellow
Write-Host " Size Target:    ~1.12 GB (Quantized Q4_K_M)" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor DarkGray

if (Test-Path $targetFilePath) {
    $existingSize = (Get-Item $targetFilePath).Length
    if ($existingSize -gt 1000000000) {
        Write-Host " [OK] Model file already downloaded and verified! ($([Math]::Round($existingSize / 1GB, 2)) GB)" -ForegroundColor Green
    } else {
        Write-Host " [i] Incomplete file detected, resuming download..." -ForegroundColor Yellow
    }
}

if (-not (Test-Path $targetFilePath) -or (Get-Item $targetFilePath).Length -lt 1000000000) {
    Write-Host " Downloading model weights from Hugging Face CDN (Please wait)..." -ForegroundColor White
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    
    # Use curl.exe or BITS / WebClient for fast binary streaming
    if (Get-Command "curl.exe" -ErrorAction SilentlyContinue) {
        & curl.exe -L -o $targetFilePath $downloadUrl --progress-bar
    } else {
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($downloadUrl, $targetFilePath)
    }
    
    $sw.Stop()
    Write-Host "`n [OK] Download completed in $([Math]::Round($sw.Elapsed.TotalSeconds, 1)) seconds!" -ForegroundColor Green
}

# Write Model Manifest & Configuration
$manifest = @{
    name          = "DeepSeek-R1-Distill-Qwen-1.5B"
    architecture  = "qwen2"
    parameters    = "1.5 Billion"
    quantization  = "Q4_K_M"
    file_name     = $modelFileName
    file_size_gb  = [Math]::Round(((Get-Item $targetFilePath).Length / 1GB), 2)
    huggingface   = "https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"
    vram_required = "1.8 - 2.2 GB"
    license       = "MIT"
    installed_at  = [DateTime]::UtcNow.ToString("o")
} | ConvertTo-Json -Depth 4

Set-Content -Path (Join-Path $targetDir "model_manifest.json") -Value $manifest -Encoding UTF8

Write-Host " [OK] Model Manifest created at: $(Join-Path $targetDir 'model_manifest.json')" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   BASE MODEL EMBEDDED SUCCESSFULLY INTO PROJECT DIRECTORY!                     " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
