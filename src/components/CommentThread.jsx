import { useState } from 'react';
import { MessageSquare, X, CheckCircle, Circle, Send, Trash2 } from 'lucide-react';
import CommentService from '../services/CommentService';
import ConfirmModal from './ConfirmModal';

export default function CommentThread({ comment, onUpdate, onDelete, onResolve, onShowToast }) {
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddReply = async () => {
    if (!replyText.trim()) return;

    try {
      await CommentService.addReply(comment.id, {
        text: replyText,
        author: 'Usuario', // En una app real, esto vendría del contexto de usuario
      });
      setReplyText('');
      setReplying(false);
      if (onUpdate) {
        onUpdate();
      }
      if (onShowToast) {
        onShowToast({
          message: 'Respuesta agregada correctamente',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      if (onShowToast) {
        onShowToast({
          message: 'Error al agregar respuesta',
          type: 'error'
        });
      }
    }
  };

  const handleResolve = async () => {
    try {
      if (comment.resolved) {
        await CommentService.reopenComment(comment.id);
      } else {
        await CommentService.resolveComment(comment.id);
      }
      if (onResolve) {
        onResolve();
      }
      if (onShowToast) {
        onShowToast({
          message: comment.resolved ? 'Comentario reabierto' : 'Comentario resuelto',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error resolviendo comentario:', error);
      if (onShowToast) {
        onShowToast({
          message: 'Error al resolver comentario',
          type: 'error'
        });
      }
    }
  };

  const handleDelete = async () => {
    try {
      await CommentService.deleteComment(comment.id);
      if (onDelete) {
        onDelete();
      }
      if (onShowToast) {
        onShowToast({
          message: 'Comentario eliminado correctamente',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      if (onShowToast) {
        onShowToast({
          message: 'Error al eliminar comentario',
          type: 'error'
        });
      }
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      comment.resolved 
        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {comment.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {CommentService.formatDate(comment.timestamp)}
            </span>
            {comment.resolved && (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                Resuelto
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {comment.text}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleResolve}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
            title={comment.resolved ? 'Reabrir comentario' : 'Resolver comentario'}
          >
            {comment.resolved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Eliminar comentario"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eliminar comentario"
        message="¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Respuestas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 ml-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {reply.author}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {CommentService.formatDate(reply.timestamp)}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {reply.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Formulario de respuesta */}
      {replying ? (
        <div className="mt-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe una respuesta..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleAddReply}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              Enviar
            </button>
            <button
              onClick={() => {
                setReplying(false);
                setReplyText('');
              }}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setReplying(true)}
          className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Responder
        </button>
      )}
    </div>
  );
}
