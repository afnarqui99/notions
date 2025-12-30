import { ReactNodeViewRenderer } from '@tiptap/react'
import { Node } from '@tiptap/core'
import TablaNotionStyle from './TablaNotionStyle'

export const TablaNotionNode = Node.create({
  name: 'tablaNotion',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      filas: {
        default: [],
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-filas') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: attributes => {
          return {
            'data-filas': JSON.stringify(attributes.filas),
          };
        },
      },
      propiedades: {
        default: [],
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-propiedades') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: attributes => {
          return {
            'data-propiedades': JSON.stringify(attributes.propiedades),
          };
        },
      },
      sprintConfig: {
        default: null,
        parseHTML: element => {
          try {
            const config = element.getAttribute('data-sprint-config');
            return config ? JSON.parse(config) : null;
          } catch {
            return null;
          }
        },
        renderHTML: attributes => {
          if (attributes.sprintConfig) {
            return {
              'data-sprint-config': JSON.stringify(attributes.sprintConfig),
            };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'tabla-notion' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['tabla-notion', HTMLAttributes];
  },


addNodeView() {
  return ReactNodeViewRenderer(TablaNotionStyle);
}
});

