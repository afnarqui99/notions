import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  FolderOpen, 
  Save, 
  File,
  Folder,
  ChevronRight,
  ChevronDown,
  Trash2,
  ZoomIn,
  ZoomOut,
  Palette,
  Monitor,
  Edit2,
  Type,
  Package,
  Settings,
  Check,
  XCircle,
  Sparkles,
  Eye,
  Code,
  GitCompare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import LocalStorageService from '../services/LocalStorageService';
import { 
  getThemeExtension, 
  loadCustomThemeColors, 
  saveCustomThemeColors,
  AVAILABLE_THEMES,
  DEFAULT_CUSTOM_THEME_COLORS
} from '../services/CodeMirrorThemeService';
import { EditorView, basicSetup } from 'codemirror';
import { ViewPlugin, Decoration } from '@codemirror/view';
import { closeBrackets } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import FileExplorer from './FileExplorer';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import AIChatPanel from './AIChatPanel';
import GitPanel from './GitPanel';

// Panel de Extensiones - Estilo VS Code
function ExtensionsPanel({ extensions, setExtensions }) {
  const extensionList = [
    {
      id: 'errorLens',
      name: 'Error Lens',
      description: 'Muestra errores y advertencias en línea',
      author: 'usernamehw',
      enabled: extensions.errorLens,
    },
    {
      id: 'betterComments',
      name: 'Better Comments',
      description: 'Resalta comentarios especiales con colores',
      author: 'aaron-bond',
      enabled: extensions.betterComments,
    },
    {
      id: 'es7ReactRedux',
      name: 'ES7+ React/Redux/React-Native snippets',
      description: 'Snippets para React, Redux y React Native',
      author: 'dsznajder',
      enabled: extensions.es7ReactRedux,
    },
    {
      id: 'reactSimpleSnippets',
      name: 'React Simple Snippets',
      description: 'Snippets simples para React',
      author: 'burkeholland',
      enabled: extensions.reactSimpleSnippets,
    },
    {
      id: 'autoCloseTag',
      name: 'Auto Close Tag',
      description: 'Cierra automáticamente las etiquetas HTML/XML',
      author: 'formulahendry',
      enabled: extensions.autoCloseTag,
    },
    {
      id: 'pasteJsonAsCode',
      name: 'Paste JSON as Code',
      description: 'Convierte JSON pegado en código TypeScript/JavaScript',
      author: 'quicktype',
      enabled: extensions.pasteJsonAsCode,
    },
    {
      id: 'backticks',
      name: 'Backticks',
      description: 'Mejora el manejo de backticks y template literals',
      author: 'fractalbrew',
      enabled: extensions.backticks,
    },
    {
      id: 'tokyoNight',
      name: 'Tokyo Night',
      description: 'Tema oscuro elegante (Tokyo Night)',
      author: 'enkia',
      enabled: extensions.tokyoNight,
    },
    {
      id: 'beardedIcons',
      name: 'Bearded Icons',
      description: 'Iconos personalizados para archivos',
      author: 'BeardedBear',
      enabled: extensions.beardedIcons,
    },
  ];

  const toggleExtension = (id) => {
    setExtensions(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <div className="text-[11px] text-[#858585] mb-2 px-2">
          {extensionList.filter(ext => ext.enabled).length} de {extensionList.length} habilitadas
        </div>
        <div className="space-y-1">
          {extensionList.map((ext) => (
            <div
              key={ext.id}
              className={`px-2 py-1.5 rounded cursor-pointer transition-colors ${
                ext.enabled 
                  ? 'bg-[#37373d] hover:bg-[#3e3e42]' 
                  : 'hover:bg-[#2a2d2e]'
              }`}
              onClick={() => toggleExtension(ext.id)}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {ext.enabled ? (
                    <Check className="w-3.5 h-3.5 text-[#4ec9b0] flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#858585] flex-shrink-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#cccccc] font-medium">
                    {ext.name}
                  </div>
                  <div className="text-[11px] text-[#858585] mt-0.5">
                    {ext.description}
                  </div>
                  <div className="text-[10px] text-[#6a6a6a] mt-0.5">
                    {ext.author}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VisualCodeBlock({ node, updateAttributes, deleteNode, editor, getPos }) {
  const [projectPath, setProjectPath] = useState(node.attrs.projectPath || '');
  
  // Estado para colores personalizados del tema
  const [customThemeColors, setCustomThemeColors] = useState(DEFAULT_CUSTOM_THEME_COLORS);

  const [openFiles, setOpenFiles] = useState(() => {
    try {
      return node.attrs.openFiles ? JSON.parse(node.attrs.openFiles) : [];
    } catch {
      return [];
    }
  });
  const [activeFile, setActiveFile] = useState(node.attrs.activeFile || '');
  const [fileContents, setFileContents] = useState(() => {
    try {
      return node.attrs.fileContents ? JSON.parse(node.attrs.fileContents) : {};
    } catch {
      return {};
    }
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(256); // 256px = w-64
  const [isResizingExplorer, setIsResizingExplorer] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, item }
  const [previewMode, setPreviewMode] = useState(false); // true = preview, false = editor
  const [fileToCompare, setFileToCompare] = useState(null); // Archivo seleccionado para comparar
  const [comparingFiles, setComparingFiles] = useState(null); // { file1, file2 } cuando se está comparando
  const contextMenuRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [fileTree, setFileTree] = useState({});
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return node.attrs.fontSize ? parseInt(node.attrs.fontSize) : 14;
    } catch {
      return 14;
    }
  });
  const [theme, setTheme] = useState(() => {
    try {
      return node.attrs.theme || 'cursorDark';
    } catch {
      return 'cursorDark';
    }
  });
  const [projectTitle, setProjectTitle] = useState(() => {
    try {
      return node.attrs.projectTitle || '';
    } catch {
      return '';
    }
  });
  const [projectColor, setProjectColor] = useState(() => {
    try {
      return node.attrs.projectColor || '#1e1e1e';
    } catch {
      return '#1e1e1e';
    }
  });
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showExtensionsPanel, setShowExtensionsPanel] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [extensions, setExtensions] = useState(() => {
    try {
      return node.attrs.extensions ? JSON.parse(node.attrs.extensions) : {
        errorLens: true,
        betterComments: true,
        es7ReactRedux: true,
        reactSimpleSnippets: true,
        autoCloseTag: true,
        pasteJsonAsCode: true,
        backticks: true,
        tokyoNight: false, // Tema, se maneja por separado
        beardedIcons: true
      };
    } catch {
      return {
        errorLens: true,
        betterComments: true,
        es7ReactRedux: true,
        reactSimpleSnippets: true,
        autoCloseTag: true,
        pasteJsonAsCode: true,
        backticks: true,
        tokyoNight: false,
        beardedIcons: true
      };
    }
  });

  const editorViewRef = useRef(null);
  const editorContainerRef = useRef(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.readFile;

  // Permite que el Centro de Ejecución (o cualquier otra parte) enfoque este bloque
  // y abra el Explorador automáticamente.
  useEffect(() => {
    const handleFocusVisualCode = (event) => {
      const detail = event?.detail || {};
      const targetProjectPath = detail.projectPath;
      if (!targetProjectPath || targetProjectPath !== projectPath) return;

      // Expandir el bloque automáticamente para mejor visibilidad
      setIsExpanded(true);
      
      // Si el modo es 'fullscreen', expandir a pantalla completa
      if (detail.openMode === 'fullscreen') {
        setIsFullscreen(true);
      }

      if (detail.openExplorer) {
        setShowFileExplorer(true);
        setShowExtensionsPanel(false);
      }
    };

    window.addEventListener('focus-visual-code', handleFocusVisualCode);
    return () => {
      window.removeEventListener('focus-visual-code', handleFocusVisualCode);
    };
  }, [projectPath]);

  // Manejar el resizing del explorador
  const explorerRef = useRef(null);

  useEffect(() => {
    if (!isResizingExplorer) return;

    const handleMouseMove = (e) => {
      if (!explorerRef.current) return;
      
      const explorerRect = explorerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - explorerRect.left;
      
      // Limitar el ancho entre 150px y 600px
      if (newWidth >= 150 && newWidth <= 600) {
        setExplorerWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingExplorer(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingExplorer]);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detectar si el archivo activo es .md para mostrar el botón de preview
  const isMarkdownFile = activeFile && (activeFile.endsWith('.md') || activeFile.endsWith('.markdown'));

  // Función para calcular diferencias entre dos archivos
  const calculateDiff = (content1, content2) => {
    const lines1 = (content1 || '').split('\n');
    const lines2 = (content2 || '').split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const diff = [];

    for (let i = 0; i < maxLen; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined) {
        diff.push({ type: 'added', line: i + 1, content: line2 });
      } else if (line2 === undefined) {
        diff.push({ type: 'removed', line: i + 1, content: line1 });
      } else if (line1 === line2) {
        diff.push({ type: 'unchanged', line: i + 1, content: line1 });
      } else {
        diff.push({ type: 'modified', line: i + 1, oldContent: line1, newContent: line2 });
      }
    }

    return diff;
  };

  // Función para iniciar comparación
  const startComparison = async (filePath1, filePath2) => {
    try {
      // Cargar ambos archivos si no están cargados
      let content1 = fileContents[filePath1];
      let content2 = fileContents[filePath2];

      if (!content1) {
        if (window.electronAPI && window.electronAPI.readFile) {
          const result = await window.electronAPI.readFile(filePath1);
          content1 = result.content || '';
          setFileContents(prev => ({ ...prev, [filePath1]: content1 }));
        } else {
          const fileItem = Object.values(fileTree).flat().find(item => item.path === filePath1);
          if (fileItem?.handle && fileItem.handle.kind === 'file') {
            const file = await fileItem.handle.getFile();
            content1 = await file.text();
            setFileContents(prev => ({ ...prev, [filePath1]: content1 }));
          }
        }
      }

      if (!content2) {
        if (window.electronAPI && window.electronAPI.readFile) {
          const result = await window.electronAPI.readFile(filePath2);
          content2 = result.content || '';
          setFileContents(prev => ({ ...prev, [filePath2]: content2 }));
        } else {
          const fileItem = Object.values(fileTree).flat().find(item => item.path === filePath2);
          if (fileItem?.handle && fileItem.handle.kind === 'file') {
            const file = await fileItem.handle.getFile();
            content2 = await file.text();
            setFileContents(prev => ({ ...prev, [filePath2]: content2 }));
          }
        }
      }

      setComparingFiles({ file1: filePath1, file2: filePath2 });
      setFileToCompare(null);
      setContextMenu(null);
    } catch (error) {
      console.error('Error cargando archivos para comparar:', error);
      alert('Error al cargar archivos para comparar: ' + error.message);
    }
  };

  // Sincronizar con atributos del nodo
  useEffect(() => {
    updateAttributes({
      projectPath,
      openFiles: JSON.stringify(openFiles),
      activeFile,
      fileContents: JSON.stringify(fileContents),
      fontSize: fontSize.toString(),
      theme,
      projectTitle,
      projectColor,
      extensions: JSON.stringify(extensions),
    });
  }, [projectPath, openFiles, activeFile, fileContents, fontSize, theme, projectTitle, projectColor, extensions, updateAttributes]);

  // Guardar configuración del proyecto en base de datos
  useEffect(() => {
    const saveProjectConfig = async () => {
      if (!projectPath) return;
      
      try {
        const config = {
          projectPath,
          title: projectTitle,
          color: projectColor,
          theme,
          fontSize,
          extensions,
          lastUpdated: new Date().toISOString()
        };
        
        // Usar el path del proyecto como identificador único
        const projectId = projectPath.replace(/[<>:"/\\|?*]/g, '_');
        await LocalStorageService.saveJSONFile(
          `visual-code-project-${projectId}.json`,
          config,
          'data/visual-code-projects'
        );
      } catch (error) {
        console.error('Error guardando configuración del proyecto:', error);
      }
    };

    if (projectPath) {
      saveProjectConfig();
    }
  }, [projectPath, projectTitle, projectColor, theme, fontSize, extensions]);

  // Cargar configuración del proyecto desde base de datos
  useEffect(() => {
    const loadProjectConfig = async () => {
      if (!projectPath) return;
      
      try {
        const projectId = projectPath.replace(/[<>:"/\\|?*]/g, '_');
        const config = await LocalStorageService.readJSONFile(
          `visual-code-project-${projectId}.json`,
          'data/visual-code-projects'
        );
        
        if (config) {
          if (config.title) setProjectTitle(config.title);
          if (config.color) setProjectColor(config.color);
          if (config.theme) setTheme(config.theme);
          if (config.fontSize) setFontSize(parseInt(config.fontSize));
          if (config.extensions) setExtensions(config.extensions);
        }
      } catch (error) {
        console.error('Error cargando configuración del proyecto:', error);
      }
    };

    if (projectPath) {
      loadProjectConfig();
    }
  }, [projectPath]);

  // Cargar estructura de archivos cuando se abre un proyecto
  useEffect(() => {
    if (projectPath) {
      loadFileTree(projectPath);
    }
  }, [projectPath]);

  // Inicializar CodeMirror cuando cambia el archivo activo, el tema o el contenido del archivo
  useEffect(() => {
    if (activeFile && editorContainerRef.current) {
      // Verificar que el contenido del archivo esté disponible
      const fileContent = fileContents[activeFile];
      
      // Si el archivo está en openFiles pero no tiene contenido aún, esperar un momento
      if (openFiles.includes(activeFile) && fileContent === undefined) {
        console.log('[VisualCodeBlock] Esperando contenido del archivo...', activeFile);
        return;
      }
      
      // Destruir editor anterior si existe
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
      // Limpiar contenedor
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
      }
      // Crear nuevo editor
      const timer = setTimeout(() => {
        if (activeFile && editorContainerRef.current) {
          console.log('[VisualCodeBlock] Reinicializando editor con tema:', theme, 'customThemeColors:', customThemeColors);
          initializeEditor();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }
      };
    } else if (!activeFile && editorViewRef.current) {
      // Si no hay archivo activo, limpiar el editor
      editorViewRef.current.destroy();
      editorViewRef.current = null;
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
      }
    }
  }, [activeFile, theme, fileContents, openFiles, customThemeColors]); // Incluir customThemeColors para que se actualice cuando cambien los colores

  const loadFileTree = async (rootPath) => {
    if (!rootPath || rootPath.trim() === '') {
      console.warn('[VisualCodeBlock] No hay ruta de proyecto para cargar');
      return;
    }
    
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.listDirectory) {
        // Electron: usar API de Electron
        const result = await window.electronAPI.listDirectory(rootPath);
        if (result.error) {
          console.error('Error cargando directorio:', result.error);
          setLoading(false);
          return;
        }
        const items = (result.files || []).map(item => ({
          ...item,
          children: item.type === 'folder' ? {} : null,
          loaded: false
        }));
        setFileTree({ [rootPath]: items });
        setExpandedFolders(new Set([rootPath]));
      } else {
        // Navegador: buscar el handle del directorio
        console.log('[VisualCodeBlock] Buscando handle del directorio para navegador...');
        
        // Buscar en window.directoryHandles
        let dirHandle = null;
        if (typeof window !== 'undefined' && window.directoryHandles) {
          dirHandle = Array.from(window.directoryHandles.values()).find(
            h => h.name === rootPath || rootPath.includes(h.name)
          );
        }
        
        if (dirHandle) {
          console.log('[VisualCodeBlock] Handle encontrado, cargando archivos...');
          await loadFilesFromBrowserHandle(dirHandle, rootPath);
        } else {
          console.warn('[VisualCodeBlock] No se encontró handle del directorio. Por favor, selecciona la carpeta nuevamente.');
          // Mostrar mensaje al usuario
          setFileTree({ [rootPath]: [] });
        }
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar archivos desde un DirectoryHandle del navegador
  const loadFilesFromBrowserHandle = async (dirHandle, basePath) => {
    try {
      const items = [];
      
      for await (const [name, handle] of dirHandle.entries()) {
        // Ignorar archivos y carpetas ocultas y node_modules
        if (name.startsWith('.') || name === 'node_modules') {
          continue;
        }
        
        const item = {
          name: name,
          path: basePath === name ? name : `${basePath}/${name}`,
          type: handle.kind === 'directory' ? 'folder' : 'file',
          handle: handle, // Guardar el handle para uso futuro
          children: handle.kind === 'directory' ? {} : null,
          loaded: false
        };
        
        items.push(item);
      }
      
      // Actualizar solo la carpeta específica, manteniendo el resto del árbol
      setFileTree(prev => ({ ...prev, [basePath]: items }));
      // Mantener las carpetas ya expandidas, solo agregar la actual si no está
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(basePath);
        return newSet;
      });
    } catch (error) {
      console.error('[VisualCodeBlock] Error cargando archivos desde handle:', error);
    }
  };

  const loadFolder = async (folderPath) => {
    try {
      if (window.electronAPI && window.electronAPI.listDirectory) {
        // Electron: usar API de Electron
        const result = await window.electronAPI.listDirectory(folderPath);
        if (result.error) return;
        const items = (result.files || []).map(item => ({
          ...item,
          children: item.type === 'folder' ? {} : null,
          loaded: false
        }));
        setFileTree(prev => ({ ...prev, [folderPath]: items }));
      } else {
        // Navegador: buscar el handle de la carpeta en el fileTree
        console.log('[VisualCodeBlock] Buscando handle de carpeta para navegador...', folderPath);
        
        // Buscar la carpeta en el fileTree actual
        const findFolderInTree = (tree, targetPath) => {
          for (const [key, items] of Object.entries(tree)) {
            for (const item of items) {
              if (item.path === targetPath && item.type === 'folder' && item.handle) {
                return item.handle;
              }
              // Buscar recursivamente en subcarpetas
              if (item.type === 'folder' && tree[item.path]) {
                const found = findFolderInTree({ [item.path]: tree[item.path] }, targetPath);
                if (found) return found;
              }
            }
          }
          return null;
        };
        
        const folderHandle = findFolderInTree(fileTree, folderPath);
        
        if (folderHandle && folderHandle.kind === 'directory') {
          console.log('[VisualCodeBlock] Handle de carpeta encontrado, cargando contenido...');
          await loadFilesFromBrowserHandle(folderHandle, folderPath);
        } else {
          console.warn('[VisualCodeBlock] No se encontró el handle de la carpeta:', folderPath);
        }
      }
    } catch (error) {
      console.error('Error cargando carpeta:', error);
    }
  };

  const toggleFolder = (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
      if (!fileTree[folderPath]) {
        loadFolder(folderPath);
      }
    }
    setExpandedFolders(newExpanded);
  };

  const openFile = async (filePath) => {
    console.log('[VisualCodeBlock] openFile llamado con:', filePath);
    
    // Si el archivo ya está abierto, solo activarlo
    if (openFiles.includes(filePath)) {
      console.log('[VisualCodeBlock] Archivo ya está abierto, activándolo');
      setActiveFile(filePath);
      return;
    }

    try {
      let content = '';
      if (window.electronAPI && window.electronAPI.readFile) {
        console.log('[VisualCodeBlock] Leyendo archivo desde Electron API...');
        const result = await window.electronAPI.readFile(filePath);
        if (result.content !== undefined) {
          content = result.content;
          console.log('[VisualCodeBlock] Contenido leído, longitud:', content.length);
        } else if (result.error) {
          console.error('[VisualCodeBlock] Error leyendo archivo:', result.error);
          return;
        }
      } else {
        // Navegador: buscar el handle del archivo en el fileTree
        console.log('[VisualCodeBlock] Buscando archivo en fileTree para navegador...');
        const fileItem = Object.values(fileTree).flat().find(item => item.path === filePath);
        if (fileItem?.handle && fileItem.handle.kind === 'file') {
          try {
            console.log('[VisualCodeBlock] Leyendo archivo desde handle del navegador...');
            const file = await fileItem.handle.getFile();
            content = await file.text();
            console.log('[VisualCodeBlock] Contenido leído desde navegador, longitud:', content.length);
          } catch (error) {
            console.error('[VisualCodeBlock] Error leyendo archivo desde handle:', error);
            alert('Error al leer archivo: ' + error.message);
            return;
          }
        } else {
          console.warn('[VisualCodeBlock] No se encontró el archivo en fileTree o no tiene handle');
          // Intentar buscar en el contenido ya cargado
          if (fileContents[filePath]) {
            content = fileContents[filePath];
            console.log('[VisualCodeBlock] Usando contenido ya cargado del archivo');
          } else {
            alert('No se pudo abrir el archivo. Por favor, selecciona la carpeta nuevamente.');
            return;
          }
        }
      }

      console.log('[VisualCodeBlock] Actualizando estado del archivo...');
      // Actualizar contenido primero
      setFileContents(prev => {
        const updated = { ...prev, [filePath]: content };
        console.log('[VisualCodeBlock] fileContents actualizado, archivos:', Object.keys(updated));
        return updated;
      });
      
      // Luego agregar a openFiles
      setOpenFiles(prev => {
        const updated = [...prev, filePath];
        console.log('[VisualCodeBlock] openFiles actualizado, archivos:', updated);
        return updated;
      });
      
      // Finalmente activar el archivo (esto disparará el useEffect)
      setActiveFile(filePath);
      // Resetear previewMode si el archivo no es .md
      const fileExt = filePath.split('.').pop()?.toLowerCase();
      if (!['md', 'markdown'].includes(fileExt)) {
        setPreviewMode(false);
      }
      console.log('[VisualCodeBlock] Archivo abierto y activado:', filePath);
    } catch (error) {
      console.error('[VisualCodeBlock] Error abriendo archivo:', error);
    }
  };

  const closeFile = (filePath) => {
    setOpenFiles(prev => prev.filter(f => f !== filePath));
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[filePath];
      return newContents;
    });
    if (activeFile === filePath) {
      const remaining = openFiles.filter(f => f !== filePath);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : '');
    }
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }
  };

  const saveFile = async (filePath) => {
    const content = fileContents[filePath] || '';
    try {
      if (window.electronAPI && window.electronAPI.writeFile) {
        await window.electronAPI.writeFile(filePath, content);
        // Actualizar contenido guardado
        setFileContents(prev => ({ ...prev, [filePath]: content }));
      } else {
        // En navegador, mostrar mensaje
        alert('Guardar archivos solo está disponible en Electron');
      }
    } catch (error) {
      console.error('Error guardando archivo:', error);
      alert('Error al guardar archivo: ' + error.message);
    }
  };

  const selectProjectFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        const selectedPath = await window.electronAPI.selectDirectory();
        if (selectedPath) {
          setProjectPath(selectedPath);
          setOpenFiles([]);
          setActiveFile('');
          setFileContents({});
          if (editorViewRef.current) {
            editorViewRef.current.destroy();
            editorViewRef.current = null;
          }
        }
      } else if ('showDirectoryPicker' in window) {
        // Navegador: usar File System Access API
        try {
          const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
          const folderName = handle.name;
          const folderPath = folderName; // En navegador, usamos el nombre como identificador
          
          // Guardar el handle en window.directoryHandles si existe
          if (typeof window !== 'undefined') {
            if (!window.directoryHandles) {
              window.directoryHandles = new Map();
            }
            window.directoryHandles.set(folderPath, handle);
          }
          
          setProjectPath(folderPath);
          setOpenFiles([]);
          setActiveFile('');
          setFileContents({});
          if (editorViewRef.current) {
            editorViewRef.current.destroy();
            editorViewRef.current = null;
          }
          
          // Cargar archivos usando el handle del navegador
          await loadFilesFromBrowserHandle(handle, folderPath);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error seleccionando carpeta:', error);
            alert('Error al seleccionar carpeta: ' + error.message);
          }
        }
      } else {
        alert('Tu navegador no soporta la selección de carpetas.\n\n' +
          'Funciones disponibles:\n' +
          '• Chrome/Edge: Funciona con File System Access API\n' +
          '• Firefox/Safari: Usa la versión Electron de la aplicación');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error seleccionando carpeta:', error);
      }
    }
  };

  const getLanguage = (filePath) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'javascript',
      'tsx': 'javascript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
    };
    return langMap[ext] || 'javascript';
  };

  // Usar el servicio centralizado para temas
  // getThemeExtension y themes ahora vienen del servicio CodeMirrorThemeService

  const initializeEditor = () => {
    if (!editorContainerRef.current || !activeFile) return;

    const content = fileContents[activeFile] || '';
    const language = getLanguage(activeFile);

    let langExtension;
    switch (language) {
      case 'javascript':
        // Habilitar TypeScript para mejor resaltado de sintaxis
        langExtension = javascript({ jsx: true, typescript: true });
        break;
      case 'python':
        langExtension = python();
        break;
      case 'html':
        langExtension = html();
        break;
      case 'css':
        langExtension = css();
        break;
      case 'json':
        langExtension = json();
        break;
      default:
        langExtension = javascript();
    }

    // Configuración avanzada estilo VS Code/Cursor
    const editorExtensions = [
      // Basic setup incluye line numbers, history, fold, etc.
      basicSetup,
      
      // Lenguaje
      langExtension,
      
      // Cerrar brackets automáticamente
      closeBrackets(),
      
      // Estilos de layout y tipografía (NO colores - los colores vienen después)
      EditorView.theme({
        '&': {
          fontSize: `${fontSize}px`,
          height: '100%',
          fontFamily: '"Consolas", "Monaco", "Courier New", "Menlo", monospace',
        },
        '.cm-content': {
          fontSize: `${fontSize}px`,
          fontFamily: '"Consolas", "Monaco", "Courier New", "Menlo", monospace',
          padding: '0',
          minHeight: '100%',
          lineHeight: `${fontSize * 1.5}px`,
          paddingTop: '10px',
          paddingBottom: '10px',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text',
          // backgroundColor se establece en el tema específico, no sobrescribir aquí
        },
        '.cm-editor': {
          height: '100%',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: '"Consolas", "Monaco", "Courier New", "Menlo", monospace',
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text',
        },
        '.cm-line': {
          padding: '0 12px',
        },
        '.cm-gutters': {
          // backgroundColor se establece en el tema específico, no sobrescribir aquí
          border: 'none',
          paddingRight: '8px',
        },
        '.cm-lineNumbers': {
          minWidth: '50px',
          paddingRight: '16px',
          textAlign: 'right',
          fontFamily: '"Consolas", "Monaco", "Courier New", "Menlo", monospace',
          fontSize: `${fontSize}px`,
        },
        '.cm-lineNumbers .cm-gutterElement': {
          padding: '0 8px 0 0',
          minWidth: '20px',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'transparent',
          fontWeight: 'bold',
        },
        '.cm-cursor': {
          borderLeftWidth: '2px',
          borderLeftStyle: 'solid',
          marginLeft: '-1px',
          animation: 'blink 1s step-end infinite',
        },
        '@keyframes blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        '.cm-dropCursor': {
          borderLeftWidth: '2px',
          borderLeftStyle: 'solid',
        },
        // .cm-selectionBackground se establece en el tema específico, no sobrescribir aquí
        '.cm-selectionMatch': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        '.cm-matchingBracket': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          outline: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.cm-nonmatchingBracket': {
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
        },
        '.cm-foldPlaceholder': {
          backgroundColor: 'transparent',
          border: 'none',
          color: '#888',
        },
        '.cm-tooltip': {
          backgroundColor: '#252526',
          border: '1px solid #3e3e42',
          borderRadius: '4px',
        },
        '.cm-tooltip-autocomplete': {
          '& > ul > li[aria-selected]': {
            backgroundColor: '#094771',
            color: '#ffffff',
          },
        },
        '.cm-focused': {
          outline: 'none',
        },
        // Estilo para variables no usadas (similar a Cursor/VS Code)
        '.cm-unused-variable': {
          opacity: '0.5',
          fontStyle: 'italic',
          // color se establece en el tema específico
        },
      }),
      
      // Tema de colores AL FINAL para que tenga prioridad sobre los estilos de layout
      // IMPORTANTE: getThemeExtension retorna un array [themeExtension, syntaxHighlighting]
      // Usar spread operator para agregar ambas extensiones
      ...getThemeExtension(theme, theme === 'custom' ? customThemeColors : null),
      
      // Listener para cambios
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          setFileContents(prev => ({ ...prev, [activeFile]: newContent }));
        }
      }),
    ];

    // Auto Close Tag - Cerrar automáticamente etiquetas HTML/XML
    if (extensions.autoCloseTag && (language === 'html' || language === 'javascript')) {
      editorExtensions.push(closeBrackets());
    }

    // Backticks - Mejorar manejo de template literals
    if (extensions.backticks && language === 'javascript') {
      editorExtensions.push(closeBrackets({ brackets: ['`'] }));
    }

    // Detección de variables no usadas (solo para JavaScript/TypeScript)
    if (language === 'javascript') {
      editorExtensions.push(unusedVariablesExtension());
    }

    console.log('[VisualCodeBlock] Inicializando editor...', {
      hasContainer: !!editorContainerRef.current,
      contentLength: content.length,
      language,
      theme,
      extensionsCount: editorExtensions.length,
      isCustomTheme: theme === 'custom',
      customThemeColors: theme === 'custom' ? customThemeColors : null
    });

    const view = new EditorView({
      doc: content,
      extensions: editorExtensions,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;
    
    // Asegurar que el contenedor permita interacción
    if (editorContainerRef.current) {
      editorContainerRef.current.style.pointerEvents = 'auto';
      editorContainerRef.current.style.userSelect = 'text';
      editorContainerRef.current.style.WebkitUserSelect = 'text';
      editorContainerRef.current.style.MozUserSelect = 'text';
      editorContainerRef.current.style.msUserSelect = 'text';
      editorContainerRef.current.style.cursor = 'text';
      
      // Asegurar que todos los elementos hijos también permitan interacción
      const editorElement = editorContainerRef.current.querySelector('.cm-editor');
      if (editorElement) {
        editorElement.style.pointerEvents = 'auto';
        editorElement.style.userSelect = 'text';
        editorElement.style.WebkitUserSelect = 'text';
        editorElement.style.cursor = 'text';
      }
      
      const contentElement = editorContainerRef.current.querySelector('.cm-content');
      if (contentElement) {
        contentElement.style.pointerEvents = 'auto';
        contentElement.style.userSelect = 'text';
        contentElement.style.WebkitUserSelect = 'text';
        contentElement.style.cursor = 'text';
      }
      
      const scrollerElement = editorContainerRef.current.querySelector('.cm-scroller');
      if (scrollerElement) {
        scrollerElement.style.pointerEvents = 'auto';
        scrollerElement.style.userSelect = 'text';
        scrollerElement.style.WebkitUserSelect = 'text';
        scrollerElement.style.cursor = 'text';
      }
    }
    
    // Enfocar el editor automáticamente y asegurar interacción
    setTimeout(() => {
      view.focus();
      console.log('[VisualCodeBlock] Editor enfocado, editable:', view.state.readOnly === false);
      
      // Verificar y forzar estilos en todos los elementos del editor
      const editorElement = editorContainerRef.current?.querySelector('.cm-editor');
      if (editorElement) {
        console.log('[VisualCodeBlock] Elemento editor encontrado:', {
          pointerEvents: window.getComputedStyle(editorElement).pointerEvents,
          userSelect: window.getComputedStyle(editorElement).userSelect,
        });
        
        // Forzar estilos en todos los elementos del editor
        const allEditorElements = editorContainerRef.current?.querySelectorAll('.cm-editor, .cm-content, .cm-scroller, .cm-line, .cm-line *');
        allEditorElements?.forEach((el) => {
          const computed = window.getComputedStyle(el);
          if (computed.pointerEvents === 'none') {
            el.style.pointerEvents = 'auto';
          }
          if (computed.userSelect === 'none' || computed.userSelect === '') {
            el.style.userSelect = 'text';
            el.style.WebkitUserSelect = 'text';
            el.style.MozUserSelect = 'text';
            el.style.msUserSelect = 'text';
          }
          if (computed.cursor === 'default' || computed.cursor === '') {
            el.style.cursor = 'text';
          }
        });
        
        // Asegurar que el editor pueda recibir eventos de teclado
        editorElement.setAttribute('tabindex', '0');
        editorElement.setAttribute('contenteditable', 'true');
      }
    }, 100);
  };

  // Actualizar fontSize cuando cambia
  useEffect(() => {
    try {
      console.log('[VisualCodeBlock] useEffect fontSize - fontSize actual:', fontSize);
      if (!editorViewRef.current) {
        console.log('[VisualCodeBlock] editorViewRef.current es null, saliendo');
        return;
      }
      console.log('[VisualCodeBlock] Actualizando editorView con nuevo fontSize...');
      editorViewRef.current.dispatch({
        effects: EditorView.theme({
          '&': {
            fontSize: `${fontSize}px`,
          },
          '.cm-content': {
            fontSize: `${fontSize}px`,
          },
        }),
      });
      console.log('[VisualCodeBlock] editorView actualizado exitosamente con fontSize:', fontSize);
    } catch (error) {
      console.error('[VisualCodeBlock] ERROR en useEffect fontSize:', error);
      console.error('[VisualCodeBlock] Stack trace:', error.stack);
      console.error('[VisualCodeBlock] Error details:', {
        message: error.message,
        name: error.name,
        fontSize: fontSize
      });
    }
  }, [fontSize]);

  // Manejar Ctrl+S para guardar y Ctrl+/Ctrl- para zoom
  useEffect(() => {
    const handleKeyDown = (e) => {
      try {
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && activeFile) {
          e.preventDefault();
          saveFile(activeFile);
        }
        // Zoom in: Ctrl + o Ctrl =
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=') && !e.shiftKey) {
          console.log('[VisualCodeBlock] Ctrl+ detectado, aumentando zoom...');
          e.preventDefault();
          e.stopPropagation();
          setFontSize(prev => {
            const newSize = Math.min(prev + 1, 32);
            console.log('[VisualCodeBlock] Zoom aumentado a:', newSize);
            return newSize;
          });
        }
        // Zoom out: Ctrl -
        if ((e.ctrlKey || e.metaKey) && e.key === '-') {
          console.log('[VisualCodeBlock] Ctrl- detectado, reduciendo zoom...');
          e.preventDefault();
          e.stopPropagation();
          setFontSize(prev => {
            const newSize = Math.max(prev - 1, 8);
            console.log('[VisualCodeBlock] Zoom reducido a:', newSize);
            return newSize;
          });
        }
      } catch (error) {
        console.error('[VisualCodeBlock] ERROR en handleKeyDown:', error);
        console.error('[VisualCodeBlock] Stack trace:', error.stack);
        console.error('[VisualCodeBlock] Error details:', {
          message: error.message,
          name: error.name,
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey
        });
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFile]);

  const updateEditorContent = () => {
    if (!editorViewRef.current || !activeFile) return;
    const content = fileContents[activeFile];
    if (content === undefined) {
      console.log('[VisualCodeBlock] Contenido del archivo no disponible aún');
      return;
    }
    const currentContent = editorViewRef.current.state.doc.toString();
    if (currentContent !== content) {
      console.log('[VisualCodeBlock] Actualizando contenido del editor');
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: content,
        },
      });
    }
  };

  // Actualizar el contenido del editor cuando cambia fileContents para el archivo activo
  useEffect(() => {
    if (activeFile && editorViewRef.current && fileContents[activeFile] !== undefined) {
      updateEditorContent();
    }
  }, [fileContents, activeFile]);

  const renderFileTree = (items, parentPath = '', level = 0) => {
    if (!items) return null;

    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isFolder = item.type === 'folder';
      const isActive = activeFile === item.path;
      const indent = level * 16;

      return (
        <div key={item.path} className="select-none">
          <div
            className={`flex items-center gap-1.5 cursor-pointer text-[13px] transition-colors ${
              isActive 
                ? 'bg-[#37373d] text-[#ffffff]' 
                : 'text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
            style={{ paddingLeft: `${8 + indent}px`, paddingRight: '8px', paddingTop: '2px', paddingBottom: '2px' }}
            title={item.path} // Tooltip con la ruta completa
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.path);
              } else {
                openFile(item.path);
              }
            }}
            onContextMenu={(e) => {
              if (!isFolder) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Prevenir que otros listeners capturen el evento
                console.log('[VisualCodeBlock] Menú contextual abierto para:', item.path, 'item completo:', item);
                setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  item: {
                    ...item,
                    type: item.type || (isFolder ? 'folder' : 'file') // Asegurar que tenga type
                  }
                });
              }
            }}
          >
            {isFolder ? (
              <>
                <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-[#cccccc]" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-[#cccccc]" />
                  )}
                </div>
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-[#4ec9b0]" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0 text-[#4ec9b0]" />
                )}
              </>
            ) : (
              <>
                <div className="w-4 flex-shrink-0" />
                {(() => {
                  const fileExt = item.name.split('.').pop()?.toLowerCase();
                  let iconColor = '#cccccc';
                  
                  // Colores según extensión (estilo VS Code)
                  if (['js', 'jsx', 'mjs', 'cjs'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['ts', 'tsx'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['py', 'pyw', 'pyc'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['html', 'htm'].includes(fileExt)) iconColor = '#ce9178';
                  else if (['css', 'scss', 'sass', 'less'].includes(fileExt)) iconColor = '#ce9178';
                  else if (['json', 'jsonc'].includes(fileExt)) iconColor = '#ce9178';
                  else if (['md', 'markdown'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['xml', 'svg'].includes(fileExt)) iconColor = '#ce9178';
                  else if (['yml', 'yaml'].includes(fileExt)) iconColor = '#ce9178';
                  else if (['sh', 'bash', 'zsh'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['java', 'class'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['c', 'cpp', 'h', 'hpp'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['go'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['rs'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['php'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['rb'].includes(fileExt)) iconColor = '#ce9178';
                  else if (['sql'].includes(fileExt)) iconColor = '#4ec9b0';
                  else if (['txt', 'log'].includes(fileExt)) iconColor = '#858585';
                  
                  return <File className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
                })()}
              </>
            )}
            <span className="truncate flex-1">{item.name}</span>
          </div>
          {isFolder && isExpanded && fileTree[item.path] && (
            <div>
              {renderFileTree(fileTree[item.path], item.path, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getFileName = (filePath) => {
    return filePath.split(/[/\\]/).pop() || filePath;
  };

  return (
    <NodeViewWrapper 
      className="visual-code-block-wrapper my-4"
      style={{ pointerEvents: 'auto' }}
    >
      <div 
        className={`bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-lg overflow-hidden ${
          isFullscreen 
            ? 'fixed inset-0 z-[50000] rounded-none' 
            : isExpanded 
              ? 'fixed inset-4 z-[50000]' 
              : ''
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Header - Estilo VS Code */}
        <div 
          className="border-b border-[#3e3e42] px-3 py-1.5 flex items-center justify-between transition-colors"
          style={{ backgroundColor: projectColor || '#1e1e1e' }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[#cccccc] font-medium text-[13px]">afnarqui</span>
            {projectPath && (
              <>
                <span className="text-[#858585] text-[11px]">•</span>
                {projectTitle ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#cccccc] font-normal text-[13px] truncate" title={projectTitle}>
                      {projectTitle}
                    </span>
                    <button
                      onClick={() => setShowTitleEditor(true)}
                      className="p-1 hover:bg-[#3e3e42] rounded transition-colors flex-shrink-0"
                      title="Editar título"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#cccccc]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTitleEditor(true)}
                    className="flex items-center gap-1 px-2 py-1 text-[12px] text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
                    title="Agregar título al proyecto"
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>Sin título</span>
                  </button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={selectProjectFolder}
              className="px-2.5 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-[#ffffff] rounded text-[12px] flex items-center gap-1.5 transition-colors"
              title="Abrir carpeta"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              Abrir Carpeta
            </button>
            {activeFile && (
              <button
                onClick={() => saveFile(activeFile)}
                className="px-2.5 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-[#ffffff] rounded text-[12px] flex items-center gap-1.5 transition-colors"
                title="Guardar archivo (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </button>
            )}
            {/* Zoom Controls - Estilo VS Code */}
            <div className="flex items-center gap-1 border-r border-[#3e3e42] pr-1.5 mr-1.5">
              <button
                type="button"
                onClick={(e) => {
                  try {
                    e.preventDefault();
                    e.stopPropagation();
                    setFontSize(prev => Math.max(prev - 1, 8));
                  } catch (error) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
                title="Reducir zoom (Ctrl -)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-[#858585] px-1 min-w-[3rem] text-center">{fontSize}px</span>
              <button
                type="button"
                onClick={(e) => {
                  try {
                    e.preventDefault();
                    e.stopPropagation();
                    setFontSize(prev => Math.min(prev + 1, 32));
                  } catch (error) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
                title="Ampliar zoom (Ctrl +)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Color de fondo del proyecto */}
            <div className="relative">
              <button
                className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
                title="Cambiar color de fondo del proyecto"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
              >
                <div 
                  className="w-4 h-4 rounded border border-[#3e3e42]"
                  style={{ backgroundColor: projectColor }}
                />
              </button>
              {showColorPicker && (
                <div className="absolute right-0 top-full mt-2 bg-[#252526] border border-[#3e3e42] rounded shadow-xl z-50 p-3">
                  <div className="text-[11px] text-[#cccccc] mb-2 font-semibold uppercase">Color de fondo</div>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#1e1e1e', '#2d2d2d', '#1a1a2e', '#16213e', '#0f3460', '#0a1929',
                      '#1a1a1a', '#2a2a2a', '#1e3a5f', '#2d4a6f', '#3d5a7f', '#4d6a8f',
                      '#1a1a1a', '#2d2d2d', '#3a3a3a', '#4a4a4a', '#5a5a5a', '#6a6a6a',
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setProjectColor(color);
                          setShowColorPicker(false);
                        }}
                        className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                        style={{ 
                          backgroundColor: color,
                          borderColor: projectColor === color ? '#007acc' : 'transparent'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#3e3e42]">
                    <input
                      type="color"
                      value={projectColor}
                      onChange={(e) => setProjectColor(e.target.value)}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Theme Selector */}
            <div className="relative">
              <button
                className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
                title="Seleccionar paleta de colores"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowThemeModal(true);
                }}
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* AI Chat Button */}
            <div className="relative">
              <button
                className={`p-1.5 rounded transition-colors ${
                  showAIChat 
                    ? 'bg-[#0e639c] text-[#ffffff]' 
                    : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42]'
                }`}
                title="Chat de IA"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAIChat(!showAIChat);
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className="px-2.5 py-1 bg-[#3e3e42] hover:bg-[#464647] text-[#cccccc] rounded text-[12px] transition-colors"
              title={showFileExplorer ? "Ocultar explorador" : "Mostrar explorador"}
            >
              {showFileExplorer ? 'Ocultar' : 'Mostrar'}
            </button>
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setIsExpanded(!isExpanded);
              }}
              className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-[#cccccc] hover:text-[#f48771] hover:bg-[#3e3e42] rounded transition-colors"
              title="Eliminar bloque"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex ${isFullscreen ? 'h-[calc(100vh-3.5rem)]' : isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`}>
          {/* File Explorer Sidebar - Estilo VS Code */}
          {showFileExplorer && (
            <div 
              ref={explorerRef}
              className="flex-shrink-0 border-r border-[#3e3e42] bg-[#252526] overflow-hidden flex flex-col relative"
              style={{ width: `${explorerWidth}px` }}
            >
              {/* Tabs del sidebar - Estilo VS Code */}
              <div className="bg-[#2d2d30] border-b border-[#3e3e42] flex">
                <button
                  onClick={() => {
                    setShowExtensionsPanel(false);
                    setShowGitPanel(false);
                  }}
                  className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    !showExtensionsPanel && !showGitPanel
                      ? 'bg-[#252526] text-[#ffffff] border-b-2 border-b-[#007acc]' 
                      : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#2d2d30]'
                  }`}
                >
                  EXPLORADOR
                </button>
                <button
                  onClick={() => {
                    setShowExtensionsPanel(false);
                    setShowGitPanel(true);
                  }}
                  className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    showGitPanel
                      ? 'bg-[#252526] text-[#ffffff] border-b-2 border-b-[#007acc]' 
                      : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#2d2d30]'
                  }`}
                >
                  GIT
                </button>
                <button
                  onClick={() => {
                    setShowExtensionsPanel(true);
                    setShowGitPanel(false);
                  }}
                  className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    showExtensionsPanel
                      ? 'bg-[#252526] text-[#ffffff] border-b-2 border-b-[#007acc]' 
                      : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#2d2d30]'
                  }`}
                >
                  EXTENSIONES
                </button>
              </div>
              
              {/* Contenido del sidebar */}
              {showExtensionsPanel ? (
                <ExtensionsPanel 
                  extensions={extensions} 
                  setExtensions={setExtensions}
                />
              ) : showGitPanel ? (
                <GitPanel
                  projectPath={projectPath}
                  onFileSelect={(filePath) => {
                    // Cargar el archivo cuando se selecciona desde Git
                    if (filePath && projectPath) {
                      const fullPath = filePath.startsWith(projectPath) 
                        ? filePath 
                        : `${projectPath}/${filePath}`.replace(/\/+/g, '/');
                      loadFile(fullPath);
                    }
                  }}
                />
              ) : (
                <>
                  {/* Header del explorador */}
                  <div className="bg-[#2d2d30] border-b border-[#3e3e42] px-3 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide">
                        EXPLORADOR
                      </span>
                    </div>
                    <button
                      onClick={() => setShowFileExplorer(false)}
                      className="p-1 hover:bg-[#3e3e42] rounded transition-colors"
                      title="Ocultar explorador"
                    >
                      <X className="w-3.5 h-3.5 text-[#cccccc]" />
                    </button>
                  </div>
                  
                  {/* Contenido del explorador */}
                  <div className="flex-1 overflow-y-auto">
                    {projectPath ? (
                      <div className="py-1">
                        {/* Nombre del proyecto */}
                        <div className="px-3 py-1.5 text-[11px] font-semibold text-[#cccccc] uppercase tracking-wide border-b border-[#3e3e42]">
                          {projectPath.split(/[/\\]/).pop() || projectPath}
                        </div>
                        {loading ? (
                          <div className="text-[#858585] text-[13px] px-3 py-2">Cargando...</div>
                        ) : (
                          <div className="py-1">
                            {renderFileTree(fileTree[projectPath] || [])}
                          </div>
                        )}
                      </div>
                ) : (
                  <div className="p-4 text-center text-[#858585] text-[13px]">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="mb-2">Selecciona una carpeta para comenzar</p>
                    {projectPath && !projectPath.includes('/') && !projectPath.includes('\\') && !projectPath.includes(':') && (
                      <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-[12px] text-yellow-400">
                        <p className="font-semibold mb-1">⚠️ Ruta inválida</p>
                        <p>Este proyecto tiene una ruta incompleta. Haz clic en "Abrir Carpeta" para seleccionar la carpeta nuevamente.</p>
                      </div>
                    )}
                  </div>
                )}
                  </div>
                </>
              )}
              {/* Resizer para el explorador */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#007acc] transition-colors z-10"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizingExplorer(true);
                }}
                style={{
                  backgroundColor: isResizingExplorer ? '#007acc' : 'transparent'
                }}
              />
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Tabs - Estilo VS Code */}
            {openFiles.length > 0 && (
              <div className="bg-[#2d2d2d] border-b border-[#3e3e42] flex items-center overflow-x-auto">
                {openFiles.map((filePath) => {
                  const isActive = activeFile === filePath;
                  const fileName = getFileName(filePath);
                  const fileExt = fileName.split('.').pop()?.toLowerCase();
                  
                  // Colores de iconos según extensión (estilo VS Code)
                  const getFileIconColor = () => {
                    if (['js', 'jsx', 'ts', 'tsx'].includes(fileExt)) return 'text-[#4ec9b0]';
                    if (['py'].includes(fileExt)) return 'text-[#4ec9b0]';
                    if (['html', 'htm'].includes(fileExt)) return 'text-[#ce9178]';
                    if (['css', 'scss', 'sass'].includes(fileExt)) return 'text-[#ce9178]';
                    if (['json'].includes(fileExt)) return 'text-[#ce9178]';
                    return 'text-[#cccccc]';
                  };
                  
                  return (
                    <div
                      key={filePath}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border-r border-[#3e3e42] cursor-pointer transition-colors group ${
                        isActive
                          ? 'bg-[#1e1e1e] text-[#cccccc] border-b-2 border-b-[#007acc]'
                          : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#37373d] hover:text-[#cccccc]'
                      }`}
                      onClick={() => {
                        setActiveFile(filePath);
                        // Resetear previewMode si el archivo no es .md
                        const fileExt = filePath.split('.').pop()?.toLowerCase();
                        if (!['md', 'markdown'].includes(fileExt)) {
                          setPreviewMode(false);
                        }
                      }}
                    >
                      <File className={`w-3.5 h-3.5 flex-shrink-0 ${getFileIconColor()}`} />
                      <span className="text-[13px] whitespace-nowrap">{fileName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(filePath);
                        }}
                        className={`ml-1 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isActive 
                            ? 'hover:bg-[#3e3e42]' 
                            : 'hover:bg-[#3e3e42]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5 text-[#cccccc]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Editor - Estilo VS Code */}
            <div 
              className="flex-1 overflow-hidden bg-[#1e1e1e] min-h-0 flex flex-col"
              style={{ pointerEvents: 'auto' }}
            >
              {comparingFiles ? (
                /* Vista de Comparación */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header de comparación */}
                  <div className="bg-[#252526] border-b border-[#3e3e42] px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="w-4 h-4 text-[#4ec9b0] flex-shrink-0" />
                        <span className="text-[13px] text-[#cccccc] truncate" title={comparingFiles.file1}>
                          {getFileName(comparingFiles.file1)}
                        </span>
                      </div>
                      <GitCompare className="w-4 h-4 text-[#858585] flex-shrink-0" />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <File className="w-4 h-4 text-[#4ec9b0] flex-shrink-0" />
                        <span className="text-[13px] text-[#cccccc] truncate" title={comparingFiles.file2}>
                          {getFileName(comparingFiles.file2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setComparingFiles(null);
                        setFileToCompare(null);
                      }}
                      className="p-1.5 hover:bg-[#3e3e42] rounded transition-colors"
                      title="Cerrar comparación"
                    >
                      <X className="w-4 h-4 text-[#cccccc]" />
                    </button>
                  </div>
                  
                  {/* Vista lado a lado */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Archivo 1 */}
                    <div className="flex-1 flex flex-col border-r border-[#3e3e42] overflow-hidden">
                      <div className="bg-[#2d2d30] px-3 py-1.5 border-b border-[#3e3e42] flex items-center justify-between">
                        <span className="text-[11px] text-[#858585] uppercase font-semibold truncate" title={comparingFiles.file1}>
                          {getFileName(comparingFiles.file1)}
                        </span>
                        <span className="text-[10px] text-[#858585]">
                          (Original)
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed">
                        {(() => {
                          const content1 = fileContents[comparingFiles.file1] || '';
                          const content2 = fileContents[comparingFiles.file2] || '';
                          const diff = calculateDiff(content1, content2);
                          
                          return diff.map((item, idx) => {
                            if (item.type === 'unchanged') {
                              return (
                                <div key={idx} className="px-4 py-0.5 text-[#cccccc] whitespace-pre-wrap">
                                  {item.content || ' '}
                                </div>
                              );
                            } else if (item.type === 'removed') {
                              return (
                                <div key={idx} className="bg-[#5a1d1d] text-[#ff6b6b] px-4 py-0.5 whitespace-pre-wrap border-l-4 border-[#ff6b6b]">
                                  {item.content || ' '}
                                </div>
                              );
                            } else if (item.type === 'added') {
                              return (
                                <div key={idx} className="px-4 py-0.5 text-[#858585] whitespace-pre-wrap">
                                  {' '}
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx}>
                                  <div className="bg-[#5a1d1d] text-[#ff6b6b] px-4 py-0.5 whitespace-pre-wrap border-l-4 border-[#ff6b6b]">
                                    {item.oldContent || ' '}
                                  </div>
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                    </div>
                    
                    {/* Archivo 2 */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="bg-[#2d2d30] px-3 py-1.5 border-b border-[#3e3e42] flex items-center justify-between">
                        <span className="text-[11px] text-[#858585] uppercase font-semibold truncate" title={comparingFiles.file2}>
                          {getFileName(comparingFiles.file2)}
                        </span>
                        <span className="text-[10px] text-[#858585]">
                          (Comparado)
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed">
                        {(() => {
                          const content1 = fileContents[comparingFiles.file1] || '';
                          const content2 = fileContents[comparingFiles.file2] || '';
                          const diff = calculateDiff(content1, content2);
                          
                          return diff.map((item, idx) => {
                            if (item.type === 'unchanged') {
                              return (
                                <div key={idx} className="px-4 py-0.5 text-[#cccccc] whitespace-pre-wrap">
                                  {item.content || ' '}
                                </div>
                              );
                            } else if (item.type === 'removed') {
                              return (
                                <div key={idx} className="px-4 py-0.5 text-[#858585] whitespace-pre-wrap">
                                  {' '}
                                </div>
                              );
                            } else if (item.type === 'added') {
                              return (
                                <div key={idx} className="bg-[#1e3a1e] text-[#4ade80] px-4 py-0.5 whitespace-pre-wrap border-l-4 border-[#4ade80]">
                                  {item.content || ' '}
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx}>
                                  <div className="bg-[#1e3a1e] text-[#4ade80] px-4 py-0.5 whitespace-pre-wrap border-l-4 border-[#4ade80]">
                                    {item.newContent || ' '}
                                  </div>
                                </div>
                              );
                            }
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeFile ? (
                <>
                  {/* Barra de herramientas para archivos .md */}
                  {isMarkdownFile && (
                    <div className="bg-[#252526] border-b border-[#3e3e42] px-3 py-1.5 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className={`px-2.5 py-1 rounded text-[12px] flex items-center gap-1.5 transition-colors ${
                          previewMode
                            ? 'bg-[#0e639c] text-[#ffffff]'
                            : 'bg-[#2d2d30] text-[#cccccc] hover:bg-[#3e3e42]'
                        }`}
                        title={previewMode ? "Ver código" : "Ver preview"}
                      >
                        {previewMode ? (
                          <>
                            <Code className="w-3.5 h-3.5" />
                            <span>Código</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Contenido: Editor o Preview */}
                  {isMarkdownFile && previewMode ? (
                    <div className="flex-1 overflow-y-auto p-4 bg-[#1e1e1e]">
                      <div className="prose prose-invert max-w-none dark:prose-invert">
                        <ReactMarkdown className="text-[#cccccc]">
                          {fileContents[activeFile] || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <div 
                      ref={editorContainerRef} 
                      className="h-full w-full min-h-0"
                      style={{
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        msUserSelect: 'text',
                        pointerEvents: 'auto',
                        cursor: 'text',
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-[#858585]">
                  <div className="text-center">
                    <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-[13px]">Selecciona un archivo para editarlo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición de título */}
      {showTitleEditor && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4"
          onClick={() => setShowTitleEditor(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Título del Proyecto
              </h2>
              <button
                onClick={() => setShowTitleEditor(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowTitleEditor(false);
                  } else if (e.key === 'Escape') {
                    setShowTitleEditor(false);
                  }
                }}
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowTitleEditor(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowTitleEditor(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          if (editorViewRef.current) {
            editorViewRef.current.destroy();
          }
          deleteNode();
        }}
        title="Eliminar Visual Code"
        message="¿Estás seguro de que deseas eliminar este bloque de Visual Code? Se perderán los archivos abiertos no guardados."
      />

      {/* Modal de selección de paleta de colores */}
      {showThemeModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4"
          onClick={() => setShowThemeModal(false)}
        >
          <div 
            className="bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#2d2d30] border-b border-[#3e3e42] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-[#4ec9b0]" />
                <h2 className="text-xl font-bold text-[#cccccc]">
                  Seleccionar Paleta de Colores
                </h2>
              </div>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-2 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42] rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_THEMES.map((themeOption) => {
                  const isSelected = theme === themeOption.value;
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => {
                        setTheme(themeOption.value);
                        setShowThemeModal(false);
                      }}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#007acc] bg-[#37373d]'
                          : 'border-[#3e3e42] bg-[#2d2d30] hover:border-[#007acc]/50 hover:bg-[#37373d]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[#cccccc] font-semibold text-base mb-1">
                            {themeOption.label}
                          </div>
                          <div className="text-[#858585] text-xs">
                            {themeOption.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-[#4ec9b0]" />
                        )}
                      </div>
                      
                      {/* Preview */}
                      <div
                        className="rounded font-mono text-xs border border-[#3e3e42] whitespace-pre flex"
                        style={{
                          backgroundColor: themeOption.preview.backgroundColor,
                          minHeight: '80px'
                        }}
                      >
                        {/* Gutters */}
                        <div
                          className="px-2 py-3 text-right select-none"
                          style={{
                            backgroundColor: themeOption.preview.gutterColor || themeOption.preview.backgroundColor,
                            color: '#858585',
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            minWidth: '40px'
                          }}
                        >
                          <div>1</div>
                          <div>2</div>
                          <div>3</div>
                          <div>4</div>
                          <div>5</div>
                        </div>
                        {/* Code content */}
                        <div
                          className="flex-1 p-3"
                          style={{
                            color: themeOption.preview.textColor
                          }}
                        >
                          <div>
                            <span style={{ color: themeOption.preview.keywordColor }}>const</span>
                            <span style={{ color: themeOption.preview.textColor }}> </span>
                            <span style={{ color: themeOption.preview.textColor }}>greeting</span>
                            <span style={{ color: themeOption.preview.textColor }}> = </span>
                            <span style={{ color: themeOption.preview.stringColor }}>"Hello World"</span>
                            <span style={{ color: themeOption.preview.textColor }}>;</span>
                          </div>
                          <div style={{ color: themeOption.preview.commentColor }}>
                            // Comentario de ejemplo
                          </div>
                          <div>
                            <span style={{ color: themeOption.preview.keywordColor }}>function</span>
                            <span style={{ color: themeOption.preview.textColor }}> </span>
                            <span style={{ color: themeOption.preview.textColor }}>sum</span>
                            <span style={{ color: themeOption.preview.textColor }}>(a, b) {`{`}</span>
                          </div>
                          <div style={{ color: themeOption.preview.textColor }}>
                            {'  '}return a + b;
                          </div>
                          <div style={{ color: themeOption.preview.textColor }}>
                            {`}`}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#3e3e42] px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menú contextual */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#252526] border border-[#3e3e42] rounded shadow-lg py-1 min-w-[180px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 100000, // z-index muy alto para asegurar que esté por encima de todo
          }}
        >
          {(() => {
            const fileExt = contextMenu.item?.name.split('.').pop()?.toLowerCase();
            const isMarkdown = ['md', 'markdown'].includes(fileExt);
            const hasFileToCompare = fileToCompare !== null;
            
            console.log('[VisualCodeBlock] Renderizando menú contextual:', {
              item: contextMenu.item?.name,
              isMarkdown,
              hasFileToCompare,
              fileToCompare
            });
            
            return (
              <>
                {/* Opción Comparar - siempre visible para archivos */}
                {contextMenu.item && contextMenu.item.type !== 'folder' && (
                  <>
                    {hasFileToCompare ? (
                      <button
                        onClick={() => {
                          if (contextMenu.item) {
                            startComparison(fileToCompare, contextMenu.item.path);
                          }
                          setContextMenu(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors text-[#cccccc]"
                      >
                        <GitCompare className="w-4 h-4" />
                        Comparar con {getFileName(fileToCompare)}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (contextMenu.item) {
                            setFileToCompare(contextMenu.item.path);
                            setContextMenu(null);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors text-[#cccccc]"
                      >
                        <GitCompare className="w-4 h-4" />
                        Comparar
                      </button>
                    )}
                    <div className="border-t border-[#3e3e42] my-1" />
                  </>
                )}
                {isMarkdown && (
                  <>
                    <button
                      onClick={() => {
                        if (contextMenu.item) {
                          openFile(contextMenu.item.path);
                          setPreviewMode(true);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors text-[#cccccc]"
                    >
                      <Eye className="w-4 h-4" />
                      Abrir en Preview
                    </button>
                    <button
                      onClick={() => {
                        if (contextMenu.item) {
                          openFile(contextMenu.item.path);
                          setPreviewMode(false);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors text-[#cccccc]"
                    >
                      <Code className="w-4 h-4" />
                      Abrir en Editor
                    </button>
                    <div className="border-t border-[#3e3e42] my-1" />
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Indicador cuando hay un archivo seleccionado para comparar */}
      {fileToCompare && !comparingFiles && (
        <div className="fixed bottom-4 right-4 bg-[#0e639c] text-white px-4 py-2 rounded-lg shadow-lg z-[99999] flex items-center gap-2">
          <GitCompare className="w-4 h-4" />
          <span className="text-sm">
            Archivo seleccionado: {getFileName(fileToCompare)}
          </span>
          <button
            onClick={() => setFileToCompare(null)}
            className="ml-2 p-1 hover:bg-[#1177bb] rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        activeFile={activeFile}
        fileContents={fileContents}
        projectPath={projectPath}
      />
    </NodeViewWrapper>
  );
}

