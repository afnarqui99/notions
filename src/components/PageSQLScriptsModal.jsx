import { useState, useEffect } from 'react';
import { X, FileText, Download, FileDown, Eye, GitBranch, Clock } from 'lucide-react';
import SQLFileService from '../services/SQLFileService';
import SQLVersionService from '../services/SQLVersionService';
import jsPDF from 'jspdf';

export default function PageSQLScriptsModal({ isOpen, onClose, pageId, pageName }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScript, setSelectedScript] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    if (isOpen && pageId) {
      loadScripts();
    }
  }, [isOpen, pageId]);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const result = await SQLFileService.getFilesByPage(pageId);
      setScripts(result.files || []);
    } catch (error) {
      console.error('Error cargando scripts:', error);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersions = async (script) => {
    setSelectedScript(script);
    try {
      const vers = await SQLVersionService.getVersions(script.id);
      setVersions(vers);
      setShowVersions(true);
    } catch (error) {
      console.error('Error cargando versiones:', error);
    }
  };

  const handleExportPDF = async (script) => {
    try {
      const fullScript = await SQLFileService.getFile(script.id);
      if (!fullScript) return;

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(script.name, 14, 20);
      
      if (script.description) {
        doc.setFontSize(12);
        doc.text(`Descripción: ${script.description}`, 14, 30);
      }

      if (script.version) {
        doc.setFontSize(10);
        doc.text(`Versión: ${script.version}`, 14, 40);
      }

      doc.setFontSize(10);
      doc.setFont('courier');
      const lines = fullScript.content.split('\n');
      let y = 50;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const maxWidth = doc.internal.pageSize.width - (margin * 2);

      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        doc.text(wrappedLines, margin, y);
        y += wrappedLines.length * 5;
      });

      doc.save(`${script.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF');
    }
  };

  const handleExportTXT = async (script) => {
    try {
      const fullScript = await SQLFileService.getFile(script.id);
      if (!fullScript) return;

      let content = `Script SQL: ${script.name}\n`;
      content += `========================================\n\n`;
      
      if (script.description) {
        content += `Descripción: ${script.description}\n\n`;
      }
      
      if (script.version) {
        content += `Versión: ${script.version}\n\n`;
      }
      
      if (script.pageName) {
        content += `Página asociada: ${script.pageName}\n\n`;
      }
      
      content += `Fecha de creación: ${script.createdAt || 'N/A'}\n`;
      content += `Última actualización: ${script.updatedAt || 'N/A'}\n\n`;
      content += `========================================\n\n`;
      content += fullScript.content;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${script.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando TXT:', error);
      alert('Error al exportar TXT');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Scripts SQL de la Página
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {pageName || 'Página sin nombre'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de scripts */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : scripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No hay scripts SQL asociados</p>
                <p className="text-sm">Crea scripts SQL y asígnalos a esta página</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {script.name}
                        </h3>
                        {script.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {script.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleViewVersions(script)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Ver versiones"
                        >
                          <GitBranch className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(script)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Exportar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportTXT(script)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Exportar TXT"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {script.version && (
                        <div className="flex items-center gap-1">
                          <span>v{script.version}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        <span>{script.versionCount || 0} versión{script.versionCount !== 1 ? 'es' : ''}</span>
                      </div>
                      {script.updatedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(script.updatedAt).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de versiones */}
      {showVersions && selectedScript && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Versiones de: {selectedScript.name}
              </h3>
              <button
                onClick={() => {
                  setShowVersions(false);
                  setSelectedScript(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {versions.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay versiones guardadas
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {version.version && (
                            <span className="text-sm font-semibold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                              v{version.version}
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {SQLVersionService.formatDate(version.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {version.metadata?.lineCount || 0} líneas, {version.metadata?.contentLength || 0} caracteres
                      </div>
                      <pre className="text-xs p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto max-h-32">
                        {version.content.substring(0, 300)}
                        {version.content.length > 300 && '...'}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

