import { useState, useEffect, useCallback } from 'react';
import ConfigDashboard from './components/ConfigDashboard';
import LocalEditor from './components/LocalEditor';
import NotificationContainer from './components/NotificationContainer';
import DirectorySelectorModal from './components/DirectorySelectorModal';
import LocalStorageService from './services/LocalStorageService';
import NotificationService from './services/NotificationService';

function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [configReady, setConfigReady] = useState(false);
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);

  // Definir las funciones de callback primero
  const handleConfigSaved = useCallback(() => {
    setConfigReady(true);
    setShowConfig(false);
    setShowDirectoryModal(false);
  }, []);

  const handleShowConfig = useCallback(() => {
    setShowConfig(true);
  }, []);

  const handleDirectorySelected = useCallback((path) => {
    console.log('[App] handleDirectorySelected llamado con path:', path);
    // La configuración ya se guardó en DirectorySelectorModal
    // Solo necesitamos cerrar el modal y mostrar el editor
    setShowDirectoryModal(false);
    setConfigReady(true);
    setShowConfig(false);
    console.log('[App] Estados actualizados: showDirectoryModal=false, configReady=true, showConfig=false');
  }, []);

  useEffect(() => {
    // Verificar si hay configuración guardada y restaurar acceso si es necesario
    const initializeApp = async () => {
      try {
        const config = LocalStorageService.config;
        console.log('[App] Inicializando app, config:', config);
        
        if (config.useLocalStorage && config.basePath) {
          console.log('[App] Configuración encontrada, verificando acceso...');
          // Intentar restaurar el acceso al directorio
          const hasAccess = await LocalStorageService.verifyDirectoryAccess();
          
          if (hasAccess) {
            console.log('[App] Acceso verificado, mostrando editor');
            setConfigReady(true);
          } else {
            // Si no hay acceso pero hay configuración, mostrar el editor con warning
            console.log('[App] Sin acceso pero hay configuración, mostrando editor con warning');
            setConfigReady(true);
          }
        } else {
          // Si no hay configuración, abrir directamente el selector de carpeta
          // Solo en Electron, en navegador mostrar el dashboard
          if (typeof window !== 'undefined' && window.electronAPI) {
            console.log('[App] No hay configuración, abriendo selector de carpeta (Electron)');
            setShowDirectoryModal(true);
            // NO marcar configReady como true todavía, esperar a que se seleccione la carpeta
            setConfigReady(false);
          } else {
            // En navegador, mostrar dashboard
            console.log('[App] No hay configuración, mostrando dashboard (navegador)');
            setShowConfig(true);
            setConfigReady(true);
          }
        }
      } catch (error) {
        console.error('[App] Error en inicialización:', error);
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
        // Mientras se espera la selección de carpeta, mostrar una pantalla de carga o el dashboard
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Configurando aplicación...</p>
          </div>
        </div>
      )}
      
      {/* Modal de selección de carpeta (solo en Electron, primera vez) */}
      {typeof window !== 'undefined' && window.electronAPI && (
        <DirectorySelectorModal
          isOpen={showDirectoryModal}
          onClose={() => {
            console.log('[App] Modal cerrado');
            setShowDirectoryModal(false);
            // Si se cierra sin seleccionar, mostrar el dashboard
            if (!LocalStorageService.config.useLocalStorage) {
              console.log('[App] No hay configuración, mostrando dashboard');
              setShowConfig(true);
              setConfigReady(true);
            }
          }}
          onDirectorySelected={handleDirectorySelected}
          autoOpen={true}
        />
      )}
    </>
  );
}

export default App;








