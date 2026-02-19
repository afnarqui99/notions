import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ScreenSnipper from '../components/ScreenSnipper';

export const ScreenSnipperNode = Node.create({
  name: 'screenSnipper',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      image: {
        default: null,
        parseHTML: element => element.getAttribute('data-image'),
        renderHTML: attributes => {
          if (!attributes.image) return {};
          return {
            'data-image': attributes.image
          };
        }
      },
      selectedArea: {
        default: null,
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-selected-area') || 'null');
          } catch {
            return null;
          }
        },
        renderHTML: attributes => ({
          'data-selected-area': JSON.stringify(attributes.selectedArea)
        })
      },
      annotations: {
        default: [],
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-annotations') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: attributes => ({
          'data-annotations': JSON.stringify(attributes.annotations)
        })
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="screen-snipper"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'screen-snipper', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScreenSnipper);
  }
});











