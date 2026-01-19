import { useEffect, useRef } from 'react';
import { X, File, Save, GitCompare } from 'lucide-react';
import { EditorView, ViewPlugin, Decoration } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { closeBrackets } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { getThemeExtension } from '../services/CodeMirrorThemeService';

export default function CompareView({
  file1,
  file2,
  content1,
  content2,
  fileContents,
  theme,
  fontSize,
  customThemeColors,
  onContentChange,
  onSave,
  onClose,
  editor1Ref,
  editor2Ref,
  container1Ref,
  container2Ref
}) {
  // Determinar lenguaje según extensión
  const getLanguage = (filename) => {
    if (!filename) return javascript();
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'mjs':
      case 'ts':
      case 'tsx':
        return javascript({ jsx: true, typescript: true });
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

  const getFileName = (filePath) => {
    return filePath.split(/[/\\]/).pop() || filePath;
  };

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
        diff.push({ type: 'added', line: i + 1 });
      } else if (line2 === undefined) {
        diff.push({ type: 'removed', line: i + 1 });
      } else if (line1 !== line2) {
        diff.push({ type: 'modified', line: i + 1 });
      }
    }

    return diff;
  };

  // Referencias compartidas para el contenido de ambos editores
  const content1Ref = useRef(content1);
  const content2Ref = useRef(content2);
  const editor1ViewRef = useRef(null);
  const editor2ViewRef = useRef(null);
  const isUpdatingFromEditor1Ref = useRef(false);
  const isUpdatingFromEditor2Ref = useRef(false);

  // Actualizar referencias cuando cambia el contenido (sin forzar actualizaciones que interrumpan la edición)
  // Separar en dos efectos para evitar actualizaciones innecesarias
  useEffect(() => {
    content1Ref.current = content1;
    // NO hacer dispatch aquí para no interrumpir la edición
  }, [content1]);
  
  useEffect(() => {
    content2Ref.current = content2;
    // NO hacer dispatch aquí para no interrumpir la edición
  }, [content2]);

  // Plugin para resaltar diferencias en el editor 1 (rojo para removido/modificado)
  const diffDecorationPlugin1 = ViewPlugin.fromClass(
    class {
      decorations;
      
      constructor(view) {
        editor1ViewRef.current = view;
        this.decorations = this.buildDecorations(view, view.state.doc.toString(), content2Ref.current, 'file1');
      }

      update(update) {
        // Solo actualizar decoraciones cuando hay cambios reales
        // NO actualizar durante la edición activa para no perder el foco
        if (update.docChanged) {
          // Cuando hay cambios en el documento, actualizar las decoraciones
          const currentContent1 = update.view.state.doc.toString();
          const currentContent2 = content2Ref.current;
          this.decorations = this.buildDecorations(update.view, currentContent1, currentContent2, 'file1');
        } else if (!update.view.hasFocus && (update.viewportChanged || update.geometryChanged)) {
          // Solo actualizar por viewport si el editor NO tiene el foco
          const currentContent1 = update.view.state.doc.toString();
          const currentContent2 = content2Ref.current;
          this.decorations = this.buildDecorations(update.view, currentContent1, currentContent2, 'file1');
        }
      }

      buildDecorations(view, content1, content2, side) {
        const decorations = [];
        const diff = calculateDiff(content1, content2);
        
        diff.forEach((item) => {
          if (item.type === 'removed' || (item.type === 'modified' && side === 'file1')) {
            try {
              const line = view.state.doc.line(item.line);
              if (line) {
                decorations.push(
                  Decoration.line({
                    class: 'cm-diff-removed',
                    attributes: { style: 'background-color: rgba(90, 29, 29, 0.3); border-left: 4px solid #ff6b6b; padding-left: 8px;' }
                  }).range(line.from)
                );
              }
            } catch (e) {
              // Ignorar errores si la línea no existe
            }
          }
        });

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations
    }
  );

  // Plugin para resaltar diferencias en el editor 2 (verde para agregado/modificado)
  const diffDecorationPlugin2 = ViewPlugin.fromClass(
    class {
      decorations;
      
      constructor(view) {
        editor2ViewRef.current = view;
        this.decorations = this.buildDecorations(view, content1Ref.current, view.state.doc.toString(), 'file2');
      }

      update(update) {
        // Solo actualizar decoraciones cuando hay cambios reales
        // NO actualizar durante la edición activa para no perder el foco
        if (update.docChanged) {
          // Cuando hay cambios en el documento, actualizar las decoraciones
          const currentContent1 = content1Ref.current;
          const currentContent2 = update.view.state.doc.toString();
          this.decorations = this.buildDecorations(update.view, currentContent1, currentContent2, 'file2');
        } else if (!update.view.hasFocus && (update.viewportChanged || update.geometryChanged)) {
          // Solo actualizar por viewport si el editor NO tiene el foco
          const currentContent1 = content1Ref.current;
          const currentContent2 = update.view.state.doc.toString();
          this.decorations = this.buildDecorations(update.view, currentContent1, currentContent2, 'file2');
        }
      }

      buildDecorations(view, content1, content2, side) {
        const decorations = [];
        const diff = calculateDiff(content1, content2);
        
        diff.forEach((item) => {
          if (item.type === 'added' || (item.type === 'modified' && side === 'file2')) {
            try {
              const line = view.state.doc.line(item.line);
              if (line) {
                decorations.push(
                  Decoration.line({
                    class: 'cm-diff-added',
                    attributes: { style: 'background-color: rgba(30, 58, 30, 0.3); border-left: 4px solid #4ade80; padding-left: 8px;' }
                  }).range(line.from)
                );
              }
            } catch (e) {
              // Ignorar errores si la línea no existe
            }
          }
        });

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations
    }
  );

  // Inicializar editor 1 - Solo una vez cuando se monta
  useEffect(() => {
    if (!container1Ref.current || editor1Ref.current) return;

    const initializeEditor1 = () => {
      try {
        // Limpiar contenedor
        if (container1Ref.current) {
          container1Ref.current.innerHTML = '';
        }

        const editorExtensions = [
          basicSetup,
          closeBrackets(),
          getLanguage(file1),
          diffDecorationPlugin1,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              console.log('[CompareView] Editor 1 - docChanged, hasFocus:', update.view.hasFocus);
              const newContent = update.view.state.doc.toString();
              content1Ref.current = newContent;
              // Marcar que el cambio viene del editor para evitar actualizaciones circulares
              isUpdatingFromEditor1Ref.current = true;
              console.log('[CompareView] Editor 1 - Marcando isUpdatingFromEditor1Ref = true');
              // Actualizar el estado de forma asíncrona para no interrumpir la edición
              // Usar un debounce para evitar actualizaciones excesivas
              if (update.view.hasFocus) {
                console.log('[CompareView] Editor 1 - Tiene foco, usando debounce de 500ms');
                // Si tiene foco, esperar un poco antes de actualizar para no perder el foco
                const timeoutId = setTimeout(() => {
                  console.log('[CompareView] Editor 1 - Ejecutando onContentChange después de debounce');
                  onContentChange('file1', newContent);
                  // Resetear la bandera después de un delay adicional
                  setTimeout(() => {
                    isUpdatingFromEditor1Ref.current = false;
                    console.log('[CompareView] Editor 1 - Reseteando isUpdatingFromEditor1Ref = false');
                  }, 100);
                }, 500);
                // Limpiar timeout anterior si existe
                if (editor1Ref.current._updateTimeout) {
                  clearTimeout(editor1Ref.current._updateTimeout);
                }
                editor1Ref.current._updateTimeout = timeoutId;
              } else {
                console.log('[CompareView] Editor 1 - NO tiene foco, actualizando inmediatamente');
                onContentChange('file1', newContent);
                setTimeout(() => {
                  isUpdatingFromEditor1Ref.current = false;
                  console.log('[CompareView] Editor 1 - Reseteando isUpdatingFromEditor1Ref = false (sin foco)');
                }, 100);
              }
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
            },
            '.cm-focused': {
              outline: 'none',
            },
            '.cm-selectionBackground': {
              backgroundColor: 'rgba(0, 122, 204, 0.3) !important',
            },
            '.cm-selectionMatch': {
              backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
            },
            '.cm-selection': {
              backgroundColor: 'rgba(0, 122, 204, 0.3) !important',
            },
          }),
          ...getThemeExtension(theme, theme === 'custom' ? customThemeColors : null),
        ];

        const view = new EditorView({
          doc: content1,
          extensions: editorExtensions,
          parent: container1Ref.current,
        });

        editor1Ref.current = view;
        editor1ViewRef.current = view;
        
        // Asegurar que el editor pueda recibir eventos y mantener el foco
        // NO usar setTimeout aquí para evitar pérdida de foco
        if (view.dom) {
          const editorElement = view.dom.querySelector('.cm-editor');
          if (editorElement) {
            editorElement.setAttribute('tabindex', '0');
            editorElement.style.outline = 'none';
            editorElement.style.pointerEvents = 'auto';
            editorElement.style.userSelect = 'text';
          }
        }
      } catch (error) {
        console.error('[CompareView] Error inicializando editor 1:', error);
      }
    };

    initializeEditor1();

    return () => {
      if (editor1Ref.current) {
        editor1Ref.current.destroy();
        editor1Ref.current = null;
        editor1ViewRef.current = null;
      }
    };
  }, [file1, theme, fontSize, customThemeColors]); // NO incluir content1/content2 para evitar recrear el editor

  // Actualizar contenido del editor 1 sin recrearlo
  useEffect(() => {
    console.log('[CompareView] useEffect Editor 1 - content1 cambió, isUpdatingFromEditor1Ref:', isUpdatingFromEditor1Ref.current);
    // NO actualizar si el cambio viene del mismo editor (evitar loop)
    if (isUpdatingFromEditor1Ref.current) {
      console.log('[CompareView] useEffect Editor 1 - Ignorando actualización porque viene del editor mismo');
      return;
    }
    
    if (editor1Ref.current) {
      const currentContent = editor1Ref.current.state.doc.toString();
      const hasFocus = editor1Ref.current.hasFocus;
      console.log('[CompareView] useEffect Editor 1 - Comparando contenido:', {
        content1Length: content1.length,
        currentContentLength: currentContent.length,
        areEqual: content1 === currentContent,
        hasFocus
      });
      
      if (content1 !== currentContent) {
        // Solo actualizar si el editor NO tiene el foco (para no interrumpir la edición)
        if (!hasFocus) {
          console.log('[CompareView] useEffect Editor 1 - Actualizando contenido (sin foco)');
          const currentDoc = editor1Ref.current.state.doc;
          const newDoc = editor1Ref.current.state.update({
            changes: {
              from: 0,
              to: currentDoc.length,
              insert: content1
            }
          });
          editor1Ref.current.dispatch(newDoc);
        } else {
          console.log('[CompareView] useEffect Editor 1 - NO actualizando porque tiene foco');
        }
      }
    }
  }, [content1]);

  // Inicializar editor 2 - Solo una vez cuando se monta
  useEffect(() => {
    if (!container2Ref.current || editor2Ref.current) return;

    const initializeEditor2 = () => {
      try {
        // Limpiar contenedor
        if (container2Ref.current) {
          container2Ref.current.innerHTML = '';
        }

        const editorExtensions = [
          basicSetup,
          closeBrackets(),
          getLanguage(file2),
          diffDecorationPlugin2,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              console.log('[CompareView] Editor 2 - docChanged, hasFocus:', update.view.hasFocus);
              const newContent = update.view.state.doc.toString();
              content2Ref.current = newContent;
              // Marcar que el cambio viene del editor para evitar actualizaciones circulares
              isUpdatingFromEditor2Ref.current = true;
              console.log('[CompareView] Editor 2 - Marcando isUpdatingFromEditor2Ref = true');
              // Actualizar el estado de forma asíncrona para no interrumpir la edición
              // Usar un debounce para evitar actualizaciones excesivas
              if (update.view.hasFocus) {
                console.log('[CompareView] Editor 2 - Tiene foco, usando debounce de 500ms');
                // Si tiene foco, esperar un poco antes de actualizar para no perder el foco
                const timeoutId = setTimeout(() => {
                  console.log('[CompareView] Editor 2 - Ejecutando onContentChange después de debounce');
                  onContentChange('file2', newContent);
                  // Resetear la bandera después de un delay adicional
                  setTimeout(() => {
                    isUpdatingFromEditor2Ref.current = false;
                    console.log('[CompareView] Editor 2 - Reseteando isUpdatingFromEditor2Ref = false');
                  }, 100);
                }, 500);
                // Limpiar timeout anterior si existe
                if (editor2Ref.current._updateTimeout) {
                  clearTimeout(editor2Ref.current._updateTimeout);
                }
                editor2Ref.current._updateTimeout = timeoutId;
              } else {
                console.log('[CompareView] Editor 2 - NO tiene foco, actualizando inmediatamente');
                onContentChange('file2', newContent);
                setTimeout(() => {
                  isUpdatingFromEditor2Ref.current = false;
                  console.log('[CompareView] Editor 2 - Reseteando isUpdatingFromEditor2Ref = false (sin foco)');
                }, 100);
              }
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
            },
            '.cm-focused': {
              outline: 'none',
            },
            '.cm-selectionBackground': {
              backgroundColor: 'rgba(173, 214, 255, 0.4) !important',
            },
            '.cm-selectionMatch': {
              backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
            },
            '.cm-selection': {
              backgroundColor: 'rgba(173, 214, 255, 0.4) !important',
            },
            '&.cm-focused .cm-selectionBackground': {
              backgroundColor: 'rgba(173, 214, 255, 0.5) !important',
            },
            '&.cm-focused .cm-selection': {
              backgroundColor: 'rgba(173, 214, 255, 0.5) !important',
            },
            '.cm-content::selection': {
              backgroundColor: 'rgba(173, 214, 255, 0.4) !important',
              color: 'inherit !important',
            },
            '.cm-content ::selection': {
              backgroundColor: 'rgba(173, 214, 255, 0.4) !important',
              color: 'inherit !important',
            },
          }),
          ...getThemeExtension(theme, theme === 'custom' ? customThemeColors : null),
        ];

        const view = new EditorView({
          doc: content2,
          extensions: editorExtensions,
          parent: container2Ref.current,
        });

        editor2Ref.current = view;
        editor2ViewRef.current = view;
        
        // Asegurar que el editor pueda recibir eventos y mantener el foco
        // NO usar setTimeout aquí para evitar pérdida de foco
        if (view.dom) {
          const editorElement = view.dom.querySelector('.cm-editor');
          if (editorElement) {
            editorElement.setAttribute('tabindex', '0');
            editorElement.style.outline = 'none';
            editorElement.style.pointerEvents = 'auto';
            editorElement.style.userSelect = 'text';
          }
        }
      } catch (error) {
        console.error('[CompareView] Error inicializando editor 2:', error);
      }
    };

    initializeEditor2();

    return () => {
      if (editor2Ref.current) {
        editor2Ref.current.destroy();
        editor2Ref.current = null;
        editor2ViewRef.current = null;
      }
    };
  }, [file2, theme, fontSize, customThemeColors]); // NO incluir content1/content2 para evitar recrear el editor

  // Actualizar contenido del editor 2 sin recrearlo
  useEffect(() => {
    console.log('[CompareView] useEffect Editor 2 - content2 cambió, isUpdatingFromEditor2Ref:', isUpdatingFromEditor2Ref.current);
    // NO actualizar si el cambio viene del mismo editor (evitar loop)
    if (isUpdatingFromEditor2Ref.current) {
      console.log('[CompareView] useEffect Editor 2 - Ignorando actualización porque viene del editor mismo');
      return;
    }
    
    if (editor2Ref.current) {
      const currentContent = editor2Ref.current.state.doc.toString();
      const hasFocus = editor2Ref.current.hasFocus;
      console.log('[CompareView] useEffect Editor 2 - Comparando contenido:', {
        content2Length: content2.length,
        currentContentLength: currentContent.length,
        areEqual: content2 === currentContent,
        hasFocus
      });
      
      if (content2 !== currentContent) {
        // Solo actualizar si el editor NO tiene el foco (para no interrumpir la edición)
        if (!hasFocus) {
          console.log('[CompareView] useEffect Editor 2 - Actualizando contenido (sin foco)');
          const currentDoc = editor2Ref.current.state.doc;
          const newDoc = editor2Ref.current.state.update({
            changes: {
              from: 0,
              to: currentDoc.length,
              insert: content2
            }
          });
          editor2Ref.current.dispatch(newDoc);
        } else {
          console.log('[CompareView] useEffect Editor 2 - NO actualizando porque tiene foco');
        }
      }
    }
  }, [content2]);

  // Actualizar referencias cuando cambie el contenido (sin forzar actualizaciones que interrumpan la edición)
  useEffect(() => {
    content1Ref.current = content1;
    content2Ref.current = content2;
    // Los plugins se actualizarán automáticamente cuando haya cambios en el viewport
    // No forzar actualizaciones aquí para no interrumpir la edición
  }, [content1, content2]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden compare-view-container">
      {/* Header de comparación */}
      <div className="bg-[#252526] border-b border-[#3e3e42] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <File className="w-4 h-4 text-[#4ec9b0] flex-shrink-0" />
            <span className="text-[13px] text-[#cccccc] truncate" title={file1}>
              {getFileName(file1)}
            </span>
          </div>
          <GitCompare className="w-4 h-4 text-[#858585] flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <File className="w-4 h-4 text-[#4ec9b0] flex-shrink-0" />
            <span className="text-[13px] text-[#cccccc] truncate" title={file2}>
              {getFileName(file2)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[#3e3e42] rounded transition-colors"
          title="Cerrar comparación"
        >
          <X className="w-4 h-4 text-[#cccccc]" />
        </button>
      </div>
      
      {/* Vista lado a lado con editores */}
      <div className="flex-1 flex overflow-hidden">
        {/* Archivo 1 - Editor */}
        <div className="flex-1 flex flex-col border-r border-[#3e3e42] overflow-hidden">
          <div className="bg-[#2d2d30] px-3 py-1.5 border-b border-[#3e3e42] flex items-center justify-between">
            <span className="text-[11px] text-[#858585] uppercase font-semibold truncate" title={file1}>
              {getFileName(file1)}
            </span>
            <button
              onClick={() => onSave(file1)}
              className="px-2 py-1 text-[10px] bg-[#0e639c] hover:bg-[#1177bb] text-white rounded flex items-center gap-1 transition-colors"
              title="Guardar archivo 1"
            >
              <Save className="w-3 h-3" />
              Guardar
            </button>
          </div>
          <div 
            ref={container1Ref}
            className="flex-1 overflow-hidden"
            style={{ height: '100%' }}
          />
        </div>
        
        {/* Archivo 2 - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-[#2d2d30] px-3 py-1.5 border-b border-[#3e3e42] flex items-center justify-between">
            <span className="text-[11px] text-[#858585] uppercase font-semibold truncate" title={file2}>
              {getFileName(file2)}
            </span>
            <button
              onClick={() => onSave(file2)}
              className="px-2 py-1 text-[10px] bg-[#0e639c] hover:bg-[#1177bb] text-white rounded flex items-center gap-1 transition-colors"
              title="Guardar archivo 2"
            >
              <Save className="w-3 h-3" />
              Guardar
            </button>
          </div>
          <div 
            ref={container2Ref}
            className="flex-1 overflow-hidden"
            style={{ height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

