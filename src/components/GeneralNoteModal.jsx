import { useState, useEffect, useRef } from 'react';
import { X, Save, Tag, Plus, X as XIcon } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import GeneralNotesService from '../services/GeneralNotesService';

export default function GeneralNoteModal({ 
  isOpen, 
  onClose, 
  initialContent = '',
  initialNote = null,
  onSave,
  onSaveAsQuickNote = null
}) {
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const descriptionInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escribe el contenido de la nota general...' }),
    ],
    content: '',
  });

  // Cargar tags existentes al abrir
  useEffect(() => {
    if (isOpen) {
      loadTags();
      
      // Si hay una nota inicial para editar, cargarla
      if (initialNote && editor) {
        setDescription(initialNote.description || '');
        setTags(initialNote.tags || []);
        if (initialNote.content) {
          const content = initialNote.content;
          if (typeof content === 'object') {
            editor.commands.setContent(content);
          } else if (typeof content === 'string') {
            try {
              const parsed = JSON.parse(content);
              editor.commands.setContent(parsed);
            } catch {
              editor.commands.setContent({
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: content }]
                  }
                ]
              });
            }
          }
        }
        // Enfocar el campo de descripción
        setTimeout(() => {
          if (descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
          }
        }, 100);
      } else if (initialContent && editor) {
        // Si hay contenido inicial (desde /principal), cargarlo
        const lines = initialContent.split('\n');
        if (lines.length > 0) {
          // Si no hay descripción en la primera línea, usar la fecha de hoy
          const firstLine = lines[0] || '';
          if (!firstLine.trim()) {
            const today = new Date();
            const formattedDate = today.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            });
            setDescription(formattedDate);
          } else {
            setDescription(firstLine);
          }
          const content = lines.slice(1).join('\n');
          if (content.trim()) {
            editor.commands.setContent({
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: content }]
                }
              ]
            });
          }
        } else {
          // Si no hay contenido, poner la fecha por defecto
          const today = new Date();
          const formattedDate = today.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });
          setDescription(formattedDate);
        }
        // Enfocar el campo de descripción
        setTimeout(() => {
          if (descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
          }
        }, 100);
      } else if (!initialNote && editor) {
        // Si se abre sin contenido inicial ni nota para editar, poner la fecha por defecto
        const today = new Date();
        const formattedDate = today.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        setDescription(formattedDate);
        // Enfocar el campo de descripción
        setTimeout(() => {
          if (descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
          }
        }, 100);
      }
    } else {
      // Limpiar al cerrar
      setDescription('');
      setTags([]);
      setNewTag('');
      if (editor) {
        editor.commands.setContent('');
      }
    }
  }, [isOpen, initialContent, initialNote, editor]);

  const loadTags = async () => {
    try {
      const existingTags = await GeneralNotesService.getAllTags();
      setAllTags(existingTags);
    } catch (error) {
      console.error('Error cargando tags:', error);
    }
  };

  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!description.trim()) {
      alert('Por favor, ingresa una descripción');
      return;
    }

    if (tags.length === 0) {
      alert('Por favor, agrega al menos un tag (ej: sprint 1, sprint 2)');
      return;
    }

    if (!editor) return;

    setSaving(true);
    try {
      const content = editor.getJSON();
      const text = editor.getText();

      const noteData = {
        id: initialNote?.id, // Si es edición, mantener el ID
        description: description.trim(),
        content: content,
        text: text,
        tags: tags,
        createdAt: initialNote?.createdAt, // Preservar fecha de creación si es edición
      };

      await GeneralNotesService.saveNote(noteData);
      
      // Si hay contenido inicial (desde /principal), también guardar como nota rápida
      if (initialContent && !initialNote) {
        try {
          const QuickNoteService = (await import('../services/QuickNoteService')).default;
          await QuickNoteService.saveNote({
            content: content,
            text: text,
          });
        } catch (error) {
          console.error('Error guardando como nota rápida:', error);
          // No fallar si no se puede guardar como nota rápida
        }
      }
      
      if (onSave) {
        onSave();
      }

      onClose();
    } catch (error) {
      console.error('Error guardando nota general:', error);
      alert('Error al guardar la nota general. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newTag.trim()) {
        handleAddTag(newTag);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/50 z-[10001]"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Nota General
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción *
            </label>
            <input
              ref={descriptionInputRef}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Completé la integración de Git en Visual Code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags/Grupos * (ej: sprint 1, sprint 2)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-full p-0.5"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un tag y presiona Enter"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAddTag(newTag)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {/* Tags existentes sugeridos */}
            {allTags.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tags existentes:</p>
                <div className="flex flex-wrap gap-1">
                  {allTags.filter(tag => !tags.includes(tag)).map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Editor de contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contenido
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 min-h-[200px]">
              <EditorContent 
                editor={editor} 
                className="prose dark:prose-invert max-w-none focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !description.trim() || tags.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

