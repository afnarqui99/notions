import { useState, useEffect, useRef } from 'react';
import { Tag, X } from 'lucide-react';

// Función para normalizar nombres de grupos (para comparación)
const normalizarGrupo = (grupo) => {
  return grupo.trim().toLowerCase();
};

// Obtener grupos guardados de localStorage (con soporte para múltiples tipos)
const obtenerGruposGuardados = (tipo = 'imagenes') => {
  try {
    const key = tipo === 'archivos' ? 'notion-archivos-grupos' : 'notion-imagenes-grupos';
    const grupos = localStorage.getItem(key);
    // Si no hay grupos específicos, intentar cargar de imágenes (compartidos)
    if (!grupos && tipo === 'archivos') {
      const gruposImagenes = localStorage.getItem('notion-imagenes-grupos');
      return gruposImagenes ? JSON.parse(gruposImagenes) : [];
    }
    return grupos ? JSON.parse(grupos) : [];
  } catch {
    return [];
  }
};

// Guardar grupos en localStorage
const guardarGrupo = (grupo, tipo = 'imagenes') => {
  if (!grupo || !grupo.trim()) return;
  
  const grupos = obtenerGruposGuardados(tipo);
  const grupoNormalizado = normalizarGrupo(grupo);
  const grupoTrimmed = grupo.trim();
  
  // Verificar si ya existe (comparar normalizado)
  const existe = grupos.some(g => normalizarGrupo(g) === grupoNormalizado);
  
  if (!existe) {
    // Agregar al inicio de la lista
    grupos.unshift(grupoTrimmed);
    // Limitar a los últimos 50 grupos
    const gruposLimitados = grupos.slice(0, 50);
    const key = tipo === 'archivos' ? 'notion-archivos-grupos' : 'notion-imagenes-grupos';
    localStorage.setItem(key, JSON.stringify(gruposLimitados));
  }
};

export default function GroupSelector({ value, onChange, placeholder = "Grupo / Categoría", tipo = 'imagenes' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [gruposGuardados, setGruposGuardados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Cargar grupos guardados
  useEffect(() => {
    setGruposGuardados(obtenerGruposGuardados(tipo));
  }, [tipo]);

  // Filtrar grupos según la búsqueda
  const gruposFiltrados = gruposGuardados.filter(grupo => 
    normalizarGrupo(grupo).includes(normalizarGrupo(busqueda))
  );

  // Cuando el usuario escribe, actualizar el valor y la búsqueda
  const handleInputChange = (e) => {
    const nuevoValor = e.target.value;
    setBusqueda(nuevoValor);
    onChange(nuevoValor);
    
    // Si el valor coincide exactamente con un grupo guardado, no mostrar dropdown
    if (gruposGuardados.some(g => normalizarGrupo(g) === normalizarGrupo(nuevoValor))) {
      setIsOpen(false);
    } else if (nuevoValor) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Seleccionar un grupo del dropdown
  const handleSeleccionarGrupo = (grupo) => {
    setBusqueda('');
    onChange(grupo);
    guardarGrupo(grupo, tipo);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Crear nuevo grupo (cuando presiona Enter y no hay coincidencias exactas)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (busqueda.trim()) {
        const grupoNormalizado = normalizarGrupo(busqueda);
        // Buscar si hay un grupo que coincida (normalizado)
        const grupoExistente = gruposGuardados.find(g => normalizarGrupo(g) === grupoNormalizado);
        
        if (grupoExistente) {
          // Usar el grupo existente (con la capitalización original)
          handleSeleccionarGrupo(grupoExistente);
        } else {
          // Crear nuevo grupo - el handleSeleccionarGrupo ya guarda en localStorage
          handleSeleccionarGrupo(busqueda.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && isOpen && gruposFiltrados.length > 0) {
      e.preventDefault();
      // Focus en el primer item del dropdown
      const firstItem = dropdownRef.current?.querySelector('button');
      firstItem?.focus();
    }
  };

  // Cuando el input recibe focus, mostrar dropdown si hay texto
  const handleFocus = () => {
    if (value || busqueda) {
      setIsOpen(true);
    }
  };

  // Cuando pierde focus, cerrar dropdown después de un pequeño delay
  const handleBlur = (e) => {
    // Pequeño delay para permitir clicks en el dropdown
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
      }
    }, 200);
  };

  // Limpiar grupo
  const handleLimpiar = (e) => {
    e.stopPropagation();
    onChange('');
    setBusqueda('');
    inputRef.current?.focus();
  };

  // Sincronizar busqueda con value cuando cambia desde fuera
  useEffect(() => {
    if (value !== busqueda && document.activeElement !== inputRef.current) {
      setBusqueda(value || '');
    }
  }, [value]);

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Tag className="w-4 h-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={busqueda || value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={handleLimpiar}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown con sugerencias */}
      {isOpen && (busqueda || gruposFiltrados.length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {gruposFiltrados.length > 0 ? (
            <div className="py-1">
              {gruposFiltrados.map((grupo, index) => {
                const coincideExactamente = normalizarGrupo(grupo) === normalizarGrupo(busqueda);
                return (
                  <button
                    key={`${grupo}-${index}`}
                    type="button"
                    onClick={() => handleSeleccionarGrupo(grupo)}
                    className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                      coincideExactamente ? 'bg-blue-50 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3 h-3 text-blue-600" />
                      <span>{grupo}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : busqueda.trim() ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3" />
                <span>Presiona Enter para crear "{busqueda.trim()}"</span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

