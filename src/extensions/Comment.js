/**
 * Extensión de TipTap para comentarios y anotaciones
 */

import { Mark } from '@tiptap/core';

export const Comment = Mark.create({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const commentId = node.getAttribute('data-comment-id');
          const resolved = node.getAttribute('data-resolved') === 'true';
          return {
            commentId,
            resolved,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...this.options.HTMLAttributes,
        'data-comment': '',
        'data-comment-id': HTMLAttributes.commentId,
        'data-resolved': HTMLAttributes.resolved ? 'true' : 'false',
        class: `comment-mark ${HTMLAttributes.resolved ? 'comment-resolved' : ''}`,
      },
      0,
    ];
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
      resolved: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-resolved') === 'true',
        renderHTML: (attributes) => {
          if (!attributes.resolved) {
            return {};
          }
          return {
            'data-resolved': 'true',
          };
        },
      },
    };
  },
});
