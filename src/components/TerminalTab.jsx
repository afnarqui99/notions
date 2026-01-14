import { useState, useRef, useEffect } from 'react';
import { X, Terminal, Settings } from 'lucide-react';

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
  const inputRef = useRef(null);
  const outputRef = useRef(null);

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
    
    // Actualizar historial en el terminal
    const updatedTerminal = {
      ...terminal,
      history: newHistory
    };
    onUpdateTerminal(updatedTerminal);

    // Ejecutar comando
    await onExecuteCommand(terminal.id, command);
    
    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
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
    }
  };

  const getPrompt = () => {
    const cwd = terminal.currentDirectory || '~';
    const shell = terminal.shell || 'bash';
    
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

  const terminalStyles = terminal.styles || {
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    promptColor: '#4ec9b0',
    errorColor: '#f48771'
  };

  if (!isActive) {
    return null;
  }

  return (
    <div 
      className="flex-1 flex flex-col h-full"
      style={{ 
        backgroundColor: terminalStyles.backgroundColor,
        color: terminalStyles.textColor
      }}
    >
      {/* Output area */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
        style={{ 
          backgroundColor: terminalStyles.backgroundColor,
          color: terminalStyles.textColor
        }}
      >
        {terminal.output ? (
          <pre className="whitespace-pre-wrap break-words">{terminal.output}</pre>
        ) : (
          <div className="text-gray-500">
            Terminal {terminal.name || terminal.id} listo. Escribe comandos para comenzar.
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-700 p-2 flex items-center gap-2">
        <span 
          className="font-mono text-sm"
          style={{ color: terminalStyles.promptColor }}
        >
          {getPrompt()}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onActivate()}
          className="flex-1 bg-transparent border-none outline-none font-mono text-sm"
          style={{ color: terminalStyles.textColor }}
          placeholder="Escribe un comando..."
        />
      </div>
    </div>
  );
}

