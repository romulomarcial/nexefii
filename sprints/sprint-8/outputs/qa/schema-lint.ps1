#!/usr/bin/env pwsh
<#
Schema Lint for Nexefii DB blueprint
Usage (non-interactive): set env PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE then run this script.
Exits with code 0 if all checks pass, 1 otherwise.
#>

$errorActionPreference = 'Stop'

function ExecSql($sql) {
  $psql = 'psql'
  $envPG = $env:PGHOST
  $args = @('-t','-A','-c',$sql)
  $out = & $psql @args 2>$null
  return $out
}

$failures = @()

try {
  # Check that critical tables exist
  $tables = @('public.tenants','public.modules','public.tenant_modules','public.users','public.roles','public.user_roles','public.role_claims','public.audit_logs','public.usage_metrics','public.demo_properties','public.fake_data_jobs')
  foreach($t in $tables) {
    $q = "SELECT to_regclass('$t') IS NOT NULL";
    $res = ExecSql $q
    if($res -notmatch 't') { $failures += "Missing table: $t" }
  }

  # Check partitions exist for current month for audit_logs and usage_metrics
  $cur = (Get-Date).ToString('yyyyMM')
  $p1 = "audit_logs_p_$cur"
  $p2 = "usage_metrics_p_$cur"
  $q1 = "SELECT to_regclass('public.$p1') IS NOT NULL"; if((ExecSql $q1) -notmatch 't') { $failures += "Missing partition: $p1" }
  $q2 = "SELECT to_regclass('public.$p2') IS NOT NULL"; if((ExecSql $q2) -notmatch 't') { $failures += "Missing partition: $p2" }

  # Check foreign key constraints present (check at least tenants referenced)
  $qfk = "SELECT constraint_name FROM information_schema.table_constraints WHERE table_schema='public' AND constraint_type='FOREIGN KEY' LIMIT 1";
  $fk = ExecSql $qfk
  if([string]::IsNullOrEmpty($fk)) { $failures += 'No foreign keys found in public schema' }

} catch {
  $failures += "Exception: $_"
}

if($failures.Count -gt 0) {
  Write-Host "Schema lint FAILED:`n$($failures -join "`n")"
  exit 1
} else {
  Write-Host "Schema lint OK"
  exit 0
}
