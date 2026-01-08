import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Code2, Maximize2, Minimize2 } from 'lucide-react';

export default function CodeBlockWithCopy({ node, updateAttributes, editor }) {
  const [copied, setCopied] = useState(false);
  const [isInDrawer, setIsInDrawer] = useState(false);
  const [isInModal, setIsInModal] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState('');
  const language = node.attrs.language || '';
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);
  const fullscreenRef = useRef(null);

  // Actualizar el contenido del modal cuando cambia el nodo (solo si está en fullscreen)
  useEffect(() => {
    if (isFullscreen) {
      const currentText = getCodeText();
      setFullscreenContent(currentText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen, node.textContent]);

  // Detectar si estamos dentro del drawer y si el drawer está abierto
  useEffect(() => {
    const checkContext = () => {
      if (!wrapperRef.current) return;

      // Verificar si el componente está dentro de un drawer o modal
      // Buscar un elemento padre que tenga el atributo data-drawer
      let parent = wrapperRef.current.parentElement;
      let foundDrawer = false;
      let foundModal = false;
      
      while (parent && parent !== document.body) {
        // Verificar si tiene el atributo data-drawer (método más confiable)
        const drawerAttr = parent.getAttribute('data-drawer');
        if (drawerAttr === 'table-drawer' || drawerAttr === 'table-drawer-modal') {
          foundDrawer = true;
          if (drawerAttr === 'table-drawer-modal') {
            foundModal = true;
          }
          break;
        }
        
        // Fallback: verificar por clases y estilos
        const computedStyle = getComputedStyle(parent);
        const zIndex = computedStyle.zIndex;
        const position = computedStyle.position;
        
        if (position === 'fixed' && (zIndex === '100' || zIndex === '10000' || parent.classList.toString().includes('z-[100]') || parent.classList.toString().includes('z-[10000]'))) {
          if (parent.classList.toString().includes('bg-white') || 
              parent.classList.toString().includes('shadow-2xl')) {
            foundDrawer = true;
            if (zIndex === '10000' || parent.classList.toString().includes('z-[10000]')) {
              foundModal = true;
            }
            break;
          }
        }
        parent = parent.parentElement;
      }

      setIsInDrawer(foundDrawer);
      setIsInModal(foundModal);

      // Verificar si hay un drawer o modal abierto buscando el overlay o panel
      const drawerOverlay = Array.from(document.querySelectorAll('.fixed.inset-0')).find(
        el => {
          const zIndex = getComputedStyle(el).zIndex;
          return zIndex === '100' || zIndex === '9999' || zIndex === '10000' || 
                 el.classList.toString().includes('z-[100]') || 
                 el.classList.toString().includes('z-[9999]') ||
                 el.classList.toString().includes('z-[10000]');
        }
      );
      const drawerPanel = Array.from(document.querySelectorAll('.fixed.top-0.bottom-0, .fixed.inset-0')).find(
        el => {
          const zIndex = getComputedStyle(el).zIndex;
          return (zIndex === '100' || zIndex === '10000' || 
                  el.classList.toString().includes('z-[100]') || 
                  el.classList.toString().includes('z-[10000]')) &&
                 (el.classList.toString().includes('bg-white') || 
                  el.getAttribute('data-drawer') === 'table-drawer-modal');
        }
      );
      const isDrawerOpen = !!(drawerOverlay || drawerPanel);

      // Mostrar el botón siempre si estamos en un drawer/modal, o si no hay drawer/modal abierto
      setShouldShowButton((foundDrawer && isDrawerOpen) || (!foundDrawer && !isDrawerOpen));
    };

    // Verificar inmediatamente
    const timeout = setTimeout(checkContext, 0);

    // Verificar periódicamente para detectar cambios (menos frecuente)
    const interval = setInterval(checkContext, 300);

    // También escuchar cambios en el DOM
    const observer = new MutationObserver(() => {
      setTimeout(checkContext, 50);
    });
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Obtener el texto del código para copiar
  const getCodeText = () => {
    if (contentRef.current) {
      return contentRef.current.textContent || '';
    }
    return node.textContent || '';
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const codeText = getCodeText();
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleFullscreen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFullscreenContent(getCodeText());
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Cerrar fullscreen con Escape
  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen]);

  const handleFormat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editor || language !== 'json') return;

    let currentText = getCodeText();
    if (!currentText || !currentText.trim()) return;

    // Limpiar el texto: eliminar espacios al inicio y final
    currentText = currentText.trim();

    // Función para limpiar y convertir JSON con comillas simples
    const cleanAndConvertJSON = (text) => {
      let result = text;
      
      // Paso 1: Reemplazar valores de Python a JSON
      // None -> null (Python)
      result = result.replace(/\bNone\b/g, 'null');
      // True -> true (Python)
      result = result.replace(/\bTrue\b/g, 'true');
      // False -> false (Python)
      result = result.replace(/\bFalse\b/g, 'false');
      
      // Paso 2: Reemplazar valores JavaScript no válidos en JSON
      // NaN -> null
      result = result.replace(/\bNaN\b/g, 'null');
      // undefined -> null
      result = result.replace(/\bundefined\b/g, 'null');
      // Asegurar que null esté en minúsculas (por si acaso)
      result = result.replace(/\bNull\b/g, 'null');
      
      // Paso 3: Convertir comillas simples a dobles
      result = result.replace(/'/g, '"');
      
      return result;
    };

    // Función para formatear JSON
    let formatted;
    try {
      // Primero intentar parsear directamente
      const parsed = JSON.parse(currentText);
      formatted = JSON.stringify(parsed, null, 2);
    } catch (error) {
      // Si falla, intentar limpiar y convertir
      try {
        const cleanedText = cleanAndConvertJSON(currentText);
        console.log('Texto original:', currentText);
        console.log('Texto limpiado:', cleanedText);
        const parsed = JSON.parse(cleanedText);
        formatted = JSON.stringify(parsed, null, 2);
      } catch (secondError) {
        // Si aún falla, intentar usar eval (solo para objetos JavaScript válidos)
        try {
          // Limpiar el texto antes de usar eval
          const cleanedForEval = cleanAndConvertJSON(currentText);
          // Usar eval para convertir objetos JavaScript a JSON
          // Esto maneja casos como {key: value} sin comillas
          const evalResult = eval('(' + cleanedForEval + ')');
          formatted = JSON.stringify(evalResult, null, 2);
        } catch (thirdError) {
          // Si todo falla, mostrar un mensaje con más detalles
          console.error('Error al formatear JSON:', thirdError);
          console.error('Texto original:', currentText);
          const cleanedText = cleanAndConvertJSON(currentText);
          console.error('Texto después de limpiar:', cleanedText);
          alert('El contenido no es un JSON válido.\n\nError: ' + thirdError.message + '\n\nRevisa la consola para más detalles.');
          return;
        }
      }
    }

    // Si el formato no cambió, no hacer nada
    if (formatted === currentText || formatted === currentText.trim()) {
      return;
    }

    // Encontrar la posición del nodo en el editor
    const { state } = editor;
    const { doc } = state;
    
    // Buscar el nodo codeBlock actual
    let targetPos = null;
    doc.descendants((node, pos) => {
      if (node.type.name === 'codeBlock' && 
          node.attrs.language === 'json' &&
          node.textContent === currentText) {
        targetPos = pos;
        return false;
      }
    });

    if (targetPos !== null) {
      // Actualizar el contenido del nodo
      const tr = state.tr;
      const node = doc.nodeAt(targetPos);
      if (node) {
        const from = targetPos + 1;
        const to = from + node.content.size;
        tr.replaceWith(from, to, state.schema.text(formatted));
        tr.setMeta('jsonFormatter', true);
        editor.view.dispatch(tr);
        
        // Actualizar el contenido del modal si está abierto
        if (isFullscreen) {
          setTimeout(() => {
            setFullscreenContent(formatted);
          }, 100);
        }
      }
    }
  };

  // Actualizar referencia cuando el componente se monta
  useEffect(() => {
    // Buscar el elemento code dentro del NodeViewContent
    const findCodeElement = () => {
      if (contentRef.current) {
        const codeEl = contentRef.current.querySelector('code') || contentRef.current;
        if (codeEl && codeEl !== contentRef.current) {
          contentRef.current = codeEl;
        }
      }
    };
    
    // Intentar encontrar el elemento después de que se renderice
    const timeout = setTimeout(findCodeElement, 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <NodeViewWrapper 
      ref={wrapperRef}
      className="code-block-wrapper relative" 
      as="pre" 
      style={{ position: 'relative' }}
    >
      <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto relative" style={{ position: 'relative' }}>
        <NodeViewContent 
          ref={contentRef}
          as="code" 
          className={`language-${language}`}
          style={{ 
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            color: '#e5e7eb',
            background: 'transparent',
            padding: 0,
            margin: 0,
            outline: 'none',
            display: 'block',
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
          }}
        />
        {shouldShowButton && (
          <div className="absolute top-2 right-2 flex gap-2" style={{ 
            zIndex: isInModal ? 10002 : 110 // Mayor z-index cuando está en el Portal
          }}>
            {language === 'json' && (
              <>
                <button
                  onClick={handleFullscreen}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                  title="Pantalla completa"
                  type="button"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
                <button
                  onClick={handleFormat}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                  title="Formatear JSON"
                  type="button"
                >
                  <Code2 className="w-3 h-3" />
                  <span>Formatear</span>
                </button>
              </>
            )}
            <button
              onClick={handleCopy}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
              title="Copiar código"
              type="button"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      {isFullscreen && language === 'json' && createPortal(
        <div 
          className="fixed inset-0 z-[10001] bg-gray-900 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
            }
          }}
        >
          {/* Header con botones */}
          <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-white text-lg font-semibold">JSON - Pantalla Completa</h2>
            <div className="flex gap-2">
              <button
                onClick={handleFormat}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                title="Formatear JSON"
                type="button"
              >
                <Code2 className="w-4 h-4" />
                <span>Formatear</span>
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(fullscreenContent || getCodeText());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Error al copiar:', err);
                  }
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                title="Copiar código"
                type="button"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <button
                onClick={handleExitFullscreen}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                title="Salir de pantalla completa"
                type="button"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
          
          {/* Contenido del código */}
          <div className="flex-1 overflow-auto p-6">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-6 overflow-x-auto h-full">
              <code 
                ref={fullscreenRef}
                className={`language-${language}`}
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#e5e7eb',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  outline: 'none',
                  display: 'block',
                  whiteSpace: 'pre',
                  wordBreak: 'normal',
                  overflowWrap: 'normal',
                }}
              >
                {fullscreenContent || getCodeText()}
              </code>
            </pre>
          </div>
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
}

