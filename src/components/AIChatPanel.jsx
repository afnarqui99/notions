import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, Maximize2, Sparkles, Settings, AlertCircle } from 'lucide-react';
import AIService from '../services/AIService';

export default function AIChatPanel({ 
  isOpen, 
  onClose, 
  activeFile, 
  fileContents,
  projectPath 
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA integrado, similar a Cursor. ¿En qué puedo ayudarte con tu código?\n\n**Nota:** Para usar la IA, necesitas configurar tu API key en la configuración (icono de engranaje).',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState('openai');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Cargar configuración existente
    if (AIService.hasApiKey()) {
      const config = JSON.parse(localStorage.getItem('ai-service-config') || '{}');
      setApiKey(config.apiKey || '');
      setApiProvider(config.provider || 'openai');
    } else {
      // Si no hay API key, mostrar el panel de configuración automáticamente
      setShowSettings(true);
    }
  }, []);
  
  // Mostrar configuración automáticamente cuando se abre el panel si no hay API key
  useEffect(() => {
    if (isOpen && !AIService.hasApiKey()) {
      setShowSettings(true);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSaveSettings = () => {
    if (!apiKey.trim()) {
      setError('Por favor, ingresa una API key válida');
      return;
    }
    AIService.setApiKey(apiKey.trim(), apiProvider);
    setShowSettings(false);
    setError(null);
    // Actualizar mensaje inicial
    setMessages([{
      id: 1,
      role: 'assistant',
      content: '¡Perfecto! Tu API key está configurada. ¿En qué puedo ayudarte con tu código?',
      timestamp: new Date()
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Verificar si hay API key configurada
    if (!AIService.hasApiKey()) {
      setError('Por favor, configura tu API key primero (icono de engranaje)');
      setShowSettings(true);
      return;
    }

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Preparar historial de mensajes (sin el mensaje inicial de bienvenida)
      const messageHistory = messages
        .filter(msg => msg.id !== 1) // Excluir mensaje inicial
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await AIService.sendMessage(
        userMessage.content,
        messageHistory,
        activeFile,
        fileContents,
        projectPath
      );

      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[AIChatPanel] Error:', error);
      setError(error.message || 'Error al comunicarse con la IA. Por favor, verifica tu API key.');
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant',
        content: `**Error:** ${error.message || 'No se pudo obtener respuesta de la IA. Por favor, verifica tu configuración.'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Función para renderizar markdown básico
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    // Convertir **texto** a negrita
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convertir `código` a código inline
    text = text.replace(/`([^`]+)`/g, '<code class="bg-[#3e3e42] px-1 py-0.5 rounded text-[#4ec9b0]">$1</code>');
    
    // Convertir saltos de línea
    text = text.replace(/\n/g, '<br />');
    
    return text;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed right-0 top-0 h-full bg-[#1e1e1e] border-l border-[#3e3e42] flex flex-col z-[100000] ${
        isMinimized ? 'w-80' : 'w-[500px]'
      } transition-all duration-300 shadow-2xl`}>
        {/* Header - Estilo Cursor */}
        <div className="bg-[#252526] border-b border-[#3e3e42] px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#4ec9b0] to-[#007acc] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="text-[#cccccc] font-medium text-[13px]">AI Assistant</h3>
            {!AIService.hasApiKey() && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full" title="API key no configurada"></div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title={isMinimized ? "Expandir" : "Minimizar"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages - Estilo Cursor */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#1e1e1e]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4ec9b0] to-[#007acc] flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#007acc] text-[#ffffff]'
                        : 'bg-[#252526] text-[#cccccc] border border-[#3e3e42]'
                    }`}
                  >
                    <div 
                      className="text-[13px] leading-relaxed whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                    />
                    <div className={`text-[11px] mt-2 ${
                      message.role === 'user' ? 'text-[#88ccff]' : 'text-[#858585]'
                    }`}>
                      {message.timestamp.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-[#007acc] flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#4ec9b0] to-[#007acc] flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-[#252526] border border-[#3e3e42] rounded-lg px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-[#4ec9b0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[#4ec9b0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[#4ec9b0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg px-4 py-3 text-[#ff6b6b] text-[13px]">
                    {error}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input - Estilo Cursor */}
            <div className="border-t border-[#3e3e42] p-4 flex-shrink-0 bg-[#252526]">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={AIService.hasApiKey() ? "Pregunta sobre tu código..." : "Configura tu API key primero..."}
                  className="flex-1 px-4 py-2.5 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-[#cccccc] text-[13px] placeholder-[#858585] focus:outline-none focus:ring-2 focus:ring-[#007acc] focus:border-[#007acc] resize-none"
                  rows={3}
                  disabled={isLoading || !AIService.hasApiKey()}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !AIService.hasApiKey()}
                  className="px-4 py-2.5 bg-[#007acc] hover:bg-[#1177bb] disabled:bg-[#3e3e42] disabled:text-[#858585] text-white rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                  title="Enviar (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11px] text-[#858585] mt-2 flex items-center justify-between">
                <span>Enter para enviar, Shift+Enter para nueva línea</span>
                {activeFile && (
                  <span className="text-[#4ec9b0]">📄 {activeFile.split(/[/\\]/).pop()}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Configuración */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100001] flex items-center justify-center p-4"
          onClick={() => {
            setShowSettings(false);
            setError(null);
          }}
        >
          <div 
            className="bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#2d2d30] border-b border-[#3e3e42] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#cccccc]">Configuración de IA</h2>
              <button
                onClick={() => {
                  setShowSettings(false);
                  setError(null);
                }}
                className="text-[#858585] hover:text-[#cccccc] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-2">
                  Proveedor de IA
                </label>
                <select
                  value={apiProvider}
                  onChange={(e) => setApiProvider(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#007acc]"
                >
                  <option value="openai">OpenAI (GPT-4)</option>
                  <option value="anthropic">Anthropic (Claude) - Similar a Cursor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cccccc] mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={apiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="w-full px-4 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#007acc]"
                />
                <p className="text-xs text-[#858585] mt-2">
                  {apiProvider === 'openai' 
                    ? 'Obtén tu API key en: https://platform.openai.com/api-keys'
                    : 'Obtén tu API key en: https://console.anthropic.com/'}
                </p>
              </div>
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-[#ff6b6b] text-sm">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-[#3e3e42] hover:bg-[#464647] text-[#cccccc] rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-[#007acc] hover:bg-[#1177bb] text-white rounded transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
