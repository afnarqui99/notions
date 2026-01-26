const { app, BrowserWindow, shell, Tray, Menu, nativeImage, Notification, ipcMain, dialog, session } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const AutoLaunch = require('auto-launch');
const net = require('net');
const http = require('http');
const https = require('https');
const url = require('url');
const WebSocket = require('ws');
const DatabaseService = require('./DatabaseService.cjs');

// Configurar auto-inicio en Windows
let autoLauncher;
try {
  autoLauncher = new AutoLaunch({
    name: 'Notas afnarqui',
    path: app.getPath('exe'),
  });

  // Habilitar auto-inicio
  autoLauncher.enable().catch(err => {
    console.error('Error al habilitar auto-inicio:', err);
  });
} catch (error) {
  console.error('Error al inicializar auto-launch:', error);
}

let mainWindow;
let windows = []; // Array para mantener todas las ventanas abiertas
let tray = null;
let isQuitting = false;

// Gestor de procesos en segundo plano para terminales
const ProcessManager = {
  processes: new Map(), // terminalId -> { process, command, cwd, output, maxOutputSize, lastCommand }
  maxOutputSize: 10000000, // 10MB máximo de output por proceso (aumentado para procesos largos)
  
  // Agregar proceso
  addProcess(terminalId, process, command, cwd) {
    this.processes.set(terminalId, {
      process,
      command,
      cwd,
      output: '',
      errorOutput: '',
      startTime: Date.now(),
      maxOutputSize: this.maxOutputSize,
      lastCommand: command // Guardar el comando para poder reiniciarlo
    });
    
    // Limpiar cuando el proceso termine
    process.on('close', () => {
      this.removeProcess(terminalId);
    });
    
    // Limpiar cuando haya error
    process.on('error', () => {
      this.removeProcess(terminalId);
    });
  },
  
  // Remover proceso
  removeProcess(terminalId) {
    const proc = this.processes.get(terminalId);
    if (proc && proc.process) {
      try {
        if (!proc.process.killed) {
          proc.process.kill('SIGTERM');
        }
      } catch (e) {
        // Ignorar errores al matar proceso
      }
    }
    this.processes.delete(terminalId);
  },
  
  // Detener proceso y todos sus hijos de forma agresiva
  stopProcess(terminalId) {
    const proc = this.processes.get(terminalId);
    if (proc && proc.process) {
      try {
        const pid = proc.process.pid;
        const command = proc.command || '';
        
        if (process.platform === 'win32') {
          // En Windows, usar taskkill para matar el proceso y todos sus hijos
          // Primero intentar matar por PID
          exec(`taskkill /PID ${pid} /T /F`, (error) => {
            if (error) {
              console.warn('No se pudo matar por PID, intentando por nombre...', error.message);
              
              // Si falla, intentar matar por nombre del proceso
              // Para npm run dev, matar node.exe y vite
              if (command.includes('npm') || command.includes('vite') || command.includes('node')) {
                exec('taskkill /F /IM node.exe /T', (error2) => {
                  if (error2 && !error2.message.includes('no se encontró')) {
                    console.error('Error matando node.exe:', error2);
                  }
                });
              }
              
              // Fallback: intentar matar directamente
              try {
                if (!proc.process.killed) {
                  proc.process.kill('SIGTERM');
                  setTimeout(() => {
                    if (proc.process && !proc.process.killed) {
                      try {
                        proc.process.kill('SIGKILL');
                      } catch (e) {
                        console.error('Error en SIGKILL:', e);
                      }
                    }
                  }, 500);
                }
              } catch (e) {
                console.error('Error en fallback:', e);
              }
            } else {
              console.log(`Proceso ${pid} y sus hijos fueron terminados exitosamente`);
            }
          });
        } else {
          // En Unix/Linux/Mac, matar el grupo de procesos
          try {
            // Intentar matar el grupo de procesos (PGID) con SIGTERM primero
            try {
              process.kill(-pid, 'SIGTERM');
            } catch (e) {
              // Si falla el grupo, intentar matar directamente
              proc.process.kill('SIGTERM');
            }
            
            // Si después de 500ms sigue vivo, forzar con SIGKILL
            setTimeout(() => {
              try {
                if (proc.process && !proc.process.killed) {
                  try {
                    process.kill(-pid, 'SIGKILL');
                  } catch (e) {
                    // Si falla el grupo, intentar matar directamente
                    try {
                      proc.process.kill('SIGKILL');
                    } catch (e2) {
                      console.error('Error matando proceso con SIGKILL:', e2);
                    }
                  }
                }
              } catch (e) {
                console.error('Error verificando proceso:', e);
              }
            }, 500);
          } catch (e) {
            // Si falla el grupo, intentar matar directamente
            try {
              proc.process.kill('SIGTERM');
              setTimeout(() => {
                if (proc.process && !proc.process.killed) {
                  proc.process.kill('SIGKILL');
                }
              }, 500);
            } catch (e2) {
              console.error('Error matando proceso:', e2);
            }
          }
        }
        
        // Verificar que el proceso se haya matado después de un delay
        setTimeout(() => {
          if (proc.process && !proc.process.killed) {
            console.warn(`Proceso ${pid} aún está corriendo después de intentar matarlo`);
            // Intentar una vez más de forma más agresiva
            try {
              if (process.platform === 'win32') {
                exec(`taskkill /F /PID ${pid} /T`, () => {});
              } else {
                try {
                  process.kill(-pid, 'SIGKILL');
                } catch (e) {
                  proc.process.kill('SIGKILL');
                }
              }
            } catch (e) {
              console.error('Error en segundo intento de matar proceso:', e);
            }
          }
        }, 2000);
        
        // No remover inmediatamente, esperar a que el evento 'close' lo haga
        return true;
      } catch (e) {
        console.error('Error deteniendo proceso:', e);
        this.removeProcess(terminalId);
        return false;
      }
    }
    return false;
  },
  
  // Verificar si un proceso realmente está muerto
  async isProcessDead(terminalId) {
    const proc = this.processes.get(terminalId);
    if (!proc || !proc.process) {
      return true; // Si no existe, está "muerto"
    }
    
    try {
      // Verificar si el proceso está muerto
      if (proc.process.killed) {
        return true;
      }
      
      // En Windows, verificar con tasklist
      if (process.platform === 'win32') {
        return new Promise((resolve) => {
          exec(`tasklist /FI "PID eq ${proc.process.pid}"`, (error, stdout) => {
            if (error) {
              resolve(true); // Si hay error, asumir que está muerto
            } else {
              // Si el PID aparece en tasklist, está vivo
              resolve(!stdout.includes(proc.process.pid.toString()));
            }
          });
        });
      } else {
        // En Unix/Linux/Mac, usar kill -0 para verificar
        return new Promise((resolve) => {
          try {
            process.kill(proc.process.pid, 0); // Signal 0 solo verifica, no mata
            resolve(false); // Si no hay error, el proceso está vivo
          } catch (e) {
            resolve(true); // Si hay error (proceso no existe), está muerto
          }
        });
      }
    } catch (e) {
      console.error('Error verificando proceso:', e);
      return true; // En caso de error, asumir que está muerto
    }
  },
  
  // Reiniciar proceso (detener y volver a ejecutar el mismo comando)
  async restartProcess(terminalId) {
    const proc = this.processes.get(terminalId);
    if (!proc) return false;
    
    const { command, cwd, lastCommand } = proc;
    const commandToRestart = lastCommand || command;
    
    // Detener el proceso actual
    this.stopProcess(terminalId);
    
    // Esperar un momento para que el proceso termine
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // El proceso será reiniciado desde el frontend llamando a executeCommand nuevamente
    return { command: commandToRestart, cwd };
  },
  
  // Verificar si hay un proceso corriendo para un terminal
  hasRunningProcess(terminalId) {
    const proc = this.processes.get(terminalId);
    return proc && proc.process && !proc.process.killed;
  },
  
  // Obtener información del proceso
  getProcessInfo(terminalId) {
    const proc = this.processes.get(terminalId);
    if (!proc) return null;
    
    return {
      command: proc.command,
      cwd: proc.cwd,
      running: !proc.process.killed,
      uptime: Date.now() - proc.startTime,
      outputSize: (proc.output + proc.errorOutput).length
    };
  },
  
  // Agregar output a un proceso (con límite de tamaño)
  addOutput(terminalId, data, isError = false) {
    const proc = this.processes.get(terminalId);
    if (!proc) return;
    
    const outputStr = data.toString();
    const currentSize = (proc.output + proc.errorOutput).length;
    
    // Si excede el límite, truncar manteniendo los últimos datos
    if (currentSize + outputStr.length > proc.maxOutputSize) {
      const keepSize = Math.floor(proc.maxOutputSize * 0.7); // Mantener 70% de los datos más recientes
      const totalOutput = proc.output + proc.errorOutput;
      const truncated = totalOutput.slice(-keepSize);
      proc.output = truncated;
      proc.errorOutput = '';
    }
    
    if (isError) {
      proc.errorOutput += outputStr;
    } else {
      proc.output += outputStr;
    }
    
    // Enviar output en tiempo real al renderer (sin limpiar ANSI aquí, se hace en el frontend)
    // Esto permite que el frontend decida si quiere mostrar colores o limpiarlos
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('terminal-output', {
        terminalId,
        data: outputStr,
        isError
      });
    }
  },
  
  // Obtener output acumulado
  getOutput(terminalId) {
    const proc = this.processes.get(terminalId);
    if (!proc) return { output: '', errorOutput: '' };
    return {
      output: proc.output,
      errorOutput: proc.errorOutput
    };
  },
  
  // Limpiar procesos inactivos (más de 1 hora)
  cleanupInactive() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hora
    
    for (const [terminalId, proc] of this.processes.entries()) {
      if (now - proc.startTime > maxAge && proc.process.killed) {
        this.removeProcess(terminalId);
      }
    }
  },
  
  // Obtener estadísticas de procesos
  getStats() {
    return {
      active: this.processes.size,
      processes: Array.from(this.processes.entries()).map(([id, proc]) => ({
        terminalId: id,
        command: proc.command,
        running: !proc.process.killed,
        outputSize: (proc.output + proc.errorOutput).length,
        uptime: Date.now() - proc.startTime
      }))
    };
  }
};

// Limpiar procesos inactivos cada 10 minutos
setInterval(() => {
  ProcessManager.cleanupInactive();
}, 10 * 60 * 1000);

// Servicio compartido de ejecución de código
const CodeExecutionService = {
  // Estado del servicio por lenguaje
  services: {
    nodejs: { active: false, queue: [], processing: false, lastUsed: null },
    python: { active: false, queue: [], processing: false, lastUsed: null }
  },
  
  // Timeout para cerrar automáticamente (5 minutos de inactividad)
  AUTO_CLOSE_TIMEOUT: 5 * 60 * 1000,
  autoCloseTimers: {},
  
  // Iniciar servicio para un lenguaje
  startService(language) {
    const service = this.services[language];
    if (!service) return;
    
    service.active = true;
    service.lastUsed = Date.now();
    
    // Limpiar timer de auto-cierre si existe
    if (this.autoCloseTimers[language]) {
      clearTimeout(this.autoCloseTimers[language]);
      delete this.autoCloseTimers[language];
    }
    
    console.log(`✅ Servicio ${language} iniciado`);
  },
  
  // Detener servicio para un lenguaje
  stopService(language) {
    const service = this.services[language];
    if (!service) return;
    
    service.active = false;
    service.queue = [];
    service.processing = false;
    
    // Limpiar timer de auto-cierre si existe
    if (this.autoCloseTimers[language]) {
      clearTimeout(this.autoCloseTimers[language]);
      delete this.autoCloseTimers[language];
    }
    
    console.log(`🛑 Servicio ${language} detenido`);
  },
  
  // Verificar si el servicio está activo
  isServiceActive(language) {
    return this.services[language]?.active || false;
  },
  
  // Agregar ejecución a la cola
  async executeCode(code, language) {
    const service = this.services[language];
    if (!service) {
      return Promise.resolve({ error: `Lenguaje no soportado: ${language}` });
    }
    
    // Si el servicio no está activo, iniciarlo automáticamente
    if (!service.active) {
      this.startService(language);
    }
    
    // Actualizar último uso
    service.lastUsed = Date.now();
    
    // Programar auto-cierre
    this.scheduleAutoClose(language);
    
    // Retornar promesa que se resolverá cuando se procese
    return new Promise((resolve) => {
      service.queue.push({ code, resolve });
      this.processQueue(language);
    });
  },
  
  // Procesar cola de ejecuciones
  async processQueue(language) {
    const service = this.services[language];
    if (!service || !service.active || service.processing || service.queue.length === 0) {
      return;
    }
    
    service.processing = true;
    const { code, resolve } = service.queue.shift();
    
    try {
      const result = await this.runCode(code, language);
      resolve(result);
    } catch (error) {
      resolve({ error: error.message });
    } finally {
      service.processing = false;
      service.lastUsed = Date.now();
      
      // Procesar siguiente en la cola
      if (service.queue.length > 0) {
        setImmediate(() => this.processQueue(language));
      } else {
        // Si no hay más en la cola, programar auto-cierre
        this.scheduleAutoClose(language);
      }
    }
  },
  
  // Ejecutar código (lógica original)
  async runCode(code, language) {
    return new Promise((resolve, reject) => {
      let command, args;
      
      if (language === 'python') {
        command = 'python';
        args = ['-c', code];
      } else {
        // Node.js por defecto
        const tempFile = path.join(os.tmpdir(), `node_exec_${Date.now()}_${Math.random().toString(36).substring(7)}.js`);
        fs.writeFileSync(tempFile, code, 'utf8');
        
        command = 'node';
        args = [tempFile];
        
        // Función para limpiar el archivo temporal
        const cleanupTempFile = () => {
          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
            }
          } catch (err) {
            // Ignorar errores de limpieza silenciosamente
          }
        };
        
        // Guardar la función de limpieza para usarla después
        const originalResolve = resolve;
        resolve = (result) => {
          cleanupTempFile();
          originalResolve(result);
        };
      }
      
      const childProcess = spawn(command, args, {
        shell: true,
        cwd: os.homedir(),
        env: { ...process.env }
      });
      
      let output = '';
      let errorOutput = '';
      
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      childProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ output: output || 'Ejecutado correctamente (sin salida)' });
        } else {
          resolve({ error: errorOutput || `Proceso terminado con código ${code}` });
        }
      });
      
      childProcess.on('error', (error) => {
        resolve({ 
          error: `Error al ejecutar: ${error.message}\n\nAsegúrate de que ${command} esté instalado y en tu PATH.` 
        });
      });
      
      // Timeout de 30 segundos
      let timeoutId = setTimeout(() => {
        childProcess.kill();
        resolve({ error: 'Tiempo de ejecución excedido (30 segundos)' });
      }, 30000);
      
      // Limpiar timeout si el proceso termina antes
      childProcess.on('close', () => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    });
  },
  
  // Programar auto-cierre del servicio
  scheduleAutoClose(language) {
    const service = this.services[language];
    if (!service) return;
    
    // Limpiar timer anterior si existe
    if (this.autoCloseTimers[language]) {
      clearTimeout(this.autoCloseTimers[language]);
    }
    
    // Programar nuevo timer
    this.autoCloseTimers[language] = setTimeout(() => {
      // Solo cerrar si no hay nada en la cola y no se está procesando
      if (service.queue.length === 0 && !service.processing) {
        this.stopService(language);
        console.log(`⏰ Servicio ${language} cerrado automáticamente por inactividad`);
      }
    }, this.AUTO_CLOSE_TIMEOUT);
  },
  
  // Obtener estado del servicio
  getServiceStatus(language) {
    const service = this.services[language];
    if (!service) return null;
    
    return {
      active: service.active,
      queueLength: service.queue.length,
      processing: service.processing,
      lastUsed: service.lastUsed
    };
  }
};

// Permitir múltiples instancias - crear nueva ventana en lugar de enfocar existente
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si ya hay una instancia corriendo, crear una nueva ventana en lugar de salir
  app.quit();
  // Nota: En Windows, si se ejecuta otra instancia, se creará una nueva ventana
  // El sistema operativo manejará la nueva instancia
} else {
  app.on('second-instance', () => {
    // Si se intenta abrir otra instancia, crear una nueva ventana
    createWindow();
  });
}

function getIconPath() {
  // En desarrollo: __dirname es electron/
  // En producción instalada: __dirname es resources/app.asar/electron o resources/app/electron
  if (app.isPackaged) {
    // En producción, electron-builder coloca el icono en resources/build/icon.ico
    // También puede estar en resources/app.asar/build/icon.ico
    const possiblePaths = [
      path.join(process.resourcesPath, 'build', 'icon.ico'),
      path.join(process.resourcesPath, 'app.asar', 'build', 'icon.ico'),
      path.join(process.resourcesPath, 'app', 'build', 'icon.ico'),
      path.join(__dirname, '..', 'build', 'icon.ico')
    ];
    
    // Retornar la primera ruta (electron-builder debería copiar el icono a resources/build/)
    return possiblePaths[0];
  } else {
    // En desarrollo
    return path.join(__dirname, '../build/icon.ico');
  }
}

function createTray() {
  const iconPath = getIconPath();
  let icon;
  
  try {
    icon = nativeImage.createFromPath(iconPath);
    // Si no se encuentra, intentar ruta alternativa
    if (icon.isEmpty()) {
      icon = nativeImage.createFromPath(path.join(__dirname, '../build/icon.ico'));
    }
  } catch (error) {
    console.error('Error cargando icono para tray:', error);
    // Intentar ruta alternativa
    icon = nativeImage.createFromPath(path.join(__dirname, '../build/icon.ico'));
  }
  
  // Redimensionar el icono para la bandeja (16x16 o 32x32)
  const trayIcon = icon.resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar',
      click: () => {
        // Mostrar todas las ventanas o crear una nueva si no hay ninguna
        if (windows.length > 0) {
          windows.forEach(win => {
            if (win && !win.isDestroyed()) {
              if (win.isMinimized()) win.restore();
              win.show();
              win.focus();
            }
          });
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Ocultar',
      click: () => {
        // Ocultar todas las ventanas
        windows.forEach(win => {
          if (win && !win.isDestroyed()) {
            win.hide();
          }
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Notas afnarqui');
  tray.setContextMenu(contextMenu);
  
  // Mostrar ventana al hacer doble clic en el icono
  tray.on('double-click', () => {
    // Mostrar todas las ventanas o crear una nueva si no hay ninguna
    if (windows.length > 0) {
      windows.forEach(win => {
        if (win && !win.isDestroyed()) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      });
    } else {
      createWindow();
    }
  });
}

function createWindow() {
  // Permitir crear múltiples ventanas - siempre crear una nueva
  const iconPath = getIconPath();
  
  const isDev = !app.isPackaged;
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // Necesario para archivos locales (file://) y Vite HMR
      allowRunningInsecureContent: isDev ? true : false, // Solo en desarrollo
      devTools: true, // Permitir DevTools siempre (F12)
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: iconPath, // Icono de la aplicación
    show: false, // No mostrar hasta que esté listo
    autoHideMenuBar: true, // Ocultar barra de menú por defecto
  });

  // Configurar Content Security Policy solo en desarrollo
  // En producción, webSecurity: false es suficiente para archivos locales
  if (isDev) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const csp = "default-src 'self' http://localhost:5174 ws://localhost:5174; " +
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5174; " +
                  "style-src 'self' 'unsafe-inline' http://localhost:5174; " +
                  "img-src 'self' data: blob: http://localhost:5174; " +
                  "connect-src 'self' http://localhost:5174 ws://localhost:5174 wss://localhost:5174; " +
                  "font-src 'self' data:; " +
                  "object-src 'none'; " +
                  "media-src 'self'; " +
                  "frame-src 'self';";
      
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp]
        }
      });
    });
  }

  // Cargar la aplicación
  if (isDev) {
    // En desarrollo, cargar desde Vite
    mainWindow.loadURL('http://localhost:5174');
  } else {
    // En producción, cargar desde los archivos estáticos
    // Cuando está empaquetada, __dirname apunta a resources/app.asar/electron o resources/app/electron
    // El dist está en resources/app.asar/dist o resources/app/dist
    let htmlPath;
    
    // Lista de rutas posibles en orden de prioridad
    // app.getAppPath() es más confiable cuando está empaquetado
    const appPath = app.getAppPath();
    const exeDir = path.dirname(app.getPath('exe'));
    
    const possiblePaths = [
      // Primero intentar desde process.resourcesPath (más común en producción)
      path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'dist', 'index.html'),
      // Luego desde app.getAppPath()
      path.join(appPath, 'dist', 'index.html'),
      // Luego desde __dirname
      path.join(__dirname, '..', 'dist', 'index.html'),
      path.join(__dirname, '..', '..', 'dist', 'index.html'),
      // Rutas alternativas desde el directorio del ejecutable
      path.join(exeDir, 'resources', 'app.asar', 'dist', 'index.html'),
      path.join(exeDir, 'resources', 'app', 'dist', 'index.html'),
      path.join(exeDir, 'dist', 'index.html'),
    ];
    
    console.log('=== DEBUG: Búsqueda de index.html ===');
    console.log('app.isPackaged:', app.isPackaged);
    console.log('__dirname:', __dirname);
    console.log('process.resourcesPath:', process.resourcesPath);
    console.log('app.getAppPath():', appPath);
    console.log('app.getPath("exe"):', app.getPath('exe'));
    
    // Buscar el archivo en las rutas posibles
    htmlPath = null;
    for (const testPath of possiblePaths) {
      console.log('Probando ruta:', testPath);
      if (fs.existsSync(testPath)) {
        htmlPath = testPath;
        console.log('✓ Archivo encontrado en:', htmlPath);
        break;
      } else {
        console.log('✗ No existe');
      }
    }
    
    if (!htmlPath) {
      console.error('❌ ERROR: No se encontró index.html en ninguna de las rutas probadas');
      mainWindow.show(); // Mostrar ventana para ver el error
      // Mostrar un mensaje de error en la ventana
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; text-align: center;"><h1>Error al cargar la aplicación</h1><p>No se pudo encontrar el archivo index.html</p><p>Por favor, reinstala la aplicación.</p><p>Revisa la consola de Electron para más detalles.</p></div>';
        `);
      }).catch(e => console.error('Error ejecutando JS:', e));
      // Intentar cargar una página vacía para mostrar el error
      mainWindow.loadURL('data:text/html,<html><body style="padding:20px;font-family:Arial;text-align:center;"><h1>Error al cargar la aplicación</h1><p>No se pudo encontrar index.html</p><p>Revisa la consola de Electron</p></body></html>').catch(e => {
        console.error('Error cargando página de error:', e);
      });
      return;
    }
    
    console.log('Cargando HTML desde:', htmlPath);
    
    // Verificar que el archivo existe antes de cargarlo
    if (!fs.existsSync(htmlPath)) {
      console.error('❌ El archivo no existe:', htmlPath);
      console.error('Rutas probadas:', possiblePaths);
      mainWindow.show();
      const errorMsg = `Error: Archivo no encontrado<br/>${htmlPath}<br/><br/>Rutas probadas:<br/>${possiblePaths.map(p => '• ' + p).join('<br/>')}`;
      mainWindow.loadURL('data:text/html,<html><body style="padding:20px;font-family:Arial;"><h1>Error: Archivo no encontrado</h1><div style="text-align:left;max-width:800px;word-break:break-all;">' + errorMsg + '</div></body></html>');
      return;
    }
    
    console.log('✓ Archivo encontrado. Tamaño:', fs.statSync(htmlPath).size, 'bytes');
    
    // Usar loadFile que maneja mejor las rutas relativas
    mainWindow.loadFile(htmlPath).catch(err => {
      console.error('Error cargando HTML con loadFile:', err);
      mainWindow.show(); // Asegurarse de mostrar la ventana
      // Intentar con loadURL como fallback
      const fileUrl = `file:///${htmlPath.replace(/\\/g, '/').replace(/^([A-Z]):/, '/$1:')}`;
      console.log('Intentando con loadURL:', fileUrl);
      mainWindow.loadURL(fileUrl).catch(err2 => {
        console.error('Error con loadURL:', err2);
        mainWindow.show();
        // Mostrar mensaje de error
        mainWindow.loadURL('data:text/html,<html><body style="padding:20px;font-family:Arial;text-align:center;"><h1>Error al cargar la aplicación</h1><p>Error: ' + err2.message + '</p><p>Ruta intentada: ' + fileUrl + '</p><p>Revisa la consola de Electron para más detalles.</p></body></html>').catch(e => {
          console.error('Error cargando página de error:', e);
        });
      });
    });
    
    // Escuchar errores de carga
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      console.error('❌ Error cargando:', {
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame
      });
      
      // Si es el frame principal y hay un error, mostrar información
      if (isMainFrame) {
        console.error('Error crítico al cargar la página principal');
        // Asegurar que la ventana esté visible para mostrar el error
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        }
        
        // En desarrollo, si es error de conexión, mostrar mensaje específico
        if (isDev && (errorCode === -105 || errorCode === -106 || errorCode === -3 || errorDescription.includes('localhost') || errorDescription.includes('ECONNREFUSED'))) {
          setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.loadURL('data:text/html,<html><head><meta charset="UTF-8"><title>Servidor no disponible</title></head><body style="padding:40px;font-family:Arial;text-align:center;background:#1e1e1e;color:#fff;margin:0;"><div style="max-width:600px;margin:0 auto;"><h1 style="color:#ff6b6b;">⚠️ Servidor Vite no disponible</h1><p style="font-size:16px;line-height:1.6;">El servidor de desarrollo no está corriendo.</p><p style="margin-top:30px;font-size:14px;">Por favor, ejecuta en otra terminal:</p><code style="background:#2d2d2d;padding:15px;display:block;margin:20px auto;max-width:400px;border-radius:4px;white-space:pre;font-size:14px;color:#4ecdc4;">npm run dev</code><p style="margin-top:20px;font-size:14px;">Luego recarga esta ventana con <strong>F5</strong></p><p style="margin-top:30px;font-size:12px;color:#888;">Error: ' + errorDescription + ' (Código: ' + errorCode + ')</p></div></body></html>');
            }
          }, 500);
        } else {
          // Otros errores: intentar mostrar información de error
          setTimeout(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
              mainWindow.focus();
              mainWindow.loadURL('data:text/html,<html><head><meta charset="UTF-8"><title>Error</title></head><body style="padding:20px;font-family:Arial;text-align:center;background:#1e1e1e;color:#fff;"><h1 style="color:#ff6b6b;">Error al cargar la aplicación</h1><p>Código: ' + errorCode + '</p><p>Descripción: ' + errorDescription + '</p><p>URL: ' + validatedURL + '</p><p>Por favor, revisa la consola para más detalles.</p></body></html>');
            }
          }, 500);
        }
      }
    });
    
    // Escuchar errores de consola del renderer
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[Renderer ${level}]`, message);
      if (level >= 2) { // Warning o Error
        console.error('[Renderer Error]', message, 'en', sourceId, 'línea', line);
      }
    });
    
    // Permitir F12 siempre (DevTools se puede abrir manualmente)
    // No bloquear ninguna tecla - el usuario puede usar F12 cuando quiera
    
    // Escuchar cuando la página termine de cargar
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✓ Página cargada correctamente');
      
      // Asegurar que la ventana esté visible
      if (!mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
      }
      
      // Verificar que el contenido se haya cargado
      mainWindow.webContents.executeJavaScript(`
        (function() {
          const root = document.getElementById('root');
          if (!root || root.innerHTML.trim() === '') {
            console.error('El elemento root está vacío');
            return false;
          }
          return true;
        })();
      `).then(result => {
        if (!result) {
          console.error('⚠️ Advertencia: El elemento root está vacío después de cargar');
        }
      }).catch(e => console.error('Error verificando contenido:', e));
    });
    
    // Escuchar errores no capturados del renderer
    mainWindow.webContents.on('unresponsive', () => {
      console.error('⚠️ La página no responde');
    });
    
    mainWindow.webContents.on('crashed', (event, killed) => {
      console.error('❌ La página se bloqueó. Reiniciando...', killed);
    });
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Enfocar la ventana
    if (isDev) {
      mainWindow.focus();
    }
  });


  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevenir navegación a URLs externas
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5174' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });

  // Agregar la ventana al array de ventanas
  windows.push(mainWindow);
  
  // Si es la primera ventana, establecerla como principal
  if (windows.length === 1) {
    // mainWindow ya está establecida
  } else {
    // Para ventanas adicionales, también las mantenemos en mainWindow para compatibilidad
    // pero podemos tener múltiples ventanas
  }

  mainWindow.on('closed', () => {
    // Remover la ventana del array
    const closedWindow = mainWindow;
    const index = windows.indexOf(closedWindow);
    if (index > -1) {
      windows.splice(index, 1);
    }
    
    // Si era la ventana principal y hay otras ventanas, asignar la primera como principal
    if (closedWindow === mainWindow) {
      if (windows.length > 0) {
        mainWindow = windows[0];
      } else {
        mainWindow = null;
      }
    }
  });
  
  // Minimizar a la bandeja en lugar de cerrar (solo para la ventana principal)
  // Las ventanas adicionales se pueden cerrar normalmente
  const isMainWindow = windows.length === 1;
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      // Solo minimizar a la bandeja si es la ventana principal y hay otras ventanas
      // o si es la única ventana
      if (isMainWindow || windows.length === 1) {
        event.preventDefault();
        mainWindow.hide();
      }
      // Si hay múltiples ventanas y esta no es la principal, permitir cerrarla normalmente
    }
  });
}

// Función para mostrar notificación nativa del sistema
function showNativeNotification(title, body, eventId = null) {
  if (!Notification.isSupported()) {
    console.log('Las notificaciones no están soportadas en este sistema');
    return;
  }
  
  const iconPath = getIconPath();
  
  const notification = new Notification({
    title: title,
    body: body,
    icon: iconPath,
    silent: false
  });
  
  notification.show();
  
  // Si hay un evento asociado, guardar el ID para referencia
  if (eventId) {
    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        // Enviar mensaje al renderer para abrir el evento
        mainWindow.webContents.send('notification-clicked', eventId);
      }
    });
  }
}

// Este método se llamará cuando Electron haya terminado de inicializarse
app.whenReady().then(() => {
  // Solicitar permisos para notificaciones
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.notionlocaleditor.app');
  }
  
  // Registrar atajo de teclado global para F12 (DevTools)
  const { globalShortcut } = require('electron');
  
  // Registrar F12 para abrir/cerrar DevTools
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });
  
  createWindow();
  createTray();
  
  // Configurar IPC para recibir mensajes del renderer
  ipcMain.on('show-native-notification', (event, title, body, eventId) => {
    showNativeNotification(title, body, eventId);
  });

  // Handler para crear nueva ventana desde el renderer
  ipcMain.handle('create-new-window', async () => {
    createWindow();
    return { success: true };
  });

  // Handler para iniciar servicio
  ipcMain.handle('start-code-service', async (event, language) => {
    CodeExecutionService.startService(language);
    return { success: true, status: CodeExecutionService.getServiceStatus(language) };
  });
  
  // Handler para detener servicio
  ipcMain.handle('stop-code-service', async (event, language) => {
    CodeExecutionService.stopService(language);
    return { success: true };
  });
  
  // Handler para obtener estado del servicio
  ipcMain.handle('get-code-service-status', async (event, language) => {
    return CodeExecutionService.getServiceStatus(language);
  });
  
  // Handler para ejecutar código (ahora usa el servicio compartido)
  ipcMain.handle('execute-code', async (event, code, language) => {
    // Para lenguajes que no usan el servicio compartido, usar lógica original
    if (language === 'dotnet' || language === 'java' || language === 'sqlite') {
      return new Promise((resolve, reject) => {
        if (language === 'dotnet') {
          resolve({ error: '⚠️ .NET Core requiere compilación. Usa "Ejecutar Proyecto" con un proyecto .NET completo.' });
          return;
        } else if (language === 'java') {
          resolve({ error: '⚠️ Java requiere compilación. Usa "Ejecutar Proyecto" con un proyecto Java completo.' });
          return;
        } else if (language === 'sqlite') {
          const dbPath = path.join(os.tmpdir(), 'ejemplos_consola.db');
          const tempSql = path.join(os.tmpdir(), `temp_${Date.now()}.sql`);
          fs.writeFileSync(tempSql, code);
          
          const childProcess = spawn('sqlite3', [dbPath, '.read', tempSql], {
            shell: true,
            cwd: os.homedir(),
            env: { ...process.env }
          });
          
          let output = '';
          let errorOutput = '';
          
          childProcess.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          childProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });
          
          childProcess.on('close', (code) => {
            if (code === 0) {
              resolve({ output: output || 'Ejecutado correctamente (sin salida)' });
            } else {
              resolve({ error: errorOutput || `Proceso terminado con código ${code}` });
            }
          });
          
          childProcess.on('error', (error) => {
            resolve({ 
              error: `Error al ejecutar: ${error.message}\n\nAsegúrate de que sqlite3 esté instalado y en tu PATH.` 
            });
          });
          
          setTimeout(() => {
            childProcess.kill();
            resolve({ error: 'Tiempo de ejecución excedido (30 segundos)' });
          }, 30000);
        }
      });
    }
    
    // Para Node.js y Python, usar el servicio compartido
    const serviceLanguage = language === 'nodejs' ? 'nodejs' : 'python';
    return await CodeExecutionService.executeCode(code, serviceLanguage);
  });

  // Handler para ejecutar proyecto completo
  // Handler para detectar tipo de proyecto
  ipcMain.handle('detect-project-type', async (event, projectPath) => {
    try {
      if (!fs.existsSync(projectPath)) {
        return { error: 'La ruta no existe' };
      }

      // Detectar tipo de proyecto
      const packageJsonPath = path.join(projectPath, 'package.json');
      const requirementsPath = path.join(projectPath, 'requirements.txt');
      const angularJsonPath = path.join(projectPath, 'angular.json');
      const csprojFiles = fs.existsSync(projectPath) ? 
        fs.readdirSync(projectPath).filter(f => f.endsWith('.csproj')) : [];
      const csprojPath = csprojFiles.length > 0 ? csprojFiles[0] : null;
      const javaMainPath = path.join(projectPath, 'Main.java');
      const pomXmlPath = path.join(projectPath, 'pom.xml');
      const buildGradlePath = path.join(projectPath, 'build.gradle');

      const hasPackageJson = fs.existsSync(packageJsonPath);
      const hasRequirements = fs.existsSync(requirementsPath);
      const hasAngularJson = fs.existsSync(angularJsonPath);
      const hasCsproj = csprojPath && fs.existsSync(path.join(projectPath, csprojPath));
      const hasJavaMain = fs.existsSync(javaMainPath);
      const hasPomXml = fs.existsSync(pomXmlPath);
      const hasBuildGradle = fs.existsSync(buildGradlePath);
      
      // Detectar proyectos HTML (archivos .html en la raíz o en subdirectorios)
      const findHTMLFiles = (dir) => {
        const files = [];
        try {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isFile() && item.name.endsWith('.html')) {
              files.push(fullPath);
            } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
              // Buscar recursivamente en subdirectorios
              const subFiles = findHTMLFiles(fullPath);
              files.push(...subFiles);
            }
          }
        } catch (err) {
          // Ignorar errores de lectura
        }
        return files;
      };
      const htmlFiles = fs.existsSync(projectPath) ? findHTMLFiles(projectPath) : [];
      const hasHTMLFiles = htmlFiles.length > 0;

      if (hasAngularJson) {
        return { type: 'Angular', command: 'npm start' };
      } else if (hasPackageJson) {
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageData.scripts || {};
        if (scripts.dev) {
          return { type: 'React/Node.js', command: 'npm run dev' };
        } else if (scripts.start) {
          return { type: 'React/Node.js', command: 'npm start' };
        } else {
          return { type: 'Node.js', command: 'npm start' };
        }
      } else if (hasRequirements) {
        // Buscar archivo principal de Python
        const mainPy = path.join(projectPath, 'main.py');
        const appPy = path.join(projectPath, 'app.py');
        const runPy = path.join(projectPath, 'run.py');
        
        let pythonCommand = 'python main.py';
        if (fs.existsSync(mainPy)) {
          pythonCommand = 'python main.py';
        } else if (fs.existsSync(appPy)) {
          pythonCommand = 'python app.py';
        } else if (fs.existsSync(runPy)) {
          pythonCommand = 'python run.py';
        } else {
          // Buscar cualquier archivo .py en la raíz
          try {
            const files = fs.readdirSync(projectPath);
            const pyFile = files.find(f => f.endsWith('.py') && !f.startsWith('_'));
            if (pyFile) {
              pythonCommand = `python ${pyFile}`;
            }
          } catch (err) {
            // Si no se encuentra, usar main.py por defecto
          }
        }
        return { type: 'Python', command: pythonCommand };
      } else if (hasCsproj) {
        return { type: '.NET Core', command: 'dotnet run' };
      } else if (hasPomXml) {
        return { type: 'Java (Maven)', command: 'mvn exec:java' };
      } else if (hasBuildGradle) {
        return { type: 'Java (Gradle)', command: 'gradle run' };
      } else if (hasJavaMain) {
        return { type: 'Java', command: 'javac Main.java && java Main' };
      } else if (hasHTMLFiles) {
        // Proyecto HTML - encontrar el archivo principal (index.html o el primero)
        const mainHTML = htmlFiles.find(f => f.includes('index.html')) || htmlFiles[0];
        return { type: 'HTML', command: 'open-html', htmlFile: mainHTML };
      } else {
        return { type: null, error: 'No se pudo detectar el tipo de proyecto' };
      }
    } catch (error) {
      return { error: error.message };
    }
  });

  ipcMain.handle('execute-project', async (event, projectPath, language) => {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(projectPath)) {
        resolve({ error: `La ruta no existe: ${projectPath}` });
        return;
      }

      // Detectar tipo de proyecto
      const packageJsonPath = path.join(projectPath, 'package.json');
      const requirementsPath = path.join(projectPath, 'requirements.txt');
      const angularJsonPath = path.join(projectPath, 'angular.json');
      const csprojFiles = fs.existsSync(projectPath) ? 
        fs.readdirSync(projectPath).filter(f => f.endsWith('.csproj')) : [];
      const csprojPath = csprojFiles.length > 0 ? csprojFiles[0] : null;
      const javaMainPath = path.join(projectPath, 'Main.java');
      const pomXmlPath = path.join(projectPath, 'pom.xml');
      const buildGradlePath = path.join(projectPath, 'build.gradle');
      
      const hasPackageJson = fs.existsSync(packageJsonPath);
      const hasRequirements = fs.existsSync(requirementsPath);
      const hasAngularJson = fs.existsSync(angularJsonPath);
      const hasCsproj = csprojPath && fs.existsSync(path.join(projectPath, csprojPath));
      const hasJavaMain = fs.existsSync(javaMainPath);
      const hasPomXml = fs.existsSync(pomXmlPath);
      const hasBuildGradle = fs.existsSync(buildGradlePath);
      
      // Detectar proyectos HTML (archivos .html en la raíz o en subdirectorios)
      const findHTMLFiles = (dir) => {
        const files = [];
        try {
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isFile() && item.name.endsWith('.html')) {
              files.push(fullPath);
            } else if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
              // Buscar recursivamente en subdirectorios
              const subFiles = findHTMLFiles(fullPath);
              files.push(...subFiles);
            }
          }
        } catch (err) {
          // Ignorar errores de lectura
        }
        return files;
      };
      const htmlFiles = fs.existsSync(projectPath) ? findHTMLFiles(projectPath) : [];
      const hasHTMLFiles = htmlFiles.length > 0;

      let command, args, cwd = projectPath;
      
      // Proyecto HTML - leer el contenido del archivo HTML principal
      if (hasHTMLFiles) {
        const mainHTML = htmlFiles.find(f => f.includes('index.html')) || htmlFiles[0];
        try {
          const htmlContent = fs.readFileSync(mainHTML, 'utf8');
          resolve({ 
            output: `✅ Proyecto HTML detectado\n📄 Archivo: ${path.basename(mainHTML)}\n\nEl contenido HTML se mostrará en el previewer de la consola.\n\nPara ver el proyecto completo, abre el archivo en un navegador.`,
            htmlContent: htmlContent,
            htmlFile: mainHTML,
            type: 'html'
          });
          return;
        } catch (error) {
          resolve({ error: `Error al leer el archivo HTML: ${error.message}` });
          return;
        }
      }

      if (hasCsproj) {
        // Proyecto .NET Core
        command = 'dotnet';
        args = ['run'];
      } else if (hasJavaMain) {
        // Proyecto Java simple
        command = 'javac';
        args = ['Main.java'];
        // Después de compilar, ejecutar
        const compileProcess = spawn(command, args, { shell: true, cwd: cwd });
        compileProcess.on('close', (code) => {
          if (code === 0) {
            const runProcess = spawn('java', ['Main'], { shell: true, cwd: cwd });
            // Manejar salida del proceso de ejecución
            let output = '';
            let errorOutput = '';
            runProcess.stdout.on('data', (data) => { output += data.toString(); });
            runProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });
            runProcess.on('close', (code) => {
              if (code === 0) {
                resolve({ output: output || 'Ejecutado correctamente' });
              } else {
                resolve({ error: errorOutput || `Proceso terminado con código ${code}` });
              }
            });
          } else {
            resolve({ error: 'Error al compilar el código Java' });
          }
        });
        return;
      } else if (hasPomXml || hasBuildGradle) {
        // Proyecto Maven o Gradle
        if (hasPomXml) {
          command = 'mvn';
          args = ['exec:java', '-Dexec.mainClass="Main"'];
        } else {
          command = 'gradle';
          args = ['run'];
        }
      } else if (hasAngularJson) {
        // Proyecto Angular
        command = 'npm';
        args = ['start'];
      } else if (hasPackageJson) {
        // Proyecto React/Node.js
        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const scripts = packageData.scripts || {};
        
        if (scripts.dev) {
          command = 'npm';
          args = ['run', 'dev'];
        } else if (scripts.start) {
          command = 'npm';
          args = ['start'];
        } else {
          resolve({ error: 'No se encontró script "dev" o "start" en package.json' });
          return;
        }
      } else if (hasRequirements && language === 'python') {
        // Proyecto Python
        const mainPy = path.join(projectPath, 'main.py');
        const appPy = path.join(projectPath, 'app.py');
        
        if (fs.existsSync(mainPy)) {
          command = 'python';
          args = [mainPy];
        } else if (fs.existsSync(appPy)) {
          command = 'python';
          args = [appPy];
        } else {
          resolve({ error: 'No se encontró main.py o app.py en el proyecto' });
          return;
        }
      } else {
        resolve({ error: 'No se pudo detectar el tipo de proyecto. Asegúrate de que tenga package.json (Node.js/React/Angular) o requirements.txt (Python)' });
        return;
      }

      const childProcess = spawn(command, args, {
        shell: true,
        cwd: cwd,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ output: output || 'Proyecto ejecutado correctamente' });
        } else {
          resolve({ error: errorOutput || `Proceso terminado con código ${code}` });
        }
      });

      childProcess.on('error', (error) => {
        resolve({ 
          error: `Error al ejecutar proyecto: ${error.message}\n\nAsegúrate de que ${command} esté instalado y en tu PATH.` 
        });
      });

      // Timeout de 60 segundos para proyectos
      setTimeout(() => {
        childProcess.kill();
        resolve({ error: 'Tiempo de ejecución excedido (60 segundos). El proyecto puede estar ejecutándose en segundo plano.' });
      }, 60000);
    });
  });

  // Handler para obtener ruta de cursos incluidos
  ipcMain.handle('get-cursos-path', async () => {
    // En desarrollo, usar la ruta del proyecto
    if (!app.isPackaged) {
      return path.join(__dirname, '../../ejemplos-consola');
    }
    
    // En producción, usar resources
    // Los cursos se copian a resources durante el build
    const recursosPath = process.resourcesPath || app.getAppPath();
    return path.join(recursosPath, 'cursos');
  });

  // Handler para verificar si una ruta existe
  ipcMain.handle('path-exists', async (event, filePath) => {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  });

  // Handler para verificar si una ruta es un directorio
  ipcMain.handle('is-directory', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { isDirectory: false, exists: false };
      }
      const stats = fs.statSync(filePath);
      return { isDirectory: stats.isDirectory(), exists: true };
    } catch (error) {
      return { isDirectory: false, exists: false, error: error.message };
    }
  });

  // Handler para listar cursos en una ruta
  ipcMain.handle('list-cursos', async (event, cursosPath) => {
    try {
      if (!fs.existsSync(cursosPath)) {
        return [];
      }

      const items = fs.readdirSync(cursosPath, { withFileTypes: true });
      const cursos = [];

      for (const item of items) {
        if (item.isDirectory() && item.name.startsWith('aprender-') || item.name.startsWith('ejemplo-')) {
          const cursoPath = path.join(cursosPath, item.name);
          const readmePath = path.join(cursoPath, 'README.md');
          
          let descripcion = '';
          if (fs.existsSync(readmePath)) {
            const readmeContent = fs.readFileSync(readmePath, 'utf8');
            // Extraer primera línea de descripción si existe
            const match = readmeContent.match(/^#.*\n\n(.*?)(?:\n|$)/);
            if (match) {
              descripcion = match[1].trim();
            }
          }

          cursos.push({
            nombre: item.name,
            ruta: cursoPath,
            descripcion: descripcion || `Curso: ${item.name}`
          });
        }
      }

      return cursos;
    } catch (error) {
      console.error('Error listando cursos:', error);
      return [];
    }
  });

  // Handler para seleccionar carpeta de cursos externos
  ipcMain.handle('select-cursos-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Seleccionar carpeta de cursos externos'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Handler para listar contenido de un directorio
  ipcMain.handle('list-directory', async (event, dirPath) => {
    try {
      if (!fs.existsSync(dirPath)) {
        return { error: 'La ruta no existe' };
      }

      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        return { error: 'La ruta no es un directorio' };
      }

      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const files = [];

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        // Ignorar archivos/carpetas ocultos y node_modules
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }

        try {
          const itemStats = fs.statSync(fullPath);
          files.push({
            name: item.name,
            path: fullPath,
            type: itemStats.isDirectory() ? 'folder' : 'file',
            size: itemStats.isFile() ? itemStats.size : null
          });
        } catch (err) {
          // Ignorar errores al acceder a archivos/carpetas
          console.error(`Error accediendo a ${fullPath}:`, err);
        }
      }

      return { files };
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handler para leer contenido de un archivo
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { error: 'El archivo no existe' };
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return { error: 'La ruta no es un archivo' };
      }

      // Limitar tamaño de archivo a 5MB
      if (stats.size > 5 * 1024 * 1024) {
        return { error: 'El archivo es demasiado grande (máximo 5MB)' };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return { content };
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handler para escribir contenido en un archivo
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handler para eliminar un archivo
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          // Eliminar directorio recursivamente
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log('[Electron] Directorio eliminado exitosamente:', filePath);
        } else {
          fs.unlinkSync(filePath);
          console.log('[Electron] Archivo eliminado exitosamente:', filePath);
        }
        return { success: true };
      } else {
        // Si el archivo no existe, considerarlo como éxito (ya está eliminado)
        console.log('[Electron] Archivo no encontrado (ya eliminado):', filePath);
        return { success: true };
      }
    } catch (error) {
      console.error('[Electron] Error eliminando archivo:', filePath, error);
      return { error: error.message, success: false };
    }
  });

  // Handler para crear un directorio
  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      if (fs.existsSync(dirPath)) {
        return { error: 'El directorio ya existe', success: false };
      }
      fs.mkdirSync(dirPath, { recursive: true });
      console.log('[Electron] Directorio creado exitosamente:', dirPath);
      return { success: true };
    } catch (error) {
      console.error('[Electron] Error creando directorio:', dirPath, error);
      return { error: error.message, success: false };
    }
  });

  // Handler para copiar un archivo o directorio
  ipcMain.handle('copy-file', async (event, sourcePath, targetPath) => {
    try {
      if (!fs.existsSync(sourcePath)) {
        return { error: 'El archivo o carpeta origen no existe', success: false };
      }

      // Si el destino ya existe, agregar un número al final
      let finalTargetPath = targetPath;
      let counter = 1;
      while (fs.existsSync(finalTargetPath)) {
        const ext = path.extname(targetPath);
        const base = path.basename(targetPath, ext);
        const dir = path.dirname(targetPath);
        finalTargetPath = path.join(dir, `${base} (${counter})${ext}`);
        counter++;
      }

      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        // Copiar directorio recursivamente
        fs.cpSync(sourcePath, finalTargetPath, { recursive: true });
        console.log('[Electron] Directorio copiado exitosamente:', sourcePath, '->', finalTargetPath);
      } else {
        // Copiar archivo
        fs.copyFileSync(sourcePath, finalTargetPath);
        console.log('[Electron] Archivo copiado exitosamente:', sourcePath, '->', finalTargetPath);
      }
      return { success: true, targetPath: finalTargetPath };
    } catch (error) {
      console.error('[Electron] Error copiando archivo/carpeta:', sourcePath, '->', targetPath, error);
      return { error: error.message, success: false };
    }
  });

  // Handler para crear un archivo nuevo
  ipcMain.handle('create-file', async (event, filePath, initialContent = '') => {
    try {
      if (fs.existsSync(filePath)) {
        return { error: 'El archivo ya existe', success: false };
      }
      // Crear directorio padre si no existe
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, initialContent, 'utf8');
      console.log('[Electron] Archivo creado exitosamente:', filePath);
      return { success: true };
    } catch (error) {
      console.error('[Electron] Error creando archivo:', filePath, error);
      return { error: error.message, success: false };
    }
  });

  // Handler para renombrar/mover un archivo o directorio
  ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
    try {
      if (!fs.existsSync(oldPath)) {
        return { error: 'El archivo o directorio no existe', success: false };
      }
      if (fs.existsSync(newPath)) {
        return { error: 'Ya existe un archivo o directorio con ese nombre', success: false };
      }
      // Crear directorio padre si no existe
      const dir = path.dirname(newPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.renameSync(oldPath, newPath);
      console.log('[Electron] Archivo/directorio renombrado exitosamente:', oldPath, '->', newPath);
      return { success: true };
    } catch (error) {
      console.error('[Electron] Error renombrando archivo:', oldPath, error);
      return { error: error.message, success: false };
    }
  });

  // Handler para unir rutas (path.join)
  ipcMain.handle('path-join', async (event, ...paths) => {
    try {
      return { success: true, path: path.join(...paths) };
    } catch (error) {
      return { error: error.message, success: false };
    }
  });

  // Handler para ejecutar comandos del sistema
  ipcMain.handle('execute-command', async (event, command, shell, cwd, terminalId) => {
    return new Promise((resolve) => {
      try {
        // Determinar el shell a usar
        let shellCommand = shell || (process.platform === 'win32' ? 'cmd' : 'bash');
        let commandToExecute = command;
        
        // Preparar comando según el shell
        if (shellCommand === 'powershell') {
          commandToExecute = `powershell -Command "${command.replace(/"/g, '\\"')}"`;
        } else if (shellCommand === 'cmd') {
          commandToExecute = `cmd /c "${command.replace(/"/g, '\\"')}"`;
        } else {
          // bash, sh, zsh
          commandToExecute = command;
        }

        // Directorio de trabajo
        const workingDir = cwd || os.homedir();

        // Determinar el shell a usar para spawn
        let spawnShell = true;
        let spawnCommand = commandToExecute;
        let spawnArgs = [];
        
        // Si el shell es 'docker', usar bash/cmd como base pero mantener Docker CLI disponible
        const actualShell = shellCommand === 'docker' 
          ? (process.platform === 'win32' ? 'cmd' : 'bash')
          : shellCommand;
        
        if (actualShell === 'powershell') {
          spawnCommand = 'powershell';
          spawnArgs = ['-Command', command];
          spawnShell = false;
        } else if (actualShell === 'cmd') {
          spawnCommand = 'cmd';
          spawnArgs = ['/c', command];
          spawnShell = false;
        } else if (process.platform === 'win32' && actualShell === 'bash') {
          // En Windows con bash, usar Git Bash o WSL
          const gitBashPath = 'C:\\Program Files\\Git\\bin\\bash.exe';
          if (fs.existsSync(gitBashPath)) {
            spawnCommand = gitBashPath;
            spawnArgs = ['-c', command];
            spawnShell = false;
          } else {
            // Usar WSL
            spawnCommand = 'wsl';
            spawnArgs = ['bash', '-c', command];
            spawnShell = false;
          }
        } else {
          // Unix/Linux/Mac o bash nativo
          spawnCommand = actualShell || 'bash';
          spawnArgs = ['-c', command];
          spawnShell = false;
        }
        
        // Configurar opciones para spawn
        const spawnOptions = {
          shell: spawnShell,
          cwd: workingDir,
          env: { ...process.env }
        };
        
        // En Windows, asegurar que los procesos hijos se puedan matar
        if (process.platform === 'win32') {
          // En Windows, los procesos hijos se matan automáticamente con taskkill /T
          spawnOptions.detached = false;
        } else {
          // En Unix/Linux/Mac, crear un nuevo grupo de procesos
          spawnOptions.detached = false; // Mantener en el mismo grupo para poder matarlo
        }
        
        const childProcess = spawn(spawnCommand, spawnArgs, spawnOptions);

        // Detectar comandos que no terminan (servidores de desarrollo) o que producen salida en tiempo real
        // Incluir comandos de build que pueden tardar mucho tiempo
        // Incluir comandos de Docker que pueden tardar o seguir ejecutándose
        const isLongRunningCommand = /^(npm|yarn|pnpm)\s+(run\s+)?(dev|start|serve|watch|test|build)/i.test(command) ||
                                    /^(npm|yarn|pnpm)\s+(run\s+)?electron:build/i.test(command) ||
                                    /^(python|node|nodemon|ts-node|tsx)\s+.*(dev|start|serve|watch|test|build)/i.test(command) ||
                                    /^npm\s+test/i.test(command) ||
                                    /^yarn\s+test/i.test(command) ||
                                    /^pnpm\s+test/i.test(command) ||
                                    /electron:build/i.test(command) ||
                                    /docker\s+(compose|logs)/i.test(command) ||
                                    /docker\s+compose\s+(up|down|build|start|stop|restart)/i.test(command) ||
                                    /docker\s+logs\s+-f/i.test(command) ||
                                    /docker\s+(build|pull|push|run|exec|attach)/i.test(command) ||
                                    /(build|compile|package|dist|bundle)/i.test(command);

        let hasOutput = false;
        let lastOutputTime = Date.now();
        let initialOutputSent = false;
        
        // Si es un comando de larga duración y hay terminalId, registrarlo en ProcessManager
        if (isLongRunningCommand && terminalId) {
          ProcessManager.addProcess(terminalId, childProcess, command, workingDir);
          
          // Enviar output inicial inmediatamente
          childProcess.stdout.on('data', (data) => {
            hasOutput = true;
            lastOutputTime = Date.now();
            ProcessManager.addOutput(terminalId, data, false);
            if (!initialOutputSent) {
              initialOutputSent = true;
              resolve({ 
                output: '',
                exitCode: 0,
                currentDirectory: workingDir,
                isRunning: true,
                streaming: true
              });
            }
          });

          childProcess.stderr.on('data', (data) => {
            hasOutput = true;
            lastOutputTime = Date.now();
            ProcessManager.addOutput(terminalId, data, true);
            if (!initialOutputSent) {
              initialOutputSent = true;
              resolve({ 
                output: '',
                exitCode: 0,
                currentDirectory: workingDir,
                isRunning: true,
                streaming: true
              });
            }
          });

          childProcess.on('close', (code) => {
            ProcessManager.removeProcess(terminalId);
            // Enviar evento de cierre
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('terminal-process-closed', {
                terminalId,
                exitCode: code
              });
            }
          });

          childProcess.on('error', (error) => {
            ProcessManager.removeProcess(terminalId);
            if (!initialOutputSent) {
              resolve({ 
                error: `Error al ejecutar comando: ${error.message}`,
                currentDirectory: workingDir
              });
            }
          });
          
          // Timeout inicial para comandos sin output
          // Para comandos de build o Docker, dar más tiempo antes de mostrar "Iniciando proceso..."
          const initialDelay = /(build|compile|package|dist|bundle|electron:build|docker)/i.test(command) ? 5000 : 2000;
          setTimeout(() => {
            if (!hasOutput && !initialOutputSent) {
              resolve({ 
                output: 'Iniciando proceso...',
                exitCode: 0,
                currentDirectory: workingDir,
                isRunning: true,
                streaming: true
              });
            }
          }, initialDelay);
          
          return; // Salir temprano para comandos de larga duración
        }

        // Para comandos normales, comportamiento original
        // Aumentar timeout para comandos que pueden tardar mucho (como builds)
        let output = '';
        let errorOutput = '';
        // Detectar si es un comando que puede tardar mucho (builds, compilaciones, Docker, etc.)
        const isPotentiallyLongCommand = /(build|compile|package|dist|bundle|install|electron:build|docker)/i.test(command);
        // Timeout mucho más largo para comandos de build (60 minutos), normal para otros (2 minutos)
        const timeout = isPotentiallyLongCommand ? 3600000 : 120000; // 60 minutos para builds, 2 minutos para otros
        let timeoutId = null;
        let lastDataTime = Date.now(); // Track cuando se recibió el último output

        childProcess.stdout.on('data', (data) => {
          hasOutput = true;
          lastOutputTime = Date.now();
          lastDataTime = Date.now();
          output += data.toString();
          // Resetear timeout cada vez que hay output (el proceso está activo)
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          // Solo matar si no hay output por un tiempo muy largo (10 minutos para builds)
          timeoutId = setTimeout(() => {
            const timeSinceLastData = Date.now() - lastDataTime;
            const maxSilenceTime = isPotentiallyLongCommand ? 600000 : 120000; // 10 min para builds, 2 min para otros
            if (timeSinceLastData > maxSilenceTime) {
              childProcess.kill('SIGTERM');
              resolve({ 
                error: 'Comando excedió el tiempo de espera sin producir output',
                exitCode: -1,
                currentDirectory: workingDir
              });
            }
          }, timeout);
        });

        childProcess.stderr.on('data', (data) => {
          hasOutput = true;
          lastOutputTime = Date.now();
          lastDataTime = Date.now();
          errorOutput += data.toString();
          // Resetear timeout cada vez que hay output (el proceso está activo)
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          // Solo matar si no hay output por un tiempo muy largo
          timeoutId = setTimeout(() => {
            const timeSinceLastData = Date.now() - lastDataTime;
            const maxSilenceTime = isPotentiallyLongCommand ? 600000 : 120000;
            if (timeSinceLastData > maxSilenceTime) {
              childProcess.kill('SIGTERM');
              resolve({ 
                error: 'Comando excedió el tiempo de espera sin producir output',
                exitCode: -1,
                currentDirectory: workingDir
              });
            }
          }, timeout);
        });

        // Timeout inicial solo si no hay output
        timeoutId = setTimeout(() => {
          if (!hasOutput) {
            // Para comandos de build, dar más tiempo antes de considerar que no hay output
            const noOutputTimeout = isPotentiallyLongCommand ? 600000 : 120000; // 10 minutos para builds, 2 minutos para otros
            setTimeout(() => {
              if (!hasOutput) {
                childProcess.kill('SIGTERM');
                resolve({ 
                  error: 'Comando excedió el tiempo de espera sin producir output',
                  exitCode: -1,
                  currentDirectory: workingDir
                });
              }
            }, noOutputTimeout);
          }
        }, timeout);

        childProcess.on('close', (code) => {
          clearTimeout(timeoutId);
          // Combinar output y errorOutput
          const combinedOutput = output + (errorOutput ? '\n' + errorOutput : '');
          
          if (code === 0 || code === null) {
            resolve({ 
              output: combinedOutput || 'Comando ejecutado correctamente',
              exitCode: code || 0,
              currentDirectory: workingDir
            });
          } else {
            resolve({ 
              error: errorOutput || `Comando terminado con código ${code}`,
              output: output, // Mantener output separado también
              exitCode: code,
              currentDirectory: workingDir
            });
          }
        });

        childProcess.on('error', (error) => {
          clearTimeout(timeoutId);
          resolve({ 
            error: `Error al ejecutar comando: ${error.message}`,
            currentDirectory: workingDir
          });
        });

      } catch (error) {
        resolve({ 
          error: `Error: ${error.message}`,
          currentDirectory: cwd || os.homedir()
        });
      }
    });
  });

  // Handler para obtener directorio actual
  ipcMain.handle('get-current-directory', async (event) => {
    return process.cwd();
  });

  // Handler para seleccionar directorio
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Seleccionar directorio del proyecto'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Handler para normalizar una ruta
  ipcMain.handle('normalize-path', async (event, inputPath) => {
    try {
      // Usar path.resolve para normalizar la ruta (resuelve .. y .)
      const normalized = path.resolve(inputPath);
      return normalized;
    } catch (error) {
      console.error(`Error normalizando ruta '${inputPath}':`, error);
      return inputPath; // Fallback a la ruta original en caso de error
    }
  });

  // Handler para detener un proceso de terminal
  ipcMain.handle('stop-terminal-process', async (event, terminalId) => {
    const result = ProcessManager.stopProcess(terminalId);
    
    // Esperar un momento y verificar que el proceso realmente se haya matado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const isDead = await ProcessManager.isProcessDead(terminalId);
    if (!isDead) {
      console.warn(`Proceso ${terminalId} aún está vivo después de intentar matarlo`);
      // Intentar una vez más de forma más agresiva
      ProcessManager.stopProcess(terminalId);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return result;
  });
  
  // Handler para verificar si un proceso está muerto
  ipcMain.handle('is-process-dead', async (event, terminalId) => {
    return ProcessManager.isProcessDead(terminalId);
  });

  // Handler para obtener procesos que están usando un puerto específico
  ipcMain.handle('get-processes-by-port', async (event, port) => {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        // En Windows, usar netstat para encontrar procesos usando el puerto
        exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
          if (error || !stdout) {
            resolve([]);
            return;
          }
          
          const processes = [];
          const lines = stdout.split('\n');
          const pids = new Set();
          
          for (const line of lines) {
            const match = line.match(/\s+(\d+)\s*$/);
            if (match) {
              const pid = parseInt(match[1]);
              if (pid && !pids.has(pid)) {
                pids.add(pid);
                // Obtener nombre del proceso
                exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (error2, stdout2) => {
                  if (!error2 && stdout2) {
                    const parts = stdout2.split(',');
                    if (parts.length > 0) {
                      const processName = parts[0].replace(/"/g, '').trim();
                      processes.push({ pid, name: processName, port });
                    }
                  }
                });
              }
            }
          }
          
          // Esperar un momento para que se completen las consultas de tasklist
          setTimeout(() => {
            resolve(Array.from(pids).map(pid => {
              const found = processes.find(p => p.pid === pid);
              return found || { pid, name: 'Unknown', port };
            }));
          }, 500);
        });
      } else {
        // En Unix/Linux/Mac, usar lsof
        exec(`lsof -ti:${port}`, (error, stdout) => {
          if (error || !stdout) {
            resolve([]);
            return;
          }
          
          const pids = stdout.trim().split('\n').filter(Boolean).map(pid => parseInt(pid));
          const processes = [];
          
          // Obtener información de cada proceso
          const promises = pids.map(pid => {
            return new Promise((resolvePid) => {
              exec(`ps -p ${pid} -o comm=`, (error2, stdout2) => {
                const name = error2 ? 'Unknown' : stdout2.trim();
                resolvePid({ pid, name, port });
              });
            });
          });
          
          Promise.all(promises).then(results => {
            resolve(results);
          });
        });
      }
    });
  });

  // Handler para matar un proceso por PID
  ipcMain.handle('kill-process-by-pid', async (event, pid) => {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec(`taskkill /PID ${pid} /T /F`, (error) => {
          if (error) {
            resolve({ success: false, error: error.message });
          } else {
            resolve({ success: true });
          }
        });
      } else {
        try {
          // Intentar SIGTERM primero
          process.kill(pid, 'SIGTERM');
          setTimeout(() => {
            try {
              // Si después de 1 segundo sigue vivo, usar SIGKILL
              process.kill(pid, 'SIGKILL');
            } catch (e) {
              // Proceso ya está muerto
            }
            resolve({ success: true });
          }, 1000);
        } catch (error) {
          resolve({ success: false, error: error.message });
        }
      }
    });
  });

  // ==================== DEBUGGING HANDLERS ====================
  
  // Gestor de sesiones de debugging
  const DebugManager = {
    sessions: new Map(), // projectId -> { process, debugPort, type, breakpoints }
    nextDebugPort: 9229, // Puerto inicial para Node.js debugging
    
    // Encontrar puerto disponible
    findAvailablePort(startPort = 9229) {
      return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, () => {
          const port = server.address().port;
          server.close(() => resolve(port));
        });
        server.on('error', () => {
          // Puerto ocupado, intentar siguiente
          this.findAvailablePort(startPort + 1).then(resolve);
        });
      });
    },
    
    // Iniciar debugging para Node.js
    async startNodeDebugging(projectId, projectPath) {
      try {
        // Encontrar puerto disponible
        const debugPort = await this.findAvailablePort(this.nextDebugPort);
        this.nextDebugPort = debugPort + 1;
        
        // Detectar archivo principal
        const packageJsonPath = path.join(projectPath, 'package.json');
        let entryPoint = 'index.js';
        
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageData.main) {
              entryPoint = packageData.main;
            } else if (packageData.scripts && packageData.scripts.start) {
              // Extraer archivo del script start
              const startScript = packageData.scripts.start;
              const match = startScript.match(/node\s+(.+)/);
              if (match) {
                entryPoint = match[1].trim();
              }
            }
          } catch (e) {
            console.warn('Error leyendo package.json:', e);
          }
        }
        
        // Verificar si existe el archivo
        const entryPath = path.join(projectPath, entryPoint);
        if (!fs.existsSync(entryPath)) {
          // Buscar archivos .js en la raíz
          const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.js') && !f.startsWith('.'));
          if (files.length > 0) {
            entryPoint = files[0];
          } else {
            throw new Error(`No se encontró archivo de entrada (${entryPoint})`);
          }
        }
        
        // Iniciar proceso con debugging
        const childProcess = spawn('node', [
          `--inspect=${debugPort}`,
          '--inspect-brk', // Pausar al inicio
          entryPoint
        ], {
          cwd: projectPath,
          shell: true,
          stdio: 'pipe'
        });
        
        const session = {
          projectId,
          projectPath,
          type: 'nodejs',
          process: childProcess,
          debugPort,
          breakpoints: new Map(), // file:line -> breakpointId
          status: 'paused', // Pausado al inicio por --inspect-brk
        };
        
        this.sessions.set(projectId, session);
        
        // Conectar con Chrome DevTools Protocol usando WebSocket
        setTimeout(async () => {
          try {
            await this.connectToNodeDebugger(projectId, debugPort);
          } catch (error) {
            console.error('[DebugManager] Error conectando a debugger:', error);
          }
        }, 1500);
        
        // Enviar evento de debugging iniciado
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('debug-event', {
            projectId,
            type: 'started',
            debugPort
          });
        }
        
        return { success: true, debugPort, processId: childProcess.pid };
      } catch (error) {
        console.error('[DebugManager] Error iniciando debugging Node.js:', error);
        throw error;
      }
    },
    
    // Conectar con Node.js debugger usando Chrome DevTools Protocol (HTTP)
    async connectToNodeDebugger(projectId, debugPort) {
      const session = this.sessions.get(projectId);
      if (!session) return;
      
      try {
        // Obtener la URL del WebSocket del inspector desde /json/list usando http.get
        const listUrl = `http://127.0.0.1:${debugPort}/json/list`;
        
        return new Promise((resolve, reject) => {
          http.get(listUrl, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              try {
                const targets = JSON.parse(data);
                
                if (targets && targets.length > 0 && WebSocket) {
                  const wsUrl = targets[0].webSocketDebuggerUrl;
                  const ws = new WebSocket(wsUrl);
                  
                  ws.on('open', () => {
                    console.log(`[DebugManager] Conectado al debugger de Node.js en puerto ${debugPort}`);
                    session.wsConnection = ws;
                    
                    // Habilitar Runtime y Debugger
                    this.sendDebuggerCommand(ws, 'Runtime.enable', {});
                    this.sendDebuggerCommand(ws, 'Debugger.enable', {});
                    
                    // Configurar listeners para eventos
                    ws.on('message', (data) => {
                      try {
                        const message = JSON.parse(data.toString());
                        this.handleNodeDebuggerMessage(projectId, message);
                      } catch (e) {
                        console.error('[DebugManager] Error parseando mensaje:', e);
                      }
                    });
                    
                    ws.on('error', (error) => {
                      console.error('[DebugManager] Error en WebSocket:', error);
                    });
                    
                    ws.on('close', () => {
                      console.log('[DebugManager] Conexión WebSocket cerrada');
                      session.wsConnection = null;
                    });
                    
                    resolve(true);
                  });
                  
                  ws.on('error', (error) => {
                    console.error('[DebugManager] Error conectando WebSocket:', error);
                    reject(error);
                  });
                } else {
                  console.warn('[DebugManager] No se encontraron targets o WebSocket no disponible');
                  resolve(false);
                }
              } catch (error) {
                console.error('[DebugManager] Error parseando respuesta:', error);
                reject(error);
              }
            });
          }).on('error', (error) => {
            console.error('[DebugManager] Error obteniendo lista de targets:', error);
            reject(error);
          });
        });
      } catch (error) {
        console.error('[DebugManager] Error conectando a debugger:', error);
        return false;
      }
    },
    
    // Enviar comando al debugger
    sendDebuggerCommand(ws, method, params = {}) {
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      
      const id = Date.now();
      const message = {
        id,
        method,
        params
      };
      
      ws.send(JSON.stringify(message));
      return id;
    },
    
    // Manejar mensajes del debugger
    handleNodeDebuggerMessage(projectId, message) {
      const session = this.sessions.get(projectId);
      if (!session) return;
      
      // Manejar eventos
      if (message.method) {
        switch (message.method) {
          case 'Debugger.paused':
            // Ejecución pausada en un breakpoint
            const callFrames = message.params.callFrames || [];
            if (callFrames.length > 0) {
              const frame = callFrames[0];
              const location = frame.location;
              const scriptId = location.scriptId;
              
              // Obtener información del script
              this.sendDebuggerCommand(session.wsConnection, 'Debugger.getScriptSource', {
                scriptId: scriptId
              });
              
              // Por ahora, usar información básica
              session.status = 'paused';
              
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('debug-event', {
                  projectId,
                  type: 'breakpoint',
                  line: location.lineNumber + 1, // CodeMirror usa base 1
                  file: session.projectPath // Por ahora, usar projectPath
                });
              }
            }
            break;
            
          case 'Debugger.resumed':
            session.status = 'running';
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('debug-event', {
                projectId,
                type: 'continue'
              });
            }
            break;
        }
      }
    },
    
    // Iniciar debugging para Python
    async startPythonDebugging(projectId, projectPath) {
      try {
        // Encontrar puerto disponible para debugpy
        const debugPort = await this.findAvailablePort(5678);
        
        // Detectar archivo principal
        const mainPy = path.join(projectPath, 'main.py');
        const appPy = path.join(projectPath, 'app.py');
        let entryPoint = 'main.py';
        
        if (fs.existsSync(appPy)) {
          entryPoint = 'app.py';
        } else if (!fs.existsSync(mainPy)) {
          // Buscar archivos .py en la raíz
          const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.py') && !f.startsWith('_'));
          if (files.length > 0) {
            entryPoint = files[0];
          } else {
            throw new Error('No se encontró archivo Python de entrada');
          }
        }
        
        // Verificar si hay venv
        const venvPath = path.join(projectPath, 'venv');
        const pythonCmd = fs.existsSync(venvPath) 
          ? (process.platform === 'win32' 
              ? path.join(venvPath, 'Scripts', 'python.exe')
              : path.join(venvPath, 'bin', 'python'))
          : 'python';
        
        // Verificar si debugpy está instalado, si no, instalarlo automáticamente
        const checkDebugpy = async () => {
          return new Promise((resolve) => {
            exec(`${pythonCmd} -c "import debugpy; print('OK')"`, (error) => {
              if (error) {
                // debugpy no está instalado, instalarlo
                console.log('[DebugManager] Instalando debugpy...');
                exec(`${pythonCmd} -m pip install debugpy -q`, (installError) => {
                  if (installError) {
                    console.error('[DebugManager] Error instalando debugpy:', installError);
                    resolve(false);
                  } else {
                    console.log('[DebugManager] debugpy instalado correctamente');
                    resolve(true);
                  }
                });
              } else {
                resolve(true);
              }
            });
          });
        };
        
        const debugpyAvailable = await checkDebugpy();
        
        if (!debugpyAvailable) {
          throw new Error('No se pudo instalar debugpy. Por favor, instálalo manualmente: pip install debugpy');
        }
        
        // Crear script temporal con debugpy
        const entryPath = path.join(projectPath, entryPoint);
        const originalContent = fs.readFileSync(entryPath, 'utf8');
        
        // Código para iniciar debugpy
        const debugpyCode = `import debugpy
import sys
debugpy.listen(${debugPort})
print(f"🐛 Debugger escuchando en puerto {debugPort}", file=sys.stderr)
debugpy.wait_for_client()
print("✅ Cliente de debugging conectado", file=sys.stderr)

`;
        
        // Crear archivo temporal con debugpy
        const tempFile = path.join(projectPath, `.debug_${entryPoint}`);
        fs.writeFileSync(tempFile, debugpyCode + originalContent);
        
        const childProcess = spawn(pythonCmd, [tempFile], {
          cwd: projectPath,
          shell: true,
          stdio: 'pipe'
        });
        
        const session = {
          projectId,
          projectPath,
          type: 'python',
          process: childProcess,
          debugPort,
          breakpoints: new Map(),
          status: 'paused', // Esperando conexión
          tempFile
        };
        
        this.sessions.set(projectId, session);
        
        // Enviar evento
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('debug-event', {
            projectId,
            type: 'started',
            debugPort
          });
        }
        
        return { success: true, debugPort, processId: childProcess.pid };
      } catch (error) {
        console.error('[DebugManager] Error iniciando debugging Python:', error);
        throw error;
      }
    },
    
    // Detener debugging
    stopDebugging(projectId) {
      const session = this.sessions.get(projectId);
      if (!session) return { success: true };
      
      // Matar proceso
      if (session.process && !session.process.killed) {
        try {
          if (process.platform === 'win32') {
            exec(`taskkill /PID ${session.process.pid} /T /F`, () => {});
          } else {
            session.process.kill('SIGTERM');
            setTimeout(() => {
              if (!session.process.killed) {
                session.process.kill('SIGKILL');
              }
            }, 1000);
          }
        } catch (e) {
          console.error('Error matando proceso de debugging:', e);
        }
      }
      
      // Limpiar archivo temporal si existe (Python)
      if (session.tempFile && fs.existsSync(session.tempFile)) {
        try {
          fs.unlinkSync(session.tempFile);
        } catch (e) {
          console.warn('Error eliminando archivo temporal:', e);
        }
      }
      
      this.sessions.delete(projectId);
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('debug-event', {
          projectId,
          type: 'stopped'
        });
      }
      
      return { success: true };
    }
  };
  
  // Handler para iniciar debugging
  ipcMain.handle('start-debugging', async (event, projectPath, projectType) => {
    try {
      const projectId = projectPath.replace(/[<>:"/\\|?*]/g, '_') + '_' + Date.now();
      
      let result;
      if (projectType === 'nodejs' || projectType === 'react' || projectType === 'Angular') {
        result = await DebugManager.startNodeDebugging(projectId, projectPath);
      } else if (projectType === 'python') {
        result = await DebugManager.startPythonDebugging(projectId, projectPath);
      } else {
        return { error: `Tipo de proyecto no soportado para debugging: ${projectType}` };
      }
      
      return { ...result, projectId };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para detener debugging
  ipcMain.handle('stop-debugging', async (event, projectId) => {
    try {
      return DebugManager.stopDebugging(projectId);
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para establecer breakpoint
  ipcMain.handle('set-breakpoint', async (event, projectId, file, line, condition) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) {
        return { error: 'No hay sesión de debugging activa' };
      }
      
      // Guardar el breakpoint
      const breakpointKey = `${file}:${line}`;
      const breakpointId = Date.now();
      
      // Si es Node.js y tenemos conexión WebSocket, establecer el breakpoint real
      if (session.type === 'nodejs' && session.wsConnection) {
        // Encontrar el scriptId correspondiente al archivo
        // Por ahora, establecer el breakpoint con el número de línea
        const bpResult = await new Promise((resolve) => {
          const requestId = DebugManager.sendDebuggerCommand(session.wsConnection, 'Debugger.setBreakpointByUrl', {
            url: `file://${file}`,
            lineNumber: line - 1, // Protocolo usa base 0
            columnNumber: 0,
            condition: condition || undefined
          });
          
          // Esperar respuesta (simplificado, en producción deberías usar un sistema de callbacks)
          setTimeout(() => {
            resolve({ success: true, breakpointId: requestId });
          }, 100);
        });
        
        session.breakpoints.set(breakpointKey, { file, line, condition, id: bpResult.breakpointId || breakpointId });
      } else {
        // Para Python u otros, solo guardar el breakpoint
        session.breakpoints.set(breakpointKey, { file, line, condition, id: breakpointId });
      }
      
      return { success: true, breakpointId };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para remover breakpoint
  ipcMain.handle('remove-breakpoint', async (event, projectId, file, line) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { success: true };
      
      const breakpointKey = `${file}:${line}`;
      session.breakpoints.delete(breakpointKey);
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para continuar ejecución
  ipcMain.handle('debug-continue', async (event, projectId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { error: 'No hay sesión activa' };
      
      // Si es Node.js, usar el protocolo de debugging
      if (session.type === 'nodejs' && session.wsConnection) {
        DebugManager.sendDebuggerCommand(session.wsConnection, 'Debugger.resume', {});
      }
      
      session.status = 'running';
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('debug-event', {
          projectId,
          type: 'continue'
        });
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para pausar ejecución
  ipcMain.handle('debug-pause', async (event, projectId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { error: 'No hay sesión activa' };
      
      session.status = 'paused';
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('debug-event', {
          projectId,
          type: 'paused'
        });
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para step over
  ipcMain.handle('debug-step-over', async (event, projectId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { error: 'No hay sesión activa' };
      
      // Si es Node.js, usar el protocolo de debugging
      if (session.type === 'nodejs' && session.wsConnection) {
        DebugManager.sendDebuggerCommand(session.wsConnection, 'Debugger.stepOver', {});
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para step into
  ipcMain.handle('debug-step-into', async (event, projectId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { error: 'No hay sesión activa' };
      
      // Si es Node.js, usar el protocolo de debugging
      if (session.type === 'nodejs' && session.wsConnection) {
        DebugManager.sendDebuggerCommand(session.wsConnection, 'Debugger.stepInto', {});
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para step out
  ipcMain.handle('debug-step-out', async (event, projectId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { error: 'No hay sesión activa' };
      
      // Si es Node.js, usar el protocolo de debugging
      if (session.type === 'nodejs' && session.wsConnection) {
        DebugManager.sendDebuggerCommand(session.wsConnection, 'Debugger.stepOut', {});
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  });
  
  // Handler para obtener variables
  ipcMain.handle('get-debug-variables', async (event, projectId, frameId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return [];
      
      // Por ahora, retornar array vacío
      // En una implementación completa, obtener variables del protocolo
      return [];
    } catch (error) {
      console.error('[DebugManager] Error obteniendo variables:', error);
      return [];
    }
  });
  
  // Handler para obtener call stack
  ipcMain.handle('get-debug-call-stack', async (event, projectId) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return [];
      
      // Por ahora, retornar array vacío
      return [];
    } catch (error) {
      console.error('[DebugManager] Error obteniendo call stack:', error);
      return [];
    }
  });
  
  // Handler para evaluar expresión
  ipcMain.handle('evaluate-debug-expression', async (event, projectId, expression) => {
    try {
      const session = DebugManager.sessions.get(projectId);
      if (!session) return { error: 'No hay sesión activa' };
      
      // Por ahora, retornar error
      return { error: 'Evaluación no implementada aún' };
    } catch (error) {
      return { error: error.message };
    }
  });

  // Handler para matar todos los procesos usando un puerto específico
  ipcMain.handle('kill-processes-by-port', async (event, port) => {
    return new Promise(async (resolve) => {
      try {
        // Obtener procesos usando el puerto (usar el mismo código que get-processes-by-port)
        let processes = [];
        
        if (process.platform === 'win32') {
          // En Windows, usar netstat para encontrar procesos usando el puerto
          await new Promise((resolveNetstat) => {
            exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
              if (error || !stdout) {
                resolveNetstat();
                return;
              }
              
              const lines = stdout.split('\n');
              const pids = new Set();
              
              for (const line of lines) {
                const match = line.match(/\s+(\d+)\s*$/);
                if (match) {
                  const pid = parseInt(match[1]);
                  if (pid && !pids.has(pid)) {
                    pids.add(pid);
                    processes.push({ pid, name: 'Unknown', port });
                  }
                }
              }
              
              // Obtener nombres de procesos
              const namePromises = Array.from(pids).map(pid => {
                return new Promise((resolveName) => {
                  exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (error2, stdout2) => {
                    if (!error2 && stdout2) {
                      const parts = stdout2.split(',');
                      if (parts.length > 0) {
                        const processName = parts[0].replace(/"/g, '').trim();
                        const proc = processes.find(p => p.pid === pid);
                        if (proc) proc.name = processName;
                      }
                    }
                    resolveName();
                  });
                });
              });
              
              Promise.all(namePromises).then(() => resolveNetstat());
            });
          });
        } else {
          // En Unix/Linux/Mac, usar lsof
          await new Promise((resolveLsof) => {
            exec(`lsof -ti:${port}`, (error, stdout) => {
              if (error || !stdout) {
                resolveLsof();
                return;
              }
              
              const pids = stdout.trim().split('\n').filter(Boolean).map(pid => parseInt(pid));
              
              const promises = pids.map(pid => {
                return new Promise((resolvePid) => {
                  exec(`ps -p ${pid} -o comm=`, (error2, stdout2) => {
                    const name = error2 ? 'Unknown' : stdout2.trim();
                    processes.push({ pid, name, port });
                    resolvePid();
                  });
                });
              });
              
              Promise.all(promises).then(() => resolveLsof());
            });
          });
        }
        
        if (processes.length === 0) {
          resolve({ success: true, killed: 0, message: 'No hay procesos usando el puerto' });
          return;
        }
        
        // Matar todos los procesos
        const killPromises = processes.map(proc => {
          return new Promise((resolveKill) => {
            if (process.platform === 'win32') {
              exec(`taskkill /PID ${proc.pid} /T /F`, (error) => {
                resolveKill({ pid: proc.pid, success: !error });
              });
            } else {
              try {
                process.kill(proc.pid, 'SIGTERM');
                setTimeout(() => {
                  try {
                    process.kill(proc.pid, 'SIGKILL');
                  } catch (e) {
                    // Proceso ya está muerto
                  }
                  resolveKill({ pid: proc.pid, success: true });
                }, 1000);
              } catch (error) {
                resolveKill({ pid: proc.pid, success: false });
              }
            }
          });
        });
        
        const results = await Promise.all(killPromises);
        const killed = results.filter(r => r.success).length;
        
        resolve({ 
          success: true, 
          killed, 
          total: processes.length,
          message: `Se mataron ${killed} de ${processes.length} procesos`
        });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  });

  // Handler para reiniciar un proceso de terminal
  ipcMain.handle('restart-terminal-process', async (event, terminalId) => {
    return ProcessManager.restartProcess(terminalId);
  });

  // Handler para verificar si hay un proceso corriendo
  ipcMain.handle('has-running-process', async (event, terminalId) => {
    return ProcessManager.hasRunningProcess(terminalId);
  });

  // Handler para obtener información del proceso
  ipcMain.handle('get-process-info', async (event, terminalId) => {
    return ProcessManager.getProcessInfo(terminalId);
  });

  // Handler para obtener estadísticas de procesos
  ipcMain.handle('get-process-stats', async () => {
    return ProcessManager.getStats();
  });

  // ========== HANDLERS DE BASE DE DATOS ==========
  
  // Conectar a una base de datos
  ipcMain.handle('db-connect', async (event, config) => {
    try {
      return await DatabaseService.connect(config);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Desconectar de una base de datos
  ipcMain.handle('db-disconnect', async (event, connectionId) => {
    try {
      await DatabaseService.disconnect(connectionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Ejecutar consulta SQL
  ipcMain.handle('db-execute-query', async (event, connectionId, query) => {
    try {
      return await DatabaseService.executeQuery(connectionId, query);
    } catch (error) {
      throw error; // Lanzar error para que el renderer lo maneje
    }
  });

  // Obtener tablas
  ipcMain.handle('db-get-tables', async (event, connectionId) => {
    try {
      return await DatabaseService.getTables(connectionId);
    } catch (error) {
      return { error: error.message };
    }
  });

  // Obtener columnas de una tabla
  ipcMain.handle('db-get-table-columns', async (event, connectionId, schema, tableName) => {
    try {
      return await DatabaseService.getTableColumns(connectionId, schema, tableName);
    } catch (error) {
      return { error: error.message };
    }
  });

  // Obtener procedimientos almacenados
  ipcMain.handle('db-get-stored-procedures', async (event, connectionId) => {
    try {
      return await DatabaseService.getStoredProcedures(connectionId);
    } catch (error) {
      return { error: error.message };
    }
  });

  // Obtener conexiones guardadas
  ipcMain.handle('db-get-saved-connections', async () => {
    try {
      return DatabaseService.getSavedConnections();
    } catch (error) {
      return [];
    }
  });

  // Guardar conexión
  ipcMain.handle('db-save-connection', async (event, connectionData) => {
    try {
      return DatabaseService.saveConnection(connectionData);
    } catch (error) {
      return { error: error.message };
    }
  });

  // Eliminar conexión guardada
  ipcMain.handle('db-delete-connection', async (event, connectionId) => {
    try {
      DatabaseService.deleteConnection(connectionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler para verificar si Docker está instalado
  ipcMain.handle('check-docker-installed', async () => {
    return new Promise((resolve) => {
      // Ejecutar docker --version para verificar si está instalado
      exec('docker --version', { timeout: 5000 }, (error, stdout, stderr) => {
        if (error || !stdout) {
          resolve({ installed: false, version: null, error: error?.message || 'Docker no encontrado' });
          return;
        }
        
        // Extraer versión del output (ej: "Docker version 24.0.7, build afdd53b")
        const versionMatch = stdout.match(/Docker version ([\d.]+)/);
        const version = versionMatch ? versionMatch[1] : stdout.trim();
        
        // Verificar si Docker daemon está corriendo
        exec('docker info', { timeout: 5000 }, (error2, stdout2, stderr2) => {
          const isRunning = !error2 && stdout2 && !stdout2.includes('Cannot connect');
          resolve({ 
            installed: true, 
            version: version,
            daemonRunning: isRunning,
            output: stdout.trim()
          });
        });
      });
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (windows.length > 0) {
      // Mostrar todas las ventanas
      windows.forEach(win => {
        if (win && !win.isDestroyed()) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      });
    }
  });
});

// Desconectar todas las conexiones de base de datos al cerrar
app.on('before-quit', async () => {
  try {
    await DatabaseService.disconnectAll();
  } catch (error) {
    console.error('Error desconectando bases de datos:', error);
  }
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // NO cerrar la aplicación, mantenerla en segundo plano para notificaciones
  // Solo cerrar si isQuitting es true (usuario eligió "Salir" desde el menú)
  if (isQuitting) {
    // Desregistrar atajos globales antes de cerrar
    const { globalShortcut } = require('electron');
    globalShortcut.unregisterAll();
    app.quit();
  }
  // En macOS, las aplicaciones normalmente permanecen activas
  // En Windows/Linux, mantenemos la app corriendo en segundo plano
});

// Manejar el protocolo de archivos (opcional, para abrir archivos con la app)
app.on('open-file', (event, path) => {
  event.preventDefault();
  // Aquí puedes manejar la apertura de archivos si lo necesitas
});
