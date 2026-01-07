import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SQLScriptNode from './SQLScriptNode';

export const SQLScriptNodeExtension = Node.create({
  name: 'sqlScript',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      scriptId: {
        default: null,
      },
      content: {
        default: '',
      },
      version: {
        default: '',
      },
      fileName: {
        default: '',
      },
      fileDescription: {
        default: '',
      },
      pageId: {
        default: null,
      },
      pageName: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sql-script"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'sql-script', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SQLScriptNode);
  },
});

