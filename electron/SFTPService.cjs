/**
 * Servicio para manejar conexiones SFTP (SSH File Transfer Protocol)
 * Usa la librería ssh2-sftp-client para conexiones seguras
 */

const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class SFTPService {
  constructor() {
    this.connections = new Map(); // connectionId -> { client, config, currentPath }
    this.savedConnectionsPath = path.join(app.getPath('userData'), 'sftp-connections.json');
    this.loadSavedConnections();
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
    try {
      const client = new Client();
      
      const connectionConfig = {
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
        // Leer la clave privada desde el archivo
        if (fs.existsSync(config.privateKey)) {
          connectionConfig.privateKey = fs.readFileSync(config.privateKey, 'utf8');
          if (config.passphrase) {
            connectionConfig.passphrase = config.passphrase;
          }
        } else {
          throw new Error('El archivo de clave privada no existe');
        }
      } else if (config.password) {
        connectionConfig.password = config.password;
      } else {
        throw new Error('Debe proporcionar contraseña o clave privada');
      }

      // Conectar al servidor
      await client.connect(connectionConfig);

      // Obtener el directorio actual
      const currentPath = await client.cwd();

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
        currentPath
      });

      return {
        success: true,
        connectionId,
        currentPath
      };
    } catch (error) {
      console.error('Error al conectar SFTP:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al conectar'
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

