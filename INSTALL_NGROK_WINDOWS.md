# Installing ngrok on Windows

## Quick Installation Steps

### Method 1: Direct Download (Recommended)

1. **Download ngrok:**
   - Go to: https://ngrok.com/download/windows
   - Download the ZIP file

2. **Extract ngrok:**
   - Extract the ZIP to a folder (e.g., `C:\ngrok\`)
   - You should have `ngrok.exe` in that folder

3. **Add to PATH (so you can run `ngrok` from anywhere):**
   
   **Option A: Using PowerShell (Run as Administrator):**
   ```powershell
   # Add ngrok to PATH for current user
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\ngrok", "User")
   ```
   
   **Option B: Manual (GUI):**
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\ngrok` (or wherever you extracted ngrok)
   - Click "OK" on all dialogs
   - **Restart your terminal/PowerShell**

4. **Verify installation:**
   ```powershell
   ngrok version
   ```

5. **Authenticate with your ngrok account:**
   - Sign up at: https://dashboard.ngrok.com/signup (if you don't have an account)
   - Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
   - Run:
     ```powershell
     ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
     ```

### Method 2: Using Chocolatey (If you have it)

```powershell
choco install ngrok
```

### Method 3: Using Scoop (If you have it)

```powershell
scoop install ngrok
```

## After Installation

1. **Restart your terminal/PowerShell** (important for PATH changes to take effect)

2. **Test ngrok:**
   ```powershell
   ngrok version
   ```

3. **Start your tunnels:**
   ```powershell
   # Terminal 1
   ngrok http 3000 --domain=bozcallback.ngrok.app
   
   # Terminal 2
   ngrok http 3000 --domain=boztestarea.ngrok.app
   ```

## Troubleshooting

### "ngrok: command not found" after adding to PATH

- **Restart your terminal/PowerShell** completely
- Or use the full path: `C:\ngrok\ngrok.exe http 3000`

### "Domain not found" error

If you get an error about the domain not being available:
- You may need a paid ngrok plan for custom domains
- Use free random subdomains instead:
  ```powershell
  ngrok http 3000
  ```
  Then copy the provided URL and update your `.env` file

### Need to use full path

If PATH doesn't work, you can always use the full path:
```powershell
C:\ngrok\ngrok.exe http 3000 --domain=bozcallback.ngrok.app
```

