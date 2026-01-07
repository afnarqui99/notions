import { useState, useEffect, useCallback } from 'react';
import { Search, X, FileText, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import PageIndexService from '../services/PageIndexService';

export default function PageSelectorModal({ isOpen, onClose, onSelectPage, currentPageId = null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedPages, setExpandedPages] = useState(new Set());
  const [subPages, setSubPages] = useState({}); // { pageId: [subpages] }
  const [loadingSubPages, setLoadingSubPages] = useState(new Set());
  const pageSize = 50;

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setCurrentPage(0);
      setPages([]);
      setExpandedPages(new Set());
      setSubPages({});
      loadPages(0, true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(0);
        setPages([]);
        loadPages(0, true);
      }, 300); // Debounce de 300ms
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, isOpen]);

  useEffect(() => {
    if (isOpen && currentPage > 0) {
      loadPages(currentPage, false);
    }
  }, [currentPage, isOpen]);

  const loadPages = async (page = 0, reset = false) => {
    setLoading(true);
    try {
      const offset = page * pageSize;
      const result = await PageIndexService.searchPages(searchQuery, {
        limit: pageSize,
        offset,
        sortBy: 'actualizadoEn',
        parentId: null // Solo páginas principales (sin padre)
      });

      if (reset) {
        setPages(result.pages || []);
      } else {
        setPages(prev => [...prev, ...(result.pages || [])]);
      }

      setTotal(result.total || 0);
      setHasMore(result.hasMore || false);
    } catch (error) {
      console.error('Error cargando páginas:', error);
      if (reset) {
        setPages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  const handleSelectPage = (page) => {
    if (onSelectPage) {
      onSelectPage(page);
    }
    onClose();
  };

  const toggleExpand = async (pageId) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      // Colapsar
      newExpanded.delete(pageId);
      setExpandedPages(newExpanded);
    } else {
      // Expandir - primero cargar subpáginas si no están cargadas
      if (subPages[pageId] === undefined) {
        await loadSubPages(pageId);
      }
      // Luego actualizar el estado de expansión
      newExpanded.add(pageId);
      setExpandedPages(newExpanded);
    }
  };

  const loadSubPages = async (parentId) => {
    setLoadingSubPages(prev => new Set(prev).add(parentId));
    try {
      const result = await PageIndexService.getPagesPaginated({
        limit: 1000,
        offset: 0,
        parentId: parentId,
        sortBy: 'titulo'
      });
      setSubPages(prev => ({
        ...prev,
        [parentId]: result.pages || []
      }));
    } catch (error) {
      console.error('Error cargando subpáginas:', error);
      setSubPages(prev => ({
        ...prev,
        [parentId]: []
      }));
    } finally {
      setLoadingSubPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentId);
        return newSet;
      });
    }
  };

  // Verificar si una página tiene subpáginas (usando el índice)
  const checkHasSubPages = async (pageId) => {
    try {
      const result = await PageIndexService.getPagesPaginated({
        limit: 1,
        offset: 0,
        parentId: pageId
      });
      return result.total > 0;
    } catch (error) {
      return false;
    }
  };

  // Precargar información de subpáginas para páginas visibles (solo si no hay búsqueda)
  useEffect(() => {
    if (pages.length > 0 && isOpen && !searchQuery) {
      // Usar setTimeout para evitar actualizaciones de estado durante el renderizado
      const timeoutId = setTimeout(() => {
        const checkSubPages = async () => {
          await Promise.all(
            pages.map(async (page) => {
              // Solo verificar si no tenemos información previa
              if (subPages[page.id] === undefined) {
                const hasSubs = await checkHasSubPages(page.id);
                if (hasSubs) {
                  // Precargar subpáginas para páginas que tienen
                  await loadSubPages(page.id);
                } else {
                  // Marcar que no tiene subpáginas (usar función de actualización para evitar problemas)
                  setSubPages(prev => {
                    // Solo actualizar si realmente no existe
                    if (prev[page.id] === undefined) {
                      return {
                        ...prev,
                        [page.id]: []
                      };
                    }
                    return prev;
                  });
                }
              }
            })
          );
        };
        checkSubPages();
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, isOpen, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Seleccionar Página
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Asocia este script SQL a una página
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

        {/* Búsqueda */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar página por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de páginas */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && pages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {searchQuery ? 'No se encontraron páginas' : 'No hay páginas disponibles'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Intenta con otra búsqueda' : 'Crea una página primero'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {/* Opción para no asociar */}
                <button
                  onClick={() => handleSelectPage(null)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    currentPageId === null
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          Sin asociar a página
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Este script no estará asociado a ninguna página
                        </p>
                      </div>
                    </div>
                    {currentPageId === null && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>

                {/* Lista de páginas */}
                {pages.map((page) => {
                  const isExpanded = expandedPages.has(page.id);
                  const pageSubPages = subPages[page.id];
                  const isLoadingSubs = loadingSubPages.has(page.id);
                  // hasSubs es true si:
                  // 1. Ya tenemos subpáginas cargadas y hay al menos una
                  // 2. O si aún no hemos verificado (undefined) - asumimos que puede tener
                  // Es false solo si explícitamente sabemos que no hay subpáginas (array vacío)
                  const hasSubs = pageSubPages === undefined || pageSubPages.length > 0;
                  
                  return (
                    <div key={page.id} className="space-y-1">
                      <div className="flex items-stretch gap-1">
                        {/* Botón para expandir/colapsar si tiene subpáginas */}
                        {hasSubs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('Click en expandir para:', page.id, 'hasSubs:', hasSubs, 'pageSubPages:', pageSubPages);
                              toggleExpand(page.id);
                            }}
                            className="px-2 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            title={isExpanded ? "Colapsar subpáginas" : "Expandir subpáginas"}
                          >
                            {isLoadingSubs ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                        {!hasSubs && <div className="w-9"></div>}
                        
                        {/* Botón de selección de página */}
                        <button
                          onClick={() => handleSelectPage(page)}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all text-left ${
                            currentPageId === page.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                                {hasSubs ? (
                                  isExpanded ? (
                                    <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <Folder className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                  )
                                ) : page.emoji ? (
                                  page.emoji
                                ) : (
                                  <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {page.titulo || 'Sin título'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {pageSubPages && pageSubPages.length > 0 && (
                                    <span className="mr-2">{pageSubPages.length} subpágina{pageSubPages.length !== 1 ? 's' : ''}</span>
                                  )}
                                  {page.actualizadoEn 
                                    ? new Date(page.actualizadoEn).toLocaleDateString('es-ES')
                                    : 'Sin fecha'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {currentPageId === page.id && (
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                              )}
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </button>
                      </div>
                      
                      {/* Subpáginas expandidas */}
                      {isExpanded && pageSubPages && pageSubPages.length > 0 && (
                        <div className="ml-11 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                          {pageSubPages.map((subPage) => (
                            <button
                              key={subPage.id}
                              onClick={() => handleSelectPage(subPage)}
                              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                currentPageId === subPage.id
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                                    {subPage.emoji || <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {subPage.titulo || 'Sin título'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {subPage.actualizadoEn 
                                        ? new Date(subPage.actualizadoEn).toLocaleDateString('es-ES')
                                        : 'Sin fecha'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {currentPageId === subPage.id && (
                                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    </div>
                                  )}
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botón cargar más */}
              {hasMore && !loading && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMore}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cargar más ({total - pages.length} restantes)
                  </button>
                </div>
              )}

              {loading && pages.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              {pages.length} página{pages.length !== 1 ? 's' : ''} mostrada{pages.length !== 1 ? 's' : ''}
            </span>
            <span>
              Total: {total} página{total !== 1 ? 's' : ''}
              {hasMore && ` (${total - pages.length} más disponibles)`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

