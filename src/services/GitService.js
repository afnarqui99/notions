/**
 * Servicio para interactuar con Git
 * Proporciona funciones para obtener información de Git y ejecutar comandos
 */

class GitService {
  constructor() {
    this.isElectron = typeof window !== 'undefined' && window.electronAPI;
  }

  // Verificar si un directorio es un repositorio git
  async isGitRepository(directory) {
    if (!this.isElectron || !directory) return false;

    try {
      const result = await window.electronAPI.executeCommand(
        'git rev-parse --git-dir',
        'bash',
        directory,
        null // terminalId
      );
      return result && result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }

  // Obtener la rama actual
  async getCurrentBranch(directory) {
    if (!this.isElectron || !directory) return null;

    try {
      const result = await window.electronAPI.executeCommand(
        'git branch --show-current',
        'bash',
        directory,
        null // terminalId
      );
      
      if (result && result.exitCode === 0 && result.output) {
        return result.output.trim();
      }
      return null;
    } catch (error) {
      console.error('[GitService] Error obteniendo rama:', error);
      return null;
    }
  }

  // Obtener el estado de git (archivos modificados, staged, etc.)
  async getStatus(directory) {
    if (!this.isElectron || !directory) return null;

    try {
      const result = await window.electronAPI.executeCommand(
        'git status --porcelain',
        'bash',
        directory,
        null // terminalId
      );

      if (!result || result.exitCode !== 0) {
        return null;
      }

      const lines = result.output.trim().split('\n').filter(line => line.trim());
      const status = {
        modified: [],
        added: [],
        deleted: [],
        renamed: [],
        staged: [],
        unstaged: [],
        untracked: []
      };

      lines.forEach(line => {
        const statusCode = line.substring(0, 2);
        const file = line.substring(3);

        // Códigos de estado:
        // XY donde X = staged, Y = working tree
        // M = modified, A = added, D = deleted, R = renamed, ?? = untracked
        
        if (statusCode === '??') {
          status.untracked.push(file);
        } else {
          const staged = statusCode[0];
          const working = statusCode[1];

          if (staged === 'M' || staged === 'A') {
            status.staged.push(file);
            if (staged === 'M') status.modified.push(file);
            if (staged === 'A') status.added.push(file);
          }
          if (staged === 'D') {
            status.staged.push(file);
            status.deleted.push(file);
          }
          if (staged === 'R') {
            const parts = file.split(' -> ');
            status.renamed.push({ from: parts[0], to: parts[1] || parts[0] });
            status.staged.push(parts[1] || parts[0]);
          }

          if (working === 'M') {
            status.unstaged.push(file);
            if (!status.modified.includes(file)) {
              status.modified.push(file);
            }
          }
          if (working === 'D') {
            status.unstaged.push(file);
            if (!status.deleted.includes(file)) {
              status.deleted.push(file);
            }
          }
        }
      });

      return status;
    } catch (error) {
      console.error('[GitService] Error obteniendo status:', error);
      return null;
    }
  }

  // Obtener diferencias de un archivo
  async getFileDiff(directory, filePath) {
    if (!this.isElectron || !directory || !filePath) return null;

    try {
      const result = await window.electronAPI.executeCommand(
        `git diff "${filePath}"`,
        'bash',
        directory,
        null // terminalId
      );

      if (result && result.exitCode === 0) {
        return result.output;
      }

      // Si no hay diff en working tree, intentar staged
      const stagedResult = await window.electronAPI.executeCommand(
        `git diff --staged "${filePath}"`,
        'bash',
        directory,
        null // terminalId
      );

      if (stagedResult && stagedResult.exitCode === 0) {
        return stagedResult.output;
      }

      return null;
    } catch (error) {
      console.error('[GitService] Error obteniendo diff:', error);
      return null;
    }
  }

  // Agregar archivo al stage
  async addFile(directory, filePath) {
    if (!this.isElectron || !directory || !filePath) return false;

    try {
      const result = await window.electronAPI.executeCommand(
        `git add "${filePath}"`,
        'bash',
        directory,
        null // terminalId
      );
      return result && result.exitCode === 0;
    } catch (error) {
      console.error('[GitService] Error agregando archivo:', error);
      return false;
    }
  }

  // Remover archivo del stage
  async unstageFile(directory, filePath) {
    if (!this.isElectron || !directory || !filePath) return false;

    try {
      const result = await window.electronAPI.executeCommand(
        `git reset HEAD "${filePath}"`,
        'bash',
        directory,
        null // terminalId
      );
      return result && result.exitCode === 0;
    } catch (error) {
      console.error('[GitService] Error removiendo archivo del stage:', error);
      return false;
    }
  }

  // Hacer commit
  async commit(directory, message) {
    if (!this.isElectron || !directory || !message) return false;

    try {
      const result = await window.electronAPI.executeCommand(
        `git commit -m "${message.replace(/"/g, '\\"')}"`,
        'bash',
        directory,
        null // terminalId
      );
      return result && result.exitCode === 0;
    } catch (error) {
      console.error('[GitService] Error haciendo commit:', error);
      return false;
    }
  }

  // Obtener información completa del repositorio
  async getRepositoryInfo(directory) {
    if (!this.isElectron || !directory) return null;

    const isRepo = await this.isGitRepository(directory);
    if (!isRepo) {
      return null;
    }

    const branch = await this.getCurrentBranch(directory);
    const status = await this.getStatus(directory);

    return {
      branch,
      status,
      isRepository: true
    };
  }

  // Obtener el directorio raíz del repositorio git
  async getRepositoryRoot(directory) {
    if (!this.isElectron || !directory) return null;

    try {
      const result = await window.electronAPI.executeCommand(
        'git rev-parse --show-toplevel',
        'bash',
        directory,
        null // terminalId
      );

      if (result && result.exitCode === 0 && result.output) {
        return result.output.trim();
      }
      return null;
    } catch (error) {
      console.error('[GitService] Error obteniendo root:', error);
      return null;
    }
  }

  // Obtener el contenido original del archivo desde git (HEAD)
  async getOriginalFileContent(directory, filePath) {
    if (!this.isElectron || !directory || !filePath) return null;

    try {
      const result = await window.electronAPI.executeCommand(
        `git show HEAD:"${filePath}"`,
        'bash',
        directory,
        null // terminalId
      );

      if (result && result.exitCode === 0 && result.output) {
        return result.output;
      }
      return null;
    } catch (error) {
      console.error('[GitService] Error obteniendo contenido original:', error);
      return null;
    }
  }

  // Obtener el contenido actual del archivo
  async getCurrentFileContent(directory, filePath) {
    if (!this.isElectron || !directory || !filePath) return null;

    try {
      // Construir la ruta completa
      const fullPath = filePath.startsWith(directory) 
        ? filePath 
        : `${directory}/${filePath}`.replace(/\/+/g, '/');
      
      if (window.electronAPI.readFile) {
        const result = await window.electronAPI.readFile(fullPath);
        
        // readFile devuelve { content: string } o { error: string }
        if (result && typeof result === 'object') {
          if (result.error) {
            console.error('[GitService] Error leyendo archivo:', result.error);
            return null;
          }
          if (result.content !== undefined) {
            return result.content;
          }
        }
        
        // Si es una cadena directamente (por compatibilidad)
        if (typeof result === 'string') {
          return result;
        }
        
        return null;
      }
      return null;
    } catch (error) {
      console.error('[GitService] Error obteniendo contenido actual:', error);
      return null;
    }
  }
}

export default new GitService();

