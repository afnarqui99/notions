import { useState, useEffect, useRef } from 'react';
import { Search, X, GripVertical } from 'lucide-react';
import commandUsageService from '../services/CommandUsageService';

export default function SlashCommandModal({ 
  isOpen, 
  onClose, 
  items, 
  onSelectCommand,
  query = '' 
}) {
  const [searchTerm, setSearchTerm] = useState(query);
  const [filteredItems, setFilteredItems] = useState([]);
  const [allItems, setAllItems] = useState([]); // Guardar todos los items originales
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
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

      // Guardar todos los items originales si cambian
      if (JSON.stringify(items) !== JSON.stringify(allItems)) {
        // Ordenar todos los items por uso o orden personalizado
        const sortedAll = await commandUsageService.sortCommandsByUsage(items);
        setAllItems(sortedAll);
      }

      let filtered = allItems.length > 0 ? allItems : items;

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
  }, [items, searchTerm, allItems]);

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
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
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
    // Prevenir doble ejecución usando un ref local
    const executingKey = `_executing_${item.label}`;
    if (item[executingKey]) {
      console.warn('[SlashCommandModal] Comando ya está ejecutándose, ignorando...');
      return;
    }
    
    // Marcar como ejecutándose
    item[executingKey] = true;
    
    try {
      console.log('[SlashCommandModal] Ejecutando comando:', item.label);
      
      // Cerrar el modal PRIMERO para evitar que quede bloqueando
      onClose();
      
      // Pequeño delay para asegurar que el modal se cierre completamente
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Registrar el uso del comando
      await commandUsageService.recordUsage(item.label);
      
      // Ejecutar el comando
      onSelectCommand(item);
    } catch (error) {
      console.error('[SlashCommandModal] Error ejecutando comando:', error);
    } finally {
      // Limpiar la marca después de un delay
      setTimeout(() => {
        delete item[executingKey];
      }, 1000);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedIndex(0);
  };

  // Manejar inicio de arrastre
  const handleDragStart = (e, index) => {
    if (searchTerm && searchTerm.trim()) return; // No permitir drag si hay búsqueda
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  // Manejar arrastre sobre
  const handleDragOver = (e, index) => {
    if (searchTerm && searchTerm.trim()) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  // Manejar salida del arrastre
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Manejar fin del arrastre
  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Manejar soltar
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (searchTerm && searchTerm.trim()) return;
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reordenar los items filtrados (visual)
    const newFilteredItems = [...filteredItems];
    const draggedItem = newFilteredItems[draggedIndex];
    newFilteredItems.splice(draggedIndex, 1);
    newFilteredItems.splice(dropIndex, 0, draggedItem);
    
    setFilteredItems(newFilteredItems);

    // Si no hay búsqueda, actualizar el orden de todos los items y guardar
    if (!searchTerm || !searchTerm.trim()) {
      // Crear un mapa del nuevo orden basado en filteredItems
      const newOrderMap = new Map();
      newFilteredItems.forEach((item, index) => {
        newOrderMap.set(item.label, index);
      });
      
      // Reordenar allItems manteniendo los que no están en filteredItems al final
      const reorderedAllItems = [];
      const itemsInFiltered = new Set(newFilteredItems.map(item => item.label));
      
      // Primero agregar los items en el orden de filteredItems
      newFilteredItems.forEach(item => {
        reorderedAllItems.push(item);
      });
      
      // Luego agregar los items que no están en filteredItems (mantener su orden relativo)
      allItems.forEach(item => {
        if (!itemsInFiltered.has(item.label)) {
          reorderedAllItems.push(item);
        }
      });
      
      setAllItems(reorderedAllItems);
      
      // Guardar el orden personalizado completo
      const newOrder = reorderedAllItems.map(item => item.label);
      await commandUsageService.saveCustomOrder(newOrder);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Efecto para limpiar cuando el componente se desmonta o se cierra
  useEffect(() => {
    // Solo limpiar si isOpen cambia a false, no en cada render
    if (!isOpen) {
      console.log('[SlashCommandModal] isOpen es false, limpiando...');
      // Si el modal se cierra, asegurar que no quede nada en el DOM
      const container = document.getElementById('slash-command-modal-container');
      if (container) {
        console.log('[SlashCommandModal] Limpiando contenedor en useEffect (isOpen=false)');
        try {
          if (container._reactRoot) {
            container._reactRoot.unmount();
            delete container._reactRoot;
          }
          if (container.parentNode) {
            container.parentNode.removeChild(container);
            console.log('[SlashCommandModal] Contenedor removido del DOM');
          }
        } catch (e) {
          console.warn('[SlashCommandModal] Error limpiando en useEffect:', e);
        }
      }
      
      // Limpiar SOLO overlays del slash command (con z-[70000])
      const overlays = document.querySelectorAll('div.fixed.inset-0');
      overlays.forEach(overlay => {
        const hasModalContainer = overlay.querySelector('#slash-command-modal-container');
        const zIndex = window.getComputedStyle(overlay).zIndex;
        const isSlashCommandZIndex = zIndex === '70000' || overlay.className.includes('z-[70000]');
        
        // Solo remover si tiene el contenedor o tiene el z-index específico del slash command
        if (hasModalContainer || (isSlashCommandZIndex && !overlay.id && !overlay.closest('[id]'))) {
          try {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
              console.log('[SlashCommandModal] Overlay del slash command removido');
            }
          } catch (e) {
            console.warn('[SlashCommandModal] Error removiendo overlay:', e);
          }
        }
      });
    }
    
    return () => {
      // Solo limpiar en el cleanup si el componente se desmonta mientras está abierto
      // No llamar onClose aquí porque puede causar bucles infinitos
      console.log('[SlashCommandModal] Cleanup del useEffect');
    };
  }, [isOpen]); // Removido onClose de las dependencias para evitar bucles

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70000] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(1px)',
      }}
      onMouseDown={(e) => {
        // Solo cerrar si el mousedown fue directamente en el overlay (no en el modal)
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
      onClick={(e) => {
        // Solo cerrar si el click fue directamente en el overlay (no en el modal)
        if (e.target === e.currentTarget) {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative z-[70001]"
        onMouseDown={(e) => {
          // Prevenir que el mousedown en el modal se propague al overlay
          e.stopPropagation();
        }}
        onClick={(e) => {
          // Prevenir que el click en el modal se propague al overlay
          e.stopPropagation();
        }}
      >
        {/* Header con búsqueda */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar comandos por nombre o descripción..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-lg"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Lista de comandos */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg">No se encontraron comandos</p>
              <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => {
                const usageCount = commandUsageService.getUsageCount(item.label);
                const isSelected = index === selectedIndex;
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                const canDrag = !searchTerm || !searchTerm.trim();
                
                return (
                  <div
                    key={`${item.label}-${index}`}
                    data-index={index}
                    draggable={canDrag}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`relative transition-all ${
                      isDragOver ? 'pt-8' : ''
                    }`}
                  >
                    {isDragOver && draggedIndex !== null && draggedIndex !== index && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-full z-10" />
                    )}
                    <button
                      onClick={() => handleSelectCommand(item)}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                      } ${isDragging ? 'opacity-50' : ''} ${
                        canDrag ? 'cursor-move' : 'cursor-pointer'
                      }`}
                    >
                      {canDrag && (
                        <div className="flex-shrink-0 mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}
                      <span className="text-2xl flex-shrink-0 mt-0.5">
                        {item.icon || '📝'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">
                            {item.label}
                          </span>
                          {usageCount > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {usageCount} {usageCount === 1 ? 'vez' : 'veces'}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con ayuda */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4 flex-wrap">
              <span>↑↓ Navegar</span>
              <span>Enter Seleccionar</span>
              <span>Esc Cerrar</span>
              {(!searchTerm || !searchTerm.trim()) && (
                <span className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Arrastrar para ordenar
                </span>
              )}
            </div>
            <span>{filteredItems.length} {filteredItems.length === 1 ? 'comando' : 'comandos'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

