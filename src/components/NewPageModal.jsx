import { useState, useEffect, useRef } from 'react';
import { FileText, X, Plus, Smile, LayoutTemplate } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import TagSelector from './TagSelector';
import TemplateSelector from './TemplateSelector';
import templateService from '../services/TemplateService';

export default function NewPageModal({ isOpen, onClose, onCreate }) {
  const [titulo, setTitulo] = useState('');
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setMostrarEmojiPicker(false);
      setSelectedTags([]);
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    if (template.name) {
      setTitulo(template.name);
    }
  };

  const handleCreateWithTemplate = () => {
    if (!titulo.trim()) return; // No crear si no hay título
    if (selectedTemplate) {
      onCreate(titulo.trim(), selectedTemplate.icon || null, selectedTags, selectedTemplate.content);
    } else {
      onCreate(titulo.trim(), null, selectedTags, null);
    }
  };

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
    const tituloLimpio = titulo.trim();
    // Validar que haya título después de quitar emojis
    if (!tituloLimpio) {
      return; // No crear si no hay título
    }
    
    // Verificar que después de extraer el emoji, quede texto
    const emojiExtraido = extraerEmojiDelTitulo(tituloLimpio);
    const tituloSinEmoji = tituloLimpio.substring(emojiExtraido ? emojiExtraido.length : 0).trim();
    
    // Si solo hay emoji sin texto, permitir crear con el emoji como título
    // Pero si no hay nada (ni emoji ni texto), no crear
    if (!emojiExtraido && !tituloSinEmoji) {
      return; // No crear si no hay contenido
    }
    
    if (selectedTemplate) {
      onCreate(tituloLimpio, emojiExtraido || selectedTemplate.icon || null, selectedTags, selectedTemplate.content);
    } else {
      onCreate(tituloLimpio, emojiExtraido, selectedTags, null);
    }
    setTitulo('');
    setSelectedTags([]);
    setSelectedTemplate(null);
    onClose();
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transition-colors"
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
        <form onSubmit={(e) => {
          e.preventDefault();
          if (titulo.trim()) {
            handleSubmit(e);
          }
        }} className="p-6 space-y-4">
          <div className="relative">
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título de la nueva página
            </label>
            <div className="relative">
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey) {
                    e.preventDefault(); // Prevenir submit con Enter solo
                  }
                  handleKeyDown(e);
                }}
                placeholder="Escribe el título aquí..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-gray-100">Ctrl + Enter</kbd> para crear rápidamente
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              allowCreate={true}
            />
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

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
}









