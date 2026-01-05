import { ReactNodeViewRenderer } from '@tiptap/react'
import { Node } from '@tiptap/core'
import ResumenFinancieroStyle from './ResumenFinancieroStyle'

export const ResumenFinancieroNode = Node.create({
  name: 'resumenFinanciero',
  group: 'block',
  atom: true,

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [{ tag: 'resumen-financiero' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['resumen-financiero', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResumenFinancieroStyle);
  }
});






