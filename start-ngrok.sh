#!/bin/bash

echo "Starting ngrok tunnels for Casino API..."
echo ""

# Check if Next.js is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "ERROR: Next.js is not running on port 3000!"
    echo "Please start your Next.js app first: npm run dev"
    exit 1
fi

echo "Next.js detected on port 3000"
echo ""

# Start callback tunnel
echo "Starting callback tunnel (bozcallback.ngrok.app)..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "ngrok http 3000 --domain=bozcallback.ngrok.app; exec bash"
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "ngrok http 3000 --domain=bozcallback.ngrok.app"'
else
    echo "Please start callback tunnel manually:"
    echo "  ngrok http 3000 --domain=bozcallback.ngrok.app"
fi

sleep 2

# Start test area tunnel
echo "Starting test area tunnel (boztestarea.ngrok.app)..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "ngrok http 3000 --domain=boztestarea.ngrok.app; exec bash"
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "ngrok http 3000 --domain=boztestarea.ngrok.app"'
else
    echo "Please start test area tunnel manually:"
    echo "  ngrok http 3000 --domain=boztestarea.ngrok.app"
fi

echo ""
echo "========================================"
echo "Both ngrok tunnels started!"
echo "========================================"
echo ""
echo "Callback URL: https://bozcallback.ngrok.app/api/casino/callback"
echo "Test Area URL: https://boztestarea.ngrok.app"
echo ""
echo "Check tunnel status at: http://localhost:4040"
echo ""

