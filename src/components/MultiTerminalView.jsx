import { useState, useEffect, useRef } from 'react';
import { Plus, X, Settings, Terminal } from 'lucide-react';
import TerminalTab from './TerminalTab';
import TerminalSettingsModal from './TerminalSettingsModal';

export default function MultiTerminalView({ 
  terminals = [], 
  activeTerminalId = '', 
  onUpdateTerminals,
  onUpdateActiveTerminal,
  hideTabs = false // Opción para ocultar las pestañas cuando se manejan externamente
}) {
  // Configurar listeners para output en tiempo real
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.onTerminalOutput) {
      const handleOutput = (data) => {
        onUpdateTerminals(prev => prev.map(t => {
          if (t.id === data.terminalId) {
            const currentOutput = t.output || '';
            return {
              ...t,
              output: currentOutput + data.data
            };
          }
          return t;
        }));
      };

      const handleProcessClosed = (data) => {
        onUpdateTerminals(prev => prev.map(t => {
          if (t.id === data.terminalId) {
            const currentOutput = t.output || '';
            // Solo mostrar mensaje si el proceso terminó con error (código diferente de 0)
            // Para comandos exitosos, no mostrar mensaje (como en una terminal normal)
            let closedMessage = '';
            if (data.exitCode !== 0 && data.exitCode !== null) {
              closedMessage = `\n\n[✗ Proceso terminado con código de error ${data.exitCode}]\n`;
            }
            return {
              ...t,
              output: currentOutput + closedMessage
            };
          }
          return t;
        }));
      };

      window.electronAPI.onTerminalOutput(handleOutput);
      window.electronAPI.onTerminalProcessClosed(handleProcessClosed);

      return () => {
        if (window.electronAPI && window.electronAPI.removeTerminalListeners) {
          window.electronAPI.removeTerminalListeners();
        }
      };
    }
  }, [onUpdateTerminals]);

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
    return {
      id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Terminal ${index + 1}`,
      shell: 'bash', // Por defecto bash
      currentDirectory: '~',
      output: '',
      history: [],
      styles: {
        backgroundColor: '#1a0d2e', // Purple theme por defecto
        textColor: '#e0b0ff',
        promptColor: '#b794f6',
        errorColor: '#fc8181',
        fontSize: 14,
        outputFontSize: 14,
        inputFontSize: 22, // Valor por defecto 22px
        outputHeight: 400,
        inputHeight: 220, // Valor por defecto 220px
        headerBackgroundColor: '#1f2937', // Color de fondo del header por defecto
        headerTextColor: '#ffffff' // Color de texto del header por defecto
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
    console.log('[MultiTerminalView] Actualizando terminal:', {
      id: updatedTerminal.id,
      name: updatedTerminal.name,
      shell: updatedTerminal.shell,
      currentDirectory: updatedTerminal.currentDirectory,
      styles: updatedTerminal.styles
    });
    const updated = localTerminals.map(t => {
      if (t.id === updatedTerminal.id) {
        // Crear un nuevo objeto para forzar la actualización
        return {
          ...updatedTerminal,
          // Asegurarse de que todos los campos estén presentes
          id: updatedTerminal.id,
          name: updatedTerminal.name || t.name,
          shell: updatedTerminal.shell || t.shell || 'bash',
          currentDirectory: updatedTerminal.currentDirectory || t.currentDirectory || '~',
          output: updatedTerminal.output !== undefined ? updatedTerminal.output : t.output,
          history: updatedTerminal.history || t.history || [],
          styles: updatedTerminal.styles || t.styles || {
            backgroundColor: '#1e1e1e',
            textColor: '#d4d4d4',
            promptColor: '#4ec9b0',
            errorColor: '#f48771'
          },
          createdAt: updatedTerminal.createdAt || t.createdAt
        };
      }
      return t;
    });
    console.log('[MultiTerminalView] Terminal actualizado. Nuevo shell:', updated.find(t => t.id === updatedTerminal.id)?.shell);
    setLocalTerminals(updated);
    onUpdateTerminals(updated);
    console.log('[MultiTerminalView] Terminal actualizado en la lista');
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
          
          // Verificar si la ruta existe y es un directorio
          const pathInfo = await window.electronAPI.isDirectory(targetPath);
          if (!pathInfo.exists) {
            const errorOutput = `\ncd: no such file or directory: ${newDir}\n`;
            updatedTerminal = {
              ...updatedTerminal,
              output: newOutput + errorOutput
            };
            updateTerminal(updatedTerminal);
            return;
          } else if (!pathInfo.isDirectory) {
            // Es un archivo, no un directorio
            const errorOutput = `\ncd: not a directory: ${newDir}\n`;
            updatedTerminal = {
              ...updatedTerminal,
              output: newOutput + errorOutput
            };
            updateTerminal(updatedTerminal);
            return;
          } else {
            // Es un directorio válido - normalizar la ruta para evitar rutas raras
            let normalizedPath = targetPath;
            try {
              // Usar el handler normalize-path de Electron si está disponible
              if (window.electronAPI && window.electronAPI.normalizePath) {
                normalizedPath = await window.electronAPI.normalizePath(targetPath);
              } else {
                // Fallback: normalizar manualmente usando path.resolve lógica
                const separator = window.electronAPI?.platform === 'win32' ? '\\' : '/';
                const isAbsolute = /^[A-Za-z]:/.test(targetPath) || targetPath.startsWith('/');
                let drive = '';
                let pathWithoutDrive = targetPath;
                
                // Extraer unidad en Windows
                if (window.electronAPI?.platform === 'win32' && /^[A-Za-z]:/.test(targetPath)) {
                  drive = targetPath.substring(0, 2); // C:
                  pathWithoutDrive = targetPath.substring(2);
                }
                
                // Dividir en partes y filtrar vacíos y puntos simples
                const parts = pathWithoutDrive.split(/[/\\]+/).filter(p => p && p !== '.');
                const resolved = [];
                
                for (const part of parts) {
                  if (part === '..') {
                    if (resolved.length > 0 && resolved[resolved.length - 1] !== '..') {
                      resolved.pop();
                    } else if (!isAbsolute) {
                      // Solo agregar .. si no es absoluta
                      resolved.push(part);
                    }
                  } else {
                    resolved.push(part);
                  }
                }
                
                // Reconstruir la ruta
                if (isAbsolute) {
                  normalizedPath = drive + separator + resolved.join(separator);
                } else {
                  normalizedPath = resolved.length > 0 ? resolved.join(separator) : '.';
                }
              }
            } catch (error) {
              console.warn('[MultiTerminalView] Error normalizando ruta, usando ruta original:', error);
              // Si falla la normalización, usar la ruta original
              normalizedPath = targetPath;
            }
            
            updatedTerminal = {
              ...updatedTerminal,
              currentDirectory: normalizedPath
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
          terminal.currentDirectory === '~' ? undefined : terminal.currentDirectory,
          terminal.id // Pasar terminalId para procesos de larga duración
        );

        // Si el comando está en modo streaming, no agregar output aquí (se maneja en tiempo real)
        if (result.streaming) {
          // El output se manejará en tiempo real a través de los listeners
          // Solo actualizar el directorio si cambió
          if (result.currentDirectory) {
            let normalizedDir = result.currentDirectory;
            if (window.electronAPI && window.electronAPI.normalizePath) {
              try {
                normalizedDir = await window.electronAPI.normalizePath(result.currentDirectory);
              } catch (error) {
                console.warn('[MultiTerminalView] Error normalizando directorio:', error);
              }
            }
            updatedTerminal.currentDirectory = normalizedDir;
          }
          updateTerminal(updatedTerminal);
          return;
        }

        // Para comandos normales, mostrar output como antes
        let resultOutput = '';
        
        // Si hay output, mostrarlo primero
        if (result.output) {
          resultOutput = result.output;
          // Si el output no termina con nueva línea, agregarla
          if (!resultOutput.endsWith('\n')) {
            resultOutput += '\n';
          }
        }
        
        // Si hay error, agregarlo después del output
        if (result.error) {
          resultOutput += result.error;
          if (!result.error.endsWith('\n')) {
            resultOutput += '\n';
          }
        }
        
        // Si no hay output ni error, mostrar una línea vacía
        if (!resultOutput && !result.error) {
          resultOutput = '\n';
        }
        
        // Actualizar directorio actual si cambió y normalizarlo
        if (result.currentDirectory) {
          let normalizedDir = result.currentDirectory;
          // Normalizar la ruta si está disponible
          if (window.electronAPI && window.electronAPI.normalizePath) {
            try {
              normalizedDir = await window.electronAPI.normalizePath(result.currentDirectory);
            } catch (error) {
              console.warn('[MultiTerminalView] Error normalizando directorio después de comando:', error);
            }
          }
          updatedTerminal.currentDirectory = normalizedDir;
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
    
    if (shell === 'docker') {
      return `🐳 docker ${cwd}$ `;
    } else if (shell === 'powershell') {
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
      {/* Tabs - Solo mostrar si no están ocultas */}
      {!hideTabs && (
        <div 
          className="flex items-center gap-1 px-2 py-1 border-b border-gray-700 overflow-x-auto"
          style={{
            backgroundColor: activeTerminal?.styles?.headerBackgroundColor || '#1f2937'
          }}
        >
          {localTerminals.map(terminal => {
            const isActive = terminal.id === localActiveId;
            const headerBg = terminal.styles?.headerBackgroundColor || '#1f2937';
            const headerText = terminal.styles?.headerTextColor || '#ffffff';
            const inactiveBg = isActive ? headerBg : `${headerBg}80`; // 50% opacity para inactivas
            const inactiveText = isActive ? headerText : `${headerText}80`;
            
            return (
              <div
                key={terminal.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-t transition-colors text-sm"
                style={{
                  backgroundColor: isActive ? headerBg : inactiveBg,
                  color: isActive ? headerText : inactiveText
                }}
              >
                <button
                  onClick={() => {
                    setLocalActiveId(terminal.id);
                    onUpdateActiveTerminal(terminal.id);
                  }}
                  className="flex items-center gap-2 flex-1 text-left"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    padding: 0
                  }}
                >
                  <Terminal className="w-3 h-3" />
                  <span>{terminal.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsTerminal(terminal);
                    setShowSettings(true);
                  }}
                  className="rounded p-0.5 ml-1 opacity-70 hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'
                  }}
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
              </div>
            );
          })}
          <button
            onClick={addTerminal}
            className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Nueva terminal"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

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

