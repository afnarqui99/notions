import { useState } from 'react';
import { FileText, Download, X, FileDown, FileCode, FileType } from 'lucide-react';
import Modal from './Modal';
import ExportService from '../services/ExportService';

export default function ExportModal({ isOpen, onClose, pageTitle, pageContent, editor }) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  const handleExport = async (format) => {
    if (!pageContent || !editor) {
      return;
    }

    setExporting(true);
    setExportFormat(format);

    try {
      // Obtener el contenido actual del editor si está disponible
      const content = pageContent || editor.getJSON();
      const title = pageTitle || 'Página sin título';

      switch (format) {
        case 'pdf':
          await ExportService.exportToPDF(content, title);
          break;
        
        case 'markdown':
          const markdown = await ExportService.convertToMarkdown(content, title);
          ExportService.downloadTextFile(markdown, `${title}.md`, 'text/markdown');
          break;
        
        case 'html':
          const html = await ExportService.convertToHTML(content, title);
          ExportService.downloadTextFile(html, `${title}.html`, 'text/html');
          break;
        
        default:
          throw new Error('Formato no soportado');
      }

      // Cerrar el modal después de un breve delay
      setTimeout(() => {
        setExporting(false);
        setExportFormat(null);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert(`Error al exportar: ${error.message}`);
      setExporting(false);
      setExportFormat(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Página">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Selecciona el formato en el que deseas exportar esta página:
        </p>

        <div className="grid grid-cols-1 gap-4">
          {/* PDF */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all
              ${exporting && exportFormat === 'pdf'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
              ${exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <FileDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">PDF</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exporta como documento PDF listo para imprimir o compartir
              </p>
            </div>
            {exporting && exportFormat === 'pdf' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </button>

          {/* Markdown */}
          <button
            onClick={() => handleExport('markdown')}
            disabled={exporting}
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all
              ${exporting && exportFormat === 'markdown'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
              ${exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <FileType className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Markdown</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exporta como archivo .md compatible con la mayoría de editores
              </p>
            </div>
            {exporting && exportFormat === 'markdown' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </button>

          {/* HTML */}
          <button
            onClick={() => handleExport('html')}
            disabled={exporting}
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all
              ${exporting && exportFormat === 'html'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
              ${exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <FileCode className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">HTML</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exporta como página web HTML con estilos incluidos
              </p>
            </div>
            {exporting && exportFormat === 'html' && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}







