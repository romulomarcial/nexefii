<#
Simple smoke script for the Nexefii demo Compose setup.
Usage: .\smoke_docker_demo.ps1 -TimeoutSec 90
#>

param([int]$TimeoutSec = 90)

$services = @(
  @{ name = 'web'; url = 'http://localhost:8080/health' },
  @{ name = 'lock-service-mock'; url = 'http://localhost:8081/health' },
  @{ name = 'demo-property-service'; url = 'http://localhost:8082/health' },
  @{ name = 'postgres'; url = 'tcp://localhost:5432' }
)

function Test-Http([string]$url){
  try{ $r = Invoke-WebRequest -Uri $url -UseBasicParsing -Method GET -TimeoutSec 5 -ErrorAction Stop; return $r.StatusCode -eq 200 } catch { return $false }
}

function Test-Tcp([string]$url){
  if($url -notmatch '^tcp://([^:]+):(\d+)'){ return $false }
  $targetHost = $Matches[1]; $port = [int]$Matches[2]
  try{ $r = Test-NetConnection -ComputerName $targetHost -Port $port -WarningAction SilentlyContinue; return $r.TcpTestSucceeded -eq $true } catch { return $false }
}

$deadline = (Get-Date).AddSeconds($TimeoutSec)
$results = @{}
foreach($s in $services){ $results[$s.name] = $false }

while((Get-Date) -lt $deadline){
  foreach($s in $services){
    if($results[$s.name]){ continue }
    if($s.url -like 'tcp://*'){
      if(Test-Tcp $s.url){ $results[$s.name] = $true; Write-Host "[$($s.name)] TCP OK" }
    } else {
      if(Test-Http $s.url){ $results[$s.name] = $true; Write-Host "[$($s.name)] HTTP 200" }
    }
  }
  if(($results.Values | Where-Object { $_ -eq $false }).Count -eq 0){ break }
  Start-Sleep -Seconds 2
}

$allOk = ($results.Values | Where-Object { $_ -eq $false }).Count -eq 0
Write-Host "--- Summary ---"
foreach($k in $results.Keys){ Write-Host "$k : $($results[$k])" }
if($allOk){ Write-Host "RESULT: PASS"; exit 0 } else { Write-Host "RESULT: FAIL"; exit 1 }


