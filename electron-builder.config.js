// Configuración personalizada de electron-builder para evitar problemas con winCodeSign
module.exports = {
  ...require('./package.json').build,
  win: {
    ...require('./package.json').build.win,
    icon: 'build/icon.ico', // Asegurar que el icono esté especificado
    sign: null,
    signingHashAlgorithms: [],
    verifyUpdateCodeSignature: false,
    certificateFile: null,
    certificatePassword: null,
  },
  // Deshabilitar completamente la firma de código
  beforeBuild: async (context) => {
    // No hacer nada, solo evitar la descarga de winCodeSign
  },
  // Excluir locales innecesarios (solo mantener español)
  afterPack: async (context) => {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    
    // Ruta a los locales de Chromium
    const localesPath = path.join(context.appOutDir, 'locales');
    
    if (fs.existsSync(localesPath)) {
      const files = fs.readdirSync(localesPath);
      const keepLocales = ['es.pak', 'es-419.pak', 'en-US.pak']; // Mantener español y inglés base
      
      files.forEach(file => {
        if (!keepLocales.includes(file)) {
          try {
            fs.unlinkSync(path.join(localesPath, file));
            console.log(`Eliminado locale innecesario: ${file}`);
          } catch (err) {
            console.warn(`No se pudo eliminar ${file}:`, err.message);
          }
        }
      });
    }
  },
};











