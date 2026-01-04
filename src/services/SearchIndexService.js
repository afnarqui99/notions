/**
 * Servicio de indexación para búsqueda global
 * Indexa páginas, eventos de calendario y tablas para búsqueda rápida
 */

import LocalStorageService from './LocalStorageService';
import CalendarEventService from './CalendarEventService';

class SearchIndexService {
  constructor() {
    this.index = {
      pages: [],
      events: [],
      tables: []
    };
    this.lastIndexedAt = null;
  }

  // Extraer texto plano de contenido TipTap
  extractTextFromContent(content) {
    if (!content || !content.content) return '';
    
    let text = '';
    
    const extractFromNode = (node) => {
      if (node.type === 'text') {
        text += node.text + ' ';
      } else if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractFromNode);
      } else if (node.text) {
        text += node.text + ' ';
      }
    };
    
    if (Array.isArray(content.content)) {
      content.content.forEach(extractFromNode);
    }
    
    return text.trim();
  }

  // Indexar todas las páginas
  async indexPages() {
    try {
      const files = await LocalStorageService.listFiles('data');
      const pageFiles = files.filter(f => f.endsWith('.json') && !f.includes('calendar-') && !f.includes('notion-') && f !== 'config.json');
      
      const pages = [];
      for (const file of pageFiles) {
        try {
          const data = await LocalStorageService.readJSONFile(file, 'data');
          if (data && data.titulo) {
            const textContent = this.extractTextFromContent(data.contenido || {});
            pages.push({
              id: data.id || file.replace('.json', ''),
              type: 'page',
              title: data.titulo || 'Sin título',
              emoji: data.emoji || null,
              text: textContent,
              tags: data.tags || [],
              createdAt: data.creadoEn,
              updatedAt: data.actualizadoEn
            });
          }
        } catch (error) {
          // Continuar con el siguiente archivo si hay error
        }
      }
      
      this.index.pages = pages;
      return pages;
    } catch (error) {
      return [];
    }
  }

  // Indexar eventos de calendario
  async indexEvents() {
    try {
      const events = await CalendarEventService.loadEvents();
      const indexedEvents = events.map(event => ({
        id: event.id,
        type: 'event',
        title: event.title || 'Sin título',
        description: event.description || '',
        date: event.startDate,
        time: event.startTime,
        category: event.category,
        calendarId: event.calendarId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));
      
      this.index.events = indexedEvents;
      return indexedEvents;
    } catch (error) {
      return [];
    }
  }

  // Indexar tablas
  async indexTables() {
    try {
      const files = await LocalStorageService.listFiles('data');
      const pageFiles = files.filter(f => f.endsWith('.json') && !f.includes('calendar-') && !f.includes('notion-') && f !== 'config.json');
      
      const tables = [];
      for (const file of pageFiles) {
        try {
          const data = await LocalStorageService.readJSONFile(file, 'data');
          if (data && data.contenido && data.contenido.content) {
            // Buscar nodos de tabla en el contenido
            const findTables = (node) => {
              if (node.type === 'tablaNotion') {
                const tableName = node.attrs?.nombre || 'Sin nombre';
                const tableData = node.attrs?.datos || {};
                let tableText = tableName + ' ';
                
                // Extraer texto de las filas
                if (tableData.filas && Array.isArray(tableData.filas)) {
                  tableData.filas.forEach(fila => {
                    if (fila && typeof fila === 'object') {
                      Object.values(fila).forEach(val => {
                        if (val !== null && val !== undefined) {
                          tableText += String(val) + ' ';
                        }
                      });
                    }
                  });
                }
                
                tables.push({
                  id: `${data.id || file.replace('.json', '')}-table-${tables.length}`,
                  type: 'table',
                  title: tableName,
                  text: tableText.trim(),
                  pageId: data.id || file.replace('.json', ''),
                  pageTitle: data.titulo || 'Sin título',
                  createdAt: data.creadoEn,
                  updatedAt: data.actualizadoEn
                });
              }
              
              if (node.content && Array.isArray(node.content)) {
                node.content.forEach(findTables);
              }
            };
            
            data.contenido.content.forEach(findTables);
          }
        } catch (error) {
          // Continuar con el siguiente archivo
        }
      }
      
      this.index.tables = tables;
      return tables;
    } catch (error) {
      return [];
    }
  }

  // Indexar todo
  async indexAll() {
    try {
      await Promise.all([
        this.indexPages(),
        this.indexEvents(),
        this.indexTables()
      ]);
      this.lastIndexedAt = new Date();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Búsqueda fuzzy simple (busca coincidencias en título y contenido)
  fuzzySearch(query, items, fields = ['title', 'text']) {
    if (!query || query.trim() === '') return items;
    
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);
    
    return items.map(item => {
      let score = 0;
      let matchedText = '';
      
      fields.forEach(field => {
        const fieldValue = item[field] || '';
        const fieldValueLower = fieldValue.toLowerCase();
        
        queryWords.forEach(word => {
          if (fieldValueLower.includes(word)) {
            score += 10;
            // Priorizar coincidencias en el título
            if (field === 'title') {
              score += 20;
              // Si la coincidencia es al inicio del título, bonus extra
              if (fieldValueLower.startsWith(word)) {
                score += 30;
              }
            }
            matchedText += fieldValue + ' ';
          }
        });
      });
      
      return {
        ...item,
        score,
        matchedText: matchedText.trim()
      };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  // Buscar en todo el índice
  async search(query, filters = {}) {
    // Si el índice está vacío o es antiguo, reindexar
    if (!this.lastIndexedAt || this.index.pages.length === 0) {
      await this.indexAll();
    }
    
    let results = [];
    
    // Buscar en páginas
    if (!filters.type || filters.type === 'page' || filters.type === 'all') {
      const pageResults = this.fuzzySearch(query, this.index.pages);
      results = results.concat(pageResults);
    }
    
    // Buscar en eventos
    if (!filters.type || filters.type === 'event' || filters.type === 'all') {
      const eventResults = this.fuzzySearch(query, this.index.events, ['title', 'description']);
      results = results.concat(eventResults);
    }
    
    // Buscar en tablas
    if (!filters.type || filters.type === 'table' || filters.type === 'all') {
      const tableResults = this.fuzzySearch(query, this.index.tables);
      results = results.concat(tableResults);
    }
    
    // Ordenar por score
    results.sort((a, b) => b.score - a.score);
    
    // Limitar resultados (top 50)
    return results.slice(0, 50);
  }

  // Invalidar índice (forzar reindexación)
  invalidate() {
    this.index = {
      pages: [],
      events: [],
      tables: []
    };
    this.lastIndexedAt = null;
  }
}

// Exportar singleton
const searchIndexService = new SearchIndexService();
export default searchIndexService;

