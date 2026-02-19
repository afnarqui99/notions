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
        // ========== BASE DE DATOS ==========
        // Conectar a una base de datos
        dbConnect: (config) => {
          return ipcRenderer.invoke('db-connect', config);
        },
        // Desconectar de una base de datos
        dbDisconnect: (connectionId) => {
          return ipcRenderer.invoke('db-disconnect', connectionId);
        },
        // Ejecutar consulta SQL
        dbExecuteQuery: (connectionId, query) => {
          return ipcRenderer.invoke('db-execute-query', connectionId, query);
        },
        // Obtener tablas
        dbGetTables: (connectionId) => {
          return ipcRenderer.invoke('db-get-tables', connectionId);
        },
        // Obtener columnas de una tabla
        dbGetTableColumns: (connectionId, schema, tableName) => {
          return ipcRenderer.invoke('db-get-table-columns', connectionId, schema, tableName);
        },
        // Obtener procedimientos almacenados
        dbGetStoredProcedures: (connectionId) => {
          return ipcRenderer.invoke('db-get-stored-procedures', connectionId);
        },
        // Obtener conexiones guardadas
        dbGetSavedConnections: () => {
          return ipcRenderer.invoke('db-get-saved-connections');
        },
        // Guardar conexión
        dbSaveConnection: (connectionData) => {
          return ipcRenderer.invoke('db-save-connection', connectionData);
        },
        // Eliminar conexión guardada
        dbDeleteConnection: (connectionId) => {
          return ipcRenderer.invoke('db-delete-connection', connectionId);
        },
        // Verificar si una ruta existe
        pathExists: (path) => {
          return ipcRenderer.invoke('path-exists', path);
        },
        // Verificar si una ruta es un directorio
        isDirectory: (path) => {
          return ipcRenderer.invoke('is-directory', path);
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
        },
        // Escribir contenido en un archivo
        writeFile: (filePath, content) => {
          return ipcRenderer.invoke('write-file', filePath, content);
        },
        deleteFile: (filePath) => {
          return ipcRenderer.invoke('delete-file', filePath);
        },
        createDirectory: (dirPath) => {
          return ipcRenderer.invoke('create-directory', dirPath);
        },
        createFile: (filePath, initialContent = '') => {
          return ipcRenderer.invoke('create-file', filePath, initialContent);
        },
        copyFile: (sourcePath, targetPath) => {
          return ipcRenderer.invoke('copy-file', sourcePath, targetPath);
        },
        renameFile: (oldPath, newPath) => {
          return ipcRenderer.invoke('rename-file', oldPath, newPath);
        },
        pathJoin: (...paths) => {
          return ipcRenderer.invoke('path-join', ...paths).then(result => result.path);
        },
        // Ejecutar comando del sistema
        executeCommand: (command, shell, cwd, terminalId) => {
          return ipcRenderer.invoke('execute-command', command, shell, cwd, terminalId);
        },
        // Detener proceso de terminal
        stopTerminalProcess: (terminalId) => {
          return ipcRenderer.invoke('stop-terminal-process', terminalId);
        },
        // Verificar si un proceso está muerto
        isProcessDead: (terminalId) => {
          return ipcRenderer.invoke('is-process-dead', terminalId);
        },
        // Obtener procesos usando un puerto específico
        getProcessesByPort: (port) => {
          return ipcRenderer.invoke('get-processes-by-port', port);
        },
        // Matar un proceso por PID
        killProcessByPid: (pid) => {
          return ipcRenderer.invoke('kill-process-by-pid', pid);
        },
        // Matar todos los procesos usando un puerto específico
        killProcessesByPort: (port) => {
          return ipcRenderer.invoke('kill-processes-by-port', port);
        },
        // Reiniciar proceso de terminal
        restartTerminalProcess: (terminalId) => {
          return ipcRenderer.invoke('restart-terminal-process', terminalId);
        },
        // Verificar si hay un proceso corriendo
        hasRunningProcess: (terminalId) => {
          return ipcRenderer.invoke('has-running-process', terminalId);
        },
        // Obtener información del proceso
        getProcessInfo: (terminalId) => {
          return ipcRenderer.invoke('get-process-info', terminalId);
        },
        // Obtener estadísticas de procesos
        getProcessStats: () => {
          return ipcRenderer.invoke('get-process-stats');
        },
        // Escuchar output de terminal en tiempo real
        onTerminalOutput: (callback) => {
          ipcRenderer.on('terminal-output', (event, data) => callback(data));
        },
        // Escuchar cierre de proceso
        onTerminalProcessClosed: (callback) => {
          ipcRenderer.on('terminal-process-closed', (event, data) => callback(data));
        },
        // Remover listeners
        removeTerminalListeners: () => {
          ipcRenderer.removeAllListeners('terminal-output');
          ipcRenderer.removeAllListeners('terminal-process-closed');
        },
        // Obtener directorio actual del proceso
        getCurrentDirectory: () => {
          return ipcRenderer.invoke('get-current-directory');
        },
        // Normalizar una ruta
        normalizePath: (inputPath) => {
          return ipcRenderer.invoke('normalize-path', inputPath);
        },
        // Verificar si Docker está instalado
        checkDockerInstalled: () => {
          return ipcRenderer.invoke('check-docker-installed');
        },
        // ==================== DEBUGGING APIs ====================
        // Iniciar debugging
        startDebugging: (projectPath, projectType) => {
          return ipcRenderer.invoke('start-debugging', projectPath, projectType);
        },
        // Detener debugging
        stopDebugging: (projectId) => {
          return ipcRenderer.invoke('stop-debugging', projectId);
        },
        // Establecer breakpoint
        setBreakpoint: (projectId, file, line, condition) => {
          return ipcRenderer.invoke('set-breakpoint', projectId, file, line, condition);
        },
        // Remover breakpoint
        removeBreakpoint: (projectId, file, line) => {
          return ipcRenderer.invoke('remove-breakpoint', projectId, file, line);
        },
        // Continuar ejecución
        debugContinue: (projectId) => {
          return ipcRenderer.invoke('debug-continue', projectId);
        },
        // Pausar ejecución
        debugPause: (projectId) => {
          return ipcRenderer.invoke('debug-pause', projectId);
        },
        // Step over
        debugStepOver: (projectId) => {
          return ipcRenderer.invoke('debug-step-over', projectId);
        },
        // Step into
        debugStepInto: (projectId) => {
          return ipcRenderer.invoke('debug-step-into', projectId);
        },
        // Step out
        debugStepOut: (projectId) => {
          return ipcRenderer.invoke('debug-step-out', projectId);
        },
        // Obtener variables
        getDebugVariables: (projectId, frameId) => {
          return ipcRenderer.invoke('get-debug-variables', projectId, frameId);
        },
        // Obtener call stack
        getDebugCallStack: (projectId) => {
          return ipcRenderer.invoke('get-debug-call-stack', projectId);
        },
        // Evaluar expresión
        evaluateDebugExpression: (projectId, expression) => {
          return ipcRenderer.invoke('evaluate-debug-expression', projectId, expression);
        },
        // Escuchar eventos de debugging
        onDebugEvent: (callback) => {
          ipcRenderer.on('debug-event', (event, data) => callback(data));
        },
        // Remover listeners de debugging
        removeDebugListeners: () => {
          ipcRenderer.removeAllListeners('debug-event');
        },
        // Crear nueva ventana
        createNewWindow: () => {
          return ipcRenderer.invoke('create-new-window');
        },
        // Obtener fuentes de captura de pantalla
        getScreenSources: () => {
          return ipcRenderer.invoke('get-screen-sources');
        },
        // Obtener posición global del cursor
        getGlobalCursorPosition: () => {
          return ipcRenderer.invoke('get-global-cursor-position');
        },
        // ========== GRABACIÓN DE PANTALLA ==========
        // Guardar grabación de pantalla
        saveScreenRecording: (buffer, duration) => {
          return ipcRenderer.invoke('save-screen-recording', buffer, duration);
        },
        // Obtener historial de grabaciones
        getScreenRecordingHistory: () => {
          return ipcRenderer.invoke('get-screen-recording-history');
        },
        // Eliminar grabación
        deleteScreenRecording: (recordingId) => {
          return ipcRenderer.invoke('delete-screen-recording', recordingId);
        },
        // Abrir carpeta de grabaciones
        openScreenRecordingsFolder: () => {
          return ipcRenderer.invoke('open-screen-recordings-folder');
        },
        // Transcribir grabación
        transcribeScreenRecording: (recordingId) => {
          return ipcRenderer.invoke('transcribe-screen-recording', recordingId);
        },
        // Consultar IA sobre grabaciones
        queryScreenRecordings: (question, recordingIds) => {
          return ipcRenderer.invoke('query-screen-recordings', question, recordingIds);
        },
        // Guardar configuración de IA
        saveAIConfig: (config) => {
          return ipcRenderer.invoke('save-ai-config', config);
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


