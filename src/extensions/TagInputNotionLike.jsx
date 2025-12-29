// TagInputNotionLike.jsx
import { useState } from 'react';

export default function TagInputNotionLike({ value = [], onChange, compact = false }) {
  const [inputValue, setInputValue] = useState('');

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

