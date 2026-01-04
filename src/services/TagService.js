/**
 * Servicio para gestionar tags/labels de páginas
 * Permite crear, listar, actualizar y eliminar tags
 */

import LocalStorageService from './LocalStorageService';

class TagService {
  constructor() {
    this.tagsStorageKey = 'notion-tags.json';
  }

  // Cargar todos los tags
  async loadTags() {
    try {
      const tagsData = await LocalStorageService.readJSONFile(this.tagsStorageKey, 'data');
      
      if (!tagsData) {
        // Intentar cargar desde localStorage como fallback
        return this.loadTagsFromFallback();
      }
      
      const tags = tagsData?.tags || [];
      return tags;
    } catch (error) {
      // Intentar cargar desde localStorage como fallback
      return this.loadTagsFromFallback();
    }
  }

  // Método helper para cargar desde fallback
  loadTagsFromFallback() {
    try {
      if (typeof localStorage !== 'undefined') {
        const backup = localStorage.getItem('notion-tags-backup');
        if (backup) {
          const backupData = JSON.parse(backup);
          return backupData.tags || [];
        }
      }
    } catch (fallbackError) {
      // Error en fallback
    }
    // Si no existe, retornar array vacío
    return [];
  }

  // Guardar tags
  async saveTags(tags) {
    try {
      const dataToSave = { 
        tags: tags || [], 
        updatedAt: new Date().toISOString() 
      };
      
      await LocalStorageService.saveJSONFile(
        this.tagsStorageKey,
        dataToSave,
        'data'
      );
      
      return true;
    } catch (error) {
      console.error('Error guardando tags:', error);
      // Intentar guardar en localStorage como fallback si falla el sistema de archivos
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('notion-tags-backup', JSON.stringify({ tags: tags || [], updatedAt: new Date().toISOString() }));
        }
      } catch (fallbackError) {
        console.error('Error en fallback de localStorage:', fallbackError);
      }
      return false;
    }
  }

  // Obtener tag por ID
  async getTagById(tagId) {
    const tags = await this.loadTags();
    return tags.find(tag => tag.id === tagId);
  }

  // Agregar nuevo tag
  async addTag(name, color = null) {
    const tags = await this.loadTags();
    
    // Verificar si ya existe
    const existing = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return existing;
    }

    const newTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      color: color || this.getRandomColor(),
      createdAt: new Date().toISOString(),
    };

    tags.push(newTag);
    await this.saveTags(tags);
    
    // Disparar evento para notificar que los tags se actualizaron
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tagsUpdated'));
    }
    
    return newTag;
  }

  // Actualizar tag
  async updateTag(tagId, updates) {
    const tags = await this.loadTags();
    const index = tags.findIndex(tag => tag.id === tagId);
    
    if (index === -1) return null;

    tags[index] = {
      ...tags[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveTags(tags);

    // Disparar evento para notificar que los tags se actualizaron
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tagsUpdated'));
    }

    return tags[index];
  }

  // Eliminar tag
  async deleteTag(tagId) {
    const tags = await this.loadTags();
    const filtered = tags.filter(tag => tag.id !== tagId);
    await this.saveTags(filtered);
    
    // Disparar evento para notificar que los tags se actualizaron
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tagsUpdated'));
    }
    
    return true;
  }

  // Obtener colores predefinidos
  getPredefinedColors() {
    return [
      '#EF4444', // Rojo
      '#F97316', // Naranja
      '#F59E0B', // Ámbar
      '#EAB308', // Amarillo
      '#84CC16', // Verde lima
      '#22C55E', // Verde
      '#10B981', // Esmeralda
      '#14B8A6', // Teal
      '#06B6D4', // Cyan
      '#0EA5E9', // Azul cielo
      '#3B82F6', // Azul
      '#6366F1', // Índigo
      '#8B5CF6', // Violeta
      '#A855F7', // Púrpura
      '#D946EF', // Fucsia
      '#EC4899', // Rosa
      '#F43F5E', // Rosa rojo
      '#64748B', // Gris
    ];
  }

  // Obtener color aleatorio
  getRandomColor() {
    const colors = this.getPredefinedColors();
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Obtener tags de una página
  async getPageTags(pageId) {
    try {
      const pageData = await LocalStorageService.readJSONFile(`${pageId}.json`, 'data');
      return pageData?.tags || [];
    } catch (error) {
      return [];
    }
  }

  // Guardar tags de una página
  async savePageTags(pageId, tagIds) {
    try {
      const pageData = await LocalStorageService.readJSONFile(`${pageId}.json`, 'data') || {};
      pageData.tags = tagIds;
      await LocalStorageService.saveJSONFile(`${pageId}.json`, pageData, 'data');
      return true;
    } catch (error) {
      console.error('Error guardando tags de página:', error);
      return false;
    }
  }

  // Obtener todas las páginas con un tag específico
  async getPagesByTag(tagId) {
    try {
      const files = await LocalStorageService.listFiles('data');
      const pages = [];
      
      for (const file of files.filter(f => f.endsWith('.json') && !f.includes('tags'))) {
        try {
          const pageData = await LocalStorageService.readJSONFile(file, 'data');
          if (pageData?.tags && pageData.tags.includes(tagId)) {
            pages.push({
              id: file.replace('.json', ''),
              ...pageData
            });
          }
        } catch (error) {
          // Continuar con siguiente archivo
        }
      }
      
      return pages;
    } catch (error) {
      console.error('Error obteniendo páginas por tag:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export default new TagService();

