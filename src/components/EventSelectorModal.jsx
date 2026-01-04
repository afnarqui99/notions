import { X, Clock, Calendar } from 'lucide-react';

export default function EventSelectorModal({ isOpen, onClose, events, onSelectEvent, date }) {
  if (!isOpen || !events || events.length === 0) return null;

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Todo el día';
    return timeStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Parsear YYYY-MM-DD directamente para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexed
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSelect = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event);
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Eventos del día
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {date ? formatDate(date) : 'Selecciona un evento'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleSelect(event)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                style={{ borderLeftColor: event.color || '#3B82F6', borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {event.startTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(event.startTime)}</span>
                        </div>
                      )}
                      {event.allDay && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Todo el día</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0 ml-2"
                    style={{ backgroundColor: event.color || '#3B82F6' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

