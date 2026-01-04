import { app, BrowserWindow, shell, Tray, Menu, nativeImage, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import AutoLaunch from 'auto-launch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar auto-inicio en Windows
let autoLauncher;
try {
  autoLauncher = new AutoLaunch({
    name: 'Notion Local Editor',
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

function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.ico');
  const icon = nativeImage.createFromPath(iconPath);
  
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
  
  tray.setToolTip('Notion Local Editor');
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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../build/icon.ico'), // Icono de la aplicación (opcional)
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
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
  
  // Escuchar mensajes del renderer para mostrar notificaciones nativas
  mainWindow.webContents.on('ipc-message', (event, channel, ...args) => {
    if (channel === 'show-native-notification') {
      const [title, body, eventId] = args;
      showNativeNotification(title, body, eventId);
    }
  });
}

// Función para mostrar notificación nativa del sistema
function showNativeNotification(title, body, eventId = null) {
  if (!Notification.isSupported()) {
    console.log('Las notificaciones no están soportadas en este sistema');
    return;
  }
  
  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, '../build/icon.ico'),
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

