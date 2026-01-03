import { useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TableRegistryService from '../services/TableRegistryService';
import LocalStorageService from '../services/LocalStorageService';
import { PageContext } from '../utils/pageContext';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ResumenFinancieroStyle({ node, updateAttributes }) {
  const [datosTablas, setDatosTablas] = useState({});
  const [cargando, setCargando] = useState(true);
  const [graficasExpandidas, setGraficasExpandidas] = useState(false); // Por defecto colapsadas
  const [abonosExpandidos, setAbonosExpandidos] = useState(false); // Estado para sección de abonos

  useEffect(() => {
    cargarDatosTablas();
    
    // Escuchar cambios en las tablas
    const handler = () => {
      // Agregar un delay para dar tiempo al guardado automático (cada 30 segundos)
      // Intentar múltiples veces para asegurar que los datos se hayan guardado
      let intentos = 0;
      const maxIntentos = 3;
      const intervalo = 500; // 500ms entre intentos
      
      const intentarCargar = () => {
        intentos++;
        cargarDatosTablas();
        
        if (intentos < maxIntentos) {
          setTimeout(intentarCargar, intervalo);
        }
      };
      
      // Primer intento inmediato
      setTimeout(intentarCargar, 100);
    };
    window.addEventListener('tablaActualizada', handler);
    return () => window.removeEventListener('tablaActualizada', handler);
  }, []);

  const cargarDatosTablas = async () => {
    setCargando(true);
    try {
      // Obtener el ID de la página usando PageContext
      const paginaId = PageContext.getCurrentPageId();
      
      if (!paginaId) {
        setCargando(false);
        return;
      }

      // Primero cargar el contenido de la página para verificar qué tablas realmente existen
      const paginaData = await LocalStorageService.readJSONFile(`${paginaId}.json`, 'data');
      if (!paginaData || !paginaData.contenido) {
        setDatosTablas({});
        setCargando(false);
        return;
      }

      // Función recursiva para encontrar todas las tablas en el contenido
      const encontrarTodasLasTablasEnContenido = (content) => {
        const tablasEncontradas = [];
        if (!content || !content.content) return tablasEncontradas;
        
        for (const node of content.content) {
          if (node.type === 'tablaNotion' && node.attrs?.tableId) {
            tablasEncontradas.push({
              tableId: node.attrs.tableId,
              nombre: node.attrs.nombreTabla,
              comportamiento: node.attrs.comportamiento,
              attrs: node.attrs
            });
          }
          if (node.content) {
            const encontradas = encontrarTodasLasTablasEnContenido(node);
            tablasEncontradas.push(...encontradas);
          }
        }
        return tablasEncontradas;
      };

      // Obtener todas las tablas que realmente existen en el contenido
      const tablasEnContenido = encontrarTodasLasTablasEnContenido(paginaData.contenido);
      const tableIdsEnContenido = new Set(tablasEnContenido.map(t => t.tableId));

      // Obtener todas las tablas financieras de esta página del registro
      const todasLasTablas = TableRegistryService.getTablesByPage(paginaId);
      const tablasFinancieras = todasLasTablas.filter(t => 
        t.comportamiento === 'financiero' && 
        ['Ingresos', 'Egresos', 'Deudas'].includes(t.nombre) &&
        tableIdsEnContenido.has(t.tableId) // Solo considerar tablas que realmente existen en el contenido
      );

      const datos = {};
      for (const tabla of tablasFinancieras) {
        try {
          // Buscar la tabla en el contenido (ya sabemos que existe porque está en tableIdsEnContenido)
          const tablaEnContenido = tablasEnContenido.find(t => t.tableId === tabla.tableId);
          if (tablaEnContenido && tablaEnContenido.attrs) {
            datos[tabla.nombre] = {
              filas: tablaEnContenido.attrs.filas || [],
              propiedades: tablaEnContenido.attrs.propiedades || []
            };
          }
        } catch (error) {
          // Error cargando tabla
        }
      }
      
      setDatosTablas(datos);
    } catch (error) {
      // Error cargando datos
    } finally {
      setCargando(false);
    }
  };

  // Calcular totales
  const calcularTotal = (nombreTabla, nombreColumna) => {
    const tabla = datosTablas[nombreTabla];
    if (!tabla || !tabla.filas || !Array.isArray(tabla.filas)) return 0;
    
    return tabla.filas.reduce((suma, fila) => {
      // Intentar diferentes formas de acceder al valor
      let valor = null;
      
      // Forma 1: fila.properties[nombreColumna].value
      if (fila.properties && fila.properties[nombreColumna]) {
        valor = fila.properties[nombreColumna].value;
      }
      
      // Forma 2: fila[nombreColumna] (por si está en el nivel superior)
      if (valor === null || valor === undefined) {
        valor = fila[nombreColumna];
      }
      
      // Si el valor es un string, intentar parsearlo
      if (typeof valor === 'string') {
        // Limpiar el string de caracteres no numéricos excepto punto, coma y signo negativo
        const valorLimpio = valor.replace(/[^\d.,-]/g, '').replace(',', '.');
        valor = parseFloat(valorLimpio);
      }
      
      if (typeof valor === 'number' && !isNaN(valor)) {
        return suma + valor;
      }
      
      return suma;
    }, 0);
  };

  const totalIngresos = calcularTotal('Ingresos', 'Ingresos');
  const totalEgresos = calcularTotal('Egresos', 'Egresos');
  const totalDeudas = calcularTotal('Deudas', 'Deudas');
  const saldoTotal = totalIngresos - totalEgresos;

  // Datos para gráfica de barras
  const datosBarra = {
    labels: ['Ingresos', 'Egresos', 'Deudas'],
    datasets: [{
      label: 'Monto Total',
      data: [totalIngresos, totalEgresos, totalDeudas],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',  // Verde para ingresos
        'rgba(239, 68, 68, 0.8)',   // Rojo para egresos
        'rgba(168, 85, 247, 0.8)'   // Púrpura para deudas
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(168, 85, 247, 1)'
      ],
      borderWidth: 2
    }]
  };

  // Datos para gráfica de dona (distribución)
  const datosDona = {
    labels: ['Ingresos', 'Egresos', 'Deudas'],
    datasets: [{
      data: [totalIngresos, totalEgresos, totalDeudas],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const opcionesBarra = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Resumen Financiero'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const opcionesDona = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'Distribución'
      }
    }
  };

  const formatearNumero = (num) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  if (cargando) {
    return (
      <NodeViewWrapper className="my-4 p-4 border rounded bg-white">
        <div className="text-center text-gray-500">Cargando datos financieros...</div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="my-4 p-6 border rounded-lg bg-white shadow-sm">
      {/* Resumen de valores */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-sm text-green-700 font-medium mb-1">💰 Ingresos</div>
          <div className="text-2xl font-bold text-green-900">{formatearNumero(totalIngresos)}</div>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-sm text-red-700 font-medium mb-1">💸 Egresos</div>
          <div className="text-2xl font-bold text-red-900">{formatearNumero(totalEgresos)}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-700 font-medium mb-1">💳 Deudas</div>
          <div className="text-2xl font-bold text-purple-900">{formatearNumero(totalDeudas)}</div>
        </div>
      </div>

      {/* Saldo Total */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
        <div className="text-lg font-semibold text-blue-900 mb-2">💵 Saldo Total</div>
        <div className={`text-3xl font-bold ${saldoTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatearNumero(saldoTotal)}
        </div>
      </div>

      {/* Sección de Gráficas Colapsable */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setGraficasExpandidas(!graficasExpandidas)}
          className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-700">📊 Gráficas</span>
          {graficasExpandidas ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {graficasExpandidas && (
          <div className="p-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div style={{ height: '300px' }}>
                  <Bar data={datosBarra} options={opcionesBarra} />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div style={{ height: '300px' }}>
                  <Doughnut data={datosDona} options={opcionesDona} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Abonos por Persona Colapsable */}
      <div className="mt-6 border rounded-lg overflow-hidden">
        <button
          onClick={() => setAbonosExpandidos(!abonosExpandidos)}
          className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <span className="text-lg font-semibold text-gray-700">💰 Abonos por Persona</span>
          {abonosExpandidos ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {abonosExpandidos && (
          <div className="p-4 bg-white">
            {(() => {
              // Obtener datos de deudas
              const tablaDeudas = datosTablas['Deudas'];
              if (!tablaDeudas || !tablaDeudas.filas || tablaDeudas.filas.length === 0) {
                return (
                  <div className="text-center text-gray-500 py-4">
                    No hay deudas registradas
                  </div>
                );
              }

              // Agrupar por persona
              const abonosPorPersona = {};
              
              tablaDeudas.filas.forEach((fila) => {
                const personas = fila.properties?.Persona?.value || [];
                const nombreDeuda = fila.Name || 'Deuda sin nombre';
                const deudaActual = parseFloat(fila.properties?.Deudas?.value || 0) || 0;
                const abonos = fila.abonos || [];
                const totalAbonado = abonos.reduce((suma, abono) => suma + (parseFloat(abono.monto) || 0), 0);

                // Si no hay personas, usar "Sin persona"
                if (!Array.isArray(personas) || personas.length === 0) {
                  if (!abonosPorPersona['Sin persona']) {
                    abonosPorPersona['Sin persona'] = [];
                  }
                  abonosPorPersona['Sin persona'].push({
                    nombreDeuda,
                    deudaActual,
                    totalAbonado,
                    abonos
                  });
                } else {
                  // Agregar a cada persona
                  personas.forEach((persona) => {
                    const nombrePersona = typeof persona === 'string' ? persona : (persona.label || persona.value || persona);
                    if (!abonosPorPersona[nombrePersona]) {
                      abonosPorPersona[nombrePersona] = [];
                    }
                    abonosPorPersona[nombrePersona].push({
                      nombreDeuda,
                      deudaActual,
                      totalAbonado,
                      abonos
                    });
                  });
                }
              });

              const personasKeys = Object.keys(abonosPorPersona).sort();

              if (personasKeys.length === 0) {
                return (
                  <div className="text-center text-gray-500 py-4">
                    No hay deudas con personas asignadas
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {personasKeys.map((persona) => {
                    const deudasPersona = abonosPorPersona[persona];
                    const totalAbonadoPersona = deudasPersona.reduce((suma, d) => suma + d.totalAbonado, 0);

                    return (
                      <div key={persona} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">{persona}</h3>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Total abonado</div>
                            <div className="text-lg font-bold text-green-700">{formatearNumero(totalAbonadoPersona)}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {deudasPersona.map((deuda, idx) => (
                            <div key={idx} className="bg-white rounded p-3 border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium text-gray-800">{deuda.nombreDeuda}</div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">Deuda actual</div>
                                  <div className="text-base font-semibold text-purple-700">{formatearNumero(deuda.deudaActual)}</div>
                                  <div className="text-sm text-gray-500 mt-1">Abonado</div>
                                  <div className="text-base font-semibold text-green-700">{formatearNumero(deuda.totalAbonado)}</div>
                                </div>
                              </div>
                              {deuda.abonos && deuda.abonos.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="text-xs text-gray-500 mb-1">Historial de abonos:</div>
                                  <div className="space-y-1">
                                    {deuda.abonos.map((abono, abonoIdx) => (
                                      <div key={abonoIdx} className="text-xs text-gray-600 flex justify-between">
                                        <span>
                                          {abono.fecha && new Date(abono.fecha).toLocaleDateString('es-ES')} - {abono.descripcion || 'Sin descripción'}
                                        </span>
                                        <span className="font-semibold text-green-600">{formatearNumero(abono.monto || 0)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

