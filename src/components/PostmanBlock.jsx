import { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  Send, Copy, Check, Save, FolderOpen, Trash2, Plus, X, 
  Maximize2, Minimize2, FileText, Clock, Code2, FilePlus,
  ChevronDown, ChevronUp, ChevronRight, AlertCircle, CheckCircle, RotateCcw,
  Download, Upload, Settings, Menu, Edit2, FolderPlus
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
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showAuthMenu, setShowAuthMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [editingCollection, setEditingCollection] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [showCodeGen, setShowCodeGen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('curl');
  const [requestHistory, setRequestHistory] = useState([]);
  const [authType, setAuthType] = useState('noauth');
  const [authToken, setAuthToken] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authHeaderName, setAuthHeaderName] = useState('X-API-Key');
  const [authApiValue, setAuthApiValue] = useState('');
  
  // Sistema de variables (similar a Postman)
  const [variables, setVariables] = useState(() => {
    try {
      const saved = localStorage.getItem('postman_variables');
      if (saved) {
        return JSON.parse(saved);
      }
      // Variables por defecto
      return [
        { key: 'base_url', value: 'https://api.ejemplo.com', enabled: true },
        { key: 'token', value: '', enabled: true },
        { key: 'usuario', value: '', enabled: true },
        { key: 'clave', value: '', enabled: true }
      ];
    } catch {
      return [
        { key: 'base_url', value: 'https://api.ejemplo.com', enabled: true },
        { key: 'token', value: '', enabled: true }
      ];
    }
  });
  const [showVariables, setShowVariables] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [newVariableKey, setNewVariableKey] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');
  
  // Sistema de pestañas
  const [tabs, setTabs] = useState(() => {
    try {
      const savedTabs = node.attrs.tabs ? JSON.parse(node.attrs.tabs) : null;
      if (savedTabs && savedTabs.length > 0) {
        return savedTabs;
      }
      // Si no hay pestañas guardadas, crear una pestaña inicial
      return [{
        id: `tab-${Date.now()}`,
        name: 'Nueva API',
        method: node.attrs.method || 'GET',
        url: node.attrs.url || '',
        headers: node.attrs.headers ? JSON.parse(node.attrs.headers) : [{ key: '', value: '' }],
        body: node.attrs.body || '',
        bodyType: node.attrs.bodyType || 'json',
        response: node.attrs.response ? JSON.parse(node.attrs.response) : null,
        responseTime: 0,
        statusCode: null,
        authType: 'noauth',
        authToken: '',
        authUsername: '',
        authPassword: '',
        authHeaderName: 'X-API-Key',
        authApiValue: '',
        requestName: ''
      }];
    } catch {
      return [{
        id: `tab-${Date.now()}`,
        name: 'Nueva API',
        method: 'GET',
        url: '',
        headers: [{ key: '', value: '' }],
        body: '',
        bodyType: 'json',
        response: null,
        responseTime: 0,
        statusCode: null,
        authType: 'noauth',
        authToken: '',
        authUsername: '',
        authPassword: '',
        authHeaderName: 'X-API-Key',
        authApiValue: '',
        requestName: ''
      }];
    }
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      const savedTabs = node.attrs.tabs ? JSON.parse(node.attrs.tabs) : null;
      const savedActiveTab = node.attrs.activeTabId;
      if (savedActiveTab && savedTabs && savedTabs.find(t => t.id === savedActiveTab)) {
        return savedActiveTab;
      }
      if (savedTabs && savedTabs.length > 0) {
        return savedTabs[0].id;
      }
      return '';
    } catch {
      return '';
    }
  });
  
  // Asegurar que activeTabId sea válido después de que tabs se inicialice
  useEffect(() => {
    if (tabs.length > 0 && (!activeTabId || !tabs.find(t => t.id === activeTabId))) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs.length]);
  
  // Obtener la pestaña activa
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  
  const fileInputRef = useRef(null);
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

  // Sincronizar estado local con la pestaña activa cuando cambia
  useEffect(() => {
    // Si estamos actualizando desde la creación de una nueva pestaña, no hacer nada
    if (isUpdatingFromTabRef.current) {
      console.log('[PostmanBlock] useEffect sincronización - bloqueado por isUpdatingFromTabRef');
      return;
    }
    
    if (activeTabId && tabs.length > 0) {
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab) {
        // Verificar si los valores ya son los correctos para evitar actualizaciones innecesarias
        const currentMethod = method;
        const currentUrl = url;
        const currentHeaders = JSON.stringify(headers);
        const tabMethod = currentTab.method || 'GET';
        const tabUrl = currentTab.url || '';
        const tabHeaders = JSON.stringify(Array.isArray(currentTab.headers) ? currentTab.headers : [{ key: '', value: '' }]);
        
        // Solo actualizar si los valores son diferentes
        if (currentMethod !== tabMethod || currentUrl !== tabUrl || currentHeaders !== tabHeaders) {
          console.log('[PostmanBlock] useEffect sincronización - actualizando desde pestaña:', currentTab.name, {
            method: tabMethod,
            url: tabUrl,
            'estado actual method': currentMethod,
            'estado actual url': currentUrl
          });
          
          // Marcar que estamos actualizando desde el cambio de pestaña
          isUpdatingFromTabRef.current = true;
          
          setMethod(tabMethod);
          setUrl(tabUrl);
          setHeaders(Array.isArray(currentTab.headers) ? currentTab.headers : [{ key: '', value: '' }]);
          setBody(currentTab.body || '');
          setBodyType(currentTab.bodyType || 'json');
          setResponse(currentTab.response || null);
          setResponseTime(currentTab.responseTime || 0);
          setStatusCode(currentTab.statusCode || null);
          setRequestName(currentTab.requestName || '');
          setAuthType(currentTab.authType || 'noauth');
          setAuthToken(currentTab.authToken || '');
          setAuthUsername(currentTab.authUsername || '');
          setAuthPassword(currentTab.authPassword || '');
          setAuthHeaderName(currentTab.authHeaderName || 'X-API-Key');
          setAuthApiValue(currentTab.authApiValue || '');
          
          // Resetear el flag después de actualizar
          setTimeout(() => {
            isUpdatingFromTabRef.current = false;
          }, 0);
        } else {
          console.log('[PostmanBlock] useEffect sincronización - valores ya están sincronizados, saltando actualización');
        }
      }
    }
  }, [activeTabId, tabs]);

  // Ref para evitar loops infinitos
  const isUpdatingFromTabRef = useRef(false);
  
  // Actualizar la pestaña activa cuando cambia el estado local (con verificación para evitar loops)
  useEffect(() => {
    // Si estamos actualizando desde el cambio de pestaña, no actualizar de vuelta
    if (isUpdatingFromTabRef.current) {
      isUpdatingFromTabRef.current = false;
      return;
    }
    
    if (activeTabId && tabs.length > 0) {
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab) {
        // Solo actualizar si los valores realmente cambiaron
        const hasChanges = 
          currentTab.method !== method ||
          currentTab.url !== url ||
          JSON.stringify(currentTab.headers) !== JSON.stringify(headers) ||
          currentTab.body !== body ||
          currentTab.bodyType !== bodyType ||
          JSON.stringify(currentTab.response) !== JSON.stringify(response) ||
          currentTab.responseTime !== responseTime ||
          currentTab.statusCode !== statusCode ||
          currentTab.requestName !== requestName ||
          currentTab.authType !== authType ||
          currentTab.authToken !== authToken ||
          currentTab.authUsername !== authUsername ||
          currentTab.authPassword !== authPassword ||
          currentTab.authHeaderName !== authHeaderName ||
          currentTab.authApiValue !== authApiValue;

        if (hasChanges) {
          setTabs(prevTabs => prevTabs.map(tab => 
            tab.id === activeTabId 
              ? {
                  ...tab,
                  method,
                  url,
                  headers,
                  body,
                  bodyType,
                  response,
                  responseTime,
                  statusCode,
                  requestName,
                  authType,
                  authToken,
                  authUsername,
                  authPassword,
                  authHeaderName,
                  authApiValue,
                  name: requestName || url || tab.name || 'Nueva API'
                }
              : tab
          ));
        }
      }
    }
  }, [method, url, headers, body, bodyType, response, responseTime, statusCode, requestName, authType, authToken, authUsername, authPassword, authHeaderName, authApiValue, activeTabId, tabs.length]);

  // Guardar estado en el nodo
  useEffect(() => {
    updateAttributes({
      method: activeTab?.method || 'GET',
      url: activeTab?.url || '',
      headers: JSON.stringify(activeTab?.headers || [{ key: '', value: '' }]),
      body: activeTab?.body || '',
      bodyType: activeTab?.bodyType || 'json',
      response: activeTab?.response ? JSON.stringify(activeTab.response) : '',
      collections: JSON.stringify(collections),
      tabs: JSON.stringify(tabs),
      activeTabId: activeTabId
    });
  }, [tabs, activeTabId, collections, updateAttributes]);

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
      collections: JSON.stringify(newCollections),
      tabs: JSON.stringify(tabs),
      activeTabId: activeTabId
    });
  };

  // Funciones para gestionar pestañas
  const createNewTab = () => {
    const newTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Nueva API',
      method: 'GET',
      url: '',
      headers: [{ key: '', value: '' }],
      body: '',
      bodyType: 'json',
      response: null,
      responseTime: 0,
      statusCode: null,
      authType: 'noauth',
      authToken: '',
      authUsername: '',
      authPassword: '',
      authHeaderName: 'X-API-Key',
      authApiValue: '',
      requestName: ''
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId, e) => {
    e?.stopPropagation();
    if (tabs.length === 1) {
      // No permitir cerrar la última pestaña
      setToast({ message: 'Debe haber al menos una pestaña abierta', type: 'error' });
      return;
    }
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    // Si se cerró la pestaña activa, activar otra
    if (activeTabId === tabId) {
      if (tabIndex > 0) {
        setActiveTabId(newTabs[tabIndex - 1].id);
      } else {
        setActiveTabId(newTabs[0].id);
      }
    }
  };

  const switchTab = (tabId) => {
    setActiveTabId(tabId);
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

  // Función para sustituir variables en un string
  const substituteVariables = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    let result = text;
    variables.forEach(variable => {
      if (variable.enabled && variable.key) {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
        result = result.replace(regex, variable.value || '');
      }
    });
    return result;
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
      // Sustituir variables en URL
      const finalUrl = substituteVariables(url);
      
      // Construir headers con sustitución de variables
      const requestHeaders = {};
      headers.forEach(header => {
        if (header.key.trim()) {
          const headerKey = substituteVariables(header.key.trim());
          const headerValue = substituteVariables(header.value.trim());
          requestHeaders[headerKey] = headerValue;
        }
      });

      // Agregar autenticación según el tipo (con sustitución de variables)
      if (authType === 'bearer' && authToken.trim()) {
        const token = substituteVariables(authToken.trim());
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else if (authType === 'basic' && authUsername.trim() && authPassword.trim()) {
        const username = substituteVariables(authUsername.trim());
        const password = substituteVariables(authPassword.trim());
        const credentials = btoa(`${username}:${password}`);
        requestHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (authType === 'apikey' && authApiValue.trim()) {
        const headerName = substituteVariables(authHeaderName.trim() || 'X-API-Key');
        const apiValue = substituteVariables(authApiValue.trim());
        requestHeaders[headerName] = apiValue;
      }

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

      console.log('[PostmanBlock] Ejecutando request:', {
        method,
        originalUrl: url,
        finalUrl,
        headers: requestHeaders
      });

      // Agregar body para métodos que lo requieren (con sustitución de variables)
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && body.trim()) {
        const finalBody = substituteVariables(body);
        if (bodyType === 'json') {
          try {
            // Intentar parsear como JSON para validar
            JSON.parse(finalBody);
            fetchOptions.body = finalBody;
          } catch {
            fetchOptions.body = finalBody; // Enviar como está si no es JSON válido
          }
        } else {
          fetchOptions.body = finalBody;
        }
      }

      // Ejecutar petición
      const fetchResponse = await fetch(finalUrl, fetchOptions);
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
        
        // Guardar en historial
        const historyItem = {
          id: `history-${Date.now()}`,
          method,
          url,
          status: fetchResponse.status,
          time: responseTime,
          timestamp: new Date().toISOString()
        };
        setRequestHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Mantener solo los últimos 50
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

  // Exportar colección al formato Postman Collection v2.1.0
  const exportCollection = (collectionName) => {
    const collection = collections.find(c => c.name === collectionName);
    if (!collection || !collection.requests || collection.requests.length === 0) {
      setToast({ message: 'La colección no existe o está vacía', type: 'error' });
      return;
    }

    // Convertir al formato Postman Collection v2.1.0
    const postmanCollection = {
      info: {
        _postman_id: collection.id || `collection-${Date.now()}`,
        name: collection.name,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        description: collection.description || ""
      },
      item: collection.requests.map(request => {
        // Convertir headers al formato Postman
        const postmanHeaders = (request.headers || []).map(header => ({
          key: header.key,
          value: header.value
        }));

        // Determinar el modo del body
        let bodyMode = 'raw';
        let rawBody = '';
        if (request.body) {
          if (request.bodyType === 'json') {
            bodyMode = 'raw';
            rawBody = request.body;
          } else if (request.bodyType === 'form-data') {
            bodyMode = 'formdata';
            // Parsear form-data si es necesario
            rawBody = request.body;
          } else if (request.bodyType === 'x-www-form-urlencoded') {
            bodyMode = 'urlencoded';
            rawBody = request.body;
          } else {
            bodyMode = 'raw';
            rawBody = request.body;
          }
        }

        const postmanRequest = {
          name: request.name,
          request: {
            method: request.method || 'GET',
            header: postmanHeaders,
            url: {
              raw: request.url,
              protocol: request.url.startsWith('https') ? 'https' : 'http',
              host: request.url.replace(/^https?:\/\//, '').split('/')[0].split('.'),
              path: request.url.replace(/^https?:\/\/[^\/]+/, '').split('/').filter(p => p)
            }
          },
          response: []
        };

        // Agregar body solo si existe y el método lo requiere
        if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          postmanRequest.request.body = {
            mode: bodyMode,
            raw: rawBody
          };
          
          if (request.bodyType === 'json') {
            postmanRequest.request.body.options = {
              raw: {
                language: 'json'
              }
            };
          }
        }

        // Agregar auth si existe
        if (request.auth) {
          postmanRequest.request.auth = request.auth;
        } else {
          postmanRequest.request.auth = {
            type: 'noauth'
          };
        }

        return postmanRequest;
      })
    };

    // Crear archivo JSON y descargarlo
    const jsonString = JSON.stringify(postmanCollection, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection.name.replace(/[^a-z0-9]/gi, '_')}.postman_collection.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({ message: `Colección "${collection.name}" exportada correctamente`, type: 'success' });
    setShowCollectionMenu(false);
  };

  // Importar colección desde archivo Postman Collection
  const importCollection = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const postmanCollection = JSON.parse(text);

      // Validar que sea un formato Postman Collection válido
      if (!postmanCollection.info || !postmanCollection.item) {
        setToast({ message: 'El archivo no es un formato Postman Collection válido', type: 'error' });
        return;
      }

      // Convertir del formato Postman al formato interno
      const collectionName = postmanCollection.info.name || `Colección Importada ${Date.now()}`;
      
      // Verificar si ya existe una colección con ese nombre
      const existingCollection = collections.find(c => c.name === collectionName);
      if (existingCollection) {
        setToast({ message: `Ya existe una colección con el nombre "${collectionName}"`, type: 'error' });
        return;
      }

      // Función recursiva para extraer todas las requests (incluyendo las anidadas en carpetas)
      const extractRequests = (items, parentFolder = '') => {
        const requests = [];
        let requestIndex = 0;

        const processItem = (item) => {
          // Si el item tiene una request directa, es una request
          if (item.request) {
            const request = item.request;
            
            // Extraer URL del formato Postman (puede ser string u objeto)
            let url = '';
            if (typeof request.url === 'string') {
              url = request.url;
            } else if (request.url) {
              // Formato Postman v2.1: request.url puede ser un objeto con 'raw', 'host', 'path', etc.
              url = request.url.raw || '';
              
              // Si no hay raw, construir la URL desde host y path
              if (!url && request.url.host) {
                let host = '';
                if (Array.isArray(request.url.host)) {
                  host = request.url.host.join('.');
                } else if (typeof request.url.host === 'string') {
                  host = request.url.host;
                }
                
                if (host) {
                  const protocol = request.url.protocol || (request.url.protocols && request.url.protocols[0]) || 'https';
                  const path = Array.isArray(request.url.path) 
                    ? '/' + request.url.path.filter(p => p).join('/') 
                    : (request.url.path || '');
                  
                  // Construir query string si existe
                  let query = '';
                  if (request.url.query && Array.isArray(request.url.query)) {
                    const queryParts = request.url.query
                      .filter(q => q.key || q.value)
                      .map(q => {
                        if (q.disabled) return null;
                        return q.value ? `${q.key || ''}=${q.value}` : (q.key || '');
                      })
                      .filter(q => q !== null);
                    if (queryParts.length > 0) {
                      query = '?' + queryParts.join('&');
                    }
                  }
                  
                  url = `${protocol}://${host}${path}${query}`;
                }
              }
            }
            
            console.log('[PostmanBlock] Importando request:', {
              name: item.name,
              folder: parentFolder,
              'request.url (original)': request.url,
              'url extraída': url
            });

            // Convertir headers
            const headers = (request.header || []).map(h => ({
              key: h.key || '',
              value: h.value || ''
            }));

            // Determinar body y bodyType
            let body = '';
            let bodyType = 'json';
            
            if (request.body) {
              if (request.body.mode === 'raw') {
                body = request.body.raw || '';
                bodyType = request.body.options?.raw?.language === 'json' ? 'json' : 'text';
              } else if (request.body.mode === 'formdata') {
                body = request.body.formdata?.map(f => `${f.key}=${f.value}`).join('&') || '';
                bodyType = 'form-data';
              } else if (request.body.mode === 'urlencoded') {
                body = request.body.urlencoded?.map(u => `${u.key}=${u.value}`).join('&') || '';
                bodyType = 'x-www-form-urlencoded';
              } else {
                body = request.body.raw || '';
                bodyType = 'text';
              }
            }

            requests.push({
              id: `request-${Date.now()}-${requestIndex++}-${Math.random().toString(36).substr(2, 9)}`,
              name: item.name || `Request ${requestIndex}`,
              method: request.method || 'GET',
              url: url,
              headers: headers.length > 0 ? headers : [{ key: '', value: '' }],
              body: body,
              bodyType: bodyType,
              createdAt: new Date().toISOString()
            });
          }
          // Si el item tiene sub-items, es una carpeta - procesar recursivamente
          else if (item.item && Array.isArray(item.item)) {
            const folderName = item.name || 'Sin nombre';
            const newParentFolder = parentFolder ? `${parentFolder}/${folderName}` : folderName;
            item.item.forEach(subItem => processItem(subItem));
          }
        };

        items.forEach(item => processItem(item));
        return requests;
      };

      const requests = extractRequests(postmanCollection.item);

      const newCollection = {
        id: postmanCollection.info._postman_id || `collection-${Date.now()}`,
        name: collectionName,
        description: postmanCollection.info.description || '',
        requests: requests,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newCollections = [...collections, newCollection];
      saveCollections(newCollections);
      setCurrentCollection(collectionName);
      // Expandir automáticamente la colección importada
      setExpandedCollections(prev => new Set([...prev, newCollection.id]));
      
      // Importar variables de la colección si existen
      if (postmanCollection.variable) {
        importVariablesFromCollection(postmanCollection);
      }
      
      setToast({ message: `Colección "${collectionName}" importada correctamente (${requests.length} peticiones)`, type: 'success' });
      setShowCollectionMenu(false);
    } catch (error) {
      console.error('Error al importar colección:', error);
      setToast({ message: `Error al importar colección: ${error.message}`, type: 'error' });
    } finally {
      // Limpiar el input para permitir importar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Funciones para gestionar variables
  const addVariable = () => {
    if (!newVariableKey.trim()) {
      setToast({ message: 'Por favor, ingresa un nombre para la variable', type: 'error' });
      return;
    }
    
    // Verificar si ya existe
    if (variables.find(v => v.key === newVariableKey.trim())) {
      setToast({ message: `Ya existe una variable con el nombre "${newVariableKey.trim()}"`, type: 'error' });
      return;
    }
    
    const newVariable = {
      key: newVariableKey.trim(),
      value: newVariableValue.trim(),
      enabled: true
    };
    
    setVariables([...variables, newVariable]);
    setNewVariableKey('');
    setNewVariableValue('');
    setToast({ message: `Variable "${newVariable.key}" agregada`, type: 'success' });
  };

  const editVariable = (index) => {
    const variable = variables[index];
    setEditingVariable(index);
    setNewVariableKey(variable.key);
    setNewVariableValue(variable.value);
  };

  const saveVariableEdit = () => {
    if (!newVariableKey.trim()) {
      setToast({ message: 'Por favor, ingresa un nombre para la variable', type: 'error' });
      return;
    }
    
    // Verificar si el nuevo nombre ya existe (excepto el que estamos editando)
    const existingIndex = variables.findIndex(v => v.key === newVariableKey.trim());
    if (existingIndex !== -1 && existingIndex !== editingVariable) {
      setToast({ message: `Ya existe una variable con el nombre "${newVariableKey.trim()}"`, type: 'error' });
      return;
    }
    
    const updatedVariables = [...variables];
    updatedVariables[editingVariable] = {
      ...updatedVariables[editingVariable],
      key: newVariableKey.trim(),
      value: newVariableValue.trim()
    };
    
    setVariables(updatedVariables);
    setEditingVariable(null);
    setNewVariableKey('');
    setNewVariableValue('');
    setToast({ message: 'Variable actualizada', type: 'success' });
  };

  const deleteVariable = (index) => {
    const variable = variables[index];
    const updatedVariables = variables.filter((_, i) => i !== index);
    setVariables(updatedVariables);
    setToast({ message: `Variable "${variable.key}" eliminada`, type: 'success' });
  };

  const toggleVariable = (index) => {
    const updatedVariables = [...variables];
    updatedVariables[index].enabled = !updatedVariables[index].enabled;
    setVariables(updatedVariables);
  };

  const exportVariables = () => {
    const variablesToExport = variables.map(v => ({
      key: v.key,
      value: v.value,
      enabled: v.enabled
    }));
    
    const jsonString = JSON.stringify(variablesToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `postman_variables_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setToast({ message: 'Variables exportadas correctamente', type: 'success' });
  };

  const importVariables = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const importedVariables = JSON.parse(text);
      
      if (!Array.isArray(importedVariables)) {
        setToast({ message: 'El archivo no tiene un formato válido', type: 'error' });
        return;
      }
      
      // Validar estructura
      const validVariables = importedVariables.filter(v => v.key && typeof v.key === 'string');
      
      if (validVariables.length === 0) {
        setToast({ message: 'No se encontraron variables válidas en el archivo', type: 'error' });
        return;
      }
      
      // Combinar con variables existentes (actualizar si existe, agregar si no)
      const updatedVariables = [...variables];
      validVariables.forEach(importedVar => {
        const existingIndex = updatedVariables.findIndex(v => v.key === importedVar.key);
        if (existingIndex !== -1) {
          // Actualizar variable existente
          updatedVariables[existingIndex] = {
            ...updatedVariables[existingIndex],
            value: importedVar.value || '',
            enabled: importedVar.enabled !== undefined ? importedVar.enabled : true
          };
        } else {
          // Agregar nueva variable
          updatedVariables.push({
            key: importedVar.key,
            value: importedVar.value || '',
            enabled: importedVar.enabled !== undefined ? importedVar.enabled : true
          });
        }
      });
      
      setVariables(updatedVariables);
      setToast({ message: `${validVariables.length} variable(s) importada(s) correctamente`, type: 'success' });
      
      // Limpiar el input
      event.target.value = '';
    } catch (error) {
      console.error('Error al importar variables:', error);
      setToast({ message: 'Error al importar variables: ' + error.message, type: 'error' });
    }
  };

  // Importar variables desde colección Postman
  const importVariablesFromCollection = (postmanCollection) => {
    try {
      // Buscar variables en la colección (pueden estar en variable o en variable[])
      let collectionVariables = [];
      
      if (postmanCollection.variable && Array.isArray(postmanCollection.variable)) {
        collectionVariables = postmanCollection.variable;
      } else if (postmanCollection.variable && typeof postmanCollection.variable === 'object') {
        collectionVariables = [postmanCollection.variable];
      }
      
      if (collectionVariables.length === 0) {
        return; // No hay variables, no mostrar mensaje
      }
      
      // Convertir variables de Postman al formato interno
      const importedVariables = collectionVariables.map(v => ({
        key: v.key || v.name || '',
        value: v.value || '',
        enabled: v.enabled !== undefined ? v.enabled : true
      })).filter(v => v.key);
      
      if (importedVariables.length === 0) {
        return; // No hay variables válidas
      }
      
      // Combinar con variables existentes
      const updatedVariables = [...variables];
      importedVariables.forEach(importedVar => {
        const existingIndex = updatedVariables.findIndex(v => v.key === importedVar.key);
        if (existingIndex !== -1) {
          updatedVariables[existingIndex] = {
            ...updatedVariables[existingIndex],
            value: importedVar.value || '',
            enabled: importedVar.enabled !== undefined ? importedVar.enabled : true
          };
        } else {
          updatedVariables.push(importedVar);
        }
      });
      
      setVariables(updatedVariables);
    } catch (error) {
      console.error('Error al importar variables desde colección:', error);
    }
  };

  // Guardar variables en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('postman_variables', JSON.stringify(variables));
    } catch (error) {
      console.error('Error al guardar variables:', error);
    }
  }, [variables]);

  // Generar código para diferentes lenguajes
  const generateCode = (language) => {
    let code = '';
    const headersObj = {};
    headers.forEach(header => {
      if (header.key.trim()) {
        headersObj[header.key.trim()] = header.value.trim();
      }
    });

    // Agregar autenticación
    if (authType === 'bearer' && authToken.trim()) {
      headersObj['Authorization'] = `Bearer ${authToken.trim()}`;
    } else if (authType === 'basic' && authUsername.trim() && authPassword.trim()) {
      const credentials = btoa(`${authUsername.trim()}:${authPassword.trim()}`);
      headersObj['Authorization'] = `Basic ${credentials}`;
    } else if (authType === 'apikey' && authApiValue.trim()) {
      headersObj[authHeaderName.trim() || 'X-API-Key'] = authApiValue.trim();
    }

    if (language === 'curl') {
      let curlCmd = `curl -X ${method} "${url}"`;
      Object.entries(headersObj).forEach(([key, value]) => {
        curlCmd += ` \\\n  -H "${key}: ${value}"`;
      });
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        curlCmd += ` \\\n  -d '${body.replace(/'/g, "'\\''")}'`;
      }
      code = curlCmd;
    } else if (language === 'javascript') {
      code = `fetch("${url}", {\n  method: "${method}",\n  headers: ${JSON.stringify(headersObj, null, 2)}${body && ['POST', 'PUT', 'PATCH'].includes(method) ? `,\n  body: ${bodyType === 'json' ? body : `"${body.replace(/"/g, '\\"')}"`}` : ''}\n})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
    } else if (language === 'python') {
      const headersStr = JSON.stringify(headersObj, null, 2).split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n');
      code = `import requests\n\nurl = "${url}"\nheaders = ${headersStr}\n${body && ['POST', 'PUT', 'PATCH'].includes(method) ? `data = ${bodyType === 'json' ? body : `"${body}"`}\nresponse = requests.${method.toLowerCase()}(url, headers=headers, json=data if '${bodyType}' === 'json' else None, data=data if '${bodyType}' !== 'json' else None)` : `response = requests.${method.toLowerCase()}(url, headers=headers)`}\nprint(response.json())`;
    } else if (language === 'nodejs') {
      code = `const fetch = require('node-fetch');\n\nconst url = "${url}";\nconst options = {\n  method: '${method}',\n  headers: ${JSON.stringify(headersObj, null, 2)}${body && ['POST', 'PUT', 'PATCH'].includes(method) ? `,\n  body: ${bodyType === 'json' ? body : `"${body.replace(/"/g, '\\"')}"`}` : ''}\n};\n\nfetch(url, options)\n  .then(res => res.json())\n  .then(json => console.log(json))\n  .catch(err => console.error('error:' + err));`;
    }

    setGeneratedCode(code);
    setCodeLanguage(language);
    setShowCodeGen(true);
  };

  // Cargar petición del historial
  const loadFromHistory = (historyItem) => {
    // Buscar la petición en las colecciones guardadas
    // Por ahora, solo mostrar información
    setToast({ message: `Cargando petición: ${historyItem.method} ${historyItem.url}`, type: 'info' });
    setShowHistory(false);
  };

  // Crear nueva colección
  const createCollection = () => {
    if (!newCollectionName.trim()) {
      setToast({ message: 'Por favor, ingresa un nombre para la colección', type: 'error' });
      return;
    }

    // Verificar si ya existe
    if (collections.find(c => c.name.trim().toLowerCase() === newCollectionName.trim().toLowerCase())) {
      setToast({ message: 'Ya existe una colección con ese nombre', type: 'error' });
      return;
    }

    const newCollection = {
      id: `collection-${Date.now()}`,
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim(),
      requests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newCollections = [...collections, newCollection];
    saveCollections(newCollections);
    setCurrentCollection(newCollection.name);
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowCreateCollection(false);
    setExpandedCollections(prev => new Set([...prev, newCollection.id]));
    setToast({ message: `Colección "${newCollection.name}" creada`, type: 'success' });
  };

  // Editar colección
  const editCollection = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setEditingCollection({
        id: collection.id,
        name: collection.name,
        description: collection.description || ''
      });
      setNewCollectionName(collection.name);
      setNewCollectionDescription(collection.description || '');
      setShowCreateCollection(true);
    }
  };

  // Guardar edición de colección
  const saveCollectionEdit = () => {
    if (!editingCollection || !newCollectionName.trim()) {
      setToast({ message: 'Por favor, ingresa un nombre para la colección', type: 'error' });
      return;
    }

    const newCollections = collections.map(c => {
      if (c.id === editingCollection.id) {
        return {
          ...c,
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    saveCollections(newCollections);
    
    // Actualizar currentCollection si era la que se editó
    if (currentCollection === editingCollection.name) {
      setCurrentCollection(newCollectionName.trim());
    }

    setEditingCollection(null);
    setNewCollectionName('');
    setNewCollectionDescription('');
    setShowCreateCollection(false);
    setToast({ message: 'Colección actualizada', type: 'success' });
  };

  // Eliminar colección
  const deleteCollection = (collectionId) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    setDeleteTarget({ type: 'collection', id: collectionId, name: collection.name });
    setShowDeleteModal(true);
  };

  // Confirmar eliminación de colección
  const confirmDeleteCollection = () => {
    if (deleteTarget && deleteTarget.type === 'collection') {
      const newCollections = collections.filter(c => c.id !== deleteTarget.id);
      saveCollections(newCollections);
      
      // Si la colección eliminada era la actual, limpiar
      if (currentCollection && collections.find(c => c.id === deleteTarget.id)?.name === currentCollection) {
        setCurrentCollection('');
        setSavedRequests([]);
      }
      
      setExpandedCollections(prev => {
        const newSet = new Set(prev);
        newSet.delete(deleteTarget.id);
        return newSet;
      });
      
      setToast({ message: `Colección "${deleteTarget.name}" eliminada`, type: 'success' });
    }
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // Toggle expandir/colapsar colección
  const toggleCollection = (collectionId) => {
    setExpandedCollections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  // Crear un nuevo bloque Postman con una request específica
  const createNewPostmanBlockWithRequest = (request) => {
    if (!request || !editor) {
      console.error('Request or editor is undefined');
      return;
    }

    try {
      // Crear un nuevo bloque postman con la request seleccionada
      const newPostmanBlock = {
        type: 'postmanBlock',
        attrs: {
          method: request.method || 'GET',
          url: request.url || '',
          headers: JSON.stringify(request.headers || [{ key: '', value: '' }]),
          body: request.body || '',
          bodyType: request.bodyType || 'json',
          response: '',
          collections: JSON.stringify(collections) // Mantener las colecciones
        },
      };

      // Obtener la posición actual del cursor después del bloque postman
      if (typeof getPos === 'function') {
        const pos = getPos();
        if (pos !== undefined && pos !== null) {
          // Calcular la posición después del bloque actual
          const afterPos = pos + node.nodeSize;
          
          // Usar el método directo de inserción
          const { state, view } = editor;
          const tr = state.tr;
          
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
      
      setToast({ message: `Nuevo bloque Postman creado con "${request.name || 'API'}"`, type: 'success' });
    } catch (error) {
      console.error('Error al crear nuevo bloque postman:', error);
      // Intentar método alternativo más simple
      try {
        const newPostmanBlock = {
          type: 'postmanBlock',
          attrs: {
            method: request.method || 'GET',
            url: request.url || '',
            headers: JSON.stringify(request.headers || [{ key: '', value: '' }]),
            body: request.body || '',
            bodyType: request.bodyType || 'json',
            response: '',
            collections: JSON.stringify(collections)
          },
        };
        editor.chain().focus().insertContent(newPostmanBlock).run();
        setToast({ message: `Nuevo bloque Postman creado con "${request.name || 'API'}"`, type: 'success' });
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        setToast({ message: 'Error al crear nuevo bloque postman', type: 'error' });
      }
    }
  };

  // Cargar petición desde el sidebar (crea una nueva pestaña)
  const loadRequestFromSidebar = (request) => {
    if (!request) {
      console.error('Request is undefined or null');
      return;
    }
    
    console.log('[PostmanBlock] loadRequestFromSidebar - request recibida:', {
      name: request.name,
      method: request.method,
      url: request.url,
      headers: request.headers,
      'request completa': request
    });
    
    // Si la URL está vacía, mostrar un mensaje informativo
    if (!request.url || request.url.trim() === '') {
      console.warn('[PostmanBlock] La request tiene URL vacía. Esto puede deberse a que la colección fue importada antes de la corrección. Reimporta la colección para obtener las URLs correctas.');
      setToast({ 
        message: `La API "${request.name}" no tiene URL configurada. Por favor, reimporta la colección o configura la URL manualmente.`, 
        type: 'warning',
        duration: 5000
      });
    }
    
    // Buscar la colección que contiene esta request
    const collection = collections.find(c => 
      c.requests && c.requests.some(r => r && r.id === request.id)
    );
    
    if (collection) {
      // Asegurar que la colección esté expandida
      setExpandedCollections(prev => new Set([...prev, collection.id]));
    }
    
    // Crear una nueva pestaña con esta request
    const newTab = {
      id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: request.name || request.url || 'Nueva API',
      method: request.method || 'GET',
      url: request.url || '',
      headers: Array.isArray(request.headers) && request.headers.length > 0 
        ? request.headers 
        : [{ key: '', value: '' }],
      body: request.body || '',
      bodyType: request.bodyType || 'json',
      response: null,
      responseTime: 0,
      statusCode: null,
      authType: request.authType || 'noauth',
      authToken: request.authToken || '',
      authUsername: request.authUsername || '',
      authPassword: request.authPassword || '',
      authHeaderName: request.authHeaderName || 'X-API-Key',
      authApiValue: request.authApiValue || '',
      requestName: request.name || ''
    };
    
    console.log('[PostmanBlock] loadRequestFromSidebar - newTab creada:', {
      id: newTab.id,
      name: newTab.name,
      method: newTab.method,
      url: newTab.url
    });
    
    // Marcar que estamos creando una nueva pestaña para evitar que el useEffect sobrescriba
    isUpdatingFromTabRef.current = true;
    console.log('[PostmanBlock] Flag activado, bloqueando useEffect');
    
    // Actualizar el estado local PRIMERO, antes de agregar la pestaña
    console.log('[PostmanBlock] Actualizando estado local inmediatamente con valores:', {
      method: newTab.method,
      url: newTab.url
    });
    
    setMethod(newTab.method);
    setUrl(newTab.url);
    setHeaders(newTab.headers);
    setBody(newTab.body);
    setBodyType(newTab.bodyType);
    setRequestName(newTab.requestName);
    setAuthType(newTab.authType);
    setAuthToken(newTab.authToken);
    setAuthUsername(newTab.authUsername);
    setAuthPassword(newTab.authPassword);
    setAuthHeaderName(newTab.authHeaderName);
    setAuthApiValue(newTab.authApiValue);
    
    // Agregar la nueva pestaña y activarla en el mismo batch
    // Usar una función de actualización para asegurar que todo se haga en el mismo ciclo
    setTabs(prev => {
      console.log('[PostmanBlock] Agregando nueva pestaña, tabs actuales:', prev.length);
      const updatedTabs = [...prev, newTab];
      
      // Usar requestAnimationFrame para asegurar que React procese primero la actualización de tabs
      requestAnimationFrame(() => {
        // Activar la pestaña después de que React haya procesado la actualización de tabs
        setActiveTabId(newTab.id);
        console.log('[PostmanBlock] Pestaña activada:', newTab.id);
        
        // Resetear el flag después de que todo se haya actualizado
        setTimeout(() => {
          isUpdatingFromTabRef.current = false;
          console.log('[PostmanBlock] Flag reset, sincronización habilitada');
        }, 300);
      });
      
      return updatedTabs;
    });
    
    setToast({ message: `Nueva pestaña creada: "${newTab.name}"`, type: 'success' });
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCollections && !e.target.closest('.relative')) {
        setShowCollections(false);
      }
      if (showCollectionMenu && !e.target.closest('.relative')) {
        setShowCollectionMenu(false);
      }
      if (showAuthMenu && !e.target.closest('.relative')) {
        setShowAuthMenu(false);
      }
      if (showVariables && !e.target.closest('.bg-white.dark\\:bg-gray-800')) {
        setShowVariables(false);
        setEditingVariable(null);
        setNewVariableKey('');
        setNewVariableValue('');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCollections, showCollectionMenu, showAuthMenu, showVariables]);

  return (
    <NodeViewWrapper className={`postman-block-wrapper ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white dark:bg-gray-800 p-4' : 'my-6'}`}>
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden ${isFullscreen ? 'h-full flex flex-col' : 'flex flex-col'}`}>
        {/* Barra de Pestañas */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors min-w-[120px] max-w-[200px] ${
                activeTabId === tab.id
                  ? 'bg-white dark:bg-gray-800 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-xs font-medium truncate flex-1" title={tab.name}>
                {tab.name}
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-500 rounded transition-colors"
                  title="Cerrar pestaña"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={createNewTab}
            className="px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Nueva pestaña"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className={`flex flex-row ${isFullscreen ? 'flex-1 overflow-hidden' : ''}`}>
        {/* Sidebar de Colecciones */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-64'} border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 transition-all duration-300 overflow-hidden flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
          {!sidebarCollapsed && (
            <>
              {/* Header del Sidebar */}
              <div className="p-3 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Colecciones</h3>
                <button
                  onClick={() => setShowCreateCollection(true)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Crear nueva colección"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Colecciones */}
              <div className="flex-1 overflow-y-auto p-2">
                {collections.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay colecciones</p>
                    <p className="text-xs mt-1">Crea una nueva colección</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {collections.map(collection => (
                      <div key={collection.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Header de Colección */}
                        <div className="bg-white dark:bg-gray-800 p-2">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                toggleCollection(collection.id);
                                setCurrentCollection(collection.name);
                              }}
                              className="flex-1 flex items-center gap-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors"
                            >
                              {expandedCollections.has(collection.id) ? (
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-500" />
                              )}
                              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                                {collection.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {collection.requests?.length || 0}
                              </span>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  editCollection(collection.id);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                                title="Editar colección"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCollection(collection.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                                title="Eliminar colección"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Peticiones de la Colección */}
                        {expandedCollections.has(collection.id) && collection.requests && collection.requests.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                            {collection.requests.map(request => (
                              <button
                                key={request.id}
                                onClick={() => loadRequestFromSidebar(request)}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                                  currentCollection === collection.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                              >
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  request.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  request.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  request.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  request.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                  {request.method}
                                </span>
                                <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                                  {request.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Contenido Principal */}
        <div className={`flex-1 flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={sidebarCollapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
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
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                title="Ver historial de peticiones"
              >
                <Clock className="w-4 h-4" />
                Historial
              </button>
              {showHistory && requestHistory.length > 0 && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[300px] max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                      Historial de peticiones
                    </div>
                    {requestHistory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.method === 'GET' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            item.method === 'POST' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            item.method === 'PUT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            item.method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {item.method}
                          </span>
                          <span className="text-gray-900 dark:text-gray-100 truncate">{item.url}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className={item.status >= 200 && item.status < 300 ? 'text-green-600' : 'text-red-600'}>
                            {item.status}
                          </span>
                          <span>{item.time}ms</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCodeGen(!showCodeGen)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                title="Generar código"
              >
                <Code2 className="w-4 h-4" />
                Código
              </button>
              {showCodeGen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[300px]">
                  <div className="p-3">
                    <div className="flex gap-2 mb-2">
                      {['curl', 'javascript', 'python', 'nodejs'].map(lang => (
                        <button
                          key={lang}
                          onClick={() => generateCode(lang)}
                          className={`px-2 py-1 text-xs rounded ${
                            codeLanguage === lang
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                    {generatedCode && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Código generado:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedCode);
                              setToast({ message: 'Código copiado al portapapeles', type: 'success' });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Copy className="w-3 h-3 inline" /> Copiar
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto">
                          <code>{generatedCode}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Autenticación */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Autenticación</label>
              <div className="relative">
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="noauth">Sin autenticación</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>
            </div>
            {authType === 'bearer' && (
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Token"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            )}
            {authType === 'basic' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Usuario"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            )}
            {authType === 'apikey' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={authHeaderName}
                  onChange={(e) => setAuthHeaderName(e.target.value)}
                  placeholder="Nombre del header (ej: X-API-Key)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
                <input
                  type="text"
                  value={authApiValue}
                  onChange={(e) => setAuthApiValue(e.target.value)}
                  placeholder="Valor de la API Key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            )}
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
              <div className="relative">
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  title="Gestionar variables"
                >
                  <Code2 className="w-4 h-4" />
                  Variables
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCollectionMenu(!showCollectionMenu)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                  title="Gestionar colecciones"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {showCollectionMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"
                      >
                        <Upload className="w-4 h-4" />
                        Importar colección
                      </button>
                      {collections.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">Exportar colección:</div>
                          {collections.map(collection => (
                            <button
                              key={collection.id}
                              onClick={() => exportCollection(collection.name)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"
                            >
                              <Download className="w-4 h-4" />
                              {collection.name}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.postman_collection.json"
                onChange={importCollection}
                style={{ display: 'none' }}
              />
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

            {/* Autenticación */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Autenticación</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="noauth">Sin autenticación</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>
              {authType === 'bearer' && (
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Token"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              )}
              {authType === 'basic' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="Usuario"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              )}
              {authType === 'apikey' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={authHeaderName}
                    onChange={(e) => setAuthHeaderName(e.target.value)}
                    placeholder="Nombre del header (ej: X-API-Key)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={authApiValue}
                    onChange={(e) => setAuthApiValue(e.target.value)}
                    placeholder="Valor de la API Key"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              )}
            </div>

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
            <div className="flex flex-col min-h-0 w-full max-w-full overflow-hidden">
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-green-400 font-mono text-sm overflow-auto min-h-[200px] max-h-[500px] max-w-full"
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
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
                      <div className="break-words">{response.error}</div>
                      {response.details && !response.cancelled && (
                        <div className="mt-2 text-xs text-red-300 break-words">{response.details}</div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      {typeof response.data === 'object' ? (
                        <pre className="whitespace-pre-wrap break-words max-w-full overflow-x-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      ) : (
                        <pre className="whitespace-pre-wrap break-words max-w-full overflow-x-auto" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {response.data}
                        </pre>
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

      {/* Modal de confirmación de eliminación de colección */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal && deleteTarget && deleteTarget.type === 'collection'}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDeleteCollection}
        title="¿Eliminar colección?"
        message={`¿Estás seguro de que quieres eliminar la colección "${deleteTarget?.name}"? Esta acción eliminará todas las peticiones dentro de la colección y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal de confirmación de eliminación de bloque */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal && (!deleteTarget || (deleteTarget.type !== 'request' && deleteTarget.type !== 'collection'))}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar bloque Postman?"
        message="Esta acción eliminará permanentemente este bloque Postman de la página. ¿Estás seguro?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal de Crear/Editar Colección */}
      {showCreateCollection && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingCollection ? 'Editar Colección' : 'Nueva Colección'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateCollection(false);
                  setEditingCollection(null);
                  setNewCollectionName('');
                  setNewCollectionDescription('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de la colección *
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Mi Colección API"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      editingCollection ? saveCollectionEdit() : createCollection();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Descripción de la colección..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowCreateCollection(false);
                    setEditingCollection(null);
                    setNewCollectionName('');
                    setNewCollectionDescription('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingCollection ? saveCollectionEdit : createCollection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCollection ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Variables */}
      {showVariables && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Gestionar Variables
              </h3>
              <button
                onClick={() => {
                  setShowVariables(false);
                  setEditingVariable(null);
                  setNewVariableKey('');
                  setNewVariableValue('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {/* Formulario para agregar/editar variable */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {editingVariable !== null ? 'Editar Variable' : 'Nueva Variable'}
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newVariableKey}
                    onChange={(e) => setNewVariableKey(e.target.value)}
                    placeholder="Nombre de la variable (ej: base_url)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editingVariable !== null ? saveVariableEdit() : addVariable();
                      }
                    }}
                  />
                  <input
                    type="text"
                    value={newVariableValue}
                    onChange={(e) => setNewVariableValue(e.target.value)}
                    placeholder="Valor de la variable"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editingVariable !== null ? saveVariableEdit() : addVariable();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={editingVariable !== null ? saveVariableEdit : addVariable}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      {editingVariable !== null ? 'Guardar' : 'Agregar'}
                    </button>
                    {editingVariable !== null && (
                      <button
                        onClick={() => {
                          setEditingVariable(null);
                          setNewVariableKey('');
                          setNewVariableValue('');
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de variables */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variables ({variables.length})
                  </h4>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={importVariables}
                      style={{ display: 'none' }}
                      id="import-variables-input"
                    />
                    <label
                      htmlFor="import-variables-input"
                      className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3 h-3 inline mr-1" />
                      Importar
                    </label>
                    <button
                      onClick={exportVariables}
                      className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Exportar
                    </button>
                  </div>
                </div>
                {variables.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay variables. Agrega una variable para comenzar.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {variables.map((variable, index) => (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg flex items-center justify-between ${
                          variable.enabled
                            ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                              {`{{${variable.key}}}`}
                            </code>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              = {variable.value || '(vacío)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleVariable(index)}
                            className={`px-2 py-1 text-xs rounded ${
                              variable.enabled
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                            title={variable.enabled ? 'Deshabilitar' : 'Habilitar'}
                          >
                            {variable.enabled ? '✓' : '✗'}
                          </button>
                          <button
                            onClick={() => editVariable(index)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteVariable(index)}
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Información sobre uso de variables */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Uso:</strong> Usa <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">{`{{nombre_variable}}`}</code> en URLs, headers o body. 
                  Las variables se sustituyen automáticamente al ejecutar la petición.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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

