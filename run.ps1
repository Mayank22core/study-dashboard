param([switch]$NoBrowser)

Write-Host "=== Study Dashboard ===" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = "C:\Program Files\nodejs\;$env:Path"

Write-Host "Starting backend..." -ForegroundColor Yellow
$backend = Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "$root\backend" -PassThru
Start-Sleep -Seconds 2

Write-Host "Starting frontend..." -ForegroundColor Yellow
$frontend = Start-Process -NoNewWindow -FilePath "node" -ArgumentList ".\node_modules\.bin\vite.cmd" -WorkingDirectory "$root\frontend" -PassThru
Start-Sleep -Seconds 4

Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Login: student@study.app / study123" -ForegroundColor Gray
Write-Host ""
if (-not $NoBrowser) { Start-Process "http://localhost:5173" }
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray

try {
  $backend.WaitForExit()
}
finally {
  if (!$backend.HasExited) { $backend.Kill() }
  if (!$frontend.HasExited) { $frontend.Kill() }
}
