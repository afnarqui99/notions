import { useState, useEffect } from 'react';
import { X, Bell, Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';
import NotificationService from '../services/NotificationService';

export default function NotificationSettingsModal({ isOpen, onClose }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInApp, setShowInApp] = useState(true);
  const [showSystem, setShowSystem] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Los valores actuales están en el servicio, podemos inicializar con los valores por defecto
      // o leerlos si NotificationService los expusiera
      setSoundEnabled(true);
      setShowInApp(true);
      setShowSystem(true);
    }
  }, [isOpen]);

  const handleSave = () => {
    NotificationService.updateSettings({
      soundEnabled,
      showInApp,
      showSystem
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Configuración de Notificaciones
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sonido */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-blue-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Sonido de notificaciones
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Reproducir sonido cuando llegue una notificación
                </p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notificaciones en la aplicación */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-blue-600" />
              <div>
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Notificaciones en la aplicación
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Mostrar pop-ups de notificaciones dentro de la app
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInApp(!showInApp)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showInApp ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInApp ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notificaciones del sistema */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <div>
                <label className="text-sm font-medium text-gray-900 cursor-pointer">
                  Notificaciones del sistema
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Mostrar notificaciones nativas del sistema operativo
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSystem(!showSystem)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showSystem ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSystem ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

