#!/bin/bash

# Script to push code to GitHub
# This will prompt for your GitHub Personal Access Token

echo "Preparing to push code to GitHub..."
echo "Repository: sathish0723-tech/supportDesk.AI"
echo ""

# Check if we're on the right branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "main" ]; then
    echo "Warning: You're on branch '$current_branch', not 'main'"
fi

# Show what will be pushed
echo "Commits to push:"
git log origin/main..HEAD --oneline 2>/dev/null || git log --oneline -5

echo ""
echo "To push, you'll need to authenticate."
echo "Option 1: Use Personal Access Token"
echo "  When prompted for password, use a GitHub Personal Access Token"
echo "  Create one at: https://github.com/settings/tokens"
echo ""
echo "Option 2: Use GitHub CLI (if installed)"
echo "  Run: gh auth login"
echo "  Then: git push -u origin main"
echo ""

# Try to push
echo "Attempting to push..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/sathish0723-tech/supportDesk.AI"
else
    echo ""
    echo "❌ Push failed. Please authenticate manually:"
    echo "  1. Get a Personal Access Token from: https://github.com/settings/tokens"
    echo "  2. Run: git push -u origin main"
    echo "  3. Username: sathish0723-tech"
    echo "  4. Password: [paste your token]"
fi


