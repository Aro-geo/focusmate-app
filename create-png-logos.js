// Create actual PNG logo files using Canvas API
const canvas192 = document.createElement('canvas');
const canvas512 = document.createElement('canvas');

// Configure 192x192 canvas
canvas192.width = 192;
canvas192.height = 192;
const ctx192 = canvas192.getContext('2d');

// Configure 512x512 canvas  
canvas512.width = 512;
canvas512.height = 512;
const ctx512 = canvas512.getContext('2d');

// Draw 192x192 logo
ctx192.fillStyle = '#6366f1';
ctx192.fillRect(0, 0, 192, 192);
ctx192.fillStyle = 'white';
ctx192.font = 'bold 48px Arial';
ctx192.textAlign = 'center';
ctx192.textBaseline = 'middle';
ctx192.fillText('FM', 96, 96);

// Draw 512x512 logo
ctx512.fillStyle = '#6366f1';
ctx512.fillRect(0, 0, 512, 512);
ctx512.fillStyle = 'white';
ctx512.font = 'bold 128px Arial';
ctx512.textAlign = 'center';
ctx512.textBaseline = 'middle';
ctx512.fillText('FM', 256, 256);

// Convert to blobs and download
canvas192.toBlob(blob => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'logo192.png';
  a.click();
}, 'image/png');

canvas512.toBlob(blob => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'logo512.png';
  a.click();
}, 'image/png');

console.log('PNG logo files created and downloaded');
