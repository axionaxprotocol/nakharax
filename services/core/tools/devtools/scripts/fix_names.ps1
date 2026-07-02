# Fix protocol naming across workspace
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Fixing protocol names..." -ForegroundColor Cyan

$extensions = "*.md","*.ts","*.tsx","*.html","*.json","*.toml","*.rs","*.go","*.py","*.sh","*.yml"
$count = 0

Get-ChildItem -Path D:\Desktop\nakharaxius01 -Recurse -Include $extensions -File | Where-Object {
    $_.FullName -notmatch "node_modules|\.git|dist|build|target|out|\.next"
} | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    if ($null -eq $content) { return }
    
    $newContent = $content -replace "Nakharax Protocol", "nakharax protocol"
    $newContent = $newContent -replace "Nakharax protocol", "nakharax protocol"
    $newContent = $newContent -replace "Nakharax Protocol", "nakharax protocol"
    
    if ($content -ne $newContent) {
        Set-Content -Path $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host "Done! Modified $count files" -ForegroundColor Yellow
