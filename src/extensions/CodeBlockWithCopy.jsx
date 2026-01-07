import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlockWithCopy({ node, updateAttributes, editor }) {
  const [copied, setCopied] = useState(false);
  const [isInDrawer, setIsInDrawer] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(true);
  const language = node.attrs.language || '';
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);

  // Detectar si estamos dentro del drawer y si el drawer está abierto
  useEffect(() => {
    const checkContext = () => {
      if (!wrapperRef.current) return;

      // Verificar si el componente está dentro de un drawer
      // Buscar un elemento padre que tenga el atributo data-drawer
      let parent = wrapperRef.current.parentElement;
      let foundDrawer = false;
      
      while (parent && parent !== document.body) {
        // Verificar si tiene el atributo data-drawer (método más confiable)
        if (parent.getAttribute('data-drawer') === 'table-drawer') {
          foundDrawer = true;
          break;
        }
        
        // Fallback: verificar por clases y estilos
        const computedStyle = getComputedStyle(parent);
        const zIndex = computedStyle.zIndex;
        const position = computedStyle.position;
        
        if (position === 'fixed' && (zIndex === '100' || parent.classList.toString().includes('z-[100]'))) {
          if (parent.classList.toString().includes('bg-white') || 
              parent.classList.toString().includes('shadow-2xl')) {
            foundDrawer = true;
            break;
          }
        }
        parent = parent.parentElement;
      }

      setIsInDrawer(foundDrawer);

      // Verificar si hay un drawer abierto buscando el overlay o panel
      const drawerOverlay = Array.from(document.querySelectorAll('.fixed.inset-0')).find(
        el => getComputedStyle(el).zIndex === '100' || el.classList.toString().includes('z-[100]')
      );
      const drawerPanel = Array.from(document.querySelectorAll('.fixed.top-0.bottom-0')).find(
        el => (getComputedStyle(el).zIndex === '100' || el.classList.toString().includes('z-[100]')) &&
              el.classList.toString().includes('bg-white')
      );
      const isDrawerOpen = !!(drawerOverlay || drawerPanel);

      // Mostrar el botón solo si:
      // 1. Estamos en el drawer Y el drawer está abierto, O
      // 2. NO estamos en el drawer Y el drawer NO está abierto
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
          <button
            onClick={handleCopy}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs z-[110]"
            style={{ position: 'absolute' }}
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
        )}
      </div>
    </NodeViewWrapper>
  );
}

