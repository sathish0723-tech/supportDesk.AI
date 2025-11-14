#!/bin/bash

# Script to set up remote with PAT and push
# Usage: ./setup-and-push.sh YOUR_GITHUB_PAT

if [ -z "$1" ]; then
    echo "Usage: ./setup-and-push.sh YOUR_GITHUB_PAT"
    echo ""
    echo "To get a Personal Access Token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token and run: ./setup-and-push.sh YOUR_TOKEN"
    exit 1
fi

PAT=$1
REPO_URL="https://${PAT}@github.com/sathish0723-tech/supportDesk.AI.git"

echo "Setting up remote with PAT..."
git remote set-url origin "$REPO_URL"

echo "Verifying remote..."
git remote -v

echo ""
echo "Pushing to origin main..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "Repository: https://github.com/sathish0723-tech/supportDesk.AI"
    
    # Remove PAT from remote URL for security (use credential helper instead)
    echo ""
    echo "Removing PAT from remote URL for security..."
    git remote set-url origin https://github.com/sathish0723-tech/supportDesk.AI.git
    echo "Remote URL cleaned. Future pushes will use credential helper."
else
    echo ""
    echo "❌ Push failed. Please check your token and try again."
fi


