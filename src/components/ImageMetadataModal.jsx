import { useState, useEffect } from 'react';
import { X, Save, Calendar, FileText } from 'lucide-react';
import GroupSelector from './GroupSelector';

export default function ImageMetadataModal({ 
  isOpen, 
  onClose, 
  onSave, 
  defaultNombre = '',
  defaultDescripcion = '',
  defaultGrupo = '',
  filename = ''
}) {
  const [nombre, setNombre] = useState(defaultNombre);
  const [descripcion, setDescripcion] = useState(defaultDescripcion);
  const [grupo, setGrupo] = useState(defaultGrupo);
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (isOpen) {
      setNombre(defaultNombre);
      setDescripcion(defaultDescripcion);
      setGrupo(defaultGrupo);
      const hoy = new Date();
      setFecha(hoy.toISOString().split('T')[0]);
    }
  }, [isOpen, defaultNombre, defaultDescripcion, defaultGrupo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim()) {
      const metadata = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        grupo: grupo.trim(),
        fecha: fecha || new Date().toISOString()
      };
      
      // Guardar el grupo en localStorage para futuras sugerencias
      if (metadata.grupo) {
        try {
          const grupos = JSON.parse(localStorage.getItem('notion-imagenes-grupos') || '[]');
          const grupoNormalizado = metadata.grupo.trim().toLowerCase();
          const existe = grupos.some(g => g.trim().toLowerCase() === grupoNormalizado);
          if (!existe) {
            grupos.unshift(metadata.grupo.trim());
            const gruposLimitados = grupos.slice(0, 50);
            localStorage.setItem('notion-imagenes-grupos', JSON.stringify(gruposLimitados));
          }
        } catch (error) {
          console.error('Error guardando grupo:', error);
        }
      }
      
      onSave(metadata);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h3 className="text-xl font-semibold">Información de la Imagen</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre / Título <span className="text-red-500">*</span>
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Captura de pantalla del dashboard"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="grupo" className="block text-sm font-medium text-gray-700 mb-2">
              Grupo / Categoría
            </label>
            <GroupSelector
              value={grupo}
              onChange={setGrupo}
              placeholder="Ej: Dashboard, Documentación, Wireframes (o selecciona uno existente)"
            />
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional de la imagen..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Save className="w-4 h-4" />
              Guardar e Insertar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

