import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import GaleriaArchivosStyle from './GaleriaArchivosStyle';

export const GaleriaArchivosNode = Node.create({
  name: 'galeriaArchivos',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      archivos: {
        default: [],
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-archivos') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: attributes => {
          return {
            'data-archivos': JSON.stringify(attributes.archivos),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'galeria-archivos' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['galeria-archivos', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GaleriaArchivosStyle);
  },
});

