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
        // Asegurar que se serialice correctamente en JSON
        toJSON: (value) => {
          return Array.isArray(value) ? value : [];
        },
        fromJSON: (value) => {
          return Array.isArray(value) ? value : [];
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
        // Asegurar que se serialice correctamente en JSON
        toJSON: (value) => {
          return Array.isArray(value) ? value : [];
        },
        fromJSON: (value) => {
          return Array.isArray(value) ? value : [];
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
      comportamiento: {
        default: null,
        parseHTML: element => {
          try {
            const comportamiento = element.getAttribute('data-comportamiento');
            return comportamiento || null;
          } catch {
            return null;
          }
        },
        renderHTML: attributes => {
          if (attributes.comportamiento) {
            return {
              'data-comportamiento': attributes.comportamiento,
            };
          }
          return {};
        },
      },
      tableId: {
        default: null,
        parseHTML: element => {
          try {
            const tableId = element.getAttribute('data-table-id');
            return tableId || null;
          } catch {
            return null;
          }
        },
        renderHTML: attributes => {
          if (attributes.tableId) {
            return {
              'data-table-id': attributes.tableId,
            };
          }
          return {};
        },
      },
      nombreTabla: {
        default: null,
        parseHTML: element => {
          try {
            const nombre = element.getAttribute('data-nombre-tabla');
            return nombre || null;
          } catch {
            return null;
          }
        },
        renderHTML: attributes => {
          if (attributes.nombreTabla) {
            return {
              'data-nombre-tabla': attributes.nombreTabla,
            };
          }
          return {};
        },
      },
      tablasVinculadas: {
        default: [],
        parseHTML: element => {
          try {
            const vinculadas = element.getAttribute('data-tablas-vinculadas');
            return vinculadas ? JSON.parse(vinculadas) : [];
          } catch {
            return [];
          }
        },
        renderHTML: attributes => {
          if (attributes.tablasVinculadas && attributes.tablasVinculadas.length > 0) {
            return {
              'data-tablas-vinculadas': JSON.stringify(attributes.tablasVinculadas),
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









