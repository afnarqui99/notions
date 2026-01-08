import { useState, useEffect } from 'react';
import { FileText, X, Save } from 'lucide-react';
import templateService from '../services/TemplateService';

export default function SaveTemplateModal({ isOpen, onClose, pageTitle, pageContent }) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateIcon, setTemplateIcon] = useState('📄');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTemplateName(pageTitle || '');
      setTemplateDescription('');
      setTemplateIcon('📄');
    }
  }, [isOpen, pageTitle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    setSaving(true);
    try {
      const template = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        icon: templateIcon,
        content: pageContent || { type: "doc", content: [{ type: "paragraph" }] }
      };

      await templateService.addTemplate(template);
      onClose();
      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setTemplateIcon('📄');
    } catch (error) {
      // Error al guardar
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Save className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Guardar como Plantilla</h3>
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
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la plantilla *
            </label>
            <input
              id="templateName"
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej: Notas de Reunión"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción (opcional)
            </label>
            <input
              id="templateDescription"
              type="text"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe para qué sirve esta plantilla"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="templateIcon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icono (emoji)
            </label>
            <input
              id="templateIcon"
              type="text"
              value={templateIcon}
              onChange={(e) => setTemplateIcon(e.target.value)}
              placeholder="📄"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-gray-700 dark:text-gray-100"
              maxLength={2}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!templateName.trim() || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Plantilla
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}











