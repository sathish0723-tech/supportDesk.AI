#!/bin/bash

# Script to push copilot code to GitHub
# This will prompt for GitHub credentials

echo "🚀 Pushing copilot code to GitHub..."
echo ""
echo "Repository: sathish0723-tech/supportDesk.AI"
echo "Branch: main"
echo ""
echo "You'll be prompted for your GitHub credentials."
echo "Use your GitHub username and a Personal Access Token (not password)"
echo ""
echo "To create a Personal Access Token:"
echo "1. Go to https://github.com/settings/tokens"
echo "2. Generate new token (classic)"
echo "3. Select 'repo' scope"
echo "4. Copy the token and use it as password when prompted"
echo ""

# Check if we're ahead of origin
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")

if [ "$AHEAD" -gt "0" ]; then
  echo "📦 You have $AHEAD commit(s) to push"
  echo ""
  git push origin main
else
  echo "✅ Everything is up to date!"
fi

