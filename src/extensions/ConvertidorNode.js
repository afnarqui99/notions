import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import ConvertidorBlock from '../components/ConvertidorBlock';

export const ConvertidorNode = Node.create({
  name: 'convertidorBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      conversionType: {
        default: 'markdown-to-pdf',
        parseHTML: element => element.getAttribute('data-conversion-type') || 'markdown-to-pdf',
        renderHTML: attributes => {
          return {
            'data-conversion-type': attributes.conversionType,
          };
        },
      },
      inputContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-input-content') || '',
        renderHTML: attributes => {
          if (!attributes.inputContent) return {};
          return {
            'data-input-content': attributes.inputContent,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'convertidor-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['convertidor-block', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ConvertidorBlock);
  },
});









