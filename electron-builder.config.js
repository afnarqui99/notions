// Configuración personalizada de electron-builder para evitar problemas con winCodeSign
module.exports = {
  ...require('./package.json').build,
  win: {
    ...require('./package.json').build.win,
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
};






