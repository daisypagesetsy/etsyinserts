@echo off
setlocal
cd /d "%~dp0"
py -3 --version >nul 2>&1
if errorlevel 1 (
  echo Install Python 3.11 or newer from https://www.python.org/downloads/ then try again.
  pause
  exit /b 1
)
if not exist .venv\Scripts\python.exe py -3 -m venv .venv
if errorlevel 1 goto failure
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto failure
.venv\Scripts\python.exe app.py --open-browser
if errorlevel 1 goto failure
exit /b 0
:failure
echo The app could not start. Copy the error above for help.
pause
exit /b 1
