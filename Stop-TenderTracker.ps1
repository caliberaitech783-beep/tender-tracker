$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot '.local/server.pid'
if (-not (Test-Path -LiteralPath $pidFile)) { Write-Host 'No launcher process ID was found.'; exit 0 }
$tenderServerPid = [int](Get-Content -LiteralPath $pidFile)
$tenderProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$tenderServerPid" -ErrorAction SilentlyContinue
if ($null -eq $tenderProcess) { Write-Host 'Tender Tracker is already stopped.'; exit 0 }
if ($tenderProcess.Name -ne 'node.exe' -or $tenderProcess.CommandLine -notmatch 'server\.mjs') { throw 'The saved process does not match Tender Tracker; refusing to stop it.' }
$databaseDirectory = Join-Path $env:LOCALAPPDATA 'TenderTracker/postgres'
$pgControl = Join-Path $PSScriptRoot 'node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe'
if (Test-Path -LiteralPath $pgControl) {
    & $pgControl stop -D $databaseDirectory -m fast
}
Stop-Process -Id $tenderServerPid -ErrorAction SilentlyContinue
Write-Host 'Tender Tracker stopped. Database and document files are preserved.'
