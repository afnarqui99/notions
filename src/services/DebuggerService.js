/**
 * Servicio de Debugging para proyectos Node.js y Python
 * Maneja conexiones con Chrome DevTools Protocol (Node.js) y Debug Adapter Protocol (Python)
 */

class DebuggerService {
  constructor() {
    this.debugSessions = new Map(); // projectId -> session
    this.breakpoints = new Map(); // projectId -> Set of breakpoints
    this.currentLine = new Map(); // projectId -> { file, line }
    this.variables = new Map(); // projectId -> variables
    this.callStack = new Map(); // projectId -> call stack
    this.watchExpressions = new Map(); // projectId -> watch expressions
  }

  /**
   * Iniciar sesión de debugging para un proyecto
   */
  async startDebugging(projectId, projectPath, projectType) {
    if (!window.electronAPI || !window.electronAPI.startDebugging) {
      throw new Error('Debugging solo está disponible en Electron');
    }

    try {
      const result = await window.electronAPI.startDebugging(projectPath, projectType);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const session = {
        id: projectId,
        projectPath,
        projectType,
        debugPort: result.debugPort,
        processId: result.processId,
        status: 'running', // running, paused, stopped
        connected: true
      };

      this.debugSessions.set(projectId, session);
      this.breakpoints.set(projectId, new Set());
      this.watchExpressions.set(projectId, []);

      // Escuchar eventos de debugging
      if (window.electronAPI.onDebugEvent) {
        window.electronAPI.onDebugEvent((event) => {
          if (event.projectId === projectId) {
            this.handleDebugEvent(projectId, event);
          }
        });
      }

      return session;
    } catch (error) {
      console.error('[DebuggerService] Error iniciando debugging:', error);
      throw error;
    }
  }

  /**
   * Detener sesión de debugging
   */
  async stopDebugging(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    try {
      if (window.electronAPI && window.electronAPI.stopDebugging) {
        await window.electronAPI.stopDebugging(projectId);
      }

      this.debugSessions.delete(projectId);
      this.breakpoints.delete(projectId);
      this.currentLine.delete(projectId);
      this.variables.delete(projectId);
      this.callStack.delete(projectId);
      this.watchExpressions.delete(projectId);
    } catch (error) {
      console.error('[DebuggerService] Error deteniendo debugging:', error);
    }
  }

  /**
   * Agregar breakpoint
   */
  async setBreakpoint(projectId, file, line, condition = null) {
    const session = this.debugSessions.get(projectId);
    if (!session) {
      throw new Error('No hay sesión de debugging activa');
    }

    const breakpointKey = `${file}:${line}`;
    const breakpoints = this.breakpoints.get(projectId);
    
    if (breakpoints.has(breakpointKey)) {
      // Ya existe, removerlo
      return await this.removeBreakpoint(projectId, file, line);
    }

    try {
      if (window.electronAPI && window.electronAPI.setBreakpoint) {
        const result = await window.electronAPI.setBreakpoint(projectId, file, line, condition);
        
        if (result.success) {
          breakpoints.add(breakpointKey);
          return { success: true, breakpointId: result.breakpointId };
        } else {
          throw new Error(result.error || 'Error al establecer breakpoint');
        }
      }
    } catch (error) {
      console.error('[DebuggerService] Error estableciendo breakpoint:', error);
      throw error;
    }
  }

  /**
   * Remover breakpoint
   */
  async removeBreakpoint(projectId, file, line) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    const breakpointKey = `${file}:${line}`;
    const breakpoints = this.breakpoints.get(projectId);
    
    if (!breakpoints.has(breakpointKey)) {
      return { success: true };
    }

    try {
      if (window.electronAPI && window.electronAPI.removeBreakpoint) {
        await window.electronAPI.removeBreakpoint(projectId, file, line);
        breakpoints.delete(breakpointKey);
        return { success: true };
      }
    } catch (error) {
      console.error('[DebuggerService] Error removiendo breakpoint:', error);
      throw error;
    }
  }

  /**
   * Continuar ejecución
   */
  async continue(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    try {
      if (window.electronAPI && window.electronAPI.debugContinue) {
        await window.electronAPI.debugContinue(projectId);
        session.status = 'running';
      }
    } catch (error) {
      console.error('[DebuggerService] Error continuando:', error);
      throw error;
    }
  }

  /**
   * Pausar ejecución
   */
  async pause(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    try {
      if (window.electronAPI && window.electronAPI.debugPause) {
        await window.electronAPI.debugPause(projectId);
        session.status = 'paused';
      }
    } catch (error) {
      console.error('[DebuggerService] Error pausando:', error);
      throw error;
    }
  }

  /**
   * Step Over
   */
  async stepOver(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    try {
      if (window.electronAPI && window.electronAPI.debugStepOver) {
        await window.electronAPI.debugStepOver(projectId);
      }
    } catch (error) {
      console.error('[DebuggerService] Error step over:', error);
      throw error;
    }
  }

  /**
   * Step Into
   */
  async stepInto(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    try {
      if (window.electronAPI && window.electronAPI.debugStepInto) {
        await window.electronAPI.debugStepInto(projectId);
      }
    } catch (error) {
      console.error('[DebuggerService] Error step into:', error);
      throw error;
    }
  }

  /**
   * Step Out
   */
  async stepOut(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    try {
      if (window.electronAPI && window.electronAPI.debugStepOut) {
        await window.electronAPI.debugStepOut(projectId);
      }
    } catch (error) {
      console.error('[DebuggerService] Error step out:', error);
      throw error;
    }
  }

  /**
   * Obtener variables locales
   */
  async getVariables(projectId, frameId = 0) {
    const session = this.debugSessions.get(projectId);
    if (!session) return [];

    try {
      if (window.electronAPI && window.electronAPI.getDebugVariables) {
        const variables = await window.electronAPI.getDebugVariables(projectId, frameId);
        this.variables.set(projectId, variables);
        return variables;
      }
    } catch (error) {
      console.error('[DebuggerService] Error obteniendo variables:', error);
    }
    return [];
  }

  /**
   * Obtener call stack
   */
  async getCallStack(projectId) {
    const session = this.debugSessions.get(projectId);
    if (!session) return [];

    try {
      if (window.electronAPI && window.electronAPI.getDebugCallStack) {
        const stack = await window.electronAPI.getDebugCallStack(projectId);
        this.callStack.set(projectId, stack);
        return stack;
      }
    } catch (error) {
      console.error('[DebuggerService] Error obteniendo call stack:', error);
    }
    return [];
  }

  /**
   * Evaluar expresión en el contexto actual
   */
  async evaluateExpression(projectId, expression) {
    const session = this.debugSessions.get(projectId);
    if (!session) return null;

    try {
      if (window.electronAPI && window.electronAPI.evaluateDebugExpression) {
        return await window.electronAPI.evaluateDebugExpression(projectId, expression);
      }
    } catch (error) {
      console.error('[DebuggerService] Error evaluando expresión:', error);
      throw error;
    }
  }

  /**
   * Agregar watch expression
   */
  addWatchExpression(projectId, expression) {
    const watches = this.watchExpressions.get(projectId) || [];
    if (!watches.includes(expression)) {
      watches.push(expression);
      this.watchExpressions.set(projectId, watches);
    }
  }

  /**
   * Remover watch expression
   */
  removeWatchExpression(projectId, expression) {
    const watches = this.watchExpressions.get(projectId) || [];
    const index = watches.indexOf(expression);
    if (index > -1) {
      watches.splice(index, 1);
      this.watchExpressions.set(projectId, watches);
    }
  }

  /**
   * Obtener watch expressions
   */
  getWatchExpressions(projectId) {
    return this.watchExpressions.get(projectId) || [];
  }

  /**
   * Obtener breakpoints de un proyecto
   */
  getBreakpoints(projectId) {
    const breakpoints = this.breakpoints.get(projectId);
    if (!breakpoints) return [];

    return Array.from(breakpoints).map(key => {
      const [file, line] = key.split(':');
      return { file, line: parseInt(line) };
    });
  }

  /**
   * Obtener sesión de debugging
   */
  getSession(projectId) {
    return this.debugSessions.get(projectId);
  }

  /**
   * Verificar si hay sesión activa
   */
  hasActiveSession(projectId) {
    const session = this.debugSessions.get(projectId);
    return session && session.connected;
  }

  /**
   * Manejar eventos de debugging
   */
  handleDebugEvent(projectId, event) {
    const session = this.debugSessions.get(projectId);
    if (!session) return;

    switch (event.type) {
      case 'breakpoint':
        session.status = 'paused';
        this.currentLine.set(projectId, { file: event.file, line: event.line });
        // Disparar evento para actualizar UI
        window.dispatchEvent(new CustomEvent('debugger-paused', {
          detail: { projectId, file: event.file, line: event.line }
        }));
        break;

      case 'exception':
        session.status = 'paused';
        this.currentLine.set(projectId, { file: event.file, line: event.line });
        window.dispatchEvent(new CustomEvent('debugger-exception', {
          detail: { projectId, file: event.file, line: event.line, exception: event.exception }
        }));
        break;

      case 'continue':
        session.status = 'running';
        this.currentLine.delete(projectId);
        window.dispatchEvent(new CustomEvent('debugger-continued', {
          detail: { projectId }
        }));
        break;

      case 'stopped':
        session.status = 'stopped';
        session.connected = false;
        window.dispatchEvent(new CustomEvent('debugger-stopped', {
          detail: { projectId }
        }));
        break;
    }
  }
}

// Exportar instancia singleton
const debuggerService = new DebuggerService();
export default debuggerService;









