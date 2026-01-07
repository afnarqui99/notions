import { useState, useEffect, useRef } from 'react';
import { X, Save, FileText, History } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import QuickNoteService from '../services/QuickNoteService';

export default function QuickNote({ isOpen, onClose, onShowHistory, initialNote = null }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false); // Ref para evitar guardados duplicados

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Escribe tu nota rápida...' }),
    ],
    content: '',
    onUpdate: () => {
      setSaved(false);
      // Auto-guardado después de 2 segundos de inactividad
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    },
  });

  // Cargar nota inicial si se proporciona
  useEffect(() => {
    if (isOpen && editor) {
      if (initialNote) {
        setCurrentNoteId(initialNote.id);
        // Asegurarse de que el contenido esté en el formato correcto
        const content = initialNote.content;
        if (content && typeof content === 'object') {
          // Si el contenido es un objeto JSON válido de TipTap
          if (content.type === 'doc' || content.content) {
            editor.commands.setContent(content);
          } else {
            // Si no tiene la estructura correcta, intentar convertirlo
            editor.commands.setContent({ type: 'doc', content: [] });
          }
        } else if (typeof content === 'string') {
          // Si es un string, intentar parsearlo
          try {
            const parsed = JSON.parse(content);
            editor.commands.setContent(parsed);
          } catch {
            // Si no se puede parsear, crear un párrafo con el texto
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
          // Si no hay contenido válido, crear un documento vacío
          editor.commands.setContent({ type: 'doc', content: [] });
        }
      } else {
        // Si no hay nota inicial, limpiar
        editor.commands.setContent('');
        setCurrentNoteId(null);
        setSaved(false);
      }
    }
  }, [isOpen, initialNote, editor]);

  useEffect(() => {
    if (!isOpen && editor) {
      // Limpiar timeout de auto-guardado
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      
      // Limpiar contenido al cerrar (el guardado ya se hizo en handleClose)
      editor.commands.setContent('');
      setCurrentNoteId(null);
      setSaved(false);
    }
  }, [isOpen, editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!editor || isSavingRef.current) return; // Evitar guardados duplicados

    const content = editor.getJSON();
    const text = editor.getText();

    if (!text.trim()) {
      return; // No guardar si está vacío
    }

    isSavingRef.current = true;
    setSaving(true);
    try {
      const noteData = {
        id: currentNoteId, // Si ya existe, actualizar; si no, crear nueva
        content: content,
        text: text,
        createdAt: currentNoteId ? undefined : new Date().toISOString(), // Solo crear createdAt si es nueva
        updatedAt: new Date().toISOString(),
      };

      const savedNote = await QuickNoteService.saveNote(noteData);
      
      // Guardar el ID para futuras actualizaciones
      if (!currentNoteId && savedNote && savedNote.id) {
        setCurrentNoteId(savedNote.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error guardando nota rápida:', error);
      alert('Error al guardar la nota. Por favor, intenta de nuevo.');
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  };

  const handleClose = async () => {
    // Limpiar timeout de auto-guardado para evitar guardados duplicados
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Guardar antes de cerrar si hay contenido y no se está guardando ya
    if (editor && !isSavingRef.current) {
      const text = editor.getText();
      if (text.trim()) {
        // Usar handleSave que ya tiene la lógica correcta
        await handleSave();
        // Esperar un momento para que se complete el guardado
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Nota Rápida
            </h2>
            {saving && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Guardando...
              </span>
            )}
            {saved && !saving && (
              <span className="text-xs text-green-600 dark:text-green-400">
                Guardado
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-4">
          <EditorContent 
            editor={editor} 
            className="prose dark:prose-invert max-w-none focus:outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Se guarda automáticamente
            </p>
            {onShowHistory && (
              <button
                onClick={() => {
                  handleClose();
                  setTimeout(() => onShowHistory(), 100);
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                title="Ver notas guardadas"
              >
                <History className="w-3 h-3" />
                Ver notas guardadas
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

