@echo off
echo Building and deploying Firebase Functions only...
echo.

echo Step 1: Building functions TypeScript...
npm --prefix functions run build

if %errorlevel% neq 0 (
  echo Functions build failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Step 2: Deploying Firebase Functions...
firebase deploy --only functions

if %errorlevel% neq 0 (
  echo Functions deployment failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Functions deployment completed successfully!
pause
