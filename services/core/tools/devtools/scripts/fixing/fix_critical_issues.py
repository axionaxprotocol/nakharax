#!/usr/bin/env python3
"""
Fix Critical Issues in nakharax Repositories
"""

import os
import json
from pathlib import Path

def remove_bom_from_file(file_path):
    """Remove UTF-8 BOM from file"""
    try:
        # Read with UTF-8-sig to handle BOM
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        # Write back without BOM
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        
        return True, "BOM removed successfully"
    except Exception as e:
        return False, f"Error: {str(e)}"

def fix_package_json_dependency(file_path, use_workspace=True):
    """Fix @nakharax/sdk dependency to use local workspace"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if @nakharax/sdk exists in dependencies
        if 'dependencies' in data and '@nakharax/sdk' in data['dependencies']:
            if use_workspace:
                # Use workspace protocol
                data['dependencies']['@nakharax/sdk'] = 'workspace:*'
            else:
                # Use file path
                data['dependencies']['@nakharax/sdk'] = 'file:../nakharax-sdk-ts'
        
        # Write back
        with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write('\n')
        
        return True, "Dependency fixed"
    except Exception as e:
        return False, f"Error: {str(e)}"

def create_workspace_package_json(base_path):
    """Create root package.json for workspace"""
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
            "build-all": "npm run build --workspaces",
            "build:sdk": "npm run build -w nakharax-sdk-ts",
            "build:web": "npm run build -w nakharax-web",
            "build:marketplace": "npm run build -w nakharax-marketplace",
            "dev:web": "npm run dev -w nakharax-web",
            "dev:marketplace": "npm run dev -w nakharax-marketplace"
        },
        "devDependencies": {
            "typescript": "^5.4.0"
        }
    }
    
    root_package = base_path / 'package.json'
    
    try:
        with open(root_package, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(package_json, f, indent=2, ensure_ascii=False)
            f.write('\n')
        return True, "Root package.json created"
    except Exception as e:
        return False, f"Error: {str(e)}"

def main():
    base_path = Path(os.getcwd())
    
    print("🔧 Fixing Critical Issues in nakharax Repositories")
    print("=" * 80)
    print()
    
    issues_fixed = 0
    issues_failed = 0
    
    # Issue 1: Fix UTF-8 BOM in package.json files
    print("📝 Issue 1: Fixing UTF-8 BOM in JSON files")
    print("-" * 80)
    
    files_to_fix = [
        base_path / 'nakharax-marketplace' / 'package.json',
        base_path / 'nakharax-deploy' / 'package.json'
    ]
    
    for file_path in files_to_fix:
        if file_path.exists():
            success, msg = remove_bom_from_file(file_path)
            if success:
                print(f"✅ Fixed: {file_path.relative_to(base_path)}")
                issues_fixed += 1
            else:
                print(f"❌ Failed: {file_path.relative_to(base_path)} - {msg}")
                issues_failed += 1
        else:
            print(f"⏭️  Skipped: {file_path.relative_to(base_path)} (not found)")
    
    print()
    
    # Issue 2: Create workspace configuration
    print("📝 Issue 2: Setting up npm workspace")
    print("-" * 80)
    
    root_package = base_path / 'package.json'
    if root_package.exists():
        print(f"⚠️  Root package.json already exists")
        print(f"   Please review and merge manually if needed")
    else:
        success, msg = create_workspace_package_json(base_path)
        if success:
            print(f"✅ Created: package.json (workspace root)")
            issues_fixed += 1
        else:
            print(f"❌ Failed: {msg}")
            issues_failed += 1
    
    print()
    
    # Issue 3: Fix @nakharax/sdk dependencies
    print("📝 Issue 3: Fixing @nakharax/sdk dependencies")
    print("-" * 80)
    
    repos_with_sdk = [
        base_path / 'nakharax-web' / 'package.json',
        base_path / 'nakharax-marketplace' / 'package.json'
    ]
    
    for file_path in repos_with_sdk:
        if file_path.exists():
            success, msg = fix_package_json_dependency(file_path, use_workspace=True)
            if success:
                print(f"✅ Fixed: {file_path.relative_to(base_path)} - Changed to workspace:*")
                issues_fixed += 1
            else:
                print(f"❌ Failed: {file_path.relative_to(base_path)} - {msg}")
                issues_failed += 1
        else:
            print(f"⏭️  Skipped: {file_path.relative_to(base_path)} (not found)")
    
    print()
    
    # Issue 4: Check Cargo.toml (informational only)
    print("📝 Issue 4: Checking Cargo.toml in nakharax-core")
    print("-" * 80)
    
    cargo_toml = base_path / 'nakharax-core' / 'Cargo.toml'
    if cargo_toml.exists():
        with open(cargo_toml, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '[workspace]' in content:
            print("✅ nakharax-core/Cargo.toml is correctly configured as workspace")
            print("   This is the expected configuration for multi-crate projects")
        elif '[package]' in content:
            print("✅ nakharax-core/Cargo.toml has [package] section")
        else:
            print("⚠️  nakharax-core/Cargo.toml structure unclear")
            print("   Please verify manually")
    else:
        print("⏭️  nakharax-core/Cargo.toml not found")
    
    print()
    print("=" * 80)
    print("📊 Summary")
    print("=" * 80)
    print(f"✅ Issues Fixed: {issues_fixed}")
    print(f"❌ Issues Failed: {issues_failed}")
    print()
    
    if issues_failed == 0:
        print("🎉 All critical issues have been fixed!")
        print()
        print("📋 Next Steps:")
        print("  1. Run: npm install")
        print("  2. Run: python test_repo_integration.py")
        print("  3. Review: INTEGRATION_TEST_REPORT.txt")
    else:
        print("⚠️  Some issues could not be fixed automatically")
        print("   Please review the errors above and fix manually")
    
    print()
    print("💡 Additional Recommendations:")
    print("  • Run 'npm install' in root to set up workspace")
    print("  • Run 'npm run build:sdk' to build SDK first")
    print("  • Then build other projects with 'npm run build-all'")
    print()

if __name__ == "__main__":
    main()
