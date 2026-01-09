import { useState, useEffect } from 'react';
import { Settings, FolderOpen, Save, AlertCircle, CheckCircle, X, Upload, BookOpen } from 'lucide-react';
import LocalStorageService from '../services/LocalStorageService';
import DirectorySelectorModal from './DirectorySelectorModal';
import ImportPagesModal from './ImportPagesModal';
import Modal from './Modal';
import cursosService from '../services/CursosService';

export default function ConfigModal({ isOpen, onClose }) {
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [selectedPath, setSelectedPath] = useState('');
  const [cursosExternosPath, setCursosExternosPath] = useState('');
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [showCursosDirectoryModal, setShowCursosDirectoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = LocalStorageService.config;
      setUseLocalStorage(config.useLocalStorage || false);
      setSelectedPath(config.basePath || config.lastSelectedPath || '');
      setCursosExternosPath(config.cursosExternosPath || cursosService.getCursosExternosPath() || '');
    }
  }, [isOpen]);

  const handleDirectorySelected = (path) => {
    setSelectedPath(path);
    setUseLocalStorage(true);
    setMessage({ 
      type: 'success', 
      text: `Directorio actualizado correctamente: ${path}. Los archivos locales ahora están disponibles.` 
    });
    setShowMessageModal(true);
    
    // Disparar evento personalizado para notificar que el handle cambió
    window.dispatchEvent(new CustomEvent('directoryHandleChanged', { 
      detail: { path } 
    }));
  };

  const handleSelectCursosDirectory = async () => {
    if (window.electronAPI && window.electronAPI.selectCursosDirectory) {
      try {
        const selectedPath = await window.electronAPI.selectCursosDirectory();
        if (selectedPath) {
          setCursosExternosPath(selectedPath);
          cursosService.setCursosExternosPath(selectedPath);
          setMessage({ 
            type: 'success', 
            text: `Carpeta de cursos externos seleccionada: ${selectedPath}` 
          });
          setShowMessageModal(true);
        }
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: `Error al seleccionar carpeta: ${error.message}` 
        });
        setShowMessageModal(true);
      }
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Esta función solo está disponible en la versión Electron' 
      });
      setShowMessageModal(true);
    }
  };

  const handleSaveConfig = () => {
    LocalStorageService.saveConfig({
      useLocalStorage,
      basePath: selectedPath,
      lastSelectedPath: selectedPath,
      cursosExternosPath: cursosExternosPath
    });

    // También guardar en cursosService
    if (cursosExternosPath) {
      cursosService.setCursosExternosPath(cursosExternosPath);
    }

    setMessage({ 
      type: 'success', 
      text: 'Configuración guardada correctamente.' 
    });
    setShowMessageModal(true);

    // Cerrar después de 1 segundo
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Configuración</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Almacenamiento Local */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                Almacenamiento Local
              </h3>

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
                  <span className="text-gray-700 dark:text-gray-300">
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
                        {selectedPath ? 'Cambiar Carpeta' : 'Seleccionar Carpeta'}
                      </button>
                      
                      {selectedPath && (
                        <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-green-800 font-medium truncate">{selectedPath}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Estructura de carpetas:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        <li><code className="bg-blue-100 px-1 rounded">data/</code> - Archivos JSON de páginas</li>
                        <li><code className="bg-blue-100 px-1 rounded">files/</code> - Imágenes y archivos adjuntos</li>
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

            {/* Cursos Educativos */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Cursos Educativos
              </h3>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>📦 Cursos Incluidos:</strong> Todos los cursos vienen incluidos con la aplicación.
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Python, JavaScript, HTML/CSS, SQL, Angular, .NET, Java, DevOps, Inglés y más
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    ✅ No necesitas configurar nada para usar los cursos incluidos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔧 Carpeta de Cursos Externos (Opcional):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cursosExternosPath}
                      readOnly
                      placeholder="No configurado - Los cursos externos no estarán disponibles"
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    <button
                      onClick={handleSelectCursosDirectory}
                      disabled={!window.electronAPI}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                      title={!window.electronAPI ? 'Solo disponible en Electron' : 'Seleccionar carpeta de cursos externos'}
                    >
                      <FolderOpen className="w-4 h-4" />
                      Seleccionar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <strong>💡 Ventaja:</strong> Agrega nuevos cursos personalizados o actualiza los existentes sin reinstalar la aplicación.
                    La aplicación buscará primero en esta carpeta, luego en los cursos incluidos.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    🔧 Los cursos externos tienen prioridad sobre los incluidos (útil para actualizaciones)
                  </p>
                  {cursosExternosPath && (
                    <button
                      onClick={() => {
                        setCursosExternosPath('');
                        cursosService.setCursosExternosPath('');
                      }}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Limpiar configuración
                    </button>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    <strong>💡 Tip:</strong> Puedes copiar los cursos desde <code className="bg-green-100 dark:bg-green-900 px-1 rounded">ejemplos-consola/</code> a tu carpeta externa para tenerlos disponibles sin reinstalar la aplicación.
                  </p>
                </div>
              </div>
            </div>

            {/* Importar Páginas */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Importar Páginas
              </h3>

              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Importa páginas desde archivos JSON. Se generarán UUIDs únicos automáticamente y se mantendrán las relaciones entre páginas.
                </p>

                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  Importar Archivos JSON
                </button>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Formato esperado:</strong>
                  </p>
                  <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Archivos JSON con estructura de página válida</li>
                    <li>Los IDs pueden ser simples (se convertirán a UUIDs)</li>
                    <li>Los parentId se actualizarán automáticamente</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Información</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Los cambios se aplicarán inmediatamente después de guardar</li>
                <li>• Los archivos existentes no se moverán automáticamente</li>
                <li>• Puedes cambiar la ubicación en cualquier momento</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 rounded-b-2xl sticky bottom-0 transition-colors">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium transition-colors shadow-md hover:shadow-lg"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>

      {/* Modales anidados */}
      <DirectorySelectorModal
        isOpen={showDirectoryModal}
        onClose={() => setShowDirectoryModal(false)}
        onDirectorySelected={handleDirectorySelected}
      />

      <ImportPagesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => {
          // Disparar evento para recargar páginas
          window.dispatchEvent(new Event('paginasReordenadas'));
          setMessage({
            type: 'success',
            text: 'Páginas importadas correctamente. Recarga la página para ver los cambios.'
          });
          setShowMessageModal(true);
        }}
      />

      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={message.type === 'success' ? 'Éxito' : message.type === 'error' ? 'Error' : 'Información'}
        type={message.type || 'info'}
      >
        <p className="text-gray-700 dark:text-gray-300">{message.text}</p>
      </Modal>
    </>
  );
}









