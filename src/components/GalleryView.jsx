import { useState } from 'react';
import ImagenDesdeFilename from './ImagenDesdeFilename';

export default function GalleryView({ filas, propiedades, onSelectFila }) {
  const [selectedFila, setSelectedFila] = useState(null);

  // Obtener nombre de la fila
  const getFilaName = (fila) => {
    const nameProp = propiedades.find(p => 
      p.type === 'text' && p.visible && p.name.toLowerCase().includes('name')
    ) || propiedades.find(p => p.type === 'text' && p.visible);
    
    return nameProp ? (fila.properties?.[nameProp.name] || 'Sin nombre') : 'Sin nombre';
  };

  // Obtener imagen de la fila
  const getFilaImage = (fila) => {
    // Buscar propiedad de imagen
    const imageProp = propiedades.find(p => 
      (p.type === 'image' || p.name.toLowerCase().includes('image')) && p.visible
    );
    
    if (imageProp) {
      return fila.properties?.[imageProp.name];
    }
    
    // Si no hay propiedad de imagen, usar la imagen de la fila directamente
    return fila.image || fila.imageFilename;
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
                  fila={{ image, imageFilename: typeof image === 'string' && image.startsWith('./files/') ? image.replace('./files/', '') : image }}
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
                .filter(p => p.visible && p.type !== 'image')
                .slice(0, 2)
                .map(prop => {
                  const value = fila.properties?.[prop.name];
                  if (!value) return null;
                  return (
                    <div key={prop.name} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
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

