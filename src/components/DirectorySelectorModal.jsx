import { useState } from 'react';
import { FolderOpen, CheckCircle, AlertCircle, X, Loader, Info } from 'lucide-react';
import LocalStorageService from '../services/LocalStorageService';
import Modal from './Modal';

export default function DirectorySelectorModal({ isOpen, onClose, onDirectorySelected }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleSelectDirectory = () => {
    // Mostrar modal informativo primero
    setShowInfoModal(true);
  };

  const handleConfirmInfo = async () => {
    setShowInfoModal(false);
    setIsSelecting(true);
    setError('');
    setSelectedPath('');

    try {
      const handle = await LocalStorageService.requestDirectoryAccess();
      if (handle) {
        setSelectedPath(handle.name);
        LocalStorageService.baseDirectoryHandle = handle;
      } else {
        setError('Selección cancelada');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Selección cancelada');
      } else {
        setError(`Error: ${error.message}`);
      }
    } finally {
      setIsSelecting(false);
    }
  };

  const handleConfirm = async () => {
    if (selectedPath) {
      LocalStorageService.saveConfig({
        useLocalStorage: true,
        basePath: selectedPath,
        lastSelectedPath: selectedPath
      });
      
      // Disparar evento para notificar que el handle cambió
      window.dispatchEvent(new CustomEvent('directoryHandleChanged', { 
        detail: { path: selectedPath } 
      }));
      
      onDirectorySelected(selectedPath);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedPath('');
    setError('');
    setIsSelecting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Seleccionar Carpeta de Almacenamiento</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Selecciona la carpeta donde se guardarán todos tus archivos. Se crearán automáticamente las subcarpetas necesarias.
          </p>

          {/* Información de carpetas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Estructura que se creará:</p>
            <div className="space-y-1 text-sm text-blue-800 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📁</span>
                <span>tu-carpeta/</span>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="text-blue-600">📁</span>
                <span>data/</span>
                <span className="text-blue-600 text-xs">(páginas JSON)</span>
              </div>
              <div className="flex items-center gap-2 pl-4">
                <span className="text-blue-600">📁</span>
                <span>files/</span>
                <span className="text-blue-600 text-xs">(imágenes y archivos)</span>
              </div>
            </div>
          </div>

          {/* Botón seleccionar */}
          <div className="space-y-3">
            <button
              onClick={handleSelectDirectory}
              disabled={isSelecting}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
            >
              {isSelecting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Abriendo selector de carpetas...</span>
                </>
              ) : (
                <>
                  <FolderOpen className="w-5 h-5" />
                  <span>Seleccionar Carpeta</span>
                </>
              )}
            </button>

            {/* Carpeta seleccionada */}
            {selectedPath && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900">Carpeta seleccionada:</p>
                  <p className="text-sm text-green-800 truncate font-mono">{selectedPath}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          {/* Nota sobre compatibilidad */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Nota:</strong> Esta funcionalidad requiere Chrome 86+, Edge 86+ u Opera 72+. 
                En otros navegadores se usará el almacenamiento del navegador.
              </span>
            </p>
          </div>

          {/* Información sobre el diálogo del navegador */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  ¿Qué pasará al hacer clic en "Seleccionar Carpeta"?
                </p>
                <p className="text-xs text-blue-800">
                  Se abrirá un <strong>diálogo del navegador</strong> (no podemos personalizarlo) 
                  donde podrás elegir la carpeta. Este diálogo es seguro y solo permite que la aplicación 
                  acceda a la carpeta que tú elijas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPath}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </div>

      {/* Modal informativo antes de abrir el selector nativo */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Selección de Carpeta"
        type="info"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Al hacer clic en "Continuar", se abrirá un <strong>diálogo del navegador</strong> 
            donde podrás seleccionar la carpeta donde se guardarán tus archivos.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-semibold mb-2">📋 Pasos a seguir:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Se abrirá un diálogo del navegador (no podemos personalizarlo)</li>
              <li>Navega y selecciona la carpeta que deseas usar</li>
              <li>Haz clic en "Permitir" o "Seleccionar carpeta" en el diálogo</li>
              <li>La carpeta seleccionada aparecerá aquí</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Importante:</strong> El diálogo que verás es del navegador y no se puede personalizar. 
                Es seguro y solo permite acceso a la carpeta que tú elijas.
              </span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowInfoModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Continuar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

