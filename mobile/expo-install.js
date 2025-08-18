#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🚀 Installing Expo CLI and EAS CLI...');

try {
  // Install Expo CLI globally
  execSync('npm install -g @expo/cli', { stdio: 'inherit' });
  
  // Install EAS CLI for building
  execSync('npm install -g eas-cli', { stdio: 'inherit' });
  
  console.log('✅ Installation complete!');
  console.log('\n📱 Next steps:');
  console.log('1. cd mobile');
  console.log('2. npm install');
  console.log('3. npx expo start');
  console.log('4. Scan QR code with Expo Go app');
  
} catch (error) {
  console.error('❌ Installation failed:', error.message);
}