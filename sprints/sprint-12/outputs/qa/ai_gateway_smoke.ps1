# AI + Gateway smoke tests
$base_ai = 'http://localhost:8087'
$base_gateway = 'http://localhost:8088'
$api_key = 'devkey'
$report = @()

function Add-Report($s){ $report += $s }

function Test-AIHealth {
  try{ $r = Invoke-RestMethod -Uri "$base_ai/ai/health" -Method GET -TimeoutSec 5 -ErrorAction Stop; if($r -eq 'OK'){ Add-Report 'AI Health: PASS'; return $true } else { Add-Report 'AI Health: FAIL'; return $false } } catch { Add-Report "AI Health: ERROR - $_"; return $false }
}

function Test-BIKpis {
  try{ $r = Invoke-RestMethod -Uri "http://localhost:8086/bi/kpis" -Method GET -TimeoutSec 5 -ErrorAction Stop; $keys=@('occupancy_pct','revpar','kwh','open_tickets'); $miss=$keys | Where-Object { -not $r.PsObject.Properties.Name.Contains($_) }; if($miss.Count -eq 0){ Add-Report 'BI KPIs: PASS'; return $true } else { Add-Report "BI KPIs: FAIL - missing $($miss -join ',')"; return $false } } catch { Add-Report "BI KPIs: ERROR - $_"; return $false }
}

function Test-GatewayProxyBI {
  try{ $r = Invoke-RestMethod -Uri "$base_gateway/api/bi/kpis" -Method GET -Headers @{ 'X-Api-Key' = $api_key } -TimeoutSec 5 -ErrorAction Stop; if($r.occupancy_pct -ne $null){ Add-Report 'Gateway -> BI KPI: PASS'; return $true } else { Add-Report 'Gateway -> BI KPI: FAIL'; return $false } } catch { Add-Report "Gateway -> BI KPI: ERROR - $_"; return $false }
}

function Test-GatewayAIInsights {
  try{
    $body = @{ scope='property'; propertyId='demo_001'; horizon='24h'; metrics=@('energy','occupancy','alerts') } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$base_gateway/api/ai/insights" -Method POST -Headers @{ 'X-Api-Key' = $api_key } -Body $body -ContentType 'application/json' -TimeoutSec 10 -ErrorAction Stop
    if($r.propertyId){ Add-Report 'Gateway -> AI Insights: PASS'; return $true } else { Add-Report 'Gateway -> AI Insights: FAIL'; return $false }
  } catch { Add-Report "Gateway -> AI Insights: ERROR - $_"; return $false }
}

# Run tests
Test-AIHealth
Test-BIKpis
Test-GatewayProxyBI
Test-GatewayAIInsights

# Write report
$report | Out-File -FilePath "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\QA_REPORT_S12.md" -Encoding utf8
$report -join "`n" | Write-Output
