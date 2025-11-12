#!/usr/bin/env pwsh
# Start NEXEFII Dev Server
# Ensures server runs from script directory on port 8004 (no hardcoded paths)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = $ScriptDir
$Port = 8004

Write-Host "`n=== NEXEFII Dev Server ===" -ForegroundColor Cyan
Write-Host "Directory: $ServerDir" -ForegroundColor Yellow
Write-Host "Port: $Port`n" -ForegroundColor Yellow

# Kill any existing node processes on port 8004
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
#!/usr/bin/env pwsh
# Start NEXEFII Dev Server
# Ensures server runs from script directory on port 8004 (no hardcoded paths)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ServerDir = $ScriptDir
$Port = 8004

Write-Host "`n=== NEXEFII Dev Server ===" -ForegroundColor Cyan
Write-Host "Directory: $ServerDir" -ForegroundColor Yellow
Write-Host "Port: $Port`n" -ForegroundColor Yellow

# Kill any existing node processes on port 8004
$existingProcess = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($existingProcess) {
    # Avoid assigning to automatic variable names like $PID; use a local name instead
    foreach ($conn in $existingProcess) {
        $existingPid = $conn.OwningProcess
        Write-Host "Stopping existing process on port $Port (PID: $existingPid)..." -ForegroundColor Red
        Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Change to server directory
Set-Location $ServerDir

# Start server
Write-Host "Starting server..." -ForegroundColor Green
node server.js
    # Avoid assigning to automatic variable names like $PID; use a local name instead
