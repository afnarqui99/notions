import { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  Square, 
  Plus, 
  X, 
  Settings, 
  FolderOpen,
  Code,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Server,
  FileCode,
  Zap
} from 'lucide-react';
import MultiTerminalView from './MultiTerminalView';
import terminalCommandService from '../services/TerminalCommandService';
import LocalStorageService from '../services/LocalStorageService';

export default function CentroEjecucionPage({ onClose }) {
  const [terminals, setTerminals] = useState([]);
  const [activeTerminalId, setActiveTerminalId] = useState('');
  const [serviceStatus, setServiceStatus] = useState({
    nodejs: { active: false, queueLength: 0, processing: false },
    python: { active: false, queueLength: 0, processing: false }
  });
  const [executionQueue, setExecutionQueue] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Cargar terminales guardadas
  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const saved = await LocalStorageService.readJSONFile('centro-ejecucion-terminals.json', 'data');
        if (saved && saved.terminals && saved.terminals.length > 0) {
          setTerminals(saved.terminals);
          setActiveTerminalId(saved.activeTerminalId || saved.terminals[0]?.id || '');
        } else {
          // Crear terminal por defecto
          const defaultTerm = createDefaultTerminal();
          setTerminals([defaultTerm]);
          setActiveTerminalId(defaultTerm.id);
        }
      } catch (error) {
        console.error('Error cargando terminales:', error);
        const defaultTerm = createDefaultTerminal();
        setTerminals([defaultTerm]);
        setActiveTerminalId(defaultTerm.id);
      }
    };

    loadTerminals();
  }, []);

  // Guardar terminales cuando cambian
  useEffect(() => {
    if (terminals.length > 0) {
      const saveTerminals = async () => {
        try {
          await LocalStorageService.saveJSONFile(
            'centro-ejecucion-terminals.json',
            { terminals, activeTerminalId },
            'data'
          );
        } catch (error) {
          console.error('Error guardando terminales:', error);
        }
      };
      saveTerminals();
    }
  }, [terminals, activeTerminalId]);

  // Verificar estado de servicios periódicamente
  useEffect(() => {
    if (!isElectron || !window.electronAPI?.getCodeServiceStatus) return;

    const checkServices = async () => {
      try {
        const nodejsStatus = await window.electronAPI.getCodeServiceStatus('nodejs');
        const pythonStatus = await window.electronAPI.getCodeServiceStatus('python');
        
        setServiceStatus({
          nodejs: nodejsStatus || { active: false, queueLength: 0, processing: false },
          python: pythonStatus || { active: false, queueLength: 0, processing: false }
        });
      } catch (error) {
        console.error('Error verificando servicios:', error);
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 2000);
    return () => clearInterval(interval);
  }, [isElectron]);

  // Cargar proyectos guardados
  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const files = await LocalStorageService.listFiles('data/visual-code-projects');
        const projectFiles = files.filter(f => f.startsWith('visual-code-project-') && f.endsWith('.json'));
        
        const projectsData = await Promise.all(
          projectFiles.map(async (file) => {
            try {
              const config = await LocalStorageService.readJSONFile(file, 'data/visual-code-projects');
              return {
                id: file.replace('visual-code-project-', '').replace('.json', ''),
                name: config.title || config.projectPath || 'Sin nombre',
                path: config.projectPath,
                color: config.color || '#1e1e1e',
                lastUpdated: config.lastUpdated,
                ...config
              };
            } catch (error) {
              console.error(`Error cargando proyecto ${file}:`, error);
              return null;
            }
          })
        );

        setProjects(projectsData.filter(p => p !== null));
      } catch (error) {
        console.error('Error cargando proyectos:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  const createDefaultTerminal = () => {
    const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
    return {
      id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Terminal Principal',
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

  const addTerminal = () => {
    const newTerminal = createDefaultTerminal();
    newTerminal.name = `Terminal ${terminals.length + 1}`;
    const updated = [...terminals, newTerminal];
    setTerminals(updated);
    setActiveTerminalId(newTerminal.id);
  };

  const removeTerminal = (id) => {
    if (terminals.length <= 1) return;
    const updated = terminals.filter(t => t.id !== id);
    setTerminals(updated);
    if (id === activeTerminalId) {
      setActiveTerminalId(updated.length > 0 ? updated[0].id : '');
    }
  };

  const updateTerminal = (updatedTerminal) => {
    const updated = terminals.map(t => 
      t.id === updatedTerminal.id ? updatedTerminal : t
    );
    setTerminals(updated);
  };

  const changeTerminalDirectory = (projectPath) => {
    console.log('[CentroEjecucionPage] Cambiando directorio de terminal:', {
      projectPath,
      terminalsCount: terminals.length,
      activeTerminalId
    });
    
    if (terminals.length === 0) {
      alert('No hay terminales disponibles. Crea una terminal primero.');
      return;
    }
    
    if (!activeTerminalId) {
      alert('No hay una terminal activa. Selecciona una terminal primero.');
      return;
    }
    
    const terminal = terminals.find(t => t.id === activeTerminalId);
    if (terminal) {
      const updatedTerminal = {
        ...terminal,
        currentDirectory: projectPath
      };
      updateTerminal(updatedTerminal);
      console.log('[CentroEjecucionPage] Directorio de terminal actualizado a:', projectPath);
    } else {
      console.error('[CentroEjecucionPage] Terminal activa no encontrada');
      alert('Error: No se encontró la terminal activa');
    }
  };

  const executeCommand = async (terminalId, command) => {
    const terminal = terminals.find(t => t.id === terminalId);
    if (!terminal) return;

    // Guardar comando en servicio de comandos frecuentes
    await terminalCommandService.saveCommand(terminalId, command);

    // Procesar comandos especiales
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
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.pathExists) {
        try {
          let targetPath = newDir;
          if (newDir === '~' || newDir === '') {
            if (window.electronAPI.getCurrentDirectory) {
              const homeDir = await window.electronAPI.getCurrentDirectory();
              targetPath = homeDir;
            }
          }
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
          updatedTerminal = {
            ...updatedTerminal,
            currentDirectory: newDir
          };
          updateTerminal(updatedTerminal);
          return;
        }
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

        const resultOutput = result.error 
          ? `\n${result.error}\n`
          : `\n${result.output || ''}\n`;
        
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

  const startService = async (language) => {
    if (!isElectron || !window.electronAPI?.startCodeService) return;
    
    try {
      const result = await window.electronAPI.startCodeService(language);
      if (result.success) {
        // Actualizar estado
        const checkServices = async () => {
          const status = await window.electronAPI.getCodeServiceStatus(language);
          setServiceStatus(prev => ({
            ...prev,
            [language]: status || { active: true, queueLength: 0, processing: false }
          }));
        };
        checkServices();
      }
    } catch (error) {
      console.error(`Error iniciando servicio ${language}:`, error);
    }
  };

  const stopService = async (language) => {
    if (!isElectron || !window.electronAPI?.stopCodeService) return;
    
    try {
      await window.electronAPI.stopCodeService(language);
      setServiceStatus(prev => ({
        ...prev,
        [language]: { active: false, queueLength: 0, processing: false }
      }));
    } catch (error) {
      console.error(`Error deteniendo servicio ${language}:`, error);
    }
  };

  const openProjectInVisualCode = (project) => {
    if (!project || !project.path) {
      console.error('[CentroEjecucionPage] No se puede abrir proyecto sin path');
      alert('Error: El proyecto no tiene una ruta válida');
      return;
    }
    
    // Validar que la ruta sea una ruta completa (no solo el nombre de la carpeta)
    // En Electron, las rutas completas tienen / o \ o : (para Windows)
    const isFullPath = project.path.includes('/') || project.path.includes('\\') || project.path.includes(':');
    
    if (!isFullPath && !window.electronAPI) {
      alert('⚠️ Este proyecto fue creado en modo navegador y no tiene una ruta completa.\n\n' +
            'Por favor, vuelve a seleccionar el proyecto usando la versión Electron para tener todas las funcionalidades.');
      return;
    }
    
    console.log('[CentroEjecucionPage] Disparando evento open-visual-code con:', {
      projectPath: project.path,
      projectTitle: project.name || project.title,
      projectColor: project.color,
      theme: project.theme || 'notion',
      fontSize: project.fontSize || 14,
      extensions: project.extensions
    });
    
    // Disparar evento para abrir Visual Code con el proyecto
    // Esto creará o abrirá un bloque Visual Code con el proyecto seleccionado
    const event = new CustomEvent('open-visual-code', { 
      detail: { 
        projectPath: project.path,
        projectTitle: project.name || project.title,
        projectColor: project.color,
        theme: project.theme || 'notion',
        fontSize: project.fontSize || 14,
        extensions: project.extensions
      },
      bubbles: true,
      cancelable: true
    });
    
    window.dispatchEvent(event);
    console.log('[CentroEjecucionPage] Evento disparado, esperando respuesta...');
    
    // Cerrar el Centro de Ejecución para que el usuario vea el bloque Visual Code
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  const handleSelectProject = async () => {
    try {
      let selectedPath = null;
      
      // Usar la misma lógica que Visual Code para seleccionar carpetas
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        // Electron: usar diálogo nativo
        selectedPath = await window.electronAPI.selectDirectory();
      } else if ('showDirectoryPicker' in window) {
        // Navegador: usar File System Access API
        // Nota: En navegador, File System Access API no proporciona rutas completas del sistema
        // Solo funciona completamente en Electron
        alert('⚠️ Selección de proyectos en navegador tiene limitaciones.\n\n' +
              'Para usar todas las funcionalidades de Visual Code, usa la versión Electron.\n\n' +
              'Ejecuta: npm run electron:dev');
        return;
      } else {
        alert('Tu navegador no soporta la selección de carpetas. Usa la versión Electron.');
        return;
      }

      if (selectedPath) {
        // Crear configuración del proyecto
        const projectId = selectedPath.replace(/[<>:"/\\|?*]/g, '_');
        const projectConfig = {
          projectPath: selectedPath,
          title: selectedPath.split(/[/\\]/).pop() || 'Nuevo Proyecto',
          color: '#1e1e1e',
          theme: 'notion',
          fontSize: 14,
          extensions: {
            errorLens: true,
            betterComments: true,
            es7ReactRedux: true,
            reactSimpleSnippets: true,
            autoCloseTag: true,
            pasteJsonAsCode: true,
            backticks: true,
            tokyoNight: false,
            beardedIcons: true
          },
          lastUpdated: new Date().toISOString()
        };

        // Guardar proyecto
        await LocalStorageService.saveJSONFile(
          `visual-code-project-${projectId}.json`,
          projectConfig,
          'data/visual-code-projects'
        );

        // Recargar proyectos
        const files = await LocalStorageService.listFiles('data/visual-code-projects');
        const projectFiles = files.filter(f => f.startsWith('visual-code-project-') && f.endsWith('.json'));
        
        const projectsData = await Promise.all(
          projectFiles.map(async (file) => {
            try {
              const config = await LocalStorageService.readJSONFile(file, 'data/visual-code-projects');
              return {
                id: file.replace('visual-code-project-', '').replace('.json', ''),
                name: config.title || config.projectPath || 'Sin nombre',
                path: config.projectPath,
                color: config.color || '#1e1e1e',
                lastUpdated: config.lastUpdated,
                ...config
              };
            } catch (error) {
              console.error(`Error cargando proyecto ${file}:`, error);
              return null;
            }
          })
        );

        setProjects(projectsData.filter(p => p !== null));
        
        // Abrir automáticamente el proyecto en Visual Code
        openProjectInVisualCode({
          id: projectId,
          name: projectConfig.title,
          path: selectedPath,
          color: projectConfig.color,
          ...projectConfig
        });
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error seleccionando proyecto:', error);
        alert('Error al seleccionar proyecto: ' + error.message);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Centro de Ejecución
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Estado de Servicios */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Server className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div className="flex items-center gap-3">
              {/* Node.js Service */}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${serviceStatus.nodejs.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-700 dark:text-gray-300">Node.js</span>
                {serviceStatus.nodejs.queueLength > 0 && (
                  <span className="text-xs bg-yellow-500 text-white px-1 rounded">
                    {serviceStatus.nodejs.queueLength}
                  </span>
                )}
                {serviceStatus.nodejs.active ? (
                  <button
                    onClick={() => stopService('nodejs')}
                    className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                    title="Detener servicio Node.js"
                  >
                    <Square className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => startService('nodejs')}
                    className="ml-1 p-0.5 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                    title="Iniciar servicio Node.js"
                  >
                    <Play className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </button>
                )}
              </div>
              {/* Python Service */}
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${serviceStatus.python.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-gray-700 dark:text-gray-300">Python</span>
                {serviceStatus.python.queueLength > 0 && (
                  <span className="text-xs bg-yellow-500 text-white px-1 rounded">
                    {serviceStatus.python.queueLength}
                  </span>
                )}
                {serviceStatus.python.active ? (
                  <button
                    onClick={() => stopService('python')}
                    className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                    title="Detener servicio Python"
                  >
                    <Square className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => startService('python')}
                    className="ml-1 p-0.5 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                    title="Iniciar servicio Python"
                  >
                    <Play className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Proyectos */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Proyectos
              </h2>
              <button
                onClick={handleSelectProject}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Abrir proyecto"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2">
            {loadingProjects ? (
              <div className="text-center text-gray-500 text-sm py-4">
                <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                Cargando proyectos...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">No hay proyectos guardados</p>
                <p className="text-xs mb-3 text-gray-500 dark:text-gray-400">
                  Selecciona una carpeta para crear un proyecto
                </p>
                <button
                  onClick={handleSelectProject}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center gap-2 mx-auto transition-colors"
                  title="Seleccionar carpeta del proyecto desde tu sistema"
                >
                  <FolderOpen className="w-3 h-3" />
                  Seleccionar Proyecto
                </button>
                <p className="text-xs mt-3 text-gray-400 dark:text-gray-500">
                  También puedes abrir proyectos desde Visual Code usando /visual code
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: project.color }}
                        title={`Color del proyecto: ${project.color}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={project.path}>
                          {project.path?.split(/[/\\]/).pop() || 'Sin ruta'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[CentroEjecucionPage] Abriendo proyecto en Visual Code:', project);
                          openProjectInVisualCode(project);
                        }}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center justify-center gap-2 transition-colors font-medium"
                        title="Abrir proyecto en Visual Code (se creará un bloque en la página actual)"
                      >
                        <Code className="w-4 h-4" />
                        <span>Abrir en Visual Code</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('[CentroEjecucionPage] Cambiando directorio de terminal a:', project.path);
                          changeTerminalDirectory(project.path);
                        }}
                        className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs flex items-center justify-center gap-2 transition-colors font-medium"
                        title="Usar esta carpeta como directorio de trabajo en la terminal activa"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Usar en Terminal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main - Terminales */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MultiTerminalView
            terminals={terminals}
            activeTerminalId={activeTerminalId}
            onUpdateTerminals={(updated) => {
              setTerminals(updated);
            }}
            onUpdateActiveTerminal={(id) => {
              setActiveTerminalId(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

