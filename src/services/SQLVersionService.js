/**
 * Servicio para manejar el versionado de scripts SQL
 */

import LocalStorageService from './LocalStorageService';

class SQLVersionService {
  constructor() {
    this.maxVersions = 100; // Número máximo de versiones a mantener por script
  }

  /**
   * Crear una versión de un script SQL
   */
  async createVersion(scriptId, scriptData) {
    if (!scriptId || !scriptData) {
      throw new Error('scriptId y scriptData son requeridos');
    }

    try {
      const version = {
        id: `${scriptId}-${Date.now()}`,
        scriptId: scriptId,
        timestamp: new Date().toISOString(),
        version: scriptData.version || null, // Versión personalizada (opcional)
        content: scriptData.content || '',
        metadata: {
          contentLength: (scriptData.content || '').length,
          lineCount: (scriptData.content || '').split('\n').length,
        }
      };

      // Sanitizar el ID para usar como nombre de archivo
      const sanitizedId = version.id.replace(/[<>:"/\\|?*]/g, '_');
      
      // Guardar versión en el subdirectorio sql-versions
      await LocalStorageService.saveJSONFile(
        `${sanitizedId}.json`,
        version,
        'data/sql-versions'
      );

      // Actualizar índice de versiones
      await this.updateVersionIndex(scriptId, version.id);

      // Actualizar contador en SQLFileIndexService
      try {
        const SQLFileIndexService = (await import('./SQLFileIndexService')).default;
        const versionIndex = await this.getVersionIndex(scriptId);
        const count = versionIndex?.versions?.length || 0;
        await SQLFileIndexService.updateVersionCount(scriptId, count);
      } catch (error) {
        // Ignorar error si el servicio no está disponible
      }

      return version;
    } catch (error) {
      console.error('Error creando versión SQL:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las versiones de un script SQL
   */
  async getVersions(scriptId) {
    if (!scriptId) return [];

    try {
      const index = await this.getVersionIndex(scriptId);
      if (!index || !index.versions || index.versions.length === 0) {
        return [];
      }

      // Cargar todas las versiones
      const versions = await Promise.all(
        index.versions.map(async (versionId) => {
          try {
            const sanitizedId = versionId.replace(/[<>:"/\\|?*]/g, '_');
            const version = await LocalStorageService.readJSONFile(
              `${sanitizedId}.json`,
              'data/sql-versions'
            );
            return version;
          } catch (error) {
            console.error(`Error cargando versión ${versionId}:`, error);
            return null;
          }
        })
      );

      // Filtrar versiones nulas y ordenar por timestamp descendente
      return versions
        .filter(v => v !== null)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error obteniendo versiones SQL:', error);
      return [];
    }
  }

  /**
   * Obtener una versión específica
   */
  async getVersion(versionId) {
    try {
      const sanitizedId = versionId.replace(/[<>:"/\\|?*]/g, '_');
      const version = await LocalStorageService.readJSONFile(
        `${sanitizedId}.json`,
        'data/sql-versions'
      );
      return version;
    } catch (error) {
      console.error(`Error obteniendo versión ${versionId}:`, error);
      return null;
    }
  }

  /**
   * Comparar dos versiones (diff simple)
   */
  compareVersions(version1, version2) {
    if (!version1 || !version2) {
      return null;
    }

    const content1 = version1.content || '';
    const content2 = version2.content || '';
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const changes = {
      added: [],
      removed: [],
      modified: [],
      unchanged: [],
    };

    // Algoritmo simple de diff línea por línea
    const maxLen = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= lines1.length) {
        changes.added.push({ line: i + 1, content: lines2[i] });
      } else if (i >= lines2.length) {
        changes.removed.push({ line: i + 1, content: lines1[i] });
      } else if (lines1[i] !== lines2[i]) {
        changes.modified.push({
          line: i + 1,
          oldContent: lines1[i],
          newContent: lines2[i],
        });
      } else {
        changes.unchanged.push({ line: i + 1, content: lines1[i] });
      }
    }

    return {
      ...changes,
      totalChanges: changes.added.length + changes.removed.length + changes.modified.length,
    };
  }

  /**
   * Obtener índice de versiones para un script
   */
  async getVersionIndex(scriptId) {
    try {
      const index = await LocalStorageService.readJSONFile(
        `_index.json`,
        'data/sql-versions'
      );
      return index?.[scriptId] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Actualizar índice de versiones
   */
  async updateVersionIndex(scriptId, newVersionId, versionIds = null) {
    try {
      let index = {};
      try {
        index = await LocalStorageService.readJSONFile(
          `_index.json`,
          'data/sql-versions'
        ) || {};
      } catch (error) {
        // El índice no existe, crear uno nuevo
        index = {};
      }

      if (!index[scriptId]) {
        index[scriptId] = {
          scriptId: scriptId,
          versions: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      if (versionIds !== null) {
        // Reemplazar lista de versiones
        index[scriptId].versions = versionIds;
      } else if (newVersionId) {
        // Agregar nueva versión
        if (!index[scriptId].versions.includes(newVersionId)) {
          index[scriptId].versions.push(newVersionId);
        }
      }

      index[scriptId].lastUpdated = new Date().toISOString();

      // Limitar número de versiones en el índice
      if (index[scriptId].versions.length > this.maxVersions) {
        index[scriptId].versions = index[scriptId].versions.slice(-this.maxVersions);
      }

      await LocalStorageService.saveJSONFile(
        `_index.json`,
        index,
        'data/sql-versions'
      );
    } catch (error) {
      console.error('Error actualizando índice de versiones SQL:', error);
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Hace unos momentos';
    } else if (diffMins < 60) {
      return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
}

export default new SQLVersionService();

