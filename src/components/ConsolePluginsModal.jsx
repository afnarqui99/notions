import { useState } from 'react';
import { X, CheckCircle, Circle, Sparkles, AlertTriangle, Code, Zap } from 'lucide-react';
import codeIntelligenceService from '../services/CodeIntelligenceService';

export default function ConsolePluginsModal({ isOpen, onClose, plugins, onPluginsChange }) {
  const [localPlugins, setLocalPlugins] = useState(plugins || {
    autocomplete: true,
    snippets: true,
    syntaxValidation: true,
    codeFormatting: false,
    linting: false
  });

  if (!isOpen) return null;

  const pluginDefinitions = [
    {
      id: 'autocomplete',
      name: 'Autocompletado (IntelliSense)',
      description: 'Sugerencias automáticas de código mientras escribes, similar a VS Code IntelliSense',
      icon: Sparkles,
      category: 'JavaScript & Python',
      basedOn: 'VS Code IntelliSense',
      enabled: localPlugins.autocomplete
    },
    {
      id: 'snippets',
      name: 'Snippets de Código',
      description: 'Plantillas de código rápidas (for, if, arrow functions, etc.)',
      icon: Code,
      category: 'JavaScript & Python',
      basedOn: 'JavaScript (ES6) code snippets',
      enabled: localPlugins.snippets
    },
    {
      id: 'syntaxValidation',
      name: 'Validación de Sintaxis',
      description: 'Detecta errores de sintaxis en tiempo real (paréntesis, llaves, indentación)',
      icon: AlertTriangle,
      category: 'JavaScript & Python',
      basedOn: 'ESLint / Pylint (básico)',
      enabled: localPlugins.syntaxValidation
    },
    {
      id: 'codeFormatting',
      name: 'Formateo Automático',
      description: 'Formatea el código automáticamente (espacios, indentación)',
      icon: Zap,
      category: 'JavaScript & Python',
      basedOn: 'Prettier (básico)',
      enabled: localPlugins.codeFormatting
    },
    {
      id: 'linting',
      name: 'Linting en Tiempo Real',
      description: 'Detecta problemas de calidad de código y mejores prácticas',
      icon: CheckCircle,
      category: 'JavaScript & Python',
      basedOn: 'ESLint / Pylint',
      enabled: localPlugins.linting
    }
  ];

  const togglePlugin = (pluginId) => {
    const newPlugins = {
      ...localPlugins,
      [pluginId]: !localPlugins[pluginId]
    };
    setLocalPlugins(newPlugins);
  };

  const handleSave = () => {
    onPluginsChange(localPlugins);
    onClose();
  };

  const handleReset = () => {
    const defaultPlugins = {
      autocomplete: true,
      snippets: true,
      syntaxValidation: true,
      codeFormatting: false,
      linting: false
    };
    setLocalPlugins(defaultPlugins);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60001] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Plugins de Inteligencia de Código
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Funcionalidades inspiradas en las extensiones más populares de VS Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Extensiones de VS Code Inspiradoras
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Estas funcionalidades están basadas en las extensiones más populares de VS Code con 5 estrellas:
            </p>
            
            {/* Ejemplos de uso */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">📝 Ejemplos Prácticos para Probar:</h4>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-3">
                <div className="bg-white dark:bg-blue-800/30 rounded p-2">
                  <strong className="text-blue-900 dark:text-blue-100">1. Autocompletado (IntelliSense):</strong>
                  <div className="mt-1 ml-2 space-y-1">
                    <div>• Escribe <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">cons</code> → Verás dropdown con <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">console</code>, <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">const</code></div>
                    <div>• Escribe <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">arr</code> → Verás <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Array</code></div>
                    <div>• Usa ↑↓ para navegar, Enter para seleccionar</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-blue-800/30 rounded p-2">
                  <strong className="text-blue-900 dark:text-blue-100">2. Snippets:</strong>
                  <div className="mt-1 ml-2 space-y-1">
                    <div>• Escribe <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">for</code> y presiona <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Tab</code> → Se expande a bucle completo</div>
                    <div>• Escribe <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">arrow</code> + Tab → Función flecha</div>
                    <div>• Escribe <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">trycatch</code> + Tab → Bloque try-catch</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-blue-800/30 rounded p-2">
                  <strong className="text-blue-900 dark:text-blue-100">3. Validación de Sintaxis:</strong>
                  <div className="mt-1 ml-2 space-y-1">
                    <div>• Escribe: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">if (true {'{'}</code> (falta cerrar)</div>
                    <div>• Verás indicador rojo arriba y panel de errores abajo</div>
                  </div>
                </div>
                <div className="bg-white dark:bg-blue-800/30 rounded p-2">
                  <strong className="text-blue-900 dark:text-blue-100">4. Formateo Automático:</strong>
                  <div className="mt-1 ml-2 space-y-1">
                    <div>• Escribe: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">const x=1;const y=2;</code></div>
                    <div>• Presiona <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Ctrl+Shift+F</code> → Se formatea automáticamente</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">JavaScript</h4>
                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• ESLint (linting)</li>
                  <li>• Prettier (formateo)</li>
                  <li>• JavaScript (ES6) code snippets</li>
                  <li>• npm IntelliSense</li>
                </ul>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Python</h4>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  <li>• Python (Microsoft) - IntelliSense</li>
                  <li>• Pylint (linting)</li>
                  <li>• Python Test Explorer</li>
                  <li>• Python Preview</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {pluginDefinitions.map((plugin) => {
              const Icon = plugin.icon;
              return (
                <div
                  key={plugin.id}
                  className={`border rounded-lg p-4 transition-all ${
                    localPlugins[plugin.id]
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      {localPlugins[plugin.id] ? (
                        <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {plugin.name}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                          {plugin.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {plugin.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Basado en: <span className="font-medium">{plugin.basedOn}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Restaurar por defecto
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

