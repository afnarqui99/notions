import { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Plus } from 'lucide-react';
import TagService from '../services/TagService';

export default function TagSelector({ selectedTags = [], onChange, allowCreate = true }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);

  // Cargar tags disponibles
  useEffect(() => {
    const loadTags = async () => {
      try {
        const allTags = await TagService.loadTags();
        setTags(allTags);
      } catch (error) {
        console.error('Error cargando tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  // Manejar selección/deselección de tag
  const handleTagToggle = (tagId) => {
    const isSelected = selectedTags.includes(tagId);
    const newSelected = isSelected
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    if (onChange) {
      onChange(newSelected);
    }
  };

  // Crear nuevo tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setShowCreateInput(false);
      setNewTagName('');
      return;
    }

    try {
      const color = selectedColor || TagService.getRandomColor();
      const newTag = await TagService.addTag(newTagName.trim(), color);
      
      // Actualizar lista de tags
      const updatedTags = await TagService.loadTags();
      setTags(updatedTags);
      
      // Agregar a selección
      if (onChange) {
        onChange([...selectedTags, newTag.id]);
      }
      
      // Reset
      setShowCreateInput(false);
      setNewTagName('');
      setSelectedColor(null);
    } catch (error) {
      console.error('Error creando tag:', error);
    }
  };

  // Obtener tag completo por ID
  const getTagById = (tagId) => {
    return tags.find(tag => tag.id === tagId);
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Cargando tags...</div>
    );
  }

  const colors = TagService.getPredefinedColors();

  return (
    <div className="space-y-3">
      {/* Tags seleccionados */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tagId => {
            const tag = getTagById(tagId);
            if (!tag) return null;
            
            return (
              <div
                key={tagId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  border: `1px solid ${tag.color}40`
                }}
                onClick={() => handleTagToggle(tagId)}
              >
                <TagIcon className="w-3 h-3" />
                <span>{tag.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTagToggle(tagId);
                  }}
                  className="hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input para crear nuevo tag */}
      {showCreateInput && allowCreate && (
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateTag();
              } else if (e.key === 'Escape') {
                setShowCreateInput(false);
                setNewTagName('');
              }
            }}
            placeholder="Nombre del tag"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          
          {/* Selector de color */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Color:</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreateTag}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Crear
            </button>
            <button
              onClick={() => {
                setShowCreateInput(false);
                setNewTagName('');
                setSelectedColor(null);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Botón para agregar tag */}
      {!showCreateInput && allowCreate && (
        <div className="flex flex-wrap gap-2">
          {/* Tags disponibles no seleccionados */}
          {tags
            .filter(tag => !selectedTags.includes(tag.id))
            .map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 bg-white text-gray-700"
              >
                <TagIcon className="w-3 h-3" style={{ color: tag.color }} />
                <span>{tag.name}</span>
              </button>
            ))}
          
          {/* Botón para crear nuevo tag */}
          <button
            type="button"
            onClick={() => setShowCreateInput(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer hover:bg-gray-100 transition-colors border border-dashed border-gray-300 text-gray-600"
          >
            <Plus className="w-3 h-3" />
            <span>Nuevo tag</span>
          </button>
        </div>
      )}

      {/* Si no hay tags disponibles y no se permite crear */}
      {tags.length === 0 && !allowCreate && (
        <div className="text-sm text-gray-500">No hay tags disponibles</div>
      )}
    </div>
  );
}


