/**
 * Servicio para gestionar eventos de calendario
 * Maneja la persistencia y CRUD de eventos
 */

import LocalStorageService from './LocalStorageService';

class CalendarEventService {
  constructor() {
    this.eventsFileName = 'calendar-events.json';
    this.settingsFileName = 'calendar-settings.json';
  }

  // Generar UUID
  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback para navegadores que no soportan crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Cargar todos los eventos
  async loadEvents() {
    try {
      const data = await LocalStorageService.readJSONFile(this.eventsFileName);
      return data?.events || [];
    } catch (error) {
      return [];
    }
  }

  // Guardar todos los eventos
  async saveEvents(events) {
    try {
      await LocalStorageService.saveJSONFile(this.eventsFileName, {
        events: events,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error guardando eventos:', error);
      return false;
    }
  }

  // Obtener evento por ID
  async getEvent(eventId) {
    const events = await this.loadEvents();
    return events.find(e => e.id === eventId) || null;
  }

  // Guardar un nuevo evento
  async saveEvent(event) {
    const events = await this.loadEvents();
    
    const newEvent = {
      ...event,
      id: event.id || this.generateUUID(),
      createdAt: event.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    events.push(newEvent);
    await this.saveEvents(events);
    return newEvent;
  }

  // Actualizar un evento existente
  async updateEvent(eventId, updates) {
    const events = await this.loadEvents();
    const index = events.findIndex(e => e.id === eventId);
    
    if (index === -1) {
      throw new Error('Evento no encontrado');
    }

    events[index] = {
      ...events[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveEvents(events);
    return events[index];
  }

  // Eliminar un evento
  async deleteEvent(eventId) {
    const events = await this.loadEvents();
    const filteredEvents = events.filter(e => e.id !== eventId);
    await this.saveEvents(filteredEvents);
    return true;
  }

  // Obtener eventos por calendario
  async getEventsByCalendar(calendarId) {
    const events = await this.loadEvents();
    return events.filter(e => e.calendarId === calendarId);
  }

  // Obtener eventos por rango de fechas
  async getEventsByDateRange(startDate, endDate) {
    const events = await this.loadEvents();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= start && eventStart <= end;
    });
  }

  // Obtener eventos próximos (para notificaciones)
  async getUpcomingEvents(currentDate, lookAheadMinutes = 60) {
    const events = await this.loadEvents();
    const now = new Date(currentDate);
    const lookAhead = new Date(now.getTime() + lookAheadMinutes * 60 * 1000);

    return events.filter(event => {
      if (!event.startDate || !event.startTime) return false;
      
      const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
      return eventDateTime >= now && eventDateTime <= lookAhead;
    });
  }

  // Buscar eventos por texto
  async searchEvents(query) {
    const events = await this.loadEvents();
    const queryLower = query.toLowerCase();
    
    return events.filter(event => {
      const titleMatch = event.title?.toLowerCase().includes(queryLower);
      const descMatch = event.description?.toLowerCase().includes(queryLower);
      return titleMatch || descMatch;
    });
  }

  // Obtener eventos de un día específico
  async getEventsByDate(date) {
    const events = await this.loadEvents();
    const targetDate = new Date(date).toISOString().split('T')[0];
    
    return events.filter(event => {
      if (!event.startDate) return false;
      return event.startDate === targetDate;
    });
  }

  // Cargar configuración de calendarios
  async loadSettings() {
    try {
      const data = await LocalStorageService.readJSONFile(this.settingsFileName);
      return data || {};
    } catch (error) {
      return {};
    }
  }

  // Guardar configuración de calendarios
  async saveSettings(settings) {
    try {
      await LocalStorageService.saveJSONFile(this.settingsFileName, settings);
      return true;
    } catch (error) {
      console.error('Error guardando configuración:', error);
      return false;
    }
  }

  // Obtener configuración de un calendario específico
  async getCalendarSettings(calendarId) {
    const settings = await this.loadSettings();
    return settings[calendarId] || {
      defaultView: 'month',
      firstDayOfWeek: 1,
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      notifications: {
        enabled: true,
        soundEnabled: true,
        soundFile: 'default',
        showInApp: true,
        showSystem: true
      }
    };
  }

  // Guardar configuración de un calendario
  async saveCalendarSettings(calendarId, calendarSettings) {
    const settings = await this.loadSettings();
    settings[calendarId] = calendarSettings;
    await this.saveSettings(settings);
    return true;
  }

  // Categorías por defecto
  getDefaultCategories() {
    return [
      { id: 'work', name: 'Trabajo', color: '#3B82F6' },
      { id: 'personal', name: 'Personal', color: '#10B981' },
      { id: 'important', name: 'Importante', color: '#EF4444' },
      { id: 'meeting', name: 'Reunión', color: '#8B5CF6' },
      { id: 'reminder', name: 'Recordatorio', color: '#F59E0B' },
      { id: 'study', name: 'Estudio', color: '#EC4899' },
    ];
  }

  // Cargar categorías
  async loadCategories() {
    try {
      const settings = await this.loadSettings();
      if (settings.categories && settings.categories.length > 0) {
        return settings.categories;
      }
      // Si no hay categorías guardadas, retornar las por defecto
      return this.getDefaultCategories();
    } catch (error) {
      return this.getDefaultCategories();
    }
  }

  // Guardar categorías
  async saveCategories(categories) {
    try {
      const settings = await this.loadSettings();
      settings.categories = categories;
      await this.saveSettings(settings);
      return true;
    } catch (error) {
      console.error('Error guardando categorías:', error);
      return false;
    }
  }

  // Agregar categoría
  async addCategory(category) {
    const categories = await this.loadCategories();
    const newCategory = {
      ...category,
      id: category.id || this.generateUUID()
    };
    categories.push(newCategory);
    await this.saveCategories(categories);
    return newCategory;
  }

  // Actualizar categoría
  async updateCategory(categoryId, updates) {
    const categories = await this.loadCategories();
    const index = categories.findIndex(c => c.id === categoryId);
    if (index === -1) return null;
    
    categories[index] = { ...categories[index], ...updates };
    await this.saveCategories(categories);
    return categories[index];
  }

  // Eliminar categoría
  async deleteCategory(categoryId) {
    const categories = await this.loadCategories();
    const filtered = categories.filter(c => c.id !== categoryId);
    await this.saveCategories(filtered);
    return true;
  }
}

// Exportar instancia singleton
export default new CalendarEventService();

