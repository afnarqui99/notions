import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { 
  Server, X, Check, AlertCircle, Upload, Download, 
  Folder, FolderOpen, File, RefreshCw, Trash2, 
  Plus, ChevronRight, ChevronDown, Key, Lock, Eye, EyeOff,
  Maximize2, Minimize2, Save, Loader2
} from 'lucide-react';
import BlockWithDeleteButton from '../components/BlockWithDeleteButton';

export default function SFTPNode({ node, updateAttributes, editor, getPos }) {
  const [host, setHost] = useState(node.attrs.host || '');
  const [port, setPort] = useState(node.attrs.port || 22);
  const [username, setUsername] = useState(node.attrs.username || '');
  const [password, setPassword] = useState(node.attrs.password || '');
  const [privateKey, setPrivateKey] = useState(node.attrs.privateKey || '');
  const [passphrase, setPassphrase] = useState(node.attrs.passphrase || '');
  const [usePrivateKey, setUsePrivateKey] = useState(node.attrs.usePrivateKey || false);
  const [connectionId, setConnectionId] = useState(node.attrs.connectionId || null);
  const [connectionName, setConnectionName] = useState(node.attrs.connectionName || '');
  const [isConnected, setIsConnected] = useState(node.attrs.isConnected || false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentPath, setCurrentPath] = useState(node.attrs.currentPath || '/');
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showConnectionForm, setShowConnectionForm] = useState(!isConnected);
  const [showSavedConnections, setShowSavedConnections] = useState(false);
  const [savedConnections, setSavedConnections] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar conexiones guardadas
  useEffect(() => {
    loadSavedConnections();
  }, []);

  // Actualizar atributos cuando cambian los valores
  useEffect(() => {
    updateAttributes({
      host,
      port,
      username,
      password,
      privateKey,
      passphrase,
      usePrivateKey,
      connectionId,
      connectionName,
      isConnected,
      currentPath,
    });
  }, [host, port, username, password, privateKey, passphrase, usePrivateKey, connectionId, connectionName, isConnected, currentPath]);

  // Cargar archivos cuando se conecta o cambia el directorio
  useEffect(() => {
    if (isConnected && connectionId) {
      loadFiles();
    }
  }, [isConnected, connectionId, currentPath]);

  const loadSavedConnections = async () => {
    if (window.electronAPI?.sftpGetSavedConnections) {
      const connections = await window.electronAPI.sftpGetSavedConnections();
      setSavedConnections(connections);
    }
  };

  const loadSavedConnection = (conn) => {
    setHost(conn.host);
    setPort(conn.port || 22);
    setUsername(conn.username);
    setUsePrivateKey(conn.usePrivateKey || false);
    setConnectionName(conn.name);
    // No cargar contraseña ni clave privada por seguridad
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        throw new Error('⚠️ SFTP solo está disponible en la aplicación Electron.');
      }

      if (!window.electronAPI.sftpConnect) {
        throw new Error('API de SFTP no disponible. Por favor, reinicia la aplicación Electron.');
      }

      if (!host || !username) {
        throw new Error('Host y usuario son requeridos');
      }

      if (!usePrivateKey && !password) {
        throw new Error('Debe proporcionar contraseña o usar clave privada');
      }

      if (usePrivateKey && !privateKey) {
        throw new Error('Debe proporcionar la ruta a la clave privada');
      }

      const config = {
        host,
        port: port || 22,
        username,
        password: usePrivateKey ? undefined : password,
        privateKey: usePrivateKey ? privateKey : undefined,
        passphrase: usePrivateKey ? passphrase : undefined,
        name: connectionName || `${host}:${port}`,
      };

      const result = await window.electronAPI.sftpConnect(config);
      if (result.success) {
        setConnectionId(result.connectionId);
        setIsConnected(true);
        setCurrentPath(result.currentPath || '/');
        setShowConnectionForm(false);
        setError(null);
        setToast({ message: 'Conectado exitosamente', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      } else {
        throw new Error(result.error || 'Error al conectar');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error al conectar: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (connectionId && window.electronAPI?.sftpDisconnect) {
      await window.electronAPI.sftpDisconnect(connectionId);
      setConnectionId(null);
      setIsConnected(false);
      setFiles([]);
      setCurrentPath('/');
      setError(null);
      setToast({ message: 'Desconectado', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const loadFiles = async () => {
    if (!connectionId) return;
    
    setLoadingFiles(true);
    setError(null);

    try {
      const result = await window.electronAPI.sftpListFiles(connectionId, currentPath);
      if (result.success) {
        setFiles(result.files || []);
      } else {
        throw new Error(result.error || 'Error al listar archivos');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleChangeDirectory = async (path) => {
    if (!connectionId) return;

    try {
      const result = await window.electronAPI.sftpChangeDirectory(connectionId, path);
      if (result.success) {
        setCurrentPath(result.currentPath);
      } else {
        throw new Error(result.error || 'Error al cambiar directorio');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'directory') {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      handleChangeDirectory(newPath);
    }
  };

  const handleUpload = async (file) => {
    if (!connectionId || !file) return;

    try {
      // En Electron, necesitamos obtener la ruta del archivo
      if (window.electronAPI?.showOpenDialog) {
        const result = await window.electronAPI.showOpenDialog({
          properties: ['openFile'],
        });

        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
          return;
        }

        const localPath = result.filePaths[0];
        const fileName = localPath.split(/[/\\]/).pop();
        const remotePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;

        setLoadingFiles(true);
        const uploadResult = await window.electronAPI.sftpUploadFile(connectionId, localPath, remotePath);
        
        if (uploadResult.success) {
          setToast({ message: 'Archivo subido exitosamente', type: 'success' });
          setTimeout(() => setToast(null), 3000);
          loadFiles();
        } else {
          throw new Error(uploadResult.error || 'Error al subir archivo');
        }
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDownload = async (file) => {
    if (!connectionId || file.type === 'directory') return;

    try {
      if (window.electronAPI?.showSaveDialog) {
        const result = await window.electronAPI.showSaveDialog({
          defaultPath: file.name,
        });

        if (result.canceled || !result.filePath) {
          return;
        }

        const remotePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        const localPath = result.filePath;

        setLoadingFiles(true);
        const downloadResult = await window.electronAPI.sftpDownloadFile(connectionId, remotePath, localPath);
        
        if (downloadResult.success) {
          setToast({ message: 'Archivo descargado exitosamente', type: 'success' });
          setTimeout(() => setToast(null), 3000);
        } else {
          throw new Error(downloadResult.error || 'Error al descargar archivo');
        }
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDelete = async (file) => {
    if (!connectionId || !confirm(`¿Estás seguro de eliminar ${file.name}?`)) return;

    try {
      const remotePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      const result = file.type === 'directory' 
        ? await window.electronAPI.sftpDeleteDirectory(connectionId, remotePath)
        : await window.electronAPI.sftpDeleteFile(connectionId, remotePath);
      
      if (result.success) {
        setToast({ message: 'Eliminado exitosamente', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        loadFiles();
      } else {
        throw new Error(result.error || 'Error al eliminar');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleCreateDirectory = async () => {
    const dirName = prompt('Nombre del directorio:');
    if (!dirName || !connectionId) return;

    try {
      const remotePath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
      const result = await window.electronAPI.sftpCreateDirectory(connectionId, remotePath);
      
      if (result.success) {
        setToast({ message: 'Directorio creado exitosamente', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        loadFiles();
      } else {
        throw new Error(result.error || 'Error al crear directorio');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleSaveConnection = async () => {
    if (!host || !username) {
      setToast({ message: 'Host y usuario son requeridos', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const connectionData = {
        name: connectionName || `${host}:${port}`,
        host,
        port,
        username,
        usePrivateKey,
      };

      const result = await window.electronAPI.sftpSaveConnection(connectionData);
      if (result.success) {
        setToast({ message: 'Conexión guardada', type: 'success' });
        setTimeout(() => setToast(null), 3000);
        loadSavedConnections();
      } else {
        throw new Error(result.error || 'Error al guardar conexión');
      }
    } catch (err) {
      setError(err.message);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <NodeViewWrapper className="sftp-block-wrapper">
      <BlockWithDeleteButton
        onDelete={() => {
          if (isConnected) {
            handleDisconnect();
          }
          if (getPos && typeof getPos === 'function') {
            editor.chain().focus().setTextSelection(getPos()).deleteSelection().run();
          }
        }}
      >
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${isMinimized ? '' : 'p-4'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                SFTP - {connectionName || 'Conexión SFTP'}
              </h3>
              {isConnected && (
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                  Conectado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isConnected && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div className={`mb-4 p-3 rounded ${
              toast.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              {toast.message}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!isMinimized && (
            <>
              {/* Formulario de conexión */}
              {showConnectionForm && (
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Configuración de conexión</h4>
                    {savedConnections.length > 0 && (
                      <button
                        onClick={() => setShowSavedConnections(!showSavedConnections)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {showSavedConnections ? 'Ocultar' : 'Ver'} conexiones guardadas
                      </button>
                    )}
                  </div>

                  {showSavedConnections && savedConnections.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                      <div className="text-sm font-medium mb-2">Conexiones guardadas:</div>
                      <div className="space-y-1">
                        {savedConnections.map((conn) => (
                          <button
                            key={conn.id}
                            onClick={() => loadSavedConnection(conn)}
                            className="w-full text-left px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded text-sm"
                          >
                            {conn.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Host *
                      </label>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="ejemplo.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Puerto
                      </label>
                      <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(parseInt(e.target.value) || 22)}
                        placeholder="22"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="usuario"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <input
                        type="checkbox"
                        checked={usePrivateKey}
                        onChange={(e) => setUsePrivateKey(e.target.checked)}
                        className="rounded"
                      />
                      Usar clave privada SSH
                    </label>
                  </div>

                  {!usePrivateKey ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="contraseña"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ruta a clave privada *
                        </label>
                        <input
                          type="text"
                          value={privateKey}
                          onChange={(e) => setPrivateKey(e.target.value)}
                          placeholder="/ruta/a/clave_privada"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Frase de contraseña (opcional)
                        </label>
                        <div className="relative">
                          <input
                            type={showPassphrase ? 'text' : 'password'}
                            value={passphrase}
                            onChange={(e) => setPassphrase(e.target.value)}
                            placeholder="frase secreta"
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassphrase(!showPassphrase)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                          >
                            {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de conexión (opcional)
                    </label>
                    <input
                      type="text"
                      value={connectionName}
                      onChange={(e) => setConnectionName(e.target.value)}
                      placeholder={`${host || 'servidor'}:${port}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Conectar
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSaveConnection}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Explorador de archivos */}
              {isConnected && (
                <div className="space-y-4">
                  {/* Barra de navegación */}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ruta:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">{currentPath}</span>
                    <button
                      onClick={loadFiles}
                      disabled={loadingFiles}
                      className="ml-auto p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpload()}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Subir archivo
                    </button>
                    <button
                      onClick={handleCreateDirectory}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo directorio
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="ml-auto px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Desconectar
                    </button>
                  </div>

                  {/* Lista de archivos */}
                  {loadingFiles ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay archivos en este directorio
                    </div>
                  ) : (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Nombre</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tipo</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tamaño</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Modificado</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {files.map((file, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => handleFileClick(file)}
                                  className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {file.type === 'directory' ? (
                                    <FolderOpen className="w-4 h-4" />
                                  ) : (
                                    <File className="w-4 h-4" />
                                  )}
                                  {file.name}
                                </button>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {file.type === 'directory' ? 'Directorio' : 'Archivo'}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(file.modified)}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center justify-end gap-2">
                                  {file.type === 'file' && (
                                    <button
                                      onClick={() => handleDownload(file)}
                                      className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                                      title="Descargar"
                                    >
                                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(file)}
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </BlockWithDeleteButton>
    </NodeViewWrapper>
  );
}

