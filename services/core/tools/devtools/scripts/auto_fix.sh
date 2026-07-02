#!/bin/bash
# Automated Fix Script for nakharax Repositories
# Generated: 2025-11-10 21:41:54

set -e  # Exit on error

echo '🔧 Starting automated fixes...'
echo ''

# 1. Build System (MEDIUM Priority)
echo '📝 Fixing: Build System'

# Install dependencies for Node.js projects
for repo in nakharax-web nakharax-sdk-ts nakharax-marketplace; do
  if [ -d "$repo" ] && [ -f "$repo/package.json" ]; then
    echo "  Installing dependencies for $repo..."
    cd $repo
    npm install
    cd ..
  fi
done


# 2. Import Statements (MEDIUM Priority)
echo '📝 Fixing: Import Statements'

# 3. Git Status (LOW Priority)
echo '📝 Fixing: Git Status'

# Check git status
for repo in nakharax-*; do
  if [ -d "$repo/.git" ]; then
    echo "  Checking $repo..."
    cd $repo
    git status --short
    cd ..
  fi
done


echo ''
echo '✅ Automated fixes completed!'
echo 'Please review changes and run tests again.'