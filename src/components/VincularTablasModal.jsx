import { useState, useEffect } from 'react';
import { X, Link2, Search } from 'lucide-react';
import TableRegistryService from '../services/TableRegistryService';

export default function VincularTablasModal({ isOpen, onClose, tableIdActual, onVincular }) {
  const [tablasDisponibles, setTablasDisponibles] = useState([]);
  const [tablasFiltradas, setTablasFiltradas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [tablaSeleccionada, setTablaSeleccionada] = useState(null);
  const [tipoRelacion, setTipoRelacion] = useState('referencia');
  const [columnasOrigen, setColumnasOrigen] = useState('');
  const [columnasDestino, setColumnasDestino] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarTablasDisponibles();
      setBusqueda('');
      setTablaSeleccionada(null);
      setTipoRelacion('referencia');
      setColumnasOrigen('');
      setColumnasDestino('');
    }
  }, [isOpen, tableIdActual]);

  const cargarTablasDisponibles = () => {
    const todasLasTablas = TableRegistryService.getAllTables();
    // Filtrar la tabla actual y las ya vinculadas
    const tablaActual = TableRegistryService.getTable(tableIdActual);
    const tablasYaVinculadas = tablaActual?.tablasVinculadas?.map(v => v.tableId) || [];
    
    const disponibles = Object.values(todasLasTablas).filter(t => 
      t.tableId !== tableIdActual && !tablasYaVinculadas.includes(t.tableId)
    );
    
    setTablasDisponibles(disponibles);
    setTablasFiltradas(disponibles);
  };

  useEffect(() => {
    if (!busqueda) {
      setTablasFiltradas(tablasDisponibles);
      return;
    }
    
    const busquedaLower = busqueda.toLowerCase();
    const filtradas = tablasDisponibles.filter(t => 
      t.nombre.toLowerCase().includes(busquedaLower) ||
      t.tipo?.toLowerCase().includes(busquedaLower) ||
      t.comportamiento?.toLowerCase().includes(busquedaLower)
    );
    setTablasFiltradas(filtradas);
  }, [busqueda, tablasDisponibles]);

  const handleVincular = () => {
    if (!tablaSeleccionada) return;
    
    const linkInfo = {
      relacion: tipoRelacion,
      columnas: {
        origen: columnasOrigen || null,
        destino: columnasDestino || null
      }
    };
    
    if (onVincular) {
      onVincular(tablaSeleccionada.tableId, linkInfo);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 10000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Vincular Tablas</h2>
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
          {/* Búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tabla por nombre, tipo o comportamiento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lista de tablas disponibles */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tablas Disponibles</h3>
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {tablasFiltradas.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {busqueda ? 'No se encontraron tablas' : 'No hay tablas disponibles para vincular'}
                </div>
              ) : (
                tablasFiltradas.map((tabla) => (
                  <button
                    key={tabla.tableId}
                    onClick={() => setTablaSeleccionada(tabla)}
                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      tablaSeleccionada?.tableId === tabla.tableId ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{tabla.nombre}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {tabla.comportamiento && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-2">
                              {tabla.comportamiento}
                            </span>
                          )}
                          {tabla.columnas.length > 0 && (
                            <span className="text-gray-400">
                              {tabla.columnas.length} columna{tabla.columnas.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {tablaSeleccionada?.tableId === tabla.tableId && (
                        <div className="text-blue-600">✓</div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Configuración de vínculo */}
          {tablaSeleccionada && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Configuración del Vínculo</h3>
              
              {/* Tipo de relación */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Relación
                </label>
                <select
                  value={tipoRelacion}
                  onChange={(e) => setTipoRelacion(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="referencia">Referencia (solo lectura)</option>
                  <option value="balance">Balance (ingresos - egresos)</option>
                  <option value="transferencia">Transferencia (automática)</option>
                  <option value="sincronizacion">Sincronización (bidireccional)</option>
                </select>
              </div>

              {/* Columnas (opcional) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columna Origen (opcional)
                  </label>
                  <input
                    type="text"
                    value={columnasOrigen}
                    onChange={(e) => setColumnasOrigen(e.target.value)}
                    placeholder="Ej: Monto"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Columna Destino (opcional)
                  </label>
                  <input
                    type="text"
                    value={columnasDestino}
                    onChange={(e) => setColumnasDestino(e.target.value)}
                    placeholder="Ej: Monto"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleVincular}
            disabled={!tablaSeleccionada}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vincular
          </button>
        </div>
      </div>
    </div>
  );
}

