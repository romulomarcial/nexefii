# QA Smoke Test for Alerts Service
$base = "http://localhost:8084"
Write-Host "Checking /health..."
Invoke-WebRequest "$base/health" -UseBasicParsing
Write-Host "Adding alert rule..."
$rule = @{rule_name="DND ativo"; severity="high"; conditions=@{"dnd"=$true}} 
Invoke-WebRequest "$base/alerts/rules" -Method POST -Body ($rule | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
Write-Host "Evaluating alert..."
$event = @{event_type="dnd"; payload=@{"room_id"=1; "dnd"=$true}} 
Invoke-WebRequest "$base/alerts/evaluate" -Method POST -Body ($event | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
Write-Host "Notifying webhook..."
$payload = @{message="DND detectado"; severity="high"} 
Invoke-WebRequest "$base/alerts/notify/webhook" -Method POST -Body ($payload | ConvertTo-Json) -ContentType "application/json" -UseBasicParsing
Write-Host "Alerts smoke test complete."
