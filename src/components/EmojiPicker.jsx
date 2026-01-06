import { useState, useEffect } from 'react';
import { Smile, X } from 'lucide-react';

// Emojis organizados por categorías
const EMOJI_CATEGORIES = {
  'Frecuentes': ['📊', '📝', '🎯', '✅', '📅', '📁', '🔐', '🚀', '📧', '💡', '⭐', '🔥', '🌐', '💻', '📱'],
  'Dashboard y Analytics': ['📊', '📈', '📉', '📋', '🗂️', '📑', '📌', '📍', '📊', '📉'],
  'Tareas y Proyectos': ['✅', '🎯', '📝', '📋', '🗒️', '📄', '📃', '📑', '📊', '📈', '☑️', '⏰', '📌'],
  'Comunicación': ['📧', '💬', '📞', '📱', '📲', '💌', '📮', '✉️', '📨', '📬'],
  'Web y Navegación': ['🌐', '🔗', '🌍', '🌎', '🌏', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📡', '📶', '📺'],
  'Seguridad': ['🔐', '🔒', '🔑', '🛡️', '🔓', '🗝️', '👤', '🔒', '🛡️', '🔐'],
  'Desarrollo': ['💻', '⚙️', '🔧', '🛠️', '📦', '🚀', '⚡', '🔌', '💾', '💿', '📀', '🖥️', '⌨️'],
  'Organización': ['📁', '📂', '🗂️', '📊', '📋', '🗓️', '📅', '📆', '📌', '📍', '🗃️'],
  'Documentos': ['📄', '📝', '📃', '📑', '📊', '📈', '📉', '📋', '📕', '📗', '📘', '📙', '📓', '📔'],
  'Emociones': ['😀', '😊', '😎', '🤔', '😴', '🤯', '🎉', '👍', '👎', '❤️', '💚', '💙', '💛', '🧡', '💜'],
  'Símbolos': ['⭐', '🔥', '💡', '✨', '🌟', '💫', '⚡', '🎯', '🏆', '🎖️', '🏅', '🎗️'],
  'Tecnología': ['🌐', '💻', '📱', '⌚', '📷', '📹', '🎥', '📺', '📻', '🔊', '🎧', '🎮', '🕹️'],
};

const ALL_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

export default function EmojiPicker({ onSelect, onClose, currentEmoji = '' }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Frecuentes');
  const [busqueda, setBusqueda] = useState('');

  const categorias = Object.keys(EMOJI_CATEGORIES);

  // Inyectar estilos de scrollbar una sola vez
  useEffect(() => {
    if (typeof document !== 'undefined' && !document.getElementById('emoji-picker-styles')) {
      const style = document.createElement('style');
      style.id = 'emoji-picker-styles';
      style.textContent = `
        .emoji-categories-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .emoji-categories-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .emoji-categories-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .emoji-categories-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .emoji-categories-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .emoji-grid-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .emoji-grid-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .emoji-grid-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }
        .emoji-grid-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 5px;
        }
        .emoji-grid-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Filtrar emojis según búsqueda
  const emojisFiltrados = busqueda
    ? ALL_EMOJIS.filter(emoji => emoji.includes(busqueda))
    : EMOJI_CATEGORIES[categoriaSeleccionada] || [];

  const handleEmojiClick = (emoji) => {
    onSelect(emoji);
    onClose();
  };

  return (
    <div className="absolute z-50 mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl w-[420px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5" />
          <span className="text-base font-semibold">Seleccionar Emoji</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Búsqueda */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar emoji..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          autoFocus
        />
      </div>

      {/* Categorías (solo si no hay búsqueda) */}
      {!busqueda && (
        <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="emoji-categories-scroll flex gap-2 overflow-x-auto pb-1">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
                  categoriaSeleccionada === cat
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de emojis */}
      <div className="emoji-grid-scroll p-4 max-h-[400px] overflow-y-auto">
        {emojisFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No se encontraron emojis
          </div>
        ) : (
          <div className="grid grid-cols-10 gap-2.5">
            {emojisFiltrados.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiClick(emoji)}
                className={`w-12 h-12 flex items-center justify-center text-2xl rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110 ${
                  currentEmoji === emoji ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 scale-105' : ''
                }`}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer con hint */}
      <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: También puedes usar Windows + . para abrir el selector de emojis del sistema
      </div>
    </div>
  );
}
