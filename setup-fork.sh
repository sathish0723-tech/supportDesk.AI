#!/bin/bash

echo "🔀 Setting Up Fork for Git Push"
echo "================================"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Username cannot be empty!"
    exit 1
fi

echo ""
echo "📝 Steps:"
echo "1. First, fork the repository on GitHub:"
echo "   https://github.com/sathish0723-tech/supportDesk.AI"
echo "   Click the 'Fork' button in the top right"
echo ""
read -p "Have you forked the repository? (y/n): " FORKED

if [ "$FORKED" != "y" ] && [ "$FORKED" != "Y" ]; then
    echo ""
    echo "⚠️  Please fork the repository first, then run this script again."
    echo "   Go to: https://github.com/sathish0723-tech/supportDesk.AI"
    exit 1
fi

echo ""
echo "2. Adding your fork as a remote..."
git remote add fork https://github.com/${GITHUB_USERNAME}/supportDesk.AI.git 2>/dev/null

if [ $? -eq 0 ]; then
    echo "   ✅ Fork remote added successfully!"
elif [ $? -eq 3 ]; then
    echo "   ℹ️  Fork remote already exists, updating..."
    git remote set-url fork https://github.com/${GITHUB_USERNAME}/supportDesk.AI.git
    echo "   ✅ Fork remote updated!"
else
    echo "   ❌ Failed to add fork remote"
    exit 1
fi

echo ""
echo "3. Current remotes:"
git remote -v

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Now push to your fork:"
echo "   git push fork main"
echo ""
echo "When prompted:"
echo "  Username: ${GITHUB_USERNAME}"
echo "  Password: Your Personal Access Token"
echo ""
echo "📝 After pushing, create a Pull Request:"
echo "   https://github.com/sathish0723-tech/supportDesk.AI/compare"
echo ""

