/**
 * Servicio para generar y parsear archivos iCalendar (.ics)
 */

import CalendarEventService from './CalendarEventService';

class ICalendarService {
  /**
   * Formatear fecha para iCalendar (formato: YYYYMMDDTHHMMSS)
   */
  formatDateForICS(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /**
   * Escapar texto para iCalendar
   */
  escapeICS(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Generar archivo .ics a partir de eventos
   */
  generateICS(events, calendarName = 'Calendario') {
    if (!events || events.length === 0) {
      return null;
    }

    let ics = 'BEGIN:VCALENDAR\r\n';
    ics += 'VERSION:2.0\r\n';
    ics += 'PRODID:-//Notion Local Editor//Calendar//ES\r\n';
    ics += `X-WR-CALNAME:${this.escapeICS(calendarName)}\r\n`;
    ics += 'CALSCALE:GREGORIAN\r\n';
    ics += 'METHOD:PUBLISH\r\n';

    events.forEach((event) => {
      ics += 'BEGIN:VEVENT\r\n';
      
      // UID único
      ics += `UID:${event.id || `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}\r\n`;
      
      // Fecha de creación
      if (event.createdAt) {
        ics += `DTSTAMP:${this.formatDateForICS(event.createdAt)}\r\n`;
      } else {
        ics += `DTSTAMP:${this.formatDateForICS(new Date())}\r\n`;
      }

      // Fecha de inicio
      if (event.startDate) {
        ics += `DTSTART:${this.formatDateForICS(event.startDate)}\r\n`;
      }

      // Fecha de fin
      if (event.endDate) {
        ics += `DTEND:${this.formatDateForICS(event.endDate)}\r\n`;
      } else if (event.startDate) {
        // Si no hay fecha de fin, usar la misma fecha de inicio
        ics += `DTEND:${this.formatDateForICS(event.startDate)}\r\n`;
      }

      // Título
      if (event.title) {
        ics += `SUMMARY:${this.escapeICS(event.title)}\r\n`;
      }

      // Descripción
      if (event.description) {
        ics += `DESCRIPTION:${this.escapeICS(event.description)}\r\n`;
      }

      // Ubicación
      if (event.location) {
        ics += `LOCATION:${this.escapeICS(event.location)}\r\n`;
      }

      // Estado (CONFIRMED, TENTATIVE, CANCELLED)
      if (event.status) {
        ics += `STATUS:${event.status}\r\n`;
      }

      // Prioridad (0-9, 0 = undefined, 1 = highest, 9 = lowest)
      if (event.priority !== undefined) {
        ics += `PRIORITY:${event.priority}\r\n`;
      }

      // Categorías
      if (event.categories && event.categories.length > 0) {
        ics += `CATEGORIES:${event.categories.map(c => this.escapeICS(c)).join(',')}\r\n`;
      }

      // URL
      if (event.url) {
        ics += `URL:${this.escapeICS(event.url)}\r\n`;
      }

      // Alarma (si hay notificación)
      if (event.notification && event.notification.enabled) {
        ics += 'BEGIN:VALARM\r\n';
        ics += 'ACTION:DISPLAY\r\n';
        ics += `TRIGGER:-PT${event.notification.minutesBefore || 15}M\r\n`;
        ics += `DESCRIPTION:${this.escapeICS(event.title || 'Recordatorio')}\r\n`;
        ics += 'END:VALARM\r\n';
      }

      ics += 'END:VEVENT\r\n';
    });

    ics += 'END:VCALENDAR\r\n';

    return ics;
  }

  /**
   * Exportar eventos a archivo .ics
   */
  async exportEventsToICS(events, filename = 'calendario.ics', calendarName = 'Calendario') {
    const icsContent = this.generateICS(events, calendarName);
    
    if (!icsContent) {
      throw new Error('No hay eventos para exportar');
    }

    // Crear blob y descargar
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Parsear archivo .ics
   */
  parseICS(icsContent) {
    if (!icsContent) {
      return [];
    }

    const events = [];
    const lines = icsContent.split(/\r?\n/);
    let currentEvent = null;
    let currentAlarm = null;
    let inEvent = false;
    let inAlarm = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Manejar líneas continuadas (empiezan con espacio o tab)
      while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
        line += lines[i + 1].substring(1);
        i++;
      }

      line = line.trim();
      if (!line) continue;

      // Parsear línea (formato: PROPERTY:VALUE o PROPERTY;PARAM=VALUE:VALUE)
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const propertyPart = line.substring(0, colonIndex);
      const valuePart = line.substring(colonIndex + 1);

      const [property, ...params] = propertyPart.split(';');
      const propertyUpper = property.toUpperCase();

      // Parsear parámetros
      const paramsObj = {};
      params.forEach(param => {
        const [key, val] = param.split('=');
        if (key && val) {
          paramsObj[key.toUpperCase()] = val;
        }
      });

      switch (propertyUpper) {
        case 'BEGIN':
          if (valuePart === 'VEVENT') {
            currentEvent = {
              id: null,
              title: null,
              description: null,
              location: null,
              startDate: null,
              endDate: null,
              createdAt: null,
              status: null,
              priority: null,
              categories: [],
              url: null,
              notification: null,
            };
            inEvent = true;
          } else if (valuePart === 'VALARM') {
            currentAlarm = {
              enabled: true,
              minutesBefore: 15,
            };
            inAlarm = true;
          }
          break;

        case 'END':
          if (valuePart === 'VEVENT' && currentEvent) {
            events.push(currentEvent);
            currentEvent = null;
            inEvent = false;
          } else if (valuePart === 'VALARM' && currentAlarm && currentEvent) {
            currentEvent.notification = currentAlarm;
            currentAlarm = null;
            inAlarm = false;
          }
          break;

        case 'UID':
          if (currentEvent) {
            currentEvent.id = valuePart;
          }
          break;

        case 'DTSTART':
          if (currentEvent) {
            currentEvent.startDate = this.parseICSDate(valuePart);
          }
          break;

        case 'DTEND':
          if (currentEvent) {
            currentEvent.endDate = this.parseICSDate(valuePart);
          }
          break;

        case 'DTSTAMP':
          if (currentEvent && !currentEvent.createdAt) {
            currentEvent.createdAt = this.parseICSDate(valuePart);
          }
          break;

        case 'SUMMARY':
          if (currentEvent) {
            currentEvent.title = this.unescapeICS(valuePart);
          }
          break;

        case 'DESCRIPTION':
          if (inAlarm && currentAlarm) {
            // Descripción de alarma
            currentAlarm.description = this.unescapeICS(valuePart);
          } else if (currentEvent) {
            currentEvent.description = this.unescapeICS(valuePart);
          }
          break;

        case 'LOCATION':
          if (currentEvent) {
            currentEvent.location = this.unescapeICS(valuePart);
          }
          break;

        case 'STATUS':
          if (currentEvent) {
            currentEvent.status = valuePart;
          }
          break;

        case 'PRIORITY':
          if (currentEvent) {
            currentEvent.priority = parseInt(valuePart, 10);
          }
          break;

        case 'CATEGORIES':
          if (currentEvent) {
            currentEvent.categories = valuePart.split(',').map(c => this.unescapeICS(c.trim()));
          }
          break;

        case 'URL':
          if (currentEvent) {
            currentEvent.url = this.unescapeICS(valuePart);
          }
          break;

        case 'TRIGGER':
          if (currentAlarm) {
            // Parsear trigger (ej: -PT15M = 15 minutos antes)
            const match = valuePart.match(/-PT(\d+)M/);
            if (match) {
              currentAlarm.minutesBefore = parseInt(match[1], 10);
            }
          }
          break;
      }
    }

    return events;
  }

  /**
   * Parsear fecha de formato iCalendar
   */
  parseICSDate(dateString) {
    if (!dateString) return null;

    // Formato: YYYYMMDDTHHMMSS o YYYYMMDD
    const dateOnly = dateString.length === 8;
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Mes es 0-indexed
    const day = parseInt(dateString.substring(6, 8), 10);
    
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (!dateOnly && dateString.length >= 15) {
      hours = parseInt(dateString.substring(9, 11), 10);
      minutes = parseInt(dateString.substring(11, 13), 10);
      seconds = parseInt(dateString.substring(13, 15), 10);
    }

    return new Date(year, month, day, hours, minutes, seconds).toISOString();
  }

  /**
   * Desescapar texto de iCalendar
   */
  unescapeICS(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Importar eventos desde archivo .ics
   */
  async importEventsFromICS(file, calendarId) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const icsContent = e.target.result;
          const events = this.parseICS(icsContent);
          
          // Guardar eventos usando CalendarEventService
          const savedEvents = [];
          for (const event of events) {
            try {
              // Convertir fecha ISO a formato YYYY-MM-DD y hora
              const startDateObj = event.startDate ? new Date(event.startDate) : new Date();
              const endDateObj = event.endDate ? new Date(event.endDate) : startDateObj;
              
              const startDate = startDateObj.toISOString().split('T')[0];
              const endDate = endDateObj.toISOString().split('T')[0];
              const startTime = `${String(startDateObj.getHours()).padStart(2, '0')}:${String(startDateObj.getMinutes()).padStart(2, '0')}`;
              const endTime = `${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}`;
              
              const savedEvent = await CalendarEventService.saveEvent({
                calendarId: calendarId,
                title: event.title || 'Evento sin título',
                description: event.description || '',
                location: event.location || '',
                startDate: startDate,
                startTime: startTime,
                endDate: endDate,
                endTime: endTime,
                allDay: false, // Por defecto, se puede ajustar según necesidad
                notification: event.notification,
                category: event.categories && event.categories.length > 0 ? event.categories[0] : null,
                color: '#3B82F6', // Color por defecto
              });
              savedEvents.push(savedEvent);
            } catch (error) {
              console.error('Error guardando evento:', error);
            }
          }
          
          resolve(savedEvents);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error leyendo archivo'));
      };
      
      reader.readAsText(file);
    });
  }
}

export default new ICalendarService();

