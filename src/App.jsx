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
        
        if (config.useLocalStorage && config.basePath) {
          // Intentar restaurar el acceso al directorio
          const hasAccess = await LocalStorageService.verifyDirectoryAccess();
          
          if (hasAccess) {
            setConfigReady(true);
          } else {
            // Aún así mostrar el editor, pero mostrará el warning
            setConfigReady(true);
          }
        } else {
          // Si no hay configuración, mostrar dashboard
          setShowConfig(true);
          setConfigReady(true); // Marcar como listo para mostrar el dashboard
        }
      } catch (error) {
        // En caso de error, mostrar dashboard de configuración
        setShowConfig(true);
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
        <ConfigDashboard onConfigSaved={handleConfigSaved} />
      )}
    </>
  );
}

export default App;






