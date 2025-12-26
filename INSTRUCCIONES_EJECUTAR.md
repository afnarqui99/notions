# Instrucciones para Ejecutar el Proyecto

## ✅ Todo está listo para funcionar

He copiado y adaptado todos los archivos necesarios. **No necesitas comentar ni descomentar nada**. El proyecto está completo y listo para ejecutarse.

## Pasos para ejecutar:

### 1. Instalar dependencias

```bash
cd ../notion-local-editor
npm install
```

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El proyecto se abrirá en `http://localhost:5174`

### 3. Configurar el almacenamiento (primera vez)

1. Al abrir la aplicación, verás el **Dashboard de Configuración**
2. Activa el checkbox "Guardar archivos localmente en el sistema de archivos"
3. Haz clic en "Seleccionar Carpeta" y elige dónde quieres guardar tus archivos
4. Haz clic en "Guardar Configuración"
5. Serás redirigido automáticamente al editor

### 4. Usar el editor

- **Crear página**: Haz clic en "Nueva" para crear una nueva página
- **Editar**: Escribe normalmente, el contenido se guarda automáticamente cada 30 segundos
- **Comandos**: Escribe `/` para ver los comandos disponibles
- **Insertar imagen**: Usa el botón 🖼️ o el comando `/` → "Insertar imagen"
- **Insertar archivo**: Usa el botón 📎
- **Exportar PDF**: Usa el botón 📄

## Estructura de archivos creada

Cuando selecciones una carpeta, se crearán automáticamente:

```
tu-carpeta-seleccionada/
├── data/           # Archivos JSON de las páginas
│   ├── pagina-1234567890.json
│   └── pagina-1234567891.json
└── files/          # Imágenes y archivos adjuntos
    ├── 1234567890-imagen.jpg
    └── 1234567891-documento.pdf
```

## Características implementadas

✅ Editor completo de Notion sin login
✅ Almacenamiento local en archivos JSON
✅ Subida de imágenes y archivos locales
✅ Tablas estilo Notion con todas las funcionalidades
✅ Bloques desplegables (Toggle)
✅ Comandos con `/`
✅ Exportar a PDF
✅ Dashboard de configuración
✅ Funciona completamente offline

## Solución de problemas

### Error: "File System Access API no está disponible"
- Usa Chrome 86+ o Edge 86+
- O desactiva el almacenamiento local (usará localStorage del navegador)

### Error al instalar dependencias
```bash
# Limpia e instala de nuevo
rm -rf node_modules package-lock.json
npm install
```

### Las imágenes no se muestran
- Verifica que hayas seleccionado una carpeta en la configuración
- Las imágenes se guardan en la subcarpeta `files/`

## Notas importantes

- **Sin internet requerido**: Todo funciona offline
- **Sin login**: Acceso directo al editor
- **Datos locales**: Todo se guarda en tu computadora
- **Portable**: Puedes mover la carpeta de datos a otra computadora

