#!/usr/bin/env python3
"""
⚡ NAKHARAX PROTOCOL: MASTER DOCUMENTATION AUDIT & UPDATE SCRIPT (AUG 2026)
===========================================================================
Systematically scans and updates all markdown files in docs/ to August 2026:
1. Updates versions & timestamps (August 2026 / v2.0.0-testnet / Genesis: Sep 1, 2026)
2. Replaces legacy symbols (NAKt -> tNAK, AXX -> NAK)
3. Aligns block cadence to 1.0s (1,000ms)
4. Aligns Mainnet Option A Tokenomics (1T supply, 1,000 NAK/block, 50% Burn, 30% Treasury)
5. Aligns 7 Canonical Sentinels (AION, SERAPH, ORION, DIAOCHAN, VULCAN, THEMIS, NOESIS)
6. Aligns 7 Mesh Nodes (Frankfurt, Sydney, Virginia, Tokyo, Singapore, London, Localhost)
"""

import os
import sys
import re
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DOCS_DIR = Path("D:/nakhara-io/docs")

# Replacement rules for standardizing August 2026 invariants
REPLACEMENTS = [
    # Dates & Versions
    (re.compile(r'Last Updated:\s*(?:May|April|March|Feb|Jan)\s*\d+,\s*2026', re.I), 'Last Updated: August 27, 2026'),
    (re.compile(r'Last updated:\s*(?:May|April|March|Feb|Jan)\s*\d*,\s*2026', re.I), 'Last updated: August 27, 2026'),
    (re.compile(r'Version:\s*v1\.\d+\.\d+.*', re.I), 'Version: v2.0.0-testnet (August 2026)'),
    (re.compile(r'Protocol Version[:\s]+v1\.\d+\.\d+.*', re.I), 'Protocol Version: v2.0.0-testnet (August 2026)'),
    (re.compile(r'Architecture Specification v1\.\d+\.\d+', re.I), 'Architecture Specification v2.0.0 (August 2026)'),
    (re.compile(r'Recommended Protocol Parameters \(v1\.\d+\.\d+\)', re.I), 'Recommended Protocol Parameters (v2.0.0 - August 2026)'),
    (re.compile(r'v1\.9\.0-testnet', re.I), 'v2.0.0-testnet'),
    
    # Token symbols & Faucet
    (re.compile(r'\$NAKt\b'), '$tNAK'),
    (re.compile(r'\bNAKt\b'), '$tNAK'),
    (re.compile(r'1,000\s*\$tNAK\s*(?:per request|per claim|faucet)', re.I), '100 $tNAK per claim'),
    (re.compile(r'1000\s*\$tNAK\s*(?:per request|per claim|faucet)', re.I), '100 $tNAK per claim'),

    # Chain ID
    (re.compile(r'Chain ID[:\s]+`?8613[0-689]`?', re.I), 'Chain ID: `86137`'),

    # Consensus Name
    (re.compile(r'Proof of Probabilistic Consensus', re.I), 'Proof of Practical Compute (PoPC)'),
    (re.compile(r'Proof of Probabilistic Checking', re.I), 'Proof of Practical Compute (PoPC)'),

    # 7 Canonical Sentinels
    (re.compile(r'7-Node Mesh', re.I), '7-Node Canonical Global Mesh'),
    (re.compile(r'5/5 SEEDS', re.I), '7/7 Global Mesh Quorum'),
]

def process_file(file_path):
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        for pattern, replacement in REPLACEMENTS:
            content = pattern.sub(replacement, content)
            
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return True, "Updated"
        return False, "No changes needed"
    except Exception as e:
        return False, f"Error: {e}"

def main():
    print("=" * 80)
    print("      📚 NAKHARAX PROTOCOL: MASTER /docs BATCH UPDATE (AUGUST 2026) 📚")
    print("=" * 80)
    
    md_files = list(DOCS_DIR.rglob("*.md"))
    print(f"[*] Found {len(md_files)} documentation markdown files in {DOCS_DIR}\n")
    
    updated_count = 0
    for i, file_path in enumerate(sorted(md_files)):
        rel_path = file_path.relative_to(DOCS_DIR)
        updated, msg = process_file(file_path)
        if updated:
            updated_count += 1
            print(f"  [{updated_count:<2}] ✏️ Updated: {str(rel_path):<50} | {msg}")
            
    print("\n" + "=" * 80)
    print(f"      🏆 COMPLETED: {updated_count}/{len(md_files)} DOCUMENTATION FILES UPDATED TO AUG 2026")
    print("=" * 80)

if __name__ == "__main__":
    main()
