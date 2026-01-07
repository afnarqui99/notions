/**
 * Servicio para mantener un índice optimizado de páginas
 * Permite búsquedas rápidas sin cargar todas las páginas
 */

import LocalStorageService from './LocalStorageService';

class PageIndexService {
  constructor() {
    this.indexCache = null;
    this.indexKey = '_pages-index';
    this.lastIndexUpdate = null;
  }

  /**
   * Obtener o crear el índice de páginas
   */
  async getIndex() {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const index = await LocalStorageService.readJSONFile(
        `${this.indexKey}.json`,
        'data'
      );
      
      if (index && index.pages) {
        this.indexCache = index;
        this.lastIndexUpdate = index.lastUpdated;
        return index;
      }
    } catch (error) {
      // El índice no existe, crear uno nuevo
    }

    // Crear índice vacío
    this.indexCache = {
      pages: [],
      lastUpdated: new Date().toISOString(),
      version: 1
    };
    return this.indexCache;
  }

  /**
   * Actualizar el índice con una página
   */
  async updatePageInIndex(pageId, pageData) {
    const index = await this.getIndex();
    
    const pageEntry = {
      id: pageId,
      titulo: pageData.titulo || 'Sin título',
      emoji: pageData.emoji || null,
      parentId: pageData.parentId || null,
      tags: pageData.tags || [],
      creadoEn: pageData.creadoEn || new Date().toISOString(),
      actualizadoEn: pageData.actualizadoEn || new Date().toISOString(),
      // No guardamos el contenido completo en el índice
    };

    const existingIndex = index.pages.findIndex(p => p.id === pageId);
    if (existingIndex >= 0) {
      index.pages[existingIndex] = pageEntry;
    } else {
      index.pages.push(pageEntry);
    }

    index.lastUpdated = new Date().toISOString();
    this.indexCache = index;

    // Guardar índice (de forma asíncrona, no bloquear)
    this.saveIndex(index).catch(err => {
      console.error('Error guardando índice:', err);
    });

    return index;
  }

  /**
   * Remover página del índice
   */
  async removePageFromIndex(pageId) {
    const index = await this.getIndex();
    index.pages = index.pages.filter(p => p.id !== pageId);
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
        'data'
      );
    } catch (error) {
      console.error('Error guardando índice de páginas:', error);
    }
  }

  /**
   * Buscar páginas en el índice (rápido, sin cargar contenido)
   */
  async searchPages(query, options = {}) {
    const index = await this.getIndex();
    const { limit = 50, offset = 0, sortBy = 'actualizadoEn', parentId = null } = options;
    
    let results = index.pages;
    
    // Filtrar por parentId si se especifica
    if (parentId !== null && parentId !== undefined) {
      results = results.filter(p => p.parentId === parentId);
    }

    // Filtrar por búsqueda
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(page => 
        (page.titulo || '').toLowerCase().includes(queryLower) ||
        (page.tags || []).some(tag => tag.toLowerCase().includes(queryLower))
      );
    }

    // Ordenar
    results.sort((a, b) => {
      if (sortBy === 'actualizadoEn' || sortBy === 'creadoEn') {
        const dateA = new Date(a[sortBy] || 0);
        const dateB = new Date(b[sortBy] || 0);
        return dateB - dateA;
      }
      if (sortBy === 'titulo') {
        return (a.titulo || '').localeCompare(b.titulo || '');
      }
      return 0;
    });

    // Paginación
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      pages: paginated,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Obtener páginas paginadas
   */
  async getPagesPaginated(options = {}) {
    const { limit = 50, offset = 0, sortBy = 'actualizadoEn', parentId = null } = options;
    
    const index = await this.getIndex();
    let results = index.pages;

    // Filtrar por parentId si se especifica
    if (parentId !== null && parentId !== undefined) {
      results = results.filter(p => p.parentId === parentId);
    }

    // Ordenar
    results.sort((a, b) => {
      if (sortBy === 'actualizadoEn' || sortBy === 'creadoEn') {
        const dateA = new Date(a[sortBy] || 0);
        const dateB = new Date(b[sortBy] || 0);
        return dateB - dateA;
      }
      if (sortBy === 'titulo') {
        return (a.titulo || '').localeCompare(b.titulo || '');
      }
      return 0;
    });

    // Paginación
    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return {
      pages: paginated,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Reconstruir índice completo (usar solo cuando sea necesario)
   */
  async rebuildIndex() {
    try {
      const files = await LocalStorageService.listFiles('data');
      const pages = [];

      // Procesar en lotes para no bloquear
      const batchSize = 100;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const filtered = batch.filter(f => f.endsWith('.json') && !f.startsWith('quick-note-') && !f.startsWith('_'));
        
        const batchData = await Promise.all(
          filtered.map(async (file) => {
            try {
              const data = await LocalStorageService.readJSONFile(file, 'data');
              // El ID es el nombre del archivo sin la extensión .json
              const pageId = file.replace('.json', '');
              
              // Verificar que no sea una nota rápida
              if (data && data.id && data.id.startsWith('quick-note-')) {
                return null;
              }
              
              // Si el archivo existe y no es una nota rápida, indexarlo
              if (data) {
                const pageEntry = {
                  id: pageId, // Usar el nombre del archivo como ID
                  titulo: data.titulo || 'Sin título',
                  emoji: data.emoji || null,
                  parentId: data.parentId || null,
                  tags: data.tags || [],
                  creadoEn: data.creadoEn || new Date().toISOString(),
                  actualizadoEn: data.actualizadoEn || new Date().toISOString(),
                };
                return pageEntry;
              }
              return null;
            } catch (error) {
              return null;
            }
          })
        );

        const validPages = batchData.filter(p => p !== null);
        pages.push(...validPages);
      }

      const index = {
        pages,
        lastUpdated: new Date().toISOString(),
        version: 1
      };

      await this.saveIndex(index);
      this.indexCache = index;
      
      return index;
    } catch (error) {
      console.error('Error reconstruyendo índice:', error);
      throw error;
    }
  }

  /**
   * Invalidar caché del índice
   */
  invalidateCache() {
    this.indexCache = null;
    this.lastIndexUpdate = null;
  }

  /**
   * Obtener estadísticas del índice
   */
  async getStats() {
    const index = await this.getIndex();
    return {
      totalPages: index.pages.length,
      lastUpdated: index.lastUpdated,
      version: index.version
    };
  }
}

export default new PageIndexService();

