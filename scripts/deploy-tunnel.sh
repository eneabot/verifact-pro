#!/bin/bash

echo "⚡ verifact PRO — Deploy via Cloudflare Tunnel"
echo "=============================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "⚠️  cloudflared not found. Installing..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
        chmod +x cloudflared
        CLOUDFLARED="./cloudflared"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Install cloudflared with: brew install cloudflare/cloudflare/cloudflared"
        exit 1
    else
        echo "Unsupported OS"
        exit 1
    fi
else
    CLOUDFLARED="cloudflared"
fi

# Check if Next.js is built
if [ ! -d ".next" ]; then
    echo "✓ Building Next.js..."
    npm run build
fi

# Start Next.js in background
echo "✓ Starting Next.js server..."
npm start &
NEXTJS_PID=$!

sleep 2

# Start Cloudflare Tunnel
echo "✓ Starting Cloudflare Tunnel..."
echo ""
$CLOUDFLARED tunnel --url http://localhost:3000

# Cleanup on exit
trap "kill $NEXTJS_PID" EXIT
