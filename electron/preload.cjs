// Preload script para Electron
// Este archivo se ejecuta en el contexto de la página antes de que se cargue el contenido

const { contextBridge } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

