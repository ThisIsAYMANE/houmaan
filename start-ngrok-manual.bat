@echo off
echo ========================================
echo ngrok Manual Start Script
echo ========================================
echo.
echo IMPORTANT: Update the path below to where you extracted ngrok.exe
echo.

REM ========================================
REM UPDATE THIS PATH TO WHERE YOU EXTRACTED NGROK
REM ========================================
set NGROK_PATH=C:\Users\AYMANE MAALI\ngrok\ngrok.exe

REM Check if ngrok exists
if not exist "%NGROK_PATH%" (
    echo ERROR: ngrok.exe not found at: %NGROK_PATH%
    echo.
    echo Please update NGROK_PATH in this script to point to your ngrok.exe
    echo.
    pause
    exit /b 1
)

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

echo Starting callback tunnel (bozcallback.ngrok.app)...
start "ngrok-callback" cmd /k ""%NGROK_PATH%" http 3000 --domain=bozcallback.ngrok.app"
timeout /t 2 /nobreak >nul

echo Starting test area tunnel (boztestarea.ngrok.app)...
start "ngrok-testarea" cmd /k ""%NGROK_PATH%" http 3000 --domain=boztestarea.ngrok.app"
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

