/**
 * Servicio para gestionar la grabación de pantalla con audio
 * Permite grabar, guardar videos y mantener un historial
 */

class ScreenRecordingService {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.stream = null;
    this.startTime = null;
    this.recordingPath = null;
    this.canvas = null;
    this.canvasContext = null;
    this.videoElement = null;
    this.animationFrameId = null;
    this.systemAudioRecordingId = null;
  }

  /**
   * Obtener la ruta de guardado de videos desde configuración
   */
  getRecordingPath() {
    const config = JSON.parse(localStorage.getItem('notion-local-config') || '{}');
    return config.screenRecordingPath || null;
  }

  /**
   * Establecer la ruta de guardado de videos
   */
  setRecordingPath(path) {
    const config = JSON.parse(localStorage.getItem('notion-local-config') || '{}');
    config.screenRecordingPath = path;
    localStorage.setItem('notion-local-config', JSON.stringify(config));
  }

  /**
   * Iniciar grabación de pantalla con audio
   * @param {Object} selectedSource - Fuente de pantalla seleccionada (opcional)
   */
  async startRecording(selectedSource = null) {
    if (this.isRecording) {
      console.warn('[ScreenRecording] Ya hay una grabación en curso, ignorando solicitud');
      return { success: false, message: 'Ya hay una grabación en curso' };
    }
    
    // Limpiar cualquier estado anterior antes de iniciar
    this.cleanup();

    try {
      let displayStream;
      
      // PRIORIDAD: Siempre usar getDisplayMedia si está disponible (permite cambiar entre ventanas)
      // getDisplayMedia es mejor porque permite al usuario seleccionar pantalla completa
      // y cuando selecciona pantalla completa, puede cambiar entre ventanas dinámicamente
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        console.log('[ScreenRecording] Usando getDisplayMedia (recomendado - permite cambiar entre ventanas)...');
        try {
          // Usar 'monitor' para pantalla completa - captura toda la pantalla seleccionada
          // IMPORTANTE: Con audio: true capturamos el audio del sistema (incluye audio de otras aplicaciones)
          // 'monitor' es mejor para capturar toda la pantalla y poder cambiar entre ventanas
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: 'monitor', // 'monitor' para pantalla completa (mejor que 'any' para capturar todo)
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              cursor: 'always' // Mostrar cursor en la grabación
            },
            audio: {
              echoCancellation: false, // Desactivar cancelación de eco para capturar todo el audio
              noiseSuppression: false, // Desactivar supresión de ruido
              autoGainControl: false, // Desactivar control automático de ganancia
              suppressLocalAudioPlayback: false // No suprimir audio local
            }
          });
          console.log('[ScreenRecording] ✅ getDisplayMedia funcionó - puedes cambiar entre ventanas durante la grabación');
        } catch (getDisplayMediaError) {
          console.warn('[ScreenRecording] getDisplayMedia falló, intentando desktopCapturer como alternativa:', getDisplayMediaError);
          // Continuar con desktopCapturer solo si getDisplayMedia falla
        }
      }
      
      // Si getDisplayMedia no está disponible o falló, usar desktopCapturer (fallback)
      if (!displayStream && window.electronAPI && window.electronAPI.getScreenSources) {
        // Si getDisplayMedia no funciona, usar desktopCapturer
        console.log('[ScreenRecording] Usando desktopCapturer como alternativa (limitado a una pantalla fija)...');
        try {
            // Obtener fuentes de pantalla disponibles usando desktopCapturer
            const sources = await window.electronAPI.getScreenSources();
            if (sources.length === 0) {
              throw new Error('No se encontraron fuentes de pantalla disponibles');
            }
            
            // Si hay múltiples fuentes y no se pasó una fuente seleccionada, 
            // preferir pantalla completa para capturar cualquier ventana
            let screenSource;
            if (selectedSource) {
              // Usar la fuente pasada como parámetro
              screenSource = selectedSource;
            } else if (sources.length > 1) {
              // Buscar pantalla completa primero (permite capturar cualquier ventana)
              screenSource = sources.find(s => {
                const name = s.name.toLowerCase();
                return name.includes('entire screen') || 
                       name.includes('pantalla completa') ||
                       name.includes('screen 1') ||
                       name.includes('pantalla 1') ||
                       (name.includes('screen') && !name.includes('window'));
              }) || sources[0]; // Si no hay pantalla completa, usar la primera disponible
            } else {
              // Solo hay una fuente, usarla directamente
              screenSource = sources[0];
            }
            
            console.log('[ScreenRecording] Fuente de pantalla seleccionada:', screenSource.name, screenSource.id);
            
            // Crear stream usando getUserMedia con constraints especiales de Electron
            // Intentar múltiples formatos de constraints
            const constraintFormats = [
              // Formato 1: con mandatory (versiones antiguas)
              {
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: screenSource.id
                  }
                }
              },
              // Formato 2: sin mandatory (versiones nuevas)
              {
                audio: false,
                video: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: screenSource.id
                }
              },
              // Formato 3: con constraints más explícitas
              {
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: screenSource.id,
                    minWidth: 640,
                    maxWidth: 1920,
                    minHeight: 480,
                    maxHeight: 1080
                  }
                }
              }
            ];
            
            let streamObtained = false;
            for (const constraints of constraintFormats) {
              try {
                console.log('[ScreenRecording] Intentando constraints:', JSON.stringify(constraints));
                displayStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('[ScreenRecording] ✅ Stream obtenido con constraints:', constraints);
                streamObtained = true;
                break;
              } catch (constraintError) {
                console.warn('[ScreenRecording] Constraints fallaron:', constraintError.message);
                continue;
              }
            }
            
            if (!streamObtained) {
              throw new Error('No se pudo obtener el stream con ningún formato de constraints');
            }
        } catch (electronError) {
          console.error('[ScreenRecording] Error en Electron capturando pantalla:', electronError);
          throw new Error(`Error al acceder a la pantalla: ${electronError.message || 'No se pudo acceder a la pantalla. Asegúrate de permitir el acceso.'}`);
        }
      }
      
      // Si getDisplayMedia no está disponible y no hay electronAPI, usar getDisplayMedia estándar del navegador
      if (!displayStream) {
        // En navegador, usar getDisplayMedia estándar
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error('La API de captura de pantalla no está disponible en este navegador');
        }
        
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor', // 'monitor' para pantalla completa
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            cursor: 'always'
          },
          audio: {
            echoCancellation: false, // Capturar todo el audio del sistema
            noiseSuppression: false,
            autoGainControl: false,
            suppressLocalAudioPlayback: false,
            sampleRate: 44100
          }
        });
      }

      // PROBLEMA CONOCIDO: MediaRecorder en Electron no recibe datos de streams de desktopCapturer
      // SOLUCIÓN: Agregar un track de audio silencioso para que MediaRecorder funcione
      console.log('[ScreenRecording] Stream de display:', {
        videoTracks: displayStream.getVideoTracks().length,
        audioTracks: displayStream.getAudioTracks().length
      });
      
      let finalStream = displayStream;
      
      // Intentar agregar un track de audio silencioso usando AudioContext
      // Esto puede ayudar a que MediaRecorder funcione con streams de desktopCapturer
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Configurar oscilador silencioso
        oscillator.frequency.value = 0; // Frecuencia 0 = silencio
        gainNode.gain.value = 0; // Ganancia 0 = silencio
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Crear un stream de audio silencioso
        const destination = audioContext.createMediaStreamDestination();
        gainNode.connect(destination);
        
        // Agregar el track de audio silencioso al stream
        destination.stream.getAudioTracks().forEach(track => {
          track.enabled = false; // Deshabilitar el track
          finalStream.addTrack(track);
        });
        
        // Iniciar el oscilador (aunque esté en silencio)
        oscillator.start();
        
        console.log('[ScreenRecording] ✅ Track de audio silencioso agregado para compatibilidad con MediaRecorder');
        
        // Guardar referencia para limpiar después
        this.audioContext = audioContext;
        this.oscillator = oscillator;
      } catch (audioError) {
        console.warn('[ScreenRecording] No se pudo agregar audio silencioso:', audioError);
        // Continuar sin audio
      }

      // Verificar que el stream tenga al menos un track de video
      const finalVideoTracks = finalStream.getVideoTracks();
      if (finalVideoTracks.length === 0) {
        throw new Error('El stream final no tiene tracks de video');
      }
      
      // Crear un elemento de video oculto para verificar que el stream funcione
      const testVideo = document.createElement('video');
      testVideo.srcObject = finalStream;
      testVideo.muted = true;
      testVideo.style.position = 'fixed';
      testVideo.style.top = '-9999px';
      testVideo.style.width = '1px';
      testVideo.style.height = '1px';
      document.body.appendChild(testVideo);
      
      // Intentar reproducir el video para verificar que el stream funcione
      try {
        await testVideo.play();
        console.log('[ScreenRecording] ✅ Stream verificado - el video se puede reproducir');
      } catch (playError) {
        console.warn('[ScreenRecording] ⚠️ No se pudo reproducir el video de prueba:', playError);
      }
      
      // Verificar que el video tenga datos (que el stream esté funcionando)
      await new Promise((resolve) => {
        testVideo.onloadedmetadata = () => {
          console.log('[ScreenRecording] ✅ Video metadata cargada:', {
            videoWidth: testVideo.videoWidth,
            videoHeight: testVideo.videoHeight,
            readyState: testVideo.readyState
          });
          resolve();
        };
        
        // Timeout de seguridad
        setTimeout(() => {
          if (testVideo.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('[ScreenRecording] Video tiene datos (readyState >= 2)');
            resolve();
          } else {
            console.warn('[ScreenRecording] ⚠️ Video no tiene datos después de esperar');
            resolve(); // Continuar de todos modos
          }
        }, 2000);
      });
      
      // Limpiar el video de prueba
      if (testVideo.parentNode) {
        testVideo.srcObject = null;
        document.body.removeChild(testVideo);
      }

      this.stream = finalStream;
      this.recordedChunks = [];
      
      // Verificar que el stream tenga tracks activos
      const videoTracks = finalStream.getVideoTracks();
      const audioTracks = finalStream.getAudioTracks();
      
      console.log('[ScreenRecording] Stream obtenido:', {
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        streamActive: finalStream.active,
        videoTrackReady: videoTracks[0]?.readyState,
        audioTrackReady: audioTracks[0]?.readyState
      });
      
      if (videoTracks.length === 0) {
        throw new Error('No hay tracks de video en el stream');
      }
      
      // Esperar a que los tracks estén en estado "live"
      console.log('[ScreenRecording] Esperando a que los tracks estén activos...');
      let waitCount = 0;
      const maxWait = 30; // 3 segundos máximo
      while (waitCount < maxWait) {
        const allTracksLive = videoTracks.every(track => track.readyState === 'live');
        if (allTracksLive && finalStream.active) {
          console.log('[ScreenRecording] ✅ Todos los tracks están activos');
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      if (videoTracks[0].readyState !== 'live') {
        console.warn('[ScreenRecording] ⚠️ El track de video no está en estado "live" después de esperar:', videoTracks[0].readyState);
      }
      
      // Esperar un momento adicional para asegurar que el stream esté completamente listo
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.startTime = Date.now();

      // Configurar MediaRecorder - probar diferentes mimeTypes
      // En Electron con desktopCapturer, algunos codecs pueden no funcionar
      // IMPORTANTE: Probar primero sin codec de audio, ya que puede causar problemas
      const mimeTypesToTry = [
        'video/webm;codecs=vp8', // Sin audio primero
        'video/webm;codecs=vp9', // Sin audio
        'video/webm', // Sin codec específico
        'video/webm;codecs=vp8,opus', // Con audio
        'video/webm;codecs=vp9,opus', // Con audio
      ];
      
      let selectedMimeType = null;
      for (const mimeType of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('[ScreenRecording] ✅ MimeType soportado:', mimeType);
          break;
        } else {
          console.log('[ScreenRecording] ❌ MimeType NO soportado:', mimeType);
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No hay codecs de video soportados');
      }
      
      const options = {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      };
      
      console.log('[ScreenRecording] MimeType seleccionado:', options.mimeType);

      // SOLUCIÓN ALTERNATIVA: Usar Canvas para capturar frames del video stream
      // Esto evita el problema conocido de MediaRecorder con desktopCapturer en Electron
      console.log('[ScreenRecording] Usando método alternativo: Canvas + MediaRecorder');
      
      // Crear un elemento de video oculto para reproducir el stream
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = finalStream;
      this.videoElement.muted = true;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.style.position = 'fixed';
      this.videoElement.style.top = '-9999px';
      this.videoElement.style.width = '1px';
      this.videoElement.style.height = '1px';
      document.body.appendChild(this.videoElement);
      
      // Esperar a que el video esté listo y reproduciéndose
      await new Promise((resolve) => {
        const checkReady = () => {
          if (!this.videoElement) {
            console.warn('[ScreenRecording] Video element no disponible en checkReady');
            resolve(); // Resolver de todos modos para no bloquear
            return;
          }
          
          if (this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0) {
            console.log('[ScreenRecording] Video metadata cargada para Canvas:', {
              videoWidth: this.videoElement.videoWidth,
              videoHeight: this.videoElement.videoHeight,
              readyState: this.videoElement.readyState
            });
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        
        this.videoElement.onloadedmetadata = () => {
          console.log('[ScreenRecording] Video metadata cargada para Canvas');
          // Asegurar que el video se esté reproduciendo
          this.videoElement.play().then(() => {
            console.log('[ScreenRecording] ✅ Video element reproduciéndose');
            checkReady();
          }).catch(error => {
            console.error('[ScreenRecording] Error reproduciendo video:', error);
            checkReady();
          });
        };
        
        // Iniciar reproducción inmediatamente
        this.videoElement.play().catch(error => {
          console.warn('[ScreenRecording] No se pudo reproducir inmediatamente:', error);
        });
        
        // Timeout de seguridad
        setTimeout(() => {
          checkReady();
          resolve();
        }, 1000);
      });
      
      // Crear un canvas para capturar frames
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth || 1920;
      this.canvas.height = this.videoElement.videoHeight || 1080;
      this.canvasContext = this.canvas.getContext('2d');
      
      // Crear un nuevo stream desde el canvas
      const canvasStream = this.canvas.captureStream(30); // 30 FPS
      
      // Verificar si el stream tiene audio del sistema
      const systemAudioTracks = finalStream.getAudioTracks();
      console.log('[ScreenRecording] Audio del sistema detectado en stream:', systemAudioTracks.length, 'tracks');
      
      if (systemAudioTracks.length > 0) {
        // Si hay audio del sistema, agregarlo al canvas stream
        systemAudioTracks.forEach(track => {
          console.log('[ScreenRecording] ✅ Track de audio del sistema agregado:', {
            label: track.label,
            kind: track.kind,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
          canvasStream.addTrack(track);
        });
      } else {
        console.warn('[ScreenRecording] ⚠️ No se detectó audio del sistema en el stream');
        console.warn('[ScreenRecording] Esto es normal si seleccionaste "Pantalla completa" o "Ventana" en lugar de "Pestaña del navegador"');
        console.warn('[ScreenRecording] El audio del sistema solo está disponible cuando se selecciona una pestaña del navegador');
      }
      
      // Siempre agregar audio del micrófono (para que el usuario pueda hablar)
      try {
        console.log('[ScreenRecording] Solicitando acceso al micrófono...');
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        // Agregar tracks de audio del micrófono al stream del canvas
        audioStream.getAudioTracks().forEach(track => {
          console.log('[ScreenRecording] ✅ Track de audio del micrófono agregado:', {
            label: track.label,
            enabled: track.enabled,
            muted: track.muted
          });
          canvasStream.addTrack(track);
        });
        
        // Guardar referencia para limpiar después
        this.audioStream = audioStream;
      } catch (audioError) {
        console.warn('[ScreenRecording] ⚠️ No se pudo obtener audio del micrófono:', audioError);
        console.warn('[ScreenRecording] Continuando sin audio del micrófono...');
        // Continuar sin micrófono
      }
      
      // NO crear MediaRecorder aquí - se creará más adelante cuando el canvas esté listo
      // Solo guardar las opciones y el stream para usarlos después
      this.canvasStream = canvasStream;
      this.mediaRecorderOptions = options;
      
      // Variables para el cursor y clics
      this.mousePosition = { x: 0, y: 0 };
      this.clickEffects = []; // Array de efectos de clic: {x, y, timestamp, radius}
      this.lastMouseUpdate = Date.now();
      this.canvasOffset = { x: 0, y: 0 }; // Offset del canvas respecto a la pantalla
      
      // Calcular offset del canvas (necesario para coordenadas de pantalla completa)
      const updateCanvasOffset = () => {
        if (this.canvas) {
          const rect = this.canvas.getBoundingClientRect();
          this.canvasOffset = { x: rect.left, y: rect.top };
        }
      };
      
      // Listeners para el cursor y clics
      const handleMouseMove = (e) => {
        // Usar screenX/screenY para coordenadas absolutas de la pantalla
        // Pero necesitamos ajustar según el tamaño del canvas
        const canvasWidth = this.canvas?.width || window.screen.width;
        const canvasHeight = this.canvas?.height || window.screen.height;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        // Convertir coordenadas de pantalla a coordenadas del canvas
        const scaleX = canvasWidth / screenWidth;
        const scaleY = canvasHeight / screenHeight;
        
        // Usar screenX/screenY si están disponibles (coordenadas absolutas)
        // Si no, usar clientX/clientY y ajustar con window.screenX/screenY
        const screenX = e.screenX !== undefined ? e.screenX : (e.clientX + (window.screenX || 0));
        const screenY = e.screenY !== undefined ? e.screenY : (e.clientY + (window.screenY || 0));
        
        this.mousePosition = {
          x: screenX * scaleX,
          y: screenY * scaleY
        };
        this.lastMouseUpdate = Date.now();
      };
      
      const handleMouseClick = (e) => {
        const canvasWidth = this.canvas?.width || window.screen.width;
        const canvasHeight = this.canvas?.height || window.screen.height;
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        
        const scaleX = canvasWidth / screenWidth;
        const scaleY = canvasHeight / screenHeight;
        
        // Usar screenX/screenY si están disponibles (coordenadas absolutas)
        const screenX = e.screenX !== undefined ? e.screenX : (e.clientX + (window.screenX || 0));
        const screenY = e.screenY !== undefined ? e.screenY : (e.clientY + (window.screenY || 0));
        
        // Agregar efecto de clic
        this.clickEffects.push({
          x: screenX * scaleX,
          y: screenY * scaleY,
          timestamp: Date.now(),
          radius: 0
        });
        
        // Limpiar efectos antiguos (más de 500ms)
        this.clickEffects = this.clickEffects.filter(
          effect => Date.now() - effect.timestamp < 500
        );
      };
      
      // Agregar listeners globales para eventos dentro de la ventana
      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('click', handleMouseClick, true);
      window.addEventListener('mousedown', handleMouseClick, true);
      
      // Guardar referencias para limpiar después
      this.mouseMoveHandler = handleMouseMove;
      this.mouseClickHandler = handleMouseClick;
      
      // Polling para obtener posición global del cursor (funciona fuera de la ventana)
      const updateGlobalCursorPosition = async () => {
        if (!this.isRecording) return;
        
        try {
          // Obtener posición global del cursor desde Electron
          if (window.electronAPI && window.electronAPI.getGlobalCursorPosition) {
            const globalPos = await window.electronAPI.getGlobalCursorPosition();
            if (globalPos && this.canvas) {
              const canvasWidth = this.canvas.width || window.screen.width;
              const canvasHeight = this.canvas.height || window.screen.height;
              const screenWidth = window.screen.width;
              const screenHeight = window.screen.height;
              
              const scaleX = canvasWidth / screenWidth;
              const scaleY = canvasHeight / screenHeight;
              
              this.mousePosition = {
                x: globalPos.x * scaleX,
                y: globalPos.y * scaleY
              };
              this.lastMouseUpdate = Date.now();
            }
          }
        } catch (error) {
          // Silenciar errores de polling
        }
      };
      
      // Actualizar posición global cada 50ms (20 veces por segundo)
      this.globalCursorInterval = setInterval(updateGlobalCursorPosition, 50);
      
      // Función para dibujar cursor y efectos de clic en el canvas
      const drawCursorAndClicks = () => {
        if (!this.canvasContext || !this.isRecording) return;
        
        const ctx = this.canvasContext;
        const now = Date.now();
        
        // Dibujar efectos de clic (círculos que se expanden)
        this.clickEffects.forEach((effect, index) => {
          const elapsed = now - effect.timestamp;
          const maxRadius = 30;
          const duration = 500; // 500ms
          const progress = Math.min(elapsed / duration, 1);
          const radius = progress * maxRadius;
          const alpha = 1 - progress;
          
          // Círculo exterior (más grande, más transparente)
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.6})`; // Azul
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Círculo interior (más pequeño, más opaco)
          if (radius > 5) {
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.8})`;
            ctx.fill();
          }
          
          // Punto central
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.fill();
        });
        
        // Limpiar efectos antiguos
        this.clickEffects = this.clickEffects.filter(
          effect => now - effect.timestamp < 500
        );
        
        // Dibujar cursor (solo si se ha movido recientemente, dentro de los últimos 200ms)
        if (now - this.lastMouseUpdate < 200 && this.mousePosition.x > 0 && this.mousePosition.y > 0) {
          // Círculo exterior del cursor
          ctx.beginPath();
          ctx.arc(this.mousePosition.x, this.mousePosition.y, 15, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Azul
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Círculo interior del cursor
          ctx.beginPath();
          ctx.arc(this.mousePosition.x, this.mousePosition.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
          ctx.fill();
          
          // Punto central del cursor
          ctx.beginPath();
          ctx.arc(this.mousePosition.x, this.mousePosition.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 1)';
          ctx.fill();
        }
      };
      
      // Función para capturar frames del video al canvas
      // IMPORTANTE: frameCount debe ser una propiedad de la clase para poder accederla desde fuera
      this.frameCount = 0;
      const captureFrame = () => {
        // Verificar condiciones antes de capturar
        if (!this.videoElement || !this.canvasContext) {
          console.warn('[ScreenRecording] ⚠️ Video element o canvas context no disponible');
          if (this.isRecording) {
            this.animationFrameId = requestAnimationFrame(captureFrame);
          }
          return;
        }
        
        // Verificar isRecording después de verificar elementos
        if (this.isRecording) {
          try {
            // Verificar que el video tenga dimensiones válidas
            if (this.videoElement.videoWidth > 0 && this.videoElement.videoHeight > 0) {
              // Actualizar dimensiones del canvas si es necesario
              if (this.canvas.width !== this.videoElement.videoWidth || 
                  this.canvas.height !== this.videoElement.videoHeight) {
                this.canvas.width = this.videoElement.videoWidth;
                this.canvas.height = this.videoElement.videoHeight;
                console.log('[ScreenRecording] Canvas redimensionado:', {
                  width: this.canvas.width,
                  height: this.canvas.height
                });
              }
              
              // Capturar frame
              try {
                // Dibujar el video primero
                this.canvasContext.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
                
                // Dibujar cursor y efectos de clic encima
                drawCursorAndClicks();
                
                this.frameCount++;
                
                // Verificar que el canvas tenga contenido (no esté vacío) en el primer frame
                if (this.frameCount === 1) {
                  const imageData = this.canvasContext.getImageData(0, 0, Math.min(10, this.canvas.width), Math.min(10, this.canvas.height));
                  const hasData = imageData.data.some(pixel => pixel !== 0);
                  console.log('[ScreenRecording] Primer frame capturado, canvas tiene datos:', hasData, {
                    canvasWidth: this.canvas.width,
                    canvasHeight: this.canvas.height,
                    videoWidth: this.videoElement.videoWidth,
                    videoHeight: this.videoElement.videoHeight
                  });
                }
                
                // Log cada 30 frames (aproximadamente cada segundo a 30 FPS)
                if (this.frameCount % 30 === 0) {
                  console.log('[ScreenRecording] ✅ Frame capturado #' + this.frameCount, {
                    videoWidth: this.videoElement.videoWidth,
                    videoHeight: this.videoElement.videoHeight,
                    canvasWidth: this.canvas.width,
                    canvasHeight: this.canvas.height,
                    videoReadyState: this.videoElement.readyState,
                    videoPaused: this.videoElement.paused,
                    videoEnded: this.videoElement.ended
                  });
                }
              } catch (drawError) {
                console.error('[ScreenRecording] Error dibujando frame:', drawError);
              }
            } else {
              console.warn('[ScreenRecording] ⚠️ Video no tiene dimensiones válidas:', {
                videoWidth: this.videoElement.videoWidth,
                videoHeight: this.videoElement.videoHeight
              });
            }
          } catch (error) {
            console.error('[ScreenRecording] Error capturando frame:', error);
          }
        }
        if (this.isRecording) {
          this.animationFrameId = requestAnimationFrame(captureFrame);
        }
      };
      
      // Esperar un momento antes de iniciar la captura para asegurar que el video esté listo
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // IMPORTANTE: Establecer isRecording ANTES de iniciar captureFrame
      this.isRecording = true;
      
      // Iniciar captura de frames
      console.log('[ScreenRecording] Iniciando captura de frames en Canvas...', {
        isRecording: this.isRecording,
        videoElement: !!this.videoElement,
        canvasContext: !!this.canvasContext
      });
      captureFrame();
      
      // Método para configurar handlers del MediaRecorder
      this.setupMediaRecorderHandlers = () => {
        if (!this.mediaRecorder) {
          console.error('[ScreenRecording] No se puede configurar handlers: MediaRecorder no existe');
          return;
        }
        
        let ondataavailableCallCount = 0;
        
        this.mediaRecorder.ondataavailable = (event) => {
        ondataavailableCallCount++;
        const hasData = !!event.data;
        const dataSize = event.data?.size || 0;
        
        console.log(`[ScreenRecording] 🔔 ondataavailable #${ondataavailableCallCount} [Canvas]:`, {
          hasData,
          dataSize,
          state: this.mediaRecorder.state,
          chunksCount: this.recordedChunks.length
        });
        
        if (event.data && event.data.size > 0) {
          console.log('[ScreenRecording] ✅✅✅ DATOS RECIBIDOS DEL CANVAS:', dataSize, 'bytes');
          this.recordedChunks.push(event.data);
          const totalSize = this.recordedChunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0);
          console.log('[ScreenRecording] Total chunks:', this.recordedChunks.length, 'Total size:', totalSize, 'bytes');
        } else {
          console.warn('[ScreenRecording] ⚠️ Datos vacíos del Canvas');
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        console.log('[ScreenRecording] onstop llamado [Canvas], chunks acumulados:', this.recordedChunks.length);
        // Detener captura de frames
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
        // Limpiar video element
        if (this.videoElement && this.videoElement.parentNode) {
          this.videoElement.srcObject = null;
          document.body.removeChild(this.videoElement);
          this.videoElement = null;
        }
        try {
          await this.handleRecordingStop();
        } catch (error) {
          console.error('[ScreenRecording] Error en handleRecordingStop:', error);
        }
      };
      
        this.mediaRecorder.onerror = (event) => {
          console.error('[ScreenRecording] ❌ Error en MediaRecorder [Canvas]:', event.error);
          this.stopRecording();
        };
      };
      
      // Manejar cuando el usuario detiene el compartir de pantalla
      // También detectar cuando cambia la fuente (el usuario cambia de ventana)
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          console.log('[ScreenRecording] Video track terminó - usuario detuvo el compartir');
          if (this.isRecording) {
            this.stopRecording();
          }
        });
        
        // Detectar cuando el usuario cambia de ventana/pantalla durante la grabación
        // Esto es útil cuando se usa getDisplayMedia con displaySurface: 'any'
        videoTrack.addEventListener('mute', () => {
          console.log('[ScreenRecording] Video track muteado - posible cambio de ventana');
        });
        
        videoTrack.addEventListener('unmute', () => {
          console.log('[ScreenRecording] Video track desmuteado - ventana restaurada');
        });
      }
      
      // Verificar que el stream del canvas esté activo antes de iniciar
      console.log('[ScreenRecording] Verificando stream del Canvas:', {
        active: canvasStream.active,
        videoTracks: canvasStream.getVideoTracks().length,
        audioTracks: canvasStream.getAudioTracks().length,
        videoTrackStates: canvasStream.getVideoTracks().map(t => ({
          readyState: t.readyState,
          enabled: t.enabled,
          muted: t.muted
        }))
      });
      
      // Crear MediaRecorder con el stream del canvas
      // IMPORTANTE: Crear solo una vez, después de que el canvas esté listo
      console.log('[ScreenRecording] Iniciando MediaRecorder con stream de Canvas...');
      
      // Verificar que el MediaRecorder no esté ya grabando
      if (this.mediaRecorder) {
        if (this.mediaRecorder.state === 'recording') {
          console.warn('[ScreenRecording] ⚠️ MediaRecorder ya está grabando, deteniendo primero...');
          try {
            this.mediaRecorder.stop();
            // Esperar a que se detenga
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (e) {
            console.warn('[ScreenRecording] Error al detener MediaRecorder anterior:', e);
          }
        }
      }
      
      // Crear nuevo MediaRecorder solo si no existe o está inactivo
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.mediaRecorder = new MediaRecorder(this.canvasStream, this.mediaRecorderOptions);
        console.log('[ScreenRecording] MediaRecorder creado:', {
          state: this.mediaRecorder.state,
          mimeType: this.mediaRecorderOptions.mimeType
        });
        
        // Configurar handlers inmediatamente después de crear el MediaRecorder
        this.setupMediaRecorderHandlers();
      }
      
      // Iniciar grabación solo si no está grabando
      if (this.mediaRecorder && this.mediaRecorder.state !== 'recording') {
        this.mediaRecorder.start(1000); // Capturar datos cada 1 segundo
        console.log('[ScreenRecording] ✅ MediaRecorder iniciado, estado:', this.mediaRecorder.state);
      } else {
        console.warn('[ScreenRecording] MediaRecorder ya está grabando o no existe');
      }
      
      if (this.mediaRecorder) {
        console.log('[ScreenRecording] ✅ MediaRecorder iniciado, estado:', this.mediaRecorder.state);
      }
      
      // Forzar solicitud de datos después de un momento
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          console.log('[ScreenRecording] 🔄 Solicitando datos del MediaRecorder después de 2 segundos...');
          try {
            this.mediaRecorder.requestData();
          } catch (error) {
            console.error('[ScreenRecording] Error solicitando datos:', error);
          }
        }
      }, 2000); // Esperar 2 segundos para que el canvas capture algunos frames
      
      // Verificar que el MediaRecorder esté realmente grabando después de un momento
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          console.log('[ScreenRecording] ✅ MediaRecorder confirmado en estado "recording"');
          console.log('[ScreenRecording] Estado del stream del Canvas:', {
            active: canvasStream.active,
            videoTracks: canvasStream.getVideoTracks().length,
            videoTrackReady: canvasStream.getVideoTracks()[0]?.readyState
          });
          // Verificar si hay chunks después de 2 segundos
          setTimeout(() => {
            if (this.recordedChunks.length === 0) {
              console.error('[ScreenRecording] ❌ ADVERTENCIA CRÍTICA: No se han recibido chunks después de 2 segundos de grabación');
              console.error('[ScreenRecording] Estado del MediaRecorder:', this.mediaRecorder.state);
              console.error('[ScreenRecording] Frames capturados:', this.frameCount);
              console.error('[ScreenRecording] Estado de isRecording:', this.isRecording);
              console.error('[ScreenRecording] animationFrameId:', this.animationFrameId);
              console.error('[ScreenRecording] Estado del video element:', {
                videoWidth: this.videoElement?.videoWidth,
                videoHeight: this.videoElement?.videoHeight,
                readyState: this.videoElement?.readyState,
                paused: this.videoElement?.paused
              });
            } else {
              console.log('[ScreenRecording] ✅ Chunks recibidos después de 2 segundos:', this.recordedChunks.length);
            }
          }, 2000);
        } else {
          console.error('[ScreenRecording] ❌ MediaRecorder NO está en estado "recording":', this.mediaRecorder?.state);
        }
      }, 500);
      
      // Crear indicador visual de grabación (overlay rojo)
      this.createRecordingIndicator();
      
      // Iniciar captura de audio del sistema (solo en Windows)
      // IMPORTANTE: Esto debe ejecutarse después de que el stream esté listo
      if (window.electronAPI && window.electronAPI.startSystemAudioCapture) {
        try {
          const recordingId = `recording-${Date.now()}`;
          console.log('[ScreenRecording] Iniciando captura de audio del sistema...');
          const audioResult = await window.electronAPI.startSystemAudioCapture(recordingId);
          if (audioResult && audioResult.success) {
            console.log('[ScreenRecording] ✅ Captura de audio del sistema iniciada:', audioResult);
            this.systemAudioRecordingId = recordingId;
          } else {
            console.error('[ScreenRecording] ❌ No se pudo iniciar captura de audio del sistema:', audioResult?.error);
            console.error('[ScreenRecording] Asegúrate de que FFmpeg esté instalado y en el PATH');
          }
        } catch (audioError) {
          console.error('[ScreenRecording] ❌ Error iniciando captura de audio del sistema:', audioError);
          console.error('[ScreenRecording] Stack:', audioError.stack);
          // Continuar sin audio del sistema
        }
      } else {
        console.warn('[ScreenRecording] ⚠️ startSystemAudioCapture no disponible');
      }

      return {
        success: true,
        message: 'Grabación iniciada'
      };
    } catch (error) {
      console.error('Error iniciando grabación:', error);
      this.cleanup();
      
      // Mejorar mensaje de error
      let errorMessage = 'Error al iniciar grabación';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permiso denegado. Por favor, permite el acceso a la pantalla y al micrófono.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No se encontraron dispositivos de captura disponibles.';
      } else if (error.name === 'NotSupportedError' || error.message?.includes('not supported')) {
        errorMessage = 'La captura de pantalla no está soportada. Asegúrate de estar usando una versión compatible de Electron o un navegador moderno.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Detener grabación
   */
  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      console.warn('[ScreenRecording] Intento de detener sin grabación activa');
      return { success: false, message: 'No hay grabación en curso' };
    }

    try {
      console.log('[ScreenRecording] Deteniendo grabación...', {
        state: this.mediaRecorder.state,
        chunksAntes: this.recordedChunks.length,
        duration: this.startTime ? Date.now() - this.startTime : 0
      });
      
      // Solicitar datos finales antes de detener
      if (this.mediaRecorder.state === 'recording') {
        console.log('[ScreenRecording] Solicitando datos finales...');
        this.mediaRecorder.requestData();
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Detener MediaRecorder
      if (this.mediaRecorder.state !== 'inactive') {
        console.log('[ScreenRecording] Deteniendo MediaRecorder, estado actual:', this.mediaRecorder.state);
        this.mediaRecorder.stop();
      }
      
      // Esperar a que el MediaRecorder termine y dispare onstop
      let waitCount = 0;
      while (this.mediaRecorder.state !== 'inactive' && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      console.log('[ScreenRecording] MediaRecorder detenido, estado final:', this.mediaRecorder.state);
      console.log('[ScreenRecording] Chunks después de detener:', this.recordedChunks.length);
      
      // Detener todos los tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => {
          console.log('[ScreenRecording] Deteniendo track:', track.kind, track.readyState);
          track.stop();
        });
      }
      
      this.isRecording = false;
      
      // Detener captura de audio del sistema
      if (window.electronAPI && window.electronAPI.stopSystemAudioCapture) {
        try {
          const audioResult = await window.electronAPI.stopSystemAudioCapture();
          if (audioResult && audioResult.success) {
            console.log('[ScreenRecording] ✅ Captura de audio del sistema detenida');
          }
        } catch (audioError) {
          console.warn('[ScreenRecording] ⚠️ Error deteniendo captura de audio del sistema:', audioError);
        }
      }

      // Esperar un momento adicional para que se procesen todos los datos
      await new Promise(resolve => setTimeout(resolve, 300));

      return {
        success: true,
        message: 'Grabación detenida, guardando...'
      };
    } catch (error) {
      console.error('[ScreenRecording] Error deteniendo grabación:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Manejar cuando se detiene la grabación
   */
  async handleRecordingStop() {
    console.log('[ScreenRecording] handleRecordingStop llamado', {
      chunks: this.recordedChunks.length,
      totalSize: this.recordedChunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0),
      mediaRecorderState: this.mediaRecorder?.state,
      streamActive: this.stream?.active
    });
    
    // Esperar un momento adicional por si hay datos pendientes
    if (this.recordedChunks.length === 0) {
      console.warn('[ScreenRecording] No hay chunks inicialmente, esperando datos pendientes...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Solicitar datos una vez más si el MediaRecorder aún está activo
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        console.log('[ScreenRecording] Solicitando datos finales del MediaRecorder...');
        try {
          this.mediaRecorder.requestData();
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('[ScreenRecording] Error solicitando datos:', error);
        }
      }
    }
    
    if (this.recordedChunks.length === 0) {
      const errorMsg = '⚠️ No se capturaron datos durante la grabación.\n\nPosibles causas:\n' +
        '1. La grabación fue muy corta (menos de 1 segundo)\n' +
        '2. El stream de video no está activo\n' +
        '3. El MediaRecorder no está funcionando correctamente\n\n' +
        'Revisa la consola (F12) para más detalles.';
      console.error('[ScreenRecording] ❌ No hay datos grabados después de esperar');
      console.error('[ScreenRecording] Estado del MediaRecorder:', this.mediaRecorder?.state);
      console.error('[ScreenRecording] Estado del stream:', {
        active: this.stream?.active,
        videoTracks: this.stream?.getVideoTracks().map(t => ({
          readyState: t.readyState,
          enabled: t.enabled,
          muted: t.muted
        })),
        audioTracks: this.stream?.getAudioTracks().map(t => ({
          readyState: t.readyState,
          enabled: t.enabled,
          muted: t.muted
        }))
      });
      alert(errorMsg);
      this.cleanup();
      return;
    }

    try {
      const totalSize = this.recordedChunks.reduce((sum, chunk) => sum + (chunk.size || 0), 0);
      console.log('[ScreenRecording] Creando blob...', {
        chunks: this.recordedChunks.length,
        totalSize
      });
      
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const duration = Date.now() - this.startTime;
      
      console.log('[ScreenRecording] Blob creado:', {
        blobSize: blob.size,
        blobType: blob.type,
        duration
      });
      
      if (blob.size === 0) {
        throw new Error('El blob está vacío - no hay datos para guardar');
      }

      // Guardar video
      if (window.electronAPI && window.electronAPI.saveScreenRecording) {
        // En Electron: guardar directamente
        console.log('[ScreenRecording] Convirtiendo blob a buffer...', {
          blobSize: blob.size,
          chunks: this.recordedChunks.length,
          duration
        });
        
        const arrayBuffer = await blob.arrayBuffer();
        // Convertir ArrayBuffer a Uint8Array para pasar a través de IPC
        // Electron serializa automáticamente Uint8Array a Buffer en el main process
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('[ScreenRecording] Datos preparados para guardar:', {
          blobSize: blob.size,
          arrayBufferSize: arrayBuffer.byteLength,
          uint8ArrayLength: uint8Array.length,
          chunks: this.recordedChunks.length,
          duration
        });
        
        // Pasar Uint8Array directamente - Electron lo convertirá a Buffer
        const result = await window.electronAPI.saveScreenRecording(uint8Array, duration);
        
        console.log('[ScreenRecording] Resultado del guardado:', result);
        
        if (result && result.success) {
          this.recordingPath = result.path;
          console.log('[ScreenRecording] ✅ Video guardado exitosamente:', result.path);
          this.cleanup();
          return result;
        } else {
          const errorMsg = result?.error || 'Error desconocido guardando video';
          console.error('[ScreenRecording] ❌ Error guardando:', errorMsg);
          // Mostrar alerta al usuario
          alert(`❌ Error al guardar el video:\n${errorMsg}\n\nRevisa la consola (F12) para más detalles.`);
          throw new Error(errorMsg);
        }
      } else {
        // En navegador: descargar archivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grabacion-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.cleanup();
        return {
          success: true,
          message: 'Video descargado',
          path: null
        };
      }
    } catch (error) {
      console.error('[ScreenRecording] ❌ Error procesando grabación:', error);
      console.error('[ScreenRecording] Stack:', error.stack);
      this.cleanup();
      // Mostrar error al usuario
      alert(`❌ Error al procesar la grabación:\n${error.message}\n\nRevisa la consola (F12) para más detalles.`);
      throw error;
    }
  }

  /**
   * Crear indicador visual de grabación con borde rojo alrededor de toda la pantalla
   */
  createRecordingIndicator() {
    // Remover indicador anterior si existe
    this.removeRecordingIndicator();
    
    // Crear borde rojo con rayitas alrededor de toda la pantalla
    const borderIndicator = document.createElement('div');
    borderIndicator.id = 'screen-recording-border-indicator';
    borderIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999998;
      box-sizing: border-box;
      border: 4px dashed rgba(220, 38, 38, 0.8);
      animation: recording-border-pulse 1.5s infinite;
    `;
    
    // Agregar animación de pulso para el borde
    const borderStyle = document.createElement('style');
    borderStyle.textContent = `
      @keyframes recording-border-pulse {
        0%, 100% { 
          border-color: rgba(220, 38, 38, 0.8);
          box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4);
        }
        50% { 
          border-color: rgba(220, 38, 38, 1);
          box-shadow: 0 0 20px 5px rgba(220, 38, 38, 0.6);
        }
      }
    `;
    if (!document.getElementById('recording-border-style')) {
      borderStyle.id = 'recording-border-style';
      document.head.appendChild(borderStyle);
    }
    
    document.body.appendChild(borderIndicator);
    
    // También crear el indicador de texto en la esquina
    const indicator = document.createElement('div');
    indicator.id = 'screen-recording-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(220, 38, 38, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      animation: pulse 2s infinite;
    `;
    
    // Agregar animación de pulso
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    `;
    if (!document.getElementById('recording-indicator-style')) {
      style.id = 'recording-indicator-style';
      document.head.appendChild(style);
    }
    
    // Agregar punto rojo pulsante
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
      animation: pulse-dot 1s infinite;
    `;
    
    const dotStyle = document.createElement('style');
    dotStyle.textContent = `
      @keyframes pulse-dot {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }
    `;
    if (!document.getElementById('recording-dot-style')) {
      dotStyle.id = 'recording-dot-style';
      document.head.appendChild(dotStyle);
    }
    
    indicator.appendChild(dot);
    indicator.appendChild(document.createTextNode('GRABANDO'));
    
    document.body.appendChild(indicator);
  }

  /**
   * Remover indicador visual de grabación
   */
  removeRecordingIndicator() {
    const indicator = document.getElementById('screen-recording-indicator');
    if (indicator) {
      indicator.remove();
    }
    const borderIndicator = document.getElementById('screen-recording-border-indicator');
    if (borderIndicator) {
      borderIndicator.remove();
    }
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    // NO limpiar elementos activos durante la grabación
    if (this.isRecording) {
      console.warn('[ScreenRecording] ⚠️ cleanup() llamado durante grabación, omitiendo limpieza de elementos activos');
      // Solo limpiar el indicador visual
      this.removeRecordingIndicator();
      return;
    }
    
    // Remover indicador visual
    this.removeRecordingIndicator();
    
    // Limpiar intervalo de solicitud de datos
    if (this.dataRequestInterval) {
      clearInterval(this.dataRequestInterval);
      this.dataRequestInterval = null;
    }
    
    // Limpiar animación de canvas
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Limpiar video element
    if (this.videoElement) {
      if (this.videoElement.parentNode) {
        this.videoElement.srcObject = null;
        document.body.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
    
    // Limpiar canvas
    if (this.canvas) {
      this.canvas = null;
      this.canvasContext = null;
    }
    
    // Remover listeners del mouse
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler, true);
      this.mouseMoveHandler = null;
    }
    if (this.mouseClickHandler) {
      window.removeEventListener('click', this.mouseClickHandler, true);
      window.removeEventListener('mousedown', this.mouseClickHandler, true);
      this.mouseClickHandler = null;
    }
    
    // Limpiar intervalo de cursor global
    if (this.globalCursorInterval) {
      clearInterval(this.globalCursorInterval);
      this.globalCursorInterval = null;
    }
    
    // Limpiar efectos de clic
    this.clickEffects = [];
    this.mousePosition = { x: 0, y: 0 };
    
    // Limpiar audio stream del micrófono
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    // Limpiar audio context y oscilador
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (e) {
        // Ignorar errores al detener
      }
      this.oscillator = null;
    }
    
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        // Ignorar errores al cerrar
      }
      this.audioContext = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.startTime = null;
  }

  /**
   * Obtener estado de la grabación
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      duration: this.startTime ? Date.now() - this.startTime : 0,
      path: this.recordingPath
    };
  }

  /**
   * Obtener historial de grabaciones
   */
  async getHistory() {
    if (window.electronAPI && window.electronAPI.getScreenRecordingHistory) {
      return await window.electronAPI.getScreenRecordingHistory();
    }
    return [];
  }

  /**
   * Eliminar grabación del historial
   */
  async deleteRecording(recordingId) {
    if (window.electronAPI && window.electronAPI.deleteScreenRecording) {
      return await window.electronAPI.deleteScreenRecording(recordingId);
    }
    return { success: false, message: 'Función no disponible en navegador' };
  }

  /**
   * Abrir carpeta de grabaciones
   */
  async openRecordingsFolder() {
    if (window.electronAPI && window.electronAPI.openScreenRecordingsFolder) {
      return await window.electronAPI.openScreenRecordingsFolder();
    }
    return { success: false, message: 'Función no disponible en navegador' };
  }

  /**
   * Transcribir audio de una grabación
   */
  async transcribeRecording(recordingId) {
    if (window.electronAPI && window.electronAPI.transcribeScreenRecording) {
      return await window.electronAPI.transcribeScreenRecording(recordingId);
    }
    return { success: false, message: 'Función no disponible en navegador' };
  }

  /**
   * Consultar IA sobre transcripciones de grabaciones
   */
  async queryRecordings(question, recordingIds = null) {
    if (window.electronAPI && window.electronAPI.queryScreenRecordings) {
      return await window.electronAPI.queryScreenRecordings(question, recordingIds);
    }
    return { success: false, message: 'Función no disponible en navegador' };
  }
}

// Exportar instancia única
const screenRecordingService = new ScreenRecordingService();
export default screenRecordingService;

