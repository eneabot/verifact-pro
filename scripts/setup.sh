#!/bin/bash

echo "⚡ verifact PRO — Setup"
echo "===================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "   Version: $NODE_VERSION"

# Install dependencies
echo ""
echo "✓ Installing dependencies..."
npm install

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo ""
    echo "✓ Creating .env.local..."
    cp .env.example .env.local
    echo "   ⚠️  Add your API keys to .env.local for enhanced LLM analysis"
fi

# Done
echo ""
echo "===================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local and add API keys (optional)"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "For deployment: npm run build"
