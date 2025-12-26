const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

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

function createWindow() {
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
}

// Este método se llamará cuando Electron haya terminado de inicializarse
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  // En macOS, las aplicaciones normalmente permanecen activas hasta que el usuario cierra explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Manejar el protocolo de archivos (opcional, para abrir archivos con la app)
app.on('open-file', (event, path) => {
  event.preventDefault();
  // Aquí puedes manejar la apertura de archivos si lo necesitas
});
