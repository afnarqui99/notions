# ⌨️ Comandos de Teclado y Guardado de Configuración en Visual Code

Este documento explica cómo funciona el sistema de comandos de teclado y el guardado automático de configuración en el componente Visual Code de la aplicación.

## 📋 Tabla de Contenidos

- [Comandos de Teclado Disponibles](#comandos-de-teclado-disponibles)
- [Sistema de Guardado Automático](#sistema-de-guardado-automático)
- [Configuración Guardada](#configuración-guardada)
- [Ubicación de los Archivos](#ubicación-de-los-archivos)
- [Cómo Funciona Internamente](#cómo-funciona-internamente)
- [Personalización](#personalización)
- [Solución de Problemas](#solución-de-problemas)
- [Notas Técnicas](#notas-técnicas)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Referencias](#referencias)
- [Preguntas Frecuentes](#preguntas-frecuentes)

---

## ⌨️ Comandos de Teclado Disponibles

El componente Visual Code soporta los siguientes atajos de teclado:

### Guardado de Archivos

| Comando | Acción | Descripción |
|---------|--------|-------------|
| `Ctrl + S` (Windows/Linux)<br>`Cmd + S` (Mac) | Guardar archivo | Guarda el archivo actualmente activo en el editor |

**Ejemplo de uso:**
- Abre un archivo en el editor
- Realiza cambios en el código
- Presiona `Ctrl + S` para guardar los cambios
- El archivo se guarda automáticamente en el sistema de archivos

### Control de Zoom

| Comando | Acción | Descripción |
|---------|--------|-------------|
| `Ctrl + +` o `Ctrl + =` | Aumentar zoom | Aumenta el tamaño de fuente del editor (máximo 32px) |
| `Ctrl + -` | Reducir zoom | Reduce el tamaño de fuente del editor (mínimo 8px) |

**Ejemplo de uso:**
- Presiona `Ctrl + +` varias veces para aumentar el tamaño del texto
- Presiona `Ctrl + -` para reducir el tamaño del texto
- El tamaño se guarda automáticamente y se aplica a todos los archivos del proyecto

### Notas Importantes

- Los comandos solo funcionan cuando el editor Visual Code está activo
- El zoom se aplica globalmente a todo el editor, no por archivo
- Los cambios se guardan automáticamente en la configuración del proyecto

---

## 💾 Sistema de Guardado Automático

El componente Visual Code implementa un sistema de guardado automático que preserva la configuración del proyecto entre sesiones.

### ¿Qué se Guarda Automáticamente?

1. **Configuración del Proyecto**
   - Ruta del proyecto (`projectPath`)
   - Título personalizado del proyecto (`projectTitle`)
   - Color de fondo del proyecto (`projectColor`)
   - Tema de colores seleccionado (`theme`)
   - Tamaño de fuente (`fontSize`)

2. **Estado del Editor**
   - Archivos abiertos (`openFiles`)
   - Archivo activo actual (`activeFile`)
   - Contenido de los archivos editados (`fileContents`)

3. **Extensiones Habilitadas**
   - Error Lens
   - Better Comments
   - ES7+ React/Redux snippets
   - React Simple Snippets
   - Auto Close Tag
   - Paste JSON as Code
   - Backticks
   - Bearded Icons

### Frecuencia de Guardado

- **Configuración del proyecto**: Se guarda automáticamente cada vez que cambia cualquier configuración
- **Contenido de archivos**: Se guarda en tiempo real mientras editas (cada cambio se sincroniza)
- **Estado del editor**: Se guarda cuando cambias de archivo o cierras archivos

---

## 📁 Ubicación de los Archivos

### Estructura de Almacenamiento

Los archivos de configuración se guardan en:

```
[Directorio Base]/data/visual-code-projects/
  └── visual-code-project-[ID_PROYECTO].json
```

### Formato del ID del Proyecto

El ID del proyecto se genera a partir de la ruta del proyecto, reemplazando caracteres especiales:

```javascript
const projectId = projectPath.replace(/[<>:"/\\|?*]/g, '_');
```

**Ejemplo:**
- Ruta: `C:\Users\Usuario\MiProyecto`
- ID: `C_Users_Usuario_MiProyecto`
- Archivo: `visual-code-project-C_Users_Usuario_MiProyecto.json`

### Formato del Archivo JSON

```json
{
  "projectPath": "C:\\Users\\Usuario\\MiProyecto",
  "title": "Mi Proyecto Personalizado",
  "color": "#1e1e1e",
  "theme": "cursorDark",
  "fontSize": 14,
  "extensions": {
    "errorLens": true,
    "betterComments": true,
    "es7ReactRedux": true,
    "reactSimpleSnippets": true,
    "autoCloseTag": true,
    "pasteJsonAsCode": true,
    "backticks": true,
    "tokyoNight": false,
    "beardedIcons": true
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 Cómo Funciona Internamente

### 1. Inicialización del Componente

Cuando se crea un bloque Visual Code:

```javascript
// El componente carga la configuración guardada
useEffect(() => {
  const loadProjectConfig = async () => {
    if (!projectPath) return;
    
    const projectId = projectPath.replace(/[<>:"/\\|?*]/g, '_');
    const config = await LocalStorageService.readJSONFile(
      `visual-code-project-${projectId}.json`,
      'data/visual-code-projects'
    );
    
    if (config) {
      // Aplicar configuración guardada
      setProjectTitle(config.title);
      setProjectColor(config.color);
      setTheme(config.theme);
      setFontSize(parseInt(config.fontSize));
      setExtensions(config.extensions);
    }
  };
  
  if (projectPath) {
    loadProjectConfig();
  }
}, [projectPath]);
```

### 2. Guardado Automático de Configuración

Cada vez que cambia la configuración, se guarda automáticamente:

```javascript
useEffect(() => {
  const saveProjectConfig = async () => {
    if (!projectPath) return;
    
    const config = {
      projectPath,
      title: projectTitle,
      color: projectColor,
      theme,
      fontSize,
      extensions,
      lastUpdated: new Date().toISOString()
    };
    
    const projectId = projectPath.replace(/[<>:"/\\|?*]/g, '_');
    await LocalStorageService.saveJSONFile(
      `visual-code-project-${projectId}.json`,
      config,
      'data/visual-code-projects'
    );
  };
  
  if (projectPath) {
    saveProjectConfig();
  }
}, [projectPath, projectTitle, projectColor, theme, fontSize, extensions]);
```

### 3. Manejo de Comandos de Teclado

Los comandos de teclado se registran globalmente:

```javascript
useEffect(() => {
  const handleKeyDown = (e) => {
    // Guardar archivo: Ctrl+S / Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && activeFile) {
      e.preventDefault();
      saveFile(activeFile);
    }
    
    // Zoom in: Ctrl + / Ctrl =
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=') && !e.shiftKey) {
      e.preventDefault();
      setFontSize(prev => Math.min(prev + 1, 32));
    }
    
    // Zoom out: Ctrl -
    if ((e.ctrlKey || e.metaKey) && e.key === '-') {
      e.preventDefault();
      setFontSize(prev => Math.max(prev - 1, 8));
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [activeFile]);
```

### 4. Sincronización con Atributos del Nodo

El componente también sincroniza su estado con los atributos del nodo de TipTap:

```javascript
useEffect(() => {
  updateAttributes({
    projectPath,
    openFiles: JSON.stringify(openFiles),
    activeFile,
    fileContents: JSON.stringify(fileContents),
    fontSize: fontSize.toString(),
    theme,
    projectTitle,
    projectColor,
    extensions: JSON.stringify(extensions),
  });
}, [projectPath, openFiles, activeFile, fileContents, fontSize, theme, projectTitle, projectColor, extensions]);
```

---

## 🎨 Personalización

### Cambiar el Tamaño de Fuente

**Método 1: Usando comandos de teclado**
- `Ctrl + +` para aumentar
- `Ctrl + -` para reducir

**Método 2: Usando los botones de zoom**
- Haz clic en los botones `+` y `-` en la barra de herramientas
- El tamaño actual se muestra entre los botones

**Método 3: Editar directamente el archivo JSON**
1. Navega a `[Directorio Base]/data/visual-code-projects/`
2. Abre el archivo JSON de tu proyecto
3. Modifica el valor de `fontSize` (entre 8 y 32)
4. Guarda el archivo
5. Recarga la aplicación

### Cambiar el Tema

1. Haz clic en el icono de paleta 🎨 en la barra de herramientas
2. Selecciona un tema de la lista
3. El tema se guarda automáticamente

### Cambiar Extensiones

1. Haz clic en la pestaña "EXTENSIONES" en el sidebar
2. Activa o desactiva las extensiones que desees
3. Los cambios se guardan automáticamente

### Cambiar el Color de Fondo

1. Haz clic en el selector de color en la barra de herramientas
2. Selecciona un color predefinido o usa el selector personalizado
3. El color se guarda automáticamente

---

## 🔍 Solución de Problemas

### Los comandos de teclado no funcionan

**Posibles causas:**
1. El editor no está enfocado
2. Hay un conflicto con otro componente
3. El navegador está bloqueando el evento

**Solución:**
- Haz clic dentro del editor para enfocarlo
- Verifica que no haya otros elementos capturando los eventos de teclado
- Prueba en modo Electron (versión instalada) en lugar del navegador

### La configuración no se guarda

**Posibles causas:**
1. No hay ruta de proyecto seleccionada
2. Error de permisos en el sistema de archivos
3. El servicio de almacenamiento no está disponible

**Solución:**
1. Asegúrate de haber seleccionado una carpeta de proyecto
2. Verifica los permisos del directorio
3. Revisa la consola del navegador para errores

### El zoom no se aplica

**Posibles causas:**
1. El editor no se ha reinicializado
2. Hay un conflicto con estilos CSS

**Solución:**
- Cambia de archivo y vuelve al archivo original
- Recarga la página
- Verifica que el tamaño de fuente esté entre 8 y 32

---

## 📝 Notas Técnicas

### Dependencias

- **LocalStorageService**: Servicio para guardar archivos JSON en el sistema de archivos
- **CodeMirror**: Editor de código que maneja el contenido
- **TipTap**: Framework de editor que maneja los nodos del documento

### Limitaciones

1. **Permisos del Navegador**: En modo navegador, necesitas permisos del File System Access API
2. **Persistencia**: Los DirectoryHandle pueden perderse al cerrar el navegador (depende del navegador)
3. **Tamaño de Archivos**: Archivos muy grandes pueden afectar el rendimiento

### Mejores Prácticas

1. **Guarda frecuentemente**: Usa `Ctrl + S` regularmente
2. **Organiza tus proyectos**: Usa títulos descriptivos para tus proyectos
3. **Backup**: Haz copias de seguridad de tus archivos de configuración
4. **Extensiones**: Solo activa las extensiones que realmente necesitas

---

## 🚀 Ejemplos de Uso

### Ejemplo 1: Configurar un Nuevo Proyecto

1. Crea un bloque Visual Code (`/visualcode`)
2. Haz clic en "Abrir Carpeta"
3. Selecciona la carpeta de tu proyecto
4. Personaliza el título, color y tema
5. La configuración se guarda automáticamente

### Ejemplo 2: Restaurar Configuración de un Proyecto

1. Abre un bloque Visual Code existente
2. Si el proyecto tiene configuración guardada, se carga automáticamente
3. Todos tus archivos abiertos, tema y zoom se restauran

### Ejemplo 3: Sincronizar Configuración entre Sesiones

1. Configura tu proyecto (tema, zoom, extensiones)
2. Cierra la aplicación
3. Abre la aplicación nuevamente
4. Abre el mismo proyecto
5. Toda tu configuración estará restaurada

---

## 📚 Referencias

- **Código fuente**: `src/components/VisualCodeBlock.jsx`
- **Servicio de almacenamiento**: `src/services/LocalStorageService.js`
- **Nodo de TipTap**: `src/extensions/VisualCodeNode.js`

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar comandos de teclado personalizados?**  
R: Actualmente no, pero puedes modificar el código en `VisualCodeBlock.jsx` para agregar tus propios comandos.

**P: ¿Dónde se guardan los archivos editados?**  
R: Los archivos se guardan en su ubicación original en el sistema de archivos, no en la configuración.

**P: ¿Puedo compartir mi configuración con otros?**  
R: Sí, puedes copiar el archivo JSON de configuración y compartirlo. Solo asegúrate de actualizar la ruta del proyecto.

**P: ¿Qué pasa si elimino el archivo de configuración?**  
R: El proyecto volverá a usar los valores por defecto, pero no perderás los archivos del proyecto.

---

**Última actualización**: Enero 2024  
**Versión**: 1.0.0

