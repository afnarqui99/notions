import { useState, useEffect } from 'react';
import { X, Tag, Copy, Trash2, Edit2, Eye, Search, Archive, ArchiveRestore } from 'lucide-react';
import Modal from './Modal';
import GeneralNotesService from '../services/GeneralNotesService';
import GeneralNoteModal from './GeneralNoteModal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function GeneralNotesHistory({ isOpen, onClose, onEditNote, initialNoteToEdit = null }) {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

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
      loadData();
      // Si hay una nota para editar, abrir el modal
      if (initialNoteToEdit) {
        setNoteToEdit(initialNoteToEdit);
        setShowEditModal(true);
      }
    } else {
      setSelectedNote(null);
      setViewingNote(false);
      setSelectedTag(null);
      setSearchTerm('');
      setNoteToEdit(null);
      setShowEditModal(false);
    }
  }, [isOpen, initialNoteToEdit]);

  useEffect(() => {
    if (selectedNote && editor) {
      const content = selectedNote.content;
      if (content && typeof content === 'object') {
        if (content.type === 'doc' || content.content) {
          editor.commands.setContent(content);
        } else {
          editor.commands.setContent({ type: 'doc', content: [] });
        }
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
      } else {
        editor.commands.setContent({ type: 'doc', content: [] });
      }
    }
  }, [selectedNote, editor]);

  useEffect(() => {
    filterNotes();
  }, [notes, selectedTag, searchTerm, showArchived]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [showArchived, isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedNotes, loadedTags] = await Promise.all([
        showArchived 
          ? GeneralNotesService.getArchivedNotes()
          : GeneralNotesService.getAllNotes(false),
        GeneralNotesService.getAllTags(showArchived)
      ]);
      setNotes(loadedNotes);
      setTags(loadedTags);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setNotes([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    // Filtrar por tag
    if (selectedTag) {
      filtered = filtered.filter(note => note.tags && note.tags.includes(selectedTag));
    }

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(note => 
        note.description?.toLowerCase().includes(searchLower) ||
        note.text?.toLowerCase().includes(searchLower) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Ordenar por fecha
    filtered.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

    setFilteredNotes(filtered);
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta nota general?')) {
      return;
    }

    try {
      await GeneralNotesService.deleteNote(noteId);
      await loadData();
      
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

  const handleEditNote = (note) => {
    setNoteToEdit(note);
    setShowEditModal(true);
  };

  const handleCopyGroupedContent = async () => {
    if (!selectedTag) {
      alert('Por favor, selecciona un tag primero');
      return;
    }

    try {
      const content = await GeneralNotesService.getGroupedContentByTag(selectedTag, showArchived);
      if (content) {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        alert('No hay contenido para copiar');
      }
    } catch (error) {
      console.error('Error copiando contenido:', error);
      alert('Error al copiar el contenido');
    }
  };

  const handleArchive = async (noteId) => {
    try {
      await GeneralNotesService.archiveNote(noteId);
      await loadData();
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setViewingNote(false);
        if (editor) {
          editor.commands.setContent('');
        }
      }
    } catch (error) {
      console.error('Error archivando nota:', error);
      alert('Error al archivar la nota');
    }
  };

  const handleUnarchive = async (noteId) => {
    try {
      await GeneralNotesService.unarchiveNote(noteId);
      await loadData();
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setViewingNote(false);
        if (editor) {
          editor.commands.setContent('');
        }
      }
    } catch (error) {
      console.error('Error desarchivando nota:', error);
      alert('Error al desarchivar la nota');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Notas Generales" size="6xl">
      {/* Toggle para mostrar archivadas */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              !showArchived
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2 ${
              showArchived
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Archive className="w-4 h-4" />
            Históricas
          </button>
        </div>
      </div>
      
      <div className="flex gap-4 h-[600px]">
        {/* Sidebar - Tags y búsqueda */}
        <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 pr-4 flex flex-col">
          {/* Búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex-1 overflow-y-auto">
            <div className="mb-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTag === null
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Todos ({notes.length})
              </button>
            </div>
            {tags.map((tag) => {
              const count = notes.filter(note => note.tags && note.tags.includes(tag)).length;
              return (
                <div key={tag} className="mb-1">
                  <button
                    onClick={() => setSelectedTag(tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      selectedTag === tag
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Botón copiar contenido agrupado */}
          {selectedTag && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCopyGroupedContent}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                {copied ? '¡Copiado!' : 'Copiar contenido agrupado'}
              </button>
            </div>
          )}
        </div>

        {/* Lista de notas */}
        <div className={`flex-1 flex flex-col ${viewingNote ? 'w-1/2' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {selectedTag 
                  ? `No hay notas ${showArchived ? 'archivadas' : ''} con el tag "${selectedTag}"`
                  : searchTerm 
                    ? 'No se encontraron notas'
                    : showArchived
                      ? 'No hay notas históricas'
                      : 'No hay notas generales guardadas'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {filteredNotes.map((note) => (
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {note.description || 'Sin descripción'}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags && note.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {GeneralNotesService.formatDate(note.updatedAt || note.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!showArchived ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(note.id);
                          }}
                          className="p-1 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                          title="Enviar a históricos"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchive(note.id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Restaurar de históricos"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      )}
                      {!showArchived && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditNote(note);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Editar nota"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vista de nota seleccionada */}
        {viewingNote && selectedNote && (
          <div className="w-1/2 flex flex-col border-l border-gray-200 dark:border-gray-700 pl-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedNote.description || 'Sin descripción'}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedNote.tags && selectedNote.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {GeneralNotesService.formatDate(selectedNote.updatedAt || selectedNote.createdAt)}
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
              {!showArchived && (
                <>
                  <button
                    onClick={() => handleArchive(selectedNote.id)}
                    className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Enviar a históricos
                  </button>
                  <button
                    onClick={() => handleEditNote(selectedNote)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </>
              )}
              {showArchived && (
                <button
                  onClick={() => handleUnarchive(selectedNote.id)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <ArchiveRestore className="w-4 h-4" />
                  Restaurar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <GeneralNoteModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setNoteToEdit(null);
        }}
        initialNote={noteToEdit}
        onSave={() => {
          loadData();
          setShowEditModal(false);
          setNoteToEdit(null);
        }}
      />
    </Modal>
  );
}

