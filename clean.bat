@echo off
echo Cleaning up processes and files...

:: Kill any InvoiceForge processes
taskkill /F /IM InvoiceForge.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM electron.exe 2>nul

:: Wait a moment
timeout /t 2 /nobreak >nul

:: Find and kill any process using the app.asar file
echo Finding processes using app.asar...
for /f "tokens=2" %%i in ('tasklist /m app.asar 2^>nul') do (
    echo Killing process %%i
    taskkill /F /PID %%i 2>nul
)

:: Use handle.exe if available to find file locks (optional)
where handle.exe >nul 2>&1
if %errorlevel% == 0 (
    echo Using handle.exe to find file locks...
    for /f "tokens=3" %%i in ('handle.exe app.asar 2^>nul ^| findstr /i "pid"') do (
        echo Killing PID %%i
        taskkill /F /PID %%i 2>nul
    )
)

:: Force unlock using PowerShell if needed
powershell -Command "Get-Process | Where-Object { $_.ProcessName -like '*InvoiceForge*' -or $_.ProcessName -like '*electron*' } | Stop-Process -Force" 2>nul

:: Wait longer
timeout /t 3 /nobreak >nul

:: Force remove using PowerShell with stronger permissions
if exist release (
    echo Force removing release directory with PowerShell...
    powershell -Command "if (Test-Path 'release') { Remove-Item -Path 'release' -Recurse -Force -ErrorAction SilentlyContinue }"
    timeout /t 2 /nobreak >nul
)

:: Try standard removal again
if exist release (
    echo Attempting standard removal...
    rmdir /S /Q release 2>nul
)

:: Remove dist directory
if exist dist (
    echo Removing dist directory...
    rmdir /S /Q dist 2>nul
)

:: Final check and manual intervention message
if exist release (
    echo WARNING: Release directory still exists. Manual intervention may be needed.
    echo Try restarting your computer or check Task Manager for locked processes.
) else (
    echo Release directory successfully removed.
)

echo Cleanup complete!