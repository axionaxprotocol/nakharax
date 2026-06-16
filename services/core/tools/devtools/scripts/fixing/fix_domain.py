#!/usr/bin/env python3
"""
Fix domain: nakhara.io -> nakhara.io
"""
import os
from pathlib import Path

WORKSPACE_ROOT = Path(r"D:\Desktop\nakharaius01")
EXTENSIONS = [".md", ".ts", ".tsx", ".html", ".json", ".toml", ".rs", ".go", ".py", ".sh", ".yml", ".yaml", ".js", ".jsx"]
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build", "target", "out", ".next", "__pycache__"}

def should_process(file_path):
    """Check if file should be processed"""
    return (
        file_path.suffix in EXTENSIONS and
        not any(exclude in file_path.parts for exclude in EXCLUDE_DIRS)
    )

def fix_domain(content):
    """Replace nakhara.io -> nakhara.io"""
    modified = False
    
    if "nakhara.io" in content:
        content = content.replace("nakhara.io", "nakhara.io")
        modified = True
    
    return content, modified

def main():
    print("🔍 Scanning for nakhara.io domain...")
    
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
            
            # Count before
            before_count = content.count("nakhara.io")
            
            if before_count == 0:
                continue
            
            # Fix domain
            new_content, modified = fix_domain(content)
            
            if modified:
                # Write back
                with open(file_path, "w", encoding="utf-8", newline="") as f:
                    f.write(new_content)
                
                after_count = new_content.count("nakhara.io")
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
