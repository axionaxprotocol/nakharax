<#
.SYNOPSIS
    Rebrand helper: preview / apply Axionax -> nakhara.io identifier renames by category.

.DESCRIPTION
    DRY-RUN BY DEFAULT. Prints every file + match count for the chosen scope and changes nothing.
    Pass -Execute to actually rewrite files. Always excludes build/vendor dirs and binary files,
    and only touches git-tracked text files.

    Categories map to docs/REBRAND_MIGRATION.md:
      A  Safe / internal Rust strings (network-advertised identity)   [low risk]
      B  Frontend internal (@axionax/sdk, dashboard package)          [verify with pnpm build]
      C  Deploy-coupled (binary, AXIONAX_* env, domain)              [needs server cut-over]
      D  On-chain token (AXX -> NAK)                                  [token phase]

    !! Never run -Execute on category C or D without the matching server/chain change staged. !!

.EXAMPLE
    pwsh scripts/rebrand-rename.ps1 -Category B            # preview frontend rename
    pwsh scripts/rebrand-rename.ps1 -Category B -Execute   # apply it (then: pnpm install && build)
    pwsh scripts/rebrand-rename.ps1 -Old 'foo' -New 'bar'  # custom preview
#>
[CmdletBinding()]
param(
    [ValidateSet('A', 'B', 'C', 'D')]
    [string]$Category,
    [string]$Old,
    [string]$New,
    [switch]$Execute
)

$ErrorActionPreference = 'Stop'

# Ordered (from -> to) pairs per category. Order matters: longest/most-specific first.
$presets = @{
    A = @(
        @{ From = '"axionax-core"'; To = '"nakhara-core"' },
        @{ From = 'axionax-core/';  To = 'nakhara-core/' }
    )
    B = @(
        @{ From = '@axionax/sdk';        To = '@nakhara/sdk' },
        @{ From = 'axionax-os-dashboard'; To = 'nakhara-os-dashboard' }
    )
    C = @(
        @{ From = 'AXIONAX_'; To = 'NAKHARA_' },
        @{ From = 'axionax-node'; To = 'nakhara-node' },
        @{ From = 'axionax.org'; To = 'nakhara.io' }
    )
    D = @(
        @{ From = 'AXXt'; To = 'NAKt' },
        @{ From = 'AXX';  To = 'NAK' }
    )
}

# Build the work list of replacements.
$pairs = @()
if ($Category) { $pairs += $presets[$Category] }
if ($Old) {
    if (-not $New) { throw '-Old requires -New' }
    $pairs += @{ From = $Old; To = $New }
}
if (-not $pairs) { throw 'Provide -Category <A|B|C|D> and/or -Old/-New.' }

# Repo root = parent of this script's dir.
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    # Only git-tracked files (keeps us out of node_modules/.next/target and untracked junk).
    $tracked = & git ls-files
    $excludeExt = @('.png','.jpg','.jpeg','.ico','.pdf','.so','.lock','.woff','.woff2','.gz','.zip','.bin')

    $totalFiles = 0
    $totalHits = 0
    foreach ($rel in $tracked) {
        $ext = [System.IO.Path]::GetExtension($rel).ToLower()
        if ($excludeExt -contains $ext) { continue }
        $full = Join-Path $root $rel
        if (-not (Test-Path $full)) { continue }

        $content = Get-Content -Raw -LiteralPath $full -ErrorAction SilentlyContinue
        if ($null -eq $content) { continue }

        $fileHits = 0
        $updated = $content
        foreach ($p in $pairs) {
            $count = ([regex]::Matches($updated, [regex]::Escape($p.From))).Count
            if ($count -gt 0) {
                $fileHits += $count
                $updated = $updated.Replace($p.From, $p.To)
            }
        }

        if ($fileHits -gt 0) {
            $totalFiles++
            $totalHits += $fileHits
            "{0,5}  {1}" -f $fileHits, $rel
            if ($Execute) {
                Set-Content -LiteralPath $full -Value $updated -NoNewline -Encoding utf8
            }
        }
    }

    ''
    $mode = if ($Execute) { 'APPLIED' } else { 'DRY-RUN (no files changed)' }
    "[$mode] $totalHits matches across $totalFiles files."
    if (-not $Execute -and $totalHits -gt 0) {
        'Re-run with -Execute to apply. Then rebuild + test before committing.'
    }
}
finally {
    Pop-Location
}
