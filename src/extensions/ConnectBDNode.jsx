import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef, Fragment } from 'react';
import React from 'react';
import { 
  Database, Play, Save, X, Check, AlertCircle, Copy, 
  Maximize2, Minimize2, ChevronRight, ChevronDown, 
  FolderOpen, Table, RefreshCw, Trash2, Plus, Edit2,
  History, Clock, FileText, Download, Upload, CheckCircle, ExternalLink, Eye
} from 'lucide-react';
import BlockWithDeleteButton from '../components/BlockWithDeleteButton';
import { createPortal } from 'react-dom';

export default function ConnectBDNode({ node, updateAttributes, editor, getPos }) {
  const [dbType, setDbType] = useState(node.attrs.dbType || 'postgresql');
  const [host, setHost] = useState(node.attrs.host || '');
  const [port, setPort] = useState(node.attrs.port || '');
  const [database, setDatabase] = useState(node.attrs.database || '');
  const [username, setUsername] = useState(node.attrs.username || '');
  const [password, setPassword] = useState(node.attrs.password || '');
  const [ssl, setSsl] = useState(node.attrs.ssl || false);
  const [connectionId, setConnectionId] = useState(node.attrs.connectionId || null);
  const [connectionName, setConnectionName] = useState(node.attrs.connectionName || '');
  const [isConnected, setIsConnected] = useState(node.attrs.isConnected || false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState(() => {
    try {
      return node.attrs.queryHistory ? JSON.parse(node.attrs.queryHistory) : [];
    } catch {
      return [];
    }
  });
  const [savedQueries, setSavedQueries] = useState(() => {
    try {
      return node.attrs.savedQueries ? JSON.parse(node.attrs.savedQueries) : [];
    } catch {
      return [];
    }
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [storedProcedures, setStoredProcedures] = useState([]);
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({ tables: true, procedures: true });
  const [tableColumns, setTableColumns] = useState({});
  const [showConnectionForm, setShowConnectionForm] = useState(!isConnected);
  const [showSavedConnections, setShowSavedConnections] = useState(false);
  const [savedConnections, setSavedConnections] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showSelectedRows, setShowSelectedRows] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewFormat, setPreviewFormat] = useState('json'); // 'json' o 'text'
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const queryEditorRef = useRef(null);
  const fullscreenRef = useRef(null);

  // Manejar atajo de teclado Ctrl+Enter para ejecutar consulta
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isConnected && !isExecuting && query.trim()) {
          e.preventDefault();
          handleExecuteQuery();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConnected, isExecuting, query]);

  // Cargar conexiones guardadas
  useEffect(() => {
    loadSavedConnections();
    
    // Verificar que la API esté disponible al montar el componente
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('✅ electronAPI disponible:', Object.keys(window.electronAPI).filter(k => k.startsWith('db')));
    } else {
      console.warn('⚠️ electronAPI no disponible');
    }
  }, []);

  // Actualizar atributos cuando cambian los valores
  useEffect(() => {
    updateAttributes({
      dbType,
      host,
      port,
      database,
      username,
      password,
      ssl,
      connectionId,
      connectionName,
      isConnected,
      queryHistory: JSON.stringify(queryHistory),
      savedQueries: JSON.stringify(savedQueries),
    });
  }, [dbType, host, port, database, username, password, ssl, connectionId, connectionName, isConnected, queryHistory, savedQueries]);

  // Cargar conexiones guardadas
  const loadSavedConnections = async () => {
    if (window.electronAPI?.dbGetSavedConnections) {
      const connections = await window.electronAPI.dbGetSavedConnections();
      setSavedConnections(connections);
    }
  };

  // Cargar una conexión guardada
  const loadSavedConnection = (conn) => {
    setDbType(conn.type);
    setHost(conn.host);
    setPort(conn.port || '');
    setDatabase(conn.database);
    setUsername(conn.username);
    setPassword(conn.password);
    setSsl(conn.ssl || false);
    setConnectionName(conn.name);
  };

  // Conectar a la base de datos
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Verificar que estamos en Electron y que la API está disponible
      if (typeof window === 'undefined' || !window.electronAPI) {
        throw new Error('⚠️ La conexión a bases de datos solo está disponible en la aplicación Electron. Por favor, ejecuta la aplicación desde Electron (no desde el navegador).');
      }

      if (!window.electronAPI.dbConnect) {
        console.error('electronAPI disponible:', !!window.electronAPI);
        console.error('dbConnect disponible:', !!window.electronAPI.dbConnect);
        console.error('Métodos disponibles:', Object.keys(window.electronAPI || {}));
        throw new Error('API de base de datos no disponible. Por favor, reinicia la aplicación Electron.');
      }

      const config = {
        type: dbType,
        host,
        port: port ? parseInt(port) : undefined,
        database,
        username,
        password,
        ssl,
      };

      const result = await window.electronAPI.dbConnect(config);
      if (result.success) {
        setConnectionId(result.connectionId);
        setIsConnected(true);
        setShowConnectionForm(false);
        setError(null);
        
        // Cargar tablas y procedimientos almacenados
        await loadTables(result.connectionId);
        await loadStoredProcedures(result.connectionId);
        
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

  // Desconectar
  const handleDisconnect = async () => {
    if (connectionId && window.electronAPI?.dbDisconnect) {
      await window.electronAPI.dbDisconnect(connectionId);
      setConnectionId(null);
      setIsConnected(false);
      setTables([]);
      setStoredProcedures([]);
      setTableColumns({});
      setQueryResult(null);
      setError(null);
      setToast({ message: 'Desconectado', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Cargar tablas
  const loadTables = async (connId) => {
    try {
      if (window.electronAPI?.dbGetTables) {
        const tablesList = await window.electronAPI.dbGetTables(connId);
        if (tablesList.error) {
          console.error('Error cargando tablas:', tablesList.error);
        } else {
          setTables(tablesList);
        }
      }
    } catch (err) {
      console.error('Error cargando tablas:', err);
    }
  };

  // Cargar procedimientos almacenados
  const loadStoredProcedures = async (connId) => {
    try {
      if (!window.electronAPI?.dbGetStoredProcedures) {
        console.warn('dbGetStoredProcedures no disponible, omitiendo carga de procedimientos');
        return;
      }
      const proceduresList = await window.electronAPI.dbGetStoredProcedures(connId);
      if (proceduresList.error) {
        console.error('Error cargando procedimientos:', proceduresList.error);
      } else {
        setStoredProcedures(proceduresList);
      }
    } catch (err) {
      console.error('Error cargando procedimientos:', err);
      // No lanzar error, solo registrar
    }
  };

  // Expandir/colapsar tabla
  const toggleTable = async (schema, tableName) => {
    const key = `${schema}.${tableName}`;
    const newExpanded = new Set(expandedTables);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // Cargar columnas si no están cargadas
      if (!tableColumns[key] && window.electronAPI?.dbGetTableColumns) {
        try {
          const columns = await window.electronAPI.dbGetTableColumns(connectionId, schema, tableName);
          if (columns.error) {
            console.error('Error cargando columnas:', columns.error);
          } else {
            setTableColumns(prev => ({ ...prev, [key]: columns }));
          }
        } catch (err) {
          console.error('Error cargando columnas:', err);
        }
      }
    }
    
    setExpandedTables(newExpanded);
  };

  // Ejecutar consulta
  const handleExecuteQuery = async () => {
    if (!connectionId || !query.trim()) {
      setToast({ message: 'Escribe una consulta SQL', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!window.electronAPI?.dbExecuteQuery) {
      setToast({ message: 'API de base de datos no disponible', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsExecuting(true);
    setError(null);
    setQueryResult(null);

    try {
      const result = await window.electronAPI.dbExecuteQuery(connectionId, query);
      setQueryResult(result);
      
      // Agregar al historial
      const newHistory = [
        { query, timestamp: new Date().toISOString(), success: true },
        ...queryHistory.slice(0, 49) // Mantener solo las últimas 50
      ];
      setQueryHistory(newHistory);
      
      setToast({ message: `Consulta ejecutada en ${result.executionTime}ms`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setError(err.message);
      setQueryResult(null);
      
      // Agregar al historial con error
      const newHistory = [
        { query, timestamp: new Date().toISOString(), success: false, error: err.message },
        ...queryHistory.slice(0, 49)
      ];
      setQueryHistory(newHistory);
      
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsExecuting(false);
    }
  };

  // Guardar conexión
  const handleSaveConnection = async () => {
    if (!host || !database || !username) {
      setToast({ message: 'Completa los campos requeridos', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!window.electronAPI?.dbSaveConnection) {
      setToast({ message: 'API de base de datos no disponible', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const name = connectionName || `${dbType} - ${host}/${database}`;
      const result = await window.electronAPI.dbSaveConnection({
        id: connectionId,
        name,
        type: dbType,
        host,
        port: port || undefined,
        database,
        username,
        password,
        ssl,
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      await loadSavedConnections();
      setToast({ message: 'Conexión guardada', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: `Error guardando conexión: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    }
  };

  // Guardar consulta
  const handleSaveQuery = () => {
    if (!query.trim()) {
      setToast({ message: 'Escribe una consulta para guardar', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const queryName = prompt('Nombre de la consulta:');
    if (queryName) {
      const newSavedQueries = [
        { id: Date.now(), name: queryName, query, timestamp: new Date().toISOString() },
        ...savedQueries
      ];
      setSavedQueries(newSavedQueries);
      setToast({ message: 'Consulta guardada', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Cargar consulta guardada
  const loadSavedQuery = (savedQuery) => {
    setQuery(savedQuery.query);
    setShowSavedQueries(false);
  };

  // Cargar consulta del historial
  const loadHistoryQuery = (historyItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
  };

  // Copiar resultado
  const handleCopyResult = async () => {
    if (!queryResult) return;
    
    try {
      const rowsToCopy = selectedRows.size > 0 
        ? queryResult.rows.filter((_, idx) => selectedRows.has(idx))
        : queryResult.rows;
      const text = JSON.stringify(rowsToCopy, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToast({ message: `${rowsToCopy.length} fila(s) copiada(s)`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error al copiar:', err);
      setToast({ message: 'Error al copiar', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleExportJSON = () => {
    if (!queryResult) return;
    try {
      const rowsToExport = selectedRows.size > 0 
        ? queryResult.rows.filter((_, idx) => selectedRows.has(idx))
        : queryResult.rows;
      const json = JSON.stringify(rowsToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-results-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: `${rowsToExport.length} fila(s) exportada(s) como JSON`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error exportando JSON:', error);
      setToast({ message: 'Error al exportar JSON', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleExportText = () => {
    if (!queryResult) return;
    try {
      const rowsToExport = selectedRows.size > 0 
        ? queryResult.rows.filter((_, idx) => selectedRows.has(idx))
        : queryResult.rows;
      
      // Crear texto tabular
      let text = '';
      if (rowsToExport.length > 0) {
        // Encabezados
        text += queryResult.columns.map(col => col.name).join('\t') + '\n';
        // Filas
        rowsToExport.forEach(row => {
          const plainRow = row && typeof row === 'object' ? row : {};
          const values = queryResult.columns.map(col => {
            const value = plainRow[col.name] !== undefined ? plainRow[col.name] : 
                         plainRow[col.name.toLowerCase()] !== undefined ? plainRow[col.name.toLowerCase()] :
                         null;
            return value !== null && value !== undefined ? String(value) : 'NULL';
          });
          text += values.join('\t') + '\n';
        });
      }
      
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-results-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: `${rowsToExport.length} fila(s) exportada(s) como texto`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error exportando texto:', error);
      setToast({ message: 'Error al exportar texto', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleToggleRowSelection = (rowIdx) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowIdx)) {
        newSet.delete(rowIdx);
      } else {
        newSet.add(rowIdx);
      }
      // Actualizar preview automáticamente
      if (newSet.size > 0 && queryResult) {
        const selectedData = queryResult.rows.filter((_, idx) => newSet.has(idx));
        setPreviewData(selectedData);
        if (!showSelectedRows) {
          setShowSelectedRows(true);
        }
      } else {
        setPreviewData(null);
        setShowSelectedRows(false);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!queryResult) return;
    if (selectedRows.size === queryResult.rows.length) {
      setSelectedRows(new Set());
      setPreviewData(null);
      setShowSelectedRows(false);
    } else {
      const allIndices = new Set(queryResult.rows.map((_, idx) => idx));
      setSelectedRows(allIndices);
      setPreviewData(queryResult.rows);
      setShowSelectedRows(true);
    }
  };

  const handlePreviewRow = (rowIdx) => {
    if (!queryResult) return;
    const row = queryResult.rows[rowIdx];
    setPreviewData([row]);
    setShowSelectedRows(true);
    // También seleccionar la fila si no está seleccionada
    if (!selectedRows.has(rowIdx)) {
      setSelectedRows(prev => new Set([...prev, rowIdx]));
    }
  };

  const getPreviewContent = () => {
    if (!previewData || previewData.length === 0) return '';
    
    if (previewFormat === 'json') {
      return JSON.stringify(previewData, null, 2);
    } else {
      // Formato texto tabular
      if (!queryResult) return '';
      let text = '';
      if (previewData.length > 0) {
        // Encabezados
        text += queryResult.columns.map(col => col.name).join('\t') + '\n';
        // Filas
        previewData.forEach(row => {
          const plainRow = row && typeof row === 'object' ? row : {};
          const values = queryResult.columns.map(col => {
            const value = plainRow[col.name] !== undefined ? plainRow[col.name] : 
                         plainRow[col.name.toLowerCase()] !== undefined ? plainRow[col.name.toLowerCase()] :
                         null;
            return value !== null && value !== undefined ? String(value) : 'NULL';
          });
          text += values.join('\t') + '\n';
        });
      }
      return text;
    }
  };

  // Limpiar selección cuando cambian los resultados
  useEffect(() => {
    setSelectedRows(new Set());
    setPreviewData(null);
    setShowSelectedRows(false);
  }, [queryResult]);

  // Fullscreen y Minimizar
  const handleFullscreen = () => {
    setIsFullscreen(true);
    setIsMinimized(false);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Obtener puerto por defecto
  const getDefaultPort = () => {
    switch (dbType) {
      case 'postgresql': return '5432';
      case 'mysql': return '3306';
      case 'sqlserver': return '1433';
      default: return '';
    }
  };

  // Establecer puerto por defecto cuando cambia el tipo
  useEffect(() => {
    if (!port) {
      setPort(getDefaultPort());
    }
  }, [dbType]);

  const renderConnectionForm = () => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    
    // Si no está en Electron, mostrar mensaje informativo
    if (!isElectron) {
      return (
        <div className="space-y-4 p-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-6">
              <Database className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">
                Conexión a Bases de Datos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Esta funcionalidad está disponible solo en la versión instalada de la aplicación.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Descarga el Instalador
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    Para usar la conexión a bases de datos (PostgreSQL, MySQL, SQL Server), 
                    necesitas descargar e instalar la aplicación desde GitHub.
                  </p>
                  <a
                    href="https://github.com/afnarqui99/notions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Descargar desde GitHub
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-2">✨ Características disponibles en el instalador:</p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Conexión a PostgreSQL, MySQL y SQL Server</li>
                <li>Ejecución de consultas SQL</li>
                <li>Visualización de tablas y procedimientos almacenados</li>
                <li>Historial de consultas</li>
                <li>Guardado de conexiones</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Conectar a Base de Datos
          </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSavedConnections(!showSavedConnections)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Conexiones guardadas
          </button>
        </div>
      </div>

      {showSavedConnections && savedConnections.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-3 max-h-48 overflow-y-auto">
          {savedConnections.map(conn => (
            <div
              key={conn.id}
              className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer mb-1"
              onClick={() => loadSavedConnection(conn)}
            >
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-200">{conn.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{conn.type} - {conn.host}/{conn.database}</div>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.electronAPI?.dbDeleteConnection) {
                    await window.electronAPI.dbDeleteConnection(conn.id);
                    await loadSavedConnections();
                  }
                }}
                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Base de Datos
          </label>
          <select
            value={dbType}
            onChange={(e) => setDbType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlserver">SQL Server</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Host
          </label>
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="localhost"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Puerto
          </label>
          <input
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder={getDefaultPort()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Base de Datos
          </label>
          <input
            type="text"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            placeholder="nombre_db"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="usuario"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ssl}
            onChange={(e) => setSsl(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Usar SSL</span>
        </label>
        <input
          type="text"
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          placeholder="Nombre de la conexión (opcional)"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleConnect}
          disabled={isConnecting || !host || !database || !username || !isElectron}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title={!isElectron ? 'Solo disponible en Electron' : ''}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar conexión
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
  };

  const renderMainContent = () => (
    <div className="flex flex-col" style={{ minHeight: '500px' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          {isConnected && (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {connectionName || `${dbType} - ${host}/${database}`}
              </span>
              <button
                onClick={() => loadTables(connectionId)}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Actualizar tablas"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Historial de consultas"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSavedQueries(!showSavedQueries)}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Consultas guardadas"
          >
            <FileText className="w-4 h-4" />
          </button>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Desconectar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Tablas y Procedimientos */}
          {isConnected && (
            <div className="w-64 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 overflow-y-auto flex flex-col">
              {/* Sección Tablas */}
              <div className="flex-shrink-0">
                <div 
                  className="p-2 font-semibold text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setExpandedSections(prev => ({ ...prev, tables: !prev.tables }))}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.tables ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Tablas ({tables.length})</span>
                  </div>
                </div>
                {expandedSections.tables && (
                  <div className="max-h-64 overflow-y-auto">
                    {tables.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No hay tablas disponibles
                      </div>
                    ) : (
                      <div className="p-2">
                        {tables.map((table, idx) => {
                          const key = `${table.table_schema || 'public'}.${table.table_name}`;
                          const isExpanded = expandedTables.has(key);
                          const columns = tableColumns[key] || [];
                          
                          return (
                            <div key={idx} className="mb-1">
                              <div
                                className="flex items-center gap-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                                onClick={() => toggleTable(table.table_schema || 'public', table.table_name)}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <Table className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                                  {table.table_name}
                                </span>
                              </div>
                              {isExpanded && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {columns.map((col, colIdx) => (
                                    <div key={colIdx} className="text-xs text-gray-600 dark:text-gray-400 pl-2">
                                      {col.column_name} <span className="text-gray-400">({col.data_type})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sección Procedimientos Almacenados */}
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-600">
                <div 
                  className="p-2 font-semibold text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setExpandedSections(prev => ({ ...prev, procedures: !prev.procedures }))}
                >
                  <div className="flex items-center gap-2">
                    {expandedSections.procedures ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Procedimientos ({storedProcedures.length})</span>
                  </div>
                </div>
                {expandedSections.procedures && (
                  <div className="max-h-64 overflow-y-auto">
                    {storedProcedures.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No hay procedimientos almacenados
                      </div>
                    ) : (
                      <div className="p-2">
                        {storedProcedures.map((proc, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-1 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer mb-1"
                            onClick={() => {
                              const procName = proc.procedure_name || proc.routine_name;
                              setQuery(`EXEC ${procName}`);
                            }}
                          >
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                              {proc.procedure_name || proc.routine_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Editor SQL y Resultados */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Editor SQL */}
            <div className="flex-1 flex flex-col border-b border-gray-200 dark:border-gray-600 min-h-0" style={{ minHeight: '200px' }}>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Editor SQL</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveQuery}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Guardar consulta"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExecuteQuery}
                    disabled={!isConnected || isExecuting || !query.trim()}
                    className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Ejecutar
                      </>
                    )}
                  </button>
                </div>
              </div>
              <textarea
                ref={queryEditorRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (isConnected && !isExecuting && query.trim()) {
                      handleExecuteQuery();
                    }
                  }
                }}
                placeholder="Escribe tu consulta SQL aquí... (Ctrl+Enter para ejecutar)"
                className="flex-1 w-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none resize-none"
                style={{ 
                  fontFamily: 'monospace',
                  tabSize: 2,
                  lineHeight: '1.6'
                }}
                spellCheck={false}
              />
            </div>

            {/* Resultados */}
            <div className="flex flex-col border-t border-gray-200 dark:border-gray-600" style={{ height: '300px', minHeight: '200px', maxHeight: '50vh' }}>
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Resultados {queryResult && `(${queryResult.rowCount} filas, ${queryResult.executionTime}ms)`}
                  </span>
                  {selectedRows.size > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      ({selectedRows.size} seleccionada{selectedRows.size > 1 ? 's' : ''})
                    </span>
                  )}
                </div>
                {queryResult && (
                  <div className="flex items-center gap-1">
                    {selectedRows.size > 0 && (
                      <button
                        onClick={() => {
                          if (showSelectedRows) {
                            setShowSelectedRows(false);
                            setPreviewData(null);
                          } else {
                            const selectedData = queryResult.rows.filter((_, idx) => selectedRows.has(idx));
                            setPreviewData(selectedData);
                            setShowSelectedRows(true);
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          showSelectedRows 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={showSelectedRows ? "Ocultar previsualización" : "Mostrar previsualización"}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleExportJSON}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Exportar como JSON"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleExportText}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Exportar como texto"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopyResult}
                      className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Copiar resultados"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}
              </div>
            <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
              {error ? (
                <div className="p-4 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              ) : queryResult ? (
                <div className="overflow-auto h-full" style={{ overflowX: 'auto', overflowY: 'auto' }}>
                  <table className="text-sm border-collapse" style={{ tableLayout: 'auto', minWidth: '100%' }}>
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-2 border-b border-r border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold" style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={selectedRows.size === queryResult.rows.length && queryResult.rows.length > 0}
                            onChange={handleSelectAll}
                            className="cursor-pointer"
                            title="Seleccionar todas"
                          />
                        </th>
                        {queryResult.columns.map((col, idx) => (
                          <th 
                            key={idx} 
                            className="px-3 py-2 text-left border-b border-r border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold whitespace-nowrap"
                            style={{ minWidth: '100px', maxWidth: '300px' }}
                          >
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, rowIdx) => {
                        // Asegurar que row sea un objeto plano
                        const plainRow = row && typeof row === 'object' ? row : {};
                        const isSelected = selectedRows.has(rowIdx);
                        return (
                          <tr 
                            key={rowIdx} 
                            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''} cursor-pointer`}
                            onClick={() => handlePreviewRow(rowIdx)}
                          >
                            <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRowSelection(rowIdx)}
                                className="cursor-pointer"
                              />
                            </td>
                            {queryResult.columns.map((col, colIdx) => {
                              // Obtener el valor de la columna, manejando diferentes formatos
                              let cellValue = null;
                              if (plainRow && typeof plainRow === 'object') {
                                // Intentar obtener el valor por nombre de columna
                                cellValue = plainRow[col.name] !== undefined ? plainRow[col.name] : 
                                           plainRow[col.name.toLowerCase()] !== undefined ? plainRow[col.name.toLowerCase()] :
                                           null;
                              }
                              
                              // Convertir a string de forma segura
                              let displayValue = '';
                              if (cellValue === null || cellValue === undefined) {
                                displayValue = null;
                              } else if (typeof cellValue === 'object') {
                                // Si es un objeto, intentar serializarlo
                                try {
                                  displayValue = JSON.stringify(cellValue);
                                } catch {
                                  displayValue = String(cellValue);
                                }
                              } else {
                                displayValue = String(cellValue);
                              }
                              
                              return (
                                <td 
                                  key={colIdx} 
                                  className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700"
                                  style={{ 
                                    maxWidth: '300px', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={displayValue !== null ? displayValue : 'NULL'}
                                >
                                  {displayValue !== null 
                                    ? <span className="truncate block">{displayValue}</span>
                                    : <span className="text-gray-400 italic">NULL</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                  Los resultados aparecerán aquí...
                </div>
              )}
              </div>
            </div>

            {/* Panel de Previsualización */}
            {showSelectedRows && previewData && previewData.length > 0 && (
              <>
                {isPreviewFullscreen ? (
                  <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200">
                          Previsualización ({previewData.length} fila{previewData.length > 1 ? 's' : ''})
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewFormat('json')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              previewFormat === 'json' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => setPreviewFormat('text')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              previewFormat === 'text' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            Texto
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsPreviewFullscreen(false)}
                          className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                          title="Salir de pantalla completa"
                        >
                          <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowSelectedRows(false);
                            setPreviewData(null);
                            setIsPreviewFullscreen(false);
                          }}
                          className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                          title="Cerrar previsualización"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
                      <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap break-words">
                        {getPreviewContent()}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800" style={{ height: '250px', minHeight: '200px', maxHeight: '40vh' }}>
                    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Previsualización ({previewData.length} fila{previewData.length > 1 ? 's' : ''})
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPreviewFormat('json')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              previewFormat === 'json' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => setPreviewFormat('text')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              previewFormat === 'text' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            Texto
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsPreviewFullscreen(true)}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Pantalla completa"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setShowSelectedRows(false);
                            setPreviewData(null);
                          }}
                          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          title="Cerrar previsualización"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900" style={{ maxHeight: 'calc(100% - 50px)' }}>
                      <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                        {getPreviewContent()}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Historial */}
      {showHistory && (
        <div className="absolute right-4 top-12 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-200">Historial</span>
            <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            {queryHistory.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center p-4">No hay historial</div>
            ) : (
              queryHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 mb-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => loadHistoryQuery(item)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {item.success ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <pre className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                    {item.query.substring(0, 100)}{item.query.length > 100 ? '...' : ''}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Consultas guardadas */}
      {showSavedQueries && (
        <div className="absolute right-4 top-12 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-200">Consultas guardadas</span>
            <button onClick={() => setShowSavedQueries(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2">
            {savedQueries.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center p-4">No hay consultas guardadas</div>
            ) : (
              savedQueries.map((item) => (
                <div
                  key={item.id}
                  className="p-2 mb-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => loadSavedQuery(item)}
                >
                  <div className="font-medium text-gray-700 dark:text-gray-200 mb-1">{item.name}</div>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words">
                    {item.query.substring(0, 100)}{item.query.length > 100 ? '...' : ''}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <NodeViewWrapper className="connect-bd-node my-4">
      <BlockWithDeleteButton editor={editor} getPos={getPos} node={node}>
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 relative" style={{ minHeight: '500px' }}>
            {!isConnected || showConnectionForm ? renderConnectionForm() : renderMainContent()}
            
            {/* Botones de control en la esquina superior izquierda */}
            {!showConnectionForm && isConnected && (
              <div className="absolute top-2 left-2 flex items-center gap-2 z-[60]">
                <button
                  onClick={handleMinimize}
                  className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title={isMinimized ? "Expandir" : "Minimizar"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title="Ampliar pantalla"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowConnectionForm(true)}
                  className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title="Mostrar formulario de conexión"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Toast */}
          {toast && (
            <div className={`
              fixed bottom-4 right-4 z-50
              ${toast.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }
              border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[400px]
            `}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button onClick={() => setToast(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </BlockWithDeleteButton>
      {/* Modal Fullscreen */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[50000] bg-gray-900 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">
                  {connectionName || `${dbType} - ${host}/${database}` || 'Conectar BD'}
                </h2>
                {isConnected && (
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Conectado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isConnected && (
                  <>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                      title="Historial de consultas"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowSavedQueries(!showSavedQueries)}
                      className="p-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
                      title="Consultas guardadas"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleExecuteQuery}
                      disabled={isExecuting || !query.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isExecuting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Ejecutando...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Ejecutar
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={handleExitFullscreen}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  Minimizar
                </button>
              </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
              {!isConnected || showConnectionForm ? (
                <div className="flex-1 overflow-auto p-6">
                  {renderConnectionForm()}
                </div>
              ) : (
                <div className="flex flex-1 overflow-hidden">
                  {/* Sidebar - Tablas y Procedimientos */}
                  <div className="w-64 border-r border-gray-700 bg-gray-800 overflow-y-auto flex flex-col">
                    {/* Sección Tablas */}
                    <div className="flex-shrink-0">
                      <div 
                        className="p-2 font-semibold text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-700"
                        onClick={() => setExpandedSections(prev => ({ ...prev, tables: !prev.tables }))}
                      >
                        <div className="flex items-center gap-2">
                          {expandedSections.tables ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span>Tablas ({tables.length})</span>
                        </div>
                      </div>
                      {expandedSections.tables && (
                        <div className="max-h-64 overflow-y-auto">
                          {tables.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              No hay tablas disponibles
                            </div>
                          ) : (
                            <div className="p-2">
                              {tables.map((table, idx) => {
                                const key = `${table.table_schema || 'public'}.${table.table_name}`;
                                const isExpanded = expandedTables.has(key);
                                const columns = tableColumns[key] || [];
                                
                                return (
                                  <div key={idx} className="mb-1">
                                    <div
                                      className="flex items-center gap-1 p-1 hover:bg-gray-700 rounded cursor-pointer"
                                      onClick={() => toggleTable(table.table_schema || 'public', table.table_name)}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                      )}
                                      <Table className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-300 truncate">
                                        {table.table_name}
                                      </span>
                                    </div>
                                    {isExpanded && (
                                      <div className="ml-6 mt-1 space-y-1">
                                        {columns.map((col, colIdx) => (
                                          <div key={colIdx} className="text-xs text-gray-500 pl-2">
                                            {col.column_name} <span className="text-gray-600">({col.data_type})</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sección Procedimientos Almacenados */}
                    <div className="flex-shrink-0 border-t border-gray-700">
                      <div 
                        className="p-2 font-semibold text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-700"
                        onClick={() => setExpandedSections(prev => ({ ...prev, procedures: !prev.procedures }))}
                      >
                        <div className="flex items-center gap-2">
                          {expandedSections.procedures ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span>Procedimientos ({storedProcedures.length})</span>
                        </div>
                      </div>
                      {expandedSections.procedures && (
                        <div className="max-h-64 overflow-y-auto">
                          {storedProcedures.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              No hay procedimientos almacenados
                            </div>
                          ) : (
                            <div className="p-2">
                              {storedProcedures.map((proc, idx) => (
                                <div 
                                  key={idx} 
                                  className="flex items-center gap-1 p-1 hover:bg-gray-700 rounded cursor-pointer mb-1"
                                  onClick={() => {
                                    const procName = proc.procedure_name || proc.routine_name;
                                    setQuery(`EXEC ${procName}`);
                                  }}
                                >
                                  <FileText className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm text-gray-300 truncate">
                                    {proc.procedure_name || proc.routine_name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editor SQL y Resultados */}
                  <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                    {/* Editor SQL */}
                    <div className="flex-1 flex flex-col border-b border-gray-700 min-h-0" style={{ minHeight: '200px' }}>
                      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                        <span className="text-sm font-medium text-gray-300">Editor SQL</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveQuery}
                            className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                            title="Guardar consulta"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        ref={fullscreenRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            if (isConnected && !isExecuting && query.trim()) {
                              handleExecuteQuery();
                            }
                          }
                        }}
                        placeholder="Escribe tu consulta SQL aquí... (Ctrl+Enter para ejecutar)"
                        className="flex-1 w-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none resize-none"
                        style={{ 
                          fontFamily: 'monospace',
                          tabSize: 2,
                          lineHeight: '1.6'
                        }}
                        spellCheck={false}
                      />
                    </div>

                    {/* Resultados */}
                    <div className="flex flex-col border-t border-gray-700" style={{ height: '300px', minHeight: '200px', maxHeight: '50vh' }}>
                      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-300">
                            Resultados {queryResult && `(${queryResult.rowCount} filas, ${queryResult.executionTime}ms)`}
                          </span>
                          {selectedRows.size > 0 && (
                            <span className="text-xs text-blue-400">
                              ({selectedRows.size} seleccionada{selectedRows.size > 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        {queryResult && (
                          <div className="flex items-center gap-1">
                            {selectedRows.size > 0 && (
                              <button
                                onClick={() => {
                                  if (showSelectedRows) {
                                    setShowSelectedRows(false);
                                    setPreviewData(null);
                                  } else {
                                    const selectedData = queryResult.rows.filter((_, idx) => selectedRows.has(idx));
                                    setPreviewData(selectedData);
                                    setShowSelectedRows(true);
                                  }
                                }}
                                className={`p-1.5 rounded transition-colors ${
                                  showSelectedRows 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'text-gray-400 hover:bg-gray-700'
                                }`}
                                title={showSelectedRows ? "Ocultar previsualización" : "Mostrar previsualización"}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={handleExportJSON}
                              className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                              title="Exportar como JSON"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleExportText}
                              className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                              title="Exportar como texto"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCopyResult}
                              className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                              title="Copiar resultados"
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 overflow-auto bg-gray-900" style={{ overflowX: 'auto', overflowY: 'auto' }}>
                        {error ? (
                          <div className="p-4 text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                          </div>
                        ) : queryResult ? (
                          <div className="overflow-auto h-full" style={{ overflowX: 'auto', overflowY: 'auto' }}>
                            <table className="text-sm border-collapse" style={{ tableLayout: 'auto', minWidth: '100%' }}>
                              <thead className="bg-gray-800 sticky top-0 z-10">
                                <tr>
                                  <th className="px-2 py-2 border-b border-r border-gray-700 text-gray-300 font-semibold" style={{ width: '40px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedRows.size === queryResult.rows.length && queryResult.rows.length > 0}
                                      onChange={handleSelectAll}
                                      className="cursor-pointer"
                                      title="Seleccionar todas"
                                    />
                                  </th>
                                  {queryResult.columns.map((col, idx) => (
                                    <th 
                                      key={idx} 
                                      className="px-3 py-2 text-left border-b border-r border-gray-700 text-gray-300 font-semibold whitespace-nowrap"
                                      style={{ minWidth: '100px', maxWidth: '300px' }}
                                    >
                                      {col.name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.rows.map((row, rowIdx) => {
                                  // Asegurar que row sea un objeto plano
                                  const plainRow = row && typeof row === 'object' ? row : {};
                                  const isSelected = selectedRows.has(rowIdx);
                                  return (
                                    <tr 
                                      key={rowIdx} 
                                      className={`border-b border-gray-800 hover:bg-gray-800 ${isSelected ? 'bg-blue-900/20' : ''} cursor-pointer`}
                                      onClick={() => handlePreviewRow(rowIdx)}
                                    >
                                      <td className="px-2 py-2 border-r border-gray-800" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleToggleRowSelection(rowIdx)}
                                          className="cursor-pointer"
                                        />
                                      </td>
                                      {queryResult.columns.map((col, colIdx) => {
                                        // Obtener el valor de la columna, manejando diferentes formatos
                                        let cellValue = null;
                                        if (plainRow && typeof plainRow === 'object') {
                                          // Intentar obtener el valor por nombre de columna
                                          cellValue = plainRow[col.name] !== undefined ? plainRow[col.name] : 
                                                     plainRow[col.name.toLowerCase()] !== undefined ? plainRow[col.name.toLowerCase()] :
                                                     null;
                                        }
                                        
                                        // Convertir a string de forma segura
                                        let displayValue = '';
                                        if (cellValue === null || cellValue === undefined) {
                                          displayValue = null;
                                        } else if (typeof cellValue === 'object') {
                                          // Si es un objeto, intentar serializarlo
                                          try {
                                            displayValue = JSON.stringify(cellValue);
                                          } catch {
                                            displayValue = String(cellValue);
                                          }
                                        } else {
                                          displayValue = String(cellValue);
                                        }
                                        
                                        return (
                                          <td 
                                            key={colIdx} 
                                            className="px-3 py-2 text-gray-300 border-r border-gray-800"
                                            style={{ 
                                              maxWidth: '300px', 
                                              overflow: 'hidden', 
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}
                                            title={displayValue !== null ? displayValue : 'NULL'}
                                          >
                                            {displayValue !== null 
                                              ? <span className="truncate block">{displayValue}</span>
                                              : <span className="text-gray-500 italic">NULL</span>}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-gray-500 text-center">
                            Los resultados aparecerán aquí...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Panel de Previsualización en Fullscreen */}
                    {showSelectedRows && previewData && previewData.length > 0 && (
                      <>
                        {isPreviewFullscreen ? (
                          <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-200">
                                  Previsualización ({previewData.length} fila{previewData.length > 1 ? 's' : ''})
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setPreviewFormat('json')}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      previewFormat === 'json' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                  >
                                    JSON
                                  </button>
                                  <button
                                    onClick={() => setPreviewFormat('text')}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      previewFormat === 'text' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                  >
                                    Texto
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setIsPreviewFullscreen(false)}
                                  className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                                  title="Salir de pantalla completa"
                                >
                                  <Minimize2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSelectedRows(false);
                                    setPreviewData(null);
                                    setIsPreviewFullscreen(false);
                                  }}
                                  className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                                  title="Cerrar previsualización"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
                              <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap break-words">
                                {getPreviewContent()}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t border-gray-700 bg-gray-800" style={{ height: '250px', minHeight: '200px', maxHeight: '40vh' }}>
                            <div className="flex items-center justify-between p-2 border-b border-gray-700">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-300">
                                  Previsualización ({previewData.length} fila{previewData.length > 1 ? 's' : ''})
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setPreviewFormat('json')}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      previewFormat === 'json' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                  >
                                    JSON
                                  </button>
                                  <button
                                    onClick={() => setPreviewFormat('text')}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                      previewFormat === 'text' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                  >
                                    Texto
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setIsPreviewFullscreen(true)}
                                  className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                                  title="Pantalla completa"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSelectedRows(false);
                                    setPreviewData(null);
                                  }}
                                  className="p-1.5 text-gray-400 hover:bg-gray-700 rounded transition-colors"
                                  title="Cerrar previsualización"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-900" style={{ maxHeight: 'calc(100% - 50px)' }}>
                              <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap break-words">
                                {getPreviewContent()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Historial en fullscreen */}
          {showHistory && (
            <div className="absolute right-4 top-16 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                    <span className="font-semibold text-gray-200">Historial</span>
                    <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    {queryHistory.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center p-4">No hay historial</div>
                    ) : (
                      queryHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2 mb-2 border border-gray-700 rounded hover:bg-gray-700 cursor-pointer"
                          onClick={() => loadHistoryQuery(item)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {item.success ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                            {item.query.substring(0, 100)}{item.query.length > 100 ? '...' : ''}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

          {/* Consultas guardadas en fullscreen */}
          {showSavedQueries && (
            <div className="absolute right-4 top-16 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                    <span className="font-semibold text-gray-200">Consultas guardadas</span>
                    <button onClick={() => setShowSavedQueries(false)} className="text-gray-400 hover:text-gray-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2">
                    {savedQueries.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center p-4">No hay consultas guardadas</div>
                    ) : (
                      savedQueries.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 mb-2 border border-gray-700 rounded hover:bg-gray-700 cursor-pointer"
                          onClick={() => loadSavedQuery(item)}
                        >
                          <div className="font-medium text-gray-300 mb-1">{item.name}</div>
                          <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words">
                            {item.query.substring(0, 100)}{item.query.length > 100 ? '...' : ''}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
}