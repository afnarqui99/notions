/**
 * Servicio para manejar conexiones SFTP (SSH File Transfer Protocol)
 * Usa la librería ssh2-sftp-client para conexiones seguras
 */

const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SFTPService {
  constructor() {
    this.connections = new Map(); // connectionId -> { client, config, currentPath }
    this.savedConnectionsPath = path.join(app.getPath('userData'), 'sftp-connections.json');
    this.loadSavedConnections();
  }

  /**
   * Verifica si ssh-keygen está disponible en el sistema
   * @returns {Promise<{available: boolean, path?: string, error?: string}>}
   */
  async isSSHKeygenAvailable() {
    try {
      // Intentar ejecutar ssh-keygen --version
      await execAsync('ssh-keygen -V 2>&1 || ssh-keygen --version 2>&1', { timeout: 5000 });
      return { available: true, path: 'ssh-keygen' };
    } catch (error) {
      // En Windows, buscar en rutas comunes de Git Bash
      if (process.platform === 'win32') {
        const gitBashPaths = [
          'C:\\Program Files\\Git\\usr\\bin\\ssh-keygen.exe',
          'C:\\Program Files (x86)\\Git\\usr\\bin\\ssh-keygen.exe',
          process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs\\Git\\usr\\bin\\ssh-keygen.exe') : null
        ].filter(Boolean);

        for (const gitBashPath of gitBashPaths) {
          if (fs.existsSync(gitBashPath)) {
            try {
              await execAsync(`"${gitBashPath}" -V 2>&1`, { timeout: 5000 });
              return { available: true, path: gitBashPath };
            } catch (e) {
              continue;
            }
          }
        }
      }
      
      return { 
        available: false, 
        error: 'ssh-keygen no está disponible. Instala Git para Windows o OpenSSH.' 
      };
    }
  }

  /**
   * Convierte una clave OpenSSH a formato PEM usando ssh-keygen
   * @param {string} openSshKeyContent - Contenido de la clave OpenSSH
   * @param {string} passphrase - Frase de contraseña (opcional)
   * @returns {Promise<string>} - Ruta al archivo PEM temporal
   */
  async convertOpenSSHToPEM(openSshKeyContent, passphrase = '') {
    // Verificar si ssh-keygen está disponible
    const sshKeygenInfo = await this.isSSHKeygenAvailable();
    if (!sshKeygenInfo.available) {
      const errorMsg = `❌ ssh-keygen NO está disponible en tu sistema.\n\n` +
        `Para convertir claves OpenSSH a PEM, necesitas ssh-keygen.\n\n` +
        `OPCIONES:\n` +
        `1. Instala Git para Windows (recomendado):\n` +
        `   https://git-scm.com/download/win\n` +
        `   (Incluye ssh-keygen automáticamente)\n\n` +
        `2. O instala OpenSSH desde Windows:\n` +
        `   Configuración > Aplicaciones > Características opcionales > OpenSSH Client\n\n` +
        `3. O convierte la clave manualmente una vez:\n` +
        `   ssh-keygen -p -N "" -m pem -f ruta_a_tu_clave\n\n` +
        `Después de instalar, reinicia la aplicación.`;
      throw new Error(errorMsg);
    }
    
    const sshKeygenPath = sshKeygenInfo.path;

    const tempDir = app.getPath('temp');
    const tempOpenSSHPath = path.join(tempDir, `sftp_key_openssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

    try {
      // Guardar clave OpenSSH temporalmente
      fs.writeFileSync(tempOpenSSHPath, openSshKeyContent, { mode: 0o600 });
      
      // Intentar convertir usando ssh-keygen
      // ssh-keygen -p -N "" -m pem -f ruta_a_clave
      const passphraseArg = passphrase ? `-P "${passphrase.replace(/"/g, '\\"')}"` : '-N ""';
      
      // Usar la ruta de ssh-keygen que encontramos
      const command = sshKeygenPath.includes(' ') || sshKeygenPath.includes('.exe')
        ? `"${sshKeygenPath}" -p ${passphraseArg} -m pem -f "${tempOpenSSHPath.replace(/"/g, '\\"')}"`
        : `${sshKeygenPath} -p ${passphraseArg} -m pem -f "${tempOpenSSHPath.replace(/"/g, '\\"')}"`;
      
      console.log('[SFTP] Ejecutando conversión con:', sshKeygenPath);
      console.log('[SFTP] Comando:', command);
      
      try {
        const { stdout, stderr } = await execAsync(command, { timeout: 15000 });
        if (stderr && !stderr.includes('Your identification has been saved')) {
          console.warn('[SFTP] Advertencia de ssh-keygen:', stderr);
        }
        console.log('[SFTP] Conversión completada exitosamente');
      } catch (convertExecError) {
        console.error('[SFTP] Error al ejecutar ssh-keygen:', convertExecError);
        console.error('[SFTP] stdout:', convertExecError.stdout);
        console.error('[SFTP] stderr:', convertExecError.stderr);
        throw new Error(`Error al ejecutar ssh-keygen: ${convertExecError.message}\n\nAsegúrate de que ssh-keygen esté correctamente instalado y funcional.`);
      }
      
      // Leer el archivo PEM convertido (el mismo archivo ahora está en formato PEM)
      const pemContent = fs.readFileSync(tempOpenSSHPath, 'utf8');
      
      // Renombrar el archivo para indicar que es PEM
      const tempPEMPath = tempOpenSSHPath.replace('openssh', 'pem');
      fs.writeFileSync(tempPEMPath, pemContent, { mode: 0o600 });
      
      // Limpiar archivo OpenSSH temporal
      if (fs.existsSync(tempOpenSSHPath)) {
        fs.unlinkSync(tempOpenSSHPath);
      }
      
      return tempPEMPath;
    } catch (convertError) {
      // Si la conversión falla, limpiar y lanzar error con instrucciones
      if (fs.existsSync(tempOpenSSHPath)) {
        fs.unlinkSync(tempOpenSSHPath);
      }
      
      let errorMessage = 'No se pudo convertir la clave OpenSSH a PEM. ';
      if (process.platform === 'win32') {
        errorMessage += 'Para instalar ssh-keygen en Windows:\n';
        errorMessage += '1. Instala Git para Windows (incluye ssh-keygen): https://git-scm.com/download/win\n';
        errorMessage += '2. O instala OpenSSH desde "Configuración > Aplicaciones > Características opcionales"\n';
        errorMessage += '3. O convierte la clave manualmente usando: ssh-keygen -p -N "" -m pem -f ruta_a_tu_clave';
      } else {
        errorMessage += 'Asegúrate de que ssh-keygen esté instalado. ';
        errorMessage += 'O convierte la clave manualmente usando: ssh-keygen -p -N "" -m pem -f ruta_a_tu_clave';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Cargar conexiones guardadas desde el archivo
   */
  loadSavedConnections() {
    try {
      if (fs.existsSync(this.savedConnectionsPath)) {
        const data = fs.readFileSync(this.savedConnectionsPath, 'utf8');
        this.savedConnections = JSON.parse(data);
      } else {
        this.savedConnections = [];
      }
    } catch (error) {
      console.error('Error al cargar conexiones SFTP guardadas:', error);
      this.savedConnections = [];
    }
  }

  /**
   * Guardar conexiones en el archivo
   */
  saveSavedConnections() {
    try {
      fs.writeFileSync(this.savedConnectionsPath, JSON.stringify(this.savedConnections, null, 2), 'utf8');
    } catch (error) {
      console.error('Error al guardar conexiones SFTP:', error);
    }
  }

  /**
   * Conectar a un servidor SFTP
   * @param {Object} config - Configuración de conexión
   * @param {string} config.host - Host del servidor
   * @param {number} config.port - Puerto (default: 22)
   * @param {string} config.username - Usuario
   * @param {string} config.password - Contraseña (opcional si se usa privateKey)
   * @param {string} config.privateKey - Ruta a clave privada SSH (opcional)
   * @param {string} config.passphrase - Frase de contraseña para la clave privada (opcional)
   * @param {string} config.name - Nombre de la conexión (opcional)
   * @returns {Promise<Object>} - { success: boolean, connectionId?: string, error?: string }
   */
  async connect(config) {
    let tempKeyPath = null; // Variable para limpiar archivo temporal en caso de error
    let connectionConfig = null; // Variable para acceso en catch
    
    try {
      const client = new Client();
      
      connectionConfig = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
        readyTimeout: 20000, // 20 segundos timeout
        retries: 2,
        retry_factor: 2,
        retry_minTimeout: 2000
      };

      // Agregar autenticación: contraseña o clave privada
      if (config.privateKey) {
        let privateKeyContent = '';
        let isTemporaryFile = false;
        
        // Verificar si es una ruta de archivo o el contenido de la clave privada
        if (config.privateKey.includes('-----BEGIN') || config.privateKey.includes('-----BEGIN OPENSSH')) {
          // Es el contenido de la clave privada directamente
          privateKeyContent = config.privateKey;
          
          // Si es formato OpenSSH, intentar convertir a PEM automáticamente
          // porque ssh2-sftp-client tiene problemas con el formato OpenSSH
          if (privateKeyContent.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
            // Normalizar saltos de línea
            privateKeyContent = privateKeyContent.trim();
            privateKeyContent = privateKeyContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            
            // Para OpenSSH, ssh2-sftp-client NO lo soporta directamente
            // Intentar convertir a PEM, pero si falla, mostrar error claro
            // Verificar primero si ssh-keygen está disponible ANTES de intentar convertir
            console.log('[SFTP] Detectada clave OpenSSH, verificando disponibilidad de ssh-keygen...');
            const sshKeygenInfo = await this.isSSHKeygenAvailable();
            
            if (!sshKeygenInfo.available) {
              // ssh-keygen NO está disponible, mostrar error claro inmediatamente
              const errorMsg = `❌ ERROR: Formato de clave OpenSSH detectado, pero ssh-keygen NO está disponible.\n\n` +
                `La librería ssh2-sftp-client NO soporta claves OpenSSH directamente.\n\n` +
                `SOLUCIONES (elige una):\n\n` +
                `1. INSTALA GIT PARA WINDOWS (recomendado - más fácil):\n` +
                `   • Descarga: https://git-scm.com/download/win\n` +
                `   • Instala Git (incluye ssh-keygen automáticamente)\n` +
                `   • Reinicia esta aplicación\n` +
                `   • La conversión será automática la próxima vez\n\n` +
                `2. O CONVIERTE LA CLAVE MANUALMENTE (una sola vez):\n` +
                `   • Abre PowerShell o CMD\n` +
                `   • Ejecuta: ssh-keygen -p -N "" -m pem -f ruta_completa_a_tu_clave\n` +
                `   • Usa la clave convertida en esta aplicación\n\n` +
                `3. O USA UNA CLAVE EN FORMATO PEM (RSA, DSA, ECDSA)\n` +
                `   • Genera una nueva clave: ssh-keygen -t rsa -b 4096 -m pem\n\n` +
                `NOTA: Si ya tienes Git instalado, asegúrate de reiniciar la aplicación.`;
              
              throw new Error(errorMsg);
            }
            
            // ssh-keygen está disponible, intentar convertir
            try {
              console.log('[SFTP] ssh-keygen disponible, iniciando conversión a PEM...');
              const pemPath = await this.convertOpenSSHToPEM(privateKeyContent, config.passphrase);
              tempKeyPath = pemPath;
              isTemporaryFile = true;
              
              console.log('[SFTP] ✅ Clave convertida exitosamente a PEM');
              // Usar el archivo PEM convertido
              connectionConfig.privateKey = pemPath;
            } catch (convertError) {
              // Si la conversión falla, mostrar error claro y detallado
              console.error('[SFTP] ❌ Error al convertir OpenSSH a PEM:', convertError);
              
              const errorMsg = `❌ ERROR: No se pudo convertir la clave OpenSSH a PEM.\n\n` +
                `Error técnico: ${convertError.message}\n\n` +
                `SOLUCIONES:\n` +
                `1. Verifica que ssh-keygen funcione correctamente\n` +
                `2. O convierte la clave manualmente:\n` +
                `   ssh-keygen -p -N "" -m pem -f ruta_a_tu_clave\n` +
                `3. O usa una clave en formato PEM tradicional`;
              
              throw new Error(errorMsg);
            }
          } else {
            // Formato PEM tradicional, usar directamente
            privateKeyContent = privateKeyContent.trim();
            privateKeyContent = privateKeyContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            connectionConfig.privateKey = privateKeyContent;
          }
        } else if (fs.existsSync(config.privateKey)) {
          // Es una ruta de archivo, leer el contenido
          privateKeyContent = fs.readFileSync(config.privateKey, 'utf8');
          
          // Verificar si es formato OpenSSH
          if (privateKeyContent.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
            try {
              console.log('[SFTP] Detectada clave OpenSSH desde archivo, intentando convertir a PEM...');
              // Intentar convertir OpenSSH a PEM automáticamente
              const pemPath = await this.convertOpenSSHToPEM(privateKeyContent, config.passphrase);
              tempKeyPath = pemPath;
              isTemporaryFile = true;
              
              console.log('[SFTP] Clave convertida exitosamente a PEM');
              // Usar el archivo PEM convertido
              connectionConfig.privateKey = pemPath;
            } catch (convertError) {
              // Si la conversión falla, mostrar error claro
              console.error('[SFTP] Error al convertir OpenSSH a PEM:', convertError);
              
              const errorMsg = `❌ ERROR: Formato de clave OpenSSH no compatible.\n\n` +
                `La librería ssh2-sftp-client NO soporta claves OpenSSH directamente.\n\n` +
                `SOLUCIONES:\n` +
                `1. Convierte tu clave a formato PEM manualmente:\n` +
                `   ssh-keygen -p -N "" -m pem -f ${config.privateKey}\n\n` +
                `2. O instala Git para Windows (incluye ssh-keygen):\n` +
                `   https://git-scm.com/download/win\n\n` +
                `3. O usa una clave en formato PEM tradicional (RSA, DSA, ECDSA)\n\n` +
                `Error técnico: ${convertError.message}`;
              
              throw new Error(errorMsg);
            }
          } else {
            // Para formato PEM tradicional, usar string
            connectionConfig.privateKey = privateKeyContent;
          }
        } else {
          throw new Error('El archivo de clave privada no existe o el formato de la clave es inválido');
        }
        
        // Configurar algoritmos permitidos para mejor compatibilidad
        connectionConfig.algorithms = {
          serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521', 'ssh-ed25519', 'rsa-sha2-256', 'rsa-sha2-512']
        };
        
        // Intentar con tryAgent: false para evitar problemas con agent
        connectionConfig.tryAgent = false;
        
        if (config.passphrase) {
          connectionConfig.passphrase = config.passphrase;
        }
        
        // Guardar referencia al archivo temporal para limpiarlo después
        if (isTemporaryFile && tempKeyPath) {
          connectionConfig._tempKeyPath = tempKeyPath;
        }
      } else if (config.password) {
        connectionConfig.password = config.password;
      } else {
        throw new Error('Debe proporcionar contraseña o clave privada');
      }

      // Conectar al servidor
      console.log('[SFTP] Intentando conectar a', config.host, 'puerto', config.port || 22);
      console.log('[SFTP] Usando autenticación:', config.privateKey ? 'Clave privada' : 'Contraseña');
      
      try {
        await client.connect(connectionConfig);
        console.log('[SFTP] Conexión establecida exitosamente');
      } catch (connectError) {
        console.error('[SFTP] Error al conectar:', connectError);
        console.error('[SFTP] Detalles del error:', {
          message: connectError.message,
          code: connectError.code,
          stack: connectError.stack
        });
        throw connectError;
      }

      // Si se proporciona un directorio remoto inicial, cambiar a ese directorio
      let currentPath;
      if (config.remoteDirectory) {
        try {
          await client.cwd(config.remoteDirectory);
          currentPath = await client.cwd();
        } catch (dirError) {
          console.warn('No se pudo cambiar al directorio remoto inicial:', dirError);
          // Si falla, usar el directorio actual
          currentPath = await client.cwd();
        }
      } else {
        // Obtener el directorio actual
        currentPath = await client.cwd();
      }

      // Generar ID único para la conexión
      const connectionId = `sftp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Guardar la conexión
      this.connections.set(connectionId, {
        client,
        config: {
          ...config,
          password: undefined, // No guardar contraseña en memoria
          privateKey: undefined // No guardar clave privada en memoria
        },
        currentPath,
        tempKeyPath: connectionConfig._tempKeyPath || null // Guardar ruta temporal para limpiar después
      });
      
      // Limpiar archivo temporal si existe (después de un breve delay para asegurar que se usó)
      if (connectionConfig._tempKeyPath) {
        setTimeout(() => {
          try {
            if (fs.existsSync(connectionConfig._tempKeyPath)) {
              fs.unlinkSync(connectionConfig._tempKeyPath);
            }
          } catch (cleanupError) {
            console.warn('No se pudo eliminar archivo temporal de clave:', cleanupError);
          }
        }, 5000); // Limpiar después de 5 segundos
      }

      return {
        success: true,
        connectionId,
        currentPath
      };
    } catch (error) {
      console.error('[SFTP] ========== ERROR AL CONECTAR ==========');
      console.error('[SFTP] Mensaje:', error.message);
      console.error('[SFTP] Código:', error.code);
      console.error('[SFTP] Stack completo:', error.stack);
      console.error('[SFTP] =======================================');
      
      // Limpiar archivo temporal si existe y hubo error
      const keyPathToClean = tempKeyPath || (connectionConfig && connectionConfig._tempKeyPath);
      if (keyPathToClean) {
        try {
          if (fs.existsSync(keyPathToClean)) {
            fs.unlinkSync(keyPathToClean);
            console.log('[SFTP] Archivo temporal limpiado:', keyPathToClean);
          }
        } catch (cleanupError) {
          console.warn('[SFTP] No se pudo eliminar archivo temporal de clave:', cleanupError);
        }
      }
      
      // Mensaje de error más descriptivo para problemas de formato de clave
      let errorMessage = error.message || 'Error desconocido al conectar';
      
      // Si el error ya tiene un mensaje detallado (de nuestra conversión), usarlo
      if (errorMessage.includes('❌ ERROR:')) {
        // Ya tiene mensaje detallado, mantenerlo
      } else if (errorMessage.includes('Unsupported key format') || 
                 errorMessage.includes('cannot parse privateKey') ||
                 errorMessage.includes('parse privateKey') ||
                 errorMessage.toLowerCase().includes('unsupported key')) {
        errorMessage = `❌ ERROR: Formato de clave privada no compatible.\n\n` +
          `La librería ssh2-sftp-client NO soporta claves OpenSSH directamente.\n\n` +
          `ERROR ORIGINAL: ${error.message}\n\n` +
          `SOLUCIONES:\n` +
          `1. Convierte tu clave a formato PEM manualmente:\n` +
          `   ssh-keygen -p -N "" -m pem -f ruta_a_tu_clave\n\n` +
          `2. O instala Git para Windows (incluye ssh-keygen):\n` +
          `   https://git-scm.com/download/win\n\n` +
          `3. O usa una clave en formato PEM tradicional (RSA, DSA, ECDSA)\n\n` +
          `NOTA: Revisa la consola para más detalles del error.`;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Desconectar de un servidor SFTP
   * @param {string} connectionId - ID de la conexión
   */
  async disconnect(connectionId) {
    try {
      const connection = this.connections.get(connectionId);
      if (connection && connection.client) {
        await connection.client.end();
        
        // Limpiar archivo temporal de clave privada si existe
        if (connection.tempKeyPath && fs.existsSync(connection.tempKeyPath)) {
          try {
            fs.unlinkSync(connection.tempKeyPath);
          } catch (cleanupError) {
            console.warn('No se pudo eliminar archivo temporal de clave:', cleanupError);
          }
        }
        
        this.connections.delete(connectionId);
      }
    } catch (error) {
      console.error('Error al desconectar SFTP:', error);
      // Eliminar de todas formas
      this.connections.delete(connectionId);
    }
  }

  /**
   * Desconectar todas las conexiones
   */
  async disconnectAll() {
    const disconnectPromises = Array.from(this.connections.keys()).map(id => this.disconnect(id));
    await Promise.all(disconnectPromises);
  }

  /**
   * Listar archivos en un directorio remoto
   * @param {string} connectionId - ID de la conexión
   * @param {string} remotePath - Ruta remota (opcional, usa directorio actual si no se proporciona)
   * @returns {Promise<Array>} - Lista de archivos
   */
  async listFiles(connectionId, remotePath = null) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      const pathToUse = remotePath || connection.currentPath;
      const files = await connection.client.list(pathToUse);

      // Formatear los archivos para consistencia con FTP
      return files.map(file => ({
        name: file.name,
        type: file.type === 'd' ? 'directory' : 'file',
        size: file.size || 0,
        modified: file.modifyTime ? new Date(file.modifyTime).toISOString() : null,
        permissions: file.permissions || null
      }));
    } catch (error) {
      console.error('Error al listar archivos SFTP:', error);
      throw error;
    }
  }

  /**
   * Subir un archivo al servidor
   * @param {string} connectionId - ID de la conexión
   * @param {string} localPath - Ruta local del archivo
   * @param {string} remotePath - Ruta remota donde subir
   */
  async uploadFile(connectionId, localPath, remotePath) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      if (!fs.existsSync(localPath)) {
        throw new Error('El archivo local no existe');
      }

      await connection.client.put(localPath, remotePath);
    } catch (error) {
      console.error('Error al subir archivo SFTP:', error);
      throw error;
    }
  }

  /**
   * Descargar un archivo del servidor
   * @param {string} connectionId - ID de la conexión
   * @param {string} remotePath - Ruta remota del archivo
   * @param {string} localPath - Ruta local donde guardar
   * @returns {Promise<Object>} - { localPath: string }
   */
  async downloadFile(connectionId, remotePath, localPath) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      // Asegurar que el directorio local existe
      const localDir = path.dirname(localPath);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      await connection.client.fastGet(remotePath, localPath);

      return { localPath };
    } catch (error) {
      console.error('Error al descargar archivo SFTP:', error);
      throw error;
    }
  }

  /**
   * Eliminar un archivo del servidor
   * @param {string} connectionId - ID de la conexión
   * @param {string} remotePath - Ruta remota del archivo
   */
  async deleteFile(connectionId, remotePath) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      await connection.client.delete(remotePath);
    } catch (error) {
      console.error('Error al eliminar archivo SFTP:', error);
      throw error;
    }
  }

  /**
   * Crear un directorio en el servidor
   * @param {string} connectionId - ID de la conexión
   * @param {string} remotePath - Ruta remota del directorio
   */
  async createDirectory(connectionId, remotePath) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      await connection.client.mkdir(remotePath, true); // true = crear directorios padres si no existen
    } catch (error) {
      console.error('Error al crear directorio SFTP:', error);
      throw error;
    }
  }

  /**
   * Eliminar un directorio del servidor
   * @param {string} connectionId - ID de la conexión
   * @param {string} remotePath - Ruta remota del directorio
   */
  async deleteDirectory(connectionId, remotePath) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      await connection.client.rmdir(remotePath, true); // true = eliminar recursivamente
    } catch (error) {
      console.error('Error al eliminar directorio SFTP:', error);
      throw error;
    }
  }

  /**
   * Cambiar el directorio actual
   * @param {string} connectionId - ID de la conexión
   * @param {string} remotePath - Nueva ruta
   * @returns {Promise<Object>} - { currentPath: string }
   */
  async changeDirectory(connectionId, remotePath) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      // Verificar que el directorio existe
      const exists = await connection.client.exists(remotePath);
      if (!exists) {
        throw new Error('El directorio no existe');
      }

      // Cambiar directorio
      await connection.client.cwd(remotePath);
      const currentPath = await connection.client.cwd();
      
      // Actualizar en la conexión
      connection.currentPath = currentPath;

      return { currentPath };
    } catch (error) {
      console.error('Error al cambiar directorio SFTP:', error);
      throw error;
    }
  }

  /**
   * Obtener el directorio actual
   * @param {string} connectionId - ID de la conexión
   * @returns {Promise<Object>} - { currentPath: string }
   */
  async getCurrentDirectory(connectionId) {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new Error('Conexión no encontrada');
      }

      const currentPath = await connection.client.cwd();
      connection.currentPath = currentPath;

      return { currentPath };
    } catch (error) {
      console.error('Error al obtener directorio actual SFTP:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las conexiones guardadas
   * @returns {Array} - Lista de conexiones guardadas
   */
  getSavedConnections() {
    return this.savedConnections || [];
  }

  /**
   * Guardar una conexión
   * @param {Object} connectionData - Datos de la conexión
   * @returns {Object} - Conexión guardada
   */
  saveConnection(connectionData) {
    const connection = {
      id: connectionData.id || `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: connectionData.name || `${connectionData.host}:${connectionData.port || 22}`,
      host: connectionData.host,
      port: connectionData.port || 22,
      username: connectionData.username,
      // NO guardar contraseña ni clave privada por seguridad
      usePrivateKey: !!connectionData.privateKey,
      createdAt: connectionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Buscar si ya existe
    const existingIndex = this.savedConnections.findIndex(c => c.id === connection.id);
    if (existingIndex >= 0) {
      this.savedConnections[existingIndex] = connection;
    } else {
      this.savedConnections.push(connection);
    }

    this.saveSavedConnections();
    return connection;
  }

  /**
   * Eliminar una conexión guardada
   * @param {string} connectionId - ID de la conexión
   */
  deleteConnection(connectionId) {
    this.savedConnections = this.savedConnections.filter(c => c.id !== connectionId);
    this.saveSavedConnections();
  }
}

// Exportar instancia singleton
module.exports = new SFTPService();

