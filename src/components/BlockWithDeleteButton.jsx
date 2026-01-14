import { useState } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * Componente wrapper que agrega un botón de papelera flotante en la esquina superior derecha
 * Similar al comportamiento de Notion, visible al hacer hover sobre el bloque
 */
export default function BlockWithDeleteButton({ children, editor, getPos, node, className = '', ...props }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    if (editor && typeof getPos === 'function') {
      try {
        const pos = getPos();
        if (pos !== undefined && pos !== null) {
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
        }
      } catch (error) {
        console.error('Error al eliminar bloque:', error);
        // Fallback: intentar eliminar usando el método alternativo
        try {
          const view = editor.view;
          if (view && typeof getPos === 'function') {
            const pos = getPos();
            if (pos !== undefined && pos !== null) {
              view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
            }
          }
        } catch (fallbackError) {
          console.error('Error en fallback al eliminar:', fallbackError);
        }
      }
    }
  };

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
      {/* Botón de papelera flotante - visible al hacer hover */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDelete();
        }}
        className={`absolute top-2 right-2 z-50 p-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        title="Eliminar bloque"
        aria-label="Eliminar bloque"
      >
        <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
      </button>
    </div>
  );
}

