param(
    [Parameter(Mandatory=$true)]
    [string]$SprintNumber,
    [Parameter(Mandatory=$true)]
    [string]$FileName,
    [Parameter(Mandatory=$true)]
    [string]$Content
)

# Caminho base
$basePath = Join-Path -Path (Get-Location) -ChildPath "sprints\sprint-$SprintNumber"

# Cria pasta sprint se não existir
if (!(Test-Path $basePath)) {
    New-Item -ItemType Directory -Force -Path $basePath | Out-Null
}

# Cria subpasta outputs se não existir
$outputPath = Join-Path -Path $basePath -ChildPath "outputs"
if (!(Test-Path $outputPath)) {
    New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
}

# Define caminho completo do arquivo
$targetFile = Join-Path -Path $outputPath -ChildPath $FileName

# Salva conteúdo no arquivo especificado
$Content | Out-File -FilePath $targetFile -Encoding UTF8

Write-Host "✅ Output saved to: $targetFile" -ForegroundColor Green
