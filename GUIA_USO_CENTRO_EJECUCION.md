# 🚀 Guía de Uso del Centro de Ejecución

## ✅ ¿Está Creado?

**¡SÍ!** El Centro de Ejecución ya está completamente implementado y listo para usar.

---

## 📖 Cómo Abrir el Centro de Ejecución

### Método 1: Comando Slash (Más Rápido)
1. En cualquier página, escribe `/centro` o `/centro-ejecucion`
2. Selecciona "Centro de Ejecución" de la lista
3. ¡Se abrirá la página completa!

### Método 2: Desde Código
Si quieres abrirlo programáticamente:
```javascript
window.dispatchEvent(new CustomEvent('open-centro-ejecucion'));
```

---

## 🎯 Funcionalidades del Centro de Ejecución

### 1. **Gestión de Servicios** (Header Superior)

En la parte superior verás dos servicios:

#### **Node.js Service**
- 🟢 **Verde**: Servicio activo (proceso Node.js corriendo)
- ⚪ **Gris**: Servicio inactivo
- **Botón Play (▶)**: Iniciar servicio
- **Botón Square (■)**: Detener servicio
- **Número amarillo**: Cantidad de ejecuciones en cola

#### **Python Service**
- Mismo comportamiento que Node.js pero para Python

**💡 Recomendación**: 
- Si vas a ejecutar múltiples códigos seguidos, **inicia el servicio primero**
- Esto evita crear procesos nuevos cada vez y no bloquea la app

---

### 2. **Terminales Centralizadas** (Área Principal)

#### **Crear Nueva Terminal**
- Clic en el botón **+** en la barra de pestañas
- Se crea una nueva terminal con configuración por defecto

#### **Múltiples Terminales**
- Puedes tener varias terminales abiertas simultáneamente
- Cambia entre ellas con las pestañas
- Cada terminal mantiene su propio historial y directorio

#### **Configurar Terminal**
- Clic en el icono de **⚙️ Settings** en cada pestaña
- Puedes cambiar:
  - Nombre de la terminal
  - Shell (bash, cmd, powershell)
  - Colores y estilos

#### **Autocompletado de Comandos**
- Mientras escribes, aparecen los **7 comandos más frecuentes**
- Se muestran en la parte superior derecha del input
- Incluye información del lenguaje detectado
- Clic en un comando para usarlo

#### **Comandos Especiales**
- `cd <directorio>`: Cambiar directorio
- `pwd`: Mostrar directorio actual
- `clear` o `cls`: Limpiar pantalla
- Flechas ↑↓: Navegar historial de comandos

---

### 3. **Lista de Proyectos** (Sidebar Izquierdo)

#### **Ver Proyectos Guardados**
- Todos los proyectos que has abierto en Visual Code aparecen aquí
- Muestra el nombre, color y ruta del proyecto

#### **Abrir Proyecto en Visual Code**
- Clic en cualquier proyecto de la lista
- Se abrirá automáticamente en Visual Code
- El proyecto se carga con su configuración guardada (color, título, etc.)

#### **Icono de Carpeta**
- Clic en el icono 📁 para abrir un nuevo proyecto
- Selecciona la carpeta del proyecto

---

## 🔄 Flujo de Trabajo Recomendado

### **Para Trabajar con Múltiples Proyectos Node.js/Python:**

1. **Abrir Centro de Ejecución**
   ```
   Escribe: /centro
   ```

2. **Iniciar Servicios Necesarios**
   - Si vas a ejecutar Node.js: Clic en ▶ de Node.js
   - Si vas a ejecutar Python: Clic en ▶ de Python
   - O ambos si trabajas con los dos

3. **Abrir Proyectos**
   - Desde el sidebar, clic en el proyecto que quieres trabajar
   - O usa `/visual code` para abrir un nuevo proyecto

4. **Usar Terminales**
   - Ejecuta comandos en las terminales centralizadas
   - Los comandos se guardan automáticamente para autocompletado
   - Puedes tener múltiples terminales para diferentes tareas

5. **Ejecutar Código**
   - Desde Visual Code o bloques de consola
   - El servicio compartido procesará todo en cola
   - No se bloqueará la aplicación

---

## 💾 Persistencia

Todo se guarda automáticamente:

- ✅ **Terminales**: Se guardan en `data/centro-ejecucion-terminals.json`
- ✅ **Comandos Frecuentes**: Se guardan en `data/terminal-commands.json`
- ✅ **Configuración de Proyectos**: Se guarda en `data/visual-code-projects/`
- ✅ **Estado de Servicios**: Se mantiene mientras la app esté abierta

**Nota**: Los servicios se cierran automáticamente después de 5 minutos de inactividad para ahorrar recursos.

---

## 🎨 Características Adicionales

### **Editor de Salida de Terminal**
- Clic en el icono **✏️ Edit** en cualquier terminal
- Se abre un modal grande para editar la salida
- Funciones de buscar y reemplazar
- Copiar el texto editado

### **Copiar Salida**
- Clic en el icono **📋 Copy** en cualquier terminal
- Copia toda la salida al portapapeles

---

## 🆘 Solución de Problemas

### **El servicio no inicia**
- Verifica que Node.js o Python estén instalados
- Asegúrate de que estén en el PATH del sistema
- Reinicia la aplicación si es necesario

### **Los proyectos no aparecen**
- Abre primero un proyecto desde Visual Code (`/visual code`)
- Los proyectos se guardan automáticamente cuando los abres

### **Las terminales no guardan**
- Verifica que tengas permisos de escritura en la carpeta de datos
- Revisa la configuración de almacenamiento en Configuración

---

## 📝 Ejemplos de Uso

### **Ejemplo 1: Desarrollo Full-Stack**
```
1. /centro → Abrir Centro de Ejecución
2. Iniciar servicios Node.js y Python
3. Terminal 1: npm run dev (frontend)
4. Terminal 2: python manage.py runserver (backend)
5. Terminal 3: git commands
```

### **Ejemplo 2: Múltiples Proyectos**
```
1. /centro → Abrir Centro de Ejecución
2. Clic en Proyecto A → Se abre en Visual Code
3. Clic en Proyecto B → Se abre en otra pestaña
4. Ejecutar código de ambos proyectos
5. El servicio compartido procesa todo sin bloquear
```

---

## 🎯 Ventajas de esta Arquitectura

✅ **No Bloquea**: El servicio compartido procesa todo en cola  
✅ **Centralizado**: Todo en un solo lugar  
✅ **Múltiples Proyectos**: Sin límites  
✅ **Persistente**: Todo se guarda automáticamente  
✅ **Eficiente**: Un solo proceso por lenguaje en lugar de muchos  

---

¡Disfruta del Centro de Ejecución! 🚀

