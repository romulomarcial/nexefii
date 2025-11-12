Write-Host "== Nexefii Smoke Test ==" -ForegroundColor Cyan

$tests = @(
    @{ Name="lock/health";     Url="http://localhost:8081/health";          Method="GET";  Expect=200; Must="" }
    @{ Name="lock/openapi";    Url="http://localhost:8081/openapi";         Method="GET";  Expect=200; Must="openapi:" }
    @{ Name="demo/health";     Url="http://localhost:8082/health";          Method="GET";  Expect=200; Must="OK" }
    @{ Name="demo/properties"; Url="http://localhost:8082/demo/properties"; Method="GET";  Expect=200; Must="properties" }
    @{ Name="demo/seed";       Url="http://localhost:8082/demo/seed";       Method="POST"; Expect=201; Must="seeded" }
    @{ Name="demo/metrics";    Url="http://localhost:8082/metrics";         Method="GET";  Expect=200; Must="demo_property_up" }
    @{ Name="web/root";        Url="http://localhost:8080/";                Method="GET";  Expect=200; Must="" }
)

$fail=0
foreach ($t in $tests) {
    Write-Host "`n[$($t.Method)] $($t.Url)" -ForegroundColor Yellow
    try {
        $params = @{ Uri=$t.Url; Method=$t.Method; UseBasicParsing=$true }
        if ($t.Method -eq "POST") { $params.ContentType = "application/json"; $params.Body = "{}" }
        $r = Invoke-WebRequest @params

        $body = $r.Content
        $bodyText = if ($null -ne $body -and $body -is [byte[]]) { [Text.Encoding]::UTF8.GetString($body) } else { [string]$body }

        $ok = ($r.StatusCode -eq $t.Expect) -and ([string]::IsNullOrEmpty($t.Must) -or $bodyText -like "*$($t.Must)*")
        if ($ok) {
            Write-Host "[PASS] $($t.Name) -> $($r.StatusCode)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $($t.Name) -> status=$($r.StatusCode)" -ForegroundColor Red
            $preview = if ($null -ne $bodyText) { $bodyText.Substring(0, [Math]::Min(200, $bodyText.Length)) } else { "<no body>" }
            Write-Host "Body preview: $preview"
            $fail++
        }
    } catch {
        Write-Host "[ERROR] $($t.Name) -> $($_.Exception.Message)" -ForegroundColor Red
        $fail++
    }
}

Write-Host "`nResumo: FAIL=$fail"
if ($fail -eq 0) { Write-Host "Tudo OK ✅" -ForegroundColor Green } else { Write-Host "Há falhas ⛔" -ForegroundColor Red }
Read-Host "`nPressione ENTER para sair"
