@echo off
echo Starting ngrok tunnels for Casino API...
echo.

REM Check if Next.js is running
netstat -ano | findstr :3000 >nul
if %errorlevel% neq 0 (
    echo ERROR: Next.js is not running on port 3000!
    echo Please start your Next.js app first: npm run dev
    pause
    exit /b 1
)

echo Next.js detected on port 3000
echo.

REM Start callback tunnel
echo Starting callback tunnel (bozcallback.ngrok.app)...
start "ngrok-callback" cmd /k "ngrok http 3000 --domain=bozcallback.ngrok.app"
timeout /t 2 /nobreak >nul

REM Start test area tunnel
echo Starting test area tunnel (boztestarea.ngrok.app)...
start "ngrok-testarea" cmd /k "ngrok http 3000 --domain=boztestarea.ngrok.app"
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo Both ngrok tunnels started!
echo ========================================
echo.
echo Callback URL: https://bozcallback.ngrok.app/api/casino/callback
echo Test Area URL: https://boztestarea.ngrok.app
echo.
echo Check tunnel status at: http://localhost:4040
echo.
echo Press any key to exit...
pause >nul

