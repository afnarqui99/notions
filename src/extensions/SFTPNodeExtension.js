import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import SFTPNode from './SFTPNode';

export const SFTPNodeExtension = Node.create({
  name: 'sftpBlock',

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
      host: {
        default: '',
      },
      port: {
        default: 22,
      },
      username: {
        default: '',
      },
      password: {
        default: '',
      },
      privateKey: {
        default: '',
      },
      passphrase: {
        default: '',
      },
      usePrivateKey: {
        default: false,
      },
      isConnected: {
        default: false,
      },
      currentPath: {
        default: '/',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sftp-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'sftp-block', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SFTPNode);
  },
});

