/* eslint-disable */
const QRCode = require('qrcode');
const path = require('path');

async function generate() {
  const localUrl = 'http://192.168.69.151:3000/install';
  const prodUrl = 'https://qsalons.vercel.app/install';

  const opts = {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.98,
    margin: 2,
    color: {
      dark: '#0C0C0E',
      light: '#FFFFFF',
    },
    width: 650,
  };

  const localPath = path.join(__dirname, '..', 'public', 'qr-app-local.png');
  const prodPath = path.join(__dirname, '..', 'public', 'qr-app-prod.png');

  await QRCode.toFile(localPath, localUrl, opts);
  await QRCode.toFile(prodPath, prodUrl, opts);

  console.log('Local Install QR created at:', localPath);
  console.log('Production Install QR created at:', prodPath);

  // Generate terminal QR for local Wi-Fi install
  const stringLocalQR = await QRCode.toString(localUrl, { type: 'terminal', small: true });
  console.log('\n--- SCAN WITH PHONE CAMERA TO DIRECTLY INSTALL (Local Wi-Fi) ---');
  console.log(stringLocalQR);

  // Generate terminal QR for Production
  const stringProdQR = await QRCode.toString(prodUrl, { type: 'terminal', small: true });
  console.log('\n--- SCAN WITH PHONE CAMERA TO DIRECTLY INSTALL (Online / Vercel) ---');
  console.log(stringProdQR);
}

generate().catch(console.error);
