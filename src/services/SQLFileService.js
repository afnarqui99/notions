/**
 * Servicio para manejar archivos SQL con versionado
 */

import LocalStorageService from './LocalStorageService';
import SQLVersionService from './SQLVersionService';
import SQLFileIndexService from './SQLFileIndexService';

class SQLFileService {
  constructor() {
    this.filesIndexKey = 'sql-files-index';
  }

  /**
   * Obtener todos los archivos SQL (DEPRECADO - usar getFilesPaginated)
   * Mantenido para compatibilidad
   */
  async getAllFiles() {
    const result = await this.getFilesPaginated({ limit: 1000 });
    return result.files;
  }

  /**
   * Obtener archivos SQL paginados (OPTIMIZADO)
   */
  async getFilesPaginated(options = {}) {
    const { limit = 50, offset = 0, pageId = null } = options;
    
    // Usar índice para obtener metadatos rápidamente
    const indexResult = await SQLFileIndexService.getFilesPaginated({
      limit,
      offset,
      pageId
    });

    // Cargar solo los archivos necesarios (contenido completo solo si se necesita)
    const files = await Promise.all(
      indexResult.files.map(async (fileEntry) => {
        try {
          // Cargar archivo completo solo para obtener versionCount
          const file = await this.getFile(fileEntry.id);
          if (file) {
            // Obtener solo el conteo de versiones (sin cargar todas)
            const versionIndex = await SQLVersionService.getVersionIndex(fileEntry.id);
            const versionCount = versionIndex?.versions?.length || 0;
            
            // Obtener última versión solo si hay versiones
            let lastVersion = null;
            if (versionCount > 0 && versionIndex.versions.length > 0) {
              try {
                const lastVersionId = versionIndex.versions[versionIndex.versions.length - 1];
                const versionData = await SQLVersionService.getVersion(lastVersionId);
                if (versionData) {
                  lastVersion = {
                    version: versionData.version,
                    timestamp: versionData.timestamp,
                    contentLength: versionData.metadata?.contentLength || 0,
                  };
                }
              } catch (error) {
                // Ignorar error al cargar última versión
              }
            }

            return {
              ...file,
              ...fileEntry,
              lastVersion,
              versionCount,
            };
          }
          return { ...fileEntry, versionCount: 0 };
        } catch (error) {
          console.error(`Error cargando archivo ${fileEntry.id}:`, error);
          return { ...fileEntry, versionCount: 0 };
        }
      })
    );

    return {
      files: files.filter(f => f !== null),
      total: indexResult.total,
      hasMore: indexResult.hasMore
    };
  }

  /**
   * Buscar archivos por nombre (OPTIMIZADO - usa índice)
   */
  async searchFiles(query, options = {}) {
    return await SQLFileIndexService.searchFiles(query, options);
  }

  /**
   * Obtener scripts SQL asociados a una página
   */
  async getFilesByPage(pageId) {
    return await SQLFileIndexService.getFilesPaginated({ pageId, limit: 1000 });
  }

  /**
   * Obtener todas las páginas disponibles (OPTIMIZADO - usa PageIndexService)
   */
  async getAllPages() {
    try {
      const PageIndexService = (await import('./PageIndexService')).default;
      const result = await PageIndexService.searchPages('', { limit: 10000 });
      return result.pages.map(p => ({
        id: p.id,
        titulo: p.titulo || 'Sin título',
        emoji: p.emoji || null,
      }));
    } catch (error) {
      console.error('Error obteniendo páginas:', error);
      return [];
    }
  }

  /**
   * Obtener archivos SQL por página
   */
  async getFilesByPage(pageId) {
    const allFiles = await this.getAllFiles();
    return allFiles.filter(file => file.pageId === pageId);
  }

  /**
   * Crear o actualizar un archivo SQL
   */
  async saveFile(fileId, fileData) {
    try {
      const file = {
        id: fileId,
        name: fileData.name || 'Sin nombre',
        description: fileData.description || '',
        tags: fileData.tags || [],
        content: fileData.content || '',
        version: fileData.version || '',
        pageId: fileData.pageId || null,
        pageName: fileData.pageName || null,
        createdAt: fileData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Guardar archivo
      const sanitizedId = fileId.replace(/[<>:"/\\|?*]/g, '_');
      await LocalStorageService.saveJSONFile(
        `${sanitizedId}.json`,
        file,
        'data/sql-files'
      );

      // Actualizar índice optimizado
      await SQLFileIndexService.updateFileInIndex(fileId, file);
      
      // Actualizar índice legacy (para compatibilidad)
      await this.updateFilesIndex(fileId);

      return file;
    } catch (error) {
      console.error('Error guardando archivo SQL:', error);
      throw error;
    }
  }

  /**
   * Obtener un archivo por ID
   */
  async getFile(fileId) {
    try {
      const sanitizedId = fileId.replace(/[<>:"/\\|?*]/g, '_');
      const file = await LocalStorageService.readJSONFile(
        `${sanitizedId}.json`,
        'data/sql-files'
      );
      return file;
    } catch (error) {
      console.error(`Error obteniendo archivo ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Eliminar un archivo SQL
   */
  async deleteFile(fileId) {
    try {
      const sanitizedId = fileId.replace(/[<>:"/\\|?*]/g, '_');
      
      // Eliminar archivo
      await LocalStorageService.deleteJSONFile(
        `${sanitizedId}.json`,
        'data/sql-files'
      );

      // Eliminar todas las versiones
      const versions = await SQLVersionService.getVersions(fileId);
      for (const version of versions) {
        try {
          const versionSanitizedId = version.id.replace(/[<>:"/\\|?*]/g, '_');
          await LocalStorageService.deleteJSONFile(
            `${versionSanitizedId}.json`,
            'data/sql-versions'
          );
        } catch (error) {
          console.error(`Error eliminando versión ${version.id}:`, error);
        }
      }

      // Actualizar índices
      await SQLFileIndexService.removeFileFromIndex(fileId);
      await this.removeFromFilesIndex(fileId);

      return true;
    } catch (error) {
      console.error(`Error eliminando archivo ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar índice de archivos
   */
  async updateFilesIndex(fileId) {
    try {
      let index = {};
      try {
        index = await LocalStorageService.readJSONFile(
          `_index.json`,
          'data/sql-files'
        ) || {};
      } catch (error) {
        index = {};
      }

      if (!index.files) {
        index.files = [];
      }

      if (!index.files.includes(fileId)) {
        index.files.push(fileId);
      }

      index.lastUpdated = new Date().toISOString();

      await LocalStorageService.saveJSONFile(
        `_index.json`,
        index,
        'data/sql-files'
      );
    } catch (error) {
      console.error('Error actualizando índice de archivos SQL:', error);
    }
  }

  /**
   * Remover archivo del índice
   */
  async removeFromFilesIndex(fileId) {
    try {
      const index = await LocalStorageService.readJSONFile(
        `_index.json`,
        'data/sql-files'
      ) || {};

      if (index.files) {
        index.files = index.files.filter(id => id !== fileId);
      }

      index.lastUpdated = new Date().toISOString();

      await LocalStorageService.saveJSONFile(
        `_index.json`,
        index,
        'data/sql-files'
      );
    } catch (error) {
      console.error('Error removiendo archivo del índice:', error);
    }
  }

  /**
   * Generar ID único para un archivo
   */
  generateFileId(name = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const nameSlug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 20);
    
    return `sql-${nameSlug || 'file'}-${timestamp}-${random}`;
  }
}

export default new SQLFileService();

