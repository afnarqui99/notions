import { useState, useEffect } from 'react';
import { FileText, X, Plus } from 'lucide-react';

export default function NewPageModal({ isOpen, onClose, onCreate }) {
  const [titulo, setTitulo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (titulo.trim()) {
      onCreate(titulo.trim());
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
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
              Título de la nueva página
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe el título aquí..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              autoFocus
            />
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

