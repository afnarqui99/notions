import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import ConsoleBlock from '../components/ConsoleBlock';

export const ConsoleNode = Node.create({
  name: 'consoleBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: '',
        parseHTML: element => element.getAttribute('data-code') || '',
        renderHTML: attributes => {
          if (!attributes.code) return {};
          return {
            'data-code': attributes.code,
          };
        },
      },
      language: {
        default: 'nodejs',
        parseHTML: element => element.getAttribute('data-language') || 'nodejs',
        renderHTML: attributes => {
          return {
            'data-language': attributes.language,
          };
        },
      },
      output: {
        default: '',
        parseHTML: element => element.getAttribute('data-output') || '',
        renderHTML: attributes => {
          if (!attributes.output) return {};
          return {
            'data-output': attributes.output,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'console-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['console-block', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConsoleBlock);
  },
});


