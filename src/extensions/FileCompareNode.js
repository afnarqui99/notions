import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import FileCompareBlock from '../components/FileCompareBlock';

export const FileCompareNode = Node.create({
  name: 'fileCompareBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      leftContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-left-content') || '',
        renderHTML: attributes => {
          if (!attributes.leftContent) return {};
          return {
            'data-left-content': attributes.leftContent,
          };
        },
      },
      rightContent: {
        default: '',
        parseHTML: element => element.getAttribute('data-right-content') || '',
        renderHTML: attributes => {
          if (!attributes.rightContent) return {};
          return {
            'data-right-content': attributes.rightContent,
          };
        },
      },
      leftFileName: {
        default: 'archivo1.txt',
        parseHTML: element => element.getAttribute('data-left-filename') || 'archivo1.txt',
        renderHTML: attributes => {
          return {
            'data-left-filename': attributes.leftFileName,
          };
        },
      },
      rightFileName: {
        default: 'archivo2.txt',
        parseHTML: element => element.getAttribute('data-right-filename') || 'archivo2.txt',
        renderHTML: attributes => {
          return {
            'data-right-filename': attributes.rightFileName,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'file-compare-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['file-compare-block', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileCompareBlock);
  },
});

