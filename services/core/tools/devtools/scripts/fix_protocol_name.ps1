# Fix "AxionAX protocol" to "nakhara protocol" across all files
# Run this script from the workspace root

Write-Host "🔍 Searching for 'AxionAX protocol' or 'AxionAX Protocol'..." -ForegroundColor Cyan

$replacements = @(
    @{ Old = "AxionAX Protocol"; New = "nakhara protocol" },
    @{ Old = "AxionAX protocol"; New = "nakhara protocol" },
    @{ Old = "Nakhara Protocol"; New = "nakhara protocol" }
)

$extensions = @("*.md", "*.ts", "*.tsx", "*.html", "*.json", "*.toml", "*.rs", "*.go", "*.py", "*.sh", "*.yml", "*.yaml")

$totalFiles = 0
$totalReplacements = 0

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path . -Recurse -Include $ext -File -ErrorAction SilentlyContinue | Where-Object {
        $_.FullName -notmatch "node_modules|\.git|dist|build|target|out"
    }
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        
        if ($null -eq $content) { continue }
        
        $modified = $false
        $originalContent = $content
        
        foreach ($replacement in $replacements) {
            if ($content -match [regex]::Escape($replacement.Old)) {
                $content = $content -replace [regex]::Escape($replacement.Old), $replacement.New
                $modified = $true
            }
        }
        
        if ($modified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            $totalFiles++
            
            # Count replacements in this file
            $fileReplacements = 0
            foreach ($replacement in $replacements) {
                $matches = [regex]::Matches($originalContent, [regex]::Escape($replacement.Old))
                $fileReplacements += $matches.Count
            }
            $totalReplacements += $fileReplacements
            
            Write-Host "✅ Fixed: $($file.FullName) ($fileReplacements replacements)" -ForegroundColor Green
        }
    }
}

Write-Host "`n✨ Done!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   - Files modified: $totalFiles" -ForegroundColor Yellow
Write-Host "   - Total replacements: $totalReplacements" -ForegroundColor Yellow
