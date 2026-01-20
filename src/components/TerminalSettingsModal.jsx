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
  const [dockerInstalled, setDockerInstalled] = useState(null); // null = checking, true/false = result
  const [styles, setStyles] = useState(terminal?.styles || {
    backgroundColor: '#1a0d2e', // Purple theme por defecto
    textColor: '#e0b0ff',
    promptColor: '#b794f6',
    errorColor: '#fc8181',
    fontSize: 14, // Mantener para compatibilidad
    outputFontSize: 14,
    inputFontSize: 22, // Valor por defecto 22px
    outputHeight: 400,
    inputHeight: 220, // Valor por defecto 220px
    headerBackgroundColor: '#1f2937', // Color de fondo del header por defecto
    headerTextColor: '#ffffff' // Color de texto del header por defecto
  });

  // Verificar Docker al abrir el modal
  useEffect(() => {
    const checkDocker = async () => {
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.checkDockerInstalled) {
        try {
          const result = await window.electronAPI.checkDockerInstalled();
          setDockerInstalled(result.installed);
        } catch (error) {
          console.error('[TerminalSettingsModal] Error verificando Docker:', error);
          setDockerInstalled(false);
        }
      } else {
        setDockerInstalled(false);
      }
    };
    
    if (isOpen) {
      checkDocker();
    }
  }, [isOpen]);

  useEffect(() => {
    if (terminal) {
      setName(terminal.name || '');
      setShell(terminal.shell || 'bash');
      setCurrentDirectory(terminal.currentDirectory || '~');
      
      // Si no tiene estilos o tiene el tema dark por defecto, aplicar Purple
      if (!terminal.styles || terminal.styles.backgroundColor === '#1e1e1e') {
        setStyles({
          ...presetThemes.purple,
          outputFontSize: terminal.styles?.outputFontSize || terminal.styles?.fontSize || 14,
          inputFontSize: terminal.styles?.inputFontSize || terminal.styles?.fontSize || 22,
          outputHeight: terminal.styles?.outputHeight || 400,
          inputHeight: terminal.styles?.inputHeight || 220,
          headerBackgroundColor: terminal.styles?.headerBackgroundColor || '#1f2937',
          headerTextColor: terminal.styles?.headerTextColor || '#ffffff'
        });
      } else {
        setStyles({
          ...terminal.styles,
          outputFontSize: terminal.styles.outputFontSize || terminal.styles.fontSize || 14,
          inputFontSize: terminal.styles.inputFontSize || terminal.styles.fontSize || 22,
          outputHeight: terminal.styles.outputHeight || 400,
          inputHeight: terminal.styles.inputHeight || 220,
          headerBackgroundColor: terminal.styles.headerBackgroundColor || '#1f2937',
          headerTextColor: terminal.styles.headerTextColor || '#ffffff'
        });
      }
    }
  }, [terminal, isOpen]);

  const handleSave = () => {
    if (!terminal) {
      console.error('[TerminalSettingsModal] No hay terminal para guardar');
      return;
    }
    
    const updated = {
      ...terminal,
      name: name.trim() || terminal.name,
      shell,
      currentDirectory: currentDirectory.trim() || '~',
      styles
    };
    
    console.log('[TerminalSettingsModal] Guardando configuración:', {
      id: updated.id,
      name: updated.name,
      shell: updated.shell,
      currentDirectory: updated.currentDirectory,
      styles: updated.styles
    });
    
    onSave(updated);
    onClose();
  };

  const presetThemes = {
    dark: {
      backgroundColor: '#1e1e1e',
      textColor: '#d4d4d4',
      promptColor: '#4ec9b0',
      errorColor: '#f48771',
      fontSize: 14,
      outputFontSize: 14,
      inputFontSize: 14,
      outputHeight: 400,
      inputHeight: 80
    },
    light: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      promptColor: '#0066cc',
      errorColor: '#cc0000',
      fontSize: 14,
      outputFontSize: 14,
      inputFontSize: 14,
      outputHeight: 400,
      inputHeight: 80
    },
    green: {
      backgroundColor: '#0d1117',
      textColor: '#00ff00',
      promptColor: '#00ff88',
      errorColor: '#ff4444',
      fontSize: 14,
      outputFontSize: 14,
      inputFontSize: 14,
      outputHeight: 400,
      inputHeight: 80
    },
    blue: {
      backgroundColor: '#001122',
      textColor: '#88ccff',
      promptColor: '#4da6ff',
      errorColor: '#ff6b6b',
      fontSize: 14,
      outputFontSize: 14,
      inputFontSize: 14,
      outputHeight: 400,
      inputHeight: 80
    },
    purple: {
      backgroundColor: '#1a0d2e',
      textColor: '#e0b0ff',
      promptColor: '#b794f6',
      errorColor: '#fc8181',
      fontSize: 14,
      outputFontSize: 14,
      inputFontSize: 22,
      outputHeight: 400,
      inputHeight: 220,
      headerBackgroundColor: '#1f2937',
      headerTextColor: '#ffffff'
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
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Configuración de Terminal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Primera fila: Nombre y Shell en grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Terminal 1"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Shell */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Terminal className="w-3 h-3 inline mr-1" />
                Shell
              </label>
              <select
                value={shell}
                onChange={(e) => setShell(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="bash">Bash</option>
                <option value="sh">Sh</option>
                <option value="zsh">Zsh</option>
                <option value="cmd">CMD (Windows)</option>
                <option value="powershell">PowerShell (Windows)</option>
                {dockerInstalled !== null && (
                  <option value="docker" disabled={!dockerInstalled}>
                    Docker {dockerInstalled ? '✓' : '(No instalado)'}
                  </option>
                )}
              </select>
              {shell === 'docker' && dockerInstalled === false && (
                <p className="text-xs text-red-500 mt-1">
                  Docker no está instalado. Por favor, instala Docker Desktop para usar esta opción.
                </p>
              )}
              {shell === 'docker' && dockerInstalled === true && (
                <p className="text-xs text-green-500 mt-1">
                  Docker está instalado y listo para usar.
                </p>
              )}
            </div>
          </div>

          {/* Directorio actual */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Folder className="w-3 h-3 inline mr-1" />
              Directorio de trabajo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentDirectory}
                onChange={(e) => setCurrentDirectory(e.target.value)}
                placeholder="~ o ruta absoluta"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('[TerminalSettingsModal] Iniciando selección de directorio...');
                    if (window.electronAPI && window.electronAPI.selectDirectory) {
                      const selectedPath = await window.electronAPI.selectDirectory();
                      if (selectedPath) {
                        console.log('[TerminalSettingsModal] Directorio seleccionado:', selectedPath);
                        setCurrentDirectory(selectedPath);
                      }
                    } else if ('showDirectoryPicker' in window) {
                      const directoryHandle = await window.showDirectoryPicker();
                      const path = directoryHandle.name;
                      console.log('[TerminalSettingsModal] Directorio seleccionado:', path);
                      setCurrentDirectory(path);
                    } else {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.webkitdirectory = true;
                      input.style.display = 'none';
                      input.onchange = (e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const firstFile = files[0];
                          const path = firstFile.webkitRelativePath.split('/')[0];
                          setCurrentDirectory(path);
                        }
                        document.body.removeChild(input);
                      };
                      document.body.appendChild(input);
                      input.click();
                    }
                  } catch (error) {
                    console.error('[TerminalSettingsModal] Error seleccionando directorio:', error);
                    if (error.name !== 'AbortError') {
                      alert('Error al seleccionar directorio: ' + error.message);
                    }
                  }
                }}
                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="Seleccionar carpeta"
              >
                <Folder className="w-3 h-3" />
                Buscar
              </button>
            </div>
          </div>

          {/* Temas predefinidos */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Palette className="w-3 h-3 inline mr-1" />
              Temas predefinidos
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.keys(presetThemes).map(themeName => (
                <button
                  key={themeName}
                  onClick={() => applyTheme(themeName)}
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs capitalize"
                >
                  {themeName}
                </button>
              ))}
            </div>
          </div>

          {/* Tamaño de fuente y alturas */}
          <div className="space-y-3">
            {/* Primera fila: Tamaños de fuente */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tamaños de fuente
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Fuente del output (px)
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="32"
                    value={styles.outputFontSize || styles.fontSize || 14}
                    onChange={(e) => setStyles({ ...styles, outputFontSize: parseInt(e.target.value) || 14 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Fuente del input (px)
                  </label>
                  <input
                    type="number"
                    min="8"
                    max="32"
                    value={styles.inputFontSize || styles.fontSize || 14}
                    onChange={(e) => setStyles({ ...styles, inputFontSize: parseInt(e.target.value) || 14 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Segunda fila: Alturas */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Alturas de áreas
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Altura del output (px)
                  </label>
                  <input
                    type="number"
                    min="200"
                    max="1000"
                    step="50"
                    value={styles.outputHeight || 400}
                    onChange={(e) => setStyles({ ...styles, outputHeight: parseInt(e.target.value) || 400 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Altura del input (px)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    step="10"
                    value={styles.inputHeight || 80}
                    onChange={(e) => setStyles({ ...styles, inputHeight: parseInt(e.target.value) || 80 })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personalización de colores - Grid compacto */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Palette className="w-3 h-3 inline mr-1" />
              Colores personalizados
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Fondo */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Fondo
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles({ ...styles, backgroundColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer flex-shrink-0"
                    title="Color de fondo"
                  />
                  <input
                    type="text"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles({ ...styles, backgroundColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="#1e1e1e"
                  />
                </div>
              </div>
              {/* Texto */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Texto
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={styles.textColor}
                    onChange={(e) => setStyles({ ...styles, textColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer flex-shrink-0"
                    title="Color de texto"
                  />
                  <input
                    type="text"
                    value={styles.textColor}
                    onChange={(e) => setStyles({ ...styles, textColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="#d4d4d4"
                  />
                </div>
              </div>
              {/* Prompt */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Prompt
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={styles.promptColor}
                    onChange={(e) => setStyles({ ...styles, promptColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer flex-shrink-0"
                    title="Color del prompt"
                  />
                  <input
                    type="text"
                    value={styles.promptColor}
                    onChange={(e) => setStyles({ ...styles, promptColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="#4ec9b0"
                  />
                </div>
              </div>
              {/* Error */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Error
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={styles.errorColor}
                    onChange={(e) => setStyles({ ...styles, errorColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer flex-shrink-0"
                    title="Color de error"
                  />
                  <input
                    type="text"
                    value={styles.errorColor}
                    onChange={(e) => setStyles({ ...styles, errorColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="#f48771"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colores del Header */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Colores del Header
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Fondo del Header */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Fondo del Header
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={styles.headerBackgroundColor || '#1f2937'}
                    onChange={(e) => setStyles({ ...styles, headerBackgroundColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer flex-shrink-0"
                    title="Color de fondo del header"
                  />
                  <input
                    type="text"
                    value={styles.headerBackgroundColor || '#1f2937'}
                    onChange={(e) => setStyles({ ...styles, headerBackgroundColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="#1f2937"
                  />
                </div>
              </div>
              {/* Texto del Header */}
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Texto del Header
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={styles.headerTextColor || '#ffffff'}
                    onChange={(e) => setStyles({ ...styles, headerTextColor: e.target.value })}
                    className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer flex-shrink-0"
                    title="Color de texto del header"
                  />
                  <input
                    type="text"
                    value={styles.headerTextColor || '#ffffff'}
                    onChange={(e) => setStyles({ ...styles, headerTextColor: e.target.value })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa compacta */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Vista previa
            </label>
            <div
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-xs"
              style={{
                backgroundColor: styles.backgroundColor,
                color: styles.textColor
              }}
            >
              <div style={{ color: styles.promptColor }}>
                user@localhost:~/projects$ 
              </div>
              <div className="mt-1">ls</div>
              <div className="mt-0.5">archivo1.txt  archivo2.js</div>
              <div className="mt-1" style={{ color: styles.errorColor }}>
                Error: comando no encontrado
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2.5 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

