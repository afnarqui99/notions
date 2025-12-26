# Guía: Qué Descomentar y Cuándo

## ¿Qué significa "descomentar"?

En el código hay líneas que empiezan con `//` - estas son **comentarios** que el código ignora. Para activarlas, necesitas quitar el `//` del inicio.

## Líneas que necesitas descomentar:

### 1. En la parte de imports (líneas 11-19):

**ANTES (comentado - no funciona):**
```javascript
// import { TableCellExtended } from "../extensions/TableCellExtended";
// import { TablaNotionNode } from "../extensions/TablaNotionNode";
// import lowlight from "../extensions/lowlightInstance";
// import { SlashCommand } from "../extensions/SlashCommand";
// import { Toggle } from "../extensions/Toggle";
```

**DESPUÉS (descomentado - funciona):**
```javascript
import { TableCellExtended } from "../extensions/TableCellExtended";
import { TablaNotionNode } from "../extensions/TablaNotionNode";
import lowlight from "../extensions/lowlightInstance";
import { SlashCommand } from "../extensions/SlashCommand";
import { Toggle } from "../extensions/Toggle";
```

### 2. En la línea 24 (lowlight):

**ANTES:**
```javascript
const lowlight = null; // Temporal - copiar de proyecto original
```

**DESPUÉS:**
```javascript
// Elimina esta línea completamente, ya que lowlight se importa arriba
```

### 3. En la configuración del editor (líneas 63-80):

**ANTES (comentado):**
```javascript
extensions: [
  StarterKit.configure({ codeBlock: false }),
  // CodeBlockLowlight.configure({ lowlight }), // TODO: Descomentar
  // Toggle, // TODO: Descomentar
  // TablaNotionNode, // TODO: Descomentar
  Heading,
  // ... más código ...
  // TableCellExtended, // TODO: Descomentar
  // ... más código ...
  // SlashCommand, // TODO: Descomentar
],
```

**DESPUÉS (descomentado):**
```javascript
extensions: [
  StarterKit.configure({ codeBlock: false }),
  CodeBlockLowlight.configure({ lowlight }),
  Toggle,
  TablaNotionNode,
  Heading,
  // ... más código ...
  TableCellExtended,
  // ... más código ...
  SlashCommand,
],
```

## Pasos para completar:

### Paso 1: Copiar archivos de extensiones
Primero, copia estos archivos del proyecto original a `src/extensions/`:
- `TableCellExtended.js`
- `TablaNotionNode.js`
- `TablaNotionStyle.jsx`
- `Toggle.js`
- `SlashCommand.js`
- `lowlightInstance.js`
- `TagInputNotionLike.jsx` (si existe)
- `EditorDescripcion.jsx` (si existe)

### Paso 2: Descomentar las líneas
Una vez que los archivos estén copiados, descomenta las líneas mencionadas arriba.

### Paso 3: Verificar que no haya errores
Ejecuta `npm run dev` y verifica que no haya errores en la consola.

## ¿Por qué están comentadas?

Están comentadas porque esos archivos aún no existen en el nuevo proyecto. Si intentas importarlos sin que existan, el proyecto dará error. Por eso primero debes copiar los archivos y luego descomentar.

## Ejemplo visual:

**❌ ANTES (comentado - no funciona):**
```javascript
// import { Toggle } from "../extensions/Toggle";
// Toggle, // Esto no se ejecuta
```

**✅ DESPUÉS (descomentado - funciona):**
```javascript
import { Toggle } from "../extensions/Toggle";
Toggle, // Esto sí se ejecuta
```

