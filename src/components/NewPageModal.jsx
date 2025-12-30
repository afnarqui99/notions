import { useState, useEffect, useRef } from 'react';
import { FileText, X, Plus, Smile } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

export default function NewPageModal({ isOpen, onClose, onCreate }) {
  const [titulo, setTitulo] = useState('');
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setMostrarEmojiPicker(false);
    }
  }, [isOpen]);

  // Cerrar emoji picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mostrarEmojiPicker &&
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
    setTitulo(prev => {
      // Si ya hay un emoji al inicio, reemplazarlo
      const trimmed = prev.trim();
      const firstChar = trimmed[0];
      if (firstChar && isEmoji(firstChar)) {
        return emoji + trimmed.substring(firstChar.length).trim();
      }
      // Si no hay emoji, agregarlo al inicio
      return emoji + (trimmed ? ' ' + trimmed : '');
    });
    setMostrarEmojiPicker(false);
  };

  // Función simple para detectar si un carácter es emoji
  const isEmoji = (char) => {
    const code = char.codePointAt(0);
    return (
      (code >= 0x1F300 && code <= 0x1F9FF) ||
      (code >= 0x2600 && code <= 0x26FF) ||
      (code >= 0x2700 && code <= 0x27BF) ||
      (code >= 0x1F600 && code <= 0x1F64F) ||
      (code >= 0x1F680 && code <= 0x1F6FF) ||
      (code >= 0x2190 && code <= 0x21FF) ||
      (code >= 0x2300 && code <= 0x23FF) ||
      (code >= 0x2B50 && code <= 0x2B55) ||
      code === 0x3030 || code === 0x3299 ||
      (code >= 0x1F900 && code <= 0x1F9FF)
    );
  };

  // Extraer emoji actual del título
  const obtenerEmojiActual = () => {
    const trimmed = titulo.trim();
    if (!trimmed) return '';
    const firstChar = trimmed[0];
    return isEmoji(firstChar) ? firstChar : '';
  };

  // Extraer emoji del título
  const extraerEmojiDelTitulo = (tituloTexto) => {
    const trimmed = tituloTexto.trim();
    if (!trimmed) return null;
    const firstChar = trimmed[0];
    return isEmoji(firstChar) ? firstChar : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (titulo.trim()) {
      const emojiExtraido = extraerEmojiDelTitulo(titulo.trim());
      onCreate(titulo.trim(), emojiExtraido);
      setTitulo('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Plus className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Nueva Página</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título de la nueva página
            </label>
            <div className="relative">
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe el título aquí..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setMostrarEmojiPicker(!mostrarEmojiPicker);
                }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Seleccionar emoji"
              >
                <Smile className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {mostrarEmojiPicker && (
              <div ref={emojiPickerRef} className="relative">
                <EmojiPicker
                  onSelect={handleEmojiSelect}
                  onClose={() => setMostrarEmojiPicker(false)}
                  currentEmoji={obtenerEmojiActual()}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl + Enter</kbd> para crear rápidamente
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!titulo.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Crear Página
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

