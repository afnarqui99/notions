// TagInputNotionLike.jsx
import { useState, useEffect, useRef } from 'react';

export default function TagInputNotionLike({ value = [], onChange, compact = false, showColorPicker = false }) {
  const [inputValue, setInputValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(null);
  const colorPickerRef = useRef(null);

  // Cerrar el selector de color al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setColorPickerOpen(null);
      }
    };

    if (colorPickerOpen !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [colorPickerOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const newTag = {
        label: inputValue.trim(),
        color: getRandomColor(),
      };
      onChange([...value, newTag]);
      setInputValue('');
    }
    if (e.key === 'Backspace' && !inputValue && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handleRemove = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const updateColor = (idx, color) => {
    const updated = [...value];
    updated[idx].color = color;
    onChange(updated);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newTags = [...value];
    const draggedTag = newTags[draggedIndex];
    newTags.splice(draggedIndex, 1);
    newTags.splice(dropIndex, 0, draggedTag);
    
    onChange(newTags);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Si está en modo compacto (solo mostrar, no editar), mostrar solo los primeros tags
  if (compact && value.length > 0) {
    const tagsToShow = value.slice(0, 2);
    const remainingCount = value.length - tagsToShow.length;
    
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {tagsToShow.map((tag, idx) => (
          <div
            key={idx}
            className="flex items-center text-xs px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap"
            style={{ 
              backgroundColor: tag.color || 'rgba(206, 205, 202, 0.3)',
              color: tag.color ? 'white' : 'rgb(55, 53, 47)',
              height: '18px',
              lineHeight: '1.2',
              fontSize: '0.7rem',
              fontWeight: 400
            }}
          >
            <span className="leading-tight">{tag.label || tag.value || tag}</span>
          </div>
        ))}
        {remainingCount > 0 && (
          <span className="text-xs text-gray-500" style={{ fontSize: '0.7rem' }}>
            +{remainingCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-1 flex-wrap" 
      style={{ 
        minHeight: '18px',
        maxHeight: 'none'
      }}
    >
      {value.map((tag, idx) => (
        <div
          key={idx}
          draggable={colorPickerOpen !== idx}
          onDragStart={(e) => {
            // Si el selector de color está abierto para este tag, no permitir drag
            if (colorPickerOpen === idx) {
              e.preventDefault();
              return false;
            }
            // Si se está haciendo clic en un botón o input, no iniciar drag
            if (e.target.closest('button') || e.target.closest('input')) {
              e.preventDefault();
              return false;
            }
            handleDragStart(e, idx);
          }}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap group/tag relative cursor-move"
          style={{ 
            backgroundColor: tag.color || 'rgba(206, 205, 202, 0.3)',
            color: tag.color ? 'white' : 'rgb(55, 53, 47)',
            height: '18px',
            lineHeight: '1.2',
            fontSize: '0.7rem',
            fontWeight: 400,
            borderLeft: dragOverIndex === idx ? '2px solid rgba(59, 130, 246, 0.8)' : 'none',
            transform: draggedIndex === idx ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s, border 0.2s',
            cursor: colorPickerOpen === idx ? 'default' : 'move'
          }}
          title={colorPickerOpen === idx ? "Cierra el selector de color para arrastrar" : "Arrastra para reorganizar"}
        >
          <span className="leading-tight" onMouseDown={(e) => {
            if (colorPickerOpen === idx) {
              e.stopPropagation();
            }
          }}>{tag.label || tag.value || tag}</span>
          {showColorPicker && (
            <div className="relative" ref={colorPickerOpen === idx ? colorPickerRef : null} onMouseDown={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setColorPickerOpen(colorPickerOpen === idx ? null : idx);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                className="opacity-0 group-hover/tag:opacity-100 transition-opacity ml-0.5 text-[10px] leading-none hover:bg-black/20 rounded px-0.5"
                style={{
                  color: tag.color ? 'white' : 'rgb(55, 53, 47)',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
                title="Cambiar color"
              >
                🎨
              </button>
              {colorPickerOpen === idx && (
                <div 
                  className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 mt-1"
                  style={{ left: '0', top: '100%', minWidth: '200px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xs text-gray-600 mb-2">Color actual:</div>
                  <div 
                    className="w-full h-6 rounded mb-2 border border-gray-300"
                    style={{ backgroundColor: tag.color || 'rgba(206, 205, 202, 0.3)' }}
                  />
                  <div className="text-xs text-gray-600 mb-1">Colores predefinidos:</div>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {getColorPalette().map((color, colorIdx) => (
                      <button
                        key={colorIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateColor(idx, color);
                          setColorPickerOpen(null);
                        }}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <label className="text-xs text-gray-600 mb-1 block">Color personalizado:</label>
                    <input
                      type="color"
                      value={tag.color || '#60a5fa'}
                      onChange={(e) => {
                        updateColor(idx, e.target.value);
                      }}
                      className="w-full h-8 rounded cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemove(idx);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onDragStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="opacity-0 group-hover/tag:opacity-100 transition-opacity ml-0.5 text-[10px] leading-none hover:bg-black/20 rounded px-0.5"
            style={{
              color: tag.color ? 'white' : 'rgb(55, 53, 47)',
              cursor: 'pointer'
            }}
            title="Eliminar tag"
          >
            ×
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? "+" : ""}
        className="min-w-[16px] max-w-[80px] border-none outline-none text-xs flex-shrink-0 bg-transparent"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          padding: '2px 4px',
          height: '18px',
          color: 'rgba(55, 53, 47, 0.4)',
          fontSize: '0.7rem'
        }}
      />
    </div>
  );
}

function getRandomColor() {
  const colors = [
    '#60a5fa', // blue
    '#f87171', // red
    '#34d399', // green
    '#fbbf24', // yellow
    '#a78bfa', // purple
    '#f472b6', // pink
    '#38bdf8', // sky
    '#fb923c', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Función para obtener la lista de colores predefinidos
function getColorPalette() {
  return [
    '#60a5fa', // blue
    '#f87171', // red
    '#34d399', // green
    '#fbbf24', // yellow
    '#a78bfa', // purple
    '#f472b6', // pink
    '#38bdf8', // sky
    '#fb923c', // orange
    '#ef4444', // red-500
    '#10b981', // green-500
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f59e0b', // amber-500
    '#14b8a6', // teal-500
    '#6366f1', // indigo-500
  ];
}





