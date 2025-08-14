@echo off
echo Building and deploying FocusMate AI to Firebase...
echo.

echo Step 1: Building optimized production build...
npm run build

if %errorlevel% neq 0 (
  echo Build failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Step 2: Deploying to Firebase...
firebase deploy --only hosting

if %errorlevel% neq 0 (
  echo Deployment failed with error code %errorlevel%
  exit /b %errorlevel%
)

echo.
echo Deployment completed successfully!
echo Application is now live at https://focusmate-ai-8cad6.web.app
echo.

pause
