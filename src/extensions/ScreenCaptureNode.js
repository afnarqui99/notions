import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ScreenCapture from '../components/ScreenCapture';

export const ScreenCaptureNode = Node.create({
  name: 'screenCapture',
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
        tag: 'div[data-type="screen-capture"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'screen-capture', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ScreenCapture);
  }
});

