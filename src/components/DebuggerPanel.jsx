import { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, SkipForward, SkipBack, 
  ChevronRight, ChevronDown, Eye, X, Plus,
  Bug, AlertCircle
} from 'lucide-react';
import debuggerService from '../services/DebuggerService';

export default function DebuggerPanel({ 
  projectId, 
  projectPath, 
  projectType,
  activeFile,
  onBreakpointToggle,
  breakpoints = [],
  currentLine = null
}) {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugStatus, setDebugStatus] = useState('stopped'); // stopped, running, paused
  const [variables, setVariables] = useState([]);
  const [callStack, setCallStack] = useState([]);
  const [watchExpressions, setWatchExpressions] = useState([]);
  const [newWatchExpression, setNewWatchExpression] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    variables: true,
    watch: true,
    callStack: true
  });

  // Verificar si hay sesión activa
  useEffect(() => {
    if (projectId) {
      const hasSession = debuggerService.hasActiveSession(projectId);
      setIsDebugging(hasSession);
      if (hasSession) {
        const session = debuggerService.getSession(projectId);
        setDebugStatus(session?.status || 'stopped');
      }
    }
  }, [projectId]);

  // Escuchar eventos de debugging
  useEffect(() => {
    if (!projectId) return;

    const handleDebugEvent = (event) => {
      if (event.detail?.projectId === projectId) {
        const { type } = event.detail;
        
        switch (type) {
          case 'started':
            setIsDebugging(true);
            setDebugStatus('paused');
            break;
          case 'paused':
          case 'breakpoint':
            setDebugStatus('paused');
            // Actualizar variables y call stack
            updateDebugInfo();
            break;
          case 'continue':
          case 'running':
            setDebugStatus('running');
            break;
          case 'stopped':
            setIsDebugging(false);
            setDebugStatus('stopped');
            setVariables([]);
            setCallStack([]);
            break;
        }
      }
    };

    window.addEventListener('debugger-paused', handleDebugEvent);
    window.addEventListener('debugger-continued', handleDebugEvent);
    window.addEventListener('debugger-stopped', handleDebugEvent);

    return () => {
      window.removeEventListener('debugger-paused', handleDebugEvent);
      window.removeEventListener('debugger-continued', handleDebugEvent);
      window.removeEventListener('debugger-stopped', handleDebugEvent);
    };
  }, [projectId]);

  const updateDebugInfo = async () => {
    if (!projectId) return;
    
    try {
      const vars = await debuggerService.getVariables(projectId);
      const stack = await debuggerService.getCallStack(projectId);
      setVariables(vars);
      setCallStack(stack);
    } catch (error) {
      console.error('[DebuggerPanel] Error actualizando info:', error);
    }
  };

  const startDebugging = async () => {
    if (!projectPath || !projectType) {
      alert('No se puede iniciar debugging: falta información del proyecto');
      return;
    }

    try {
      const session = await debuggerService.startDebugging(projectId, projectPath, projectType);
      setIsDebugging(true);
      setDebugStatus('paused');
    } catch (error) {
      alert(`Error al iniciar debugging: ${error.message}`);
      console.error('[DebuggerPanel] Error:', error);
    }
  };

  const stopDebugging = async () => {
    if (!projectId) return;

    try {
      await debuggerService.stopDebugging(projectId);
      setIsDebugging(false);
      setDebugStatus('stopped');
      setVariables([]);
      setCallStack([]);
    } catch (error) {
      console.error('[DebuggerPanel] Error deteniendo:', error);
    }
  };

  const handleContinue = async () => {
    if (!projectId) return;
    try {
      await debuggerService.continue(projectId);
      setDebugStatus('running');
    } catch (error) {
      console.error('[DebuggerPanel] Error continuando:', error);
    }
  };

  const handlePause = async () => {
    if (!projectId) return;
    try {
      await debuggerService.pause(projectId);
      setDebugStatus('paused');
    } catch (error) {
      console.error('[DebuggerPanel] Error pausando:', error);
    }
  };

  const handleStepOver = async () => {
    if (!projectId) return;
    try {
      await debuggerService.stepOver(projectId);
    } catch (error) {
      console.error('[DebuggerPanel] Error step over:', error);
    }
  };

  const handleStepInto = async () => {
    if (!projectId) return;
    try {
      await debuggerService.stepInto(projectId);
    } catch (error) {
      console.error('[DebuggerPanel] Error step into:', error);
    }
  };

  const handleStepOut = async () => {
    if (!projectId) return;
    try {
      await debuggerService.stepOut(projectId);
    } catch (error) {
      console.error('[DebuggerPanel] Error step out:', error);
    }
  };

  const addWatchExpression = () => {
    if (!newWatchExpression.trim() || !projectId) return;
    
    debuggerService.addWatchExpression(projectId, newWatchExpression.trim());
    setWatchExpressions(debuggerService.getWatchExpressions(projectId));
    setNewWatchExpression('');
  };

  const removeWatchExpression = (expression) => {
    if (!projectId) return;
    debuggerService.removeWatchExpression(projectId, expression);
    setWatchExpressions(debuggerService.getWatchExpressions(projectId));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!projectId) {
    return (
      <div className="p-4 text-[#858585] text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Bug className="w-4 h-4" />
          <span>Debugger</span>
        </div>
        <p className="text-xs">Selecciona un proyecto para iniciar debugging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#cccccc]">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#3e3e42] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#4ec9b0]" />
          <span className="text-sm font-semibold">Debugger</span>
        </div>
        {isDebugging && (
          <div className={`w-2 h-2 rounded-full ${
            debugStatus === 'running' ? 'bg-green-500 animate-pulse' :
            debugStatus === 'paused' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`} />
        )}
      </div>

      {/* Controles de Debugging */}
      <div className="px-3 py-2 border-b border-[#3e3e42] flex items-center gap-1">
        {!isDebugging ? (
          <button
            onClick={startDebugging}
            className="px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-xs flex items-center gap-1.5 transition-colors"
            title="Iniciar debugging (F5)"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Iniciar</span>
          </button>
        ) : (
          <>
            {debugStatus === 'paused' ? (
              <button
                onClick={handleContinue}
                className="px-2 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-xs transition-colors"
                title="Continuar (F5)"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-2 py-1.5 bg-[#f48771] hover:bg-[#ff9d85] text-white rounded text-xs transition-colors"
                title="Pausar"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleStepOver}
              className="px-2 py-1.5 bg-[#3e3e42] hover:bg-[#464647] text-white rounded text-xs transition-colors"
              title="Step Over (F10)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStepInto}
              className="px-2 py-1.5 bg-[#3e3e42] hover:bg-[#464647] text-white rounded text-xs transition-colors"
              title="Step Into (F11)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStepOut}
              className="px-2 py-1.5 bg-[#3e3e42] hover:bg-[#464647] text-white rounded text-xs transition-colors"
              title="Step Out (Shift+F11)"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={stopDebugging}
              className="px-2 py-1.5 bg-[#f48771] hover:bg-[#ff9d85] text-white rounded text-xs transition-colors ml-auto"
              title="Detener (Shift+F5)"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Contenido del panel */}
      <div className="flex-1 overflow-y-auto">
        {/* Variables */}
        <div className="border-b border-[#3e3e42]">
          <button
            onClick={() => toggleSection('variables')}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#2d2d30] transition-colors"
          >
            <span className="text-xs font-semibold uppercase text-[#858585]">Variables</span>
            {expandedSections.variables ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {expandedSections.variables && (
            <div className="px-3 pb-2">
              {variables.length === 0 ? (
                <p className="text-xs text-[#858585] py-2">No hay variables disponibles</p>
              ) : (
                <div className="space-y-1">
                  {variables.map((variable, index) => (
                    <div key={index} className="text-xs py-1 px-2 hover:bg-[#2d2d30] rounded">
                      <span className="text-[#4ec9b0]">{variable.name}</span>
                      <span className="text-[#858585] mx-2">=</span>
                      <span className="text-[#cccccc]">{String(variable.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Watch */}
        <div className="border-b border-[#3e3e42]">
          <button
            onClick={() => toggleSection('watch')}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#2d2d30] transition-colors"
          >
            <span className="text-xs font-semibold uppercase text-[#858585]">Watch</span>
            {expandedSections.watch ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {expandedSections.watch && (
            <div className="px-3 pb-2">
              <div className="flex gap-1 mb-2">
                <input
                  type="text"
                  value={newWatchExpression}
                  onChange={(e) => setNewWatchExpression(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addWatchExpression();
                    }
                  }}
                  placeholder="Agregar expresión..."
                  className="flex-1 px-2 py-1 text-xs bg-[#1e1e1e] border border-[#3e3e42] rounded text-[#cccccc] focus:outline-none focus:ring-1 focus:ring-[#007acc]"
                />
                <button
                  onClick={addWatchExpression}
                  className="px-2 py-1 bg-[#0e639c] hover:bg-[#1177bb] text-white rounded text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              {watchExpressions.length === 0 ? (
                <p className="text-xs text-[#858585] py-2">No hay expresiones watch</p>
              ) : (
                <div className="space-y-1">
                  {watchExpressions.map((expr, index) => (
                    <div key={index} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-[#2d2d30] rounded group">
                      <span className="text-[#cccccc]">{expr}</span>
                      <button
                        onClick={() => removeWatchExpression(expr)}
                        className="opacity-0 group-hover:opacity-100 text-[#f48771] hover:text-[#ff9d85] transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call Stack */}
        <div className="border-b border-[#3e3e42]">
          <button
            onClick={() => toggleSection('callStack')}
            className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#2d2d30] transition-colors"
          >
            <span className="text-xs font-semibold uppercase text-[#858585]">Call Stack</span>
            {expandedSections.callStack ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
          {expandedSections.callStack && (
            <div className="px-3 pb-2">
              {callStack.length === 0 ? (
                <p className="text-xs text-[#858585] py-2">No hay call stack disponible</p>
              ) : (
                <div className="space-y-1">
                  {callStack.map((frame, index) => (
                    <div key={index} className="text-xs py-1 px-2 hover:bg-[#2d2d30] rounded">
                      <div className="text-[#4ec9b0]">{frame.name || 'anonymous'}</div>
                      {frame.file && (
                        <div className="text-[#858585] text-[10px] mt-0.5">
                          {frame.file}:{frame.line}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Breakpoints */}
        <div className="border-b border-[#3e3e42]">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase text-[#858585]">Breakpoints</span>
          </div>
          <div className="px-3 pb-2">
            {breakpoints.length === 0 ? (
              <p className="text-xs text-[#858585] py-2">No hay breakpoints</p>
            ) : (
              <div className="space-y-1">
                {breakpoints.map((bp, index) => (
                  <div key={index} className="flex items-center justify-between text-xs py-1 px-2 hover:bg-[#2d2d30] rounded group">
                    <div>
                      <div className="text-[#cccccc]">{bp.file?.split(/[/\\]/).pop() || bp.file}</div>
                      <div className="text-[#858585] text-[10px]">Línea {bp.line}</div>
                    </div>
                    <button
                      onClick={() => onBreakpointToggle && onBreakpointToggle(bp.file, bp.line)}
                      className="opacity-0 group-hover:opacity-100 text-[#f48771] hover:text-[#ff9d85] transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}









