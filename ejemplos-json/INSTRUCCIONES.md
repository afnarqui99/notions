# Instrucciones para Importar los Archivos JSON

## Estructura de IDs

Los archivos JSON usan IDs simples para facilitar la comprensión. En producción, deberías usar UUIDs únicos.

### Mapeo de IDs

- `dashboard-personal` - Dashboard Personal (raíz)
- `sprints` - Sprints (hijo de dashboard-personal)
- `sprint-2025-03` - Sprint ejemplo (hijo de sprints)
- `notas-y-documentacion` - Notas y Documentación (hijo de dashboard-personal)
- `dailys-y-reuniones` - Dailys y Reuniones (hijo de notas-y-documentacion)
- `credenciales-y-accesos` - Credenciales y Accesos (hijo de dashboard-personal)
- `credenciales` - Credenciales (hijo de credenciales-y-accesos)
- `accesos-web` - Accesos Web (hijo de credenciales-y-accesos)
- `comandos-y-referencias` - Comandos y Referencias (hijo de dashboard-personal)
- `archivos-y-recursos` - Archivos y Recursos (hijo de dashboard-personal)

## Cómo Importar

### ⚠️ IMPORTANTE: Usa el Script de Importación

**NO copies estos archivos directamente** - Los IDs son simples y necesitan convertirse a UUIDs.

### Opción 1: Script Node.js (Recomendado)

```bash
node ejemplos-json/importar-paginas.js
```

Este script:
- Genera UUIDs únicos para cada página
- Actualiza automáticamente los `parentId`
- Guarda los archivos en la carpeta `data/`
- Crea un archivo `mapeo-ids.json` con el mapeo

### Opción 2: Herramienta Web

Abre `ejemplos-json/importar-paginas.html` en tu navegador y sigue las instrucciones.

### Opción 3: Crear manualmente en la app

1. Abre la aplicación
2. Crea las páginas usando la estructura del sidebar
3. Copia el contenido de cada archivo JSON usando el editor
4. Para tablas y sistemas financieros, usa los comandos `/` correspondientes

## Componentes Especiales

### Tablas
- Las tablas se crean con `type: "tablaNotion"`
- Para la plantilla Scrum, haz clic en el menú de la tabla y selecciona "🎯 Plantilla Scrum"
- Para el sistema financiero, usa `/` → "Plantilla Financiero"

### Galerías
- `type: "galeriaImagenes"` - Para galería de imágenes
- `type: "galeriaArchivos"` - Para galería de archivos (videos, PDFs, etc.)

### Bloques Desplegables
- `type: "toggle"` - Para información sensible
- `attrs.titulo` - Título del bloque
- `attrs.abierto` - Si está abierto o cerrado por defecto

### Sistema Financiero
- `type: "resumenFinanciero"` - Resumen financiero
- `type: "tablaNotion"` con `comportamiento: "financiero"` - Tablas financieras

## Notas Importantes

- Los emojis están separados del título en el campo `emoji`
- Los `parentId` deben coincidir con los IDs de las páginas padre
- Las fechas están en formato ISO 8601
- Los tags son arrays de IDs de tags (vacíos por defecto)

## 📚 Más Información

Para instrucciones detalladas de importación, ver:
- `README-IMPORTACION.md` - Guía completa con todas las opciones
- `README.md` - Resumen rápido

## ⚠️ Nota sobre IDs

Los archivos de ejemplo usan IDs simples (ej: "dashboard-personal") para facilitar la comprensión. El script de importación los convierte automáticamente a UUIDs únicos (ej: "a1b2c3d4-e5f6-7890-abcd-ef1234567890") que son los que usa la aplicación en producción.

