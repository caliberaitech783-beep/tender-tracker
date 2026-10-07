$ErrorActionPreference = 'Stop'
$workspacePath = $PSScriptRoot
$logDirectory = Join-Path $workspacePath '.local'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:4310/api/health' -TimeoutSec 2
    if ($health.status -eq 'ok') { Write-Host 'Tender Tracker is already running: http://localhost:4310'; exit 0 }
} catch {}
if (-not (Test-Path -LiteralPath (Join-Path $workspacePath 'node_modules'))) {
    Push-Location $workspacePath
    try { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' } } finally { Pop-Location }
}
if (-not (Test-Path -LiteralPath (Join-Path $workspacePath 'dist/index.html'))) {
    Push-Location $workspacePath
    try { & npm.cmd run build; if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' } } finally { Pop-Location }
}
$nodeExecutable = (Get-Command node.exe).Source
$process = Start-Process -FilePath $nodeExecutable -ArgumentList 'server.mjs' -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'server.log') -RedirectStandardError (Join-Path $logDirectory 'server-error.log') -PassThru
Set-Content -LiteralPath (Join-Path $logDirectory 'server.pid') -Value $process.Id
Write-Host 'Starting Tender Tracker at http://localhost:4310'
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 1
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:4310/api/health' -TimeoutSec 1
        if ($health.status -eq 'ok') { Write-Host 'Ready: http://localhost:4310'; exit 0 }
    } catch {}
    $process.Refresh()
    if ($process.HasExited) { throw 'Server stopped during startup. See .local/server-error.log.' }
}
throw 'Startup has not completed. See .local/server.log and .local/server-error.log.'
