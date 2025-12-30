# 📚 Guía de Organización Diaria

Estructura recomendada para organizar tu trabajo diario: sprints, proyectos, credenciales y accesos rápidos.

---

## 🎯 Estructura Recomendada

### Estructura Principal con Páginas Anidadas

Organiza tu contenido usando páginas anidadas directamente en el sidebar:

```
📊 Dashboard Personal
│
├── 🎯 Sprints
│   ├── 📋 Sprint 2025-01
│   ├── 📋 Sprint 2025-02
│   ├── 📋 Sprint 2025-03 (Activo)
│   └── 📦 Sprints Archivados
│
├── 🏗️ Proyectos
│   ├── Proyecto A
│   ├── Proyecto B
│   └── Proyectos Archivados
│
├── 📝 Notas
│   ├── Notas de Proyectos
│   ├── Notas de Reuniones
│   └── Ideas
│
├── 🔐 Credenciales
│
├── 📧 Accesos Rápidos
│
└── 📅 Tareas del Día
```

---

## 📋 1. Dashboard Personal

**Página raíz principal**

1. Crea la página: Botón **"+"** → Título: `📊 Dashboard Personal`
2. Usa esta página como punto de entrada: agrega un resumen rápido o deja que la estructura del sidebar sea tu navegación principal

---

## 🎯 2. Sprints

### Estructura

```
🎯 Sprints (página padre)
├── 📋 Sprint 2025-01 (página hija)
├── 📋 Sprint 2025-02 (página hija)
├── 📋 Sprint 2025-03 (página hija - Activo)
└── 📦 Sprints Archivados (página hija)
    ├── 📋 Sprint 2024-23 (página nieta)
    └── 📋 Sprint 2024-24 (página nieta)
```

### Cómo crear

1. **Crear página padre "Sprints":**
   - Pasa el mouse sobre "Dashboard Personal" en el sidebar
   - Haz clic en el botón **"+"** que aparece
   - Título: `🎯 Sprints`

2. **Crear cada sprint:**
   - Pasa el mouse sobre "Sprints" en el sidebar
   - Haz clic en el botón **"+"**
   - Título: `📋 Sprint 2025-01` (usa formato: `Sprint YYYY-NN`)

3. **Dentro de cada sprint:**
   - Escribe `/` → Busca "tabla" → Selecciona "📋 Tabla estilo Notion"
   - Haz clic en "🎯 Plantilla Scrum" en el menú de la tabla
   - Configura las fechas del sprint en la parte superior de la tabla
   - Agrega tus tareas

### Flujo de trabajo

**Cada 15 días (inicio de nuevo sprint):**

1. **Archivar sprint anterior:**
   - Arrastra el sprint completado dentro de "Sprints Archivados" (drag & drop en el sidebar)

2. **Crear nuevo sprint:**
   - Pasa el mouse sobre "Sprints" → Botón **"+"** → `📋 Sprint 2025-XX`
   - Inserta tabla → "🎯 Plantilla Scrum"
   - Configura fechas (inicio y fin del sprint)
   - Agrega tareas iniciales

### Nomenclatura

- **Formato recomendado:** `Sprint 2025-01`, `Sprint 2025-02`, etc.
- Fácil de ordenar cronológicamente
- Claro y consistente

---

## 🏗️ 3. Proyectos

### Estructura

```
🏗️ Proyectos (página padre)
├── Proyecto A (página hija)
├── Proyecto B (página hija)
└── Proyectos Archivados (página hija)
```

### Cómo crear

1. **Crear página padre "Proyectos":**
   - Pasa el mouse sobre "Dashboard Personal" → Botón **"+"**
   - Título: `🏗️ Proyectos`

2. **Crear cada proyecto:**
   - Pasa el mouse sobre "Proyectos" → Botón **"+"**
   - Título: Nombre del proyecto (ej: `Proyecto Notion Local`)

3. **Dentro de cada proyecto, incluye:**

   - **Ruta local:** Usa código inline: `` `C:\ruta\proyecto` ``
   - **Repositorio:** URL como enlace
   - **Comandos útiles:** Lista con código inline
   - **Estructura:** Lista o párrafo

**Ejemplo de contenido:**

```
Ruta: `C:\projects\notion-local-editor`

Repositorio: https://github.com/usuario/notion-local-editor

Comandos útiles:
- `npm run dev` - Iniciar desarrollo
- `npm run build` - Construir producción

Estructura:
- `src/` - Código fuente
  - `components/` - Componentes React
  - `extensions/` - Extensiones TipTap
```

---

## 📝 4. Notas

### Estructura

```
📝 Notas (página padre)
├── Notas de Proyectos (página hija)
├── Notas de Reuniones (página hija)
└── Ideas (página hija)
```

### Cómo crear

1. **Crear página padre "Notas":**
   - Pasa el mouse sobre "Dashboard Personal" → Botón **"+"**
   - Título: `📝 Notas`

2. **Crear subcategorías:**
   - Pasa el mouse sobre "Notas" → Botón **"+"**
   - Títulos: `Notas de Proyectos`, `Notas de Reuniones`, `Ideas`

3. **Para información específica de un proyecto:**
   - Escribe `/` → Busca "desplegable" → "Bloque desplegable"
   - Título del bloque: Nombre del proyecto
   - Dentro: tus notas

**Ejemplo:**

```
<Bloque desplegable: "🏗️ Proyecto A">
Ruta: `C:\projects\proyecto-a`
Comandos útiles:
- `npm start`
- `npm test`
</Bloque desplegable>
```

---

## 🔐 5. Credenciales

### Estructura

```
🔐 Credenciales (página única o con subcategorías)
```

### Cómo crear

1. **Crear página:**
   - Pasa el mouse sobre "Dashboard Personal" → Botón **"+"**
   - Título: `🔐 Credenciales`

2. **Organizar por categorías:**
   - Usa encabezados (H2) para: Bases de Datos, APIs, Servicios Externos
   - Para información sensible, usa bloques desplegables

**Ejemplo:**

```
## Bases de Datos

### PostgreSQL Local
- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`

<Bloque desplegable: "🔒 Contraseña">
tu-contraseña-aqui
</Bloque desplegable>
```

---

## 📧 6. Accesos Rápidos

### Estructura

```
📧 Accesos Rápidos (página única)
```

### Cómo crear

1. **Crear página:**
   - Pasa el mouse sobre "Dashboard Personal" → Botón **"+"**
   - Título: `📧 Accesos Rápidos`

2. **Organizar por categorías:**
   - Usa encabezados (H2) para: Comunicación, Documentación, Herramientas
   - Agrega enlaces directos (escribe la URL y presiona Enter)

**Ejemplo:**

```
## Comunicación

📧 Correo Empresarial
https://mail.empresa.com

💬 Slack
https://empresa.slack.com

## Documentación

📖 Wiki Empresarial
https://wiki.empresa.com
```

---

## 📅 7. Tareas del Día

### Estructura

```
📅 Tareas del Día (página única, actualizarla diariamente)
```

### Cómo crear

1. **Crear página:**
   - Pasa el mouse sobre "Dashboard Personal" → Botón **"+"**
   - Título: `📅 Tareas del Día`

2. **Usar listas con checkboxes:**
   - Escribe `/` → Busca "lista" → "Lista con viñetas"
   - Usa `- [ ]` para tareas pendientes
   - Usa `- [x]` para tareas completadas

**Ejemplo:**

```
✅ Completadas
- [x] Revisar código del sprint
- [x] Actualizar documentación

🔄 En Progreso
- [ ] Implementar feature X
- [ ] Revisar PR #123

📋 Pendientes
- [ ] Reunión con equipo
```

---

## 🖼️ 8. Galerías de Imágenes y Archivos

### Cuándo usar

- **Galería de Imágenes:** Para organizar capturas de pantalla, diagramas, documentos escaneados
- **Galería de Archivos:** Para documentos, PDFs, videos, archivos ZIP relacionados con tu trabajo

### Dónde crear

Crea galerías dentro de:
- **Páginas de proyecto:** Para documentación visual del proyecto
- **Páginas de sprints:** Para capturas de pantalla de demos o documentación
- **Página dedicada:** Si tienes muchos archivos, crea una página "📁 Archivos" o "🖼️ Imágenes"

### Cómo usar

1. Dentro de cualquier página, escribe `/` → Busca "galeria" o "archivos"
2. Selecciona:
   - `🖼️ Galería de Imágenes` - Para imágenes organizadas
   - `📁 Galería de Archivos` - Para cualquier tipo de archivo
3. Sube archivos y agrega:
   - Nombre descriptivo
   - Grupo (para organizar)
   - Descripción (opcional)
   - Fecha (automática)

---

## 💡 Recomendaciones Prácticas

### Organización

1. **Usa páginas anidadas** para crear una estructura clara en el sidebar
2. **Máximo 3-4 niveles de anidación** (Dashboard → Sección → Item → Sub-item)
3. **Arrastra y suelta** para reorganizar páginas
4. **Colapsa secciones** que no usas frecuentemente (clic en el chevron)

### Nomenclatura

- **Sprints:** `Sprint 2025-01`, `Sprint 2025-02` (formato consistente)
- **Proyectos:** Nombre descriptivo del proyecto
- **Usa emojis** para identificación visual rápida

### Mantenimiento

- **Archiva sprints completados** moviéndolos a "Sprints Archivados"
- **Actualiza "Tareas del Día"** cada mañana y al final del día
- **Revisa y limpia** proyectos archivados periódicamente

### Comandos Útiles (escribe `/`)

- `tabla` → Tabla estilo Notion (para sprints)
- `galeria` → Galería de Imágenes
- `archivos` → Galería de Archivos
- `desplegable` → Bloque desplegable (para información sensible)
- `lista` → Lista con viñetas (para tareas)
- `enlace` → Enlace a página (para referencias cruzadas)
- `imagen` → Insertar imagen individual

---

## 📖 Flujo de Trabajo Diario

### Inicio del día

1. Abre "📅 Tareas del Día" y revisa las pendientes
2. Abre el sprint activo (dentro de "🎯 Sprints")
3. Actualiza el progreso en la tabla del sprint

### Durante el día

1. Marca tareas completadas en "📅 Tareas del Día"
2. Actualiza el sprint con progreso
3. Agrega notas si descubres algo importante

### Fin del día

1. Revisa y actualiza el sprint
2. Completa "📅 Tareas del Día"
3. Agrega notas importantes

### Fin de sprint (cada 15 días)

1. Archiva el sprint completado (arrastra a "Sprints Archivados")
2. Crea nuevo sprint (dentro de "🎯 Sprints")
3. Inserta tabla → "🎯 Plantilla Scrum"
4. Configura fechas y agrega tareas iniciales

---

## ✅ Checklist de Configuración Inicial

- [ ] Crear página "📊 Dashboard Personal"
- [ ] Crear página "🎯 Sprints" (dentro de Dashboard)
- [ ] Crear página "🏗️ Proyectos" (dentro de Dashboard)
- [ ] Crear página "📝 Notas" (dentro de Dashboard)
- [ ] Crear página "🔐 Credenciales" (dentro de Dashboard)
- [ ] Crear página "📧 Accesos Rápidos" (dentro de Dashboard)
- [ ] Crear página "📅 Tareas del Día" (dentro de Dashboard)
- [ ] Crear página "📦 Sprints Archivados" (dentro de Sprints)
- [ ] Crear sprint actual (dentro de Sprints)
- [ ] Configurar tabla Scrum en el sprint actual

---

¡Listo! Con esta estructura tendrás todo organizado y fácil de acceder. 🎉
