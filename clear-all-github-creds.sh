#!/bin/bash

echo "🧹 Clearing ALL GitHub credentials..."
echo ""

# Clear .git-credentials file
if [ -f ~/.git-credentials ]; then
    echo "1. Clearing ~/.git-credentials..."
    grep -v "github.com" ~/.git-credentials > ~/.git-credentials.tmp 2>/dev/null
    mv ~/.git-credentials.tmp ~/.git-credentials 2>/dev/null
    echo "   ✅ Cleared"
else
    echo "1. No ~/.git-credentials file found"
fi

# Try to delete keychain entries
echo "2. Attempting to clear macOS Keychain..."
security delete-internet-password -s "GitHub - https://api.github.com" -a "brahmathawky" 2>/dev/null && echo "   ✅ Deleted GitHub API credentials" || echo "   ℹ️  No GitHub API credentials found"
security delete-internet-password -s github.com -a "brahmathawky" 2>/dev/null && echo "   ✅ Deleted github.com credentials" || echo "   ℹ️  No github.com credentials found"

# Clear git credential cache
echo "3. Clearing git credential cache..."
git credential-cache exit 2>/dev/null || true
git credential reject <<EOF
protocol=https
host=github.com
EOF
echo "   ✅ Cleared"

echo ""
echo "✅ All credentials cleared!"
echo ""
echo "Now when you run 'git push origin main', you'll be prompted for:"
echo "  Username: sathish0723-tech"
echo "  Password: [Your Personal Access Token]"
echo ""
echo "Get your token from: https://github.com/settings/tokens"
echo ""

