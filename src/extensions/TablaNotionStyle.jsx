import { useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import TagInputNotionLike from "./TagInputNotionLike";
import EditorDescripcion from './EditorDescripcion';
import { FormulaEvaluator, calcularTotal } from './FormulaEvaluator';
import FormulaSuggestions from './FormulaSuggestions';
import PropertyVisibilityModal from '../components/PropertyVisibilityModal';

const tipos = [
  { value: "text", label: "📝 Texto" },
  { value: "number", label: "# Número" },
  { value: "checkbox", label: "✅ Check" },
  { value: "percent", label: "📊 Porcentaje" },
  { value: "select", label: "🎨 Select con color" },
  { value: "tags", label: "🏷️ Tags" },
  { value: "formula", label: "🧮 Fórmula" },
];

export default function TablaNotionStyle({ node, updateAttributes, getPos, editor }) {
  // Inicializar estado desde el nodo, asegurando que las fórmulas estén inicializadas
  const inicializarFilas = (filasData) => {
    if (!filasData || !Array.isArray(filasData)) return [];
    return filasData.map(fila => {
      const nuevaFila = { ...fila };
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
    const nuevas = [...filas];
    nuevas[filaIdx].properties[key].value = valor;
    setFilas(nuevas);
  };

  const agregarFila = () => {
    const nuevaFila = {
      Name: "Nueva tarea",
      properties: {},
    };

    propiedades.forEach((prop) => {
      nuevaFila.properties[prop.name] = {
        type: prop.type,
        value: prop.type === "checkbox" ? false : prop.type === "tags" ? [] : prop.type === "formula" ? "" : "",
        color: prop.type === "select" ? "#3b82f6" : undefined,
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
  };

  const agregarPropiedad = () => {
    if (!nuevoCampo.name) return;
    const nuevas = [...propiedades, { 
      ...nuevoCampo, 
      totalizar: nuevoCampo.type === "number" || nuevoCampo.type === "percent" ? false : undefined,
      formula: nuevoCampo.type === "formula" ? (nuevoCampo.formula || "") : undefined,
      visible: nuevoCampo.visible !== undefined ? nuevoCampo.visible : true
    }];
    setPropiedades(nuevas);

    const nuevasFilas = filas.map((fila) => {
      return {
        ...fila,
        properties: {
          ...fila.properties,
          [nuevoCampo.name]: {
            type: nuevoCampo.type,
            value: nuevoCampo.type === "checkbox" ? false : nuevoCampo.type === "tags" ? [] : nuevoCampo.type === "formula" ? "" : "",
            color: nuevoCampo.type === "select" ? "#3b82f6" : undefined,
            formula: nuevoCampo.type === "formula" ? (nuevoCampo.formula || "") : undefined,
          },
        },
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
      { name: "Priority", type: "select", visible: true },
      { name: "Type", type: "select", visible: true },
      { name: "Percent", type: "formula", visible: true, formula: 'if((prop("Objective") > 0), format(round((prop("Progress") / prop("Objective")) * 100)) + "%", "0%")' },
      { name: "Percent Total", type: "formula", visible: true, formula: 'if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")' },
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
      { name: "missing percentage", type: "formula", visible: false, formula: 'if((prop("Objective") > 0), format(round(((prop("Objective") - prop("Progress")) / prop("Objective")) * 100)) + "%", "0%")' },
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
      // Campos de tareas (ocultos inicialmente)
      { name: "Tasks Completed", type: "number", visible: false, totalizar: true },
      { name: "Total Tasks", type: "number", visible: false, totalizar: false },
      { name: "Tasa Completitud", type: "formula", visible: false, formula: 'if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")' },
      // Campos de estado y tags (ocultos inicialmente)
      { name: "Estado", type: "select", visible: false },
      { name: "Tags", type: "tags", visible: false },
      { name: "Assign", type: "tags", visible: false },
      { name: "Done", type: "checkbox", visible: false },
      // Campos adicionales (ocultos inicialmente)
      { name: "Link", type: "text", visible: false },
      { name: "Retrospective", type: "text", visible: false },
      { name: "Video", type: "text", visible: false },
      { name: "Lambdas", type: "text", visible: false },
      { name: "NameRepo", type: "text", visible: false },
      { name: "Property", type: "text", visible: false },
      { name: "to", type: "text", visible: false },
      // Campo oculto para cálculos
      { name: "Objective", type: "number", visible: false, totalizar: false },
    ];

    // Crear propiedades
    const nuevasPropiedades = plantillaCampos.map(campo => ({
      name: campo.name,
      type: campo.type,
      visible: campo.visible !== undefined ? campo.visible : true,
      totalizar: campo.totalizar,
      formula: campo.formula || undefined
    }));

    setPropiedades(nuevasPropiedades);

    // Crear tareas de ejemplo con todos los campos
    const tareasEjemplo = [
      { nombre: "Diseño de UI/UX", progress: 80, objective: 100, timeSpent: 12, timeEstimated: 16, daysWorked: 2, startDate: "2025-12-26", endDate: "2025-12-30", tasksCompleted: 4, totalTasks: 5, daysElapsed: 2, estado: "En progreso", priority: "Alta", type: "Tarea", tags: ["Frontend", "Diseño"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Implementación API Backend", progress: 60, objective: 100, timeSpent: 20, timeEstimated: 32, daysWorked: 3, startDate: "2025-12-26", endDate: "2026-01-02", tasksCompleted: 6, totalTasks: 10, daysElapsed: 3, estado: "En progreso", priority: "Alta", type: "Tarea", tags: ["Backend", "API"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Integración Base de Datos", progress: 40, objective: 100, timeSpent: 8, timeEstimated: 24, daysWorked: 1, startDate: "2025-12-27", endDate: "2026-01-03", tasksCompleted: 2, totalTasks: 5, daysElapsed: 1, estado: "En progreso", priority: "Media", type: "Tarea", tags: ["Database", "Backend"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Pruebas Unitarias", progress: 30, objective: 100, timeSpent: 6, timeEstimated: 20, daysWorked: 1, startDate: "2025-12-28", endDate: "2026-01-05", tasksCompleted: 3, totalTasks: 10, daysElapsed: 1, estado: "En progreso", priority: "Media", type: "Tarea", tags: ["Testing", "QA"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Documentación Técnica", progress: 50, objective: 100, timeSpent: 4, timeEstimated: 8, daysWorked: 1, startDate: "2025-12-29", endDate: "2026-01-06", tasksCompleted: 2, totalTasks: 4, daysElapsed: 1, estado: "En progreso", priority: "Baja", type: "Tarea", tags: ["Documentación"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Optimización Performance", progress: 20, objective: 100, timeSpent: 4, timeEstimated: 16, daysWorked: 1, startDate: "2025-12-30", endDate: "2026-01-07", tasksCompleted: 1, totalTasks: 5, daysElapsed: 1, estado: "Pendiente", priority: "Media", type: "Tarea", tags: ["Performance", "Optimización"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Configuración CI/CD", progress: 70, objective: 100, timeSpent: 10, timeEstimated: 12, daysWorked: 2, startDate: "2025-12-26", endDate: "2025-12-31", tasksCompleted: 7, totalTasks: 10, daysElapsed: 2, estado: "En progreso", priority: "Alta", type: "Tarea", tags: ["DevOps", "CI/CD"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Revisión de Código", progress: 45, objective: 100, timeSpent: 9, timeEstimated: 20, daysWorked: 2, startDate: "2025-12-27", endDate: "2026-01-04", tasksCompleted: 9, totalTasks: 20, daysElapsed: 2, estado: "En progreso", priority: "Media", type: "Tarea", tags: ["Code Review"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Corrección de Bugs", progress: 55, objective: 100, timeSpent: 11, timeEstimated: 18, daysWorked: 2, startDate: "2025-12-28", endDate: "2026-01-05", tasksCompleted: 11, totalTasks: 20, daysElapsed: 2, estado: "En progreso", priority: "Alta", type: "Bug", tags: ["Bugs", "Fix"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Despliegue en Staging", progress: 0, objective: 100, timeSpent: 0, timeEstimated: 8, daysWorked: 0, startDate: "2026-01-06", endDate: "2026-01-08", tasksCompleted: 0, totalTasks: 3, daysElapsed: 0, estado: "Pendiente", priority: "Alta", type: "Tarea", tags: ["Deployment", "Staging"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Pruebas de Integración", progress: 25, objective: 100, timeSpent: 5, timeEstimated: 16, daysWorked: 1, startDate: "2025-12-30", endDate: "2026-01-07", tasksCompleted: 2, totalTasks: 8, daysElapsed: 1, estado: "En progreso", priority: "Media", type: "Tarea", tags: ["Testing", "Integración"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
      { nombre: "Preparación Demo", progress: 10, objective: 100, timeSpent: 2, timeEstimated: 12, daysWorked: 1, startDate: "2026-01-02", endDate: "2026-01-08", tasksCompleted: 1, totalTasks: 10, daysElapsed: 0, estado: "Pendiente", priority: "Baja", type: "Tarea", tags: ["Demo", "Presentación"], assign: [], done: false, created: hoy, expirationDate: "", link: "", retrospective: "", video: "", lambdas: "", nameRepo: "", property: "", to: "" },
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
          properties[campo.name] = { type: "select", value: tarea.priority || "Media", color: tarea.priority === "Alta" ? "#ef4444" : tarea.priority === "Media" ? "#f59e0b" : "#6b7280" };
        } else if (campo.name === "Type") {
          properties[campo.name] = { type: "select", value: tarea.type || "Tarea", color: tarea.type === "Bug" ? "#ef4444" : "#3b82f6" };
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
        } else {
          properties[campo.name] = {
            type: campo.type,
            value: campo.type === "checkbox" ? false : campo.type === "tags" ? [] : ""
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
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        width: '100vw',
        maxWidth: '100vw',
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
              {filasOrdenadas.length > 0 && (
                <div className="border-t my-1">
                  <div className="px-4 py-2 text-xs text-gray-500 font-semibold">
                    Eliminar Filas
                  </div>
                  {filasOrdenadas.map((fila, index) => {
                    const filaIndexOriginal = filas.findIndex(f => f === fila);
                    return (
                      <button
                        key={filaIndexOriginal}
                        onClick={() => {
                          setFilaAEliminar(filaIndexOriginal);
                          setShowDeleteRowModal(true);
                          setShowMenuConfig(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 text-sm"
                      >
                        <span>🗑️</span>
                        <span className="truncate">{fila.Name || "Sin nombre"}</span>
                      </button>
                    );
                  })}
                </div>
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
              <th className="cursor-pointer" onClick={() => toggleSort("Name")} style={{ minWidth: '120px', maxWidth: '200px' }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs opacity-60">Aa</span>
                  <span>Nombre</span>
                  {sortBy === "Name" && <span className="text-[10px] opacity-60">{sortAsc ? "↑" : "↓"}</span>}
                </div>
              </th>
              {propiedadesVisibles.map((p, idx) => {
                // Dividir el nombre en palabras
                const palabras = p.name.split(/\s+/);
                const tieneDosPalabras = palabras.length === 2;
                const tieneMasPalabras = palabras.length > 2;
                
                // Calcular ancho mínimo basado en el tipo y número de palabras
                let minWidth = '70px';
                if (p.type === "number" || p.type === "percent") minWidth = '65px';
                else if (p.type === "formula") minWidth = '75px';
                else if (p.type === "tags") minWidth = '120px';
                else if (tieneDosPalabras) minWidth = '70px';
                else if (tieneMasPalabras) minWidth = '80px';
                else if (p.type === "checkbox") minWidth = '50px';
                else if (p.type === "select") minWidth = '80px';
                
                // Determinar cómo dividir el texto
                let textoSuperior = p.name;
                let textoInferior = '';
                if (tieneDosPalabras) {
                  textoSuperior = palabras[0];
                  textoInferior = palabras[1];
                } else if (tieneMasPalabras) {
                  // Dividir por la mitad aproximada
                  const mitad = Math.ceil(palabras.length / 2);
                  textoSuperior = palabras.slice(0, mitad).join(' ');
                  textoInferior = palabras.slice(mitad).join(' ');
                }
                
                return (
                <th
                  key={idx}
                  className="cursor-pointer"
                  onClick={() => toggleSort(p.name)}
                  style={{ minWidth }}
                  title={p.name}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Icono según el tipo */}
                    <span className="text-xs opacity-60">
                      {p.type === "text" && "Aa"}
                      {p.type === "number" && "#"}
                      {p.type === "percent" && "%"}
                      {p.type === "checkbox" && "☑"}
                      {p.type === "select" && "▼"}
                      {p.type === "tags" && "🏷"}
                      {p.type === "formula" && "="}
                    </span>
                    {tieneDosPalabras || tieneMasPalabras ? (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-xs leading-tight">{textoSuperior}</span>
                        <span className="text-xs leading-tight">{textoInferior}</span>
                      </div>
                    ) : (
                      <span className="text-xs leading-tight">{p.name}</span>
                    )}
                    {sortBy === p.name && <span className="text-[10px] opacity-60">{sortAsc ? "↑" : "↓"}</span>}
                  </div>
                </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {!tablaColapsada && filasOrdenadas.map((fila, fi) => (
              <tr 
                key={fi} 
                className="hover:bg-gray-50"
              >
                <td
                  className="font-semibold cursor-pointer"
                  style={{ minWidth: '120px', maxWidth: '200px', padding: '2px 6px' }}
                  onClick={(e) => {
                    if (!e.target.closest('input') && !e.target.closest('button') && !e.target.closest('.TagInputNotionLike')) {
                      abrirDrawer(fila);
                    }
                  }}
                >
                  {fila.Name || "Sin nombre"}
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
                    <td key={pi} style={{ padding: '2px 6px', maxWidth: '150px', overflow: 'hidden' }}>
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
                          <div className="group relative inline-block w-full" onClick={(e) => {
                            e.stopPropagation();
                            abrirDrawer(fila);
                          }}>
                        <span 
                          className="notion-pill cursor-pointer"
                          style={{ 
                            backgroundColor: fila.properties?.[prop.name]?.color || "rgba(206, 205, 202, 0.3)",
                            color: fila.properties?.[prop.name]?.color ? "white" : "rgb(55, 53, 47)"
                          }}
                        >
                          {fila.properties?.[prop.name]?.value || "Sin valor"}
                        </span>
                      </div>
                    ) : prop.type === "tags" ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <div className="flex-1 min-w-0">
                          <TagInputNotionLike
                            value={fila.properties?.[prop.name]?.value || []}
                            onChange={(val) => actualizarValor(fi, prop.name, val)}
                          />
                        </div>
                        <button
                          title="Copiar tags"
                              className="p-1 rounded hover:bg-gray-200 flex-shrink-0 transition-colors opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                            const tagsArr = fila.properties?.[prop.name]?.value || [];
                            const tags = tagsArr.map(tag => tag.label || tag.value || tag).join(", ");
                            navigator.clipboard.writeText(tags);
                          }}
                        >
                              <span role="img" aria-label="copiar" className="text-xs">📋</span>
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                            className="group relative w-full"
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                            placeholder={prop.name.toLowerCase().includes('fecha') ? 'YYYY-MM-DD' : ''}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                  </td>
                    );
                  })}
              </tr>
            ))}
            {/* Mensaje cuando la tabla está colapsada */}
            {tablaColapsada && (
              <tr>
                <td colSpan={propiedadesVisibles.length + 1} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <span>Tabla colapsada - Haz clic en "🔽 Expandir Tabla" para ver las filas</span>
                  </div>
                </td>
              </tr>
            )}
            {/* Mensaje si no hay filas */}
            {filasOrdenadas.length === 0 && (
              <tr>
                <td colSpan={propiedadesVisibles.length + 1} className="text-center py-8 text-gray-500">
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
                <td style={{ minWidth: '120px', maxWidth: '200px', padding: '8px' }} className="font-bold">
                  📊 Total
                </td>
                {propiedadesVisibles.map((prop, pi) => (
                  <td key={pi} className="text-right" style={{ padding: '8px' }}>
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
        {filasOrdenadas.map((fila, fi) => (
          <div key={fi} className="notion-table-card">
            <div 
              className="notion-table-card-title"
              onClick={() => abrirDrawer(fila)}
            >
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
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => abrirDrawer(fila)}
                className="notion-table-card-edit-button"
              >
                ✏️ Editar detalles
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

{showDrawer && (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-center items-center">
    <div className="bg-white w-full h-full overflow-y-auto p-6 shadow-xl rounded-none">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Editar fila</h2>
        <button onClick={cerrarDrawer} className="text-red-500 text-2xl font-bold">×</button>
      </div>

      {filaSeleccionada !== null && (
        <>
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">Título</label>
            <input
              type="text"
              className="border w-full px-2 py-1 rounded"
              value={filas[filaSeleccionada].Name}
              onChange={(e) => {
                const nuevas = [...filas];
                nuevas[filaSeleccionada].Name = e.target.value;
                setFilas(nuevas);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {propiedades.map((prop, pi) => (
              <div key={pi} className={prop.type === "formula" ? "col-span-full" : ""}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs text-gray-600">
                    {prop.name}
                    {prop.type === "formula" && " (Fórmula)"}
                    {prop.totalizar && " (Totalizar)"}
                    {prop.visible === false && " 👁️ Oculto"}
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prop.visible !== false}
                      onChange={(e) => {
                        const nuevas = [...propiedades];
                        nuevas[pi].visible = e.target.checked;
                        setPropiedades(nuevas);
                      }}
                      className="w-3 h-3"
                    />
                    <span>Visible</span>
                  </label>
                </div>
                {prop.type === "formula" ? (
                  <div>
                    <textarea
                      className="border w-full px-2 py-1 rounded text-xs font-mono"
                      rows={4}
                      placeholder='Ej: if(((prop("Progress") / prop("Objective")) >= 1), "✅", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")'
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.formula || ""}
                      onChange={(e) => {
                        const nuevas = [...filas];
                        if (!nuevas[filaSeleccionada].properties) {
                          nuevas[filaSeleccionada].properties = {};
                        }
                        if (!nuevas[filaSeleccionada].properties[prop.name]) {
                          nuevas[filaSeleccionada].properties[prop.name] = { type: "formula", value: "", formula: "" };
                        }
                        nuevas[filaSeleccionada].properties[prop.name].formula = e.target.value;
                        // Asegurar que el tipo esté correcto
                        nuevas[filaSeleccionada].properties[prop.name].type = "formula";
                        console.log('Guardando fórmula:', e.target.value, 'en propiedad:', prop.name, 'fila:', nuevas[filaSeleccionada].Name);
                        setFilas(nuevas);
                      }}
                    />
                    <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      Resultado: <strong>{obtenerValorCelda(filas[filaSeleccionada], prop)}</strong>
                    </div>
                    {/* Botón para abrir modal de fórmulas sugeridas */}
                    <button
                      type="button"
                      onClick={() => {
                        setPropiedadFormulaEditando(prop.name);
                        setEsNuevoCampo(false);
                        setShowFormulaModal(true);
                      }}
                      className="mt-2 w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      💡 Ver fórmulas sugeridas
                    </button>
                  </div>
                ) : prop.type === "tags" ? (
                  <TagInputNotionLike
                    value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || []}
                    onChange={(val) => actualizarValor(filaSeleccionada, prop.name, val)}
                  />
                ) : prop.type === "number" || prop.type === "percent" ? (
                  <div>
                  <input
                    type="number"
                    className="border w-full px-2 py-1 rounded"
                    value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || 0}
                    onChange={(e) => actualizarValor(filaSeleccionada, prop.name, Number(e.target.value))}
                  />
                    <div className="flex flex-col gap-1 mt-1">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prop.totalizar || false}
                          onChange={(e) => {
                            const nuevas = [...propiedades];
                            nuevas[pi].totalizar = e.target.checked;
                            setPropiedades(nuevas);
                          }}
                        />
                        <span>Totalizar esta columna</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={prop.visible !== false}
                          onChange={(e) => {
                            const nuevas = [...propiedades];
                            nuevas[pi].visible = e.target.checked;
                            setPropiedades(nuevas);
                          }}
                        />
                        <span>Visible en la tabla</span>
                      </label>
                    </div>
                  </div>
                ) : prop.type === "checkbox" ? (
                  <div>
                  <input
                    type="checkbox"
                    checked={filas[filaSeleccionada]?.properties?.[prop.name]?.value || false}
                    onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.checked)}
                  />
                    <label className="flex items-center gap-2 mt-1 text-xs">
                      <input
                        type="checkbox"
                        checked={prop.visible !== false}
                        onChange={(e) => {
                          const nuevas = [...propiedades];
                          nuevas[pi].visible = e.target.checked;
                          setPropiedades(nuevas);
                        }}
                      />
                      <span>Visible en la tabla</span>
                    </label>
                  </div>
                ) : prop.type === "select" ? (
                  <>
                    <input
                      type="text"
                      className="border w-full px-2 py-1 rounded mb-1"
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                      onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                    />
                    <input
                      type="color"
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.color || "#3b82f6"}
                      onChange={(e) => {
                        const nuevas = [...filas];
                        nuevas[filaSeleccionada].properties[prop.name].color = e.target.value;
                        setFilas(nuevas);
                      }}
                    />
                    <label className="flex items-center gap-2 mt-1 text-xs">
                      <input
                        type="checkbox"
                        checked={prop.visible !== false}
                        onChange={(e) => {
                          const nuevas = [...propiedades];
                          nuevas[pi].visible = e.target.checked;
                          setPropiedades(nuevas);
                        }}
                      />
                      <span>Visible en la tabla</span>
                    </label>
                  </>
                ) : prop.type === "tags" ? (
                  <div>
                    <TagInputNotionLike
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || []}
                      onChange={(val) => actualizarValor(filaSeleccionada, prop.name, val)}
                    />
                    <label className="flex items-center gap-2 mt-1 text-xs">
                      <input
                        type="checkbox"
                        checked={prop.visible !== false}
                        onChange={(e) => {
                          const nuevas = [...propiedades];
                          nuevas[pi].visible = e.target.checked;
                          setPropiedades(nuevas);
                        }}
                      />
                      <span>Visible en la tabla</span>
                    </label>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="border w-full px-2 py-1 rounded"
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                      onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                    />
                    <label className="flex items-center gap-2 mt-1 text-xs">
                      <input
                        type="checkbox"
                        checked={prop.visible !== false}
                        onChange={(e) => {
                          const nuevas = [...propiedades];
                          nuevas[pi].visible = e.target.checked;
                          setPropiedades(nuevas);
                        }}
                      />
                      <span>Visible en la tabla</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
 <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">➕ Agregar propiedad</h3>
                <input
                  type="text"
                  placeholder="Nombre de la propiedad"
                  className="border w-full px-2 py-1 mb-2 rounded"
                  value={nuevoCampo.name}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, name: e.target.value })}
                />
                <select
                  value={nuevoCampo.type}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, type: e.target.value })}
                  className="border w-full px-2 py-1 mb-2 rounded"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                
                {/* Botón para abrir modal de fórmulas sugeridas si el tipo es "formula" */}
                {nuevoCampo.type === "formula" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPropiedadFormulaEditando(null);
                      setEsNuevoCampo(true);
                      setShowFormulaModal(true);
                    }}
                    className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-2"
                  >
                    💡 Ver fórmulas sugeridas
                  </button>
                )}
                
                <label className="flex items-center gap-2 mt-2 text-xs">
                  <input
                    type="checkbox"
                    checked={nuevoCampo.visible !== false}
                    onChange={(e) => setNuevoCampo({ ...nuevoCampo, visible: e.target.checked })}
                  />
                  <span>Visible en la tabla principal</span>
                </label>
                <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                  <strong>💡 Tip:</strong> Usa "Fórmula" para crear campos calculados con funciones como:
                  <code className="block mt-1 text-xs">prop("Campo"), if(), and(), empty(), format(), round(), etc.</code>
                </div>
                <button
                  onClick={agregarPropiedad}
                  className="bg-green-600 text-white px-3 py-1 rounded w-full"
                >
                  Agregar propiedad
                </button>
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
      />

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

    </NodeViewWrapper>
  );
}

