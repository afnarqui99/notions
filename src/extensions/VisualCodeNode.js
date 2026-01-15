import { ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import VisualCodeBlock from '../components/VisualCodeBlock';

export const VisualCodeNode = Node.create({
  name: 'visualCodeBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      projectPath: {
        default: '',
        parseHTML: element => element.getAttribute('data-project-path') || '',
        renderHTML: attributes => {
          if (!attributes.projectPath) return {};
          return {
            'data-project-path': attributes.projectPath,
          };
        },
      },
      openFiles: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-open-files') || '[]',
        renderHTML: attributes => {
          return {
            'data-open-files': attributes.openFiles,
          };
        },
      },
      activeFile: {
        default: '',
        parseHTML: element => element.getAttribute('data-active-file') || '',
        renderHTML: attributes => {
          if (!attributes.activeFile) return {};
          return {
            'data-active-file': attributes.activeFile,
          };
        },
      },
      fileContents: {
        default: '{}',
        parseHTML: element => element.getAttribute('data-file-contents') || '{}',
        renderHTML: attributes => {
          return {
            'data-file-contents': attributes.fileContents,
          };
        },
      },
      fontSize: {
        default: '14',
        parseHTML: element => element.getAttribute('data-font-size') || '14',
        renderHTML: attributes => {
          return {
            'data-font-size': attributes.fontSize,
          };
        },
      },
      theme: {
        default: 'oneDark',
        parseHTML: element => element.getAttribute('data-theme') || 'oneDark',
        renderHTML: attributes => {
          return {
            'data-theme': attributes.theme,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'visual-code-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['visual-code-block', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VisualCodeBlock);
  },
});

