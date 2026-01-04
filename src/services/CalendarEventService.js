/**
 * Servicio para gestionar eventos de calendario y categorías
 * Permite crear, listar, actualizar y eliminar eventos y categorías
 */

import LocalStorageService from './LocalStorageService';

class CalendarEventService {
  constructor() {
    this.eventsStorageKey = 'calendar-events.json';
    this.categoriesStorageKey = 'calendar-categories.json';
  }

  // ========== CATEGORÍAS ==========

  // Cargar todas las categorías
  async loadCategories() {
    try {
      const data = await LocalStorageService.readJSONFile(this.categoriesStorageKey, 'data');
      return data?.categories || [];
    } catch (error) {
      // Si no existe, retornar categorías por defecto
      return this.getDefaultCategories();
    }
  }

  // Guardar categorías
  async saveCategories(categories) {
    try {
      await LocalStorageService.saveJSONFile(
        this.categoriesStorageKey,
        { categories, updatedAt: new Date().toISOString() },
        'data'
      );
      return true;
    } catch (error) {
      console.error('Error guardando categorías:', error);
      return false;
    }
  }

  // Obtener categorías por defecto
  getDefaultCategories() {
    return [
      { id: 'cat-1', name: 'Trabajo', color: '#3B82F6' },
      { id: 'cat-2', name: 'Personal', color: '#10B981' },
      { id: 'cat-3', name: 'Importante', color: '#EF4444' },
      { id: 'cat-4', name: 'Reunión', color: '#8B5CF6' },
      { id: 'cat-5', name: 'Recordatorio', color: '#F59E0B' },
      { id: 'cat-6', name: 'Estudio', color: '#06B6D4' },
    ];
  }

  // ========== EVENTOS ==========

  // Cargar todos los eventos
  async loadEvents() {
    try {
      const data = await LocalStorageService.readJSONFile(this.eventsStorageKey, 'data');
      return data?.events || [];
    } catch (error) {
      return [];
    }
  }

  // Guardar eventos
  async saveEvents(events) {
    try {
      await LocalStorageService.saveJSONFile(
        this.eventsStorageKey,
        { events, updatedAt: new Date().toISOString() },
        'data'
      );
      return true;
    } catch (error) {
      console.error('Error guardando eventos:', error);
      return false;
    }
  }

  // Obtener eventos por calendario
  async getEventsByCalendar(calendarId) {
    try {
      const allEvents = await this.loadEvents();
      return allEvents.filter(event => event.calendarId === calendarId);
    } catch (error) {
      console.error('Error obteniendo eventos por calendario:', error);
      return [];
    }
  }

  // Agregar evento (alias para saveEvent)
  async addEvent(event) {
    return this.saveEvent(event);
  }

  // Guardar evento (agregar o actualizar según si tiene ID)
  async saveEvent(event) {
    try {
      const allEvents = await this.loadEvents();
      
      if (event.id) {
        // Actualizar evento existente
        const index = allEvents.findIndex(e => e.id === event.id);
        if (index !== -1) {
          allEvents[index] = {
            ...allEvents[index],
            ...event,
            updatedAt: new Date().toISOString(),
          };
          await this.saveEvents(allEvents);
          return allEvents[index];
        }
      }
      
      // Agregar nuevo evento
      const newEvent = {
        ...event,
        id: event.id || this.generateUUID(),
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      allEvents.push(newEvent);
      await this.saveEvents(allEvents);
      return newEvent;
    } catch (error) {
      console.error('Error guardando evento:', error);
      throw error;
    }
  }

  // Actualizar evento
  async updateEvent(eventId, updates) {
    try {
      const allEvents = await this.loadEvents();
      const index = allEvents.findIndex(e => e.id === eventId);
      
      if (index === -1) {
        throw new Error('Evento no encontrado');
      }

      allEvents[index] = {
        ...allEvents[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await this.saveEvents(allEvents);
      return allEvents[index];
    } catch (error) {
      console.error('Error actualizando evento:', error);
      throw error;
    }
  }

  // Eliminar evento
  async deleteEvent(eventId) {
    try {
      const allEvents = await this.loadEvents();
      const filtered = allEvents.filter(e => e.id !== eventId);
      await this.saveEvents(filtered);
      return true;
    } catch (error) {
      console.error('Error eliminando evento:', error);
      return false;
    }
  }

  // Obtener eventos próximos (para notificaciones)
  async getUpcomingEvents(minutesAhead = 60) {
    try {
      const allEvents = await this.loadEvents();
      const now = new Date();
      const futureTime = new Date(now.getTime() + minutesAhead * 60000);

      return allEvents.filter(event => {
        if (!event.startDate || !event.startTime) return false;
        
        const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
        return eventDateTime >= now && eventDateTime <= futureTime;
      });
    } catch (error) {
      console.error('Error obteniendo eventos próximos:', error);
      return [];
    }
  }

  // ========== UTILIDADES ==========

  // Generar UUID
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para navegadores sin crypto.randomUUID
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Exportar instancia singleton
export default new CalendarEventService();
