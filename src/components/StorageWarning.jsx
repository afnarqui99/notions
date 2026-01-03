import { useState, useEffect } from 'react';
import { AlertCircle, X, Settings } from 'lucide-react';
import LocalStorageService from '../services/LocalStorageService';

export default function StorageWarning({ onOpenConfig }) {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const checkStorageStatus = async () => {
      const config = LocalStorageService.config;
      const hasHandle = !!LocalStorageService.baseDirectoryHandle;
      
      // Mostrar advertencia solo si:
      // 1. La configuración indica almacenamiento local
      // 2. No hay handle
      // 3. Y no hay archivos en localStorage (para no ser intrusivo si los archivos están disponibles)
      if (config.useLocalStorage && !hasHandle) {
        // Verificar si hay archivos en localStorage como fallback
        try {
          const files = await LocalStorageService.listFiles('data');
          const hasFiles = files && files.length > 0;
          
          // Solo mostrar advertencia si no hay archivos disponibles
          // Si hay archivos, el usuario puede trabajar normalmente aunque no esté usando el almacenamiento local
          if (!hasFiles) {
            setShowWarning(true);
          } else {
            setShowWarning(false);
          }
        } catch (error) {
          // Si hay error, mostrar advertencia por seguridad
          setShowWarning(true);
        }
      } else {
        // Si hay handle o no hay configuración de almacenamiento local, ocultar advertencia
        setShowWarning(false);
      }
    };

    // Esperar más tiempo para dar tiempo a que termine la restauración asíncrona
    // que se inició en App.jsx y LocalStorageService constructor
    // IndexedDB puede tomar tiempo, especialmente en la primera carga
    const initialTimeout = setTimeout(() => {
      checkStorageStatus();
    }, 1500); // Aumentado a 1.5 segundos para dar más tiempo
    
    // Escuchar cuando se restaura el handle del directorio
    const handleDirectoryChanged = () => {
      // Esperar un momento para que el handle se establezca completamente
      setTimeout(() => {
        const hasHandle = !!LocalStorageService.baseDirectoryHandle;
        if (hasHandle) {
          setShowWarning(false);
        }
      }, 200); // Aumentado a 200ms para dar más tiempo
    };

    window.addEventListener('directoryHandleChanged', handleDirectoryChanged);
    
    // Verificar periódicamente (cada 2 segundos) por si se restaura el acceso
    const interval = setInterval(async () => {
      const hasHandle = !!LocalStorageService.baseDirectoryHandle;
      const config = LocalStorageService.config;
      
      if (hasHandle) {
        // Si hay handle, asegurarse de que la advertencia esté oculta
        setShowWarning(prev => {
          if (prev) {
            return false;
          }
          return prev;
        });
      } else if (!hasHandle && config.useLocalStorage) {
        // Verificar si hay archivos en localStorage antes de mostrar advertencia
        try {
          const files = await LocalStorageService.listFiles('data');
          const hasFiles = files && files.length > 0;
          
          setShowWarning(prev => {
            // Solo mostrar si no hay archivos disponibles
            if (!hasFiles && !prev) {
              return true;
            } else if (hasFiles && prev) {
              return false;
            }
            return prev;
          });
        } catch (error) {
          // Error verificando archivos
        }
      } else {
        // Si no hay configuración de almacenamiento local, ocultar advertencia
        setShowWarning(false);
      }
    }, 2000); // Verificar cada 2 segundos
    
    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('directoryHandleChanged', handleDirectoryChanged);
      clearInterval(interval);
    };
  }, []);

  if (!showWarning) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 shadow-sm">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Almacenamiento local no activo
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Los archivos se están guardando en el almacenamiento del navegador en lugar de la carpeta seleccionada.
              Esto ocurre después de recargar la página porque el navegador requiere confirmar el acceso a la carpeta por seguridad.
            </p>
            <p className="mt-2">
              <strong>Nota importante:</strong> Tus archivos locales siguen existiendo en la carpeta que seleccionaste anteriormente.
              Solo necesitas volver a seleccionar la misma carpeta para recuperar el acceso a ellos.
            </p>
            <p className="mt-2 font-semibold">
              Para acceder a tus archivos locales nuevamente, ve a <strong>Configuración</strong> y vuelve a seleccionar la carpeta.
            </p>
          </div>
          <div className="mt-3">
            <button
              onClick={() => {
                if (onOpenConfig) {
                  onOpenConfig();
                }
                setShowWarning(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Abrir Configuración
            </button>
            <button
              onClick={() => setShowWarning(false)}
              className="ml-3 text-sm text-yellow-800 hover:text-yellow-900"
            >
              Cerrar
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="ml-4 flex-shrink-0 text-yellow-600 hover:text-yellow-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}





