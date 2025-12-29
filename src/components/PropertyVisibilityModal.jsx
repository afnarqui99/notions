import { useState, useMemo } from 'react';

export default function PropertyVisibilityModal({ 
  isOpen, 
  onClose, 
  propiedades, 
  onToggleVisibility,
  onShowAll,
  onHideAll,
  onReorder
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Excluir "Name" de las propiedades ya que es el título principal
  const propiedadesFiltradas = useMemo(() => 
    propiedades.filter(p => p.name !== "Name"),
    [propiedades]
  );

  const propiedadesVisibles = useMemo(() => 
    propiedadesFiltradas.filter(p => p.visible !== false),
    [propiedadesFiltradas]
  );

  const propiedadesOcultas = useMemo(() => 
    propiedadesFiltradas.filter(p => p.visible === false),
    [propiedadesFiltradas]
  );

  const propiedadesVisiblesFiltradas = useMemo(() => 
    propiedadesVisibles.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [propiedadesVisibles, searchTerm]
  );

  const propiedadesOcultasFiltradas = useMemo(() => 
    propiedadesOcultas.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [propiedadesOcultas, searchTerm]
  );

  const getTypeIcon = (type, name) => {
    switch (type) {
      case 'date': return '📅';
      case 'text': return 'Aa';
      case 'number': return '#';
      case 'percent': return 'Σ';
      case 'formula': return 'Σ';
      case 'checkbox': return '☑';
      case 'select': return '▼';
      case 'tags': 
        // Assign tiene @, otros tags tienen otro icono
        if (name && name.toLowerCase() === 'assign') return '@';
        return '🏷';
      default: 
        // Para campos de fecha por nombre (backward compatibility)
        if (name && (name.toLowerCase().includes('date') || name.toLowerCase().includes('created') || name.toLowerCase().includes('expiration'))) {
          return '📅';
        }
        return '•';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Property visibility</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"
          >
            <span className="text-xl">×</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search for a property..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Shown in table */}
          {propiedadesVisiblesFiltradas.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Shown in table</h3>
                {propiedadesVisibles.length > 0 && (
                  <button
                    onClick={onHideAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Hide all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {propiedadesVisiblesFiltradas.map((prop, index) => {
                  const originalIndex = propiedadesVisibles.findIndex(p => p.name === prop.name);
                  return (
                    <div
                      key={prop.name}
                      draggable={!searchTerm}
                      onDragStart={(e) => {
                        if (!searchTerm) {
                          setDraggedIndex(originalIndex);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/html', e.currentTarget);
                        }
                      }}
                      onDragOver={(e) => {
                        if (!searchTerm && draggedIndex !== null && draggedIndex !== originalIndex) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverIndex(originalIndex);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!searchTerm && draggedIndex !== null && draggedIndex !== originalIndex && onReorder) {
                          onReorder(draggedIndex, originalIndex);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`flex items-center gap-2 p-2 rounded transition-all ${
                        draggedIndex === originalIndex ? 'opacity-50 scale-95' : ''
                      } ${
                        dragOverIndex === originalIndex ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                      } ${searchTerm ? 'cursor-pointer' : 'cursor-move'}`}
                      onClick={(e) => {
                        if (searchTerm || !e.target.closest('.drag-handle')) {
                          onToggleVisibility(prop.name);
                        }
                      }}
                    >
                      <span 
                        className={`text-gray-400 text-xs drag-handle flex-shrink-0 ${!searchTerm ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        title={searchTerm ? '' : 'Arrastra para reordenar'}
                      >⋮⋮</span>
                      <span className="text-xs text-gray-600 w-5 text-center flex-shrink-0">{getTypeIcon(prop.type, prop.name)}</span>
                      <span className="flex-1 text-xs text-gray-900 truncate min-w-0">{prop.name}</span>
                      <span className="text-blue-600 flex-shrink-0 text-xs">👁️</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hidden in table */}
          {propiedadesOcultasFiltradas.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Hidden in table</h3>
                {propiedadesOcultas.length > 0 && (
                  <button
                    onClick={onShowAll}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Show all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {propiedadesOcultasFiltradas.map((prop) => (
                  <div
                    key={prop.name}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => onToggleVisibility(prop.name)}
                  >
                    <span className="text-gray-400 text-xs cursor-move flex-shrink-0">⋮⋮</span>
                    <span className="text-xs text-gray-600 w-5 text-center flex-shrink-0">{getTypeIcon(prop.type, prop.name)}</span>
                    <span className="flex-1 text-xs text-gray-900 truncate min-w-0">{prop.name}</span>
                    <span className="text-gray-400 line-through flex-shrink-0 text-xs">👁️</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {propiedadesVisiblesFiltradas.length === 0 && propiedadesOcultasFiltradas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No se encontraron propiedades con "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

