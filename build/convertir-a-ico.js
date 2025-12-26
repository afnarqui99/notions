// Script para convertir SVG a ICO usando Node.js
// Requiere: npm install sharp --save-dev

const sharp = require('sharp');
const fs = require('fs');

async function convertSvgToIco() {
  try {
    console.log('Convirtiendo icon.svg a icon.ico...');
    
    // Leer el SVG
    const svgBuffer = fs.readFileSync('./build/icon.svg');
    
    // Convertir a PNG primero (256x256)
    const pngBuffer = await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toBuffer();
    
    // Guardar como PNG temporal
    fs.writeFileSync('./build/icon-temp.png', pngBuffer);
    
    console.log('✅ PNG creado. Ahora necesitas convertir PNG a ICO.');
    console.log('📝 Usa una herramienta online como: https://convertio.co/es/png-ico/');
    console.log('📝 O instala ImageMagick y ejecuta: magick convert build/icon-temp.png build/icon.ico');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Instala sharp: npm install sharp --save-dev');
  }
}

convertSvgToIco();

