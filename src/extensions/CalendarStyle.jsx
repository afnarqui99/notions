import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, X, Edit2, Trash2, Save, Tag, Settings, Maximize2, Minimize2, MoreVertical } from 'lucide-react';
import CalendarEventService from '../services/CalendarEventService';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CategoryManagerModal from '../components/CategoryManagerModal';
import EventSelectorModal from '../components/EventSelectorModal';
import NotificationSettingsModal from '../components/NotificationSettingsModal';
import ColombianHolidays from '../services/ColombianHolidays';

// Meses y días de la semana
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEKDAYS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Función helper para formatear fecha a YYYY-MM-DD sin problemas de zona horaria
const formatDateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Componente Modal para Evento
function EventModal({ isOpen, onClose, event, calendarId, onSave, onDelete, categories = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [category, setCategory] = useState(categories.length > 0 ? categories[0].id : '');
  const [color, setColor] = useState(categories.length > 0 ? categories[0].color : '#3B82F6');
  const [recurringType, setRecurringType] = useState('none'); // none, daily, weekly, monthly, yearly
  const [recurringInterval, setRecurringInterval] = useState(1); // Cada cuántos días/semanas/meses/años
  const [recurringEndDate, setRecurringEndDate] = useState(''); // Fecha de fin de repetición

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setStartDate(event.startDate || '');
      setStartTime(event.startTime || '');
      setEndDate(event.endDate || event.startDate || '');
      setEndTime(event.endTime || '');
      setAllDay(event.allDay || false);
      const eventCat = categories.find(c => c.id === event.category);
      setCategory(event.category || (categories.length > 0 ? categories[0].id : ''));
      setColor(event.color || eventCat?.color || (categories.length > 0 ? categories[0].color : '#3B82F6'));
      setRecurringType(event.recurring?.type || 'none');
      setRecurringInterval(event.recurring?.interval || 1);
      setRecurringEndDate(event.recurring?.endDate || '');
    } else {
      // Reset para nuevo evento
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      setTitle('');
      setDescription('');
      setStartDate(today);
      setStartTime(time);
      setEndDate(today);
      setEndTime('');
      setAllDay(false);
      setCategory(categories.length > 0 ? categories[0].id : '');
      setColor(categories.length > 0 ? categories[0].color : '#3B82F6');
      setRecurringType('none');
      setRecurringInterval(1);
      setRecurringEndDate('');
    }
  }, [event, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('El título es requerido');
      return;
    }

    if (!startDate) {
      alert('La fecha de inicio es requerida');
      return;
    }

    const eventData = {
      id: event?.id,
      calendarId,
      title: title.trim(),
      description: description.trim(),
      startDate,
      startTime: allDay ? null : startTime,
      endDate: endDate || startDate,
      endTime: allDay ? null : endTime,
      allDay,
      category,
      color,
      recurring: recurringType !== 'none' ? {
        type: recurringType,
        interval: recurringInterval,
        endDate: recurringEndDate || null
      } : null,
    };

    await onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {event ? 'Editar Evento' : 'Nuevo Evento'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del evento"
            />
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={allDay}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={allDay}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Todo el día */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allDay" className="ml-2 text-sm font-medium text-gray-700">
              Todo el día
            </label>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descripción del evento..."
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    setColor(cat.color);
                  }}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all
                    flex items-center justify-between
                    ${category === cat.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded-full border border-gray-300"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className={`font-medium ${category === cat.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                  </div>
                  {category === cat.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <div 
                className="w-10 h-10 rounded border border-gray-300"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{color}</span>
            </div>
          </div>

          {/* Repetición */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repetición
            </label>
            <select
              value={recurringType}
              onChange={(e) => setRecurringType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
            >
              <option value="none">No se repite</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensualmente</option>
              <option value="yearly">Anualmente</option>
            </select>
            
            {recurringType !== 'none' && (
              <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cada cuánto
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">
                    {recurringType === 'daily' && 'día(s)'}
                    {recurringType === 'weekly' && 'semana(s)'}
                    {recurringType === 'monthly' && 'mes(es)'}
                    {recurringType === 'yearly' && 'año(s)'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={recurringEndDate}
                    onChange={(e) => setRecurringEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between">
          {event && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CalendarStyle({ node, updateAttributes }) {
  // Generar calendarId si no existe
  const generateCalendarId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'cal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  };

  const calendarId = node.attrs.calendarId || generateCalendarId();
  const [viewMode, setViewMode] = useState(node.attrs.viewMode || 'month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [colombianHolidays, setColombianHolidays] = useState([]);
  const [showHolidays, setShowHolidays] = useState(true);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventsForDay, setEventsForDay] = useState([]);
  const [selectedDayForEvents, setSelectedDayForEvents] = useState(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  // Estado para controlar si el calendario usa todo el ancho (por defecto: ancho completo)
  const [usarAnchoCompleto, setUsarAnchoCompleto] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-calendar-fullwidth');
      // Si no hay valor guardado, usar ancho completo por defecto
      if (saved === null) {
        return true;
      }
      return saved === 'true';
    } catch {
      return true; // Por defecto: ancho completo
    }
  });
  
  // Guardar preferencia cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem('notion-calendar-fullwidth', usarAnchoCompleto.toString());
    } catch (error) {
      // Error guardando preferencia de ancho
    }
  }, [usarAnchoCompleto]);

  // Asegurar que calendarId se guarde
  useEffect(() => {
    if (!node.attrs.calendarId) {
      updateAttributes({ calendarId, viewMode });
    }
  }, [calendarId]);

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await CalendarEventService.loadCategories();
      setCategories(cats);
    };
    loadCategories();
  }, [showCategoryModal]);

  // Cargar días festivos
  useEffect(() => {
    if (showHolidays) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Obtener rango del mes actual (incluyendo días previos/posteriores visibles)
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Agregar días extra para cubrir el grid completo (puede incluir días de meses anteriores/posteriores)
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Domingo de la semana
      
      const endDate = new Date(lastDay);
      const remainingDays = 6 - lastDay.getDay();
      endDate.setDate(endDate.getDate() + remainingDays); // Sábado de la semana
      
      const holidaysList = ColombianHolidays.getHolidaysInRange(startDate, endDate);
      setColombianHolidays(holidaysList);
    }
  }, [currentDate, showHolidays]);

  // Cargar eventos
  useEffect(() => {
    const loadEvents = async () => {
      const calendarEvents = await CalendarEventService.getEventsByCalendar(calendarId);
      setEvents(calendarEvents);
    };
    loadEvents();
    
    // Recargar eventos cada minuto
    const interval = setInterval(loadEvents, 60000);
    return () => clearInterval(interval);
  }, [calendarId]);

  // Guardar viewMode cuando cambia
  useEffect(() => {
    updateAttributes({ calendarId, viewMode });
  }, [viewMode]);

  // Funciones de navegación
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Generar días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = domingo

    const days = [];
    
    // Días del mes anterior
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
      });
    }

    // Días del mes siguiente para completar la semana
    const totalCells = days.length;
    const remainingCells = 42 - totalCells; // 6 semanas * 7 días
    for (let day = 1; day <= remainingCells; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // Obtener eventos de un día
  const getEventsForDay = (date) => {
    const dateStr = formatDateToString(date);
    return events.filter(event => event.startDate === dateStr);
  };

  // Abrir modal para nuevo evento
  const handleNewEvent = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  // Abrir modal para editar evento
  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Guardar evento
  const handleSaveEvent = async (eventData) => {
    try {
      if (eventData.id) {
        await CalendarEventService.updateEvent(eventData.id, eventData);
      } else {
        await CalendarEventService.saveEvent(eventData);
      }
      
      // Recargar eventos
      const calendarEvents = await CalendarEventService.getEventsByCalendar(calendarId);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error guardando evento:', error);
      alert('Error al guardar el evento');
    }
  };

  // Eliminar evento
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await CalendarEventService.deleteEvent(eventToDelete.id);
      const calendarEvents = await CalendarEventService.getEventsByCalendar(calendarId);
      setEvents(calendarEvents);
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('Error al eliminar el evento');
    }
  };

  // Confirmar eliminación
  const confirmDelete = (event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
    setShowEventModal(false);
  };

  // Vista Mensual
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const monthName = MONTHS[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    // Dividir días en semanas
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div>
        {/* Header del mes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {monthName} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day.date);
            const isToday = day.date.toDateString() === new Date().toDateString();
            
            // Verificar si es día festivo
            const dateStr = formatDateToString(day.date);
            const holiday = showHolidays ? colombianHolidays.find(h => h.date === dateStr) : null;

            return (
              <div
                key={index}
                onClick={() => handleNewEvent(day.date)}
                className={`
                  min-h-[100px] p-2 border border-gray-200 rounded-lg cursor-pointer
                  hover:bg-blue-50 transition-colors
                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${holiday ? 'border-l-4 border-l-orange-400 bg-orange-50/30' : ''}
                `}
                title={holiday ? `🇨🇴 ${holiday.name}` : ''}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : holiday ? 'text-orange-700 font-semibold' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  {holiday && (
                    <span className="text-xs text-orange-600" title={holiday.name}>🇨🇴</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                      className="text-xs px-2 py-1 rounded text-white truncate"
                      style={{ backgroundColor: event.color || '#3B82F6' }}
                      title={event.title}
                    >
                      {event.allDay ? event.title : `${event.startTime} - ${event.title}`}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div 
                      className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEventsForDay(dayEvents);
                        setSelectedDayForEvents(day.date);
                        setShowEventSelector(true);
                      }}
                      title="Ver todos los eventos"
                    >
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Vista Semanal
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Domingo
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div>
        {/* Header de la semana */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Semana del {weekDays[0].getDate()} de {MONTHS[weekDays[0].getMonth()]}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vista semanal */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-8">
            {/* Columna de horas */}
            <div className="border-r border-gray-200">
              {hours.map(hour => (
                <div key={hour} className="h-16 border-b border-gray-100 p-2 text-xs text-gray-500">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {weekDays.map(day => {
              const dayEvents = getEventsForDay(day).filter(e => !e.allDay && e.startTime);
              const isToday = day.toDateString() === new Date().toDateString();

              return (
                <div key={day.toDateString()} className="border-r border-gray-200 last:border-r-0">
                  {/* Header del día */}
                  <div 
                    className={`p-2 text-center border-b border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}
                    onClick={() => handleNewEvent(day)}
                  >
                    <div className="text-sm font-medium">{WEEKDAYS[day.getDay()]}</div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : ''}`}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Horas */}
                  <div className="relative">
                    {hours.map(hour => (
                      <div 
                        key={hour} 
                        className="h-16 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          const newDate = new Date(day);
                          newDate.setHours(hour, 0, 0, 0);
                          handleNewEvent(newDate);
                        }}
                      />
                    ))}

                    {/* Eventos */}
                    {dayEvents.map(event => {
                      const startTime = event.startTime.split(':');
                      const startHour = parseInt(startTime[0]);
                      const startMinute = parseInt(startTime[1]);
                      const top = (startHour * 64) + (startMinute / 60 * 64);

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          className="absolute left-1 right-1 px-2 py-1 text-xs rounded text-white truncate"
                          style={{ 
                            top: `${top}px`,
                            backgroundColor: event.color || '#3B82F6'
                          }}
                          title={event.title}
                        >
                          {event.startTime} - {event.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Vista Diaria
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = getEventsForDay(currentDate).filter(e => !e.allDay && e.startTime);
    const allDayEvents = getEventsForDay(currentDate).filter(e => e.allDay);
    const isToday = currentDate.toDateString() === new Date().toDateString();

    return (
      <div>
        {/* Header del día */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {WEEKDAYS_FULL[currentDate.getDay()]}, {currentDate.getDate()} de {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 1);
                setCurrentDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 1);
                setCurrentDate(newDate);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Eventos de todo el día */}
        {allDayEvents.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="font-semibold text-gray-700 mb-2">Todo el día</div>
            <div className="space-y-2">
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => handleEditEvent(event)}
                  className="px-3 py-2 rounded text-white cursor-pointer"
                  style={{ backgroundColor: event.color || '#3B82F6' }}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vista por horas */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-2">
            {/* Columna de horas */}
            <div className="border-r border-gray-200">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="h-20 border-b border-gray-100 p-2 text-sm text-gray-600"
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Columna de eventos */}
            <div className="relative">
              {hours.map(hour => (
                <div 
                  key={hour}
                  className="h-20 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    newDate.setHours(hour, 0, 0, 0);
                    handleNewEvent(newDate);
                  }}
                />
              ))}

              {/* Eventos */}
              {dayEvents.map(event => {
                const startTime = event.startTime.split(':');
                const startHour = parseInt(startTime[0]);
                const startMinute = parseInt(startTime[1]);
                const top = (startHour * 80) + (startMinute / 60 * 80);

                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event);
                    }}
                    className="absolute left-2 right-2 px-3 py-2 rounded text-white"
                    style={{ 
                      top: `${top}px`,
                      backgroundColor: event.color || '#3B82F6'
                    }}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.startTime && (
                      <div className="text-xs opacity-90">{event.startTime}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <NodeViewWrapper 
      className={`calendar-wrapper my-6 ${usarAnchoCompleto ? 'calendar-fullwidth' : ''}`}
      style={usarAnchoCompleto ? { 
        position: 'relative',
        left: `calc(-1 * (50vw - 50% - var(--sidebar-width, 256px) + 1rem))`,
        width: `calc(100vw - var(--sidebar-width, 256px))`,
        maxWidth: `calc(100vw - var(--sidebar-width, 256px))`,
        marginLeft: 0,
        marginRight: 0,
        paddingLeft: '1rem',
        paddingRight: '1rem'
      } : {}}
    >
      <div className="border rounded-lg p-6 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">📅 Calendario</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón para alternar ancho completo */}
            <button
              onClick={() => setUsarAnchoCompleto(!usarAnchoCompleto)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                usarAnchoCompleto 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={usarAnchoCompleto ? "Reducir ancho" : "Expandir ancho completo"}
            >
              {usarAnchoCompleto ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Compacto</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Ancho Completo</span>
                </>
              )}
            </button>
            {/* Selector de vista */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Día
              </button>
            </div>
            <button
              onClick={() => handleNewEvent(selectedDate || currentDate)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Evento</span>
            </button>
            {/* Menú de opciones (3 puntos) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                title="Opciones"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowCategoryModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Tag className="w-4 h-4 text-purple-600" />
                    <span>Gestionar Categorías</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowNotificationSettings(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-green-600" />
                    <span>Configurar Notificaciones</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vista del calendario */}
        <div>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>

        {/* Modal de evento */}
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          calendarId={calendarId}
          onSave={handleSaveEvent}
          onDelete={(event) => confirmDelete(event)}
          categories={categories}
        />

        {/* Modal de gestión de categorías */}
        <CategoryManagerModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          onCategoriesChange={(newCategories) => setCategories(newCategories)}
        />

        {/* Modal de configuración de notificaciones */}
        <NotificationSettingsModal
          isOpen={showNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
        />

        {/* Modal de confirmación de eliminación */}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setEventToDelete(null);
          }}
          onConfirm={handleDeleteEvent}
          title="Eliminar Evento"
          message={`¿Estás seguro de que quieres eliminar el evento "${eventToDelete?.title}"?`}
          type="danger"
        />

        {/* Modal de selección de eventos */}
        <EventSelectorModal
          isOpen={showEventSelector}
          onClose={() => {
            setShowEventSelector(false);
            setEventsForDay([]);
            setSelectedDayForEvents(null);
          }}
          events={eventsForDay}
          date={selectedDayForEvents ? formatDateToString(selectedDayForEvents) : ''}
          onSelectEvent={(event) => {
            handleEditEvent(event);
            setShowEventSelector(false);
            setEventsForDay([]);
            setSelectedDayForEvents(null);
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}

