Param(
  [int]$Port = 8004
)

$ErrorActionPreference = 'SilentlyContinue'

Write-Host "`n=== NEXEFII Dev Server Starter ===" -ForegroundColor Cyan
Write-Host "Port: $Port" -ForegroundColor Gray

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
Write-Host "Working directory: $ScriptDir`n" -ForegroundColor Gray

# Kill existing processes on port
Write-Host "Checking port $Port..." -ForegroundColor Yellow
try {
  $existingPid = (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
  if ($existingPid) {
    Write-Host "Killing process on port $Port (PID $existingPid)" -ForegroundColor DarkYellow
    Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
  }
} catch { }

Write-Host "Port $Port is free" -ForegroundColor Green
Write-Host ""

# Start server
Write-Host "Starting NEXEFII dev server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

$env:PORT = $Port
node server.js
