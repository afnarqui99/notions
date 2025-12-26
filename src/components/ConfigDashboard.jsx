import { useState, useEffect } from 'react';
import { Settings, FolderOpen, Save, AlertCircle, CheckCircle } from 'lucide-react';
import LocalStorageService from '../services/LocalStorageService';
import DirectorySelectorModal from './DirectorySelectorModal';
import Modal from './Modal';

export default function ConfigDashboard({ onConfigSaved }) {
  console.log('📋 ConfigDashboard: Componente renderizado', { onConfigSaved: !!onConfigSaved });
  console.log('📋 ConfigDashboard: Renderizando componente completo');
  
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  useEffect(() => {
    console.log('📋 ConfigDashboard: useEffect ejecutado');
    console.log('📋 ConfigDashboard: Root element:', document.getElementById('root'));
    const root = document.getElementById('root');
    if (root) {
      console.log('📋 ConfigDashboard: Root tiene hijos:', root.children.length);
      console.log('📋 ConfigDashboard: Root innerHTML length:', root.innerHTML.length);
    }
  }, []);

  useEffect(() => {
    console.log('📋 ConfigDashboard: useEffect ejecutado');
    const config = LocalStorageService.config;
    setUseLocalStorage(config.useLocalStorage || false);
    setSelectedPath(config.basePath || config.lastSelectedPath || '');
    
    // Verificar que el componente se renderizó en el DOM
    setTimeout(() => {
      const element = document.querySelector('[data-testid="config-dashboard"]');
      console.log('📋 ConfigDashboard: Elemento en DOM:', element ? '✅ Existe' : '❌ No existe');
      if (element) {
        const styles = window.getComputedStyle(element);
        console.log('📋 ConfigDashboard: Estilos del elemento:', {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          width: styles.width,
          height: styles.height,
          backgroundColor: styles.backgroundColor
        });
        console.log('📋 ConfigDashboard: Contenido del elemento (primeros 300 chars):', element.innerHTML.substring(0, 300));
      } else {
        console.error('❌ ConfigDashboard: El elemento NO existe en el DOM');
      }
    }, 200);
  }, []);

  const handleDirectorySelected = (path) => {
    setSelectedPath(path);
    setUseLocalStorage(true);
    setMessage({ 
      type: 'success', 
      text: `Directorio seleccionado correctamente: ${path}` 
    });
    setShowMessageModal(true);
  };

  const handleSaveConfig = () => {
    LocalStorageService.saveConfig({
      useLocalStorage,
      basePath: selectedPath,
      lastSelectedPath: selectedPath
    });

    setMessage({ 
      type: 'success', 
      text: 'Configuración guardada correctamente. Serás redirigido al editor.' 
    });
    setShowMessageModal(true);

    // Redirigir después de 1 segundo
    setTimeout(() => {
      if (onConfigSaved) {
        onConfigSaved();
      }
    }, 1000);
  };

  console.log('📋 ConfigDashboard: Renderizando JSX', { 
    useLocalStorage, 
    selectedPath, 
    showDirectoryModal,
    showMessageModal 
  });
  
  console.log('📋 ConfigDashboard: Retornando JSX');
  
  return (
    <div 
      className="min-h-screen bg-gray-50 p-6" 
      style={{ 
        backgroundColor: '#f9fafb', 
        padding: '1.5rem',
        minHeight: '100vh',
        width: '100%',
        display: 'block',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box'
      }}
      data-testid="config-dashboard"
    >
      {/* Estilos críticos inline para asegurar visibilidad */}
      <style dangerouslySetInnerHTML={{__html: `
        [data-testid="config-dashboard"] {
          background-color: #f9fafb !important;
          padding: 1.5rem !important;
          min-height: 100vh !important;
          width: 100% !important;
          display: block !important;
          position: relative !important;
          box-sizing: border-box !important;
        }
        [data-testid="config-dashboard"] h1 {
          font-size: 1.875rem !important;
          font-weight: bold !important;
          color: #111827 !important;
          margin: 0 0 1.5rem 0 !important;
        }
        [data-testid="config-dashboard"] button {
          padding: 0.5rem 1rem !important;
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 0.5rem !important;
          border: none !important;
          cursor: pointer !important;
          font-size: 1rem !important;
        }
        [data-testid="config-dashboard"] button:hover {
          background-color: #1d4ed8 !important;
        }
      `}} />
      <div className="max-w-4xl mx-auto" style={{ maxWidth: '56rem', margin: '0 auto', display: 'block' }}>
        <div className="bg-white rounded-lg shadow-lg p-8" style={{ 
          backgroundColor: 'white', 
          borderRadius: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
          padding: '2rem',
          display: 'block',
          marginTop: '2rem'
        }}>
          <div className="flex items-center gap-3 mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Settings className="w-8 h-8 text-blue-600" style={{ width: '2rem', height: '2rem', color: '#2563eb' }} />
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Configuración</h1>
          </div>

          <div className="space-y-6">
            {/* Almacenamiento Local */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Almacenamiento Local
              </h2>

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLocalStorage}
                    onChange={(e) => {
                      setUseLocalStorage(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedPath('');
                      }
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Guardar archivos localmente en el sistema de archivos
                  </span>
                </label>

                {useLocalStorage && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowDirectoryModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                      >
                        <FolderOpen className="w-4 h-4" />
                        Seleccionar Carpeta
                      </button>
                      
                      {selectedPath && (
                        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-green-800 font-medium truncate">{selectedPath}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Se crearán las siguientes carpetas en el directorio seleccionado:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                        <li><code className="bg-blue-100 px-1 rounded">data/</code> - Para archivos JSON de páginas</li>
                        <li><code className="bg-blue-100 px-1 rounded">files/</code> - Para imágenes y archivos adjuntos</li>
                      </ul>
                    </div>
                  </div>
                )}

                {!useLocalStorage && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        Si no activas el almacenamiento local, los datos se guardarán en el almacenamiento del navegador (localStorage/IndexedDB).
                        Los archivos grandes pueden no caber en el almacenamiento del navegador.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modales */}
            <DirectorySelectorModal
              isOpen={showDirectoryModal}
              onClose={() => setShowDirectoryModal(false)}
              onDirectorySelected={handleDirectorySelected}
            />

            <Modal
              isOpen={showMessageModal}
              onClose={() => setShowMessageModal(false)}
              title={message.type === 'success' ? 'Éxito' : message.type === 'error' ? 'Error' : 'Información'}
              type={message.type || 'info'}
            >
              <p className="text-gray-700">{message.text}</p>
            </Modal>

            {/* Botón guardar */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveConfig}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
              >
                <Save className="w-5 h-5" />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

