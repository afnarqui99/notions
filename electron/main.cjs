const { app, BrowserWindow, shell, Tray, Menu, nativeImage, Notification, ipcMain, dialog, session } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
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

  // Configurar Content Security Policy mediante webRequest
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isDev = !app.isPackaged;
    
    let csp = '';
    if (isDev) {
      // En desarrollo: CSP más permisivo para Vite HMR
      csp = "default-src 'self' http://localhost:5174 ws://localhost:5174; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5174; " +
            "style-src 'self' 'unsafe-inline' http://localhost:5174; " +
            "img-src 'self' data: blob: http://localhost:5174; " +
            "connect-src 'self' http://localhost:5174 ws://localhost:5174 wss://localhost:5174; " +
            "font-src 'self' data:; " +
            "object-src 'none'; " +
            "media-src 'self'; " +
            "frame-src 'self';";
    } else {
      // En producción: CSP para archivos locales (file://)
      // Permitir recursos desde el mismo origen (file://) y data: blob:
      csp = "default-src 'self' file:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // unsafe-eval necesario para algunos bundles
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: file:; " +
            "connect-src 'self'; " +
            "font-src 'self' data: file:; " +
            "object-src 'none'; " +
            "media-src 'self' file:; " +
            "frame-src 'self';";
    }
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    });
  });

  // Cargar la aplicación
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // En desarrollo, cargar desde Vite
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar desde los archivos estáticos
    // Cuando está empaquetada, __dirname apunta a resources/app.asar/electron o resources/app/electron
    // El dist está en resources/app.asar/dist o resources/app/dist
    let htmlPath;
    
    // Lista de rutas posibles en orden de prioridad
    // app.getAppPath() es más confiable cuando está empaquetado
    const appPath = app.getAppPath();
    const possiblePaths = [
      // Primero intentar desde app.getAppPath() (más confiable cuando está empaquetado)
      path.join(appPath, 'dist', 'index.html'),
      // Luego desde __dirname
      path.join(__dirname, '../dist/index.html'),
      path.join(__dirname, '../../dist/index.html'),
      // Luego desde process.resourcesPath
      path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
      path.join(process.resourcesPath, 'dist', 'index.html'),
      // Rutas alternativas
      path.join(path.dirname(app.getPath('exe')), 'resources', 'app.asar', 'dist', 'index.html'),
      path.join(path.dirname(app.getPath('exe')), 'resources', 'app', 'dist', 'index.html'),
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
      // Mostrar un mensaje de error en la ventana
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; text-align: center;"><h1>Error al cargar la aplicación</h1><p>No se pudo encontrar el archivo index.html</p><p>Por favor, reinstala la aplicación.</p></div>';
        `);
      });
      return;
    }
    
    console.log('Cargando HTML desde:', htmlPath);
    
    // Usar loadFile que maneja mejor las rutas relativas
    mainWindow.loadFile(htmlPath).catch(err => {
      console.error('Error cargando HTML con loadFile:', err);
      // Intentar con loadURL como fallback
      const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
      console.log('Intentando con loadURL:', fileUrl);
      mainWindow.loadURL(fileUrl).catch(err2 => {
        console.error('Error con loadURL:', err2);
        // Mostrar mensaje de error
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow.webContents.executeJavaScript(`
            document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; text-align: center;"><h1>Error al cargar la aplicación</h1><p>Error: ${err2.message}</p><p>Ruta intentada: ${fileUrl}</p></div>';
          `);
        });
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
        // Intentar mostrar información de error en la ventana
        mainWindow.webContents.executeJavaScript(`
          document.body.innerHTML = '<div style="padding: 20px; font-family: Arial; text-align: center; color: red;"><h1>Error al cargar la aplicación</h1><p>Código: ${errorCode}</p><p>Descripción: ${errorDescription}</p><p>URL: ${validatedURL}</p><p>Por favor, revisa la consola para más detalles.</p></div>';
        `).catch(e => console.error('Error ejecutando JavaScript:', e));
      }
    });
    
    // Escuchar errores de consola del renderer
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      if (level === 3) { // Error level
        console.error('[Renderer Error]', message, 'en', sourceId, 'línea', line);
      }
    });
    
    // Escuchar cuando la página termine de cargar
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✓ Página cargada correctamente');
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
  ipcMain.on('show-native-notification', (event, title, body, eventId) => {
    showNativeNotification(title, body, eventId);
  });

  // Handler para ejecutar código
  ipcMain.handle('execute-code', async (event, code, language) => {
    return new Promise((resolve, reject) => {
      let command, args;
      
      if (language === 'python') {
        command = 'python';
        args = ['-c', code];
      } else if (language === 'dotnet') {
        // .NET Core - crear archivo temporal y ejecutar
        const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}.cs`);
        const tempProj = path.join(os.tmpdir(), `temp_proj_${Date.now()}`);
        fs.mkdirSync(tempProj, { recursive: true });
        
        // Crear archivo .csproj
        const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>`;
        fs.writeFileSync(path.join(tempProj, 'Program.csproj'), csprojContent);
        
        // Crear Program.cs con el código
        const programContent = `using System;
using System.Collections.Generic;
using System.Linq;

${code}`;
        fs.writeFileSync(path.join(tempProj, 'Program.cs'), programContent);
        
        command = 'dotnet';
        args = ['run', '--project', tempProj];
        resolve({ error: '⚠️ .NET Core requiere compilación. Usa "Ejecutar Proyecto" con un proyecto .NET completo.' });
        return;
      } else if (language === 'java') {
        // Java - crear archivo temporal y compilar
        const tempFile = path.join(os.tmpdir(), `Main_${Date.now()}.java`);
        const tempDir = path.dirname(tempFile);
        
        // Envolver el código en una clase Main si no está
        let javaCode = code;
        if (!code.includes('public class Main')) {
          javaCode = `public class Main {
    public static void main(String[] args) {
        ${code}
    }
}`;
        }
        
        fs.writeFileSync(tempFile, javaCode);
        
        command = 'javac';
        args = [tempFile];
        resolve({ error: '⚠️ Java requiere compilación. Usa "Ejecutar Proyecto" con un proyecto Java completo.' });
        return;
      } else if (language === 'sqlite') {
        // SQLite - ejecutar consultas
        const dbPath = path.join(os.tmpdir(), 'ejemplos_consola.db');
        const sqlite3 = require('child_process').spawn;
        
        // Crear archivo temporal con las consultas
        const tempSql = path.join(os.tmpdir(), `temp_${Date.now()}.sql`);
        fs.writeFileSync(tempSql, code);
        
        command = 'sqlite3';
        args = [dbPath, '.read', tempSql];
      } else {
        // Node.js por defecto
        // Usar un archivo temporal para evitar problemas con caracteres especiales y permisos en Windows
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
        cwd: os.homedir(), // Usar el directorio home para evitar problemas de permisos
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
        return { type: 'Python', command: 'python main.py' };
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
