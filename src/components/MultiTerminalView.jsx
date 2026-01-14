import { useState, useEffect, useRef } from 'react';
import { Plus, X, Settings, Terminal } from 'lucide-react';
import TerminalTab from './TerminalTab';
import TerminalSettingsModal from './TerminalSettingsModal';

export default function MultiTerminalView({ 
  terminals = [], 
  activeTerminalId = '', 
  onUpdateTerminals,
  onUpdateActiveTerminal 
}) {
  const [localTerminals, setLocalTerminals] = useState(() => {
    try {
      if (terminals.length > 0) {
        return terminals;
      }
      // Crear terminal por defecto
      const defaultTerm = {
        id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Terminal 1',
        shell: typeof window !== 'undefined' && window.electronAPI?.platform === 'win32' ? 'cmd' : 'bash',
        currentDirectory: '~',
        output: '',
        history: [],
        styles: {
          backgroundColor: '#1e1e1e',
          textColor: '#d4d4d4',
          promptColor: '#4ec9b0',
          errorColor: '#f48771'
        },
        createdAt: new Date().toISOString()
      };
      return [defaultTerm];
    } catch {
      const defaultTerm = {
        id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Terminal 1',
        shell: 'bash',
        currentDirectory: '~',
        output: '',
        history: [],
        styles: {
          backgroundColor: '#1e1e1e',
          textColor: '#d4d4d4',
          promptColor: '#4ec9b0',
          errorColor: '#f48771'
        },
        createdAt: new Date().toISOString()
      };
      return [defaultTerm];
    }
  });
  const [localActiveId, setLocalActiveId] = useState(() => {
    return activeTerminalId || (localTerminals.length > 0 ? localTerminals[0].id : '');
  });
  const [settingsTerminal, setSettingsTerminal] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Sincronizar con props
  useEffect(() => {
    if (terminals.length > 0) {
      setLocalTerminals(terminals);
    }
  }, [terminals]);

  useEffect(() => {
    if (activeTerminalId) {
      setLocalActiveId(activeTerminalId);
    }
  }, [activeTerminalId]);

  const createDefaultTerminal = (index = 0) => {
    const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
    return {
      id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Terminal ${index + 1}`,
      shell: isWindows ? 'cmd' : 'bash',
      currentDirectory: '~',
      output: '',
      history: [],
      styles: {
        backgroundColor: '#1e1e1e',
        textColor: '#d4d4d4',
        promptColor: '#4ec9b0',
        errorColor: '#f48771'
      },
      createdAt: new Date().toISOString()
    };
  };

  // Inicializar directorio actual para nuevas terminales
  useEffect(() => {
    const initDirectories = async () => {
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.getCurrentDirectory) {
        try {
          const cwd = await window.electronAPI.getCurrentDirectory();
          const updated = localTerminals.map(t => {
            if (t.currentDirectory === '~') {
              return { ...t, currentDirectory: cwd };
            }
            return t;
          });
          if (JSON.stringify(updated) !== JSON.stringify(localTerminals)) {
            setLocalTerminals(updated);
            onUpdateTerminals(updated);
          }
        } catch (error) {
          console.error('Error obteniendo directorio actual:', error);
        }
      }
    };
    if (localTerminals.length > 0) {
      initDirectories();
    }
  }, [localTerminals.length]);

  const addTerminal = () => {
    const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
    const newTerminal = {
      id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Terminal ${localTerminals.length + 1}`,
      shell: isWindows ? 'cmd' : 'bash',
      currentDirectory: '~',
      output: '',
      history: [],
      styles: {
        backgroundColor: '#1e1e1e',
        textColor: '#d4d4d4',
        promptColor: '#4ec9b0',
        errorColor: '#f48771'
      },
      createdAt: new Date().toISOString()
    };
    const updated = [...localTerminals, newTerminal];
    setLocalTerminals(updated);
    setLocalActiveId(newTerminal.id);
    onUpdateTerminals(updated);
    onUpdateActiveTerminal(newTerminal.id);
  };

  const removeTerminal = (id) => {
    if (localTerminals.length <= 1) {
      // No permitir eliminar la última terminal
      return;
    }
    const updated = localTerminals.filter(t => t.id !== id);
    setLocalTerminals(updated);
    
    // Si se eliminó la terminal activa, activar la primera disponible
    if (id === localActiveId) {
      const newActiveId = updated.length > 0 ? updated[0].id : '';
      setLocalActiveId(newActiveId);
      onUpdateActiveTerminal(newActiveId);
    }
    
    onUpdateTerminals(updated);
  };

  const updateTerminal = (updatedTerminal) => {
    const updated = localTerminals.map(t => 
      t.id === updatedTerminal.id ? updatedTerminal : t
    );
    setLocalTerminals(updated);
    onUpdateTerminals(updated);
  };

  const executeCommand = async (terminalId, command) => {
    const terminal = localTerminals.find(t => t.id === terminalId);
    if (!terminal) return;

    // Procesar comandos especiales (cd, pwd, clear, etc.)
    const trimmedCommand = command.trim();
    const parts = trimmedCommand.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    // Agregar comando al output
    const prompt = getPrompt(terminal);
    const commandLine = `${prompt}${command}\n`;
    const newOutput = (terminal.output || '') + commandLine;
    
    let updatedTerminal = {
      ...terminal,
      output: newOutput
    };
    updateTerminal(updatedTerminal);

    // Manejar comandos especiales
    if (cmd === 'cd') {
      let newDir = parts.length > 1 ? parts[1] : '~';
      
      // Si es Electron, validar y cambiar directorio real
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.pathExists) {
        try {
          // Resolver ruta
          let targetPath = newDir;
          
          // Si es ~ o vacío, obtener home directory
          if (newDir === '~' || newDir === '') {
            if (window.electronAPI.getCurrentDirectory) {
              try {
                const homeDir = await window.electronAPI.getCurrentDirectory();
                // En Windows, intentar obtener USERPROFILE
                if (window.electronAPI.platform === 'win32') {
                  // Ejecutar comando para obtener USERPROFILE
                  const result = await window.electronAPI.executeCommand('echo %USERPROFILE%', 'cmd');
                  targetPath = result.output?.trim() || homeDir;
                } else {
                  // Unix/Linux/Mac
                  const result = await window.electronAPI.executeCommand('echo $HOME', 'bash');
                  targetPath = result.output?.trim() || homeDir;
                }
              } catch {
                targetPath = '~';
              }
            } else {
              targetPath = '~';
            }
          } else if (newDir.startsWith('/') || (window.electronAPI.platform === 'win32' && /^[A-Za-z]:/.test(newDir))) {
            // Ruta absoluta - usar tal cual
            targetPath = newDir;
          } else if (terminal.currentDirectory !== '~') {
            // Ruta relativa - combinar con directorio actual
            // En el frontend no podemos usar path.resolve, así que haremos una combinación simple
            const separator = window.electronAPI.platform === 'win32' ? '\\' : '/';
            targetPath = terminal.currentDirectory.endsWith(separator) 
              ? terminal.currentDirectory + newDir
              : terminal.currentDirectory + separator + newDir;
          }
          
          // Verificar si el directorio existe
          const exists = await window.electronAPI.pathExists(targetPath);
          if (exists) {
            updatedTerminal = {
              ...updatedTerminal,
              currentDirectory: targetPath
            };
            updateTerminal(updatedTerminal);
            return;
          } else {
            const errorOutput = `\ncd: no such file or directory: ${newDir}\n`;
            updatedTerminal = {
              ...updatedTerminal,
              output: newOutput + errorOutput
            };
            updateTerminal(updatedTerminal);
            return;
          }
        } catch (error) {
          // Si falla, simplemente actualizar el directorio (modo básico)
          updatedTerminal = {
            ...updatedTerminal,
            currentDirectory: newDir
          };
          updateTerminal(updatedTerminal);
          return;
        }
      } else {
        // Modo navegador - solo actualizar el valor
        updatedTerminal = {
          ...updatedTerminal,
          currentDirectory: newDir
        };
        updateTerminal(updatedTerminal);
        return;
      }
    } else if (cmd === 'pwd') {
      const resultOutput = `\n${terminal.currentDirectory}\n`;
      updatedTerminal = {
        ...updatedTerminal,
        output: newOutput + resultOutput
      };
      updateTerminal(updatedTerminal);
      return;
    } else if (cmd === 'clear' || cmd === 'cls') {
      updatedTerminal = {
        ...updatedTerminal,
        output: ''
      };
      updateTerminal(updatedTerminal);
      return;
    }

    // Ejecutar comando
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.executeCommand) {
      try {
        const result = await window.electronAPI.executeCommand(
          command, 
          terminal.shell, 
          terminal.currentDirectory === '~' ? undefined : terminal.currentDirectory
        );

        // Actualizar output con resultado
        const resultOutput = result.error 
          ? `\n${result.error}\n`
          : `\n${result.output || ''}\n`;
        
        // Actualizar directorio actual si cambió
        if (result.currentDirectory) {
          updatedTerminal.currentDirectory = result.currentDirectory;
        }

        updatedTerminal = {
          ...updatedTerminal,
          output: newOutput + resultOutput
        };
        updateTerminal(updatedTerminal);
      } catch (error) {
        const errorOutput = `\nError: ${error.message}\n`;
        updatedTerminal = {
          ...updatedTerminal,
          output: newOutput + errorOutput
        };
        updateTerminal(updatedTerminal);
      }
    } else {
      // Modo navegador - comandos limitados
      const browserResult = await executeBrowserCommand(command, terminal);
      const resultOutput = `\n${browserResult}\n`;
      updatedTerminal = {
        ...updatedTerminal,
        output: newOutput + resultOutput
      };
      updateTerminal(updatedTerminal);
    }
  };

  const executeBrowserCommand = async (command, terminal) => {
    // Comandos básicos que funcionan en el navegador
    const cmd = command.trim().toLowerCase();
    
    if (cmd === 'pwd' || cmd === 'cd') {
      return terminal.currentDirectory || '~';
    } else if (cmd.startsWith('echo ')) {
      return command.substring(5);
    } else if (cmd === 'help') {
      return `Comandos disponibles en modo navegador:
- pwd: Mostrar directorio actual
- cd: Mostrar directorio actual
- echo <texto>: Mostrar texto
- help: Mostrar esta ayuda

Para comandos completos del sistema, usa la versión Electron de la aplicación.`;
    } else {
      return `Comando no disponible en modo navegador. Usa "help" para ver comandos disponibles.`;
    }
  };

  const getPrompt = (terminal) => {
    const cwd = terminal.currentDirectory || '~';
    const shell = terminal.shell || 'bash';
    
    if (shell === 'powershell') {
      return `PS ${cwd}> `;
    } else if (shell === 'cmd') {
      return `${cwd}>`;
    } else {
      const user = 'user';
      const host = 'localhost';
      return `${user}@${host}:${cwd}$ `;
    }
  };

  const activeTerminal = localTerminals.find(t => t.id === localActiveId) || localTerminals[0];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {localTerminals.map(terminal => (
          <button
            key={terminal.id}
            onClick={() => {
              setLocalActiveId(terminal.id);
              onUpdateActiveTerminal(terminal.id);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t transition-colors text-sm ${
              terminal.id === localActiveId
                ? 'bg-gray-900 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>{terminal.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSettingsTerminal(terminal);
                setShowSettings(true);
              }}
              className="hover:bg-gray-600 rounded p-0.5 ml-1"
              title="Configurar terminal"
            >
              <Settings className="w-3 h-3" />
            </button>
            {localTerminals.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTerminal(terminal.id);
                }}
                className="hover:bg-gray-600 rounded p-0.5"
                title="Cerrar terminal"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
        <button
          onClick={addTerminal}
          className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
          title="Nueva terminal"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal content */}
      <div className="flex-1 overflow-hidden">
        {activeTerminal && (
          <TerminalTab
            terminal={activeTerminal}
            isActive={activeTerminal.id === localActiveId}
            onClose={() => removeTerminal(activeTerminal.id)}
            onActivate={() => {
              setLocalActiveId(activeTerminal.id);
              onUpdateActiveTerminal(activeTerminal.id);
            }}
            onExecuteCommand={executeCommand}
            onUpdateTerminal={updateTerminal}
          />
        )}
      </div>

      {/* Modal de configuración */}
      <TerminalSettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setSettingsTerminal(null);
        }}
        terminal={settingsTerminal}
        onSave={(updatedTerminal) => {
          updateTerminal(updatedTerminal);
          setShowSettings(false);
          setSettingsTerminal(null);
        }}
      />
    </div>
  );
}

