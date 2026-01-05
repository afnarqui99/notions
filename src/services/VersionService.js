/**
 * Servicio para manejar el versionado y historial de páginas
 */

import LocalStorageService from './LocalStorageService';

class VersionService {
  constructor() {
    this.maxVersions = 50; // Número máximo de versiones a mantener por página
  }

  /**
   * Crear un snapshot de una página
   */
  async createSnapshot(pageId, pageData) {
    if (!pageId || !pageData) {
      throw new Error('pageId y pageData son requeridos');
    }

    try {
      const snapshot = {
        id: `${pageId}-${Date.now()}`,
        pageId: pageId,
        timestamp: new Date().toISOString(),
        title: pageData.titulo || 'Sin título',
        content: pageData.contenido || null,
        tags: pageData.tags || [],
        emoji: pageData.emoji || null,
        metadata: {
          contentLength: JSON.stringify(pageData.contenido || {}).length,
          blockCount: this.countBlocks(pageData.contenido || {}),
        }
      };

      // Guardar snapshot
      await LocalStorageService.saveJSONFile(
        `versions/${snapshot.id}.json`,
        snapshot,
        'data'
      );

      // Actualizar índice de versiones
      await this.updateVersionIndex(pageId, snapshot.id);

      return snapshot;
    } catch (error) {
      console.error('Error creando snapshot:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las versiones de una página
   */
  async getVersions(pageId) {
    if (!pageId) return [];

    try {
      const index = await this.getVersionIndex(pageId);
      if (!index || !index.versions || index.versions.length === 0) {
        return [];
      }

      // Cargar todas las versiones
      const versions = await Promise.all(
        index.versions.map(async (versionId) => {
          try {
            const version = await LocalStorageService.readJSONFile(
              `versions/${versionId}.json`,
              'data'
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
      console.error('Error obteniendo versiones:', error);
      return [];
    }
  }

  /**
   * Obtener una versión específica
   */
  async getVersion(versionId) {
    try {
      const version = await LocalStorageService.readJSONFile(
        `versions/${versionId}.json`,
        'data'
      );
      return version;
    } catch (error) {
      console.error(`Error obteniendo versión ${versionId}:`, error);
      return null;
    }
  }

  /**
   * Restaurar una versión a una página
   */
  async restoreVersion(pageId, versionId) {
    try {
      const version = await this.getVersion(versionId);
      if (!version) {
        throw new Error('Versión no encontrada');
      }

      // Cargar datos actuales de la página
      const currentPageData = await LocalStorageService.readJSONFile(
        `${pageId}.json`,
        'data'
      );

      if (!currentPageData) {
        throw new Error('Página no encontrada');
      }

      // Crear snapshot de la versión actual antes de restaurar
      await this.createSnapshot(pageId, currentPageData);

      // Restaurar la versión
      const restoredData = {
        ...currentPageData,
        contenido: version.content,
        titulo: version.title,
        tags: version.tags || [],
        emoji: version.emoji || null,
        actualizadoEn: new Date().toISOString(),
      };

      // Guardar página restaurada
      await LocalStorageService.saveJSONFile(
        `${pageId}.json`,
        restoredData,
        'data'
      );

      return restoredData;
    } catch (error) {
      console.error('Error restaurando versión:', error);
      throw error;
    }
  }

  /**
   * Comparar dos versiones
   */
  compareVersions(version1, version2) {
    if (!version1 || !version2) {
      return null;
    }

    const changes = {
      titleChanged: version1.title !== version2.title,
      contentChanged: JSON.stringify(version1.content) !== JSON.stringify(version2.content),
      tagsChanged: JSON.stringify(version1.tags || []) !== JSON.stringify(version2.tags || []),
      emojiChanged: version1.emoji !== version2.emoji,
      metadata: {
        version1: version1.metadata || {},
        version2: version2.metadata || {},
      }
    };

    return changes;
  }

  /**
   * Eliminar versiones antiguas (mantener solo las últimas N versiones)
   */
  async cleanupOldVersions(pageId) {
    try {
      const versions = await this.getVersions(pageId);
      
      if (versions.length <= this.maxVersions) {
        return; // No hay que limpiar nada
      }

      // Ordenar por timestamp (más antiguas primero)
      const sortedVersions = versions.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Eliminar las versiones más antiguas
      const versionsToDelete = sortedVersions.slice(0, versions.length - this.maxVersions);
      
      for (const version of versionsToDelete) {
        try {
          await LocalStorageService.deleteJSONFile(
            `versions/${version.id}.json`,
            'data'
          );
        } catch (error) {
          console.error(`Error eliminando versión ${version.id}:`, error);
        }
      }

      // Actualizar índice
      const remainingVersions = sortedVersions.slice(versions.length - this.maxVersions);
      await this.updateVersionIndex(pageId, null, remainingVersions.map(v => v.id));
    } catch (error) {
      console.error('Error limpiando versiones antiguas:', error);
    }
  }

  /**
   * Eliminar todas las versiones de una página
   */
  async deleteAllVersions(pageId) {
    try {
      const versions = await this.getVersions(pageId);
      
      for (const version of versions) {
        try {
          await LocalStorageService.deleteJSONFile(
            `versions/${version.id}.json`,
            'data'
          );
        } catch (error) {
          console.error(`Error eliminando versión ${version.id}:`, error);
        }
      }

      // Eliminar índice
      await this.deleteVersionIndex(pageId);
    } catch (error) {
      console.error('Error eliminando versiones:', error);
    }
  }

  /**
   * Obtener índice de versiones para una página
   */
  async getVersionIndex(pageId) {
    try {
      const index = await LocalStorageService.readJSONFile(
        `versions/_index.json`,
        'data'
      );
      return index?.[pageId] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Actualizar índice de versiones
   */
  async updateVersionIndex(pageId, newVersionId, versionIds = null) {
    try {
      let index = {};
      try {
        index = await LocalStorageService.readJSONFile(
          `versions/_index.json`,
          'data'
        ) || {};
      } catch (error) {
        // El índice no existe, crear uno nuevo
        index = {};
      }

      if (!index[pageId]) {
        index[pageId] = {
          pageId: pageId,
          versions: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      if (versionIds !== null) {
        // Reemplazar lista de versiones
        index[pageId].versions = versionIds;
      } else if (newVersionId) {
        // Agregar nueva versión
        if (!index[pageId].versions.includes(newVersionId)) {
          index[pageId].versions.push(newVersionId);
        }
      }

      index[pageId].lastUpdated = new Date().toISOString();

      // Limitar número de versiones en el índice
      if (index[pageId].versions.length > this.maxVersions) {
        index[pageId].versions = index[pageId].versions.slice(-this.maxVersions);
      }

      await LocalStorageService.saveJSONFile(
        `versions/_index.json`,
        index,
        'data'
      );
    } catch (error) {
      console.error('Error actualizando índice de versiones:', error);
    }
  }

  /**
   * Eliminar índice de versiones para una página
   */
  async deleteVersionIndex(pageId) {
    try {
      const index = await LocalStorageService.readJSONFile(
        `versions/_index.json`,
        'data'
      ) || {};

      delete index[pageId];

      await LocalStorageService.saveJSONFile(
        `versions/_index.json`,
        index,
        'data'
      );
    } catch (error) {
      console.error('Error eliminando índice de versiones:', error);
    }
  }

  /**
   * Contar bloques en el contenido
   */
  countBlocks(content) {
    if (!content || !content.content) return 0;
    
    let count = 0;
    const countRecursive = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach(node => {
        count++;
        if (node.content && Array.isArray(node.content)) {
          countRecursive(node.content);
        }
      });
    };
    
    countRecursive(content.content);
    return count;
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

export default new VersionService();

