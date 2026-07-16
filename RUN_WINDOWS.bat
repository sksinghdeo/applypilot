@echo off
setlocal
cd /d "%~dp0"
title ApplyPilot

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js 18 or newer is required.
  echo Install the LTS version from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -p "Number(process.versions.node.split('.')[0])"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 (
  echo [ERROR] ApplyPilot requires Node.js 18 or newer. Your version is:
  node -v
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing ApplyPilot dependencies from the public npm registry...
  call npm install --omit=dev --registry=https://registry.npmjs.org/
  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    echo Check your internet connection, VPN, firewall, or proxy and try again.
    echo You can also run this in the ApplyPilot folder:
    echo npm install --omit=dev --registry=https://registry.npmjs.org/
    pause
    exit /b 1
  )
)

start "" cmd /c "timeout /t 2 >nul & start http://localhost:4173"
echo ApplyPilot is starting at http://localhost:4173
 echo Keep this window open while using the app. Press Ctrl+C to stop it.
call npm start
