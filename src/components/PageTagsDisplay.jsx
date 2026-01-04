import { useState, useEffect } from 'react';
import TagService from '../services/TagService';

export default function PageTagsDisplay({ tags = [] }) {
  const [tagsInfo, setTagsInfo] = useState([]);

  useEffect(() => {
    const loadTagsInfo = async () => {
      if (tags.length === 0) {
        setTagsInfo([]);
        return;
      }
      
      try {
        const allTags = await TagService.loadTags();
        const info = tags
          .map(tagId => allTags.find(t => t.id === tagId))
          .filter(Boolean);
        setTagsInfo(info);
      } catch (error) {
        console.error('Error cargando información de tags:', error);
        setTagsInfo([]);
      }
    };
    
    loadTagsInfo();
  }, [tags]);

  if (tagsInfo.length === 0) return null;

  return (
    <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5 border-b bg-gray-50">
      {tagsInfo.map(tag => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            border: `1px solid ${tag.color}40`
          }}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}

