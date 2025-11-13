# BI smoke tests
$base = 'http://localhost:8086'
$report = @()

function Test-GetHealth {
  try{
    $r = Invoke-RestMethod -Uri "$base/bi/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if($r -eq 'OK'){ $report += 'Health: PASS' ; return $true } else { $report += 'Health: FAIL' ; return $false }
  }catch{ $report += "Health: ERROR - $_" ; return $false }
}

function Test-GetKpis {
  try{
    $r = Invoke-RestMethod -Uri "$base/bi/kpis" -Method GET -TimeoutSec 5 -ErrorAction Stop
    $keys = @('occupancy_pct','revpar','kwh','open_tickets')
    $miss = $keys | Where-Object { -not $r.PsObject.Properties.Name.Contains($_) }
    if($miss.Count -eq 0){ $report += 'KPI: PASS' ; return $true } else { $report += "KPI: FAIL - missing $($miss -join ',')" ; return $false }
  }catch{ $report += "KPI: ERROR - $_" ; return $false }
}

function Test-GetReports {
  try{
    $r = Invoke-RestMethod -Uri "$base/bi/reports" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if($r.items -and $r.items.Count -gt 0){ $report += 'Reports: PASS' ; return $true } else { $report += 'Reports: FAIL - empty' ; return $false }
  }catch{ $report += "Reports: ERROR - $_" ; return $false }
}

function Test-PostExport([string]$fmt){
  try{
    $body = @{ reportId='r1'; format=$fmt; params=@{} } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$base/bi/export" -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 15 -ErrorAction Stop
    $ct = $r.Headers['Content-Type']
    switch($fmt){
      'csv' { $ok = $ct -like 'text/csv*' }
      'json' { $ok = $ct -like 'application/json*' }
      'xlsx' { $ok = $ct -like 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet*' }
      default { $ok=$false }
    }
    if($ok){ $report += "Export ${fmt}: PASS ($ct)" ; return $true } else { $report += "Export ${fmt}: FAIL ($ct)" ; return $false }
  }catch{ $report += "Export ${fmt}: ERROR - $_" ; return $false }
}

# Run tests
Test-GetHealth
Test-GetKpis
Test-GetReports
Test-PostExport 'csv'
Test-PostExport 'json'
Test-PostExport 'xlsx'

# Write report
$report | Out-File -FilePath "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)\QA_REPORT.md" -Encoding utf8
$report -join "`n" | Write-Output

