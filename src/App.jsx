import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ConfigDashboard from './components/ConfigDashboard';
import LocalEditor from './components/LocalEditor';
import LocalStorageService from './services/LocalStorageService';

function App() {
  const [showConfig, setShowConfig] = useState(false);
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    // Verificar si hay configuración guardada y restaurar acceso si es necesario
    const initializeApp = async () => {
      const config = LocalStorageService.config;
      
      if (config.useLocalStorage && config.basePath) {
        // Intentar restaurar el acceso al directorio
        const hasAccess = await LocalStorageService.verifyDirectoryAccess();
        
        if (hasAccess) {
          console.log('✅ Acceso al directorio restaurado correctamente');
          setConfigReady(true);
        } else {
          console.log('⚠️ No se pudo restaurar el acceso automáticamente, pero hay configuración guardada');
          // Aún así mostrar el editor, pero mostrará el warning
          setConfigReady(true);
        }
      } else {
        // Si no hay configuración, mostrar dashboard
        setShowConfig(true);
      }
    };

    initializeApp();
  }, []);

  const handleConfigSaved = () => {
    setConfigReady(true);
    setShowConfig(false);
  };

  const handleShowConfig = () => {
    setShowConfig(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            showConfig ? (
              <ConfigDashboard onConfigSaved={handleConfigSaved} />
            ) : configReady ? (
              <LocalEditor onShowConfig={handleShowConfig} />
            ) : (
              <ConfigDashboard onConfigSaved={handleConfigSaved} />
            )
          } 
        />
        <Route 
          path="/config" 
          element={<ConfigDashboard onConfigSaved={handleConfigSaved} />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

