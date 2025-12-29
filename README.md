# Notion Local Editor

Editor de Notion completamente offline que funciona sin internet, sin login y guarda todo localmente en archivos JSON y carpetas del sistema.

## Características

- ✅ **Sin login** - Acceso directo al editor
- ✅ **Funciona offline** - No requiere conexión a internet
- ✅ **Almacenamiento local** - Guarda en archivos JSON y carpetas del sistema
- ✅ **Dashboard de configuración** - Selecciona dónde guardar tus archivos
- ✅ **Mismas funcionalidades** - Todas las características del editor original de Notion

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build
```

## Configuración

1. Al iniciar la aplicación, verás el dashboard de configuración
2. Activa "Guardar archivos localmente en el sistema de archivos"
3. Selecciona la carpeta donde quieres guardar tus archivos
4. El sistema creará automáticamente:
   - `data/` - Para archivos JSON de páginas
   - `files/` - Para imágenes y archivos adjuntos

## Estructura de Archivos

```
notion-local-editor/
├── src/
│   ├── components/
│   │   ├── ConfigDashboard.jsx      # Dashboard de configuración
│   │   └── LocalEditor.jsx          # Editor adaptado sin Firebase
│   ├── services/
│   │   └── LocalStorageService.js  # Servicio de almacenamiento local
│   ├── extensions/                  # Extensiones de TipTap
│   │   ├── TablaNotionNode.js
│   │   ├── Toggle.js
│   │   ├── SlashCommand.js
│   │   └── ...
│   ├── App.jsx                      # App principal sin login
│   ├── main.jsx                     # Punto de entrada
│   └── index.css                    # Estilos
├── package.json
└── vite.config.js
```

## Uso

1. **Primera vez**: Configura la carpeta de almacenamiento
2. **Crear página**: Haz clic en "Nueva" para crear una nueva página
3. **Editar**: Escribe normalmente, el contenido se guarda automáticamente
4. **Subir archivos**: Usa los botones para insertar imágenes o archivos

## Notas Técnicas

- Usa la **File System Access API** del navegador para acceso al sistema de archivos
- Si la API no está disponible, usa **localStorage/IndexedDB** como fallback
- Los archivos se guardan en formato JSON
- Las imágenes se guardan en la carpeta `files/` y se referencian relativamente

## Requisitos del Navegador

- Chrome 86+ (recomendado para File System Access API)
- Edge 86+
- Opera 72+

Para otros navegadores, se usará el almacenamiento del navegador como fallback.

## Ejecutar con Electron

La aplicación puede ejecutarse como aplicación de escritorio usando Electron.

### Modo Desarrollo

Para probar la aplicación con Electron en modo desarrollo:

```bash
# Asegúrate de tener el servidor de desarrollo corriendo en otra terminal
npm run dev

# En otra terminal, ejecuta Electron
npm run electron:dev
```

### Generar Ejecutable para Windows

Para crear un instalador ejecutable de Windows (.exe) que no requiere Node.js:

```bash
# 1. Instalar todas las dependencias (incluye Electron)
npm install

# 2. Generar el ejecutable
npm run electron:build:win
```

El instalador se generará en:
```
release/Notion Local Editor Setup 1.0.0.exe
```

**Características del ejecutable:**
- ✅ No requiere Node.js instalado
- ✅ Instalación simple (solo hacer doble clic)
- ✅ Auto-inicio al iniciar Windows
- ✅ Crea accesos directos en escritorio y menú de inicio
- ✅ Desinstalación fácil desde el Panel de Control

**Distribución:**
1. Comparte el archivo `.exe` generado
2. El usuario solo necesita hacer doble clic e instalar
3. La aplicación se ejecutará automáticamente al iniciar Windows

**Nota:** El instalador es grande (~100-150 MB) porque incluye Node.js y todas las dependencias empaquetadas.

## Desarrollo

Este proyecto está basado en el componente `EditorNotionLike` del proyecto principal, pero adaptado para:
- Eliminar dependencias de Firebase
- Usar almacenamiento local
- Eliminar sistema de autenticación
- Agregar dashboard de configuración

## 📋 Guía de Columnas y Fórmulas para Gestión de Tareas

### Columnas Base para Controlar el Estado y Progreso

#### Columnas Principales (Editable por el usuario)

**1. Progress (Número)**
- **Qué es**: Progreso actual de la tarea (0-100 o cualquier número)
- **Cómo usarla**: Ingresa el valor numérico del progreso actual
- **Ejemplo**: Si una tarea está al 75% completa, ingresa `75`

**2. Objective (Número)**
- **Qué es**: Meta u objetivo total de la tarea
- **Cómo usarla**: Ingresa el valor objetivo (normalmente 100)
- **Ejemplo**: Si quieres que la tarea se complete al 100%, ingresa `100`

**3. Type (Tags)**
- **Qué es**: Estado de la tarea
- **Opciones disponibles**:
  - `TO DO` (Gris) - Tarea pendiente
  - `IN PROGRESS` (Azul) - Tarea en progreso
  - `DONE` (Verde) - Tarea completada
  - `STOPPED` (Rojo) - Tarea detenida
  - `REOPENED` (Naranja) - Tarea reabierta
  - `UNDER REVIEW` (Morado) - Tarea en revisión
  - `QA` (Cyan) - Tarea en QA
- **Cómo usarla**: Haz clic en la columna Type y selecciona el estado correspondiente

**4. Time Spent (Número)**
- **Qué es**: Tiempo gastado en horas
- **Cómo usarla**: Ingresa las horas trabajadas
- **Ejemplo**: Si trabajaste 8 horas, ingresa `8`

**5. Time Estimated (Número)**
- **Qué es**: Tiempo estimado en horas
- **Cómo usarla**: Ingresa las horas estimadas para completar la tarea
- **Ejemplo**: Si estimas 16 horas, ingresa `16`

**6. Priority (Tags)**
- **Qué es**: Prioridad de la tarea
- **Opciones disponibles**:
  - `Critical` (Rojo) - Prioridad crítica
  - `Medium` (Amarillo) - Prioridad media
  - `Low` (Verde) - Prioridad baja
- **Cómo usarla**: Haz clic en la columna Priority y selecciona la prioridad

### 🧮 Fórmulas Calculadas (Automáticas)

**1. Percent (Fórmula)**
- **Qué calcula**: Porcentaje de progreso basado en Progress/Objective
- **Fórmula**: `if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))`
- **Qué muestra**:
  - Si Progress >= Objective: `✅` (completado)
  - Si Progress = 0 y hay Objective: `0%`
  - Si hay progreso: `➖➖ 75%` (barras visuales + porcentaje)
- **Ejemplo**: Si Progress=75 y Objective=100, muestra `➖➖➖ 75%`

**2. Percent Total (Fórmula)**
- **Qué calcula**: Porcentaje de tiempo usado vs tiempo estimado
- **Fórmula**: `if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")`
- **Qué muestra**: Porcentaje de tiempo gastado
- **Ejemplo**: Si Time Spent=12 y Time Estimated=16, muestra `75%`

**3. missing percentage (Fórmula)**
- **Qué calcula**: Porcentaje faltante (solo si la tarea NO está DONE)
- **Fórmula**: `if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%"))`
- **Qué muestra**:
  - Si Type = "DONE": `0`
  - Si Type != "DONE": Porcentaje de tiempo usado
- **Ejemplo**: Si Type="IN PROGRESS", Time Spent=8, Time Estimated=16, muestra `50%`

### 🔄 Cómo Cambiar el Estado de una Tarea

**Para ver el progreso:**

1. **Actualiza Progress**: 
   - Edita la columna "Progress" con el valor actual (ej: 50, 75, 100)
   - La columna "Percent" se actualizará automáticamente mostrando el porcentaje

2. **Actualiza Type**:
   - Haz clic en la columna "Type"
   - Selecciona el estado correspondiente:
     - `TO DO` → Tarea pendiente
     - `IN PROGRESS` → Tarea en progreso
     - `DONE` → Tarea completada
     - `QA` → Tarea en pruebas
     - `UNDER REVIEW` → Tarea en revisión

3. **Actualiza Time Spent**:
   - Edita la columna "Time Spent" con las horas trabajadas
   - La columna "Percent Total" se actualizará automáticamente

**Flujo de trabajo típico:**

```
1. Crear tarea → Type: "TO DO", Progress: 0
2. Empezar trabajo → Type: "IN PROGRESS", Progress: 25
3. Avanzar → Type: "IN PROGRESS", Progress: 50, Time Spent: 8
4. Casi terminado → Type: "IN PROGRESS", Progress: 90, Time Spent: 14
5. Completar → Type: "DONE", Progress: 100, Time Spent: 16
```

### 📊 Columnas Adicionales (Opcionales)

- **Start Date**: Fecha de inicio
- **End Date**: Fecha de fin
- **Created**: Fecha de creación
- **Tasks Completed**: Número de subtareas completadas
- **Total Tasks**: Número total de subtareas
- **Assign**: Personas asignadas (tags)
- **Tags**: Etiquetas adicionales (tags)

### 💡 Consejos

1. **Siempre establece Objective**: Para que las fórmulas funcionen correctamente, asegúrate de tener un valor en "Objective" (normalmente 100)

2. **Actualiza Type según el estado real**: La columna Type es la más importante para el seguimiento visual

3. **Time Spent y Time Estimated**: Úsalos para tracking de tiempo. La fórmula "Percent Total" te mostrará si estás dentro del tiempo estimado

4. **Priority**: Úsala para filtrar y ordenar tareas importantes

5. **Las fórmulas se calculan automáticamente**: No necesitas editarlas manualmente, solo actualiza las columnas base (Progress, Objective, Time Spent, Time Estimated, Type)

