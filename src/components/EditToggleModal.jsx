import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

export default function EditToggleModal({ 
  isOpen, 
  onClose, 
  currentTitulo = '', 
  currentIcono = '',
  onSave 
}) {
  const [titulo, setTitulo] = useState(currentTitulo);
  const [icono, setIcono] = useState(currentIcono);
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const tituloInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo(currentTitulo);
      setIcono(currentIcono);
      setMostrarEmojiPicker(false);
      // Enfocar el input después de un pequeño delay
      setTimeout(() => {
        tituloInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentTitulo, currentIcono]);

  // Cerrar emoji picker al hacer clic fuera
  useEffect(() => {
    if (!mostrarEmojiPicker) return;

    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setMostrarEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarEmojiPicker]);

  const handleEmojiSelect = (emoji) => {
    setIcono(emoji);
    setMostrarEmojiPicker(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        titulo: titulo.trim() || 'Bloque Desplegable',
        icono: icono.trim()
      });
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[50000] flex items-center justify-center p-4"
      style={{ zIndex: 50000 }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smile className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Editar Bloque Desplegable
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-4">
          <div>
            <label htmlFor="icono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icono (emoji)
            </label>
            <div className="relative">
              <input
                id="icono"
                type="text"
                value={icono}
                onChange={(e) => setIcono(e.target.value)}
                placeholder="📝"
                maxLength={2}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                onKeyDown={handleKeyDown}
              />
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (emojiButtonRef.current) {
                    const rect = emojiButtonRef.current.getBoundingClientRect();
                    setEmojiPickerPosition({
                      top: rect.bottom + window.scrollY + 5,
                      left: rect.left + window.scrollX
                    });
                  }
                  setMostrarEmojiPicker(!mostrarEmojiPicker);
                }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                title="Seleccionar emoji"
              >
                <Smile className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            {mostrarEmojiPicker && createPortal(
              <div 
                ref={emojiPickerRef}
                style={{
                  position: 'fixed',
                  zIndex: 50001,
                  top: `${emojiPickerPosition.top}px`,
                  left: `${emojiPickerPosition.left}px`,
                }}
              >
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setMostrarEmojiPicker(false)}
                  currentEmoji={icono}
                />
              </div>,
              document.body
            )}
          </div>

          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              ref={tituloInputRef}
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del bloque"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              required
              autoFocus
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

