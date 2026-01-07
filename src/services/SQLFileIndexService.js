/**
 * Servicio para mantener un índice optimizado de scripts SQL
 * Permite búsquedas rápidas sin cargar todos los archivos
 */

import LocalStorageService from './LocalStorageService';

class SQLFileIndexService {
  constructor() {
    this.indexCache = null;
    this.indexKey = '_sql-files-index';
  }

  /**
   * Obtener o crear el índice de archivos SQL
   */
  async getIndex() {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const index = await LocalStorageService.readJSONFile(
        `${this.indexKey}.json`,
        'data/sql-files'
      );
      
      if (index && index.files) {
        this.indexCache = index;
        return index;
      }
    } catch (error) {
      // El índice no existe
    }

    // Crear índice vacío
    this.indexCache = {
      files: [],
      lastUpdated: new Date().toISOString(),
      version: 1
    };
    return this.indexCache;
  }

  /**
   * Actualizar el índice con un archivo SQL
   */
  async updateFileInIndex(fileId, fileData) {
    const index = await this.getIndex();
    
    const fileEntry = {
      id: fileId,
      name: fileData.name || 'Sin nombre',
      description: fileData.description || '',
      pageId: fileData.pageId || null,
      pageName: fileData.pageName || null,
      version: fileData.version || null,
      createdAt: fileData.createdAt || new Date().toISOString(),
      updatedAt: fileData.updatedAt || new Date().toISOString(),
      // No guardamos el contenido completo en el índice
      // versionCount se actualiza cuando se guarda una versión
    };

    const existingIndex = index.files.findIndex(f => f.id === fileId);
    if (existingIndex >= 0) {
      index.files[existingIndex] = { ...index.files[existingIndex], ...fileEntry };
    } else {
      index.files.push(fileEntry);
    }

    index.lastUpdated = new Date().toISOString();
    this.indexCache = index;

    // Guardar índice (de forma asíncrona)
    this.saveIndex(index).catch(err => {
      console.error('Error guardando índice SQL:', err);
    });

    return index;
  }

  /**
   * Actualizar contador de versiones
   */
  async updateVersionCount(fileId, count) {
    const index = await this.getIndex();
    const file = index.files.find(f => f.id === fileId);
    if (file) {
      file.versionCount = count;
      file.lastVersionTimestamp = new Date().toISOString();
      index.lastUpdated = new Date().toISOString();
      this.indexCache = index;
      await this.saveIndex(index);
    }
  }

  /**
   * Remover archivo del índice
   */
  async removeFileFromIndex(fileId) {
    const index = await this.getIndex();
    index.files = index.files.filter(f => f.id !== fileId);
    index.lastUpdated = new Date().toISOString();
    this.indexCache = index;

    await this.saveIndex(index);
    return index;
  }

  /**
   * Guardar índice
   */
  async saveIndex(index) {
    try {
      await LocalStorageService.saveJSONFile(
        `${this.indexKey}.json`,
        index,
        'data/sql-files'
      );
    } catch (error) {
      console.error('Error guardando índice SQL:', error);
    }
  }

  /**
   * Buscar archivos en el índice (rápido, sin cargar contenido)
   */
  async searchFiles(query, options = {}) {
    const index = await this.getIndex();
    const { limit = 50, offset = 0, pageId = null } = options;
    
    let results = index.files;

    // Filtrar por página si se especifica
    if (pageId) {
      results = results.filter(f => f.pageId === pageId);
    }

    // Filtrar por búsqueda
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(file => 
        (file.name || '').toLowerCase().includes(queryLower) ||
        (file.description || '').toLowerCase().includes(queryLower) ||
        (file.pageName || '').toLowerCase().includes(queryLower)
      );
    }

    // Ordenar por fecha de actualización
    results.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    // Paginación
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      files: paginated,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Obtener archivos paginados
   */
  async getFilesPaginated(options = {}) {
    const { limit = 50, offset = 0, pageId = null } = options;
    
    const index = await this.getIndex();
    let results = index.files;

    // Filtrar por página si se especifica
    if (pageId !== null) {
      results = results.filter(f => f.pageId === pageId);
    }

    // Ordenar por fecha de actualización
    results.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    // Paginación
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      files: paginated,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Invalidar caché del índice
   */
  invalidateCache() {
    this.indexCache = null;
  }

  /**
   * Obtener estadísticas del índice
   */
  async getStats() {
    const index = await this.getIndex();
    return {
      totalFiles: index.files.length,
      lastUpdated: index.lastUpdated,
      version: index.version
    };
  }
}

export default new SQLFileIndexService();

