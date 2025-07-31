# PowerShell script to start both servers
Write-Host "Starting FocusMate AI Development Servers..." -ForegroundColor Green

# Start API server in background
Write-Host "Starting API server on port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; node simple-api.js" -WindowStyle Minimized

# Wait a moment for API server to start
Start-Sleep -Seconds 2

# Start React app
Write-Host "Starting React app on port 3000..." -ForegroundColor Yellow
npm start
