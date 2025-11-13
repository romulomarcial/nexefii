# QA Smoke Test for Housekeeping Service
$base = "http://localhost:8083"
Write-Host "Checking /health..."
Invoke-WebRequest "$base/health" -UseBasicParsing
Write-Host "Checking /hk/rooms..."
Invoke-WebRequest "$base/hk/rooms" -UseBasicParsing
Write-Host "Creating housekeeping task..."
$task = @{room_id=1; task_type="Limpeza"; status="pending"}
Invoke-WebRequest "$base/hk/tasks" -Method POST -Body ($task | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
Write-Host "Updating housekeeping task..."
$update = @{status="done"}
Invoke-WebRequest "$base/hk/tasks/1" -Method PATCH -Body ($update | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
Write-Host "Ingesting DND..."
$dnd = @{room_id=1; dnd=$true}
Invoke-WebRequest "$base/hk/ingest/dnd" -Method POST -Body ($dnd | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
Write-Host "Housekeeping smoke test complete."
