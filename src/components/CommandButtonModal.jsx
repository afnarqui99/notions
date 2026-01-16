import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import commandUsageService from '../services/CommandUsageService';

export default function CommandButtonModal({ 
  isOpen, 
  onClose, 
  items, 
  onSelectCommand
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Filtrar y ordenar comandos
  useEffect(() => {
    const loadAndSort = async () => {
      if (!items || items.length === 0) {
        setFilteredItems([]);
        setAllItems([]);
        return;
      }

      // Ordenar todos los items por uso o orden personalizado
      const sortedAll = await commandUsageService.sortCommandsByUsage(items);
      setAllItems(sortedAll);

      let filtered = sortedAll;

      // Filtrar por término de búsqueda
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(item => {
          const labelMatch = item.label?.toLowerCase().includes(term);
          const descMatch = item.description?.toLowerCase().includes(term);
          const keywordsMatch = item.keywords?.some(k => k.toLowerCase().includes(term));
          return labelMatch || descMatch || keywordsMatch;
        });
      }

      setFilteredItems(filtered);
      setSelectedIndex(0);
    };

    loadAndSort();
  }, [items, searchTerm]);

  // Enfocar el input cuando se abre el modal
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Manejar teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelectCommand(filteredItems[selectedIndex]);
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  // Scroll al elemento seleccionado
  useEffect(() => {
    if (modalRef.current) {
      const selectedElement = modalRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleSelectCommand = async (item) => {
    // Prevenir doble ejecución
    if (item._executing) {
      return;
    }
    
    item._executing = true;
    
    try {
      // Cerrar el modal PRIMERO
      onClose();
      
      // Pequeño delay
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Registrar el uso
      await commandUsageService.recordUsage(item.label);
      
      // Ejecutar el comando
      onSelectCommand(item);
    } catch (error) {
      console.error('[CommandButtonModal] Error ejecutando comando:', error);
    } finally {
      setTimeout(() => {
        delete item._executing;
      }, 500);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[80000] flex items-start justify-center pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Insertar comando
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar comandos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No se encontraron comandos
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={index}
                    data-index={index}
                    onClick={() => handleSelectCommand(item)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0 mt-0.5">
                      {item.icon || '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base">
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


