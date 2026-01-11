# Install ngrok for Windows
Write-Host "Installing ngrok..." -ForegroundColor Green

# Check if Chocolatey is installed
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "Installing ngrok via Chocolatey..." -ForegroundColor Yellow
    choco install ngrok -y
} else {
    Write-Host "Chocolatey not found. Downloading ngrok manually..." -ForegroundColor Yellow
    
    # Create temp directory
    $tempDir = "$env:TEMP\ngrok-install"
    if (!(Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }
    
    # Download ngrok
    $ngrokUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    $zipPath = "$tempDir\ngrok.zip"
    $extractPath = "$tempDir\ngrok"
    
    Write-Host "Downloading ngrok from $ngrokUrl..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $ngrokUrl -OutFile $zipPath
    
    Write-Host "Extracting ngrok..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
    
    # Find ngrok.exe
    $ngrokExe = Get-ChildItem -Path $extractPath -Filter "ngrok.exe" -Recurse | Select-Object -First 1
    
    if ($ngrokExe) {
        # Copy to a location in PATH (like user's local bin)
        $userBin = "$env:USERPROFILE\bin"
        if (!(Test-Path $userBin)) {
            New-Item -ItemType Directory -Path $userBin | Out-Null
        }
        
        Copy-Item $ngrokExe.FullName -Destination "$userBin\ngrok.exe" -Force
        
        # Add to PATH if not already there
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($currentPath -notlike "*$userBin*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$userBin", "User")
            Write-Host "Added $userBin to PATH. Please restart your terminal." -ForegroundColor Green
        }
        
        Write-Host "ngrok installed to $userBin\ngrok.exe" -ForegroundColor Green
        Write-Host "Please restart your terminal or run: `$env:Path += `";$userBin`"" -ForegroundColor Yellow
    } else {
        Write-Host "Error: Could not find ngrok.exe in downloaded files" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
Write-Host "2. Run: ngrok config add-authtoken YOUR_AUTHTOKEN" -ForegroundColor Yellow
Write-Host "3. Restart your terminal" -ForegroundColor Yellow

