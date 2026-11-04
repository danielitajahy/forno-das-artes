# Servidor estatico de contingencia. Nao acessa banco, internet, PIN ou pagamentos.
param([switch]$Verificar,[switch]$SemNavegador,[switch]$Previa,[switch]$FinanceiroTeste,[int]$PortaTeste=0)
$ErrorActionPreference = 'Stop'
$Root = [IO.Path]::GetFullPath($PSScriptRoot)
$Required = @('index.html','app/ui.js','app/core.js','app/storage.js','app/app.css','app/seed.js','app/appearance.js','app/order-intent.js','sw.js','manifest.webmanifest','app/finance-results.js','app/finance-ui.js')
foreach ($Name in $Required) {
    if (-not [IO.File]::Exists((Join-Path $Root $Name))) { throw "Pacote incompleto. Extraia TODO o ZIP. Ausente: $Name" }
}
if ($Verificar) { Write-Output 'OK: pacote completo. Nenhum servidor ou banco alterado.'; exit 0 }
$Port = 8766
if ($FinanceiroTeste) { $Port=8871 }
if ($Previa) { $Port = 8870 }
if ($PortaTeste -gt 0) { $Port = $PortaTeste } # Somente automacao isolada; nao usar na operacao.
$Listener = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Parse('127.0.0.1'), $Port)
function Send-Response($Stream, [int]$Status, [string]$Mime, [byte[]]$Body, [bool]$HeadOnly) {
    $Header = "HTTP/1.1 $Status Response`r`nContent-Type: $Mime`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-store, no-cache, must-revalidate, max-age=0`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
    $Bytes = [Text.Encoding]::ASCII.GetBytes($Header)
    $Stream.Write($Bytes,0,$Bytes.Length)
    if (-not $HeadOnly) { $Stream.Write($Body,0,$Body.Length) }
    $Stream.Flush()
}
try {
    try { $Listener.Start() } catch { throw "Porta $Port ocupada ou bloqueada. Preserve o banco e feche conscientemente o servidor anterior. Nao limpe dados." }
    $Page="index.html"
    if ($Previa) { $Page="PREVIA_VISUAL.html" }
    $Url = "http://127.0.0.1:$Port/$Page"
    Write-Output "Forno das Artes - $Url"
    Write-Output 'Servidor nativo local. Mantenha esta janela aberta. Ctrl+C encerra o servidor, sem apagar dados.'
    if (-not $SemNavegador) { try { Start-Process $Url } catch { Write-Output "Abra manualmente: $Url" } }
    while ($true) {
        if (-not $Listener.Pending()) { Start-Sleep -Milliseconds 50; continue }
        $Client = $Listener.AcceptTcpClient()
        $Stream = $null
        try {
            $Client.ReceiveTimeout = 5000; $Client.SendTimeout = 5000
            $Stream = $Client.GetStream(); $Stream.ReadTimeout=5000
            $Reader = New-Object IO.StreamReader($Stream,[Text.Encoding]::ASCII,$false,1024,$true)
            $Line = $Reader.ReadLine()
            if (-not $Line -or $Line.Length -gt 8192 -or $Line -notmatch '^(GET|HEAD) ([^ ]+) HTTP/1\.[01]$') {
                Send-Response $Stream 400 'text/plain' ([Text.Encoding]::UTF8.GetBytes('Requisicao invalida')) $false; continue
            }
            $Method=$Matches[1];$Target=$Matches[2]
            $Count=0
            while ($null -ne ($HeaderLine=$Reader.ReadLine()) -and $HeaderLine -ne '') { $Count+=$HeaderLine.Length; if ($Count -gt 16384) { throw 'Cabecalhos excessivos' } }
            $Path=[Uri]::UnescapeDataString(($Target -split '\?',2)[0])
            if ($Path -eq '/_forno_health') {
                Send-Response $Stream 200 'application/json' ([Text.Encoding]::UTF8.GetBytes('{"application":"forno-das-artes","static_only":true,"database_changed":false}')) ($Method -eq 'HEAD'); continue
            }
            $Allowed=$Path -in @('/','/index.html','/sw.js','/manifest.webmanifest','/PREVIA_VISUAL.html','/PREVIA_FINANCEIRA.html') -or $Path -match '^/app/[^/]+\.(js|css)$' -or $Path -match '^/(docs|plano-c|evidencias)/.+\.(md|html|pdf|png|json|txt)$'
            if ($Path.Contains('\') -or $Path -match '(^|/)\.[^/]*(/|$)' -or -not $Allowed) {
                Send-Response $Stream 404 'text/plain' ([byte[]]@()) ($Method -eq 'HEAD'); continue
            }
            if ($Previa -and $Path -notin @('/','/PREVIA_VISUAL.html','/PREVIA_FINANCEIRA.html')) { Send-Response $Stream 404 'text/plain' ([byte[]]@()) ($Method -eq 'HEAD'); continue }
            if ($Path -eq '/') { if ($Previa) { $Path='/PREVIA_VISUAL.html' } else { $Path='/index.html' } }
            $File=[IO.Path]::GetFullPath((Join-Path $Root $Path.TrimStart('/')))
            $RootPrefix=$Root+[IO.Path]::DirectorySeparatorChar
            if (-not $File.StartsWith($RootPrefix,[StringComparison]::OrdinalIgnoreCase) -or -not [IO.File]::Exists($File)) {
                Send-Response $Stream 404 'text/plain' ([byte[]]@()) ($Method -eq 'HEAD'); continue
            }
            $Mime=switch ([IO.Path]::GetExtension($File).ToLowerInvariant()) {
                '.html' {'text/html; charset=utf-8'} '.js' {'text/javascript; charset=utf-8'} '.css' {'text/css; charset=utf-8'}
                '.webmanifest' {'application/manifest+json'} '.json' {'application/json'} '.png' {'image/png'} '.pdf' {'application/pdf'} default {'text/plain; charset=utf-8'}
            }
            Send-Response $Stream 200 $Mime ([IO.File]::ReadAllBytes($File)) ($Method -eq 'HEAD')
        } catch {
            if ($Stream) { try { Send-Response $Stream 400 'text/plain' ([byte[]]@()) $false } catch {} }
        } finally { if ($Stream) { $Stream.Dispose() }; $Client.Close() }
    }
} finally { $Listener.Stop() }
