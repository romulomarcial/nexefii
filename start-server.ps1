Set-Location "r:\\Development\\Projects\\iluxsys"
Write-Output "Starting http-server (detached) from $PWD"
# Use cmd.exe to ensure npx runs correctly on Windows
Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npx http-server -p 8004" -WorkingDirectory "$PWD" -WindowStyle Hidden | Out-Null
Write-Output "http-server started (detached). Use Task Manager or Get-Process to stop it." 
