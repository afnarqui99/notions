import { useState, useEffect, useRef } from 'react';
import { X, Play, Trash2, FolderOpen, Download, Clock, FileVideo, Mic, MessageSquare, Loader2, CheckCircle, Sparkles, Video, Square, Bot, User, Send, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import AIService from '../services/AIService';
import screenRecordingService from '../services/ScreenRecordingService';
import ScreenSourceSelectorModal from './ScreenSourceSelectorModal';

export default function ScreenRecordingHistory({ isOpen, onClose }) {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [transcribingId, setTranscribingId] = useState(null);
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [query, setQuery] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [selectedRecordings, setSelectedRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [availableSources, setAvailableSources] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [showTranscriptions, setShowTranscriptions] = useState({});
  const messagesEndRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMode, setChatMode] = useState('transcriptions'); // 'transcriptions' | 'free'

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      // Verificar estado de grabación
      checkRecordingStatus();
    }
  }, [isOpen]);

  // Verificar estado de grabación periódicamente
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      checkRecordingStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const checkRecordingStatus = () => {
    const status = screenRecordingService.getStatus();
    setIsRecording(status.isRecording);
    if (status.isRecording) {
      setRecordingDuration(Math.floor(status.duration / 1000));
    } else {
      setRecordingDuration(0);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const history = await screenRecordingService.getHistory();
      setRecordings(history);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatear duración desde milisegundos (para grabaciones guardadas)
  const formatDurationFromMs = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatear duración desde segundos (para contador en vivo)
  const formatDurationFromSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (recordingId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta grabación?')) {
      return;
    }

    try {
      const result = await screenRecordingService.deleteRecording(recordingId);
      if (result.success) {
        await loadHistory();
        if (selectedRecording?.id === recordingId) {
          setSelectedRecording(null);
        }
        setSelectedRecordings(selectedRecordings.filter(id => id !== recordingId));
      } else {
        alert(`Error al eliminar: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await screenRecordingService.openRecordingsFolder();
    } catch (error) {
      alert(`Error abriendo carpeta: ${error.message}`);
    }
  };

  const handlePlay = (recording) => {
    if (playingId === recording.id) {
      setPlayingId(null);
      setSelectedRecording(null);
    } else {
      setPlayingId(recording.id);
      setSelectedRecording(recording);
    }
  };

  const handleTranscribe = async (recordingId) => {
    try {
      setTranscribingId(recordingId);
      const result = await screenRecordingService.transcribeRecording(recordingId);
      
      if (result.success) {
        await loadHistory();
        alert('✅ Transcripción completada exitosamente');
      } else {
        alert(`❌ Error al transcribir: ${result.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert(`❌ Error al transcribir: ${error.message}`);
    } finally {
      setTranscribingId(null);
    }
  };

  const handleToggleSelection = (recordingId) => {
    setSelectedRecordings(prev => {
      if (prev.includes(recordingId)) {
        return prev.filter(id => id !== recordingId);
      } else {
        return [...prev, recordingId];
      }
    });
  };

  const handleStartRecording = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isRecording) {
      return;
    }
    
    try {
      // Primero, obtener las fuentes disponibles para mostrar el modal si hay múltiples
      if (window.electronAPI && window.electronAPI.getScreenSources) {
        try {
          const sources = await window.electronAPI.getScreenSources();
          if (sources.length > 1) {
            // Mostrar modal de selección
            setAvailableSources(sources);
            setShowSourceSelector(true);
            return; // El modal manejará el inicio de la grabación
          }
        } catch (error) {
          console.warn('[ScreenRecordingHistory] Error obteniendo fuentes:', error);
        }
      }
      
      // Si solo hay una fuente o no hay electronAPI, iniciar directamente
      await startRecordingWithSource(null);
    } catch (error) {
      alert(`❌ Error al iniciar grabación: ${error.message}\n\nAsegúrate de permitir el acceso a la pantalla y al micrófono.`);
    }
  };

  const startRecordingWithSource = async (selectedSource) => {
    // Prevenir múltiples llamadas simultáneas
    if (isRecording) {
      console.warn('[ScreenRecordingHistory] Ya hay una grabación en curso');
      return;
    }
    
    try {
      const result = await screenRecordingService.startRecording(selectedSource);
      
      // Verificar que la grabación se inició correctamente
      if (result && result.success === false) {
        alert(`⚠️ ${result.message}`);
        return;
      }
      
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Iniciar contador de duración
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      recordingIntervalRef.current = interval;
      
      alert(`🎥 ${result?.message || 'Grabación iniciada'}\n\n📌 IMPORTANTE:\n• Selecciona "Compartir audio" en el diálogo para capturar el audio del sistema (incluye audio de otras personas en reuniones)\n• Puedes cambiar de ventana durante la grabación\n• El micrófono también se capturará si lo permites\n\nPara detener, haz clic en el botón de detener o detén el compartir de pantalla.`);
    } catch (error) {
      if (error.message === 'SCREEN_SOURCE_SELECTION_NEEDED') {
        // Esto no debería pasar ahora, pero por si acaso
        return;
      }
      alert(`❌ Error al iniciar grabación: ${error.message}\n\nAsegúrate de permitir el acceso a la pantalla y al micrófono.`);
    }
  };

  const handleSourceSelected = (source) => {
    setShowSourceSelector(false);
    // Pequeño delay para asegurar que el modal se cierre antes de iniciar
    setTimeout(() => {
      startRecordingWithSource(source);
    }, 100);
  };

  const handleStopRecording = async () => {
    try {
      const result = await screenRecordingService.stopRecording();
      
      // Detener contador
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      setIsRecording(false);
      const durationSeconds = Math.floor(recordingDuration);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      
      console.log('[ScreenRecordingHistory] Grabación detenida:', result);
      
      // Esperar un momento para que se complete el guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recargar historial inmediatamente
      await loadHistory();
      
      // Esperar a que se complete el guardado (el handleRecordingStop es asíncrono)
      // Intentar recargar el historial varias veces con intervalos
      let attempts = 0;
      const maxAttempts = 15; // Aumentar intentos
      const checkInterval = setInterval(async () => {
        attempts++;
        await loadHistory();
        
        // Verificar si el nuevo video aparece en el historial
        const history = await screenRecordingService.getHistory();
        const previousCount = recordings.length;
        const currentCount = history.length;
        
        console.log(`[ScreenRecordingHistory] Intento ${attempts}/${maxAttempts}: ${previousCount} -> ${currentCount} grabaciones`);
        
        if (currentCount > previousCount || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          if (currentCount > previousCount) {
            alert(`✅ Video guardado exitosamente\n\nDuración: ${minutes}:${seconds.toString().padStart(2, '0')}\nEl video ya está disponible en el historial.`);
          } else {
            console.warn('[ScreenRecordingHistory] El video no apareció en el historial después de', attempts, 'intentos');
            alert(`⚠️ El video se está guardando.\n\nSi no aparece en el historial, verifica:\n1. La carpeta: C:\\Users\\afnar\\AppData\\Roaming\\notion-local-editor\\screen-recordings\n2. La consola del navegador (F12) para ver errores\n3. Intenta grabar de nuevo`);
          }
        }
      }, 500);
      
      // Timeout de seguridad
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 7500); // 7.5 segundos
      
    } catch (error) {
      console.error('[ScreenRecordingHistory] Error al detener grabación:', error);
      alert(`❌ Error al detener grabación:\n${error.message}\n\nRevisa la consola (F12) para más detalles.`);
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleQuery = async () => {
    if (!query.trim()) {
      alert('Por favor, ingresa una pregunta');
      return;
    }

    // Agregar mensaje del usuario al chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    const currentQuery = query;
    setQuery('');

    try {
      setQuerying(true);
      let result;

      if (chatMode === 'free') {
        // Modo libre: preguntas sin transcripciones
        if (!AIService.hasApiKey()) {
          alert('Por favor, configura tu API key de IA en la configuración (icono de engranaje).');
          setQuerying(false);
          return;
        }
        // Convertir historial de chat al formato esperado
        const chatHistory = chatMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        const aiResponse = await AIService.sendSimpleMessage(currentQuery, chatHistory);
        if (typeof aiResponse === 'string') {
          result = { success: true, answer: aiResponse };
        } else {
          result = { success: false, error: 'No se recibió respuesta de la IA' };
        }
      } else {
        // Modo transcripciones: preguntas sobre grabaciones
        const recordingsToQuery = selectedRecordings.length > 0 
          ? selectedRecordings 
          : recordings.filter(r => r.transcription).map(r => r.id);

        if (recordingsToQuery.length === 0) {
          alert('No hay grabaciones transcritas disponibles. Por favor, transcribe algunas grabaciones primero o cambia al modo "Chat Libre".');
          setQuerying(false);
          return;
        }

        result = await screenRecordingService.queryRecordings(currentQuery, recordingsToQuery);
      }
      
      if (result.success) {
        // Agregar respuesta de la IA al chat
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.answer,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `❌ Error: ${result.error || 'Error desconocido'}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setQuerying(false);
    }
  };

  // Scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const toggleTranscription = (recordingId) => {
    setShowTranscriptions(prev => ({
      ...prev,
      [recordingId]: !prev[recordingId]
    }));
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed ${isFullscreen ? 'inset-0' : 'inset-0 bg-black bg-opacity-50 flex items-center justify-center'} z-50`}>
      <div className={`bg-white dark:bg-gray-800 ${isFullscreen ? 'w-full h-full' : 'rounded-lg shadow-xl w-full'} ${showQueryPanel ? 'max-w-7xl' : 'max-w-6xl'} ${isFullscreen ? 'h-full' : 'max-h-[90vh]'} flex flex-col`}>
        {/* Header - Siempre visible */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileVideo className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Historial de Grabaciones
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de iniciar/detener grabación */}
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Iniciar grabación de pantalla con audio"
              >
                <Video className="w-4 h-4" />
                <span className="text-sm font-medium">Grabar</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 animate-pulse"
                title={`Detener grabación (${formatDurationFromSeconds(recordingDuration)})`}
              >
                <Square className="w-4 h-4" />
                <span className="text-sm font-medium">Detener ({formatDurationFromSeconds(recordingDuration)})</span>
              </button>
            )}
            <button
              onClick={() => setShowQueryPanel(!showQueryPanel)}
              className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              title="Consultar IA sobre grabaciones"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={handleOpenFolder}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title="Abrir carpeta de grabaciones"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layout dividido cuando el chat está abierto */}
        {showQueryPanel ? (
          <div className="flex flex-1 overflow-hidden relative">
            {/* Panel izquierdo: Lista de grabaciones */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 relative z-0">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    Grabaciones ({recordings.length})
                  </h4>
                  {selectedRecordings.length > 0 && (
                    <button
                      onClick={() => setSelectedRecordings([])}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {chatMode === 'transcriptions' 
                    ? 'Selecciona para consultar' 
                    : 'Las grabaciones no se usarán en modo Chat Libre'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {recordings.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                    No hay grabaciones
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recordings.map((recording) => (
                      <div
                        key={recording.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedRecordings.includes(recording.id)
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelection(recording.id);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRecordings.includes(recording.id)}
                            onChange={() => handleToggleSelection(recording.id)}
                            disabled={chatMode === 'free'}
                            className={`w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5 ${
                              chatMode === 'free' ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={(e) => e.stopPropagation()}
                            title={chatMode === 'free' ? 'Desactiva el modo Chat Libre para seleccionar grabaciones' : 'Seleccionar grabación'}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <FileVideo className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="font-medium text-xs text-gray-900 dark:text-gray-100 truncate">
                                {recording.filename}
                              </span>
                              {recording.transcription && (
                                <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDurationFromMs(recording.duration)} • {formatDate(recording.createdAt)}
                            </div>
                            {recording.transcription && (
                              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                                ✓ Transcrita
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho: Chat */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {chatMode === 'free' ? 'Chat Libre con IA' : 'Chat sobre Transcripciones'}
                    </h3>
                    {/* Toggle de modo de chat */}
                    <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => setChatMode('transcriptions')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          chatMode === 'transcriptions'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                        title="Preguntas sobre transcripciones de videos"
                      >
                        Transcripciones
                      </button>
                      <button
                        onClick={() => setChatMode('free')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          chatMode === 'free'
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }`}
                        title="Preguntas libres sin transcripciones"
                      >
                        Chat Libre
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chatMode === 'transcriptions' && selectedRecordings.length > 0 && (
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        {selectedRecordings.length} grabación{selectedRecordings.length !== 1 ? 'es' : ''} seleccionada{selectedRecordings.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setChatMessages([]);
                        setQuery('');
                      }}
                      className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      Limpiar chat
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area - Estilo ChatGPT */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {chatMode === 'free' 
                      ? 'Haz una pregunta libre a la IA' 
                      : 'Haz una pregunta sobre las transcripciones'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                    {chatMode === 'free'
                      ? 'Puedes hacer cualquier pregunta a la IA sin necesidad de transcripciones de video.'
                      : 'Selecciona las grabaciones que quieres consultar y haz preguntas sobre su contenido transcrito.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {querying && (
                    <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - Estilo ChatGPT */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0 relative z-10">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (query.trim() && !querying) {
                            handleQuery();
                          }
                        }
                      }}
                      placeholder={chatMode === 'free' 
                        ? "Escribe tu pregunta libre a la IA..." 
                        : "Escribe tu pregunta sobre las transcripciones..."}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none max-h-32"
                      rows={1}
                      disabled={querying}
                      autoFocus={false}
                      readOnly={false}
                    />
                  </div>
                  <button
                    onClick={handleQuery}
                    disabled={querying || !query.trim()}
                    className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    {querying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {chatMode === 'transcriptions' && selectedRecordings.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Se consultarán todas las grabaciones transcritas. Selecciona grabaciones específicas para consultar solo esas.
                  </p>
                )}
                {chatMode === 'free' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Modo chat libre: puedes hacer cualquier pregunta sin necesidad de transcripciones.
                  </p>
                )}
              </div>
            </div>
          </div>
          </div>
        ) : (
          /* Content - Mostrar cuando el chat NO está abierto */
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
            </div>
          ) : recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileVideo className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                No hay grabaciones guardadas
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Las grabaciones aparecerán aquí después de que las guardes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedRecording?.id === recording.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : selectedRecordings.includes(recording.id)
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedRecordings.includes(recording.id)}
                          onChange={() => handleToggleSelection(recording.id)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          title="Seleccionar para consulta"
                        />
                        <FileVideo className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {recording.filename}
                        </h3>
                        {recording.transcription && (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" title="Transcrita" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDurationFromMs(recording.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{formatSize(recording.size)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{formatDate(recording.createdAt)}</span>
                        </div>
                      </div>
                      {recording.transcription && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleTranscription(recording.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            {showTranscriptions[recording.id] ? 'Ocultar' : 'Ver'} transcripción completa
                          </button>
                          {showTranscriptions[recording.id] && (
                            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-xs text-gray-700 dark:text-gray-300">Transcripción:</strong>
                                <button
                                  onClick={() => copyToClipboard(recording.transcription)}
                                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                  title="Copiar transcripción"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono bg-white dark:bg-gray-800 p-2 rounded">
                                {recording.transcription}
                              </div>
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                <strong>JSON:</strong>
                                <pre className="mt-1 p-2 bg-white dark:bg-gray-800 rounded text-xs overflow-x-auto">
                                  {JSON.stringify({ transcription: recording.transcription, createdAt: recording.createdAt, transcribedAt: recording.transcribedAt }, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          {!showTranscriptions[recording.id] && (
                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                              <strong>Transcripción:</strong> {recording.transcription.substring(0, 200)}
                              {recording.transcription.length > 200 && '...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!recording.transcription && (
                        <button
                          onClick={() => handleTranscribe(recording.id)}
                          disabled={transcribingId === recording.id}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors disabled:opacity-50"
                          title="Transcribir audio"
                        >
                          {transcribingId === recording.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handlePlay(recording)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title={playingId === recording.id ? 'Ocultar reproductor' : 'Reproducir'}
                      >
                        <Play className={`w-5 h-5 ${playingId === recording.id ? 'text-red-600 dark:text-red-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(recording.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Video Player */}
                  {selectedRecording?.id === recording.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {window.electronAPI ? (
                        <video
                          src={recording.path ? `file:///${recording.path.replace(/\\/g, '/')}` : ''}
                          controls
                          className="w-full rounded-lg bg-black"
                          style={{ maxHeight: '400px' }}
                          onError={(e) => {
                            console.error('[ScreenRecordingHistory] Error cargando video:', e);
                            console.error('[ScreenRecordingHistory] Path:', recording.path);
                            console.error('[ScreenRecordingHistory] Video src:', e.target?.src);
                          }}
                          onLoadedMetadata={() => {
                            console.log('[ScreenRecordingHistory] ✅ Video metadata cargada');
                          }}
                        >
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      ) : (
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            La reproducción de video solo está disponible en Electron.
                          </p>
                          <a
                            href={`file://${recording.path}`}
                            download={recording.filename}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Descargar video
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full Transcription */}
                  {recording.transcription && selectedRecording?.id === recording.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Transcripción completa:
                      </h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-60 overflow-y-auto">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {recording.transcription}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {recordings.length} grabación{recordings.length !== 1 ? 'es' : ''} guardada{recordings.length !== 1 ? 's' : ''}
            {recordings.filter(r => r.transcription).length > 0 && (
              <span className="ml-2 text-green-600 dark:text-green-400">
                • {recordings.filter(r => r.transcription).length} transcrita{recordings.filter(r => r.transcription).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      {/* Modal de selección de pantalla */}
      <ScreenSourceSelectorModal
        isOpen={showSourceSelector}
        onClose={() => {
          setShowSourceSelector(false);
          // Si el usuario cancela, usar la primera pantalla completa
          if (availableSources.length > 0) {
            const defaultSource = availableSources.find(s => {
              const name = s.name.toLowerCase();
              return name.includes('entire screen') || 
                     name.includes('pantalla completa') ||
                     name.includes('screen 1') ||
                     name.includes('pantalla 1') ||
                     (name.includes('screen') && !name.includes('window'));
            }) || availableSources[0];
            handleSourceSelected(defaultSource);
          }
        }}
        sources={availableSources}
        onSelect={handleSourceSelected}
      />
    </div>
  );
}
