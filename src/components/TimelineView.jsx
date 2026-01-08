import { useMemo } from 'react';

export default function TimelineView({ filas, propiedades, onSelectFila }) {
  // Encontrar propiedades de fecha
  const dateProperties = useMemo(() => {
    return propiedades.filter(p => 
      (p.type === 'date' || p.type === 'datetime') && p.visible
    );
  }, [propiedades]);

  // Función auxiliar para extraer valor de una propiedad
  const extractPropertyValue = (propData) => {
    if (!propData) return null;
    
    // Si es un objeto con value, usar value
    if (propData && typeof propData === 'object' && 'value' in propData) {
      const value = propData.value;
      if (Array.isArray(value)) {
        return value.map(v => {
          if (typeof v === 'object' && v !== null && ('label' in v || 'value' in v)) {
            return v.label || v.value || String(v);
          }
          return String(v);
        }).join(', ');
      }
      // Si el value es un objeto, extraer label o value o convertir a string
      if (typeof value === 'object' && value !== null && value !== undefined) {
        return value.label || value.value || String(value);
      }
      // Si es un valor primitivo, devolverlo
      return value;
    }
    
    // Si es directamente un array
    if (Array.isArray(propData)) {
      return propData.map(v => {
        if (typeof v === 'object' && v !== null && ('label' in v || 'value' in v)) {
          return v.label || v.value || String(v);
        }
        return String(v);
      }).join(', ');
    }
    
    // Si es un objeto sin value, intentar extraer label o value
    if (typeof propData === 'object' && propData !== null) {
      return propData.label || propData.value || String(propData);
    }
    
    // Si es un valor primitivo, devolverlo
    return propData;
  };

  // Obtener nombre de la fila
  const getFilaName = (fila) => {
    // Primero intentar Name en nivel superior
    if (fila.Name) return String(fila.Name);
    
    const nameProp = propiedades.find(p => 
      p.type === 'text' && p.visible && p.name.toLowerCase().includes('name')
    ) || propiedades.find(p => p.type === 'text' && p.visible);
    
    if (nameProp) {
      const propValue = fila.properties?.[nameProp.name];
      if (propValue) {
        const value = extractPropertyValue(propValue);
        return value ? String(value) : 'Sin nombre';
      }
    }
    return 'Sin nombre';
  };

  // Agrupar filas por fecha
  const filasPorFecha = useMemo(() => {
    const grouped = {};
    
    filas.forEach((fila, index) => {
      let fecha = null;
      
      // Buscar la primera propiedad de fecha con valor
      for (const dateProp of dateProperties) {
        const propData = fila.properties?.[dateProp.name];
        if (propData) {
          // Extraer el valor real si es un objeto con value
          let dateValue = propData;
          if (propData && typeof propData === 'object' && 'value' in propData) {
            dateValue = propData.value;
          }
          
          // Si dateValue es un objeto, intentar extraer label o value
          if (typeof dateValue === 'object' && dateValue !== null && dateValue !== undefined) {
            dateValue = dateValue.value || dateValue.label || dateValue;
          }
          
          if (dateValue) {
            fecha = new Date(dateValue);
            if (!isNaN(fecha.getTime())) {
              break;
            }
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
                      .filter(p => p.visible && !dateProperties.includes(p) && p.name !== 'Name')
                      .slice(0, 3)
                      .map(prop => {
                        const propData = fila.properties?.[prop.name];
                        if (!propData) return null;
                        
                        // Extraer el valor usando la función auxiliar
                        const value = extractPropertyValue(propData);
                        if (!value && value !== 0 && value !== false) return null;
                        
                        // Formatear según el tipo - asegurar que siempre sea un string
                        let displayValue = '';
                        
                        if (prop.type === 'date' && value) {
                          try {
                            const date = new Date(value);
                            if (!isNaN(date.getTime())) {
                              displayValue = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                            } else {
                              displayValue = String(value);
                            }
                          } catch {
                            displayValue = String(value);
                          }
                        } else if (prop.type === 'checkbox') {
                          displayValue = value ? '✓' : '';
                        } else {
                          // Asegurar que siempre sea un string
                          displayValue = String(value || '');
                        }
                        
                        if (!displayValue && prop.type !== 'checkbox') return null;
                        
                        return (
                          <div key={prop.name} className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <span className="font-medium">{prop.name}:</span>
                            <span className={prop.type === 'checkbox' ? 'text-green-600' : ''}>
                              {displayValue}
                            </span>
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

