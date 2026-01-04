# Instrucciones para Generar el Ejecutable

Este documento explica cómo generar el ejecutable instalable de la aplicación Notion Local Editor.

## Requisitos Previos

1. **Node.js** instalado (versión 18 o superior)
2. **npm** (viene con Node.js)
3. Todas las dependencias instaladas: `npm install`

## Pasos para Generar el Ejecutable

### 1. Instalar Dependencias (si no están instaladas)

```bash
npm install
```

### 2. Generar el Ejecutable para Windows

Ejecuta el siguiente comando:

```bash
npm run electron:build:win
```

Este comando:
- Compila la aplicación React con Vite
- Empaqueta todo con Electron
- Genera un instalador NSIS para Windows

### 3. Ubicación del Ejecutable

Una vez completado el proceso, encontrarás el instalador en:

```
release/Notion Local Editor Setup 1.0.0.exe
```

**Ruta completa:** `C:\projects\san\notion-local-editor\release\Notion Local Editor Setup 1.0.0.exe`

### 4. Tamaño del Ejecutable

El archivo instalador tiene aproximadamente **87-92 MB** porque incluye:
- Electron runtime
- Node.js
- Todas las dependencias de la aplicación
- La aplicación compilada

## Características del Instalador

- ✅ No requiere Node.js instalado en el sistema destino
- ✅ Permite elegir el directorio de instalación
- ✅ Crea accesos directos en el escritorio y menú de inicio
- ✅ Fácil desinstalación desde el Panel de Control
- ✅ Nombre del acceso directo: "Notion Local Editor"

## Distribución

1. Comparte el archivo `Notion Local Editor Setup 1.0.0.exe` con los usuarios
2. Los usuarios solo necesitan ejecutar el archivo `.exe`
3. Seguir el asistente de instalación
4. La aplicación estará lista para usar

## Solución de Problemas

### Error: "El cliente no dispone de un privilegio requerido"

Si ves este error relacionado con `winCodeSign`, no es crítico. El ejecutable se generará de todas formas. Este error ocurre cuando Windows no permite crear enlaces simbólicos, pero no afecta la funcionalidad del instalador.

### El proceso tarda mucho

Es normal. El proceso de empaquetado puede tomar varios minutos (2-5 minutos dependiendo de tu sistema) porque:
- Compila toda la aplicación
- Descarga dependencias de Electron si es necesario
- Crea el instalador NSIS

### El ejecutable no se genera

1. Verifica que todas las dependencias estén instaladas: `npm install`
2. Asegúrate de estar en la carpeta raíz del proyecto
3. Revisa que no haya errores en la compilación (el comando mostrará errores si los hay)

## Comandos Útiles

```bash
# Desarrollo (no genera ejecutable)
npm run dev

# Compilar solo la aplicación (sin Electron)
npm run build

# Generar ejecutable para Windows
npm run electron:build:win

# Generar ejecutable (multi-plataforma, usa configuración por defecto)
npm run electron:build

# Ejecutar Electron en modo desarrollo (requiere npm run dev en otra terminal)
npm run electron:dev
```

## Configuración del Build

La configuración del build se encuentra en `package.json` bajo la sección `"build"`. Los aspectos más importantes son:

- **Target**: NSIS (instalador de Windows)
- **Architecture**: x64 (64 bits)
- **Icon**: `build/icon.ico`
- **Output**: Carpeta `release/`
- **Signing**: Deshabilitado (no requiere certificado)

## Notas Importantes

- El ejecutable incluye toda la aplicación, no requiere conexión a internet para funcionar
- Los datos de los usuarios se guardan localmente en la carpeta que elijan durante la configuración
- Cada vez que generes un nuevo ejecutable, reemplaza el anterior si vas a distribuir una nueva versión
- El número de versión se puede cambiar en `package.json` en el campo `"version"`

## Actualizar la Versión

Para cambiar la versión del instalador:

1. Edita `package.json`
2. Cambia el campo `"version"` (ejemplo: `"1.0.0"` → `"1.0.1"`)
3. Genera el ejecutable nuevamente: `npm run electron:build:win`
4. El nuevo instalador tendrá el nombre: `Notion Local Editor Setup 1.0.1.exe`



