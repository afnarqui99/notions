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

## Desarrollo

Este proyecto está basado en el componente `EditorNotionLike` del proyecto principal, pero adaptado para:
- Eliminar dependencias de Firebase
- Usar almacenamiento local
- Eliminar sistema de autenticación
- Agregar dashboard de configuración

