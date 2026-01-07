import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand } from './SlashCommand';
import Heading from "@tiptap/extension-heading";
import { CodeBlockWithCopyExtension } from "./CodeBlockWithCopyExtension";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import { TableCellExtended } from "./TableCellExtended";
import { TablaNotionNode } from "./TablaNotionNode";
import { GaleriaImagenesNode } from "./GaleriaImagenesNode";
import { GaleriaArchivosNode } from "./GaleriaArchivosNode";
import { ResumenFinancieroNode } from "./ResumenFinancieroNode";
import { CalendarNode } from "./CalendarNode";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Toggle } from "./Toggle";

export default function EditorDescripcion({ content, onChange }) {
  const isUpdatingFromEditor = useRef(false);
  const lastContentRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockWithCopyExtension,
      Toggle,
      TablaNotionNode,
      GaleriaImagenesNode,
      GaleriaArchivosNode,
      ResumenFinancieroNode,
      CalendarNode,
      Heading,
      Underline,
      TextStyle,
      Table,
      TableRow,
      TableHeader,
      TableCellExtended,
      Image,
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      Link.configure({ openOnClick: false, autolink: false }),
      Placeholder.configure({ placeholder: "Escribe '/' para comandos..." }),
      SlashCommand,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      isUpdatingFromEditor.current = true;
      const json = editor.getJSON();
      const limpio = removeUndefinedFields(json);
      lastContentRef.current = JSON.stringify(limpio);
      onChange(limpio);
      // Resetear la bandera después de un breve delay
      setTimeout(() => {
        isUpdatingFromEditor.current = false;
      }, 100);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  // Actualizar el contenido cuando cambia desde fuera (solo si no estamos actualizando desde el editor)
  useEffect(() => {
    if (!editor) return;
    
    // No actualizar si acabamos de actualizar desde el editor
    if (isUpdatingFromEditor.current) return;

    // Si content es null/undefined, usar objeto vacío para comparar
    const contentToCompare = content || { type: 'doc', content: [] };
    const currentContent = editor.getJSON();
    const contentStr = JSON.stringify(currentContent);
    const newContentStr = JSON.stringify(contentToCompare);
    
    // Solo actualizar si el contenido realmente cambió y no es el mismo que acabamos de enviar
    if (contentStr !== newContentStr && newContentStr !== lastContentRef.current) {
      // Usar un pequeño delay para evitar conflictos con actualizaciones del editor
      const timeoutId = setTimeout(() => {
        if (!isUpdatingFromEditor.current) {
          editor.commands.setContent(contentToCompare, false, {
            preserveWhitespace: 'full',
          });
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [content, editor]);

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
    <div className="w-full h-full px-4 py-6 overflow-y-auto flex flex-col" style={{ position: 'relative' }}>
      <EditorContent editor={editor} />
    </div>
  );
}









