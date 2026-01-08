import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

export default function CodeBlockWithCopy({ node, updateAttributes, editor }) {
  const [copied, setCopied] = useState(false);
  const [isInDrawer, setIsInDrawer] = useState(false);
  const [isInModal, setIsInModal] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(true);
  const language = node.attrs.language || '';
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);

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

  const handleFormat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editor || language !== 'json') return;

    let currentText = getCodeText();
    if (!currentText || !currentText.trim()) return;

    // Función para formatear JSON
    let formatted;
    try {
      // Primero intentar parsear directamente
      const parsed = JSON.parse(currentText);
      formatted = JSON.stringify(parsed, null, 2);
    } catch (error) {
      // Si falla, intentar convertir comillas simples a dobles
      try {
        // Reemplazar todas las comillas simples por dobles
        const convertedText = currentText.replace(/'/g, '"');
        const parsed = JSON.parse(convertedText);
        formatted = JSON.stringify(parsed, null, 2);
      } catch (secondError) {
        // Si aún falla, mostrar un mensaje
        alert('El contenido no es un JSON válido: ' + secondError.message);
        return;
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
    </NodeViewWrapper>
  );
}

