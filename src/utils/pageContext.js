/**
 * Utilidad para manejar el contexto de la página actual
 * Permite que componentes como TablaNotionStyle obtengan el ID de la página actual
 */

// Variable global para almacenar la página actual
let currentPageId = null;

export const PageContext = {
  // Establecer la página actual
  setCurrentPageId(pageId) {
    currentPageId = pageId;
    // También guardar en localStorage como backup
    try {
      if (pageId) {
        localStorage.setItem('notion-current-page-id', pageId);
      } else {
        localStorage.removeItem('notion-current-page-id');
      }
    } catch (error) {
      console.warn('Error guardando página actual:', error);
    }
  },

  // Obtener la página actual
  getCurrentPageId() {
    if (currentPageId) {
      return currentPageId;
    }
    // Si no está en memoria, intentar desde localStorage
    try {
      const saved = localStorage.getItem('notion-current-page-id');
      return saved || null;
    } catch (error) {
      console.warn('Error obteniendo página actual:', error);
      return null;
    }
  },

  // Limpiar la página actual
  clearCurrentPageId() {
    currentPageId = null;
    try {
      localStorage.removeItem('notion-current-page-id');
    } catch (error) {
      console.warn('Error limpiando página actual:', error);
    }
  }
};






