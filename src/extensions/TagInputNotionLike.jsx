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
    <div className="flex flex-wrap gap-2 border px-2 py-1 rounded">
      {value.map((tag, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1 text-sm px-2 py-1 rounded"
          style={{ backgroundColor: tag.color || '#ddd' }}
        >
          <span>{tag.label}</span>
          <input
            type="color"
            value={tag.color || '#ddd'}
            onChange={(e) => updateColor(idx, e.target.value)}
            className="w-4 h-4 cursor-pointer"
          />
          <button
            onClick={() => handleRemove(idx)}
            className="text-white text-xs ml-1 hover:text-black"
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
        placeholder="Escribe y presiona Enter"
        className="flex-1 min-w-[100px] border-none outline-none"
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

