import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileCode, 
  Folder, 
  File, 
  Save, 
  ZoomIn,
  ZoomOut,
  Palette,
  Package,
  Check,
  Edit2,
  Type,
  Sparkles,
  Terminal,
  GitBranch
} from 'lucide-react';
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
import LocalStorageService from '../services/LocalStorageService';
import AIChatPanel from './AIChatPanel';
import GitPanel from './GitPanel';
import GitDiffView from './GitDiffView';

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
              className="px-2 py-2 hover:bg-[#2a2d2e] transition-colors cursor-pointer"
              onClick={() => toggleExtension(ext.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#cccccc] font-medium truncate">
                    {ext.name}
                  </div>
                  <div className="text-[11px] text-[#858585] truncate">
                    {ext.description}
                  </div>
                  <div className="text-[10px] text-[#6a6a6a] mt-0.5">
                    {ext.author}
                  </div>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  ext.enabled
                    ? 'bg-[#0e639c] border-[#0e639c]'
                    : 'border-[#3e3e42] bg-transparent'
                }`}>
                  {ext.enabled && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VisualCodeTab({ 
  project, 
  isActive, 
  onClose, 
  onUpdateProject 
}) {
  const [activeFile, setActiveFile] = useState('');
  const [fileContents, setFileContents] = useState({});
  const [openFiles, setOpenFiles] = useState([]);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showExtensionsPanel, setShowExtensionsPanel] = useState(false);
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [gitDiffFile, setGitDiffFile] = useState(null);
  const editorViewRef = useRef(null);
  const editorContainerRef = useRef(null);
  const [projectPath, setProjectPath] = useState(project?.path || '');
  const [theme, setTheme] = useState(project?.theme || 'cursorDark');
  const [fontSize, setFontSize] = useState(project?.fontSize || 14);
  const [projectColor, setProjectColor] = useState(project?.color || '#1e1e1e');
  const [projectTitle, setProjectTitle] = useState(project?.title || '');
  const [extensions, setExtensions] = useState(() => {
    try {
      return project?.extensions || {
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

  // Limpiar archivos cuando cambia el proyecto
  useEffect(() => {
    if (project?.path && project.path !== projectPath) {
      setActiveFile('');
      setOpenFiles([]);
      setFileContents({});
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
      if (editorContainerRef.current) {
        editorContainerRef.current.innerHTML = '';
      }
    }
  }, [project?.path]);

  // Cargar configuración del proyecto
  useEffect(() => {
    if (project?.path) {
      setProjectPath(project.path);
      setTheme(project.theme || 'oneDark');
      setFontSize(project.fontSize || 14);
      setProjectColor(project.color || '#1e1e1e');
      setProjectTitle(project.title || '');
      setExtensions(project.extensions || {
        errorLens: true,
        betterComments: true,
        es7ReactRedux: true,
        reactSimpleSnippets: true,
        autoCloseTag: true,
        pasteJsonAsCode: true,
        backticks: true,
        tokyoNight: false,
        beardedIcons: true
      });
    }
  }, [project]);

  // Guardar configuración cuando cambia
  useEffect(() => {
    if (project && onUpdateProject) {
      onUpdateProject({
        ...project,
        theme,
        fontSize,
        color: projectColor,
        title: projectTitle,
        extensions
      });
    }
  }, [theme, fontSize, projectColor, projectTitle, extensions]);

  // Inicializar editor - Solo cuando cambia activeFile, theme, fontSize o isActive
  useEffect(() => {
    if (!editorContainerRef.current || !isActive) return;

    const initializeEditor = async () => {
      try {
        // Limpiar editor anterior si existe
        if (editorViewRef.current) {
          editorViewRef.current.destroy();
          editorViewRef.current = null;
        }

        // Limpiar contenedor antes de crear nuevo editor
        if (editorContainerRef.current) {
          editorContainerRef.current.innerHTML = '';
        }

        const content = activeFile && fileContents[activeFile] 
          ? fileContents[activeFile] 
          : '';

        // Determinar lenguaje según extensión
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

        // Configurar tema - Estilo VS Code/Cursor
        const getTheme = () => {
          switch (theme) {
            case 'oneDark':
              // Tema Dark+ de VS Code (Dark Modern)
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
                  backgroundColor: '#1e1e1e',
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
                '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
                '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
                '.cm-cursor': { borderLeftColor: '#aeafad' },
                '.cm-matchingBracket': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  outline: '1px solid rgba(255, 255, 255, 0.2)',
                },
                '.cm-nonmatchingBracket': {
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                },
              }, { dark: true });
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
                '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
                '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
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
              // Tema Dark+ de VS Code por defecto
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
                  backgroundColor: '#1e1e1e',
                  color: '#858585',
                  border: 'none',
                },
                '.cm-lineNumbers': {
                  color: '#858585',
                },
                '.cm-activeLineGutter': {
                  backgroundColor: 'transparent',
                  color: '#c6c6c6',
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
                '.cm-type': { color: '#4ec9b0' },
                '.cm-property': { color: '#9cdcfe' },
                '.cm-operator': { color: '#d4d4d4' },
                '.cm-meta': { color: '#569cd6' },
                '.cm-bracket': { color: '#d4d4d4' },
                '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
                '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
                '.cm-cursor': { borderLeftColor: '#aeafad' },
              }, { dark: true });
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
              // Actualizar contenido sin causar re-render del editor
              setFileContents(prev => {
                const updated = {
                  ...prev,
                  [activeFile]: newContent
                };
                return updated;
              });
            }
          }),
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
              userSelect: 'text !important',
              WebkitUserSelect: 'text !important',
              MozUserSelect: 'text !important',
              msUserSelect: 'text !important',
              pointerEvents: 'auto !important',
              cursor: 'text !important',
            },
            '.cm-editor': {
              height: '100%',
              pointerEvents: 'auto !important',
              userSelect: 'text !important',
            },
            '.cm-scroller': {
              overflow: 'auto',
              fontFamily: '"Consolas", "Monaco", "Courier New", "Menlo", monospace',
              userSelect: 'text !important',
              WebkitUserSelect: 'text !important',
              MozUserSelect: 'text !important',
              msUserSelect: 'text !important',
              pointerEvents: 'auto !important',
              cursor: 'text !important',
            },
            '.cm-line': {
              padding: '0 12px',
            },
            '.cm-gutters': {
              backgroundColor: 'transparent',
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
            '.cm-focused': {
              outline: 'none',
            },
            // Estilos de selección VISIBLES
            '.cm-selectionBackground': {
              backgroundColor: 'rgba(173, 214, 255, 0.4) !important',
            },
            '.cm-focused .cm-selectionBackground': {
              backgroundColor: 'rgba(173, 214, 255, 0.4) !important',
            },
            '.cm-selectionMatch': {
              backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
            },
            // Estilo para variables no usadas (similar a Cursor/VS Code)
            '.cm-unused-variable': {
              opacity: '0.5',
              color: '#858585',
              fontStyle: 'italic',
            },
          }),
        ];

        // Auto Close Tag
        if (extensions.autoCloseTag && (activeFile?.endsWith('.html') || activeFile?.endsWith('.jsx'))) {
          editorExtensions.push(closeBrackets());
        }

        // Detección de variables no usadas (solo para JavaScript/TypeScript)
        // TODO: Implementar extensión para detectar variables no usadas
        // if (activeFile && (activeFile.endsWith('.js') || activeFile.endsWith('.jsx') || activeFile.endsWith('.ts') || activeFile.endsWith('.tsx'))) {
        //   editorExtensions.push(unusedVariablesExtension());
        // }

        const view = new EditorView({
          doc: content,
          extensions: editorExtensions,
          parent: editorContainerRef.current,
        });

        editorViewRef.current = view;
        
        // Asegurar que el contenedor y el editor permitan interacción
        if (editorContainerRef.current) {
          editorContainerRef.current.style.pointerEvents = 'auto';
          editorContainerRef.current.style.userSelect = 'text';
          editorContainerRef.current.style.WebkitUserSelect = 'text';
          editorContainerRef.current.style.MozUserSelect = 'text';
          editorContainerRef.current.style.msUserSelect = 'text';
          editorContainerRef.current.style.cursor = 'text';
        }
        
        // Asegurar que el DOM del editor tenga los estilos correctos
        if (view.dom) {
          const editorDom = view.dom;
          editorDom.style.pointerEvents = 'auto';
          editorDom.style.userSelect = 'text';
          editorDom.style.WebkitUserSelect = 'text';
          editorDom.style.MozUserSelect = 'text';
          editorDom.style.msUserSelect = 'text';
          editorDom.style.cursor = 'text';
          
          // Asegurar que el contenido también tenga los estilos
          const content = editorDom.querySelector('.cm-content');
          if (content) {
            content.style.pointerEvents = 'auto';
            content.style.userSelect = 'text';
            content.style.WebkitUserSelect = 'text';
            content.style.MozUserSelect = 'text';
            content.style.msUserSelect = 'text';
            content.style.cursor = 'text';
            // Asegurar que contentEditable esté habilitado
            if (content.contentEditable !== 'true') {
              content.contentEditable = 'true';
            }
          }
        }
        
        // Enfocar el editor después de crearlo
        setTimeout(() => {
          if (editorViewRef.current && editorViewRef.current.dom) {
            editorViewRef.current.focus();
            console.log('[VisualCodeTab] Editor enfocado, editable:', editorViewRef.current.state.readOnly === false);
            
            const editorElement = editorContainerRef.current?.querySelector('.cm-editor');
            if (editorElement) {
              const computedStyle = window.getComputedStyle(editorElement);
              console.log('[VisualCodeTab] Elemento editor encontrado:', {
                pointerEvents: computedStyle.pointerEvents,
                userSelect: computedStyle.userSelect,
                contentEditable: editorElement.contentEditable,
              });
              
              // Asegurar que el editor pueda recibir eventos del mouse y teclado
              editorElement.setAttribute('tabindex', '0');
              editorElement.style.outline = 'none';
            }
            
            // Verificar el contenido también
            const contentElement = editorContainerRef.current?.querySelector('.cm-content');
            if (contentElement) {
              const computedStyle = window.getComputedStyle(contentElement);
              console.log('[VisualCodeTab] Elemento contenido encontrado:', {
                pointerEvents: computedStyle.pointerEvents,
                userSelect: computedStyle.userSelect,
                contentEditable: contentElement.contentEditable,
              });
            }
            
            // Agregar listener de clic para enfocar el editor cuando se hace clic en el contenedor
            // PERO solo si no hay una selección de texto activa
            const handleContainerClick = (e) => {
              // Solo enfocar si el clic no es en un botón u otro elemento interactivo
              if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
                return;
              }
              
              // Verificar si hay una selección de texto activa
              const selection = window.getSelection();
              if (selection && selection.toString().length > 0) {
                // Hay texto seleccionado, no enfocar para permitir copiar
                return;
              }
              
              // Enfocar el editor después de un breve delay para no interferir con la selección
              setTimeout(() => {
                if (editorViewRef.current) {
                  editorViewRef.current.focus();
                }
              }, 0);
            };
            
            if (editorContainerRef.current) {
              // Usar capture: false para no interferir con la selección
              editorContainerRef.current.addEventListener('click', handleContainerClick, false);
              
              // Guardar el handler para limpiarlo después
              if (!editorContainerRef.current._clickHandler) {
                editorContainerRef.current._clickHandler = handleContainerClick;
              }
            }
          }
        }, 100);
      } catch (error) {
        console.error('[VisualCodeTab] Error inicializando editor:', error);
      }
    };

    initializeEditor();

    return () => {
      // Limpiar listener de clic
      if (editorContainerRef.current && editorContainerRef.current._clickHandler) {
        editorContainerRef.current.removeEventListener('click', editorContainerRef.current._clickHandler, true);
        delete editorContainerRef.current._clickHandler;
      }
      
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, [activeFile, isActive, theme, fontSize]); // Removido fileContents y extensions de dependencias

  // Actualizar contenido del editor cuando se carga un archivo nuevo
  // NOTA: El updateListener ya maneja las actualizaciones durante la escritura
  // Este efecto solo actualiza cuando se cambia de archivo o se carga uno nuevo
  const prevActiveFileRef = useRef(activeFile);
  useEffect(() => {
    if (!editorViewRef.current || !activeFile) {
      prevActiveFileRef.current = activeFile;
      return;
    }
    
    // Solo actualizar si cambió el archivo activo (no el contenido)
    if (prevActiveFileRef.current !== activeFile) {
      const newContent = fileContents[activeFile] || '';
      const currentContent = editorViewRef.current.state.doc.toString();
      
      // Solo actualizar si el contenido es diferente
      if (currentContent !== newContent) {
        try {
          editorViewRef.current.dispatch({
            changes: {
              from: 0,
              to: editorViewRef.current.state.doc.length,
              insert: newContent
            }
          });
          // Enfocar el editor después de actualizar
          setTimeout(() => {
            if (editorViewRef.current) {
              editorViewRef.current.focus();
            }
          }, 50);
        } catch (error) {
          console.error('[VisualCodeTab] Error actualizando contenido:', error);
        }
      }
      prevActiveFileRef.current = activeFile;
    }
  }, [activeFile, fileContents]); // Solo cuando cambia el archivo activo

  // Manejar Ctrl+S para guardar y Ctrl+/Ctrl- para zoom
  // IMPORTANTE: Solo manejar estos atajos específicos y NO bloquear otros como Ctrl+A
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo manejar si el editor está enfocado o si es un atajo global que queremos capturar
      const isEditorFocused = editorViewRef.current && 
        document.activeElement && 
        (document.activeElement.closest('.cm-editor') || 
         document.activeElement === editorViewRef.current.dom);
      
      // Si no es el editor el que está enfocado, no interferir (excepto para atajos globales específicos)
      if (!isEditorFocused && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        // Permitir que otros componentes manejen sus propios atajos
        return;
      }
      
      // Solo manejar atajos específicos
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && activeFile) {
        e.preventDefault();
        e.stopPropagation();
        saveFile(activeFile);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setFontSize(prev => Math.min(prev + 1, 32));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        e.stopPropagation();
        setFontSize(prev => Math.max(prev - 1, 8));
        return;
      }
      
      // Para todos los demás eventos (incluyendo Ctrl+A), NO hacer preventDefault
      // Esto permite que CodeMirror maneje sus propios atajos de teclado
    };

    // Usar capture: false para que el editor pueda manejar primero sus eventos
    window.addEventListener('keydown', handleKeyDown, false);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [activeFile]);

  // Cargar archivo
  const loadFile = async (filePath, contentFromExplorer = null) => {
    try {
      let content = contentFromExplorer;
      
      if (!content && fileContents[filePath]) {
        content = fileContents[filePath];
      }
      
      if (!content) {
        if (window.electronAPI && window.electronAPI.readFile) {
          const result = await window.electronAPI.readFile(filePath);
          content = result.content !== undefined ? result.content : result;
        } else {
          console.warn('[VisualCodeTab] No se puede leer archivo sin Electron API');
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
      console.error('[VisualCodeTab] Error cargando archivo:', error);
      alert('Error al cargar el archivo: ' + error.message);
    }
  };

  // Guardar archivo
  const saveFile = async (filePath) => {
    try {
      const content = fileContents[filePath];
      if (!content) return;

      if (window.electronAPI && window.electronAPI.writeFile) {
        await window.electronAPI.writeFile(filePath, content);
        alert('Archivo guardado exitosamente');
      } else {
        console.warn('[VisualCodeTab] No se puede guardar archivo sin Electron API');
      }
    } catch (error) {
      console.error('[VisualCodeTab] Error guardando archivo:', error);
      alert('Error al guardar el archivo: ' + error.message);
    }
  };

  // Cerrar archivo
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

  const themes = [
    { 
      value: 'notion', 
      label: 'Notion', 
      description: 'Paleta elegante de Notion (negro con colores suaves)',
      preview: {
        backgroundColor: '#1E1E1E',
        textColor: '#D4D4D4',
        keywordColor: '#569CD6',
        stringColor: '#CE9178',
        commentColor: '#6A9955'
      }
    },
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
      description: 'Tema oscuro elegante estilo Tokyo',
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
  ];

  if (!isActive) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* Header con controles */}
      <div 
        className="border-b border-[#3e3e42] px-3 py-1.5 flex items-center justify-between"
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
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-r border-[#3e3e42] pr-1.5 mr-1.5">
            <button
              type="button"
              onClick={() => setFontSize(prev => Math.max(prev - 1, 8))}
              className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
              title="Reducir zoom (Ctrl -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-[#858585] px-1 min-w-[3rem] text-center">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize(prev => Math.min(prev + 1, 32))}
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
          <button
            className="p-1.5 text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42] rounded transition-colors"
            title="Seleccionar paleta de colores"
            onClick={() => setShowThemeModal(true)}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          {/* AI Chat Button */}
          <button
            className={`p-1.5 rounded transition-colors ${
              showAIChat 
                ? 'bg-[#0e639c] text-[#ffffff]' 
                : 'text-[#cccccc] hover:text-[#ffffff] hover:bg-[#3e3e42]'
            }`}
            title="Chat de IA"
            onClick={() => setShowAIChat(!showAIChat)}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className="px-2.5 py-1 bg-[#3e3e42] hover:bg-[#464647] text-[#cccccc] rounded text-[12px] transition-colors"
            title={showFileExplorer ? "Ocultar explorador" : "Mostrar explorador"}
          >
            {showFileExplorer ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      {/* Tabs de archivos abiertos */}
      {openFiles.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-[#252526] border-b border-[#3e3e42] overflow-x-auto">
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
            
            {/* Botón para abrir terminal */}
            {!showExtensionsPanel && (
              <div className="px-2 py-2 border-b border-[#3e3e42]">
                <button
                  onClick={() => {
                    // Disparar evento personalizado para abrir terminal en CentroEjecucionPage
                    const event = new CustomEvent('open-terminal-from-visualcode', {
                      detail: {
                        projectPath: projectPath || project?.path,
                        projectName: projectTitle || project?.title || 'Proyecto'
                      }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-3 py-2 text-left text-[12px] text-[#cccccc] hover:text-[#ffffff] hover:bg-[#2d2d30] rounded transition-colors flex items-center gap-2"
                  title="Abrir terminal en una pestaña nueva con la ruta del proyecto"
                >
                  <Terminal className="w-4 h-4 flex-shrink-0" />
                  <span>Abrir Terminal</span>
                </button>
              </div>
            )}
            
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
                  // Mostrar vista dividida cuando se selecciona desde Git
                  if (filePath && projectPath) {
                    const fullPath = filePath.startsWith(projectPath) 
                      ? filePath 
                      : `${projectPath}/${filePath}`.replace(/\/+/g, '/');
                    setGitDiffFile(fullPath);
                  }
                }}
              />
            ) : (
              <div className="flex-1 overflow-y-auto">
                <FileExplorer
                  isOpen={showFileExplorer}
                  onClose={() => setShowFileExplorer(false)}
                  projectPath={projectPath}
                  onFileSelect={(filePath, content) => {
                    loadFile(filePath, content);
                  }}
                  onProjectPathChange={setProjectPath}
                  onProjectHandleChange={(handle) => {
                    // Guardar el handle si es un proyecto del navegador
                    if (handle && project?.id && typeof window !== 'undefined') {
                      if (!window.directoryHandles) {
                        window.directoryHandles = new Map();
                      }
                      window.directoryHandles.set(project.id, handle);
                    }
                  }}
                  directoryHandle={project?.directoryHandle || null}
                  hideHeader={true}
                  vscodeStyle={true}
                  openFiles={openFiles}
                />
              </div>
            )}
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ position: 'relative' }}>
          {gitDiffFile ? (
            <GitDiffView
              projectPath={projectPath}
              filePath={gitDiffFile}
              onClose={() => setGitDiffFile(null)}
            />
          ) : activeFile ? (
            <div 
              ref={editorContainerRef} 
              className="flex-1 visual-code-tab-container"
              style={{ 
                height: '100%',
                width: '100%',
                position: 'relative',
                userSelect: 'text !important',
                WebkitUserSelect: 'text !important',
                MozUserSelect: 'text !important',
                msUserSelect: 'text !important',
                pointerEvents: 'auto !important',
                cursor: 'text !important',
                overflow: 'auto',
              }}
              onClick={(e) => {
                // Solo enfocar si el clic no es parte de una selección de texto
                // Verificar si hay una selección activa
                const selection = window.getSelection();
                if (selection && selection.toString().length > 0) {
                  // Hay texto seleccionado, no enfocar para permitir copiar
                  return;
                }
                
                // Enfocar el editor cuando se hace clic en el contenedor (pero no en botones/inputs)
                if (editorViewRef.current && !e.target.closest('button') && !e.target.closest('input') && !e.target.closest('textarea')) {
                  // Usar setTimeout para no interferir con la selección
                  setTimeout(() => {
                    if (editorViewRef.current) {
                      editorViewRef.current.focus();
                    }
                  }, 0);
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

      {/* Modal de selección de tema */}
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
                {themes.map((themeOption) => {
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
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
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
        projectPath={projectPath}
      />
    </div>
  );
}
