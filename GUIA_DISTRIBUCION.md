# 📦 Guía de Distribución - Generar ZIP con Ejecutable

Esta guía explica cómo generar un archivo ZIP con el ejecutable de la aplicación para distribución.

## 🎯 Opciones de Distribución

### Opción 1: Instalador NSIS (Actual)
El sistema actual genera un instalador `.exe` (NSIS) en la carpeta `release/`. Este es el método recomendado para usuarios finales.

### Opción 2: ZIP Portable (Recomendado para distribución)
Puedes generar un ZIP que contiene el ejecutable portable sin necesidad de instalación.

---

## 📋 Requisitos Previos

1. **Node.js** instalado (v18 o superior)
2. **npm** o **yarn** instalado
3. Todas las dependencias instaladas: `npm install`

---

## 🚀 Pasos para Generar ZIP con Ejecutable

### Paso 1: Construir la Aplicación

```bash
# Construir la aplicación web (Vite)
npm run build

# Esto generará los archivos en la carpeta dist/
```

### Paso 2: Generar Ejecutable para Windows

```bash
# Generar instalador NSIS (actual)
npm run electron:build:win

# O usar el comando genérico
npm run electron:build
```

Esto generará el instalador en:
```
release/Notas afnarqui Setup 1.0.0.exe
```

### Paso 3: Generar ZIP Portable (Nueva Configuración)

Para generar un ZIP portable en lugar de (o además de) el instalador, necesitas modificar `package.json`:

#### Opción A: Agregar target ZIP al build existente

Modifica la sección `win.target` en `package.json`:

```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    },
    {
      "target": "zip",
      "arch": ["x64"]
    }
  ],
  "icon": "build/icon.ico",
  ...
}
```

Luego ejecuta:
```bash
npm run electron:build:win
```

Esto generará:
- `release/Notas afnarqui Setup 1.0.0.exe` (instalador)
- `release/Notas afnarqui 1.0.0-win.zip` (portable ZIP)

#### Opción B: Script personalizado para solo ZIP

Crea un script en `package.json`:

```json
{
  "scripts": {
    "electron:build:zip": "npm run build && electron-builder --win --config.win.target=zip"
  }
}
```

Luego ejecuta:
```bash
npm run electron:build:zip
```

---

## 📁 Estructura del ZIP Generado

El ZIP portable contendrá:

```
Notas afnarqui-win-x64/
├── Notas afnarqui.exe          # Ejecutable principal
├── resources/
│   ├── app.asar                # Aplicación empaquetada
│   └── build/
│       └── icon.ico            # Icono
├── locales/                    # Traducciones (si aplica)
└── [archivos DLL necesarios]   # Dependencias del sistema
```

---

## 🔧 Configuración Recomendada para Distribución

### 1. Modificar `package.json` para generar ambos formatos

```json
{
  "build": {
    "appId": "com.notion.local.editor",
    "productName": "Notas afnarqui",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "zip",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Notas afnarqui"
    }
  }
}
```

### 2. Script de Build Completo

Agrega estos scripts a `package.json`:

```json
{
  "scripts": {
    "build:all": "npm run build && electron-builder --win",
    "build:installer": "npm run build && electron-builder --win --config.win.target=nsis",
    "build:zip": "npm run build && electron-builder --win --config.win.target=zip",
    "build:both": "npm run build && electron-builder --win --config.win.target=nsis --config.win.target=zip"
  }
}
```

---

## 🎯 Proceso Completo Recomendado

### Para Desarrollo y Testing:

```bash
# 1. Construir aplicación web
npm run build

# 2. Generar ejecutable portable (más rápido para testing)
npm run electron:build:zip

# Resultado: release/Notas afnarqui 1.0.0-win-x64.zip
```

### Para Distribución Final:

```bash
# 1. Asegurarse de tener la última versión en package.json
# 2. Construir ambos formatos
npm run build:both

# Resultado:
# - release/Notas afnarqui Setup 1.0.0.exe (instalador)
# - release/Notas afnarqui 1.0.0-win-x64.zip (portable)
```

---

## 📤 Distribuir el ZIP

### Opción 1: Subir a Servidor Web

1. Sube el archivo ZIP a tu servidor web
2. Crea una página de descarga con enlace directo
3. Ejemplo: `https://tudominio.com/descargas/notas-afnarqui.zip`

### Opción 2: Compartir en Drive/Dropbox

1. Sube el ZIP a Google Drive, Dropbox, OneDrive, etc.
2. Genera un enlace de descarga público
3. Comparte el enlace con los usuarios

### Opción 3: Plataforma de Distribución

- **GitHub Releases**: Sube el ZIP como release en GitHub
- **SourceForge**: Plataforma gratuita para proyectos de software
- **MediaFire**: Servicio de almacenamiento para archivos grandes

---

## 🔍 Verificar el ZIP Antes de Distribuir

### Checklist:

- [ ] El ZIP se puede extraer sin errores
- [ ] El ejecutable `.exe` funciona al hacer doble clic
- [ ] La aplicación se inicia correctamente
- [ ] Los iconos se muestran correctamente
- [ ] El tamaño del ZIP es razonable (< 200MB)
- [ ] No hay errores en la consola al iniciar

### Probar el Ejecutable:

1. Extrae el ZIP en una carpeta temporal
2. Ejecuta `Notas afnarqui.exe`
3. Verifica que:
   - La aplicación se abre
   - Puedes crear páginas
   - Puedes guardar datos
   - Todos los comandos funcionan

---

## 🐛 Solución de Problemas

### Error: "electron-builder no encontrado"

```bash
npm install --save-dev electron-builder
```

### Error: "Icono no encontrado"

Asegúrate de que existe el archivo `build/icon.ico`. Si no existe:
1. Crea o consigue un icono `.ico`
2. Colócalo en `build/icon.ico`
3. Vuelve a ejecutar el build

### El ZIP es muy grande (> 200MB)

Esto es normal para aplicaciones Electron. El tamaño incluye:
- Node.js runtime (~50-70MB)
- Chromium (~100-150MB)
- Tu aplicación (~5-10MB)
- Dependencias nativas

Para reducir tamaño:
- Usa compresión máxima en el ZIP
- Considera usar `asar` (ya incluido)
- Elimina dependencias innecesarias

### El ejecutable no funciona en otra PC

Verifica:
1. La arquitectura (x64) es compatible
2. Windows tiene permisos de ejecución
3. No hay bloqueos de antivirus
4. Se requieren Visual C++ Redistributables (si aplica)

---

## 📝 Notas Adicionales

### Firmado Digital (Opcional pero Recomendado)

Para distribución profesional, considera firmar digitalmente el ejecutable:

1. Obtén un certificado de firma de código (Code Signing Certificate)
2. Configura en `package.json`:

```json
"win": {
  "certificateFile": "path/to/certificate.pfx",
  "certificatePassword": "password",
  "sign": true
}
```

### Auto-actualización (Futuro)

Para implementar actualizaciones automáticas:
- Usa `electron-updater`
- Configura un servidor para hosting de actualizaciones
- Implementa verificación de versiones

---

## 🎉 Resumen Rápido

**Para generar ZIP portable:**
```bash
npm run build
npm run electron:build:zip
```

**Archivo generado:**
```
release/Notas afnarqui 1.0.0-win-x64.zip
```

**Para distribuir:**
1. Sube el ZIP a tu servidor/plataforma
2. Comparte el enlace de descarga
3. Los usuarios extraen y ejecutan `Notas afnarqui.exe`

---

## 📚 Recursos Adicionales

- [Documentación de electron-builder](https://www.electron.build/)
- [Configuración de targets](https://www.electron.build/configuration/win)
- [Opciones de NSIS](https://www.electron.build/configuration/nsis)

