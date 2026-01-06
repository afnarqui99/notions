# Archivos JSON de Ejemplo - Guía de Organización Diaria

Este directorio contiene archivos JSON de ejemplo que puedes importar a tu base de datos.

## 🚀 Importación Rápida

**⚠️ IMPORTANTE:** Estos archivos usan IDs simples para facilitar la comprensión. Para producción, debes usar el script de importación que genera UUIDs únicos y mantiene las relaciones.

### Opción 1: Script Node.js (Recomendado)

```bash
node ejemplos-json/importar-paginas.js
```

### Opción 2: Herramienta Web

Abre `ejemplos-json/importar-paginas.html` en tu navegador y sigue las instrucciones.

### Opción 3: Manual

Ver `README-IMPORTACION.md` para instrucciones detalladas.

## 📋 Estructura de Archivos

Cada archivo JSON representa una página con la siguiente estructura:

```json
{
  "titulo": "Nombre de la página (sin emoji)",
  "emoji": "📊",
  "contenido": {
    "type": "doc",
    "content": [...]
  },
  "tags": [],
  "parentId": null,
  "creadoEn": "2025-01-20T00:00:00.000Z",
  "actualizadoEn": "2025-01-20T00:00:00.000Z"
}
```

## ⚠️ Notas Importantes

- **NO copies estos archivos directamente** a la carpeta `data/` - usa el script de importación
- Los IDs en estos archivos son simples (ej: "dashboard-personal") pero en producción deben ser UUIDs
- El script de importación genera UUIDs únicos y actualiza los `parentId` automáticamente
- Donde se indica "IMÁGENES AQUÍ" o "VIDEOS AQUÍ", puedes insertar galerías usando `/` → "Galería de Imágenes" o "Galería de Archivos"
- Las tablas y sistemas financieros están incluidos en formato TipTap
- Los bloques desplegables están incluidos para información sensible

## 📚 Archivos Incluidos

### Páginas Principales
- `dashboard-personal.json` - Dashboard raíz
- `sprints.json` - Gestión de sprints
- `sprint-2025-03.json` - Ejemplo de sprint con tabla Scrum
- `tareas-del-dia.json` - Tareas diarias

### Comandos y Referencias
- `comandos-git.json` - Comandos Git básicos
- **`comandos-git-desarrollo.json`** - ⭐ Guía completa de Git para desarrollo (incluye comparación entre ramas y proyectos)
- `comandos-python.json` - Comandos Python

### Credenciales y Accesos
- `credenciales.json` - Credenciales con bloques desplegables
- `accesos-web.json` - URLs de Jira, Azure DevOps, etc.

### Archivos y Recursos
- `imagenes-y-capturas.json` - Galería de imágenes
- `entregas-companeros.json` - Entregas con videos e imágenes

### Ejemplos Especiales
- `sistema-financiero-ejemplo.json` - Sistema financiero completo
- `dailys-y-reuniones.json` - Ejemplo de dailys

## 📚 Documentación

- `README-IMPORTACION.md` - Guía completa de importación
- `INSTRUCCIONES.md` - Instrucciones generales sobre los archivos

