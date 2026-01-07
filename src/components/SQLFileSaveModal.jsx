import { useState, useEffect } from 'react';
import { Save, X, FileText, File } from 'lucide-react';
import SQLFileService from '../services/SQLFileService';
import PageSelectorModal from './PageSelectorModal';

export default function SQLFileSaveModal({ isOpen, onClose, onSave, initialName = '', initialDescription = '', initialPageId = null }) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [version, setVersion] = useState('');
  const [selectedPageId, setSelectedPageId] = useState(initialPageId || '');
  const [selectedPageName, setSelectedPageName] = useState('');
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setVersion('');
      setSelectedPageId(initialPageId || '');
      // Cargar nombre de página si hay pageId
      if (initialPageId) {
        loadPageName(initialPageId);
      } else {
        setSelectedPageName('');
      }
    }
  }, [isOpen, initialName, initialDescription, initialPageId]);

  const loadPageName = async (pageId) => {
    try {
      const PageIndexService = (await import('../services/PageIndexService')).default;
      const result = await PageIndexService.searchPages('', { limit: 10000 });
      const page = result.pages.find(p => p.id === pageId);
      if (page) {
        setSelectedPageName(page.titulo || 'Sin título');
      }
    } catch (error) {
      console.error('Error cargando nombre de página:', error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        version: version.trim() || null,
        pageId: selectedPageId || null,
        pageName: selectedPageName || null,
      });
      onClose();
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPage = (page) => {
    if (page) {
      setSelectedPageId(page.id);
      setSelectedPageName(page.titulo || 'Sin título');
    } else {
      setSelectedPageId('');
      setSelectedPageName('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Guardar Script SQL
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del archivo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: consulta_usuarios"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué hace este script..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Versión (opcional)
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Ej: 1.0, v2.1, release-2024"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <File className="w-4 h-4 inline mr-1" />
              Asociar a página (opcional)
            </label>
            <button
              type="button"
              onClick={() => setShowPageSelector(true)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-500 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                {selectedPageId ? (
                  <>
                    <span className="text-lg">{selectedPageName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(Página asociada)</span>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">Seleccionar página...</span>
                )}
              </span>
              <FileText className="w-4 h-4 text-gray-400" />
            </button>
            {selectedPageId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPageId('');
                  setSelectedPageName('');
                }}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Quitar asociación
              </button>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Asocia este script a una página para organizarlo mejor
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de selección de páginas */}
      <PageSelectorModal
        isOpen={showPageSelector}
        onClose={() => setShowPageSelector(false)}
        onSelectPage={handleSelectPage}
        currentPageId={selectedPageId}
      />
    </div>
  );
}

