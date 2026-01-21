import { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  Send, Copy, Check, Save, FolderOpen, Trash2, Plus, X, 
  Maximize2, Minimize2, FileText, Clock, Code2, FilePlus,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, RotateCcw
} from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Toast from './Toast';

export default function PostmanBlock({ node, updateAttributes, editor, getPos }) {
  const [method, setMethod] = useState(node.attrs.method || 'GET');
  const [url, setUrl] = useState(node.attrs.url || '');
  const [headers, setHeaders] = useState(() => {
    try {
      return node.attrs.headers ? JSON.parse(node.attrs.headers) : [{ key: '', value: '' }];
    } catch {
      return [{ key: '', value: '' }];
    }
  });
  const [body, setBody] = useState(node.attrs.body || '');
  const [bodyType, setBodyType] = useState(node.attrs.bodyType || 'json');
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState(() => {
    try {
      return node.attrs.response ? JSON.parse(node.attrs.response) : null;
    } catch {
      return null;
    }
  });
  const [responseTime, setResponseTime] = useState(0);
  const [statusCode, setStatusCode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collections, setCollections] = useState(() => {
    try {
      return node.attrs.collections ? JSON.parse(node.attrs.collections) : [];
    } catch {
      return [];
    }
  });
  const [showCollections, setShowCollections] = useState(false);
  const [currentCollection, setCurrentCollection] = useState('');
  const [requestName, setRequestName] = useState('');
  const [savedRequests, setSavedRequests] = useState([]);
  const [showSavedRequests, setShowSavedRequests] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const responseRef = useRef(null);
  const abortControllerRef = useRef(null);

  const confirmDelete = () => {
    if (editor && typeof getPos === 'function') {
      try {
        const pos = getPos();
        if (pos !== undefined && pos !== null) {
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
        }
      } catch (error) {
        console.error('Error al eliminar bloque:', error);
        // Fallback if getPos() fails
        try {
          const view = editor.view;
          if (view && typeof getPos === 'function') {
            const pos = getPos();
            if (pos !== undefined && pos !== null) {
              view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
            }
          }
        } catch (fallbackError) {
          console.error('Error en fallback al eliminar:', fallbackError);
        }
      }
    }
    setShowDeleteModal(false);
  };

  // Guardar estado en el nodo
  useEffect(() => {
    updateAttributes({
      method,
      url,
      headers: JSON.stringify(headers),
      body,
      bodyType,
      response: response ? JSON.stringify(response) : '',
      collections: JSON.stringify(collections)
    });
  }, [method, url, headers, body, bodyType, response, collections, updateAttributes]);

  // Actualizar savedRequests cuando cambia currentCollection
  useEffect(() => {
    if (currentCollection) {
      const collection = collections.find(c => c.name === currentCollection);
      if (collection) {
        setSavedRequests(collection.requests || []);
      } else {
        setSavedRequests([]);
      }
    } else {
      setSavedRequests([]);
    }
  }, [currentCollection, collections]);

  // Auto-scroll en respuesta
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  // Limpiar petición pendiente al desmontar el componente
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const saveCollections = (newCollections) => {
    setCollections(newCollections);
    updateAttributes({
      collections: JSON.stringify(newCollections)
    });
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsExecuting(false);
      setResponse({
        error: 'Petición cancelada por el usuario',
        cancelled: true
      });
      setStatusCode(null);
    }
  };

  const executeRequest = async () => {
    if (!url.trim()) {
      setResponse({ error: 'Por favor, ingresa una URL' });
      return;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController para esta petición
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsExecuting(true);
    setResponse(null);
    setStatusCode(null);
    setResponseTime(0);

    const startTime = Date.now();

    try {
      // Construir headers
      const requestHeaders = {};
      headers.forEach(header => {
        if (header.key.trim()) {
          requestHeaders[header.key.trim()] = header.value.trim();
        }
      });

      // Si es JSON, agregar Content-Type automáticamente
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && bodyType === 'json') {
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
      }

      // Preparar opciones de fetch
      const fetchOptions = {
        method: method,
        headers: requestHeaders,
        mode: 'cors', // Permitir CORS
        credentials: 'omit',
        signal: abortController.signal // Agregar señal de cancelación
      };

      // Agregar body para métodos que lo requieren
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && body.trim()) {
        if (bodyType === 'json') {
          try {
            // Intentar parsear como JSON para validar
            JSON.parse(body);
            fetchOptions.body = body;
          } catch {
            fetchOptions.body = body; // Enviar como está si no es JSON válido
          }
        } else {
          fetchOptions.body = body;
        }
      }

      // Ejecutar petición
      const fetchResponse = await fetch(url.trim(), fetchOptions);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setStatusCode(fetchResponse.status);

      // Verificar si fue cancelada
      if (abortController.signal.aborted) {
        return;
      }

      // Obtener respuesta
      const contentType = fetchResponse.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        try {
          const json = await fetchResponse.json();
          responseData = {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            headers: Object.fromEntries(fetchResponse.headers.entries()),
            data: json
          };
        } catch {
          const text = await fetchResponse.text();
          responseData = {
            status: fetchResponse.status,
            statusText: fetchResponse.statusText,
            headers: Object.fromEntries(fetchResponse.headers.entries()),
            data: text
          };
        }
      } else {
        const text = await fetchResponse.text();
        responseData = {
          status: fetchResponse.status,
          statusText: fetchResponse.statusText,
          headers: Object.fromEntries(fetchResponse.headers.entries()),
          data: text
        };
      }

      // Verificar nuevamente si fue cancelada antes de actualizar el estado
      if (!abortController.signal.aborted) {
        setResponse(responseData);
      }
    } catch (error) {
      // Si fue cancelada, no actualizar el estado (ya se actualizó en cancelRequest)
      if (error.name === 'AbortError') {
        return;
      }

      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setResponse({
        error: error.message,
        details: error.stack
      });
      setStatusCode(null);
    } finally {
      // Solo cambiar isExecuting si no fue cancelada
      if (!abortController.signal.aborted) {
        setIsExecuting(false);
      }
      abortControllerRef.current = null;
    }
  };

  const copyResponse = async () => {
    if (!response) return;
    
    try {
      const responseText = typeof response.data === 'object' 
        ? JSON.stringify(response.data, null, 2)
        : response.data;
      
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const resetRequest = () => {
    setMethod('GET');
    setUrl('');
    setHeaders([{ key: '', value: '' }]);
    setBody('');
    setBodyType('json');
    setResponse(null);
    setStatusCode(null);
    setResponseTime(0);
    setRequestName('');
    setToast({ message: 'Petición reiniciada', type: 'success' });
  };

  const insertResponseInPage = () => {
    if (!response || !editor) return;
    
    const responseText = typeof response.data === 'object' 
      ? JSON.stringify(response.data, null, 2)
      : response.data;
    
    // Crear título descriptivo de la petición
    const urlDisplay = url || 'API';
    let titleText = '';
    
    // Si hay nombre de petición, usarlo en el título
    if (requestName && requestName.trim()) {
      titleText = response.error 
        ? `Error: ${requestName.trim()}`
        : `Respuesta: ${requestName.trim()}`;
    } else {
      // Si no hay nombre, usar método y URL
      titleText = response.error 
        ? `Error: ${method} ${urlDisplay}`
        : `Respuesta: ${method} ${urlDisplay}`;
    }
    
    // Crear descripción más detallada
    let descriptionText = '';
    if (response.error) {
      if (requestName && requestName.trim()) {
        descriptionText = `Error al consultar "${requestName.trim()}" - ${method} ${urlDisplay}. ${response.error}`;
      } else {
        descriptionText = `Error al consultar ${method} ${urlDisplay}. ${response.error}`;
      }
    } else {
      if (requestName && requestName.trim()) {
        descriptionText = `Datos de respuesta de la petición "${requestName.trim()}" (${method} ${urlDisplay})`;
      } else {
        descriptionText = `Datos de respuesta de la petición ${method} a ${urlDisplay}`;
      }
      if (statusCode) {
        descriptionText += ` (Status: ${statusCode})`;
      }
      if (responseTime > 0) {
        descriptionText += ` - Tiempo de respuesta: ${responseTime}ms`;
      }
    }
    
    // Obtener la posición actual del cursor después del bloque postman
    try {
      if (typeof getPos === 'function') {
        const pos = getPos();
        if (pos !== undefined && pos !== null) {
          // Insertar después del bloque postman
          const afterPos = pos + node.nodeSize;
          editor.chain()
            .setTextSelection(afterPos)
            .insertContent([
              {
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: titleText }]
              },
              {
                type: 'paragraph',
                content: [{ type: 'text', text: descriptionText }]
              },
              {
                type: 'codeBlock',
                attrs: {
                  language: 'json'
                },
                content: [{ type: 'text', text: responseText }]
              }
            ])
            .run();
        } else {
          // Fallback: insertar al final
          editor.chain().focus().insertContent([
            {
              type: 'heading',
              attrs: { level: 1 },
              content: [{ type: 'text', text: titleText }]
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: descriptionText }]
            },
            {
              type: 'codeBlock',
              attrs: {
                language: 'json'
              },
              content: [{ type: 'text', text: responseText }]
            }
          ]).run();
        }
      } else {
        // Fallback: insertar al final
        editor.chain().focus().insertContent([
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: titleText }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: descriptionText }]
          },
          {
            type: 'codeBlock',
            attrs: {
              language: 'json'
            },
            content: [{ type: 'text', text: responseText }]
          }
        ]).run();
      }
      setToast({ message: 'Respuesta insertada en la página con título', type: 'success' });
    } catch (error) {
      console.error('Error al insertar respuesta:', error);
      setToast({ message: 'Error al insertar respuesta', type: 'error' });
    }
  };

  const insertPostmanBlockInPage = () => {
    if (!editor) return;
    
    try {
      // Crear un nuevo bloque postman con los mismos datos
      const newPostmanBlock = {
        type: 'postmanBlock',
        attrs: {
          method,
          url,
          headers: JSON.stringify(headers),
          body,
          bodyType,
          response: response ? JSON.stringify(response) : '',
          collections: JSON.stringify(collections)
        },
      };

      // Obtener la posición actual del cursor después del bloque postman
      if (typeof getPos === 'function') {
        const pos = getPos();
        if (pos !== undefined && pos !== null) {
          // Calcular la posición después del bloque actual
          const afterPos = pos + node.nodeSize;
          
          // Usar el método directo de inserción sin cambiar la selección primero
          const { state, view } = editor;
          const tr = state.tr;
          const resolvedPos = tr.doc.resolve(afterPos);
          
          // Verificar que no estamos duplicando contenido
          const nodeAtPos = tr.doc.nodeAt(afterPos);
          if (nodeAtPos && nodeAtPos.type.name === 'postmanBlock') {
            // Si ya hay un bloque postman en esa posición, mover la posición
            const newAfterPos = afterPos + nodeAtPos.nodeSize;
            tr.insert(newAfterPos, state.schema.nodes.postmanBlock.create(newPostmanBlock.attrs));
          } else {
            // Insertar normalmente
            tr.insert(afterPos, state.schema.nodes.postmanBlock.create(newPostmanBlock.attrs));
          }
          
          view.dispatch(tr);
        } else {
          // Fallback: insertar al final
          editor.chain().focus().insertContent(newPostmanBlock).run();
        }
      } else {
        // Fallback: insertar al final
        editor.chain().focus().insertContent(newPostmanBlock).run();
      }
      setToast({ message: 'Bloque Postman insertado en la página', type: 'success' });
    } catch (error) {
      console.error('Error al insertar bloque postman:', error);
      // Intentar método alternativo más simple
      try {
        editor.chain().focus().insertContent(newPostmanBlock).run();
        setToast({ message: 'Bloque Postman insertado en la página', type: 'success' });
      } catch (fallbackError) {
        setToast({ message: 'Error al insertar bloque postman', type: 'error' });
      }
    }
  };

  const saveToCollection = () => {
    if (!currentCollection.trim()) {
      setToast({ message: 'Por favor, ingresa un nombre para la colección', type: 'error' });
      return;
    }

    if (!requestName.trim()) {
      setToast({ message: 'Por favor, ingresa un nombre para esta petición', type: 'error' });
      return;
    }

    const newCollections = [...collections];
    let collection = newCollections.find(c => c.name === currentCollection.trim());
    
    if (!collection) {
      collection = {
        id: `collection-${Date.now()}`,
        name: currentCollection.trim(),
        requests: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newCollections.push(collection);
    }
    
    const requestData = {
      id: `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: requestName.trim(),
      method,
      url,
      headers,
      body,
      bodyType,
      createdAt: new Date().toISOString()
    };
    
    collection.requests.push(requestData);
    collection.updatedAt = new Date().toISOString();
    
    saveCollections(newCollections);
    setRequestName(''); // Limpiar el campo después de guardar
    setToast({ message: `Petición "${requestData.name}" guardada en la colección "${collection.name}"`, type: 'success' });
  };

  const loadRequest = (request) => {
    setMethod(request.method || 'GET');
    setUrl(request.url || '');
    setHeaders(request.headers || [{ key: '', value: '' }]);
    setBody(request.body || '');
    setBodyType(request.bodyType || 'json');
    setRequestName(request.name || '');
    setShowSavedRequests(false);
  };

  const deleteRequest = (requestId) => {
    if (!currentCollection) return;
    
    const newCollections = [...collections];
    const collection = newCollections.find(c => c.name === currentCollection);
    if (collection) {
      collection.requests = collection.requests.filter(r => r.id !== requestId);
      collection.updatedAt = new Date().toISOString();
      saveCollections(newCollections);
    }
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCollections && !e.target.closest('.relative')) {
        setShowCollections(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCollections]);

  return (
    <NodeViewWrapper className={`postman-block-wrapper ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white dark:bg-gray-800 p-4' : 'my-6'}`}>
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">🚀 Cliente API (Postman)</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón de eliminar - primero (más a la derecha) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteModal(true);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Eliminar bloque"
              type="button"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {/* Botón de fullscreen */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFullscreen(!isFullscreen);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              type="button"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-4 ${isFullscreen ? 'flex-1 overflow-auto' : ''} flex flex-col gap-4`}>
          {/* Sección de Request */}
          <div className="space-y-4">
          {/* Método y URL */}
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.ejemplo.com/endpoint"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {isExecuting ? (
              <button
                onClick={cancelRequest}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Cancelar petición"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            ) : (
              <button
                onClick={executeRequest}
                disabled={!url.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Ejecutar petición"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            )}
            <button
              onClick={resetRequest}
              className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              title="Limpiar y empezar nueva petición"
            >
              <RotateCcw className="w-4 h-4" />
              Nueva
            </button>
          </div>

            {/* Colecciones */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={currentCollection}
                  onChange={(e) => setCurrentCollection(e.target.value)}
                  onFocus={() => {
                    setShowCollections(true);
                  }}
                  placeholder="Nombre de colección (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {showCollections && collections.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {collections.map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => {
                          setCurrentCollection(collection.name);
                          setSavedRequests(collection.requests || []);
                          setShowCollections(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">{collection.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{collection.requests.length} peticiones</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {currentCollection && (
                <button
                  onClick={() => setShowSavedRequests(!showSavedRequests)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  Ver peticiones
                </button>
              )}
            </div>

            {/* Panel de peticiones guardadas */}
            {showSavedRequests && currentCollection && (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Peticiones en "{currentCollection}"
                  </h4>
                  <button
                    onClick={() => setShowSavedRequests(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {savedRequests.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay peticiones guardadas</p>
                  ) : (
                    savedRequests.map(request => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                      >
                        <button
                          onClick={() => loadRequest(request)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              request.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              request.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              request.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              request.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {request.method}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{request.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{request.url}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget({ type: 'request', id: request.id });
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Headers</label>
                <button
                  onClick={addHeader}
                  className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  + Agregar header
                </button>
              </div>
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                      placeholder="Nombre"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                      placeholder="Valor"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    {headers.length > 1 && (
                      <button
                        onClick={() => removeHeader(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Body (solo para POST, PUT, PATCH) */}
            {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Body</label>
                  <select
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="json">JSON</option>
                    <option value="text">Texto</option>
                    <option value="form-data">Form Data</option>
                    <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
                  </select>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Escribe el body aquí...'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm min-h-[120px]"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Sección de Response */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">

            {/* Respuesta */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Respuesta</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusCode && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      statusCode >= 200 && statusCode < 300 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      statusCode >= 300 && statusCode < 400 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {statusCode}
                    </span>
                  )}
                  {responseTime > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {responseTime}ms
                    </span>
                  )}
                  {response && (
                    <>
                      <button
                        onClick={copyResponse}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                        title="Copiar respuesta al portapapeles"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copiado' : 'Copiar'}
                      </button>
                      <button
                        onClick={insertResponseInPage}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
                        title="Insertar solo la respuesta en la página"
                      >
                        <FilePlus className="w-3 h-3" />
                        Insertar respuesta
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div
                ref={responseRef}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-green-400 font-mono text-sm overflow-auto min-h-[200px] max-h-[500px]"
              >
                {isExecuting ? (
                  <div className="flex items-center gap-2 text-yellow-400">
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    Enviando petición...
                  </div>
                ) : response ? (
                  response.error ? (
                    <div className={`${response.cancelled ? 'text-yellow-400' : 'text-red-400'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-semibold">{response.cancelled ? 'Cancelado' : 'Error'}</span>
                      </div>
                      <div>{response.error}</div>
                      {response.details && !response.cancelled && (
                        <div className="mt-2 text-xs text-red-300">{response.details}</div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {typeof response.data === 'object' ? (
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      ) : (
                        <pre className="whitespace-pre-wrap break-words">{response.data}</pre>
                      )}
                    </div>
                  )
                ) : (
                  <span className="text-gray-500">La respuesta aparecerá aquí...</span>
                )}
              </div>
            </div>

            {/* Guardar en colección */}
            {currentCollection && (
              <div className="flex gap-2 items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Nombre de la petición"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveToCollection();
                    }
                  }}
                />
                <button
                  onClick={saveToCollection}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar petición
                </button>
              </div>
            )}

            {/* Insertar bloque completo */}
            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={insertPostmanBlockInPage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                title="Insertar todo el bloque Postman (incluyendo petición y respuesta) en la página"
              >
                <FilePlus className="w-4 h-4" />
                Insertar bloque completo
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación de eliminación de petición */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal && deleteTarget && deleteTarget.type === 'request'}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          if (deleteTarget && deleteTarget.type === 'request' && currentCollection) {
            const collection = collections.find(c => c.name === currentCollection);
            if (collection) {
              deleteRequest(deleteTarget.id);
            }
          }
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="¿Eliminar petición?"
        message="¿Estás seguro de que quieres eliminar esta petición de la colección? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal de confirmación de eliminación de bloque */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal && (!deleteTarget || deleteTarget.type !== 'request')}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar bloque Postman?"
        message="Esta acción eliminará permanentemente este bloque Postman de la página. ¿Estás seguro?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </NodeViewWrapper>
  );
}

