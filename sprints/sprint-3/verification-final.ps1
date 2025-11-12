# Script de Verificação Final - Rebranding iLux -> Nexefii
# Data: 2025-11-09

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  VERIFICACAO FINAL DE REBRANDING" -ForegroundColor Cyan
Write-Host "  iLux -> Nexefii" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = "r:\Development\Projects\iluxsys"
$excludeDirs = @('node_modules', 'bkp', 'Bkp', '.git')

# Padrões a buscar
$patterns = @('ilux', 'IluxProps', 'IluxAuth', 'iluxsys_', 'IluxSys')

Write-Host "Buscando padroes em arquivos funcionais (JS, HTML, JSON)..." -ForegroundColor Yellow
Write-Host ""

$results = @()

foreach ($pattern in $patterns) {
    Write-Host "Procurando por: $pattern" -ForegroundColor Magenta
    
    $matches = Get-ChildItem -Path $baseDir -Recurse -Include *.js,*.html,*.json -File | 
        Where-Object { 
            $exclude = $false
            foreach ($dir in $excludeDirs) {
                if ($_.FullName -like "*\$dir\*") {
                    $exclude = $true
                    break
                }
            }
            -not $exclude
        } |
        Select-String -Pattern $pattern -CaseSensitive
    
    if ($matches) {
        foreach ($match in $matches) {
            $results += [PSCustomObject]@{
                Pattern = $pattern
                File = ($match.Path -replace [regex]::Escape($baseDir), '').TrimStart('\')
                Line = $match.LineNumber
                Context = $match.Line.Trim()
            }
        }
    }
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  RESULTADOS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if ($results.Count -eq 0) {
    Write-Host "SUCESSO! Nenhuma ocorrencia encontrada." -ForegroundColor Green
    Write-Host "O rebranding esta 100% completo!" -ForegroundColor Green
} else {
    Write-Host "Total de ocorrencias encontradas: $($results.Count)" -ForegroundColor Yellow
    Write-Host ""
    
    $groupedByFile = $results | Group-Object -Property File
    
    foreach ($group in $groupedByFile) {
        Write-Host "Arquivo: $($group.Name)" -ForegroundColor Yellow
        foreach ($item in $group.Group) {
            Write-Host "  Linha $($item.Line): $($item.Pattern) -> $($item.Context.Substring(0, [Math]::Min(80, $item.Context.Length)))" -ForegroundColor White
        }
        Write-Host ""
    }
    
    # Analisar se sao referencias intencionais
    $intentionalFiles = @('migrate-storage.html', 'README.md', 'MIGRATION')
    $intentional = $results | Where-Object { 
        $file = $_.File
        $intentionalFiles | Where-Object { $file -like "*$_*" } | Select-Object -First 1
    }
    
    $nonIntentional = $results | Where-Object { 
        $file = $_.File
        -not ($intentionalFiles | Where-Object { $file -like "*$_*" } | Select-Object -First 1)
    }
    
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "  ANALISE" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Referencias intencionais (arquivos de migracao): $($intentional.Count)" -ForegroundColor Gray
    Write-Host "Referencias NAO intencionais (REQUEREM ACAO): $($nonIntentional.Count)" -ForegroundColor $(if ($nonIntentional.Count -gt 0) {'Red'} else {'Green'})
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  VERIFICACAO CONCLUIDA" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
