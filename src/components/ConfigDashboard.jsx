import { useState, useEffect } from 'react';
import { Settings, FolderOpen, Save, AlertCircle, CheckCircle } from 'lucide-react';
import LocalStorageService from '../services/LocalStorageService';
import DirectorySelectorModal from './DirectorySelectorModal';
import Modal from './Modal';

export default function ConfigDashboard({ onConfigSaved }) {
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);
  
  useEffect(() => {
    const config = LocalStorageService.config;
    setUseLocalStorage(config.useLocalStorage || false);
    setSelectedPath(config.basePath || config.lastSelectedPath || '');
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
    // Validar que si useLocalStorage es true, haya una carpeta seleccionada
    if (useLocalStorage && !selectedPath) {
      setMessage({ 
        type: 'error', 
        text: 'Por favor, selecciona una carpeta para usar el almacenamiento local, o cambia a "Almacenamiento del Navegador".' 
      });
      setShowMessageModal(true);
      return;
    }

    LocalStorageService.saveConfig({
      useLocalStorage,
      basePath: useLocalStorage ? selectedPath : null,
      lastSelectedPath: useLocalStorage ? selectedPath : null
    });

    setMessage({ 
      type: 'success', 
      text: useLocalStorage 
        ? 'Configuración guardada. Los datos se guardarán en la carpeta seleccionada.' 
        : 'Configuración guardada. Los datos se guardarán en el almacenamiento del navegador.' 
    });
    setShowMessageModal(true);

    // Redirigir después de 1 segundo
    setTimeout(() => {
      if (onConfigSaved) {
        onConfigSaved();
      }
    }, 1000);
  };
  
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
            {/* Almacenamiento */}
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                Almacenamiento de Datos
              </h2>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Elige dónde quieres guardar tus páginas y archivos. Puedes cambiar esta opción en cualquier momento.
                </p>
                
                {/* Opción 1: localStorage (por defecto) */}
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  !useLocalStorage 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`} onClick={() => {
                  setUseLocalStorage(false);
                  setSelectedPath('');
                }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="storage"
                      checked={!useLocalStorage}
                      onChange={() => {
                        setUseLocalStorage(false);
                        setSelectedPath('');
                      }}
                      className="w-5 h-5 text-blue-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        Almacenamiento del Navegador (Recomendado)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Los datos se guardan en el almacenamiento del navegador (localStorage/IndexedDB). 
                        Funciona inmediatamente sin configuración. Ideal para empezar rápido.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Opción 2: Carpeta local */}
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  useLocalStorage 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`} onClick={() => {
                  setUseLocalStorage(true);
                }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="storage"
                      checked={useLocalStorage}
                      onChange={() => {
                        setUseLocalStorage(true);
                      }}
                      className="w-5 h-5 text-blue-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">
                        Carpeta Local del Sistema
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Los datos se guardan en una carpeta de tu sistema de archivos. 
                        Útil para backups, acceso desde otros programas o archivos grandes.
                      </div>
                    </div>
                  </label>
                </div>

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
                        <div className="flex-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm text-green-800 dark:text-green-200 font-medium truncate">{selectedPath}</span>
                        </div>
                      )}
                    </div>

                    {!selectedPath && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Nota:</strong> Debes seleccionar una carpeta para usar el almacenamiento local. 
                          Se crearán las siguientes carpetas en el directorio seleccionado:
                        </p>
                        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                          <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">data/</code> - Para archivos JSON de páginas</li>
                          <li><code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">files/</code> - Para imágenes y archivos adjuntos</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {!useLocalStorage && (
                  <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Modo activo:</strong> Los datos se guardan en el almacenamiento del navegador (localStorage/IndexedDB). 
                        Funciona inmediatamente sin configuración adicional. Si necesitas guardar archivos grandes o acceder desde otros programas, 
                        puedes cambiar a "Carpeta Local del Sistema" más arriba.
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

