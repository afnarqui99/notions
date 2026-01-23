# 🐛 Guía del Debugger Integrado

Este documento explica cómo configurar y usar el debugger integrado en el Centro de Ejecución para proyectos Node.js y Python.

## 📋 Índice

- [Requisitos Generales](#requisitos-generales)
- [Proyectos Node.js](#proyectos-nodejs)
- [Proyectos Python](#proyectos-python)
- [Cómo Usar el Debugger](#cómo-usar-el-debugger)
- [Características](#características)
- [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Generales

El debugger está integrado en la aplicación y **NO requiere instalaciones adicionales** en la mayoría de los casos. Todo funciona automáticamente cuando abres un proyecto en Visual Code dentro del Centro de Ejecución.

---

## 🔵 Proyectos Node.js

### Configuración Automática

**Para proyectos Node.js, NO necesitas hacer nada especial.** El debugger funciona inmediatamente.

El sistema:
- ✅ Detecta automáticamente proyectos Node.js (archivos `package.json`)
- ✅ Inicia el proceso con `--inspect` automáticamente
- ✅ Se conecta al Chrome DevTools Protocol sin configuración

### Estructura del Proyecto

Tu proyecto Node.js debe tener una de estas estructuras:

```
mi-proyecto-node/
├── package.json          ← Detectado automáticamente
├── index.js              ← Archivo principal (detectado automáticamente)
└── ...
```

**O si tienes un archivo de entrada personalizado:**

```json
// package.json
{
  "name": "mi-proyecto",
  "main": "src/app.js",    ← El debugger usará este archivo
  "scripts": {
    "start": "node src/app.js"
  }
}
```

### Archivos Soportados

El debugger funciona con:
- ✅ Archivos `.js`
- ✅ Archivos `.mjs`
- ✅ TypeScript `.ts` (si Node.js puede ejecutarlos directamente)
- ✅ Archivos especificados en `package.json` → `main`
- ✅ Archivo `index.js` en la raíz (por defecto)

### Ejemplo de Proyecto Node.js

```javascript
// index.js
function suma(a, b) {
  return a + b;  // Coloca un breakpoint aquí haciendo clic en el gutter
}

const resultado = suma(5, 3);
console.log('Resultado:', resultado);
```

**Para debuggear:**
1. Abre el proyecto en Visual Code
2. Haz clic en el botón "Debug" (🐛) en el toolbar
3. Coloca breakpoints haciendo clic en el gutter (izquierda del número de línea)
4. El código se pausará en los breakpoints

---

## 🐍 Proyectos Python

### Configuración Automática

**Para proyectos Python, el sistema instala `debugpy` automáticamente si no está disponible.**

El sistema:
- ✅ Detecta proyectos Python (archivos `.py` en la raíz)
- ✅ Verifica si `debugpy` está instalado
- ✅ Si no está instalado, lo instala automáticamente
- ✅ Inicia el debugger sin configuración manual

### Estructura del Proyecto

Tu proyecto Python debe tener esta estructura:

```
mi-proyecto-python/
├── main.py              ← Archivo principal (detectado automáticamente)
├── app.py               ← Alternativa (si no hay main.py)
├── venv/                ← Virtual environment (opcional, detectado automáticamente)
├── requirements.txt     ← Dependencias (opcional)
└── ...
```

### Archivos de Entrada Soportados

El debugger busca automáticamente en este orden:
1. `main.py` (prioridad)
2. `app.py` (alternativa)
3. Primer archivo `.py` en la raíz (si no hay main.py ni app.py)

### Ejemplo de Proyecto Python

```python
# main.py
def suma(a, b):
    return a + b  # Coloca un breakpoint aquí haciendo clic en el gutter

if __name__ == "__main__":
    resultado = suma(5, 3)
    print(f"Resultado: {resultado}")
```

**Para debuggear:**
1. Abre el proyecto en Visual Code
2. Haz clic en el botón "Debug" (🐛) en el toolbar
3. Coloca breakpoints haciendo clic en el gutter (izquierda del número de línea)
4. El código se pausará en los breakpoints

### Virtual Environments (venv)

Si tu proyecto tiene un virtual environment (`venv/`, `.venv/`, o `env/`), el debugger:
- ✅ Lo detecta automáticamente
- ✅ Lo activa automáticamente
- ✅ Usa el Python del venv para ejecutar el código

**No necesitas activar el venv manualmente.**

---

## 🎮 Cómo Usar el Debugger

### 1. Abrir el Panel de Debugger

1. Abre un proyecto en Visual Code dentro del Centro de Ejecución
2. Haz clic en el botón **Debug** (🐛) en el toolbar superior
3. O haz clic en la pestaña **"DEBUGGER"** en el sidebar izquierdo

### 2. Iniciar el Debugger

1. Asegúrate de tener un archivo abierto en el editor
2. Haz clic en el botón **"Iniciar"** en el panel de Debugger
3. El proyecto se iniciará en modo debug

### 3. Colocar Breakpoints

**Método 1: Click en el Gutter**
- Haz clic en el área a la izquierda del número de línea
- Aparecerá un círculo rojo ● indicando el breakpoint

**Método 2: Desde el Panel**
- Los breakpoints aparecen en la lista del panel de Debugger
- Puedes eliminar breakpoints haciendo clic en el X junto a cada uno

### 4. Controles de Ejecución

Una vez que el código se pausa en un breakpoint:

| Botón | Función | Atajo |
|-------|---------|-------|
| ▶️ **Play** | Continuar ejecución hasta el siguiente breakpoint | F5 |
| ⏸️ **Pause** | Pausar la ejecución | - |
| ⏭️ **Step Over** | Ejecutar la línea actual y pasar a la siguiente | F10 |
| ⏩ **Step Into** | Entrar en la función de la línea actual | F11 |
| ⏮️ **Step Out** | Salir de la función actual | Shift+F11 |
| ⏹️ **Stop** | Detener el debugger | Shift+F5 |

### 5. Inspeccionar Variables

Mientras el código está pausado:
- **Variables**: Se muestran automáticamente en el panel "Variables"
- **Watch**: Agrega expresiones para monitorear en tiempo real
- **Call Stack**: Ver la pila de llamadas actual

---

## ✨ Características

### Breakpoints
- ✅ Breakpoints visuales en el gutter del editor
- ✅ Click para agregar/eliminar breakpoints
- ✅ Lista de breakpoints activos en el panel
- ✅ Breakpoints se guardan durante la sesión

### Controles de Ejecución
- ✅ Play/Pause
- ✅ Step Over (F10)
- ✅ Step Into (F11)
- ✅ Step Out (Shift+F11)
- ✅ Stop (Shift+F5)

### Paneles de Información
- ✅ **Variables**: Variables locales del contexto actual
- ✅ **Watch**: Expresiones personalizadas para monitorear
- ✅ **Call Stack**: Pila de llamadas de funciones
- ✅ **Breakpoints**: Lista de todos los breakpoints activos

### Indicadores Visuales
- ✅ Línea actual resaltada durante debugging
- ✅ Breakpoints activos marcados con círculos rojos
- ✅ Estado del debugger (running/paused/stopped) visible en el panel

---

## 🔧 Troubleshooting

### Node.js: "No se encontró archivo de entrada"

**Problema:** El debugger no encuentra el archivo principal.

**Solución:**
- Asegúrate de tener un archivo `index.js` en la raíz, O
- Especifica el archivo principal en `package.json`:
  ```json
  {
    "main": "src/app.js"
  }
  ```

### Python: "debugpy no está instalado"

**Problema:** El sistema no puede instalar debugpy automáticamente.

**Solución:**
1. Instala debugpy manualmente:
   ```bash
   pip install debugpy
   ```
   
2. Si usas venv, asegúrate de activarlo primero:
   ```bash
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Linux/Mac
   pip install debugpy
   ```

### Python: "No se encontró archivo Python de entrada"

**Problema:** El debugger no encuentra el archivo principal.

**Solución:**
- Asegúrate de tener `main.py` o `app.py` en la raíz del proyecto
- O coloca tu archivo principal en la raíz con cualquier nombre `.py`

### "Debugging solo está disponible en Electron"

**Problema:** Intentas usar el debugger en el navegador.

**Solución:**
- El debugger solo funciona en la versión de Electron (aplicación de escritorio)
- Ejecuta la aplicación con: `npm run electron:dev`

### El debugger no se conecta

**Problema:** El proceso inicia pero no se puede conectar.

**Solución:**
1. Verifica que el puerto de debugging no esté bloqueado por firewall
2. Asegúrate de que no haya otro proceso usando el mismo puerto
3. Reinicia la aplicación

### Breakpoints no funcionan

**Problema:** Los breakpoints se colocan pero el código no se pausa.

**Solución:**
1. Asegúrate de que el debugger esté iniciado (botón "Iniciar")
2. Verifica que estés colocando breakpoints en el archivo correcto que se está ejecutando
3. Para Node.js, asegúrate de que el archivo que estás debuggeando sea el mismo que se ejecuta

---

## 📝 Notas Importantes

### Node.js
- ✅ **No requiere configuración adicional**
- ✅ Funciona con cualquier versión de Node.js que soporte `--inspect`
- ✅ Los breakpoints funcionan en archivos JavaScript estándar

### Python
- ✅ `debugpy` se instala automáticamente la primera vez
- ✅ Si tienes problemas con la auto-instalación, instala `debugpy` manualmente
- ✅ Funciona mejor con Python 3.7 o superior

### Ambos
- ✅ El debugger se detiene automáticamente cuando cierras el proyecto
- ✅ Los breakpoints se mantienen durante la sesión de debugging
- ✅ Puedes tener múltiples proyectos con debugging simultáneo

---

## 🚀 Ejemplo Completo

### Proyecto Node.js Completo

```json
// package.json
{
  "name": "mi-proyecto",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
```

```javascript
// index.js
function calcular(a, b, operacion) {
  // Coloca un breakpoint aquí
  if (operacion === 'suma') {
    return a + b;
  } else if (operacion === 'resta') {
    return a - b;
  }
  return 0;
}

const resultado = calcular(10, 5, 'suma');
console.log('Resultado:', resultado);
```

### Proyecto Python Completo

```python
# main.py
def calcular(a, b, operacion):
    # Coloca un breakpoint aquí
    if operacion == 'suma':
        return a + b
    elif operacion == 'resta':
        return a - b
    return 0

if __name__ == "__main__":
    resultado = calcular(10, 5, 'suma')
    print(f"Resultado: {resultado}")
```

---

## 📞 Soporte

Si encuentras problemas que no están cubiertos en esta guía:

1. Revisa los mensajes de error en la consola de la aplicación
2. Verifica que tu proyecto tenga la estructura correcta
3. Asegúrate de estar usando la versión de Electron (no navegador)

---

## ✅ Checklist de Configuración

### Para Proyectos Node.js:
- [ ] Proyecto tiene `package.json`
- [ ] Existe `index.js` o está especificado en `package.json` → `main`
- [ ] Node.js está instalado en el sistema

### Para Proyectos Python:
- [ ] Proyecto tiene `main.py` o `app.py` en la raíz
- [ ] Python está instalado en el sistema
- [ ] `debugpy` está disponible (se instala automáticamente)

### Ambos:
- [ ] Proyecto abierto en Visual Code dentro del Centro de Ejecución
- [ ] Aplicación ejecutándose en modo Electron

---

¡Listo! Ahora puedes debuggear tus proyectos sin configuración adicional. 🎉



