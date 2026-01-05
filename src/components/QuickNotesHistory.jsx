import { useState, useEffect } from 'react';
import { X, FileText, Trash2, Clock, Eye } from 'lucide-react';
import Modal from './Modal';
import QuickNoteService from '../services/QuickNoteService';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function QuickNotesHistory({ isOpen, onClose, onOpenNote }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Cargando nota...' }),
    ],
    content: '',
    editable: false,
  });

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    } else {
      setSelectedNote(null);
      setViewingNote(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedNote && editor) {
      // Asegurarse de que el contenido esté en el formato correcto
      const content = selectedNote.content;
      if (content && typeof content === 'object') {
        // Si el contenido es un objeto JSON válido de TipTap
        if (content.type === 'doc' || content.content) {
          editor.commands.setContent(content);
        } else {
          // Si no tiene la estructura correcta, crear un documento vacío
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
    }
  }, [selectedNote, editor]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const loadedNotes = await QuickNoteService.getAllNotes();
      // Filtrar notas que tengan contenido válido
      const validNotes = loadedNotes.filter(note => note && (note.text || note.content));
      setNotes(validNotes);
    } catch (error) {
      console.error('Error cargando notas:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      return;
    }

    try {
      await QuickNoteService.deleteNote(noteId);
      await loadNotes();
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setViewingNote(false);
        if (editor) {
          editor.commands.setContent('');
        }
      }
    } catch (error) {
      console.error('Error eliminando nota:', error);
      alert('Error al eliminar la nota');
    }
  };

  const handleViewNote = (note) => {
    setSelectedNote(note);
    setViewingNote(true);
  };

  const handleOpenInEditor = async (note) => {
    if (onOpenNote) {
      // Cargar el contenido completo de la nota
      const fullNote = await QuickNoteService.getNote(note.id);
      if (fullNote) {
        onOpenNote(fullNote);
        onClose();
      } else {
        alert('Error al cargar la nota');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notas Rápidas Guardadas">
      <div className="flex gap-4 h-[600px]">
        {/* Lista de notas */}
        <div className={`w-1/3 border-r border-gray-200 dark:border-gray-700 pr-4 ${viewingNote ? '' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay notas guardadas</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[550px]">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedNote?.id === note.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleViewNote(note)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {note.text?.substring(0, 50) || 'Nota sin texto'}...
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {QuickNoteService.formatDate(note.updatedAt || note.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Eliminar nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vista de nota seleccionada */}
        {viewingNote && selectedNote && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Vista Previa
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {QuickNoteService.formatDate(selectedNote.updatedAt || selectedNote.createdAt)}
                </p>
              </div>
              <button
                onClick={() => {
                  setViewingNote(false);
                  setSelectedNote(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <EditorContent 
                editor={editor} 
                className="prose dark:prose-invert max-w-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => handleOpenInEditor(selectedNote)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Abrir en Editor
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

