# Archive legacy iluxsys folder and remove it
Set-Location -Path 'R:\Development\Projects\nexefii'
$ts = Get-Date -Format "yyyyMMdd_HHmm"
$legacyPath = 'R:\Development\Projects\iluxsys'
$archiveDir = '.\backups\archive_legacy'
New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
if (Test-Path $legacyPath) {
  $dest = Join-Path $archiveDir ("iluxsys_legacy_$ts.zip")
  Compress-Archive -Path "$legacyPath\*" -DestinationPath $dest -Force
  if (Test-Path $dest) {
    Remove-Item -Path $legacyPath -Recurse -Force
    Write-Host "✅ Pasta 'iluxsys' arquivada em $dest e removida com sucesso."
  } else {
    Write-Host "⚠️ Falha ao criar o zip: $dest"
  }
} else {
  Write-Host "⚠️ Pasta 'iluxsys' já não existe."
}
