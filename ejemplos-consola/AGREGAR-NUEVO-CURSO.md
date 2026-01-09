# 📚 Guía: Agregar un Nuevo Curso

Esta guía explica cómo agregar un nuevo curso educativo sin necesidad de reconstruir la aplicación en desarrollo.

## 🚀 Agregar un Nuevo Curso (Modo Desarrollo)

### Pasos Rápidos

1. **Crea la carpeta del curso** en `ejemplos-consola/`:
   ```bash
   mkdir ejemplos-consola\aprender-nuevo-lenguaje
   ```

2. **Crea los archivos del curso**:
   - `README.md` - Documentación del curso
   - Archivos de ejemplo según el lenguaje
   - Scripts o código de ejemplo

3. **Actualiza la documentación** (opcional):
   - `ejemplos-consola/README.md` - Agrega el nuevo curso
   - `ejemplos-consola/INDICE-COMPLETO.md` - Agrega al índice

4. **Recarga la aplicación**:
   - Si estás en modo desarrollo, recarga la ventana de Electron
   - Los cambios se reflejan inmediatamente

### ✅ No Necesitas:
- ❌ Reconstruir Electron (`npm run electron:build:win`)
- ❌ Reinstalar la aplicación
- ❌ Reiniciar el servidor de desarrollo

## 📦 Incluir en el Instalador (Producción)

Si quieres que el nuevo curso esté disponible para usuarios que instalen la aplicación:

### Opción 1: Los cursos ya están incluidos

Los cursos están configurados para incluirse automáticamente en el build. Solo necesitas:

1. **Reconstruir el instalador**:
   ```bash
   npm run electron:build:win
   ```

2. **Reinstalar la aplicación** (para probar):
   - Desinstala la versión anterior
   - Instala la nueva versión desde `release/`

### Opción 2: Verificar configuración

Si los cursos no se incluyen, verifica que `package.json` tenga:

```json
"files": [
  "dist/**/*",
  "electron/**/*",
  "package.json",
  "ejemplos-consola/**/*"  // ← Debe estar esta línea
]
```

## 📝 Actualizar Referencias en el Código

Si quieres que el nuevo curso aparezca en la ayuda de la consola:

1. **Edita `src/components/ConsolePanel.jsx`**:
   - Busca la sección "Ejemplos Disponibles"
   - Agrega una nueva tarjeta con la información del curso

2. **Ejemplo de código**:
   ```jsx
   <div className="bg-[color]-50 dark:bg-[color]-900/20 rounded-lg p-4">
     <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
       🆕 Nuevo Curso
     </h5>
     <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
       <div>
         <strong>Curso completo:</strong>
         <code className="block bg-[color]-100 dark:bg-[color]-900 p-2 rounded mt-1 text-xs">
           C:\projects\san\notion-local-editor\ejemplos-consola\aprender-nuevo-lenguaje
         </code>
         <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
           Contiene: [descripción del contenido]
         </p>
       </div>
     </div>
   </div>
   ```

## 🎯 Resumen

| Acción | Desarrollo | Producción |
|--------|-----------|------------|
| Agregar archivos del curso | ✅ No requiere rebuild | ✅ No requiere rebuild |
| Ver cambios en la app | ✅ Recargar ventana | ❌ Requiere rebuild |
| Distribuir a usuarios | N/A | ✅ Requiere rebuild + reinstalar |

## 💡 Tips

- **En desarrollo**: Agrega cursos libremente, se reflejan al recargar
- **Para distribución**: Reconstruye el instalador después de agregar cursos importantes
- **Versionado**: Considera incrementar la versión en `package.json` cuando agregues cursos significativos

---

¡Agregar cursos es fácil! 🚀

