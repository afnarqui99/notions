# TerminalCommandGroupsModal - Análisis de Funcionalidades

## 📋 Resumen del Componente

El componente `TerminalCommandGroupsModal` es un sistema completo de gestión de comandos de terminal que permite organizar, agrupar y reutilizar comandos frecuentemente utilizados.

## 🎯 Funcionalidades Principales

### 1. **Gestión de Grupos de Comandos**
- ✅ Crear grupos personalizados con nombre y color
- ✅ Editar nombre y color de grupos existentes
- ✅ Eliminar grupos (con confirmación)
- ✅ Quitar grupos de una terminal específica (sin eliminar comandos)
- ✅ Visualización de grupos con colores personalizados

### 2. **Asignación de Comandos**
- ✅ Asignar comandos a grupos específicos
- ✅ Remover comandos de grupos
- ✅ Ver comandos agrupados por categoría
- ✅ Ver comandos sin grupo asignado
- ✅ Contador de frecuencia de uso por comando

### 3. **Compartir Grupos entre Terminales**
- ✅ Copiar grupos de una terminal a otra
- ✅ Buscar grupos disponibles en otras terminales
- ✅ Ver todos los grupos del sistema
- ✅ Agregar grupos de otras terminales a la terminal actual

### 4. **Búsqueda y Filtrado**
- ✅ Buscar grupos por nombre
- ✅ Buscar grupos por terminal
- ✅ Filtrar grupos disponibles
- ✅ Vista de "Mis Grupos" vs "Todos los Grupos"

### 5. **Persistencia de Datos**
- ✅ Guardado automático en archivos JSON
- ✅ Estructura: `{ terminalId: { commands: {}, groups: {} } }`
- ✅ Historial de comandos con contador de frecuencia
- ✅ Metadatos de creación y actualización

## 📊 Estructura de Datos

```json
{
  "terminalId": {
    "commands": {
      "git status": {
        "count": 15,
        "groupId": "group-123"
      },
      "npm install": {
        "count": 8,
        "groupId": null
      }
    },
    "groups": {
      "group-123": {
        "name": "Git",
        "color": "#3b82f6",
        "createdAt": "2025-01-20T10:00:00.000Z"
      }
    },
    "lastUpdated": "2025-01-20T10:00:00.000Z"
  }
}
```

## 🔧 Servicios Relacionados

### TerminalCommandService
- `saveCommand(terminalId, command)` - Guarda comando ejecutado
- `getFrequentCommands(terminalId, limit, groupId)` - Obtiene comandos frecuentes
- `getGroups(terminalId)` - Obtiene grupos de una terminal
- `createGroup(terminalId, name, color)` - Crea nuevo grupo
- `assignCommandToGroup(terminalId, command, groupId)` - Asigna comando a grupo
- `copyGroupToTerminal(sourceTerminalId, targetTerminalId, sourceGroupId)` - Copia grupo
- `getAllGroups()` - Obtiene todos los grupos del sistema

## 💡 Casos de Uso

1. **Desarrollador Python**: Agrupa comandos como `pip install`, `python manage.py`, `pytest`
2. **Desarrollador Node.js**: Agrupa `npm install`, `npm run dev`, `npm test`
3. **DevOps**: Agrupa comandos de Docker, Kubernetes, Git
4. **Multi-proyecto**: Diferentes grupos para diferentes proyectos/terminales

## 🎨 Características de UI

- Modal responsive con diseño moderno
- Soporte para modo oscuro
- Búsqueda en tiempo real
- Selector de colores para grupos
- Contadores de frecuencia de comandos
- Confirmaciones para acciones destructivas
- Vista de comandos agrupados y sin grupo

