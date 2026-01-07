/**
 * Servicio para gestionar notificaciones del sistema de calendario
 * Verifica eventos próximos y muestra notificaciones
 */

import CalendarEventService from './CalendarEventService';

class NotificationService {
  constructor() {
    this.checkInterval = 60000; // 1 minuto
    this.notifiedEvents = new Set(); // IDs de eventos ya notificados
    this.listeners = []; // Listeners para notificaciones
    this.isRunning = false;
    this.intervalId = null;
    this.soundEnabled = true;
    this.showInApp = true;
    this.showSystem = true;
    
    // Audio context para sonidos
    this.audioContext = null;
  }

  // Inicializar audio context
  initAudio() {
    if (!this.audioContext && typeof AudioContext !== 'undefined') {
      this.audioContext = new AudioContext();
    }
  }

  // Reproducir sonido de notificación
  async playNotificationSound(type = 'default') {
    if (!this.soundEnabled) return;

    try {
      this.initAudio();
      
      // Crear sonido simple con Web Audio API
      if (this.audioContext) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Frecuencia según tipo
        const frequencies = {
          default: 800,
          gentle: 600,
          urgent: 1000
        };
        
        oscillator.frequency.value = frequencies[type] || frequencies.default;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
      } else {
        // Fallback: usar beep del sistema
        console.log('\u0007'); // Beep ASCII
      }
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }

  // Agregar listener para notificaciones
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notificar a todos los listeners
  notifyListeners(notification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error en listener de notificación:', error);
      }
    });
  }

  // Verificar eventos próximos
  async checkUpcomingEvents() {
    try {
      const now = new Date();
      const allEvents = await CalendarEventService.loadEvents();
      
      // Filtrar eventos que están ocurriendo ahora o en los próximos 60 minutos
      const upcomingEvents = allEvents.filter(event => {
        if (!event.startDate || !event.startTime) return false;
        
        try {
          const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
          if (isNaN(eventDateTime.getTime())) return false;
          
          const minutesUntil = Math.round((eventDateTime - now) / (1000 * 60));
          
          // Notificar si el evento es ahora o en los próximos 60 minutos
          return minutesUntil >= -2 && minutesUntil <= 60;
        } catch (e) {
          return false;
        }
      });
      
      upcomingEvents.forEach(event => {
        // Solo notificar si no se ha notificado ya
        if (!this.notifiedEvents.has(event.id)) {
          this.triggerNotification(event);
          this.notifiedEvents.add(event.id);
        }
      });
    } catch (error) {
      console.error('Error verificando eventos próximos:', error);
    }
  }

  // Activar notificación
  triggerNotification(event) {
    const notification = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      startTime: event.startTime,
      category: event.category,
      color: event.color || '#3B82F6',
      event: event
    };

    // Notificar en la aplicación
    if (this.showInApp) {
      this.notifyListeners(notification);
    }

    // Reproducir sonido
    if (this.soundEnabled) {
      const soundType = event.category === 'important' ? 'urgent' : 
                       event.category === 'meeting' ? 'default' : 'gentle';
      this.playNotificationSound(soundType);
    }

    // Notificación del sistema (Electron)
    if (this.showSystem && typeof window !== 'undefined' && window.electron) {
      try {
        // Usar notificaciones nativas de Electron
        if (window.electron.showNotification) {
          window.electron.showNotification(
            notification.title,
            notification.description || notification.title,
            notification.id
          );
        }
      } catch (error) {
        console.error('Error mostrando notificación del sistema:', error);
      }
    }
  }

  // Iniciar servicio de notificaciones
  start() {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    
    // Verificar inmediatamente
    this.checkUpcomingEvents();
    
    // Verificar periódicamente cada minuto
    this.intervalId = setInterval(() => {
      this.checkUpcomingEvents();
    }, this.checkInterval);
  }

  // Detener servicio de notificaciones
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Limpiar eventos notificados
  clearNotifiedEvents() {
    this.notifiedEvents.clear();
  }

  // Remover evento de notificados (útil cuando se edita un evento)
  removeNotifiedEvent(eventId) {
    this.notifiedEvents.delete(eventId);
  }

  // Actualizar configuración
  updateSettings(settings) {
    this.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : this.soundEnabled;
    this.showInApp = settings.showInApp !== undefined ? settings.showInApp : this.showInApp;
    this.showSystem = settings.showSystem !== undefined ? settings.showSystem : this.showSystem;
  }
}

// Exportar instancia singleton
export default new NotificationService();

