import { useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import TagInputNotionLike from "./TagInputNotionLike";
import EditorDescripcion from './EditorDescripcion';
import { FormulaEvaluator, calcularTotal } from './FormulaEvaluator';
import FormulaSuggestions from './FormulaSuggestions';
import PropertyVisibilityModal from '../components/PropertyVisibilityModal';
import LocalStorageService from '../services/LocalStorageService';

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
              console.warn('⚠️ Imagen con URL blob sin filename. No se puede cargar.');
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
          console.error('Error cargando imagen:', error);
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
              console.warn('⚠️ Imagen con URL blob sin filename. No se puede cargar.');
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
          console.error('Error cargando imagen:', error);
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
        if (!e.target.closest('input') && !e.target.closest('button') && !e.target.closest('.TagInputNotionLike') && !e.target.closest('.fila-imagen-container')) {
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
        imageFilename: fila.imageFilename || null
      };
      
      // Migración: Si hay una URL blob pero no hay filename, limpiar la imagen
      // (las URLs blob no persisten después de recargar)
      if (nuevaFila.image && nuevaFila.image.startsWith('blob:') && !nuevaFila.imageFilename) {
        console.warn('⚠️ Imagen con URL blob sin filename detectada. Se limpiará.');
        nuevaFila.image = null;
        nuevaFila.imageFilename = null;
      }
      
      // Asegurar que si hay imageFilename, también tengamos la referencia correcta en image
      if (nuevaFila.imageFilename && !nuevaFila.image) {
        nuevaFila.image = `./files/${nuevaFila.imageFilename}`;
      }
      
      if (nuevaFila.properties) {
        nuevaFila.properties = { ...nuevaFila.properties };
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
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerExpandido, setDrawerExpandido] = useState(false);
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
  
  // Estado para el tipo de vista (table o timeline)
  const [tipoVista, setTipoVista] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-table-view-type');
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
      console.error('Error guardando preferencia de ancho:', error);
    }
  }, [usarAnchoCompleto]);

  // Guardar preferencia de tipo de vista
  useEffect(() => {
    try {
      localStorage.setItem('notion-table-view-type', tipoVista);
    } catch (error) {
      console.error('Error guardando preferencia de vista:', error);
    }
  }, [tipoVista]);

  const actualizarValor = (filaIdx, key, valor) => {
    const nuevas = filas.map((fila, idx) => {
      if (idx === filaIdx) {
        return {
          ...fila,
          properties: {
            ...fila.properties,
            [key]: {
              ...fila.properties[key],
              value: valor
            }
          }
        };
      }
      return fila;
    });
    setFilas(nuevas);
  };

  const agregarFila = () => {
    const nuevaFila = {
      Name: "Nueva tarea",
      image: null, // Imagen de la fila (URL o filename)
      imageFilename: null, // Nombre del archivo guardado
      properties: {},
    };

    propiedades.forEach((prop) => {
      let defaultValue = prop.type === "checkbox" ? false : prop.type === "tags" ? [] : prop.type === "formula" ? "" : "";
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
        formula: prop.type === "formula" ? "" : undefined,
      };
    });

    setFilas([...filas, nuevaFila]);
  };

  const abrirDrawer = (fila) => {
    const index = filas.findIndex((f) => f === fila);
    setFilaSeleccionada(index);
    setShowDrawer(true);
  };

  const cerrarDrawer = () => {
    // Los datos se guardan automáticamente en el nodo del editor
    // No necesitamos Firebase, se guarda en el contenido del editor
    setShowDrawer(false);
    setFilaSeleccionada(null);
    setDrawerExpandido(false); // Resetear el estado de expansión al cerrar
  };

  // Función para obtener las columnas sugeridas de la plantilla de ejemplo
  const obtenerColumnasSugeridas = () => {
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
      // Campos de fechas
      { name: "Start Date", type: "date", visible: false, descripcion: "Fecha de inicio" },
      { name: "End Date", type: "date", visible: false, descripcion: "Fecha de fin" },
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
      { name: "Dias Transcurridos Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("Start Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) >= date(prop("Start Date"))), floor((date(prop("Current Date")) - date(prop("Start Date"))) / 86400000) + 1, 0), 0)', descripcion: "Días transcurridos desde inicio del sprint" },
      { name: "Dias Faltantes Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("End Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) <= date(prop("End Date"))), floor((date(prop("End Date")) - date(prop("Current Date"))) / 86400000), 0), 0)', descripcion: "Días faltantes hasta fin del sprint" },
      // Campos de tareas
      { name: "Tasks Completed", type: "number", visible: false, descripcion: "Número de subtareas completadas" },
      { name: "Total Tasks", type: "number", visible: false, descripcion: "Número total de subtareas" },
      { name: "Tasa Completitud", type: "formula", visible: false, formula: 'if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")', descripcion: "Porcentaje de subtareas completadas" },
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
      { name: "puntos de historia", type: "number", visible: false, descripcion: "Puntos de historia (story points)" },
      { name: "release", type: "text", visible: false, descripcion: "Release o versión" },
    ];
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

  // Función auxiliar para calcular días hábiles entre dos fechas (excluyendo sábados y domingos)
  const calcularDiasHabiles = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    let dias = 0;
    const fechaActual = new Date(inicio);
    
    while (fechaActual <= fin) {
      const diaSemana = fechaActual.getDay();
      // 0 = domingo, 6 = sábado
      if (diaSemana !== 0 && diaSemana !== 6) {
        dias++;
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    return dias;
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

  // Función para cargar plantilla con ejemplos completos de sprint
  const cargarPlantillaEjemplo = () => {
    // Fechas del sprint
    const sprintInicio = "2025-12-26";
    const sprintFin = "2026-01-08";
    const hoy = "2025-12-20";
    const horasDiarias = 8;
    
    // Calcular días hábiles del sprint
    const diasHabilesSprint = calcularDiasHabiles(sprintInicio, sprintFin);
    const horasTotalesSprint = diasHabilesSprint * horasDiarias;
    
    // Calcular días hábiles transcurridos (desde inicio del sprint hasta hoy)
    // Si hoy es antes del inicio del sprint, los días transcurridos son 0
    const fechaInicio = new Date(sprintInicio);
    const fechaHoy = new Date(hoy);
    const diasHabilesTranscurridos = fechaHoy < fechaInicio 
      ? 0 
      : calcularDiasHabiles(sprintInicio, hoy);
    
    // Definir todos los campos con fórmulas (incluyendo los de Notion de la imagen)
    const plantillaCampos = [
      // Campos principales visibles (como en Notion)
      { name: "Priority", type: "tags", visible: true },
      { name: "Type", type: "tags", visible: true },
      { name: "Percent", type: "formula", visible: true, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))' },
      { name: "Percent Total", type: "formula", visible: true, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")' },
      { name: "Progress", type: "number", visible: true, totalizar: false },
      // Campos de tiempo (ocultos inicialmente)
      { name: "Time Spent", type: "number", visible: false, totalizar: true },
      { name: "Time Estimated", type: "number", visible: false, totalizar: true },
      // Campos de fechas (ocultos inicialmente)
      { name: "Start Date", type: "text", visible: false },
      { name: "End Date", type: "text", visible: false },
      { name: "Current Date", type: "text", visible: false },
      { name: "Created", type: "text", visible: false },
      { name: "Expiration date", type: "text", visible: false },
      // Campos calculados y fórmulas (ocultos inicialmente)
      { name: "Progreso", type: "formula", visible: false, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))' },
      { name: "missing percentage", type: "formula", visible: false, formula: 'if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%"))' },
      { name: "Tiempo Restante", type: "formula", visible: false, formula: 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))' },
      { name: "Porcentaje Tiempo", type: "formula", visible: false, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") / prop("Time Estimated")) * 100)) + "%", "0%")' },
      // Campos de días y horas (ocultos inicialmente)
      { name: "Days Worked", type: "number", visible: false, totalizar: false },
      { name: "Days Elapsed", type: "number", visible: false, totalizar: false },
      { name: "Sprint Days", type: "number", visible: false, totalizar: false },
      { name: "Horas Diarias", type: "number", visible: false, totalizar: false },
      { name: "Horas Totales Sprint", type: "number", visible: false, totalizar: false },
      { name: "Dias Habiles Transcurridos", type: "number", visible: false, totalizar: false },
      { name: "Horas Disponibles", type: "formula", visible: false, formula: 'prop("Dias Habiles Transcurridos") * prop("Horas Diarias")' },
      { name: "Sobrecarga", type: "formula", visible: false, formula: 'if((prop("Time Estimated") > prop("Horas Disponibles")), "⚠️ Sobrecarga", "✅ OK")' },
      { name: "Dias Transcurridos Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("Start Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) >= date(prop("Start Date"))), floor((date(prop("Current Date")) - date(prop("Start Date"))) / 86400000) + 1, 0), 0)' },
      { name: "Dias Faltantes Sprint", type: "formula", visible: false, formula: 'if(and(!empty(prop("End Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) <= date(prop("End Date"))), floor((date(prop("End Date")) - date(prop("Current Date"))) / 86400000), 0), 0)' },
      // Campos de tareas (ocultos inicialmente)
      { name: "Tasks Completed", type: "number", visible: false, totalizar: true },
      { name: "Total Tasks", type: "number", visible: false, totalizar: false },
      { name: "Tasa Completitud", type: "formula", visible: false, formula: 'if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")' },
      // Campos de estado y tags (ocultos inicialmente)
      { name: "Estado", type: "select", visible: false },
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
      // Campo oculto para cálculos
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
          let defaultValue = campo.type === "checkbox" ? false : campo.type === "tags" ? [] : campo.type === "formula" ? "" : "";
          let defaultColor = undefined;
          
          // Valores por defecto para Priority
          if (campo.name === "Priority" && campo.type === "tags") {
            defaultValue = [{ label: "Medium", color: "#fbbf24" }]; // Amarillo por defecto
          }
          
          // Valores por defecto para Type
          if (campo.name === "Type" && campo.type === "tags") {
            defaultValue = [{ label: "TO DO", color: "#6b7280" }]; // Gris por defecto
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
            let defaultValue = campo.type === "checkbox" ? false : campo.type === "tags" ? [] : campo.type === "formula" ? "" : "";
            let defaultColor = undefined;
            
            // Valores por defecto para Priority
            if (campo.name === "Priority" && campo.type === "tags") {
              defaultValue = [{ label: "Medium", color: "#fbbf24" }]; // Amarillo por defecto
            }
            
            // Valores por defecto para Type
            if (campo.name === "Type" && campo.type === "tags") {
              defaultValue = [{ label: "TO DO", color: "#6b7280" }]; // Gris por defecto
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
    
    // Fechas del sprint
    const sprintInicio = "2025-12-26";
    const sprintFin = "2026-01-08";
    const hoy = "2025-12-20";
    const horasDiarias = 8;
    
    // Calcular días hábiles del sprint
    const diasHabilesSprint = calcularDiasHabiles(sprintInicio, sprintFin);
    const horasTotalesSprint = diasHabilesSprint * horasDiarias;
    
    // Calcular días hábiles transcurridos
    const fechaInicio = new Date(sprintInicio);
    const fechaHoy = new Date(hoy);
    const diasHabilesTranscurridos = fechaHoy < fechaInicio 
      ? 0 
      : calcularDiasHabiles(sprintInicio, hoy);
    
    // Obtener los campos de la plantilla (ya agregados anteriormente)
    const plantillaCampos = [
      { name: "Priority", type: "tags", visible: true },
      { name: "Type", type: "tags", visible: true },
      { name: "Percent", type: "formula", visible: true, formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))' },
      { name: "Percent Total", type: "formula", visible: true, formula: 'if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")' },
      { name: "Progress", type: "number", visible: true, totalizar: false },
      { name: "Time Spent", type: "number", visible: false, totalizar: true },
      { name: "Time Estimated", type: "number", visible: false, totalizar: true },
      { name: "Start Date", type: "text", visible: false },
      { name: "End Date", type: "text", visible: false },
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
          properties[campo.name] = { type: "number", value: tarea.objective };
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
        } else if (campo.name === "Start Date") {
          properties[campo.name] = { type: "text", value: tarea.startDate };
        } else if (campo.name === "End Date") {
          properties[campo.name] = { type: "text", value: tarea.endDate };
        } else if (campo.name === "Current Date") {
          properties[campo.name] = { type: "text", value: hoy };
        } else if (campo.name === "Created") {
          properties[campo.name] = { type: "text", value: tarea.created || hoy };
        } else if (campo.name === "Expiration date") {
          properties[campo.name] = { type: "text", value: tarea.expirationDate || "" };
        } else if (campo.name === "Sprint Days") {
          properties[campo.name] = { type: "number", value: diasHabilesSprint };
        } else if (campo.name === "Horas Diarias") {
          properties[campo.name] = { type: "number", value: horasDiarias };
        } else if (campo.name === "Horas Totales Sprint") {
          properties[campo.name] = { type: "number", value: horasTotalesSprint };
        } else if (campo.name === "Dias Habiles Transcurridos") {
          properties[campo.name] = { type: "number", value: diasHabilesTranscurridos };
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

    setFilas(nuevasFilas);
    
    // Guardar información del sprint para mostrarla después
    setSprintInfo({
      tareas: tareasEjemplo.length,
      inicio: sprintInicio,
      fin: sprintFin,
      diasHabiles: diasHabilesSprint,
      horasTotales: horasTotalesSprint,
      horasDiarias: horasDiarias
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
        const evaluator = new FormulaEvaluator(fila, filas);
        const result = evaluator.evaluate(formula);
        console.log('Evaluando fórmula:', formula, 'Resultado:', result, 'Fila:', fila.Name);
        return result !== undefined && result !== null ? String(result) : "";
      } catch (error) {
        console.error('Error evaluando fórmula:', error, formula);
        return "Error";
      }
    }
    return fila.properties?.[prop.name]?.value;
  };

  const filasFiltradas = filas.filter(
    (f) =>
      f.Name.toLowerCase().includes(filtro.toLowerCase()) ||
      Object.values(f.properties || {}).some(
        (p) =>
          (typeof p.value === "string" && p.value.toLowerCase().includes(filtro.toLowerCase())) ||
          (Array.isArray(p.value) && p.value.join(",").toLowerCase().includes(filtro.toLowerCase()))
      )
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
        console.error("Error subiendo imagen:", error);
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
    // Obtener todas las fechas de inicio y fin para calcular el rango
    const fechas = filasOrdenadas
      .map(fila => ({
        inicio: fila.properties?.["Start Date"]?.value || fila.properties?.["startDate"]?.value,
        fin: fila.properties?.["End Date"]?.value || fila.properties?.["endDate"]?.value,
      }))
      .filter(f => f.inicio && f.fin);

    if (fechas.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No hay tareas con fechas de inicio y fin para mostrar en la timeline</p>
          <p className="text-sm">Asegúrate de tener campos "Start Date" y "End Date" con valores</p>
        </div>
      );
    }

    // Calcular el rango de fechas
    const todasLasFechas = [...fechas.map(f => f.inicio), ...fechas.map(f => f.fin)];
    const fechaMin = new Date(Math.min(...todasLasFechas.map(d => new Date(d).getTime())));
    const fechaMax = new Date(Math.max(...todasLasFechas.map(d => new Date(d).getTime())));
    
    // Agregar algunos días de margen
    fechaMin.setDate(fechaMin.getDate() - 2);
    fechaMax.setDate(fechaMax.getDate() + 2);
    
    const rangoTotal = fechaMax.getTime() - fechaMin.getTime();
    const diasTotal = Math.ceil(rangoTotal / (1000 * 60 * 60 * 24));

    // Función para calcular posición porcentual de una fecha
    const calcularPosicion = (fecha) => {
      const fechaObj = new Date(fecha);
      const diferencia = fechaObj.getTime() - fechaMin.getTime();
      return (diferencia / rangoTotal) * 100;
    };

    // Función para calcular ancho porcentual de una tarea
    const calcularAncho = (inicio, fin) => {
      const inicioPos = calcularPosicion(inicio);
      const finPos = calcularPosicion(fin);
      return Math.max(2, finPos - inicioPos); // Mínimo 2% de ancho
    };

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
          {filasOrdenadas
            .filter(fila => {
              const inicio = fila.properties?.["Start Date"]?.value || fila.properties?.["startDate"]?.value;
              const fin = fila.properties?.["End Date"]?.value || fila.properties?.["endDate"]?.value;
              return inicio && fin;
            })
            .map((fila, idx) => {
              const inicio = fila.properties?.["Start Date"]?.value || fila.properties?.["startDate"]?.value;
              const fin = fila.properties?.["End Date"]?.value || fila.properties?.["endDate"]?.value;
              const posicion = calcularPosicion(inicio);
              const ancho = calcularAncho(inicio, fin);
              
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
                    title={`${fila.Name} - ${inicio} a ${fin}${progreso ? ` - ${progreso}` : ''}`}
                  >
                    <span className="truncate flex-1">{fila.Name}</span>
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
          
          {filasOrdenadas.filter(fila => {
            const inicio = fila.properties?.["Start Date"]?.value || fila.properties?.["startDate"]?.value;
            const fin = fila.properties?.["End Date"]?.value || fila.properties?.["endDate"]?.value;
            return !inicio || !fin;
          }).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500 mb-2">
                Tareas sin fechas ({filasOrdenadas.filter(fila => {
                  const inicio = fila.properties?.["Start Date"]?.value || fila.properties?.["startDate"]?.value;
                  const fin = fila.properties?.["End Date"]?.value || fila.properties?.["endDate"]?.value;
                  return !inicio || !fin;
                }).length})
              </div>
              {filasOrdenadas
                .filter(fila => {
                  const inicio = fila.properties?.["Start Date"]?.value || fila.properties?.["startDate"]?.value;
                  const fin = fila.properties?.["End Date"]?.value || fila.properties?.["endDate"]?.value;
                  return !inicio || !fin;
                })
                .map((fila, idx) => (
                  <div
                    key={idx}
                    className="p-2 border rounded mb-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => abrirDrawer(fila)}
                  >
                    {fila.Name || "Sin nombre"}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Sincronizar estado cuando cambia el nodo (útil cuando se carga desde guardado)
  useEffect(() => {
    const nodoFilas = inicializarFilas(node.attrs.filas);
    const nodoPropiedades = (node.attrs.propiedades || []).map(p => ({ ...p, visible: p.visible !== undefined ? p.visible : true }));
    
    // Solo actualizar si hay diferencias significativas
    if (JSON.stringify(nodoFilas) !== JSON.stringify(filas)) {
      setFilas(nodoFilas);
    }
    if (JSON.stringify(nodoPropiedades) !== JSON.stringify(propiedades)) {
      setPropiedades(nodoPropiedades);
    }
  }, [node.attrs.filas, node.attrs.propiedades]);

  // Actualizar atributos del nodo cuando cambian filas o propiedades
  useEffect(() => {
    updateAttributes({ filas, propiedades });
  }, [filas, propiedades, updateAttributes]);

  return (
    <NodeViewWrapper 
      className={`relative group border rounded bg-white shadow p-4 text-sm ${usarAnchoCompleto ? 'notion-table-fullwidth' : ''}`}
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
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            const pos = getPos?.();
            const view = editor?.view;

            if (view && typeof pos === "number") {
              view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
            }
          }}
          className="bg-white border rounded px-2 py-1 text-xs shadow hover:bg-red-100"
        >
          🗑️
        </button>
        <button className="bg-white border rounded px-2 py-1 text-xs shadow hover:bg-gray-100 mt-1">↕️</button>
      </div>

      {/* Menú de configuración en esquina superior derecha (tres puntitos) */}
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={() => setShowMenuConfig(!showMenuConfig)}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
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
            <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-xl z-40 min-w-[200px] py-2">
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
            </div>
          </>
        )}
      </div>

      {/* Selector de tipo de vista (Table/Timeline) */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setTipoVista('table')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            tipoVista === 'table'
              ? 'bg-gray-200 text-gray-900 font-medium'
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-base">⊞</span>
          <span>Table</span>
        </button>
        <button
          onClick={() => setTipoVista('timeline')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
            tipoVista === 'timeline'
              ? 'bg-gray-200 text-gray-900 font-medium'
              : 'bg-transparent text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-base">📄</span>
          <span>Timeline</span>
        </button>
      </div>

      <div className="flex justify-between items-center mb-2 gap-2">
        <input
          type="text"
          placeholder="🔍 Filtrar..."
          className="border px-2 py-1 rounded w-64"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <div className="flex gap-2">
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
          <button 
            onClick={cargarPlantillaAgil} 
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
            title="Cargar plantilla completa de metodología ágil Azure DevOps"
          >
            📋 Plantillas
          </button>
          <button 
            onClick={cargarPlantillaEjemplo} 
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
            title="Cargar plantilla con ejemplos completos de sprint (12 tareas con datos y fórmulas)"
          >
            🎯 Plantilla con Ejemplos
          </button>
        <button onClick={agregarFila} className="bg-blue-600 text-white px-3 py-1 rounded">
          ➕ Agregar fila
        </button>
        </div>
      </div>

      {/* Panel de Indicadores del Sprint */}
      {(tipoVista === 'table' || tipoVista === 'timeline') && (() => {
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
            
            // Progress y Objective
            const progress = parseFloat(fila.properties?.["Progress"]?.value || 0);
            const objective = parseFloat(fila.properties?.["Objective"]?.value || 0);
            totalProgress += progress;
            totalObjective += objective;
            
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
          const porcentajeCumplimiento = totalObjective > 0 ? Math.round((totalProgress / totalObjective) * 100) : 0;
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
          {renderTimelineView()}
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
                
                // Anchos fijos por tipo de campo para asegurar visibilidad
                let minWidth = '150px'; // Ancho fijo por defecto
                let width = '150px';
                
                if (p.type === "checkbox") {
                  minWidth = '50px';
                  width = '50px';
                } else if (p.type === "number" || p.type === "percent") {
                  minWidth = '120px';
                  width = '120px';
                } else if (p.type === "date") {
                  minWidth = '140px';
                  width = '140px';
                } else if (p.type === "formula") {
                  minWidth = '130px';
                  width = '130px';
                } else if (p.type === "tags") {
                  minWidth = '180px';
                  width = '180px';
                } else if (p.type === "select") {
                  minWidth = '140px';
                  width = '140px';
                } else {
                  // Para texto, ancho fijo generoso
                  minWidth = '150px';
                  width = '150px';
                }
                
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
                  className="cursor-pointer"
                  onClick={() => toggleSort(p.name)}
                  style={{ minWidth, width, maxWidth: width, whiteSpace: 'nowrap', padding: '2px 10px', overflow: 'visible' }}
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
                    
                    return (
                    <td 
                      key={pi} 
                      className={prop.type === "tags" ? "tags-cell" : ""}
                      style={{ 
                        padding: '2px 8px', 
                        overflow: prop.type === "tags" ? 'visible' : 'hidden',
                        whiteSpace: prop.type === "checkbox" ? 'nowrap' : (prop.type === "tags" ? 'normal' : 'nowrap'),
                        width: prop.type === "checkbox" ? '50px' : (prop.type === "number" || prop.type === "percent" ? '120px' : prop.type === "date" ? '140px' : prop.type === "formula" ? '130px' : prop.type === "tags" ? '180px' : prop.type === "select" ? '140px' : '150px'),
                        minWidth: prop.type === "checkbox" ? '50px' : (prop.type === "number" || prop.type === "percent" ? '120px' : prop.type === "date" ? '140px' : prop.type === "formula" ? '130px' : prop.type === "tags" ? '180px' : prop.type === "select" ? '140px' : '150px'),
                        maxWidth: prop.type === "checkbox" ? '50px' : (prop.type === "number" || prop.type === "percent" ? '120px' : prop.type === "date" ? '140px' : prop.type === "formula" ? '130px' : prop.type === "tags" ? '180px' : prop.type === "select" ? '140px' : '150px')
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
                      <input
                        type="number"
                            className="group relative w-full text-right"
                        value={fila.properties?.[prop.name]?.value || 0}
                        onChange={(e) => actualizarValor(fi, prop.name, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ textAlign: 'right' }}
                      />
                    ) : prop.type === "select" ? (
                          <div className="group relative inline-block w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className="notion-pill cursor-text border-none outline-none bg-transparent px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: fila.properties?.[prop.name]?.color || "rgba(206, 205, 202, 0.3)",
                            color: fila.properties?.[prop.name]?.color ? "white" : "rgb(55, 53, 47)",
                            width: '100%',
                            minWidth: '60px'
                          }}
                          value={fila.properties?.[prop.name]?.value || ""}
                          onChange={(e) => {
                            e.stopPropagation();
                            actualizarValor(fi, prop.name, e.target.value);
                          }}
                          placeholder="Sin valor"
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
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
                        <input
                          type="text"
                          value={fila.properties?.[prop.name]?.value || ""}
                          onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                          className="flex-1 px-2 py-1 border rounded"
                        />
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: fila.properties?.[prop.name]?.color || "#3b82f6" }}
                          ></div>
                          <input
                            type="color"
                            value={fila.properties?.[prop.name]?.color || "#3b82f6"}
                            onChange={(e) => {
                              const nuevas = [...filas];
                              nuevas[fi].properties[prop.name].color = e.target.value;
                              setFilas(nuevas);
                            }}
                            className="w-6 h-6 border rounded"
                          />
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
      {/* Overlay con animación */}
      <div 
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={cerrarDrawer}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      {/* Panel lateral con animación */}
      <div 
        className={`fixed top-0 bottom-0 z-50 bg-white shadow-2xl overflow-y-auto transition-all duration-300 ease-out ${
          drawerExpandido ? 'right-0 w-full' : 'right-0 w-1/2'
        }`}
        style={{ 
          animation: 'slideInRight 0.3s ease-out',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {filaSeleccionada !== null ? filas[filaSeleccionada]?.Name || "Sin nombre" : "Editar fila"}
          </h2>
          <div className="flex items-center gap-2">
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
            <button 
              onClick={() => setDrawerExpandido(!drawerExpandido)} 
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

      {filaSeleccionada !== null && (
        <>
          {/* Título editable en la parte superior */}
          <div className="mb-6">
            <input
              type="text"
              className="w-full text-2xl font-semibold border-none outline-none focus:bg-gray-50 px-2 py-1 rounded transition-colors"
              value={filas[filaSeleccionada].Name || ""}
              placeholder="Sin título"
              onChange={(e) => {
                const nuevas = [...filas];
                nuevas[filaSeleccionada].Name = e.target.value;
                setFilas(nuevas);
              }}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">Imagen</label>
            <div className="flex items-center gap-3">
              {filas[filaSeleccionada].imageFilename || filas[filaSeleccionada].image ? (
                <div className="relative">
                  {filas[filaSeleccionada].imageFilename?.startsWith('icon-') ? (
                    <div className="w-16 h-16 rounded flex items-center justify-center text-3xl border border-gray-200 bg-white">
                      {filas[filaSeleccionada].image}
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
                {filas[filaSeleccionada].image ? 'Cambiar imagen' : 'Agregar imagen/icono'}
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
  content={filas[filaSeleccionada]?.descripcion || ""}
  onChange={(nuevoContenido) => {
    const nuevas = [...filas];
    nuevas[filaSeleccionada].descripcion = nuevoContenido;
    setFilas(nuevas);
  }}
/>
        </>
      )}
        </div>
      </div>
    </>
  )}

      {/* Modal para elegir cantidad de tareas de ejemplo */}
      {showEjemploModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Agregar Plantilla con Ejemplos</h3>
            <p className="text-gray-600 mb-6">
              Se agregarán todas las columnas y fórmulas. ¿Cuántas tareas de ejemplo deseas crear?
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
                  <div className="font-semibold text-gray-900">
                    Plantilla de ejemplo cargada
                  </div>
                  <div className="text-sm text-gray-600">
                    {sprintInfo.tareas} tareas creadas con todas las fórmulas implementadas
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
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { id: 'hu', label: 'Historia de Usuario', emoji: '📋', color: '#3b82f6' },
                  { id: 'tarea', label: 'Tarea', emoji: '✅', color: '#10b981' },
                  { id: 'bug', label: 'Bug', emoji: '🐛', color: '#ef4444' },
                  { id: 'epica', label: 'Épica', emoji: '🎯', color: '#8b5cf6' },
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
                          console.error("Error subiendo imagen:", error);
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
                <h2 className="text-lg font-semibold text-gray-900 break-words">📋 Columnas Sugeridas para Metodologías Ágiles</h2>
                <p className="text-sm text-gray-600 mt-1 break-words">
                  Selecciona las columnas que deseas agregar ({obtenerColumnasSugeridas().length} disponibles)
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
            </div>
            <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0 gap-3 overflow-x-hidden">
              <div className="text-sm text-gray-600 min-w-0 flex-1">
                {columnasSeleccionadas.length > 0 ? (
                  <span className="font-medium text-blue-600 break-words">{columnasSeleccionadas.length} columna(s) seleccionada(s)</span>
                ) : (
                  <span className="text-gray-500 break-words">Ninguna columna seleccionada</span>
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
                  Cancelar
                </button>
                <button
                  onClick={agregarColumnasSeleccionadas}
                  disabled={columnasSeleccionadas.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Agregar ({columnasSeleccionadas.length})
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
        // Definir tags disponibles según el tipo de campo
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
          }
          // Para otros campos de tags, no hay lista predefinida
          return [];
        };

        const availableTags = getAvailableTags(tagsEditando.propName);
        const selectedTagLabels = tagsEditando.tags.map(t => t.label || t.value || t);
        
        const toggleTag = (tag) => {
          const isSelected = selectedTagLabels.includes(tag.label);
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
                      Tags disponibles:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag, idx) => {
                        const isSelected = selectedTagLabels.includes(tag.label);
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
                          >
                            {isSelected && '✓ '}
                            {tag.label}
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
                      actualizarValor(tagsEditando.filaIndex, tagsEditando.propName, tagsEditando.tags);
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

    </NodeViewWrapper>
  );
}

