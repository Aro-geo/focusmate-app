@echo off
echo Building app and deploying Hosting + Functions...
echo.

echo Step 1: Build web app...
npm run build
if %errorlevel% neq 0 (
  echo Web build failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Step 2: Build functions...
npm --prefix functions run build
if %errorlevel% neq 0 (
  echo Functions build failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Step 3: Deploy Hosting + Functions...
firebase deploy --only hosting,functions
if %errorlevel% neq 0 (
  echo Deployment failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Deployment completed successfully!
pause
