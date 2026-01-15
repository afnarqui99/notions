/**
 * Servicio para guardar y recuperar comandos frecuentes por terminal
 * Guarda en base de datos para persistencia
 */

import LocalStorageService from './LocalStorageService';

class TerminalCommandService {
  constructor() {
    this.filename = 'terminal-commands.json';
    this.commandsData = null; // { terminalId: { commands: { command: count }, lastUpdated } }
  }

  // Cargar datos de comandos desde archivo o localStorage
  async loadCommandsData() {
    if (this.commandsData !== null) {
      return this.commandsData;
    }

    try {
      const data = await LocalStorageService.readJSONFile(this.filename, 'data');
      this.commandsData = data || {};
      return this.commandsData;
    } catch (error) {
      console.error('Error cargando comandos de terminal:', error);
      this.commandsData = {};
      return this.commandsData;
    }
  }

  // Validar si un comando es válido
  isValidCommand(command) {
    if (!command || !command.trim()) return false;
    
    const trimmed = command.trim();
    
    // Comandos vacíos o solo espacios no son válidos
    if (trimmed.length === 0) return false;
    
    // Comandos demasiado cortos (menos de 2 caracteres) probablemente no son válidos
    if (trimmed.length < 2) return false;
    
    // Comandos demasiado largos probablemente no son válidos (más de 500 caracteres)
    if (trimmed.length > 500) return false;
    
    // Comandos que son solo caracteres especiales o números no son válidos
    if (/^[^a-zA-Z]+$/.test(trimmed)) return false;
    
    // Debe empezar con una letra o ser un comando conocido que empiece con símbolo
    if (!/^[a-zA-Z]/.test(trimmed) && !/^[\.\/]/.test(trimmed)) return false;
    
    // Comandos válidos comunes - lista más específica
    const validCommandPrefixes = [
      // Gestores de paquetes
      'npm', 'yarn', 'pnpm', 'pip', 'conda', 'poetry', 'composer', 'cargo', 'mvn', 'gradle',
      // Lenguajes y ejecutores
      'node', 'python', 'py', 'php', 'ruby', 'go', 'rustc', 'swift', 'kotlin', 'scala', 'perl',
      // Control de versiones
      'git',
      // Contenedores
      'docker', 'podman', 'kubectl',
      // Shell commands
      'cd', 'ls', 'pwd', 'mkdir', 'rm', 'rmdir', 'cp', 'mv', 'cat', 'echo', 'grep', 'find', 'chmod', 'chown',
      'touch', 'head', 'tail', 'less', 'more', 'wc', 'sort', 'uniq', 'diff', 'patch',
      // Compiladores
      'gcc', 'g++', 'javac', 'dotnet', 'tsc',
      // Editores
      'vim', 'nano', 'emacs', 'code', 'cursor', 'subl',
      // Build tools
      'webpack', 'rollup', 'parcel', 'vite', 'esbuild',
      // Linters/Formatters
      'eslint', 'prettier', 'black', 'flake8',
      // Testing
      'jest', 'mocha', 'pytest', 'junit',
      // Windows
      'dir', 'type', 'del', 'copy', 'move', 'ren', 'cls', 'ipconfig', 'ping', 'netstat', 'tasklist', 'taskkill',
      // Otros
      'sudo', 'apt', 'yum', 'dnf', 'pacman', 'brew', 'choco', 'winget', 'ps', 'kill', 'top', 'htop'
    ];
    
    // Extraer el primer "palabra" del comando (antes del primer espacio)
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    
    // Verificar si empieza con un comando válido conocido
    const startsWithValidCommand = validCommandPrefixes.some(prefix => 
      firstWord === prefix || firstWord.startsWith(prefix + '/') || firstWord.startsWith('./') || firstWord.startsWith('../')
    );
    
    // También permitir rutas absolutas o relativas a archivos ejecutables
    const isPathCommand = /^[\.\/]/.test(trimmed) || /^[a-zA-Z]:[\\\/]/.test(trimmed);
    
    // También permitir comandos que parecen ser ejecutables con argumentos válidos
    const hasValidStructure = /^[a-zA-Z][a-zA-Z0-9_\-\.\/]*(\s+[^\s]+)*$/.test(trimmed);
    
    // El comando es válido si:
    // 1. Empieza con un comando conocido, O
    // 2. Es una ruta a un ejecutable, O
    // 3. Tiene una estructura válida Y tiene al menos 2 caracteres alfanuméricos
    return startsWithValidCommand || isPathCommand || (hasValidStructure && /[a-zA-Z]{2,}/.test(trimmed));
  }

  // Guardar comando ejecutado
  async saveCommand(terminalId, command) {
    if (!command || !command.trim()) return;
    
    // Validar que el comando sea válido antes de guardarlo
    if (!this.isValidCommand(command)) {
      console.log('[TerminalCommandService] Comando no válido, no se guardará:', command);
      return;
    }

    await this.loadCommandsData();

    if (!this.commandsData[terminalId]) {
      this.commandsData[terminalId] = {
        commands: {},
        groups: {}, // { groupId: { name, color, commandIds: [] } }
        lastUpdated: new Date().toISOString()
      };
    }

    // Inicializar groups si no existe
    if (!this.commandsData[terminalId].groups) {
      this.commandsData[terminalId].groups = {};
    }

    const trimmedCommand = command.trim();
    if (!this.commandsData[terminalId].commands[trimmedCommand]) {
      this.commandsData[terminalId].commands[trimmedCommand] = {
        count: 0,
        groupId: null // Por defecto sin grupo
      };
    }

    // Si commands[command] es un número (formato antiguo), migrar a objeto
    if (typeof this.commandsData[terminalId].commands[trimmedCommand] === 'number') {
      this.commandsData[terminalId].commands[trimmedCommand] = {
        count: this.commandsData[terminalId].commands[trimmedCommand],
        groupId: null
      };
    }

    this.commandsData[terminalId].commands[trimmedCommand].count++;
    this.commandsData[terminalId].lastUpdated = new Date().toISOString();

    await this.saveCommandsData();
  }

  // Obtener comandos más frecuentes para un terminal
  async getFrequentCommands(terminalId, limit = 7, groupId = null) {
    await this.loadCommandsData();

    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].commands) {
      return [];
    }

    let commands = Object.entries(this.commandsData[terminalId].commands)
      .map(([command, data]) => {
        // Compatibilidad con formato antiguo (número)
        const count = typeof data === 'number' ? data : data.count;
        const cmdGroupId = typeof data === 'object' ? data.groupId : null;
        return { command, count, groupId: cmdGroupId };
      });

    // Filtrar por grupo si se especifica
    if (groupId) {
      commands = commands.filter(cmd => cmd.groupId === groupId);
    }

    // Ordenar por frecuencia y limitar
    commands = commands
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return commands;
  }

  // Obtener comandos que coinciden con un prefijo
  async getMatchingCommands(terminalId, prefix, limit = 7, groupId = null) {
    if (!prefix || !prefix.trim()) {
      return await this.getFrequentCommands(terminalId, limit, groupId);
    }

    await this.loadCommandsData();

    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].commands) {
      return [];
    }

    const prefixLower = prefix.toLowerCase().trim();
    let matching = Object.entries(this.commandsData[terminalId].commands)
      .filter(([command]) => command.toLowerCase().startsWith(prefixLower))
      .map(([command, data]) => {
        // Compatibilidad con formato antiguo
        const count = typeof data === 'number' ? data : data.count;
        const cmdGroupId = typeof data === 'object' ? data.groupId : null;
        return { command, count, groupId: cmdGroupId };
      });

    // Filtrar por grupo si se especifica
    if (groupId) {
      matching = matching.filter(cmd => cmd.groupId === groupId);
    }

    matching = matching
      .sort((a, b) => {
        // Primero por si empieza exactamente con el prefijo
        const aExact = a.command.toLowerCase().startsWith(prefixLower);
        const bExact = b.command.toLowerCase().startsWith(prefixLower);
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        // Luego por frecuencia
        return b.count - a.count;
      })
      .slice(0, limit);

    return matching;
  }

  // Detectar lenguaje del comando (heurística simple)
  detectCommandLanguage(command) {
    const cmd = command.toLowerCase().trim();
    
    if (cmd.startsWith('npm ') || cmd.startsWith('node ') || cmd.startsWith('npx ')) {
      return 'JavaScript';
    }
    if (cmd.startsWith('python ') || cmd.startsWith('pip ') || cmd.startsWith('py ')) {
      return 'Python';
    }
    if (cmd.startsWith('git ')) {
      return 'Git';
    }
    if (cmd.startsWith('docker ')) {
      return 'Docker';
    }
    if (cmd.startsWith('cd ') || cmd.startsWith('ls ') || cmd.startsWith('mkdir ')) {
      return 'Shell';
    }
    if (cmd.startsWith('dotnet ') || cmd.includes('.csproj')) {
      return '.NET';
    }
    if (cmd.startsWith('java ') || cmd.includes('.jar')) {
      return 'Java';
    }
    
    return null;
  }

  // Guardar datos en archivo
  async saveCommandsData() {
    try {
      await LocalStorageService.saveJSONFile(this.filename, this.commandsData, 'data');
    } catch (error) {
      console.error('Error guardando comandos de terminal:', error);
    }
  }

  // Eliminar un comando específico de un terminal
  async deleteCommand(terminalId, command) {
    await this.loadCommandsData();
    
    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].commands) {
      return false;
    }

    const trimmedCommand = command.trim();
    if (this.commandsData[terminalId].commands[trimmedCommand]) {
      delete this.commandsData[terminalId].commands[trimmedCommand];
      this.commandsData[terminalId].lastUpdated = new Date().toISOString();
      await this.saveCommandsData();
      return true;
    }

    return false;
  }

  // Limpiar comandos de un terminal
  async clearTerminalCommands(terminalId) {
    await this.loadCommandsData();
    if (this.commandsData[terminalId]) {
      delete this.commandsData[terminalId];
      await this.saveCommandsData();
    }
  }

  // Obtener estadísticas de un terminal
  async getTerminalStats(terminalId) {
    await this.loadCommandsData();
    
    if (!this.commandsData[terminalId]) {
      return {
        totalCommands: 0,
        uniqueCommands: 0,
        mostUsed: null
      };
    }

    const commands = this.commandsData[terminalId].commands;
    const entries = Object.entries(commands);
    const totalCommands = entries.reduce((sum, [, data]) => {
      const count = typeof data === 'number' ? data : data.count;
      return sum + count;
    }, 0);
    const uniqueCommands = entries.length;
    const mostUsed = entries.length > 0 
      ? entries.sort((a, b) => {
          const aCount = typeof a[1] === 'number' ? a[1] : a[1].count;
          const bCount = typeof b[1] === 'number' ? b[1] : b[1].count;
          return bCount - aCount;
        })[0]
      : null;

    return {
      totalCommands,
      uniqueCommands,
      mostUsed: mostUsed ? { 
        command: mostUsed[0], 
        count: typeof mostUsed[1] === 'number' ? mostUsed[1] : mostUsed[1].count 
      } : null
    };
  }

  // Obtener todos los grupos de un terminal
  async getGroups(terminalId) {
    await this.loadCommandsData();
    
    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].groups) {
      return {};
    }

    return this.commandsData[terminalId].groups;
  }

  // Crear un nuevo grupo
  async createGroup(terminalId, name, color = '#3b82f6') {
    await this.loadCommandsData();

    if (!this.commandsData[terminalId]) {
      this.commandsData[terminalId] = {
        commands: {},
        groups: {},
        lastUpdated: new Date().toISOString()
      };
    }

    if (!this.commandsData[terminalId].groups) {
      this.commandsData[terminalId].groups = {};
    }

    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.commandsData[terminalId].groups[groupId] = {
      name: name.trim(),
      color: color,
      createdAt: new Date().toISOString()
    };

    this.commandsData[terminalId].lastUpdated = new Date().toISOString();
    await this.saveCommandsData();

    return groupId;
  }

  // Actualizar un grupo
  async updateGroup(terminalId, groupId, updates) {
    await this.loadCommandsData();

    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].groups || !this.commandsData[terminalId].groups[groupId]) {
      return false;
    }

    this.commandsData[terminalId].groups[groupId] = {
      ...this.commandsData[terminalId].groups[groupId],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.commandsData[terminalId].lastUpdated = new Date().toISOString();
    await this.saveCommandsData();

    return true;
  }

  // Eliminar un grupo
  async deleteGroup(terminalId, groupId) {
    await this.loadCommandsData();

    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].groups || !this.commandsData[terminalId].groups[groupId]) {
      return false;
    }

    // Desasignar comandos del grupo antes de eliminarlo
    if (this.commandsData[terminalId].commands) {
      Object.keys(this.commandsData[terminalId].commands).forEach(command => {
        const cmdData = this.commandsData[terminalId].commands[command];
        if (typeof cmdData === 'object' && cmdData.groupId === groupId) {
          cmdData.groupId = null;
        }
      });
    }

    delete this.commandsData[terminalId].groups[groupId];
    this.commandsData[terminalId].lastUpdated = new Date().toISOString();
    await this.saveCommandsData();

    return true;
  }

  // Asignar un comando a un grupo
  async assignCommandToGroup(terminalId, command, groupId) {
    await this.loadCommandsData();

    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].commands) {
      return false;
    }

    const trimmedCommand = command.trim();
    if (!this.commandsData[terminalId].commands[trimmedCommand]) {
      return false;
    }

    // Migrar formato antiguo si es necesario
    if (typeof this.commandsData[terminalId].commands[trimmedCommand] === 'number') {
      this.commandsData[terminalId].commands[trimmedCommand] = {
        count: this.commandsData[terminalId].commands[trimmedCommand],
        groupId: groupId
      };
    } else {
      this.commandsData[terminalId].commands[trimmedCommand].groupId = groupId;
    }

    this.commandsData[terminalId].lastUpdated = new Date().toISOString();
    await this.saveCommandsData();

    return true;
  }

  // Remover un comando de su grupo
  async removeCommandFromGroup(terminalId, command) {
    await this.loadCommandsData();

    if (!this.commandsData[terminalId] || !this.commandsData[terminalId].commands) {
      return false;
    }

    const trimmedCommand = command.trim();
    if (!this.commandsData[terminalId].commands[trimmedCommand]) {
      return false;
    }

    // Migrar formato antiguo si es necesario
    if (typeof this.commandsData[terminalId].commands[trimmedCommand] === 'number') {
      // Ya está sin grupo
      return true;
    }

    this.commandsData[terminalId].commands[trimmedCommand].groupId = null;
    this.commandsData[terminalId].lastUpdated = new Date().toISOString();
    await this.saveCommandsData();

    return true;
  }
}

export default new TerminalCommandService();

