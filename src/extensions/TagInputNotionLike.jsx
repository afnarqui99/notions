// TagInputNotionLike.jsx
import { useState } from 'react';

export default function TagInputNotionLike({ value = [], onChange }) {
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

  return (
    <div 
      className="flex items-center gap-1 px-0 py-0 overflow-x-auto overflow-y-hidden flex-nowrap" 
      style={{ 
        maxHeight: '20px',
        minHeight: '18px',
        height: 'auto'
      }}
    >
      <div className="flex items-center gap-1 flex-nowrap flex-shrink-0 h-full">
        {value.map((tag, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1 text-xs px-1.5 py-0 rounded flex-shrink-0 whitespace-nowrap"
            style={{ 
              backgroundColor: tag.color || 'rgba(206, 205, 202, 0.3)',
              color: tag.color ? 'white' : 'rgb(55, 53, 47)',
              height: '16px',
              lineHeight: '1.2',
              fontSize: '0.75rem'
            }}
          >
            <span className="leading-tight">{tag.label || tag.value || tag}</span>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="+"
        className="min-w-[16px] max-w-[60px] border-none outline-none text-xs flex-shrink-0 bg-transparent"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          padding: '1px 3px',
          height: '16px',
          color: 'rgba(55, 53, 47, 0.5)'
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

