# Script PowerShell pour démarrer le serveur et uploader les PDF
Write-Host "🚀 Starting Xaali API Server..." -ForegroundColor Green

# Démarrer le serveur en arrière-plan
Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -WorkingDirectory $PWD -WindowStyle Hidden

# Attendre que le serveur démarre
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Vérifier si le serveur est accessible
Write-Host "🔍 Checking if server is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is running successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Server responded with status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Server is not accessible. Please check if it started correctly." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Lancer le script d'upload
Write-Host "📤 Starting PDF upload to Pinecone..." -ForegroundColor Green
node upload-pdfs-simple.js

Write-Host "🎉 Upload process completed!" -ForegroundColor Green
