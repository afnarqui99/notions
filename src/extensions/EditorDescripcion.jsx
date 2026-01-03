import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand } from './SlashCommand';
import Heading from "@tiptap/extension-heading";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import { TableCellExtended } from "./TableCellExtended";
import { TablaNotionNode } from "./TablaNotionNode";
import { GaleriaImagenesNode } from "./GaleriaImagenesNode";
import { GaleriaArchivosNode } from "./GaleriaArchivosNode";
import { ResumenFinancieroNode } from "./ResumenFinancieroNode";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import lowlight from "./lowlightInstance";
import Link from "@tiptap/extension-link";
import { Toggle } from "./Toggle";

export default function EditorDescripcion({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Toggle,
      TablaNotionNode,
      GaleriaImagenesNode,
      GaleriaArchivosNode,
      ResumenFinancieroNode,
      Heading,
      Underline,
      TextStyle,
      Table,
      TableRow,
      TableHeader,
      TableCellExtended,
      Image,
      Link.configure({ openOnClick: false, autolink: false }),
      Placeholder.configure({ placeholder: "Escribe '/' para comandos..." }),
      SlashCommand,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const limpio = removeUndefinedFields(json);
      onChange(limpio);
    },
  });

  const removeUndefinedFields = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(removeUndefinedFields);
    } else if (typeof obj === "object" && obj !== null) {
      const cleanObj = {};
      for (const key in obj) {
        const val = obj[key];
        if (val !== undefined) {
          cleanObj[key] = removeUndefinedFields(val);
        }
      }
      return cleanObj;
    }
    return obj;
  };

  return (
    <div className="w-full h-full px-4 py-6 overflow-y-auto flex flex-col">
      <EditorContent editor={editor} />
    </div>
  );
}





