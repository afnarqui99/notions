import { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import { TableCellExtended } from "../extensions/TableCellExtended";
import { TablaNotionNode } from "../extensions/TablaNotionNode";
import { GaleriaImagenesNode } from "../extensions/GaleriaImagenesNode";
import { GaleriaArchivosNode } from "../extensions/GaleriaArchivosNode";
import { ResumenFinancieroNode } from "../extensions/ResumenFinancieroNode";
import { CalendarNode } from "../extensions/CalendarNode";
import TableHeader from "@tiptap/extension-table-header";
import { ImageExtended } from "../extensions/ImageExtended";
import Placeholder from "@tiptap/extension-placeholder";
import lowlight from "../extensions/lowlightInstance";
import { SlashCommand } from "../extensions/SlashCommand";
import Link from "@tiptap/extension-link";
import { Toggle } from "../extensions/Toggle";
import { Settings, Plus, Image as ImageIcon, Paperclip, Download, Trash2 } from "lucide-react";
import LocalStorageService from "../services/LocalStorageService";
import Modal from "./Modal";
import ConfigModal from "./ConfigModal";
import NewPageModal from "./NewPageModal";
import PageLinkModal from "./PageLinkModal";
import StorageWarning from "./StorageWarning";
import Toast from "./Toast";
import Sidebar from "./Sidebar";
import { PageContext } from '../utils/pageContext';

export default function LocalEditor({ onShowConfig }) {
  // Función helper para extraer emoji del título
  const extraerEmojiDelTitulo = (tituloTexto) => {
    if (!tituloTexto || typeof tituloTexto !== 'string') return null;
    const trimmed = tituloTexto.trim();
    if (!trimmed) return null;
    const firstChar = trimmed[0];
    const code = firstChar.codePointAt(0);
    // Rangos Unicode comunes de emojis
    if (
      (code >= 0x1F300 && code <= 0x1F9FF) ||
      (code >= 0x2600 && code <= 0x26FF) ||
      (code >= 0x2700 && code <= 0x27BF) ||
      (code >= 0x1F600 && code <= 0x1F64F) ||
      (code >= 0x1F680 && code <= 0x1F6FF) ||
      (code >= 0x2190 && code <= 0x21FF) ||
      (code >= 0x2300 && code <= 0x23FF) ||
      (code >= 0x2B50 && code <= 0x2B55) ||
      code === 0x3030 || code === 0x3299 ||
      (code >= 0x1F900 && code <= 0x1F9FF)
    ) {
      return firstChar;
    }
    return null;
  };

  // Función helper para quitar el emoji del título
  const quitarEmojiDelTitulo = (tituloTexto) => {
    if (!tituloTexto || typeof tituloTexto !== 'string') return tituloTexto;
    const emoji = extraerEmojiDelTitulo(tituloTexto);
    if (emoji) {
      const tituloSinEmoji = tituloTexto.trim().substring(emoji.length).trim();
      return tituloSinEmoji || 'Sin título';
    }
    return tituloTexto.trim();
  };

  const [titulo, setTitulo] = useState("");
  const editorRef = useRef(null);
  const intervaloRef = useRef(null);
  const [paginas, setPaginas] = useState([]);
  const [paginaSeleccionada, setPaginaSeleccionada] = useState(null);
  const [tituloPaginaActual, setTituloPaginaActual] = useState("");
  const [filtroPagina, setFiltroPagina] = useState("");
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [modalError, setModalError] = useState({ isOpen: false, message: '', title: '' });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [paginaPadreParaNueva, setPaginaPadreParaNueva] = useState(null);
  const [showPageLinkModal, setShowPageLinkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paginaAEliminar, setPaginaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [handleVersion, setHandleVersion] = useState(0);
  const [toast, setToast] = useState(null);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const ultimoContenidoRef = useRef(null);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [favoritos, setFavoritos] = useState(() => {
    try {
      const saved = localStorage.getItem('notion-favoritos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Convertir URLs blob a referencias de archivo antes de guardar
  const convertirBlobsAReferencias = (contenido) => {
    if (!contenido || !contenido.content) return contenido;
    
    const procesarNodo = (node) => {
      if (!node) return node;
      
      // Si es una imagen, convertir URL blob a referencia de archivo
      if (node.type === 'image' && node.attrs?.src) {
        const src = node.attrs.src;
        // Intentar obtener el filename de diferentes formas
        let filename = node.attrs['data-filename'] || node.attrs['dataFilename'] || node.attrs.dataFilename;
        
        // Si tenemos el nombre del archivo guardado, usar referencia de archivo
        if (filename) {
          return {
            ...node,
            attrs: {
              ...node.attrs,
              src: `./files/${filename}`,  // Guardar como referencia de archivo
              'data-filename': filename,   // Mantener el nombre del archivo
              dataFilename: filename        // También guardar sin guión por si acaso
            }
          };
        }
        
        // Si es una URL blob sin nombre de archivo, intentar extraer de la URL
        if (src.startsWith('blob:')) {
          // No podemos extraer el nombre del archivo de una URL blob
          // Intentar buscar en el DOM si es posible
          return node;
        } else if (src.includes('./files/')) {
          // Ya es una referencia de archivo, extraer el filename si no está
          const fileFromSrc = src.replace('./files/', '');
          return {
            ...node,
            attrs: {
              ...node.attrs,
              src: `./files/${fileFromSrc}`,
              'data-filename': fileFromSrc,
              dataFilename: fileFromSrc
            }
          };
        } else if (src.startsWith('indexeddb://')) {
          const fileFromSrc = src.replace('indexeddb://', '');
          return {
            ...node,
            attrs: {
              ...node.attrs,
              src: `./files/${fileFromSrc}`,
              'data-filename': fileFromSrc,
              dataFilename: fileFromSrc
            }
          };
        } else if (src.includes('files/')) {
          // Es una URL completa con files/, extraer el nombre del archivo
          const match = src.match(/files\/([^\/\?]+)/);
          if (match) {
            const fileFromSrc = match[1];
            return {
              ...node,
              attrs: {
                ...node.attrs,
                src: `./files/${fileFromSrc}`,
                'data-filename': fileFromSrc,
                dataFilename: fileFromSrc
              }
            };
          }
        }
      }
      
      // Procesar contenido recursivamente
      if (node.content && Array.isArray(node.content)) {
        return {
          ...node,
          content: node.content.map(procesarNodo)
        };
      }
      
      return node;
    };
    
    return {
      ...contenido,
      content: contenido.content.map(procesarNodo)
    };
  };

  // Convertir referencias de archivo a URLs blob al cargar
  const convertirReferenciasABlobs = async (contenido) => {
    if (!contenido || !contenido.content) return contenido;
    
    const procesarNodo = async (node) => {
      if (!node) return node;
      
      // Si es una imagen, convertir la referencia a URL blob
      if (node.type === 'image' && node.attrs?.src) {
        const src = node.attrs.src;
        const filename = node.attrs['data-filename'];
        let nuevaSrc = src;
        
        // Prioridad: usar data-filename si está disponible
        if (filename) {
          try {
            const url = await LocalStorageService.getFileURL(filename, 'files');
            if (url) {
              nuevaSrc = url;
            }
          } catch (error) {
            // Error al cargar imagen
          }
        } else if (src.startsWith('blob:')) {
          // Si es una URL blob sin filename, intentar extraer de la URL o mantenerla
          // Las URLs blob antiguas sin filename no se pueden regenerar
          return node; // Mantener la URL blob si no podemos convertirla
        } else if (src.includes('./files/')) {
          // Es una referencia relativa, convertir a URL blob
          const fileFromSrc = src.replace('./files/', '');
          try {
            const url = await LocalStorageService.getFileURL(fileFromSrc, 'files');
            if (url) {
              nuevaSrc = url;
              // Actualizar el data-filename si no existe
              if (!filename) {
                return {
                  ...node,
                  attrs: {
                    ...node.attrs,
                    src: nuevaSrc,
                    'data-filename': fileFromSrc
                  }
                };
              }
            }
          } catch (error) {
            // Error al cargar imagen
          }
        } else if (src.startsWith('indexeddb://')) {
          // Es una referencia de IndexedDB, convertir a URL blob
          const fileFromSrc = src.replace('indexeddb://', '');
          try {
            const url = await LocalStorageService.getFileURL(fileFromSrc, 'files');
            if (url) {
              nuevaSrc = url;
              // Actualizar el data-filename si no existe
              if (!filename) {
                return {
                  ...node,
                  attrs: {
                    ...node.attrs,
                    src: nuevaSrc,
                    'data-filename': fileFromSrc
                  }
                };
              }
            }
          } catch (error) {
            // Error al cargar imagen desde IndexedDB
          }
        } else if (src.includes('files/')) {
          // Es una URL completa con files/, extraer el nombre del archivo
          const match = src.match(/files\/([^\/\?]+)/);
          if (match) {
            const fileFromSrc = match[1];
            try {
              const url = await LocalStorageService.getFileURL(fileFromSrc, 'files');
              if (url) {
                nuevaSrc = url;
                // Actualizar el data-filename si no existe
                if (!filename) {
                  return {
                    ...node,
                    attrs: {
                      ...node.attrs,
                      src: nuevaSrc,
                      'data-filename': fileFromSrc
                    }
                  };
                }
              }
            } catch (error) {
              // Error al cargar imagen
            }
          }
        }
        
        return {
          ...node,
          attrs: {
            ...node.attrs,
            src: nuevaSrc,
            'data-filename': filename || node.attrs['data-filename'] // Mantener el filename si existe
          }
        };
      }
      
      // Procesar contenido recursivamente
      if (node.content && Array.isArray(node.content)) {
        const contenidoProcesado = await Promise.all(node.content.map(procesarNodo));
        return {
          ...node,
          content: contenidoProcesado
        };
      }
      
      return node;
    };
    
    const contenidoProcesado = await Promise.all(contenido.content.map(procesarNodo));
    return {
      ...contenido,
      content: contenidoProcesado
    };
  };

  const guardarContenido = useCallback(async (contenido, mostrarToast = true) => {
    if (!paginaSeleccionada) return false;

    setGuardando(true);
    try {
      const data = await LocalStorageService.readJSONFile(`${paginaSeleccionada}.json`, 'data') || {};
      
      // Convertir URLs blob a referencias de archivo antes de guardar
      const contenidoParaGuardar = convertirBlobsAReferencias(contenido);
      
      // Asegurarse de que el título no tenga emoji (debe estar en el campo emoji)
      const tituloLimpio = tituloPaginaActual 
        ? quitarEmojiDelTitulo(tituloPaginaActual) 
        : (data.titulo || 'Sin título');
      
      await LocalStorageService.saveJSONFile(
        `${paginaSeleccionada}.json`,
        {
          ...data,
          contenido: contenidoParaGuardar,
          titulo: tituloLimpio,
          emoji: data.emoji || null, // Preservar el emoji existente
          actualizadoEn: new Date().toISOString(),
          creadoEn: data.creadoEn || new Date().toISOString()
        },
        'data'
      );

      setHayCambiosSinGuardar(false);
      
      if (mostrarToast) {
        setToast({
          message: 'Cambios guardados',
          type: 'success'
        });
      }
      
      return true;
    } catch (error) {
      if (mostrarToast) {
        setToast({
          message: 'Error al guardar. Intenta de nuevo.',
          type: 'error'
        });
      }
      return false;
    } finally {
      setGuardando(false);
    }
  }, [paginaSeleccionada, tituloPaginaActual]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false,
        heading: false // Deshabilitar Heading de StarterKit para evitar duplicación
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Toggle,
      TablaNotionNode,
      GaleriaImagenesNode,
      GaleriaArchivosNode,
      ResumenFinancieroNode,
      CalendarNode,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Underline,
      TextStyle,
      Table,
      TableRow,
      TableHeader,
      TableCellExtended,
      ImageExtended,
      Link.configure({
        openOnClick: false, // Manejar clics manualmente para enlaces internos
        linkOnPaste: true,
        autolink: true,
        HTMLAttributes: {
          class: 'cursor-pointer',
        },
      }),
      Placeholder.configure({ placeholder: "Escribe '/' para comandos..." }),
      SlashCommand,
    ],
    content: "",
  });

  // Cargar lista de páginas
  useEffect(() => {
    const cargarPaginas = async () => {
      // Verificar configuración y handle
      const config = LocalStorageService.config;
      const hasHandle = !!LocalStorageService.baseDirectoryHandle;
      
      if (config.useLocalStorage && !hasHandle) {
        // No intentar cargar desde localStorage si hay configuración de almacenamiento local
        setPaginas([]);
        return;
      }
      
      try {
        const files = await LocalStorageService.listFiles('data');
        
        if (files.length === 0 && config.useLocalStorage && !hasHandle) {
          setPaginas([]);
          return;
        }
        
        const paginasData = await Promise.all(
          files
            .filter(f => f.endsWith('.json'))
            .map(async (file) => {
              const data = await LocalStorageService.readJSONFile(file, 'data');
              return { 
                id: file.replace('.json', ''), 
                parentId: data.parentId || null, // Asegurar que parentId existe (null para páginas raíz)
                ...data 
              };
            })
        );

        // Ordenar por fecha de creación descendente
        paginasData.sort((a, b) => {
          const fechaA = new Date(a.creadoEn || 0);
          const fechaB = new Date(b.creadoEn || 0);
          return fechaB - fechaA;
        });

        setPaginas(paginasData);
      } catch (error) {
        // Error cargando páginas
      }
    };

    cargarPaginas();
    
    // Escuchar evento de reordenamiento para recargar páginas
    const handleReordenar = () => {
      cargarPaginas();
    };
    window.addEventListener('paginasReordenadas', handleReordenar);
    
    // Recargar cada 5 segundos para detectar cambios
    const interval = setInterval(cargarPaginas, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('paginasReordenadas', handleReordenar);
    };
  }, [handleVersion]); // Recargar cuando cambia handleVersion

  // Escuchar cambios en el handle del directorio
  useEffect(() => {
    const handleDirectoryChanged = () => {
      setHandleVersion(prev => prev + 1);
    };

    // Escuchar evento personalizado cuando se selecciona una carpeta
    window.addEventListener('directoryHandleChanged', handleDirectoryChanged);
    
    // También verificar periódicamente (cada 2 segundos) por si cambió
    const interval = setInterval(() => {
      const hasHandle = !!LocalStorageService.baseDirectoryHandle;
      if (hasHandle) {
        // Si hay handle y no lo teníamos antes, forzar recarga
        setHandleVersion(prev => prev + 1);
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('directoryHandleChanged', handleDirectoryChanged);
      clearInterval(interval);
    };
  }, []);

  // Cargar contenido de página seleccionada
  useEffect(() => {
    if (!editor || !paginaSeleccionada) return;
    
    // Actualizar contexto de página actual
    PageContext.setCurrentPageId(paginaSeleccionada);

    const cargarContenido = async () => {
      try {
        const data = await LocalStorageService.readJSONFile(`${paginaSeleccionada}.json`, 'data');
        if (data && data.contenido) {
          setTitulo(data.titulo || "");
          setTituloPaginaActual(data.titulo || "");
          
          // Convertir referencias de archivo a URLs blob antes de cargar
          const contenidoConBlobs = await convertirReferenciasABlobs(data.contenido);
          editor.commands.setContent(contenidoConBlobs);
          
          // Guardar el contenido procesado como referencia
          ultimoContenidoRef.current = JSON.stringify(contenidoConBlobs);
        } else {
          editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
          ultimoContenidoRef.current = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
        }
        setHayCambiosSinGuardar(false);
      } catch (error) {
        editor.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
        ultimoContenidoRef.current = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
      }
    };

    cargarContenido();

    // Detectar cambios en el editor
    const handleUpdate = () => {
      const contenidoActual = JSON.stringify(editor.getJSON());
      if (ultimoContenidoRef.current === null) {
        ultimoContenidoRef.current = contenidoActual;
        setHayCambiosSinGuardar(false);
      } else if (contenidoActual !== ultimoContenidoRef.current) {
        setHayCambiosSinGuardar(true);
      }
    };

    editor.on('update', handleUpdate);

    // Autoguardado cada 30 segundos
    intervaloRef.current = setInterval(() => {
      if (!editor) return;
      const json = editor.getJSON();
      const contenidoActual = JSON.stringify(json);
      
      // Solo guardar si hay cambios
      if (ultimoContenidoRef.current !== contenidoActual) {
        guardarContenido(json, true).then((guardado) => {
          if (guardado) {
            ultimoContenidoRef.current = contenidoActual;
            setHayCambiosSinGuardar(false);
          }
        });
      }
    }, 30000);

    return () => {
      editor.off('update', handleUpdate);
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [editor, paginaSeleccionada, guardarContenido]);

  // Prevenir cierre de página si hay cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (hayCambiosSinGuardar && !guardando) {
        // Intentar guardar antes de cerrar
        if (editor && paginaSeleccionada) {
          const json = editor.getJSON();
          await guardarContenido(json, false); // No mostrar toast al cerrar
        }
        
        // Mostrar advertencia del navegador
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hayCambiosSinGuardar, guardando, editor, paginaSeleccionada, guardarContenido]);

  const crearPagina = async (titulo, emoji = null, parentId = null) => {
    if (!titulo || !titulo.trim()) return;

    // Extraer emoji si no se pasó explícitamente
    const emojiFinal = emoji || extraerEmojiDelTitulo(titulo);
    // Quitar el emoji del título para guardarlo limpio
    const tituloSinEmoji = quitarEmojiDelTitulo(titulo);

    // Generar UUID único para la página (usar crypto.randomUUID() si está disponible, sino fallback a timestamp)
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `pagina-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const nuevaPagina = {
      id,
      titulo: tituloSinEmoji,
      emoji: emojiFinal || null,
      parentId: parentId || null, // ID de la página padre (null para páginas raíz)
      contenido: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    try {
      await LocalStorageService.saveJSONFile(`${id}.json`, nuevaPagina, 'data');
      
      setPaginas([nuevaPagina, ...paginas]);
      setPaginaSeleccionada(id);
      setTitulo(tituloSinEmoji);
      setTituloPaginaActual(tituloSinEmoji);
      editor?.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
    } catch (error) {
      setModalError({ 
        isOpen: true, 
        message: `No se pudo crear la página. Error: ${error.message}. Verifica la consola para más detalles.`, 
        title: "Error al crear página" 
      });
    }
  };

  const seleccionarPagina = async (paginaId) => {
    if (!paginaId || !editor) return;
    setPaginaSeleccionada(paginaId);
    PageContext.setCurrentPageId(paginaId);
    setSelectorAbierto(false);
  };

  // Función para obtener el título completo de una página (con emoji si existe)
  const obtenerTituloCompletoPagina = (pagina) => {
    if (!pagina) return '';
    const emoji = pagina.emoji ? `${pagina.emoji} ` : '';
    return `${emoji}${pagina.titulo || 'Sin título'}`;
  };

  // Manejar selección de página para crear enlace
  const handleSelectPageForLink = (pagina) => {
    if (!editor || !pagina) return;
    
    const tituloCompleto = obtenerTituloCompletoPagina(pagina);
    // Crear enlace con formato especial: page:pagina-id
    const href = `page:${pagina.id}`;
    
    // Insertar el enlace en el editor como un párrafo con texto y mark de enlace
    editor.chain().focus().insertContent({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: tituloCompleto,
          marks: [
            {
              type: 'link',
              attrs: {
                href: href,
                target: null,
              }
            }
          ]
        }
      ]
    }).run();
  };

  // Escuchar evento para abrir modal de enlace a página
  useEffect(() => {
    const handleOpenPageLinkModal = () => {
      setShowPageLinkModal(true);
    };

    window.addEventListener('openPageLinkModal', handleOpenPageLinkModal);
    return () => {
      window.removeEventListener('openPageLinkModal', handleOpenPageLinkModal);
    };
  }, []);

  // Configurar manejo de clics en enlaces internos
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    
    const handleClick = (event) => {
      const target = event.target;
      // Verificar si el clic fue en un enlace
      const linkElement = target.closest('a');
      if (linkElement) {
        const href = linkElement.getAttribute('href');
        if (href && href.startsWith('page:')) {
          event.preventDefault();
          event.stopPropagation();
          const paginaId = href.replace('page:', '');
          seleccionarPagina(paginaId);
        }
      }
    };

    editorElement.addEventListener('click', handleClick);
    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor, seleccionarPagina]);

  // Extraer URLs de imágenes y archivos del contenido
  const extraerArchivosDelContenido = (contenido) => {
    const archivos = new Set();
    
    const buscarArchivos = (node) => {
      if (!node) return;
      
      // Buscar imágenes
      if (node.type === 'image' && node.attrs?.src) {
        const src = node.attrs.src;
        // Extraer el nombre del archivo de la URL
        // Puede ser blob:http://... o ./files/filename o indexeddb://filename
        if (src.includes('./files/')) {
          const filename = src.replace('./files/', '');
          archivos.add(filename);
        } else if (src.startsWith('indexeddb://')) {
          const filename = src.replace('indexeddb://', '');
          archivos.add(filename);
        } else if (src.includes('files/')) {
          // Para URLs completas, extraer el nombre del archivo
          const match = src.match(/files\/([^\/\?]+)/);
          if (match) {
            archivos.add(match[1]);
          }
        }
      }
      
      // Buscar enlaces a archivos
      if (node.type === 'text' && node.marks) {
        node.marks.forEach(mark => {
          if (mark.type === 'link' && mark.attrs?.href) {
            const href = mark.attrs.href;
            if (href.includes('./files/')) {
              const filename = href.replace('./files/', '');
              archivos.add(filename);
            } else if (href.startsWith('indexeddb://')) {
              const filename = href.replace('indexeddb://', '');
              archivos.add(filename);
            } else if (href.includes('files/')) {
              const match = href.match(/files\/([^\/\?]+)/);
              if (match) {
                archivos.add(match[1]);
              }
            }
          }
        });
      }
      
      // Recursivamente buscar en el contenido
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(buscarArchivos);
      }
    };
    
    if (contenido && contenido.content) {
      contenido.content.forEach(buscarArchivos);
    }
    
    return Array.from(archivos);
  };

  const renombrarPagina = async (paginaId, nuevoTitulo) => {
    if (!nuevoTitulo || nuevoTitulo.trim() === '') return;
    
    try {
      // Cargar datos actuales de la página
      const data = await LocalStorageService.readJSONFile(`${paginaId}.json`, 'data');
      if (!data) {
        return;
      }
      
      // Guardar con el nuevo título
      await LocalStorageService.saveJSONFile(
        `${paginaId}.json`,
        {
          ...data,
          titulo: nuevoTitulo.trim(),
          actualizadoEn: new Date().toISOString(),
          creadoEn: data.creadoEn || new Date().toISOString()
        },
        'data'
      );
      
      // Actualizar la lista de páginas
      const nuevasPaginas = paginas.map(p => 
        p.id === paginaId ? { ...p, titulo: nuevoTitulo.trim() } : p
      );
      setPaginas(nuevasPaginas);
      
      // Si es la página seleccionada, actualizar el título
      if (paginaSeleccionada === paginaId) {
        setTitulo(nuevoTitulo.trim());
        setTituloPaginaActual(nuevoTitulo.trim());
      }
      
      setToast({
        message: 'Nombre de página actualizado',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Error al renombrar la página',
        type: 'error'
      });
    }
  };

  const eliminarPagina = async () => {
    if (!paginaAEliminar) return;
    
    setEliminando(true);
    try {
      // Obtener todas las páginas hijas (recursivamente)
      const paginasHijas = obtenerPaginasHijas(paginaAEliminar.id, paginas);
      const todasLasPaginasAEliminar = [paginaAEliminar, ...paginasHijas];
      
      let archivosEliminados = 0;
      let paginasEliminadas = 0;
      
      // Eliminar todas las páginas (padre e hijas)
      for (const pagina of todasLasPaginasAEliminar) {
        try {
          // Cargar el contenido de la página para extraer archivos asociados
          const data = await LocalStorageService.readJSONFile(`${pagina.id}.json`, 'data');
          
          // Extraer archivos asociados
          const archivos = data?.contenido ? extraerArchivosDelContenido(data.contenido) : [];
          
          // Eliminar todos los archivos asociados
          for (const filename of archivos) {
            try {
              const eliminado = await LocalStorageService.deleteBinaryFile(filename, 'files');
              if (eliminado) archivosEliminados++;
            } catch (error) {
              // Error eliminando archivo
            }
          }
          
          // Eliminar el archivo JSON de la página
          await LocalStorageService.deleteJSONFile(`${pagina.id}.json`, 'data');
          paginasEliminadas++;
        } catch (error) {
          // Error eliminando página
        }
      }
      
      // Actualizar la lista de páginas (eliminar todas las páginas eliminadas)
      const idsAEliminar = todasLasPaginasAEliminar.map(p => p.id);
      setPaginas(paginas.filter(p => !idsAEliminar.includes(p.id)));
      
      // Si la página eliminada (o alguna hija) era la seleccionada, limpiar la selección
      if (idsAEliminar.includes(paginaSeleccionada)) {
        setPaginaSeleccionada(null);
        PageContext.clearCurrentPageId();
        setTituloPaginaActual('');
        editor?.commands.setContent({ type: "doc", content: [{ type: "paragraph" }] });
      }
      
      // Cerrar el modal
      setShowDeleteModal(false);
      setPaginaAEliminar(null);
      
      // Mostrar mensaje de éxito
      const mensajeHijas = paginasHijas.length > 0 ? ` junto con ${paginasHijas.length} página(s) hija(s)` : '';
      const mensajeArchivos = archivosEliminados > 0 ? ` y ${archivosEliminados} archivo(s) asociado(s)` : '';
      setToast({
        message: `Página "${paginaAEliminar.titulo}" eliminada${mensajeHijas}${mensajeArchivos}`,
        type: 'success'
      });
    } catch (error) {
      setModalError({
        isOpen: true,
        message: `No se pudo eliminar la página. Error: ${error.message}`,
        title: "Error al eliminar página"
      });
    } finally {
      setEliminando(false);
    }
  };

  // Función helper para obtener todas las páginas hijas de forma recursiva
  const obtenerPaginasHijas = (parentId, todasLasPaginas) => {
    const hijosDirectos = todasLasPaginas.filter(p => p.parentId === parentId);
    let todosLosHijos = [...hijosDirectos];
    hijosDirectos.forEach(hijo => {
      todosLosHijos = todosLosHijos.concat(obtenerPaginasHijas(hijo.id, todasLasPaginas));
    });
    return todosLosHijos;
  };

  const abrirModalEliminar = (pagina) => {
    setPaginaAEliminar(pagina);
    setShowDeleteModal(true);
  };

  const insertarImagen = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      if (!input.files?.[0]) return;
      
      try {
        const file = input.files[0];
        const filename = `${Date.now()}-${file.name}`;
        await LocalStorageService.saveBinaryFile(filename, file, 'files');
        const url = await LocalStorageService.getFileURL(filename, 'files');
        
        if (url && editor) {
          // Guardar la imagen con la referencia del archivo en un atributo data-filename
          // y usar la URL blob para mostrar, pero guardar la referencia para poder regenerarla
          editor.chain().focus().setImage({ 
            src: url,
            'data-filename': filename  // Guardar el nombre del archivo para poder regenerar la URL
          }).run();
        }
      } catch (error) {
        setModalError({ 
          isOpen: true, 
          message: "No se pudo subir la imagen. Verifica que tengas una carpeta configurada.", 
          title: "Error al subir imagen" 
        });
      }
    };
    input.click();
  };

  const insertarArchivo = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const filename = `${Date.now()}-${file.name}`;
        await LocalStorageService.saveBinaryFile(filename, file, 'files');
        const url = await LocalStorageService.getFileURL(filename, 'files');

        const extension = file.name.split('.').pop().toLowerCase();
        const icono = {
          zip: "🗜️", pdf: "📄", doc: "📝", docx: "📝",
          xls: "📊", xlsx: "📊", mp4: "🎞️", mp3: "🎵",
          default: "📎"
        }[extension] || "📎";

        if (url && editor) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'paragraph',
              content: [
                { type: 'text', text: `${icono} ` },
                {
                  type: 'text',
                  marks: [{ type: 'link', attrs: { href: url, target: "_blank" } }],
                  text: file.name,
                },
              ],
            })
            .run();
        }
      } catch (error) {
        setModalError({ 
          isOpen: true, 
          message: "No se pudo subir el archivo. Verifica que tengas una carpeta configurada.", 
          title: "Error al subir archivo" 
        });
      }
    };
    input.click();
  };

  const exportarAPDF = () => {
    if (typeof window.html2pdf === 'undefined') {
      setModalError({ 
        isOpen: true, 
        message: "La funcionalidad de PDF no está disponible. Asegúrate de que html2pdf.js esté cargado correctamente.", 
        title: "PDF no disponible" 
      });
      return;
    }
    
    const element = document.querySelector(".ProseMirror");
    if (!element) {
      setModalError({ 
        isOpen: true, 
        message: "No se encontró contenido para exportar. Asegúrate de tener una página abierta con contenido.", 
        title: "Sin contenido" 
      });
      return;
    }
    
    try {
      window.html2pdf().from(element).save(`${tituloPaginaActual || 'pagina'}.pdf`);
      setModalError({ 
        isOpen: true, 
        message: `PDF "${tituloPaginaActual || 'pagina'}.pdf" generado correctamente. Se descargará en breve.`, 
        title: "PDF generado" 
      });
    } catch (error) {
      setModalError({ 
        isOpen: true, 
        message: "Ocurrió un error al generar el PDF. Por favor, intenta de nuevo.", 
        title: "Error al exportar PDF" 
      });
    }
  };

  const actualizarTitulo = async () => {
    if (!paginaSeleccionada) return;
    
    try {
      const data = await LocalStorageService.readJSONFile(`${paginaSeleccionada}.json`, 'data') || {};
      // Extraer emoji del nuevo título
      const nuevoEmoji = extraerEmojiDelTitulo(tituloPaginaActual);
      // Quitar el emoji del título para guardarlo limpio
      const tituloSinEmoji = quitarEmojiDelTitulo(tituloPaginaActual);
      
      await LocalStorageService.saveJSONFile(
        `${paginaSeleccionada}.json`,
        {
          ...data,
          titulo: tituloSinEmoji,
          emoji: nuevoEmoji || null,
          actualizadoEn: new Date().toISOString()
        },
        'data'
      );
      // Actualizar el título en el estado para que se muestre sin emoji
      setTituloPaginaActual(tituloSinEmoji);
      // Actualizar la lista de páginas para reflejar el cambio
      setPaginas(prevPaginas => 
        prevPaginas.map(p => 
          p.id === paginaSeleccionada 
            ? { ...p, titulo: tituloSinEmoji, emoji: nuevoEmoji || null }
            : p
        )
      );
    } catch (error) {
      // Error actualizando título
    }
  };

  // Establecer CSS variable para el ancho del sidebar
  useEffect(() => {
    // w-16 = 4rem = 64px cuando está colapsado (16 * 4 = 64px)
    // w-64 = 16rem = 256px cuando está expandido, pero ajustamos a 216px para mejor espaciado
    const sidebarWidth = sidebarColapsado ? 64 : 216;
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarColapsado]);

  return (
    <div className="w-full h-screen flex bg-gray-50 relative">
      {/* Advertencia de almacenamiento - Posicionada de forma absoluta */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <StorageWarning onOpenConfig={() => setShowConfigModal(true)} />
      </div>
      
      {/* Sidebar */}
      <Sidebar
        paginas={paginas}
        paginaSeleccionada={paginaSeleccionada}
        onSeleccionarPagina={seleccionarPagina}
        onNuevaPagina={(parentId) => {
          setPaginaPadreParaNueva(parentId);
          setShowNewPageModal(true);
        }}
        onShowConfig={() => setShowConfigModal(true)}
        filtroPagina={filtroPagina}
        setFiltroPagina={setFiltroPagina}
        onSidebarStateChange={setSidebarColapsado}
        onEliminarPagina={abrirModalEliminar}
        onReordenarPaginas={setPaginas}
        onRenombrarPagina={renombrarPagina}
      />

      {/* Modal de selección */}
      {selectorAbierto && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
          onClick={() => setSelectorAbierto(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-blue-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Selecciona una página</h2>
              <button onClick={() => setSelectorAbierto(false)} className="text-white hover:bg-white/20 rounded-full p-2">
                ✕
              </button>
            </div>
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="🔍 Buscar..."
                value={filtroPagina}
                onChange={(e) => setFiltroPagina(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginas
                  .filter(p => !filtroPagina || p.titulo?.toLowerCase().includes(filtroPagina.toLowerCase()))
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`relative p-4 rounded-xl border-2 ${
                        paginaSeleccionada === p.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <button
                        onClick={() => seleccionarPagina(p.id)}
                        className="w-full text-left"
                      >
                        <h3 className="font-semibold">{p.titulo || 'Sin título'}</h3>
                        <p className="text-xs text-gray-500 mt-1">ID: {p.id}</p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalEliminar(p);
                        }}
                        className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar página"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor */}
        {paginaSeleccionada ? (
          <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra de herramientas compacta */}
          <div className="bg-white border-b px-3 py-1 flex gap-1.5 items-center">
            <button
              onClick={insertarArchivo}
              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-xs"
              title="Insertar archivo"
            >
              <Paperclip className="w-3 h-3" />
              Archivo
            </button>
            <button
              onClick={insertarImagen}
              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-xs"
              title="Insertar imagen"
            >
              <ImageIcon className="w-3 h-3" />
              Imagen
            </button>
            <button
              onClick={exportarAPDF}
              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-xs"
              title="Exportar PDF"
            >
              <Download className="w-3 h-3" />
              PDF
            </button>
          </div>

          {/* Título compacto */}
          <input
            type="text"
            value={tituloPaginaActual}
            onChange={(e) => setTituloPaginaActual(e.target.value)}
            onBlur={actualizarTitulo}
            placeholder="Título de la página"
            className="border-b px-4 py-2 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />

          {/* Área de edición */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <EditorContent editor={editor} className="tiptap" ref={editorRef} />
            </div>
          </div>
        </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {/* Mostrar páginas favoritas como cards */}
            {(() => {
              const paginasFavoritas = paginas.filter(p => favoritos.includes(p.id));
              
              if (paginasFavoritas.length > 0) {
                return (
                  <div className="max-w-7xl mx-auto px-6 py-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Páginas Favoritas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paginasFavoritas.map((pagina) => (
                        <div
                          key={pagina.id}
                          onClick={() => seleccionarPagina(pagina.id)}
                          className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                              {pagina.titulo || 'Sin título'}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle favorito
                                const nuevosFavoritos = favoritos.includes(pagina.id)
                                  ? favoritos.filter(id => id !== pagina.id)
                                  : [...favoritos, pagina.id];
                                try {
                                  localStorage.setItem('notion-favoritos', JSON.stringify(nuevosFavoritos));
                                  setFavoritos(nuevosFavoritos);
                                } catch (error) {
                                  // Error guardando favoritos
                                }
                              }}
                              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              title={favoritos.includes(pagina.id) ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                              <svg 
                                className={`w-5 h-5 ${favoritos.includes(pagina.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          </div>
                          {pagina.actualizadoEn && (
                            <p className="text-xs text-gray-500 mt-2">
                              Actualizado: {new Date(pagina.actualizadoEn).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          {pagina.creadoEn && (
                            <p className="text-xs text-gray-400 mt-1">
                              Creado: {new Date(pagina.creadoEn).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg mb-2">No hay páginas favoritas</p>
                      <p className="text-sm text-gray-400">Marca páginas como favoritas desde el sidebar para verlas aquí</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>

      {/* Modal de error/éxito */}
      <Modal
        isOpen={modalError.isOpen}
        onClose={() => setModalError({ isOpen: false, message: '', title: '' })}
        title={modalError.title || 'Notificación'}
        type={modalError.title?.includes('generado') || modalError.title?.includes('PDF generado') ? 'success' : modalError.title?.includes('Error') ? 'error' : 'info'}
      >
        <p className="text-gray-700">{modalError.message}</p>
      </Modal>

      {/* Modal de Configuración */}
      <ConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />

      {/* Modal de Nueva Página */}
      <NewPageModal
        isOpen={showNewPageModal}
        onClose={() => {
          setShowNewPageModal(false);
          setPaginaPadreParaNueva(null);
        }}
        onCreate={(titulo, emoji) => {
          crearPagina(titulo, emoji, paginaPadreParaNueva);
          setPaginaPadreParaNueva(null);
        }}
      />

      {/* Modal de Enlace a Página */}
      <PageLinkModal
        isOpen={showPageLinkModal}
        onClose={() => setShowPageLinkModal(false)}
        paginas={paginas}
        onSelectPage={handleSelectPageForLink}
      />

      {/* Modal de Confirmación para Eliminar */}
      {showDeleteModal && paginaAEliminar && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            {/* Header con icono de advertencia */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar página</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Esta acción no se puede deshacer</p>
                </div>
                {!eliminando && (
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPaginaAEliminar(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-gray-700 mb-2">
                  ¿Estás seguro de que deseas eliminar la página:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="font-semibold text-gray-900 text-base">{paginaAEliminar.titulo || 'Sin título'}</p>
                  {paginaAEliminar.creadoEn && (
                    <p className="text-xs text-gray-500 mt-1">
                      Creada: {new Date(paginaAEliminar.creadoEn).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  {paginaAEliminar.actualizadoEn && (
                    <p className="text-xs text-gray-500">
                      Actualizada: {new Date(paginaAEliminar.actualizadoEn).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
              </div>

              {(() => {
                const paginasHijas = paginaAEliminar ? obtenerPaginasHijas(paginaAEliminar.id, paginas) : [];
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-1">Se eliminará permanentemente:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-yellow-700">
                          <li>La página y todo su contenido</li>
                          {paginasHijas.length > 0 && (
                            <li className="font-semibold">{paginasHijas.length} página(s) hija(s) y su contenido</li>
                          )}
                          <li>Imágenes y archivos asociados</li>
                          <li>Todas las tablas y datos incluidos</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer con botones */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPaginaAEliminar(null);
                }}
                disabled={eliminando}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarPagina}
                disabled={eliminando}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-sm"
              >
                {eliminando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar página
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Indicador de guardando */}
      {guardando && (
        <div className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Guardando...</span>
        </div>
      )}
    </div>
  );
}

