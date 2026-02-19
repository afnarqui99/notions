import { useState, useEffect } from 'react';
import { Monitor, X, Video, CheckCircle2 } from 'lucide-react';

export default function ScreenSourceSelectorModal({ isOpen, onClose, sources = [], onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isOpen && sources.length > 0) {
      // Seleccionar la primera pantalla completa por defecto
      const defaultIndex = sources.findIndex(s => {
        const name = s.name.toLowerCase();
        return name.includes('entire screen') || 
               name.includes('pantalla completa') ||
               name.includes('screen 1') ||
               name.includes('pantalla 1') ||
               (name.includes('screen') && !name.includes('window'));
      });
      setSelectedIndex(defaultIndex >= 0 ? defaultIndex : 0);
    }
  }, [isOpen, sources]);
  
  // Reset isSelecting cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setIsSelecting(false);
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (isSelecting) {
      return; // Prevenir múltiples llamadas
    }
    
    if (sources[selectedIndex] && onSelect) {
      setIsSelecting(true);
      onSelect(sources[selectedIndex]);
      // Cerrar el modal después de un pequeño delay
      setTimeout(() => {
        onClose();
      }, 100);
    }
  };

  const handleCancel = () => {
    // Si el usuario cancela, usar la primera opción por defecto
    if (sources.length > 0 && onSelect) {
      const defaultSource = sources.find(s => {
        const name = s.name.toLowerCase();
        return name.includes('entire screen') || 
               name.includes('pantalla completa') ||
               name.includes('screen 1') ||
               name.includes('pantalla 1') ||
               (name.includes('screen') && !name.includes('window'));
      }) || sources[0];
      onSelect(defaultSource);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Separar pantallas y ventanas
  const screens = sources.filter(s => !s.id.includes('window'));
  const windows = sources.filter(s => s.id.includes('window'));

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Seleccionar Pantalla o Ventana</h3>
              <p className="text-sm text-white/80 mt-0.5">Elige qué quieres grabar</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Grid horizontal */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Pantallas */}
          {screens.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Pantallas Completas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {screens.map((source, index) => {
                  const globalIndex = sources.findIndex(s => s.id === source.id);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={source.id}
                      onClick={() => setSelectedIndex(globalIndex)}
                      className={`relative group rounded-xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? 'border-blue-500 ring-4 ring-blue-200 dark:ring-blue-800 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                        {source.thumbnail ? (
                          <img 
                            src={source.thumbnail} 
                            alt={source.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Monitor className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        {/* Overlay cuando está seleccionado */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="bg-blue-600 rounded-full p-2 shadow-lg">
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-4 bg-white dark:bg-gray-800">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {source.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Pantalla completa
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ventanas */}
          {windows.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600" />
                Ventanas de Aplicaciones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {windows.map((source, index) => {
                  const globalIndex = sources.findIndex(s => s.id === source.id);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={source.id}
                      onClick={() => setSelectedIndex(globalIndex)}
                      className={`relative group rounded-xl border-2 transition-all overflow-hidden ${
                        isSelected
                          ? 'border-purple-500 ring-4 ring-purple-200 dark:ring-purple-800 shadow-lg scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                        {source.thumbnail ? (
                          <img 
                            src={source.thumbnail} 
                            alt={source.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                        {/* Overlay cuando está seleccionado */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                            <div className="bg-purple-600 rounded-full p-2 shadow-lg">
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3 bg-white dark:bg-gray-800">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {source.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Ventana
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {sources[selectedIndex] && (
              <span>
                Seleccionado: <strong className="text-gray-900 dark:text-gray-100">{sources[selectedIndex].name}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSelect}
              disabled={isSelecting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSelecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Iniciar Grabación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

