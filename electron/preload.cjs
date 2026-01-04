// Preload script para Electron
// Este archivo se ejecuta en el contexto de la página antes de que se cargue el contenido

const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});

// API para notificaciones nativas
contextBridge.exposeInMainWorld('electron', {
  // API para mostrar notificaciones nativas del sistema
  showNotification: (title, body, eventId = null) => {
    ipcRenderer.send('show-native-notification', title, body, eventId);
  },
  
  // API para escuchar clics en notificaciones
  onNotificationClick: (callback) => {
    ipcRenderer.on('notification-clicked', (event, eventId) => {
      callback(eventId);
    });
  },
  
  // Verificar si las notificaciones están soportadas
  isNotificationSupported: () => {
    return true; // Electron siempre soporta notificaciones
  }
});

