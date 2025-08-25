// Este es un script de ejemplo para generar íconos de PWA
// Para usarlo, necesitarías una imagen base y una herramienta como Sharp o Jimp
// npm install sharp --save-dev

/*
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SIZES = [192, 512];
const SOURCE_IMAGE = 'src/assets/logo.png'; // Ajustar a la ubicación de tu logo

async function generateIcons() {
  // Crear directorio si no existe
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  for (const size of SIZES) {
    await sharp(SOURCE_IMAGE)
      .resize(size, size)
      .toFile(`public/icon-${size}.png`);
    console.log(`✅ Generado: icon-${size}.png`);
  }
}

generateIcons().catch(err => console.error('Error generando íconos:', err));
*/

console.log('Para generar íconos, descomenta el código de este script y');
console.log('asegúrate de tener una imagen base en src/assets/logo.png');
console.log('Luego ejecuta: node scripts/generate-icons.js'); 