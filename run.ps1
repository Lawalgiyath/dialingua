# Dialingua - one-command launch (Windows / PowerShell)
# Builds the frontend, then starts the FastAPI backend which serves both the
# API and the built app on a single port (http://127.0.0.1:8000).

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "==> Building frontend..." -ForegroundColor Cyan
Push-Location "$root\frontend"
if (-not (Test-Path "node_modules")) { npm install }
npm run build
Pop-Location

Write-Host "==> Starting Dialingua API + app on http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "    (first translation to a Tier-1 language loads the ~2.5GB NLLB model)" -ForegroundColor DarkGray
Push-Location "$root\backend"
if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
}
python main.py
Pop-Location
