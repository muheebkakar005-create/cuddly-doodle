/* eslint-disable */
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generate() {
  const localUrl = 'http://192.168.69.151:3000';
  const prodUrl = 'https://qsalons.vercel.app';

  const opts = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    color: {
      dark: '#0C0C0E',
      light: '#FFFFFF',
    },
    width: 600,
  };

  const localPath = path.join(__dirname, '..', 'public', 'qr-app-local.png');
  const prodPath = path.join(__dirname, '..', 'public', 'qr-app-prod.png');

  await QRCode.toFile(localPath, localUrl, opts);
  await QRCode.toFile(prodPath, prodUrl, opts);

  console.log('Local QR created at:', localPath);
  console.log('Prod QR created at:', prodPath);

  // Generate terminal QR
  const stringQR = await QRCode.toString(localUrl, { type: 'terminal', small: true });
  console.log('\n--- SCAN WITH PHONE CAMERA (Same Wi-Fi) ---');
  console.log(stringQR);
}

generate().catch(console.error);
