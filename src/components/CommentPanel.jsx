import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Plus } from 'lucide-react';
import CommentService from '../services/CommentService';
import CommentThread from './CommentThread';

export default function CommentPanel({ isOpen, onClose, pageId, editor, onShowToast }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [zIndex, setZIndex] = useState(10000);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && pageId) {
      loadComments();
    } else {
      setComments([]);
      setShowNewCommentForm(false);
      setNewCommentText('');
    }
  }, [isOpen, pageId]);

  // Calcular z-index dinámico para estar por encima de las páginas visibles
  useEffect(() => {
    const calculateZIndex = () => {
      if (typeof document === 'undefined') return 10000;
      
      // Buscar todos los modales abiertos
      const openModals = document.querySelectorAll('[data-drawer="table-drawer-modal"]');
      const level = openModals.length;
      
      if (level > 0) {
        // El z-index del modal es: 10000 + (level * 1000) + 1
        // El panel de comentarios debe estar por encima, así que usamos + 100
        return 10000 + (level * 1000) + 100;
      }
      
      // Si no hay modales, usar un z-index alto para estar por encima de las páginas
      return 10000;
    };

    // Actualizar z-index inicial
    setZIndex(calculateZIndex());

    // Actualizar z-index periódicamente para detectar cambios en los modales
    const interval = setInterval(() => {
      setZIndex(calculateZIndex());
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen]);

  const loadComments = async () => {
    if (!pageId) return;
    
    setLoading(true);
    try {
      const loadedComments = await CommentService.getComments(pageId);
      setComments(loadedComments);
    } catch (error) {
      console.error('Error cargando comentarios:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newCommentText.trim() || !pageId) return;

    try {
      // Obtener selección actual del editor si existe
      let selection = null;
      if (editor) {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          selection = {
            from,
            to,
            text: editor.state.doc.textBetween(from, to),
          };
        }
      }

      await CommentService.createComment(pageId, {
        text: newCommentText,
        author: 'Usuario',
        selection: selection,
      });

      setNewCommentText('');
      setShowNewCommentForm(false);
      await loadComments();

      // Si hay selección, marcar el texto con el comentario
      if (selection && editor) {
        // Esto se manejará automáticamente cuando se carguen los comentarios
      }
      
      if (onShowToast) {
        onShowToast({
          message: 'Comentario creado correctamente',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error creando comentario:', error);
      if (onShowToast) {
        onShowToast({
          message: 'Error al crear comentario',
          type: 'error'
        });
      }
    }
  };

  const handleCommentUpdate = async () => {
    await loadComments();
  };

  const handleCommentDelete = async () => {
    await loadComments();
  };

  const handleCommentResolve = async () => {
    await loadComments();
  };

  if (!isOpen) return null;

  const unresolvedComments = comments.filter(c => !c.resolved);
  const resolvedComments = comments.filter(c => c.resolved);

  return (
    <div 
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col"
      style={{ zIndex }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Comentarios
          </h2>
          {unresolvedComments.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full">
              {unresolvedComments.length}
            </span>
          )}
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Botón para nuevo comentario */}
            {!showNewCommentForm && (
              <button
                onClick={() => setShowNewCommentForm(true)}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nuevo comentario
              </button>
            )}

            {/* Formulario de nuevo comentario */}
            {showNewCommentForm && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Escribe tu comentario..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
                  rows={3}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleCreateComment}
                    disabled={!newCommentText.trim()}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Comentar
                  </button>
                  <button
                    onClick={() => {
                      setShowNewCommentForm(false);
                      setNewCommentText('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Comentarios sin resolver */}
            {unresolvedComments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sin resolver ({unresolvedComments.length})
                </h3>
                <div className="space-y-3">
                  {unresolvedComments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      onUpdate={handleCommentUpdate}
                      onDelete={handleCommentDelete}
                      onResolve={handleCommentResolve}
                      onShowToast={onShowToast}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Comentarios resueltos */}
            {resolvedComments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Resueltos ({resolvedComments.length})
                </h3>
                <div className="space-y-3">
                  {resolvedComments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      onUpdate={handleCommentUpdate}
                      onDelete={handleCommentDelete}
                      onResolve={handleCommentResolve}
                      onShowToast={onShowToast}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sin comentarios */}
            {comments.length === 0 && !showNewCommentForm && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay comentarios en esta página</p>
                <p className="text-sm mt-2">Selecciona texto y crea un comentario</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

