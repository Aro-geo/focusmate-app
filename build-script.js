// Simple build script
const { execSync } = require('child_process');

console.log('Starting build process...');

try {
  console.log('Running React build...');
  execSync('react-scripts build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed with error:', error.message);
  process.exit(1);
}
