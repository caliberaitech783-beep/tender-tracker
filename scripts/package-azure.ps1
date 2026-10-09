$ErrorActionPreference = 'Stop'
$workspacePath = Split-Path -Parent $PSScriptRoot
Push-Location $workspacePath
try {
    & npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Tests failed.' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
    $outputDirectory = Join-Path $workspacePath '.local'
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    $archivePath = Join-Path $outputDirectory 'tender-azure.zip'
    $sourceFiles = @('package.json', 'package-lock.json', 'index.html', 'vite.config.mjs', 'server.mjs', 'db.mjs', 'auth-bdms.mjs','auth-oidc.mjs', 'portal-import.mjs', 'tender-import.mjs', 'runtime-config.mjs', 'schema.sql', 'src', 'dist')
    Compress-Archive -LiteralPath $sourceFiles -DestinationPath $archivePath -Force
    Write-Output "Deployment package: $archivePath"
} finally { Pop-Location }

