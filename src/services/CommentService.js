/**
 * Servicio para gestionar comentarios y anotaciones
 */

import LocalStorageService from './LocalStorageService';

class CommentService {
  /**
   * Crear un nuevo comentario
   */
  async createComment(pageId, commentData) {
    if (!pageId || !commentData) {
      throw new Error('pageId y commentData son requeridos');
    }

    try {
      const commentId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const comment = {
        id: commentId,
        pageId: pageId,
        text: commentData.text || '',
        author: commentData.author || 'Usuario',
        timestamp: new Date().toISOString(),
        resolved: false,
        replies: [],
        selection: commentData.selection || null, // Información sobre el texto seleccionado
      };

      // Guardar comentario en subdirectorio comments
      await LocalStorageService.saveJSONFile(
        `${commentId}.json`,
        comment,
        'data/comments'
      );

      // Actualizar índice de comentarios
      await this.updateCommentIndex(pageId, commentId);

      return comment;
    } catch (error) {
      console.error('Error creando comentario:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los comentarios de una página
   */
  async getComments(pageId) {
    if (!pageId) return [];

    try {
      const index = await this.getCommentIndex(pageId);
      if (!index || !index.comments || index.comments.length === 0) {
        return [];
      }

      // Cargar todos los comentarios
      const comments = await Promise.all(
        index.comments.map(async (commentId) => {
          try {
            const comment = await LocalStorageService.readJSONFile(
              `${commentId}.json`,
              'data/comments'
            );
            return comment;
          } catch (error) {
            console.error(`Error cargando comentario ${commentId}:`, error);
            return null;
          }
        })
      );

      // Filtrar comentarios nulos y ordenar por timestamp
      return comments
        .filter(c => c !== null)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
      return [];
    }
  }

  /**
   * Obtener un comentario específico
   */
  async getComment(commentId) {
    try {
      const comment = await LocalStorageService.readJSONFile(
        `${commentId}.json`,
        'data/comments'
      );
      return comment;
    } catch (error) {
      console.error(`Error obteniendo comentario ${commentId}:`, error);
      return null;
    }
  }

  /**
   * Actualizar un comentario
   */
  async updateComment(commentId, updates) {
    try {
      const comment = await this.getComment(commentId);
      if (!comment) {
        throw new Error('Comentario no encontrado');
      }

      const updatedComment = {
        ...comment,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await LocalStorageService.saveJSONFile(
        `${commentId}.json`,
        updatedComment,
        'data/comments'
      );

      return updatedComment;
    } catch (error) {
      console.error('Error actualizando comentario:', error);
      throw error;
    }
  }

  /**
   * Resolver un comentario
   */
  async resolveComment(commentId) {
    return await this.updateComment(commentId, { resolved: true });
  }

  /**
   * Reabrir un comentario resuelto
   */
  async reopenComment(commentId) {
    return await this.updateComment(commentId, { resolved: false });
  }

  /**
   * Agregar una respuesta a un comentario
   */
  async addReply(commentId, replyData) {
    try {
      const comment = await this.getComment(commentId);
      if (!comment) {
        throw new Error('Comentario no encontrado');
      }

      const replyId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const reply = {
        id: replyId,
        text: replyData.text || '',
        author: replyData.author || 'Usuario',
        timestamp: new Date().toISOString(),
      };

      const updatedComment = {
        ...comment,
        replies: [...(comment.replies || []), reply],
        updatedAt: new Date().toISOString(),
      };

      await LocalStorageService.saveJSONFile(
        `${commentId}.json`,
        updatedComment,
        'data/comments'
      );

      return reply;
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      throw error;
    }
  }

  /**
   * Eliminar un comentario
   */
  async deleteComment(commentId) {
    try {
      const comment = await this.getComment(commentId);
      if (!comment) {
        return false;
      }

      // Eliminar archivo del comentario
      await LocalStorageService.deleteJSONFile(
        `${commentId}.json`,
        'data/comments'
      );

      // Actualizar índice
      await this.removeCommentFromIndex(comment.pageId, commentId);

      return true;
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      return false;
    }
  }

  /**
   * Obtener índice de comentarios para una página
   */
  async getCommentIndex(pageId) {
    try {
      const index = await LocalStorageService.readJSONFile(
        `_index.json`,
        'data/comments'
      );
      return index?.[pageId] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Actualizar índice de comentarios
   */
  async updateCommentIndex(pageId, commentId) {
    try {
      let index = {};
      try {
        index = await LocalStorageService.readJSONFile(
          `_index.json`,
          'data/comments'
        ) || {};
      } catch (error) {
        index = {};
      }

      if (!index[pageId]) {
        index[pageId] = {
          pageId: pageId,
          comments: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      if (!index[pageId].comments.includes(commentId)) {
        index[pageId].comments.push(commentId);
      }

      index[pageId].lastUpdated = new Date().toISOString();

      await LocalStorageService.saveJSONFile(
        `_index.json`,
        index,
        'data/comments'
      );
    } catch (error) {
      console.error('Error actualizando índice de comentarios:', error);
    }
  }

  /**
   * Eliminar comentario del índice
   */
  async removeCommentFromIndex(pageId, commentId) {
    try {
      const index = await LocalStorageService.readJSONFile(
        `_index.json`,
        'data/comments'
      ) || {};

      if (index[pageId]) {
        index[pageId].comments = index[pageId].comments.filter(id => id !== commentId);
        index[pageId].lastUpdated = new Date().toISOString();
      }

      await LocalStorageService.saveJSONFile(
        `_index.json`,
        index,
        'data/comments'
      );
    } catch (error) {
      console.error('Error eliminando comentario del índice:', error);
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

export default new CommentService();
