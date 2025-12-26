# Instrucciones para Completar el Proyecto

Este documento describe los archivos que necesitas copiar/adaptar del proyecto original para completar la funcionalidad.

## Archivos que Necesitas Copiar del Proyecto Original

### 1. Extensiones de TipTap (src/extensions/)

Copia estos archivos del proyecto original y adáptalos:

- ✅ `TablaNotionNode.js` - Ya existe, solo quita referencias a Firebase
- ✅ `Toggle.js` - Ya existe, no necesita cambios
- ✅ `SlashCommand.js` - Ya existe, no necesita cambios  
- ✅ `TableCellExtended.js` - Ya existe, no necesita cambios
- ✅ `lowlightInstance.js` - Ya existe, no necesita cambios
- ⚠️ `TablaNotionStyle.jsx` - **NECESITA ADAPTACIÓN**: Quita referencias a `firebaseDocRef`
- ⚠️ `TagInputNotionLike.jsx` - Copia y adapta si es necesario
- ⚠️ `EditorDescripcion.jsx` - Copia y adapta si es necesario

### 2. Componente LocalEditor (src/components/LocalEditor.jsx)

**Este es el archivo más importante**. Necesitas crear este componente basándote en `EditorNotionLike.jsx` del proyecto original, pero:

#### Cambios necesarios:

1. **Eliminar dependencias de Firebase:**
   ```javascript
   // ELIMINAR:
   import { db } from "../../firebase";
   import { collection, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
   import { useAuth } from "../../contexts/AuthContext";
   
   // REEMPLAZAR CON:
   import LocalStorageService from '../services/LocalStorageService';
   ```

2. **Reemplazar guardado de contenido:**
   ```javascript
   // ANTES (Firebase):
   const refPrivada = doc(db, "paginasNotion", user.usuario, "paginas", paginaSeleccionada);
   await setDoc(refPrivada, { contenido, actualizadoEn: serverTimestamp() }, { merge: true });
   
   // DESPUÉS (Local):
   await LocalStorageService.saveJSONFile(
     `${paginaSeleccionada}.json`,
     { 
       contenido, 
       titulo,
       actualizadoEn: new Date().toISOString(),
       creadoEn: data?.creadoEn || new Date().toISOString()
     }
   );
   ```

3. **Reemplazar carga de páginas:**
   ```javascript
   // ANTES (Firebase):
   const ref = collection(db, "paginasNotion", user.usuario, "paginas");
   const unsubscribe = onSnapshot(ref, (snap) => { ... });
   
   // DESPUÉS (Local):
   const files = await LocalStorageService.listFiles('data');
   const paginas = await Promise.all(
     files
       .filter(f => f.endsWith('.json'))
       .map(async (file) => {
         const data = await LocalStorageService.readJSONFile(file, 'data');
         return { id: file.replace('.json', ''), ...data };
       })
   );
   ```

4. **Reemplazar subida de archivos:**
   ```javascript
   // ANTES (API):
   const res = await fetch(`${apiUrl}/api/send/subir-archivo-s3-todo`, {
     method: "POST",
     body: formData,
   });
   
   // DESPUÉS (Local):
   const filename = `${Date.now()}-${file.name}`;
   await LocalStorageService.saveBinaryFile(filename, file, 'files');
   const url = await LocalStorageService.getFileURL(filename, 'files');
   ```

5. **Eliminar referencias a usuario:**
   - Quita todas las referencias a `user?.usuario` o `user?.id`
   - No necesitas autenticación

6. **Eliminar funcionalidad de compartir:**
   - Quita el `ModalCompartirPagina` y toda la lógica relacionada
   - Quita las solicitudes de acceso

7. **Adaptar TablaNotionStyle:**
   - En `TablaNotionStyle.jsx`, quita la lógica de Firebase
   - Guarda los datos directamente en el nodo del editor

### 3. Estilos CSS Adicionales

Si el proyecto original tiene estilos específicos para el editor, cópialos a `src/index.css`.

### 4. Dependencias Adicionales

Verifica si necesitas estas dependencias adicionales (ya están en package.json, pero verifica versiones):

- `html2pdf.js` - Para exportar a PDF
- Todas las extensiones de TipTap

## Pasos para Completar

1. **Copia las extensiones:**
   ```bash
   # Desde el proyecto original
   cp src/extensions/* ../notion-local-editor/src/extensions/
   ```

2. **Crea LocalEditor.jsx:**
   - Copia `src/components/Admin/EditorNotionLike.jsx`
   - Renómbralo a `LocalEditor.jsx`
   - Aplica todos los cambios mencionados arriba

3. **Adapta TablaNotionStyle.jsx:**
   - Quita referencias a `firebaseDocRef`
   - Los datos se guardan automáticamente en el contenido del editor

4. **Prueba la funcionalidad:**
   - Inicia el servidor: `npm run dev`
   - Configura una carpeta
   - Crea una página
   - Verifica que se guarde correctamente

## Estructura de Datos

Las páginas se guardan como archivos JSON con esta estructura:

```json
{
  "id": "pagina-123",
  "titulo": "Mi Página",
  "contenido": { ... }, // Contenido del editor TipTap
  "creadoEn": "2025-01-01T00:00:00.000Z",
  "actualizadoEn": "2025-01-01T00:00:00.000Z"
}
```

## Notas Importantes

- El proyecto usa la **File System Access API** que solo funciona en Chrome/Edge modernos
- Para otros navegadores, se usa localStorage/IndexedDB como fallback
- Las imágenes se guardan en `files/` y se referencian con rutas relativas
- No hay sincronización en tiempo real (no es necesario sin internet)

## Solución de Problemas

1. **Error al seleccionar carpeta:** Asegúrate de usar Chrome/Edge 86+
2. **Archivos no se guardan:** Verifica que la configuración esté activada
3. **Imágenes no se muestran:** Verifica que las rutas sean relativas y correctas

