import { useState, useEffect, useCallback } from 'react';
import ConfigDashboard from './components/ConfigDashboard';
import LocalEditor from './components/LocalEditor';
import NotificationContainer from './components/NotificationContainer';
import LocalStorageService from './services/LocalStorageService';
import NotificationService from './services/NotificationService';

function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  // Definir las funciones de callback primero
  const handleConfigSaved = useCallback(() => {
    setConfigReady(true);
    setShowConfig(false);
  }, []);

  const handleShowConfig = useCallback(() => {
    setShowConfig(true);
  }, []);

  useEffect(() => {
    // Verificar si hay configuración guardada y restaurar acceso si es necesario
    const initializeApp = async () => {
      try {
        const config = LocalStorageService.config;
        
        // Si hay configuración de carpeta local, intentar restaurar acceso
        if (config.useLocalStorage && config.basePath) {
          // Intentar restaurar el acceso al directorio
          const hasAccess = await LocalStorageService.verifyDirectoryAccess();
          
          if (hasAccess) {
            setConfigReady(true);
            return;
          } else {
            // Si no hay acceso pero hay configuración, usar localStorage como fallback
            // y mostrar el editor (el usuario puede cambiar a carpeta local desde configuración)
            console.log('[App] No se pudo restaurar acceso a carpeta local, usando localStorage');
            LocalStorageService.saveConfig({
              useLocalStorage: false,
              basePath: null
            });
            setConfigReady(true);
            return;
          }
        }
        
        // Si no hay configuración o useLocalStorage es false, usar localStorage por defecto
        // NO pedir carpeta al inicio - el usuario puede cambiarlo desde configuración
        if (!config.useLocalStorage) {
          // Asegurar que la configuración esté guardada con localStorage
          LocalStorageService.saveConfig({
            useLocalStorage: false,
            basePath: null
          });
          setConfigReady(true);
          return;
        }
        
        // Si llegamos aquí, no hay configuración previa - usar localStorage por defecto
        LocalStorageService.saveConfig({
          useLocalStorage: false,
          basePath: null
        });
        setConfigReady(true);
        
      } catch (error) {
        console.error('[App] Error en inicialización:', error);
        // En caso de error, usar localStorage por defecto y mostrar el editor
        LocalStorageService.saveConfig({
          useLocalStorage: false,
          basePath: null
        });
        setConfigReady(true);
      }
    };

    initializeApp();
  }, []);

  // Renderizar directamente sin Router para simplificar
  return (
    <>
      {showConfig ? (
        <ConfigDashboard onConfigSaved={handleConfigSaved} />
      ) : configReady ? (
        <>
          <LocalEditor onShowConfig={handleShowConfig} />
          <NotificationContainer />
        </>
      ) : (
        // Mientras se espera la selección de carpeta, mostrar una pantalla de carga o el dashboard
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Configurando aplicación...</p>
          </div>
        </div>
      )}
      
    </>
  );
}

export default App;








