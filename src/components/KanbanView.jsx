import { useState, useMemo } from 'react';
import { Plus, MoreVertical, Edit2 } from 'lucide-react';

export default function KanbanView({ filas, propiedades, onUpdateFila, onSelectFila }) {
  // Encontrar la propiedad de tipo "select" o "tags" para usar como columnas
  const columnProperty = useMemo(() => {
    return propiedades.find(p => 
      (p.type === 'select' || p.type === 'tags') && p.visible
    ) || null;
  }, [propiedades]);

  // Obtener valores únicos de la propiedad seleccionada
  const columns = useMemo(() => {
    if (!columnProperty) {
      // Si no hay propiedad de selección, crear columnas por defecto
      return ['Sin estado', 'En progreso', 'Completado'];
    }

    const values = new Set();
    filas.forEach(fila => {
      const propData = fila.properties?.[columnProperty.name];
      if (!propData) {
        values.add('Sin estado');
        return;
      }

      // Extraer el valor real si es un objeto con value
      let actualValue = propData;
      if (propData && typeof propData === 'object' && 'value' in propData) {
        actualValue = propData.value;
      }

      if (actualValue) {
        if (Array.isArray(actualValue)) {
          actualValue.forEach(v => {
            // Si v es un objeto, extraer el valor
            const val = typeof v === 'object' && v !== null && ('label' in v || 'value' in v) 
              ? (v.label || v.value || String(v))
              : String(v);
            values.add(val);
          });
        } else if (typeof actualValue === 'object' && actualValue !== null) {
          // Si es un objeto, intentar extraer label o value
          const val = actualValue.label || actualValue.value || String(actualValue);
          values.add(val);
        } else {
          values.add(String(actualValue));
        }
      } else {
        values.add('Sin estado');
      }
    });

    return Array.from(values);
  }, [filas, columnProperty]);

  // Agrupar filas por columna
  const filasPorColumna = useMemo(() => {
    const grouped = {};
    columns.forEach(col => {
      grouped[col] = [];
    });

    filas.forEach((fila, index) => {
      let columna = 'Sin estado';
      if (columnProperty) {
        const propData = fila.properties?.[columnProperty.name];
        if (propData) {
          // Extraer el valor real si es un objeto con value
          let actualValue = propData;
          if (propData && typeof propData === 'object' && 'value' in propData) {
            actualValue = propData.value;
          }

          if (actualValue) {
            if (Array.isArray(actualValue) && actualValue.length > 0) {
              const firstItem = actualValue[0];
              // Si el primer item es un objeto, extraer el valor
              if (typeof firstItem === 'object' && firstItem !== null && ('label' in firstItem || 'value' in firstItem)) {
                columna = firstItem.label || firstItem.value || String(firstItem);
              } else {
                columna = String(firstItem);
              }
            } else if (typeof actualValue === 'object' && actualValue !== null) {
              // Si es un objeto, intentar extraer label o value
              columna = actualValue.label || actualValue.value || String(actualValue);
            } else {
              columna = String(actualValue);
            }
          }
        }
      }

      if (!grouped[columna]) {
        grouped[columna] = [];
      }
      grouped[columna].push({ ...fila, originalIndex: index });
    });

    return grouped;
  }, [filas, columns, columnProperty]);

  const handleDragStart = (e, fila) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(fila));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const filaData = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    if (columnProperty) {
      const newValue = targetColumn === 'Sin estado' ? null : targetColumn;
      onUpdateFila(filaData.originalIndex, {
        ...filaData,
        properties: {
          ...filaData.properties,
          [columnProperty.name]: newValue,
        },
      });
    }
  };

  // Obtener nombre de la fila (primera propiedad de texto visible)
  const getFilaName = (fila) => {
    // Primero intentar Name en nivel superior
    if (fila.Name) return fila.Name;
    
    const nameProp = propiedades.find(p => 
      p.type === 'text' && p.visible && p.name.toLowerCase().includes('name')
    ) || propiedades.find(p => p.type === 'text' && p.visible);
    
    if (nameProp) {
      const propValue = fila.properties?.[nameProp.name];
      if (propValue) {
        // Si es un objeto con value, usar value; si no, usar directamente
        return propValue.value || propValue || 'Sin nombre';
      }
    }
    return 'Sin nombre';
  };

  // Obtener valor de una propiedad formateado (siempre devuelve un valor primitivo o null)
  const getPropertyValue = (fila, prop) => {
    const propData = fila.properties?.[prop.name];
    if (!propData) return null;
    
    // Si es un objeto con value, usar value
    if (propData && typeof propData === 'object' && 'value' in propData) {
      const value = propData.value;
      if (Array.isArray(value)) {
        // Para arrays, devolver string con valores extraídos
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

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div
          key={column}
          className="flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column)}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {column}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filasPorColumna[column]?.length || 0}
            </span>
          </div>

          <div className="space-y-2 min-h-[100px]">
            {filasPorColumna[column]?.map((fila) => {
              const propertyValue = (prop) => getPropertyValue(fila, prop);
              
              return (
                <div
                  key={fila.originalIndex}
                  draggable
                  onDragStart={(e) => handleDragStart(e, fila)}
                  onClick={() => onSelectFila && onSelectFila(fila.originalIndex)}
                  className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-gray-600 group relative"
                  title="Haz clic para editar esta tarea"
                >
                  {/* Indicador de que es editable */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-3 h-3 text-gray-400" />
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 pr-6">
                    {getFilaName(fila)}
                  </div>
                  
                  {/* Mostrar otras propiedades importantes */}
                  <div className="space-y-1">
                    {propiedades
                      .filter(p => p.visible && p.name !== columnProperty?.name && p.name !== 'Name')
                      .slice(0, 3)
                      .map(prop => {
                        const value = propertyValue(prop);
                        if (!value && value !== 0 && value !== false) return null;
                        
                        // Formatear según el tipo - asegurar que siempre sea un string
                        let displayValue = '';
                        
                        // getPropertyValue ya devuelve strings para arrays y valores extraídos
                        // Solo necesitamos formatear fechas y checkboxes
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
                          <div key={prop.name} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <span className="font-medium">{prop.name}:</span>
                            <span className={prop.type === 'checkbox' ? 'text-green-600' : ''}>
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* Indicador visual de que es editable */}
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Clic para editar
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

