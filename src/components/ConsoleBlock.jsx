import { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Play, Maximize2, Minimize2, X, FolderOpen, Terminal, Settings, BookOpen, Eye, Code, Sidebar, Info, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
import codeIntelligenceService from '../services/CodeIntelligenceService';
import FileExplorer from './FileExplorer';
import ConsolePluginsModal from './ConsolePluginsModal';
import cursosService from '../services/CursosService';

export default function ConsoleBlock({ node, updateAttributes, deleteNode, editor }) {
  const [code, setCode] = useState(node.attrs.code || '');
  const [output, setOutput] = useState(node.attrs.output || '');
  const [isExecuting, setIsExecuting] = useState(false);
  const [language, setLanguage] = useState(node.attrs.language || 'nodejs');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isHTMLCode, setIsHTMLCode] = useState(false);
  const [codeAreaHeight, setCodeAreaHeight] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [explorerProjectPath, setExplorerProjectPath] = useState('');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [projectPath, setProjectPath] = useState('');
  const [isExecutingProject, setIsExecutingProject] = useState(false);
  const [detectedProjectType, setDetectedProjectType] = useState(null);
  const [showBrowserModeInfo, setShowBrowserModeInfo] = useState(false);
  const [showPluginsModal, setShowPluginsModal] = useState(false);
  const [plugins, setPlugins] = useState(() => {
    const saved = localStorage.getItem('console-plugins');
    return saved ? JSON.parse(saved) : {
      autocomplete: true,
      snippets: true,
      syntaxValidation: true,
      codeFormatting: false,
      linting: false
    };
  });
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [completionIndex, setCompletionIndex] = useState(-1);
  const codeTextareaRef = useRef(null);
  const codeHighlightRef = useRef(null);
  const outputRef = useRef(null);
  const previewIframeRef = useRef(null);
  const resizeRef = useRef(null);

  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.executeCode;

  // Sincronizar con los atributos del nodo
  useEffect(() => {
    updateAttributes({ code, language, output });
  }, [code, language, output, updateAttributes]);

  // Auto-scroll en la salida
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Aplicar resaltado de sintaxis
  useEffect(() => {
    if (codeHighlightRef.current && code.trim()) {
      const langMap = {
        'nodejs': 'javascript',
        'python': 'python',
        'dotnet': 'csharp',
        'java': 'java',
        'sqlite': 'sql',
      };
      const lang = langMap[language] || 'plaintext';
      try {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        codeHighlightRef.current.innerHTML = highlighted;
        codeHighlightRef.current.style.color = 'transparent';
        codeHighlightRef.current.style.WebkitTextFillColor = 'transparent';
      } catch (err) {
        codeHighlightRef.current.textContent = code;
        codeHighlightRef.current.style.color = 'transparent';
        codeHighlightRef.current.style.WebkitTextFillColor = 'transparent';
      }
    } else if (codeHighlightRef.current) {
      codeHighlightRef.current.textContent = '';
      codeHighlightRef.current.style.color = 'transparent';
      codeHighlightRef.current.style.WebkitTextFillColor = 'transparent';
    }
  }, [code, language]);

  // Sincronizar scroll
  const handleCodeScroll = () => {
    if (codeTextareaRef.current && codeHighlightRef.current) {
      codeHighlightRef.current.scrollTop = codeTextareaRef.current.scrollTop;
      codeHighlightRef.current.scrollLeft = codeTextareaRef.current.scrollLeft;
    }
  };

  // Validación de sintaxis en tiempo real
  useEffect(() => {
    if (plugins.syntaxValidation && code.trim()) {
      const errors = codeIntelligenceService.validateSyntax(code, language);
      setSyntaxErrors(errors);
    } else {
      setSyntaxErrors([]);
    }
  }, [code, language, plugins.syntaxValidation]);

  // Detectar si el código es HTML/CSS/React
  useEffect(() => {
    const codigo = code.trim().toLowerCase();
    const esHTML = codigo.includes('<!doctype html') || 
                   codigo.includes('<html') || 
                   codigo.includes('<div') || 
                   codigo.includes('<body') ||
                   codigo.includes('react') ||
                   codigo.includes('jsx') ||
                   (codigo.includes('<style') || codigo.includes('<script'));
    setIsHTMLCode(esHTML);
  }, [code]);

  // Actualizar preview cuando cambia el código
  const actualizarPreview = () => {
    if (!code.trim()) {
      setPreviewContent('');
      return;
    }

    let contenido = code;
    
    if (!code.includes('<!DOCTYPE') && !code.includes('<html')) {
      const tieneStyle = code.includes('<style');
      const tieneScript = code.includes('<script');
      
      if (tieneStyle || tieneScript || code.includes('<div') || code.includes('<p') || code.includes('<h1')) {
        contenido = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
${code}
</body>
</html>`;
      }
    }
    
    setPreviewContent(contenido);
    
    if (previewIframeRef.current) {
      const iframe = previewIframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(contenido);
      doc.close();
    }
  };

  useEffect(() => {
    if (showPreview && isHTMLCode && code.trim()) {
      const timeoutId = setTimeout(() => {
        actualizarPreview();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [showPreview, isHTMLCode, code]);

  // Autocompletado y cambio de código
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    if (plugins.autocomplete && codeTextareaRef.current) {
      const cursorPos = codeTextareaRef.current.selectionStart;
      const completions = codeIntelligenceService.getCompletions(newCode, cursorPos, language);
      if (completions.length > 0) {
        setCompletions(completions);
        setShowCompletions(true);
        setCompletionIndex(-1);
      } else {
        setShowCompletions(false);
        setCompletions([]);
      }
    } else {
      setShowCompletions(false);
      setCompletions([]);
    }
  };

  // Manejar teclas para autocompletado y plugins
  const handleKeyDownWithPlugins = (e) => {
    if (showCompletions && completions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCompletionIndex(prev => (prev < completions.length - 1 ? prev + 1 : prev));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCompletionIndex(prev => (prev > 0 ? prev - 1 : -1));
        return;
      }
      if (e.key === 'Enter' && completionIndex >= 0) {
        e.preventDefault();
        const selected = completions[completionIndex];
        if (selected.snippet) {
          const expanded = codeIntelligenceService.expandSnippet(selected.snippet);
          const lines = code.split('\n');
          const currentLine = lines[lines.length - 1] || '';
          const beforeCursor = codeTextareaRef.current?.selectionStart || 0;
          const lineStart = code.lastIndexOf('\n', beforeCursor - 1) + 1;
          const wordMatch = currentLine.match(/(\w+)$/);
          if (wordMatch) {
            const newCode = code.substring(0, lineStart + currentLine.length - wordMatch[1].length) + 
                          expanded + 
                          code.substring(lineStart + currentLine.length);
            setCode(newCode);
            setShowCompletions(false);
          }
        } else {
          const lines = code.split('\n');
          const currentLine = lines[lines.length - 1] || '';
          const wordMatch = currentLine.match(/(\w+)$/);
          if (wordMatch) {
            const newCode = code.replace(new RegExp(`\\b${wordMatch[1]}\\b$`, 'm'), selected.label);
            setCode(newCode);
            setShowCompletions(false);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowCompletions(false);
        return;
      }
    }

    if (plugins.snippets && e.key === 'Tab' && !e.shiftKey) {
      const lines = code.split('\n');
      const currentLine = lines[lines.length - 1] || '';
      const wordMatch = currentLine.match(/(\w+)$/);
      if (wordMatch) {
        const prefix = wordMatch[1];
        const snippets = codeIntelligenceService.getSnippets(language);
        const snippet = Object.values(snippets).find(s => s.prefix === prefix);
        if (snippet) {
          e.preventDefault();
          const expanded = codeIntelligenceService.expandSnippet(snippet);
          const newCode = code.replace(new RegExp(`\\b${prefix}\\b$`, 'm'), expanded);
          setCode(newCode);
          return;
        }
      }
    }

    if (plugins.codeFormatting && e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      const formatted = codeIntelligenceService.formatCode(code, language);
      setCode(formatted);
      return;
    }

    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeCode();
      return;
    }
  };

  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('❌ Error: No hay código para ejecutar');
      return;
    }

    if (isHTMLCode && showPreview) {
      actualizarPreview();
    }

    setIsExecuting(true);
    setOutput('⏳ Ejecutando código...\n');

    try {
      if (window.electronAPI && window.electronAPI.executeCode) {
        const result = await window.electronAPI.executeCode(code, language);
        setOutput(result.output || result.error || 'Sin salida');
        updateAttributes({ output: result.output || result.error || 'Sin salida' });
      } else {
        if (isHTMLCode) {
          setOutput('✅ Código HTML/CSS detectado. Usa el botón "Ver Preview" para ver el resultado visual.');
          setIsExecuting(false);
          return;
        }
        
        if (language === 'nodejs') {
          let capturedOutput = '';
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;
          
          const captureOutput = (...args) => {
            capturedOutput += args.map(arg => {
              if (typeof arg === 'function') {
                return arg.toString();
              } else if (typeof arg === 'object' && arg !== null) {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ') + '\n';
          };
          
          console.log = captureOutput;
          console.error = captureOutput;
          console.warn = captureOutput;
          console.info = captureOutput;
          
          try {
            const result = new Function(code)();
            
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            
            if (capturedOutput) {
              setOutput(capturedOutput);
              updateAttributes({ output: capturedOutput });
            } else if (result !== undefined) {
              setOutput(String(result));
              updateAttributes({ output: String(result) });
            } else {
              setOutput('✅ Código ejecutado correctamente (sin salida)');
              updateAttributes({ output: '✅ Código ejecutado correctamente (sin salida)' });
            }
          } catch (error) {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            
            setOutput(`❌ Error: ${error.message}\n${error.stack || ''}`);
            updateAttributes({ output: `❌ Error: ${error.message}` });
          }
        } else {
          setOutput('⚠️ Solo JavaScript está disponible en el navegador.\n\nPara ejecutar Python, .NET, Java, etc., usa la versión Electron de la aplicación.');
          updateAttributes({ output: '⚠️ Solo JavaScript disponible en navegador' });
        }
      }
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
      updateAttributes({ output: `❌ Error: ${error.message}` });
    } finally {
      setIsExecuting(false);
    }
  };

  const selectProjectPath = async () => {
    if (window.electronAPI && window.electronAPI.selectDirectory) {
      const path = await window.electronAPI.selectDirectory();
      if (path) {
        setProjectPath(path);
        setExplorerProjectPath(path);
        if (window.electronAPI.detectProjectType) {
          const detection = await window.electronAPI.detectProjectType(path);
          if (detection.type) {
            setDetectedProjectType(detection);
          }
        }
      }
    }
  };

  const executeProject = async () => {
    if (!projectPath.trim() || !isElectron) return;

    setIsExecutingProject(true);
    setOutput('⏳ Ejecutando proyecto...\n');

    try {
      if (window.electronAPI && window.electronAPI.executeProject) {
        const result = await window.electronAPI.executeProject(projectPath);
        if (result.output) {
          setOutput(result.output);
          updateAttributes({ output: result.output });
        } else if (result.error) {
          setOutput(`❌ Error: ${result.error}`);
          updateAttributes({ output: `❌ Error: ${result.error}` });
        }
      }
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
      updateAttributes({ output: `❌ Error: ${error.message}` });
    } finally {
      setIsExecutingProject(false);
    }
  };

  // Manejar redimensionamiento
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizeRef.current) return;

      let container = resizeRef.current.parentElement;
      while (container && !container.classList.contains('flex-1')) {
        container = container.parentElement;
      }
      
      if (!container) {
        container = resizeRef.current.closest('.flex-col');
      }
      
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerHeight = containerRect.height;
        const mouseY = e.clientY;
        const relativeY = mouseY - containerRect.top;
        const percentage = (relativeY / containerHeight) * 100;
        const newHeight = Math.max(20, Math.min(80, percentage));
        setCodeAreaHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing]);

  const getPlaceholderText = () => {
    const placeholders = {
      nodejs: '// Escribe código JavaScript aquí\nconsole.log("Hola mundo");',
      python: '# Escribe código Python aquí\nprint("Hola mundo")',
      dotnet: '// Escribe código C# aquí\nConsole.WriteLine("Hola mundo");',
      java: '// Escribe código Java aquí\nSystem.out.println("Hola mundo");',
      sqlite: '-- Escribe consultas SQL aquí\nSELECT * FROM usuarios;',
    };
    return placeholders[language] || 'Escribe código aquí...';
  };

  return (
    <NodeViewWrapper className="console-block-wrapper my-4">
      <div className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden ${isExpanded ? 'fixed inset-4 z-[50000]' : ''}`}>
        {/* Header - Mismo que ConsolePanel */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="nodejs">Node.js</option>
              <option value="python">Python</option>
              <option value="dotnet">.NET</option>
              <option value="java">Java</option>
              <option value="sqlite">SQLite</option>
            </select>
            <button
              onClick={executeCode}
              disabled={isExecuting || !code.trim() || (!isElectron && (language === 'python' || language === 'dotnet' || language === 'java' || language === 'sqlite'))}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors text-xs flex items-center gap-1"
              title={!isElectron && (language === 'python' || language === 'dotnet' || language === 'java' || language === 'sqlite') ? `${language} solo disponible en Electron` : 'Ejecutar código (Ctrl+Enter)'}
            >
              <Play className="w-3 h-3" />
              {isExecuting ? '...' : 'Ejecutar'}
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            {!isElectron && (
              <div className="relative">
                <button
                  onClick={() => setShowBrowserModeInfo(!showBrowserModeInfo)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Información sobre modo navegador"
                >
                  <Info className="w-5 h-5" />
                </button>
                {showBrowserModeInfo && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      💡 Modo Navegador
                    </h4>
                    <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                      <p>Puedes ejecutar código <strong>JavaScript</strong> aquí mismo.</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>JavaScript funciona en el navegador</li>
                        <li>Python requiere Electron</li>
                        <li>Los proyectos completos requieren Electron</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className={`p-2 transition-colors ${
                showFileExplorer 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Explorador de archivos"
            >
              <Sidebar className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowProjectMenu(!showProjectMenu);
                  setShowHelp(false);
                }}
                className={`p-2 transition-colors ${
                  showProjectMenu 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Ejecutar proyecto completo"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              {showProjectMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Ejecutar Proyecto Completo
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={projectPath}
                          onChange={async (e) => {
                            const newPath = e.target.value;
                            setProjectPath(newPath);
                            setDetectedProjectType(null);
                            
                            if (newPath.trim() && window.electronAPI && window.electronAPI.detectProjectType) {
                              try {
                                const detection = await window.electronAPI.detectProjectType(newPath.trim());
                                if (detection.type) {
                                  setDetectedProjectType(detection);
                                } else if (detection.error && !detection.error.includes('no existe')) {
                                  setDetectedProjectType({ error: detection.error });
                                }
                              } catch (error) {
                                // Ignorar errores silenciosamente
                              }
                            }
                          }}
                          placeholder="Ruta del proyecto"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectProjectPath}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Seleccionar
                        </button>
                        <button
                          onClick={() => {
                            executeProject();
                            setShowProjectMenu(false);
                          }}
                          disabled={isExecutingProject || !projectPath.trim() || !isElectron}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          {isExecutingProject ? 'Ejecutando...' : 'Ejecutar'}
                        </button>
                      </div>
                      {detectedProjectType && detectedProjectType.type && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          ✓ Proyecto detectado: {detectedProjectType.type}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setShowPluginsModal(true);
                  setShowHelp(false);
                  setShowProjectMenu(false);
                }}
                className={`p-2 transition-colors ${
                  plugins.autocomplete || plugins.snippets || plugins.syntaxValidation
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Plugins de Inteligencia de Código (VS Code)"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setShowHelp(!showHelp);
                  setShowProjectMenu(false);
                }}
                className={`p-2 transition-colors ${
                  showHelp 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Ayuda y ejemplos"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
            {isHTMLCode && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-xs flex items-center gap-1"
                title={showPreview ? "Ver código" : "Ver preview"}
              >
                {showPreview ? (
                  <>
                    <Code className="w-4 h-4" />
                    Ver Código
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Ver Preview
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => deleteNode()}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Eliminar bloque"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Mismo layout que ConsolePanel */}
        <div className={`flex ${isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[95vh] max-h-[95vh]'}`}>
          {/* File Explorer Sidebar */}
          {showFileExplorer && (
            <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 h-full">
              <FileExplorer
                isOpen={showFileExplorer}
                onClose={() => setShowFileExplorer(false)}
                projectPath={explorerProjectPath}
                onFileSelect={(filePath, content) => {
                  setCode(content);
                  const ext = filePath.split('.').pop()?.toLowerCase();
                  if (ext === 'py') setLanguage('python');
                  else if (ext === 'js' || ext === 'jsx') setLanguage('nodejs');
                  else if (ext === 'cs') setLanguage('dotnet');
                  else if (ext === 'java') setLanguage('java');
                  else if (ext === 'sql') setLanguage('sqlite');
                }}
                onProjectPathChange={setExplorerProjectPath}
              />
            </div>
          )}

          {/* Main Content */}
          <div className={`flex-1 flex flex-col overflow-hidden ${showFileExplorer ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}>
            {/* Editor de código - Área redimensionable */}
            <div 
              className="flex flex-col min-h-0 overflow-hidden"
              style={{ height: `${codeAreaHeight}%` }}
            >
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-4 pt-2">
                Código:
              </label>
              <div className="relative flex-1 min-h-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-900 console-code-highlight">
                <pre
                  ref={codeHighlightRef}
                  className="absolute inset-0 m-0 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap break-words pointer-events-none"
                  style={{ 
                    zIndex: 1,
                    background: '#111827',
                    lineHeight: '1.5rem',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent'
                  }}
                />
                <textarea
                  ref={codeTextareaRef}
                  value={code}
                  onChange={handleCodeChange}
                  onScroll={handleCodeScroll}
                  onKeyDown={handleKeyDownWithPlugins}
                  placeholder={getPlaceholderText()}
                  className="console-code-editor relative w-full h-full px-4 py-3 border-0 focus:outline-none font-mono text-sm resize-none min-h-0"
                  style={{ 
                    zIndex: 10,
                    caretColor: '#4ade80',
                    background: 'transparent',
                    lineHeight: '1.5rem',
                    color: '#4ade80',
                    WebkitTextFillColor: '#4ade80'
                  }}
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Divisor redimensionable */}
            <div
              ref={resizeRef}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              className="h-2 cursor-row-resize hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors flex items-center justify-center group relative"
              title="Arrastra para redimensionar"
            >
              <div className="w-20 h-1 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
            </div>

            {/* Salida - Área redimensionable */}
            <div 
              className="flex flex-col min-h-0 overflow-hidden"
              style={{ height: `${100 - codeAreaHeight}%` }}
            >
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-4 pt-2">
                Salida:
              </label>
              <div
                ref={outputRef}
                className="flex-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-green-400 font-mono text-sm overflow-auto min-h-0 whitespace-pre-wrap"
              >
                {output || <span className="text-gray-500">La salida aparecerá aquí...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Plugins */}
      <ConsolePluginsModal
        isOpen={showPluginsModal}
        onClose={() => setShowPluginsModal(false)}
        plugins={plugins}
        onPluginsChange={(newPlugins) => {
          setPlugins(newPlugins);
          localStorage.setItem('console-plugins', JSON.stringify(newPlugins));
        }}
      />

      {/* Modal de Ayuda - Simplificado */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50001] flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                💡 Ayuda de la Consola
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>Esta consola tiene todas las funcionalidades del modal completo.</p>
                <p><strong>Ctrl+Enter:</strong> Ejecutar código</p>
                <p><strong>Ctrl+Shift+F:</strong> Formatear código (si está activado)</p>
                <p><strong>Tab:</strong> Expandir snippets (si está activado)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .console-block-wrapper {
          margin: 1rem 0;
        }
        .console-block-wrapper pre {
          margin: 0;
          padding: 0;
        }
        .console-block-wrapper .hljs {
          background: #111827 !important;
        }
        .console-code-highlight {
          background: #111827 !important;
        }
        .console-code-editor {
          background: transparent !important;
          color: #4ade80 !important;
          -webkit-text-fill-color: #4ade80 !important;
        }
        .console-code-editor::placeholder {
          color: #6a9955 !important;
          -webkit-text-fill-color: #6a9955 !important;
        }
      `}</style>
    </NodeViewWrapper>
  );
}
