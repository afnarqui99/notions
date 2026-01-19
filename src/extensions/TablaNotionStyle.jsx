import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NodeViewWrapper } from "@tiptap/react";
import TagInputNotionLike from "./TagInputNotionLike";
import EditorDescripcion from './EditorDescripcion';
import { FormulaEvaluator, calcularTotal } from './FormulaEvaluator';
import FormulaSuggestions from './FormulaSuggestions';
import PropertyVisibilityModal from '../components/PropertyVisibilityModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import VincularTablasModal from '../components/VincularTablasModal';
import GraficasCombinadas from '../components/GraficasCombinadas';
import LocalStorageService from '../services/LocalStorageService';
import TableRegistryService from '../services/TableRegistryService';
import { PageContext } from '../utils/pageContext';
import TableViewSelector from '../components/TableViewSelector';
import KanbanView from '../components/KanbanView';
import TimelineView from '../components/TimelineView';
import GalleryView from '../components/GalleryView';
import Toast from '../components/Toast';

// Sistema para rastrear el nivel de anidamiento de drawers
let drawerNestingLevel = 0;

// Componente auxiliar para cargar imagen desde filename
function ImagenDesdeFilename({ fila, className, alt }) {
  const [imagenUrl, setImagenUrl] = useState(null);
  const [esIconoPredefinido, setEsIconoPredefinido] = useState(false);
  
  useEffect(() => {
    const cargarImagen = async () => {
      // Si es un icono predefinido (empezando con icon-), mostrar el emoji directamente
      if (fila.imageFilename && fila.imageFilename.startsWith('icon-')) {
        setEsIconoPredefinido(true);
        setImagenUrl(fila.image); // El emoji está en fila.image
        return;
      }
      
      if (fila.imageFilename || fila.image) {
        try {
          let filename = fila.imageFilename;
          
          // Si no hay imageFilename pero hay image, intentar extraerlo
          if (!filename && fila.image) {
            if (fila.image.startsWith('./files/')) {
              filename = fila.image.replace('./files/', '');
            } else if (fila.image.startsWith('blob:')) {
              // Si es una URL blob antigua, no podemos cargarla
              setImagenUrl(null);
              return;
            }
          }
          
          // Si tenemos filename, cargar desde el archivo
          if (filename) {
            const url = await LocalStorageService.getFileURL(filename, 'files');
            if (url) {
              setImagenUrl(url);
              setEsIconoPredefinido(false);
            } else {
              setImagenUrl(null);
            }
          } else {
            setImagenUrl(null);
          }
        } catch (error) {
          setImagenUrl(null);
        }
      } else {
        setImagenUrl(null);
        setEsIconoPredefinido(false);
      }
    };
    cargarImagen();
  }, [fila.image, fila.imageFilename]);
  
  if (!imagenUrl && !esIconoPredefinido) return null;
  
  if (esIconoPredefinido) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-lg">{imagenUrl}</span>
      </div>
    );
  }
  
  return <img src={imagenUrl} alt={alt || fila.Name || "Sin nombre"} className={className} />;
}

// Componente para la celda de nombre con imagen
function NombreCeldaConImagen({ fila, filaIndex, onSubirImagen, onEliminarImagen, onAbrirDrawer }) {
  const [imagenUrl, setImagenUrl] = useState(null);
  const [esIconoPredefinido, setEsIconoPredefinido] = useState(false);
  
  useEffect(() => {
    const cargarImagen = async () => {
      // Si es un icono predefinido (empezando con icon-), mostrar el emoji directamente
      if (fila.imageFilename && fila.imageFilename.startsWith('icon-')) {
        setEsIconoPredefinido(true);
        setImagenUrl(fila.image); // El emoji o SVG está en fila.image
        return;
      }
      
      if (fila.imageFilename || fila.image) {
        try {
          // Prioridad: usar imageFilename si está disponible
          let filename = fila.imageFilename;
          
          // Si no hay imageFilename pero hay image, intentar extraerlo
          if (!filename && fila.image) {
            if (fila.image.startsWith('./files/')) {
              filename = fila.image.replace('./files/', '');
            } else if (fila.image.startsWith('blob:')) {
              // Si es una URL blob antigua, no podemos cargarla
              // Intentar usar imageFilename si existe
              setImagenUrl(null);
              return;
            }
          }
          
          // Si tenemos filename, cargar desde el archivo
          if (filename) {
            const url = await LocalStorageService.getFileURL(filename, 'files');
            if (url) {
              setImagenUrl(url);
              setEsIconoPredefinido(false);
            } else {
              setImagenUrl(null);
            }
          } else {
            setImagenUrl(null);
          }
        } catch (error) {
          setImagenUrl(null);
        }
      } else {
        setImagenUrl(null);
        setEsIconoPredefinido(false);
      }
    };
    cargarImagen();
  }, [fila.image, fila.imageFilename]);

  return (
    <td
      className="font-semibold cursor-pointer sticky-name-cell"
      style={{ 
        minWidth: '250px', 
        width: '250px', 
        maxWidth: '250px', 
        padding: '2px 8px', 
        position: 'sticky', 
        left: 0, 
        zIndex: 10, 
        backgroundColor: 'white',
        boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
      }}
      onClick={(e) => {
        // Solo abrir el drawer si es un clic real del usuario (no un evento sintético o automático)
        if (e.isTrusted && !e.target.closest('input') && !e.target.closest('button') && !e.target.closest('.TagInputNotionLike') && !e.target.closest('.fila-imagen-container')) {
          onAbrirDrawer(fila);
        }
      }}
    >
      <div className="flex items-center gap-1.5">
        {/* Contenedor de imagen */}
        <div className="fila-imagen-container flex-shrink-0 relative">
          {imagenUrl ? (
            <div className="relative group/image">
              {esIconoPredefinido ? (
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-xs border border-gray-200 bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubirImagen(filaIndex);
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Clic para cambiar icono"
                >
                  {imagenUrl}
                </div>
              ) : (
                <img 
                  src={imagenUrl} 
                  alt={fila.Name || "Sin nombre"}
                  className="w-5 h-5 rounded object-cover border border-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSubirImagen(filaIndex);
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Clic para cambiar imagen"
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminarImagen(filaIndex);
                }}
                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[10px] opacity-0 group-hover/image:opacity-100 transition-opacity leading-none"
                title="Eliminar imagen"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubirImagen(filaIndex);
              }}
              className="w-5 h-5 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
              title="Agregar imagen o icono"
            >
              <span className="text-[10px]">🖼️</span>
            </button>
          )}
        </div>
        <span className="flex-1 min-w-0 truncate text-sm">{fila.Name || "Sin nombre"}</span>
      </div>
    </td>
  );
}

const tipos = [
  { value: "text", label: "📝 Texto" },
  { value: "number", label: "# Número" },
  { value: "checkbox", label: "✅ Check" },
  { value: "percent", label: "📊 Porcentaje" },
  { value: "select", label: "🎨 Select con color" },
  { value: "tags", label: "🏷️ Tags" },
  { value: "formula", label: "🧮 Fórmula" },
  { value: "date", label: "📅 Fecha" },
];

export default function TablaNotionStyle({ node, updateAttributes, getPos, editor }) {
  // Inicializar estado desde el nodo, asegurando que las fórmulas estén inicializadas
  const inicializarFilas = (filasData) => {
    if (!filasData || !Array.isArray(filasData)) return [];
    return filasData.map(fila => {
      const nuevaFila = { 
        ...fila,
        image: fila.image || null,
        imageFilename: fila.imageFilename || null,
        abonos: fila.abonos || [] // Preservar historial de abonos
      };
      
      // Migración: Si hay una URL blob pero no hay filename, limpiar la imagen
      // (las URLs blob no persisten después de recargar)
      if (nuevaFila.image && nuevaFila.image.startsWith('blob:') && !nuevaFila.imageFilename) {
        nuevaFila.image = null;
        nuevaFila.imageFilename = null;
      }
      
      // Asegurar que si hay imageFilename, también tengamos la referencia correcta en image
      if (nuevaFila.imageFilename && !nuevaFila.image) {
        nuevaFila.image = `./files/${nuevaFila.imageFilename}`;
      }
      
      // Sincronizar Name desde properties.Name si existe y no hay Name en nivel superior
      if (nuevaFila.properties) {
        nuevaFila.properties = { ...nuevaFila.properties };
        
        // Si hay properties.Name pero no Name en nivel superior, sincronizar
        if (nuevaFila.properties.Name && !nuevaFila.Name) {
          const nameValue = nuevaFila.properties.Name.value || nuevaFila.properties.Name;
          nuevaFila.Name = typeof nameValue === 'string' ? nameValue : String(nameValue || '');
        }
        
        // Si hay Name en nivel superior pero no en properties, sincronizar
        if (nuevaFila.Name && (!nuevaFila.properties.Name || !nuevaFila.properties.Name.value)) {
          if (!nuevaFila.properties.Name) {
            nuevaFila.properties.Name = { value: nuevaFila.Name, type: 'text' };
          } else {
            nuevaFila.properties.Name.value = nuevaFila.Name;
          }
        }
        
        // Asegurar que las propiedades de tipo formula tengan el campo formula
        Object.keys(nuevaFila.properties).forEach(key => {
          if (nuevaFila.properties[key]?.type === "formula") {
            nuevaFila.properties[key] = {
              ...nuevaFila.properties[key],
              formula: nuevaFila.properties[key].formula || ""
            };
          }
        });
      }
      return nuevaFila;
    });
  };

  const [filas, setFilas] = useState(() => inicializarFilas(node.attrs.filas));
  const [propiedades, setPropiedades] = useState(() => {
    // Asegurar que todas las propiedades tengan visible por defecto
    const props = node.attrs.propiedades || [];
    return props.map(p => ({ ...p, visible: p.visible !== undefined ? p.visible : true }));
  });
  // Estado para el comportamiento de la tabla (scrum, financiero, null)
  const [comportamiento, setComportamiento] = useState(() => {
    return node.attrs.comportamiento || null;
  });

  // Estado para tableId y nombreTabla
  const [tableId, setTableId] = useState(() => {
    // Si no existe tableId, generar uno nuevo pero NO actualizar aquí (causa setState durante render)
    if (!node.attrs.tableId) {
      return TableRegistryService.generateTableId();
    }
    return node.attrs.tableId;
  });

  // Actualizar tableId en el nodo si se generó uno nuevo (fuera del render)
  useEffect(() => {
    if (!node.attrs.tableId && tableId) {
      // Usar setTimeout para asegurar que se ejecute fuera del ciclo de renderizado
      const timeoutId = setTimeout(() => {
        updateAttributes({ tableId });
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [tableId]); // Solo tableId como dependencia para evitar loops
  const [nombreTabla, setNombreTabla] = useState(() => {
    return node.attrs.nombreTabla || null;
  });
  const [tablasVinculadas, setTablasVinculadas] = useState(() => {
    return node.attrs.tablasVinculadas || [];
  });
  
  // Ref para evitar inicialización múltiple
  const inicializacionFinancieraRef = useRef(false);
  
  // Inicializar propiedades automáticamente si es una tabla financiera sin propiedades
  useEffect(() => {
    // Solo inicializar una vez cuando se cumplan las condiciones
    if (!inicializacionFinancieraRef.current && comportamiento === 'financiero' && propiedades.length === 0 && nombreTabla) {
      inicializacionFinancieraRef.current = true; // Marcar como inicializado
      
      let columnasAAgregar = [];
      
      // Determinar qué columnas agregar según el nombre de la tabla
      if (nombreTabla === 'Ingresos' || nombreTabla === '💰 Ingresos') {
        columnasAAgregar = [
          ...obtenerColumnasFinancieras().filter(col => 
            col.name === "Persona" || col.name === "Ingresos" || col.name === "Fecha Movimiento" || 
            col.name === "Descripción" || col.name === "Total Ingresos"
          ),
          { name: "Concepto", type: "select", visible: true, descripcion: "Concepto del ingreso" },
          { name: "Categoría", type: "tags", visible: true, descripcion: "Categoría del ingreso" }
        ];
        // Cambiar Ingresos a tipo number para poder agregar valores numéricos
        columnasAAgregar = columnasAAgregar.map(col => 
          col.name === "Ingresos" ? { ...col, type: "number", totalizar: true } : 
          col.name === "Descripción" ? { ...col, visible: true } : col
        );
      } else if (nombreTabla === 'Egresos' || nombreTabla === '💸 Egresos') {
        columnasAAgregar = [
          ...obtenerColumnasFinancieras().filter(col => 
            col.name === "Persona" || col.name === "Egresos" || col.name === "Fecha Movimiento" || 
            col.name === "Descripción" || col.name === "Total Egresos"
          ),
          { name: "Concepto", type: "select", visible: true, descripcion: "Concepto del egreso" },
          { name: "Categoría", type: "tags", visible: true, descripcion: "Categoría del egreso" }
        ];
        // Cambiar Egresos a tipo number para poder agregar valores numéricos
        columnasAAgregar = columnasAAgregar.map(col => 
          col.name === "Egresos" ? { ...col, type: "number", totalizar: true } : 
          col.name === "Descripción" ? { ...col, visible: true } : col
        );
      } else if (nombreTabla === 'Deudas' || nombreTabla === '💳 Deudas') {
        columnasAAgregar = [
          ...obtenerColumnasFinancieras().filter(col => 
            col.name === "Persona" || col.name === "Deudas" || col.name === "Fecha Movimiento" || 
            col.name === "Descripción" || col.name === "Total Deudas" ||
            col.name === "Porcentaje Deudas"
          ),
          { name: "Concepto", type: "select", visible: true, descripcion: "Concepto de la deuda" },
          { name: "Categoría", type: "tags", visible: true, descripcion: "Categoría de la deuda" }
        ];
        // Cambiar Deudas a tipo number para poder agregar valores numéricos
        columnasAAgregar = columnasAAgregar.map(col => 
          col.name === "Deudas" ? { ...col, type: "number", totalizar: true } : 
          col.name === "Descripción" ? { ...col, visible: true } : col
        );
      }
      
      if (columnasAAgregar.length > 0) {
        const nuevasPropiedades = columnasAAgregar.map(col => ({
          name: col.name,
          type: col.type,
          visible: col.visible !== undefined ? col.visible : true,
          totalizar: col.totalizar || false,
          formula: col.formula || undefined
        }));
        
        setPropiedades(nuevasPropiedades);
        
        // Si no hay filas, crear una fila por defecto
        if (filas.length === 0) {
          const nuevaFila = {
            id: Date.now(),
            Name: "Nueva tarea",
            image: null,
            imageFilename: null,
            properties: {},
          };
          
          // Inicializar propiedades con valores por defecto
          nuevasPropiedades.forEach((prop) => {
            let defaultValue = prop.type === "checkbox" ? false : 
                              prop.type === "tags" ? [] : 
                              prop.type === "formula" ? "" : 
                              prop.type === "number" ? 0 : 
                              prop.type === "date" ? new Date().toISOString().split('T')[0] : "";
            
            nuevaFila.properties[prop.name] = {
              type: prop.type,
              value: defaultValue,
              color: prop.type === "select" ? "#3b82f6" : undefined,
              formula: prop.formula || undefined,
            };
          });
          
          setFilas([nuevaFila]);
          
          // Guardar usando setTimeout para evitar problemas con el useEffect
          setTimeout(() => {
            updateAttributes({ 
              propiedades: nuevasPropiedades,
              filas: [nuevaFila]
            });
          }, 0);
        } else {
          // Solo guardar propiedades si ya hay filas
          setTimeout(() => {
            updateAttributes({ propiedades: nuevasPropiedades });
          }, 0);
        }
      }
    }
  }, [comportamiento, propiedades.length, nombreTabla, filas.length]); // Solo cuando cambian estos valores
  
  // Cache para datos de tablas vinculadas
  const cacheDatosTablas = useRef({});
  const precargandoTablasRef = useRef(false); // Flag para evitar precargas simultáneas
  const evaluandoFormulasRef = useRef(false); // Flag para evitar disparar eventos durante evaluación de fórmulas
  
  // Función para cargar datos de una tabla vinculada
  const cargarDatosTablaVinculada = (tableIdBuscado) => {
    // Si ya está en cache, retornarlo
    if (cacheDatosTablas.current[tableIdBuscado]) {
      return cacheDatosTablas.current[tableIdBuscado];
    }
    
    // Buscar la tabla en el registro
    const tablaInfo = TableRegistryService.getTable(tableIdBuscado);
    if (!tablaInfo || !tablaInfo.paginaId) {
      return null;
    }
    
    // Intentar cargar desde el cache primero (si ya se cargó antes)
    // Si no está, retornar null (se cargará de forma asíncrona)
    return null;
  };
  
  // Función para cargar datos de tablas vinculadas de forma asíncrona
  const precargarDatosTablasVinculadas = async () => {
    if (!tablasVinculadas || tablasVinculadas.length === 0) {
      return;
    }
    
    // Evitar precargas simultáneas
    if (precargandoTablasRef.current) {
      return;
    }
    
    precargandoTablasRef.current = true;
    
    try {
      for (const vinculacion of tablasVinculadas) {
        const tableIdBuscado = vinculacion.tableId;
        
        // Si ya está en cache, saltar
        if (cacheDatosTablas.current[tableIdBuscado]) {
          continue;
        }
        
        try {
          // Buscar la tabla en el registro
          const tablaInfo = TableRegistryService.getTable(tableIdBuscado);
          if (!tablaInfo || !tablaInfo.paginaId) {
            continue;
          }
          
          // Cargar la página
          const paginaData = await LocalStorageService.readJSONFile(`${tablaInfo.paginaId}.json`, 'data');
          if (!paginaData || !paginaData.contenido) {
            continue;
          }
          
          // Buscar el nodo de tabla en el contenido
          const encontrarTablaEnContenido = (content) => {
            if (!content || !content.content) return null;
            
            for (const node of content.content) {
              if (node.type === 'tablaNotion' && node.attrs?.tableId === tableIdBuscado) {
                return node.attrs;
              }
              // Buscar recursivamente en nodos hijos
              if (node.content) {
                const encontrado = encontrarTablaEnContenido(node);
                if (encontrado) return encontrado;
              }
            }
            return null;
          };
          
          const tablaData = encontrarTablaEnContenido(paginaData.contenido);
          if (tablaData) {
            cacheDatosTablas.current[tableIdBuscado] = {
              filas: tablaData.filas || [],
              propiedades: tablaData.propiedades || []
            };
          }
        } catch (error) {
          // Error cargando datos de tabla vinculada
        }
      }
      
      // Forzar re-evaluación de fórmulas después de cargar
      // Solo disparar evento si realmente se cargaron datos nuevos
      const datosCargados = Object.keys(cacheDatosTablas.current).length > 0;
      if (datosCargados && !evaluandoFormulasRef.current) {
        // Usar setTimeout para evitar disparar el evento durante el renderizado
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('tablasVinculadasCargadas', {
            detail: { tableId: tableId }
          }));
        }, 0);
      }
    } finally {
      precargandoTablasRef.current = false;
    }
  };

  // Estado para configuración global del sprint
  const [sprintConfig, setSprintConfig] = useState(() => {
    const config = node.attrs.sprintConfig;
    if (config) return config;
    // Valores por defecto
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const hoyStr = `${año}-${mes}-${dia}`;
    // Por defecto, sprint de 15 días hábiles
    const fecha = new Date(hoyStr);
    let diasAgregados = 0;
    while (diasAgregados < 15) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // Excluir domingo (0) y sábado (6)
        diasAgregados++;
      }
    }
    const añoFin = fecha.getFullYear();
    const mesFin = String(fecha.getMonth() + 1).padStart(2, '0');
    const diaFin = String(fecha.getDate()).padStart(2, '0');
    const sprintEndDate = `${añoFin}-${mesFin}-${diaFin}`;
    return {
      sprintStartDate: hoyStr,
      sprintEndDate: sprintEndDate,
      horasDiarias: 8,
      puntosTotalesSprint: null, // Puntos totales objetivo del sprint (Fibonacci: 1, 2, 3, 5, 8, 13, 21, etc.)
      diasNoTrabajados: [] // Array de fechas que no se trabajan (además de sábados y domingos)
    };
  });
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerExpandido, setDrawerExpandido] = useState(false);
  const [drawerZIndex, setDrawerZIndex] = useState(100);
  const [useFullScreenModal, setUseFullScreenModal] = useState(false);
  const saveTimeoutRef = useRef(null);
  const ultimoContenidoDescripcionRef = useRef(null);
  const [nuevoCampo, setNuevoCampo] = useState({ name: "", type: "text", formula: "", visible: true });
  const [sortBy, setSortBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [propiedadFormulaEditando, setPropiedadFormulaEditando] = useState(null); // Para saber qué propiedad estamos editando
  const [showMenuConfig, setShowMenuConfig] = useState(false);
  const [showSprintStatsModal, setShowSprintStatsModal] = useState(false);
  const [showDeleteColumnModal, setShowDeleteColumnModal] = useState(false);
  const [columnaAEliminar, setColumnaAEliminar] = useState(null);
  const [showDeleteRowModal, setShowDeleteRowModal] = useState(false);
  const [filaAEliminar, setFilaAEliminar] = useState(null);
  const [sprintInfo, setSprintInfo] = useState(null);
  const [showPropertyVisibilityModal, setShowPropertyVisibilityModal] = useState(false);
  const [esNuevoCampo, setEsNuevoCampo] = useState(false); // Para saber si es un nuevo campo o uno existente
  const [showEjemploModal, setShowEjemploModal] = useState(false);
  const [tagsEditando, setTagsEditando] = useState({ filaIndex: null, propName: null, tags: [] });
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showIconPickerModal, setShowIconPickerModal] = useState(false);
  const [filaIndexParaIcono, setFilaIndexParaIcono] = useState(null);
  const [showColumnasSugeridasModal, setShowColumnasSugeridasModal] = useState(false);
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState([]);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textEditing, setTextEditing] = useState({ filaIndex: null, propName: null, value: "" });
  const [showNumericModal, setShowNumericModal] = useState(false);
  const [numericEditing, setNumericEditing] = useState(null);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [abonoEditing, setAbonoEditing] = useState(null);
  const [showDiasNoTrabajadosModal, setShowDiasNoTrabajadosModal] = useState(false);
  const [showDeleteTableModal, setShowDeleteTableModal] = useState(false);
  const [showPlantillasModal, setShowPlantillasModal] = useState(false);
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [showGraficasModal, setShowGraficasModal] = useState(false);
  const [showEditNombreModal, setShowEditNombreModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Estado para controlar si la tabla usa todo el ancho
  const [usarAnchoCompleto, setUsarAnchoCompleto] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-table-fullwidth');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  
  // Estado para controlar si la tabla está colapsada
  const [tablaColapsada, setTablaColapsada] = useState(false);
  
  // Estado para el tipo de vista (table, kanban, timeline, gallery)
  const [tipoVista, setTipoVista] = useState(() => {
    try {
      // Guardar preferencia por tabla usando tableId
      const key = tableId ? `notion-table-view-type-${tableId}` : 'notion-table-view-type';
      const saved = localStorage.getItem(key);
      return saved || 'table';
    } catch {
      return 'table';
    }
  });
  
  // Guardar preferencia cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem('notion-table-fullwidth', usarAnchoCompleto.toString());
    } catch (error) {
      // Error guardando preferencia de ancho
    }
  }, [usarAnchoCompleto]);

  // Guardar preferencia de tipo de vista (por tabla)
  useEffect(() => {
    try {
      const key = tableId ? `notion-table-view-type-${tableId}` : 'notion-table-view-type';
      localStorage.setItem(key, tipoVista);
    } catch (error) {
      // Error guardando preferencia de vista
    }
  }, [tipoVista, tableId]);

  // Función para procesar un abono a deuda
  const procesarAbono = async () => {
    if (!abonoEditing || !abonoEditing.value) return;
    
    const montoAbono = parseFloat(abonoEditing.value.replace(',', '.')) || 0;
    if (montoAbono <= 0) return;
    
    if (montoAbono > abonoEditing.deudaActual) {
      alert('El monto del abono no puede ser mayor que la deuda actual');
      return;
    }
    
    // 1. Restar el abono de la deuda actual y guardar en historial
    const nuevaDeuda = abonoEditing.deudaActual - montoAbono;
    
    // Guardar el abono en el historial de la fila
    const filaActual = filas[abonoEditing.filaIndex];
    const abonosHistorial = filaActual.abonos || [];
    const nuevoAbono = {
      monto: montoAbono,
      fecha: abonoEditing.fecha || new Date().toISOString().split('T')[0],
      descripcion: abonoEditing.descripcion || "",
      fechaCreacion: new Date().toISOString()
    };
    abonosHistorial.push(nuevoAbono);
    
    // Actualizar la fila con el nuevo abono y la nueva deuda
    const filasActualizadas = filas.map((fila, idx) => {
      if (idx === abonoEditing.filaIndex) {
        return {
          ...fila,
          abonos: abonosHistorial,
          properties: {
            ...fila.properties,
            Deudas: {
              ...fila.properties.Deudas,
              value: nuevaDeuda.toString()
            }
          }
        };
      }
      return fila;
    });
    setFilas(filasActualizadas);
    updateAttributes({ filas: filasActualizadas });
    
    // 2. Crear un egreso automáticamente en la tabla de Egresos
    const paginaId = PageContext.getCurrentPageId();
    if (paginaId && editor) {
      try {
        // Buscar la tabla de Egresos en el editor
        const todasLasTablas = TableRegistryService.getTablesByPage(paginaId);
        const tablaEgresos = todasLasTablas.find(t => 
          t.comportamiento === 'financiero' && t.nombre === 'Egresos'
        );
        
        if (tablaEgresos) {
          // Buscar el nodo de la tabla de Egresos en el editor
          const transaction = editor.state.tr;
          let tablaEgresosNode = null;
          let tablaEgresosPos = null;
          
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'tablaNotion' && node.attrs.tableId === tablaEgresos.tableId) {
              tablaEgresosNode = node;
              tablaEgresosPos = pos;
              return false;
            }
          });
          
          if (tablaEgresosNode && tablaEgresosPos !== null) {
            // Obtener las filas y propiedades actuales
            const filasEgresos = [...(tablaEgresosNode.attrs.filas || [])];
            const propiedadesEgresos = tablaEgresosNode.attrs.propiedades || [];
            
            // Crear nueva fila de egreso
            const nuevaFilaEgreso = {
              Name: `Abono a: ${abonoEditing.nombreDeuda}`,
              image: null,
              imageFilename: null,
              properties: {}
            };
            
            // Inicializar propiedades
            propiedadesEgresos.forEach((prop) => {
              let defaultValue = prop.type === "checkbox" ? false : prop.type === "tags" ? [] : "";
              nuevaFilaEgreso.properties[prop.name] = {
                type: prop.type,
                value: defaultValue,
                color: prop.type === "select" ? "#3b82f6" : undefined,
                formula: prop.type === "formula" ? "" : undefined,
              };
            });
            
            // Establecer el valor del egreso
            if (nuevaFilaEgreso.properties['Egresos']) {
              nuevaFilaEgreso.properties['Egresos'].value = montoAbono.toString();
            }
            
            // Establecer descripción si existe
            if (nuevaFilaEgreso.properties['Descripción']) {
              const descripcionAbono = abonoEditing.descripcion 
                ? `Abono a deuda: ${abonoEditing.nombreDeuda} - ${abonoEditing.descripcion}`
                : `Abono a deuda: ${abonoEditing.nombreDeuda}`;
              nuevaFilaEgreso.properties['Descripción'].value = descripcionAbono;
            }
            
            // Establecer fecha si existe
            if (nuevaFilaEgreso.properties['Fecha Movimiento']) {
              nuevaFilaEgreso.properties['Fecha Movimiento'].value = abonoEditing.fecha || new Date().toISOString().split('T')[0];
            }
            
            // Agregar la nueva fila
            filasEgresos.push(nuevaFilaEgreso);
            
            // Actualizar el nodo
            const newAttrs = {
              ...tablaEgresosNode.attrs,
              filas: filasEgresos
            };
            
            transaction.setNodeMarkup(tablaEgresosPos, null, newAttrs);
            editor.view.dispatch(transaction);
            
            // Disparar evento para actualizar el resumen financiero
            window.dispatchEvent(new CustomEvent('tablaActualizada', {
              detail: { tableId: tablaEgresos.tableId }
            }));
          }
        }
      } catch (error) {
        // Error al crear egreso automático
      }
    }
    
    // Cerrar modal
    setShowAbonoModal(false);
    setAbonoEditing(null);
    
    // Disparar evento para actualizar esta tabla también
    window.dispatchEvent(new CustomEvent('tablaActualizada', {
      detail: { tableId }
    }));
  };

  const actualizarValor = (filaIdx, key, valor) => {
    const nuevas = filas.map((fila, idx) => {
      if (idx === filaIdx) {
        // Obtener el tipo de la propiedad
        const prop = propiedades.find(p => p.name === key);
        const tipo = prop?.type || "text";
        
        const updatedFila = {
          ...fila,
          properties: {
            ...fila.properties,
            [key]: {
              type: tipo,
              ...fila.properties[key],
              value: valor
            }
          }
        };

        // Sincronizar Name: si se actualiza la propiedad "Name", actualizar también Name en nivel superior
        if (key === "Name" || key.toLowerCase() === "name") {
          if (valor && typeof valor === 'string' && valor.length > 0) {
            updatedFila.Name = valor;
          } else if (Array.isArray(valor) && valor.length > 0) {
            updatedFila.Name = valor[0]?.label || valor[0]?.value || valor[0] || "Nueva tarea";
          } else {
            updatedFila.Name = "Nueva tarea";
          }
        }
        
        // Si la columna actualizada es "Concepto" y es de tipo select, actualizar el "Name"
        if (key === "Concepto" && prop?.type === "select") {
          if (valor && typeof valor === 'string' && valor.length > 0) {
            updatedFila.Name = valor;
          } else if (Array.isArray(valor) && valor.length > 0) {
            updatedFila.Name = valor[0]?.label || valor[0]?.value || valor[0] || "Nueva tarea";
          } else {
            updatedFila.Name = "Nueva tarea";
          }
        }
        
        // Si se actualiza Name en nivel superior, sincronizar con properties.Name
        if (updatedFila.Name && (!updatedFila.properties.Name || updatedFila.properties.Name.value !== updatedFila.Name)) {
          updatedFila.properties.Name = {
            type: 'text',
            ...updatedFila.properties.Name,
            value: updatedFila.Name
          };
        }
        
        return updatedFila;
      }
      return fila;
    });
    setFilas(nuevas);
  };

  // Función para obtener el ancho de una columna (usando el guardado o el default)
  const obtenerAnchoColumna = (prop) => {
    // Si tiene ancho personalizado guardado, usarlo
    if (prop.width) {
      return prop.width;
    }
    
    // Sino, usar el ancho por defecto según el tipo
    if (prop.type === "checkbox") {
      return '50px';
    } else if (prop.type === "number" || prop.type === "percent") {
      return '120px';
    } else if (prop.type === "date") {
      return '140px';
    } else if (prop.type === "formula") {
      return '130px';
    } else if (prop.type === "tags") {
      return '180px';
    } else if (prop.type === "select") {
      return '140px';
    } else {
      return '150px';
    }
  };

  // Función para actualizar el ancho de una columna
  const actualizarAnchoColumna = (propName, nuevoAncho) => {
    const nuevasPropiedades = propiedades.map(p => {
      if (p.name === propName) {
        return { ...p, width: nuevoAncho };
      }
      return p;
    });
    setPropiedades(nuevasPropiedades);
  };

  // Función para iniciar redimensionamiento de columna
  const iniciarRedimensionamiento = (e, propName, anchoActual) => {
    e.preventDefault();
    e.stopPropagation();
    
    const inicioX = e.clientX;
    const anchoInicial = parseInt(anchoActual, 10);
    
    const mover = (moveEvent) => {
      const deltaX = moveEvent.clientX - inicioX;
      const nuevoAncho = Math.max(80, anchoInicial + deltaX); // Mínimo 80px
      actualizarAnchoColumna(propName, `${nuevoAncho}px`);
    };
    
    const detener = () => {
      document.removeEventListener('mousemove', mover);
      document.removeEventListener('mouseup', detener);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', mover);
    document.addEventListener('mouseup', detener);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const agregarFila = () => {
    const nuevaFila = {
      Name: "Nueva tarea",
      image: null, // Imagen de la fila (URL o filename)
      imageFilename: null, // Nombre del archivo guardado
      properties: {},
    };

    propiedades.forEach((prop) => {
      let defaultValue = prop.type === "checkbox" ? false : 
                        prop.type === "tags" ? [] : 
                        prop.type === "formula" ? "" : 
                        prop.type === "number" || prop.type === "percent" ? 0 :
                        prop.type === "date" ? new Date().toISOString().split('T')[0] : "";
      let defaultColor = undefined;
      
      // Valores por defecto para Priority
      if (prop.name === "Priority" && prop.type === "tags") {
        defaultValue = [{ label: "Medium", color: "#fbbf24" }]; // Amarillo por defecto
      }
      
      // Valores por defecto para Type
      if (prop.name === "Type" && prop.type === "tags") {
        defaultValue = [{ label: "TO DO", color: "#6b7280" }]; // Gris por defecto
      }
      
      nuevaFila.properties[prop.name] = {
        type: prop.type,
        value: defaultValue,
        color: prop.type === "select" ? "#3b82f6" : defaultColor,
        formula: prop.type === "formula" ? (prop.formula || "") : undefined,
      };
    });

    const nuevasFilas = [...filas, nuevaFila];
    setFilas(nuevasFilas);
    
    // Guardar inmediatamente para que se persista en el JSON de la página
    guardarFilas(nuevasFilas);
  };

  // Obtener el nivel de anidamiento actual
  const getDrawerNestingLevel = () => {
    // Contar cuántos drawers y modales están abiertos actualmente
    // Esto incluye tanto drawers laterales como modales de pantalla completa
    const openDrawers = document.querySelectorAll('[data-drawer="table-drawer"], [data-drawer="table-drawer-modal"]');
    return openDrawers.length;
  };

  // Calcular z-index dinámico basado en el nivel de anidamiento
  // Cada nivel aumenta el z-index para asegurar que los modales más recientes estén siempre arriba
  const getModalZIndex = (level) => {
    // Base z-index para modales: 10000
    // Cada nivel adicional suma 1000 para asegurar que esté por encima
    return 10000 + (level * 1000);
  };

  const abrirDrawer = (fila) => {
    const index = filas.findIndex((f) => f === fila);
    // Calcular z-index basado en el nivel de anidamiento actual
    const currentLevel = getDrawerNestingLevel();
    
    // Usar setTimeout para asegurar que todos los setState se ejecuten fuera del ciclo de renderizado
    // Esto evita el error "Cannot update a component while rendering a different component"
    setTimeout(() => {
      // Si ya hay algún drawer o modal abierto (nivel >= 1), usar modal de pantalla completa
      // Esto evita que quede "abajo" del drawer anterior y asegura que todo lo que se abra
      // desde dentro de una página de descripción sea un modal de pantalla completa
      // Nivel 0 = página principal (sin drawer), Nivel 1 = primer drawer, Nivel 2+ = modales de pantalla completa
      if (currentLevel >= 1) {
        setUseFullScreenModal(true);
        // Calcular z-index dinámico basado en el nivel de anidamiento
        // Esto asegura que cada modal esté por encima del anterior
        const modalZIndex = getModalZIndex(currentLevel);
        setDrawerZIndex(modalZIndex); // El overlay será drawerZIndex y el contenido drawerZIndex + 1
      } else {
        setUseFullScreenModal(false);
        setDrawerZIndex(100);
      }
      
      setFilaSeleccionada(index);
      setShowDrawer(true);
      drawerNestingLevel = currentLevel;
    }, 0);
  };

  // Función para guardar valor numérico desde el modal
  const handleGuardarValorNumerico = () => {
    if (!numericEditing) return;
    
    // Convertir el valor a número (manejar comas como separador decimal)
    const valorString = numericEditing.value.replace(',', '.');
    const valorNumerico = parseFloat(valorString) || 0;
    
    // Calcular las nuevas filas con el valor actualizado
    const nuevasFilas = filas.map((fila, idx) => {
      if (idx === numericEditing.filaIndex) {
        const prop = propiedades.find(p => p.name === numericEditing.propName);
        const tipo = prop?.type || "number";
        
        // Asegurar que la propiedad existe
        const propiedadActual = fila.properties?.[numericEditing.propName] || {};
        
        return {
          ...fila,
          properties: {
            ...fila.properties,
            [numericEditing.propName]: {
              type: tipo,
              ...propiedadActual,
              value: valorNumerico
            }
          }
        };
      }
      return fila;
    });
    
    // Actualizar el estado
    setFilas(nuevasFilas);
    
    // Guardar inmediatamente usando updateAttributes (esto guarda en el JSON de la página)
    // updateAttributes actualiza el nodo en Tiptap, que luego se serializa cuando se guarda la página
    updateAttributes({ filas: nuevasFilas });
    
    // Disparar evento para actualizar gráficas
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tablaActualizada', {
        detail: { tableId }
      }));
    }, 100);
    
    setShowNumericModal(false);
    setNumericEditing(null);
  };

  const guardarFilas = (filasAGuardar) => {
    // Asegurar que el último contenido de la descripción esté guardado
    let filasParaGuardar = [...filasAGuardar];
    if (filaSeleccionada !== null && ultimoContenidoDescripcionRef.current !== null && filasParaGuardar[filaSeleccionada]) {
      filasParaGuardar[filaSeleccionada].descripcion = ultimoContenidoDescripcionRef.current;
    }
    
    // Actualizar el estado primero
    setTimeout(() => {
      setFilas(filasParaGuardar);
    }, 0);
    
    // Actualizar los atributos del nodo con las nuevas filas (esto guarda en el JSON de la página)
    updateAttributes({ filas: filasParaGuardar });
    
    // Mostrar mensaje de confirmación
    // Usar setTimeout para asegurar que el estado se actualice correctamente
    setTimeout(() => {
      setToast({
        message: 'Cambios guardados correctamente',
        type: 'success',
        duration: 2000
      });
    }, 100);
  };

  const cerrarDrawer = () => {
    // Ejecutar inmediatamente el guardado pendiente si hay uno
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Asegurar que el último contenido de la descripción esté guardado
    let filasParaGuardar = [...filas];
    if (filaSeleccionada !== null && ultimoContenidoDescripcionRef.current !== null) {
      filasParaGuardar[filaSeleccionada].descripcion = ultimoContenidoDescripcionRef.current;
      // Actualizar el estado de forma asíncrona para evitar errores de renderizado
      setTimeout(() => {
        setFilas(filasParaGuardar);
      }, 0);
    }
    
    // Guardar antes de cerrar (asegurar que todos los cambios se guarden, incluyendo bloques de código)
    // Usar setTimeout para asegurar que se ejecute fuera del ciclo de renderizado
    setTimeout(() => {
      guardarFilas(filasParaGuardar);
    }, 0);
    
    // Limpiar el ref
    ultimoContenidoDescripcionRef.current = null;
    
    // Los datos se guardan automáticamente en el nodo del editor
    // No necesitamos Firebase, se guarda en el contenido del editor
    // Actualizar el estado de forma asíncrona para evitar errores de renderizado
    setTimeout(() => {
      setShowDrawer(false);
      setFilaSeleccionada(null);
    }, 0);
    setDrawerExpandido(false); // Resetear el estado de expansión al cerrar
    // Actualizar el nivel de anidamiento después de cerrar
    setTimeout(() => {
      drawerNestingLevel = getDrawerNestingLevel();
    }, 100);
  };

  // Función para detectar si la tabla es de tipo Scrum (usa comportamiento guardado o detecta por campos)
  const esTablaScrum = () => {
    // Si hay comportamiento guardado, usarlo
    if (comportamiento === 'scrum') return true;
    if (comportamiento === 'financiero') return false;
    
    // Si no hay comportamiento guardado, detectar por campos (compatibilidad hacia atrás)
    const camposScrum = [
      "Puntos de Historia", "puntos de historia", "Story Points",
      "Time Estimated", "Time Spent", "Progress", "Type", "Priority",
      "Tasks Completed", "Total Tasks", "Sprint Days"
    ];
    return propiedades.some(prop => 
      camposScrum.some(campo => prop.name === campo)
    );
  };

  // Función para detectar si la tabla es financiera (usa comportamiento guardado o detecta por campos)
  const esTablaFinanciera = () => {
    // Si hay comportamiento guardado, usarlo
    if (comportamiento === 'financiero') return true;
    if (comportamiento === 'scrum') return false;
    
    // Si no hay comportamiento guardado, detectar por campos (compatibilidad hacia atrás)
    return propiedades.some(prop => 
      prop.name === "Ingresos" || prop.name === "Egresos" || prop.name === "Deudas"
    );
  };

  // Función para obtener columnas Scrum
  const obtenerColumnasScrum = () => {
    return [
      // Campos principales visibles
      { name: "Priority", type: "tags", visible: true, descripcion: "Prioridad de la tarea (Critical, Medium, Low)" },
      { name: "Type", type: "tags", visible: true, descripcion: "Estado de la tarea (TO DO, IN PROGRESS, DONE, etc.)" },
      { name: "Percent", type: "formula", visible: true, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))', descripcion: "Porcentaje de progreso visual" },
      { name: "Percent Total", type: "formula", visible: true, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")', descripcion: "Porcentaje de tiempo usado vs estimado" },
      { name: "Progress", type: "number", visible: true, descripcion: "Progreso actual de la tarea (0-100)" },
      { name: "Objective", type: "number", visible: false, descripcion: "Meta u objetivo total (normalmente 100)" },
      // Campos de tiempo
      { name: "Time Spent", type: "number", visible: false, descripcion: "Tiempo gastado en horas" },
      { name: "Time Estimated", type: "number", visible: false, descripcion: "Tiempo estimado en horas" },
      { name: "Current Date", type: "date", visible: false, descripcion: "Fecha actual" },
      { name: "Created", type: "date", visible: false, descripcion: "Fecha de creación" },
      { name: "Expiration date", type: "date", visible: false, descripcion: "Fecha de expiración" },
      // Campos calculados y fórmulas
      { name: "Progreso", type: "formula", visible: false, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))', descripcion: "Porcentaje de progreso (alternativa)" },
      { name: "missing percentage", type: "formula", visible: false, formula: 'if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%"))', descripcion: "Porcentaje faltante (solo si no está DONE)" },
      { name: "Tiempo Restante", type: "formula", visible: false, formula: 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))', descripcion: "Tiempo restante en horas" },
      { name: "Porcentaje Tiempo", type: "formula", visible: false, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") / prop("Time Estimated")) * 100)) + "%", "0%")', descripcion: "Porcentaje de tiempo usado" },
      // Campos de días y horas
      { name: "Days Worked", type: "number", visible: false, descripcion: "Días trabajados" },
      { name: "Days Elapsed", type: "number", visible: false, descripcion: "Días transcurridos" },
      { name: "Sprint Days", type: "number", visible: false, descripcion: "Días del sprint" },
      { name: "Horas Diarias", type: "number", visible: false, descripcion: "Horas trabajadas por día" },
      { name: "Horas Totales Sprint", type: "number", visible: false, descripcion: "Horas totales del sprint" },
      { name: "Dias Habiles Transcurridos", type: "number", visible: false, descripcion: "Días hábiles transcurridos" },
      { name: "Horas Disponibles", type: "formula", visible: false, formula: 'prop("Dias Habiles Transcurridos") * prop("Horas Diarias")', descripcion: "Horas disponibles calculadas" },
      { name: "Sobrecarga", type: "formula", visible: false, formula: 'if((prop("Time Estimated") > prop("Horas Disponibles")), "⚠️ Sobrecarga", "✅ OK")', descripcion: "Indicador de sobrecarga de trabajo" },
      { name: "Dias Transcurridos Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("Sprint Start Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) >= date(prop("Sprint Start Date"))), floor((date(prop("Current Date")) - date(prop("Sprint Start Date"))) / 86400000) + 1, 0), 0)', descripcion: "Días transcurridos desde inicio del sprint" },
      { name: "Dias Faltantes Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("Sprint End Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) <= date(prop("Sprint End Date"))), floor((date(prop("Sprint End Date")) - date(prop("Current Date"))) / 86400000), 0), 0)', descripcion: "Días faltantes hasta fin del sprint" },
      // Campos de tareas
      { name: "Tasks Completed", type: "number", visible: false, descripcion: "Número de subtareas completadas" },
      { name: "Total Tasks", type: "number", visible: false, descripcion: "Número total de subtareas" },
      { name: "Tasa Completitud", type: "formula", visible: false, formula: 'if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")', descripcion: "Porcentaje de subtareas completadas" },
      // Campos de puntos de historia
      { name: "Total Puntos Sprint", type: "formula", visible: false, formula: 'suma(prop("Puntos de Historia"))', descripcion: "Suma total de puntos de historia de todas las tareas" },
      { name: "Porcentaje Puntos Completados", type: "formula", visible: false, formula: 'if(and(!empty(prop("Puntos Totales Sprint")), prop("Puntos Totales Sprint") > 0), format(round((suma(prop("Puntos de Historia")) / prop("Puntos Totales Sprint")) * 100)) + "%", "N/A")', descripcion: "Porcentaje de puntos completados vs objetivo" },
      { name: "Validación Puntos Sprint", type: "formula", visible: true, formula: 'if(empty(prop("Puntos Totales Sprint")), "⚪ Sin objetivo", if(and(prop("Puntos Totales Sprint") >= 3, prop("Puntos Totales Sprint") <= 8), "✅ Bien definido (3-8)", if(prop("Puntos Totales Sprint") > 8, "⚠️ Considerar dividir (>8)", "📊 Muy pequeño (<3)")))', descripcion: "Validación de puntos del sprint (Fibonacci recomendado 3-8)" },
      // Campos de estado y tags
      { name: "Estado", type: "select", visible: false, descripcion: "Estado de la tarea (select)" },
      { name: "Tags", type: "tags", visible: false, descripcion: "Etiquetas adicionales" },
      { name: "tag", type: "tags", visible: false, descripcion: "Etiquetas (alias)" },
      { name: "Assign", type: "tags", visible: false, descripcion: "Personas asignadas" },
      { name: "Done", type: "checkbox", visible: false, descripcion: "Tarea completada" },
      // Campos adicionales
      { name: "Link", type: "text", visible: false, descripcion: "Enlace relacionado" },
      { name: "Retrospective", type: "text", visible: false, descripcion: "Notas de retrospectiva" },
      { name: "Video", type: "text", visible: false, descripcion: "Enlace o referencia a video" },
      { name: "video", type: "text", visible: false, descripcion: "Video (alias)" },
      { name: "Lambdas", type: "text", visible: false, descripcion: "Referencias a lambdas" },
      { name: "NameRepo", type: "text", visible: false, descripcion: "Nombre del repositorio" },
      { name: "Property", type: "text", visible: false, descripcion: "Propiedad adicional" },
      { name: "to", type: "text", visible: false, descripcion: "Campo 'to' adicional" },
      // Campos de gestión ágil
      { name: "area", type: "select", visible: false, descripcion: "Área de trabajo" },
      { name: "epica", type: "select", visible: false, descripcion: "Épica relacionada" },
      { name: "iteracion", type: "text", visible: false, descripcion: "Iteración o sprint" },
      { name: "Puntos de Historia", type: "number", visible: true, descripcion: "Puntos de historia (Fibonacci: 1, 2, 3, 5, 8, 13, 21...)" },
      { name: "puntos de historia", type: "number", visible: false, descripcion: "Puntos de historia (alias)" },
      { name: "Story Points", type: "number", visible: false, descripcion: "Puntos de historia (alias en inglés)" },
      { name: "release", type: "text", visible: false, descripcion: "Release o versión" },
    ];
  };

  // Función para obtener columnas financieras
  const obtenerColumnasFinancieras = () => {
    return [
      // Campos financieros principales
      { name: "Persona", type: "tags", visible: true, descripcion: "Persona relacionada con el movimiento financiero" },
      { name: "Ingresos", type: "number", visible: true, totalizar: true, descripcion: "Monto de ingresos" },
      { name: "Egresos", type: "number", visible: true, totalizar: true, descripcion: "Monto de egresos" },
      { name: "Deudas", type: "number", visible: true, totalizar: true, descripcion: "Monto de deudas" },
      { name: "Fecha Movimiento", type: "date", visible: true, descripcion: "Fecha del movimiento financiero" },
      { name: "Categoría", type: "tags", visible: false, descripcion: "Categoría del movimiento financiero" },
      { name: "Descripción", type: "text", visible: true, descripcion: "Descripción del movimiento (opcional)" },
      // Fórmulas financieras
      { name: "Saldo", type: "formula", visible: true, formula: 'prop("Ingresos") - prop("Egresos")', descripcion: "Saldo calculado (Ingresos - Egresos)" },
      { name: "Total Ingresos", type: "formula", visible: false, formula: 'suma(prop("Ingresos"))', descripcion: "Suma total de todos los ingresos" },
      { name: "Total Egresos", type: "formula", visible: false, formula: 'suma(prop("Egresos"))', descripcion: "Suma total de todos los egresos" },
      { name: "Total Deudas", type: "formula", visible: false, formula: 'suma(prop("Deudas"))', descripcion: "Suma total de todas las deudas" },
      { name: "Saldo Total", type: "formula", visible: false, formula: 'suma(prop("Ingresos")) - suma(prop("Egresos"))', descripcion: "Saldo total (Total Ingresos - Total Egresos)" },
      { name: "Balance", type: "formula", visible: false, formula: 'if(((suma(prop("Ingresos")) - suma(prop("Egresos"))) > 0), "✅ Positivo", if(((suma(prop("Ingresos")) - suma(prop("Egresos"))) < 0), "⚠️ Negativo", "⚪ Neutro"))', descripcion: "Estado del balance (Positivo/Negativo/Neutro)" },
      { name: "Porcentaje Egresos", type: "formula", visible: false, formula: 'if((suma(prop("Ingresos")) > 0), format(round((suma(prop("Egresos")) * 100) / suma(prop("Ingresos")))) + "%", "0%")', descripcion: "Porcentaje de egresos sobre ingresos" },
      { name: "Porcentaje Deudas", type: "formula", visible: false, formula: 'if((suma(prop("Ingresos")) > 0), format(round((suma(prop("Deudas")) * 100) / suma(prop("Ingresos")))) + "%", "0%")', descripcion: "Porcentaje de deudas sobre ingresos" },
    ];
  };

  // Función para obtener las columnas sugeridas (filtradas según el comportamiento)
  const obtenerColumnasSugeridas = () => {
    // Si no hay comportamiento (no se ha aplicado plantilla), retornar array vacío
    if (!comportamiento) {
      return [];
    }
    
    const columnasScrum = obtenerColumnasScrum();
    const columnasFinancieras = obtenerColumnasFinancieras();
    
    // Si hay comportamiento guardado, usar ese
    if (comportamiento === 'scrum') {
      return columnasScrum;
    }
    
    if (comportamiento === 'financiero') {
      return columnasFinancieras;
    }
    
    // Si es mixto, devolver todas las columnas
    if (comportamiento === 'mixto') {
      return [...columnasScrum, ...columnasFinancieras];
    }
    
    return [];
  };

  // Función para agregar columnas seleccionadas
  const agregarColumnasSeleccionadas = () => {
    const columnasSugeridas = obtenerColumnasSugeridas();
    const columnasAAgregar = columnasSugeridas.filter((_, index) => columnasSeleccionadas.includes(index));
    
    if (columnasAAgregar.length === 0) {
      alert('Por favor selecciona al menos una columna para agregar.');
      return;
    }

    const camposExistentes = propiedades.map(p => p.name);
    const nuevasColumnas = columnasAAgregar.filter(col => !camposExistentes.includes(col.name));
    
    if (nuevasColumnas.length === 0) {
      alert('Todas las columnas seleccionadas ya existen en la tabla.');
      setShowColumnasSugeridasModal(false);
      setColumnasSeleccionadas([]);
      return;
    }

    // Detectar si las columnas agregadas son de Scrum o Financieras para establecer comportamiento
    const columnasScrum = obtenerColumnasScrum();
    const columnasFinancieras = obtenerColumnasFinancieras();
    
    const tieneColumnasScrum = nuevasColumnas.some(col => 
      columnasScrum.some(cs => cs.name === col.name)
    );
    const tieneColumnasFinancieras = nuevasColumnas.some(col => 
      columnasFinancieras.some(cf => cf.name === col.name)
    );
    
    // Establecer comportamiento si no está definido
    let nuevoComportamiento = comportamiento;
    if (!comportamiento) {
      if (tieneColumnasScrum && !tieneColumnasFinancieras) {
        nuevoComportamiento = 'scrum';
      } else if (tieneColumnasFinancieras && !tieneColumnasScrum) {
        nuevoComportamiento = 'financiero';
      } else if (tieneColumnasScrum && tieneColumnasFinancieras) {
        nuevoComportamiento = 'mixto';
      }
    } else if (comportamiento === 'scrum' && tieneColumnasFinancieras) {
      nuevoComportamiento = 'mixto';
    } else if (comportamiento === 'financiero' && tieneColumnasScrum) {
      nuevoComportamiento = 'mixto';
    }

    // Agregar las nuevas columnas a las propiedades
    const nuevasPropiedades = [...propiedades];
    nuevasColumnas.forEach(columna => {
      nuevasPropiedades.push({
        name: columna.name,
        type: columna.type,
        visible: columna.visible !== undefined ? columna.visible : true,
        totalizar: columna.type === "number" && (columna.name === "Time Spent" || columna.name === "Tasks Completed") ? true : false,
        formula: columna.formula || undefined
      });
    });

    setPropiedades(nuevasPropiedades);
    
    // Actualizar comportamiento si cambió
    if (nuevoComportamiento !== comportamiento) {
      setComportamiento(nuevoComportamiento);
    }

    // Agregar las nuevas columnas a todas las filas existentes
    const nuevasFilas = filas.map((fila) => {
      const nuevasProperties = { ...fila.properties };
      nuevasColumnas.forEach(columna => {
        let defaultValue = columna.type === "checkbox" ? false : columna.type === "tags" ? [] : columna.type === "formula" ? "" : columna.type === "date" ? "" : "";
        let defaultColor = undefined;
        
        // Valores por defecto para Priority
        if (columna.name === "Priority" && columna.type === "tags") {
          defaultValue = [{ label: "Medium", color: "#fbbf24" }];
        }
        
        // Valores por defecto para Type
        if (columna.name === "Type" && columna.type === "tags") {
          defaultValue = [{ label: "TO DO", color: "#6b7280" }];
        }

        // Valor por defecto para Objective
        if (columna.name === "Objective" && columna.type === "number") {
          defaultValue = 100;
        }
        
        nuevasProperties[columna.name] = {
          type: columna.type,
          value: defaultValue,
          color: columna.type === "select" ? "#3b82f6" : defaultColor,
          formula: columna.formula || undefined,
        };
      });
      return {
        ...fila,
        properties: nuevasProperties,
      };
    });

    setFilas(nuevasFilas);
    
    alert(`✅ Se agregaron ${nuevasColumnas.length} columnas nuevas.`);
    setShowColumnasSugeridasModal(false);
    setColumnasSeleccionadas([]);
  };

  // Función para aplicar una plantilla
  // Función para obtener nombre por defecto según tipo de plantilla
  const obtenerNombrePorPlantilla = (tipoPlantilla) => {
    const nombresMap = {
      'scrum': 'Scrum Sprint',
      'ingresos': 'Ingresos',
      'egresos': 'Egresos',
      'deuda': 'Deudas',
      'personalizada': null
    };
    return nombresMap[tipoPlantilla] || null;
  };

  const aplicarPlantilla = (tipoPlantilla) => {
    let columnasAAgregar = [];
    let nuevoComportamiento = null;
    let nuevoNombre = null;

    switch (tipoPlantilla) {
      case 'scrum':
        columnasAAgregar = obtenerColumnasScrum();
        nuevoComportamiento = 'scrum';
        nuevoNombre = obtenerNombrePorPlantilla('scrum');
        break;
      case 'ingresos':
        columnasAAgregar = [
          ...obtenerColumnasFinancieras().filter(col => 
            col.name === "Persona" || col.name === "Ingresos" || col.name === "Fecha Movimiento" || 
            col.name === "Descripción" || col.name === "Total Ingresos"
          ),
          { name: "Concepto", type: "select", visible: true, descripcion: "Concepto del ingreso" },
          { name: "Categoría", type: "tags", visible: true, descripcion: "Categoría del ingreso" }
        ];
        // Asegurar que Descripción esté visible y que Ingresos sea número con totalizar
        columnasAAgregar = columnasAAgregar.map(col => 
          col.name === "Ingresos" ? { ...col, type: "number", totalizar: true } :
          col.name === "Descripción" ? { ...col, visible: true } : col
        );
        nuevoComportamiento = 'financiero';
        nuevoNombre = obtenerNombrePorPlantilla('ingresos');
        break;
      case 'egresos':
        columnasAAgregar = [
          ...obtenerColumnasFinancieras().filter(col => 
            col.name === "Persona" || col.name === "Egresos" || col.name === "Fecha Movimiento" || 
            col.name === "Descripción" || col.name === "Total Egresos"
          ),
          { name: "Concepto", type: "select", visible: true, descripcion: "Concepto del egreso" },
          { name: "Categoría", type: "tags", visible: true, descripcion: "Categoría del egreso" }
        ];
        // Asegurar que Descripción esté visible y que Egresos sea número con totalizar
        columnasAAgregar = columnasAAgregar.map(col => 
          col.name === "Egresos" ? { ...col, type: "number", totalizar: true } :
          col.name === "Descripción" ? { ...col, visible: true } : col
        );
        nuevoComportamiento = 'financiero';
        nuevoNombre = obtenerNombrePorPlantilla('egresos');
        break;
      case 'deuda':
        columnasAAgregar = [
          ...obtenerColumnasFinancieras().filter(col => 
            col.name === "Persona" || col.name === "Deudas" || col.name === "Fecha Movimiento" || 
            col.name === "Descripción" || col.name === "Total Deudas" ||
            col.name === "Porcentaje Deudas"
          ),
          { name: "Concepto", type: "select", visible: true, descripcion: "Concepto de la deuda" },
          { name: "Categoría", type: "tags", visible: true, descripcion: "Categoría de la deuda" }
        ];
        // Asegurar que Descripción esté visible
        columnasAAgregar = columnasAAgregar.map(col => 
          col.name === "Descripción" ? { ...col, visible: true } : col
        );
        nuevoComportamiento = 'financiero';
        nuevoNombre = obtenerNombrePorPlantilla('deuda');
        break;
      case 'personalizada':
        // Plantilla personalizada no agrega columnas, solo cierra el modal
        setShowPlantillasModal(false);
        return;
      default:
        return;
    }

    // Filtrar columnas que ya existen
    const camposExistentes = propiedades.map(p => p.name);
    const nuevasColumnas = columnasAAgregar.filter(col => !camposExistentes.includes(col.name));

    if (nuevasColumnas.length === 0 && camposExistentes.length > 0) {
      alert('Todas las columnas de esta plantilla ya existen en la tabla.');
      setShowPlantillasModal(false);
      return;
    }

    // Agregar las nuevas columnas a las propiedades
    const nuevasPropiedades = [...propiedades];
    nuevasColumnas.forEach(columna => {
      nuevasPropiedades.push({
        name: columna.name,
        type: columna.type,
        visible: columna.visible !== undefined ? columna.visible : true,
        totalizar: columna.type === "number" && (columna.name === "Time Spent" || columna.name === "Tasks Completed") ? true : false,
        formula: columna.formula || undefined
      });
    });

    setPropiedades(nuevasPropiedades);
    setComportamiento(nuevoComportamiento);

    // Agregar las nuevas columnas a todas las filas existentes
    let nuevasFilas = filas.map((fila) => {
      const nuevasProperties = { ...fila.properties };
      nuevasColumnas.forEach(columna => {
        let defaultValue = columna.type === "checkbox" ? false : columna.type === "tags" ? [] : columna.type === "formula" ? "" : columna.type === "date" ? "" : "";
        let defaultColor = undefined;
        
        // Valores por defecto para Priority
        if (columna.name === "Priority" && columna.type === "tags") {
          defaultValue = [{ label: "Medium", color: "#fbbf24" }];
        }
        
        // Valores por defecto para Type
        if (columna.name === "Type" && columna.type === "tags") {
          defaultValue = [{ label: "TO DO", color: "#6b7280" }];
        }

        // Valor por defecto para Objective
        if (columna.name === "Objective" && columna.type === "number") {
          defaultValue = 100;
        }
        
        nuevasProperties[columna.name] = {
          type: columna.type,
          value: defaultValue,
          color: columna.type === "select" ? "#3b82f6" : defaultColor,
          formula: columna.formula || undefined,
        };
      });
      return {
        ...fila,
        properties: nuevasProperties,
      };
    });

    // Si es una plantilla financiera y no hay filas, agregar una fila por defecto
    if (nuevoComportamiento === 'financiero' && nuevasFilas.length === 0) {
      const nuevaFila = {
        Name: "Nueva tarea",
        image: null,
        imageFilename: null,
        properties: {},
      };

      // Inicializar propiedades con valores por defecto para todas las propiedades (existentes + nuevas)
      nuevasPropiedades.forEach((prop) => {
        let defaultValue = prop.type === "checkbox" ? false : prop.type === "tags" ? [] : prop.type === "formula" ? "" : "";
        let defaultColor = undefined;
        
        if (prop.type === "date") {
          defaultValue = new Date().toISOString().split('T')[0];
        }
        
        nuevaFila.properties[prop.name] = {
          type: prop.type,
          value: defaultValue,
          color: prop.type === "select" ? "#3b82f6" : defaultColor,
          formula: prop.type === "formula" ? (prop.formula || "") : undefined,
        };
      });

      nuevasFilas = [nuevaFila];
    }

    setFilas(nuevasFilas);
    setShowPlantillasModal(false);
  };

  // Función para obtener la fórmula por defecto según el nombre de la columna
  const obtenerFormulaPorDefecto = (nombreColumna) => {
    const nombreNormalizado = nombreColumna.trim().toLowerCase();
    
    // Primero verificar coincidencias exactas (solo para Objective/Objetivo)
    if (nombreNormalizado === 'objective' || nombreNormalizado === 'objetivo') {
      return 'if(empty(prop("Objective")), 100, prop("Objective"))';
    }
    
    // Mapeo de nombres comunes a sus fórmulas por defecto (coincidencias parciales)
    const formulasPorDefecto = {
      'percent': 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))',
      'percent total': 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")',
      'missing percentage': 'if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round(((prop("Time Estimated") - prop("Time Spent")) / prop("Time Estimated")) * 100)) + "%", "0%"))',
      'porcentaje': 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))',
      'porcentaje total': 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")',
      'porcentaje faltante': 'if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round(((prop("Time Estimated") - prop("Time Spent")) / prop("Time Estimated")) * 100)) + "%", "0%"))',
      'tiempo restante': 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))',
      'time remaining': 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))',
      'velocidad sprint': 'if(empty(prop("Sprint Days")), "N/A", format(round(prop("Tasks Completed") / prop("Sprint Days"), 2)))',
      'sprint velocity': 'if(empty(prop("Sprint Days")), "N/A", format(round(prop("Tasks Completed") / prop("Sprint Days"), 2)))',
      'progreso sprint': 'format(round((prop("Days Elapsed") / prop("Sprint Days")) * 100)) + "%"',
      'sprint progress': 'format(round((prop("Days Elapsed") / prop("Sprint Days")) * 100)) + "%"',
      'tareas restantes': 'prop("Total Tasks") - prop("Tasks Completed")',
      'tasks remaining': 'prop("Total Tasks") - prop("Tasks Completed")',
      'tasa completitud': 'format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%"',
      'completion rate': 'format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%"',
      'eficiencia': 'if(empty(prop("Time Estimated")), "N/A", format(round((prop("Objective") / prop("Time Estimated")) * 100, 1)))',
      'efficiency': 'if(empty(prop("Time Estimated")), "N/A", format(round((prop("Objective") / prop("Time Estimated")) * 100, 1)))',
      'dias transcurridos sprint': 'if(and(!empty(prop("Sprint Start Date")), !empty(prop("Current Date"))), calcularDiasHabiles(prop("Sprint Start Date"), prop("Current Date")), 0)',
      'dias transcurridos': 'if(and(!empty(prop("Sprint Start Date")), !empty(prop("Current Date"))), calcularDiasHabiles(prop("Sprint Start Date"), prop("Current Date")), 0)',
      'dias faltantes sprint': 'if(and(!empty(prop("Current Date")), !empty(prop("Sprint End Date"))), calcularDiasHabiles(prop("Current Date"), prop("Sprint End Date")), 0)',
      'dias faltantes': 'if(and(!empty(prop("Current Date")), !empty(prop("Sprint End Date"))), calcularDiasHabiles(prop("Current Date"), prop("Sprint End Date")), 0)',
      'dias habiles transcurridos': 'if(and(!empty(prop("Sprint Start Date")), !empty(prop("Current Date"))), calcularDiasHabiles(prop("Sprint Start Date"), prop("Current Date")), 0)',
      'horas disponibles': 'if(and(!empty(prop("Dias Habiles Transcurridos")), !empty(prop("Horas Diarias"))), prop("Dias Habiles Transcurridos") * prop("Horas Diarias"), 0)',
      'horas totales sprint': 'if(and(!empty(prop("Sprint Start Date")), !empty(prop("Sprint End Date")), !empty(prop("Horas Diarias"))), calcularDiasHabiles(prop("Sprint Start Date"), prop("Sprint End Date")) * prop("Horas Diarias"), 0)',
      'sobrecarga': 'if(and(!empty(prop("Time Estimated")), !empty(prop("Horas Disponibles"))), if((prop("Time Estimated") > prop("Horas Disponibles")), "⚠️ Sobrecarga", "✅ OK"), "N/A")',
      'sprint start date': 'prop("Sprint Start Date")',
      'sprint end date': 'prop("Sprint End Date")',
      'fecha inicio sprint': 'prop("Sprint Start Date")',
      'fecha fin sprint': 'prop("Sprint End Date")',
      'current date': 'prop("Current Date")',
      'fecha actual': 'prop("Current Date")',
    };
    
    // Buscar coincidencia parcial (pero no para Objective que ya se manejó arriba)
    for (const [key, formula] of Object.entries(formulasPorDefecto)) {
      if (nombreNormalizado.includes(key)) {
        return formula;
      }
    }
    
    return ""; // Si no hay coincidencia, retornar string vacío
  };

  // Función para crear automáticamente columnas de fórmula relacionadas con fechas y sprint
  const crearColumnasFormulaAutomaticas = (propiedadesActuales, nombreColumnaAgregada) => {
    const nombreNormalizado = nombreColumnaAgregada.trim().toLowerCase();
    const columnasFormulaAAgregar = [];
    
    // Detectar columnas base relacionadas con fechas y sprint
    const esFechaInicial = nombreNormalizado.includes('fecha inicial') || 
                           nombreNormalizado.includes('fecha inicio') || 
                           nombreNormalizado.includes('sprint start') ||
                           nombreNormalizado.includes('inicio sprint') ||
                           nombreNormalizado.includes('start date');
    
    const esFechaFinal = nombreNormalizado.includes('fecha final') || 
                        nombreNormalizado.includes('fecha fin') || 
                        nombreNormalizado.includes('sprint end') ||
                        nombreNormalizado.includes('fin sprint') ||
                        nombreNormalizado.includes('end date');
    
    const esFechaActual = nombreNormalizado.includes('fecha actual') || 
                          nombreNormalizado.includes('current date') ||
                          nombreNormalizado.includes('hoy');
    
    const esHorasDiarias = nombreNormalizado.includes('horas diarias') || 
                           nombreNormalizado.includes('horas por dia') ||
                           nombreNormalizado.includes('daily hours');
    
    const esDiasNoLaborales = nombreNormalizado.includes('dias no laborales') || 
                              nombreNormalizado.includes('dias no trabajados') ||
                              nombreNormalizado.includes('non working days');
    
    // Buscar las columnas base existentes (incluyendo la que acabamos de agregar)
    const todasLasPropiedades = [...propiedadesActuales];
    const fechaInicial = todasLasPropiedades.find(p => {
      const n = p.name.toLowerCase();
      return n.includes('fecha inicial') || n.includes('fecha inicio') || n.includes('sprint start') || n.includes('inicio sprint') || n.includes('start date');
    });
    
    const fechaFinal = todasLasPropiedades.find(p => {
      const n = p.name.toLowerCase();
      return n.includes('fecha final') || n.includes('fecha fin') || n.includes('sprint end') || n.includes('fin sprint') || n.includes('end date');
    });
    
    const fechaActual = todasLasPropiedades.find(p => {
      const n = p.name.toLowerCase();
      return n.includes('fecha actual') || n.includes('current date') || n.includes('hoy');
    });
    
    const horasDiarias = todasLasPropiedades.find(p => {
      const n = p.name.toLowerCase();
      return n.includes('horas diarias') || n.includes('horas por dia') || n.includes('daily hours');
    });
    
    // Si tenemos fecha inicial y fecha actual, crear "Dias Transcurridos"
    if (fechaInicial && fechaActual) {
      const existeDiasTranscurridos = todasLasPropiedades.find(p => 
        p.name.toLowerCase().includes('dias transcurridos') || p.name.toLowerCase().includes('dias habiles transcurridos')
      );
      if (!existeDiasTranscurridos) {
        columnasFormulaAAgregar.push({
          name: "Dias Transcurridos",
          type: "formula",
          formula: `if(and(!empty(prop("${fechaInicial.name}")), !empty(prop("${fechaActual.name}"))), calcularDiasHabiles(prop("${fechaInicial.name}"), prop("${fechaActual.name}")), 0)`,
          visible: false
        });
      }
    }
    
    // Si tenemos fecha actual y fecha final, crear "Dias Faltantes"
    if (fechaActual && fechaFinal) {
      const existeDiasFaltantes = todasLasPropiedades.find(p => 
        p.name.toLowerCase().includes('dias faltantes')
      );
      if (!existeDiasFaltantes) {
        columnasFormulaAAgregar.push({
          name: "Dias Faltantes",
          type: "formula",
          formula: `if(and(!empty(prop("${fechaActual.name}")), !empty(prop("${fechaFinal.name}"))), calcularDiasHabiles(prop("${fechaActual.name}"), prop("${fechaFinal.name}")), 0)`,
          visible: false
        });
      }
    }
    
    // Si tenemos fecha inicial y fecha final, crear "Dias Totales Sprint"
    if (fechaInicial && fechaFinal) {
      const existeDiasTotales = todasLasPropiedades.find(p => 
        p.name.toLowerCase().includes('dias totales') || p.name.toLowerCase().includes('dias habiles totales')
      );
      if (!existeDiasTotales) {
        columnasFormulaAAgregar.push({
          name: "Dias Totales Sprint",
          type: "formula",
          formula: `if(and(!empty(prop("${fechaInicial.name}")), !empty(prop("${fechaFinal.name}"))), calcularDiasHabiles(prop("${fechaInicial.name}"), prop("${fechaFinal.name}")), 0)`,
          visible: false
        });
      }
    }
    
    // Si tenemos "Dias Transcurridos" y "Horas Diarias", crear "Horas Disponibles"
    const diasTranscurridos = todasLasPropiedades.find(p => 
      p.name.toLowerCase().includes('dias transcurridos') || p.name.toLowerCase().includes('dias habiles transcurridos')
    );
    if (diasTranscurridos && horasDiarias) {
      const existeHorasDisponibles = todasLasPropiedades.find(p => 
        p.name.toLowerCase().includes('horas disponibles')
      );
      if (!existeHorasDisponibles) {
        columnasFormulaAAgregar.push({
          name: "Horas Disponibles",
          type: "formula",
          formula: `if(and(!empty(prop("${diasTranscurridos.name}")), !empty(prop("${horasDiarias.name}"))), prop("${diasTranscurridos.name}") * prop("${horasDiarias.name}"), 0)`,
          visible: false
        });
      }
    }
    
    // Si tenemos "Dias Totales Sprint" y "Horas Diarias", crear "Horas Totales Sprint"
    const diasTotales = todasLasPropiedades.find(p => 
      p.name.toLowerCase().includes('dias totales') || p.name.toLowerCase().includes('dias habiles totales')
    );
    if (diasTotales && horasDiarias) {
      const existeHorasTotales = todasLasPropiedades.find(p => 
        p.name.toLowerCase().includes('horas totales sprint')
      );
      if (!existeHorasTotales) {
        columnasFormulaAAgregar.push({
          name: "Horas Totales Sprint",
          type: "formula",
          formula: `if(and(!empty(prop("${diasTotales.name}")), !empty(prop("${horasDiarias.name}"))), prop("${diasTotales.name}") * prop("${horasDiarias.name}"), 0)`,
          visible: false
        });
      }
    }
    
    // Si tenemos "Time Estimated" y "Horas Disponibles", crear "Sobrecarga"
    const timeEstimated = todasLasPropiedades.find(p => 
      p.name.toLowerCase().includes('time estimated') || p.name.toLowerCase().includes('tiempo estimado')
    );
    const horasDisponibles = todasLasPropiedades.find(p => 
      p.name.toLowerCase().includes('horas disponibles')
    );
    if (timeEstimated && horasDisponibles) {
      const existeSobrecarga = todasLasPropiedades.find(p => 
        p.name.toLowerCase().includes('sobrecarga')
      );
      if (!existeSobrecarga) {
        columnasFormulaAAgregar.push({
          name: "Sobrecarga",
          type: "formula",
          formula: `if(and(!empty(prop("${timeEstimated.name}")), !empty(prop("${horasDisponibles.name}"))), if((prop("${timeEstimated.name}") > prop("${horasDisponibles.name}")), "⚠️ Sobrecarga", "✅ OK"), "N/A")`,
          visible: false
        });
      }
    }
    
    return columnasFormulaAAgregar;
  };

  const agregarPropiedad = () => {
    if (!nuevoCampo.name) return;
    
    // Si el nombre sugiere que es una fecha pero el tipo no es "date", cambiar automáticamente a "date"
    const nombreNormalizado = nuevoCampo.name.trim().toLowerCase();
    const esFecha = nombreNormalizado.includes('date') || 
                    nombreNormalizado.includes('fecha') || 
                    nombreNormalizado.includes('created') || 
                    nombreNormalizado.includes('expiration');
    
    let tipoFinal = nuevoCampo.type;
    if (esFecha && nuevoCampo.type === "text") {
      tipoFinal = "date";
    }
    
    // Si es tipo formula y no tiene fórmula asignada, intentar obtener una por defecto
    let formulaFinal = nuevoCampo.formula || "";
    if (tipoFinal === "formula" && !formulaFinal) {
      formulaFinal = obtenerFormulaPorDefecto(nuevoCampo.name);
    }
    
    const nuevas = [...propiedades, { 
      ...nuevoCampo, 
      type: tipoFinal,
      totalizar: tipoFinal === "number" || tipoFinal === "percent" ? false : undefined,
      formula: tipoFinal === "formula" ? formulaFinal : undefined,
      visible: nuevoCampo.visible !== undefined ? nuevoCampo.visible : true
    }];
    
    // Si la columna agregada es una columna base (fecha inicial, fecha final, horas diarias, etc.)
    // crear automáticamente las columnas de fórmula relacionadas
    const columnasFormulaAAgregar = crearColumnasFormulaAutomaticas(nuevas, nuevoCampo.name);
    
    // Agregar las columnas de fórmula automáticas
    if (columnasFormulaAAgregar.length > 0) {
      columnasFormulaAAgregar.forEach(columna => {
        // Verificar que no exista ya
        if (!nuevas.find(p => p.name === columna.name)) {
          nuevas.push({
            ...columna,
            totalizar: undefined,
            visible: columna.visible !== undefined ? columna.visible : false
          });
        }
      });
    }
    
    setPropiedades(nuevas);

    // Actualizar todas las filas con la nueva propiedad y las fórmulas automáticas
    const nuevasFilas = filas.map((fila) => {
      const nuevasProperties = { ...fila.properties };
      
      // Agregar la propiedad principal
      nuevasProperties[nuevoCampo.name] = {
        type: tipoFinal,
        value: tipoFinal === "checkbox" ? false : tipoFinal === "tags" ? [] : tipoFinal === "formula" ? "" : tipoFinal === "date" ? "" : "",
        color: tipoFinal === "select" ? "#3b82f6" : undefined,
        formula: tipoFinal === "formula" ? formulaFinal : undefined,
      };
      
      // Agregar las propiedades de fórmula automáticas
      columnasFormulaAAgregar.forEach(columna => {
        if (!nuevasProperties[columna.name]) {
          nuevasProperties[columna.name] = {
            type: "formula",
            value: "",
            formula: columna.formula
          };
        }
      });
      
      return {
        ...fila,
        properties: nuevasProperties
      };
    });
    
    setFilas(nuevasFilas);
    setNuevoCampo({ name: "", type: "text", formula: "", visible: true });
  };

  // Función auxiliar para calcular días hábiles entre dos fechas (excluyendo sábados, domingos y días no trabajados)
  const calcularDiasHabiles = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let dias = 0;
    const fechaActual = new Date(inicio);
    
    // Obtener días no trabajados del sprintConfig
    const diasNoTrabajados = sprintConfig?.diasNoTrabajados || [];
    const diasNoTrabajadosSet = new Set(diasNoTrabajados.map(fecha => {
      if (typeof fecha === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
          return fecha;
        }
        const d = new Date(fecha);
        const año = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      }
      return fecha;
    }));
    
    while (fechaActual <= fin) {
      const diaSemana = fechaActual.getDay();
      const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
      
      // Formatear fecha actual para comparar
      const añoActual = fechaActual.getFullYear();
      const mesActual = String(fechaActual.getMonth() + 1).padStart(2, '0');
      const diaActual = String(fechaActual.getDate()).padStart(2, '0');
      const fechaActualStr = `${añoActual}-${mesActual}-${diaActual}`;
      const esDiaNoTrabajado = diasNoTrabajadosSet.has(fechaActualStr);
      
      // Contar solo si NO es fin de semana y NO está en días no trabajados
      if (!esFinDeSemana && !esDiaNoTrabajado) {
        dias++;
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return dias;
  };

  // Función para agregar días hábiles a una fecha
  const agregarDiasHabiles = (fechaInicio, diasHabiles) => {
    const fecha = new Date(fechaInicio);
    let diasAgregados = 0;
    
    while (diasAgregados < diasHabiles) {
      fecha.setDate(fecha.getDate() + 1);
      const diaSemana = fecha.getDay();
      // 0 = domingo, 6 = sábado
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAgregados++;
      }
    }
    
    // Formatear como YYYY-MM-DD
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // Función para cargar plantilla de metodología ágil Azure DevOps
  const cargarPlantillaAgil = () => {
    const plantillaCampos = [
      { name: "Progress", type: "number", visible: true, totalizar: false },
      { name: "Objective", type: "number", visible: false, totalizar: false },
      { name: "Progreso", type: "formula", visible: true, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))' },
      { name: "Time Spent", type: "number", visible: true, totalizar: true },
      { name: "Time Estimated", type: "number", visible: true, totalizar: true },
      { name: "Tiempo Restante", type: "formula", visible: true, formula: 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))' },
      { name: "Days Worked", type: "number", visible: true, totalizar: false },
      { name: "Start Date", type: "text", visible: true },
      { name: "End Date", type: "text", visible: true },
      { name: "Current Date", type: "text", visible: false },
      { name: "Sprint Days", type: "number", visible: true, totalizar: false },
      { name: "Tasks Completed", type: "number", visible: true, totalizar: true },
      { name: "Total Tasks", type: "number", visible: true, totalizar: false },
      { name: "Tasa Completitud", type: "formula", visible: true, formula: 'format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%"' },
      { name: "Days Elapsed", type: "number", visible: true, totalizar: false },
      { name: "Estado", type: "select", visible: true },
      { name: "Tags", type: "tags", visible: true },
    ];

    // Agregar solo los campos que no existen
    const camposExistentes = propiedades.map(p => p.name);
    const nuevosCampos = plantillaCampos.filter(campo => !camposExistentes.includes(campo.name));

    if (nuevosCampos.length === 0) {
      alert("Todos los campos de la plantilla ya están agregados.");
      return;
    }

    const nuevasPropiedades = [...propiedades];
    nuevosCampos.forEach(campo => {
      nuevasPropiedades.push({
        name: campo.name,
        type: campo.type,
        visible: campo.visible !== undefined ? campo.visible : true,
        totalizar: campo.totalizar,
        formula: campo.formula || undefined
      });
    });

    setPropiedades(nuevasPropiedades);

    // Agregar los campos a todas las filas existentes
    const nuevasFilas = filas.map((fila) => {
      const nuevasProperties = { ...fila.properties };
      nuevosCampos.forEach(campo => {
        nuevasProperties[campo.name] = {
          type: campo.type,
          value: campo.type === "checkbox" ? false : campo.type === "tags" ? [] : campo.type === "formula" ? "" : "",
          color: campo.type === "select" ? "#3b82f6" : undefined,
          formula: campo.formula || undefined,
        };
      });
      return {
        ...fila,
        properties: nuevasProperties,
      };
    });
    setFilas(nuevasFilas);

    alert(`✅ Plantilla cargada: Se agregaron ${nuevosCampos.length} campos nuevos.`);
  };

  // Función para cargar plantilla Scrum completa con ejemplos
  const cargarPlantillaEjemplo = () => {
    // Calcular fechas del sprint automáticamente
    // Fecha actual (hoy)
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const hoy = `${año}-${mes}-${dia}`;
    
    // Sprint Start Date = hoy
    const sprintInicio = hoy;
    
    // Sprint End Date = 15 días hábiles después de hoy
    const sprintFin = agregarDiasHabiles(hoy, 15);
    
    const horasDiarias = 8;
    
    // Calcular días hábiles del sprint
    const diasHabilesSprint = calcularDiasHabiles(sprintInicio, sprintFin);
    const horasTotalesSprint = diasHabilesSprint * horasDiarias;
    
    // Calcular días hábiles transcurridos (desde inicio del sprint hasta hoy)
    // Como el sprint inicia hoy, los días transcurridos son 0
    const diasHabilesTranscurridos = 0;
    
    // Definir todos los campos con fórmulas según README (SPRINT_SETUP_README.md)
    const plantillaCampos = [
      // Campos principales VISIBLES (listos para trabajar inmediatamente)
      { name: "Priority", type: "tags", visible: true },
      { name: "Type", type: "tags", visible: true },
      { name: "Percent", type: "formula", visible: true, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))' },
      { name: "Percent Total", type: "formula", visible: true, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")' },
      { name: "Progress", type: "number", visible: true, totalizar: false },
      { name: "Estado", type: "select", visible: true },
      { name: "Time Spent", type: "number", visible: true, totalizar: true },
      { name: "Time Estimated", type: "number", visible: true, totalizar: true },
      // Campos de soporte OCULTOS (necesarios para fórmulas pero no visibles por defecto)
      { name: "Objective", type: "number", visible: false, totalizar: false },
      { name: "Current Date", type: "date", visible: false },
      { name: "Created", type: "date", visible: false },
      { name: "Expiration date", type: "date", visible: false },
      // Campos de días y horas OCULTOS (datos de entrada para cálculos)
      { name: "Days Worked", type: "number", visible: false, totalizar: false },
      { name: "Days Elapsed", type: "number", visible: false, totalizar: false },
      // Campos de tareas OCULTOS (datos de entrada)
      { name: "Tasks Completed", type: "number", visible: false, totalizar: true },
      { name: "Total Tasks", type: "number", visible: false, totalizar: false },
      // Fórmulas adicionales OCULTAS (disponibles si se necesitan)
      { name: "Progreso", type: "formula", visible: false, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))' },
      { name: "missing percentage", type: "formula", visible: false, formula: 'if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%"))' },
      { name: "Tiempo Restante", type: "formula", visible: false, formula: 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))' },
      { name: "Porcentaje Tiempo", type: "formula", visible: false, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") / prop("Time Estimated")) * 100)) + "%", "0%")' },
      { name: "Tasa Completitud", type: "formula", visible: false, formula: 'if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")' },
      { name: "Sprint Days", type: "number", visible: false, totalizar: false },
      { name: "Horas Totales Sprint", type: "number", visible: false, totalizar: false },
      { name: "Dias Habiles Transcurridos", type: "number", visible: false, totalizar: false },
      { name: "Horas Disponibles", type: "formula", visible: false, formula: 'prop("Dias Habiles Transcurridos") * prop("Horas Diarias")' },
      { name: "Sobrecarga", type: "formula", visible: false, formula: 'if((prop("Time Estimated") > prop("Horas Disponibles")), "⚠️ Sobrecarga", "✅ OK")' },
      { name: "Dias Transcurridos Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("Sprint Start Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) >= date(prop("Sprint Start Date"))), floor((date(prop("Current Date")) - date(prop("Sprint Start Date"))) / 86400000) + 1, 0), 0)' },
      { name: "Dias Faltantes Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("Sprint End Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) <= date(prop("Sprint End Date"))), floor((date(prop("Sprint End Date")) - date(prop("Current Date"))) / 86400000), 0), 0)' },
      // Campos adicionales OCULTOS (se pueden agregar manualmente si se necesitan)
      { name: "Tags", type: "tags", visible: false },
      { name: "tag", type: "tags", visible: false }, // Alias para tag
      { name: "Assign", type: "tags", visible: false },
      { name: "Done", type: "checkbox", visible: false },
      // Campos adicionales (ocultos inicialmente)
      { name: "Link", type: "text", visible: false },
      { name: "Retrospective", type: "text", visible: false },
      { name: "Video", type: "text", visible: false },
      { name: "video", type: "text", visible: false }, // Alias para video
      { name: "Lambdas", type: "text", visible: false },
      { name: "NameRepo", type: "text", visible: false },
      { name: "Property", type: "text", visible: false },
      { name: "to", type: "text", visible: false },
      // Campos de gestión ágil (nuevos)
      { name: "area", type: "select", visible: false },
      { name: "epica", type: "select", visible: false },
      { name: "iteracion", type: "text", visible: false },
      { name: "puntos de historia", type: "number", visible: false, totalizar: false },
      { name: "release", type: "text", visible: false },
      // Campo oculto para cálculos (con valor por defecto 100)
      { name: "Objective", type: "number", visible: false, totalizar: false },
    ];

    // Agregar solo los campos que no existen, preservando los existentes y sus fórmulas
    const camposExistentes = propiedades.map(p => p.name);
    const nuevosCampos = plantillaCampos.filter(campo => !camposExistentes.includes(campo.name));
    
    // Crear nuevas propiedades preservando las existentes
    const nuevasPropiedades = [...propiedades];
    
    // Agregar solo los nuevos campos
    nuevosCampos.forEach(campo => {
      nuevasPropiedades.push({
        name: campo.name,
        type: campo.type,
        visible: campo.visible !== undefined ? campo.visible : true,
        totalizar: campo.totalizar,
        formula: campo.formula || undefined
      });
    });

    setPropiedades(nuevasPropiedades);
    
    // Si hay nuevos campos, agregarlos también a las filas existentes
    if (nuevosCampos.length > 0) {
      const nuevasFilas = filas.map((fila) => {
        const nuevasProperties = { ...fila.properties };
        nuevosCampos.forEach(campo => {
          let defaultValue = campo.type === "checkbox" ? false : campo.type === "tags" ? [] : campo.type === "formula" ? "" : campo.type === "number" ? 0 : "";
          let defaultColor = undefined;
          
          // Valores por defecto para Priority
          if (campo.name === "Priority" && campo.type === "tags") {
            defaultValue = [{ label: "Medium", color: "#fbbf24" }]; // Amarillo por defecto
          }
          
          // Valores por defecto para Type
          if (campo.name === "Type" && campo.type === "tags") {
            defaultValue = [{ label: "TO DO", color: "#6b7280" }]; // Gris por defecto
          }
          
          // Valores por defecto para Objective
          if (campo.name === "Objective" && campo.type === "number") {
            defaultValue = 100; // 100 por defecto
          }
          
          // Manejar Current Date tanto para tipo date como text
          if (campo.name === "Current Date" && (campo.type === "date" || campo.type === "text")) {
            defaultValue = hoy; // Fecha actual
          }
          
          nuevasProperties[campo.name] = {
            type: campo.type,
            value: defaultValue,
            color: campo.type === "select" ? "#3b82f6" : defaultColor,
            formula: campo.formula || undefined,
          };
        });
        return {
          ...fila,
          properties: nuevasProperties,
        };
      });
      setFilas(nuevasFilas);
    }

    // Si hay filas existentes, solo agregar los campos nuevos (sin crear tareas)
    if (filas.length > 0) {
      // Solo agregar los nuevos campos a las filas existentes
      const filasActualizadas = filas.map(fila => {
        const nuevasProperties = { ...fila.properties };
        nuevosCampos.forEach(campo => {
          if (!nuevasProperties[campo.name]) {
            let defaultValue = campo.type === "checkbox" ? false : campo.type === "tags" ? [] : campo.type === "formula" ? "" : campo.type === "number" ? 0 : "";
            let defaultColor = undefined;
            
            // Valores por defecto para Priority
            if (campo.name === "Priority" && campo.type === "tags") {
              defaultValue = [{ label: "Medium", color: "#fbbf24" }]; // Amarillo por defecto
            }
            
            // Valores por defecto para Type
            if (campo.name === "Type" && campo.type === "tags") {
              defaultValue = [{ label: "TO DO", color: "#6b7280" }]; // Gris por defecto
            }
            
            // Valores por defecto para Objective
            if (campo.name === "Objective" && campo.type === "number") {
              defaultValue = 100; // 100 por defecto
            }
            
            // Manejar Current Date tanto para tipo date como text
            if (campo.name === "Current Date" && (campo.type === "date" || campo.type === "text")) {
              defaultValue = hoy; // Fecha actual
            }
            
            nuevasProperties[campo.name] = {
              type: campo.type,
              value: defaultValue,
              color: campo.type === "select" ? "#3b82f6" : defaultColor,
              formula: campo.formula || undefined,
            };
          }
        });
        return {
          ...fila,
          properties: nuevasProperties
        };
      });
      setFilas(filasActualizadas);
      alert(`✅ Se agregaron ${nuevosCampos.length} campos nuevos a las filas existentes.`);
      return;
    }
    
    // Si no hay filas, preguntar cuántas tareas de ejemplo crear
    setShowEjemploModal(true);
  };

  // Función para crear las tareas de ejemplo (llamada desde el modal)
  const crearTareasEjemplo = (cantidad) => {
    setShowEjemploModal(false);
    
    // Calcular fechas del sprint automáticamente
    // Fecha actual (hoy)
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    const hoy = `${año}-${mes}-${dia}`;
    
    // Sprint Start Date = hoy
    const sprintInicio = hoy;
    
    // Sprint End Date = 15 días hábiles después de hoy
    const sprintFin = agregarDiasHabiles(hoy, 15);
    
    const horasDiarias = 8;
    
    // Calcular días hábiles del sprint
    const diasHabilesSprint = calcularDiasHabiles(sprintInicio, sprintFin);
    const horasTotalesSprint = diasHabilesSprint * horasDiarias;
    
    // Calcular días hábiles transcurridos
    // Como el sprint inicia hoy, los días transcurridos son 0
    const diasHabilesTranscurridos = 0;
    
    // Obtener los campos de la plantilla (ya agregados anteriormente)
    const plantillaCampos = [
      { name: "Priority", type: "tags", visible: true },
      { name: "Type", type: "tags", visible: true },
      { name: "Percent", type: "formula", visible: true, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))' },
      { name: "Percent Total", type: "formula", visible: true, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")' },
      { name: "Progress", type: "number", visible: true, totalizar: false },
      { name: "Time Spent", type: "number", visible: false, totalizar: true },
      { name: "Time Estimated", type: "number", visible: false, totalizar: true },
      { name: "Current Date", type: "text", visible: false },
      { name: "Created", type: "text", visible: false },
      { name: "Expiration date", type: "text", visible: false },
      { name: "Objective", type: "number", visible: false, totalizar: false },
      { name: "missing percentage", type: "formula", visible: false, formula: 'if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%"))' },
    ];
    
    // Crear tareas de ejemplo (6 tareas variadas para demostrar todas las fórmulas)
    const todasTareasEjemplo = [
      { nombre: "Diseño de UI/UX", progress: 80, objective: 100, timeSpent: 12, timeEstimated: 16, daysWorked: 2, startDate: "2025-12-26", endDate: "2025-12-30", tasksCompleted: 4, totalTasks: 5, daysElapsed: 2, estado: "En progreso", priority: "Critical", type: "IN PROGRESS", tags: ["Frontend", "Diseño"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Implementación API Backend", progress: 60, objective: 100, timeSpent: 20, timeEstimated: 32, daysWorked: 3, startDate: "2025-12-26", endDate: "2026-01-02", tasksCompleted: 6, totalTasks: 10, daysElapsed: 3, estado: "En progreso", priority: "Critical", type: "IN PROGRESS", tags: ["Backend", "API"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Integración Base de Datos", progress: 40, objective: 100, timeSpent: 8, timeEstimated: 24, daysWorked: 1, startDate: "2025-12-27", endDate: "2026-01-03", tasksCompleted: 2, totalTasks: 5, daysElapsed: 1, estado: "En progreso", priority: "Medium", type: "IN PROGRESS", tags: ["Database", "Backend"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Pruebas Unitarias", progress: 30, objective: 100, timeSpent: 6, timeEstimated: 20, daysWorked: 1, startDate: "2025-12-28", endDate: "2026-01-05", tasksCompleted: 3, totalTasks: 10, daysElapsed: 1, estado: "En progreso", priority: "Medium", type: "QA", tags: ["Testing", "QA"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Documentación Técnica", progress: 50, objective: 100, timeSpent: 4, timeEstimated: 8, daysWorked: 1, startDate: "2025-12-29", endDate: "2026-01-06", tasksCompleted: 2, totalTasks: 4, daysElapsed: 1, estado: "En progreso", priority: "Low", type: "UNDER REVIEW", tags: ["Documentación"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Optimización Performance", progress: 20, objective: 100, timeSpent: 4, timeEstimated: 16, daysWorked: 1, startDate: "2025-12-30", endDate: "2026-01-07", tasksCompleted: 1, totalTasks: 5, daysElapsed: 1, estado: "Pendiente", priority: "Medium", type: "TO DO", tags: ["Performance", "Optimización"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Configuración CI/CD", progress: 70, objective: 100, timeSpent: 10, timeEstimated: 12, daysWorked: 2, startDate: "2025-12-26", endDate: "2025-12-31", tasksCompleted: 7, totalTasks: 10, daysElapsed: 2, estado: "En progreso", priority: "Critical", type: "IN PROGRESS", tags: ["DevOps", "CI/CD"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Revisión de Código", progress: 45, objective: 100, timeSpent: 9, timeEstimated: 20, daysWorked: 2, startDate: "2025-12-27", endDate: "2026-01-04", tasksCompleted: 9, totalTasks: 20, daysElapsed: 2, estado: "En progreso", priority: "Medium", type: "UNDER REVIEW", tags: ["Code Review"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Corrección de Bugs", progress: 55, objective: 100, timeSpent: 11, timeEstimated: 18, daysWorked: 2, startDate: "2025-12-28", endDate: "2026-01-05", tasksCompleted: 11, totalTasks: 20, daysElapsed: 2, estado: "En progreso", priority: "Critical", type: "IN PROGRESS", tags: ["Bugs", "Fix"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Despliegue en Staging", progress: 0, objective: 100, timeSpent: 0, timeEstimated: 8, daysWorked: 0, startDate: "2026-01-06", endDate: "2026-01-08", tasksCompleted: 0, totalTasks: 3, daysElapsed: 0, estado: "Pendiente", priority: "Critical", type: "TO DO", tags: ["Deployment", "Staging"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Pruebas de Integración", progress: 25, objective: 100, timeSpent: 5, timeEstimated: 16, daysWorked: 1, startDate: "2025-12-30", endDate: "2026-01-07", tasksCompleted: 2, totalTasks: 8, daysElapsed: 1, estado: "En progreso", priority: "Medium", type: "QA", tags: ["Testing", "Integración"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Preparación Demo", progress: 10, objective: 100, timeSpent: 2, timeEstimated: 12, daysWorked: 1, startDate: "2026-01-02", endDate: "2026-01-08", tasksCompleted: 1, totalTasks: 10, daysElapsed: 0, estado: "Pendiente", priority: "Low", type: "TO DO", tags: ["Demo", "Presentación"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
    ];

    // Crear filas con todas las propiedades
    // Limitar a la cantidad solicitada
    const tareasEjemplo = todasTareasEjemplo.slice(0, cantidad);
    const nuevasFilas = tareasEjemplo.map(tarea => {
      const properties = {};
      
      plantillaCampos.forEach(campo => {
        if (campo.type === "formula") {
          properties[campo.name] = {
            type: "formula",
            value: "",
            formula: campo.formula || ""
          };
        } else if (campo.name === "Progress") {
          properties[campo.name] = { type: "number", value: tarea.progress };
        } else if (campo.name === "Objective") {
          properties[campo.name] = { type: "number", value: 100 }; // Siempre 100 por defecto
        } else if (campo.name === "Priority") {
          const priorityValue = tarea.priority || "Medium";
          let priorityColor = "#fbbf24"; // Default Medium (amarillo)
          if (priorityValue === "Critical" || priorityValue === "Alta") {
            priorityColor = "#ef4444"; // Rojo
          } else if (priorityValue === "Low" || priorityValue === "Baja") {
            priorityColor = "#10b981"; // Verde
          } else if (priorityValue === "Medium" || priorityValue === "Media") {
            priorityColor = "#fbbf24"; // Amarillo
          }
          // Mapear valores antiguos a nuevos
          const mappedPriority = priorityValue === "Alta" ? "Critical" : priorityValue === "Baja" ? "Low" : priorityValue === "Media" ? "Medium" : priorityValue;
          properties[campo.name] = { type: "tags", value: [{ label: mappedPriority, color: priorityColor }] };
        } else if (campo.name === "Type") {
          const typeValue = tarea.type || "TO DO";
          let typeColor = "#6b7280"; // Default gris (TO DO)
          let mappedType = typeValue;
          
          // Mapear valores antiguos a nuevos
          if (typeValue === "Tarea" || typeValue === "Bug") {
            mappedType = "TO DO";
            typeColor = "#6b7280"; // Gris
          } else if (typeValue === "DONE") {
            typeColor = "#10b981"; // Verde
          } else if (typeValue === "STOPPED") {
            typeColor = "#ef4444"; // Rojo
          } else if (typeValue === "IN PROGRESS") {
            typeColor = "#3b82f6"; // Azul
          } else if (typeValue === "REOPENED") {
            typeColor = "#f59e0b"; // Naranja
          } else if (typeValue === "UNDER REVIEW") {
            typeColor = "#8b5cf6"; // Morado
          } else if (typeValue === "QA") {
            typeColor = "#06b6d4"; // Cyan
          } else if (typeValue === "TO DO") {
            typeColor = "#6b7280"; // Gris
          }
          properties[campo.name] = { type: "tags", value: [{ label: mappedType, color: typeColor }] };
        } else if (campo.name === "Time Spent") {
          properties[campo.name] = { type: "number", value: tarea.timeSpent };
        } else if (campo.name === "Time Estimated") {
          properties[campo.name] = { type: "number", value: tarea.timeEstimated };
        } else if (campo.name === "Days Worked") {
          properties[campo.name] = { type: "number", value: tarea.daysWorked };
        } else if (campo.name === "Current Date") {
          properties[campo.name] = { type: "text", value: hoy };
        } else if (campo.name === "Created") {
          properties[campo.name] = { type: "text", value: tarea.created || hoy };
        } else if (campo.name === "Expiration date") {
          properties[campo.name] = { type: "text", value: tarea.expirationDate || "" };
        } else if (campo.name === "Sprint Days") {
          properties[campo.name] = { type: "number", value: diasHabilesSprint };
        } else if (campo.name === "Horas Totales Sprint") {
          properties[campo.name] = { type: "number", value: horasTotalesSprint };
        } else if (campo.name === "Dias Habiles Transcurridos") {
          properties[campo.name] = { type: "number", value: diasHabilesTranscurridos };
        } else if (campo.name === "Objective") {
          properties[campo.name] = { type: "number", value: 100 };
        } else if (campo.name === "Tasks Completed") {
          properties[campo.name] = { type: "number", value: tarea.tasksCompleted };
        } else if (campo.name === "Total Tasks") {
          properties[campo.name] = { type: "number", value: tarea.totalTasks };
        } else if (campo.name === "Days Elapsed") {
          properties[campo.name] = { type: "number", value: tarea.daysElapsed };
        } else if (campo.name === "Estado") {
          properties[campo.name] = { type: "select", value: tarea.estado, color: tarea.estado === "En progreso" ? "#3b82f6" : tarea.estado === "Pendiente" ? "#f59e0b" : "#10b981" };
        } else if (campo.name === "Tags") {
          properties[campo.name] = { type: "tags", value: tarea.tags.map(tag => ({ label: tag, value: tag })) };
        } else if (campo.name === "Assign") {
          properties[campo.name] = { type: "tags", value: (tarea.assign || []).map(tag => ({ label: tag, value: tag })) };
        } else if (campo.name === "Done") {
          properties[campo.name] = { type: "checkbox", value: tarea.done || false };
        } else if (campo.name === "Link") {
          properties[campo.name] = { type: "text", value: tarea.link || "" };
        } else if (campo.name === "Retrospective") {
          properties[campo.name] = { type: "text", value: tarea.retrospective || "" };
        } else if (campo.name === "Video") {
          properties[campo.name] = { type: "text", value: tarea.video || "" };
        } else if (campo.name === "Lambdas") {
          properties[campo.name] = { type: "text", value: tarea.lambdas || "" };
        } else if (campo.name === "NameRepo") {
          properties[campo.name] = { type: "text", value: tarea.nameRepo || "" };
        } else if (campo.name === "Property") {
          properties[campo.name] = { type: "text", value: tarea.property || "" };
        } else if (campo.name === "to") {
          properties[campo.name] = { type: "text", value: tarea.to || "" };
        } else if (campo.name === "tag") {
          // Alias para Tags
          properties[campo.name] = { type: "tags", value: tarea.tags.map(tag => ({ label: tag, value: tag })) };
        } else if (campo.name === "video") {
          // Alias para Video
          properties[campo.name] = { type: "text", value: tarea.video || "" };
        } else if (campo.name === "area") {
          properties[campo.name] = { type: "select", value: tarea.area || "", color: "#3b82f6" };
        } else if (campo.name === "epica") {
          properties[campo.name] = { type: "select", value: tarea.epica || "", color: "#3b82f6" };
        } else if (campo.name === "iteracion") {
          properties[campo.name] = { type: "text", value: tarea.iteracion || "" };
        } else if (campo.name === "puntos de historia") {
          properties[campo.name] = { type: "number", value: tarea.puntosHistoria || 0 };
        } else if (campo.name === "release") {
          properties[campo.name] = { type: "text", value: tarea.release || "" };
        } else {
          let defaultValue = campo.type === "checkbox" ? false : campo.type === "tags" ? [] : "";
          
          // Valores por defecto para Priority
          if (campo.name === "Priority" && campo.type === "tags") {
            defaultValue = [{ label: "Medium", color: "#fbbf24" }]; // Amarillo por defecto
          }
          
          // Valores por defecto para Type
          if (campo.name === "Type" && campo.type === "tags") {
            defaultValue = [{ label: "TO DO", color: "#6b7280" }]; // Gris por defecto
          }
          
          // Valores por defecto para Objective
          if (campo.name === "Objective" && campo.type === "number") {
            defaultValue = 100; // 100 por defecto
          }
          
          // Valores por defecto para campos base del sprint (generales para todas las filas)
          if (campo.name === "Sprint Start Date" && (campo.type === "date" || campo.type === "text")) {
            defaultValue = sprintInicio; // Fecha de inicio del sprint
          }
          
          if (campo.name === "Sprint End Date" && (campo.type === "date" || campo.type === "text")) {
            defaultValue = sprintFin; // Fecha de fin del sprint
          }
          
          if (campo.name === "Horas Diarias Sprint" && campo.type === "number") {
            defaultValue = horasDiarias; // Horas diarias del sprint
          }
          
          if (campo.name === "Current Date" && campo.type === "text") {
            defaultValue = hoy; // Fecha actual
          }
          
          properties[campo.name] = {
            type: campo.type,
            value: defaultValue
          };
        }
      });

      return {
        Name: tarea.nombre,
        properties: properties
      };
    });

    // Evaluar todas las fórmulas y guardar los resultados en value
    const filasConFormulasEvaluadas = nuevasFilas.map(fila => {
      const propiedadesEvaluadas = { ...fila.properties };
      
      // Evaluar cada propiedad que sea fórmula
      Object.keys(propiedadesEvaluadas).forEach(propName => {
        const prop = propiedadesEvaluadas[propName];
        if (prop.type === "formula" && prop.formula) {
          try {
            const evaluator = new FormulaEvaluator(
              fila, 
              nuevasFilas, 
              sprintConfig, 
              tablasVinculadas, 
              tableId, 
              cargarDatosTablaVinculada
            );
            const resultado = evaluator.evaluate(prop.formula);
            // Guardar el resultado en value para que se muestre inmediatamente
            prop.value = resultado !== undefined && resultado !== null ? String(resultado) : "";
          } catch (error) {
            prop.value = "Error";
          }
        }
      });
      
      return {
        ...fila,
        properties: propiedadesEvaluadas
      };
    });

    setFilas(filasConFormulasEvaluadas);
    
    // Calcular información de puntos
    const puntosTotalesObjetivo = sprintConfig.puntosTotalesSprint;
    const puntosTotalesActuales = calcularTotal(filasConFormulasEvaluadas, "Puntos de Historia");
    const porcentajePuntos = puntosTotalesObjetivo && puntosTotalesObjetivo > 0 
      ? Math.round((puntosTotalesActuales / puntosTotalesObjetivo) * 100) 
      : null;
    let validacionPuntos = null;
    if (puntosTotalesObjetivo !== null && puntosTotalesObjetivo !== undefined) {
      if (puntosTotalesObjetivo >= 3 && puntosTotalesObjetivo <= 8) {
        validacionPuntos = "✅ Bien definido (3-8)";
      } else if (puntosTotalesObjetivo > 8) {
        validacionPuntos = "⚠️ Considerar dividir (>8)";
      } else if (puntosTotalesObjetivo > 0) {
        validacionPuntos = "📊 Muy pequeño (<3)";
      }
    }
    
    // Guardar información del sprint para mostrarla después
    setSprintInfo({
      tareas: tareasEjemplo.length,
      inicio: sprintInicio,
      fin: sprintFin,
      diasHabiles: diasHabilesSprint,
      horasTotales: horasTotalesSprint,
      horasDiarias: horasDiarias,
      puntosTotalesObjetivo: puntosTotalesObjetivo,
      puntosTotalesActuales: puntosTotalesActuales,
      porcentajePuntos: porcentajePuntos,
      validacionPuntos: validacionPuntos
    });
  };

  // Filtrar propiedades visibles
  const propiedadesVisibles = propiedades.filter(p => p.visible !== false);

  // Función para obtener el valor de una celda (puede ser fórmula o valor directo)
  const obtenerValorCelda = (fila, prop) => {
    if (prop.type === "formula") {
      // Buscar la fórmula en la propiedad de la fila
      const propiedadFila = fila.properties?.[prop.name];
      const formula = propiedadFila?.formula || "";
      
      if (!formula || formula.trim() === "") {
        return "";
      }
      
      try {
        const evaluator = new FormulaEvaluator(
          fila, 
          filas, 
          sprintConfig, 
          tablasVinculadas, 
          tableId, 
          cargarDatosTablaVinculada
        );
        const result = evaluator.evaluate(formula);
        return result !== undefined && result !== null ? String(result) : "";
      } catch (error) {
        return "Error";
      }
    }
    return fila.properties?.[prop.name]?.value;
  };

  const filasFiltradas = filas.filter(
    (f) => {
      // Si no hay filtro, mostrar todas las filas
      if (!filtro || filtro.trim() === "") {
        return true;
      }
      
      const filtroLower = filtro.toLowerCase();
      
      // Verificar que Name existe y es string antes de usar toLowerCase
      const nameValue = f.Name || f.properties?.Name?.value || "";
      const nameMatch = typeof nameValue === "string" && nameValue.toLowerCase().includes(filtroLower);
      
      const propertiesMatch = Object.values(f.properties || {}).some(
        (p) => {
          const value = p?.value;
          if (!value) return false;
          
          if (typeof value === "string") {
            return value.toLowerCase().includes(filtroLower);
          }
          if (Array.isArray(value)) {
            return value.join(",").toLowerCase().includes(filtroLower);
          }
          return false;
        }
      );
      
      return nameMatch || propertiesMatch;
    }
  );

  const filasOrdenadas = [...filasFiltradas].sort((a, b) => {
    if (!sortBy) return 0;
    const valA = a.properties?.[sortBy]?.value || "";
    const valB = b.properties?.[sortBy]?.value || "";
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (colName) => {
    if (sortBy === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(colName);
      setSortAsc(true);
    }
  };

  // Función para eliminar una columna completa
  const eliminarColumna = (nombreColumna) => {
    // Verificar si el campo es usado en alguna fórmula
    const camposUsadosEnFormulas = [];
    propiedades.forEach(prop => {
      if (prop.type === "formula" && prop.formula) {
        // Buscar referencias a la columna en las fórmulas
        const regex = new RegExp(`prop\\(["']${nombreColumna}["']\\)`, 'gi');
        if (regex.test(prop.formula)) {
          camposUsadosEnFormulas.push(prop.name);
        }
      }
    });
    
    if (camposUsadosEnFormulas.length > 0) {
      alert(`⚠️ No se puede eliminar "${nombreColumna}" porque es usado en las siguientes fórmulas:\n${camposUsadosEnFormulas.join(', ')}\n\nPor favor, elimina o modifica estas fórmulas primero.`);
      setShowDeleteColumnModal(false);
      setColumnaAEliminar(null);
      return;
    }
    
    const nuevasPropiedades = propiedades.filter(p => p.name !== nombreColumna);
    setPropiedades(nuevasPropiedades);
    
    // Eliminar la propiedad de todas las filas
    const nuevasFilas = filas.map(fila => {
      const nuevasProperties = { ...fila.properties };
      delete nuevasProperties[nombreColumna];
      return {
        ...fila,
        properties: nuevasProperties
      };
    });
    setFilas(nuevasFilas);
    setShowDeleteColumnModal(false);
    setColumnaAEliminar(null);
  };

  // Función para eliminar una fila
  const eliminarFila = (filaIndex) => {
    const nuevasFilas = filas.filter((_, index) => index !== filaIndex);
    setFilas(nuevasFilas);
    setShowDeleteRowModal(false);
    setFilaAEliminar(null);
    // Si la fila eliminada era la que estaba seleccionada, cerrar el drawer
    if (filaSeleccionada === filaIndex) {
      cerrarDrawer();
    }
  };

  // Función para subir imagen de fila
  const subirImagenFila = async (filaIndex, iconoPredefinido = null) => {
    // Si se pasa un icono predefinido, usarlo directamente
    if (iconoPredefinido) {
      const nuevas = [...filas];
      nuevas[filaIndex].image = iconoPredefinido.emoji;
      nuevas[filaIndex].imageFilename = `icon-${iconoPredefinido.id}`;
      nuevas[filaIndex].iconType = iconoPredefinido.id;
      setFilas(nuevas);
      return;
    }
    
    // Si no hay imagen, mostrar el selector de iconos primero
    if (!filas[filaIndex].image && !filas[filaIndex].imageFilename) {
      setFilaIndexParaIcono(filaIndex);
      setShowIconPickerModal(true);
      return;
    }
    
    // Si ya hay imagen, permitir cambiar por archivo
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      
      try {
        const file = input.files[0];
        const filename = `${Date.now()}-${file.name}`;
        await LocalStorageService.saveBinaryFile(filename, file, 'files');
        
        const nuevas = [...filas];
        nuevas[filaIndex].image = `./files/${filename}`;
        nuevas[filaIndex].imageFilename = filename;
        nuevas[filaIndex].iconType = undefined; // Limpiar tipo de icono si se sube archivo
        setFilas(nuevas);
      } catch (error) {
        alert("No se pudo subir la imagen. Verifica que tengas una carpeta configurada.");
      }
    };
    input.click();
  };

  // Función para eliminar imagen de fila
  const eliminarImagenFila = (filaIndex) => {
    const nuevas = [...filas];
    nuevas[filaIndex].image = null;
    nuevas[filaIndex].imageFilename = null;
    nuevas[filaIndex].iconType = undefined;
    setFilas(nuevas);
  };


  // Función para toggle de visibilidad de propiedad
  const togglePropertyVisibility = (nombrePropiedad) => {
    const nuevasPropiedades = propiedades.map(p => 
      p.name === nombrePropiedad ? { ...p, visible: !p.visible } : p
    );
    setPropiedades(nuevasPropiedades);
  };

  // Función para mostrar todas las propiedades
  const showAllProperties = () => {
    const nuevasPropiedades = propiedades.map(p => ({ ...p, visible: true }));
    setPropiedades(nuevasPropiedades);
  };

  // Función para ocultar todas las propiedades
  const hideAllProperties = () => {
    const nuevasPropiedades = propiedades.map(p => ({ ...p, visible: false }));
    setPropiedades(nuevasPropiedades);
  };

  // Función para reordenar propiedades
  const reordenarPropiedades = (fromIndex, toIndex) => {
    // Solo reordenar propiedades visibles (excluyendo "Name")
    const propiedadesVisibles = propiedades.filter(p => p.name !== "Name" && p.visible !== false);
    const propiedadesOcultas = propiedades.filter(p => p.name === "Name" || p.visible === false);
    
    // Asegurar que los índices estén dentro del rango de propiedades visibles
    if (fromIndex < 0 || fromIndex >= propiedadesVisibles.length || 
        toIndex < 0 || toIndex >= propiedadesVisibles.length) {
      return;
    }
    
    // Reordenar
    const [moved] = propiedadesVisibles.splice(fromIndex, 1);
    propiedadesVisibles.splice(toIndex, 0, moved);
    
    // Reconstruir el array completo: Name primero, luego visibles, luego ocultas
    const nameProp = propiedades.find(p => p.name === "Name");
    const nuevasPropiedades = nameProp 
      ? [nameProp, ...propiedadesVisibles, ...propiedadesOcultas]
      : [...propiedadesVisibles, ...propiedadesOcultas];
    
    setPropiedades(nuevasPropiedades);
  };

  // Función para renderizar la vista Timeline
  const renderTimelineView = () => {
    // Usar fechas globales del sprint
    const sprintInicio = sprintConfig?.sprintStartDate;
    const sprintFin = sprintConfig?.sprintEndDate;
    const horasDiarias = sprintConfig?.horasDiarias || 8;

    if (!sprintInicio || !sprintFin) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No hay fechas de sprint configuradas para mostrar en la timeline</p>
          <p className="text-sm">Configura las fechas de inicio y fin del sprint en la configuración</p>
        </div>
      );
    }

    // Calcular días hábiles totales del sprint
    const diasHabilesTotales = calcularDiasHabiles(sprintInicio, sprintFin);
    
    if (diasHabilesTotales === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No hay días hábiles en el rango del sprint</p>
        </div>
      );
    }

    // Obtener tareas con horas estimadas
    const tareasConHoras = filasOrdenadas
      .map(fila => {
        const timeEstimated = fila.properties?.["Time Estimated"]?.value;
        const horas = typeof timeEstimated === 'number' ? timeEstimated : parseFloat(timeEstimated) || 0;
        return { fila, horas };
      })
      .filter(t => t.horas > 0);

    if (tareasConHoras.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No hay tareas con horas estimadas para mostrar en la timeline</p>
          <p className="text-sm">Agrega horas estimadas en el campo "Time Estimated" para cada tarea</p>
        </div>
      );
    }

    // Calcular el rango de fechas del sprint
    const fechaMin = new Date(sprintInicio);
    const fechaMax = new Date(sprintFin);
    
    // Agregar algunos días de margen
    fechaMin.setDate(fechaMin.getDate() - 1);
    fechaMax.setDate(fechaMax.getDate() + 1);
    
    const rangoTotal = fechaMax.getTime() - fechaMin.getTime();

    // Función para calcular posición porcentual de una fecha
    const calcularPosicion = (fecha) => {
      const fechaObj = new Date(fecha);
      const diferencia = fechaObj.getTime() - fechaMin.getTime();
      return Math.max(0, Math.min(100, (diferencia / rangoTotal) * 100));
    };

    // Función para calcular fecha a partir de días hábiles desde el inicio
    const calcularFechaDesdeDiasHabiles = (diasHabilesDesdeInicio) => {
      const fecha = new Date(sprintInicio);
      let diasAgregados = 0;
      let diasHabilesAgregados = 0;
      
      while (diasHabilesAgregados < diasHabilesDesdeInicio && fecha <= fechaMax) {
        const diaSemana = fecha.getDay();
        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
        
        // Verificar si es día no trabajado
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const fechaStr = `${año}-${mes}-${dia}`;
        const diasNoTrabajados = sprintConfig?.diasNoTrabajados || [];
        const esDiaNoTrabajado = diasNoTrabajados.includes(fechaStr);
        
        if (!esFinDeSemana && !esDiaNoTrabajado) {
          diasHabilesAgregados++;
        }
        fecha.setDate(fecha.getDate() + 1);
        diasAgregados++;
      }
      
      return fecha;
    };

    // Distribuir tareas secuencialmente a lo largo del sprint
    let diasHabilesAcumulados = 0;
    const tareasDistribuidas = tareasConHoras.map(({ fila, horas }) => {
      // Calcular días hábiles necesarios para esta tarea
      const diasHabilesNecesarios = Math.ceil(horas / horasDiarias);
      
      // Calcular fecha de inicio (días hábiles acumulados desde el inicio)
      const fechaInicio = calcularFechaDesdeDiasHabiles(diasHabilesAcumulados);
      const fechaFin = calcularFechaDesdeDiasHabiles(diasHabilesAcumulados + diasHabilesNecesarios);
      
      // Actualizar acumulador
      diasHabilesAcumulados += diasHabilesNecesarios;
      
      return {
        fila,
        horas,
        diasHabilesNecesarios,
        fechaInicio,
        fechaFin,
        posicion: calcularPosicion(fechaInicio.toISOString().split('T')[0]),
        ancho: Math.max(2, (diasHabilesNecesarios / diasHabilesTotales) * 100) // Mínimo 2% de ancho
      };
    });

    // Generar días para el eje X
    const dias = [];
    const fechaActual = new Date(fechaMin);
    while (fechaActual <= fechaMax) {
      dias.push(new Date(fechaActual));
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Obtener campo de progreso si existe
    const campoProgreso = propiedades.find(p => p.name === "Progress" || p.name === "Percent" || p.name === "Progreso");

    return (
      <div className="border rounded-lg bg-white p-4">
        {/* Eje X con fechas */}
        <div className="relative mb-4 pb-2 border-b">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{fechaMin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
            <span>{fechaMax.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
          </div>
          <div className="relative h-8">
            {dias.map((dia, idx) => {
              const pos = calcularPosicion(dia.toISOString().split('T')[0]);
              const esLunes = dia.getDay() === 1;
              const esFinDeSemana = dia.getDay() === 0 || dia.getDay() === 6;
              
              return (
                <div
                  key={idx}
                  className="absolute top-0 h-full border-l border-gray-200"
                  style={{ left: `${pos}%` }}
                  title={dia.toLocaleDateString('es-ES')}
                >
                  {esLunes && (
                    <div className="absolute -top-4 left-0 text-xs text-gray-400 whitespace-nowrap">
                      {dia.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                  )}
                  {esFinDeSemana && (
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-50 opacity-50" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tareas en la timeline */}
        <div className="space-y-2">
          {tareasDistribuidas.map((tarea, idx) => {
            const { fila, horas, diasHabilesNecesarios, fechaInicio, fechaFin, posicion, ancho } = tarea;
              
              // Obtener información adicional
              const progreso = campoProgreso ? obtenerValorCelda(fila, campoProgreso) : null;
              const estado = fila.properties?.["Estado"]?.value || fila.properties?.["Priority"]?.value;
              const estadoColor = fila.properties?.["Estado"]?.color || fila.properties?.["Priority"]?.color || "#3b82f6";
              
              return (
                <div
                  key={idx}
                  className="relative h-10 flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={() => abrirDrawer(fila)}
                  style={{ paddingLeft: `${posicion}%` }}
                >
                  <div
                    className="h-8 rounded px-2 flex items-center text-xs font-medium text-white shadow-sm relative"
                    style={{
                      width: `${ancho}%`,
                      backgroundColor: estadoColor,
                      minWidth: '80px'
                    }}
                  title={`${fila.Name} - ${horas}h (${diasHabilesNecesarios} días hábiles) - ${fechaInicio.toLocaleDateString('es-ES')} a ${fechaFin.toLocaleDateString('es-ES')}${progreso ? ` - ${progreso}` : ''}`}
                  >
                    <span className="truncate flex-1">{fila.Name}</span>
                  <span className="ml-2 text-xs opacity-90 bg-black/20 px-1 rounded whitespace-nowrap">
                    {horas}h
                  </span>
                    {progreso && (
                      <span className="ml-2 text-xs opacity-90 bg-black/20 px-1 rounded">
                        {progreso}
                      </span>
                    )}
                    {/* Indicador de progreso visual */}
                    {campoProgreso && typeof fila.properties?.[campoProgreso.name]?.value === 'number' && (
                      <div
                        className="absolute bottom-0 left-0 bg-black/30 h-1 rounded-b"
                        style={{
                          width: `${Math.min(100, (fila.properties[campoProgreso.name]?.value || 0))}%`
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          
          {/* Tareas sin horas estimadas */}
          {filasOrdenadas.filter(fila => {
            const timeEstimated = fila.properties?.["Time Estimated"]?.value;
            const horas = typeof timeEstimated === 'number' ? timeEstimated : parseFloat(timeEstimated) || 0;
            return horas <= 0;
          }).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500 mb-2">
                Tareas sin horas estimadas ({filasOrdenadas.filter(fila => {
                  const timeEstimated = fila.properties?.["Time Estimated"]?.value;
                  const horas = typeof timeEstimated === 'number' ? timeEstimated : parseFloat(timeEstimated) || 0;
                  return horas <= 0;
                }).length})
              </div>
              {filasOrdenadas
                .filter(fila => {
                  const timeEstimated = fila.properties?.["Time Estimated"]?.value;
                  const horas = typeof timeEstimated === 'number' ? timeEstimated : parseFloat(timeEstimated) || 0;
                  return horas <= 0;
                })
                .map((fila, idx) => (
                  <div
                    key={idx}
                    className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => abrirDrawer(fila)}
                  >
                    {fila.Name || "Sin nombre"}
                    <span className="text-xs text-gray-400 ml-2">(Sin horas estimadas)</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Ref para evitar bucles infinitos - rastrear si estamos actualizando desde el nodo
  const actualizandoDesdeNodoRef = useRef(false);
  const ultimoNodoRef = useRef(JSON.stringify({ filas: node.attrs.filas, propiedades: node.attrs.propiedades, sprintConfig: node.attrs.sprintConfig, comportamiento: node.attrs.comportamiento }));
  const registroInicializadoRef = useRef(false);
  const filaPorDefectoAgregadaRef = useRef(false);
  const vinculacionAutoEjecutadaRef = useRef(false);

  // Ref para evitar aplicar plantilla múltiples veces
  const plantillaAutoAplicadaRef = useRef(false);

  // Sincronizar estado cuando cambia el nodo (útil cuando se carga desde guardado)
  useEffect(() => {
    const nodoActualStr = JSON.stringify({ filas: node.attrs.filas, propiedades: node.attrs.propiedades, sprintConfig: node.attrs.sprintConfig, comportamiento: node.attrs.comportamiento });
    
    // Solo actualizar si el nodo realmente cambió
    if (nodoActualStr !== ultimoNodoRef.current) {
      actualizandoDesdeNodoRef.current = true;
      
    const nodoFilas = inicializarFilas(node.attrs.filas);
    const nodoPropiedades = (node.attrs.propiedades || []).map(p => ({ ...p, visible: p.visible !== undefined ? p.visible : true }));
      const nodoSprintConfig = node.attrs.sprintConfig || sprintConfig;
      const nodoComportamiento = node.attrs.comportamiento || null;
    
      setFilas(nodoFilas);
      setPropiedades(nodoPropiedades);
      setSprintConfig(nodoSprintConfig);
      setComportamiento(nodoComportamiento);
      
      ultimoNodoRef.current = nodoActualStr;
      
      // Resetear el flag en el siguiente tick
      requestAnimationFrame(() => {
        actualizandoDesdeNodoRef.current = false;
      });
    }
  }, [node.attrs.filas, node.attrs.propiedades, node.attrs.sprintConfig, node.attrs.comportamiento]);

  // Auto-aplicar plantilla basada en nombreTabla si la tabla está vacía
  useEffect(() => {
    // Solo aplicar si:
    // 1. No se ha aplicado ya
    // 2. Hay nombreTabla
    // 3. No hay propiedades (tabla nueva)
    // 4. No estamos actualizando desde el nodo
    if (plantillaAutoAplicadaRef.current || !nombreTabla || propiedades.length > 0 || actualizandoDesdeNodoRef.current) {
      return;
    }

    // Mapear nombreTabla a tipo de plantilla
    const nombreToPlantilla = {
      'Ingresos': 'ingresos',
      'Egresos': 'egresos',
      'Deudas': 'deuda',
      'Scrum Sprint': 'scrum'
    };

    const tipoPlantilla = nombreToPlantilla[nombreTabla];
    if (tipoPlantilla) {
      plantillaAutoAplicadaRef.current = true;
      // Usar setTimeout para asegurar que el componente esté completamente montado
      setTimeout(() => {
        aplicarPlantilla(tipoPlantilla);
      }, 100);
    }
  }, [nombreTabla, propiedades.length]);

  // Agregar fila por defecto si es tabla financiera y está vacía (solo una vez)
  useEffect(() => {
    // Solo agregar si:
    // 1. Es comportamiento financiero
    // 2. No hay filas
    // 3. Hay propiedades (la plantilla ya se aplicó)
    // 4. No estamos actualizando desde el nodo
    // 5. No se ha agregado ya una fila por defecto
    if (comportamiento === 'financiero' && 
        filas.length === 0 && 
        propiedades.length > 0 && 
        !actualizandoDesdeNodoRef.current &&
        !filaPorDefectoAgregadaRef.current) {
      
      filaPorDefectoAgregadaRef.current = true;
      
      const nuevaFila = {
        Name: "Nueva tarea",
        image: null,
        imageFilename: null,
        properties: {},
      };

      // Inicializar propiedades con valores por defecto
      propiedades.forEach((prop) => {
        let defaultValue = prop.type === "checkbox" ? false : prop.type === "tags" ? [] : prop.type === "formula" ? "" : "";
        let defaultColor = undefined;
        
        if (prop.type === "date") {
          defaultValue = new Date().toISOString().split('T')[0];
        }
        
        nuevaFila.properties[prop.name] = {
          type: prop.type,
          value: defaultValue,
          color: prop.type === "select" ? "#3b82f6" : defaultColor,
          formula: prop.type === "formula" ? (prop.formula || "") : undefined,
        };
      });

      setFilas([nuevaFila]);
    }
  }, [comportamiento, filas.length, propiedades.length]);

  // Efecto para pre-cargar datos de tablas vinculadas
  useEffect(() => {
    precargarDatosTablasVinculadas();
  }, [tablasVinculadas.length, tableId]);

  // Efecto para escuchar cambios en tablas vinculadas y re-evaluar fórmulas
  useEffect(() => {
    const handlerTablaActualizada = (event) => {
      const { tableId: tableIdActualizada } = event.detail;
      
      // Si la tabla actualizada está vinculada a esta tabla, re-evaluar fórmulas
      const estaVinculada = tablasVinculadas.some(v => v.tableId === tableIdActualizada);
      if (estaVinculada && tableIdActualizada !== tableId) {
        // Limpiar cache de esa tabla y recargar
        delete cacheDatosTablas.current[tableIdActualizada];
        precargarDatosTablasVinculadas();
        
        // Re-evaluar todas las fórmulas usando función de actualización
        setFilas(prevFilas => {
          const nuevasFilas = prevFilas.map(fila => {
            const nuevasProps = { ...fila.properties };
            Object.keys(nuevasProps).forEach(propName => {
              const prop = propiedades.find(p => p.name === propName);
              if (prop && prop.type === "formula" && prop.formula) {
                try {
                  const evaluator = new FormulaEvaluator(
                    fila,
                    prevFilas,
                    sprintConfig,
                    tablasVinculadas,
                    tableId,
                    cargarDatosTablaVinculada
                  );
                  const resultado = evaluator.evaluate(prop.formula);
                  nuevasProps[propName] = {
                    ...nuevasProps[propName],
                    value: resultado !== undefined && resultado !== null ? String(resultado) : ""
                  };
                } catch (error) {
                  // Error re-evaluando fórmula
                }
              }
            });
            return { ...fila, properties: nuevasProps };
          });
          return nuevasFilas;
        });
      }
    };
    
    const handlerTablasCargadas = () => {
      // Evitar re-evaluaciones simultáneas
      if (evaluandoFormulasRef.current) {
        return;
      }
      
      evaluandoFormulasRef.current = true;
      
      // Re-evaluar fórmulas cuando se cargan datos de tablas vinculadas
      // Usar función de actualización para evitar dependencia de filas
      setFilas(prevFilas => {
        const nuevasFilas = prevFilas.map(fila => {
          const nuevasProps = { ...fila.properties };
          Object.keys(nuevasProps).forEach(propName => {
            const prop = propiedades.find(p => p.name === propName);
            if (prop && prop.type === "formula" && prop.formula) {
              try {
                const evaluator = new FormulaEvaluator(
                  fila,
                  prevFilas,
                  sprintConfig,
                  tablasVinculadas,
                  tableId,
                  cargarDatosTablaVinculada
                );
                const resultado = evaluator.evaluate(prop.formula);
                nuevasProps[propName] = {
                  ...nuevasProps[propName],
                  value: resultado !== undefined && resultado !== null ? String(resultado) : ""
                };
              } catch (error) {
                // Error re-evaluando fórmula
              }
            }
          });
          return { ...fila, properties: nuevasProps };
        });
        
        // Liberar el flag después de un breve delay
        setTimeout(() => {
          evaluandoFormulasRef.current = false;
        }, 100);
        
        return nuevasFilas;
      });
    };
    
    window.addEventListener('tablaActualizada', handlerTablaActualizada);
    window.addEventListener('tablasVinculadasCargadas', handlerTablasCargadas);
    
    return () => {
      window.removeEventListener('tablaActualizada', handlerTablaActualizada);
      window.removeEventListener('tablasVinculadasCargadas', handlerTablasCargadas);
    };
  }, [tablasVinculadas, tableId, propiedades, sprintConfig]); // Removido 'filas' de dependencias

  // Efecto para disparar evento cuando esta tabla cambia
  useEffect(() => {
    // No disparar evento si estamos evaluando fórmulas (evitar bucles)
    if (evaluandoFormulasRef.current || precargandoTablasRef.current) {
      return;
    }
    
    if (tableId && (filas.length > 0 || propiedades.length > 0)) {
      // Usar setTimeout para evitar disparar el evento durante el renderizado
      setTimeout(() => {
        if (!evaluandoFormulasRef.current && !precargandoTablasRef.current) {
          // Disparar evento para notificar a otras tablas que esta tabla cambió
          window.dispatchEvent(new CustomEvent('tablaActualizada', {
            detail: { tableId }
          }));
        }
      }, 0);
    }
  }, [filas, propiedades, tableId]);

  // Efecto para registrar/actualizar la tabla en el registro global
  useEffect(() => {
    if (!tableId) return;
    
    const paginaId = PageContext.getCurrentPageId();
    if (!paginaId) {
      // Si no hay página actual aún, esperar un poco y reintentar
      const timeout = setTimeout(() => {
        const retryPageId = PageContext.getCurrentPageId();
        if (retryPageId) {
          registrarTablaEnRegistro(retryPageId);
        }
      }, 200);
      return () => clearTimeout(timeout);
    }
    
    registrarTablaEnRegistro(paginaId);
  }, [tableId, comportamiento, nombreTabla, propiedades.length]);
  

  // Función para registrar/actualizar la tabla en el registro
  const registrarTablaEnRegistro = (paginaId) => {
    if (!tableId || !paginaId) return;
    
    const columnas = propiedades.map(p => p.name);
    const tableInfo = {
      tipo: comportamiento || null,
      nombre: nombreTabla || `Tabla ${tableId.substring(0, 8)}`,
      paginaId,
      comportamiento: comportamiento || null,
      columnas,
      tablasVinculadas: tablasVinculadas || []
    };
    
    const existingTable = TableRegistryService.getTable(tableId);
    if (existingTable) {
      // Actualizar tabla existente
      TableRegistryService.updateTable(tableId, {
        ...tableInfo,
        columnas,
        comportamiento: comportamiento || null,
        nombre: nombreTabla || existingTable.nombre
      });
    } else {
      // Registrar nueva tabla
      TableRegistryService.registerTable(tableId, tableInfo);
      registroInicializadoRef.current = true;
      
      // Si es una tabla financiera y hay otras tablas financieras en la misma página, vincularlas automáticamente
      // Solo ejecutar una vez usando el ref
      if (comportamiento === 'financiero' && nombreTabla && !vinculacionAutoEjecutadaRef.current) {
        vinculacionAutoEjecutadaRef.current = true;
        setTimeout(() => {
          vincularTablasFinancierasAutomaticamente(paginaId);
        }, 500); // Esperar un poco para que otras tablas se registren
      }
    }
  };

  // Función para vincular automáticamente tablas financieras de la misma página
  const vincularTablasFinancierasAutomaticamente = (paginaId) => {
    if (!tableId || !paginaId) return;
    
    // Obtener todas las tablas financieras de la misma página
    const todasLasTablas = TableRegistryService.getTablesByPage(paginaId);
    const tablasFinancieras = todasLasTablas.filter(t => 
      t.comportamiento === 'financiero' && 
      t.tableId !== tableId && 
      t.nombre && 
      ['Ingresos', 'Egresos', 'Deudas'].includes(t.nombre)
    );
    
    // Si hay otras tablas financieras, vincular solo las que no estén ya vinculadas
    if (tablasFinancieras.length > 0) {
      // Obtener nombres únicos de tablas ya vinculadas
      const nombresYaVinculados = new Set(
        (tablasVinculadas || []).map(v => {
          const tablaInfo = TableRegistryService.getTable(v.tableId);
          return tablaInfo?.nombre;
        }).filter(Boolean)
      );
      
      // Filtrar tablas financieras: solo una por nombre único y que no esté ya vinculada
      const nombresVistos = new Set();
      const tablasParaVincular = tablasFinancieras.filter(t => {
        // Si ya hay una tabla con este nombre vinculada, no agregar otra
        if (nombresYaVinculados.has(t.nombre)) {
          return false;
        }
        
        // Si ya vimos una tabla con este nombre en esta iteración, no agregar otra
        if (nombresVistos.has(t.nombre)) {
          return false;
        }
        
        nombresVistos.add(t.nombre);
        return true;
      });
      
      // Solo agregar las tablas que no están ya vinculadas
      const nuevasVinculaciones = tablasParaVincular
        .filter(t => !tablasVinculadas?.some(v => v.tableId === t.tableId))
        .map(t => ({
          tableId: t.tableId,
          relacion: 'balance',
          columnas: {
            origen: null,
            destino: null
          }
        }));
      
      if (nuevasVinculaciones.length > 0) {
        // También vincular esta tabla en las otras tablas (solo si no está ya vinculada)
        tablasParaVincular.forEach(t => {
          const tablaInfo = TableRegistryService.getTable(t.tableId);
          if (tablaInfo && (!tablaInfo.tablasVinculadas || !tablaInfo.tablasVinculadas.some(v => v.tableId === tableId))) {
            const vinculacionesExistentes = tablaInfo.tablasVinculadas || [];
            TableRegistryService.updateTable(t.tableId, {
              tablasVinculadas: [
                ...vinculacionesExistentes,
                {
                  tableId: tableId,
                  relacion: 'balance',
                  columnas: {
                    origen: null,
                    destino: null
                  }
                }
              ]
            });
          }
        });
        
        // Actualizar esta tabla solo con las nuevas vinculaciones
        const todasLasVinculaciones = [...(tablasVinculadas || []), ...nuevasVinculaciones];
        setTablasVinculadas(todasLasVinculaciones);
        TableRegistryService.updateTable(tableId, {
          tablasVinculadas: todasLasVinculaciones
        });
      }
    }
  };

  // Actualizar atributos del nodo cuando cambian filas o propiedades (solo si no viene del nodo)
  const prevEstadoRef = useRef(null);
  useEffect(() => {
    // Inicializar en la primera ejecución
    if (prevEstadoRef.current === null) {
      prevEstadoRef.current = { filas, propiedades, sprintConfig, comportamiento, tableId, nombreTabla, tablasVinculadas };
      return;
    }
    // No actualizar si el cambio viene del nodo mismo
    if (actualizandoDesdeNodoRef.current) {
      prevEstadoRef.current = { filas, propiedades, sprintConfig, comportamiento, tableId, nombreTabla, tablasVinculadas };
      return;
    }
    
    // Comparar si realmente cambió algo
    const filasCambiaron = JSON.stringify(prevEstadoRef.current.filas) !== JSON.stringify(filas);
    const propiedadesCambiaron = JSON.stringify(prevEstadoRef.current.propiedades) !== JSON.stringify(propiedades);
    const sprintConfigCambio = JSON.stringify(prevEstadoRef.current.sprintConfig) !== JSON.stringify(sprintConfig);
    const comportamientoCambio = prevEstadoRef.current.comportamiento !== comportamiento;
    const tableIdCambio = prevEstadoRef.current.tableId !== tableId;
    const nombreTablaCambio = prevEstadoRef.current.nombreTabla !== nombreTabla;
    const tablasVinculadasCambio = JSON.stringify(prevEstadoRef.current.tablasVinculadas) !== JSON.stringify(tablasVinculadas);
    
    if (filasCambiaron || propiedadesCambiaron || sprintConfigCambio || comportamientoCambio || tableIdCambio || nombreTablaCambio || tablasVinculadasCambio) {
      updateAttributes({ filas, propiedades, sprintConfig, comportamiento, tableId, nombreTabla, tablasVinculadas });
      prevEstadoRef.current = { filas, propiedades, sprintConfig, comportamiento, tableId, nombreTabla, tablasVinculadas };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, propiedades, sprintConfig, comportamiento, tableId, nombreTabla, tablasVinculadas]);

  return (
    <NodeViewWrapper 
      className={`relative border rounded bg-white shadow p-4 text-sm ${usarAnchoCompleto ? 'notion-table-fullwidth' : ''}`}
      style={usarAnchoCompleto ? { 
        position: 'relative',
        left: `calc(-1 * (50vw - 50% - var(--sidebar-width, 256px) + 1rem))`,
        width: `calc(100vw - var(--sidebar-width, 256px))`,
        maxWidth: `calc(100vw - var(--sidebar-width, 256px))`,
        marginLeft: 0,
        marginRight: 0,
        paddingLeft: '1rem',
        paddingRight: '1rem'
      } : {}}
    >
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => {
            setShowDeleteTableModal(true);
          }}
          className="bg-white border border-gray-300 rounded px-2 py-1 text-xs shadow-sm hover:bg-red-100 hover:border-red-300 transition-colors"
          title="Eliminar tabla"
        >
          🗑️
        </button>
      </div>

      {/* Configuración del Sprint - Compacta (solo para tablas Scrum) */}
      {(comportamiento === 'scrum' || comportamiento === 'mixto') && (
      <div className="mb-3">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">📅 Inicio:</span>
            <input
              type="date"
              value={sprintConfig.sprintStartDate || ''}
              onChange={(e) => {
                setSprintConfig({ ...sprintConfig, sprintStartDate: e.target.value });
              }}
              className="border rounded px-1.5 py-0.5 text-xs w-32"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">📅 Fin:</span>
            <input
              type="date"
              value={sprintConfig.sprintEndDate || ''}
              onChange={(e) => {
                setSprintConfig({ ...sprintConfig, sprintEndDate: e.target.value });
              }}
              className="border rounded px-1.5 py-0.5 text-xs w-32"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">⏰ Horas/día:</span>
            <input
              type="number"
              min="1"
              max="24"
              value={sprintConfig.horasDiarias || 8}
              onChange={(e) => {
                const horas = parseInt(e.target.value) || 8;
                setSprintConfig({ ...sprintConfig, horasDiarias: horas });
              }}
              className="border rounded px-1.5 py-0.5 text-xs w-14"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600">📊 Puntos:</span>
            <input
              type="number"
              min="0"
              step="1"
              value={sprintConfig.puntosTotalesSprint || ''}
              onChange={(e) => {
                const valor = e.target.value === '' ? null : Number(e.target.value);
                setSprintConfig({ ...sprintConfig, puntosTotalesSprint: valor });
              }}
              className="border rounded px-1.5 py-0.5 text-xs w-14"
              placeholder="8"
              title="Puntos objetivo del sprint (Fibonacci: 1, 2, 3, 5, 8, 13, 21...)"
            />
          </div>
          <button
            onClick={() => setShowDiasNoTrabajadosModal(true)}
            className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs text-gray-700 transition-colors"
            title="Configurar días no trabajados"
          >
            <span>🚫</span>
            <span>Días no trabajados</span>
            {sprintConfig.diasNoTrabajados && sprintConfig.diasNoTrabajados.length > 0 && (
              <span className="bg-blue-500 text-white rounded-full px-1.5 py-0 text-xs font-semibold min-w-[18px] text-center">
                {sprintConfig.diasNoTrabajados.length}
              </span>
            )}
          </button>
        </div>
        
        {/* Visualización de Indicadores del Sprint */}
        {(() => {
          // Calcular fecha actual
          const hoy = new Date();
          const año = hoy.getFullYear();
          const mes = String(hoy.getMonth() + 1).padStart(2, '0');
          const dia = String(hoy.getDate()).padStart(2, '0');
          const fechaActual = `${año}-${mes}-${dia}`;
          
          // Calcular días hábiles
          const diasHabilesTranscurridos = sprintConfig.sprintStartDate && fechaActual 
            ? calcularDiasHabiles(sprintConfig.sprintStartDate, fechaActual)
            : 0;
          const diasHabilesTotales = sprintConfig.sprintStartDate && sprintConfig.sprintEndDate
            ? calcularDiasHabiles(sprintConfig.sprintStartDate, sprintConfig.sprintEndDate)
            : 0;
          const diasHabilesFaltantes = sprintConfig.sprintEndDate && fechaActual
            ? calcularDiasHabiles(fechaActual, sprintConfig.sprintEndDate)
            : 0;
          
          // Calcular horas
          const horasDiarias = sprintConfig.horasDiarias || 8;
          const horasDisponibles = diasHabilesTranscurridos * horasDiarias;
          const horasTotalesSprint = diasHabilesTotales * horasDiarias;
          
          // Calcular puntos
          const puntosTotalesObjetivo = sprintConfig.puntosTotalesSprint;
          const puntosTotalesActuales = calcularTotal(filas, "Puntos de Historia");
          const porcentajePuntos = puntosTotalesObjetivo && puntosTotalesObjetivo > 0 
            ? Math.round((puntosTotalesActuales / puntosTotalesObjetivo) * 100) 
            : null;
          const esValidoPuntos = puntosTotalesObjetivo && puntosTotalesObjetivo >= 3 && puntosTotalesObjetivo <= 8;
          const esMuyAltoPuntos = puntosTotalesObjetivo && puntosTotalesObjetivo > 8;
          const esMuyBajoPuntos = puntosTotalesObjetivo && puntosTotalesObjetivo > 0 && puntosTotalesObjetivo < 3;
          
          // Solo mostrar si hay configuración mínima
          if (!sprintConfig.sprintStartDate || !sprintConfig.sprintEndDate) return null;
          
          return (
            <div className="mt-1.5 flex gap-2 flex-wrap">
              {/* Días Hábiles */}
              <div className="flex-1 min-w-[200px] p-2 bg-blue-50 rounded border border-blue-200 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-blue-700 font-semibold">📅 Días Hábiles:</span>
                    <span className="text-blue-900 font-medium">{diasHabilesTranscurridos}</span>
                    <span className="text-blue-500">/</span>
                    <span className="text-blue-900 font-medium">{diasHabilesTotales}</span>
                    {diasHabilesFaltantes > 0 && (
                      <span className="text-blue-700 text-xs">({diasHabilesFaltantes} faltantes)</span>
                    )}
                  </div>
                  <div className="text-blue-600 text-xs whitespace-nowrap">
                    {diasHabilesTotales > 0 
                      ? `${Math.round((diasHabilesTranscurridos / diasHabilesTotales) * 100)}%`
                      : '0%'}
                  </div>
                </div>
                {diasHabilesTotales > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min((diasHabilesTranscurridos / diasHabilesTotales) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Horas */}
              <div className="flex-1 min-w-[200px] p-2 bg-purple-50 rounded border border-purple-200 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-purple-700 font-semibold">⏰ Horas:</span>
                    <span className="text-purple-900 font-medium">{horasDisponibles}h</span>
                    <span className="text-purple-500">/</span>
                    <span className="text-purple-900 font-medium">{horasTotalesSprint}h</span>
                  </div>
                  <div className="text-purple-600 text-xs whitespace-nowrap">
                    {horasTotalesSprint > 0 
                      ? `${Math.round((horasDisponibles / horasTotalesSprint) * 100)}%`
                      : '0%'}
                  </div>
                </div>
                {horasTotalesSprint > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-purple-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-purple-500 transition-all"
                        style={{ width: `${Math.min((horasDisponibles / horasTotalesSprint) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Puntos (solo si hay objetivo definido) */}
              {puntosTotalesObjetivo !== null && puntosTotalesObjetivo !== undefined && (
                <div className="flex-1 min-w-[200px] p-2 bg-green-50 rounded border border-green-200 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-green-700 font-semibold">📊 Puntos:</span>
                      <span className="text-green-900 font-medium">{puntosTotalesActuales}</span>
                      <span className="text-green-500">/</span>
                      <span className="text-green-900 font-medium">{puntosTotalesObjetivo}</span>
                      {porcentajePuntos !== null && (
                        <span className="text-green-600">({porcentajePuntos}%)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {esValidoPuntos && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs whitespace-nowrap">
                          ✅ OK
                        </span>
                      )}
                      {esMuyAltoPuntos && (
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs whitespace-nowrap">
                          ⚠️ Dividir
                        </span>
                      )}
                      {esMuyBajoPuntos && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs whitespace-nowrap">
                          📊 Pequeño
                        </span>
                      )}
                    </div>
                  </div>
                  {porcentajePuntos !== null && (
                    <div className="mt-1">
                      <div className="w-full bg-green-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            porcentajePuntos <= 100 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(porcentajePuntos, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
      )}

      {/* Visualización de Indicadores Financieros (solo para tablas financieras) */}
      {(() => {
          if (comportamiento !== 'financiero' && comportamiento !== 'mixto') return null;
          
          // Verificar si hay campos financieros en la tabla
          const tieneIngresos = propiedades.some(p => p.name === "Ingresos");
          const tieneEgresos = propiedades.some(p => p.name === "Egresos");
          const tieneDeudas = propiedades.some(p => p.name === "Deudas");
          
          // Solo mostrar si hay al menos uno de los campos financieros
          if (!tieneIngresos && !tieneEgresos && !tieneDeudas) return null;
          
          // Calcular totales
          const totalIngresos = tieneIngresos ? calcularTotal(filas, "Ingresos") : 0;
          const totalEgresos = tieneEgresos ? calcularTotal(filas, "Egresos") : 0;
          const totalDeudas = tieneDeudas ? calcularTotal(filas, "Deudas") : 0;
          const saldoTotal = totalIngresos - totalEgresos;
          
          // Calcular porcentajes
          const porcentajeEgresos = totalIngresos > 0 ? Math.round((totalEgresos / totalIngresos) * 100) : 0;
          const porcentajeDeudas = totalIngresos > 0 ? Math.round((totalDeudas / totalIngresos) * 100) : 0;
          
          // Formatear números con separador de miles
          const formatearNumero = (num) => {
            return new Intl.NumberFormat('es-ES', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 2 
            }).format(num);
          };
          
          return (
            <div className="mt-2 flex gap-2 flex-wrap">
              {/* Ingresos */}
              {tieneIngresos && (
                <div className="flex-1 min-w-[200px] p-2 bg-green-50 rounded border border-green-200 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-green-700 font-semibold">💰 Ingresos:</span>
                    <span className="text-green-900 font-medium">${formatearNumero(totalIngresos)}</span>
                  </div>
                </div>
              )}
              
              {/* Egresos */}
              {tieneEgresos && (
                <div className="flex-1 min-w-[200px] p-2 bg-red-50 rounded border border-red-200 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-red-700 font-semibold">💸 Egresos:</span>
                    <span className="text-red-900 font-medium">${formatearNumero(totalEgresos)}</span>
                    {totalIngresos > 0 && (
                      <span className="text-red-600 text-xs whitespace-nowrap">
                        ({porcentajeEgresos}%)
                      </span>
                    )}
                  </div>
                  {totalIngresos > 0 && (
                    <div className="mt-1">
                      <div className="w-full bg-red-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-red-500 transition-all"
                          style={{ width: `${Math.min(porcentajeEgresos, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Saldo */}
              {(tieneIngresos || tieneEgresos) && (
                <div className={`flex-1 min-w-[200px] p-2 rounded border text-xs ${
                  saldoTotal >= 0 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-semibold ${
                      saldoTotal >= 0 ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      💼 Saldo:
                    </span>
                    <span className={`font-medium ${
                      saldoTotal >= 0 ? 'text-blue-900' : 'text-orange-900'
                    }`}>
                      ${formatearNumero(saldoTotal)}
                    </span>
                    <span className={`text-xs whitespace-nowrap ${
                      saldoTotal >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {saldoTotal >= 0 ? '✅' : '⚠️'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Deudas */}
              {tieneDeudas && (
                <div className="flex-1 min-w-[200px] p-2 bg-yellow-50 rounded border border-yellow-200 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-yellow-700 font-semibold">📋 Deudas:</span>
                    <span className="text-yellow-900 font-medium">${formatearNumero(totalDeudas)}</span>
                    {totalIngresos > 0 && (
                      <span className="text-yellow-600 text-xs whitespace-nowrap">
                        ({porcentajeDeudas}%)
                      </span>
                    )}
                  </div>
                  {totalIngresos > 0 && (
                    <div className="mt-1">
                      <div className="w-full bg-yellow-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full bg-yellow-500 transition-all"
                          style={{ width: `${Math.min(porcentajeDeudas, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      {/* Mostrar tablas vinculadas - eliminar duplicados */}
      {tablasVinculadas && tablasVinculadas.length > 0 && (() => {
        // Eliminar duplicados basados en tableId
        const tablasUnicas = tablasVinculadas.filter((vinculacion, index, self) => 
          index === self.findIndex(t => t.tableId === vinculacion.tableId)
        );
        
        if (tablasUnicas.length === 0) return null;
        
        // Agrupar por nombre para mostrar solo una vez cada nombre único
        // Si hay múltiples tablas con el mismo nombre, mostrar solo la primera
        const nombresVistos = new Set();
        const tablasParaMostrar = tablasUnicas.filter((vinculacion) => {
          const tablaInfo = TableRegistryService.getTable(vinculacion.tableId);
          const nombre = tablaInfo?.nombre || vinculacion.tableId.substring(0, 8);
          
          if (nombresVistos.has(nombre)) {
            return false; // Ya mostramos una tabla con este nombre
          }
          
          nombresVistos.add(nombre);
          return true;
        });
        
        if (tablasParaMostrar.length === 0) return null;
        
        return (
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">🔗 Tablas vinculadas:</span>
            {tablasParaMostrar.map((vinculacion, idx) => {
              const tablaInfo = TableRegistryService.getTable(vinculacion.tableId);
              const nombre = tablaInfo?.nombre || vinculacion.tableId.substring(0, 8);
              return (
                <span
                  key={vinculacion.tableId || idx}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200"
                  title={`Relación: ${vinculacion.relacion || 'referencia'} | ID: ${vinculacion.tableId.substring(0, 8)}`}
                >
                  {nombre}
                </span>
              );
            })}
          </div>
        );
      })()}
      
      <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Filtrar..."
          className="border px-2 py-1 rounded w-64"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <div className="flex gap-2 items-center">
          <TableViewSelector
            currentView={tipoVista}
            onViewChange={setTipoVista}
          />
          <button 
            onClick={() => {
              setTablaColapsada(!tablaColapsada);
            }}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              tablaColapsada 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={tablaColapsada ? "Expandir tabla para ver todas las filas" : "Colapsar tabla para ver solo totales"}
          >
            {tablaColapsada ? '🔽 Expandir Tabla' : '🔼 Colapsar Tabla'}
          </button>
          <button 
            onClick={() => setUsarAnchoCompleto(!usarAnchoCompleto)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              usarAnchoCompleto 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            title={usarAnchoCompleto ? "Usar ancho centrado" : "Usar todo el ancho de la página"}
          >
            {usarAnchoCompleto ? '📐 Centrado' : '📏 Ancho completo'}
          </button>
        <button onClick={agregarFila} className="bg-blue-600 text-white px-3 py-1 rounded">
          ➕ Agregar fila
        </button>
        <div className="relative">
        <button
          onClick={() => setShowMenuConfig(!showMenuConfig)}
            className="bg-white border border-gray-300 shadow-sm hover:bg-gray-100 px-3 py-1 rounded text-gray-700 transition-colors"
          title="Más opciones"
        >
          <span className="text-lg">⋯</span>
        </button>
        {showMenuConfig && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setShowMenuConfig(false)}
            />
              <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-xl z-[100] min-w-[200px] py-2" style={{ position: 'absolute' }}>
              <button
                onClick={() => {
                  setShowPropertyVisibilityModal(true);
                  setShowMenuConfig(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
              >
                <span>👁️</span>
                <span>Propiedades visibles</span>
              </button>
                <button
                  onClick={() => {
                    setShowPlantillasModal(true);
                    setShowMenuConfig(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <span>📑</span>
                  <span>Plantillas</span>
                </button>
                <button
                  onClick={() => {
                    setShowColumnasSugeridasModal(true);
                    setColumnasSeleccionadas([]);
                    setShowMenuConfig(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <span>📋</span>
                  <span>Columnas sugeridas</span>
                </button>
                <button
                  onClick={() => {
                    setShowVincularModal(true);
                    setShowMenuConfig(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <span>🔗</span>
                  <span>Vincular Tablas</span>
                </button>
                {tablasVinculadas && tablasVinculadas.length > 0 && (
                  <button
                    onClick={() => {
                      setShowGraficasModal(true);
                      setShowMenuConfig(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <span>📊</span>
                    <span>Gráficas Combinadas</span>
                  </button>
                )}
                <div className="border-t my-1">
                  <div className="px-4 py-2 text-xs text-gray-500 font-semibold">
                    Vista
                  </div>
                  <button
                    onClick={() => {
                      setTipoVista('table');
                      setShowMenuConfig(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm ${
                      tipoVista === 'table' ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span>⊞</span>
                    <span>Tabla</span>
                    {tipoVista === 'table' && <span className="ml-auto text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setTipoVista('timeline');
                      setShowMenuConfig(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm ${
                      tipoVista === 'timeline' ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span>📄</span>
                    <span>Timeline</span>
                    {tipoVista === 'timeline' && <span className="ml-auto text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setTipoVista('kanban');
                      setShowMenuConfig(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm ${
                      tipoVista === 'kanban' ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span>📋</span>
                    <span>Kanban</span>
                    {tipoVista === 'kanban' && <span className="ml-auto text-xs">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setTipoVista('gallery');
                      setShowMenuConfig(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm ${
                      tipoVista === 'gallery' ? 'bg-gray-50' : ''
                    }`}
                  >
                    <span>🖼️</span>
                    <span>Galería</span>
                    {tipoVista === 'gallery' && <span className="ml-auto text-xs">✓</span>}
                  </button>
                </div>
              {sprintInfo && (
                <button
                  onClick={() => {
                    setShowSprintStatsModal(true);
                    setShowMenuConfig(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <span>📊</span>
                  <span>Estadísticas del Sprint</span>
                </button>
              )}
              {propiedadesVisibles.length > 0 && (
                <div className="border-t my-1">
                  <div className="px-4 py-2 text-xs text-gray-500 font-semibold">
                    Eliminar Columnas
                  </div>
                  {propiedadesVisibles.map((prop) => (
                    <button
                      key={prop.name}
                      onClick={() => {
                        setColumnaAEliminar(prop.name);
                        setShowDeleteColumnModal(true);
                        setShowMenuConfig(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-sm"
                    >
                      <span>🗑️</span>
                      <span>{prop.name}</span>
                    </button>
                  ))}
                </div>
              )}
                <div className="border-t my-1">
        <button
                    onClick={() => {
                      setShowEditNombreModal(true);
                      setShowMenuConfig(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <span>✏️</span>
                    <span>Editar Nombre</span>
        </button>
          <button 
            onClick={() => {
                      setShowDeleteTableModal(true);
                      setShowMenuConfig(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-sm"
                  >
                    <span>🗑️</span>
                    <span>Eliminar Tabla</span>
        </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Panel de Indicadores del Sprint */}
      {(comportamiento === 'scrum' || comportamiento === 'mixto') && (tipoVista === 'table' || tipoVista === 'timeline') && (() => {
        // Calcular indicadores del sprint
        const calcularIndicadores = () => {
          const hoy = new Date();
          const hoyStr = hoy.toISOString().split('T')[0];
          
          let totalTareas = filas.length;
          let tareasCompletadas = 0;
          let tareasEnProgreso = 0;
          let tareasPendientes = 0;
          let totalProgress = 0;
          let totalObjective = 0;
          let totalTimeSpent = 0;
          let totalTimeEstimated = 0;
          let totalTasksCompleted = 0;
          let totalTasksTotal = 0;
          let diasTranscurridos = 0;
          let diasFaltantes = 0;
          let fechaInicioSprint = null;
          let fechaFinSprint = null;
          
          let porcentajesIndividuales = [];
          
          filas.forEach(fila => {
            // Tareas completadas
            const done = fila.properties?.["Done"]?.value || false;
            const estado = fila.properties?.["Estado"]?.value || "";
            if (done || estado === "Completado") {
              tareasCompletadas++;
            } else if (estado === "En progreso" || estado === "En pr") {
              tareasEnProgreso++;
            } else {
              tareasPendientes++;
            }
            
            // Progress y Objective - calcular porcentaje individual por fila
            const progress = parseFloat(fila.properties?.["Progress"]?.value || 0);
            // Si no hay Objective definido, usar 100 como valor por defecto (cada tarea es sobre 100%)
            const objective = parseFloat(fila.properties?.["Objective"]?.value || 100);
            totalProgress += progress;
            totalObjective += objective;
            
            // Calcular porcentaje individual de esta fila
            // Siempre calcular el porcentaje, usando 100 como default si objective es 0
            const objectiveParaCalculo = objective > 0 ? objective : 100;
            const porcentajeIndividual = (progress / objectiveParaCalculo) * 100;
            porcentajesIndividuales.push(porcentajeIndividual);
            
            // Time Spent y Estimated
            const timeSpent = parseFloat(fila.properties?.["Time Spent"]?.value || 0);
            const timeEstimated = parseFloat(fila.properties?.["Time Estimated"]?.value || 0);
            totalTimeSpent += timeSpent;
            totalTimeEstimated += timeEstimated;
            
            // Tasks Completed y Total Tasks
            const tasksCompleted = parseFloat(fila.properties?.["Tasks Completed"]?.value || 0);
            const tasksTotal = parseFloat(fila.properties?.["Total Tasks"]?.value || 0);
            totalTasksCompleted += tasksCompleted;
            totalTasksTotal += tasksTotal;
            
            // Fechas del sprint
            const startDate = fila.properties?.["Start Date"]?.value || "";
            const endDate = fila.properties?.["End Date"]?.value || "";
            if (startDate && (!fechaInicioSprint || startDate < fechaInicioSprint)) {
              fechaInicioSprint = startDate;
            }
            if (endDate && (!fechaFinSprint || endDate > fechaFinSprint)) {
              fechaFinSprint = endDate;
            }
          });
          
          // Calcular días transcurridos y faltantes
          if (fechaInicioSprint && fechaFinSprint) {
            const inicio = new Date(fechaInicioSprint);
            const fin = new Date(fechaFinSprint);
            const hoyDate = new Date(hoyStr);
            
            if (hoyDate >= inicio && hoyDate <= fin) {
              diasTranscurridos = Math.floor((hoyDate - inicio) / (1000 * 60 * 60 * 24)) + 1;
              diasFaltantes = Math.floor((fin - hoyDate) / (1000 * 60 * 60 * 24));
            } else if (hoyDate < inicio) {
              diasTranscurridos = 0;
              diasFaltantes = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
            } else {
              const totalDias = Math.floor((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
              diasTranscurridos = totalDias;
              diasFaltantes = 0;
            }
          }
          
          // Calcular porcentajes
          // El porcentaje de cumplimiento debe ser el promedio de los porcentajes individuales de cada fila
          // porque cada fila tiene su propio 100% (Objective)
          let porcentajeCumplimiento = 0;
          if (porcentajesIndividuales.length > 0) {
            const sumaPorcentajes = porcentajesIndividuales.reduce((sum, p) => sum + p, 0);
            const promedio = sumaPorcentajes / porcentajesIndividuales.length;
            porcentajeCumplimiento = Math.round(promedio);
          }
          const porcentajeTareas = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;
          const porcentajeTiempo = totalTimeEstimated > 0 ? Math.round((totalTimeSpent / totalTimeEstimated) * 100) : 0;
          const porcentajeSubtareas = totalTasksTotal > 0 ? Math.round((totalTasksCompleted / totalTasksTotal) * 100) : 0;
          
          return {
            totalTareas,
            tareasCompletadas,
            tareasEnProgreso,
            tareasPendientes,
            porcentajeCumplimiento,
            porcentajeTareas,
            porcentajeTiempo,
            porcentajeSubtareas,
            totalProgress,
            totalObjective,
            totalTimeSpent,
            totalTimeEstimated,
            totalTasksCompleted,
            totalTasksTotal,
            diasTranscurridos,
            diasFaltantes,
            fechaInicioSprint,
            fechaFinSprint
          };
        };
        
        const indicadores = calcularIndicadores();
        
        return (
          <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              📊 Indicadores del Sprint
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-2">
              {/* Tareas */}
              <div className="bg-white rounded p-1.5 shadow-sm">
                <div className="text-[10px] text-gray-500 mb-0.5">Total</div>
                <div className="text-lg font-bold text-gray-800">{indicadores.totalTareas}</div>
              </div>
              <div className="bg-green-50 rounded p-1.5 shadow-sm border border-green-200">
                <div className="text-[10px] text-green-600 mb-0.5 leading-tight">✅ Completadas</div>
                <div className="text-lg font-bold text-green-700">{indicadores.tareasCompletadas}</div>
              </div>
              <div className="bg-blue-50 rounded p-1.5 shadow-sm border border-blue-200">
                <div className="text-[10px] text-blue-600 mb-0.5 leading-tight">🔄 En Progreso</div>
                <div className="text-lg font-bold text-blue-700">{indicadores.tareasEnProgreso}</div>
              </div>
              <div className="bg-orange-50 rounded p-1.5 shadow-sm border border-orange-200">
                <div className="text-[10px] text-orange-600 mb-0.5 leading-tight">⏳ Pendientes</div>
                <div className="text-lg font-bold text-orange-700">{indicadores.tareasPendientes}</div>
              </div>
              
              {/* Porcentajes */}
              <div className="bg-purple-50 rounded p-1.5 shadow-sm border border-purple-200">
                <div className="text-[10px] text-purple-600 mb-0.5 leading-tight">📈 Cumplimiento</div>
                <div className="text-lg font-bold text-purple-700">{indicadores.porcentajeCumplimiento}%</div>
                <div className="text-[9px] text-gray-500 leading-tight">
                  {indicadores.totalProgress}/{indicadores.totalObjective}
                </div>
              </div>
              <div className="bg-indigo-50 rounded p-1.5 shadow-sm border border-indigo-200">
                <div className="text-[10px] text-indigo-600 mb-0.5 leading-tight">✅ Tareas</div>
                <div className="text-lg font-bold text-indigo-700">{indicadores.porcentajeTareas}%</div>
              </div>
              
              {/* Tiempo */}
              <div className="bg-cyan-50 rounded p-1.5 shadow-sm border border-cyan-200">
                <div className="text-[10px] text-cyan-600 mb-0.5 leading-tight">⏱️ Tiempo</div>
                <div className="text-lg font-bold text-cyan-700">{indicadores.porcentajeTiempo}%</div>
                <div className="text-[9px] text-gray-500 leading-tight">
                  {indicadores.totalTimeSpent}h/{indicadores.totalTimeEstimated}h
                </div>
              </div>
              
              {/* Subtareas */}
              {indicadores.totalTasksTotal > 0 && (
                <div className="bg-pink-50 rounded p-1.5 shadow-sm border border-pink-200">
                  <div className="text-[10px] text-pink-600 mb-0.5 leading-tight">📋 Subtareas</div>
                  <div className="text-lg font-bold text-pink-700">{indicadores.porcentajeSubtareas}%</div>
                  <div className="text-[9px] text-gray-500 leading-tight">
                    {indicadores.totalTasksCompleted}/{indicadores.totalTasksTotal}
                  </div>
                </div>
              )}
              
              {/* Días */}
              {indicadores.fechaInicioSprint && indicadores.fechaFinSprint && (
                <>
                  <div className="bg-teal-50 rounded p-1.5 shadow-sm border border-teal-200">
                    <div className="text-[10px] text-teal-600 mb-0.5 leading-tight">📅 Transcurridos</div>
                    <div className="text-lg font-bold text-teal-700">{indicadores.diasTranscurridos}</div>
                  </div>
                  <div className="bg-amber-50 rounded p-1.5 shadow-sm border border-amber-200">
                    <div className="text-[10px] text-amber-600 mb-0.5 leading-tight">⏰ Faltantes</div>
                    <div className="text-lg font-bold text-amber-700">{indicadores.diasFaltantes}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Vista Timeline */}
      {tipoVista === 'timeline' && (
        <div className="w-full overflow-x-auto">
          <TimelineView
            filas={filasFiltradas}
            propiedades={propiedadesVisibles}
            onSelectFila={(index) => {
              const fila = filasFiltradas[index];
              // Usar setTimeout para asegurar que los setState se ejecuten fuera del ciclo de renderizado
              setTimeout(() => {
                setFilaSeleccionada(fila);
                setShowDrawer(true);
              }, 0);
            }}
          />
        </div>
      )}

      {/* Vista Kanban */}
      {tipoVista === 'kanban' && (
        <div className="w-full overflow-x-auto">
          <KanbanView
            filas={filasFiltradas}
            propiedades={propiedadesVisibles}
            onUpdateFila={(index, updatedFila) => {
              // Sincronizar Name entre nivel superior y properties.Name
              if (updatedFila.properties?.Name?.value && updatedFila.properties.Name.value !== updatedFila.Name) {
                updatedFila.Name = updatedFila.properties.Name.value;
              } else if (updatedFila.Name && (!updatedFila.properties?.Name || updatedFila.properties.Name.value !== updatedFila.Name)) {
                if (!updatedFila.properties) updatedFila.properties = {};
                updatedFila.properties.Name = {
                  type: 'text',
                  ...updatedFila.properties.Name,
                  value: updatedFila.Name
                };
              }
              
              // Encontrar el índice real en el array original (no filtrado)
              const filaOriginal = filasFiltradas[index];
              const realIndex = filas.findIndex(f => f.id === filaOriginal.id);
              
              if (realIndex !== -1) {
                const nuevasFilas = [...filas];
                nuevasFilas[realIndex] = updatedFila;
                setFilas(nuevasFilas);
                guardarFilas(nuevasFilas);
              }
            }}
            onSelectFila={(index) => {
              const fila = filasFiltradas[index];
              if (!fila) return;
              
              // Encontrar el índice real en el array original
              const realIndex = filas.findIndex(f => f.id === fila.id);
              // Usar setTimeout para asegurar que los setState se ejecuten fuera del ciclo de renderizado
              setTimeout(() => {
                setFilaSeleccionada(realIndex !== -1 ? realIndex : index);
                setShowDrawer(true);
              }, 0);
            }}
          />
        </div>
      )}

      {/* Vista Gallery */}
      {tipoVista === 'gallery' && (
        <div className="w-full">
          <GalleryView
            filas={filasFiltradas}
            propiedades={propiedadesVisibles}
            onSelectFila={(index) => {
              const fila = filasFiltradas[index];
              // Usar setTimeout para asegurar que los setState se ejecuten fuera del ciclo de renderizado
              setTimeout(() => {
                setFilaSeleccionada(fila);
                setShowDrawer(true);
              }, 0);
            }}
          />
        </div>
      )}

      {/* Vista de escritorio - Tabla tradicional */}
      {tipoVista === 'table' && (
        <div className={`hidden md:block notion-table-desktop ${usarAnchoCompleto ? 'w-full' : ''}`}>
        <table className={usarAnchoCompleto ? 'w-full' : ''}>
          <thead>
            <tr>
              <th className="cursor-pointer sticky left-0 z-20 bg-inherit" onClick={() => toggleSort("Name")} style={{ minWidth: '250px', width: '250px', maxWidth: '250px' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs opacity-60">Aa</span>
                  <span>Nombre</span>
                  {sortBy === "Name" && <span className="text-[10px] opacity-60">{sortAsc ? "↑" : "↓"}</span>}
                </div>
              </th>
              <th style={{ minWidth: '40px', maxWidth: '40px', width: '40px' }} className="text-center">
                <span className="text-xs opacity-60">⋯</span>
              </th>
              {propiedadesVisibles.map((p, idx) => {
                // Dividir el nombre en palabras
                const palabras = p.name.split(/\s+/);
                const tieneDosPalabras = palabras.length === 2;
                const tieneMasPalabras = palabras.length > 2;
                
                // Obtener ancho usando la función helper (considera width personalizado)
                const width = obtenerAnchoColumna(p);
                const minWidth = p.type === "checkbox" ? '50px' : '80px';
                
                // Mostrar el texto completo en una sola línea si el nombre es corto
                // Solo dividir si el nombre es muy largo (más de 15 caracteres)
                const nombreLargo = p.name.length > 15;
                let textoSuperior = p.name;
                let textoInferior = '';
                
                if (nombreLargo && tieneDosPalabras) {
                  textoSuperior = palabras[0];
                  textoInferior = palabras[1];
                } else if (nombreLargo && tieneMasPalabras) {
                  // Dividir por la mitad aproximada solo si es muy largo
                  const mitad = Math.ceil(palabras.length / 2);
                  textoSuperior = palabras.slice(0, mitad).join(' ');
                  textoInferior = palabras.slice(mitad).join(' ');
                }
                
                return (
                <th
                  key={idx}
                  className="cursor-pointer relative group"
                  onClick={(e) => {
                    // No ordenar si se hace clic en el resizer
                    if (!e.target.closest('.column-resizer')) {
                      toggleSort(p.name);
                    }
                  }}
                  style={{ minWidth, width, maxWidth: 'none', whiteSpace: 'nowrap', padding: '2px 10px', overflow: 'visible', position: 'relative' }}
                  title={p.name}
                >
                  <div className="flex items-center gap-1.5" style={{ minWidth: 'fit-content' }}>
                    {/* Icono según el tipo */}
                    <span className="text-xs opacity-60 flex-shrink-0">
                      {p.type === "text" && "Aa"}
                      {p.type === "number" && "#"}
                      {p.type === "percent" && "%"}
                      {p.type === "date" && "📅"}
                      {p.type === "checkbox" && "☑"}
                      {p.type === "select" && "▼"}
                      {p.type === "tags" && "🏷"}
                      {p.type === "formula" && "="}
                    </span>
                    {nombreLargo && (tieneDosPalabras || tieneMasPalabras) ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-xs leading-tight whitespace-nowrap">{textoSuperior}</span>
                        <span className="text-xs leading-tight whitespace-nowrap">{textoInferior}</span>
                      </div>
                    ) : (
                      <span className="text-xs leading-tight whitespace-nowrap">{p.name}</span>
                    )}
                    {sortBy === p.name && <span className="text-[10px] opacity-60 flex-shrink-0">{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                  {/* Resizer para redimensionar columna */}
                  <div
                    className="column-resizer absolute top-0 right-0 w-1 h-full cursor-col-resize opacity-0 group-hover:opacity-100 bg-blue-400 hover:bg-blue-500 transition-opacity"
                    onMouseDown={(e) => iniciarRedimensionamiento(e, p.name, width)}
                    style={{ zIndex: 10 }}
                    title="Arrastra para redimensionar"
                  />
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {!tablaColapsada && filasOrdenadas.map((fila, fi) => {
              const filaIndexOriginal = filas.findIndex(f => f === fila);
              
              return (
              <tr 
                key={fi} 
                className="hover:bg-gray-50 group"
              >
                <NombreCeldaConImagen
                  fila={fila}
                  filaIndex={filaIndexOriginal}
                  onSubirImagen={subirImagenFila}
                  onEliminarImagen={eliminarImagenFila}
                  onAbrirDrawer={abrirDrawer}
                />
                {/* Columna de acciones (eliminar) */}
                <td 
                  style={{ padding: '2px 4px', width: '40px' }}
                  className="text-center"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilaAEliminar(filaIndexOriginal);
                      setShowDeleteRowModal(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                    title="Eliminar fila"
                  >
                    🗑️
                  </button>
                </td>

                {propiedadesVisibles.map((prop, pi) => {
                    const propIndex = propiedades.findIndex(p => p.name === prop.name);
                    const valor = obtenerValorCelda(fila, prop);
                    const valorTexto = prop.type === "tags" 
                      ? (fila.properties?.[prop.name]?.value || []).map(tag => tag.label || tag.value || tag).join(", ")
                      : prop.type === "checkbox"
                      ? (fila.properties?.[prop.name]?.value ? "Sí" : "No")
                      : prop.type === "formula"
                      ? valor
                      : String(fila.properties?.[prop.name]?.value || "");
                    
                    const columnWidth = obtenerAnchoColumna(prop);
                    const columnMinWidth = prop.type === "checkbox" ? '50px' : '80px';
                    
                    return (
                    <td 
                      key={pi} 
                      className={prop.type === "tags" ? "tags-cell" : ""}
                      style={{ 
                        padding: '2px 8px', 
                        overflow: prop.type === "tags" ? 'visible' : 'hidden',
                        whiteSpace: prop.type === "checkbox" ? 'nowrap' : (prop.type === "tags" ? 'normal' : 'nowrap'),
                        width: columnWidth,
                        minWidth: columnMinWidth
                      }}
                      onClick={(e) => {
                        // Solo permitir que se abra el drawer desde la columna de nombre
                        // Para todas las demás columnas, prevenir la propagación
                        if (prop.name !== "Name") {
                          e.stopPropagation();
                        }
                      }}
                    >
                      <div className="relative">
                        {prop.type === "formula" ? (
                          <div 
                            className="group relative px-1.5 py-0.5 bg-blue-50 rounded text-right cursor-pointer hover:bg-blue-100 transition-colors text-xs inline-block w-full overflow-hidden text-ellipsis whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirDrawer(fila);
                            }}
                            title={valor || "Sin fórmula"}
                          >
                            {valor || (
                              <span className="text-gray-400 text-xs">🧮 Sin fórmula</span>
                            )}
                          </div>
                        ) : prop.type === "checkbox" ? (
                          <div className="group relative flex justify-center inline-block w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={fila.properties?.[prop.name]?.value || false}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.checked)}
                              className="w-4 h-4 cursor-pointer"
                      />
                          </div>
                    ) : prop.type === "number" || prop.type === "percent" ? (
                      (() => {
                        // Detectar si es una columna financiera numérica (Ingresos, Egresos, Deudas)
                        const columnasFinancierasNumericas = ['Ingresos', 'Egresos', 'Deudas'];
                        const esColumnaFinancieraNumerica = columnasFinancierasNumericas.includes(prop.name) && comportamiento === 'financiero';
                        
                        if (esColumnaFinancieraNumerica) {
                          // Si es la tabla de Deudas y la columna es Deudas, mostrar botón de abono
                          const esTablaDeudas = nombreTabla === 'Deudas' || nombreTabla === '💳 Deudas';
                          const esColumnaDeudas = prop.name === 'Deudas';
                          
                          return (
                            <div className="flex items-center gap-1 justify-end">
                              <div
                                className="group relative flex-1 border-none outline-none bg-transparent cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors text-right"
                                style={{
                                  color: 'rgb(55, 53, 47)',
                                  padding: '1px 4px',
                                  fontSize: '0.8125rem',
                                  minHeight: '20px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNumericEditing({
                                    filaIndex: filaIndexOriginal,
                                    propName: prop.name,
                                    value: fila.properties?.[prop.name]?.value || ""
                                  });
                                  setShowNumericModal(true);
                                }}
                              >
                                {(fila.properties?.[prop.name]?.value !== undefined && fila.properties?.[prop.name]?.value !== null && fila.properties?.[prop.name]?.value !== '') || fila.properties?.[prop.name]?.value === 0 ? (
                                  new Intl.NumberFormat('es-ES', { 
                                    style: 'currency', 
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2
                                  }).format(parseFloat(fila.properties?.[prop.name]?.value || 0))
                                ) : (
                                  <span className="text-gray-400 italic">Clic para editar...</span>
                                )}
                              </div>
                              {esTablaDeudas && esColumnaDeudas && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const valorDeuda = parseFloat(fila.properties?.[prop.name]?.value || 0) || 0;
                                    const hoy = new Date();
                                    const año = hoy.getFullYear();
                                    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                                    const dia = String(hoy.getDate()).padStart(2, '0');
                                    setAbonoEditing({
                                      filaIndex: filaIndexOriginal,
                                      filaId: fila.id || filaIndexOriginal,
                                      deudaActual: valorDeuda,
                                      nombreDeuda: fila.Name || 'Deuda sin nombre',
                                      value: "",
                                      fecha: `${año}-${mes}-${dia}`,
                                      descripcion: ""
                                    });
                                    setShowAbonoModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex-shrink-0"
                                  title="Abonar a esta deuda"
                                >
                                  💰 Abonar
                                </button>
                              )}
                            </div>
                          );
                        }
                        
                        // Para otras columnas numéricas, usar input directo
                        return (
                          <input
                            type="number"
                            className="group relative w-full text-right"
                            value={fila.properties?.[prop.name]?.value || 0}
                            onChange={(e) => actualizarValor(fi, prop.name, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ textAlign: 'right' }}
                          />
                        );
                      })()
                    ) : prop.type === "select" ? (
                      <div 
                        className="w-full cursor-pointer" 
                        onClick={(e) => {
                            e.stopPropagation();
                          // Convertir el valor de select a formato tags si es necesario
                          const currentValue = fila.properties?.[prop.name]?.value;
                          let tagsValue = [];
                          if (currentValue) {
                            // Si es un string, convertirlo a formato tag
                            if (typeof currentValue === 'string') {
                              tagsValue = [{
                                label: currentValue,
                                value: currentValue,
                                color: fila.properties?.[prop.name]?.color || "#3b82f6"
                              }];
                            } else if (Array.isArray(currentValue)) {
                              tagsValue = currentValue;
                            }
                          }
                          setTagsEditando({
                            filaIndex: filaIndexOriginal,
                            propName: prop.name,
                            tags: tagsValue
                          });
                          setShowTagsModal(true);
                        }}
                      >
                        <div className="flex items-center gap-1 px-1 py-0.5 flex-wrap min-h-[18px]">
                          {(() => {
                            const currentValue = fila.properties?.[prop.name]?.value;
                            const currentColor = fila.properties?.[prop.name]?.color || "rgba(206, 205, 202, 0.3)";
                            if (currentValue) {
                              const displayValue = typeof currentValue === 'string' ? currentValue : (currentValue.label || currentValue.value || '');
                              return (
                                <div
                                  className="flex items-center gap-1 text-[0.7rem] px-1 py-0 rounded flex-shrink-0 whitespace-nowrap"
                                  style={{
                                    backgroundColor: currentColor,
                                    color: currentColor !== "rgba(206, 205, 202, 0.3)" ? 'white' : 'rgb(55, 53, 47)',
                                    height: '18px',
                                    lineHeight: '1.2',
                                  }}
                                >
                                  <span className="leading-tight">{displayValue}</span>
                                </div>
                              );
                            }
                            return <span className="text-[0.7rem] text-gray-400">Sin valor</span>;
                          })()}
                        </div>
                      </div>
                    ) : prop.type === "tags" ? (
                          <div 
                            className="w-full cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setTagsEditando({
                                filaIndex: filaIndexOriginal,
                                propName: prop.name,
                                tags: [...(fila.properties?.[prop.name]?.value || [])]
                              });
                              setShowTagsModal(true);
                            }}
                          >
                            <div className="flex items-center gap-1 px-1 py-0.5 flex-wrap min-h-[18px]">
                              {(fila.properties?.[prop.name]?.value || []).length > 0 ? (
                                (fila.properties?.[prop.name]?.value || []).slice(0, 2).map((tag, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 text-[0.7rem] px-1 py-0 rounded flex-shrink-0 whitespace-nowrap"
                                    style={{
                                      backgroundColor: tag.color || 'rgba(206, 205, 202, 0.3)',
                                      color: tag.color ? 'white' : 'rgb(55, 53, 47)',
                                      height: '18px',
                                      lineHeight: '1.2',
                                    }}
                                  >
                                    <span className="leading-tight">{tag.label || tag.value || tag}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-[0.7rem] text-gray-400">Sin tags</span>
                              )}
                              {(fila.properties?.[prop.name]?.value || []).length > 2 && (
                                <span className="text-[0.7rem] text-gray-400">+{(fila.properties?.[prop.name]?.value || []).length - 2}</span>
                              )}
                            </div>
                      </div>
                    ) : prop.type === "date" ? (
                      <input
                        type="date"
                        className="group relative w-full border-none outline-none bg-transparent"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'rgb(55, 53, 47)',
                          padding: '1px 4px',
                          fontSize: '0.8125rem'
                        }}
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = 'white';
                          e.target.style.border = '1.5px solid rgb(46, 170, 220)';
                        }}
                        onBlur={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.border = 'none';
                        }}
                      />
                    ) : prop.type === "text" ? (
                      (() => {
                        // Columnas financieras numéricas: edición inline con validación
                        const columnasFinancierasNumericas = ['Ingresos', 'Egresos', 'Deudas'];
                        const esColumnaFinancieraNumerica = columnasFinancierasNumericas.includes(prop.name);
                        
                        if (esColumnaFinancieraNumerica) {
                          // Si es la tabla de Deudas y la columna es Deudas, mostrar botón de abono
                          const esTablaDeudas = nombreTabla === 'Deudas';
                          const esColumnaDeudas = prop.name === 'Deudas';
                          
                          return (
                            <div className="flex items-center gap-1 justify-end">
                              <div
                                className="group relative flex-1 border-none outline-none bg-transparent cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors text-right"
                                style={{
                                  color: 'rgb(55, 53, 47)',
                                  padding: '1px 4px',
                                  fontSize: '0.8125rem',
                                  minHeight: '20px'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNumericEditing({
                                    filaIndex: filaIndexOriginal,
                                    propName: prop.name,
                                    value: fila.properties?.[prop.name]?.value || ""
                                  });
                                  setShowNumericModal(true);
                                }}
                              >
                                {fila.properties?.[prop.name]?.value || (
                                  <span className="text-gray-400 italic">Clic para editar...</span>
                                )}
                              </div>
                              {esTablaDeudas && esColumnaDeudas && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const valorDeuda = parseFloat(fila.properties?.[prop.name]?.value || 0) || 0;
                                    const hoy = new Date();
                                    const año = hoy.getFullYear();
                                    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                                    const dia = String(hoy.getDate()).padStart(2, '0');
                                    setAbonoEditing({
                                      filaIndex: filaIndexOriginal,
                                      filaId: fila.id || filaIndexOriginal,
                                      deudaActual: valorDeuda,
                                      nombreDeuda: fila.Name || 'Deuda sin nombre',
                                      value: "",
                                      fecha: `${año}-${mes}-${dia}`,
                                      descripcion: ""
                                    });
                                    setShowAbonoModal(true);
                                  }}
                                  className="px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex-shrink-0"
                                  title="Abonar a esta deuda"
                                >
                                  💰 Abonar
                                </button>
                              )}
                            </div>
                          );
                        }
                        
                        // Para otras columnas de texto, usar el modal
                        return (
                          <div
                            className="group relative w-full border-none outline-none bg-transparent cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
                            style={{
                              color: 'rgb(55, 53, 47)',
                              padding: '1px 4px',
                              fontSize: '0.8125rem',
                              minHeight: '20px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTextEditing({
                                filaIndex: filaIndexOriginal,
                                propName: prop.name,
                                value: fila.properties?.[prop.name]?.value || ""
                              });
                              setShowTextModal(true);
                            }}
                          >
                            {fila.properties?.[prop.name]?.value || (
                              <span className="text-gray-400 italic">Clic para editar...</span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <input
                        type="text"
                        className="group relative w-full border-none outline-none bg-transparent"
                        style={{
                          backgroundColor: 'transparent',
                          color: 'rgb(55, 53, 47)',
                          padding: '1px 4px',
                          fontSize: '0.8125rem'
                        }}
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                        placeholder={prop.name.toLowerCase().includes('fecha') ? 'YYYY-MM-DD' : ''}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = 'white';
                          e.target.style.border = '1.5px solid rgb(46, 170, 220)';
                        }}
                        onBlur={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.border = '1px solid transparent';
                        }}
                      />
                        )}
                      </div>
                  </td>
                    );
                  })}
              </tr>
            );
            })}
            {/* Mensaje cuando la tabla está colapsada */}
            {tablaColapsada && (
              <tr>
                <td colSpan={propiedadesVisibles.length + 2} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span>Tabla colapsada - Haz clic en "🔽 Expandir Tabla" para ver las filas</span>
                  </div>
                </td>
              </tr>
            )}
            {/* Mensaje si no hay filas */}
            {filasOrdenadas.length === 0 && (
              <tr>
                <td colSpan={propiedadesVisibles.length + 2} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span>No hay filas en la tabla</span>
                    <button 
                      onClick={agregarFila} 
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      ➕ Agregar primera fila
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {/* Fila de totales - Siempre visible */}
            {filasOrdenadas.length > 0 && propiedadesVisibles.some(p => p.totalizar && (p.type === "number" || p.type === "percent")) && (
              <tr className="bg-gray-200 font-bold border-t-2 border-gray-400">
                <td style={{ minWidth: '250px', width: '250px', maxWidth: '250px', padding: '2px 8px', position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#e5e7eb' }} className="font-bold">
                  📊 Total
                </td>
                <td style={{ padding: '2px 4px', width: '40px' }}></td>
                {propiedadesVisibles.map((prop, pi) => (
                  <td key={pi} className="text-right" style={{ padding: '2px 4px' }}>
                    {prop.totalizar && (prop.type === "number" || prop.type === "percent") ? (
                      prop.type === "percent" ? (
                        `${calcularTotal(filasOrdenadas, prop.name).toFixed(2)}%`
                      ) : (
                        calcularTotal(filasOrdenadas, prop.name)
                      )
                    ) : (
                      ""
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}

      {/* Vista móvil - Tarjetas */}
      {tipoVista === 'table' && (
        <div className="md:hidden space-y-3 notion-table-mobile">
        {filasOrdenadas.map((fila, fi) => {
          const filaIndexOriginal = filas.findIndex(f => f === fila);
          return (
          <div key={fi} className="notion-table-card">
            <div 
              className="notion-table-card-title flex items-center gap-2"
              onClick={() => abrirDrawer(fila)}
            >
              {fila.imageFilename && (
                <ImagenDesdeFilename 
                  fila={fila} 
                  className="w-6 h-6 rounded object-cover border border-gray-200"
                />
              )}
              {fila.Name}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {propiedadesVisibles.map((prop, pi) => (
                <div key={pi} className="notion-table-card-field">
                  <label className="notion-table-card-field-label">
                    {prop.name}
                  </label>
                  <div className="notion-table-card-field-value">
                    {prop.type === "formula" ? (
                      <div 
                        className="px-2 py-1 bg-blue-50 rounded text-right cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => abrirDrawer(fila)}
                        title="Haz clic para editar la fórmula"
                      >
                        {obtenerValorCelda(fila, prop) || (
                          <span className="text-gray-400 text-xs">🧮 Sin fórmula</span>
                        )}
                      </div>
                    ) : prop.type === "checkbox" ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fila.properties?.[prop.name]?.value || false}
                          onChange={(e) => actualizarValor(fi, prop.name, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {fila.properties?.[prop.name]?.value ? "✅ Completado" : "⏳ Pendiente"}
                        </span>
                      </div>
                    ) : prop.type === "number" || prop.type === "percent" ? (
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-right"
                        value={fila.properties?.[prop.name]?.value || 0}
                        onChange={(e) => actualizarValor(fi, prop.name, Number(e.target.value))}
                      />
                    ) : prop.type === "select" ? (
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="flex-1 px-2 py-1 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Convertir el valor de select a formato tags si es necesario
                            const currentValue = fila.properties?.[prop.name]?.value;
                            let tagsValue = [];
                            if (currentValue) {
                              // Si es un string, convertirlo a formato tag
                              if (typeof currentValue === 'string') {
                                tagsValue = [{
                                  label: currentValue,
                                  value: currentValue,
                                  color: fila.properties?.[prop.name]?.color || "#3b82f6"
                                }];
                              } else if (Array.isArray(currentValue)) {
                                tagsValue = currentValue;
                              }
                            }
                            setTagsEditando({
                              filaIndex: filaIndexOriginal,
                              propName: prop.name,
                              tags: tagsValue
                            });
                            setShowTagsModal(true);
                          }}
                        >
                          {fila.properties?.[prop.name]?.value || (
                            <span className="text-gray-400 italic">Clic para editar...</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: fila.properties?.[prop.name]?.color || "#3b82f6" }}
                          ></div>
                        </div>
                      </div>
                    ) : prop.type === "tags" ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <TagInputNotionLike
                            value={fila.properties?.[prop.name]?.value || []}
                            onChange={(val) => actualizarValor(fi, prop.name, val)}
                          />
                        </div>
                        <button
                          title="Copiar tags"
                          className="p-1 rounded hover:bg-gray-200"
                          onClick={() => {
                            const tagsArr = fila.properties?.[prop.name]?.value || [];
                            const tags = tagsArr.map(tag => tag.label || tag.value || tag).join(", ");
                            navigator.clipboard.writeText(tags);
                          }}
                        >
                          <span role="img" aria-label="copiar">📋</span>
                        </button>
                      </div>
                    ) : prop.type === "date" ? (
                      <input
                        type="date"
                        className="w-full px-2 py-1 border rounded"
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                      />
                    ) : prop.type === "text" ? (
                      <div
                        className="w-full px-2 py-1 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTextEditing({
                            filaIndex: filaIndexOriginal,
                            propName: prop.name,
                            value: fila.properties?.[prop.name]?.value || ""
                          });
                          setShowTextModal(true);
                        }}
                      >
                        {fila.properties?.[prop.name]?.value || (
                          <span className="text-gray-400 italic">Clic para editar...</span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full px-2 py-1 border rounded"
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                        placeholder={`Ingresa ${prop.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => abrirDrawer(fila)}
                className="notion-table-card-edit-button flex-1"
              >
                ✏️ Editar detalles
              </button>
              <button
                onClick={() => {
                  setFilaAEliminar(filaIndexOriginal);
                  setShowDeleteRowModal(true);
                }}
                className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        );
        })}
      </div>
      )}

{showDrawer && (
    <>
      {useFullScreenModal ? (
        /* Modal de pantalla completa para nivel 2+ - Renderizado con Portal fuera del árbol DOM */
        createPortal(
          <>
            <div 
              className="fixed inset-0 bg-black/60"
              onClick={cerrarDrawer}
              style={{ 
                animation: 'fadeIn 0.2s ease-out',
                zIndex: drawerZIndex,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
              }}
            />
            <div 
              className="bg-white dark:bg-gray-900 shadow-2xl transition-colors"
              style={{ 
                animation: 'fadeIn 0.3s ease-out',
                zIndex: drawerZIndex + 1,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              data-drawer="table-drawer-modal"
            >
            {/* Header del modal con botón de guardar */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {filaSeleccionada !== null ? filas[filaSeleccionada]?.Name || "Sin nombre" : "Editar fila"}
              </h2>
              <div className="flex items-center gap-2">
                {/* Botón de guardar visible siempre */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    guardarFilas(filas);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                  title="Guardar cambios"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar
                </button>
            <button 
              onClick={() => {
                setShowColumnasSugeridasModal(true);
                setColumnasSeleccionadas([]);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
              title="Columnas sugeridas para metodologías ágiles"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            {!useFullScreenModal && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDrawerExpandido(!drawerExpandido);
                }} 
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                title={drawerExpandido ? "Reducir" : "Expandir al 100%"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {drawerExpandido ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  )}
                </svg>
              </button>
            )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    cerrarDrawer();
                  }} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div 
              className={`p-6 ${useFullScreenModal ? 'w-full' : ''}`} 
              style={useFullScreenModal ? { 
                maxWidth: '100%', 
                width: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden'
              } : {}}
            >

      {filaSeleccionada !== null && filas[filaSeleccionada] && (
        <>
          {/* Título editable en la parte superior */}
          <div className="mb-6" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="w-full text-2xl font-semibold border-none outline-none focus:bg-gray-50 dark:focus:bg-gray-800 px-2 py-1 rounded transition-colors bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              value={filas[filaSeleccionada]?.Name || ""}
              placeholder="Sin título"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const nuevas = [...filas];
                if (nuevas[filaSeleccionada]) {
                  nuevas[filaSeleccionada].Name = e.target.value;
                  setFilas(nuevas);
                }
              }}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">Imagen</label>
            <div className="flex items-center gap-3">
              {filas[filaSeleccionada]?.imageFilename || filas[filaSeleccionada]?.image ? (
                <div className="relative">
                  {filas[filaSeleccionada]?.imageFilename?.startsWith('icon-') ? (
                    <div className="w-16 h-16 rounded flex items-center justify-center text-3xl border border-gray-200 bg-white">
                      {filas[filaSeleccionada]?.image}
                    </div>
                  ) : (
                    <ImagenDesdeFilename 
                      fila={filas[filaSeleccionada]} 
                      className="w-16 h-16 rounded object-cover border border-gray-200"
                    />
                  )}
                  <button
                    onClick={() => eliminarImagenFila(filaSeleccionada)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setFilaIndexParaIcono(filaSeleccionada);
                    setShowIconPickerModal(true);
                  }}
                  className="w-16 h-16 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                  title="Agregar imagen o icono"
                >
                  <span className="text-xl">🖼️</span>
                </button>
              )}
              <button
                onClick={() => {
                  setFilaIndexParaIcono(filaSeleccionada);
                  setShowIconPickerModal(true);
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                {filas[filaSeleccionada]?.image ? 'Cambiar imagen' : 'Agregar imagen/icono'}
              </button>
            </div>
          </div>

          {/* Propiedades */}
          <div className="space-y-2">
            {propiedades.map((prop, pi) => {
              const formula = filas[filaSeleccionada]?.properties?.[prop.name]?.formula || prop.formula || "";
              const formulaPreview = formula.length > 30 ? formula.substring(0, 30) + "..." : formula;
              
              return (
              <div key={pi} className="border-b border-gray-100 pb-2 last:border-b-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Nombre y badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0 w-[120px]">
                    <label className="text-sm font-medium text-gray-900">
                      {prop.name}
                    </label>
                    {prop.type === "formula" && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded flex-shrink-0">Σ</span>
                    )}
                    {prop.totalizar && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-1 py-0.5 rounded flex-shrink-0">Σ</span>
                    )}
                    {prop.visible === false && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">👁️</span>
                    )}
                  </div>
                  
                  {/* Input/Control al lado derecho */}
                  <div className="flex-1 min-w-0" style={{ maxWidth: prop.type === "number" || prop.type === "percent" ? "100px" : prop.type === "checkbox" ? "auto" : "180px" }}>
                    {prop.type === "formula" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPropiedadFormulaEditando(prop.name);
                          setEsNuevoCampo(false);
                          setShowFormulaModal(true);
                        }}
                        className="w-full text-left border border-gray-300 bg-white hover:bg-gray-50 rounded px-2 py-1 text-xs font-mono text-gray-700 transition-colors truncate"
                        title={formula || "Clic para editar fórmula"}
                      >
                        {formulaPreview || "Clic para editar fórmula..."}
                      </button>
                    ) : prop.type === "tags" ? (
                      <TagInputNotionLike
                        value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || []}
                        onChange={(val) => actualizarValor(filaSeleccionada, prop.name, val)}
                      />
                    ) : prop.type === "number" || prop.type === "percent" ? (
                      <input
                        type="number"
                        className="border border-gray-300 w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || 0}
                        onChange={(e) => actualizarValor(filaSeleccionada, prop.name, Number(e.target.value))}
                      />
                    ) : prop.type === "checkbox" ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={filas[filaSeleccionada]?.properties?.[prop.name]?.value || false}
                          onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.checked)}
                        />
                      </div>
                    ) : prop.type === "select" ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent min-w-0"
                          value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                          onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                          placeholder="Valor"
                        />
                        <input
                          type="color"
                          className="w-7 h-7 rounded border border-gray-300 cursor-pointer flex-shrink-0"
                          value={filas[filaSeleccionada]?.properties?.[prop.name]?.color || "#3b82f6"}
                          onChange={(e) => {
                            const nuevas = [...filas];
                            nuevas[filaSeleccionada].properties[prop.name].color = e.target.value;
                            setFilas(nuevas);
                          }}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="border border-gray-300 w-full px-2 py-1 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                        placeholder="Escribe aquí..."
                      />
                    )}
                  </div>
                  
                  {/* Controles de totalizar y visible */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {(prop.type === "number" || prop.type === "percent") && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        <input
                          type="checkbox"
                          checked={prop.totalizar || false}
                          onChange={(e) => {
                            const nuevas = [...propiedades];
                            nuevas[pi].totalizar = e.target.checked;
                            setPropiedades(nuevas);
                          }}
                          className="w-3.5 h-3.5"
                        />
                        <span>Totalizar</span>
                      </label>
                    )}
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                      <input
                        type="checkbox"
                        checked={prop.visible !== false}
                        onChange={(e) => {
                          const nuevas = [...propiedades];
                          nuevas[pi].visible = e.target.checked;
                          setPropiedades(nuevas);
                        }}
                        className="w-3.5 h-3.5"
                      />
                      <span>Visible</span>
                    </label>
                  </div>
                </div>
                
                {/* Resultado de fórmula (solo para fórmulas) */}
                {prop.type === "formula" && (
                  <div className="text-[10px] text-gray-500 mt-1 ml-[130px]">
                    Resultado: <strong className="text-gray-700">{obtenerValorCelda(filas[filaSeleccionada], prop) || "Sin resultado"}</strong>
                  </div>
                )}
              </div>
            )})}
          </div>
          
          {/* Sección para agregar nueva propiedad */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-900">➕ Agregar propiedad</h3>
              <button
                onClick={agregarPropiedad}
                disabled={!nuevoCampo.name}
                className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Agregar
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <input
                  type="text"
                  placeholder="Nombre de la propiedad"
                  className="border border-gray-300 w-full px-2.5 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={nuevoCampo.name}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, name: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={nuevoCampo.type}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, type: e.target.value })}
                  className="flex-1 border border-gray-300 px-2.5 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={nuevoCampo.visible !== false}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, visible: e.target.checked })}
                    className="w-3.5 h-3.5"
                  />
                  <span>Visible</span>
                </label>
              </div>
              
              {/* Botón para abrir modal de fórmulas sugeridas si el tipo es "formula" */}
              {nuevoCampo.type === "formula" && (
                <button
                  type="button"
                  onClick={() => {
                    setPropiedadFormulaEditando(null);
                    setEsNuevoCampo(true);
                    setShowFormulaModal(true);
                  }}
                  className="w-full bg-blue-50 border border-blue-300 text-blue-700 px-3 py-1.5 rounded text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 font-medium"
                >
                  💡 Ver fórmulas sugeridas
                </button>
              )}
            </div>
          </div>
         <EditorDescripcion
  key={useFullScreenModal ? `modal-editor-${filaSeleccionada}` : `drawer-editor-${filaSeleccionada}`}
  content={filas[filaSeleccionada]?.descripcion || { type: 'doc', content: [{ type: 'paragraph' }] }}
  autoFocus={useFullScreenModal}
  onChange={(nuevoContenido) => {
    // Usar setTimeout para asegurar que setFilas se ejecute fuera del ciclo de renderizado
    // Esto evita el error "Cannot update a component while rendering a different component"
    setTimeout(() => {
      const nuevas = [...filas];
      if (filaSeleccionada !== null && nuevas[filaSeleccionada]) {
        nuevas[filaSeleccionada].descripcion = nuevoContenido;
        // Guardar el último contenido en el ref para asegurar que se guarde al cerrar
        ultimoContenidoDescripcionRef.current = nuevoContenido;
        setFilas(nuevas);
        // Guardar automáticamente con debounce para evitar demasiadas actualizaciones
        // Esto asegura que las tablas anidadas y otros contenidos se guarden correctamente
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          updateAttributes({ filas: nuevas });
        }, 500); // Guardar después de 500ms de inactividad
      }
    }, 0);
  }}
/>
        </>
      )}
            </div>
          </div>
          
          {/* Toast dentro del Portal para que sea visible cuando el modal está abierto */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => setToast(null)}
            />
          )}
          </>,
          document.body
        )
      ) : (
        /* Drawer lateral para nivel 1 */
        <>
          {/* Overlay con animación */}
          <div 
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={cerrarDrawer}
            style={{ 
              animation: 'fadeIn 0.2s ease-out',
              zIndex: drawerZIndex
            }}
          />
          {/* Panel lateral con animación */}
          <div 
            className={`fixed top-0 bottom-0 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto transition-all duration-300 ease-out ${
              drawerExpandido ? 'right-0 w-full' : 'right-0 w-1/2'
            }`}
            style={{ 
              animation: 'slideInRight 0.3s ease-out',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
              zIndex: drawerZIndex + 1
            }}
            onClick={(e) => e.stopPropagation()}
            data-drawer="table-drawer"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {filaSeleccionada !== null ? filas[filaSeleccionada]?.Name || "Sin nombre" : "Editar fila"}
              </h2>
              <div className="flex items-center gap-2">
                {/* Botón de guardar visible siempre */}
                <button 
                  onClick={() => {
                    guardarFilas(filas);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
                  title="Guardar cambios"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar
                </button>
                <button 
                  onClick={() => {
                    setShowColumnasSugeridasModal(true);
                    setColumnasSeleccionadas([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  title="Columnas sugeridas para metodologías ágiles"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
                {!useFullScreenModal && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDrawerExpandido(!drawerExpandido);
                    }} 
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                    title={drawerExpandido ? "Reducir" : "Expandir al 100%"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {drawerExpandido ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      )}
                    </svg>
                  </button>
                )}
                <button 
                  onClick={cerrarDrawer} 
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              {filaSeleccionada !== null && filas[filaSeleccionada] && (
                <>
                  {/* Título editable en la parte superior */}
                  <div className="mb-6">
                    <input
                      type="text"
                      className="w-full text-2xl font-semibold border-none outline-none focus:bg-gray-50 dark:focus:bg-gray-800 px-2 py-1 rounded transition-colors bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      value={filas[filaSeleccionada]?.Name || ""}
                      placeholder="Sin título"
                      onChange={(e) => {
                        const nuevas = [...filas];
                        if (nuevas[filaSeleccionada]) {
                          nuevas[filaSeleccionada].Name = e.target.value;
                          setFilas(nuevas);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Imagen</label>
                    <div className="flex items-center gap-3">
                      {filas[filaSeleccionada]?.imageFilename || filas[filaSeleccionada]?.image ? (
                        <div className="relative">
                          {filas[filaSeleccionada]?.imageFilename?.startsWith('icon-') ? (
                            <div className="w-16 h-16 rounded flex items-center justify-center text-3xl border border-gray-200 bg-white">
                              {filas[filaSeleccionada]?.image}
                            </div>
                          ) : (
                            <ImagenDesdeFilename 
                              fila={filas[filaSeleccionada]} 
                              className="w-16 h-16 rounded object-cover border border-gray-200"
                            />
                          )}
                          <button
                            onClick={() => eliminarImagenFila(filaSeleccionada)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            title="Eliminar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setFilaIndexParaIcono(filaSeleccionada);
                            setShowIconPickerModal(true);
                          }}
                          className="w-16 h-16 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                          title="Agregar imagen o icono"
                        >
                          <span className="text-xl">🖼️</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setFilaIndexParaIcono(filaSeleccionada);
                          setShowIconPickerModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      >
                        {filas[filaSeleccionada]?.image ? 'Cambiar imagen' : 'Agregar imagen/icono'}
                      </button>
                    </div>
                  </div>

                  {/* Propiedades */}
                  <div className="space-y-2">
                    {propiedades.map((prop, pi) => {
                      const formula = filas[filaSeleccionada]?.properties?.[prop.name]?.formula || prop.formula || "";
                      const formulaPreview = formula.length > 30 ? formula.substring(0, 30) + "..." : formula;
                      
                      return (
                      <div key={pi} className="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-b-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Nombre y badges */}
                          <div className="flex items-center gap-1.5 flex-shrink-0 w-[120px]">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              {prop.name}
                            </label>
                            {prop.type === "formula" && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded flex-shrink-0">Σ</span>
                            )}
                            {prop.totalizar && (
                              <span className="text-[10px] text-green-600 bg-green-50 px-1 py-0.5 rounded flex-shrink-0">Σ</span>
                            )}
                            {prop.visible === false && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">👁️</span>
                            )}
                          </div>
                          
                          {/* Input/Control al lado derecho */}
                          <div className="flex-1 min-w-0" style={{ maxWidth: prop.type === "number" || prop.type === "percent" ? "100px" : prop.type === "checkbox" ? "auto" : "180px" }}>
                            {prop.type === "formula" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPropiedadFormulaEditando(prop.name);
                                  setEsNuevoCampo(false);
                                  setShowFormulaModal(true);
                                }}
                                className="w-full text-left border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1 text-xs font-mono text-gray-700 dark:text-gray-300 transition-colors truncate"
                                title={formula || "Clic para editar fórmula"}
                              >
                                {formulaPreview || "Clic para editar fórmula..."}
                              </button>
                            ) : prop.type === "tags" ? (
                              <TagInputNotionLike
                                value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || []}
                                onChange={(val) => actualizarValor(filaSeleccionada, prop.name, val)}
                              />
                            ) : prop.type === "number" || prop.type === "percent" ? (
                              <input
                                type="number"
                                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || 0}
                                onChange={(e) => actualizarValor(filaSeleccionada, prop.name, Number(e.target.value))}
                              />
                            ) : prop.type === "checkbox" ? (
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  checked={filas[filaSeleccionada]?.properties?.[prop.name]?.value || false}
                                  onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.checked)}
                                />
                              </div>
                            ) : prop.type === "select" ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  className="flex-1 border border-gray-300 px-2 py-1 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent min-w-0"
                                  value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                                  onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                                  placeholder="Valor"
                                />
                                <input
                                  type="color"
                                  className="w-7 h-7 rounded border border-gray-300 cursor-pointer flex-shrink-0"
                                  value={filas[filaSeleccionada]?.properties?.[prop.name]?.color || "#3b82f6"}
                                  onChange={(e) => {
                                    const nuevas = [...filas];
                                    nuevas[filaSeleccionada].properties[prop.name].color = e.target.value;
                                    setFilas(nuevas);
                                  }}
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                className="border border-gray-300 w-full px-2 py-1 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                                onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                                placeholder="Escribe aquí..."
                              />
                            )}
                          </div>
                          
                          {/* Controles de totalizar y visible */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {(prop.type === "number" || prop.type === "percent") && (
                              <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                                <input
                                  type="checkbox"
                                  checked={prop.totalizar || false}
                                  onChange={(e) => {
                                    const nuevas = [...propiedades];
                                    nuevas[pi].totalizar = e.target.checked;
                                    setPropiedades(nuevas);
                                  }}
                                  className="w-3.5 h-3.5"
                                />
                                <span>Totalizar</span>
                              </label>
                            )}
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              <input
                                type="checkbox"
                                checked={prop.visible !== false}
                                onChange={(e) => {
                                  const nuevas = [...propiedades];
                                  nuevas[pi].visible = e.target.checked;
                                  setPropiedades(nuevas);
                                }}
                                className="w-3.5 h-3.5"
                              />
                              <span>Visible</span>
                            </label>
                          </div>
                        </div>
                        
                        {/* Resultado de fórmula (solo para fórmulas) */}
                        {prop.type === "formula" && (
                          <div className="text-[10px] text-gray-500 mt-1 ml-[130px]">
                            Resultado: <strong className="text-gray-700">{obtenerValorCelda(filas[filaSeleccionada], prop) || "Sin resultado"}</strong>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                  
                  {/* Sección para agregar nueva propiedad */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm text-gray-900">➕ Agregar propiedad</h3>
                      <button
                        onClick={agregarPropiedad}
                        disabled={!nuevoCampo.name}
                        className="px-4 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                      >
                        Agregar
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <input
                          type="text"
                          placeholder="Nombre de la propiedad"
                          className="border border-gray-300 w-full px-2.5 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={nuevoCampo.name}
                          onChange={(e) => setNuevoCampo({ ...nuevoCampo, name: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={nuevoCampo.type}
                          onChange={(e) => setNuevoCampo({ ...nuevoCampo, type: e.target.value })}
                          className="flex-1 border border-gray-300 px-2.5 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {tipos.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={nuevoCampo.visible !== false}
                            onChange={(e) => setNuevoCampo({ ...nuevoCampo, visible: e.target.checked })}
                            className="w-3.5 h-3.5"
                          />
                          <span>Visible</span>
                        </label>
                      </div>
                      
                      {/* Botón para abrir modal de fórmulas sugeridas si el tipo es "formula" */}
                      {nuevoCampo.type === "formula" && (
                        <button
                          type="button"
                          onClick={() => {
                            setPropiedadFormulaEditando(null);
                            setEsNuevoCampo(true);
                            setShowFormulaModal(true);
                          }}
                          className="w-full bg-blue-50 border border-blue-300 text-blue-700 px-3 py-1.5 rounded text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 font-medium"
                        >
                          💡 Ver fórmulas sugeridas
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <EditorDescripcion
                    content={filas[filaSeleccionada]?.descripcion || ""}
                    onChange={(nuevoContenido) => {
                      const nuevas = [...filas];
                      if (nuevas[filaSeleccionada]) {
                        nuevas[filaSeleccionada].descripcion = nuevoContenido;
                        setFilas(nuevas);
                        if (saveTimeoutRef.current) {
                          clearTimeout(saveTimeoutRef.current);
                        }
                        saveTimeoutRef.current = setTimeout(() => {
                          updateAttributes({ filas: nuevas });
                        }, 500);
                      }
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )}

      {/* Modal para elegir cantidad de tareas de ejemplo */}
      {showEjemploModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Agregar Plantilla Scrum</h3>
            <p className="text-gray-600 mb-6">
              Se agregarán todas las columnas y fórmulas de metodología Scrum. ¿Cuántas tareas de ejemplo deseas crear?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => crearTareasEjemplo(1)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                1 Tarea (Solo ejemplo)
              </button>
              <button
                onClick={() => crearTareasEjemplo(6)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                6 Tareas (Demo completo)
              </button>
              <button
                onClick={() => setShowEjemploModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de fórmulas sugeridas */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h2 className="text-2xl font-bold">💡 Fórmulas Sugeridas para Gestión Ágil</h2>
              <button 
                onClick={() => {
                  setShowFormulaModal(false);
                  setPropiedadFormulaEditando(null);
                  setEsNuevoCampo(false);
                }}
                className="text-red-500 text-3xl font-bold hover:text-red-700 transition-colors"
                title="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              <FormulaSuggestions
                onSelectFormula={(formula) => {
                  if (esNuevoCampo) {
                    // Si es un nuevo campo, actualizar el estado nuevoCampo
                    setNuevoCampo({ ...nuevoCampo, formula: formula });
                  } else if (propiedadFormulaEditando && filaSeleccionada !== null) {
                    // Si es una propiedad existente, actualizar la fila
                    const nuevas = [...filas];
                    if (!nuevas[filaSeleccionada].properties) {
                      nuevas[filaSeleccionada].properties = {};
                    }
                    if (!nuevas[filaSeleccionada].properties[propiedadFormulaEditando]) {
                      nuevas[filaSeleccionada].properties[propiedadFormulaEditando] = { type: "formula", value: "", formula: "" };
                    }
                    nuevas[filaSeleccionada].properties[propiedadFormulaEditando].formula = formula;
                    nuevas[filaSeleccionada].properties[propiedadFormulaEditando].type = "formula";
                    setFilas(nuevas);
                  }
                  // Cerrar el modal después de seleccionar
                  setShowFormulaModal(false);
                  setPropiedadFormulaEditando(null);
                  setEsNuevoCampo(false);
                }}
                propiedades={propiedades}
                formulaActual={
                  esNuevoCampo 
                    ? nuevoCampo.formula || ""
                    : (propiedadFormulaEditando && filaSeleccionada !== null)
                      ? (filas[filaSeleccionada]?.properties?.[propiedadFormulaEditando]?.formula || "")
                      : ""
                }
              />
            </div>
    </div>
  </div>
)}

      {/* Modal de Días No Trabajados */}
      {/* Modal de Días No Trabajados */}
      {showDiasNoTrabajadosModal && (() => {
        // Función para obtener días festivos sugeridos en un rango de fechas
        const obtenerFestivosSugeridos = (fechaInicio, fechaFin) => {
          if (!fechaInicio || !fechaFin) return [];
          
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          const año = inicio.getFullYear();
          const festivos = [];
          
          // Días festivos fijos
          const festivosFijos = [
            { fecha: `${año}-01-01`, nombre: 'Año Nuevo' },
            { fecha: `${año}-01-06`, nombre: 'Día de Reyes' },
            { fecha: `${año}-05-01`, nombre: 'Día del Trabajo' },
            { fecha: `${año}-07-20`, nombre: 'Independencia' },
            { fecha: `${año}-08-07`, nombre: 'Batalla de Boyacá' },
            { fecha: `${año}-12-25`, nombre: 'Navidad' },
          ];
          
          // Agregar año siguiente si el sprint cruza año
          const añoSiguiente = año + 1;
          festivosFijos.push(
            { fecha: `${añoSiguiente}-01-01`, nombre: 'Año Nuevo' },
            { fecha: `${añoSiguiente}-01-06`, nombre: 'Día de Reyes' }
          );
          
          festivosFijos.forEach(festivo => {
            const fechaFestivo = new Date(festivo.fecha);
            if (fechaFestivo >= inicio && fechaFestivo <= fin) {
              festivos.push({ fecha: festivo.fecha, nombre: festivo.nombre });
            }
          });
          
          return festivos.sort((a, b) => a.fecha.localeCompare(b.fecha));
        };
        
        const festivosSugeridos = obtenerFestivosSugeridos(
          sprintConfig.sprintStartDate,
          sprintConfig.sprintEndDate
        );
        const diasNoTrabajados = sprintConfig.diasNoTrabajados || [];
        const diasAprobados = diasNoTrabajados.filter(fecha => 
          festivosSugeridos.some(f => f.fecha === fecha)
        );
        const diasManuales = diasNoTrabajados.filter(fecha => 
          !festivosSugeridos.some(f => f.fecha === fecha)
        );
        
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">🚫 Días No Trabajados</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona los festivos y agrega días adicionales que no se trabajarán en este sprint
                  </p>
                </div>
                <button
                  onClick={() => setShowDiasNoTrabajadosModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-3xl leading-none font-light"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Festivos sugeridos */}
                {festivosSugeridos.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-700">
                          📅 Festivos Sugeridos
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Haz clic para aprobar o rechazar ({festivosSugeridos.length} disponibles)
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                        {diasAprobados.length} de {festivosSugeridos.length} seleccionados
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {festivosSugeridos.map((festivo) => {
                        const estaSeleccionado = diasNoTrabajados.includes(festivo.fecha);
                        return (
                          <button
                            key={festivo.fecha}
                            onClick={() => {
                              const nuevos = [...diasNoTrabajados];
                              if (estaSeleccionado) {
                                const index = nuevos.indexOf(festivo.fecha);
                                if (index > -1) nuevos.splice(index, 1);
                              } else {
                                nuevos.push(festivo.fecha);
                              }
                              setSprintConfig({ 
                                ...sprintConfig, 
                                diasNoTrabajados: nuevos.sort()
                              });
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-sm transition-all ${
                              estaSeleccionado
                                ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium shadow-md'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                              estaSeleccionado ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                              {estaSeleccionado ? '✓' : ''}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-semibold">{festivo.nombre}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{festivo.fecha}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded border border-gray-200">
                    No hay festivos sugeridos en el rango de fechas del sprint ({sprintConfig.sprintStartDate} a {sprintConfig.sprintEndDate}).
                  </div>
                )}
                
                {/* Días agregados manualmente */}
                <div className="border-t pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">
                        ➕ Días Adicionales
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Agrega días específicos que no se trabajarán (vacaciones, días puente, etc.)
                      </div>
                    </div>
                    {diasManuales.length > 0 && (
                      <div className="text-xs text-gray-600 bg-yellow-50 px-2 py-1 rounded">
                        {diasManuales.length} día{diasManuales.length !== 1 ? 's' : ''} agregado{diasManuales.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  {/* Input para agregar día manualmente */}
                  <div className="mb-3">
                    <input
                      type="date"
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      placeholder="Selecciona una fecha"
                      min={sprintConfig.sprintStartDate}
                      max={sprintConfig.sprintEndDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          const nuevaFecha = e.target.value;
                          const diasNoTrabajados = sprintConfig.diasNoTrabajados || [];
                          if (!diasNoTrabajados.includes(nuevaFecha)) {
                            setSprintConfig({ 
                              ...sprintConfig, 
                              diasNoTrabajados: [...diasNoTrabajados, nuevaFecha].sort()
                            });
                            e.target.value = '';
                          } else {
                            alert('Esta fecha ya está agregada');
                          }
                        }
                      }}
                    />
                    <div className="text-xs text-gray-500 mt-1.5">
                      Selecciona una fecha y se agregará automáticamente a la lista
                    </div>
                  </div>
                  
                  {/* Lista de días manuales */}
                  {diasManuales.length > 0 ? (
                    <div className="space-y-2">
                      {diasManuales.map((fecha, index) => (
                        <div key={index} className="flex items-center justify-between bg-yellow-50 border-2 border-yellow-200 px-4 py-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600">📅</span>
                            <span className="text-sm text-gray-700 font-medium">{fecha}</span>
                          </div>
                          <button
                            onClick={() => {
                              const nuevos = [...diasNoTrabajados];
                              nuevos.splice(diasNoTrabajados.indexOf(fecha), 1);
                              setSprintConfig({ ...sprintConfig, diasNoTrabajados: nuevos });
                            }}
                            className="text-red-600 hover:text-red-800 text-xl font-bold leading-none w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded transition-colors"
                            title="Eliminar fecha"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded border border-gray-200 text-center">
                      No hay días adicionales agregados. Selecciona una fecha arriba para agregar.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Resumen y total */}
              <div className="border-t bg-gradient-to-r from-gray-50 to-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">
                      📊 Resumen
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Total de días que se excluirán del cálculo de días hábiles
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {diasNoTrabajados.length}
                    </div>
                    <div className="text-xs text-gray-500">
                      día{diasNoTrabajados.length !== 1 ? 's' : ''} no trabajado{diasNoTrabajados.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDiasNoTrabajadosModal(false)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    ✅ Guardar y Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de estadísticas del Sprint */}
      {showSprintStatsModal && sprintInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📊 Estadísticas del Sprint</h2>
              <button 
                onClick={() => setShowSprintStatsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="text-sm text-gray-600">
                    {sprintInfo.tareas} tareas creadas
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900">Sprint</div>
                  <div className="text-sm text-gray-600">
                    {sprintInfo.inicio} a {sprintInfo.fin}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <div className="font-semibold text-gray-900">Días hábiles</div>
                  <div className="text-sm text-gray-600">
                    {sprintInfo.diasHabiles} días
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <div className="font-semibold text-gray-900">Horas totales</div>
                  <div className="text-sm text-gray-600">
                    {sprintInfo.horasTotales}h ({sprintInfo.horasDiarias}h/día)
                  </div>
                </div>
              </div>
              {sprintInfo.puntosTotalesObjetivo !== null && sprintInfo.puntosTotalesObjetivo !== undefined && (
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-semibold text-gray-900">Puntos de Historia</div>
                    <div className="text-sm text-gray-600">
                      {sprintInfo.puntosTotalesActuales} / {sprintInfo.puntosTotalesObjetivo}
                      {sprintInfo.porcentajePuntos !== null && ` (${sprintInfo.porcentajePuntos}%)`}
                    </div>
                    {sprintInfo.validacionPuntos && (
                      <div className={`text-xs mt-1 px-2 py-0.5 rounded inline-block ${
                        sprintInfo.validacionPuntos.includes('✅') ? 'bg-green-100 text-green-700' :
                        sprintInfo.validacionPuntos.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {sprintInfo.validacionPuntos}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSprintStatsModal(false)}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visibilidad de propiedades */}
      <PropertyVisibilityModal
        isOpen={showPropertyVisibilityModal}
        onClose={() => setShowPropertyVisibilityModal(false)}
        propiedades={propiedades}
        onToggleVisibility={togglePropertyVisibility}
        onShowAll={showAllProperties}
        onHideAll={hideAllProperties}
        onReorder={reordenarPropiedades}
      />

      {/* Modal de selección de iconos predefinidos */}
      {showIconPickerModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Seleccionar Icono</h2>
              <button
                onClick={() => {
                  setShowIconPickerModal(false);
                  setFilaIndexParaIcono(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">Selecciona un icono predefinido o sube una imagen personalizada:</p>
              <div className="grid grid-cols-3 gap-3 mb-4 max-h-[400px] overflow-y-auto">
                {[
                  // Iconos Scrum
                  { id: 'hu', label: 'Historia de Usuario', emoji: '📋', color: '#3b82f6' },
                  { id: 'tarea', label: 'Tarea', emoji: '✅', color: '#10b981' },
                  { id: 'bug', label: 'Bug', emoji: '🐛', color: '#ef4444' },
                  { id: 'epica', label: 'Épica', emoji: '🎯', color: '#8b5cf6' },
                  // Iconos Financieros
                  { id: 'casa', label: 'Casa', emoji: '🏠', color: '#8b5cf6' },
                  { id: 'salario', label: 'Salario', emoji: '💰', color: '#10b981' },
                  { id: 'freelance', label: 'Freelance', emoji: '💼', color: '#3b82f6' },
                  { id: 'dinero', label: 'Dinero', emoji: '💵', color: '#10b981' },
                  { id: 'tarjeta', label: 'Tarjeta', emoji: '💳', color: '#3b82f6' },
                  { id: 'banco', label: 'Banco', emoji: '🏦', color: '#1e40af' },
                  { id: 'ahorro', label: 'Ahorro', emoji: '🐷', color: '#10b981' },
                  { id: 'inversion', label: 'Inversión', emoji: '📈', color: '#10b981' },
                  { id: 'gasto', label: 'Gasto', emoji: '💸', color: '#ef4444' },
                  { id: 'deuda', label: 'Deuda', emoji: '📉', color: '#ef4444' },
                  { id: 'factura', label: 'Factura', emoji: '🧾', color: '#f59e0b' },
                  { id: 'recibo', label: 'Recibo', emoji: '🧾', color: '#3b82f6' },
                  { id: 'transferencia', label: 'Transferencia', emoji: '🔄', color: '#3b82f6' },
                  { id: 'pago', label: 'Pago', emoji: '💳', color: '#10b981' },
                  { id: 'cobro', label: 'Cobro', emoji: '💵', color: '#10b981' },
                  { id: 'prestamo', label: 'Préstamo', emoji: '📊', color: '#f59e0b' },
                  { id: 'negocio', label: 'Negocio', emoji: '🏢', color: '#3b82f6' },
                  { id: 'tienda', label: 'Tienda', emoji: '🏪', color: '#8b5cf6' },
                  { id: 'servicio', label: 'Servicio', emoji: '🔧', color: '#3b82f6' },
                  { id: 'producto', label: 'Producto', emoji: '📦', color: '#10b981' },
                  { id: 'comida', label: 'Comida', emoji: '🍔', color: '#f59e0b' },
                  { id: 'transporte', label: 'Transporte', emoji: '🚗', color: '#3b82f6' },
                  { id: 'salud', label: 'Salud', emoji: '🏥', color: '#ef4444' },
                  { id: 'educacion', label: 'Educación', emoji: '📚', color: '#3b82f6' },
                  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬', color: '#8b5cf6' },
                  { id: 'viaje', label: 'Viaje', emoji: '✈️', color: '#06b6d4' },
                  { id: 'regalo', label: 'Regalo', emoji: '🎁', color: '#ec4899' },
                  { id: 'subscripcion', label: 'Suscripción', emoji: '📱', color: '#3b82f6' },
                ].map((icono) => (
                  <button
                    key={icono.id}
                    onClick={() => {
                      if (filaIndexParaIcono !== null) {
                        subirImagenFila(filaIndexParaIcono, icono);
                      }
                      setShowIconPickerModal(false);
                      setFilaIndexParaIcono(null);
                    }}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <span className="text-3xl">{icono.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{icono.label}</span>
                  </button>
                ))}
              </div>
              <div className="border-t pt-4">
                <button
                  onClick={async () => {
                    if (filaIndexParaIcono !== null) {
                      // Abrir selector de archivos directamente
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async () => {
                        if (!input.files?.[0]) return;
                        
                        try {
                          const file = input.files[0];
                          const filename = `${Date.now()}-${file.name}`;
                          await LocalStorageService.saveBinaryFile(filename, file, 'files');
                          
                          const nuevas = [...filas];
                          nuevas[filaIndexParaIcono].image = `./files/${filename}`;
                          nuevas[filaIndexParaIcono].imageFilename = filename;
                          nuevas[filaIndexParaIcono].iconType = undefined;
                          setFilas(nuevas);
                        } catch (error) {
                          alert("No se pudo subir la imagen. Verifica que tengas una carpeta configurada.");
                        }
                      };
                      input.click();
                    }
                    setShowIconPickerModal(false);
                    setFilaIndexParaIcono(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span>📁</span>
                  <span>Subir imagen personalizada</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Columnas Sugeridas para Metodologías Ágiles */}
      {showColumnasSugeridasModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ overflowX: 'hidden' }}
          >
            <div className="flex items-start justify-between p-4 border-b bg-gray-50 flex-shrink-0 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 break-words">📋 Columnas Sugeridas</h2>
                <p className="text-sm text-gray-600 mt-1 break-words">
                  {comportamiento 
                    ? `Selecciona las columnas que deseas agregar (${obtenerColumnasSugeridas().length} disponibles para plantilla ${comportamiento === 'scrum' ? 'Scrum' : comportamiento === 'financiero' ? 'Financiera' : 'Mixta'})`
                    : 'Primero debes seleccionar una plantilla para ver las columnas sugeridas'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setShowColumnasSugeridasModal(false);
                  setColumnasSeleccionadas([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0" style={{ maxHeight: 'calc(90vh - 180px)' }}>
              {!comportamiento ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">📑</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay plantilla aplicada
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md">
                    Para ver las columnas sugeridas, primero debes seleccionar una plantilla desde el menú de opciones.
                  </p>
                  <button
                    onClick={() => {
                      setShowColumnasSugeridasModal(false);
                      setShowPlantillasModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span>📑</span>
                    <span>Seleccionar Plantilla</span>
                  </button>
                </div>
              ) : obtenerColumnasSugeridas().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay columnas disponibles
                  </h3>
                  <p className="text-sm text-gray-600">
                    Todas las columnas de esta plantilla ya han sido agregadas.
                  </p>
                </div>
              ) : (
              <div className="space-y-2">
                {obtenerColumnasSugeridas().map((columna, index) => {
                  const existe = propiedades.some(p => p.name === columna.name);
                  return (
                    <label
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all w-full ${
                        existe 
                          ? 'border-gray-200 bg-gray-50 opacity-60' 
                          : columnasSeleccionadas.includes(index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={columnasSeleccionadas.includes(index)}
                        onChange={(e) => {
                          if (existe) return;
                          if (e.target.checked) {
                            setColumnasSeleccionadas([...columnasSeleccionadas, index]);
                          } else {
                            setColumnasSeleccionadas(columnasSeleccionadas.filter(i => i !== index));
                          }
                        }}
                        disabled={existe}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 break-words">{columna.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${
                            columna.type === 'formula' ? 'bg-purple-100 text-purple-700' :
                            columna.type === 'number' ? 'bg-blue-100 text-blue-700' :
                            columna.type === 'tags' ? 'bg-green-100 text-green-700' :
                            columna.type === 'date' ? 'bg-orange-100 text-orange-700' :
                            columna.type === 'checkbox' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {columna.type}
                          </span>
                          {columna.visible && (
                            <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 whitespace-nowrap flex-shrink-0">
                              Visible
                            </span>
                          )}
                          {existe && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600 whitespace-nowrap flex-shrink-0">
                              Ya existe
                            </span>
                          )}
                        </div>
                        {columna.descripcion && (
                          <p className="text-sm text-gray-600 mt-1 break-words">{columna.descripcion}</p>
                        )}
                        {columna.formula && (
                          <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 p-1.5 rounded break-all overflow-wrap-anywhere" title={columna.formula}>
                            {columna.formula}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              )}
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0 gap-3 overflow-x-hidden">
              <div className="text-sm text-gray-600 min-w-0 flex-1">
                {comportamiento && columnasSeleccionadas.length > 0 && (
                  <span className="font-medium text-blue-600 break-words">{columnasSeleccionadas.length} columna(s) seleccionada(s)</span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowColumnasSugeridasModal(false);
                    setColumnasSeleccionadas([]);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors whitespace-nowrap"
                >
                  {comportamiento ? 'Cancelar' : 'Cerrar'}
                </button>
                {comportamiento && (
                <button
                  onClick={agregarColumnasSeleccionadas}
                  disabled={columnasSeleccionadas.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Agregar ({columnasSeleccionadas.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Plantillas */}
      {showPlantillasModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-4 border-b bg-gray-50 flex-shrink-0 gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 break-words">📑 Seleccionar Plantilla</h2>
                <p className="text-sm text-gray-600 mt-1 break-words">
                  Elige una plantilla para agregar columnas predefinidas a tu tabla
                </p>
              </div>
              <button
                onClick={() => setShowPlantillasModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => aplicarPlantilla('scrum')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">🔄 Scrum</div>
                  <div className="text-sm text-gray-600">Plantilla para gestión de sprints con tareas, puntos de historia, tiempo estimado, etc.</div>
                </button>
                <button
                  onClick={() => aplicarPlantilla('ingresos')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">💰 Ingresos</div>
                  <div className="text-sm text-gray-600">Plantilla para registrar y gestionar ingresos financieros.</div>
                </button>
                <button
                  onClick={() => aplicarPlantilla('egresos')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">💸 Egresos</div>
                  <div className="text-sm text-gray-600">Plantilla para registrar y gestionar egresos financieros.</div>
                </button>
                <button
                  onClick={() => aplicarPlantilla('deuda')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">💳 Deuda</div>
                  <div className="text-sm text-gray-600">Plantilla para gestionar y analizar deudas.</div>
                </button>
                <button
                  onClick={() => aplicarPlantilla('personalizada')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-500 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">✏️ Personalizada</div>
                  <div className="text-sm text-gray-600">Crea tu tabla desde cero sin plantilla predefinida.</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar fila */}
      {showDeleteRowModal && filaAEliminar !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">⚠️ Eliminar Fila</h2>
              <button 
                onClick={() => {
                  setShowDeleteRowModal(false);
                  setFilaAEliminar(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas eliminar la fila <strong>"{filas[filaAEliminar]?.Name || "Sin nombre"}"</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteRowModal(false);
                  setFilaAEliminar(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarFila(filaAEliminar)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar columna */}
      {showDeleteColumnModal && columnaAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">⚠️ Eliminar Columna</h2>
              <button 
                onClick={() => {
                  setShowDeleteColumnModal(false);
                  setColumnaAEliminar(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas eliminar la columna <strong>"{columnaAEliminar}"</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta acción eliminará la columna de todas las filas y no se puede deshacer.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteColumnModal(false);
                  setColumnaAEliminar(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarColumna(columnaAEliminar)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
    </div>
  </div>
)}

      {/* Modal para editar Tags */}
      {showTagsModal && tagsEditando.filaIndex !== null && tagsEditando.propName && (() => {
        // Función para extraer tags únicos de una columna específica
        const obtenerTagsUnicosPorColumna = (propName) => {
          const tagsMap = new Map(); // Usar Map para evitar duplicados
          
          filas.forEach(fila => {
            const propValue = fila.properties?.[propName]?.value;
            if (!propValue) return;
            
            // Si es un array (tipo tags)
            if (Array.isArray(propValue)) {
              propValue.forEach(tag => {
                const label = tag.label || tag.value || tag;
                if (label && typeof label === 'string' && label.trim()) {
                  // Si ya existe, mantener el color original si no tiene color
                  if (!tagsMap.has(label)) {
                    tagsMap.set(label, {
                      label: label.trim(),
                      color: tag.color || getRandomColor()
                    });
                  } else {
                    // Si el tag existente no tiene color pero este sí, actualizar
                    const existing = tagsMap.get(label);
                    if (!existing.color && tag.color) {
                      tagsMap.set(label, { ...existing, color: tag.color });
                    }
                  }
                }
              });
            } 
            // Si es un string (tipo select)
            else if (typeof propValue === 'string' && propValue.trim()) {
              const label = propValue.trim();
              if (!tagsMap.has(label)) {
                const prop = propiedades.find(p => p.name === propName);
                const color = fila.properties?.[propName]?.color || prop?.color || getRandomColor();
                tagsMap.set(label, {
                  label: label,
                  color: color
                });
              }
            }
          });
          
          return Array.from(tagsMap.values());
        };

        // Función auxiliar para generar colores aleatorios
        const getRandomColor = () => {
          const colors = [
            '#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', 
            '#f472b6', '#38bdf8', '#fb923c', '#ef4444', '#10b981',
            '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1'
          ];
          return colors[Math.floor(Math.random() * colors.length)];
        };

        // Definir tags disponibles según el tipo de campo (predefinidos)
        const getAvailableTags = (propName) => {
          if (propName === "Priority") {
            return [
              { label: "Critical", color: "#ef4444" },
              { label: "Low", color: "#10b981" },
              { label: "Medium", color: "#fbbf24" }
            ];
          } else if (propName === "Type") {
            return [
              { label: "IN PROGRESS", color: "#3b82f6" },
              { label: "DONE", color: "#10b981" },
              { label: "STOPPED", color: "#ef4444" },
              { label: "REOPENED", color: "#f59e0b" },
              { label: "UNDER REVIEW", color: "#8b5cf6" },
              { label: "QA", color: "#06b6d4" },
              { label: "TO DO", color: "#6b7280" }
            ];
          } else if (propName === "Estado") {
            return [
              { label: "En progreso", color: "#3b82f6" },
              { label: "Pendiente", color: "#f59e0b" },
              { label: "Completado", color: "#10b981" },
              { label: "Cancelado", color: "#ef4444" },
              { label: "Pausado", color: "#6b7280" }
            ];
          }
          // Para otros campos de tags, no hay lista predefinida
          return [];
        };

        // Obtener tags predefinidos y tags usados previamente en esta columna
        const predefinedTags = getAvailableTags(tagsEditando.propName);
        const usedTags = obtenerTagsUnicosPorColumna(tagsEditando.propName);
        
        // Combinar tags predefinidos y usados, evitando duplicados
        const allTagsMap = new Map();
        [...predefinedTags, ...usedTags].forEach(tag => {
          if (!allTagsMap.has(tag.label)) {
            allTagsMap.set(tag.label, tag);
          }
        });
        
        const availableTags = Array.from(allTagsMap.values());
        const selectedTagLabels = tagsEditando.tags.map(t => t.label || t.value || t);
        const prop = propiedades.find(p => p.name === tagsEditando.propName);
        const isSelectType = prop && prop.type === "select";
        
        const toggleTag = (tag) => {
          const isSelected = selectedTagLabels.includes(tag.label);
          if (isSelectType) {
            // Para tipo select, solo permitir un tag a la vez (reemplazar el anterior)
            if (isSelected) {
              // Deseleccionar (limpiar)
              setTagsEditando({
                ...tagsEditando,
                tags: []
              });
            } else {
              // Seleccionar (reemplazar el anterior)
              setTagsEditando({
                ...tagsEditando,
                tags: [tag]
              });
            }
          } else {
            // Para tipo tags, permitir múltiples
          if (isSelected) {
            // Deseleccionar
            setTagsEditando({
              ...tagsEditando,
              tags: tagsEditando.tags.filter(t => (t.label || t.value || t) !== tag.label)
            });
          } else {
            // Seleccionar
            setTagsEditando({
              ...tagsEditando,
              tags: [...tagsEditando.tags, tag]
            });
            }
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">🏷️ Editar {tagsEditando.propName}</h2>
                <button 
                  onClick={() => {
                    setShowTagsModal(false);
                    setTagsEditando({ filaIndex: null, propName: null, tags: [] });
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {availableTags.length > 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags disponibles {usedTags.length > 0 && `(${usedTags.length} usados previamente)`}:
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 border border-gray-200 rounded bg-gray-50">
                      {availableTags.map((tag, idx) => {
                        const isSelected = selectedTagLabels.includes(tag.label);
                        const isUsedTag = usedTags.some(t => t.label === tag.label);
                        return (
                          <button
                            key={idx}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                              isSelected 
                                ? 'ring-2 ring-blue-500 ring-offset-2' 
                                : 'hover:opacity-80'
                            }`}
                            style={{
                              backgroundColor: tag.color,
                              color: 'white',
                              opacity: isSelected ? 1 : 0.7
                            }}
                            title={isUsedTag ? "Tag usado previamente en esta columna" : "Tag predefinido"}
                          >
                            {isSelected && '✓ '}
                            {tag.label}
                            {isUsedTag && ' 📌'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags seleccionados:
                    </label>
                    <div className="border border-gray-300 rounded p-3 min-h-[60px] bg-gray-50">
                      {tagsEditando.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tagsEditando.tags.map((tag, idx) => (
                            <div
                              key={idx}
                              className="px-2 py-1 rounded text-xs flex items-center gap-1"
                              style={{
                                backgroundColor: tag.color || 'rgba(206, 205, 202, 0.3)',
                                color: tag.color ? 'white' : 'rgb(55, 53, 47)'
                              }}
                            >
                              <span>{tag.label || tag.value || tag}</span>
                              <button
                                onClick={() => {
                                  setTagsEditando({
                                    ...tagsEditando,
                                    tags: tagsEditando.tags.filter((_, i) => i !== idx)
                                  });
                                }}
                                className="ml-1 hover:bg-black/20 rounded px-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Ningún tag seleccionado</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4 border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agregar tag personalizado:
                    </label>
                    <TagInputNotionLike
                      value={tagsEditando.tags}
                      onChange={(val) => setTagsEditando({ ...tagsEditando, tags: val })}
                      showColorPicker={true}
                    />
                  </div>
                </>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tagsEditando.propName}
                  </label>
                  <div className="border border-gray-300 rounded p-3 min-h-[100px]">
                    <TagInputNotionLike
                      value={tagsEditando.tags}
                      onChange={(val) => setTagsEditando({ ...tagsEditando, tags: val })}
                      showColorPicker={true}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowTagsModal(false);
                    setTagsEditando({ filaIndex: null, propName: null, tags: [] });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (tagsEditando.filaIndex !== null && tagsEditando.propName) {
                      const prop = propiedades.find(p => p.name === tagsEditando.propName);
                      if (prop && prop.type === "select") {
                        // Para tipo select, guardar solo el primer tag como valor string con color
                        if (tagsEditando.tags.length > 0) {
                          const firstTag = tagsEditando.tags[0];
                          const valorConcepto = firstTag.label || firstTag.value || firstTag;
                          const nuevas = [...filas];
                          nuevas[tagsEditando.filaIndex].properties[tagsEditando.propName] = {
                            ...nuevas[tagsEditando.filaIndex].properties[tagsEditando.propName],
                            value: valorConcepto,
                            color: firstTag.color || nuevas[tagsEditando.filaIndex].properties[tagsEditando.propName]?.color || "#3b82f6"
                          };
                          // Si el campo es "Concepto", actualizar también el campo Name
                          if (tagsEditando.propName === "Concepto") {
                            nuevas[tagsEditando.filaIndex].Name = valorConcepto;
                          }
                          setFilas(nuevas);
                        } else {
                          // Si no hay tags, limpiar el valor
                          const nuevas = [...filas];
                          nuevas[tagsEditando.filaIndex].properties[tagsEditando.propName] = {
                            ...nuevas[tagsEditando.filaIndex].properties[tagsEditando.propName],
                            value: "",
                            color: nuevas[tagsEditando.filaIndex].properties[tagsEditando.propName]?.color || "#3b82f6"
                          };
                          // Si el campo es "Concepto", limpiar también el campo Name
                          if (tagsEditando.propName === "Concepto") {
                            nuevas[tagsEditando.filaIndex].Name = "Nueva tarea";
                          }
                          setFilas(nuevas);
                        }
                      } else {
                        // Para tipo tags, guardar el array completo
                      actualizarValor(tagsEditando.filaIndex, tagsEditando.propName, tagsEditando.tags);
                      }
                    }
                    setShowTagsModal(false);
                    setTagsEditando({ filaIndex: null, propName: null, tags: [] });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal para editar valores numéricos (columnas financieras) */}
      {showNumericModal && numericEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex justify-center items-center p-4" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">💰 Ingresar Valor</h2>
              <button 
                onClick={() => {
                  setShowNumericModal(false);
                  setNumericEditing(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="editNumeric" className="block text-sm font-medium text-gray-700 mb-2">
                {numericEditing.propName}:
              </label>
              <input
                id="editNumeric"
                type="text"
                inputMode="numeric"
                value={numericEditing.value}
                onChange={(e) => {
                  const valor = e.target.value;
                  // Solo permitir números, punto decimal, coma y signo negativo
                  const valorValidado = valor.replace(/[^0-9.,-]/g, '');
                  // Solo permitir un punto decimal o coma
                  const partes = valorValidado.split(/[.,]/);
                  let valorFinal = valorValidado;
                  if (partes.length > 2) {
                    // Si hay más de un punto/coma, mantener solo el primero
                    valorFinal = partes[0] + (partes[1] ? '.' + partes.slice(1).join('') : '');
                  }
                  setNumericEditing({ ...numericEditing, value: valorFinal });
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-lg"
                placeholder="0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGuardarValorNumerico();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNumericModal(false);
                  setNumericEditing(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarValorNumerico}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                ➕ Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para abonar a deuda */}
      {showAbonoModal && abonoEditing && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex justify-center items-center p-4" style={{ position: 'fixed', zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">💰 Abonar a Deuda</h2>
              <button 
                onClick={() => {
                  setShowAbonoModal(false);
                  setAbonoEditing(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mb-4 space-y-4">
              <div className="text-sm text-gray-600">
                <strong>Deuda:</strong> {abonoEditing.nombreDeuda}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Deuda actual:</strong> {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(abonoEditing.deudaActual || 0)}
              </div>
              
              <div>
                <label htmlFor="abonoMonto" className="block text-sm font-medium text-gray-700 mb-2">
                  Monto del abono: *
                </label>
                <input
                  id="abonoMonto"
                  type="text"
                  inputMode="numeric"
                  value={abonoEditing.value || ""}
                  onChange={(e) => {
                    const valor = e.target.value;
                    const valorValidado = valor.replace(/[^0-9.,-]/g, '');
                    const partes = valorValidado.split(/[.,]/);
                    let valorFinal = valorValidado;
                    if (partes.length > 2) {
                      valorFinal = partes[0] + (partes[1] ? '.' + partes.slice(1).join('') : '');
                    }
                    setAbonoEditing({ ...abonoEditing, value: valorFinal });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-lg"
                  placeholder="0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const inputs = e.target.form?.querySelectorAll('input, textarea');
                      const currentIndex = Array.from(inputs || []).indexOf(e.target);
                      if (inputs && currentIndex < inputs.length - 1) {
                        inputs[currentIndex + 1].focus();
                      } else {
                        procesarAbono();
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="abonoFecha" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha:
                </label>
                <input
                  id="abonoFecha"
                  type="date"
                  value={abonoEditing.fecha || ""}
                  onChange={(e) => {
                    setAbonoEditing({ ...abonoEditing, fecha: e.target.value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const inputs = e.target.form?.querySelectorAll('input, textarea');
                      const currentIndex = Array.from(inputs || []).indexOf(e.target);
                      if (inputs && currentIndex < inputs.length - 1) {
                        inputs[currentIndex + 1].focus();
                      } else {
                        procesarAbono();
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label htmlFor="abonoDescripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción:
                </label>
                <textarea
                  id="abonoDescripcion"
                  value={abonoEditing.descripcion || ""}
                  onChange={(e) => {
                    setAbonoEditing({ ...abonoEditing, descripcion: e.target.value });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  placeholder="Descripción del abono (opcional)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      procesarAbono();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAbonoModal(false);
                  setAbonoEditing(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={procesarAbono}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                💰 Abonar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar Texto */}
      {showTextModal && textEditing.filaIndex !== null && textEditing.propName && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">📝 Editar {textEditing.propName}</h2>
              <button 
                onClick={() => {
                  setShowTextModal(false);
                  setTextEditing({ filaIndex: null, propName: null, value: "" });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {textEditing.propName}
              </label>
              <textarea
                value={textEditing.value}
                onChange={(e) => setTextEditing({ ...textEditing, value: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                style={{
                  backgroundColor: 'white',
                  color: 'rgb(17, 24, 39)',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder="Escribe aquí..."
                autoFocus
              />
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (textEditing.filaIndex !== null && textEditing.propName) {
                    actualizarValor(textEditing.filaIndex, textEditing.propName, "");
                  }
                  setShowTextModal(false);
                  setTextEditing({ filaIndex: null, propName: null, value: "" });
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Limpiar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTextModal(false);
                    setTextEditing({ filaIndex: null, propName: null, value: "" });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (textEditing.filaIndex !== null && textEditing.propName) {
                      actualizarValor(textEditing.filaIndex, textEditing.propName, textEditing.value);
                    }
                    setShowTextModal(false);
                    setTextEditing({ filaIndex: null, propName: null, value: "" });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para vincular tablas */}
      <VincularTablasModal
        isOpen={showVincularModal}
        onClose={() => setShowVincularModal(false)}
        tableIdActual={tableId}
        onVincular={(tableIdVinculada, linkInfo) => {
          // Validar que la tabla no esté ya vinculada
          const yaEstaVinculada = tablasVinculadas.some(
            v => v.tableId === tableIdVinculada
          );
          
          if (yaEstaVinculada) {
            // Ya está vinculada, no agregar duplicado
            return;
          }
          
          // Agregar la tabla vinculada a tablasVinculadas
          const nuevaVinculacion = {
            tableId: tableIdVinculada,
            ...linkInfo
          };
          const nuevasVinculaciones = [...tablasVinculadas, nuevaVinculacion];
          setTablasVinculadas(nuevasVinculaciones);
          
          // Actualizar el registro
          const paginaId = PageContext.getCurrentPageId();
          if (paginaId) {
            registrarTablaEnRegistro(paginaId);
          }
        }}
      />

      {/* Modal de gráficas combinadas */}
      <GraficasCombinadas
        isOpen={showGraficasModal}
        onClose={() => setShowGraficasModal(false)}
        tablasVinculadas={tablasVinculadas}
        tableIdActual={tableId}
        cacheDatosTablas={cacheDatosTablas.current}
      />

      {/* Modal de confirmación para eliminar tabla */}
      <ConfirmDeleteModal
        isOpen={showDeleteTableModal}
        onClose={() => setShowDeleteTableModal(false)}
        onConfirm={() => {
          // Eliminar del registro antes de eliminar el nodo
          if (tableId) {
            TableRegistryService.unregisterTable(tableId);
          }
          
          const pos = getPos?.();
          const view = editor?.view;

          if (view && typeof pos === "number") {
            view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
          }
          setShowDeleteTableModal(false);
        }}
        title="Eliminar Tabla"
        message="¿Estás seguro de que deseas eliminar esta tabla completa? Esta acción no se puede deshacer y se perderán todos los datos, columnas, filas y configuraciones del sprint."
      />

      {/* Toast de notificación */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

    </NodeViewWrapper>
  );
}









