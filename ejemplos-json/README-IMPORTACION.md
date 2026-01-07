# 📥 Guía de Importación de Páginas JSON

Esta guía explica cómo importar los archivos JSON de ejemplo a tu aplicación Notion Local Editor.

## 🎯 Opciones de Importación

### Opción 1: Script Node.js (Recomendado)

**Requisitos:**
- Node.js instalado
- Acceso a la carpeta `data/` de tu aplicación

**Pasos:**

1. Abre una terminal en la raíz del proyecto
2. Ejecuta el script:

```bash
node ejemplos-json/importar-paginas.js
```

3. El script:
   - Generará UUIDs únicos para cada página
   - Mantendrá las relaciones `parentId`
   - Guardará los archivos en `data/`
   - Creará un archivo `mapeo-ids.json` con el mapeo de IDs

**Especificar carpeta destino:**

```bash
node ejemplos-json/importar-paginas.js ruta/a/tu/carpeta/data
```

### Opción 2: Herramienta Web (HTML)

1. Abre el archivo `ejemplos-json/importar-paginas.html` en tu navegador
2. Selecciona la carpeta `ejemplos-json` que contiene los archivos JSON
3. Haz clic en "Importar Páginas"
4. Los archivos se descargarán automáticamente
5. Copia los archivos descargados a la carpeta `data/` de tu aplicación

### Opción 3: Importación Manual

Si prefieres importar manualmente:

1. **Genera UUIDs únicos** para cada página (puedes usar [uuidgenerator.net](https://www.uuidgenerator.net/))
2. **Renombra cada archivo** con su UUID: `{uuid}.json`
3. **Actualiza los `parentId`** en cada archivo con los UUIDs correspondientes
4. **Copia los archivos** a la carpeta `data/` de tu aplicación

## 📋 Estructura de Relaciones

Las páginas tienen relaciones padre-hijo definidas por `parentId`:

```
dashboard-personal (null) → raíz
├── sprints (parentId: dashboard-personal)
│   └── sprint-2025-03 (parentId: sprints)
├── notas-y-documentacion (parentId: dashboard-personal)
│   └── dailys-y-reuniones (parentId: notas-y-documentacion)
└── ...
```

El script de importación mantiene estas relaciones automáticamente.

## 🔍 Verificar Importación

Después de importar:

1. Abre tu aplicación Notion Local Editor
2. Verifica que las páginas aparezcan en el sidebar
3. Verifica que la estructura jerárquica sea correcta
4. Abre algunas páginas para verificar el contenido

## ⚠️ Notas Importantes

- **UUIDs únicos**: Cada página debe tener un UUID único. El script los genera automáticamente.
- **Relaciones**: Los `parentId` deben coincidir con los IDs de las páginas padre.
- **Archivos existentes**: Si ya tienes páginas con los mismos IDs, se sobrescribirán.
- **Backup**: Haz un backup de tu carpeta `data/` antes de importar.

## 🐛 Solución de Problemas

### Las páginas no aparecen en el sidebar

- Verifica que los archivos estén en la carpeta `data/` correcta
- Verifica que los archivos tengan extensión `.json`
- Verifica que el formato JSON sea válido
- Recarga la aplicación

### Las relaciones parentId no funcionan

- Verifica que los `parentId` coincidan con los IDs reales de las páginas
- Usa el archivo `mapeo-ids.json` generado por el script para verificar

### Error al importar

- Verifica que tengas permisos de escritura en la carpeta `data/`
- Verifica que los archivos JSON tengan el formato correcto
- Revisa la consola del navegador o terminal para ver errores específicos

## 📝 Formato de Archivo JSON

Cada archivo debe tener esta estructura:

```json
{
  "titulo": "Nombre de la página (sin emoji)",
  "emoji": "📊",
  "contenido": {
    "type": "doc",
    "content": [...]
  },
  "tags": [],
  "parentId": "uuid-de-pagina-padre" o null,
  "creadoEn": "2025-01-20T00:00:00.000Z",
  "actualizadoEn": "2025-01-20T00:00:00.000Z"
}
```

## 🚀 Próximos Pasos

Después de importar:

1. Revisa las páginas importadas
2. Personaliza el contenido según tus necesidades
3. Agrega tus propias páginas usando la aplicación
4. Organiza la estructura según tu flujo de trabajo



