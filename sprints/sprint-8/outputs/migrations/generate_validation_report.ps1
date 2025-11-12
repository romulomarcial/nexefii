$report='migrations/VALIDATION_REPORT.md'
$files=@('migrations/V001__init.sql','migrations/V002__seed.sql','migrations/V003__demo.sql','nexefii-database-blueprint.md','qa/schema-lint.ps1','qa/erd-export-note.md')
$result=@(); $allok=$true
foreach($f in $files){
  $exists = Test-Path $f
  $lines = 0
  if($exists){ $lines = (Get-Content -Path $f -Encoding UTF8 | Measure-Object -Line).Lines }
  $checks = @()
  if($f -like 'migrations/V001*'){
    $c1 = Select-String -Path $f -Pattern 'CREATE TABLE IF NOT EXISTS public.tenants' -SimpleMatch -Quiet
    $c2 = Select-String -Path $f -Pattern 'PARTITION BY RANGE' -SimpleMatch -Quiet
    $checks += @{name='tenants_table'; ok=$c1}
    $checks += @{name='partition_clause'; ok=$c2}
  } elseif($f -like 'migrations/V002*'){
    $c1 = Select-String -Path $f -Pattern 'INSERT INTO public.modules' -SimpleMatch -Quiet
    $c2 = Select-String -Path $f -Pattern 'demo_001' -SimpleMatch -Quiet
    $checks += @{name='modules_seed'; ok=$c1}
    $checks += @{name='demo_tenant_seed'; ok=$c2}
  } elseif($f -like 'migrations/V003*'){
    $c1 = Select-String -Path $f -Pattern 'ensure_tenant_schema' -SimpleMatch -Quiet
    $c2 = Select-String -Path $f -Pattern 'CREATE TABLE IF NOT EXISTS' -SimpleMatch -Quiet
    $checks += @{name='ensure_tenant_schema'; ok=$c1}
    $checks += @{name='tenant_tables_created'; ok=$c2}
  } elseif($f -like '*.md'){
    $c1 = Get-Content -Path $f -Encoding UTF8 | Select-String -Pattern 'ERD' -Quiet
    $checks += @{name='contains_ERD'; ok=$c1}
  } elseif($f -like 'qa/*'){
    $c1 = Select-String -Path $f -Pattern 'to_regclass' -SimpleMatch -Quiet
    $checks += @{name='psql_checks'; ok=$c1}
  }
  $ok_each = $true
  foreach($ck in $checks){ if(-not $ck.ok){ $ok_each = $false; $allok = $false } }
  $result += @{file=$f; exists=$exists; lines=$lines; checks=$checks; ok=$ok_each}
}
# Write report
"# VALIDATION_REPORT" | Out-File -FilePath $report -Encoding utf8
"Generated: $(Get-Date -Format o)" | Out-File -FilePath $report -Append -Encoding utf8
"" | Out-File -FilePath $report -Append -Encoding utf8
foreach($r in $result){
  "- File: $($r.file)" | Out-File -FilePath $report -Append -Encoding utf8
  "  - Exists: $($r.exists)" | Out-File -FilePath $report -Append -Encoding utf8
  "  - Lines: $($r.lines)" | Out-File -FilePath $report -Append -Encoding utf8
  "  - OK: $($r.ok)" | Out-File -FilePath $report -Append -Encoding utf8
  if($r.checks){
    "  - Checks:" | Out-File -FilePath $report -Append -Encoding utf8
    foreach($ck in $r.checks){ "    - $($ck.name): $($ck.ok)" | Out-File -FilePath $report -Append -Encoding utf8 }
  }
  "" | Out-File -FilePath $report -Append -Encoding utf8
}
if($allok){ "ALL CHECKS: OK" | Out-File -FilePath $report -Append -Encoding utf8; exit 0 } else { "ALL CHECKS: FAIL" | Out-File -FilePath $report -Append -Encoding utf8; exit 1 }
