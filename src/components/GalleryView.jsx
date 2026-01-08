import { useState } from 'react';
import ImagenDesdeFilename from './ImagenDesdeFilename';

export default function GalleryView({ filas, propiedades, onSelectFila }) {
  const [selectedFila, setSelectedFila] = useState(null);

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

  // Obtener imagen de la fila (priorizar la imagen de la columna nombre)
  const getFilaImage = (fila) => {
    // PRIMERO: Priorizar la imagen asociada directamente a la fila (columna nombre)
    // Esta es la imagen que se puede agregar haciendo clic en la columna de nombre
    if (fila.image || fila.imageFilename) {
      return {
        image: fila.image,
        imageFilename: fila.imageFilename
      };
    }
    
    // SEGUNDO: Buscar en propiedades de tipo imagen
    const imageProp = propiedades.find(p => 
      (p.type === 'image' || p.name.toLowerCase().includes('image')) && p.visible
    );
    
    if (imageProp) {
      const propData = fila.properties?.[imageProp.name];
      if (propData) {
        // Extraer el valor si es un objeto
        let imageValue = propData;
        if (propData && typeof propData === 'object' && 'value' in propData) {
          imageValue = propData.value;
        }
        
        // Si el valor es un objeto con image/imageFilename, usarlo directamente
        if (imageValue && typeof imageValue === 'object' && (imageValue.image || imageValue.imageFilename)) {
          return imageValue;
        }
        
        // Si es un string, puede ser un filename o URL
        if (typeof imageValue === 'string') {
          return {
            image: imageValue.startsWith('./files/') ? imageValue : null,
            imageFilename: imageValue.startsWith('./files/') ? imageValue.replace('./files/', '') : imageValue
          };
        }
      }
    }
    
    return null;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filas.map((fila, index) => {
        const image = getFilaImage(fila);
        const name = getFilaName(fila);
        
        return (
          <div
            key={index}
            onClick={() => {
              setSelectedFila(selectedFila === index ? null : index);
              onSelectFila && onSelectFila(index);
            }}
            className={`
              bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border
              ${selectedFila === index 
                ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' 
                : 'border-gray-200 dark:border-gray-600'
              }
            `}
          >
            {/* Imagen */}
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
              {image ? (
                <ImagenDesdeFilename
                  fila={image}
                  className="w-full h-full object-cover"
                  alt={name}
                />
              ) : (
                <div className="text-gray-400 dark:text-gray-500 text-4xl">
                  📷
                </div>
              )}
            </div>
            
            {/* Información */}
            <div className="p-3">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                {name}
              </div>
              {/* Mostrar algunas propiedades adicionales */}
              {propiedades
                .filter(p => p.visible && p.type !== 'image' && p.name !== 'Name')
                .slice(0, 2)
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
                    <div key={prop.name} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span className="font-medium">{prop.name}:</span> {' '}
                      <span className={prop.type === 'checkbox' ? 'text-green-600' : ''}>
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

