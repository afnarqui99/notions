import { X, Keyboard, Play } from 'lucide-react';
import Modal from './Modal';

export default function KeyboardShortcuts({ isOpen, onClose, onExecuteAction }) {
  const shortcuts = [
    {
      category: 'Navegación',
      items: [
        {
          description: 'Búsqueda global',
          actionId: 'globalSearch',
          keys: [
            { key: 'Ctrl', label: 'Ctrl' },
            { key: 'K', label: 'K' }
          ],
          macKeys: [
            { key: 'Cmd', label: '⌘' },
            { key: 'K', label: 'K' }
          ]
        }
      ]
    },
    {
      category: 'Notas',
      items: [
        {
          description: 'Abrir nota rápida',
          actionId: 'quickNote',
          keys: [
            { key: 'Ctrl', label: 'Ctrl' },
            { key: 'Q', label: 'Q' }
          ],
          macKeys: [
            { key: 'Ctrl', label: 'Ctrl' },
            { key: 'Q', label: 'Q' }
          ]
        },
        {
          description: 'Ver notas guardadas',
          actionId: 'quickNotesHistory',
          keys: [],
          macKeys: []
        }
      ]
    },
    {
      category: 'Editor',
      items: [
        {
          description: 'Comando slash (insertar bloques)',
          actionId: null, // Este no se puede ejecutar desde aquí, requiere estar en el editor
          keys: [
            { key: '/', label: '/' }
          ],
          macKeys: [
            { key: '/', label: '/' }
          ]
        }
      ]
    }
  ];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const renderKey = (keyItem) => {
    return (
      <kbd
        key={keyItem.key}
        className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm"
      >
        {keyItem.label}
      </kbd>
    );
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atajos de Teclado">
      <div className="space-y-6">
        {shortcuts.map((category) => (
          <div key={category.category}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {category.category}
            </h3>
            <div className="space-y-3">
              {category.items.map((item, index) => {
                const keysToShow = isMac ? (item.macKeys || item.keys) : item.keys;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {keysToShow.map((keyItem, keyIndex) => (
                          <div key={keyIndex} className="flex items-center gap-1">
                            {renderKey(keyItem)}
                            {keyIndex < keysToShow.length - 1 && (
                              <span className="text-gray-400 dark:text-gray-500 mx-1">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {item.actionId && onExecuteAction && (
                        <button
                          onClick={() => {
                            onExecuteAction(item.actionId);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                          title={`Ejecutar: ${item.description}`}
                        >
                          <Play className="w-3 h-3" />
                          Ejecutar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {isMac ? 'En Mac, usa ⌘ en lugar de Ctrl' : 'En Windows/Linux, usa Ctrl'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

