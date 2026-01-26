import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ExcelTable from '../components/ExcelTable';

export const ExcelTableNode = Node.create({
  name: 'excelTable',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      rows: {
        default: 5,
        parseHTML: element => parseInt(element.getAttribute('data-rows') || '5'),
        renderHTML: attributes => ({
          'data-rows': attributes.rows
        })
      },
      cols: {
        default: 5,
        parseHTML: element => parseInt(element.getAttribute('data-cols') || '5'),
        renderHTML: attributes => ({
          'data-cols': attributes.cols
        })
      },
      data: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-table-data') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-table-data': JSON.stringify(attributes.data)
        })
      },
      columnWidths: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-column-widths') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-column-widths': JSON.stringify(attributes.columnWidths)
        })
      },
      rowHeights: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-row-heights') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-row-heights': JSON.stringify(attributes.rowHeights)
        })
      },
      columnNames: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-column-names') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-column-names': JSON.stringify(attributes.columnNames)
        })
      },
      cellTextColors: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-cell-text-colors') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-cell-text-colors': JSON.stringify(attributes.cellTextColors)
        })
      },
      cellBackgroundColors: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-cell-background-colors') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-cell-background-colors': JSON.stringify(attributes.cellBackgroundColors)
        })
      },
      columnBackgroundColors: {
        default: {},
        parseHTML: element => {
          try {
            return JSON.parse(element.getAttribute('data-column-background-colors') || '{}');
          } catch {
            return {};
          }
        },
        renderHTML: attributes => ({
          'data-column-background-colors': JSON.stringify(attributes.columnBackgroundColors)
        })
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="excel-table"]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'excel-table', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExcelTable);
  }
});

