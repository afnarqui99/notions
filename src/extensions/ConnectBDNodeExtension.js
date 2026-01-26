import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ConnectBDNode from './ConnectBDNode';

export const ConnectBDNodeExtension = Node.create({
  name: 'connectBD',

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      connectionId: {
        default: null,
      },
      connectionName: {
        default: '',
      },
      dbType: {
        default: 'postgresql',
      },
      host: {
        default: '',
      },
      port: {
        default: '',
      },
      database: {
        default: '',
      },
      username: {
        default: '',
      },
      password: {
        default: '',
      },
      ssl: {
        default: false,
      },
      isConnected: {
        default: false,
      },
      queryHistory: {
        default: '[]',
      },
      savedQueries: {
        default: '[]',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="connect-bd"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'connect-bd', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConnectBDNode);
  },
});





