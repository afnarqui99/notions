import { useState, useEffect, useRef } from 'react';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { X, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import TableRegistryService from '../services/TableRegistryService';
import LocalStorageService from '../services/LocalStorageService';

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

export default function GraficasCombinadas({ 
  isOpen, 
  onClose, 
  tablasVinculadas, 
  tableIdActual,
  cacheDatosTablas 
}) {
  const [tipoGrafica, setTipoGrafica] = useState('line'); // 'line', 'bar', 'doughnut'
  const [datosGrafica, setDatosGrafica] = useState(null);
  const [configuracion, setConfiguracion] = useState({
    tablas: [],
    columnas: []
  });

  // Cargar datos de tablas vinculadas
  useEffect(() => {
    if (!isOpen || !tablasVinculadas || tablasVinculadas.length === 0) {
      return;
    }

    const cargarDatos = async () => {
      const datosTablas = {};
      
      for (const vinculacion of tablasVinculadas) {
        const tableId = vinculacion.tableId;
        
        // Si ya está en cache, usarlo
        if (cacheDatosTablas && cacheDatosTablas[tableId]) {
          datosTablas[tableId] = cacheDatosTablas[tableId];
          continue;
        }
        
        // Cargar desde el registro
        try {
          const tablaInfo = TableRegistryService.getTable(tableId);
          if (!tablaInfo || !tablaInfo.paginaId) continue;
          
          const paginaData = await LocalStorageService.readJSONFile(`${tablaInfo.paginaId}.json`, 'data');
          if (!paginaData || !paginaData.contenido) continue;
          
          const encontrarTablaEnContenido = (content) => {
            if (!content || !content.content) return null;
            for (const node of content.content) {
              if (node.type === 'tablaNotion' && node.attrs?.tableId === tableId) {
                return node.attrs;
              }
              if (node.content) {
                const encontrado = encontrarTablaEnContenido(node);
                if (encontrado) return encontrado;
              }
            }
            return null;
          };
          
          const tablaData = encontrarTablaEnContenido(paginaData.contenido);
          if (tablaData) {
            datosTablas[tableId] = {
              filas: tablaData.filas || [],
              propiedades: tablaData.propiedades || [],
              nombre: tablaInfo.nombre
            };
          }
        } catch (error) {
          console.error(`Error cargando tabla ${tableId}:`, error);
        }
      }
      
      // Inicializar configuración con todas las tablas y sus columnas numéricas
      const nuevasTablas = [];
      Object.keys(datosTablas).forEach(tableId => {
        const tabla = datosTablas[tableId];
        const tablaInfo = TableRegistryService.getTable(tableId);
        const columnasNumericas = tabla.propiedades
          .filter(p => p.type === 'number' || p.type === 'formula')
          .map(p => p.name);
        
        if (columnasNumericas.length > 0) {
          nuevasTablas.push({
            tableId,
            nombre: tablaInfo?.nombre || tableId.substring(0, 8),
            columnas: columnasNumericas,
            columnaSeleccionada: columnasNumericas[0] || null
          });
        }
      });
      
      setConfiguracion({ tablas: nuevasTablas });
    };

    cargarDatos();
  }, [isOpen, tablasVinculadas, cacheDatosTablas]);

  // Generar datos de la gráfica
  useEffect(() => {
    if (!configuracion.tablas || configuracion.tablas.length === 0) {
      setDatosGrafica(null);
      return;
    }

    const generarDatos = () => {
      const labels = [];
      const datasets = [];
      const colores = [
        'rgba(59, 130, 246, 0.8)',   // Azul
        'rgba(239, 68, 68, 0.8)',     // Rojo
        'rgba(34, 197, 94, 0.8)',     // Verde
        'rgba(251, 191, 36, 0.8)',    // Amarillo
        'rgba(168, 85, 247, 0.8)',    // Púrpura
        'rgba(236, 72, 153, 0.8)',    // Rosa
        'rgba(20, 184, 166, 0.8)',    // Cian
        'rgba(249, 115, 22, 0.8)'     // Naranja
      ];

      configuracion.tablas.forEach((tablaConfig, idx) => {
        const tableId = tablaConfig.tableId;
        const columna = tablaConfig.columnaSeleccionada;
        
        if (!columna) return;
        
        // Obtener datos de la tabla
        let datosTabla = null;
        if (cacheDatosTablas && cacheDatosTablas[tableId]) {
          datosTabla = cacheDatosTablas[tableId];
        }
        
        if (!datosTabla || !datosTabla.filas) return;
        
        // Para gráficas de línea y barra: usar nombres de filas como labels
        if (tipoGrafica === 'line' || tipoGrafica === 'bar') {
          if (labels.length === 0) {
            labels.push(...datosTabla.filas.map((fila, i) => fila.Name || `Fila ${i + 1}`));
          }
          
          const valores = datosTabla.filas.map(fila => {
            const valor = fila.properties?.[columna]?.value;
            if (typeof valor === 'number') return valor;
            const num = parseFloat(valor);
            return isNaN(num) ? 0 : num;
          });
          
          datasets.push({
            label: `${tablaConfig.nombre} - ${columna}`,
            data: valores,
            borderColor: colores[idx % colores.length],
            backgroundColor: tipoGrafica === 'bar' 
              ? colores[idx % colores.length]
              : colores[idx % colores.length].replace('0.8', '0.1'),
            borderWidth: 2,
            fill: tipoGrafica === 'line'
          });
        } 
        // Para gráfica de dona: sumar todos los valores
        else if (tipoGrafica === 'doughnut') {
          const total = datosTabla.filas.reduce((suma, fila) => {
            const valor = fila.properties?.[columna]?.value;
            if (typeof valor === 'number') return suma + valor;
            const num = parseFloat(valor);
            return suma + (isNaN(num) ? 0 : num);
          }, 0);
          
          if (labels.length === 0) {
            labels.push(...configuracion.tablas.map(t => t.nombre));
          }
          
          if (!datasets[0]) {
            datasets.push({
              label: 'Total',
              data: [],
              backgroundColor: colores.slice(0, configuracion.tablas.length)
            });
          }
          
          datasets[0].data.push(total);
        }
      });

      if (datasets.length === 0) {
        setDatosGrafica(null);
        return;
      }

      setDatosGrafica({
        labels,
        datasets
      });
    };

    generarDatos();
  }, [configuracion, tipoGrafica, cacheDatosTablas]);

  const opciones = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Gráfica Combinada de Tablas Vinculadas'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: tipoGrafica !== 'doughnut' ? {
      y: {
        beginAtZero: true
      }
    } : undefined
  };

  const actualizarColumnaTabla = (tableId, columna) => {
    setConfiguracion(prev => ({
      ...prev,
      tablas: prev.tablas.map(t => 
        t.tableId === tableId 
          ? { ...t, columnaSeleccionada: columna }
          : t
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Gráficas Combinadas</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Selector de tipo de gráfica */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Gráfica
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTipoGrafica('line')}
                className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                  tipoGrafica === 'line' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Línea
              </button>
              <button
                onClick={() => setTipoGrafica('bar')}
                className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                  tipoGrafica === 'bar' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Barras
              </button>
              <button
                onClick={() => setTipoGrafica('doughnut')}
                className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                  tipoGrafica === 'doughnut' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PieChart className="w-4 h-4" />
                Dona
              </button>
            </div>
          </div>

          {/* Configuración de tablas y columnas */}
          {configuracion.tablas && configuracion.tablas.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuración de Datos
              </label>
              <div className="space-y-3">
                {configuracion.tablas.map((tablaConfig) => (
                  <div key={tablaConfig.tableId} className="border rounded p-3 bg-gray-50">
                    <div className="font-medium text-gray-900 mb-2">{tablaConfig.nombre}</div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Columna:</label>
                      <select
                        value={tablaConfig.columnaSeleccionada || ''}
                        onChange={(e) => actualizarColumnaTabla(tablaConfig.tableId, e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {tablaConfig.columnas.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfica */}
          {datosGrafica ? (
            <div className="border rounded p-4 bg-white" style={{ height: '400px' }}>
              {tipoGrafica === 'line' && <Line data={datosGrafica} options={opciones} />}
              {tipoGrafica === 'bar' && <Bar data={datosGrafica} options={opciones} />}
              {tipoGrafica === 'doughnut' && <Doughnut data={datosGrafica} options={opciones} />}
            </div>
          ) : (
            <div className="border rounded p-8 bg-gray-50 text-center text-gray-500">
              {configuracion.tablas && configuracion.tablas.length === 0 
                ? 'No hay tablas vinculadas con columnas numéricas disponibles'
                : 'Selecciona tablas y columnas para generar la gráfica'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

