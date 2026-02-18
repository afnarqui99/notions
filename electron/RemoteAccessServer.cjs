const http = require('http');
const WebSocket = require('ws');
const { desktopCapturer } = require('electron');
const os = require('os');

// Intentar cargar localtunnel, pero no fallar si no está disponible
let localtunnel = null;
try {
  localtunnel = require('localtunnel');
} catch (err) {
  console.warn('localtunnel no está disponible:', err.message);
}

// Intentar cargar cloudflared como alternativa
let CloudflareTunnel = null;
try {
  CloudflareTunnel = require('./CloudflareTunnel.cjs');
} catch (err) {
  console.warn('CloudflareTunnel no está disponible:', err.message);
}

class RemoteAccessServer {
  constructor() {
    this.servers = new Map(); // sessionId -> { httpServer, wsServer, port, accessCode, tunnel }
    this.peers = new Map(); // sessionId -> { hostPeer, clientPeer, hostStream }
  }

  // Obtener IP local
  getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  // Encontrar puerto disponible
  async findAvailablePort(startPort = 8765) {
    const net = require('net');
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(startPort, () => {
        const port = server.address().port;
        server.close(() => resolve(port));
      });
      server.on('error', () => {
        resolve(this.findAvailablePort(startPort + 1));
      });
    });
  }

  // Generar HTML de la página de acceso remoto
  generateAccessPage(sessionId, accessCode) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Remoto - ${sessionId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .code-input {
      margin: 30px 0;
    }
    .code-input label {
      display: block;
      color: #333;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .code-display {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      margin: 20px 0;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 10px;
    }
    input[type="text"] {
      width: 100%;
      padding: 15px;
      font-size: 18px;
      text-align: center;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      margin-bottom: 20px;
      transition: border-color 0.3s;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }
    .button {
      width: 100%;
      padding: 15px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }
    .button-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .button-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
    }
    .button-secondary {
      background: #f5f5f5;
      color: #333;
    }
    .button-secondary:hover {
      background: #e0e0e0;
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      font-size: 14px;
    }
    .status.waiting {
      background: #fff3cd;
      color: #856404;
    }
    .status.authorized {
      background: #d4edda;
      color: #155724;
    }
    .status.denied {
      background: #f8d7da;
      color: #721c24;
    }
    .status.connected {
      background: #d1ecf1;
      color: #0c5460;
    }
    .hidden {
      display: none;
    }
    .video-container {
      margin-top: 20px;
      border-radius: 10px;
      overflow: hidden;
      background: #000;
    }
    video {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖥️ Acceso Remoto</h1>
    <p class="subtitle">Solicitud de acceso a este computador</p>
    
    <div id="authorization-section">
      <div class="code-input">
        <label>Ingresa el código de acceso:</label>
        <input type="text" id="code-input" maxlength="4" placeholder="0000" autocomplete="off">
      </div>
      <button class="button button-primary" onclick="authorize()">Autorizar Acceso</button>
      <button class="button button-secondary" onclick="deny()">Denegar</button>
    </div>
    
    <div id="status-section" class="hidden">
      <div id="status" class="status"></div>
    </div>
    
    <div id="video-section" class="hidden">
      <div class="video-container">
        <video id="remote-video" autoplay playsinline></video>
      </div>
      <p class="subtitle" style="margin-top: 15px;">Compartiendo pantalla...</p>
    </div>
  </div>

    <script>
    const sessionId = '${sessionId}';
    const accessCode = '${accessCode}';
    let ws = null;
    let peerConnection = null;
    let localStream = null;
    let wsConnected = false;

    // Conectar WebSocket
    function connectWebSocket() {
      return new Promise((resolve, reject) => {
        // Detectar si estamos en HTTPS o HTTP
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = protocol + '//' + window.location.host + '/ws';
        
        console.log('Conectando WebSocket a:', wsUrl);
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          wsConnected = true;
          ws.send(JSON.stringify({ type: 'client-connect', sessionId }));
          resolve();
        };
        
        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('Mensaje recibido:', message);
            
            if (message.type === 'authorization-result') {
              if (message.authorized) {
                showStatus('Acceso autorizado. Iniciando conexión...', 'authorized');
                await startScreenShare();
              } else {
                showStatus('Acceso denegado', 'denied');
              }
            } else if (message.type === 'offer') {
              if (peerConnection) {
                await handleOffer(message.offer);
              }
            } else if (message.type === 'answer') {
              if (peerConnection) {
                await handleAnswer(message.answer);
              }
            } else if (message.type === 'ice-candidate') {
              if (peerConnection) {
                await handleIceCandidate(message.candidate);
              }
            } else if (message.type === 'remote-command') {
              // Ejecutar comando remoto
              executeRemoteCommand(message.command);
            } else if (message.type === 'webrtc-signal') {
              // Señal WebRTC del host
              if (peerConnection) {
                await peerConnection.signal(message.signal);
              }
            }
          } catch (err) {
            console.error('Error procesando mensaje:', err);
          }
        };
        
        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          wsConnected = false;
          showStatus('Error de conexión. Intenta recargar la página.', 'denied');
          reject(error);
        };
        
        ws.onclose = () => {
          console.log('WebSocket cerrado');
          wsConnected = false;
          ws = null;
        };
      });
    }

    // Autorizar acceso
    async function authorize() {
      const inputCode = document.getElementById('code-input').value;
      
      // Verificar que el WebSocket esté conectado
      if (!wsConnected || !ws || ws.readyState !== WebSocket.OPEN) {
        alert('Esperando conexión... Por favor espera un momento e intenta de nuevo.');
        // Intentar reconectar
        try {
          await connectWebSocket();
        } catch (err) {
          alert('No se pudo conectar. Por favor recarga la página.');
          return;
        }
      }
      
      if (inputCode === accessCode) {
        try {
          ws.send(JSON.stringify({ 
            type: 'authorize', 
            sessionId, 
            authorized: true 
          }));
          document.getElementById('authorization-section').classList.add('hidden');
          showStatus('Esperando autorización del host...', 'waiting');
        } catch (err) {
          console.error('Error enviando autorización:', err);
          alert('Error al enviar autorización. Intenta recargar la página.');
        }
      } else {
        alert('Código incorrecto');
      }
    }

    // Denegar acceso
    function deny() {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showStatus('Acceso denegado', 'denied');
        return;
      }
      
      try {
        ws.send(JSON.stringify({ 
          type: 'authorize', 
          sessionId, 
          authorized: false 
        }));
        showStatus('Acceso denegado', 'denied');
      } catch (err) {
        console.error('Error enviando denegación:', err);
        showStatus('Acceso denegado', 'denied');
      }
    }

    // Mostrar estado
    function showStatus(message, type) {
      const statusSection = document.getElementById('status-section');
      const status = document.getElementById('status');
      statusSection.classList.remove('hidden');
      status.textContent = message;
      status.className = 'status ' + type;
    }

    // Iniciar compartir pantalla
    async function startScreenShare() {
      try {
        localStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        document.getElementById('video-section').classList.remove('hidden');
        const video = document.getElementById('remote-video');
        video.srcObject = localStream;
        
        // Inicializar WebRTC
        await initializeWebRTC();
      } catch (error) {
        console.error('Error compartiendo pantalla:', error);
        showStatus('Error al compartir pantalla', 'denied');
      }
    }

    // Inicializar WebRTC
    async function initializeWebRTC() {
      if (!wsConnected || !ws || ws.readyState !== WebSocket.OPEN) {
        console.error('WebSocket no está conectado');
        return;
      }
      
      // Asegurarse de que peerConnection no exista antes de crear uno nuevo
      if (peerConnection) {
        try {
          peerConnection.close();
        } catch (err) {
          console.warn('Error cerrando peerConnection anterior:', err);
        }
        peerConnection = null;
      }
      
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };
      
      try {
        peerConnection = new RTCPeerConnection(configuration);
        console.log('✅ PeerConnection creado');
        
        // Configurar data channel ANTES de agregar tracks
        if (peerConnection) {
          peerConnection.ondatachannel = (event) => {
            console.log('Data channel recibido');
            const dataChannel = event.channel;
            dataChannel.onopen = () => {
              console.log('✅ Data channel abierto');
            };
            dataChannel.onmessage = (event) => {
              try {
                const command = JSON.parse(event.data);
                executeRemoteCommand(command);
              } catch (err) {
                console.error('Error parseando comando:', err);
              }
            };
            dataChannel.onerror = (error) => {
              console.error('Error en data channel:', error);
            };
          };
        }
        
        // Agregar stream local
        if (localStream) {
          localStream.getTracks().forEach(track => {
            if (peerConnection) {
              peerConnection.addTrack(track, localStream);
            }
          });
        }
        
        // Manejar ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && wsConnected && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ice-candidate',
              sessionId,
              candidate: event.candidate
            }));
          }
        };
        
        // Manejar errores
        peerConnection.onerror = (error) => {
          console.error('Error en peerConnection:', error);
        };
        
        // Manejar conexión establecida
        peerConnection.onconnectionstatechange = () => {
          console.log('Estado de conexión WebRTC:', peerConnection.connectionState);
        };
        
        // Crear oferta
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          
          if (wsConnected && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'offer',
              sessionId,
              offer: offer
            }));
          }
        } catch (err) {
          console.error('Error creando oferta:', err);
        }
      } catch (err) {
        console.error('Error inicializando WebRTC:', err);
        showStatus('Error al inicializar conexión WebRTC', 'denied');
      }
    }

    // Manejar oferta
    async function handleOffer(offer) {
      if (!peerConnection) {
        console.error('peerConnection no inicializado');
        return;
      }
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'answer',
            sessionId,
            answer: answer
          }));
        }
      } catch (err) {
        console.error('Error manejando oferta:', err);
      }
    }

    // Manejar respuesta
    async function handleAnswer(answer) {
      if (!peerConnection) {
        console.error('peerConnection no inicializado');
        return;
      }
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error manejando respuesta:', err);
      }
    }

    // Manejar ICE candidate
    async function handleIceCandidate(candidate) {
      if (!peerConnection) {
        console.error('peerConnection no inicializado');
        return;
      }
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error agregando ICE candidate:', err);
      }
    }

    // Data channel para control remoto
    let dataChannel = null;

    // Ejecutar comando remoto
    function executeRemoteCommand(command) {
      console.log('Ejecutando comando:', command);
      
      if (command.type === 'mouse') {
        handleMouseCommand(command);
      } else if (command.type === 'keyboard') {
        handleKeyboardCommand(command);
      }
    }

    // Manejar comandos de mouse
    function handleMouseCommand(command) {
      const video = document.getElementById('remote-video');
      if (!video) return;

      const rect = video.getBoundingClientRect();
      const x = (command.x / 100) * rect.width + rect.left;
      const y = (command.y / 100) * rect.height + rect.top;

      // Crear eventos de mouse sintéticos
      const mouseEventMap = {
        'down': 'mousedown',
        'up': 'mouseup',
        'move': 'mousemove'
      };

      if (command.action === 'move') {
        // Simular movimiento del mouse
        const event = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y
        });
        document.elementFromPoint(x, y)?.dispatchEvent(event);
      } else if (command.action === 'down' || command.action === 'up') {
        const buttonMap = { 0: 0, 1: 1, 2: 2 }; // left, middle, right
        const event = new MouseEvent(mouseEventMap[command.action], {
          bubbles: true,
          cancelable: true,
          button: buttonMap[command.button] || 0,
          buttons: command.action === 'down' ? 1 : 0,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y
        });
        const element = document.elementFromPoint(x, y);
        if (element) {
          element.dispatchEvent(event);
          if (command.action === 'down' && command.button === 0) {
            // Simular clic
            element.click();
          }
        }
      } else if (command.action === 'wheel') {
        const event = new WheelEvent('wheel', {
          bubbles: true,
          cancelable: true,
          deltaX: command.deltaX || 0,
          deltaY: command.deltaY || 0,
          deltaZ: command.deltaZ || 0,
          clientX: x,
          clientY: y
        });
        document.elementFromPoint(x, y)?.dispatchEvent(event);
      }
    }

    // Manejar comandos de teclado
    function handleKeyboardCommand(command) {
      const eventType = command.action === 'down' ? 'keydown' : 'keyup';
      
      const event = new KeyboardEvent(eventType, {
        bubbles: true,
        cancelable: true,
        key: command.key,
        code: command.code,
        keyCode: command.keyCode,
        ctrlKey: command.ctrlKey || false,
        shiftKey: command.shiftKey || false,
        altKey: command.altKey || false,
        metaKey: command.metaKey || false
      });

      // Enviar al elemento activo o al body
      const activeElement = document.activeElement || document.body;
      activeElement.dispatchEvent(event);
    }

    // Iniciar cuando se carga la página
    window.onload = async () => {
      try {
        console.log('Inicializando conexión WebSocket...');
        showStatus('Conectando...', 'waiting');
        await connectWebSocket();
        console.log('✅ WebSocket inicializado correctamente');
        showStatus('Conectado. Ingresa el código de acceso.', 'connected');
      } catch (err) {
        console.error('Error conectando WebSocket:', err);
        showStatus('Error de conexión. Recarga la página.', 'denied');
      }
    };
  </script>
</body>
</html>`;
  }

  // Iniciar servidor para una sesión
  async startServer(sessionId, accessCode) {
    if (this.servers.has(sessionId)) {
      return { success: false, error: 'Servidor ya está corriendo para esta sesión' };
    }

    try {
      const port = await this.findAvailablePort();
      const localIP = this.getLocalIP();

      // Crear servidor HTTP
      const httpServer = http.createServer((req, res) => {
        const parsedUrl = require('url').parse(req.url, true);
        
        // CORS headers para permitir acceso desde cualquier origen
        const headers = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        };
        
        // Manejar preflight OPTIONS
        if (req.method === 'OPTIONS') {
          res.writeHead(200, headers);
          res.end();
          return;
        }
        
        // Log de todas las peticiones para debugging
        console.log(`[RemoteAccess] Petición recibida: ${req.method} ${parsedUrl.pathname}`);
        
        // Servir página de acceso
        if (parsedUrl.pathname === `/acceso/${sessionId}` || parsedUrl.pathname === `/acceso/${sessionId}/`) {
          console.log(`[RemoteAccess] Sirviendo página de acceso para sesión: ${sessionId}`);
          res.writeHead(200, { 
            'Content-Type': 'text/html; charset=utf-8',
            ...headers
          });
          res.end(this.generateAccessPage(sessionId, accessCode));
        } else if (parsedUrl.pathname === '/' || parsedUrl.pathname === '') {
          // Redirigir root a la página de acceso
          console.log(`[RemoteAccess] Redirigiendo root a /acceso/${sessionId}`);
          res.writeHead(302, {
            'Location': `/acceso/${sessionId}`,
            ...headers
          });
          res.end();
        } else {
          console.log(`[RemoteAccess] Ruta no encontrada: ${parsedUrl.pathname}`);
          res.writeHead(404, headers);
          res.end('Not found');
        }
      });

      // Crear servidor WebSocket
      const wsServer = new WebSocket.Server({ server: httpServer });

      wsServer.on('connection', (ws) => {
        console.log('Cliente WebSocket conectado');

        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            console.log('Mensaje recibido:', data);

            if (data.type === 'client-connect') {
              // Notificar al host que hay un cliente esperando
              this.notifyHost(sessionId, 'client-waiting');
            } else if (data.type === 'authorize') {
              // Resultado de autorización del cliente
              this.notifyHost(sessionId, 'authorization-result', {
                authorized: data.authorized
              });
              
              if (data.authorized) {
                // Iniciar WebRTC
                await this.setupWebRTC(sessionId, ws);
              }
            } else if (data.type === 'offer' || data.type === 'answer' || data.type === 'ice-candidate') {
              // Reenviar mensajes WebRTC al host
              this.forwardToHost(sessionId, data);
            } else if (data.type === 'webrtc-signal') {
              // Señal WebRTC del remoto
              this.forwardToHost(sessionId, data);
            }
          } catch (error) {
            console.error('Error procesando mensaje:', error);
          }
        });

        ws.on('close', () => {
          console.log('Cliente WebSocket desconectado');
          this.notifyHost(sessionId, 'client-disconnected');
        });
      });

      // Iniciar servidor
      await new Promise((resolve, reject) => {
        httpServer.listen(port, (err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log(`Servidor de acceso remoto iniciado en puerto ${port}`);
          resolve();
        });
      });

      // Crear tunnel público HTTPS - FORZAR creación
      let publicUrl = null;
      let tunnel = null;
      let tunnelProcess = null;
      let tunnelCreated = false;
      
      console.log('🔧 Intentando crear tunnel público...');
      
      // Intentar primero con cloudflared (sin contraseña, más confiable)
      if (CloudflareTunnel && !tunnelCreated) {
        try {
          console.log('Intentando con cloudflared...');
          publicUrl = await CloudflareTunnel.createTunnel(sessionId, port);
          console.log(`✅ Tunnel público creado (cloudflared): ${publicUrl}`);
          tunnelProcess = CloudflareTunnel.processes.get(sessionId);
          tunnelCreated = true;
        } catch (cfError) {
          console.warn('❌ Error con cloudflared:', cfError.message);
        }
      }
      
      // Si cloudflared falló o no está disponible, intentar con localtunnel
      if (!tunnelCreated && typeof localtunnel === 'function') {
        try {
          console.log('Intentando con localtunnel...');
          // Generar un subdomain único basado en el sessionId
          const subdomain = sessionId.replace(/[^a-z0-9]/gi, '').substring(0, 20).toLowerCase();
          
          tunnel = await localtunnel({
            port: port,
            subdomain: subdomain,
            local_https: false
          });
          
          // Agregar la ruta completa al URL del tunnel
          const tunnelBaseUrl = tunnel.url.replace(/\/$/, '');
          publicUrl = `${tunnelBaseUrl}/acceso/${sessionId}`;
          console.log(`✅ Tunnel público creado (localtunnel):`);
          console.log(`   - URL base: ${tunnel.url}`);
          console.log(`   - URL completa: ${publicUrl}`);
          tunnelCreated = true;
          
          tunnel.on('error', (err) => {
            console.error('❌ Error en tunnel localtunnel:', err);
          });
          
          tunnel.on('close', () => {
            console.log('Tunnel localtunnel cerrado');
          });
        } catch (ltError) {
          console.error('❌ Error con localtunnel:', ltError.message);
        }
      }
      
      // Si ambos fallaron, usar URL local (pero advertir)
      if (!tunnelCreated) {
        publicUrl = `http://${localIP}:${port}/acceso/${sessionId}`;
        console.warn('⚠️ NO se pudo crear tunnel público. Usando URL local:');
        console.warn(`   ${publicUrl}`);
        console.warn('   ⚠️ Esta URL solo funciona en la misma red local. No funcionará desde otro computador fuera de tu red.');
      }

      this.servers.set(sessionId, {
        httpServer,
        wsServer,
        port,
        accessCode,
        clientWS: null,
        hostWS: null,
        tunnel: tunnel,
        publicUrl: publicUrl || `http://${localIP}:${port}/acceso/${sessionId}`
      });

      return {
        success: true,
        port,
        localIP,
        localUrl: `http://${localIP}:${port}/acceso/${sessionId}`,
        publicUrl: publicUrl || `http://${localIP}:${port}/acceso/${sessionId}`,
        isPublic: !!tunnel
      };
    } catch (error) {
      console.error('Error iniciando servidor:', error);
      const errorMessage = error?.message || error?.toString() || 'Error desconocido al iniciar el servidor';
      return { success: false, error: errorMessage };
    }
  }

  // Notificar al host (a través de IPC)
  notifyHost(sessionId, event, data = {}) {
    // Esto se llamará desde main.cjs con el mainWindow
    if (global.mainWindow) {
      global.mainWindow.webContents.send('remote-access-event', {
        sessionId,
        event,
        ...data
      });
    }
  }

  // Reenviar mensajes al host
  forwardToHost(sessionId, message) {
    const session = this.servers.get(sessionId);
    if (session && session.hostWS) {
      session.hostWS.send(JSON.stringify(message));
    } else {
      // Si no hay WebSocket del host, notificar a través de IPC
      this.notifyHost(sessionId, 'webrtc-signal', message);
    }
  }

  // Configurar WebRTC
  async setupWebRTC(sessionId, clientWS) {
    // Guardar referencia del cliente
    const session = this.servers.get(sessionId);
    if (session) {
      session.clientWS = clientWS;
    }

    // La lógica de WebRTC se manejará en el frontend
    // Este servidor solo actúa como señalización
  }

  // Enviar comando al remoto
  sendCommand(sessionId, command) {
    const session = this.servers.get(sessionId);
    if (session && session.clientWS) {
      session.clientWS.send(JSON.stringify({
        type: 'remote-command',
        command: command
      }));
      return { success: true };
    }
    return { success: false, error: 'Cliente no conectado' };
  }

  // Enviar señal WebRTC
  sendWebRTCSignal(sessionId, signal) {
    const session = this.servers.get(sessionId);
    if (session && session.clientWS) {
      session.clientWS.send(JSON.stringify({
        type: 'webrtc-signal',
        signal: signal
      }));
      return { success: true };
    }
    return { success: false, error: 'Cliente no conectado' };
  }

  // Detener servidor
  async stopServer(sessionId) {
    const session = this.servers.get(sessionId);
    if (session) {
      // Cerrar tunnel primero
      if (session.tunnel) {
        try {
          await session.tunnel.close();
          console.log('Tunnel localtunnel cerrado');
        } catch (err) {
          console.error('Error cerrando tunnel localtunnel:', err);
        }
      }
      
      // Cerrar cloudflared si existe
      if (CloudflareTunnel) {
        try {
          CloudflareTunnel.closeTunnel(sessionId);
          console.log('Tunnel cloudflared cerrado');
        } catch (err) {
          console.error('Error cerrando tunnel cloudflared:', err);
        }
      }
      
      if (session.httpServer) {
        session.httpServer.close();
      }
      if (session.wsServer) {
        session.wsServer.close();
      }
      this.servers.delete(sessionId);
      this.peers.delete(sessionId);
      console.log(`Servidor de acceso remoto detenido para sesión ${sessionId}`);
      return { success: true };
    }
    return { success: false, error: 'Servidor no encontrado' };
  }
}

module.exports = new RemoteAccessServer();

