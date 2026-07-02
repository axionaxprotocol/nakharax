#!/usr/bin/env python3
"""
Fix dependencies to use file: protocol instead of workspace:
"""

import json
from pathlib import Path

def fix_dependency_to_file_protocol(file_path, sdk_path):
    """Change @nakharax/sdk to use file: protocol"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'dependencies' in data and '@nakharax/sdk' in data['dependencies']:
            data['dependencies']['@nakharax/sdk'] = sdk_path
            print(f"✅ Updated {file_path.name}: @nakharax/sdk -> {sdk_path}")
        
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def update_root_package_json():
    """Update root package.json for npm workspaces"""
    root_package = Path('package.json')
    
    package_json = {
        "name": "nakharax-monorepo",
        "version": "1.0.0",
        "private": True,
        "workspaces": [
            "nakharax-sdk-ts",
            "nakharax-web",
            "nakharax-marketplace"
        ],
        "scripts": {
            "install-all": "npm install",
            "build:sdk": "cd nakharax-sdk-ts && npm run build",
            "build:web": "cd nakharax-web && npm run build",
            "build:marketplace": "cd nakharax-marketplace && npm run build",
            "build-all": "npm run build:sdk && npm run build:web && npm run build:marketplace",
            "dev:web": "cd nakharax-web && npm run dev",
            "dev:marketplace": "cd nakharax-marketplace && npm run dev"
        },
        "devDependencies": {
            "typescript": "^5.4.0"
        }
    }
    
    with open(root_package, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(package_json, f, indent=2, ensure_ascii=False)
        f.write('\n')
    
    print("✅ Updated root package.json")

def main():
    print("🔧 Fixing npm workspace dependencies")
    print("=" * 80)
    print()
    
    # Fix nakharax-web
    web_package = Path('nakharax-web/package.json')
    if web_package.exists():
        fix_dependency_to_file_protocol(web_package, 'file:../nakharax-sdk-ts')
    
    # Fix nakharax-marketplace
    marketplace_package = Path('nakharax-marketplace/package.json')
    if marketplace_package.exists():
        fix_dependency_to_file_protocol(marketplace_package, 'file:../nakharax-sdk-ts')
    
    # Update root package.json
    update_root_package_json()
    
    print()
    print("✅ All dependencies fixed!")
    print()
    print("📋 Next steps:")
    print("  1. npm install (this will install all workspaces)")
    print("  2. npm run build:sdk (build SDK first)")
    print("  3. npm run build-all (build everything)")
    print()

if __name__ == "__main__":
    main()
