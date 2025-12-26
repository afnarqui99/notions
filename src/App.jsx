import { useState, useEffect, useCallback } from 'react';
import ConfigDashboard from './components/ConfigDashboard';
import LocalEditor from './components/LocalEditor';
import LocalStorageService from './services/LocalStorageService';

function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  // Definir las funciones de callback primero
  const handleConfigSaved = useCallback(() => {
    console.log('✅ App.jsx: handleConfigSaved llamado');
    setConfigReady(true);
    setShowConfig(false);
  }, []);

  const handleShowConfig = useCallback(() => {
    console.log('⚙️ App.jsx: handleShowConfig llamado');
    setShowConfig(true);
  }, []);

  useEffect(() => {
    console.log('🔄 App.jsx: useEffect ejecutado');
    
    // Verificar si hay configuración guardada y restaurar acceso si es necesario
    const initializeApp = async () => {
      try {
        console.log('🔄 App.jsx: Inicializando aplicación...');
        const config = LocalStorageService.config;
        console.log('📋 App.jsx: Configuración cargada:', config);
        
        if (config.useLocalStorage && config.basePath) {
          console.log('📁 App.jsx: Hay configuración de almacenamiento local, verificando acceso...');
          // Intentar restaurar el acceso al directorio
          const hasAccess = await LocalStorageService.verifyDirectoryAccess();
          
          if (hasAccess) {
            console.log('✅ App.jsx: Acceso al directorio restaurado correctamente');
            setConfigReady(true);
          } else {
            console.log('⚠️ App.jsx: No se pudo restaurar el acceso automáticamente, pero hay configuración guardada');
            // Aún así mostrar el editor, pero mostrará el warning
            setConfigReady(true);
          }
        } else {
          console.log('📋 App.jsx: No hay configuración, mostrando dashboard de configuración');
          // Si no hay configuración, mostrar dashboard
          setShowConfig(true);
          setConfigReady(true); // Marcar como listo para mostrar el dashboard
        }
      } catch (error) {
        console.error('❌ App.jsx: Error al inicializar aplicación:', error);
        // En caso de error, mostrar dashboard de configuración
        setShowConfig(true);
        setConfigReady(true);
      }
    };

    initializeApp();
  }, []);
  
  console.log('🔄 App.jsx: Renderizando con estado:', { showConfig, configReady });

  // Verificar el DOM después de renderizar
  useEffect(() => {
    const checkDOM = () => {
      const root = document.getElementById('root');
      if (root) {
        console.log('📊 App.jsx: Root element contenido:', root.innerHTML.length, 'caracteres');
        const dashboard = root.querySelector('[data-testid="config-dashboard"]');
        console.log('📊 App.jsx: ConfigDashboard en DOM:', dashboard ? '✅' : '❌');
        if (dashboard) {
          const styles = window.getComputedStyle(dashboard);
          console.log('📊 App.jsx: ConfigDashboard estilos:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            width: styles.width,
            height: styles.height
          });
        }
      }
    };
    setTimeout(checkDOM, 200);
  }, [showConfig, configReady]);

  // Renderizar directamente sin Router para simplificar
  if (showConfig) {
    console.log('📋 App.jsx: Renderizando ConfigDashboard directamente');
    return <ConfigDashboard onConfigSaved={handleConfigSaved} />;
  } else if (configReady) {
    console.log('📝 App.jsx: Renderizando LocalEditor directamente');
    return <LocalEditor onShowConfig={handleShowConfig} />;
  } else {
    console.log('📋 App.jsx: Renderizando ConfigDashboard (fallback)');
    return <ConfigDashboard onConfigSaved={handleConfigSaved} />;
  }
}

export default App;
