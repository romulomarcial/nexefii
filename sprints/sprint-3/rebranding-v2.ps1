# Script de Rebranding Completo: iLux -> Nexefii
# Data: 2025-11-09

Write-Host "Iniciando rebranding completo: iLux -> Nexefii" -ForegroundColor Cyan

$replacements = @{
    'iLux Hotel' = 'Nexefii Hotel'
    'iluxSaoPaulo' = 'nexefiiSaoPaulo'
    'iluxMiami' = 'nexefiiMiami'
    'iluxRioDeJaneiro' = 'nexefiiRioDeJaneiro'
    'IluxProps' = 'NexefiiProps'
    'ilux_lang' = 'nexefii_lang'
    'ilux_user' = 'nexefii_user'
    'iluxsys_users' = 'nexefii_users'
    'iluxsys_session' = 'nexefii_session'
    'iluxsys_properties' = 'nexefii_properties'
    'iluxsys_email_log' = 'nexefii_email_log'
    'iluxsys\.com' = 'nexefii.com'
    'admin@iluxsys' = 'admin@nexefii'
    'demo@iluxsys' = 'demo@nexefii'
    'master@iluxsys' = 'master@nexefii'
    'IluxSys' = 'NEXEFII'
}

# Arquivos criticos para atualizar
$criticalFiles = @(
    'index.html',
    'master-control.js',
    'master-control-enterprise.js',
    'property-dashboard-manager.js',
    'demo-data-generator.js',
    'test-properties.html',
    'property-local-test-generator.js',
    'property-publish-helpers.js',
    'clear-cache.html',
    'qa-baseline-capture.js',
    'test-property-dashboard.html',
    'migrate-storage.html',
    'package.json',
    'server.js'
)

$baseDir = "r:\Development\Projects\iluxsys"
$updated = 0
$errors = 0

foreach ($file in $criticalFiles) {
    $filePath = Join-Path $baseDir $file
    
    if (Test-Path $filePath) {
        try {
            Write-Host "Processando: $file" -ForegroundColor Yellow
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $originalContent = $content
            
            foreach ($old in $replacements.Keys) {
                $new = $replacements[$old]
                $content = $content -replace $old, $new
            }
            
            if ($content -ne $originalContent) {
                [System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
                Write-Host "   Atualizado com sucesso" -ForegroundColor Green
                $updated++
            } else {
                Write-Host "   Nenhuma alteracao necessaria" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "   Erro: $_" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "   Arquivo nao encontrado: $file" -ForegroundColor Magenta
    }
}

Write-Host ""
Write-Host "Rebranding concluido!" -ForegroundColor Cyan
Write-Host "Arquivos atualizados: $updated" -ForegroundColor Green
Write-Host "Erros encontrados: $errors" -ForegroundColor $(if ($errors -gt 0) {'Red'} else {'Green'})

Write-Host ""
Write-Host "Script concluido!" -ForegroundColor Green
