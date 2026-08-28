$binDir = "D:\nakhara-io\bin"
if (-not (Test-Path $binDir)) { 
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null 
}

Write-Host "Fetching latest llama.cpp standalone release for Windows..." -ForegroundColor Cyan

try {
    $apiUrl = "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest"
    $rel = Invoke-RestMethod -Uri $apiUrl -Headers @{ "User-Agent" = "NakharaX-Installer" }
    
    $asset = $rel.assets | Where-Object { $_.name -like "*bin-win-avx2-x64.zip" } | Select-Object -First 1
    if (-not $asset) {
        $asset = $rel.assets | Where-Object { $_.name -like "*bin-win-x64.zip" } | Select-Object -First 1
    }
    
    if ($asset) {
        Write-Host "Found Asset: $($asset.name)" -ForegroundColor Green
        Write-Host "Download URL: $($asset.browser_download_url)" -ForegroundColor Gray
        
        $zipFile = Join-Path $binDir "llama-win.zip"
        & curl.exe -L -o $zipFile $asset.browser_download_url
        
        Write-Host "Extracting binaries..." -ForegroundColor Yellow
        Expand-Archive -Path $zipFile -DestinationPath $binDir -Force
        Remove-Item $zipFile -Force -ErrorAction SilentlyContinue
        
        Write-Host "[OK] Installation complete!" -ForegroundColor Green
        Get-ChildItem $binDir | Select-Object Name, Length
    } else {
        Write-Host "[!] Could not find Windows zip asset in release." -ForegroundColor Red
    }
} catch {
    Write-Host "[!] Error: $_" -ForegroundColor Red
}
