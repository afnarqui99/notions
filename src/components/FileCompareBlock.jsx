import { useState, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import FileCompare from './FileCompare';

/**
 * Wrapper del componente FileCompare para uso como nodo TipTap
 * Similar a cómo ConsoleBlock usa NodeViewWrapper
 */
export default function FileCompareBlock({ node, updateAttributes, deleteNode }) {
  const [leftContent, setLeftContent] = useState(node.attrs.leftContent || '');
  const [rightContent, setRightContent] = useState(node.attrs.rightContent || '');
  const [leftFileName, setLeftFileName] = useState(node.attrs.leftFileName || 'archivo1.txt');
  const [rightFileName, setRightFileName] = useState(node.attrs.rightFileName || 'archivo2.txt');

  // Sincronizar cambios con el nodo
  const handleLeftContentChange = (content) => {
    setLeftContent(content);
    updateAttributes({
      leftContent: content,
    });
  };

  const handleRightContentChange = (content) => {
    setRightContent(content);
    updateAttributes({
      rightContent: content,
    });
  };

  const handleLeftFileNameChange = (name) => {
    setLeftFileName(name);
    updateAttributes({
      leftFileName: name,
    });
  };

  const handleRightFileNameChange = (name) => {
    setRightFileName(name);
    updateAttributes({
      rightFileName: name,
    });
  };

  return (
    <NodeViewWrapper className="file-compare-wrapper my-4">
      <FileCompare
        leftContent={leftContent}
        rightContent={rightContent}
        leftFileName={leftFileName}
        rightFileName={rightFileName}
        onLeftContentChange={handleLeftContentChange}
        onRightContentChange={handleRightContentChange}
        onLeftFileNameChange={handleLeftFileNameChange}
        onRightFileNameChange={handleRightFileNameChange}
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
}

