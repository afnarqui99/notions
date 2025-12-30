import { ReactNodeViewRenderer } from '@tiptap/react'
import { Node } from '@tiptap/core'
import GaleriaImagenesStyle from './GaleriaImagenesStyle'

export const GaleriaImagenesNode = Node.create({
  name: 'galeriaImagenes',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      imagenes: {
        default: [],
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-imagenes') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: attributes => {
          return {
            'data-imagenes': JSON.stringify(attributes.imagenes),
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'galeria-imagenes' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['galeria-imagenes', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GaleriaImagenesStyle);
  }
});

