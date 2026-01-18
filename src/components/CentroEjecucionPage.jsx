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
  Zap,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Palette,
  Type
} from 'lucide-react';
import MultiTerminalView from './MultiTerminalView';
import VisualCodeTab from './VisualCodeTab';
import TerminalSettingsModal from './TerminalSettingsModal';
import terminalCommandService from '../services/TerminalCommandService';
import LocalStorageService from '../services/LocalStorageService';
import Toast from './Toast';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function CentroEjecucionPage({ onClose }) {
  const [terminals, setTerminals] = useState([]);
  const [activeTerminalId, setActiveTerminalId] = useState('');
  const [visualCodeTabs, setVisualCodeTabs] = useState([]);
  const [activeTabType, setActiveTabType] = useState('terminal'); // 'terminal' o 'visualcode'
  const [activeVisualCodeId, setActiveVisualCodeId] = useState('');
  const [showOpenProjectModal, setShowOpenProjectModal] = useState(null); // ID del proyecto para el que se muestra el modal
  const [showTerminalSettings, setShowTerminalSettings] = useState(false);
  const [settingsTerminal, setSettingsTerminal] = useState(null);
  const [serviceStatus, setServiceStatus] = useState({
    nodejs: { active: false, queueLength: 0, processing: false },
    python: { active: false, queueLength: 0, processing: false }
  });
  const [executionQueue, setExecutionQueue] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Por defecto colapsado
  const [showSidebarSettings, setShowSidebarSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [sidebarStyles, setSidebarStyles] = useState({
    width: 256, // 64 * 4 = 256px (w-64)
    backgroundColor: '#000000', // Por defecto negro
    textColor: '#ffffff', // Texto blanco para contraste
    borderColor: '#374151', // Borde gris oscuro
    collapsedWidth: 48
  });
  const isElectron = typeof window !== 'undefined' && window.electronAPI;

  // Cargar configuración del sidebar
  useEffect(() => {
    const loadSidebarConfig = async () => {
      try {
        // Intentar cargar desde archivo primero
        const hasBaseDirectory = await LocalStorageService.hasBaseDirectory();
        if (hasBaseDirectory) {
          try {
            const saved = await LocalStorageService.readJSONFile('centro-ejecucion-sidebar.json', 'data');
            if (saved) {
              if (saved.collapsed !== undefined) {
                setSidebarCollapsed(saved.collapsed);
              }
              if (saved.styles) {
                setSidebarStyles(prev => ({ ...prev, ...saved.styles }));
              }
            }
          } catch (fileError) {
            // Si falla, intentar desde localStorage
            const localStorageConfig = localStorage.getItem('centro-ejecucion-sidebar-config');
            if (localStorageConfig) {
              const saved = JSON.parse(localStorageConfig);
              if (saved.collapsed !== undefined) {
                setSidebarCollapsed(saved.collapsed);
              }
              if (saved.styles) {
                setSidebarStyles(prev => ({ ...prev, ...saved.styles }));
              }
            }
          }
        } else {
          // Si no hay baseDirectoryHandle, cargar desde localStorage
          const localStorageConfig = localStorage.getItem('centro-ejecucion-sidebar-config');
          if (localStorageConfig) {
            const saved = JSON.parse(localStorageConfig);
            if (saved.collapsed !== undefined) {
              setSidebarCollapsed(saved.collapsed);
            }
            if (saved.styles) {
              setSidebarStyles(prev => ({ ...prev, ...saved.styles }));
            }
          }
        }
      } catch (error) {
        console.error('Error cargando configuración del sidebar:', error);
      }
    };

    loadSidebarConfig();
  }, []);

  // Guardar configuración del sidebar
  useEffect(() => {
    const saveSidebarConfig = async () => {
      try {
        // Verificar si hay baseDirectoryHandle antes de intentar guardar
        const hasBaseDirectory = await LocalStorageService.hasBaseDirectory();
        if (!hasBaseDirectory) {
          // Si no hay baseDirectoryHandle, guardar en localStorage como fallback
          localStorage.setItem('centro-ejecucion-sidebar-config', JSON.stringify({
            collapsed: sidebarCollapsed,
            styles: sidebarStyles
          }));
          return;
        }
        
        await LocalStorageService.saveJSONFile(
          'centro-ejecucion-sidebar.json',
          {
            collapsed: sidebarCollapsed,
            styles: sidebarStyles
          },
          'data'
        );
      } catch (error) {
        // Si falla, intentar guardar en localStorage como fallback
        try {
          localStorage.setItem('centro-ejecucion-sidebar-config', JSON.stringify({
            collapsed: sidebarCollapsed,
            styles: sidebarStyles
          }));
        } catch (localStorageError) {
          console.error('Error guardando configuración del sidebar:', error);
        }
      }
    };

    saveSidebarConfig();
  }, [sidebarCollapsed, sidebarStyles]);

  // Cargar terminales guardadas
  useEffect(() => {
    const loadTerminals = async () => {
      try {
        // Intentar cargar desde archivo primero
        const hasBaseDirectory = await LocalStorageService.hasBaseDirectory();
        if (hasBaseDirectory) {
          try {
            const saved = await LocalStorageService.readJSONFile('centro-ejecucion-terminals.json', 'data');
            if (saved && saved.terminals && saved.terminals.length > 0) {
              // Migrar terminales con bash en Windows a powershell
              const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
              const migratedTerminals = saved.terminals.map(term => {
                if (isWindows && term.shell === 'bash') {
                  return { ...term, shell: 'powershell' };
                }
                return term;
              });
              setTerminals(migratedTerminals);
              setActiveTerminalId(saved.activeTerminalId || migratedTerminals[0]?.id || '');
              return;
            }
          } catch (fileError) {
            // Si falla, intentar desde localStorage
            const localStorageData = localStorage.getItem('centro-ejecucion-terminals');
            if (localStorageData) {
              const saved = JSON.parse(localStorageData);
              if (saved && saved.terminals && saved.terminals.length > 0) {
                // Migrar terminales con bash en Windows a powershell
                const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
                const migratedTerminals = saved.terminals.map(term => {
                  if (isWindows && term.shell === 'bash') {
                    return { ...term, shell: 'powershell' };
                  }
                  return term;
                });
                setTerminals(migratedTerminals);
                setActiveTerminalId(saved.activeTerminalId || migratedTerminals[0]?.id || '');
                return;
              }
            }
          }
        } else {
          // Si no hay baseDirectoryHandle, cargar desde localStorage
          const localStorageData = localStorage.getItem('centro-ejecucion-terminals');
          if (localStorageData) {
            const saved = JSON.parse(localStorageData);
            if (saved && saved.terminals && saved.terminals.length > 0) {
              setTerminals(saved.terminals);
              setActiveTerminalId(saved.activeTerminalId || saved.terminals[0]?.id || '');
              return;
            }
          }
        }
        
        // Si no hay datos guardados, crear terminal por defecto
        const defaultTerm = createDefaultTerminal();
        setTerminals([defaultTerm]);
        setActiveTerminalId(defaultTerm.id);
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
          // Verificar si hay baseDirectoryHandle antes de intentar guardar
          const hasBaseDirectory = await LocalStorageService.hasBaseDirectory();
          if (!hasBaseDirectory) {
            // Si no hay baseDirectoryHandle, guardar en localStorage como fallback
            localStorage.setItem('centro-ejecucion-terminals', JSON.stringify({
              terminals,
              activeTerminalId
            }));
            return;
          }
          
          await LocalStorageService.saveJSONFile(
            'centro-ejecucion-terminals.json',
            { terminals, activeTerminalId },
            'data'
          );
        } catch (error) {
          // Si falla, intentar guardar en localStorage como fallback
          try {
            localStorage.setItem('centro-ejecucion-terminals', JSON.stringify({
              terminals,
              activeTerminalId
            }));
          } catch (localStorageError) {
            console.error('Error guardando terminales:', error);
          }
        }
      };
      saveTerminals();
    }
  }, [terminals, activeTerminalId]);

  // Cargar pestañas de Visual Code guardadas
  useEffect(() => {
    const loadVisualCodeTabs = async () => {
      try {
        const saved = await LocalStorageService.readJSONFile('centro-ejecucion-visualcode-tabs.json', 'data');
        if (saved && saved.tabs && saved.tabs.length > 0) {
          setVisualCodeTabs(saved.tabs);
          setActiveVisualCodeId(saved.activeVisualCodeId || saved.tabs[0]?.id || '');
          if (saved.activeTabType) {
            setActiveTabType(saved.activeTabType);
          }
        }
      } catch (error) {
        console.error('Error cargando pestañas Visual Code:', error);
      }
    };

    loadVisualCodeTabs();
  }, []);

  // Guardar pestañas de Visual Code cuando cambian
  useEffect(() => {
    if (visualCodeTabs.length > 0 || activeTabType === 'visualcode') {
      const saveVisualCodeTabs = async () => {
        try {
          await LocalStorageService.saveJSONFile(
            'centro-ejecucion-visualcode-tabs.json',
            { tabs: visualCodeTabs, activeVisualCodeId, activeTabType },
            'data'
          );
        } catch (error) {
          console.error('Error guardando pestañas Visual Code:', error);
        }
      };
      saveVisualCodeTabs();
    }
  }, [visualCodeTabs, activeVisualCodeId, activeTabType]);

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

        const validProjects = projectsData.filter(p => p !== null);
        
        // Filtrar duplicados basándose en el path (mantener solo el más reciente)
        const projectsMap = new Map();
        validProjects.forEach(project => {
          if (!project.path) {
            // Si no tiene path, mantenerlo (puede ser un proyecto especial)
            projectsMap.set(project.id, project);
          } else {
            const existing = projectsMap.get(project.path);
            if (!existing || (project.lastUpdated && new Date(project.lastUpdated) > new Date(existing.lastUpdated || 0))) {
              projectsMap.set(project.path, project);
            }
          }
        });

        const uniqueProjects = Array.from(projectsMap.values());
        setProjects(uniqueProjects);
        
        // Si se encontraron duplicados, limpiar los archivos duplicados
        if (validProjects.length > uniqueProjects.length) {
          const uniqueIds = new Set(uniqueProjects.map(p => p.id));
          const duplicatesToDelete = validProjects.filter(p => !uniqueIds.has(p.id));
          
          // Eliminar archivos duplicados en segundo plano (no bloquear la UI)
          duplicatesToDelete.forEach(async (duplicate) => {
            try {
              await LocalStorageService.deleteJSONFile(
                `visual-code-project-${duplicate.id}.json`,
                'data/visual-code-projects'
              );
            } catch (error) {
              console.error(`[CentroEjecucionPage] Error eliminando proyecto duplicado ${duplicate.id}:`, error);
            }
          });
        }
      } catch (error) {
        console.error('Error cargando proyectos:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  // Escuchar evento para abrir terminal desde VisualCodeTab
  useEffect(() => {
    const handleOpenTerminalFromVisualCode = (event) => {
      const { projectPath, projectName } = event.detail;
      
      if (!projectPath) {
        console.warn('[CentroEjecucionPage] No se proporcionó projectPath para abrir terminal');
        return;
      }

      // Crear nueva terminal con la ruta del proyecto
      const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
      const newTerminal = {
        id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Terminal - ${projectName || 'Proyecto'}`,
        shell: isWindows ? 'powershell' : 'bash',
        currentDirectory: projectPath,
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
      
      // Agregar la terminal y activarla usando el estado actual
      setTerminals(prev => {
        const updated = [...prev, newTerminal];
        setActiveTerminalId(newTerminal.id);
        setActiveTabType('terminal');
        return updated;
      });
    };

    window.addEventListener('open-terminal-from-visualcode', handleOpenTerminalFromVisualCode);
    
    return () => {
      window.removeEventListener('open-terminal-from-visualcode', handleOpenTerminalFromVisualCode);
    };
  }, []); // Sin dependencias - usamos setTerminals con función callback

  // Función para eliminar un proyecto
  const deleteProject = async (projectId, projectName) => {
    // Guardar el proyecto a eliminar y mostrar el modal de confirmación
    setProjectToDelete({ id: projectId, name: projectName || projectId });
    setShowDeleteConfirmModal(true);
  };

  // Función que ejecuta la eliminación después de la confirmación
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    const { id: projectId, name: projectName } = projectToDelete;
    setShowDeleteConfirmModal(false);

    try {
      // Primero, encontrar el proyecto para obtener su path
      const projectData = projects.find(p => p.id === projectId);
      const projectPath = projectData?.path;
      
      // Obtener todos los archivos de proyectos ANTES de eliminar para encontrar duplicados
      const allFilesBefore = await LocalStorageService.listFiles('data/visual-code-projects');
      const allProjectFilesBefore = allFilesBefore.filter(f => f.startsWith('visual-code-project-') && f.endsWith('.json'));
      
      // Encontrar TODOS los proyectos con el mismo path (duplicados)
      const duplicatesToDelete = [];
      if (projectPath) {
        for (const file of allProjectFilesBefore) {
          try {
            const config = await LocalStorageService.readJSONFile(file, 'data/visual-code-projects');
            if (config.projectPath === projectPath) {
              duplicatesToDelete.push(file);
            }
          } catch (error) {
            console.error(`Error leyendo proyecto ${file} para verificar duplicados:`, error);
          }
        }
      } else {
        // Si no tiene path, solo eliminar el archivo específico
        duplicatesToDelete.push(`visual-code-project-${projectId}.json`);
      }
      
      // Eliminar TODOS los archivos duplicados (incluyendo el original)
      let allDeleted = true;
      let atLeastOneDeleted = false;
      
      for (const file of duplicatesToDelete) {
        try {
          const deleted = await LocalStorageService.deleteJSONFile(file, 'data/visual-code-projects');
          if (deleted) {
            atLeastOneDeleted = true;
          } else {
            console.warn('[CentroEjecucionPage] No se pudo eliminar:', file);
            allDeleted = false;
          }
        } catch (error) {
          console.error(`Error eliminando archivo ${file}:`, error);
          allDeleted = false;
        }
      }

      // Si no se encontraron archivos para eliminar, el proyecto probablemente ya no existe en la base de datos
      // En este caso, simplemente eliminarlo del estado del sidebar
      if (duplicatesToDelete.length === 0) {
        // Eliminar del estado directamente
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Cerrar todas las pestañas de Visual Code relacionadas con este proyecto
        setVisualCodeTabs(prev => prev.filter(tab => tab.projectId !== projectId));
        if (activeTabType === 'visualcode' && activeVisualCodeId) {
          if (terminals.length > 0) {
            setActiveTerminalId(terminals[0].id);
            setActiveTabType('terminal');
          } else {
            setActiveTabType('terminal');
          }
        }
        
        setToast({ message: 'Proyecto eliminado del sidebar', type: 'success' });
        setProjectToDelete(null);
        return;
      }
      
      // Verificar que al menos uno se eliminó correctamente
      if (!atLeastOneDeleted) {
        console.warn('[CentroEjecucionPage] No se pudo eliminar ningún archivo. Eliminando del sidebar de todas formas.');
        // Aún así, eliminar del estado del sidebar
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        // Cerrar todas las pestañas de Visual Code relacionadas con este proyecto
        setVisualCodeTabs(prev => prev.filter(tab => tab.projectId !== projectId));
        if (activeTabType === 'visualcode' && activeVisualCodeId) {
          if (terminals.length > 0) {
            setActiveTerminalId(terminals[0].id);
            setActiveTabType('terminal');
          } else {
            setActiveTabType('terminal');
          }
        }
        
        setToast({ message: 'Advertencia: No se pudo eliminar el archivo del proyecto de la base de datos, pero se eliminó del sidebar.', type: 'error' });
        setProjectToDelete(null);
        return;
      }
      
      if (!allDeleted && duplicatesToDelete.length > 1) {
        console.warn('[CentroEjecucionPage] Algunos archivos duplicados no se pudieron eliminar completamente');
      }

      // Recargar proyectos después de eliminar
      const files = await LocalStorageService.listFiles('data/visual-code-projects');
      
      const projectFiles = files.filter(f => f.startsWith('visual-code-project-') && f.endsWith('.json'));
      
      // Si no hay archivos, establecer proyectos como array vacío directamente
      if (projectFiles.length === 0) {
        setProjects([]);
        
        // Cerrar todas las pestañas de Visual Code relacionadas con este proyecto
        setVisualCodeTabs(prev => prev.filter(tab => tab.projectId !== projectId));
        if (activeTabType === 'visualcode' && activeVisualCodeId) {
          // Si la pestaña activa era de Visual Code, cambiar a terminal
          if (terminals.length > 0) {
            setActiveTerminalId(terminals[0].id);
            setActiveTabType('terminal');
          } else {
            setActiveTabType('terminal');
          }
        }
        
        return;
      }
      
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

      const validProjects = projectsData.filter(p => p !== null);
      
      // Filtrar duplicados basándose en el path (mantener solo el más reciente)
      const projectsMap = new Map();
      validProjects.forEach(project => {
        if (!project.path) {
          // Si no tiene path, mantenerlo (puede ser un proyecto especial)
          projectsMap.set(project.id, project);
        } else {
          const existing = projectsMap.get(project.path);
          if (!existing || (project.lastUpdated && new Date(project.lastUpdated) > new Date(existing.lastUpdated || 0))) {
            projectsMap.set(project.path, project);
          }
        }
      });

      const uniqueProjects = Array.from(projectsMap.values());
      
      // Asegurar que el estado se actualice correctamente
      setProjects(uniqueProjects);
      
      // Si no hay proyectos después del filtrado, cerrar la pestaña de Visual Code si estaba abierta
      if (uniqueProjects.length === 0) {
        // Cerrar todas las pestañas de Visual Code relacionadas con este proyecto
        setVisualCodeTabs(prev => prev.filter(tab => tab.projectId !== projectId));
        if (activeTabType === 'visualcode' && activeVisualCodeId) {
          // Si la pestaña activa era de Visual Code, cambiar a terminal
          if (terminals.length > 0) {
            setActiveTerminalId(terminals[0].id);
            setActiveTabType('terminal');
          } else {
            setActiveTabType('terminal');
          }
        }
      }
      
      setToast({ message: `Proyecto "${projectName}" eliminado exitosamente`, type: 'success' });
      setProjectToDelete(null);
    } catch (error) {
      console.error('[CentroEjecucionPage] Error eliminando proyecto:', error);
      setToast({ message: `Error al eliminar el proyecto: ${error.message}`, type: 'error' });
      setProjectToDelete(null);
    }
  };

  const createDefaultTerminal = () => {
    const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
    return {
      id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Terminal Principal',
      shell: isWindows ? 'powershell' : 'bash', // PowerShell en Windows, bash en Linux/Mac
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
    // Si no hay terminales, crear una por defecto
    if (terminals.length === 0) {
      const defaultTerm = createDefaultTerminal();
      defaultTerm.currentDirectory = projectPath;
      setTerminals([defaultTerm]);
      setActiveTerminalId(defaultTerm.id);
      return;
    }
    
    // Si no hay terminal activa, usar la primera disponible
    let terminalIdToUpdate = activeTerminalId;
    if (!terminalIdToUpdate && terminals.length > 0) {
      terminalIdToUpdate = terminals[0].id;
      setActiveTerminalId(terminalIdToUpdate);
    }
    
    const terminal = terminals.find(t => t.id === terminalIdToUpdate);
    if (terminal) {
      const updatedTerminal = {
        ...terminal,
        currentDirectory: projectPath
      };
      updateTerminal(updatedTerminal);
    } else {
      console.error('[CentroEjecucionPage] Terminal no encontrada, creando nueva...');
      const defaultTerm = createDefaultTerminal();
      defaultTerm.currentDirectory = projectPath;
      const updated = [...terminals, defaultTerm];
      setTerminals(updated);
      setActiveTerminalId(defaultTerm.id);
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

  const openProjectInVisualCode = (project, openMode = 'tab') => {
    if (!project || !project.path) {
      console.error('[CentroEjecucionPage] No se puede abrir proyecto sin path');
      setToast({ message: 'Error: El proyecto no tiene una ruta válida', type: 'error' });
      return;
    }
    
    // Validar que la ruta sea una ruta completa (no solo el nombre de la carpeta)
    // En Electron, las rutas completas tienen / o \ o : (para Windows)
    const isFullPath = project.path.includes('/') || project.path.includes('\\') || project.path.includes(':');
    
    // En navegador, verificar si tenemos un directoryHandle guardado
    let directoryHandle = null;
    if (!isFullPath && !window.electronAPI) {
      // Buscar el handle del proyecto en window.directoryHandles
      if (window.directoryHandles && project.id) {
        directoryHandle = window.directoryHandles.get(project.id);
        if (!directoryHandle) {
          // Intentar buscar por el path también
          for (const [id, handle] of window.directoryHandles.entries()) {
            if (id.includes(project.path.replace(/[<>:"/\\|?*]/g, '_'))) {
              directoryHandle = handle;
              break;
            }
          }
        }
      }
      
      if (!directoryHandle) {
        console.warn('[CentroEjecucionPage] No se encontró directoryHandle para proyecto del navegador:', project.id);
        // Permitir continuar de todas formas, el FileExplorer manejará la situación
      }
    }
    
    // Cerrar modal
    setShowOpenProjectModal(null);
    
    if (openMode === 'tab') {
      // Abrir en pestaña dentro del panel
      const existingTab = visualCodeTabs.find(tab => tab.path === project.path);
      if (existingTab) {
        // Si ya existe, activarlo
        setActiveVisualCodeId(existingTab.id);
        setActiveTabType('visualcode');
        return;
      }
      
      // Crear nueva pestaña de Visual Code
      const newTab = {
        id: `visualcode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: project.name || project.title || project.path.split(/[/\\]/).pop() || 'Proyecto',
        path: project.path,
        color: project.color || '#1e1e1e',
        theme: project.theme || 'oneDark',
        fontSize: project.fontSize || 14,
        extensions: project.extensions || {},
        createdAt: new Date().toISOString(),
        projectId: project.id, // Guardar el ID del proyecto para recuperar el handle
        isBrowserProject: !isFullPath && !window.electronAPI // Marcar si es proyecto del navegador
      };
      
      setVisualCodeTabs(prev => [...prev, newTab]);
      setActiveVisualCodeId(newTab.id);
      setActiveTabType('visualcode');
    } else if (openMode === 'page' || openMode === 'fullscreen') {
      // Abrir en la página como bloque
      const event = new CustomEvent('open-visual-code', { 
        detail: { 
          projectPath: project.path,
          projectTitle: project.name || project.title,
          projectColor: project.color,
          theme: project.theme || 'oneDark',
          fontSize: project.fontSize || 14,
          extensions: project.extensions,
          openMode: openMode // 'page' o 'fullscreen'
        },
        bubbles: true,
        cancelable: true
      });
      
      window.dispatchEvent(event);
    }
  };

  const handleSelectProject = async () => {
    try {
      let selectedPath = null;
      let directoryHandle = null;
      
      // Usar la misma lógica que Visual Code para seleccionar carpetas
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        // Electron: usar diálogo nativo
        selectedPath = await window.electronAPI.selectDirectory();
      } else if ('showDirectoryPicker' in window) {
        // Navegador: usar File System Access API
        try {
          const handle = await window.showDirectoryPicker({
            mode: 'readwrite' // Necesitamos escritura para guardar archivos
          });
          directoryHandle = handle;
          // En navegador, usamos el nombre del directorio como identificador
          selectedPath = handle.name || 'Proyecto del Navegador';
        } catch (error) {
          if (error.name === 'AbortError') {
            return;
          }
          console.error('[CentroEjecucionPage] Error seleccionando directorio:', error);
          setToast({ message: `Error al seleccionar carpeta: ${error.message}`, type: 'error' });
          return;
        }
      } else {
        setToast({ 
          message: 'Tu navegador no soporta la selección de carpetas. Usa Chrome 86+, Edge 86+ u Opera 72+, o ejecuta la versión Electron: npm run electron:dev', 
          type: 'error',
          duration: 5000 
        });
        return;
      }

      if (selectedPath || directoryHandle) {
        // Verificar si ya existe un proyecto con el mismo path
        const existingProject = projects.find(p => p.path === selectedPath);
        let projectId;
        let projectConfig;
        
        if (existingProject) {
          // Si ya existe, usar el ID existente y actualizar la configuración
          projectId = existingProject.id;
          projectConfig = {
            ...existingProject,
            projectPath: selectedPath,
            directoryHandle: directoryHandle ? 'browser-handle' : existingProject.directoryHandle,
            title: existingProject.name || selectedPath.split(/[/\\]/).pop() || 'Nuevo Proyecto',
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Si no existe, crear uno nuevo
          projectId = selectedPath.replace(/[<>:"/\\|?*]/g, '_') + '_' + Date.now();
          projectConfig = {
            projectPath: selectedPath,
            directoryHandle: directoryHandle ? 'browser-handle' : null, // Marcador para saber que es un handle del navegador
            title: selectedPath.split(/[/\\]/).pop() || 'Nuevo Proyecto',
            color: '#1e1e1e',
            theme: 'cursorDark', // Cambiar a cursorDark por defecto
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
        }

        // Guardar el handle del directorio en un mapa global si es navegador
        if (directoryHandle && typeof window !== 'undefined') {
          if (!window.directoryHandles) {
            window.directoryHandles = new Map();
          }
          window.directoryHandles.set(projectId, directoryHandle);
        }

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

        // Filtrar duplicados basándose en el path (mantener solo el más reciente)
        const projectsMap = new Map();
        projectsData.filter(p => p !== null).forEach(project => {
          const existing = projectsMap.get(project.path);
          if (!existing || new Date(project.lastUpdated) > new Date(existing.lastUpdated)) {
            projectsMap.set(project.path, project);
          }
        });

        const uniqueProjects = Array.from(projectsMap.values());
        setProjects(uniqueProjects);
        
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
        setToast({ message: `Error al seleccionar proyecto: ${error.message}`, type: 'error' });
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
        <div 
          className="flex-shrink-0 border-r dark:border-gray-700 overflow-y-auto transition-all duration-300"
          style={{
            width: sidebarCollapsed ? `${sidebarStyles.collapsedWidth}px` : `${sidebarStyles.width}px`,
            backgroundColor: sidebarStyles.backgroundColor,
            borderColor: sidebarStyles.borderColor
          }}
        >
          {sidebarCollapsed ? (
            // Sidebar colapsado - solo iconos
            <div className="flex flex-col items-center py-2 gap-2">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Expandir sidebar"
              >
                <ChevronRight className="w-5 h-5" style={{ color: sidebarStyles.textColor }} />
              </button>
              <button
                onClick={handleSelectProject}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Abrir proyecto"
              >
                <FolderOpen className="w-5 h-5" style={{ color: sidebarStyles.textColor }} />
              </button>
              <button
                onClick={() => setShowSidebarSettings(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Configurar sidebar"
              >
                <Settings className="w-5 h-5" style={{ color: sidebarStyles.textColor }} />
              </button>
              {projects.length > 0 && (
                <div className="mt-2 pt-2 border-t" style={{ borderColor: sidebarStyles.borderColor }}>
                  <div className="text-xs text-center" style={{ color: sidebarStyles.textColor }}>
                    {projects.length}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Sidebar expandido
            <>
              <div className="p-3 border-b dark:border-gray-700" style={{ borderColor: sidebarStyles.borderColor }}>
                <div className="flex items-center justify-between mb-2">
                  <h2 
                    className="text-sm font-semibold"
                    style={{ color: sidebarStyles.textColor }}
                  >
                    Proyectos
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowSidebarSettings(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Configurar sidebar"
                    >
                      <Settings className="w-4 h-4" style={{ color: sidebarStyles.textColor }} />
                    </button>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Colapsar sidebar"
                    >
                      <ChevronLeft className="w-4 h-4" style={{ color: sidebarStyles.textColor }} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSelectProject}
                  className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                  title="Abrir proyecto"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Nuevo Proyecto</span>
                </button>
              </div>
              <div className="p-2">
                {loadingProjects ? (
                  <div className="text-center text-sm py-4" style={{ color: sidebarStyles.textColor }}>
                    <Loader className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: sidebarStyles.textColor }} />
                    Cargando proyectos...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center text-sm py-4" style={{ color: sidebarStyles.textColor }}>
                    <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: sidebarStyles.textColor }} />
                    <p className="font-medium mb-1" style={{ color: sidebarStyles.textColor }}>
                      No hay proyectos guardados
                    </p>
                    <p className="text-xs mb-3 opacity-70" style={{ color: sidebarStyles.textColor }}>
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
                    <p className="text-xs mt-3 opacity-60" style={{ color: sidebarStyles.textColor }}>
                      También puedes abrir proyectos desde Visual Code usando /visual code
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="w-full px-3 py-2 rounded-lg transition-colors group border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches 
                            ? 'rgba(55, 65, 81, 0.5)' 
                            : 'rgba(243, 244, 246, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                            title={`Color del proyecto: ${project.color}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate" style={{ color: sidebarStyles.textColor }}>
                              {project.name}
                            </div>
                            <div className="text-xs truncate opacity-70" style={{ color: sidebarStyles.textColor }} title={project.path}>
                              {project.path?.split(/[/\\]/).pop() || 'Sin ruta'}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteProject(project.id, project.name || project.title);
                            }}
                            className="p-1.5 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            style={{ color: sidebarStyles.textColor }}
                            title="Eliminar proyecto de la lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowOpenProjectModal(project.id);
                            }}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center justify-center gap-2 transition-colors font-medium"
                            title="Abrir proyecto en Visual Code"
                          >
                            <Code className="w-4 h-4" />
                            <span>Abrir en Visual Code</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
            </>
          )}
        </div>

        {/* Main - Pestañas unificadas (Terminales y Visual Code) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Pestañas unificadas */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700 overflow-x-auto">
            {/* Pestañas de Terminales */}
            {terminals.map(terminal => (
              <div
                key={terminal.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t transition-colors text-sm ${
                  activeTabType === 'terminal' && terminal.id === activeTerminalId
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveTerminalId(terminal.id);
                    setActiveTabType('terminal');
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
                    setShowTerminalSettings(true);
                  }}
                  className="hover:bg-gray-600 rounded p-0.5 ml-1"
                  title="Configurar terminal"
                >
                  <Settings className="w-3 h-3" />
                </button>
                {terminals.length > 1 && (
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
            ))}
            
            {/* Pestañas de Visual Code */}
            {visualCodeTabs.map(tab => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t transition-colors text-sm ${
                  activeTabType === 'visualcode' && tab.id === activeVisualCodeId
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveVisualCodeId(tab.id);
                    setActiveTabType('visualcode');
                  }}
                  className="flex items-center gap-2 flex-1 text-left"
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    padding: 0
                  }}
                >
                  <FileCode className="w-3 h-3" />
                  <span>{tab.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = visualCodeTabs.filter(t => t.id !== tab.id);
                    setVisualCodeTabs(updated);
                    if (tab.id === activeVisualCodeId) {
                      if (updated.length > 0) {
                        setActiveVisualCodeId(updated[0].id);
                        setActiveTabType('visualcode');
                      } else if (terminals.length > 0) {
                        setActiveTerminalId(terminals[0].id);
                        setActiveTabType('terminal');
                      }
                    }
                  }}
                  className="hover:bg-gray-600 rounded p-0.5 ml-1"
                  title="Cerrar pestaña"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {/* Botón para agregar terminal */}
            <button
              onClick={() => {
                const isWindows = typeof window !== 'undefined' && window.electronAPI?.platform === 'win32';
                const newTerminal = {
                  id: `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: `Terminal ${terminals.length + 1}`,
                  shell: isWindows ? 'powershell' : 'bash',
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
                setTerminals(prev => [...prev, newTerminal]);
                setActiveTerminalId(newTerminal.id);
                setActiveTabType('terminal');
              }}
              className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Nueva terminal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido de las pestañas */}
          <div className="flex-1 overflow-hidden">
            {activeTabType === 'terminal' ? (
              <MultiTerminalView
                terminals={terminals}
                activeTerminalId={activeTerminalId}
                onUpdateTerminals={(updated) => {
                  setTerminals(updated);
                }}
                onUpdateActiveTerminal={(id) => {
                  setActiveTerminalId(id);
                }}
                hideTabs={true}
              />
            ) : (
              activeVisualCodeId && visualCodeTabs.find(tab => tab.id === activeVisualCodeId) && (() => {
                const activeTab = visualCodeTabs.find(tab => tab.id === activeVisualCodeId);
                // Obtener el directoryHandle si es un proyecto del navegador
                let directoryHandle = null;
                if (activeTab.isBrowserProject && activeTab.projectId && window.directoryHandles) {
                  directoryHandle = window.directoryHandles.get(activeTab.projectId);
                  // Si no se encuentra por ID, intentar buscar por el path
                  if (!directoryHandle) {
                    for (const [id, handle] of window.directoryHandles.entries()) {
                      if (id.includes(activeTab.path.replace(/[<>:"/\\|?*]/g, '_'))) {
                        directoryHandle = handle;
                        break;
                      }
                    }
                  }
                }
                return (
                  <VisualCodeTab
                    project={{
                      ...activeTab,
                      directoryHandle: directoryHandle
                    }}
                    isActive={true}
                  onClose={() => {
                    const updated = visualCodeTabs.filter(t => t.id !== activeVisualCodeId);
                    setVisualCodeTabs(updated);
                    if (updated.length > 0) {
                      setActiveVisualCodeId(updated[0].id);
                    } else if (terminals.length > 0) {
                      setActiveTerminalId(terminals[0].id);
                      setActiveTabType('terminal');
                    }
                  }}
                  onUpdateProject={(updatedProject) => {
                    setVisualCodeTabs(prev => prev.map(tab => 
                      tab.id === updatedProject.id ? updatedProject : tab
                    ));
                  }}
                />
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Modal para seleccionar cómo abrir el proyecto */}
      {showOpenProjectModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60001] flex items-center justify-center p-4"
          onClick={() => setShowOpenProjectModal(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ¿Cómo deseas abrir el proyecto?
              </h3>
              <button
                onClick={() => setShowOpenProjectModal(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const project = projects.find(p => p.id === showOpenProjectModal);
                  if (project) {
                    openProjectInVisualCode(project, 'tab');
                  }
                }}
                className="w-full px-4 py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg flex items-center gap-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <FileCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">En pestaña</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Dentro del panel del Centro de Ejecución</div>
                </div>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const project = projects.find(p => p.id === showOpenProjectModal);
                  if (project) {
                    openProjectInVisualCode(project, 'page');
                  }
                }}
                className="w-full px-4 py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg flex items-center gap-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">En página</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Como bloque en la página actual</div>
                </div>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const project = projects.find(p => p.id === showOpenProjectModal);
                  if (project) {
                    openProjectInVisualCode(project, 'fullscreen');
                  }
                }}
                className="w-full px-4 py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg flex items-center gap-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <Maximize2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Por fuera grande</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Bloque expandido en la página</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración de terminal */}
      <TerminalSettingsModal
        isOpen={showTerminalSettings}
        onClose={() => {
          setShowTerminalSettings(false);
          setSettingsTerminal(null);
        }}
        terminal={settingsTerminal}
        onSave={(updatedTerminal) => {
          updateTerminal(updatedTerminal);
          setShowTerminalSettings(false);
          setSettingsTerminal(null);
        }}
      />

      {/* Modal de configuración del sidebar */}
      {showSidebarSettings && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60002] flex items-center justify-center p-4"
          onClick={() => setShowSidebarSettings(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Configurar Sidebar
                </h3>
              </div>
              <button
                onClick={() => setShowSidebarSettings(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Ancho del sidebar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Ancho del Sidebar (px)
                </label>
                <input
                  type="number"
                  min="200"
                  max="500"
                  value={sidebarStyles.width}
                  onChange={(e) => setSidebarStyles(prev => ({ ...prev, width: parseInt(e.target.value) || 256 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Ancho colapsado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ancho Colapsado (px)
                </label>
                <input
                  type="number"
                  min="40"
                  max="100"
                  value={sidebarStyles.collapsedWidth}
                  onChange={(e) => setSidebarStyles(prev => ({ ...prev, collapsedWidth: parseInt(e.target.value) || 48 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Color de fondo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color de Fondo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sidebarStyles.backgroundColor}
                    onChange={(e) => setSidebarStyles(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sidebarStyles.backgroundColor}
                    onChange={(e) => setSidebarStyles(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Color de texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color de Texto
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sidebarStyles.textColor}
                    onChange={(e) => setSidebarStyles(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sidebarStyles.textColor}
                    onChange={(e) => setSidebarStyles(prev => ({ ...prev, textColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#111827"
                  />
                </div>
              </div>

              {/* Color de borde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color de Borde
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sidebarStyles.borderColor}
                    onChange={(e) => setSidebarStyles(prev => ({ ...prev, borderColor: e.target.value }))}
                    className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sidebarStyles.borderColor}
                    onChange={(e) => setSidebarStyles(prev => ({ ...prev, borderColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#e5e7eb"
                  />
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temas Predefinidos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSidebarStyles({
                      width: 256,
                      backgroundColor: '#ffffff',
                      textColor: '#111827',
                      borderColor: '#e5e7eb',
                      collapsedWidth: 48
                    })}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium">Claro</div>
                    <div className="text-xs text-gray-500">Blanco</div>
                  </button>
                  <button
                    onClick={() => setSidebarStyles({
                      width: 256,
                      backgroundColor: '#1f2937',
                      textColor: '#f9fafb',
                      borderColor: '#374151',
                      collapsedWidth: 48
                    })}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium">Oscuro</div>
                    <div className="text-xs text-gray-500">Gris oscuro</div>
                  </button>
                  <button
                    onClick={() => setSidebarStyles({
                      width: 256,
                      backgroundColor: '#111827',
                      textColor: '#ffffff',
                      borderColor: '#374151',
                      collapsedWidth: 48
                    })}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium">Negro</div>
                    <div className="text-xs text-gray-500">Negro puro</div>
                  </button>
                  <button
                    onClick={() => setSidebarStyles({
                      width: 256,
                      backgroundColor: '#f3f4f6',
                      textColor: '#1f2937',
                      borderColor: '#d1d5db',
                      collapsedWidth: 48
                    })}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="font-medium">Gris Claro</div>
                    <div className="text-xs text-gray-500">Gris suave</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowSidebarSettings(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar proyecto */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        title="¿Eliminar proyecto?"
        message={projectToDelete ? `¿Estás seguro de que quieres eliminar el proyecto "${projectToDelete.name}" de la lista?\n\nEsto no borrará los archivos de tu disco.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

