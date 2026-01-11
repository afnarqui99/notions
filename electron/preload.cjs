// Preload script para Electron
// Este archivo se ejecuta en el contexto de la página antes de que se cargue el contenido

const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
const electronAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  // Ejecutar código (Node.js o Python)
  executeCode: (code, language) => {
    return ipcRenderer.invoke('execute-code', code, language);
  },
  // Iniciar servicio de ejecución
  startCodeService: (language) => {
    return ipcRenderer.invoke('start-code-service', language);
  },
  // Detener servicio de ejecución
  stopCodeService: (language) => {
    return ipcRenderer.invoke('stop-code-service', language);
  },
  // Obtener estado del servicio
  getCodeServiceStatus: (language) => {
    return ipcRenderer.invoke('get-code-service-status', language);
  },
  // Ejecutar proyecto completo desde una ruta
  executeProject: (projectPath, language) => {
    return ipcRenderer.invoke('execute-project', projectPath, language);
  },
  // Detectar tipo de proyecto
  detectProjectType: (projectPath) => {
    return ipcRenderer.invoke('detect-project-type', projectPath);
  },
        // Seleccionar directorio
        selectDirectory: () => {
          return ipcRenderer.invoke('select-directory');
        },
        // Ejecutar SQL
        executeSQL: (sql) => {
          return ipcRenderer.invoke('execute-sql', sql);
        },
        // Obtener ruta de cursos incluidos
        getCursosPath: () => {
          return ipcRenderer.invoke('get-cursos-path');
        },
        // Verificar si una ruta existe
        pathExists: (path) => {
          return ipcRenderer.invoke('path-exists', path);
        },
        // Listar cursos en una ruta
        listCursos: (path) => {
          return ipcRenderer.invoke('list-cursos', path);
        },
        // Seleccionar carpeta de cursos externos
        selectCursosDirectory: () => {
          return ipcRenderer.invoke('select-cursos-directory');
        },
        // Listar contenido de un directorio
        listDirectory: (dirPath) => {
          return ipcRenderer.invoke('list-directory', dirPath);
        },
        // Leer contenido de un archivo
        readFile: (filePath) => {
          return ipcRenderer.invoke('read-file', filePath);
        }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

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


