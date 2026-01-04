import { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import NotificationPopup from './NotificationPopup';

export default function NotificationContainer() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Inicializar servicio de notificaciones
    NotificationService.start();

    // Agregar listener para notificaciones
    const removeListener = NotificationService.addListener((notification) => {
      setNotifications(prev => {
        // Evitar duplicados
        if (prev.find(n => n.id === notification.id)) {
          return prev;
        }
        return [...prev, notification];
      });
    });

    return () => {
      removeListener();
      NotificationService.stop();
    };
  }, []);

  const handleCloseNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    // Remover de eventos notificados en el servicio
    NotificationService.removeNotifiedEvent(notificationId);
  };

  const handleCancelEvent = (eventId) => {
    handleCloseNotification(eventId);
    // El evento ya fue eliminado en NotificationPopup
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none" style={{ maxWidth: '400px' }}>
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationPopup
            notification={notification}
            onClose={() => handleCloseNotification(notification.id)}
            onCancelEvent={handleCancelEvent}
            duration={10000}
          />
        </div>
      ))}
    </div>
  );
}

