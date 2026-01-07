import { useEffect, useState } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [zIndex, setZIndex] = useState(10002);

  // Calcular z-index dinámico basado en el nivel del modal actual
  useEffect(() => {
    const calculateZIndex = () => {
      if (typeof document === 'undefined') return 10002;
      
      // Buscar todos los modales abiertos
      const openModals = document.querySelectorAll('[data-drawer="table-drawer-modal"]');
      const level = openModals.length;
      
      if (level > 0) {
        // El z-index del modal es: 10000 + (level * 1000) + 1
        // El Toast debe estar por encima del modal, así que usamos + 10
        const modalZIndex = 10000 + (level * 1000) + 1;
        return modalZIndex + 10;
      }
      
      // Si no hay modales, usar el z-index por defecto
      return 10002;
    };

    // Actualizar z-index inicial
    setZIndex(calculateZIndex());

    // Actualizar z-index periódicamente para detectar cambios en los modales
    const interval = setInterval(() => {
      setZIndex(calculateZIndex());
    }, 100);

    return () => clearInterval(interval);
  }, []);

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

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  const iconColors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4
        ${colors[type]}
        border rounded-lg shadow-lg
        px-4 py-3 flex items-center gap-3
        min-w-[300px] max-w-[400px]
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
      `}
      style={{ zIndex: zIndex }}
    >
      <div className={iconColors[type]}>{icons[type]}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className={`${iconColors[type]} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}












