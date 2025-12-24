@echo off
echo Démarrage du serveur Brainwave Audio API...
cd /d %~dp0
python -m uvicorn main:app --reload
pause



