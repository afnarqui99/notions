import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Calendar, Table, X, Command, Database } from 'lucide-react';
import searchIndexService from '../services/SearchIndexService';
import SQLFileService from '../services/SQLFileService';

export default function GlobalSearch({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterType, setFilterType] = useState('all'); // 'all', 'page', 'event', 'table'
  const [pageSQLCounts, setPageSQLCounts] = useState({}); // { pageId: count }
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Enfocar input cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setQuery('');
      setSelectedIndex(0);
      setFilterType('all');
      // Indexar si es necesario
      searchIndexService.indexAll();
    }
  }, [isOpen]);

  // Buscar cuando cambia la query
  useEffect(() => {
    if (!isOpen) return;
    
    const performSearch = async () => {
      if (query.trim() === '') {
        setResults([]);
        setPageSQLCounts({});
        return;
      }
      
      const searchResults = await searchIndexService.search(query, { type: filterType });
      setResults(searchResults);
      setSelectedIndex(0);
      
      // Verificar scripts SQL para páginas encontradas
      const pageResults = searchResults.filter(r => r.type === 'page');
      if (pageResults.length > 0) {
        const counts = {};
        await Promise.all(
          pageResults.map(async (page) => {
            try {
              const result = await SQLFileService.getFilesByPage(page.id);
              counts[page.id] = result.files?.length || 0;
            } catch (error) {
              counts[page.id] = 0;
            }
          })
        );
        setPageSQLCounts(counts);
      } else {
        setPageSQLCounts({});
      }
    };
    
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [query, filterType, isOpen]);

  // Manejar teclas
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  // Manejar selección de resultado
  const handleSelectResult = (result) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    onClose();
  };

  // Manejar clic en scripts SQL de una página
  const handleViewSQLScripts = async (e, pageId) => {
    e.stopPropagation();
    // Disparar evento para abrir el modal de scripts SQL de esa página
    window.dispatchEvent(new CustomEvent('open-page-sql-scripts', { detail: { pageId } }));
    onClose();
  };

  // Obtener icono según tipo
  const getIcon = (type) => {
    switch (type) {
      case 'page':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'table':
        return <Table className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Resaltar texto en resultados
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);
    
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);
    
    return (
      <>
        {before}
        <mark className="bg-yellow-200 dark:bg-yellow-800">{match}</mark>
        {after}
      </>
    );
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar en páginas, eventos y tablas..."
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
            <span>para cerrar</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filterType === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todo
          </button>
          <button
            onClick={() => setFilterType('page')}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
              filterType === 'page'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <FileText className="w-3 h-3" />
            Páginas
          </button>
          <button
            onClick={() => setFilterType('event')}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
              filterType === 'event'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Eventos
          </button>
          <button
            onClick={() => setFilterType('table')}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${
              filterType === 'table'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Table className="w-3 h-3" />
            Tablas
          </button>
        </div>

        {/* Resultados */}
        <div 
          ref={resultsRef}
          className="max-h-96 overflow-y-auto"
        >
          {results.length === 0 && query.trim() !== '' ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron resultados</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="mb-1">Busca en todas tus páginas, eventos y tablas</p>
              <p className="text-xs">Escribe para comenzar a buscar</p>
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors flex items-start gap-3 ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className={`mt-0.5 ${index === selectedIndex ? 'text-blue-500' : 'text-gray-400'}`}>
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {result.emoji && (
                        <span className="text-lg">{result.emoji}</span>
                      )}
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {highlightText(result.title, query)}
                      </h3>
                      <span className="text-xs text-gray-400 uppercase">
                        {result.type === 'page' ? 'Página' : result.type === 'event' ? 'Evento' : 'Tabla'}
                      </span>
                      {result.type === 'page' && pageSQLCounts[result.id] > 0 && (
                        <button
                          onClick={(e) => handleViewSQLScripts(e, result.id)}
                          className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          title={`Ver ${pageSQLCounts[result.id]} script${pageSQLCounts[result.id] !== 1 ? 's' : ''} SQL asociado${pageSQLCounts[result.id] !== 1 ? 's' : ''}`}
                        >
                          <Database className="w-3 h-3" />
                          <span>{pageSQLCounts[result.id]} SQL</span>
                        </button>
                      )}
                    </div>
                    {result.text && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {highlightText(result.text.substring(0, 100), query)}
                      </p>
                    )}
                    {result.date && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(result.date)}
                      </p>
                    )}
                    {result.pageTitle && result.type === 'table' && (
                      <p className="text-xs text-gray-400 mt-1">
                        En: {result.pageTitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex items-center justify-between">
            <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
                <span>Navegar</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                <span>Abrir</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

