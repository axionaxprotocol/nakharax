<#
.SYNOPSIS
    Rebrand helper: preview / apply Nakharax -> nakharax.io identifier renames.

.DESCRIPTION
    DRY-RUN BY DEFAULT. Prints every file + match count for the chosen scope and changes nothing.
    Pass -Execute to actually rewrite files. Only touches git-tracked text files; always skips
    generated lockfiles, binaries, and meta-docs that intentionally reference the old name.

    Categories map to docs/REBRAND_MIGRATION.md:
      Full  Ordered, case-aware identifier rename (domain-first). Excludes the token symbol.
      A/B/C Sub-scopes (Rust strings / frontend pkg / deploy-coupled) — kept for targeted runs.
      D     On-chain token NAK -> NAK (surgical; review every hit before -Execute).

    Order matters: the domain (.org -> .io) and the GitHub org are replaced BEFORE the generic
    'nakharax' -> 'nakharax', so we never produce 'nakharax.org'.

.EXAMPLE
    pwsh scripts/rebrand-rename.ps1 -Category Full            # preview everything (no token)
    pwsh scripts/rebrand-rename.ps1 -Category Full -Execute   # apply, then rebuild + test
#>
[CmdletBinding()]
param(
    [ValidateSet('Full', 'A', 'B', 'C', 'D')]
    [string]$Category,
    [string]$Old,
    [string]$New,
    [switch]$Execute,
    # Path substrings to skip (defaults preserve docs that intentionally keep the old name).
    [string[]]$ExcludePath = @(
        'docs/REBRAND_MIGRATION.md', 'docs/NORTH_STAR.md', 'docs/REALITY_MAP.md',
        'README.md', 'reports/SECURITY_AUDIT'
    )
)

$ErrorActionPreference = 'Stop'

# Ordered replacements. MOST-SPECIFIC FIRST.
$domainFirst = @(
    @{ From = 'nakharax.io';     To = 'nakharax.io' },
    @{ From = 'axionaxprotocol'; To = 'axionaxprotocol' }   # GitHub org (rename the repo to match)
)
$generic = @(
    @{ From = 'NAKHARAX'; To = 'NAKHARAX' },   # env-var prefix, RUST_LOG, etc.
    @{ From = 'Nakharax'; To = 'Nakharax' },   # prose / TitleCase
    @{ From = 'nakharax'; To = 'nakharax' }     # crates, binary, packages, paths, imports
)
$presets = @{
    Full = $domainFirst + $generic
    A    = @( @{ From = '"nakharax-core"'; To = '"nakharax-core"' }, @{ From = 'nakharax-core/'; To = 'nakharax-core/' } )
    B    = @( @{ From = '@nakharax/sdk'; To = '@nakharax/sdk' }, @{ From = 'nakharax-os-dashboard'; To = 'nakharax-os-dashboard' } )
    C    = @( @{ From = 'NAKHARAX_'; To = 'NAKHARAX_' }, @{ From = 'nakharax-node'; To = 'nakharax-node' }, @{ From = 'nakharax.io'; To = 'nakharax.io' } )
    D    = @( @{ From = 'NAKt'; To = 'NAKt' }, @{ From = 'MockNAKToken'; To = 'MockNAKToken' }, @{ From = "'NAK'"; To = "'NAK'" }, @{ From = '"NAK"'; To = '"NAK"' }, @{ From = '`NAK`'; To = '`NAK`' } )
}

$pairs = @()
if ($Category) { $pairs += $presets[$Category] }
if ($Old) {
    if (-not $New) { throw '-Old requires -New' }
    $pairs += @{ From = $Old; To = $New }
}
if (-not $pairs) { throw 'Provide -Category <Full|A|B|C|D> and/or -Old/-New.' }

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    $tracked = & git ls-files
    $skipExt  = @('.png','.jpg','.jpeg','.ico','.pdf','.so','.lock','.woff','.woff2','.gz','.zip','.bin')
    $skipName = @('pnpm-lock.yaml','package-lock.json','Cargo.lock')

    $totalFiles = 0; $totalHits = 0
    foreach ($rel in $tracked) {
        $name = [System.IO.Path]::GetFileName($rel)
        $ext  = [System.IO.Path]::GetExtension($rel).ToLower()
        if ($skipExt -contains $ext) { continue }
        if ($skipName -contains $name) { continue }
        if ($ExcludePath | Where-Object { $rel -like "*$_*" }) { continue }

        $full = Join-Path $root $rel
        $content = Get-Content -Raw -LiteralPath $full -ErrorAction SilentlyContinue
        if ($null -eq $content) { continue }

        $hits = 0; $updated = $content
        foreach ($p in $pairs) {
            $c = ([regex]::Matches($updated, [regex]::Escape($p.From))).Count
            if ($c -gt 0) { $hits += $c; $updated = $updated.Replace($p.From, $p.To) }
        }
        if ($hits -gt 0) {
            $totalFiles++; $totalHits += $hits
            "{0,5}  {1}" -f $hits, $rel
            if ($Execute) { Set-Content -LiteralPath $full -Value $updated -NoNewline -Encoding utf8 }
        }
    }
    ''
    $mode = if ($Execute) { 'APPLIED' } else { 'DRY-RUN (no files changed)' }
    "[$mode] $totalHits matches across $totalFiles files."
    if (-not $Execute -and $totalHits -gt 0) { 'Re-run with -Execute to apply, then rebuild + test before committing.' }
}
finally { Pop-Location }
