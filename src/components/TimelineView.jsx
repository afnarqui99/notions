import { useMemo } from 'react';

export default function TimelineView({ filas, propiedades, onSelectFila }) {
  // Encontrar propiedades de fecha
  const dateProperties = useMemo(() => {
    return propiedades.filter(p => 
      (p.type === 'date' || p.type === 'datetime') && p.visible
    );
  }, [propiedades]);

  // Obtener nombre de la fila
  const getFilaName = (fila) => {
    const nameProp = propiedades.find(p => 
      p.type === 'text' && p.visible && p.name.toLowerCase().includes('name')
    ) || propiedades.find(p => p.type === 'text' && p.visible);
    
    return nameProp ? (fila.properties?.[nameProp.name] || 'Sin nombre') : 'Sin nombre';
  };

  // Agrupar filas por fecha
  const filasPorFecha = useMemo(() => {
    const grouped = {};
    
    filas.forEach((fila, index) => {
      let fecha = null;
      
      // Buscar la primera propiedad de fecha con valor
      for (const dateProp of dateProperties) {
        const value = fila.properties?.[dateProp.name];
        if (value) {
          fecha = new Date(value);
          if (!isNaN(fecha.getTime())) {
            break;
          }
        }
      }
      
      const fechaKey = fecha && !isNaN(fecha.getTime())
        ? fecha.toISOString().split('T')[0]
        : 'Sin fecha';
      
      if (!grouped[fechaKey]) {
        grouped[fechaKey] = [];
      }
      
      grouped[fechaKey].push({ ...fila, originalIndex: index, fecha });
    });

    // Ordenar fechas
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === 'Sin fecha') return 1;
      if (b === 'Sin fecha') return -1;
      return a.localeCompare(b);
    });

    return { grouped, sortedDates };
  }, [filas, dateProperties]);

  const formatDate = (dateStr) => {
    if (dateStr === 'Sin fecha') return 'Sin fecha';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {filasPorFecha.sortedDates.map((fechaKey) => (
        <div key={fechaKey} className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {formatDate(fechaKey)}
          </div>
          
          <div className="space-y-2">
            {filasPorFecha.grouped[fechaKey].map((fila) => (
              <div
                key={fila.originalIndex}
                onClick={() => onSelectFila && onSelectFila(fila.originalIndex)}
                className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {getFilaName(fila)}
                    </div>
                    {/* Mostrar otras propiedades */}
                    {propiedades
                      .filter(p => p.visible && !dateProperties.includes(p))
                      .slice(0, 3)
                      .map(prop => {
                        const value = fila.properties?.[prop.name];
                        if (!value) return null;
                        return (
                          <div key={prop.name} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {prop.name}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        );
                      })}
                  </div>
                  {fila.fecha && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                      {fila.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

