import { useState, useRef, useEffect } from 'react';
import { X, Terminal, Settings, Copy, Check, Edit, Search, Replace, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import terminalCommandService from '../services/TerminalCommandService';

// Importar Settings si no está

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
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  // Actualizar estilos y shell cuando cambia el terminal
  useEffect(() => {
    console.log('[TerminalTab] Terminal actualizado:', {
      id: terminal.id,
      shell: terminal.shell,
      currentDirectory: terminal.currentDirectory,
      styles: terminal.styles
    });
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
      console.log('[TerminalTab] Shell cambiado de', currentShell, 'a', newShell);
      setCurrentShell(newShell);
    }
    if (currentDirectory !== newDirectory) {
      setCurrentDirectory(newDirectory);
    }
  }, [terminal]);

  // Auto-scroll en output
  useEffect(() => {
    if (outputRef.current && isActive) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminal.output, isActive]);

  // Enfocar input cuando se activa
  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isActive]);

  const handleExecute = async () => {
    if (!command.trim()) return;

    const newHistory = [...commandHistory, command];
    setCommandHistory(newHistory);
    setHistoryIndex(-1);
    
    // Guardar comando en servicio de comandos frecuentes
    await terminalCommandService.saveCommand(terminal.id, command);
    
    // Actualizar historial en el terminal
    const updatedTerminal = {
      ...terminal,
      history: newHistory
    };
    onUpdateTerminal(updatedTerminal);

    // Ejecutar comando
    await onExecuteCommand(terminal.id, command);
    
    setCommand('');
    setShowFrequentCommands(false);
  };

  // Cargar comandos frecuentes cuando cambia el comando
  useEffect(() => {
    const loadFrequentCommands = async () => {
      if (command.trim()) {
        // Si hay texto, buscar coincidencias (sin límite para poder expandir)
        const matching = await terminalCommandService.getMatchingCommands(terminal.id, command, 50);
        setFrequentCommands(matching);
        setShowFrequentCommands(matching.length > 0);
      } else {
        // Si no hay texto, mostrar los más frecuentes (sin límite para poder expandir)
        const frequent = await terminalCommandService.getFrequentCommands(terminal.id, 50);
        setFrequentCommands(frequent);
        setShowFrequentCommands(frequent.length > 0);
      }
      // Resetear el estado de "mostrar todos" cuando cambia el comando
      setShowAllCommands(false);
    };

    const timeoutId = setTimeout(loadFrequentCommands, 300);
    return () => clearTimeout(timeoutId);
  }, [command, terminal.id]);

  const handleKeyDown = (e) => {
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

  const getPrompt = () => {
    const cwd = currentDirectory || '~';
    const shell = currentShell || 'bash';
    
    if (shell === 'powershell') {
      return `PS ${cwd}> `;
    } else if (shell === 'cmd') {
      return `${cwd}>`;
    } else {
      // bash, sh, zsh
      const user = 'user';
      const host = 'localhost';
      return `${user}@${host}:${cwd}$ `;
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
        {/* Botones de copiar y editar */}
        {terminal.output && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
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
          </div>
        )}
        {terminal.output ? (
          <pre className="whitespace-pre-wrap break-words" style={{ fontSize: `${terminalStyles.outputFontSize || terminalStyles.fontSize || 14}px` }}>{terminal.output}</pre>
        ) : (
          <div className="text-gray-500" style={{ fontSize: `${terminalStyles.outputFontSize || terminalStyles.fontSize || 14}px` }}>
            Terminal {terminal.name || terminal.id} listo. Escribe comandos para comenzar.
          </div>
        )}
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
                  Comandos frecuentes {frequentCommands.length > 7 && !showAllCommands ? `(${frequentCommands.length})` : ''}
                </span>
              </div>
            </div>
            <div className="py-1">
              {(showAllCommands ? frequentCommands : frequentCommands.slice(0, 7)).map((item, index) => {
                const language = terminalCommandService.detectCommandLanguage(item.command);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCommand(item.command);
                      setShowFrequentCommands(false);
                      setShowAllCommands(false);
                      inputRef.current?.focus();
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
          onBlur={() => {
            // Delay para permitir clicks en la lista
            setTimeout(() => setShowFrequentCommands(false), 200);
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
          className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4"
          onClick={() => setShowEditor(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
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
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
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
            <div className="flex-1 overflow-hidden flex flex-col p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido editado:
              </label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="flex-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm resize-none"
                placeholder="Edita el texto aquí..."
                spellCheck={false}
              />
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
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
    </div>
  );
}

