import { useState } from 'react';
import { Download, Upload, Calendar } from 'lucide-react';
import Modal from './Modal';
import ICalendarService from '../services/ICalendarService';
import CalendarEventService from '../services/CalendarEventService';

export default function CalendarImportExport({ isOpen, onClose, calendarId }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!calendarId) {
      alert('No hay calendario seleccionado');
      return;
    }

    setExporting(true);
    try {
      const events = await CalendarEventService.getEventsByCalendar(calendarId);
      
      if (events.length === 0) {
        alert('No hay eventos para exportar');
        setExporting(false);
        return;
      }

      // Convertir eventos al formato esperado por ICalendarService
      const icsEvents = events.map(event => {
        // Combinar fecha y hora
        let startDate = null;
        let endDate = null;

        if (event.startDate) {
          const start = new Date(event.startDate);
          if (event.startTime) {
            const [hours, minutes] = event.startTime.split(':');
            start.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          }
          startDate = start.toISOString();
        }

        if (event.endDate) {
          const end = new Date(event.endDate);
          if (event.endTime) {
            const [hours, minutes] = event.endTime.split(':');
            end.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          } else if (event.startTime) {
            // Si no hay hora de fin, usar la hora de inicio + 1 hora
            const [hours, minutes] = event.startTime.split(':');
            end.setHours(parseInt(hours, 10) + 1, parseInt(minutes, 10), 0, 0);
          }
          endDate = end.toISOString();
        } else if (startDate) {
          // Si no hay fecha de fin, usar la fecha de inicio
          endDate = startDate;
        }

        return {
          id: event.id,
          title: event.title || 'Evento sin título',
          description: event.description || '',
          location: event.location || '',
          startDate: startDate,
          endDate: endDate,
          createdAt: event.createdAt,
          notification: event.notification,
          categories: event.category ? [event.category] : [],
          status: 'CONFIRMED',
          priority: null,
          url: null,
        };
      });

      const calendarName = `Calendario ${calendarId}`;
      await ICalendarService.exportEventsToICS(icsEvents, `calendario-${calendarId}.ics`, calendarName);
      
      alert(`Se exportaron ${events.length} evento(s) correctamente`);
      onClose();
    } catch (error) {
      console.error('Error exportando eventos:', error);
      alert(`Error al exportar eventos: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.ics')) {
      alert('Por favor, selecciona un archivo .ics');
      return;
    }

    if (!calendarId) {
      alert('No hay calendario seleccionado');
      return;
    }

    setImporting(true);
    try {
      const importedEvents = await ICalendarService.importEventsFromICS(file, calendarId);
      alert(`Se importaron ${importedEvents.length} evento(s) correctamente`);
      onClose();
      
      // Disparar evento para recargar el calendario
      window.dispatchEvent(new Event('calendarEventsUpdated'));
    } catch (error) {
      console.error('Error importando eventos:', error);
      alert(`Error al importar eventos: ${error.message}`);
    } finally {
      setImporting(false);
      // Resetear el input
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar/Exportar Calendario">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Importa o exporta eventos del calendario en formato iCalendar (.ics)
        </p>

        <div className="grid grid-cols-1 gap-4">
          {/* Exportar */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all
              ${exporting
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
              ${exporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Exportar Eventos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Descarga todos los eventos del calendario como archivo .ics
              </p>
            </div>
            {exporting && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </button>

          {/* Importar */}
          <label
            className={`
              flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer
              ${importing
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }
              ${importing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="file"
              accept=".ics"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Importar Eventos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Importa eventos desde un archivo .ics
              </p>
            </div>
            {importing && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </label>
        </div>
      </div>
    </Modal>
  );
}

