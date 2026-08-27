import os
import sys
from pathlib import Path
from collections import defaultdict

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

EXCLUDE_DIRS = {
    '.git', 'node_modules', '.next', 'target', '.cache', '.pnpm-store',
    'dist', 'build', '.pytest_cache', '.turbo', '.codex-logs', 'tmp_node_transfer',
    '.antigravitycli', '.vscode', '.idea'
}

EXTENSIONS = {
    # Core Languages
    '.rs': 'Rust',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.py': 'Python',
    '.sol': 'Solidity (Smart Contracts)',
    '.mjs': 'Node ESM',
    '.cjs': 'Node CJS',
    
    # Web & Style
    '.css': 'CSS / Tailwind',
    '.scss': 'SCSS',
    '.html': 'HTML',
    '.svg': 'SVG Vector Assets',
    
    # Config & Infra
    '.json': 'JSON Config / TopoJSON',
    '.yaml': 'YAML Config / CI',
    '.yml': 'YAML Config / CI',
    '.toml': 'TOML Config (Cargo/Worker)',
    '.sh': 'Shell Script',
    '.ps1': 'PowerShell Script',
    '.dockerfile': 'Docker & Caddyfile',
    
    # Docs & Specs
    '.md': 'Markdown Documentation',
}

stats = defaultdict(lambda: {'files': 0, 'lines': 0, 'bytes': 0})
module_stats = defaultdict(lambda: {'files': 0, 'lines': 0})

root_dir = Path('D:/nakhara-io')
total_files = 0
total_lines = 0
total_bytes = 0

for root, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
    rel_root = Path(root).relative_to(root_dir)
    top_module = rel_root.parts[0] if rel_root.parts else 'root'
    
    for f in files:
        if f.startswith('.'):
            continue
        p = Path(root) / f
        ext = p.suffix.lower()
        if not ext and f.lower() in ('dockerfile', 'caddyfile', 'caddyfile.prod'):
            ext = '.dockerfile'
            
        if ext in EXTENSIONS:
            lang = EXTENSIONS[ext]
            try:
                content = p.read_bytes()
                size = len(content)
                lines = content.count(b'\n') + (1 if content and not content.endswith(b'\n') else 0)
                stats[lang]['files'] += 1
                stats[lang]['lines'] += lines
                stats[lang]['bytes'] += size
                
                module_stats[top_module]['files'] += 1
                module_stats[top_module]['lines'] += lines
                
                total_files += 1
                total_lines += lines
                total_bytes += size
            except Exception:
                pass

print("=" * 82)
print("          📊 NAKHARAX PROTOCOL CODEBASE: COMPLETE AUDIT METRICS")
print("=" * 82)
print(f"[*] Total Verified Source Files : {total_files:,} files")
print(f"[*] Total Lines of Code (LOC)   : {total_lines:,} lines")
print(f"[*] Total Codebase Size         : {total_bytes / (1024*1024):,.2f} MB")
print("=" * 82)

print("\n--- 📂 BREAKDOWN BY PROGRAMMING LANGUAGE ---")
sorted_langs = sorted(stats.items(), key=lambda x: x[1]['lines'], reverse=True)
for lang, data in sorted_langs:
    lines = data['lines']
    files_cnt = data['files']
    size_kb = data['bytes'] / 1024
    pct = (lines / total_lines) * 100 if total_lines else 0
    print(f"  • {lang:<28} : {lines:>8,} lines ({pct:>5.1f}%) | {files_cnt:>4} files | {size_kb:>8.1f} KB")

print("\n--- 🏛️ BREAKDOWN BY ECOSYSTEM MODULE ---")
sorted_modules = sorted(module_stats.items(), key=lambda x: x[1]['lines'], reverse=True)
for mod, data in sorted_modules:
    lines = data['lines']
    files_cnt = data['files']
    pct = (lines / total_lines) * 100 if total_lines else 0
    print(f"  • {mod:<28} : {lines:>8,} lines ({pct:>5.1f}%) | {files_cnt:>4} files")

print("=" * 82)
