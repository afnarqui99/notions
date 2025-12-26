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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
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

