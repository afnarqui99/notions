import { useEffect, useState } from 'react';
import { X, Calendar, Clock, Bell, Trash2 } from 'lucide-react';
import CalendarEventService from '../services/CalendarEventService';

export default function NotificationPopup({ notification, onClose, onCancelEvent, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 300); // Esperar a que termine la animación
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!notification) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short' 
    });
  };

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg shadow-2xl
        min-w-[320px] max-w-[400px]
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}
      `}
      style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)' }}
    >
      {/* Barra de color según categoría */}
      <div 
        className="h-1 rounded-t-lg"
        style={{ backgroundColor: notification.color || '#3B82F6' }}
      />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: notification.color || '#3B82F6' }}
            />
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">
              {notification.category === 'work' ? 'Trabajo' : 
               notification.category === 'personal' ? 'Personal' :
               notification.category === 'important' ? 'Importante' :
               notification.category === 'meeting' ? 'Reunión' : 'Recordatorio'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        <div className="mb-3">
          <h4 className="font-semibold text-gray-900 mb-2">{notification.title}</h4>
          {notification.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{notification.description}</p>
          )}
        </div>

        {/* Información de fecha/hora */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(notification.startDate)}</span>
          </div>
          {notification.startTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(notification.startTime)}</span>
            </div>
          )}
        </div>

        {/* Botón Cancelar Evento */}
        {onCancelEvent && (
          <button
            onClick={async () => {
              if (confirm('¿Estás seguro de que quieres cancelar este evento?')) {
                try {
                  await CalendarEventService.deleteEvent(notification.id);
                  if (onCancelEvent) {
                    onCancelEvent(notification.id);
                  }
                  handleClose();
                } catch (error) {
                  console.error('Error cancelando evento:', error);
                  alert('Error al cancelar el evento');
                }
              }
            }}
            className="w-full px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            Cancelar Evento
          </button>
        )}
      </div>
    </div>
  );
}

