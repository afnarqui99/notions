import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import React from 'react';
import { createRoot } from 'react-dom/client';
import LocalStorageService from '../services/LocalStorageService';
import templateService from '../services/TemplateService';
import SlashCommandModal from '../components/SlashCommandModal';

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
          
          // Marcar que estamos insertando contenido programáticamente
          window.dispatchEvent(new CustomEvent('inserting-programmatic-content', { 
            detail: { type: props.label || 'command' } 
          }));
          
          // Ejecutar el comando original
          props.command({ editor, range });
          
          // Marcar que terminamos de insertar después de un breve delay
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('finished-inserting-programmatic-content'));
          }, 150);
        },
        items: () => [
          {
            label: "Script SQL",
            description: "Editor de scripts SQL con versionado tipo git - Abre gestor de archivos",
            icon: "📊",
            keywords: ["sql", "script", "database", "versionado", "query", "select", "insert", "update", "delete"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Disparar evento para abrir el gestor de archivos SQL
              window.dispatchEvent(new CustomEvent('open-sql-file-manager'));
            },
          },
          {
            label: "Kanban Board",
            description: "Tabla Kanban con columnas To Do, In Progress, Done - Drag & drop entre columnas",
            icon: "📋",
            keywords: ["board", "kanban", "tablero", "proyectos", "tareas", "drag", "drop"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              
              // Crear una tabla con estructura Kanban
              // La tabla tendrá columnas predefinidas para Kanban
              const filaId = Date.now();
              editor.chain().focus().insertContent({
                type: 'tablaNotion',
                attrs: {
                  nombreTabla: 'Kanban Board',
                  comportamiento: 'kanban',
                  propiedades: [
                    { name: 'Name', type: 'text', visible: true },
                    { name: 'Estado', type: 'select', visible: true, options: ['To Do', 'In Progress', 'Done'] },
                    { name: 'Prioridad', type: 'tags', visible: true, options: ['Alta', 'Media', 'Baja'] },
                    { name: 'Asignado', type: 'tags', visible: true },
                    { name: 'Fecha', type: 'date', visible: true },
                    { name: 'Descripción', type: 'text', visible: true }
                  ],
                  filas: [
                    {
                      id: filaId,
                      Name: 'Ejemplo de tarea', // Name en nivel superior para compatibilidad
                      properties: {
                        Name: { value: 'Ejemplo de tarea', type: 'text' },
                        Estado: { value: 'To Do', type: 'select' },
                        Prioridad: { value: ['Media'], type: 'tags' },
                        Asignado: { value: [], type: 'tags' },
                        Fecha: { value: null, type: 'date' },
                        Descripción: { value: '', type: 'text' }
                      }
                    }
                  ]
                }
              }).run();
            },
          },
          {
            label: "Nota Rápida",
            description: "Abrir modal de notas rápidas para escribir y guardar notas",
            icon: "📝",
            keywords: ["nota", "quicknote", "rapida", "notas", "note"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Disparar evento para abrir el modal de notas rápidas
              window.dispatchEvent(new CustomEvent('open-quick-note'));
            },
          },
          {
            label: "Consola",
            description: "Abrir consola completa para ejecutar código y proyectos completos",
            icon: "💻",
            keywords: ["consola", "console", "terminal", "ejecutar", "codigo", "nodejs", "python", "run", "execute", "modal"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Disparar evento para abrir la consola
              console.log('Disparando evento open-console');
              window.dispatchEvent(new CustomEvent('open-console'));
            },
          },
          {
            label: "Consola en página",
            description: "Insertar consola como bloque en la página (se guarda en el documento)",
            icon: "📝",
            keywords: ["consola-bloque", "console-block", "consola-pagina", "code-run", "ejecutar-bloque"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).insertContent({
                type: 'consoleBlock',
                attrs: {
                  code: '',
                  language: 'nodejs',
                  output: '',
                },
              }).run();
            },
          },
          {
            label: "Centro de Ejecución",
            description: "Abrir página centralizada de terminales y gestión de proyectos",
            icon: "⚡",
            keywords: ["centro-ejecucion", "centro", "terminales", "proyectos", "ejecucion", "central"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              // Disparar evento para abrir el centro de ejecución
              window.dispatchEvent(new CustomEvent('open-centro-ejecucion'));
            },
          },
          {
            label: "Visual Code",
            description: "Editor de código similar a Visual Studio Code con explorador de archivos",
            icon: "📁",
            keywords: ["visualcode", "vscode", "editor", "codigo", "code", "programar", "desarrollar"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).insertContent({
                type: 'visualCodeBlock',
                attrs: {
                  projectPath: '',
                  openFiles: '[]',
                  activeFile: '',
                  fileContents: '{}',
                },
              }).run();
            },
          },
          {
            label: "Convertidor",
            description: "Convertir documentos: Markdown a PDF, PDF a Word, Word a PDF",
            icon: "🔄",
            keywords: ["convertidor", "converter", "pdf", "word", "markdown", "convertir", "documento"],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).insertContent({
                type: 'convertidorBlock',
                attrs: {
                  conversionType: 'markdown-to-pdf',
                  inputContent: '',
                },
              }).run();
            },
          },
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
  label: 'Lista de tareas',
  description: '☑ Lista con checkboxes interactivos',
  icon: '☑',
  keywords: ['todo', 'task', 'tarea', 'checkbox', 'checklist'],
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run();
    
    // Si estamos dentro de una lista, salir de ella primero
    const { state } = editor;
    const { $from } = state.selection;
    
    // Verificar si estamos dentro de un listItem
    let isInList = false;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'listItem' || node.type.name === 'taskItem') {
        isInList = true;
        break;
      }
    }
    
    if (isInList) {
      // Salir de la lista: insertar un párrafo después de la lista actual
      editor.chain().focus().command(({ tr, dispatch }) => {
        const { $from } = tr.selection;
        let targetPos = $from.pos;
        
        // Buscar hacia arriba para encontrar el final de la lista
        for (let depth = $from.depth; depth > 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'bulletList' || node.type.name === 'orderedList' || node.type.name === 'taskList') {
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
    
    // Insertar una lista de tareas directamente
    editor.chain().focus().insertContent({
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: false },
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
  label: 'Convertir a lista de tareas',
  description: 'Convertir texto con [x] y [ ] en checkboxes interactivos',
  icon: '☑',
  keywords: ['convertir', 'checkbox', 'task', 'todo'],
  command: ({ editor, range }) => {
    const { state } = editor;
    const { $from, $to } = state.selection;
    
    // Obtener el texto seleccionado o el párrafo completo
    let text = '';
    let startPos = $from.pos;
    let endPos = $to.pos;
    
    if (startPos === endPos) {
      // Si no hay selección, obtener el párrafo actual
      const paragraph = $from.node(-1);
      if (paragraph) {
        text = paragraph.textContent;
        startPos = $from.start(-1);
        endPos = $from.end(-1);
      }
    } else {
      text = state.doc.textBetween(startPos, endPos);
    }
    
    // Buscar líneas que contengan [x] o [ ]
    const lines = text.split('\n');
    const taskItems = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const checkboxMatch = trimmedLine.match(/^\[([ x])\]\s*(.+)$/);
      
      if (checkboxMatch) {
        const isChecked = checkboxMatch[1] === 'x';
        const taskText = checkboxMatch[2];
        taskItems.push({
          checked: isChecked,
          text: taskText
        });
      } else if (trimmedLine) {
        // Si no tiene checkbox pero tiene texto, crear un task item sin marcar
        taskItems.push({
          checked: false,
          text: trimmedLine
        });
      }
    });
    
    if (taskItems.length === 0) {
      // Si no se encontraron checkboxes, simplemente insertar una lista de tareas vacía
      editor.chain().focus().deleteRange(range).insertContent({
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              {
                type: 'paragraph',
                content: []
              }
            ]
          }
        ]
      }).run();
      return;
    }
    
    // Crear la lista de tareas con los items encontrados
    const taskListContent = taskItems.map(item => ({
      type: 'taskItem',
      attrs: { checked: item.checked },
      content: [
        {
          type: 'paragraph',
          content: item.text ? [{ type: 'text', text: item.text }] : []
        }
      ]
    }));
    
    // Reemplazar el texto seleccionado con la lista de tareas
    editor.chain()
      .focus()
      .deleteRange({ from: startPos, to: endPos })
      .insertContent({
        type: 'taskList',
        content: taskListContent
      })
      .run();
  },
},
{
  label: 'Iconos',
  description: 'Insertar emoji o icono en el texto',
  icon: '😀',
  keywords: ['emoji', 'icono', 'icon', 'smile', 'emoticon'],
  command: ({ editor, range }) => {
    // Disparar evento para abrir el selector de iconos
    window.dispatchEvent(new CustomEvent('open-emoji-picker', {
      detail: { editor, range }
    }));
    // Eliminar el comando slash
    editor.chain().focus().deleteRange(range).run();
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
        icono: '',
      },
      content: [
        {
          type: 'paragraph',
          content: []
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
            icon: '📋',
            label: 'JSON',
            description: 'Formatea y valida JSON con resaltado de sintaxis',
            keywords: ['json', 'formatear', 'formatter', 'validate'],
            command: ({ editor, range }) =>
              editor
                .chain()
                .focus()
                .deleteRange(range)
                .setNode('codeBlock', { language: 'json' })
                .run(),
          },
          {
            icon: '📝',
            label: 'Markdown',
            description: 'Editor de Markdown con vista previa y exportación a PDF',
            keywords: ['markdown', 'md', 'preview', 'pdf', 'exportar'],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              editor.chain().focus().insertContent({
                type: 'markdown',
                attrs: {
                  content: '# Título\n\nEscribe tu markdown aquí...',
                  viewMode: 'split',
                },
              }).run();
            },
          },
          {
            icon: '🚀',
            label: 'Postman',
            description: 'Cliente API para probar endpoints REST (GET, POST, PUT, DELETE) con colecciones',
            keywords: ['postman', 'api', 'rest', 'http', 'request', 'endpoint', 'cliente'],
            command: ({ editor, range }) => {
              editor.chain().focus().deleteRange(range).run();
              editor.chain().focus().insertContent({
                type: 'postmanBlock',
                attrs: {
                  method: 'GET',
                  url: '',
                  headers: '[]',
                  body: '',
                  bodyType: 'json',
                  response: '',
                  collections: '[]',
                },
              }).run();
            },
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
          let modalContainer = null;
          let root = null;
          let isClosing = false; // Flag para evitar abrir un nuevo modal mientras se cierra
          let isModalOpen = false; // Flag para rastrear si el modal está abierto

          return {
            onStart: (props) => {
              if (!props.editor?.isEditable) return;
              
              // Si hay un modal cerrándose, forzar limpieza y continuar
              if (isClosing) {
                console.log('[SlashCommand] Modal cerrándose (isClosing=true), forzando limpieza...');
                // Forzar limpieza de cualquier contenedor que pueda quedar
                const stuckContainers = document.querySelectorAll('#slash-command-modal-container');
                if (stuckContainers.length > 0) {
                  console.log(`[SlashCommand] Forzando limpieza de ${stuckContainers.length} contenedores atascados`);
                  stuckContainers.forEach(container => {
                    try {
                      if (container._reactRoot) {
                        container._reactRoot.unmount();
                        delete container._reactRoot;
                      }
                      if (container.parentNode) {
                        container.parentNode.removeChild(container);
                      }
                    } catch (e) {
                      console.warn('[SlashCommand] Error forzando limpieza:', e);
                    }
                  });
                }
                // Resetear el flag y continuar
                isClosing = false;
                console.log('[SlashCommand] Flag isClosing forzado a false, continuando...');
              }

              console.log('[SlashCommand] onStart llamado');

              // LIMPIEZA AGRESIVA: Remover TODOS los overlays y contenedores relacionados
              // Primero, limpiar todos los contenedores
              const allContainers = document.querySelectorAll('#slash-command-modal-container');
              console.log(`[SlashCommand] Limpiando ${allContainers.length} contenedores existentes`);
              allContainers.forEach((container, index) => {
                try {
                  console.log(`[SlashCommand] Limpiando contenedor ${index + 1}`);
                  if (container._reactRoot) {
                    try {
                      container._reactRoot.unmount();
                      console.log(`[SlashCommand] Root ${index + 1} desmontado`);
                    } catch (e) {
                      console.warn(`[SlashCommand] Error desmontando root ${index + 1}:`, e);
                    }
                    delete container._reactRoot;
                  }
                  if (container.parentNode) {
                    container.parentNode.removeChild(container);
                    console.log(`[SlashCommand] Contenedor ${index + 1} removido del DOM`);
                  }
                } catch (e) {
                  console.error(`[SlashCommand] Error limpiando contenedor ${index + 1}:`, e);
                }
              });
              
              // Segundo, limpiar SOLO overlays del slash command modal
              // Buscar overlays que contengan el contenedor del modal o que sean el contenedor mismo
              const overlaysByClass = document.querySelectorAll('div.fixed.inset-0');
              console.log(`[SlashCommand] Encontrados ${overlaysByClass.length} divs con fixed inset-0`);
              
              overlaysByClass.forEach((overlay, index) => {
                // Verificar si tiene el contenedor del modal como hijo directo o descendiente
                const hasModalContainer = overlay.querySelector('#slash-command-modal-container');
                // Verificar si el overlay mismo es parte del contenedor (el contenedor está dentro del overlay)
                const isPartOfModal = overlay.id === 'slash-command-modal-container' || 
                                      overlay.closest('#slash-command-modal-container');
                // Verificar z-index específico del slash command (70000)
                const zIndex = window.getComputedStyle(overlay).zIndex;
                const isSlashCommandZIndex = zIndex === '70000' || overlay.className.includes('z-[70000]');
                
                // Solo remover si:
                // 1. Tiene el contenedor del modal (es el overlay del slash command), O
                // 2. Es parte del contenedor del modal, O
                // 3. Tiene el z-index específico del slash command (50000) Y no tiene otros identificadores
                if (hasModalContainer || (isSlashCommandZIndex && !overlay.id && !overlay.closest('[id]'))) {
                  console.log(`[SlashCommand] Removiendo overlay del slash command ${index + 1}`, {
                    hasModalContainer: !!hasModalContainer,
                    isSlashCommandZIndex,
                    zIndex,
                    className: overlay.className
                  });
                  try {
                    if (overlay.parentNode) {
                      overlay.parentNode.removeChild(overlay);
                      console.log(`[SlashCommand] Overlay ${index + 1} removido exitosamente`);
                    }
                  } catch (e) {
                    console.error(`[SlashCommand] Error removiendo overlay ${index + 1}:`, e);
                  }
                } else {
                  console.log(`[SlashCommand] Overlay ${index + 1} NO es del slash command, manteniéndolo`, {
                    zIndex,
                    className: overlay.className,
                    id: overlay.id
                  });
                }
              });
              
              // Crear contenedor para el modal inmediatamente después de limpiar
              // Crear contenedor para el modal
              console.log('[SlashCommand] Creando contenedor del modal...');
              modalContainer = document.createElement('div');
              modalContainer.id = 'slash-command-modal-container';
              document.body.appendChild(modalContainer);
              console.log('[SlashCommand] Contenedor creado y agregado al DOM');

              // Crear root de React
              console.log('[SlashCommand] Creando root de React...');
              root = createRoot(modalContainer);
              // Guardar referencia del root en el contenedor para limpieza posterior
              modalContainer._reactRoot = root;
              console.log('[SlashCommand] Root creado');

              // Renderizar el modal
              console.log('[SlashCommand] Renderizando modal...');
              try {
                root.render(
                  React.createElement(SlashCommandModal, {
                    isOpen: true,
                    onClose: () => {
                    console.log('[SlashCommand] onClose llamado');
                    isClosing = true;
                    
                    // Limpiar el root de React
                    if (root) {
                      try {
                        root.unmount();
                        console.log('[SlashCommand] Root desmontado');
                      } catch (e) {
                        console.warn('[SlashCommand] Error desmontando root:', e);
                      }
                      root = null;
                    }
                    // Remover el contenedor del DOM
                    if (modalContainer) {
                      if (modalContainer._reactRoot) {
                        delete modalContainer._reactRoot;
                      }
                      if (modalContainer.parentNode) {
                        try {
                          modalContainer.parentNode.removeChild(modalContainer);
                          console.log('[SlashCommand] Contenedor removido del DOM');
                        } catch (e) {
                          console.warn('[SlashCommand] Error removiendo contenedor:', e);
                        }
                      }
                    }
                    modalContainer = null;
                    
                    // Resetear el flag después de un breve delay
                    setTimeout(() => {
                      isClosing = false;
                      console.log('[SlashCommand] Flag isClosing reseteado');
                    }, 100);
                  },
                  items: props.items || [],
                  query: props.query || '',
                  onSelectCommand: async (item) => {
                    // Prevenir doble ejecución
                    if (item._executing) {
                      console.warn('[SlashCommand] Comando ya está ejecutándose, ignorando...');
                      return;
                    }
                    
                    console.log('[SlashCommand] Comando seleccionado en onStart:', item.label);
                    const { editor, range } = props;
                    
                    // Marcar como ejecutándose
                    item._executing = true;
                    
                    try {
                      // Marcar como cerrando
                      isClosing = true;
                      
                      // Cerrar el modal ANTES de ejecutar el comando para evitar que quede bloqueando
                      if (root) {
                        try {
                          root.unmount();
                          root = null;
                          console.log('[SlashCommand] Root desmontado en onSelectCommand (onStart)');
                        } catch (e) {
                          console.warn('[SlashCommand] Error desmontando root en onSelectCommand:', e);
                        }
                      }
                      if (modalContainer) {
                        if (modalContainer._reactRoot) {
                          delete modalContainer._reactRoot;
                        }
                        if (modalContainer.parentNode) {
                          try {
                            modalContainer.parentNode.removeChild(modalContainer);
                            console.log('[SlashCommand] Contenedor removido en onSelectCommand (onStart)');
                          } catch (e) {
                            console.warn('[SlashCommand] Error removiendo contenedor en onSelectCommand:', e);
                          }
                        }
                        modalContainer = null;
                      }
                      
                      // Resetear el flag después de limpiar
                      setTimeout(() => {
                        isClosing = false;
                        console.log('[SlashCommand] Flag isClosing reseteado en onSelectCommand');
                      }, 150);
                      
                      // Ejecutar el comando después de limpiar
                      editor.chain().focus().deleteRange(range).run();
                      await item.command({ editor, range });
                    } catch (error) {
                      console.error('[SlashCommand] Error ejecutando comando:', error);
                    } finally {
                      // Limpiar la marca después de un delay
                      setTimeout(() => {
                        item._executing = false;
                      }, 1000);
                    }
                  },
                  })
                );
                console.log('[SlashCommand] Modal renderizado exitosamente');
                
                // Verificar que el modal esté en el DOM después de un breve delay
                setTimeout(() => {
                  const container = document.getElementById('slash-command-modal-container');
                  if (container) {
                    const overlay = container.querySelector('div.fixed.inset-0');
                    const modalContent = overlay ? overlay.querySelector('div.bg-white, div.bg-gray-800') : null;
                    const style = overlay ? window.getComputedStyle(overlay) : null;
                    console.log('[SlashCommand] Verificación post-render:', {
                      containerExists: !!container,
                      containerInDOM: container.parentNode !== null,
                      overlayExists: !!overlay,
                      overlayVisible: overlay ? style.display !== 'none' : false,
                      overlayZIndex: overlay ? style.zIndex : 'N/A',
                      overlayPointerEvents: overlay ? style.pointerEvents : 'N/A',
                      modalContentExists: !!modalContent,
                      modalContentVisible: modalContent ? window.getComputedStyle(modalContent).display !== 'none' : false
                    });
                    
                    // Asegurar que el overlay sea interactivo
                    if (overlay) {
                      // Forzar estilos críticos
                      overlay.style.pointerEvents = 'auto';
                      overlay.style.zIndex = '70000';
                      console.log('[SlashCommand] Estilos del overlay forzados');
                      
                      // Verificar si el modal content existe y es visible
                      if (modalContent) {
                        const contentStyle = window.getComputedStyle(modalContent);
                        console.log('[SlashCommand] Estilos del contenido del modal:', {
                          display: contentStyle.display,
                          visibility: contentStyle.visibility,
                          opacity: contentStyle.opacity,
                          zIndex: contentStyle.zIndex
                        });
                      } else {
                        console.warn('[SlashCommand] Contenido del modal no encontrado');
                      }
                    } else {
                      console.error('[SlashCommand] Overlay no encontrado después del render');
                    }
                  } else {
                    console.warn('[SlashCommand] Contenedor no encontrado después del render');
                  }
                }, 100);
              } catch (error) {
                console.error('[SlashCommand] Error renderizando modal:', error);
                // Limpiar en caso de error
                if (root) {
                  try {
                    root.unmount();
                  } catch (e) {
                    console.error('[SlashCommand] Error desmontando root después de error:', e);
                  }
                  root = null;
                }
                if (modalContainer && modalContainer.parentNode) {
                  try {
                    modalContainer.parentNode.removeChild(modalContainer);
                  } catch (e) {
                    console.error('[SlashCommand] Error removiendo contenedor después de error:', e);
                  }
                  modalContainer = null;
                }
              }
            },
            onUpdate: (props) => {
              // Si no hay root o contenedor, intentar recrear
              if (!root || !modalContainer) {
                // Verificar si el contenedor existe pero no hay root
                const existingContainer = document.getElementById('slash-command-modal-container');
                if (existingContainer && !root) {
                  // Limpiar y recrear
                  try {
                    if (existingContainer._reactRoot) {
                      existingContainer._reactRoot.unmount();
                    }
                    if (existingContainer.parentNode) {
                      existingContainer.parentNode.removeChild(existingContainer);
                    }
                  } catch (e) {
                    console.warn('[SlashCommand] Error limpiando en onUpdate:', e);
                  }
                  // Recrear
                  modalContainer = document.createElement('div');
                  modalContainer.id = 'slash-command-modal-container';
                  document.body.appendChild(modalContainer);
                  root = createRoot(modalContainer);
                  modalContainer._reactRoot = root;
                } else {
                  return;
                }
              }

              // Actualizar el modal con nuevos items y query
              root.render(
                React.createElement(SlashCommandModal, {
                  isOpen: true,
                  onClose: () => {
                    console.log('[SlashCommand] onClose llamado en onUpdate');
                    // Limpiar el root de React
                    if (root) {
                      try {
                        root.unmount();
                        root = null;
                      } catch (e) {
                        console.warn('[SlashCommand] Error desmontando root en onUpdate:', e);
                      }
                    }
                    // Remover el contenedor del DOM
                    if (modalContainer) {
                      if (modalContainer._reactRoot) {
                        delete modalContainer._reactRoot;
                      }
                      if (modalContainer.parentNode) {
                        try {
                          modalContainer.parentNode.removeChild(modalContainer);
                        } catch (e) {
                          console.warn('[SlashCommand] Error removiendo contenedor en onUpdate:', e);
                        }
                      }
                      modalContainer = null;
                    }
                  },
                  items: props.items || [],
                  query: props.query || '',
                  onSelectCommand: async (item) => {
                    console.log('[SlashCommand] Comando seleccionado en onUpdate:', item.label);
                    const { editor, range } = props;
                    // Cerrar el modal antes de ejecutar el comando
                    if (root) {
                      try {
                        root.unmount();
                        root = null;
                      } catch (e) {
                        console.warn('[SlashCommand] Error desmontando root en onSelectCommand (onUpdate):', e);
                      }
                    }
                    if (modalContainer) {
                      if (modalContainer._reactRoot) {
                        delete modalContainer._reactRoot;
                      }
                      if (modalContainer.parentNode) {
                        try {
                          modalContainer.parentNode.removeChild(modalContainer);
                        } catch (e) {
                          console.warn('[SlashCommand] Error removiendo contenedor en onSelectCommand (onUpdate):', e);
                        }
                      }
                      modalContainer = null;
                    }
                    // Ejecutar el comando
                    editor.chain().focus().deleteRange(range).run();
                    await item.command({ editor, range });
                  },
                })
              );
            },
            onExit: () => {
              console.log('[SlashCommand] onExit llamado');
              isClosing = true;
              
              // Limpiar cualquier modal que pueda estar en el DOM
              const allContainers = document.querySelectorAll('#slash-command-modal-container');
              console.log(`[SlashCommand] Limpiando ${allContainers.length} contenedores en onExit`);
              allContainers.forEach((container, index) => {
                try {
                  console.log(`[SlashCommand] Limpiando contenedor ${index + 1} en onExit`);
                  if (container._reactRoot) {
                    container._reactRoot.unmount();
                    delete container._reactRoot;
                    console.log(`[SlashCommand] Root ${index + 1} desmontado en onExit`);
                  }
                  if (container.parentNode) {
                    container.parentNode.removeChild(container);
                    console.log(`[SlashCommand] Contenedor ${index + 1} removido en onExit`);
                  }
                } catch (e) {
                  console.warn(`[SlashCommand] Error limpiando contenedor ${index + 1} en onExit:`, e);
                  // Forzar remoción
                  try {
                    if (container.parentNode) {
                      container.parentNode.removeChild(container);
                    }
                  } catch (e2) {
                    console.error(`[SlashCommand] Error forzando remoción del contenedor ${index + 1}:`, e2);
                  }
                }
              });
              
              // Limpiar SOLO overlays del slash command modal
              const overlays = document.querySelectorAll('div.fixed.inset-0');
              if (overlays.length > 0) {
                console.log(`[SlashCommand] Verificando ${overlays.length} overlays en onExit`);
                overlays.forEach((overlay, index) => {
                  const hasModalContainer = overlay.querySelector('#slash-command-modal-container');
                  const zIndex = window.getComputedStyle(overlay).zIndex;
                  const isSlashCommandZIndex = zIndex === '70000' || overlay.className.includes('z-[70000]');
                  
                  // Solo remover si tiene el contenedor del modal o tiene el z-index específico del slash command
                  if (hasModalContainer || (isSlashCommandZIndex && !overlay.id && !overlay.closest('[id]'))) {
                    try {
                      if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                        console.log(`[SlashCommand] Overlay del slash command ${index + 1} removido en onExit`);
                      }
                    } catch (e) {
                      console.warn(`[SlashCommand] Error removiendo overlay ${index + 1} en onExit:`, e);
                    }
                  }
                });
              }
              
              // Limpiar referencias locales
              if (root) {
                try {
                  root.unmount();
                  console.log('[SlashCommand] Root local desmontado en onExit');
                } catch (e) {
                  console.warn('[SlashCommand] Error desmontando root local en onExit:', e);
                }
                root = null;
              }
              if (modalContainer) {
                if (modalContainer._reactRoot) {
                  delete modalContainer._reactRoot;
                }
                modalContainer = null;
              }
              
              // Resetear el flag después de limpiar
              setTimeout(() => {
                isClosing = false;
                console.log('[SlashCommand] Flag isClosing reseteado en onExit');
              }, 150);
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

  // Calcular el z-index dinámico basado en el nivel de anidamiento actual
  // Necesitamos estar por encima del modal más reciente
  const getCurrentModalZIndex = () => {
    // Contar cuántos modales están abiertos
    const openModals = document.querySelectorAll('[data-drawer="table-drawer-modal"]');
    const level = openModals.length;
    // El z-index del modal más reciente es: 10000 + (level * 1000) + 1 (contenido)
    // El menú debe estar por encima, así que usamos + 100 para estar seguro
    return 10000 + (level * 1000) + 100;
  };

  // Usar position: fixed para que funcione correctamente dentro de Portals
  // Las coordenadas de clientRect() ya vienen relativas al viewport
  popup.style.position = 'fixed';
  popup.style.left = `${rect.left}px`;
  
  // Calcular la posición vertical, ajustando si no hay espacio debajo
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const menuHeight = Math.min(300, popup.scrollHeight || 300); // Altura máxima del menú
  
  let topPosition;
  if (spaceBelow >= menuHeight || spaceBelow > spaceAbove) {
    // Hay espacio debajo o es mejor ponerlo debajo
    topPosition = rect.top + rect.height + 6;
  } else {
    // No hay espacio debajo, ponerlo arriba
    topPosition = rect.top - menuHeight - 6;
  }
  
  // Asegurar que el menú no se salga del viewport
  topPosition = Math.max(10, Math.min(topPosition, window.innerHeight - menuHeight - 10));
  
  popup.style.top = `${topPosition}px`;
  popup.style.zIndex = getCurrentModalZIndex(); // Z-index dinámico basado en el nivel actual
}









