/**
 * Servicio para gestionar notas generales con tags/grupos
 */

import LocalStorageService from './LocalStorageService';

class GeneralNotesService {
  /**
   * Guardar una nota general
   */
  async saveNote(noteData) {
    try {
      const noteId = noteData.id || `general-note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const note = {
        id: noteId,
        description: noteData.description || '',
        content: noteData.content || null,
        text: noteData.text || '',
        tags: noteData.tags || [],
        archived: noteData.archived || false,
        createdAt: noteData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Guardar en archivo JSON (directorio data/general-notes)
      await LocalStorageService.saveJSONFile(
        `${noteId}.json`,
        note,
        'data/general-notes'
      );

      return note;
    } catch (error) {
      console.error('Error guardando nota general:', error);
      throw error;
    }
  }

  /**
   * Archivar una nota general
   */
  async archiveNote(noteId) {
    try {
      const note = await this.getNote(noteId);
      if (!note) {
        throw new Error('Nota no encontrada');
      }
      return await this.updateNote(noteId, { archived: true });
    } catch (error) {
      console.error(`Error archivando nota general ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Desarchivar una nota general
   */
  async unarchiveNote(noteId) {
    try {
      const note = await this.getNote(noteId);
      if (!note) {
        throw new Error('Nota no encontrada');
      }
      return await this.updateNote(noteId, { archived: false });
    } catch (error) {
      console.error(`Error desarchivando nota general ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las notas generales
   */
  async getAllNotes(includeArchived = false) {
    try {
      // Listar todos los archivos en data/general-notes
      const allFiles = await LocalStorageService.listFiles('data/general-notes');
      const generalNoteFiles = allFiles.filter(f => f.startsWith('general-note-') && f.endsWith('.json'));
      
      if (!generalNoteFiles || generalNoteFiles.length === 0) {
        return [];
      }

      const notes = await Promise.all(
        generalNoteFiles.map(async (file) => {
          try {
            const note = await LocalStorageService.readJSONFile(file, 'data/general-notes');
            if (note && note.id && note.id.startsWith('general-note-')) {
              return note;
            }
            return null;
          } catch (error) {
            console.error(`Error cargando nota general ${file}:`, error);
            return null;
          }
        })
      );

      // Filtrar notas nulas y ordenar por fecha de actualización descendente
      let filteredNotes = notes.filter(note => note !== null);
      
      // Filtrar archivadas si no se incluyen
      if (!includeArchived) {
        filteredNotes = filteredNotes.filter(note => !note.archived);
      }
      
      return filteredNotes.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    } catch (error) {
      console.error('Error obteniendo notas generales:', error);
      return [];
    }
  }

  /**
   * Obtener notas por tag
   */
  async getNotesByTag(tag, includeArchived = false) {
    try {
      const allNotes = await this.getAllNotes(includeArchived);
      return allNotes.filter(note => note.tags && note.tags.includes(tag));
    } catch (error) {
      console.error('Error obteniendo notas por tag:', error);
      return [];
    }
  }

  /**
   * Obtener notas archivadas
   */
  async getArchivedNotes() {
    try {
      const allNotes = await this.getAllNotes(true);
      return allNotes.filter(note => note.archived === true);
    } catch (error) {
      console.error('Error obteniendo notas archivadas:', error);
      return [];
    }
  }

  /**
   * Obtener todos los tags únicos
   */
  async getAllTags(includeArchived = false) {
    try {
      const allNotes = await this.getAllNotes(includeArchived);
      const tagsSet = new Set();
      allNotes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
          note.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      return Array.from(tagsSet).sort();
    } catch (error) {
      console.error('Error obteniendo tags:', error);
      return [];
    }
  }

  /**
   * Obtener una nota específica
   */
  async getNote(noteId) {
    try {
      const note = await LocalStorageService.readJSONFile(
        `${noteId}.json`,
        'data/general-notes'
      );
      return note;
    } catch (error) {
      console.error(`Error obteniendo nota general ${noteId}:`, error);
      return null;
    }
  }

  /**
   * Actualizar una nota general
   */
  async updateNote(noteId, updates) {
    try {
      const existingNote = await this.getNote(noteId);
      if (!existingNote) {
        throw new Error('Nota no encontrada');
      }

      const updatedNote = {
        ...existingNote,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await LocalStorageService.saveJSONFile(
        `${noteId}.json`,
        updatedNote,
        'data/general-notes'
      );

      return updatedNote;
    } catch (error) {
      console.error(`Error actualizando nota general ${noteId}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una nota general
   */
  async deleteNote(noteId) {
    try {
      await LocalStorageService.deleteJSONFile(
        `${noteId}.json`,
        'data/general-notes'
      );
      return true;
    } catch (error) {
      console.error(`Error eliminando nota general ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Obtener contenido agrupado por tag (para copiar)
   */
  async getGroupedContentByTag(tag) {
    try {
      const notes = await this.getNotesByTag(tag);
      if (notes.length === 0) {
        return '';
      }

      // Ordenar por fecha de creación
      notes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      // Formatear contenido agrupado
      const lines = notes.map(note => {
        const date = this.formatDate(note.createdAt);
        const description = note.description || 'Sin descripción';
        const text = note.text || '';
        return `[${date}] ${description}\n${text}`;
      });

      return lines.join('\n\n---\n\n');
    } catch (error) {
      console.error('Error obteniendo contenido agrupado:', error);
      return '';
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(timestamp) {
    if (!timestamp) return 'Sin fecha';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export default new GeneralNotesService();

