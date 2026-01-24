import LocalStorageService from '../services/LocalStorageService';

export function getSlashCommandItems() {
  return [
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
      icon: '🗄️',
      label: 'Conectar BD',
      description: 'Conectar y consultar bases de datos (PostgreSQL, MySQL, SQL Server)',
      keywords: ['connectbd', 'database', 'bd', 'postgresql', 'mysql', 'sqlserver', 'sql', 'db', 'base de datos', 'conectar'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        editor.chain().focus().insertContent({
          type: 'connectBD',
          attrs: {
            dbType: 'postgresql',
            host: '',
            port: '',
            database: '',
            username: '',
            password: '',
            ssl: false,
            connectionId: null,
            connectionName: '',
            isConnected: false,
            queryHistory: '[]',
            savedQueries: '[]',
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
  ];
}
