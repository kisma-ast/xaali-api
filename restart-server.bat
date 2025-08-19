@echo off
echo Arrêt du serveur...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Redémarrage du serveur...
start "Xaali Server" cmd /k "npm run start:dev"

echo Serveur redémarré!
pause