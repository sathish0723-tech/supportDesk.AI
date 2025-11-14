#!/bin/bash

echo "🔧 Fixing GitHub Authentication"
echo "================================"
echo ""

# Clear git credential cache
echo "1. Clearing git credential cache..."
git credential-cache exit 2>/dev/null || true
git credential reject <<EOF
protocol=https
host=github.com
EOF

# Update remote URL with correct username
echo "2. Updating remote URL..."
git remote set-url origin https://sathish0723-tech@github.com/sathish0723-tech/supportDesk.AI.git

# Set correct git user
echo "3. Setting git user configuration..."
git config --global user.name "sathish0723-tech"
git config --global user.email "sathish@hawky.ai"

echo ""
echo "✅ Git configuration updated!"
echo ""
echo "⚠️  IMPORTANT: You need to manually clear macOS Keychain credentials"
echo ""
echo "To clear old credentials from Keychain Access:"
echo "1. Open 'Keychain Access' app (Cmd+Space, type 'Keychain Access')"
echo "2. Search for 'github.com'"
echo "3. Find entries with username 'BrahmAtHawky'"
echo "4. Right-click → Delete"
echo ""
echo "OR use this command to delete all GitHub credentials:"
echo "   security delete-internet-password -s github.com"
echo ""
echo "Then when you run 'git push origin main', you'll be prompted for:"
echo "  Username: sathish0723-tech"
echo "  Password: [Your Personal Access Token]"
echo ""
echo "📝 Get your Personal Access Token from:"
echo "   https://github.com/settings/tokens"
echo ""

