import { useState, useMemo } from 'react';
import { Plus, MoreVertical } from 'lucide-react';

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
      const value = fila.properties?.[columnProperty.name];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(v));
        } else {
          values.add(value);
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
        const value = fila.properties?.[columnProperty.name];
        if (value) {
          if (Array.isArray(value) && value.length > 0) {
            columna = value[0];
          } else if (typeof value === 'string') {
            columna = value;
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
    const nameProp = propiedades.find(p => 
      p.type === 'text' && p.visible && p.name.toLowerCase().includes('name')
    ) || propiedades.find(p => p.type === 'text' && p.visible);
    
    return nameProp ? (fila.properties?.[nameProp.name] || 'Sin nombre') : 'Sin nombre';
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
            {filasPorColumna[column]?.map((fila) => (
              <div
                key={fila.originalIndex}
                draggable
                onDragStart={(e) => handleDragStart(e, fila)}
                onClick={() => onSelectFila && onSelectFila(fila.originalIndex)}
                className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-600"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {getFilaName(fila)}
                </div>
                {/* Mostrar otras propiedades importantes */}
                {propiedades
                  .filter(p => p.visible && p.name !== columnProperty?.name)
                  .slice(0, 2)
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
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

