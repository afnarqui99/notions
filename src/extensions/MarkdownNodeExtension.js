import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import MarkdownNode from './MarkdownNode';

export const MarkdownNodeExtension = Node.create({
  name: 'markdown',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      content: {
        default: '',
      },
      viewMode: {
        default: 'split', // 'edit', 'preview', 'split'
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="markdown"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'markdown', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MarkdownNode);
  },
});




