import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageWithMetadata from './ImageWithMetadata';

export const ImageExtended = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      'data-filename': {
        default: null,
        parseHTML: element => element.getAttribute('data-filename'),
        renderHTML: attributes => {
          if (!attributes['data-filename']) {
            return {};
          }
          return {
            'data-filename': attributes['data-filename'],
          };
        },
      },
      'data-nombre': {
        default: null,
        parseHTML: element => element.getAttribute('data-nombre'),
        renderHTML: attributes => {
          if (!attributes['data-nombre']) {
            return {};
          }
          return {
            'data-nombre': attributes['data-nombre'],
          };
        },
      },
      'data-descripcion': {
        default: null,
        parseHTML: element => element.getAttribute('data-descripcion'),
        renderHTML: attributes => {
          if (!attributes['data-descripcion']) {
            return {};
          }
          return {
            'data-descripcion': attributes['data-descripcion'],
          };
        },
      },
      'data-grupo': {
        default: null,
        parseHTML: element => element.getAttribute('data-grupo'),
        renderHTML: attributes => {
          if (!attributes['data-grupo']) {
            return {};
          }
          return {
            'data-grupo': attributes['data-grupo'],
          };
        },
      },
      'data-fecha': {
        default: null,
        parseHTML: element => element.getAttribute('data-fecha'),
        renderHTML: attributes => {
          if (!attributes['data-fecha']) {
            return {};
          }
          return {
            'data-fecha': attributes['data-fecha'],
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageWithMetadata);
  },
});

