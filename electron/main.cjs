const { app, BrowserWindow, shell, Tray, Menu, nativeImage, Notification } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

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
let tray = null;
let isQuitting = false;

// Prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Si ya hay una instancia corriendo, enfocar esa ventana y salir
  app.quit();
} else {
  app.on('second-instance', () => {
    // Si se intenta abrir otra instancia, enfocar la ventana existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    } else {
      createWindow();
    }
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
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Ocultar',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
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
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

function createWindow() {
  // Si ya existe una ventana, solo enfocarla
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }
  const iconPath = getIconPath();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: iconPath, // Icono de la aplicación
    show: false, // No mostrar hasta que esté listo
    autoHideMenuBar: true, // Ocultar barra de menú por defecto
  });

  // Cargar la aplicación
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // En desarrollo, cargar desde Vite
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar desde los archivos estáticos
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('Cargando HTML desde:', htmlPath);
    console.log('__dirname:', __dirname);
    
    // Usar loadFile que maneja mejor las rutas relativas
    mainWindow.loadFile(htmlPath).catch(err => {
      console.error('Error cargando HTML:', err);
      // Intentar con loadURL como fallback
      const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
      console.log('Intentando con loadURL:', fileUrl);
      mainWindow.loadURL(fileUrl).catch(err2 => {
        console.error('Error con loadURL:', err2);
      });
    });
    
    // Deshabilitar DevTools en producción
    // Bloquear F12 y Ctrl+Shift+I
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        event.preventDefault();
      }
    });
    
    // Deshabilitar el menú contextual (clic derecho -> Inspeccionar)
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
    
    // Escuchar errores de carga
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Error cargando:', errorCode, errorDescription, validatedURL);
    });
    
    // Escuchar cuando la página termine de cargar
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Página cargada correctamente');
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Minimizar a la bandeja en lugar de cerrar
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
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
  
  createWindow();
  createTray();
  
  // Configurar IPC para recibir mensajes del renderer
  const { ipcMain } = require('electron');
  ipcMain.on('show-native-notification', (event, title, body, eventId) => {
    showNativeNotification(title, body, eventId);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // NO cerrar la aplicación, mantenerla en segundo plano para notificaciones
  // Solo cerrar si isQuitting es true (usuario eligió "Salir" desde el menú)
  if (isQuitting) {
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
