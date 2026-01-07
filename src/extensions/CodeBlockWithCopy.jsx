import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CodeBlockWithCopy({ node, updateAttributes, editor }) {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || '';
  const contentRef = useRef(null);

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
    <NodeViewWrapper className="code-block-wrapper relative" as="pre">
      <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto relative">
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
        <button
          onClick={handleCopy}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs z-40"
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
    </NodeViewWrapper>
  );
}

