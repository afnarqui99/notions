# Instrucciones para Debuggear el Problema de Archivos

## Problema
Los archivos no aparecen en la carpeta local seleccionada.

## Pasos para Debuggear

1. **Abre la consola del navegador** (F12 o clic derecho → Inspeccionar → Consola)

2. **Verifica los logs al cargar la página:**
   - Deberías ver: `📋 Configuración:` con la configuración guardada
   - Deberías ver: `📁 baseDirectoryHandle:` con ✅ o ❌

3. **Al crear una página, verifica:**
   - `📝 Creando nueva página: [título]`
   - `📁 baseDirectoryHandle:` (debe ser ✅)
   - `💾 Guardando archivo: data/pagina-XXXX.json`
   - `✅ Archivo guardado exitosamente`

4. **Si ves `❌ No existe` en baseDirectoryHandle:**
   - El problema es que el handle se perdió al recargar la página
   - **Solución:** Ve a Configuración → Cambiar Carpeta y selecciona la carpeta de nuevo
   - Esto restablecerá el handle

5. **Si ves `⚠️ Guardando en localStorage del navegador`:**
   - Los archivos se están guardando en el almacenamiento del navegador, no en la carpeta
   - Necesitas volver a seleccionar la carpeta

## Nota Importante

El `baseDirectoryHandle` **NO se puede guardar** entre sesiones del navegador por razones de seguridad. Esto significa que:

- Si recargas la página, el handle se pierde
- Necesitas volver a seleccionar la carpeta después de cada recarga
- O el navegador puede recordar el permiso si lo otorgaste antes (depende del navegador)

## Solución Temporal

Cada vez que recargues la página, ve a **Configuración** y haz clic en **"Cambiar Carpeta"** para restablecer el handle.

