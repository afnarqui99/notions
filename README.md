# 📝 Notas afnarqui - Editor Local de Notion

Editor de Notion completamente offline que funciona sin internet, sin login y guarda todo localmente en archivos JSON y carpetas del sistema. Ideal para gestión de proyectos, notas, sprints Scrum, tablas dinámicas y más.

## 🐛 Debugger Integrado

La aplicación incluye un **debugger integrado** para proyectos Node.js y Python dentro del Centro de Ejecución. 

👉 **Ver la [Guía Completa del Debugger](DEBUGGER_README.md)** para aprender a configurar y usar el debugger en tus proyectos.

**Resumen rápido:**
- **Node.js**: No requiere configuración adicional, funciona automáticamente
- **Python**: `debugpy` se instala automáticamente si no está disponible
- Coloca breakpoints haciendo clic en el gutter del editor
- Usa los controles del panel Debugger para ejecutar paso a paso

---

## 🚀 Cómo Ejecutar la Aplicación

### Opción 1: Modo Desarrollo (Recomendado para desarrolladores)

#### Prerequisitos
- Node.js v18 o superior instalado
- npm o yarn

#### Pasos:

```bash
# 1. Clonar o descargar el repositorio
git clone [url-del-repositorio]
cd notion-local-editor

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

La aplicación se abrirá en tu navegador en `http://localhost:5173`

**Nota**: En modo desarrollo, los datos se guardan en el almacenamiento del navegador (localStorage/IndexedDB).

---

### Opción 2: Ejecutar como Aplicación de Escritorio (Electron)

#### Modo Desarrollo con Electron:

```bash
# Terminal 1: Iniciar servidor de desarrollo
npm run dev

# Terminal 2: Ejecutar Electron
npm run electron:dev
```

---

### Opción 3: Generar y Ejecutar el Ejecutable (Distribución)

#### Para Generar el Ejecutable:

```bash
# Generar instalador + ZIP portable
npm run electron:build:both

# O solo instalador
npm run electron:build:win

# O solo ZIP portable
npm run electron:build:zip

# linux
npm run electron:build:linux

```

#### Archivos Generados:

Se generarán en la carpeta `release/`:
- **Instalador**: `Notas afnarqui Setup 1.0.0.exe` (para instalación normal)
- **ZIP Portable**: `Notas afnarqui 1.0.0-win-x64.zip` (no requiere instalación)

#### Para Ejecutar el Ejecutable:

**Si instalaste con el .exe:**
1. Busca "Notas afnarqui" en el menú de inicio
2. Haz doble clic en el acceso directo
3. La aplicación se abre automáticamente

**Si usas el ZIP portable:**
1. Extrae el archivo ZIP en cualquier carpeta
2. Ejecuta `Notas afnarqui.exe`
3. ¡Listo! No requiere instalación

---

## 🎯 Qué Puedes Hacer con Esta Aplicación

### 📚 Gestión de Documentos y Notas

- ✅ **Crear páginas ilimitadas** con título, emoji y contenido rico
- ✅ **Editor de texto enriquecido** estilo Notion con formato completo
- ✅ **Organización jerárquica** de páginas (páginas padre/hijo)
- ✅ **Sistema de tags** para categorizar páginas
- ✅ **Búsqueda global** en todas tus páginas, eventos y tablas
- ✅ **Comentarios** en páginas para anotaciones
- ✅ **Notas rápidas** con auto-guardado
- ✅ **Enlaces entre páginas** para navegación rápida

### 📊 Tablas Dinámicas Estilo Notion

- ✅ **Tablas personalizables** con múltiples tipos de columnas:
  - Texto, Números, Fechas
  - Checkboxes, Porcentajes
  - Select con colores, Tags múltiples
  - Fórmulas calculadas automáticamente
- ✅ **Vistas múltiples**:
  - Vista tabla (estándar)
  - Vista Kanban (drag & drop entre columnas)
  - Vista Timeline
  - Vista Gallery
- ✅ **Filtros y ordenamiento** avanzados
- ✅ **Vinculación entre tablas** para datos relacionados
- ✅ **Gráficos y visualizaciones** integradas

### 💰 Gestión Financiera

- ✅ **Sistema financiero completo** con plantilla preconfigurada
- ✅ **Tablas de Ingresos, Egresos y Deudas** interconectadas
- ✅ **Resumen financiero** con gráficas automáticas
- ✅ **Cálculos automáticos** de totales y balances

### 🗄️ Scripts SQL con Versionado

- ✅ **Editor de scripts SQL** integrado
- ✅ **Sistema de versionado** tipo Git
- ✅ **Historial de versiones** completo
- ✅ **Comparación entre versiones**
- ✅ **Exportar a PDF o TXT**
- ✅ **Asociación con páginas** para organización

### 📅 Calendario y Eventos

- ✅ **Calendario interactivo** con múltiples vistas
- ✅ **Gestión de eventos** con detalles completos
- ✅ **Notificaciones** de eventos
- ✅ **Búsqueda en eventos** desde búsqueda global

### 📁 Gestión de Archivos

- ✅ **Galería de imágenes** organizadas
- ✅ **Galería de archivos** para cualquier tipo de archivo
- ✅ **Almacenamiento local** en tu sistema de archivos
- ✅ **Drag & drop** para subir archivos

### 🎨 Formato de Texto

- ✅ **Títulos** (H1, H2, H3, H4, H5, H6)
- ✅ **Listas** numeradas, con viñetas y de tareas
- ✅ **Bloques de código** con resaltado de sintaxis
- ✅ **Enlaces** externos e internos
- ✅ **Imágenes** con título y descripción
- ✅ **Bloques desplegables** (toggle)
- ✅ **Texto enriquecido** (negrita, cursiva, subrayado)

### 🔍 Comandos Rápidos (Slash Commands)

Escribe `/` en cualquier parte del editor para acceder a comandos rápidos:

#### 📋 Gestión de Proyectos
- **`/board`** o **`/kanban`** - Crea un tablero Kanban con columnas To Do, In Progress, Done
- **`/tabla`** - Crea una tabla dinámica estilo Notion
- **`/reuniones`** - Template completo para actas de reunión

#### 💰 Finanzas
- **`/financiero`** - Sistema financiero completo con Ingresos, Egresos y Deudas

#### 🗄️ Base de Datos
- **`/sql`** - Abre el gestor de scripts SQL con versionado

#### 📅 Calendario
- **`/calendario`** - Inserta un calendario interactivo

#### 📁 Archivos
- **`/galeria-imagenes`** - Crea una galería de imágenes
- **`/galeria-archivos`** - Crea una galería para cualquier tipo de archivo
- **`/imagen`** - Inserta una imagen

#### 📝 Notas y Documentación
- **`/nota`** - Abre el modal de notas rápidas
- **`/plantilla`** - Inserta contenido de una plantilla guardada

#### 📋 Listas
- **`/lista-numerada`** - Lista ordenada (1, 2, 3...)
- **`/lista-viñetas`** - Lista con bullets (• • •)
- **`/tareas`** - Lista de tareas con checkboxes
- **`/convertir-tareas`** - Convierte texto con [x] y [ ] en checkboxes

#### ✏️ Formato
- **`/titulo1`** o **`/h1`** - Título grande
- **`/titulo2`** o **`/h2`** - Subtítulo
- **`/parrafo`** - Texto normal
- **`/codigo`** - Bloque de código
- **`/json`** - Formatea y valida JSON con resaltado de sintaxis
- **`/toggle`** - Bloque desplegable

#### 🔗 Enlaces
- **`/enlace`** - Crea enlace a otra página

#### 🎨 Visual
- **`/iconos`** o **`/emoji`** - Selector de emojis
- **`/tolist`** - Convierte bloque a lista

#### 💻 Desarrollo y Utilidades
- **`/consola`** - Abre consola completa para ejecutar código y proyectos
- **`/consola-bloque`** o **`/consola-pagina`** - Inserta consola como bloque en la página
- **`/centro-ejecucion`** - Abre página centralizada de terminales y gestión de proyectos
- **`/convertidor`** - Convertir documentos: Markdown a PDF, PDF a Word, Word a PDF
- **`/diagrama`** - Crear diagramas: flujo, secuencia, clase, estado, Gantt, ER
- **`/markdown`** - Editor de Markdown con vista previa y exportación a PDF
- **`/postman`** - Cliente API completo para probar endpoints REST con colecciones, variables y pestañas

---

### 📊 Referencia Técnica de Comandos Slash

| Comando | Node Type | Componente que Ejecuta | Tipo |
|---------|-----------|------------------------|------|
| `/sql` | - | `SQLFileManager` (modal) | Evento Custom |
| `/board` o `/kanban` | `tablaNotion` | `TablaNotionStyle` | Node TipTap |
| `/nota` | - | `QuickNote` (modal) | Evento Custom |
| `/consola` | - | `ConsolePanel` (modal) | Evento Custom |
| `/consola-bloque` | `consoleBlock` | `ConsoleBlock` | Node TipTap |
| `/centro-ejecucion` | - | `CentroEjecucionPage` (modal) | Evento Custom |
| `/convertidor` | `convertidorBlock` | `ConvertidorBlock` | Node TipTap |
| `/diagrama` | `diagramBlock` | `DiagramBlock` | Node TipTap |
| `/tabla` | `tablaNotion` | `TablaNotionStyle` | Node TipTap |
| `/financiero` | `resumenFinanciero` + `tablaNotion` | `ResumenFinancieroNode` + `TablaNotionStyle` | Node TipTap |
| `/galeria-imagenes` | `galeriaImagenes` | `GaleriaImagenesNode` | Node TipTap |
| `/galeria-archivos` | `galeriaArchivos` | `GaleriaArchivosNode` | Node TipTap |
| `/calendario` | `calendar` | `CalendarNode` | Node TipTap |
| `/plantilla` | - | `TemplateSelector` (modal) | Evento Custom |
| `/lista-numerada` | `orderedList` | TipTap estándar | Node TipTap |
| `/lista-viñetas` | `bulletList` | TipTap estándar | Node TipTap |
| `/tareas` | `taskList` | TipTap estándar | Node TipTap |
| `/convertir-tareas` | `taskList` | TipTap estándar | Node TipTap |
| `/iconos` o `/emoji` | - | `EmojiPicker` (modal) | Evento Custom |
| `/tolist` | `bulletList` | TipTap estándar | Node TipTap |
| `/toggle` | `toggle` | `Toggle` (extension) | Node TipTap |
| `/titulo1` o `/h1` | `heading` (level: 1) | TipTap estándar | Node TipTap |
| `/titulo2` o `/h2` | `heading` (level: 2) | TipTap estándar | Node TipTap |
| `/parrafo` | `paragraph` | TipTap estándar | Node TipTap |
| `/codigo` | `codeBlock` | `CodeBlockWithCopyExtension` | Node TipTap |
| `/json` | `codeBlock` (language: json) | `CodeBlockWithCopyExtension` | Node TipTap |
| `/markdown` | `markdown` | `MarkdownNode` | Node TipTap |
| `/postman` | `postmanBlock` | `PostmanBlock` | Node TipTap |
| `/imagen` | `image` | `ImageExtended` | Node TipTap |
| `/enlace` | - | `PageLinkModal` (modal) | Evento Custom |

**Leyenda:**
- **Node TipTap**: Se inserta un nodo directamente en el editor TipTap
- **Evento Custom**: Se dispara un evento personalizado que abre un modal o componente

---

## 📖 Guía Rápida de Uso

### Primera Vez - Configuración

1. **Al iniciar la aplicación** por primera vez, verás el dashboard de configuración
2. **Activa** "Guardar archivos localmente en el sistema de archivos"
3. **Selecciona** la carpeta donde quieres guardar tus archivos
4. El sistema creará automáticamente:
   - `data/` - Para archivos JSON de páginas
   - `files/` - Para imágenes y archivos adjuntos

### Crear Tu Primera Página

1. Haz clic en el botón **"+"** (Nueva página) en la barra lateral
2. Escribe el título (puedes incluir un emoji al inicio)
3. Presiona Enter o haz clic en "Crear Página"
4. ¡Comienza a escribir! El contenido se guarda automáticamente

### Usar Comandos Rápidos

1. En cualquier parte del editor, escribe **`/`**
2. Aparecerá un menú con todos los comandos disponibles
3. Escribe para filtrar o selecciona con el mouse
4. Presiona Enter para insertar

### Crear un Tablero Kanban

1. Escribe **`/board`** en el editor
2. Se creará una tabla con columnas: Name, Estado, Prioridad, Asignado, Fecha, Descripción
3. Haz clic en el botón de vistas (arriba a la derecha) y selecciona **Kanban**
4. Arrastra las tarjetas entre columnas para cambiar su estado

### Gestionar un Sprint Scrum

1. Crea una nueva página para tu sprint: **`📋 Sprint 2025-01`**
2. Escribe **`/tabla`** para crear una tabla
3. Haz clic en **"⋯"** (tres puntos) → **"🎯 Plantilla Scrum"**
4. Se cargarán automáticamente todas las columnas y fórmulas necesarias
5. Configura las fechas del sprint y comienza a agregar tareas

### Tomar Notas Rápidas

1. Escribe **`/nota`** o usa el atajo de teclado
2. Se abre el modal de notas rápidas
3. Escribe tu nota - se guarda automáticamente
4. Accede al historial desde el mismo modal

### Probar APIs con Postman

El comando **`/postman`** te permite probar APIs REST de forma completa, similar a Postman original:

#### Características Principales:
- ✅ **Múltiples pestañas** - Trabaja con varias APIs simultáneamente
- ✅ **Colecciones** - Organiza tus APIs en colecciones
- ✅ **Variables** - Usa variables como `{{base_url}}` y `{{token}}`
- ✅ **Importar/Exportar** - Compatible con formato Postman Collection v2.1
- ✅ **Autenticación** - Soporta Bearer Token, Basic Auth y API Key
- ✅ **Historial** - Guarda historial de peticiones ejecutadas
- ✅ **Generación de código** - Exporta a cURL, JavaScript, Python, etc.

#### Ejemplo Básico:

1. Escribe **`/postman`** en el editor
2. Se crea un bloque Postman con una pestaña nueva
3. Configura tu petición:
   - **Método**: GET, POST, PUT, DELETE, etc.
   - **URL**: `https://api.ejemplo.com/endpoint`
   - **Headers**: Agrega headers personalizados
   - **Body**: Para POST/PUT, escribe el JSON del body
4. Haz clic en **"Enviar"** para ejecutar la petición
5. Verás la respuesta con código de estado, tiempo de respuesta y datos

#### Usar Variables:

1. Haz clic en el botón **"Variables"** en la barra de herramientas
2. Agrega variables como:
   - `base_url` = `https://api.sancolombia.com`
   - `token` = `tu-token-aqui`
3. Usa las variables en tus peticiones:
   - **URL**: `{{base_url}}/procedure`
   - **Header**: `Authorization: Bearer {{token}}`
4. Las variables se sustituyen automáticamente al ejecutar

#### Importar Colección de Postman:

1. Haz clic en el botón **"⚙️"** (Settings) → **"Importar colección"**
2. Selecciona tu archivo `.postman_collection.json`
3. La colección se importa con todas sus APIs y variables
4. Haz clic en cualquier API del sidebar para crear una nueva pestaña con esa API lista para ejecutar

#### Trabajar con Pestañas:

- **Agregar pestaña**: Haz clic en el botón **"+"** en la barra de pestañas
- **Cambiar de pestaña**: Haz clic en el nombre de la pestaña
- **Cerrar pestaña**: Haz clic en la **"X"** junto al nombre
- Cada pestaña mantiene su propia configuración (método, URL, headers, body, respuesta)

#### Ejemplo Completo - API con Autenticación:

```
Método: POST
URL: {{base_url}}/login
Headers:
  Content-Type: application/json
Body (JSON):
{
  "usuario": "{{usuario}}",
  "clave": "{{clave}}"
}
```

Las variables `{{base_url}}`, `{{usuario}}` y `{{clave}}` se sustituyen automáticamente.

---

## ⌨️ Atajos de Teclado

- **`Ctrl/Cmd + K`** - Búsqueda global
- **`Ctrl/Cmd + N`** - Nueva página
- **`Ctrl/Cmd + /`** - Ver todos los atajos de teclado
- **`Esc`** - Cerrar modales/búsqueda
- **`/`** - Abrir menú de comandos rápidos

---

## 🎯 Casos de Uso Principales

### 1. Gestión de Proyectos con Kanban
- Crea tableros Kanban para visualizar el flujo de trabajo
- Usa drag & drop para mover tareas entre estados
- Filtra por asignado, prioridad o fecha

### 2. Sprints Scrum
- Gestiona sprints de 15 días con plantilla preconfigurada
- Tracking automático de tiempo y progreso
- Alertas de sobrecarga de trabajo

### 3. Finanzas Personales
- Controla ingresos, egresos y deudas
- Visualiza resúmenes financieros con gráficas
- Todo interconectado automáticamente

### 4. Base de Conocimiento
- Organiza notas y documentación en páginas
- Enlaza páginas relacionadas
- Búsqueda global en todo el contenido

### 5. Actas de Reunión
- Template completo para reuniones
- Action items con seguimiento
- Historial de decisiones

### 6. Desarrollo de Software
- Scripts SQL con versionado tipo Git
- Documentación técnica con código resaltado
- Tracking de tareas y bugs

---

## 🔧 Configuración y Personalización

### Cambiar Ubicación de Archivos

1. Ve a Configuración (⚙️ en el menú)
2. Haz clic en "Seleccionar Carpeta"
3. Elige la nueva ubicación
4. Los archivos se moverán automáticamente

### Exportar e Importar

- **Exportar página a PDF**: Usa el botón de exportar en la barra superior
- **Importar páginas**: Ve a Configuración → Importar

### Temas

- La aplicación soporta modo claro y oscuro automático
- Se adapta según las preferencias de tu sistema

---

## 📊 Estructura de Archivos Guardados

```
tu-carpeta-seleccionada/
├── data/
│   ├── pagina-1.json
│   ├── pagina-2.json
│   ├── _index.json          # Índice de páginas
│   ├── sql-files/           # Scripts SQL
│   └── sql-versions/        # Versiones de scripts SQL
├── files/
│   ├── imagen-123.jpg
│   ├── documento.pdf
│   └── ...
└── config.json              # Configuración de la app
```

---

## 🛠️ Requisitos Técnicos

### Para Desarrollo:
- Node.js v18 o superior
- npm o yarn
- Navegador moderno (Chrome 86+, Edge 86+, Firefox 90+)

### Para Ejecutable:
- Windows 10 o superior (x64)
- ~150 MB de espacio en disco
- No requiere Node.js instalado (incluido en el ejecutable)


## 🐛 Solución de Problemas

### La aplicación no guarda archivos
- Verifica que hayas configurado una carpeta en Configuración
- Asegúrate de tener permisos de escritura en esa carpeta

### Los archivos no se cargan
- Verifica que la carpeta configurada sea la correcta
- Revisa que los archivos JSON estén en la carpeta `data/`

### El ejecutable no funciona
- Verifica que tu Windows sea de 64 bits
- Asegúrate de tener Visual C++ Redistributables instalados (si aplica)
- Ejecuta como administrador si es necesario

---

## 🔒 Privacidad y Seguridad

- ✅ **100% Offline** - Todos los datos se guardan localmente
- ✅ **Sin conexión a internet** - No envía datos a servidores externos
- ✅ **Sin tracking** - No recopilamos información de uso
- ✅ **Tus datos, tu control** - Archivos accesibles directamente en tu sistema

---

## 📝 Características Principales Resumidas

| Característica | Descripción |
|----------------|-------------|
| 🚫 **Sin Login** | Acceso directo, sin autenticación |
| 📴 **Offline** | Funciona completamente sin internet |
| 💾 **Local** | Guarda todo en tu sistema de archivos |
| 📊 **Tablas Dinámicas** | Estilo Notion con múltiples vistas |
| 📅 **Calendario** | Gestión de eventos integrada |
| 💰 **Finanzas** | Sistema financiero completo |
| 🗄️ **SQL Versionado** | Scripts SQL con control de versiones |
| 🔍 **Búsqueda Global** | Busca en páginas, tablas y eventos |
| 📝 **Notas Rápidas** | Modal de notas con auto-guardado |
| 🎨 **Rich Text** | Editor completo estilo Notion |
| 📋 **Kanban** | Tableros con drag & drop |
| 🤝 **Comentarios** | Sistema de comentarios en páginas |
| 📁 **Galerías** | Organización de imágenes y archivos |
| 🔗 **Enlaces** | Navegación entre páginas |
| 🏷️ **Tags** | Sistema de etiquetas para organización |

---

## 🎉 ¡Comienza Ahora!

1. **Descarga o clona** el repositorio
2. **Ejecuta** `npm install`
3. **Inicia** con `npm run dev` (desarrollo) o genera el ejecutable con `npm run electron:build:both`
4. **Configura** tu carpeta de almacenamiento
5. **¡Crea tu primera página y comienza a organizarte!**

---

## 📄 Licencia

Este proyecto es de uso libre. Todos los datos son tuyos y se guardan localmente.

---


