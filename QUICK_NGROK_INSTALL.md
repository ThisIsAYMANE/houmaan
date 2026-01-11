# Quick ngrok Installation for Windows (No Admin Required)

## Step-by-Step Instructions

### Step 1: Download ngrok

1. Open your browser and go to: **https://ngrok.com/download/windows**
2. Download the ZIP file (it's small, ~10MB)

### Step 2: Extract and Setup

1. **Extract the ZIP file** to a folder you can access, for example:
   - `C:\Users\AYMANE MAALI\ngrok\` 
   - Or `C:\ngrok\`
   - Or anywhere you prefer

2. **You should now have `ngrok.exe` in that folder**

### Step 3: Test ngrok (Using Full Path)

Open PowerShell and test with the full path:

```powershell
# Replace with your actual path
C:\Users\AYMANE MAALI\ngrok\ngrok.exe version
```

### Step 4: Authenticate ngrok

1. **Sign up for a free ngrok account** (if you don't have one):
   - Go to: https://dashboard.ngrok.com/signup

2. **Get your authtoken:**
   - After signing up, go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Authenticate:**
   ```powershell
   # Replace with your actual path and authtoken
   C:\Users\AYMANE MAALI\ngrok\ngrok.exe config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

### Step 5: Start Your Tunnels

**Option A: Using Full Path (Easiest)**

Open **two separate PowerShell windows**:

**PowerShell Window 1 (Callback):**
```powershell
C:\Users\AYMANE MAALI\ngrok\ngrok.exe http 3000 --domain=bozcallback.ngrok.app
```

**PowerShell Window 2 (Test Area):**
```powershell
C:\Users\AYMANE MAALI\ngrok\ngrok.exe http 3000 --domain=boztestarea.ngrok.app
```

**Option B: Add to PATH (Optional - Makes it easier)**

If you want to use just `ngrok` instead of the full path:

1. **Find where you extracted ngrok** (e.g., `C:\Users\AYMANE MAALI\ngrok\`)

2. **Add to PATH using PowerShell:**
   ```powershell
   # Replace with your actual path
   $ngrokPath = "C:\Users\AYMANE MAALI\ngrok"
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$ngrokPath", "User")
   ```

3. **Close and reopen PowerShell** (important!)

4. **Now you can use:**
   ```powershell
   ngrok http 3000 --domain=bozcallback.ngrok.app
   ```

## Quick Test

Once ngrok is running, test it:

```powershell
# Check if it's working
curl https://bozcallback.ngrok.app
```

Or visit in your browser: https://bozcallback.ngrok.app

## Important Notes

1. **Keep PowerShell windows open** - ngrok tunnels close when you close the terminal

2. **Custom domains** - If you get an error about the domain not being available:
   - You may need a paid ngrok plan
   - Or use free random subdomains:
     ```powershell
     ngrok http 3000
     ```
     Then copy the URL it gives you and update your `.env` file

3. **Make sure Next.js is running** on port 3000 before starting ngrok

## Troubleshooting

### "Domain not found"
- Use free subdomain: `ngrok http 3000` (without --domain)
- Copy the URL it provides
- Update your `.env` file with the new URL

### "Port 3000 already in use"
- Make sure Next.js is running: `npm run dev`
- Or check what's using port 3000

### Still having issues?
- Use the full path to ngrok.exe
- Make sure you've authenticated: `ngrok config add-authtoken YOUR_TOKEN`

