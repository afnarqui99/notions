import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Monitor, Link2, Shield, Video, Mic, Square, Play, AlertCircle } from 'lucide-react';
import Modal from './Modal';

export default function RemoteAccessModal({ isOpen, onClose }) {
  const [sessionId, setSessionId] = useState(null);
  const [accessLink, setAccessLink] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isServerRunning, setIsServerRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [waitingForAuthorization, setWaitingForAuthorization] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isControlling, setIsControlling] = useState(false);

  // Generar sesión única al abrir el modal
  useEffect(() => {
    if (isOpen && !sessionId) {
      generateSession();
    }
  }, [isOpen]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const generateSession = async () => {
    try {
      // Generar ID único
      const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      
      setSessionId(id);
      setAccessCode(code);

      // Iniciar servidor de acceso remoto
      const response = await window.electronAPI?.startRemoteAccessServer(id, code);
      
      console.log('Respuesta del servidor:', response);
      
      if (response?.success) {
        // Usar URL pública si está disponible (HTTPS), sino usar local
        const link = response.publicUrl || response.localUrl || `http://localhost:${response.port}/acceso/${id}`;
        
        console.log('Link generado:', link);
        console.log('URL pública:', response.publicUrl);
        console.log('URL local:', response.localUrl);
        
        setAccessLink(link);
        setIsServerRunning(true);
        setError(null);
        
        // Mostrar mensaje si es URL pública
        if (response.isPublic && response.publicUrl) {
          console.log('✅ Link público HTTPS generado:', response.publicUrl);
        }
      } else {
        const errorMsg = response?.error || 'Error al iniciar el servidor';
        setError(errorMsg);
        console.error('Error iniciando servidor:', response);
      }
    } catch (err) {
      console.error('Error generando sesión:', err);
      setError('Error al generar sesión de acceso remoto');
    }
  };

  const cleanup = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    setIsConnected(false);
    setWaitingForAuthorization(false);
    setAuthorized(false);
    
    if (sessionId) {
      window.electronAPI?.stopRemoteAccessServer(sessionId);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(accessLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando:', err);
    }
  };

  const handleAuthorization = async (authorized) => {
    setAuthorized(authorized);
    setWaitingForAuthorization(false);
    
    if (authorized) {
      // Iniciar conexión WebRTC
      await startWebRTCConnection();
    } else {
      setError('Acceso denegado por el usuario remoto');
    }
  };

  const startWebRTCConnection = async () => {
    try {
      // Escuchar eventos de autorización desde el servidor
      window.electronAPI?.onRemoteAccessAuthorization((event, data) => {
        if (data.sessionId === sessionId) {
          handleAuthorization(data.authorized);
        }
      });

      // Escuchar cuando se conecta un cliente
      window.electronAPI?.onRemoteAccessClientConnected((event, data) => {
        if (data.sessionId === sessionId) {
          setWaitingForAuthorization(true);
        }
      });

      // Iniciar captura de pantalla local para mostrar en el modal
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: isAudioEnabled
      });
      
      setRemoteStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Configurar WebRTC con data channel para control remoto
      await setupWebRTCWithDataChannel();
    } catch (err) {
      console.error('Error iniciando WebRTC:', err);
      setError('Error al iniciar la conexión');
    }
  };

  const setupWebRTCWithDataChannel = async () => {
    try {
      const SimplePeer = (await import('simple-peer')).default;
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      // Crear peer como iniciador (host)
      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        config: configuration,
        stream: remoteStream
      });

      peer.on('signal', (data) => {
        // Enviar señal al remoto a través del servidor
        if (sessionId) {
          window.electronAPI?.sendWebRTCSignal?.(sessionId, data);
        }
      });

      peer.on('connect', () => {
        console.log('WebRTC conectado');
        setIsConnected(true);
      });

      peer.on('stream', (stream) => {
        // Stream del remoto (si es bidireccional)
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });

      peer.on('data', (data) => {
        // Datos recibidos del remoto
        try {
          const message = JSON.parse(data.toString());
          console.log('Comando recibido del remoto:', message);
        } catch (err) {
          console.error('Error parseando comando:', err);
        }
      });

      // Crear data channel para control remoto
      const dataChannel = peer._pc.createDataChannel('control', {
        ordered: true
      });

      dataChannel.onopen = () => {
        console.log('Data channel abierto');
        dataChannelRef.current = dataChannel;
      };

      dataChannel.onerror = (error) => {
        console.error('Error en data channel:', error);
      };

      dataChannel.onclose = () => {
        console.log('Data channel cerrado');
        dataChannelRef.current = null;
      };

      peerRef.current = peer;

      // Escuchar señales del remoto
      window.electronAPI?.onWebRTCSignal?.((event, data) => {
        if (data.sessionId === sessionId && peer) {
          peer.signal(data.signal);
        }
      });

    } catch (err) {
      console.error('Error configurando WebRTC:', err);
      setError('Error al configurar WebRTC');
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = () => {
    if (!remoteStream) return;
    
    const chunks = [];
    
    // Configurar opciones de grabación con mejor calidad
    const options = {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 2500000, // 2.5 Mbps para buena calidad
      audioBitsPerSecond: 128000    // 128 kbps para audio
    };
    
    // Verificar si el navegador soporta el codec
    let recorder;
    if (MediaRecorder.isTypeSupported(options.mimeType)) {
      recorder = new MediaRecorder(remoteStream, options);
    } else {
      // Fallback a opciones por defecto
      recorder = new MediaRecorder(remoteStream);
    }
    
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    recorder.onerror = (error) => {
      console.error('Error en grabación:', error);
      setError('Error durante la grabación');
      setIsRecording(false);
    };
    
    recorder.onstop = () => {
      if (chunks.length === 0) {
        setError('No se grabó ningún contenido');
        return;
      }
      
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Nombre de archivo con fecha y hora
      const date = new Date();
      const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
      a.download = `grabacion-${sessionId}-${dateStr}.webm`;
      
      // Descargar archivo
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Limpiar URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      // Mostrar notificación
      setError(null);
    };
    
    // Iniciar grabación con intervalos de datos cada segundo
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    recordedChunksRef.current = chunks;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // Aquí se actualizaría el stream con audio
  };

  // Enviar comando al remoto
  const sendCommand = (command) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(command));
    } else if (sessionId) {
      // Fallback: enviar a través del servidor
      window.electronAPI?.sendRemoteCommand?.(sessionId, command);
    }
  };

  // Calcular coordenadas relativas al video
  const getRelativeCoordinates = (event) => {
    if (!videoRef.current || !videoContainerRef.current) return null;
    
    const rect = videoRef.current.getBoundingClientRect();
    const containerRect = videoContainerRef.current.getBoundingClientRect();
    
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    return { x, y, absoluteX: event.clientX - rect.left, absoluteY: event.clientY - rect.top };
  };

  // Manejar eventos de mouse
  const handleMouseDown = (event) => {
    event.preventDefault();
    const coords = getRelativeCoordinates(event);
    if (!coords) return;
    
    sendCommand({
      type: 'mouse',
      action: 'down',
      button: event.button, // 0: left, 1: middle, 2: right
      x: coords.x,
      y: coords.y,
      absoluteX: coords.absoluteX,
      absoluteY: coords.absoluteY
    });
  };

  const handleMouseUp = (event) => {
    event.preventDefault();
    const coords = getRelativeCoordinates(event);
    if (!coords) return;
    
    sendCommand({
      type: 'mouse',
      action: 'up',
      button: event.button,
      x: coords.x,
      y: coords.y,
      absoluteX: coords.absoluteX,
      absoluteY: coords.absoluteY
    });
  };

  const handleMouseMove = (event) => {
    if (!isControlling) return;
    event.preventDefault();
    const coords = getRelativeCoordinates(event);
    if (!coords) return;
    
    sendCommand({
      type: 'mouse',
      action: 'move',
      x: coords.x,
      y: coords.y,
      absoluteX: coords.absoluteX,
      absoluteY: coords.absoluteY
    });
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const coords = getRelativeCoordinates(event);
    if (!coords) return;
    
    sendCommand({
      type: 'mouse',
      action: 'wheel',
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
      x: coords.x,
      y: coords.y
    });
  };

  // Manejar eventos de teclado
  useEffect(() => {
    if (!isControlling || !isConnected) return;

    const handleKeyDown = (event) => {
      // Evitar capturar teclas del sistema
      if (event.ctrlKey && event.key === 'c') return;
      if (event.ctrlKey && event.key === 'v') return;
      if (event.key === 'F12') return;
      
      sendCommand({
        type: 'keyboard',
        action: 'down',
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      });
    };

    const handleKeyUp = (event) => {
      sendCommand({
        type: 'keyboard',
        action: 'up',
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isControlling, isConnected]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acceso Remoto"
      size="2xl"
      type="info"
    >
      <div className="space-y-6">
        {/* Estado del servidor */}
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isServerRunning ? 'Servidor activo' : 'Iniciando servidor...'}
            </p>
            {isConnected && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Cliente conectado y autorizado
              </p>
            )}
            {waitingForAuthorization && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Esperando autorización del usuario remoto...
              </p>
            )}
          </div>
        </div>

        {/* Link de acceso */}
        {accessLink && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Link de acceso remoto
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accessLink}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {accessLink.startsWith('https://') 
                ? '✅ Link público HTTPS - Comparte este link completo con la persona que quieres controlar.'
                : '⚠️ Link local - Solo funciona en la misma red. Comparte este link con la persona que quieres que se conecte.'}
            </p>
            {accessLink.startsWith('https://') && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 font-semibold mb-2">
                  📋 Instrucciones para el usuario remoto:
                </p>
                <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Abre el link completo en tu navegador</li>
                  <li><strong>Si aparece una página pidiendo "Tunnel Password":</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Ingresa cualquier valor (ej: "1234", "pass", "tunnel")</li>
                      <li>Haz clic en "Click to Submit"</li>
                      <li>Si aparece error de "IPv4 o IPv6", ignóralo e ingresa cualquier texto</li>
                    </ul>
                  </li>
                  <li>Se abrirá la página de acceso remoto de la aplicación</li>
                  <li><strong>Ingresa el código de 4 dígitos</strong> que aparece arriba (NO es la contraseña del tunnel)</li>
                  <li>Haz clic en "Autorizar Acceso"</li>
                  <li>Permite compartir pantalla cuando el navegador lo pida</li>
                </ol>
                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold">
                    ⚠️ Importante: 
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1 list-disc list-inside">
                    <li>El "Tunnel Password" NO es el código de acceso</li>
                    <li>Para el "Tunnel Password", ingresa cualquier texto (ej: "1234")</li>
                    <li>Si aparece error "IPv4 o IPv6", ignóralo completamente</li>
                    <li>El código de acceso real es el de 4 dígitos que aparece arriba en esta ventana</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Código de acceso */}
        {accessCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Código de acceso
            </label>
            <div className="flex items-center gap-3">
              <div className="px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                  {accessCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                El usuario remoto necesitará este código para autorizar el acceso
              </p>
            </div>
          </div>
        )}

        {/* Vista remota */}
        {isConnected && remoteStream && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vista remota
              </label>
              <button
                onClick={() => setIsControlling(!isControlling)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  isControlling
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                }`}
              >
                {isControlling ? '🖱️ Control Activo' : '🖱️ Activar Control'}
              </button>
            </div>
            <div 
              ref={videoContainerRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ cursor: isControlling ? 'crosshair' : 'default' }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-96"
                muted
                onMouseDown={isControlling ? handleMouseDown : undefined}
                onMouseUp={isControlling ? handleMouseUp : undefined}
                onMouseMove={isControlling ? handleMouseMove : undefined}
                onWheel={isControlling ? handleWheel : undefined}
                onContextMenu={(e) => isControlling && e.preventDefault()}
              />
              {/* Controles */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button
                  onClick={toggleRecording}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-800/80 hover:bg-gray-700/80 text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      Detener grabación
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Grabar sesión
                    </>
                  )}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isAudioEnabled
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-800/80 hover:bg-gray-700/80 text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  {isAudioEnabled ? 'Audio ON' : 'Audio OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Error</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <strong>Instrucciones:</strong>
            <br />
            1. Comparte el link con la persona que quieres controlar
            <br />
            2. Cuando abran el link, se les pedirá autorización
            <br />
            3. Deben ingresar el código de acceso para autorizar
            <br />
            4. Una vez autorizado, podrás ver y controlar su computador
            <br />
            5. Puedes grabar la sesión y habilitar audio si lo deseas
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={cleanup}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Detener servidor
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}

