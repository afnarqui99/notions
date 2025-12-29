import { useState, useEffect } from 'react';

/**
 * Componente que muestra fórmulas sugeridas para gestión ágil
 */
export default function FormulaSuggestions({ onSelectFormula, propiedades }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('progreso');
  const [mostrarCrearFormula, setMostrarCrearFormula] = useState(false);
  const [nuevaFormula, setNuevaFormula] = useState({ nombre: '', formula: '', descripcion: '', categoria: 'personalizadas' });
  const [formulasPersonalizadas, setFormulasPersonalizadas] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-formulas-personalizadas');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const formulas = {
    progreso: [
      {
        nombre: 'Porcentaje de Completitud',
        formula: 'if(((prop("Progress") / prop("Objective")) >= 1), "✅", (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))',
        descripcion: 'Muestra ✅ si está completo, o el porcentaje de progreso',
        campos: ['Progress', 'Objective']
      },
      {
        nombre: 'Porcentaje Simple',
        formula: 'format(round((prop("Progress") / prop("Objective")) * 100)) + "%"',
        descripcion: 'Calcula el porcentaje de Progress sobre Objective',
        campos: ['Progress', 'Objective']
      },
      {
        nombre: 'Estado de Completitud',
        formula: 'if((prop("Progress") / prop("Objective")) >= 1, "✅ Completado", if((prop("Progress") / prop("Objective")) >= 0.5, "🟡 En Progreso", "🔴 Pendiente"))',
        descripcion: 'Muestra estado visual según el porcentaje completado',
        campos: ['Progress', 'Objective']
      }
    ],
    tiempo: [
      {
        nombre: 'Tiempo Restante',
        formula: 'if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))',
        descripcion: 'Calcula las horas restantes (Time Estimated - Time Spent)',
        campos: ['Time Spent', 'Time Estimated']
      },
      {
        nombre: 'Porcentaje de Tiempo Usado',
        formula: 'if(empty(prop("Time Estimated")), "N/A", format(round((prop("Time Spent") / prop("Time Estimated")) * 100)) + "%")',
        descripcion: 'Muestra qué porcentaje del tiempo estimado se ha usado',
        campos: ['Time Spent', 'Time Estimated']
      },
      {
        nombre: 'Estado de Tiempo',
        formula: 'if(empty(prop("Time Estimated")), "⏱️ Sin estimar", if(prop("Time Spent") > prop("Time Estimated"), "⚠️ Excedido", if(prop("Time Spent") >= prop("Time Estimated") * 0.8, "🟡 Cerca del límite", "✅ En tiempo")))',
        descripcion: 'Indica si el tiempo está dentro del estimado',
        campos: ['Time Spent', 'Time Estimated']
      },
      {
        nombre: 'Horas por Día',
        formula: 'if(empty(prop("Days Worked")), "N/A", format(round(prop("Time Spent") / prop("Days Worked"), 1)))',
        descripcion: 'Calcula el promedio de horas trabajadas por día',
        campos: ['Time Spent', 'Days Worked']
      }
    ],
    sprint: [
      {
        nombre: 'Velocidad del Sprint',
        formula: 'if(empty(prop("Sprint Days")), "N/A", format(round(prop("Tasks Completed") / prop("Sprint Days"), 2)))',
        descripcion: 'Tareas completadas por día en el sprint',
        campos: ['Tasks Completed', 'Sprint Days']
      },
      {
        nombre: 'Progreso del Sprint',
        formula: 'format(round((prop("Days Elapsed") / prop("Sprint Days")) * 100)) + "%"',
        descripcion: 'Porcentaje de días transcurridos del sprint',
        campos: ['Days Elapsed', 'Sprint Days']
      },
      {
        nombre: 'Tareas Restantes',
        formula: 'prop("Total Tasks") - prop("Tasks Completed")',
        descripcion: 'Calcula cuántas tareas faltan por completar',
        campos: ['Total Tasks', 'Tasks Completed']
      },
      {
        nombre: 'Tasa de Completitud',
        formula: 'format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%"',
        descripcion: 'Porcentaje de tareas completadas del total',
        campos: ['Tasks Completed', 'Total Tasks']
      }
    ],
    productividad: [
      {
        nombre: 'Eficiencia',
        formula: 'if(empty(prop("Time Estimated")), "N/A", format(round((prop("Objective") / prop("Time Estimated")) * 100, 1)))',
        descripcion: 'Objetivo alcanzado por hora estimada',
        campos: ['Objective', 'Time Estimated']
      },
      {
        nombre: 'Productividad Diaria',
        formula: 'if(empty(prop("Days Worked")), "N/A", format(round(prop("Progress") / prop("Days Worked"), 2)))',
        descripcion: 'Progreso promedio por día trabajado',
        campos: ['Progress', 'Days Worked']
      },
      {
        nombre: 'Rendimiento',
        formula: 'if(empty(prop("Time Spent")), "N/A", format(round(prop("Progress") / prop("Time Spent"), 2)))',
        descripcion: 'Progreso por hora trabajada',
        campos: ['Progress', 'Time Spent']
      }
    ],
    fechas: [
      {
        nombre: 'Días Transcurridos',
        formula: 'if(empty(prop("Start Date")), "N/A", round((prop("Current Date") - prop("Start Date")) / 86400000))',
        descripcion: 'Calcula días desde la fecha de inicio (usa timestamps)',
        campos: ['Start Date', 'Current Date']
      },
      {
        nombre: 'Días Restantes',
        formula: 'if(empty(prop("End Date")), "N/A", round((prop("End Date") - prop("Current Date")) / 86400000))',
        descripcion: 'Días hasta la fecha de fin (usa timestamps)',
        campos: ['End Date', 'Current Date']
      },
      {
        nombre: 'Estado de Fecha',
        formula: 'if(empty(prop("End Date")), "📅 Sin fecha", if(prop("Current Date") > prop("End Date"), "🔴 Vencido", if((prop("End Date") - prop("Current Date")) / 86400000 <= 3, "🟡 Por vencer", "✅ En tiempo")))',
        descripcion: 'Indica si la tarea está en tiempo, por vencer o vencida',
        campos: ['End Date', 'Current Date']
      }
    ]
  };

  const categorias = [
    { id: 'progreso', nombre: '📊 Progreso', icon: '📊' },
    { id: 'tiempo', nombre: '⏱️ Tiempo', icon: '⏱️' },
    { id: 'sprint', nombre: '🏃 Sprint', icon: '🏃' },
    { id: 'productividad', nombre: '⚡ Productividad', icon: '⚡' },
    { id: 'fechas', nombre: '📅 Fechas', icon: '📅' },
    { id: 'personalizadas', nombre: '⭐ Personalizadas', icon: '⭐' }
  ];

  // Guardar fórmulas personalizadas en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notion-formulas-personalizadas', JSON.stringify(formulasPersonalizadas));
    } catch (error) {
      console.error('Error guardando fórmulas personalizadas:', error);
    }
  }, [formulasPersonalizadas]);

  const guardarFormulaPersonalizada = () => {
    if (!nuevaFormula.nombre || !nuevaFormula.formula) {
      alert('Por favor completa el nombre y la fórmula');
      return;
    }
    const nueva = {
      ...nuevaFormula,
      id: Date.now(),
      campos: []
    };
    setFormulasPersonalizadas([...formulasPersonalizadas, nueva]);
    setNuevaFormula({ nombre: '', formula: '', descripcion: '', categoria: 'personalizadas' });
    setMostrarCrearFormula(false);
  };

  const eliminarFormulaPersonalizada = (id) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta fórmula personalizada?')) {
      setFormulasPersonalizadas(formulasPersonalizadas.filter(f => f.id !== id));
    }
  };

  // Combinar fórmulas predefinidas con personalizadas
  let formulasCategoria = [];
  if (categoriaSeleccionada === 'personalizadas') {
    formulasCategoria = formulasPersonalizadas;
  } else {
    formulasCategoria = formulas[categoriaSeleccionada] || [];
  }

  return (
    <div>
      {/* Selector de categorías */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaSeleccionada(cat.id)}
            className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${
              categoriaSeleccionada === cat.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Botón para crear nueva fórmula personalizada */}
      {categoriaSeleccionada === 'personalizadas' && (
        <div className="mb-4">
          {!mostrarCrearFormula ? (
            <button
              onClick={() => setMostrarCrearFormula(true)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              ➕ Crear Nueva Fórmula Personalizada
            </button>
          ) : (
            <div className="p-4 bg-white border-2 border-green-300 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-3 text-gray-900">Crear Nueva Fórmula</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la fórmula *</label>
                  <input
                    type="text"
                    value={nuevaFormula.nombre}
                    onChange={(e) => setNuevaFormula({ ...nuevaFormula, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Mi Fórmula Personalizada"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fórmula *</label>
                  <textarea
                    value={nuevaFormula.formula}
                    onChange={(e) => setNuevaFormula({ ...nuevaFormula, formula: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder='Ej: if(prop("Progress") > 50, "✅", "⏳")'
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={nuevaFormula.descripcion}
                    onChange={(e) => setNuevaFormula({ ...nuevaFormula, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe qué hace esta fórmula"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={guardarFormulaPersonalizada}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
                  >
                    💾 Guardar Fórmula
                  </button>
                  <button
                    onClick={() => {
                      setMostrarCrearFormula(false);
                      setNuevaFormula({ nombre: '', formula: '', descripcion: '', categoria: 'personalizadas' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de fórmulas */}
      <div className="space-y-3">
        {formulasCategoria.length === 0 && categoriaSeleccionada === 'personalizadas' ? (
          <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-2">No tienes fórmulas personalizadas aún</p>
            <p className="text-sm text-gray-500">Crea tu primera fórmula usando el botón de arriba</p>
          </div>
        ) : (
          formulasCategoria.map((formula, idx) => {
            const camposDisponibles = propiedades.map(p => p.name);
            const camposNecesarios = formula.campos || [];
            const tieneCampos = camposNecesarios.length === 0 || camposNecesarios.every(campo => camposDisponibles.includes(campo));
            const esPersonalizada = categoriaSeleccionada === 'personalizadas';
            
            return (
              <div
                key={esPersonalizada ? formula.id : idx}
                className={`p-4 rounded-lg border-2 shadow-sm ${
                  tieneCampos
                    ? 'bg-green-50 border-green-300 hover:shadow-md transition-shadow'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-base text-gray-900">{formula.nombre}</h4>
                      {esPersonalizada && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Personalizada</span>
                      )}
                    </div>
                    {formula.descripcion && (
                      <p className="text-sm text-gray-600 mb-3">{formula.descripcion}</p>
                    )}
                    {camposNecesarios.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Campos requeridos: </span>
                        {camposNecesarios.map((campo, i) => (
                          <span
                            key={i}
                            className={`text-sm px-2 py-1 rounded-md mx-1 font-medium ${
                              camposDisponibles.includes(campo)
                                ? 'bg-green-200 text-green-800 border border-green-300'
                                : 'bg-yellow-200 text-yellow-800 border border-yellow-300'
                            }`}
                          >
                            {campo}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {esPersonalizada && (
                      <button
                        onClick={() => eliminarFormulaPersonalizada(formula.id)}
                        className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow-sm"
                        title="Eliminar fórmula personalizada"
                      >
                        🗑️
                      </button>
                    )}
                    <button
                      onClick={() => onSelectFormula(formula.formula)}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-sm ${
                        tieneCampos
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                          : 'bg-gray-400 text-white cursor-not-allowed'
                      }`}
                      disabled={!tieneCampos}
                      title={tieneCampos ? 'Usar esta fórmula' : 'Faltan campos requeridos'}
                    >
                      Usar
                    </button>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                  <code className="text-sm font-mono text-gray-800 break-all whitespace-pre-wrap">
                    {formula.formula}
                  </code>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <span className="text-xl">💡</span>
          <div>
            <strong className="text-sm font-semibold text-gray-800 block mb-1">Tip:</strong>
            <p className="text-sm text-gray-700">
              Las fórmulas se actualizan automáticamente cuando cambian los valores de los campos referenciados.
              Asegúrate de tener los campos requeridos antes de usar una fórmula.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

