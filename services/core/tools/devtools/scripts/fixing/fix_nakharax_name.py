#!/usr/bin/env python3
"""
Fix naming: nakharax -> nakharax (without "Protocol" suffix)
"""
import os
import re
from pathlib import Path

WORKSPACE_ROOT = Path(r"D:\Desktop\nakharaxius01")
EXTENSIONS = [".md", ".ts", ".tsx", ".html", ".json", ".toml", ".rs", ".go", ".py", ".sh", ".yml", ".yaml"]
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "target", "out", ".next", "__pycache__"}

def should_process(file_path):
    """Check if file should be processed"""
    return (
        file_path.suffix in EXTENSIONS and
        not any(exclude in file_path.parts for exclude in EXCLUDE_DIRS)
    )

def fix_names(content):
    """Replace nakharax -> nakharax (case-sensitive, avoid double replacement)"""
    replacements = [
        # Specific patterns first to avoid conflicts
        (r"nakharax protocol", "nakharax protocol"),  # Already done, but keep for safety
        (r"nakharax", "nakharax"),  # Main replacement
        (r"nakharax", "nakharax"),  # Normalize capitalization
    ]
    
    modified = False
    for pattern, replacement in replacements:
        if pattern in content:
            # Use word boundary to avoid partial matches
            new_content = content.replace(pattern, replacement)
            if new_content != content:
                content = new_content
                modified = True
    
    return content, modified

def main():
    print("🔍 Scanning for nakharax and nakharax...")
    
    total_files = 0
    modified_files = 0
    total_replacements = 0
    
    for file_path in WORKSPACE_ROOT.rglob("*"):
        if not file_path.is_file() or not should_process(file_path):
            continue
        
        total_files += 1
        
        try:
            # Read file
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Count occurrences before replacement
            before_count = content.count("nakharax") + content.count("nakharax")
            
            # Fix names
            new_content, modified = fix_names(content)
            
            if modified:
                # Write back
                with open(file_path, "w", encoding="utf-8", newline="") as f:
                    f.write(new_content)
                
                after_count = new_content.count("nakharax") + new_content.count("nakharax")
                replacements = before_count - after_count
                total_replacements += replacements
                
                print(f"✅ {file_path.relative_to(WORKSPACE_ROOT)} ({replacements} changes)")
                modified_files += 1
        
        except Exception as e:
            print(f"⚠️  Error: {file_path.name}: {e}")
    
    print(f"\n✨ Done!")
    print(f"📊 Scanned: {total_files} files")
    print(f"📝 Modified: {modified_files} files")
    print(f"🔄 Total replacements: {total_replacements}")

if __name__ == "__main__":
    main()
