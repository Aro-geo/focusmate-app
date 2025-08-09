@echo off
echo Building React app...
npm run build

echo Copying to mobile platforms...
npx cap copy

echo Syncing Capacitor...
npx cap sync

echo Mobile app updated! Choose your platform:
echo [1] Open Android Studio
echo [2] Open Xcode
echo [3] Exit

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Opening Android Studio...
    npx cap open android
) else if "%choice%"=="2" (
    echo Opening Xcode...
    npx cap open ios
) else (
    echo Done!
)

pause
