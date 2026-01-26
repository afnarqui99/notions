import { useState, useRef, useEffect } from 'react';
import { X, Terminal, Settings, Copy, Check, Edit, Search, Replace, Clock, ChevronDown, ChevronUp, Trash2, Square, RotateCw, Network, Folder, ExternalLink } from 'lucide-react';
import terminalCommandService from '../services/TerminalCommandService';
import TerminalCommandGroupsModal from './TerminalCommandGroupsModal';
import gitService from '../services/GitService';

// Componente para botón de grupo con contador
function GroupButton({ groupId, group, terminalId, isSelected, onSelect }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const commands = await terminalCommandService.getFrequentCommands(terminalId, 1000, groupId);
      setCount(commands.length);
    };
    loadCount();
  }, [groupId, terminalId]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
        isSelected
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
      style={{
        borderLeft: `3px solid ${group.color}`
      }}
    >
      {group.name}
      {count > 0 && (
        <span className="text-[10px] opacity-75">
          ({count})
        </span>
      )}
    </button>
  );
}

// Función para limpiar códigos ANSI del output
const stripAnsiCodes = (text) => {
  if (!text) return text;
  // Eliminar códigos ANSI: [\x1b\x9b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]
  return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
};

// Función para detectar URLs en el texto
const detectUrls = (text) => {
  if (!text) return [];
  const cleanText = stripAnsiCodes(text);
  const urlPattern = /(https?:\/\/[^\s]+|localhost:\d+|127\.0\.0\.1:\d+|0\.0\.0\.0:\d+)/gi;
  const matches = [...cleanText.matchAll(urlPattern)];
  const urls = [];
  
  matches.forEach(match => {
    let url = match[0];
    // Si la URL no tiene protocolo, agregar http://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    // Remover caracteres finales que no son parte de la URL
    url = url.replace(/[.,;:!?]+$/, '');
    if (url && !urls.includes(url)) {
      urls.push(url);
    }
  });
  
  return urls;
};

// Función para renderizar texto con URLs como enlaces
const renderTextWithUrls = (text) => {
  if (!text) return text;
  const cleanText = stripAnsiCodes(text);
  const urlPattern = /(https?:\/\/[^\s]+|localhost:\d+|127\.0\.0\.1:\d+|0\.0\.0\.0:\d+)/gi;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = urlPattern.exec(cleanText)) !== null) {
    // Agregar texto antes de la URL
    if (match.index > lastIndex) {
      parts.push(cleanText.substring(lastIndex, match.index));
    }
    
    // Agregar la URL como enlace
    let url = match[0].replace(/[.,;:!?]+$/, '');
    let originalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          window.open(url, '_blank');
        }}
        className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
        style={{ wordBreak: 'break-all' }}
      >
        {originalUrl}
      </a>
    );
    
    lastIndex = urlPattern.lastIndex;
  }
  
  // Agregar texto restante
  if (lastIndex < cleanText.length) {
    parts.push(cleanText.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : cleanText;
};

// Helper para manejar rutas (compatible con navegador y Electron)
const pathHelper = {
  join: (...parts) => {
    const filtered = parts.filter(p => p && p !== '.');
    if (typeof window !== 'undefined' && window.electronAPI) {
      const sep = window.electronAPI.platform === 'win32' ? '\\' : '/';
      return filtered.join(sep);
    }
    return filtered.join('/');
  },
  isAbsolute: (p) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.platform === 'win32' 
        ? /^[a-zA-Z]:/.test(p) || p.startsWith('\\\\')
        : p.startsWith('/');
    }
    return p.startsWith('/');
  },
  dirname: (p) => {
    const sep = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.platform === 'win32' ? '\\' : '/';
    const parts = p.split(sep);
    parts.pop();
    return parts.join(sep) || sep;
  }
};

export default function TerminalTab({ 
  terminal, 
  isActive, 
  onClose, 
  onActivate, 
  onExecuteCommand,
  onUpdateTerminal 
}) {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState(terminal.history || []);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalStyles, setTerminalStyles] = useState(terminal.styles || {
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    promptColor: '#4ec9b0',
    errorColor: '#f48771',
    fontSize: 14, // Mantener para compatibilidad
    outputFontSize: 14,
    inputFontSize: 14,
    outputHeight: 400,
    inputHeight: 80
  });
  const [currentShell, setCurrentShell] = useState(terminal.shell || 'bash');
  const [currentDirectory, setCurrentDirectory] = useState(terminal.currentDirectory || '~');
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [frequentCommands, setFrequentCommands] = useState([]);
  const [showFrequentCommands, setShowFrequentCommands] = useState(false);
  const [showAllCommands, setShowAllCommands] = useState(false);
  const [groups, setGroups] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [isProcessRunning, setIsProcessRunning] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [showPortManager, setShowPortManager] = useState(false);
  const [portToCheck, setPortToCheck] = useState('');
  const [portProcesses, setPortProcesses] = useState([]);
  const [gitBranch, setGitBranch] = useState(null);
  const [detectedUrls, setDetectedUrls] = useState([]);
  const [showUrlMenu, setShowUrlMenu] = useState(false);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  // Detectar URLs en el output cuando cambia
  useEffect(() => {
    if (terminal.output) {
      const urls = detectUrls(terminal.output);
      setDetectedUrls(urls);
    } else {
      setDetectedUrls([]);
    }
  }, [terminal.output]);

  // Cerrar menú de URLs al hacer clic fuera
  useEffect(() => {
    if (!showUrlMenu) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative')) {
        setShowUrlMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUrlMenu]);

  // Actualizar estilos y shell cuando cambia el terminal
  useEffect(() => {
    const newStyles = terminal.styles || {
      backgroundColor: '#1e1e1e',
      textColor: '#d4d4d4',
      promptColor: '#4ec9b0',
      errorColor: '#f48771',
      fontSize: 14, // Mantener para compatibilidad
      outputFontSize: 14,
      inputFontSize: 14,
      outputHeight: 400,
      inputHeight: 80
    };
    
    // Migrar fontSize antiguo a los nuevos campos si no existen
    if (newStyles.fontSize && !newStyles.outputFontSize) {
      newStyles.outputFontSize = newStyles.fontSize;
    }
    if (newStyles.fontSize && !newStyles.inputFontSize) {
      newStyles.inputFontSize = newStyles.fontSize;
    }
    const newShell = terminal.shell || 'bash';
    const newDirectory = terminal.currentDirectory || '~';
    
    // Solo actualizar si realmente cambió para evitar renders innecesarios
    if (JSON.stringify(terminalStyles) !== JSON.stringify(newStyles)) {
      setTerminalStyles(newStyles);
    }
    if (currentShell !== newShell) {
      setCurrentShell(newShell);
    }
    if (currentDirectory !== newDirectory) {
      setCurrentDirectory(newDirectory);
    }
  }, [terminal]);

  // Verificar si hay un proceso corriendo y escuchar cambios
  useEffect(() => {
    const checkRunningProcess = async () => {
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.hasRunningProcess) {
        try {
          const running = await window.electronAPI.hasRunningProcess(terminal.id);
          setIsProcessRunning(running);
        } catch (error) {
          console.error('Error verificando proceso:', error);
        }
      }
    };
    
    checkRunningProcess();
    // Verificar cada 2 segundos
    const interval = setInterval(checkRunningProcess, 2000);
    
    // Escuchar cuando el proceso se cierra
    if (window.electronAPI && window.electronAPI.onTerminalProcessClosed) {
      const handleProcessClosed = (data) => {
        if (data.terminalId === terminal.id) {
          setIsProcessRunning(false);
        }
      };
      window.electronAPI.onTerminalProcessClosed(handleProcessClosed);
      
      return () => {
        clearInterval(interval);
        // El listener se limpia automáticamente cuando el componente se desmonta
      };
    }
    
    return () => clearInterval(interval);
  }, [terminal.id]);

  // Auto-scroll en output
  useEffect(() => {
    if (outputRef.current && isActive) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminal.output, isActive]);

  // Ref para los botones de navegación
  const navButtonsRef = useRef(null);

  // Actualizar posición de los botones cuando se hace scroll
  useEffect(() => {
    if (!outputRef.current || !navButtonsRef.current) return;

    const updateButtonPosition = () => {
      const container = outputRef.current;
      const buttons = navButtonsRef.current;
      if (!container || !buttons) return;

      const rect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Calcular la posición vertical del viewport visible en el contenedor
      const viewportTop = rect.top;
      const viewportCenter = viewportTop + (clientHeight / 2);

      // Posicionar los botones en el centro del viewport visible
      buttons.style.top = `${viewportCenter}px`;
      buttons.style.transform = 'translateY(-50%)';
    };

    // Actualizar posición inicial
    updateButtonPosition();

    // Actualizar posición cuando se hace scroll
    const handleScroll = () => {
      updateButtonPosition();
    };

    outputRef.current.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateButtonPosition);

    return () => {
      if (outputRef.current) {
        outputRef.current.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', updateButtonPosition);
    };
  }, [isActive, terminal.output]);

  // Funciones para navegación rápida en el output
  const scrollToTop = () => {
    if (outputRef.current) {
      outputRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Enfocar input cuando se activa o cuando cambia el terminal
  useEffect(() => {
    if (isActive && inputRef.current) {
      // Usar un timeout más largo para asegurar que el DOM esté listo
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isActive, terminal.id]); // Agregar terminal.id para que se enfoque cuando cambia el terminal

  const handleExecute = async () => {
    if (!command.trim()) return;

    const commandToExecute = command.trim();
    const newHistory = [...commandHistory, commandToExecute];
    setCommandHistory(newHistory);
    setHistoryIndex(-1);
    
    // Guardar comando en servicio de comandos frecuentes
    await terminalCommandService.saveCommand(terminal.id, commandToExecute);
    
    // Guardar el último comando para poder reiniciarlo
    setLastCommand(commandToExecute);
    
    // Actualizar historial en el terminal
    const updatedTerminal = {
      ...terminal,
      history: newHistory
    };
    onUpdateTerminal(updatedTerminal);

    // Ejecutar comando
    await onExecuteCommand(terminal.id, commandToExecute);
    
    // Detectar si es un comando de larga duración (cualquier tipo)
    // npm/yarn/pnpm: dev, start, serve, watch
    // python: servidores con dev, start, serve, runserver
    // node: servidores con dev, start, serve
    // Otros: cualquier comando que típicamente corre servidores
    const isLongRunning = /^(npm|yarn|pnpm)\s+(run\s+)?(dev|start|serve|watch)/i.test(commandToExecute) ||
                          /^(python|python3|py)\s+.*(dev|start|serve|runserver|app\.py|main\.py|server\.py)/i.test(commandToExecute) ||
                          /^(node|nodemon|ts-node|tsx)\s+.*(dev|start|serve|watch)/i.test(commandToExecute) ||
                          /^(uvicorn|gunicorn|flask|django)\s+/i.test(commandToExecute) ||
                          /^(dotnet|java|mvn|gradle)\s+.*(run|start)/i.test(commandToExecute);
    if (isLongRunning) {
      setIsProcessRunning(true);
    }
    
    setCommand('');
    setShowFrequentCommands(false);
  };

  // Detener proceso actual
  const handleStopProcess = async () => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.stopTerminalProcess) {
      try {
        // Detener el proceso
        await window.electronAPI.stopTerminalProcess(terminal.id);
        
        // Verificar que el proceso esté muerto
        let attempts = 0;
        const maxAttempts = 10; // 5 segundos máximo
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (window.electronAPI.isProcessDead) {
            const isDead = await window.electronAPI.isProcessDead(terminal.id);
            if (isDead) {
              break; // El proceso está muerto
            }
          } else {
            // Si no hay API disponible, solo esperar
            break;
          }
          
          attempts++;
        }
        
        setIsProcessRunning(false);
        // Agregar mensaje al output
        const updatedTerminal = {
          ...terminal,
          output: (terminal.output || '') + '\n\n[Proceso detenido por el usuario]\n'
        };
        onUpdateTerminal(updatedTerminal);
      } catch (error) {
        console.error('Error deteniendo proceso:', error);
        // Aún así, marcar como no corriendo
        setIsProcessRunning(false);
      }
    }
  };

  // Extraer puerto del output del terminal (buscar URLs como localhost:5187)
  const extractPortFromOutput = (output) => {
    if (!output) return null;
    
    // Buscar patrones como "localhost:5187" o "http://localhost:5187"
    const portMatch = output.match(/(?:localhost|127\.0\.0\.1|:\/\/[^:]+):(\d+)/);
    if (portMatch) {
      return parseInt(portMatch[1]);
    }
    
    // Buscar patrones como "Port 5187" o "puerto 5187"
    const portMatch2 = output.match(/(?:port|puerto)\s+(\d+)/i);
    if (portMatch2) {
      return parseInt(portMatch2[1]);
    }
    
    return null;
  };

  // Reiniciar proceso (detener y volver a ejecutar) - Funciona con cualquier comando
  const handleRestartProcess = async () => {
    // Obtener el último comando ejecutado (puede ser npm, python, node, etc.)
    const commandToRestart = lastCommand || commandHistory[commandHistory.length - 1];
    
    if (!commandToRestart) {
      console.warn('No hay comando para reiniciar');
      return;
    }
    
    // Extraer puerto del output si está disponible
    const port = extractPortFromOutput(terminal.output);
    
    // Agregar mensaje de reinicio al output
    const updatedTerminal = {
      ...terminal,
      output: (terminal.output || '') + `\n\n[Reiniciando: ${commandToRestart}...]\n`
    };
    onUpdateTerminal(updatedTerminal);
    
    // Detener proceso actual
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.stopTerminalProcess) {
      try {
        await window.electronAPI.stopTerminalProcess(terminal.id);
      } catch (error) {
        console.error('Error deteniendo proceso para reiniciar:', error);
      }
    }
    
    // Si hay un puerto detectado, matar todos los procesos usando ese puerto
    if (port && window.electronAPI && window.electronAPI.killProcessesByPort) {
      try {
        const result = await window.electronAPI.killProcessesByPort(port);
        if (result.success) {
          const updatedTerminal2 = {
            ...terminal,
            output: (terminal.output || '') + `[Puerto ${port} liberado: ${result.message}]\n`
          };
          onUpdateTerminal(updatedTerminal2);
        }
      } catch (error) {
        console.error('Error matando procesos del puerto:', error);
      }
    }
    
    // Esperar mínimo 3 segundos para asegurar que el puerto se libere
    const minWaitTime = 3000; // 3 segundos mínimo
    const startTime = Date.now();
    
    let attempts = 0;
    const maxAttempts = 10; // 5 segundos máximo adicionales
    
    while (attempts < maxAttempts) {
      const elapsed = Date.now() - startTime;
      const remainingWait = Math.max(0, minWaitTime - elapsed);
      
      if (remainingWait > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingWait));
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Verificar que el proceso esté muerto
      if (window.electronAPI && window.electronAPI.isProcessDead) {
        const isDead = await window.electronAPI.isProcessDead(terminal.id);
        if (isDead && elapsed >= minWaitTime) {
          // El proceso está muerto y hemos esperado al menos 3 segundos
          break;
        }
      } else {
        // Si no hay API disponible, solo esperar el tiempo mínimo
        if (elapsed >= minWaitTime) {
          break;
        }
      }
      
      attempts++;
    }
    
    // Actualizar estado
    setIsProcessRunning(false);
    
    // Ejecutar el comando nuevamente automáticamente (cualquier tipo de comando)
    const commandToExecute = commandToRestart;
    
    // Actualizar historial
    const newHistory = [...commandHistory, commandToExecute];
    setCommandHistory(newHistory);
    setHistoryIndex(-1);
    
    // Guardar comando en servicio de comandos frecuentes
    await terminalCommandService.saveCommand(terminal.id, commandToExecute);
    
    // Actualizar el último comando guardado
    setLastCommand(commandToExecute);
    
    // Actualizar historial en el terminal
    const updatedTerminal3 = {
      ...terminal,
      history: newHistory
    };
    onUpdateTerminal(updatedTerminal3);
    
    // Ejecutar el comando directamente
    await onExecuteCommand(terminal.id, commandToExecute);
    
    // Detectar si es un comando de larga duración (cualquier tipo)
    // npm/yarn/pnpm: dev, start, serve, watch
    // python: servidores con dev, start, serve, runserver
    // node: servidores con dev, start, serve
    // Otros: cualquier comando que típicamente corre servidores
    const isLongRunning = /^(npm|yarn|pnpm)\s+(run\s+)?(dev|start|serve|watch)/i.test(commandToExecute) ||
                          /^(python|python3|py)\s+.*(dev|start|serve|runserver|app\.py|main\.py|server\.py)/i.test(commandToExecute) ||
                          /^(node|nodemon|ts-node|tsx)\s+.*(dev|start|serve|watch)/i.test(commandToExecute) ||
                          /^(uvicorn|gunicorn|flask|django)\s+/i.test(commandToExecute) ||
                          /^(dotnet|java|mvn|gradle)\s+.*(run|start)/i.test(commandToExecute);
    
    if (isLongRunning) {
      setIsProcessRunning(true);
    }
  };

  // Verificar procesos usando un puerto
  const handleCheckPort = async () => {
    if (!portToCheck || !portToCheck.trim()) {
      alert('Por favor ingresa un número de puerto');
      return;
    }
    
    const port = parseInt(portToCheck.trim());
    if (isNaN(port) || port < 1 || port > 65535) {
      alert('Por favor ingresa un número de puerto válido (1-65535)');
      return;
    }
    
    if (window.electronAPI && window.electronAPI.getProcessesByPort) {
      try {
        const processes = await window.electronAPI.getProcessesByPort(port);
        setPortProcesses(processes);
      } catch (error) {
        console.error('Error obteniendo procesos del puerto:', error);
        alert('Error al obtener procesos del puerto');
      }
    }
  };

  // Matar proceso por PID
  const handleKillProcess = async (pid) => {
    if (!window.confirm(`¿Matar el proceso ${pid}?`)) {
      return;
    }
    
    if (window.electronAPI && window.electronAPI.killProcessByPid) {
      try {
        const result = await window.electronAPI.killProcessByPid(pid);
        if (result.success) {
          // Recargar la lista de procesos
          await handleCheckPort();
          alert(`Proceso ${pid} terminado exitosamente`);
        } else {
          alert(`Error al terminar proceso: ${result.error || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('Error matando proceso:', error);
        alert('Error al matar el proceso');
      }
    }
  };

  // Matar todos los procesos usando un puerto
  const handleKillAllPortProcesses = async () => {
    if (!portToCheck || !portToCheck.trim()) {
      alert('Por favor ingresa un número de puerto');
      return;
    }
    
    const port = parseInt(portToCheck.trim());
    if (isNaN(port) || port < 1 || port > 65535) {
      alert('Por favor ingresa un número de puerto válido (1-65535)');
      return;
    }
    
    if (!window.confirm(`¿Matar todos los procesos usando el puerto ${port}?`)) {
      return;
    }
    
    if (window.electronAPI && window.electronAPI.killProcessesByPort) {
      try {
        const result = await window.electronAPI.killProcessesByPort(port);
        if (result.success) {
          alert(result.message || `Se mataron ${result.killed} procesos`);
          // Recargar la lista de procesos
          await handleCheckPort();
        } else {
          alert(`Error: ${result.error || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('Error matando procesos del puerto:', error);
        alert('Error al matar procesos del puerto');
      }
    }
  };

  // Función para recargar comandos frecuentes
  const loadFrequentCommands = async () => {
    // Cargar grupos
    const groupsData = await terminalCommandService.getGroups(terminal.id);
    setGroups(groupsData || {});

    if (command.trim()) {
      // Si hay texto, buscar coincidencias (sin límite para poder expandir)
      const matching = await terminalCommandService.getMatchingCommands(terminal.id, command, 50, selectedGroup);
      setFrequentCommands(matching);
      setShowFrequentCommands(matching.length > 0);
    } else {
      // Si no hay texto, mostrar los más frecuentes (sin límite para poder expandir)
      const frequent = await terminalCommandService.getFrequentCommands(terminal.id, 50, selectedGroup);
      setFrequentCommands(frequent);
      setShowFrequentCommands(frequent.length > 0);
    }
    // Resetear el estado de "mostrar todos" cuando cambia el comando
    setShowAllCommands(false);
  };

  // Función para eliminar un comando
  const handleDeleteCommand = async (e, commandToDelete) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevenir que el onBlur cierre el dropdown
    const wasShowing = showFrequentCommands;
    
    if (window.confirm(`¿Eliminar el comando "${commandToDelete}" de la lista de frecuentes?`)) {
      await terminalCommandService.deleteCommand(terminal.id, commandToDelete);
      // Recargar la lista de comandos
      await loadFrequentCommands();
      
      // Recargar comandos y restaurar el estado
      const updatedCommands = await terminalCommandService.getFrequentCommands(terminal.id, 50);
      setFrequentCommands(updatedCommands);
      
      // Restaurar el focus al input y mantener el dropdown abierto
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
        // Mantener el dropdown abierto si hay comandos disponibles
        if (updatedCommands.length > 0) {
          setShowFrequentCommands(true);
        } else {
          setShowFrequentCommands(false);
        }
      }, 150);
    } else {
      // Si canceló, restaurar el focus de todas formas
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Cargar comandos frecuentes cuando cambia el comando o el grupo seleccionado
  useEffect(() => {
    const timeoutId = setTimeout(loadFrequentCommands, 300);
    return () => clearTimeout(timeoutId);
  }, [command, terminal.id, selectedGroup]);

  // Función para autocompletar con Tab
  const handleTabCompletion = async (e) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    const cursorPos = inputRef.current?.selectionStart || command.length;
    const textBeforeCursor = command.substring(0, cursorPos);
    const textAfterCursor = command.substring(cursorPos);
    
    // Encontrar la última palabra/token antes del cursor
    const tokens = textBeforeCursor.trim().split(/\s+/);
    const lastToken = tokens[tokens.length - 1] || '';
    
    if (!lastToken) return;
    
    try {
      // Si el token parece una ruta (contiene / o \ o empieza con ./ o ../)
      if (lastToken.includes('/') || lastToken.includes('\\') || lastToken.startsWith('./') || lastToken.startsWith('../')) {
        // Autocompletar archivos/carpetas
        const sep = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.platform === 'win32' ? '\\' : '/';
        const pathParts = lastToken.split(/[/\\]/);
        const fileName = pathParts[pathParts.length - 1];
        const dirPath = pathParts.slice(0, -1).join(sep) || currentDirectory;
        
        // Resolver ruta relativa
        let searchDir = dirPath;
        if (dirPath.startsWith('./')) {
          searchDir = pathHelper.join(currentDirectory, dirPath.substring(2));
        } else if (dirPath.startsWith('../')) {
          searchDir = pathHelper.join(currentDirectory, dirPath);
        } else if (!pathHelper.isAbsolute(dirPath)) {
          searchDir = pathHelper.join(currentDirectory, dirPath);
        }
        
        // Normalizar currentDirectory si es ~
        if (searchDir === '~' || (currentDirectory === '~' && !dirPath)) {
          if (window.electronAPI && window.electronAPI.getCurrentDirectory) {
            try {
              searchDir = await window.electronAPI.getCurrentDirectory();
            } catch {
              searchDir = currentDirectory;
            }
          } else {
            searchDir = currentDirectory;
          }
        }
        
        if (window.electronAPI && window.electronAPI.listDirectory && searchDir && searchDir !== '~') {
          const result = await window.electronAPI.listDirectory(searchDir);
          if (result.files && !result.error) {
            // Buscar archivos/carpetas que empiecen con fileName
            const matches = result.files.filter(item => 
              item.name.toLowerCase().startsWith(fileName.toLowerCase())
            );
            
            if (matches.length === 1) {
              // Un solo match, completar
              const match = matches[0];
              const basePath = pathParts.slice(0, -1).join(sep);
              const newPath = basePath ? `${basePath}${sep}${match.name}` : match.name;
              const newCommand = textBeforeCursor.substring(0, textBeforeCursor.length - lastToken.length) + 
                                newPath + (match.type === 'folder' ? sep : '') + 
                                textAfterCursor;
              setCommand(newCommand);
              // Mover cursor al final del path completado
              setTimeout(() => {
                if (inputRef.current) {
                  const newPos = textBeforeCursor.length - lastToken.length + newPath.length + (match.type === 'folder' ? 1 : 0);
                  inputRef.current.setSelectionRange(newPos, newPos);
                }
              }, 0);
            } else if (matches.length > 1) {
              // Múltiples matches, mostrar en output
              const matchNames = matches.map(m => m.name + (m.type === 'folder' ? '/' : '')).join('  ');
              const updatedTerminal = {
                ...terminal,
                output: (terminal.output || '') + `\n${matchNames}\n`
              };
              onUpdateTerminal(updatedTerminal);
            } else if (matches.length === 0 && fileName) {
              // Si no hay matches exactos, buscar archivos similares (sin extensión o con extensión diferente)
              const similarMatches = result.files.filter(item => {
                const itemNameNoExt = item.name.replace(/\.[^.]+$/, '');
                const fileNameNoExt = fileName.replace(/\.[^.]+$/, '');
                // Buscar si el nombre sin extensión coincide
                return itemNameNoExt.toLowerCase() === fileNameNoExt.toLowerCase() ||
                       itemNameNoExt.toLowerCase().startsWith(fileNameNoExt.toLowerCase());
              });
              
              if (similarMatches.length === 1) {
                // Un solo match similar, completar
                const match = similarMatches[0];
                const basePath = pathParts.slice(0, -1).join(sep);
                const newPath = basePath ? `${basePath}${sep}${match.name}` : match.name;
                const newCommand = textBeforeCursor.substring(0, textBeforeCursor.length - lastToken.length) + 
                                  newPath + (match.type === 'folder' ? sep : '') + 
                                  textAfterCursor;
                setCommand(newCommand);
                setTimeout(() => {
                  if (inputRef.current) {
                    const newPos = textBeforeCursor.length - lastToken.length + newPath.length + (match.type === 'folder' ? 1 : 0);
                    inputRef.current.setSelectionRange(newPos, newPos);
                  }
                }, 0);
              } else if (similarMatches.length > 1) {
                // Múltiples matches similares, mostrar en output
                const matchNames = similarMatches.map(m => m.name + (m.type === 'folder' ? '/' : '')).join('  ');
                const updatedTerminal = {
                  ...terminal,
                  output: (terminal.output || '') + `\nSugerencias: ${matchNames}\n`
                };
                onUpdateTerminal(updatedTerminal);
              }
            }
          }
        }
      } else {
        // Autocompletar comandos desde comandos frecuentes
        const frequent = await terminalCommandService.getFrequentCommands(terminal.id, 50);
        const matchingCommands = frequent.filter(cmd => 
          cmd.command.toLowerCase().startsWith(lastToken.toLowerCase()) && 
          cmd.command.toLowerCase() !== lastToken.toLowerCase()
        );
        
        if (matchingCommands.length === 1) {
          // Un solo match, completar
          const match = matchingCommands[0].command;
          const newCommand = textBeforeCursor.substring(0, textBeforeCursor.length - lastToken.length) + 
                            match + ' ' + textAfterCursor;
          setCommand(newCommand);
          setTimeout(() => {
            if (inputRef.current) {
              const newPos = textBeforeCursor.length - lastToken.length + match.length + 1;
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        } else if (matchingCommands.length > 1) {
          // Múltiples matches, mostrar en output
          const matchNames = matchingCommands.slice(0, 10).map(c => c.command).join('  ');
          const updatedTerminal = {
            ...terminal,
            output: (terminal.output || '') + `\n${matchNames}\n`
          };
          onUpdateTerminal(updatedTerminal);
        }
      }
    } catch (error) {
      console.error('[TerminalTab] Error en autocompletado:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      handleTabCompletion(e);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'Enter' && e.shiftKey) {
      // Permitir nueva línea con Shift+Enter
      return;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowFrequentCommands(false);
    }
  };

  // Cargar información de git cuando cambia el directorio
  useEffect(() => {
    const loadGitInfo = async () => {
      if (!currentDirectory || currentDirectory === '~') {
        setGitBranch(null);
        return;
      }

      try {
        const branch = await gitService.getCurrentBranch(currentDirectory);
        setGitBranch(branch);
      } catch (error) {
        setGitBranch(null);
      }
    };

    loadGitInfo();
    
    // Actualizar cada 2 segundos para detectar cambios de rama
    const interval = setInterval(loadGitInfo, 2000);
    return () => clearInterval(interval);
  }, [currentDirectory]);

  const getPrompt = () => {
    const cwd = currentDirectory || '~';
    const shell = currentShell || 'bash';
    
    if (shell === 'powershell') {
      const branchInfo = gitBranch ? ` [${gitBranch}]` : '';
      return `PS ${cwd}${branchInfo}> `;
    } else if (shell === 'cmd') {
      const branchInfo = gitBranch ? ` [${gitBranch}]` : '';
      return `${cwd}${branchInfo}>`;
    } else {
      // bash, sh, zsh
      const user = 'user';
      const host = 'localhost';
      const branchInfo = gitBranch ? ` (${gitBranch})` : '';
      return `${user}@${host}:${cwd}${branchInfo}$ `;
    }
  };

  const handleCopy = async () => {
    if (!terminal.output) return;
    
    try {
      await navigator.clipboard.writeText(terminal.output);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = terminal.output;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error('Error al copiar (fallback):', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleOpenEditor = () => {
    if (!terminal.output) return;
    setEditedText(terminal.output);
    setShowEditor(true);
  };

  const handleReplace = () => {
    if (!searchText.trim()) return;
    const newText = editedText.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText);
    setEditedText(newText);
  };

  const handleReplaceAll = () => {
    if (!searchText.trim()) return;
    const newText = editedText.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replaceText);
    setEditedText(newText);
  };

  const handleCopyEdited = async () => {
    if (!editedText) return;
    
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      setShowEditor(false);
    } catch (error) {
      console.error('Error al copiar:', error);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = editedText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
        setShowEditor(false);
      } catch (err) {
        console.error('Error al copiar (fallback):', err);
      }
      document.body.removeChild(textArea);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ 
        backgroundColor: terminalStyles.backgroundColor,
        color: terminalStyles.textColor
      }}
    >
      {/* Output area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono relative"
        style={{ 
          backgroundColor: terminalStyles.backgroundColor,
          color: terminalStyles.textColor,
          fontSize: `${terminalStyles.outputFontSize || terminalStyles.fontSize || 14}px`,
          minHeight: '200px'
        }}
      >
        {/* Wrapper para contenido y botones sticky */}
        <div className="relative min-h-full">
          {/* Botones de navegación rápida (arriba/abajo) - al lado izquierdo del scrollbar */}
          {terminal.output && (
            <div 
              ref={navButtonsRef}
              className="fixed flex flex-col gap-1 z-10"
              style={{ 
                right: '8px',
                pointerEvents: 'none',
                width: 'fit-content'
              }}
            >
              <button
                onClick={scrollToTop}
                className="p-1.5 rounded transition-all opacity-60 hover:opacity-100 pointer-events-auto"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  color: terminalStyles.textColor,
                  backdropFilter: 'blur(4px)',
                }}
                title="Ir al inicio"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                }}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={scrollToBottom}
                className="p-1.5 rounded transition-all opacity-60 hover:opacity-100 pointer-events-auto"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  color: terminalStyles.textColor,
                  backdropFilter: 'blur(4px)',
                }}
                title="Ir al final"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Contenido del output */}
          <div className="relative">
            {/* Botones de control de proceso y acciones */}
            <div className="absolute top-2 right-2 flex gap-1 z-10">
          {/* Botones de control de proceso (si hay un proceso corriendo) */}
          {isProcessRunning && (
            <>
              <button
                onClick={handleStopProcess}
                className="p-2 rounded-lg transition-colors hover:bg-red-500/20"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                }}
                title="Detener proceso (Ctrl+C)"
              >
                <Square className="w-4 h-4" />
              </button>
              {(lastCommand || commandHistory.length > 0) && (
                <button
                  onClick={handleRestartProcess}
                  className="p-2 rounded-lg transition-colors hover:bg-blue-500/20"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                  }}
                  title={`Reiniciar: ${lastCommand || commandHistory[commandHistory.length - 1] || 'último comando'}`}
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowPortManager(true)}
                className="p-2 rounded-lg transition-colors hover:bg-purple-500/20"
                style={{
                  backgroundColor: 'rgba(147, 51, 234, 0.2)',
                  color: '#9333ea',
                }}
                title="Gestionar puertos"
              >
                <Network className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Botones de copiar y editar */}
          {terminal.output && (
            <>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                  color: copied ? '#22c55e' : terminalStyles.textColor,
                }}
                title={copied ? 'Copiado' : 'Copiar salida'}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleOpenEditor}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: terminalStyles.textColor,
                }}
                title="Copiar y editar (buscar y reemplazar)"
              >
                <Edit className="w-4 h-4" />
              </button>
              {/* Botón para abrir URLs detectadas */}
              {detectedUrls.length > 0 && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlMenu(!showUrlMenu);
                    }}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: showUrlMenu ? 'rgba(59, 130, 246, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                      color: showUrlMenu ? '#3b82f6' : terminalStyles.textColor,
                    }}
                    title={`Abrir ${detectedUrls.length} URL${detectedUrls.length > 1 ? 's' : ''} detectada${detectedUrls.length > 1 ? 's' : ''}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  {showUrlMenu && (
                    <div 
                      className="absolute right-0 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[250px] max-w-[400px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-gray-700 bg-gray-900">
                        <div className="text-xs font-semibold text-gray-300">
                          URLs Detectadas ({detectedUrls.length})
                        </div>
                      </div>
                      <div className="py-1 max-h-[300px] overflow-y-auto">
                        {detectedUrls.map((url, index) => {
                          // Obtener URL para mostrar (sin http:// si fue agregado)
                          const displayUrl = url.replace(/^https?:\/\//, '');
                          return (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(url, '_blank');
                                setShowUrlMenu(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-blue-400 font-mono truncate group-hover:text-blue-300">
                                  {displayUrl}
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                            </button>
                          );
                        })}
                      </div>
                      {detectedUrls.length === 1 && (
                        <div className="px-3 py-2 border-t border-gray-700 bg-gray-900">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(detectedUrls[0], '_blank');
                              setShowUrlMenu(false);
                            }}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Abrir URL
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
            </div>

            {/* Contenido del output */}
            {terminal.output ? (
              <div 
                className="whitespace-pre-wrap break-words font-mono" 
                style={{ fontSize: `${terminalStyles.outputFontSize || terminalStyles.fontSize || 14}px` }}
              >
                {renderTextWithUrls(terminal.output)}
              </div>
            ) : (
              <div className="text-gray-500" style={{ fontSize: `${terminalStyles.outputFontSize || terminalStyles.fontSize || 14}px` }}>
                Terminal {terminal.name || terminal.id} listo. Escribe comandos para comenzar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div 
        className="border-t border-gray-700 p-2 flex flex-col gap-1 relative flex-shrink-0"
        style={{ 
          minHeight: `${terminalStyles.inputHeight || 80}px`,
          height: `${terminalStyles.inputHeight || 80}px`
        }}
      >
        {/* Lista de comandos frecuentes - Centrado */}
        {showFrequentCommands && frequentCommands.length > 0 && (
          <div 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[300px] max-w-[500px]"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            <div className="px-3 py-2 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-300">
                  {selectedGroup && groups[selectedGroup] 
                    ? `${groups[selectedGroup].name} (${frequentCommands.length})`
                    : `Comandos frecuentes ${frequentCommands.length > 7 && !showAllCommands ? `(${frequentCommands.length})` : ''}`
                  }
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGroupsModal(true);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                title="Gestionar grupos"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
            <div className="py-1">
              {(showAllCommands ? frequentCommands : frequentCommands.slice(0, 7)).map((item, index) => {
                const language = terminalCommandService.detectCommandLanguage(item.command);
                return (
                  <button
                    key={index}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const commandToExecute = item.command;
                      
                      // Cerrar el dropdown primero
                      setShowFrequentCommands(false);
                      setShowAllCommands(false);
                      
                      // Limpiar el input inmediatamente para que no parezca que no se ejecutó
                      setCommand('');
                      
                      // Guardar el último comando para poder reiniciarlo
                      setLastCommand(commandToExecute);
                      
                      // Actualizar historial
                      const newHistory = [...commandHistory, commandToExecute];
                      setCommandHistory(newHistory);
                      setHistoryIndex(-1);
                      
                      // Guardar comando en servicio de comandos frecuentes
                      await terminalCommandService.saveCommand(terminal.id, commandToExecute);
                      
                      // Actualizar historial en el terminal
                      const updatedTerminal = {
                        ...terminal,
                        history: newHistory
                      };
                      onUpdateTerminal(updatedTerminal);
                      
                      // Ejecutar el comando directamente
                      await onExecuteCommand(terminal.id, commandToExecute);
                      
                      // Detectar si es un comando de larga duración (cualquier tipo)
                      const isLongRunning = /^(npm|yarn|pnpm)\s+(run\s+)?(dev|start|serve|watch)/i.test(commandToExecute) ||
                                            /^(python|python3|py)\s+.*(dev|start|serve|runserver|app\.py|main\.py|server\.py)/i.test(commandToExecute) ||
                                            /^(node|nodemon|ts-node|tsx)\s+.*(dev|start|serve|watch)/i.test(commandToExecute) ||
                                            /^(uvicorn|gunicorn|flask|django)\s+/i.test(commandToExecute) ||
                                            /^(dotnet|java|mvn|gradle)\s+.*(run|start)/i.test(commandToExecute);
                      if (isLongRunning) {
                        setIsProcessRunning(true);
                      }
                      
                      // Enfocar el input después de un breve delay
                      setTimeout(() => {
                        if (inputRef.current) {
                          inputRef.current.focus();
                        }
                      }, 100);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 font-mono truncate">
                        {item.command}
                      </div>
                      {language && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {language}
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {item.count}x
                      </span>
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteCommand(e, item.command);
                        }}
                        onMouseDown={(e) => {
                          // Prevenir que el onBlur del textarea se active cuando se hace clic
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        role="button"
                        tabIndex={0}
                        className="p-1 hover:bg-red-600 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Eliminar comando"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteCommand(e, item.command);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
              
              {/* Botón para expandir/contraer si hay más de 7 comandos */}
              {frequentCommands.length > 7 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllCommands(!showAllCommands);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 border-t border-gray-700 text-xs text-gray-400 hover:text-gray-200"
                >
                  {showAllCommands ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      <span>Ver menos (mostrar solo 7)</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      <span>Ver más ({frequentCommands.length - 7} comandos adicionales)</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            {/* Botones de grupos */}
            {Object.keys(groups).length > 0 && (
              <div className="px-3 py-2 border-t border-gray-700 bg-gray-900">
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedGroup(null);
                    }}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedGroup === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(groups).map(([groupId, group]) => (
                    <GroupButton
                      key={groupId}
                      groupId={groupId}
                      group={group}
                      terminalId={terminal.id}
                      isSelected={selectedGroup === groupId}
                      onSelect={() => setSelectedGroup(selectedGroup === groupId ? null : groupId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="font-mono" style={{ color: terminalStyles.promptColor, fontSize: `${terminalStyles.inputFontSize || terminalStyles.fontSize || 14}px` }}>
          {getPrompt()}
        </div>
        <textarea
          ref={inputRef}
          value={command}
          onChange={(e) => {
            setCommand(e.target.value);
            setShowFrequentCommands(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            onActivate();
            setShowFrequentCommands(true);
          }}
          onBlur={(e) => {
            // Delay para permitir clicks en la lista y botones
            // Verificar si el elemento relacionado es parte del dropdown
            const relatedTarget = e.relatedTarget;
            const isClickOnDropdown = relatedTarget && (
              relatedTarget.closest('.absolute.bottom-full') ||
              relatedTarget.closest('button[title="Eliminar comando"]')
            );
            
            if (!isClickOnDropdown) {
              setTimeout(() => {
                // Solo cerrar si el focus no está en el dropdown
                if (document.activeElement && !document.activeElement.closest('.absolute.bottom-full')) {
                  setShowFrequentCommands(false);
                }
              }, 200);
            }
          }}
          className="flex-1 bg-transparent border-none outline-none font-mono resize-none"
          style={{ 
            color: terminalStyles.textColor, 
            fontSize: `${terminalStyles.inputFontSize || terminalStyles.fontSize || 14}px`,
            lineHeight: '1.5',
            minHeight: `${(terminalStyles.inputHeight || 80) - 20}px`,
            maxHeight: `${(terminalStyles.inputHeight || 80) - 20}px`,
            overflowY: 'auto'
          }}
          placeholder="Escribe un comando..."
          rows={1}
        />
      </div>

      {/* Modal de editor con buscar y reemplazar */}
      {showEditor && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-2"
          onClick={() => setShowEditor(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Editar y Copiar Salida
                </h2>
              </div>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buscar y Reemplazar */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Buscar y Reemplazar
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Buscar:
                  </label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Texto a buscar..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Reemplazar con:
                  </label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Texto de reemplazo..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReplace}
                  disabled={!searchText.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Replace className="w-4 h-4" />
                  Reemplazar primera
                </button>
                <button
                  onClick={handleReplaceAll}
                  disabled={!searchText.trim()}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Replace className="w-4 h-4" />
                  Reemplazar todas
                </button>
              </div>
            </div>

            {/* Editor de texto */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 min-h-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido editado:
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="flex-1 w-full min-h-0 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-base resize-none"
                placeholder="Edita el texto aquí..."
                spellCheck={false}
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCopyEdited}
                disabled={!editedText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar editado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión de puertos */}
      {showPortManager && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4"
          onClick={() => setShowPortManager(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Network className="w-5 h-5" />
                Gestión de Puertos
              </h2>
              <button
                onClick={() => setShowPortManager(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de puerto
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={portToCheck}
                    onChange={(e) => setPortToCheck(e.target.value)}
                    placeholder="Ej: 5187"
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="65535"
                  />
                  <button
                    onClick={handleCheckPort}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Verificar
                  </button>
                  {portToCheck && (
                    <button
                      onClick={handleKillAllPortProcesses}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Matar Todos
                    </button>
                  )}
                </div>
              </div>
              
              {portProcesses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Procesos usando el puerto {portToCheck}:
                  </h3>
                  <div className="space-y-2">
                    {portProcesses.map((proc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div>
                          <div className="text-white font-mono text-sm">
                            PID: {proc.pid}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {proc.name || 'Proceso desconocido'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleKillProcess(proc.pid)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                        >
                          Matar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {portProcesses.length === 0 && portToCheck && (
                <div className="text-center py-8 text-gray-400">
                  No hay procesos usando el puerto {portToCheck}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión de grupos */}
      <TerminalCommandGroupsModal
        isOpen={showGroupsModal}
        onClose={() => {
          setShowGroupsModal(false);
          loadFrequentCommands(); // Recargar después de cerrar
        }}
        terminalId={terminal.id}
      />
    </div>
  );
}

