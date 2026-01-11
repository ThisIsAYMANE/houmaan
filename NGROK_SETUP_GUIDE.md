# ngrok Setup Guide for Casino API

This guide will help you set up ngrok tunnels for your Casino API callbacks and test area.

## Prerequisites

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Or install via package manager:
     ```bash
     # Windows (using Chocolatey)
     choco install ngrok
     
     # macOS (using Homebrew)
     brew install ngrok/ngrok/ngrok
     
     # Linux
     wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
     tar -xzf ngrok-v3-stable-linux-amd64.tgz
     sudo mv ngrok /usr/local/bin
     ```

2. **Sign up for ngrok account:**
   - Go to https://dashboard.ngrok.com/signup
   - Create a free account
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Authenticate ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

## Setup Method 1: Using ngrok Config File (Recommended)

This method creates persistent tunnels that you can start/stop easily.

### Step 1: Create ngrok Config File

Create or edit `~/.ngrok2/ngrok.yml` (or `%USERPROFILE%\.ngrok2\ngrok.yml` on Windows):

```yaml
version: "2"
authtoken: YOUR_AUTHTOKEN_HERE

tunnels:
  callback:
    proto: http
    addr: 3000
    hostname: bozcallback.ngrok.app
    inspect: false
    
  testarea:
    proto: http
    addr: 3000
    hostname: boztestarea.ngrok.app
    inspect: false
```

**Note:** If you don't have a paid ngrok plan with custom domains, you'll need to use the free subdomain approach (see Method 2 below).

### Step 2: Start Your Next.js App

In one terminal, start your development server:

```bash
npm run dev
```

This will start the app on `http://localhost:3000`

### Step 3: Start ngrok Tunnels

In another terminal, start both tunnels:

```bash
# Start all tunnels defined in config
ngrok start --all

# Or start them individually
ngrok start callback
ngrok start testarea
```

### Step 4: Verify Tunnels are Active

You should see output like:

```
Forwarding   https://bozcallback.ngrok.app -> http://localhost:3000
Forwarding   https://boztestarea.ngrok.app -> http://localhost:3000
```

## Setup Method 2: Using Free ngrok Subdomains

If you don't have custom domains configured in ngrok, use this method:

### Step 1: Start Your Next.js App

```bash
npm run dev
```

### Step 2: Start ngrok Tunnels (Separate Terminals)

**Terminal 1 - Callback:**
```bash
ngrok http 3000 --domain=bozcallback.ngrok.app
```

**Terminal 2 - Test Area:**
```bash
ngrok http 3000 --domain=boztestarea.ngrok.app
```

**Note:** If you get an error about the domain not being available, you may need to:
1. Use the free random subdomains ngrok provides
2. Or upgrade to a paid ngrok plan to use custom domains

### Alternative: Using Random Subdomains

If custom domains aren't available, use random subdomains:

**Terminal 1 - Callback:**
```bash
ngrok http 3000
# Note the Forwarding URL (e.g., https://abc123.ngrok-free.app)
# Update CASINO_CALLBACK_URL in .env with this URL
```

**Terminal 2 - Test Area:**
```bash
ngrok http 3000 --port 4041
# Note the Forwarding URL
# Update CASINO_TEST_AREA_URL in .env with this URL
```

## Setup Method 3: Using ngrok Agent (For Production-like Setup)

For a more production-like setup with persistent tunnels:

### Step 1: Create ngrok Config

Create `ngrok.yml` in your project root:

```yaml
version: "2"
authtoken: YOUR_AUTHTOKEN_HERE

tunnels:
  callback:
    proto: http
    addr: 3000
    hostname: bozcallback.ngrok.app
    
  testarea:
    proto: http
    addr: 3000
    hostname: boztestarea.ngrok.app
```

### Step 2: Start ngrok Agent

```bash
ngrok start --all --config=ngrok.yml
```

## Verifying Your Setup

### 1. Check Tunnel Status

Visit the ngrok web interface:
- http://localhost:4040 (default ngrok inspection interface)

Or check via API:
```bash
curl http://localhost:4040/api/tunnels
```

### 2. Test Callback Endpoint

Test that your callback endpoint is accessible:

```bash
# Test callback endpoint
curl https://bozcallback.ngrok.app/api/casino/callback \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "action=balance&player_id=test123"
```

### 3. Test Test Area

```bash
# Test test area
curl https://boztestarea.ngrok.app
```

## Windows-Specific Instructions

### Using PowerShell

1. **Start Next.js:**
   ```powershell
   npm run dev
   ```

2. **Start ngrok (in separate PowerShell windows):**
   
   **Window 1:**
   ```powershell
   ngrok http 3000 --domain=bozcallback.ngrok.app
   ```
   
   **Window 2:**
   ```powershell
   ngrok http 3000 --domain=boztestarea.ngrok.app
   ```

### Using Windows Terminal (Multiple Tabs)

1. Open Windows Terminal
2. Create new tabs for each tunnel
3. Run the commands above in separate tabs

## Keeping Tunnels Running

### Option 1: Keep Terminals Open

Simply keep the terminal windows open while developing.

### Option 2: Use a Process Manager

**Using PM2 (Node.js process manager):**

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file: ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'nextjs',
      script: 'npm',
      args: 'run dev',
    },
    {
      name: 'ngrok-callback',
      script: 'ngrok',
      args: 'http 3000 --domain=bozcallback.ngrok.app',
    },
    {
      name: 'ngrok-testarea',
      script: 'ngrok',
      args: 'http 3000 --domain=boztestarea.ngrok.app',
    }
  ]
}

# Start all
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs
```

### Option 3: Use a Batch/Script File

**Windows (`start-ngrok.bat`):**
```batch
@echo off
start "ngrok-callback" cmd /k "ngrok http 3000 --domain=bozcallback.ngrok.app"
timeout /t 2
start "ngrok-testarea" cmd /k "ngrok http 3000 --domain=boztestarea.ngrok.app"
echo Both ngrok tunnels started!
pause
```

**macOS/Linux (`start-ngrok.sh`):**
```bash
#!/bin/bash
gnome-terminal -- bash -c "ngrok http 3000 --domain=bozcallback.ngrok.app; exec bash"
sleep 2
gnome-terminal -- bash -c "ngrok http 3000 --domain=boztestarea.ngrok.app; exec bash"
echo "Both ngrok tunnels started!"
```

Make it executable:
```bash
chmod +x start-ngrok.sh
```

## Troubleshooting

### Issue: "Domain not found" or "Domain not available"

**Solution:**
- You need a paid ngrok plan to use custom domains
- Use free random subdomains instead
- Update your `.env` file with the new URLs

### Issue: "Port 3000 already in use"

**Solution:**
- Check what's using port 3000: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (macOS/Linux)
- Kill the process or use a different port
- Update ngrok to point to the new port

### Issue: "Tunnel not forwarding requests"

**Solution:**
1. Verify Next.js is running on port 3000
2. Check ngrok status at http://localhost:4040
3. Verify the tunnel is active (green status)
4. Test with a simple curl request

### Issue: "ngrok: command not found"

**Solution:**
- Make sure ngrok is installed and in your PATH
- On Windows, you may need to restart your terminal
- Verify installation: `ngrok version`

## Quick Start Checklist

- [ ] ngrok installed and authenticated
- [ ] Next.js app running on port 3000
- [ ] Callback tunnel active: `bozcallback.ngrok.app`
- [ ] Test area tunnel active: `boztestarea.ngrok.app`
- [ ] `.env` file updated with correct URLs
- [ ] Tested callback endpoint accessibility
- [ ] Verified with Slotegrator that they can reach your endpoints

## Important Notes

1. **Free ngrok Limitations:**
   - Random subdomains change on restart (unless you have a paid plan)
   - Limited connections per minute
   - URLs are public (anyone can access)

2. **Security:**
   - ngrok tunnels are public by default
   - Consider adding authentication to your callback endpoint
   - Use ngrok's IP restrictions if available

3. **Production:**
   - For production, use a real domain with SSL
   - Don't rely on ngrok for production callbacks
   - Set up proper webhook endpoints on your production server

## Next Steps

Once your tunnels are running:

1. Update your `.env` file with the correct ngrok URLs
2. Test the self-validation endpoint
3. Configure Slotegrator with your callback URL
4. Test receiving webhooks from Slotegrator

