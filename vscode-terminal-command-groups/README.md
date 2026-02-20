# Terminal Command Groups

Una extensión de Visual Studio Code para organizar y gestionar comandos de terminal agrupados por categorías.

## 🎯 Características

- ✅ **Guardado Automático**: Guarda automáticamente los comandos que ejecutas
- ✅ **Agrupación Inteligente**: Organiza comandos en grupos personalizados (Git, Docker, npm, Python, etc.)
- ✅ **Detección de Contexto**: Detecta automáticamente el tipo de proyecto (Python, Node.js, Java, etc.)
- ✅ **Acceso Rápido**: Accede a tus comandos guardados desde la paleta de comandos o sidebar
- ✅ **Gestión Visual**: Interfaz visual para crear, editar y eliminar grupos
- ✅ **Copiar con un Clic**: Copia comandos guardados directamente al portapapeles
- ✅ **Estadísticas**: Ve la frecuencia de uso de tus comandos
- ✅ **Multi-Workspace**: Diferentes grupos para diferentes proyectos

## 📦 Instalación

### Desde VS Code Marketplace (Próximamente)

1. Abre VS Code
2. Ve a Extensiones (Ctrl+Shift+X)
3. Busca "Terminal Command Groups"
4. Haz clic en Instalar

### Desde Código Fuente

```bash
cd vscode-terminal-command-groups
npm install
npm run compile
code --install-extension terminal-command-groups-0.1.0.vsix
```

## 🚀 Uso

### Configurar Workspace

1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Ejecuta: `Terminal Command Groups: Select Workspace for Commands`
3. Selecciona la carpeta donde quieres guardar tus comandos

### Gestionar Grupos

1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Ejecuta: `Terminal Command Groups: Manage Command Groups`
3. Crea grupos, asigna comandos y organiza tu flujo de trabajo

### Ver Comandos Guardados

1. Abre la paleta de comandos (Ctrl+Shift+P)
2. Ejecuta: `Terminal Command Groups: Show Saved Commands`
3. Selecciona un comando para ejecutarlo o copiarlo

### Agregar Comando Actual

1. Escribe un comando en la terminal
2. Abre la paleta de comandos (Ctrl+Shift+P)
3. Ejecuta: `Terminal Command Groups: Add Current Command to Group`
4. Selecciona el grupo donde quieres guardarlo

## ⚙️ Configuración

```json
{
  "terminalCommandGroups.autoSave": true,
  "terminalCommandGroups.autoDetectContext": true,
  "terminalCommandGroups.maxCommands": 1000,
  "terminalCommandGroups.storagePath": ""
}
```

## 📝 Estructura de Datos

Los comandos se guardan en:

```
{workspacePath}/.vscode/terminal-command-groups.json
```

Estructura:
```json
{
  "commands": {
    "git status": {
      "count": 15,
      "groupId": "group-123"
    }
  },
  "groups": {
    "group-123": {
      "name": "Git",
      "color": "#3b82f6",
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  }
}
```

## 🛠️ Desarrollo

### Requisitos

- Node.js 18+
- TypeScript 5+
- VS Code 1.74+

### Compilar

```bash
npm install
npm run compile
```

### Ejecutar en Modo Desarrollo

1. Abre este proyecto en VS Code
2. Presiona F5 para iniciar una nueva ventana de VS Code con la extensión cargada
3. Abre una terminal y prueba la funcionalidad

### Empaquetar

```bash
npm run package
```

Esto generará un archivo `.vsix` que puedes instalar manualmente.

## 📄 Licencia

MIT

## 👤 Autor

**Andres Naranjo (afnarqui)**
- Email: afnarqui@hotmail.com

## 🙏 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.
