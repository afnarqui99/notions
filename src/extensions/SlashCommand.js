import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import LocalStorageService from '../services/LocalStorageService';
import templateService from '../services/TemplateService';

export const SlashCommand = Extension.create({
  name: 'slash-command',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allow: ({ query }) => {
          // Permitir todos los comandos
          return true;
        },
        filter: ({ items, query }) => {
          // Filtrar items por label, description o keywords
          if (!query) return items;
          const queryLower = query.toLowerCase();
          return items.filter(item => {
            const labelMatch = item.label?.toLowerCase().includes(queryLower);
            const descMatch = item.description?.toLowerCase().includes(queryLower);
            const keywordsMatch = item.keywords?.some(k => k.toLowerCase().includes(queryLower));
            return labelMatch || descMatch || keywordsMatch;
          });
        },
        startOfLine: false,
        command: ({ editor, range, props }) => {
          // Función auxiliar para salir de cualquier bloque antes de ejecutar el comando
          const exitBlock = () => {
            const { state } = editor;
            const { $from } = state.selection;
            
            // Verificar si estamos dentro de algún bloque especial
            let needsExit = false;
            let blockDepth = 0;
            
            for (let depth = $from.depth; depth > 0; depth--) {
              const node = $from.node(depth);
              const nodeType = node.type.name;
              
              // Detectar si estamos en un bloque que necesita salir
              if (nodeType === 'codeBlock' || 
                  nodeType === 'listItem' || 
                  nodeType === 'bulletList' || 
                  nodeType === 'orderedList' ||
                  nodeType === 'heading') {
                needsExit = true;
                blockDepth = depth;
                break;
              }
            }
            
            if (needsExit) {
              // Encontrar el final del bloque y mover el cursor allí
              editor.chain().focus().command(({ tr, dispatch }) => {
                const { $from } = tr.selection;
                let targetPos = $from.pos;
                
                // Buscar el bloque contenedor
                for (let depth = $from.depth; depth > 0; depth--) {
                  const node = $from.node(depth);
                  const nodeType = node.type.name;
                  
                  if (nodeType === 'codeBlock' || 
                      nodeType === 'bulletList' || 
                      nodeType === 'orderedList' ||
                      nodeType === 'heading') {
                    // Encontrar el final de este bloque
                    const blockStart = $from.start(depth);
                    const blockEnd = blockStart + node.nodeSize;
                    targetPos = blockEnd;
                    break;
                  } else if (nodeType === 'listItem') {
                    // Para listItem, buscar el final de la lista padre
                    for (let parentDepth = depth - 1; parentDepth > 0; parentDepth--) {
                      const parentNode = $from.node(parentDepth);
                      if (parentNode.type.name === 'bulletList' || parentNode.type.name === 'orderedList') {
                        const listStart = $from.start(parentDepth);
                        const listEnd = listStart + parentNode.nodeSize;
                        targetPos = listEnd;
                        break;
                      }
                    }
                    break;
                  }
                }
                
                if (dispatch && targetPos !== $from.pos) {
                  tr.setSelection(tr.doc.resolve(targetPos));
                }
                return true;
              }).run();
              
              // Insertar un párrafo vacío para separar
              editor.chain().focus().insertContent({ type: 'paragraph', content: [] }).run();
            }
          };
          
          // Salir del bloque actual si es necesario
          exitBlock();
          
          // Ejecutar el comando original
          props.command({ editor, range });
        },
        items: () => [
          {
  label: "Tabla",
  description: "Insertar una tabla dinámica con columnas configurables",
  icon: "📋",
  keywords: ["tabla", "table", "notion"],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'tablaNotion',
    }).run();
  },
},
          {
  label: "Plantilla Financiero",
  description: "Crear sistema financiero completo con Ingresos, Egresos y Deudas interconectadas",
  icon: "💰",
  keywords: ["financiero", "finanzas", "ingresos", "egresos", "deudas", "plantilla"],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run();
    
    // Crear contenido estructurado para la plantilla financiera
    const contenido = [
      // Título principal
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: '💰 Sistema Financiero' }]
      },
      // Párrafo separador
      { type: 'paragraph', content: [] },
      // Título de gráficas
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '📊 Resumen Financiero' }]
      },
      { type: 'paragraph', content: [] },
      {
        type: 'resumenFinanciero'
      },
      { type: 'paragraph', content: [] },
      // Primera tabla: Ingresos
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '💰 Ingresos' }]
      },
      { type: 'paragraph', content: [] },
      {
        type: 'tablaNotion',
        attrs: {
          nombreTabla: 'Ingresos',
          comportamiento: 'financiero'
        }
      },
      { type: 'paragraph', content: [] },
      // Segunda tabla: Egresos
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '💸 Egresos' }]
      },
      { type: 'paragraph', content: [] },
      {
        type: 'tablaNotion',
        attrs: {
          nombreTabla: 'Egresos',
          comportamiento: 'financiero'
        }
      },
      { type: 'paragraph', content: [] },
      // Tercera tabla: Deudas
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '💳 Deudas' }]
      },
      { type: 'paragraph', content: [] },
      {
        type: 'tablaNotion',
        attrs: {
          nombreTabla: 'Deudas',
          comportamiento: 'financiero'
        }
      }
    ];
    
    editor.chain().focus().insertContent(contenido).run();
  },
},
          {
  label: "Galería de Imágenes",
  description: "Galería organizada con grupos, nombres y descripciones",
  icon: "🖼️",
  keywords: ["imagenes", "galeria", "imagen", "fotos"],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'galeriaImagenes',
    }).run();
  },
},
          {
  label: "Galería de Archivos",
  description: "Organiza cualquier tipo de archivo: videos, PDFs, Excel, ZIP, etc.",
  icon: "📁",
  keywords: ["archivos", "files", "documentos", "videos", "pdf", "excel", "zip"],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'galeriaArchivos',
    }).run();
  },
},
          {
  label: "Calendario",
  description: "Insertar calendario interactivo con eventos y notificaciones",
  icon: "📅",
  keywords: ["calendar", "calendario", "eventos", "fechas", "notificaciones"],
  command: ({ editor, range }) => {
    // Generar UUID para el calendario
    const calendarId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID()
      : 'cal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    editor.chain().focus().deleteRange(range).insertContent({
      type: 'calendar',
      attrs: {
        calendarId: calendarId,
        viewMode: 'month'
      }
    }).run();
  },
},
          {
  label: "Plantilla",
  description: "Insertar contenido de una plantilla",
  icon: "📄",
  keywords: ["template", "plantilla", "template"],
  command: ({ editor, range }) => {
    // Disparar evento para abrir el selector de plantillas
    window.dispatchEvent(new CustomEvent('open-template-selector', {
      detail: { editor, range }
    }));
    // Eliminar el comando slash
    editor.chain().focus().deleteRange(range).run();
  },
},
          {
  label: 'Lista numerada',
  description: '1. Item numerado',
  icon: '🔢',
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run();
    
    // Si estamos dentro de una lista, salir de ella primero
    const { state } = editor;
    const { $from } = state.selection;
    
    // Verificar si estamos dentro de un listItem
    let isInList = false;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'listItem') {
        isInList = true;
        break;
      }
    }
    
    if (isInList) {
      // Salir de la lista: insertar un párrafo después de la lista actual
      // Primero, encontrar el final de la lista
      editor.chain().focus().command(({ tr, dispatch }) => {
        const { $from } = tr.selection;
        let targetPos = $from.pos;
        
        // Buscar hacia arriba para encontrar el final de la lista
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
            // Encontrar el final de esta lista
            const listStart = $from.start(depth);
            const listEnd = listStart + node.nodeSize;
            targetPos = listEnd;
            break;
          }
        }
        
        if (dispatch && targetPos !== $from.pos) {
          tr.setSelection(tr.doc.resolve(targetPos));
        }
        return true;
      }).run();
      
      // Insertar un párrafo vacío para separar
      editor.chain().focus().insertContent({ type: 'paragraph', content: [] }).run();
    }
    
    // Insertar una lista numerada directamente
    editor.chain().focus().insertContent({
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: []
            }
          ]
        }
      ]
    }).run();
  },
},
{
  label: 'Lista con viñetas',
  description: '• Item con viñetas',
  icon: '•',
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run();
    
    // Si estamos dentro de una lista, salir de ella primero
    const { state } = editor;
    const { $from } = state.selection;
    
    // Verificar si estamos dentro de un listItem
    let isInList = false;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'listItem') {
        isInList = true;
        break;
      }
    }
    
    if (isInList) {
      // Salir de la lista: insertar un párrafo después de la lista actual
      // Primero, encontrar el final de la lista
      editor.chain().focus().command(({ tr, dispatch }) => {
        const { $from } = tr.selection;
        let targetPos = $from.pos;
        
        // Buscar hacia arriba para encontrar el final de la lista
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
            // Encontrar el final de esta lista
            const listStart = $from.start(depth);
            const listEnd = listStart + node.nodeSize;
            targetPos = listEnd;
            break;
          }
        }
        
        if (dispatch && targetPos !== $from.pos) {
          tr.setSelection(tr.doc.resolve(targetPos));
        }
        return true;
      }).run();
      
      // Insertar un párrafo vacío para separar
      editor.chain().focus().insertContent({ type: 'paragraph', content: [] }).run();
    }
    
    // Insertar una lista con viñetas directamente
    editor.chain().focus().insertContent({
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: []
            }
          ]
        }
      ]
    }).run();
  },
},
{
  label: 'To List',
  description: 'Convertir el bloque actual en una lista con viñetas',
  icon: '📝',
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).toggleBulletList().run();
  },
},
{
  label: 'Bloque desplegable',
  description: 'Contenido que se puede abrir o cerrar',
  icon: '▸',
  command: ({ editor, range }) => {
    console.log("🧩 Insertando toggle");

    editor.chain().focus().deleteRange(range).run();

    const toggleNode = {
      type: 'toggle',
      attrs: {
        abierto: true,
        titulo: 'Título del bloque',
      },
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Contenido del toggle aquí.' }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '✏️ Editar título',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: '#',
                    'data-edit-toggle': 'true'
                  }
                }
              ],
            },
          ],
        }
      ]
    };

    const success = editor.chain().focus().insertContent(toggleNode).run();
    console.log("✅ Nodo toggle insertado:", success);
  }
},
          {
            icon: '📝',
            label: 'Título grande',
            description: 'Texto principal grande',
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Insertar un heading directamente
              editor.chain().focus().insertContent({
                type: 'heading',
                attrs: { level: 1 },
                content: []
              }).run();
            },
          },
          {
            icon: '🔤',
            label: 'Encabezado',
            description: 'Subtítulo o sección',
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Insertar un heading directamente
              editor.chain().focus().insertContent({
                type: 'heading',
                attrs: { level: 2 },
                content: []
              }).run();
            },
          },
          {
            icon: '📄',
            label: 'Párrafo',
            description: 'Texto normal para escribir',
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Insertar un párrafo directamente
              editor.chain().focus().insertContent({
                type: 'paragraph',
                content: []
              }).run();
            },
          },
          {
            icon: '💻',
            label: 'Bloque de código',
            description: 'Escribe código con resaltado',
            command: ({ editor, range }) =>
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode('codeBlock', { language: 'javascript' })
                .run(),
          },
          {
            icon: '🖼️',
            label: 'Insertar imagen',
            description: 'Sube una imagen con título, descripción y fecha',
            command: async ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();

              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                try {
                  const filename = `${Date.now()}-${file.name}`;
                  await LocalStorageService.saveBinaryFile(filename, file, 'files');
                  const url = await LocalStorageService.getFileURL(filename, 'files');
                  
                  if (url) {
                    // Nombre por defecto (sin extensión)
                    const nombreDefault = file.name.replace(/\.[^/.]+$/, '');
                    const fechaDefault = new Date().toISOString();
                    
                    // Guardar la imagen sin nombre inicialmente para que se abra el modal
                    // El modal se abrirá automáticamente cuando se detecte que no hay nombre
                    editor.chain().focus().setImage({ 
                      src: url,
                      'data-filename': filename,
                      'data-fecha': fechaDefault,
                      // No poner nombre por defecto para que se abra el modal
                    }).run();
                  } else {
                    alert('Error al subir la imagen.');
                  }
                } catch (error) {
                  console.error('Error subiendo imagen:', error);
                  alert('Error al subir la imagen.');
                }
              };
              input.click();
            },
          },
          {
            icon: '🔗',
            label: 'Enlace a página',
            description: 'Crear un enlace a otra página',
            keywords: ['enlace', 'link', 'pagina', 'page'],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              
              // Disparar evento personalizado para abrir el modal de selección de página
              const event = new CustomEvent('openPageLinkModal', {
                detail: { editor }
              });
              window.dispatchEvent(event);
            },
          },
        ],
        render: () => {
          let popup;

          return {
            onStart: (props) => {
              if (!props.editor?.isEditable) return;

              popup = document.createElement('div');
              popup.className =
                'absolute z-50 bg-white border border-gray-300 rounded shadow text-sm';
              popup.style.minWidth = '250px';

              props.items.forEach((item) => {
                const button = document.createElement('button');
                button.className =
                  'block w-full px-3 py-2 text-left hover:bg-gray-100';
                button.innerHTML = `
                  <div class="flex gap-2 items-start">
                    <span class="text-lg">${item.icon}</span>
                    <div>
                      <div class="font-semibold">${item.label}</div>
                      ${
                        item.description
                          ? `<div class="text-xs text-gray-500">${item.description}</div>`
                          : ''
                      }
                    </div>
                  </div>
                `;

                button.onclick = async (event) => {
                  event.stopPropagation();
                  const { editor, range } = props;
                  editor.chain().focus().deleteRange(range).run();
                  await item.command({ editor, range });
                };

                popup.appendChild(button);
              });

              document.body.appendChild(popup);
              updatePopupPosition(popup, props.clientRect);
            },
            onUpdate: (props) => {
              if (!popup) return;
              popup.innerHTML = '';
              props.items.forEach((item) => {
                const button = document.createElement('button');
                button.className =
                  'block w-full px-3 py-2 text-left hover:bg-gray-100';
                button.innerHTML = `
                  <div class="flex gap-2 items-start">
                    <span class="text-lg">${item.icon}</span>
                    <div>
                      <div class="font-semibold">${item.label}</div>
                      ${
                        item.description
                          ? `<div class="text-xs text-gray-500">${item.description}</div>`
                          : ''
                      }
                    </div>
                  </div>
                `;

                button.onclick = async (event) => {
                  event.stopPropagation();
                  const { editor, range } = props;
                  editor.chain().focus().deleteRange(range).run();
                  await item.command({ editor, range });
                };

                popup.appendChild(button);
              });
              updatePopupPosition(popup, props.clientRect);
            },
            onExit: () => {
              if (popup) {
                document.body.removeChild(popup);
                popup = null;
              }
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        ...this.options.suggestion,
        editor: this.editor,
      }),
    ];
  },
});

function updatePopupPosition(popup, clientRect) {
  if (!popup || typeof clientRect !== 'function') return;

  const rect = clientRect();
  if (!rect) return;

  popup.style.position = 'absolute';
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.top + rect.height + window.scrollY + 6}px`;
  popup.style.zIndex = '9999';
}







