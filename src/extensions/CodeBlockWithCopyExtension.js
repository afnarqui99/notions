import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CodeBlockWithCopy from './CodeBlockWithCopy';
import lowlight from './lowlightInstance';

export const CodeBlockWithCopyExtension = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockWithCopy, {
      contentDOMElementTag: 'code',
    });
  },
}).configure({
  lowlight,
  HTMLAttributes: {
    class: 'code-block',
  },
});

