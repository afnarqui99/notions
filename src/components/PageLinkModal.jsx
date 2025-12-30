import { useState, useEffect } from 'react';
import { FileText, X, Search } from 'lucide-react';

export default function PageLinkModal({ isOpen, onClose, paginas = [], onSelectPage }) {
  const [busqueda, setBusqueda] = useState('');
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setPaginaSeleccionada(null);
    }
  }, [isOpen]);

  // Función para obtener el título completo de una página (con emoji si existe)
  const obtenerTituloCompleto = (pagina) => {
    const emoji = pagina.emoji ? `${pagina.emoji} ` : '';
    return `${emoji}${pagina.titulo || 'Sin título'}`;
  };

  // Filtrar páginas según búsqueda
  const paginasFiltradas = busqueda
    ? paginas.filter(p => 
        (p.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.emoji || '').includes(busqueda)
      )
    : paginas;

  const handleSelect = (pagina) => {
    if (onSelectPage) {
      onSelectPage(pagina);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Enlace a página</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Búsqueda */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar página..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de páginas */}
        <div className="p-4 max-h-[400px] overflow-y-auto">
          {paginasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {busqueda ? 'No se encontraron páginas' : 'No hay páginas disponibles'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {paginasFiltradas.map((pagina) => (
                <button
                  key={pagina.id}
                  onClick={() => handleSelect(pagina)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    paginaSeleccionada === pagina.id
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onMouseEnter={() => setPaginaSeleccionada(pagina.id)}
                >
                  {pagina.emoji && (
                    <span className="text-xl flex-shrink-0">{pagina.emoji}</span>
                  )}
                  <span className="flex-1 font-medium text-gray-800">
                    {pagina.titulo || 'Sin título'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          💡 Selecciona una página para crear un enlace
        </div>
      </div>
    </div>
  );
}

