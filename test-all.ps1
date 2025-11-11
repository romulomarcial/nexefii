# Script de Teste - Nexefii Platform
# Abre todas as paginas de teste no navegador padrao

Write-Host "Iniciando testes da Nexefii Platform..." -ForegroundColor Green
Write-Host ""

# Verificar se servidor esta rodando
Write-Host "Verificando servidor..." -ForegroundColor Yellow
$serverRunning = Test-NetConnection -ComputerName localhost -Port 8004 -InformationLevel Quiet

if (-not $serverRunning) {
    Write-Host "ERRO: Servidor nao esta rodando na porta 8004!" -ForegroundColor Red
    Write-Host "Execute: cd r:\Development\Projects\iluxsys; node server.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "OK: Servidor ativo em http://localhost:8004" -ForegroundColor Green
Write-Host ""

# URLs de teste
$testPages = @{
    "Sprint 3 - Upload de Imagens" = "http://localhost:8004/index.html"
    "Sprint 4 - Sync Service" = "http://localhost:8004/pages/sync-config.html"
    "Sprint 5 - OTA Manager" = "http://localhost:8004/pages/ota-manager.html"
    "Sprint 6 - Observability Dashboard" = "http://localhost:8004/pages/observability.html"
    "QA Automatizado Sprint 6" = "http://localhost:8004/qa-baseline/sprint6-observability-qa.html"
}

Write-Host "Abrindo paginas de teste:" -ForegroundColor Cyan
Write-Host ""

foreach ($test in $testPages.GetEnumerator()) {
    Write-Host "  >  $($test.Key)" -ForegroundColor White
    Start-Process $test.Value
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Todas as paginas foram abertas!" -ForegroundColor Green
Write-Host ""
Write-Host "Dicas:" -ForegroundColor Yellow
Write-Host "  - Pressione F12 para abrir DevTools"
Write-Host "  - Verifique o Console para logs"
Write-Host "  - No Observability, clique em Iniciar Monitoramento"
Write-Host "  - O QA automatizado executa sozinho"
Write-Host ""
Write-Host "Guia completo em: TESTING_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
