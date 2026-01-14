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
  Monitor
} from 'lucide-react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import FileExplorer from './FileExplorer';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function VisualCodeBlock({ node, updateAttributes, deleteNode, editor, getPos }) {
  const [projectPath, setProjectPath] = useState(node.attrs.projectPath || '');
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
      return node.attrs.theme || 'oneDark';
    } catch {
      return 'oneDark';
    }
  });

  const editorViewRef = useRef(null);
  const editorContainerRef = useRef(null);
  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.readFile;

  // Sincronizar con atributos del nodo
  useEffect(() => {
    updateAttributes({
      projectPath,
      openFiles: JSON.stringify(openFiles),
      activeFile,
      fileContents: JSON.stringify(fileContents),
      fontSize: fontSize.toString(),
      theme,
    });
  }, [projectPath, openFiles, activeFile, fileContents, fontSize, theme, updateAttributes]);

  // Cargar estructura de archivos cuando se abre un proyecto
  useEffect(() => {
    if (projectPath) {
      loadFileTree(projectPath);
    }
  }, [projectPath]);

  // Inicializar CodeMirror cuando cambia el archivo activo o el tema
  useEffect(() => {
    if (activeFile && editorContainerRef.current) {
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
          initializeEditor();
        }
      }, 0);

      return () => {
        clearTimeout(timer);
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }
      };
    }
  }, [activeFile, theme]);

  const loadFileTree = async (rootPath) => {
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.listDirectory) {
        const result = await window.electronAPI.listDirectory(rootPath);
        if (result.error) {
          console.error('Error cargando directorio:', result.error);
          return;
        }
        const items = (result.files || []).map(item => ({
          ...item,
          children: item.type === 'folder' ? {} : null,
          loaded: false
        }));
        setFileTree({ [rootPath]: items });
        setExpandedFolders(new Set([rootPath]));
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolder = async (folderPath) => {
    try {
      if (window.electronAPI && window.electronAPI.listDirectory) {
        const result = await window.electronAPI.listDirectory(folderPath);
        if (result.error) return;
        const items = (result.files || []).map(item => ({
          ...item,
          children: item.type === 'folder' ? {} : null,
          loaded: false
        }));
        setFileTree(prev => ({ ...prev, [folderPath]: items }));
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
    if (openFiles.includes(filePath)) {
      setActiveFile(filePath);
      return;
    }

    try {
      let content = '';
      if (window.electronAPI && window.electronAPI.readFile) {
        const result = await window.electronAPI.readFile(filePath);
        if (result.content !== undefined) {
          content = result.content;
        } else if (result.error) {
          console.error('Error leyendo archivo:', result.error);
          return;
        }
      }

      setFileContents(prev => ({ ...prev, [filePath]: content }));
      setOpenFiles(prev => [...prev, filePath]);
      setActiveFile(filePath);
    } catch (error) {
      console.error('Error abriendo archivo:', error);
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
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        const folderName = handle.name;
        setProjectPath(folderName);
      } else {
        alert('Tu navegador no soporta la selección de carpetas. Usa la versión Electron.');
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

  // Funciones para temas
  const getThemeExtension = () => {
    switch (theme) {
      case 'oneDark':
        return oneDark;
      case 'light':
        return EditorView.theme({
          '&': {
            backgroundColor: '#ffffff',
            color: '#333333',
          },
          '.cm-content': {
            backgroundColor: '#ffffff',
            color: '#333333',
          },
          '.cm-gutters': {
            backgroundColor: '#f5f5f5',
            color: '#999999',
          },
        });
      case 'monokai':
        return EditorView.theme({
          '&': {
            backgroundColor: '#272822',
            color: '#f8f8f2',
          },
          '.cm-content': {
            backgroundColor: '#272822',
            color: '#f8f8f2',
          },
          '.cm-gutters': {
            backgroundColor: '#272822',
            color: '#75715e',
          },
        });
      case 'dracula':
        return EditorView.theme({
          '&': {
            backgroundColor: '#282a36',
            color: '#f8f8f2',
          },
          '.cm-content': {
            backgroundColor: '#282a36',
            color: '#f8f8f2',
          },
          '.cm-gutters': {
            backgroundColor: '#282a36',
            color: '#6272a4',
          },
        });
      default:
        return oneDark;
    }
  };

  const themes = [
    { value: 'oneDark', label: 'One Dark' },
    { value: 'light', label: 'Light' },
    { value: 'monokai', label: 'Monokai' },
    { value: 'dracula', label: 'Dracula' },
  ];

  const initializeEditor = () => {
    if (!editorContainerRef.current || !activeFile) return;

    const content = fileContents[activeFile] || '';
    const language = getLanguage(activeFile);

    let langExtension;
    switch (language) {
      case 'javascript':
        langExtension = javascript({ jsx: true, typescript: false });
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

    const view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        langExtension,
        getThemeExtension(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setFileContents(prev => ({ ...prev, [activeFile]: newContent }));
          }
        }),
        EditorView.theme({
          '&': {
            fontSize: `${fontSize}px`,
          },
          '.cm-content': {
            fontSize: `${fontSize}px`,
          },
        }),
      ],
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;
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
    const content = fileContents[activeFile] || '';
    const currentContent = editorViewRef.current.state.doc.toString();
    if (currentContent !== content) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: content,
        },
      });
    }
  };

  const renderFileTree = (items, parentPath = '') => {
    if (!items) return null;

    return items.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isFolder = item.type === 'folder';

      return (
        <div key={item.path} className="select-none">
          <div
            className={`flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm ${
              activeFile === item.path ? 'bg-gray-700' : ''
            }`}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.path);
              } else {
                openFile(item.path);
              }
            }}
          >
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Folder className="w-4 h-4 text-blue-400" />
              </>
            ) : (
              <>
                <div className="w-4" />
                <File className="w-4 h-4 text-gray-400" />
              </>
            )}
            <span className="text-gray-300">{item.name}</span>
          </div>
          {isFolder && isExpanded && fileTree[item.path] && (
            <div className="ml-4">
              {renderFileTree(fileTree[item.path], item.path)}
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
    <NodeViewWrapper className="visual-code-block-wrapper my-4">
      <div className={`bg-[#1e1e1e] border border-gray-700 rounded-lg shadow-lg overflow-hidden ${
        isFullscreen 
          ? 'fixed inset-0 z-[50000] rounded-none' 
          : isExpanded 
            ? 'fixed inset-4 z-[50000]' 
            : ''
      }`}>
        {/* Header */}
        <div className="bg-[#2d2d2d] border-b border-gray-700 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Visual Code</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={selectProjectFolder}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1"
              title="Abrir carpeta"
            >
              <FolderOpen className="w-4 h-4" />
              Abrir Carpeta
            </button>
            {activeFile && (
              <button
                onClick={() => saveFile(activeFile)}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center gap-1"
                title="Guardar archivo (Ctrl+S)"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            )}
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-r border-gray-600 pr-1 mr-1">
              <button
                type="button"
                onClick={(e) => {
                  try {
                    console.log('[VisualCodeBlock] Botón zoom - clickeado');
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[VisualCodeBlock] Evento prevenido, actualizando fontSize...');
                    setFontSize(prev => {
                      const newSize = Math.max(prev - 1, 8);
                      console.log('[VisualCodeBlock] Nuevo fontSize:', newSize, '(anterior:', prev, ')');
                      return newSize;
                    });
                    console.log('[VisualCodeBlock] fontSize actualizado exitosamente');
                  } catch (error) {
                    console.error('[VisualCodeBlock] ERROR en botón zoom -:', error);
                    console.error('[VisualCodeBlock] Stack trace:', error.stack);
                    // Prevenir que el error cierre la aplicación
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors"
                title="Reducir zoom (Ctrl -)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 px-1 min-w-[3rem] text-center">{fontSize}px</span>
              <button
                type="button"
                onClick={(e) => {
                  try {
                    console.log('[VisualCodeBlock] Botón zoom + clickeado');
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[VisualCodeBlock] Evento prevenido, actualizando fontSize...');
                    setFontSize(prev => {
                      const newSize = Math.min(prev + 1, 32);
                      console.log('[VisualCodeBlock] Nuevo fontSize:', newSize, '(anterior:', prev, ')');
                      return newSize;
                    });
                    console.log('[VisualCodeBlock] fontSize actualizado exitosamente');
                  } catch (error) {
                    console.error('[VisualCodeBlock] ERROR en botón zoom +:', error);
                    console.error('[VisualCodeBlock] Stack trace:', error.stack);
                    // Prevenir que el error cierre la aplicación
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors"
                title="Ampliar zoom (Ctrl +)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            {/* Theme Selector */}
            <div className="relative">
              <button
                className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors"
                title="Cambiar tema"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = themes.findIndex(t => t.value === theme);
                  const nextIndex = (currentIndex + 1) % themes.length;
                  setTheme(themes[nextIndex].value);
                }}
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
              title={showFileExplorer ? "Ocultar explorador" : "Mostrar explorador"}
            >
              {showFileExplorer ? 'Ocultar' : 'Mostrar'}
            </button>
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setIsExpanded(!isExpanded);
              }}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Eliminar bloque"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex ${isFullscreen ? 'h-[calc(100vh-3.5rem)]' : isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`}>
          {/* File Explorer Sidebar */}
          {showFileExplorer && (
            <div className="w-64 flex-shrink-0 border-r border-gray-700 bg-[#252526] overflow-y-auto">
              {projectPath ? (
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 px-2">
                    {projectPath.split(/[/\\]/).pop() || projectPath}
                  </div>
                  {loading ? (
                    <div className="text-gray-500 text-sm px-2">Cargando...</div>
                  ) : (
                    <div>
                      {renderFileTree(fileTree[projectPath] || [])}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Selecciona una carpeta para comenzar</p>
                </div>
              )}
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            {openFiles.length > 0 && (
              <div className="bg-[#2d2d2d] border-b border-gray-700 flex items-center overflow-x-auto">
                {openFiles.map((filePath) => (
                  <div
                    key={filePath}
                    className={`flex items-center gap-2 px-3 py-2 border-r border-gray-700 cursor-pointer ${
                      activeFile === filePath
                        ? 'bg-[#1e1e1e] text-white'
                        : 'bg-[#2d2d2d] text-gray-400 hover:bg-[#37373d]'
                    }`}
                    onClick={() => setActiveFile(filePath)}
                  >
                    <File className="w-3 h-3" />
                    <span className="text-sm whitespace-nowrap">{getFileName(filePath)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeFile(filePath);
                      }}
                      className="ml-1 hover:bg-gray-600 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
              {activeFile ? (
                <div ref={editorContainerRef} className="h-full w-full" />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Selecciona un archivo para editarlo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </NodeViewWrapper>
  );
}

