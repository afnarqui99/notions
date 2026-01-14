import { useState, useEffect } from 'react';
import { X, Palette, Terminal, Folder, Settings } from 'lucide-react';

export default function TerminalSettingsModal({ 
  isOpen, 
  onClose, 
  terminal, 
  onSave 
}) {
  const [name, setName] = useState(terminal?.name || '');
  const [shell, setShell] = useState(terminal?.shell || 'bash');
  const [currentDirectory, setCurrentDirectory] = useState(terminal?.currentDirectory || '~');
  const [styles, setStyles] = useState(terminal?.styles || {
    backgroundColor: '#1e1e1e',
    textColor: '#d4d4d4',
    promptColor: '#4ec9b0',
    errorColor: '#f48771'
  });

  useEffect(() => {
    if (terminal) {
      setName(terminal.name || '');
      setShell(terminal.shell || 'bash');
      setCurrentDirectory(terminal.currentDirectory || '~');
      setStyles(terminal.styles || {
        backgroundColor: '#1e1e1e',
        textColor: '#d4d4d4',
        promptColor: '#4ec9b0',
        errorColor: '#f48771'
      });
    }
  }, [terminal, isOpen]);

  const handleSave = () => {
    if (!terminal) return;
    
    const updated = {
      ...terminal,
      name: name.trim() || terminal.name,
      shell,
      currentDirectory: currentDirectory.trim() || '~',
      styles
    };
    
    onSave(updated);
    onClose();
  };

  const presetThemes = {
    dark: {
      backgroundColor: '#1e1e1e',
      textColor: '#d4d4d4',
      promptColor: '#4ec9b0',
      errorColor: '#f48771'
    },
    light: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      promptColor: '#0066cc',
      errorColor: '#cc0000'
    },
    green: {
      backgroundColor: '#0d1117',
      textColor: '#00ff00',
      promptColor: '#00ff88',
      errorColor: '#ff4444'
    },
    blue: {
      backgroundColor: '#001122',
      textColor: '#88ccff',
      promptColor: '#4da6ff',
      errorColor: '#ff6b6b'
    },
    purple: {
      backgroundColor: '#1a0d2e',
      textColor: '#e0b0ff',
      promptColor: '#b794f6',
      errorColor: '#fc8181'
    }
  };

  const applyTheme = (themeName) => {
    if (presetThemes[themeName]) {
      setStyles(presetThemes[themeName]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Configuración de Terminal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la terminal
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Terminal 1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Shell */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Terminal className="w-4 h-4 inline mr-2" />
              Shell
            </label>
            <select
              value={shell}
              onChange={(e) => setShell(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="bash">Bash</option>
              <option value="sh">Sh</option>
              <option value="zsh">Zsh</option>
              <option value="cmd">CMD (Windows)</option>
              <option value="powershell">PowerShell (Windows)</option>
            </select>
          </div>

          {/* Directorio actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Folder className="w-4 h-4 inline mr-2" />
              Directorio de trabajo
            </label>
            <input
              type="text"
              value={currentDirectory}
              onChange={(e) => setCurrentDirectory(e.target.value)}
              placeholder="~ o ruta absoluta"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Usa ~ para el directorio home o una ruta absoluta
            </p>
          </div>

          {/* Temas predefinidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="w-4 h-4 inline mr-2" />
              Temas predefinidos
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(presetThemes).map(themeName => (
                <button
                  key={themeName}
                  onClick={() => applyTheme(themeName)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm capitalize"
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          {/* Personalización de colores */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="w-4 h-4 inline mr-2" />
              Colores personalizados
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Color de fondo
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles({ ...styles, backgroundColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles({ ...styles, backgroundColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#1e1e1e"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Color de texto
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={styles.textColor}
                    onChange={(e) => setStyles({ ...styles, textColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.textColor}
                    onChange={(e) => setStyles({ ...styles, textColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#d4d4d4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Color del prompt
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={styles.promptColor}
                    onChange={(e) => setStyles({ ...styles, promptColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.promptColor}
                    onChange={(e) => setStyles({ ...styles, promptColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#4ec9b0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Color de error
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={styles.errorColor}
                    onChange={(e) => setStyles({ ...styles, errorColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={styles.errorColor}
                    onChange={(e) => setStyles({ ...styles, errorColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                    placeholder="#f48771"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista previa
            </label>
            <div
              className="p-4 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm"
              style={{
                backgroundColor: styles.backgroundColor,
                color: styles.textColor
              }}
            >
              <div style={{ color: styles.promptColor }}>
                user@localhost:~/projects$ 
              </div>
              <div className="mt-2">ls</div>
              <div className="mt-1">archivo1.txt  archivo2.js</div>
              <div className="mt-2" style={{ color: styles.errorColor }}>
                Error: comando no encontrado
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

