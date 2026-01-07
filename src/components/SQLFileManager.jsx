import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, FileText, Clock, GitBranch, X, Save, Trash2, Eye, Filter } from 'lucide-react';
import SQLFileService from '../services/SQLFileService';
import SQLVersionService from '../services/SQLVersionService';

export default function SQLFileManager({ isOpen, onClose, onSelectFile, onNewFile }) {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedPageFilter, setSelectedPageFilter] = useState('');
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    if (isOpen) {
      loadFiles(true);
      loadPages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadFiles(true);
    }
  }, [selectedPageFilter]);

  useEffect(() => {
    // Búsqueda optimizada usando el servicio
    const performSearch = async () => {
      if (searchQuery || selectedPageFilter) {
        setLoading(true);
        try {
          const result = await SQLFileService.searchFiles(searchQuery, {
            limit: pageSize,
            offset: 0,
            pageId: selectedPageFilter || null
          });
          setFilteredFiles(result.files || []);
          setTotal(result.total || 0);
          setHasMore(result.hasMore || false);
          setFiles(result.files || []);
        } catch (error) {
          console.error('Error en búsqueda:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Si no hay búsqueda, cargar página inicial
        loadFiles(true);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce de 300ms
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedPageFilter]);

  const loadPages = async () => {
    try {
      const allPages = await SQLFileService.getAllPages();
      setPages(allPages);
    } catch (error) {
      console.error('Error cargando páginas:', error);
    }
  };

  const loadFiles = async (reset = false) => {
    if (reset) {
      setCurrentPage(0);
      setFiles([]);
    }
    
    setLoading(true);
    try {
      const offset = reset ? 0 : currentPage * pageSize;
      const result = await SQLFileService.getFilesPaginated({
        limit: pageSize,
        offset,
        pageId: selectedPageFilter || null
      });
      
      if (reset) {
        setFiles(result.files || []);
      } else {
        setFiles(prev => [...prev, ...(result.files || [])]);
      }
      
      setTotal(result.total || 0);
      setHasMore(result.hasMore || false);
      setFilteredFiles(result.files || []);
    } catch (error) {
      console.error('Error cargando archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      loadFiles(false);
    }
  }, [loading, hasMore, currentPage]);

  const handleSelectFile = async (file) => {
    if (onSelectFile) {
      onSelectFile(file);
    }
    onClose();
  };

  const handleViewVersions = async (file) => {
    setSelectedFile(file);
    try {
      const vers = await SQLVersionService.getVersions(file.id);
      setVersions(vers);
      setShowVersions(true);
    } catch (error) {
      console.error('Error cargando versiones:', error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await SQLFileService.deleteFile(fileId);
      await loadFiles();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
    }
  };

  const handleNewFile = () => {
    if (onNewFile) {
      onNewFile();
    }
    onClose();
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Gestor de Scripts SQL
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewFile}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo Script
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Búsqueda y Filtros */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar scripts SQL por nombre, descripción o página..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedPageFilter}
                onChange={(e) => setSelectedPageFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Todas las páginas</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.emoji ? `${page.emoji} ` : ''}{page.titulo}
                  </option>
                ))}
              </select>
              {selectedPageFilter && (
                <button
                  onClick={() => setSelectedPageFilter('')}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Lista de archivos */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {searchQuery ? 'No se encontraron archivos' : 'No hay scripts SQL guardados'}
                </p>
                <p className="text-sm">
                  {searchQuery ? 'Intenta con otra búsqueda' : 'Crea tu primer script SQL usando /sql'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </h3>
                          {file.pageName && (
                            <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex-shrink-0">
                              <FileText className="w-3 h-3" />
                              {file.pageName}
                            </span>
                          )}
                        </div>
                        {file.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleViewVersions(file)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Ver versiones"
                        >
                          <GitBranch className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(file.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {file.lastVersion && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>v{file.lastVersion.version || 'Sin versión'}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        <span>{file.versionCount || 0} versión{file.versionCount !== 1 ? 'es' : ''}</span>
                      </div>
                      {file.lastVersion && (
                        <span>
                          {SQLVersionService.formatDate(file.lastVersion.timestamp)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectFile(file)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Abrir
                      </button>
                    </div>
                  </div>
                ))}
                {hasMore && !loading && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={loadMore}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Cargar más ({total - filteredFiles.length} restantes)
                    </button>
                  </div>
                )}
                {loading && filteredFiles.length > 0 && (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer con estadísticas */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {filteredFiles.length} archivo{filteredFiles.length !== 1 ? 's' : ''} mostrado{filteredFiles.length !== 1 ? 's' : ''}
              </span>
              <span>
                Total: {total} script{total !== 1 ? 's' : ''} SQL
                {hasMore && ` (${total - filteredFiles.length} más disponibles)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de versiones */}
      {showVersions && selectedFile && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Versiones de: {selectedFile.name}
              </h3>
              <button
                onClick={() => {
                  setShowVersions(false);
                  setSelectedFile(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {versions.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No hay versiones guardadas para este archivo
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                        <button
                          onClick={() => {
                            if (onSelectFile) {
                              onSelectFile({
                                ...selectedFile,
                                content: version.content,
                                version: version.version,
                              });
                            }
                            setShowVersions(false);
                            setSelectedFile(null);
                            onClose();
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Restaurar
                        </button>
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ¿Eliminar script SQL?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Esta acción eliminará el archivo y todas sus versiones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteFile(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

