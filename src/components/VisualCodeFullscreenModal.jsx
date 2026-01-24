import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, ZoomIn, ZoomOut, Palette, FolderOpen, File, Minimize2, Maximize2, Edit2, Type, Check, Sparkles } from 'lucide-react';
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
import AIChatPanel from './AIChatPanel';
import GitPanel from './GitPanel';

// Extensión para detectar y marcar variables no usadas
function unusedVariablesExtension() {
  return ViewPlugin.fromClass(class {
    decorations = Decoration.none;
    
    constructor(view) {
      this.updateDecorations(view);
    }
    
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.updateDecorations(update.view);
      }
    }
    
    updateDecorations(view) {
      const decorations = [];
      const doc = view.state.doc;
      const text = doc.toString();
      
      if (!text || text.length === 0) {
        this.decorations = Decoration.none;
        return;
      }
      
      try {
        const unusedVars = this.findUnusedVariables(text);
        unusedVars.forEach(({ name, from, to }) => {
          const decoration = Decoration.mark({
            class: 'cm-unused-variable',
            attributes: { title: `Variable '${name}' no está siendo usada` }
          });
          decorations.push(decoration.range(from, to));
        });
      } catch (error) {
        console.warn('Error analizando variables no usadas:', error);
      }
      
      this.decorations = Decoration.set(decorations);
    }
    
    escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    findUnusedVariables(text) {
      const unused = [];
      const patterns = [
        { regex: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=;]/g, type: 'variable' },
        { regex: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, type: 'function' },
        { regex: /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[{\s]/g, type: 'class' },
      ];
      
      patterns.forEach(({ regex }) => {
        let match;
        const regexCopy = new RegExp(regex.source, regex.flags);
        while ((match = regexCopy.exec(text)) !== null) {
          const varName = match[1];
          const fullMatch = match[0];
          const varIndex = fullMatch.indexOf(varName);
          const from = match.index + varIndex;
          const to = from + varName.length;
          const afterDeclaration = text.substring(to);
          const usageRegex = new RegExp(`\\b${this.escapeRegex(varName)}\\b`);
          const matches = afterDeclaration.match(usageRegex);
          if (!matches || matches.length === 0) {
            unused.push({ name: varName, from, to });
          }
        }
      });
      
      return unused;
    }
  }, {
    decorations: v => v.decorations
  });
}

export default function VisualCodeFullscreenModal({ 
  isOpen, 
  isMinimized = false,
  zIndex = 70000,
  onMinimize,
  onRestore,
  onFocus,
  onClose, 
  projectPath, 
  projectTitle, 
  projectColor, 
  theme: initialTheme, 
  fontSize: initialFontSize,
  extensions: initialExtensions,
  onUpdateProject
}) {
  const [projectPathState, setProjectPathState] = useState(projectPath || '');
  const [activeFile, setActiveFile] = useState('');
  const [openFiles, setOpenFiles] = useState([]);
  const [fileContents, setFileContents] = useState({});
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [theme, setTheme] = useState(initialTheme || 'cursorDark');
  const [fontSize, setFontSize] = useState(initialFontSize || 14);
  const [projectColorState, setProjectColorState] = useState(projectColor || '#1e1e1e');
  const [projectTitleState, setProjectTitleState] = useState(projectTitle || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const editorViewRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Sincronizar props con state
  useEffect(() => {
    if (projectPath) setProjectPathState(projectPath);
    if (projectColor) setProjectColorState(projectColor);
    if (projectTitle) setProjectTitleState(projectTitle);
  }, [projectPath, projectColor, projectTitle]);

  // Guardar configuración en base de datos y sincronizar con LocalEditor
  useEffect(() => {
    const saveProjectConfig = async () => {
      if (!projectPathState) return;
      
      try {
        const config = {
          projectPath: projectPathState,
          title: projectTitleState,
          color: projectColorState,
          theme,
          fontSize,
          extensions: initialExtensions || {},
          lastUpdated: new Date().toISOString()
        };
        
        const projectId = projectPathState.replace(/[<>:"/\\|?*]/g, '_');
        const LocalStorageService = (await import('../services/LocalStorageService')).default;
        await LocalStorageService.saveJSONFile(
          `visual-code-project-${projectId}.json`,
          config,
          'data/visual-code-projects'
        );
        
        // Sincronizar con LocalEditor si hay callback
        if (onUpdateProject) {
          onUpdateProject({
            projectTitle: projectTitleState,
            projectColor: projectColorState,
            theme,
            fontSize
          });
        }
      } catch (error) {
        console.error('Error guardando configuración del proyecto:', error);
      }
    };

    if (projectPathState) {
      saveProjectConfig();
    }
  }, [projectPathState, projectTitleState, projectColorState, theme, fontSize, onUpdateProject]);

  // Inicializar editor
  useEffect(() => {
    if (!isOpen || !editorContainerRef.current || !activeFile) return;

    const initializeEditor = async () => {
      try {
        // Limpiar editor anterior
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }

        if (editorContainerRef.current) {
          editorContainerRef.current.innerHTML = '';
        }

        const content = fileContents[activeFile] || '';

        // Determinar lenguaje
        const getLanguage = (filename) => {
          if (!filename) return javascript();
          const ext = filename.split('.').pop()?.toLowerCase();
          switch (ext) {
            case 'js':
            case 'jsx':
            case 'mjs':
              return javascript({ jsx: true });
            case 'py':
              return python();
            case 'html':
            case 'htm':
              return html();
            case 'css':
              return css();
            case 'json':
              return json();
            default:
              return javascript();
          }
        };

        // Configurar tema
        const getTheme = () => {
          switch (theme) {
            case 'oneDark':
              return oneDark;
            case 'light':
              return EditorView.theme({
                '&': { backgroundColor: '#ffffff', color: '#333333' },
                '.cm-content': { backgroundColor: '#ffffff', color: '#333333' },
                '.cm-gutters': { backgroundColor: '#f5f5f5', color: '#999999' },
              });
            case 'monokai':
              return EditorView.theme({
                '&': { backgroundColor: '#272822', color: '#f8f8f2' },
                '.cm-content': { backgroundColor: '#272822', color: '#f8f8f2' },
                '.cm-gutters': { backgroundColor: '#272822', color: '#75715e' },
              });
            case 'dracula':
              return EditorView.theme({
                '&': { backgroundColor: '#282a36', color: '#f8f8f2' },
                '.cm-content': { backgroundColor: '#282a36', color: '#f8f8f2' },
                '.cm-gutters': { backgroundColor: '#282a36', color: '#6272a4' },
              });
            case 'tokyoNight':
              return EditorView.theme({
                '&': { backgroundColor: '#1a1b26', color: '#c0caf5' },
                '.cm-content': { backgroundColor: '#1a1b26', color: '#c0caf5' },
                '.cm-gutters': { backgroundColor: '#1a1b26', color: '#565f89' },
              });
            case 'cursorDark':
              // Tema oscuro principal de Cursor
              return EditorView.theme({
                '&': {
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                },
                '.cm-content': {
                  backgroundColor: '#1e1e1e',
                  color: '#d4d4d4',
                  caretColor: '#aeafad',
                },
                '.cm-gutters': {
                  backgroundColor: '#252526',
                  color: '#858585',
                  border: 'none',
                },
                '.cm-lineNumbers': {
                  color: '#858585',
                },
                '.cm-activeLineGutter': {
                  backgroundColor: 'transparent',
                  color: '#c6c6c6',
                  fontWeight: 'normal',
                },
                '.cm-line': {
                  color: '#d4d4d4',
                },
                '.cm-keyword': { color: '#569cd6' },
                '.cm-string': { color: '#ce9178' },
                '.cm-comment': { color: '#6a9955' },
                '.cm-number': { color: '#b5cea8' },
                '.cm-function': { color: '#dcdcaa' },
                '.cm-variable': { color: '#9cdcfe' },
                '.cm-variable-2': { color: '#9cdcfe' },
                '.cm-variable-3': { color: '#4ec9b0' },
                '.cm-type': { color: '#4ec9b0' },
                '.cm-property': { color: '#9cdcfe' },
                '.cm-operator': { color: '#d4d4d4' },
                '.cm-meta': { color: '#569cd6' },
                '.cm-bracket': { color: '#d4d4d4' },
                '.cm-tag': { color: '#569cd6' },
                '.cm-attribute': { color: '#9cdcfe' },
                '.cm-selectionBackground': { backgroundColor: '#264f78' },
                '.cm-cursor': { borderLeftColor: '#aeafad' },
                '.cm-matchingBracket': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  outline: '1px solid rgba(255, 255, 255, 0.2)',
                },
                '.cm-nonmatchingBracket': {
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                },
              }, { dark: true });
            default:
              return oneDark;
          }
        };

        const editorExtensions = [
          basicSetup,
          closeBrackets(),
          getLanguage(activeFile),
          getTheme(),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && activeFile) {
              const newContent = update.state.doc.toString();
              setFileContents(prev => ({
                ...prev,
                [activeFile]: newContent
              }));
            }
          }),
          EditorView.theme({
            '&': { fontSize: `${fontSize}px` },
            '.cm-content': { 
              fontSize: `${fontSize}px`,
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text',
            },
            '.cm-editor': { height: '100%' },
            '.cm-scroller': { 
              overflow: 'auto',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text',
            },
            // Estilo para variables no usadas (similar a Cursor/VS Code)
            '.cm-unused-variable': {
              opacity: '0.5',
              color: '#858585',
              fontStyle: 'italic',
            },
          }),
        ];

        // Detección de variables no usadas (solo para JavaScript/TypeScript)
        if (activeFile && (activeFile.endsWith('.js') || activeFile.endsWith('.jsx') || activeFile.endsWith('.ts') || activeFile.endsWith('.tsx'))) {
          editorExtensions.push(unusedVariablesExtension());
        }

        console.log('[VisualCodeFullscreenModal] Inicializando editor...', {
          hasContainer: !!editorContainerRef.current,
          contentLength: content.length,
          activeFile,
          extensionsCount: editorExtensions.length
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
        }
        
        view.focus();
        console.log('[VisualCodeFullscreenModal] Editor enfocado, editable:', view.state.readOnly === false);
        
        setTimeout(() => {
          const editorElement = editorContainerRef.current?.querySelector('.cm-editor');
          if (editorElement) {
            console.log('[VisualCodeFullscreenModal] Elemento editor encontrado:', {
              pointerEvents: window.getComputedStyle(editorElement).pointerEvents,
              userSelect: window.getComputedStyle(editorElement).userSelect,
            });
          }
        }, 100);

        // Manejar Ctrl+S
        const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's' && activeFile) {
            e.preventDefault();
            saveFile(activeFile);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      } catch (error) {
        console.error('[VisualCodeFullscreenModal] Error inicializando editor:', error);
      }
    };

    const cleanup = initializeEditor();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => cleanupFn && cleanupFn());
      }
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, [isOpen, activeFile, theme, fontSize]);

  // Actualizar contenido del editor cuando cambia
  useEffect(() => {
    if (editorViewRef.current && activeFile && fileContents[activeFile] !== undefined) {
      const currentContent = editorViewRef.current.state.doc.toString();
      if (currentContent !== fileContents[activeFile]) {
        editorViewRef.current.dispatch({
          changes: {
            from: 0,
            to: editorViewRef.current.state.doc.length,
            insert: fileContents[activeFile] || ''
          }
        });
      }
    }
  }, [activeFile, fileContents]);

  const loadFile = async (filePath, contentFromExplorer = null) => {
    try {
      let content = contentFromExplorer;
      
      if (!content) {
        if (window.electronAPI && window.electronAPI.readFile) {
          const result = await window.electronAPI.readFile(filePath);
          content = result.content !== undefined ? result.content : result;
        } else {
          console.warn('[VisualCodeFullscreenModal] No se puede leer archivo sin Electron API');
          return;
        }
      }

      setFileContents(prev => ({
        ...prev,
        [filePath]: content
      }));
      
      setActiveFile(filePath);
      if (!openFiles.includes(filePath)) {
        setOpenFiles(prev => [...prev, filePath]);
      }
    } catch (error) {
      console.error('[VisualCodeFullscreenModal] Error cargando archivo:', error);
      alert('Error al cargar el archivo: ' + error.message);
    }
  };

  const saveFile = async (filePath) => {
    try {
      const content = fileContents[filePath];
      if (!content) return;

      if (window.electronAPI && window.electronAPI.writeFile) {
        await window.electronAPI.writeFile(filePath, content);
        alert('Archivo guardado exitosamente');
      } else {
        console.warn('[VisualCodeFullscreenModal] No se puede guardar archivo sin Electron API');
      }
    } catch (error) {
      console.error('[VisualCodeFullscreenModal] Error guardando archivo:', error);
      alert('Error al guardar el archivo: ' + error.message);
    }
  };

  const closeFile = (filePath) => {
    setOpenFiles(prev => prev.filter(f => f !== filePath));
    if (activeFile === filePath) {
      const remaining = openFiles.filter(f => f !== filePath);
      setActiveFile(remaining.length > 0 ? remaining[remaining.length - 1] : '');
    }
  };

  const getFileName = (filePath) => {
    return filePath.split(/[/\\]/).pop() || filePath;
  };

  const selectProjectFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        const selectedPath = await window.electronAPI.selectDirectory();
        if (selectedPath) {
          setProjectPathState(selectedPath);
          setOpenFiles([]);
          setActiveFile('');
          setFileContents({});
          if (editorViewRef.current) {
            editorViewRef.current.destroy();
            editorViewRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('[VisualCodeFullscreenModal] Error seleccionando carpeta:', error);
    }
  };

  if (!isOpen) return null;

  // Si está minimizado, no renderizar nada (se maneja desde la barra de tareas en LocalEditor)
  if (isMinimized) {
    return null;
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-[#1e1e1e] flex flex-col"
      style={{ 
        pointerEvents: 'auto',
        zIndex: zIndex
      }}
      onClick={onFocus}
    >
      {/* Header */}
      <div 
        className="border-b border-[#3e3e42] px-3 py-1.5 flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: projectColorState || '#1e1e1e' }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[#cccccc] font-medium text-[13px]">afnarqui</span>
          {projectPathState && (
            <>
              <span className="text-[#858585] text-[11px]">•</span>
              {projectTitleState ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#cccccc] font-normal text-[13px] truncate" title={projectTitleState}>
                    {projectTitleState}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTitleEditor(true);
                    }}
                    className="p-1 hover:bg-[#3e3e42] rounded transition-colors flex-shrink-0"
                    title="Editar título"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#cccccc]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTitleEditor(true);
                  }}
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
          <div className="flex items-center gap-1 border-r border-[#3e3e42] pr-1.5 mr-1.5">
            <button
              onClick={() => setFontSize(prev => Math.max(prev - 1, 8))}
              className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-[#858585] px-1 min-w-[3rem] text-center">{fontSize}px</span>
            <button
              onClick={() => setFontSize(prev => Math.min(prev + 1, 32))}
              className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
              title="Ampliar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={selectProjectFolder}
            className="px-2.5 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-[#ffffff] rounded text-[12px] flex items-center gap-1.5 transition-colors"
            title="Abrir carpeta"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Abrir Carpeta
          </button>
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
                style={{ backgroundColor: projectColorState }}
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
                        setProjectColorState(color);
                        setShowColorPicker(false);
                      }}
                      className="w-8 h-8 rounded border-2 transition-all hover:scale-110"
                      style={{ 
                        backgroundColor: color,
                        borderColor: projectColorState === color ? '#007acc' : 'transparent'
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#3e3e42]">
                  <input
                    type="color"
                    value={projectColorState}
                    onChange={(e) => setProjectColorState(e.target.value)}
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
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-[#cccccc] hover:text-[#f48771] hover:bg-[#3e3e42] rounded transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs de archivos abiertos */}
      {openFiles.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-[#252526] border-b border-[#3e3e42] overflow-x-auto flex-shrink-0">
          {openFiles.map((filePath) => {
            const fileName = getFileName(filePath);
            const isActiveFile = activeFile === filePath;
            return (
              <div
                key={filePath}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-t transition-colors text-sm cursor-pointer ${
                  isActiveFile
                    ? 'bg-[#1e1e1e] text-white border-t-2 border-blue-500'
                    : 'bg-[#2d2d30] text-gray-300 hover:bg-[#37373d]'
                }`}
                onClick={() => setActiveFile(filePath)}
              >
                <File className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(filePath);
                  }}
                  className="hover:bg-[#3e3e42] rounded p-0.5 ml-1"
                  title="Cerrar archivo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        {showFileExplorer && (
          <div className="w-64 flex-shrink-0 border-r border-[#3e3e42] bg-[#252526] overflow-hidden flex flex-col">
            {/* Tabs del sidebar */}
            <div className="bg-[#2d2d30] border-b border-[#3e3e42] flex">
              <button
                onClick={() => setShowGitPanel(false)}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  !showGitPanel
                    ? 'bg-[#252526] text-[#ffffff] border-b-2 border-b-[#007acc]' 
                    : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#2d2d30]'
                }`}
              >
                EXPLORADOR
              </button>
              <button
                onClick={() => setShowGitPanel(true)}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                  showGitPanel
                    ? 'bg-[#252526] text-[#ffffff] border-b-2 border-b-[#007acc]' 
                    : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#2d2d30]'
                }`}
              >
                GIT
              </button>
            </div>
            
            {showGitPanel ? (
              <GitPanel
                projectPath={projectPathState}
                onFileSelect={(filePath) => {
                  if (filePath && projectPathState) {
                    const fullPath = filePath.startsWith(projectPathState) 
                      ? filePath 
                      : `${projectPathState}/${filePath}`.replace(/\/+/g, '/');
                    loadFile(fullPath, null);
                  }
                }}
              />
            ) : (
              <FileExplorer
                isOpen={showFileExplorer}
                onClose={() => setShowFileExplorer(false)}
                projectPath={projectPathState}
                onFileSelect={(filePath, content) => {
                  loadFile(filePath, content);
                }}
                onProjectPathChange={setProjectPathState}
                hideHeader={true}
                vscodeStyle={true}
                openFiles={openFiles}
              />
            )}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <div 
              ref={editorContainerRef} 
              className="flex-1 overflow-auto"
              style={{ 
                height: '100%',
                userSelect: 'text',
                WebkitUserSelect: 'text',
                MozUserSelect: 'text',
                msUserSelect: 'text',
                pointerEvents: 'auto',
                cursor: 'text',
              }}
              onMouseDown={(e) => {
                console.log('[VisualCodeFullscreenModal] Mouse down en contenedor', e.target);
              }}
              onClick={(e) => {
                console.log('[VisualCodeFullscreenModal] Click en contenedor', e.target);
                if (editorViewRef.current) {
                  editorViewRef.current.focus();
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#858585]">
              <div className="text-center">
                <File className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-[13px]">Selecciona un archivo para editarlo</p>
                {!showFileExplorer && (
                  <button
                    onClick={() => setShowFileExplorer(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Abrir Explorador
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para seleccionar tema */}
      {showThemeModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100002] flex items-center justify-center p-4"
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
                {[
                  { 
                    value: 'oneDark', 
                    label: 'One Dark',
                    description: 'Tema oscuro popular de Atom',
                    preview: {
                      backgroundColor: '#282c34',
                      textColor: '#abb2bf',
                      keywordColor: '#c678dd',
                      stringColor: '#98c379',
                      commentColor: '#5c6370'
                    }
                  },
                  { 
                    value: 'light', 
                    label: 'Light',
                    description: 'Tema claro para trabajo diurno',
                    preview: {
                      backgroundColor: '#ffffff',
                      textColor: '#333333',
                      keywordColor: '#0000ff',
                      stringColor: '#008000',
                      commentColor: '#808080'
                    }
                  },
                  { 
                    value: 'monokai', 
                    label: 'Monokai',
                    description: 'Tema clásico de Sublime Text',
                    preview: {
                      backgroundColor: '#272822',
                      textColor: '#f8f8f2',
                      keywordColor: '#f92672',
                      stringColor: '#e6db74',
                      commentColor: '#75715e'
                    }
                  },
                  { 
                    value: 'dracula', 
                    label: 'Dracula',
                    description: 'Tema oscuro con colores vibrantes',
                    preview: {
                      backgroundColor: '#282a36',
                      textColor: '#f8f8f2',
                      keywordColor: '#ff79c6',
                      stringColor: '#f1fa8c',
                      commentColor: '#6272a4'
                    }
                  },
                  { 
                    value: 'tokyoNight', 
                    label: 'Tokyo Night',
                    description: 'Tema oscuro elegante',
                    preview: {
                      backgroundColor: '#1a1b26',
                      textColor: '#c0caf5',
                      keywordColor: '#bb9af7',
                      stringColor: '#9ece6a',
                      commentColor: '#565f89'
                    }
                  },
                  { 
                    value: 'cursorDark', 
                    label: 'Cursor Dark',
                    description: 'Tema oscuro principal de Cursor (recomendado)',
                    preview: {
                      backgroundColor: '#1e1e1e',
                      textColor: '#d4d4d4',
                      keywordColor: '#569cd6',
                      stringColor: '#ce9178',
                      commentColor: '#6a9955'
                    }
                  },
                ].map((themeOption) => {
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
                        className="rounded p-3 font-mono text-xs border border-[#3e3e42] whitespace-pre"
                        style={{
                          backgroundColor: themeOption.preview.backgroundColor,
                          color: themeOption.preview.textColor,
                          minHeight: '80px'
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

      {/* Modal para editar título */}
      {showTitleEditor && (
        <div className="fixed inset-0 bg-black/50 z-[100001] flex items-center justify-center p-4" onClick={() => setShowTitleEditor(false)}>
          <div 
            className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#252526] border-b border-[#3e3e42] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#cccccc]">Editar Título del Proyecto</h2>
              <button
                onClick={() => setShowTitleEditor(false)}
                className="text-[#858585] hover:text-[#cccccc] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#cccccc] mb-2">
                  Título del proyecto
                </label>
                <input
                  type="text"
                  value={projectTitleState}
                  onChange={(e) => setProjectTitleState(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowTitleEditor(false);
                    } else if (e.key === 'Escape') {
                      setShowTitleEditor(false);
                    }
                  }}
                  className="w-full px-4 py-2 bg-[#252526] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#007acc]"
                  placeholder="Nombre del proyecto"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowTitleEditor(false)}
                  className="px-4 py-2 bg-[#3e3e42] hover:bg-[#464647] text-[#cccccc] rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowTitleEditor(false)}
                  className="px-4 py-2 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        activeFile={activeFile}
        fileContents={fileContents}
        projectPath={projectPathState}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}















