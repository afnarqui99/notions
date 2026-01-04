import { useState, useEffect } from 'react';
import { Search, Star, ChevronDown, Settings, Plus, Trash2, Github, ChevronRight, Pencil, Tag as TagIcon, X } from 'lucide-react';
import TagService from '../services/TagService';

export default function Sidebar({ 
  paginas = [], 
  paginaSeleccionada, 
  onSeleccionarPagina, 
  onNuevaPagina,
  onShowConfig,
  filtroPagina,
  setFiltroPagina,
  onSidebarStateChange,
  onEliminarPagina,
  onReordenarPaginas,
  onRenombrarPagina
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
    paginas: true,
    tags: true
  });
  const [filtroTag, setFiltroTag] = useState(null);
  const [tags, setTags] = useState([]);
  
  // Estado para páginas expandidas/colapsadas en el árbol
  const [paginasExpandidas, setPaginasExpandidas] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-paginas-expandidas');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
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

  // Guardar estado de expansión de páginas
  useEffect(() => {
    try {
      localStorage.setItem('notion-paginas-expandidas', JSON.stringify(paginasExpandidas));
    } catch (error) {
      console.error('Error guardando estado de expansión:', error);
    }
  }, [paginasExpandidas]);

  // Cargar tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const allTags = await TagService.loadTags();
        setTags(allTags);
      } catch (error) {
        console.error('Error cargando tags:', error);
        setTags([]);
      }
    };
    
    // Esperar un poco para que el handle del directorio esté listo
    // También escuchar el evento de cambio de handle
    const handleDirectoryReady = () => {
      loadTags();
    };
    
    // Cargar inmediatamente
    loadTags();
    
    // También escuchar cuando el handle del directorio cambia
    window.addEventListener('directoryHandleChanged', handleDirectoryReady);
    
    // Escuchar eventos de actualización de tags
    const handleTagsUpdated = () => {
      loadTags();
    };

    window.addEventListener('tagsUpdated', handleTagsUpdated);
    return () => {
      window.removeEventListener('directoryHandleChanged', handleDirectoryReady);
      window.removeEventListener('tagsUpdated', handleTagsUpdated);
    };
  }, []);

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

  // Función helper para obtener páginas raíz (sin parentId)
  const obtenerPaginasRaiz = (paginasList) => {
    return paginasList.filter(p => !p.parentId || p.parentId === null);
  };

  // Función helper para obtener hijos de una página
  const obtenerHijos = (parentId, paginasList) => {
    return paginasList.filter(p => p.parentId === parentId);
  };

  // Cargar orden de páginas desde localStorage
  const cargarOrdenPaginas = () => {
    try {
      const saved = localStorage.getItem('notion-paginas-orden');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // Guardar orden de páginas en localStorage
  const guardarOrdenPaginas = (orden) => {
    try {
      localStorage.setItem('notion-paginas-orden', JSON.stringify(orden));
    } catch (error) {
      console.error('Error guardando orden de páginas:', error);
    }
  };

  // Obtener orden de páginas para un parentId específico
  const obtenerOrden = (parentId) => {
    const ordenes = cargarOrdenPaginas();
    const key = parentId || 'null'; // null se guarda como 'null' string
    return ordenes[key] || null;
  };

  // Guardar orden de páginas para un parentId específico
  const guardarOrden = (parentId, ordenDeIds) => {
    const ordenes = cargarOrdenPaginas();
    const key = parentId || 'null';
    ordenes[key] = ordenDeIds;
    guardarOrdenPaginas(ordenes);
  };

  // Aplicar orden a las páginas según el orden guardado
  const aplicarOrdenAPaginas = (paginasList, parentId) => {
    const orden = obtenerOrden(parentId);
    if (!orden || orden.length === 0) {
      return paginasList; // Si no hay orden guardado, retornar sin cambios
    }
    
    // Crear un mapa de páginas por ID para acceso rápido
    const mapaPaginas = new Map(paginasList.map(p => [p.id, p]));
    
    // Crear array ordenado según el orden guardado
    const paginasOrdenadas = [];
    const idsProcesados = new Set();
    
    // Primero agregar páginas en el orden guardado
    orden.forEach(id => {
      if (mapaPaginas.has(id)) {
        paginasOrdenadas.push(mapaPaginas.get(id));
        idsProcesados.add(id);
      }
    });
    
    // Agregar páginas que no están en el orden (nuevas páginas)
    paginasList.forEach(pagina => {
      if (!idsProcesados.has(pagina.id)) {
        paginasOrdenadas.push(pagina);
      }
    });
    
    return paginasOrdenadas;
  };

  // Función helper para construir el árbol de páginas (con orden aplicado)
  const construirArbol = (paginasList) => {
    const arbol = [];
    const mapaPaginas = new Map(paginasList.map(p => [p.id, p]));
    
    // Primero obtener todas las páginas raíz y aplicar orden
    const paginasRaiz = obtenerPaginasRaiz(paginasList);
    const paginasRaizOrdenadas = aplicarOrdenAPaginas(paginasRaiz, null);
    
    // Función recursiva para construir el árbol
    const construirNodo = (pagina) => {
      const hijos = obtenerHijos(pagina.id, paginasList);
      const hijosOrdenados = aplicarOrdenAPaginas(hijos, pagina.id);
      return {
        ...pagina,
        hijos: hijosOrdenados.map(hijo => construirNodo(hijo))
      };
    };
    
    return paginasRaizOrdenadas.map(pagina => construirNodo(pagina));
  };

  // Función para reordenar páginas
  const reordenarPaginas = (paginaIdOrigen, paginaIdDestino, parentId) => {
    if (!onReordenarPaginas) return;
    
    // Obtener todas las páginas hijas del mismo padre
    const paginasHermanas = parentId 
      ? paginas.filter(p => p.parentId === parentId)
      : paginas.filter(p => !p.parentId || p.parentId === null);
    
    // Crear array de IDs
    let idsOrdenados = paginasHermanas.map(p => p.id);
    
    // Encontrar índices
    const indiceOrigen = idsOrdenados.indexOf(paginaIdOrigen);
    const indiceDestino = idsOrdenados.indexOf(paginaIdDestino);
    
    if (indiceOrigen === -1 || indiceDestino === -1) return;
    
    // Reordenar
    idsOrdenados.splice(indiceOrigen, 1);
    idsOrdenados.splice(indiceDestino, 0, paginaIdOrigen);
    
    // Guardar nuevo orden
    guardarOrden(parentId, idsOrdenados);
    
    // Actualizar estado de páginas (el orden se aplicará al renderizar)
    // Nota: No necesitamos actualizar el estado aquí porque el orden se aplica en construirArbol
    // Pero podemos disparar un evento para forzar re-render
    window.dispatchEvent(new Event('paginasReordenadas'));
  };

  // Filtrar páginas según el buscador y tags (manteniendo la jerarquía)
  const filtrarPaginasConJerarquia = (paginasList, filtro, tagFiltro) => {
    let paginasFiltradas = paginasList;
    
    // Aplicar filtro por tag
    if (tagFiltro) {
      console.log('🔍 Filtrando por tag:', tagFiltro, 'Total páginas:', paginasList.length);
      const paginasConTag = paginasFiltradas.filter(p => {
        const hasTag = p.tags && Array.isArray(p.tags) && p.tags.includes(tagFiltro);
        if (hasTag) {
          console.log('✅ Página encontrada:', p.titulo, 'Tags:', p.tags);
        }
        return hasTag;
      });
      console.log('📊 Páginas con tag:', paginasConTag.length);
      
      // Si hay filtro de tag, incluir también los ancestros e hijos de las páginas con tag
      const paginasFiltradasSet = new Set();
      paginasConTag.forEach(pagina => {
        paginasFiltradasSet.add(pagina.id);
        
        // Agregar todos los ancestros
        let parentId = pagina.parentId;
        while (parentId) {
          const parent = paginasList.find(p => p.id === parentId);
          if (parent) {
            paginasFiltradasSet.add(parent.id);
            parentId = parent.parentId;
          } else {
            break;
          }
        }
        
        // Agregar todos los hijos recursivamente
        const agregarHijos = (paginaId) => {
          obtenerHijos(paginaId, paginasList).forEach(hijo => {
            paginasFiltradasSet.add(hijo.id);
            agregarHijos(hijo.id);
          });
        };
        agregarHijos(pagina.id);
      });
      
      paginasFiltradas = paginasList.filter(p => paginasFiltradasSet.has(p.id));
      console.log('📊 Páginas filtradas (con jerarquía):', paginasFiltradas.length);
    }
    
    // Aplicar filtro por texto
    if (!filtro) return paginasFiltradas;
    
    const filtroLower = filtro.toLowerCase();
    const paginasFiltradasSet = new Set();
    const paginasQueCoinciden = paginasFiltradas.filter(p => 
      (p.titulo || '').toLowerCase().includes(filtroLower)
    );
    
    // Agregar páginas que coinciden y todos sus ancestros e hijos
    paginasQueCoinciden.forEach(pagina => {
      paginasFiltradasSet.add(pagina.id);
      
      // Agregar todos los ancestros
      let parentId = pagina.parentId;
      while (parentId) {
        const parent = paginasFiltradas.find(p => p.id === parentId);
        if (parent) {
          paginasFiltradasSet.add(parent.id);
          parentId = parent.parentId;
        } else {
          break;
        }
      }
      
      // Agregar todos los hijos recursivamente
      const agregarHijos = (paginaId) => {
        obtenerHijos(paginaId, paginasFiltradas).forEach(hijo => {
          paginasFiltradasSet.add(hijo.id);
          agregarHijos(hijo.id);
        });
      };
      agregarHijos(pagina.id);
    });
    
    return paginasFiltradas.filter(p => paginasFiltradasSet.has(p.id));
  };

  // Estado para forzar re-render cuando cambia el orden
  const [ordenActualizado, setOrdenActualizado] = useState(0);

  // Escuchar evento de reordenamiento para forzar re-render
  useEffect(() => {
    const handleReordenar = () => {
      // Forzar re-render incrementando el estado
      setOrdenActualizado(prev => prev + 1);
    };
    window.addEventListener('paginasReordenadas', handleReordenar);
    return () => {
      window.removeEventListener('paginasReordenadas', handleReordenar);
    };
  }, []);

  const paginasFiltradas = filtrarPaginasConJerarquia(paginas, filtroPagina, filtroTag);
  const arbolPaginas = construirArbol(paginasFiltradas);
  
  // Separar favoritos y normales
  const arbolFavoritos = arbolPaginas.filter(nodo => favoritos.includes(nodo.id));
  const arbolNormales = arbolPaginas.filter(nodo => !favoritos.includes(nodo.id));

  // Función para obtener el emoji de una página
  const obtenerEmojiPagina = (pagina) => {
    if (pagina.emoji && typeof pagina.emoji === 'string' && pagina.emoji.trim()) {
      return pagina.emoji.trim();
    }
    return null;
  };

  // Toggle expansión de una página
  const toggleExpansion = (paginaId) => {
    setPaginasExpandidas(prev => ({
      ...prev,
      [paginaId]: !prev[paginaId]
    }));
  };

  // Estado para drag and drop
  const [paginaArrastrando, setPaginaArrastrando] = useState(null);
  const [paginaSobre, setPaginaSobre] = useState(null);
  
  // Estado para edición de nombres
  const [paginaEditando, setPaginaEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');

  // Componente recursivo para renderizar una página y sus hijos
  const PaginaItem = ({ pagina, nivel = 0, todasLasPaginas }) => {
    const hijos = obtenerHijos(pagina.id, todasLasPaginas);
    const tieneHijos = hijos.length > 0;
    const estaExpandida = paginasExpandidas[pagina.id] ?? (nivel < 1); // Expandir primer nivel por defecto
    const emoji = obtenerEmojiPagina(pagina);
    const estaArrastrando = paginaArrastrando === pagina.id;
    const estaSobre = paginaSobre === pagina.id;

    const handleDragStart = (e) => {
      setPaginaArrastrando(pagina.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', pagina.id);
      // Hacer el elemento semi-transparente mientras se arrastra
      e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
      e.currentTarget.style.opacity = '1';
      setPaginaArrastrando(null);
      setPaginaSobre(null);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (pagina.id !== paginaArrastrando) {
        setPaginaSobre(pagina.id);
      }
    };

    const handleDragLeave = (e) => {
      // Solo limpiar si realmente salimos del elemento (no solo entramos a un hijo)
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setPaginaSobre(null);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (paginaArrastrando && paginaArrastrando !== pagina.id) {
        // Reordenar: mover la página arrastrada antes de la página destino
        const parentId = pagina.parentId; // Usar el mismo parentId (páginas hermanas)
        reordenarPaginas(paginaArrastrando, pagina.id, parentId);
      }
      
      setPaginaArrastrando(null);
      setPaginaSobre(null);
    };

    return (
      <div>
        <button
          draggable={!filtroPagina} // Solo permitir drag si no hay filtro activo
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => onSeleccionarPagina(pagina.id)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors group ${
            paginaSeleccionada === pagina.id
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-200'
          } ${estaArrastrando ? 'opacity-50' : ''} ${estaSobre ? 'bg-blue-50 border-t-2 border-blue-500' : ''}`}
          style={{ paddingLeft: `${8 + nivel * 16}px`, cursor: filtroPagina ? 'default' : 'grab' }}
        >
          {/* Botón de expansión/colapso */}
          {tieneHijos ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(pagina.id);
              }}
              className="p-0.5 hover:bg-gray-300 rounded transition-colors flex-shrink-0 cursor-pointer"
              title={estaExpandida ? "Colapsar" : "Expandir"}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpansion(pagina.id);
                }
              }}
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${estaExpandida ? 'rotate-90' : ''}`} />
            </div>
          ) : (
            <div className="w-4 h-4 flex-shrink-0" />
          )}
          
          {/* Emoji o ícono */}
          {emoji ? (
            <span className="w-4 h-4 flex-shrink-0 text-base leading-none flex items-center justify-center">
              {emoji}
            </span>
          ) : null}
          
          {/* Título o Input de edición */}
          <div className="flex-1 min-w-0">
            {paginaEditando === pagina.id ? (
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (onRenombrarPagina && nuevoNombre.trim()) {
                      onRenombrarPagina(pagina.id, nuevoNombre.trim());
                    }
                    setPaginaEditando(null);
                    setNuevoNombre('');
                  } else if (e.key === 'Escape') {
                    setPaginaEditando(null);
                    setNuevoNombre('');
                  }
                }}
                onBlur={() => {
                  if (onRenombrarPagina && nuevoNombre.trim()) {
                    onRenombrarPagina(pagina.id, nuevoNombre.trim());
                  }
                  setPaginaEditando(null);
                  setNuevoNombre('');
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-left bg-white border border-blue-500 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <>
                <span className="block text-left truncate">
                  {pagina.titulo || 'Sin título'}
                </span>
                {/* Tags de la página */}
                {pagina.tags && Array.isArray(pagina.tags) && pagina.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {pagina.tags.slice(0, 2).map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tagId}
                          className="inline-block w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        />
                      );
                    })}
                    {pagina.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{pagina.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Botones de acción (hover) */}
          {paginaEditando !== pagina.id && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setPaginaEditando(pagina.id);
                  setNuevoNombre(pagina.titulo || '');
                }}
                className="p-0.5 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                title="Editar nombre"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setPaginaEditando(pagina.id);
                    setNuevoNombre(pagina.titulo || '');
                  }
                }}
              >
                <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-600" />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNuevaPagina) {
                    onNuevaPagina(pagina.id); // Crear página hija
                  }
                }}
                className="p-0.5 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                title="Crear página hija"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onNuevaPagina) {
                      onNuevaPagina(pagina.id);
                    }
                  }
                }}
              >
                <Plus className="w-3 h-3 text-gray-400 hover:text-blue-600" />
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorito(pagina.id);
                }}
                className="p-0.5 hover:bg-gray-300 rounded transition-colors cursor-pointer"
                title={favoritos.includes(pagina.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorito(pagina.id);
                  }
                }}
              >
                <Star className={`w-3 h-3 ${favoritos.includes(pagina.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              </div>
              {onEliminarPagina && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminarPagina(pagina);
                  }}
                  className="p-0.5 hover:bg-red-100 rounded transition-colors cursor-pointer"
                  title="Eliminar página"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onEliminarPagina(pagina);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" />
                </div>
              )}
            </div>
          )}
        </button>
        
        {/* Renderizar hijos si está expandida */}
        {tieneHijos && estaExpandida && (
          <div className="ml-0">
            {aplicarOrdenAPaginas(hijos, pagina.id).map((hijo) => (
              <PaginaItem key={hijo.id} pagina={hijo} nivel={nivel + 1} todasLasPaginas={todasLasPaginas} />
            ))}
          </div>
        )}
      </div>
    );
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
          onClick={() => onNuevaPagina && onNuevaPagina(null)}
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
        {/* Favoritos */}
        {arbolFavoritos.length > 0 && (
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
                {arbolFavoritos.map((nodo) => (
                  <PaginaItem key={nodo.id} pagina={nodo} nivel={0} todasLasPaginas={paginasFiltradas} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 px-2">
            <button
              onClick={() => setSeccionesAbiertas(prev => ({ ...prev, tags: !prev.tags }))}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${seccionesAbiertas.tags ? '' : '-rotate-90'}`} />
              <span>Tags</span>
            </button>
            {seccionesAbiertas.tags && (
              <div className="mt-1 space-y-1">
                {filtroTag && (
                  <button
                    onClick={() => setFiltroTag(null)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                    <span>Limpiar filtro</span>
                  </button>
                )}
                <div className="flex flex-wrap gap-1 px-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setFiltroTag(filtroTag === tag.id ? null : tag.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                        filtroTag === tag.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        backgroundColor: filtroTag === tag.id ? tag.color : `${tag.color}20`,
                        color: filtroTag === tag.id ? 'white' : tag.color,
                        border: `1px solid ${tag.color}40`
                      }}
                      title={tag.name}
                    >
                      <TagIcon className="w-3 h-3" />
                      <span>{tag.name}</span>
                    </button>
                  ))}
                </div>
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
              onClick={() => onNuevaPagina && onNuevaPagina(null)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Nueva página"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          {seccionesAbiertas.paginas && (
            <div className="mt-1 space-y-0.5 max-h-[400px] overflow-y-auto">
              {arbolNormales.map((nodo) => (
                <PaginaItem key={nodo.id} pagina={nodo} nivel={0} todasLasPaginas={paginasFiltradas} />
              ))}
              {arbolPaginas.length === 0 && (
                <div className="px-2 py-4 text-xs text-gray-400 text-center">
                  {filtroPagina || filtroTag ? 'No se encontraron páginas' : 'No hay páginas'}
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
