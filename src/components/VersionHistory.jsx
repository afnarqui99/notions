import { useState, useEffect } from 'react';
import { Clock, RotateCcw, Eye, X, GitCompare } from 'lucide-react';
import Modal from './Modal';
import VersionService from '../services/VersionService';

export default function VersionHistory({ isOpen, onClose, pageId, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [comparingVersions, setComparingVersions] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && pageId) {
      loadVersions();
    } else {
      setVersions([]);
      setSelectedVersion(null);
      setComparingVersions(null);
    }
  }, [isOpen, pageId]);

  const loadVersions = async () => {
    if (!pageId) return;
    
    setLoading(true);
    try {
      const loadedVersions = await VersionService.getVersions(pageId);
      setVersions(loadedVersions);
    } catch (error) {
      console.error('Error cargando versiones:', error);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version) => {
    if (!pageId || !version) return;

    if (!confirm(`¿Estás seguro de que quieres restaurar esta versión del ${VersionService.formatDate(version.timestamp)}? Se creará un snapshot de la versión actual antes de restaurar.`)) {
      return;
    }

    setRestoring(true);
    try {
      await VersionService.restoreVersion(pageId, version.id);
      
      if (onRestore) {
        onRestore();
      }
      
      // Recargar versiones
      await loadVersions();
      
      alert('Versión restaurada correctamente');
      onClose();
    } catch (error) {
      console.error('Error restaurando versión:', error);
      alert(`Error al restaurar versión: ${error.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const handleCompare = (version1, version2) => {
    if (!version1 || !version2) return;
    
    const comparison = VersionService.compareVersions(version1, version2);
    setComparingVersions({ version1, version2, comparison });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historial de Versiones">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay versiones guardadas para esta página</p>
            <p className="text-sm mt-2">Las versiones se crean automáticamente al guardar cambios importantes</p>
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${selectedVersion?.id === version.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {VersionService.formatDate(version.timestamp)}
                        </span>
                        {index === 0 && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                            Actual
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        <div>
                          <span className="font-medium">Título:</span> {version.title || 'Sin título'}
                        </div>
                        {version.metadata && (
                          <div className="flex gap-4">
                            <span>
                              <span className="font-medium">Bloques:</span> {version.metadata.blockCount || 0}
                            </span>
                            <span>
                              <span className="font-medium">Tamaño:</span> {((version.metadata.contentLength || 0) / 1024).toFixed(2)} KB
                            </span>
                          </div>
                        )}
                        {version.tags && version.tags.length > 0 && (
                          <div>
                            <span className="font-medium">Tags:</span> {version.tags.length}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {index > 0 && (
                        <>
                          <button
                            onClick={() => handleCompare(versions[0], version)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Comparar con versión actual"
                          >
                            <GitCompare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(version)}
                            disabled={restoring}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                            title="Restaurar esta versión"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparación de versiones */}
            {comparingVersions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Comparación</h3>
                  <button
                    onClick={() => setComparingVersions(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Título:</span>
                    <span className={comparingVersions.comparison.titleChanged ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}>
                      {comparingVersions.comparison.titleChanged ? 'Cambió' : 'Sin cambios'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Contenido:</span>
                    <span className={comparingVersions.comparison.contentChanged ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}>
                      {comparingVersions.comparison.contentChanged ? 'Cambió' : 'Sin cambios'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tags:</span>
                    <span className={comparingVersions.comparison.tagsChanged ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}>
                      {comparingVersions.comparison.tagsChanged ? 'Cambió' : 'Sin cambios'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Emoji:</span>
                    <span className={comparingVersions.comparison.emojiChanged ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}>
                      {comparingVersions.comparison.emojiChanged ? 'Cambió' : 'Sin cambios'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}






