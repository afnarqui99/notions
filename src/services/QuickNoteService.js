/**
 * Servicio para gestionar notas rápidas
 */

import LocalStorageService from './LocalStorageService';

class QuickNoteService {
  /**
   * Guardar una nota rápida
   */
  async saveNote(noteData) {
    try {
      // Si ya existe un ID, cargar la nota existente para preservar createdAt
      let existingNote = null;
      if (noteData.id) {
        try {
          existingNote = await this.getNote(noteData.id);
        } catch (error) {
          // Si no existe, continuar creando una nueva
        }
      }
      
      const noteId = noteData.id || `quick-note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const note = {
        id: noteId,
        content: noteData.content || null,
        text: noteData.text || '',
        // Preservar createdAt si es una actualización, usar el proporcionado o crear uno nuevo
        createdAt: existingNote?.createdAt || noteData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Guardar en archivo JSON por página (directorio data)
      await LocalStorageService.saveJSONFile(
        `${noteId}.json`,
        note,
        'data'
      );

      return note;
    } catch (error) {
      console.error('Error guardando nota rápida:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las notas rápidas
   */
  async getAllNotes() {
    try {
      // Listar todos los archivos en data y filtrar los de quick-notes
      const allFiles = await LocalStorageService.listFiles('data');
      const quickNoteFiles = allFiles.filter(f => f.startsWith('quick-note-') && f.endsWith('.json'));
      
      if (!quickNoteFiles || quickNoteFiles.length === 0) {
        return [];
      }

      const notes = await Promise.all(
        quickNoteFiles.map(async (file) => {
          try {
            const note = await LocalStorageService.readJSONFile(file, 'data');
            // Verificar que sea una nota rápida válida
            if (note && note.id && note.id.startsWith('quick-note-')) {
              return note;
            }
            return null;
          } catch (error) {
            console.error(`Error cargando nota ${file}:`, error);
            return null;
          }
        })
      );

      // Filtrar notas nulas y ordenar por fecha de actualización descendente
      return notes
        .filter(note => note !== null)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    } catch (error) {
      console.error('Error obteniendo notas rápidas:', error);
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
        'data'
      );
      return note;
    } catch (error) {
      console.error(`Error obteniendo nota ${noteId}:`, error);
      return null;
    }
  }

  /**
   * Eliminar una nota
   */
  async deleteNote(noteId) {
    try {
      await LocalStorageService.deleteJSONFile(
        `${noteId}.json`,
        'data'
      );
      return true;
    } catch (error) {
      console.error(`Error eliminando nota ${noteId}:`, error);
      return false;
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(timestamp) {
    if (!timestamp) return 'Sin fecha';
    
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

export default new QuickNoteService();

