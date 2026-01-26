import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from "@tiptap/extension-heading";
import { CodeBlockWithCopyExtension } from "./CodeBlockWithCopyExtension";
import { MarkdownNodeExtension } from "./MarkdownNodeExtension";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import { TableCellExtended } from "./TableCellExtended";
import { TablaNotionNode } from "./TablaNotionNode";
import { ExcelTableNode } from "./ExcelTableNode";
import { GaleriaImagenesNode } from "./GaleriaImagenesNode";
import { GaleriaArchivosNode } from "./GaleriaArchivosNode";
import { CalendarNode } from "./CalendarNode";
import { ConsoleNode } from "./ConsoleNode";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Toggle } from "./Toggle";
import EmojiPicker from '../components/EmojiPicker';
import QuickScrollNavigation from '../components/QuickScrollNavigation';
import CommandButtonModal from '../components/CommandButtonModal';
import { getSlashCommandItems } from '../utils/slashCommandItems';
import { Command } from 'lucide-react';

export default function EditorDescripcion({ content, onChange, autoFocus = false }) {
  const isUpdatingFromEditor = useRef(false);
  const lastContentRef = useRef(null);
  const editorContainerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef(null);
  const [showCommandButtonModal, setShowCommandButtonModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 160, left: 80 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockWithCopyExtension,
      MarkdownNodeExtension,
      Toggle,
      TablaNotionNode,
      ExcelTableNode,
      GaleriaImagenesNode,
      GaleriaArchivosNode,
      CalendarNode,
      ConsoleNode,
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
      Placeholder.configure({ placeholder: "Escribe aquí..." }),
    ],
    content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      // Evitar actualizaciones si estamos procesando contenido desde fuera
      if (procesandoContenidoRef.current) return;
      
      isUpdatingFromEditor.current = true;
      const json = editor.getJSON();
      const limpio = removeUndefinedFields(json);
      const contentStr = JSON.stringify(limpio);
      
      // Solo actualizar si el contenido realmente cambió
      if (contentStr !== lastContentRef.current) {
        lastContentRef.current = contentStr;
        // Usar setTimeout para asegurar que onChange se ejecute fuera del ciclo de renderizado
        // Esto evita el error "Cannot update a component while rendering a different component"
        setTimeout(() => {
          if (!procesandoContenidoRef.current) {
            onChange(limpio);
          }
        }, 0);
      }
      
      // Resetear la bandera después de un breve delay
      setTimeout(() => {
        isUpdatingFromEditor.current = false;
      }, 100);
    },
    onCreate: ({ editor }) => {
      // Asegurar que el editor esté completamente inicializado
      // Esto es especialmente importante cuando se renderiza en un Portal
      // Los plugins (como Suggestion) necesitan que el editor esté completamente montado
      if (editor && editor.view && editor.view.dom) {
        const editorElement = editor.view.dom;
        // Asegurar que el elemento tenga tabindex para poder recibir focus
        if (!editorElement.hasAttribute('tabindex')) {
          editorElement.setAttribute('tabindex', '0');
        }
        // Asegurar que el editor esté editable (importante para que los plugins funcionen)
        if (editorElement.contentEditable !== 'true') {
          editorElement.contentEditable = 'true';
        }
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: 'width: 100%; max-width: 100%; box-sizing: border-box; overflow-x: hidden;',
        tabindex: '0',
      },
      // No agregar handleDOMEvents para permitir que el plugin Suggestion maneje los eventos correctamente
      // Pero asegurar que los eventos de teclado se propaguen correctamente
      handleDOMEvents: {
        keydown: (view, event) => {
          // Si el evento viene de un textarea dentro de un MarkdownNode, no interceptarlo
          const target = event.target;
          if (target && target.tagName === 'TEXTAREA') {
            // Verificar si el textarea está dentro de un MarkdownNode
            const markdownNode = target.closest('.markdown-node-wrapper, .markdown-node');
            if (markdownNode) {
              // Permitir que el textarea maneje el evento normalmente
              return false; // false significa que no interceptamos el evento
            }
          }
          // Permitir que el plugin Suggestion maneje el evento '/'
          // No interceptar el evento, solo asegurar que se propague
          return false; // false significa que no interceptamos el evento
        },
        mousedown: (view, event) => {
          // Si el evento viene de un textarea dentro de un MarkdownNode, no interceptarlo
          const target = event.target;
          if (target && target.tagName === 'TEXTAREA') {
            // Verificar si el textarea está dentro de un MarkdownNode
            const markdownNode = target.closest('.markdown-node-wrapper, .markdown-node');
            if (markdownNode) {
              // Permitir que el textarea maneje el evento normalmente
              return false; // false significa que no interceptamos el evento
            }
          }
          return false;
        },
        click: (view, event) => {
          // Si el evento viene de un textarea dentro de un MarkdownNode, no interceptarlo
          const target = event.target;
          if (target && target.tagName === 'TEXTAREA') {
            // Verificar si el textarea está dentro de un MarkdownNode
            const markdownNode = target.closest('.markdown-node-wrapper, .markdown-node');
            if (markdownNode) {
              // Permitir que el textarea maneje el evento normalmente
              return false; // false significa que no interceptamos el evento
            }
          }
          return false;
        },
        focus: (view, event) => {
          // Si el evento viene de un textarea dentro de un MarkdownNode, no interceptarlo
          const target = event.target;
          if (target && target.tagName === 'TEXTAREA') {
            // Verificar si el textarea está dentro de un MarkdownNode
            const markdownNode = target.closest('.markdown-node-wrapper, .markdown-node');
            if (markdownNode) {
              // Permitir que el textarea maneje el evento normalmente
              return false; // false significa que no interceptamos el evento
            }
          }
          return false;
        },
      },
    },
  });

  // Asegurar que el editor tenga focus cuando se monta (especialmente importante para modales con Portal)
  // Y que los plugins (especialmente Suggestion) estén correctamente inicializados
  useEffect(() => {
    if (!editor) return;
    
    // Cuando se renderiza en un Portal, necesitamos asegurar que el editor esté completamente listo
    // y que los event listeners de los plugins estén registrados
    const initializeEditor = () => {
      if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
        const editorElement = editor.view.dom;
        
        // Asegurar que el elemento tenga tabindex para poder recibir focus
        if (!editorElement.hasAttribute('tabindex')) {
          editorElement.setAttribute('tabindex', '0');
        }
        
        // Verificar que el editor esté editable (importante para que los plugins funcionen)
        if (editorElement.contentEditable !== 'true') {
          editorElement.contentEditable = 'true';
        }
        
        // Verificar que el plugin Suggestion esté correctamente inicializado
        // El plugin Suggestion registra event listeners en el DOM del editor
        // Cuando el editor está en un Portal, necesitamos asegurar que estos listeners estén activos
        const verifySuggestionPlugin = () => {
          if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
            const dom = editor.view.dom;
            // Verificar que el editor tenga focus y esté editable
            if (dom.contentEditable !== 'true') {
              dom.contentEditable = 'true';
            }
            // Asegurar que el editor tenga focus para que los event listeners funcionen
            if (!editor.isFocused || document.activeElement !== dom) {
              dom.focus();
              editor.commands.focus();
            }
          }
        };
        
        // Si autoFocus está activado, dar focus al editor
        if (autoFocus) {
          // Usar múltiples delays para asegurar que el Portal esté completamente montado
          // y que los plugins se hayan inicializado
          const ensureFocus = () => {
            verifySuggestionPlugin();
          };
          
          // Intentar dar focus y verificar el plugin en múltiples momentos
          setTimeout(ensureFocus, 200);
          setTimeout(ensureFocus, 500);
          setTimeout(ensureFocus, 800);
          setTimeout(ensureFocus, 1200);
        } else {
          // Aún así verificar el plugin después de un delay
          setTimeout(verifySuggestionPlugin, 500);
        }
      }
    };
    
    // Esperar a que el Portal se monte completamente
    const timeoutId = setTimeout(initializeEditor, 100);
    
    // Agregar un listener directo para verificar que el plugin Suggestion funcione
    // Esto es especialmente importante cuando el editor está en un Portal
    const addKeyboardListener = () => {
      if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
        const dom = editor.view.dom;
        
        // Agregar un listener directo para el evento '/' para debug
        const handleKeyDown = (e) => {
          // Si el evento viene de un textarea dentro de un MarkdownNode, no hacer nada
          const target = e.target;
          if (target && target.tagName === 'TEXTAREA') {
            const markdownNode = target.closest('.markdown-node-wrapper, .markdown-node');
            if (markdownNode) {
              // No interferir con el textarea del MarkdownNode
              return;
            }
          }
          
          // Si el usuario presiona '/', asegurar que el editor tenga focus
          if (e.key === '/' && document.activeElement !== dom) {
            dom.focus();
            editor.commands.focus();
          }
        };
        
        // Agregar el listener con capture: true para asegurar que se capture antes que otros listeners
        dom.addEventListener('keydown', handleKeyDown, true);
        
        return () => {
          dom.removeEventListener('keydown', handleKeyDown, true);
        };
      }
    };
    
    const listenerTimeoutId = setTimeout(addKeyboardListener, 300);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(listenerTimeoutId);
    };
  }, [editor, autoFocus]);

  // Ref para evitar actualizaciones durante el procesamiento
  const procesandoContenidoRef = useRef(false);
  
  // Actualizar el contenido cuando cambia desde fuera (solo si no estamos actualizando desde el editor)
  useEffect(() => {
    if (!editor) return;
    
    // No actualizar si acabamos de actualizar desde el editor o si estamos procesando
    if (isUpdatingFromEditor.current || procesandoContenidoRef.current) return;

    // Validar y normalizar el contenido antes de establecerlo
    let contentToCompare;
    // Un documento vacío válido en TipTap necesita al menos un párrafo
    const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
    
    if (!content || (typeof content === 'object' && Object.keys(content).length === 0)) {
      // Si el contenido es null, undefined, o un objeto vacío, usar un documento vacío válido
      contentToCompare = emptyDoc;
    } else if (typeof content === 'string') {
      // Si es un string, intentar parsearlo o usar un documento vacío válido
      if (content.trim() === '') {
        contentToCompare = emptyDoc;
      } else {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
            contentToCompare = parsed;
          } else {
            contentToCompare = emptyDoc;
          }
        } catch {
          contentToCompare = emptyDoc;
        }
      }
    } else if (typeof content === 'object' && content.type === 'doc') {
      // Si es un objeto válido con type 'doc', validar su estructura
      if (Array.isArray(content.content) && content.content.length > 0) {
        contentToCompare = content;
      } else {
        // Si no tiene contenido o el contenido está vacío, usar un documento con un párrafo vacío
        contentToCompare = emptyDoc;
      }
    } else {
      // Para cualquier otro caso, usar un documento vacío válido
      contentToCompare = emptyDoc;
    }

    // Asegurar que el contenido tenga la estructura correcta
    if (!contentToCompare.type || contentToCompare.type !== 'doc') {
      contentToCompare = emptyDoc;
    }
    if (!Array.isArray(contentToCompare.content) || contentToCompare.content.length === 0) {
      // Si no hay contenido, agregar al menos un párrafo vacío
      contentToCompare = { ...contentToCompare, content: [{ type: 'paragraph' }] };
    }

    const currentContent = editor.getJSON();
    const contentStr = JSON.stringify(currentContent);
    const newContentStr = JSON.stringify(contentToCompare);
    
    // Solo actualizar si el contenido realmente cambió y no es el mismo que acabamos de enviar
    if (contentStr !== newContentStr && newContentStr !== lastContentRef.current) {
      // Marcar que estamos procesando para evitar bucles
      procesandoContenidoRef.current = true;
      
      // Usar requestAnimationFrame y setTimeout para asegurar que se ejecute fuera del ciclo de renderizado
      // Esto evita el error "Cannot update a component while rendering a different component"
      let timeoutId = null;
      const frameId = requestAnimationFrame(() => {
        timeoutId = setTimeout(() => {
          if (!isUpdatingFromEditor.current && editor && !editor.isDestroyed) {
            try {
              editor.commands.setContent(contentToCompare, false, {
                preserveWhitespace: 'full',
              });
              // Actualizar lastContentRef después de establecer el contenido
              lastContentRef.current = newContentStr;
            } catch (error) {
              // Si hay un error al establecer el contenido, usar un documento vacío válido
              console.warn('Error al establecer contenido en el editor, usando documento vacío:', error);
              try {
                // Un documento vacío válido en TipTap necesita al menos un párrafo
                editor.commands.setContent({ type: 'doc', content: [{ type: 'paragraph' }] }, false, {
                  preserveWhitespace: 'full',
                });
                lastContentRef.current = JSON.stringify(emptyDoc);
              } catch (fallbackError) {
                console.error('Error al establecer documento vacío:', fallbackError);
                // Si aún falla, intentar con un documento completamente nuevo
                try {
                  editor.commands.clearContent();
                } catch (clearError) {
                  console.error('Error al limpiar el editor:', clearError);
                }
              }
            } finally {
              // Liberar el flag después de un breve delay
              setTimeout(() => {
                procesandoContenidoRef.current = false;
              }, 100);
            }
          } else {
            procesandoContenidoRef.current = false;
          }
        }, 0);
      });
      
      return () => {
        cancelAnimationFrame(frameId);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        procesandoContenidoRef.current = false;
      };
    }
  }, [content, editor]);

  // Manejar el emoji picker cuando viene del editor dentro del Portal
  useEffect(() => {
    if (!editor) return;

    const handleOpenEmojiPicker = (event) => {
      // Verificar si el evento viene de este editor
      // El evento incluye el editor en el detail
      if (!event.detail || !event.detail.editor) {
        return;
      }
      
      const eventEditor = event.detail.editor;
      
      // Si el editor del evento es diferente al editor de la página principal, manejarlo aquí
      // Esto significa que viene del editor dentro del Portal
      if (eventEditor === editor) {
        // Prevenir que el listener de LocalEditor.jsx maneje este evento
        event.stopImmediatePropagation();
        event.preventDefault();
        
        // Verificar si estamos dentro de un Portal
        const isInPortal = typeof document !== 'undefined' && 
          !!document.querySelector('[data-drawer="table-drawer-modal"]');
        
        // Solo manejar si estamos en un Portal o si el editor tiene focus
        if (isInPortal || editor.isFocused) {
          // Obtener la posición del cursor
          const { state } = editor;
          const { $from } = state.selection;
          const coords = editor.view.coordsAtPos($from.pos);
          
        // Calcular posición para mostrar el picker centrado cerca del cursor
        // El EmojiPicker tiene un ancho de 420px, así que lo centramos respecto al cursor
        const pickerWidth = 420;
        const pickerHeight = 400; // Altura aproximada del picker
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calcular posición horizontal (centrado respecto al cursor, pero ajustado si se sale del viewport)
        let leftPosition = coords.left + window.scrollX - (pickerWidth / 2);
        if (leftPosition < 10) {
          leftPosition = 10; // Mínimo 10px del borde izquierdo
        } else if (leftPosition + pickerWidth > viewportWidth - 10) {
          leftPosition = viewportWidth - pickerWidth - 10; // Ajustar si se sale por la derecha
        }
        
        // Calcular posición vertical (debajo del cursor, pero ajustado si no hay espacio)
        let topPosition = coords.bottom + window.scrollY + 10;
        const spaceBelow = viewportHeight - (coords.bottom + window.scrollY);
        const spaceAbove = coords.top + window.scrollY;
        
        if (spaceBelow < pickerHeight && spaceAbove > spaceBelow) {
          // No hay espacio debajo, ponerlo arriba
          topPosition = coords.top + window.scrollY - pickerHeight - 10;
        } else if (topPosition + pickerHeight > viewportHeight - 10) {
          // Ajustar si se sale por abajo
          topPosition = viewportHeight - pickerHeight - 10;
        }
        
        setEmojiPickerPosition({
          top: Math.max(10, topPosition),
          left: Math.max(10, leftPosition)
        });
          
          setShowEmojiPicker(true);
        }
      }
    };

    // Agregar listener con capture: true para interceptar antes que LocalEditor.jsx
    // Usar capture phase para asegurar que se ejecute primero
    window.addEventListener('open-emoji-picker', handleOpenEmojiPicker, { capture: true, passive: false });
    
    return () => {
      window.removeEventListener('open-emoji-picker', handleOpenEmojiPicker, { capture: true });
    };
  }, [editor]);

  // Cerrar emoji picker al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Trackear posición del cursor para el botón flotante
  // El botón se mantiene fijo a la izquierda y sigue el cursor verticalmente
  useEffect(() => {
    if (!editor) return;

    const updateCursorPosition = () => {
      try {
        const { state, view } = editor;
        const { from, $from } = state.selection;
        const coords = view.coordsAtPos(from);
        const editorContainer = editorContainerRef.current;
        
        if (editorContainer && coords) {
          const containerRect = editorContainer.getBoundingClientRect();
          
          // Posición horizontal: fija a la izquierda del área de escritura (80px)
          // El botón está dentro del contenedor del editor, así que la posición es relativa a ese contenedor
          const leftPos = 80;
          
            // Detectar si el cursor está dentro de un nodo especial (tabla, markdown, postman)
            let topPos;
            const depth = $from.depth;
            
            // Buscar nodos especiales en la jerarquía desde el más externo
            let specialNode = null;
            let specialNodePos = null;
            
            // Lista de nodos especiales en orden de prioridad (más externos primero)
            const specialNodeTypes = ['table', 'tablaNotion', 'markdownNode', 'postmanBlock', 'consoleBlock'];
            
            // Buscar desde el nivel más alto hacia abajo
            for (let i = depth; i >= 0; i--) {
              const node = $from.node(i);
              const nodePos = $from.start(i) - 1;
              const nodeType = node.type.name;
              
              // Verificar si es un nodo especial de nivel bloque
              if (specialNodeTypes.includes(nodeType)) {
                specialNode = node;
                specialNodePos = nodePos;
                break;
              }
              
              // También verificar si estamos dentro de una tabla (tableRow o tableCell indica que estamos en una tabla)
              if ((nodeType === 'tableRow' || nodeType === 'tableCell' || nodeType === 'tableHeader') && !specialNode) {
                // Buscar el nodo table padre
                for (let j = i - 1; j >= 0; j--) {
                  const parentNode = $from.node(j);
                  if (parentNode.type.name === 'table') {
                    specialNode = parentNode;
                    specialNodePos = $from.start(j) - 1;
                    break;
                  }
                }
                if (specialNode) break;
              }
            }
          
          if (specialNode && specialNodePos !== null) {
            // Si el cursor está dentro de un nodo especial, posicionar el botón debajo del nodo
            try {
              const nodeStart = specialNodePos + 1;
              const nodeEnd = nodeStart + specialNode.nodeSize - 1;
              const nodeEndCoords = view.coordsAtPos(nodeEnd);
              
              // Calcular posición relativa al contenedor sin acumular scroll
              topPos = nodeEndCoords.bottom - containerRect.top + 20;
            } catch (e) {
              // Fallback: usar posición del cursor
              topPos = coords.bottom - containerRect.top + 20;
            }
          } else {
            // Si no está en un nodo especial, seguir el cursor
            // Usar coords.bottom para posicionar debajo del cursor
            // Calcular posición relativa al contenedor sin acumular scroll
            topPos = coords.bottom - containerRect.top + 20;
          }
          
          // Asegurar que el botón no se salga por arriba
          if (topPos < 20) {
            topPos = 20;
          }
          
          setCursorPosition({ top: topPos, left: leftPos });
        }
      } catch (e) {
        // Ignorar errores al obtener posición del cursor
        console.warn('Error al actualizar posición del cursor:', e);
      }
    };

    const handleUpdate = () => {
      updateCursorPosition();
    };

    const handleSelectionUpdate = () => {
      updateCursorPosition();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('update', handleUpdate);
    editor.on('focus', handleUpdate);

    const scrollContainer = editorContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateCursorPosition, { passive: true });
    }

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('update', handleUpdate);
      editor.off('focus', handleUpdate);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', updateCursorPosition);
      }
    };
  }, [editor]);

  const handleEmojiSelect = (emoji) => {
    if (!editor) return;
    
    // Insertar el emoji en la posición actual del cursor
    editor.chain().focus().insertContent({
      type: 'text',
      text: emoji
    }).run();
    
    setShowEmojiPicker(false);
  };

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
    <div 
      ref={editorContainerRef}
      className="w-full h-full px-4 py-6 overflow-y-auto flex flex-col relative bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors" 
      style={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
      tabIndex={-1}
      onClick={(e) => {
        // Cuando el usuario hace clic en cualquier parte, asegurar que el editor tenga focus
        // Esto es importante para que los comandos slash funcionen en modales con Portal
        if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
          const editorElement = editor.view.dom;
          
          // Asegurar que el elemento tenga tabindex
          if (!editorElement.hasAttribute('tabindex')) {
            editorElement.setAttribute('tabindex', '0');
          }
          
          // Asegurar que el editor esté editable
          if (editorElement.contentEditable !== 'true') {
            editorElement.contentEditable = 'true';
          }
          
          // Dar focus al editor si no lo tiene
          if (!editor.isFocused || document.activeElement !== editorElement) {
            requestAnimationFrame(() => {
              if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
                const dom = editor.view.dom;
                dom.focus();
                editor.commands.focus();
                // Asegurar que el editor esté editable
                if (dom.contentEditable !== 'true') {
                  dom.contentEditable = 'true';
                }
              }
            });
          }
        }
      }}
    >
      {/* Botón flotante de comandos - fijo a la izquierda, sigue el cursor verticalmente */}
      {editor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowCommandButtonModal(true);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="absolute z-50 bg-pink-600 hover:bg-pink-700 text-white rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-2 border-white pointer-events-auto"
          style={{
            top: `${cursorPosition.top}px`,
            left: `${cursorPosition.left}px`,
            width: '44px',
            height: '44px',
            boxShadow: '0 4px 12px rgba(219, 39, 119, 0.4)',
          }}
          title="Insertar comando"
        >
          <Command className="w-5 h-5" />
        </button>
      )}

      <EditorContent editor={editor} />
      
      {/* Emoji Picker para el editor dentro del Portal */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="fixed"
          style={{
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
            // Calcular z-index dinámico para estar por encima del menú de sugerencias
            zIndex: (() => {
              const openModals = document.querySelectorAll('[data-drawer="table-drawer-modal"]');
              const level = openModals.length;
              // El menú de sugerencias tiene: 10000 + (level * 1000) + 100
              // El EmojiPicker debe estar por encima, así que usamos + 200
              return 10000 + (level * 1000) + 200;
            })()
          }}
        >
          <EmojiPicker
            onSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
            currentEmoji=""
          />
        </div>
      )}
      
      {/* Navegación rápida */}
      <QuickScrollNavigation containerRef={editorContainerRef} />

      {/* Modal de Comandos */}
      {showCommandButtonModal && editor && (
        <CommandButtonModal
          isOpen={showCommandButtonModal}
          onClose={() => {
            setShowCommandButtonModal(false);
          }}
          items={getSlashCommandItems()}
          onSelectCommand={(item) => {
            // Cerrar el modal
            setShowCommandButtonModal(false);
            
            // Ejecutar el comando después de un pequeño delay
            setTimeout(() => {
              const { from, to } = editor.state.selection;
              const range = { from, to };
              
              if (item.command) {
                item.command({ editor, range });
              }
            }, 50);
          }}
        />
      )}
    </div>
  );
}









