import { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { MessageSquare, X, Check } from 'lucide-react';
import CommentThread from '../components/CommentThread';

export default function CommentNodeView({ node, updateAttributes, editor, getPos }) {
  const [showThread, setShowThread] = useState(false);
  const commentId = node.attrs.commentId;
  const threadId = node.attrs.threadId || commentId;
  const resolved = node.attrs.resolved || false;

  const handleResolve = () => {
    updateAttributes({
      resolved: !resolved,
    });
  };

  const handleDelete = () => {
    if (editor && typeof getPos === 'function') {
      const pos = getPos();
      if (pos !== undefined) {
        editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
      }
    }
  };

  return (
    <NodeViewWrapper as="span" className="comment-marker-wrapper inline-block">
      <span
        className={`
          comment-marker inline-flex items-center gap-1 px-1.5 py-0.5 rounded
          ${resolved 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 line-through' 
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
          }
          cursor-pointer hover:opacity-80 transition-opacity
        `}
        onClick={() => setShowThread(!showThread)}
        title={resolved ? 'Comentario resuelto - Click para ver' : 'Click para ver comentarios'}
      >
        <MessageSquare className="w-3 h-3" />
        {!resolved && <span className="text-xs font-medium">Comentario</span>}
        {resolved && <Check className="w-3 h-3" />}
      </span>

      {showThread && (
        <div className="absolute z-50 mt-2 left-0">
          <CommentThread
            threadId={threadId}
            commentId={commentId}
            onClose={() => setShowThread(false)}
            onResolve={handleResolve}
            onDelete={handleDelete}
            resolved={resolved}
            editor={editor}
            getPos={getPos}
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}

