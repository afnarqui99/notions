import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import DiagramBlock from '../components/DiagramBlock';

export const DiagramNode = Node.create({
  name: 'diagramBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      diagramType: {
        default: 'flowchart',
        parseHTML: element => element.getAttribute('data-diagram-type') || 'flowchart',
        renderHTML: attributes => {
          return {
            'data-diagram-type': attributes.diagramType,
          };
        },
      },
      content: {
        default: '',
        parseHTML: element => element.getAttribute('data-content') || '',
        renderHTML: attributes => {
          if (!attributes.content) return {};
          return {
            'data-content': attributes.content,
          };
        },
      },
      visualElements: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-visual-elements') || '[]',
        renderHTML: attributes => {
          if (!attributes.visualElements || attributes.visualElements === '[]') return {};
          return {
            'data-visual-elements': attributes.visualElements,
          };
        },
      },
      connections: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-connections') || '[]',
        renderHTML: attributes => {
          if (!attributes.connections || attributes.connections === '[]') return {};
          return {
            'data-connections': attributes.connections,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'diagram-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['diagram-block', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DiagramBlock);
  },
});

