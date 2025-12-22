# Script PowerShell pour démarrer le serveur
Write-Host "Démarrage du serveur Brainwave Audio API..." -ForegroundColor Green
Set-Location $PSScriptRoot
python -m uvicorn main:app --reload

