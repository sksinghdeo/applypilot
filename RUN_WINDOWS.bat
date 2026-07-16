@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required. Install it from nodejs.org and run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing ApplyPilot dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
start "" cmd /c "timeout /t 2 >nul & start http://localhost:4173"
echo ApplyPilot is starting. Keep this window open while using the app.
call npm start
