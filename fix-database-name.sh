#!/bin/bash

# Fix MongoDB connection string to use "users" database
# Run: bash fix-database-name.sh

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

echo "🔍 Checking current configuration..."

# Check current URI
CURRENT_URI=$(grep "^MONGODB_URI=" "$ENV_FILE" | cut -d'=' -f2-)

if [ -z "$CURRENT_URI" ]; then
    echo "❌ MONGODB_URI not found in .env.local"
    exit 1
fi

echo "Current URI: ${CURRENT_URI:0:50}..."

# Check if /users is already in the URI
if [[ "$CURRENT_URI" == *"/users"* ]] || [[ "$CURRENT_URI" == *"/users?"* ]]; then
    echo "✅ Database name already set to 'users'"
    exit 0
fi

# Check if URI ends with / or has query params
if [[ "$CURRENT_URI" == *"?"* ]]; then
    # Has query params, insert /users before ?
    NEW_URI="${CURRENT_URI//mongodb+srv:\/\/[^\/]*\//&users}"
    NEW_URI="${NEW_URI/\?/\/users?}"
else
    # No query params, just add /users
    if [[ "$CURRENT_URI" == */ ]]; then
        NEW_URI="${CURRENT_URI}users"
    else
        NEW_URI="${CURRENT_URI}/users"
    fi
fi

# Backup original file
cp "$ENV_FILE" "${ENV_FILE}.backup"
echo "✅ Created backup: ${ENV_FILE}.backup"

# Update the file
sed -i.bak "s|^MONGODB_URI=.*|MONGODB_URI=${NEW_URI}|" "$ENV_FILE"
rm -f "${ENV_FILE}.bak"

echo ""
echo "✅ Updated MONGODB_URI to use 'users' database"
echo ""
echo "New URI: ${NEW_URI:0:60}..."
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your Next.js server (Ctrl+C, then npm run dev)"
echo "   2. Run: node verify-database.js (to verify)"
echo ""


