import { useState, useEffect } from 'react';
import { Search, Star, ChevronDown, Settings, Plus, Trash2, Github } from 'lucide-react';

export default function Sidebar({ 
  paginas = [], 
  paginaSeleccionada, 
  onSeleccionarPagina, 
  onNuevaPagina,
  onShowConfig,
  filtroPagina,
  setFiltroPagina,
  onSidebarStateChange,
  onEliminarPagina
}) {
  const [favoritos, setFavoritos] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-favoritos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-sidebar-collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({
    favoritos: true,
    paginas: true
  });

  useEffect(() => {
    try {
      localStorage.setItem('notion-sidebar-collapsed', sidebarColapsado.toString());
    } catch (error) {
      console.error('Error guardando estado del sidebar:', error);
    }
    // Notificar cambio de estado al componente padre
    if (onSidebarStateChange) {
      onSidebarStateChange(sidebarColapsado);
    }
  }, [sidebarColapsado, onSidebarStateChange]);

  const toggleFavorito = (paginaId) => {
    setFavoritos(prev => {
      const nuevos = prev.includes(paginaId)
        ? prev.filter(id => id !== paginaId)
        : [...prev, paginaId];
      try {
        localStorage.setItem('notion-favoritos', JSON.stringify(nuevos));
      } catch (error) {
        console.error('Error guardando favoritos:', error);
      }
      return nuevos;
    });
  };

  // Filtrar páginas según el buscador
  const paginasFiltradas = filtroPagina
    ? paginas.filter(p => 
        (p.titulo || '').toLowerCase().includes(filtroPagina.toLowerCase())
      )
    : paginas;

  const paginasFavoritas = paginasFiltradas.filter(p => favoritos.includes(p.id));
  const paginasNormales = paginasFiltradas.filter(p => !favoritos.includes(p.id));

  // Función para obtener el emoji de una página (solo usa pagina.emoji)
  const obtenerEmojiPagina = (pagina) => {
    // Usar solo el campo emoji si existe y no está vacío
    if (pagina.emoji && typeof pagina.emoji === 'string' && pagina.emoji.trim()) {
      return pagina.emoji.trim();
    }
    // Si no hay campo emoji, retornar null (no mostrar emoji, se mostrará la carpeta)
    return null;
  };

  if (sidebarColapsado) {
    return (
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-2 gap-2">
        <button
          onClick={() => setSidebarColapsado(false)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Expandir sidebar"
        >
          <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
        </button>
        <button
          onClick={onNuevaPagina}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Nueva página"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={onShowConfig}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Configuración"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen overflow-hidden">
      {/* Header con perfil */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">afnarqui job</div>
          </div>
          <button
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Opciones"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={filtroPagina}
            onChange={(e) => setFiltroPagina(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-sm bg-white border border-gray-300 rounded hover:border-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Navegación principal */}
      <div className="flex-1 overflow-y-auto">
        {/* Removido: Home, Meetings, Notion AI, Inbox - no tienen funcionalidad implementada */}

        {/* Favoritos */}
        {paginasFavoritas.length > 0 && (
          <div className="mt-4 px-2">
            <button
              onClick={() => setSeccionesAbiertas(prev => ({ ...prev, favoritos: !prev.favoritos }))}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${seccionesAbiertas.favoritos ? '' : '-rotate-90'}`} />
              <span>Favorites</span>
            </button>
            {seccionesAbiertas.favoritos && (
              <div className="mt-1 space-y-0.5">
                {paginasFavoritas.map((pagina) => (
                  <button
                    key={pagina.id}
                    onClick={() => onSeleccionarPagina(pagina.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors group ${
                      paginaSeleccionada === pagina.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {(() => {
                      const emoji = obtenerEmojiPagina(pagina);
                      return emoji ? (
                        <span className="w-4 h-4 flex-shrink-0 text-base leading-none flex items-center justify-center">
                          {emoji}
                        </span>
                      ) : null;
                    })()}
                    <span className="flex-1 text-left truncate">{pagina.titulo || 'Sin título'}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(pagina.id);
                        }}
                        className="p-0.5 hover:bg-gray-300 rounded transition-colors"
                        title={favoritos.includes(pagina.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                      >
                        <Star className={`w-3 h-3 ${favoritos.includes(pagina.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                      {onEliminarPagina && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEliminarPagina(pagina);
                          }}
                          className="p-0.5 hover:bg-red-100 rounded transition-colors"
                          title="Eliminar página"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                        </button>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Todas las páginas */}
        <div className="mt-4 px-2">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={() => setSeccionesAbiertas(prev => ({ ...prev, paginas: !prev.paginas }))}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${seccionesAbiertas.paginas ? '' : '-rotate-90'}`} />
              <span>Pages</span>
            </button>
            <button
              onClick={onNuevaPagina}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Nueva página"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          {seccionesAbiertas.paginas && (
            <div className="mt-1 space-y-0.5 max-h-[400px] overflow-y-auto">
              {paginasNormales.map((pagina) => (
                <button
                  key={pagina.id}
                  onClick={() => onSeleccionarPagina(pagina.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors group ${
                    paginaSeleccionada === pagina.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {(() => {
                    const emoji = obtenerEmojiPagina(pagina);
                    return emoji ? (
                      <span className="w-4 h-4 flex-shrink-0 text-base leading-none flex items-center justify-center">
                        {emoji}
                      </span>
                    ) : null;
                  })()}
                  <span className="flex-1 text-left truncate">{pagina.titulo || 'Sin título'}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorito(pagina.id);
                      }}
                      className="p-0.5 hover:bg-gray-300 rounded transition-colors"
                      title={favoritos.includes(pagina.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                    >
                      <Star className={`w-3 h-3 ${favoritos.includes(pagina.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                    </button>
                    {onEliminarPagina && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEliminarPagina(pagina);
                        }}
                        className="p-0.5 hover:bg-red-100 rounded transition-colors"
                        title="Eliminar página"
                      >
                        <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </button>
              ))}
              {paginasFiltradas.length === 0 && (
                <div className="px-2 py-4 text-xs text-gray-400 text-center">
                  {filtroPagina ? 'No se encontraron páginas' : 'No hay páginas'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer con configuración */}
      <div className="p-2 border-t border-gray-200">
        <a
          href="https://github.com/afnarqui99/notions"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>Repository</span>
        </a>
        <button
          onClick={onShowConfig}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors mt-1"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => setSidebarColapsado(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded transition-colors mt-1"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
          <span>Collapse</span>
        </button>
      </div>
    </div>
  );
}

