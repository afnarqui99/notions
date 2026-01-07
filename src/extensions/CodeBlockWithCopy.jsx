import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import lowlight from './lowlightInstance';

export default function CodeBlockWithCopy({ node, updateAttributes }) {
  const [copied, setCopied] = useState(false);
  const language = node.attrs.language || '';
  const code = node.textContent;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Generar HTML resaltado
  let highlightedHTML = '';
  try {
    if (language && lowlight.registered(language)) {
      const result = lowlight.highlight(language, code);
      highlightedHTML = result.value;
    } else {
      // Si no hay lenguaje o no está registrado, usar texto plano
      highlightedHTML = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  } catch (error) {
    // En caso de error, usar texto plano
    highlightedHTML = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return (
    <NodeViewWrapper className="code-block-wrapper">
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto relative">
        <code
          className={`language-${language}`}
          dangerouslySetInnerHTML={{ __html: highlightedHTML }}
        />
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs z-10"
          title="Copiar código"
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
      </pre>
    </NodeViewWrapper>
  );
}

