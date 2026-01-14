import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Star, ChevronDown, Settings, Plus, Trash2, Github, ChevronRight, Pencil, Tag as TagIcon, X, Moon, Sun, Database, Smile, Zap } from 'lucide-react';
import TagService from '../services/TagService';
import { useTheme } from '../contexts/ThemeContext';
import SQLFileService from '../services/SQLFileService';
import EmojiPicker from './EmojiPicker';

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
  onRenombrarPagina,
  onCambiarParentId,
  onOpenCentroEjecucion
}) {
  const { theme, toggleTheme } = useTheme();
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
  const [pageSQLCounts, setPageSQLCounts] = useState({}); // { pageId: count }
  
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

  // Cargar conteos de scripts SQL para páginas visibles
  useEffect(() => {
    const loadSQLCounts = async () => {
      if (paginas.length === 0) return;
      
      const counts = {};
      // Cargar solo para las primeras 50 páginas para no sobrecargar
      const paginasACargar = paginas.slice(0, 50);
      
      await Promise.all(
        paginasACargar.map(async (pagina) => {
          try {
            const result = await SQLFileService.getFilesByPage(pagina.id);
            counts[pagina.id] = result.files?.length || 0;
          } catch (error) {
            counts[pagina.id] = 0;
          }
        })
      );
      
      setPageSQLCounts(counts);
    };
    
    // Cargar con un pequeño delay para no bloquear el renderizado
    const timeoutId = setTimeout(loadSQLCounts, 500);
    return () => clearTimeout(timeoutId);
  }, [paginas]);

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
      const paginasConTag = paginasFiltradas.filter(p => {
        return p.tags && Array.isArray(p.tags) && p.tags.includes(tagFiltro);
      });
      
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

  // Función simple para detectar si un carácter es emoji
  const isEmoji = (char) => {
    if (!char) return false;
    const code = char.codePointAt(0);
    return (
      (code >= 0x1F300 && code <= 0x1F9FF) ||
      (code >= 0x2600 && code <= 0x26FF) ||
      (code >= 0x2700 && code <= 0x27BF) ||
      (code >= 0x1F600 && code <= 0x1F64F) ||
      (code >= 0x1F680 && code <= 0x1F6FF) ||
      (code >= 0x2190 && code <= 0x21FF) ||
      (code >= 0x2300 && code <= 0x23FF) ||
      (code >= 0x2B50 && code <= 0x2B55) ||
      code === 0x3030 || code === 0x3299 ||
      (code >= 0x1F900 && code <= 0x1F9FF)
    );
  };

  // Extraer emoji actual del título
  const obtenerEmojiActual = (titulo) => {
    const trimmed = titulo.trim();
    if (!trimmed) return '';
    const firstChar = trimmed[0];
    return isEmoji(firstChar) ? firstChar : '';
  };

  // Estado para drag and drop
  const [paginaArrastrando, setPaginaArrastrando] = useState(null);
  const [paginaSobre, setPaginaSobre] = useState(null);
  
  // Estado para edición de nombres
  const [paginaEditando, setPaginaEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = useState(false);
  const [emojiPickerPaginaId, setEmojiPickerPaginaId] = useState(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  // Manejar selección de emoji
  const handleEmojiSelect = (emoji) => {
    setNuevoNombre(prev => {
      // Si ya hay un emoji al inicio, reemplazarlo
      const trimmed = prev.trim();
      const firstChar = trimmed[0];
      if (firstChar && isEmoji(firstChar)) {
        return emoji + trimmed.substring(firstChar.length).trim();
      }
      // Si no hay emoji, agregarlo al inicio
      return emoji + (trimmed ? ' ' + trimmed : '');
    });
    setMostrarEmojiPicker(false);
    setEmojiPickerPaginaId(null);
  };

  // Cerrar emoji picker con Escape
  useEffect(() => {
    if (!mostrarEmojiPicker) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMostrarEmojiPicker(false);
        setEmojiPickerPaginaId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mostrarEmojiPicker]);

  // Toggle expansión de una página
  const toggleExpansion = (paginaId) => {
    setPaginasExpandidas(prev => ({
      ...prev,
      [paginaId]: !prev[paginaId]
    }));
  };

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
        const paginaOrigen = todasLasPaginas.find(p => p.id === paginaArrastrando);
        const paginaDestino = pagina;
        
        if (!paginaOrigen) {
          setPaginaArrastrando(null);
          setPaginaSobre(null);
          return;
        }
        
        // Verificar si se está moviendo entre diferentes niveles
        const mismoParent = (paginaOrigen.parentId === paginaDestino.parentId) || 
                           (!paginaOrigen.parentId && !paginaDestino.parentId);
        
        if (mismoParent) {
          // Mismo nivel: solo reordenar
          const parentId = pagina.parentId;
          reordenarPaginas(paginaArrastrando, pagina.id, parentId);
        } else {
          // Diferente nivel: cambiar parentId
          // Si se arrastra sobre una página, convertirla en hija de esa página
          if (onCambiarParentId) {
            onCambiarParentId(paginaArrastrando, paginaDestino.id);
          }
        }
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
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
              className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0 cursor-pointer"
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
              <div className="relative">
                <div className="flex items-center gap-1">
                  <div
                    ref={emojiButtonRef}
                    onMouseDown={(e) => {
                      // Prevenir que el input pierda el foco
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMostrarEmojiPicker(!mostrarEmojiPicker);
                      setEmojiPickerPaginaId(pagina.id);
                    }}
                    className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0 cursor-pointer"
                    title="Seleccionar emoji"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setMostrarEmojiPicker(!mostrarEmojiPicker);
                        setEmojiPickerPaginaId(pagina.id);
                      }
                    }}
                  >
                    <Smile className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  </div>
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
                        setMostrarEmojiPicker(false);
                        setEmojiPickerPaginaId(null);
                      } else if (e.key === 'Escape') {
                        setPaginaEditando(null);
                        setNuevoNombre('');
                        setMostrarEmojiPicker(false);
                        setEmojiPickerPaginaId(null);
                      }
                    }}
                    onBlur={(e) => {
                      // Si el emoji picker está abierto, no cerrar la edición
                      if (mostrarEmojiPicker) {
                        return;
                      }
                      
                      // Delay para permitir que otros eventos se procesen
                      setTimeout(() => {
                        // Si el emoji picker se abrió durante el delay, no cerrar
                        if (mostrarEmojiPicker) {
                          return;
                        }
                        
                        if (onRenombrarPagina && nuevoNombre.trim()) {
                          onRenombrarPagina(pagina.id, nuevoNombre.trim());
                        }
                        setPaginaEditando(null);
                        setNuevoNombre('');
                        setMostrarEmojiPicker(false);
                        setEmojiPickerPaginaId(null);
                      }, 150);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-left bg-white dark:bg-gray-800 border border-blue-500 dark:border-blue-400 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                </div>
                {mostrarEmojiPicker && emojiPickerPaginaId === pagina.id && createPortal(
                  <div 
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setMostrarEmojiPicker(false);
                        setEmojiPickerPaginaId(null);
                      }
                    }}
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <div 
                      ref={emojiPickerRef}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker
                        onSelect={handleEmojiSelect}
                        onClose={() => {
                          setMostrarEmojiPicker(false);
                          setEmojiPickerPaginaId(null);
                        }}
                        currentEmoji={obtenerEmojiActual(nuevoNombre)}
                      />
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <>
                <span 
                  className="block text-left break-words overflow-hidden"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word'
                  }}
                  title={pagina.titulo || 'Sin título'}
                >
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
                  // Incluir emoji en el nombre si existe
                  const emojiActual = obtenerEmojiPagina(pagina);
                  setNuevoNombre(emojiActual ? `${emojiActual} ${pagina.titulo || ''}`.trim() : (pagina.titulo || ''));
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
                    // Incluir emoji en el nombre si existe
                    const emojiActual = obtenerEmojiPagina(pagina);
                    setNuevoNombre(emojiActual ? `${emojiActual} ${pagina.titulo || ''}`.trim() : (pagina.titulo || ''));
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
                <Plus className="w-3 h-3 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400" />
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
                <Star className={`w-3 h-3 ${favoritos.includes(pagina.id) ? 'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
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
                  <Trash2 className="w-3 h-3 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400" />
                </div>
              )}
            </div>
          )}
        </button>
        
        {/* Indicador de scripts SQL (si tiene) - Fuera del botón para evitar anidamiento */}
        {paginaEditando !== pagina.id && pageSQLCounts[pagina.id] > 0 && (
          <div 
            className="ml-2 flex items-center"
            style={{ paddingLeft: `${8 + nivel * 16}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('open-page-sql-scripts', { detail: { pageId: pagina.id } }));
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title={`Ver ${pageSQLCounts[pagina.id]} script${pageSQLCounts[pagina.id] !== 1 ? 's' : ''} SQL asociado${pageSQLCounts[pagina.id] !== 1 ? 's' : ''}`}
            >
              <Database className="w-3 h-3" />
              <span>{pageSQLCounts[pagina.id]}</span>
            </button>
          </div>
        )}
        
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
      <div className="w-16 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-2 gap-2 transition-colors">
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
    <div className="w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-colors">
      {/* Header con perfil */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">afnarqui job</div>
          </div>
          <button
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Opciones"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={filtroPagina}
            onChange={(e) => setFiltroPagina(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Navegación principal */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Favoritos */}
        {arbolFavoritos.length > 0 && (
          <div className="mt-4 px-2">
            <button
              onClick={() => setSeccionesAbiertas(prev => ({ ...prev, favoritos: !prev.favoritos }))}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
              className="w-full flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${seccionesAbiertas.tags ? '' : '-rotate-90'}`} />
              <span>Tags</span>
            </button>
            {seccionesAbiertas.tags && (
              <div className="mt-1 space-y-1">
                {filtroTag && (
                  <button
                    onClick={() => setFiltroTag(null)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
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
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Nueva página"
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          </div>
          {seccionesAbiertas.paginas && (
            <div className="mt-1 space-y-0.5">
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
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <a
            href="https://github.com/afnarqui99/notions"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Repositorio en GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          {onOpenCentroEjecucion && (
            <button
              onClick={onOpenCentroEjecucion}
              className="flex-1 flex items-center justify-center px-2 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Centro de Ejecución"
            >
              <Zap className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onShowConfig}
            className="flex-1 flex items-center justify-center px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarColapsado(true)}
            className="flex-1 flex items-center justify-center px-2 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Colapsar sidebar"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}
