import { useEffect, useState, useRef, useCallback, startTransition } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import { CodeBlockWithCopyExtension } from "../extensions/CodeBlockWithCopyExtension";
import { SQLScriptNodeExtension } from "../extensions/SQLScriptNodeExtension";
import { MarkdownNodeExtension } from "../extensions/MarkdownNodeExtension";
import { PreventUpdateLoopExtension } from "../extensions/PreventUpdateLoopExtension";
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
import { ConsoleNode } from "../extensions/ConsoleNode";
import { PostmanNode } from "../extensions/PostmanNode";
import { VisualCodeNode } from "../extensions/VisualCodeNode";
import { ConvertidorNode } from "../extensions/ConvertidorNode";
import { DiagramNode } from "../extensions/DiagramNode";
import { FileCompareNode } from "../extensions/FileCompareNode";
import TableHeader from "@tiptap/extension-table-header";
import { ImageExtended } from "../extensions/ImageExtended";
import Placeholder from "@tiptap/extension-placeholder";
import lowlight from "../extensions/lowlightInstance";
// SlashCommand removido - causa problemas de bloqueo
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Toggle } from "../extensions/Toggle";
import { Comment } from "../extensions/Comment";
import { Settings, Plus, Image as ImageIcon, Paperclip, Download, Trash2, Tag as TagIcon, FileText, Save, Clock, MessageSquare, MoreVertical, Database, Zap, FolderOpen, X, Minimize2, Command, Calendar } from "lucide-react";
import QuickScrollNavigation from "./QuickScrollNavigation";
import LocalStorageService from "../services/LocalStorageService";
import Modal from "./Modal";
import ConfigModal from "./ConfigModal";
import NewPageModal from "./NewPageModal";
import PageLinkModal from "./PageLinkModal";
import StorageWarning from "./StorageWarning";
import Toast from "./Toast";
import Sidebar from "./Sidebar";
import TagSelector from "./TagSelector";
import TagService from "../services/TagService";
import PageTagsDisplay from "./PageTagsDisplay";
import GlobalSearch from "./GlobalSearch";
import SaveTemplateModal from "./SaveTemplateModal";
import TemplateSelector from "./TemplateSelector";
import templateService from "../services/TemplateService";
import { PageContext } from '../utils/pageContext';
import ExportModal from "./ExportModal";
import VersionHistory from "./VersionHistory";
import VersionService from "../services/VersionService";
import CommentPanel from "./CommentPanel";
import QuickNote from "./QuickNote";
import QuickNotesHistory from "./QuickNotesHistory";
import GeneralNotesHistory from "./GeneralNotesHistory";
import ConsolePanel from "./ConsolePanel";
import CentroEjecucionPage from "./CentroEjecucionPage";
import KeyboardShortcuts from "./KeyboardShortcuts";
import EmojiPicker from "./EmojiPicker";
import SQLFileManager from "./SQLFileManager";
import SQLFileService from "../services/SQLFileService";
import PageSQLScriptsModal from "./PageSQLScriptsModal";
import PageIndexService from "../services/PageIndexService";
import VisualCodeFullscreenModal from "./VisualCodeFullscreenModal";
import SlashCommandModal from "./SlashCommandModal";
import CommandButtonModal from "./CommandButtonModal";
import { getSlashCommandItems } from "../utils/slashCommandItems";
import WelcomeExamples from "./WelcomeExamples";

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
      // No devolver 'Sin título', devolver string vacío si no hay texto después del emoji
      return tituloSinEmoji;
    }
    return tituloTexto.trim();
  };

  const [titulo, setTitulo] = useState("");
  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  const intervaloRef = useRef(null);
  const lastHandleRef = useRef(!!LocalStorageService.baseDirectoryHandle);
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
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [pageTags, setPageTags] = useState([]);
  const pageTagsRef = useRef([]); // Ref para mantener los tags originales cuando se abre el modal
  const [handleVersion, setHandleVersion] = useState(0);
  const [toast, setToast] = useState(null);
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const ultimoContenidoRef = useRef(null);
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showTemplateSelectorForSlash, setShowTemplateSelectorForSlash] = useState(false);
  const templateInsertRange = useRef(null);
  const templateInsertEditor = useRef(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [showReloadConfirmModal, setShowReloadConfirmModal] = useState(false);
  const pendingReloadRef = useRef(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showQuickNotesHistory, setShowQuickNotesHistory] = useState(false);
  const [showGeneralNotesHistory, setShowGeneralNotesHistory] = useState(false);
  const [quickNoteToLoad, setQuickNoteToLoad] = useState(null);
  const [generalNoteToEdit, setGeneralNoteToEdit] = useState(null);
  const [showConsole, setShowConsole] = useState(false);
  const [showCentroEjecucion, setShowCentroEjecucion] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showSlashCommandModal, setShowSlashCommandModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ top: 160, left: 300 });
  // Múltiples modales de Visual Code fullscreen
  const [visualCodeFullscreenModals, setVisualCodeFullscreenModals] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [emojiPickerToggleId, setEmojiPickerToggleId] = useState(null);
  const [emojiPickerCurrentEmoji, setEmojiPickerCurrentEmoji] = useState('');
  const emojiPickerRef = useRef(null);
  const [showSQLFileManager, setShowSQLFileManager] = useState(false);
  const [sqlFileToLoad, setSqlFileToLoad] = useState(null);
  const [showPageSQLScripts, setShowPageSQLScripts] = useState(false);
  const [pageSQLScriptsCount, setPageSQLScriptsCount] = useState(0);
  const ultimoContenidoGuardadoRef = useRef(null);
  const checkingSQLScriptsRef = useRef(new Set()); // Para evitar verificaciones duplicadas
  const checkPageSQLScriptsRef = useRef(null); // Ref para checkPageSQLScripts
  const crearPaginaRef = useRef(null); // Ref para crearPagina
  const guardarContenidoRef = useRef(null); // Ref para guardarContenido
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
      
      const contenidoSerializado = JSON.stringify(contenidoParaGuardar);
      
      // Crear snapshot si hay cambios significativos
      if (ultimoContenidoGuardadoRef.current !== contenidoSerializado) {
        try {
          // Solo crear snapshot si el contenido cambió significativamente
          const contenidoAnterior = ultimoContenidoGuardadoRef.current;
          if (!contenidoAnterior || contenidoAnterior !== contenidoSerializado) {
            await VersionService.createSnapshot(paginaSeleccionada, {
              ...data,
              contenido: contenidoParaGuardar,
              titulo: tituloLimpio,
              tags: data.tags || [],
              emoji: data.emoji || null,
            });
            
            // Limpiar versiones antiguas periódicamente
            if (Math.random() < 0.1) { // 10% de probabilidad en cada guardado
              await VersionService.cleanupOldVersions(paginaSeleccionada);
            }
          }
        } catch (error) {
          console.error('Error creando snapshot:', error);
          // No fallar el guardado si falla el snapshot
        }
      }
      
      const pageData = {
        ...data,
        contenido: contenidoParaGuardar,
        titulo: tituloLimpio,
        emoji: data.emoji || null, // Preservar el emoji existente
        tags: data.tags || [], // Preservar tags existentes
        actualizadoEn: new Date().toISOString(),
        creadoEn: data.creadoEn || new Date().toISOString()
      };

      await LocalStorageService.saveJSONFile(
        `${paginaSeleccionada}.json`,
        pageData,
        'data'
      );

      // Actualizar índice de páginas
      await PageIndexService.updatePageInIndex(paginaSeleccionada, pageData);

      ultimoContenidoGuardadoRef.current = contenidoSerializado;
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

  // Mantener el ref actualizado con la función guardarContenido
  // Esto es seguro porque solo actualiza un ref, no causa re-renders
  useEffect(() => {
    guardarContenidoRef.current = guardarContenido;
  }, [guardarContenido]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false,
        heading: false // Deshabilitar Heading de StarterKit para evitar duplicación
      }),
      CodeBlockWithCopyExtension,
      SQLScriptNodeExtension,
      MarkdownNodeExtension,
      Toggle,
      TablaNotionNode,
      GaleriaImagenesNode,
      GaleriaArchivosNode,
      ResumenFinancieroNode,
      CalendarNode,
      ConsoleNode,
      PostmanNode,
      VisualCodeNode,
      ConvertidorNode,
      DiagramNode,
      FileCompareNode,
      Heading.configure({ levels: [1, 2, 3, 4, 5, 6] }),
      Underline,
      TextStyle,
      Table,
      TableRow,
      TableHeader,
      TableCellExtended,
      ImageExtended,
      Comment,
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
      Link.configure({
        openOnClick: false, // Manejar clics manualmente para enlaces internos
        linkOnPaste: true,
        autolink: true,
        HTMLAttributes: {
          class: 'cursor-pointer',
        },
      }),
      Placeholder.configure({ placeholder: "Escribe aquí..." }),
      PreventUpdateLoopExtension,
    ],
    content: "",
  });

  // Trackear posición del cursor para el botón flotante
  // El botón se mantiene fijo a la izquierda (respetando el sidebar) y sigue el cursor verticalmente
  useEffect(() => {
    if (!editor) return;

    const updateCursorPosition = () => {
      try {
        if (!editor || !editor.state || !editor.state.selection) return;
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        const editorContainer = editorContainerRef.current;
        
        if (editorContainer && coords) {
          const containerRect = editorContainer.getBoundingClientRect();
          const scrollTop = editorContainer.scrollTop;
          
          // Posición horizontal: fija a la izquierda, respetando el sidebar
          // Si el sidebar está colapsado: 80px, si no: 300px
          const leftPos = sidebarColapsado ? 80 : 300;
          
          // Posición vertical: sigue el cursor (20px debajo del cursor)
          let topPos = coords.top - containerRect.top + scrollTop + 20;
          
          // Asegurar que el botón no se salga por arriba
          if (topPos < 20) {
            topPos = 20;
          }
          
          setCursorPosition({ top: topPos, left: leftPos });
        }
      } catch (e) {
        // Ignorar errores al obtener posición del cursor
      }
    };

    // Actualizar posición cuando cambia la selección o se actualiza el editor
    const handleUpdate = () => {
      updateCursorPosition();
    };

    const handleSelectionUpdate = () => {
      updateCursorPosition();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('update', handleUpdate);
    editor.on('focus', handleUpdate);

    // Actualizar también al hacer scroll
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
  }, [editor, sidebarColapsado]);

  // Ref para evitar cargas simultáneas
  const cargandoPaginasRef = useRef(false);
  const rebuildIndexTimeoutRef = useRef(null);
  const autoguardandoRef = useRef(false);


  // Cargar lista de páginas
  useEffect(() => {
    const cargarPaginas = async () => {
      // Evitar cargas simultáneas
      if (cargandoPaginasRef.current) {
        return;
      }
      cargandoPaginasRef.current = true;

      try {
        // Verificar configuración y handle
        const config = LocalStorageService.config;
        const hasHandle = !!LocalStorageService.baseDirectoryHandle;
        const isElectron = typeof window !== 'undefined' && window.electronAPI;
        
        // En Electron, si hay basePath, podemos cargar páginas aunque no haya handle
        // En navegador, necesitamos handle para usar File System Access API
        if (config.useLocalStorage && !hasHandle && !isElectron) {
          // No intentar cargar desde localStorage si hay configuración de almacenamiento local
          // pero no hay handle Y no es Electron (en navegador necesitamos handle)
          setPaginas([]);
          return;
        }
        
        // En Electron sin basePath, no intentar cargar
        if (config.useLocalStorage && isElectron && !config.basePath) {
          setPaginas([]);
          return;
        }
        
        const files = await LocalStorageService.listFiles('data');
        
        if (files.length === 0) {
          setPaginas([]);
          return;
        }
        
        const paginasData = await Promise.all(
          files
            .filter(f => {
              // Excluir notas rápidas
              if (f.startsWith('quick-note-')) return false;
              // Excluir archivos de configuración/metadatos
              if (f === 'calendar-events.json' || f === '_pages-index.json') return false;
              // Solo archivos JSON
              return f.endsWith('.json');
            })
            .map(async (file) => {
              try {
                const data = await LocalStorageService.readJSONFile(file, 'data');
                // Verificar que no sea una nota rápida por su estructura
                if (data && data.id && data.id.startsWith('quick-note-')) {
                  return null; // Excluir notas rápidas
                }
                // Excluir archivos de configuración por estructura (no tienen título ni son páginas)
                if (data && !data.titulo && (data.events || data.pages || data.version)) {
                  return null; // Excluir archivos de configuración
                }
                // Validar que la página tenga un título válido (no vacío ni "Sin título")
                const titulo = data?.titulo || '';
                if (!titulo || titulo.trim() === '' || titulo.trim() === 'Sin título') {
                  // No mostrar warning para archivos de configuración conocidos
                  return null; // Excluir páginas sin título válido
                }
                return { 
                  id: file.replace('.json', ''), 
                  parentId: data.parentId || null, // Asegurar que parentId existe (null para páginas raíz)
                  ...data 
                };
              } catch (error) {
                console.error(`Error cargando página ${file}:`, error);
                return null; // Excluir archivos con error
              }
            })
        );
        
        // Filtrar valores nulos (notas rápidas excluidas, páginas sin título, errores)
        const paginasValidas = paginasData.filter(p => p !== null && p !== undefined);

        // Limpiar timeout anterior si existe
        if (rebuildIndexTimeoutRef.current) {
          clearTimeout(rebuildIndexTimeoutRef.current);
        }

        // Reconstruir índice solo si no existe o si el número de páginas cambió significativamente
        // Esto evita reconstrucciones innecesarias
        // Usar setTimeout para evitar actualizaciones durante el renderizado
        rebuildIndexTimeoutRef.current = setTimeout(async () => {
          try {
            const currentIndex = await PageIndexService.getIndex();
            const indexPageCount = currentIndex.pages?.length || 0;
            const actualPageCount = paginasValidas.length;
            
            // Solo reconstruir si hay una diferencia significativa (más del 10% o si no hay índice)
            if (indexPageCount === 0 || Math.abs(actualPageCount - indexPageCount) / Math.max(actualPageCount, 1) > 0.1) {
              await PageIndexService.rebuildIndex();
            }
          } catch (error) {
            // Si hay error obteniendo el índice, reconstruirlo
            await PageIndexService.rebuildIndex();
          }
          rebuildIndexTimeoutRef.current = null;
        }, 100); // Aumentar a 100ms para dar tiempo al renderizado

        // Ordenar por fecha de creación descendente, pero mantener orden estable
        // Usar ID como segundo criterio para orden estable
        paginasValidas.sort((a, b) => {
          const fechaA = new Date(a.creadoEn || 0);
          const fechaB = new Date(b.creadoEn || 0);
          if (fechaB.getTime() !== fechaA.getTime()) {
            return fechaB - fechaA;
          }
          // Si las fechas son iguales, ordenar por ID para mantener orden estable
          return (a.id || '').localeCompare(b.id || '');
        });

        // Solo actualizar si realmente cambió el número de páginas o los IDs
        // Usar startTransition para marcar como actualización de baja prioridad
        startTransition(() => {
          setPaginas(prevPaginas => {
          // Si no hay páginas previas, actualizar directamente
          if (prevPaginas.length === 0 && paginasValidas.length > 0) {
            return paginasValidas;
          }
          
          // Si no hay páginas nuevas y había páginas previas, mantener las previas
          if (paginasValidas.length === 0 && prevPaginas.length > 0) {
            return prevPaginas;
          }
          
          const prevIds = new Set(prevPaginas.map(p => p.id));
          const newIds = new Set(paginasValidas.map(p => p.id));
          
          // Si los tamaños son diferentes, actualizar
          if (prevIds.size !== newIds.size) {
            return paginasValidas;
          }
          
          // Verificar si hay IDs nuevos o faltantes
          const hayIdsNuevos = [...newIds].some(id => !prevIds.has(id));
          const hayIdsFaltantes = [...prevIds].some(id => !newIds.has(id));
          
          if (hayIdsNuevos || hayIdsFaltantes) {
            return paginasValidas;
          }
          
          // Si son los mismos IDs, mantener el estado anterior para evitar re-renders innecesarios
          // Esto previene que el sidebar se mueva constantemente
          return prevPaginas;
          });
        });
      } catch (error) {
        // Error cargando páginas
        console.error('Error cargando páginas:', error);
      } finally {
        // Liberar el flag de carga
        cargandoPaginasRef.current = false;
      }
    };

    cargarPaginas();
    
    // Escuchar evento de reordenamiento para recargar páginas
    const handleReordenar = () => {
      if (!cargandoPaginasRef.current) {
        cargarPaginas();
      }
    };
    window.addEventListener('paginasReordenadas', handleReordenar);
    
    // Recargar cada 30 segundos para detectar cambios (reducido de 5 a 30 para evitar movimiento constante)
    const interval = setInterval(() => {
      if (!cargandoPaginasRef.current) {
        cargarPaginas();
      }
    }, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('paginasReordenadas', handleReordenar);
      // Limpiar timeout de rebuildIndex si existe
      if (rebuildIndexTimeoutRef.current) {
        clearTimeout(rebuildIndexTimeoutRef.current);
        rebuildIndexTimeoutRef.current = null;
      }
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
      if (hasHandle && !lastHandleRef.current) {
        // Solo actualizar si cambió de false a true
        lastHandleRef.current = true;
        setHandleVersion(prev => prev + 1);
      } else if (!hasHandle && lastHandleRef.current) {
        lastHandleRef.current = false;
      }
    }, 2000);
    
    return () => {
      window.removeEventListener('directoryHandleChanged', handleDirectoryChanged);
      clearInterval(interval);
    };
  }, []);

  // Ref para evitar cargas duplicadas de la misma página
  const cargandoPaginaRef = useRef(null);
  const cargandoContenidoRef = useRef(false); // Flag para evitar actualizaciones durante carga
  const handleUpdateRef = useRef(null); // Ref para el handler de update del editor
  const insertandoContenidoRef = useRef(false); // Flag para evitar actualizaciones durante inserción programática
  const updateTimeoutRef = useRef(null); // Ref para el timeout del debounce de update
  
  // Escuchar eventos de inserción programática desde comandos slash
  useEffect(() => {
    const handleInserting = () => {
      insertandoContenidoRef.current = true;
    };
    
    const handleFinishedInserting = () => {
      // Esperar un poco más antes de permitir actualizaciones
      setTimeout(() => {
        insertandoContenidoRef.current = false;
      }, 200);
    };
    
    window.addEventListener('inserting-programmatic-content', handleInserting);
    window.addEventListener('finished-inserting-programmatic-content', handleFinishedInserting);
    
    return () => {
      window.removeEventListener('inserting-programmatic-content', handleInserting);
      window.removeEventListener('finished-inserting-programmatic-content', handleFinishedInserting);
    };
  }, []);
  
  // Cargar contenido de página seleccionada
  useEffect(() => {
    if (!editor || !paginaSeleccionada) return;
    
    // Evitar cargar la misma página múltiples veces
    if (cargandoPaginaRef.current === paginaSeleccionada) {
      return;
    }
    
    cargandoPaginaRef.current = paginaSeleccionada;
    cargandoContenidoRef.current = true; // Marcar que estamos cargando
    
    // Actualizar contexto de página actual
    PageContext.setCurrentPageId(paginaSeleccionada);

    const cargarContenido = async () => {
      try {
        const data = await LocalStorageService.readJSONFile(`${paginaSeleccionada}.json`, 'data');
        
        // Verificar que no sea una nota rápida
        if (data && (data.id?.startsWith('quick-note-') || paginaSeleccionada.startsWith('quick-note-'))) {
          console.warn('Intento de cargar una nota rápida como página');
          cargandoPaginaRef.current = null;
          cargandoContenidoRef.current = false;
          return; // No cargar notas rápidas como páginas
        }
        
        if (data && data.contenido) {
          // Agrupar todas las actualizaciones de estado en un startTransition para evitar múltiples re-renders
          startTransition(() => {
            setTitulo(data.titulo || "");
            setTituloPaginaActual(data.titulo || "");
            setPageTags(data.tags || []);
          });
          
          // Convertir referencias de archivo a URLs blob antes de cargar
          const contenidoConBlobs = await convertirReferenciasABlobs(data.contenido);
          
          // Desactivar temporalmente el listener de update durante la carga
          const contenidoSerializado = JSON.stringify(contenidoConBlobs);
          ultimoContenidoRef.current = contenidoSerializado;
          
          // Deshabilitar el editor temporalmente para evitar eventos durante setContent
          const wasEditable = editor.isEditable;
          editor.setEditable(false);
          editor.commands.setContent(contenidoConBlobs, false);
          editor.setEditable(wasEditable);
          
          // Esperar múltiples frames para que el contenido se establezca completamente
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // Si no hay datos, inicializar valores por defecto
          startTransition(() => {
            setTitulo("");
            setTituloPaginaActual("");
            setPageTags([]);
          });
          
          const contenidoVacio = { type: "doc", content: [{ type: "paragraph" }] };
          ultimoContenidoRef.current = JSON.stringify(contenidoVacio);
          
          const wasEditable = editor.isEditable;
          editor.setEditable(false);
          editor.commands.setContent(contenidoVacio, false);
          editor.setEditable(wasEditable);
          
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Marcar que terminamos de cargar ANTES de las actualizaciones de estado
        cargandoContenidoRef.current = false;
        
        // Usar setTimeout para diferir las actualizaciones de estado y la verificación de scripts
        setTimeout(() => {
          setHayCambiosSinGuardar(false);
          // Verificar scripts SQL asociados a esta página (solo una vez, después de que todo esté estable)
          // Usar el ref en lugar de la función directa para evitar dependencias
          if (checkPageSQLScriptsRef.current) {
            checkPageSQLScriptsRef.current(paginaSeleccionada);
          }
        }, 150);
        
        // Limpiar el ref después de cargar
        cargandoPaginaRef.current = null;
      } catch (error) {
        // En caso de error, inicializar valores por defecto
        startTransition(() => {
          setTitulo("");
          setTituloPaginaActual("");
          setPageTags([]);
        });
        
        const contenidoVacio = { type: "doc", content: [{ type: "paragraph" }] };
        ultimoContenidoRef.current = JSON.stringify(contenidoVacio);
        
        const wasEditable = editor.isEditable;
        editor.setEditable(false);
        editor.commands.setContent(contenidoVacio, false);
        editor.setEditable(wasEditable);
        
        setTimeout(() => {
          setPageSQLScriptsCount(0);
        }, 100);
        
        cargandoPaginaRef.current = null;
        cargandoContenidoRef.current = false;
      }
    };

    cargarContenido();

    // Detectar cambios en el editor
    // Actualizar el ref con el handler
    handleUpdateRef.current = () => {
      // Ignorar actualizaciones durante la carga inicial o inserción programática
      if (cargandoContenidoRef.current || insertandoContenidoRef.current) {
        return;
      }
      
      // Limpiar timeout anterior si existe
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Usar un debounce más agresivo para evitar bucles infinitos
      updateTimeoutRef.current = setTimeout(() => {
        if (cargandoContenidoRef.current || insertandoContenidoRef.current) {
          return;
        }
        
        const contenidoActual = JSON.stringify(editor.getJSON());
        
        // Solo actualizar si el contenido realmente cambió de manera significativa
        if (ultimoContenidoRef.current === null) {
          ultimoContenidoRef.current = contenidoActual;
          setHayCambiosSinGuardar(false);
        } else if (contenidoActual !== ultimoContenidoRef.current) {
          // Verificar que el cambio sea significativo (más de solo espacios o formato)
          const contenidoAnterior = ultimoContenidoRef.current;
          const contenidoAnteriorLimpio = contenidoAnterior.replace(/\s+/g, ' ').trim();
          const contenidoActualLimpio = contenidoActual.replace(/\s+/g, ' ').trim();
          
          // Solo actualizar si hay un cambio real en el contenido
          if (contenidoAnteriorLimpio !== contenidoActualLimpio) {
            setHayCambiosSinGuardar(true);
          }
        }
        
        updateTimeoutRef.current = null;
      }, 300); // Debounce de 300ms para evitar actualizaciones muy rápidas
    };

    const handleUpdate = () => {
      if (handleUpdateRef.current) {
        handleUpdateRef.current();
      }
    };

    editor.on('update', handleUpdate);

    // Actualizar ref con la función actual (para el beforeunload)
    guardarContenidoRef.current = guardarContenido;

    return () => {
      editor.off('update', handleUpdate);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, paginaSeleccionada]); // No incluir guardarContenido para evitar bucles infinitos

  // Refs para beforeunload (evitar dependencias que cambien)
  const hayCambiosSinGuardarRef = useRef(false);
  const guardandoRef = useRef(false);
  
  // Mantener refs actualizados
  useEffect(() => {
    hayCambiosSinGuardarRef.current = hayCambiosSinGuardar;
  }, [hayCambiosSinGuardar]);
  
  useEffect(() => {
    guardandoRef.current = guardando;
  }, [guardando]);

  // Manejar recarga de página (F5) con modal personalizado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Detectar F5 o Ctrl+R / Cmd+R
      if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) {
        if (hayCambiosSinGuardarRef.current && !guardandoRef.current) {
          e.preventDefault();
          e.stopPropagation();
          setShowReloadConfirmModal(true);
          return false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Manejar confirmación de recarga
  const handleConfirmReload = async () => {
    // Intentar guardar antes de recargar
    if (editor && paginaSeleccionada && guardarContenidoRef.current) {
      const json = editor.getJSON();
      await guardarContenidoRef.current(json, false); // No mostrar toast al cerrar
    }
    setShowReloadConfirmModal(false);
    pendingReloadRef.current = true;
    // Pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleCancelReload = () => {
    setShowReloadConfirmModal(false);
    pendingReloadRef.current = false;
  };

  // Prevenir cierre de página si hay cambios sin guardar (para otros casos como cerrar pestaña)
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      // Si ya confirmamos la recarga, permitirla
      if (pendingReloadRef.current) {
        return;
      }
      
      // Usar refs para evitar dependencias
      if (hayCambiosSinGuardarRef.current && !guardandoRef.current) {
        // Intentar guardar antes de cerrar
        if (editor && paginaSeleccionada && guardarContenidoRef.current) {
          const json = editor.getJSON();
          await guardarContenidoRef.current(json, false); // No mostrar toast al cerrar
        }
        
        // Mostrar advertencia del navegador (solo para cerrar pestaña/navegador)
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias - usamos refs

  // Ref para el handler de guardar con teclado
  const handleGuardarRef = useRef(null);
  
  // Mantener el ref actualizado sin dependencias que cambien
  useEffect(() => {
    handleGuardarRef.current = async () => {
      // Usar refs para acceder a valores actuales sin dependencias
      if (!editor || !paginaSeleccionada) return;
      
      // Verificar estado actual usando una función
      const currentGuardando = guardando;
      const currentHayCambios = hayCambiosSinGuardar;
      
      if (currentGuardando || autoguardandoRef.current || !currentHayCambios) {
        return;
      }
      
      const json = editor.getJSON();
      setGuardando(true);
      try {
        if (guardarContenidoRef.current) {
          const guardado = await guardarContenidoRef.current(json, true);
          if (guardado) {
            setToast({
              message: 'Cambios guardados',
              type: 'success'
            });
          }
        }
      } catch (error) {
        setToast({
          message: 'Error al guardar',
          type: 'error'
        });
      } finally {
        setGuardando(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias - usamos refs y valores actuales

  // Atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = async (e) => {
      const target = e.target;
      
      // NO interferir si estamos en un editor de CodeMirror (VisualCodeTab)
      const isCodeMirrorEditor = target.closest('.cm-editor') || target.closest('.cm-content') || target.closest('.cm-scroller');
      if (isCodeMirrorEditor) {
        // Permitir que CodeMirror maneje todos sus atajos (Ctrl+A, Ctrl+C, Ctrl+V, etc.)
        return;
      }
      
      // NO interferir si estamos en un input/textarea real
      const isRealInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (isRealInput) {
        return;
      }
      
      // Ctrl+S (Windows/Linux) o Cmd+S (Mac) - Guardar
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (handleGuardarRef.current) {
          await handleGuardarRef.current();
        }
        return;
      }
      // Ctrl+K (Windows/Linux) o Cmd+K (Mac) - Búsqueda global
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setShowGlobalSearch(true);
        return;
      }
      // Ctrl+G - Notas generales
      if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        if (!showGeneralNotesHistory) {
          setShowGeneralNotesHistory(true);
        }
      }
      
      // Ctrl+Q - Nota rápida (solo Ctrl, no Cmd, para evitar conflictos en Mac)
      if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'q' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowQuickNote(true);
      }
    };

    // Usar capture phase para capturar el evento antes que otros listeners
    // PERO solo para atajos específicos, no para bloquear Ctrl+A, Ctrl+C, etc.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Manejar selección de resultado de búsqueda global
  const handleSearchResultSelect = async (result) => {
    if (result.type === 'page') {
      // Seleccionar la página
      seleccionarPagina(result.id);
    } else if (result.type === 'event') {
      // Para eventos, necesitamos navegar a la página que contiene el calendario
      // Por ahora, simplemente cerramos la búsqueda
      // TODO: Implementar navegación a eventos del calendario
      setToast({
        message: 'Navegación a eventos próximamente',
        type: 'info'
      });
    } else if (result.type === 'table') {
      // Para tablas, navegar a la página que contiene la tabla
      if (result.pageId) {
        seleccionarPagina(result.pageId);
      }
    }
  };

  // Escuchar evento para abrir selector de plantillas desde slash command
  useEffect(() => {
    const handleOpenTemplateSelector = (e) => {
      templateInsertRange.current = e.detail.range;
      templateInsertEditor.current = e.detail.editor;
      setShowTemplateSelectorForSlash(true);
    };

    window.addEventListener('open-template-selector', handleOpenTemplateSelector);
    return () => {
      window.removeEventListener('open-template-selector', handleOpenTemplateSelector);
    };
  }, []);

  // Escuchar evento para abrir gestor de archivos SQL
  useEffect(() => {
    const handleOpenSQLFileManager = () => {
      setShowSQLFileManager(true);
    };

    window.addEventListener('open-sql-file-manager', handleOpenSQLFileManager);
    return () => {
      window.removeEventListener('open-sql-file-manager', handleOpenSQLFileManager);
    };
  }, []);

  // Escuchar evento para abrir notas rápidas desde comando /nota
  useEffect(() => {
    let isOpening = false; // Flag para evitar aperturas múltiples
    
    const handleOpenQuickNote = (e) => {
      // Prevenir aperturas duplicadas si ya está abierto o si se está abriendo
      if (isOpening || showQuickNote) {
        e?.stopPropagation?.();
        return;
      }
      
      isOpening = true;
      setShowQuickNote(true);
      
      // Resetear el flag después de un momento
      setTimeout(() => {
        isOpening = false;
      }, 100);
    };

    window.addEventListener('open-quick-note', handleOpenQuickNote);
    return () => {
      window.removeEventListener('open-quick-note', handleOpenQuickNote);
    };
  }, [showQuickNote]);

  // Escuchar evento para abrir la consola
  useEffect(() => {
    const handleOpenConsole = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowConsole(true);
    };

    window.addEventListener('open-console', handleOpenConsole);
    return () => {
      window.removeEventListener('open-console', handleOpenConsole);
    };
  }, []);

  // Escuchar evento para abrir el centro de ejecución
  useEffect(() => {
    const handleOpenCentroEjecucion = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Buscar la página "Centro de Ejecución" o "⚡ Centro de Ejecución"
      const paginaCentro = paginas.find(p => 
        p.titulo === 'Centro de Ejecución' || 
        p.titulo === '⚡ Centro de Ejecución' ||
        (p.titulo && p.titulo.includes('Centro de Ejecución'))
      );
      
      if (paginaCentro) {
        // Si existe, seleccionarla
        if (seleccionarPaginaRef.current) {
          seleccionarPaginaRef.current(paginaCentro.id);
        }
        setShowCentroEjecucion(true);
      } else {
        // Si no existe, crearla y luego seleccionarla
        const contenido = {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "⚡ Centro de Ejecución" }]
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Esta es tu página centralizada para gestionar terminales, proyectos y servicios de ejecución." }
              ]
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Escribe " },
                { type: "text", marks: [{ type: "code" }], text: "/centro ejecucion" },
                { type: "text", text: " o usa el botón flotante para abrir el Centro de Ejecución." }
              ]
            },
            {
              type: "paragraph"
            },
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "code" }], text: "/centro ejecucion" }
              ]
            }
          ]
        };
        
        const nuevaPaginaId = crearPaginaRef.current 
          ? await crearPaginaRef.current('⚡ Centro de Ejecución', '⚡', null, [], contenido)
          : null;
        // Esperar un momento para que se cree y luego seleccionarla
        setTimeout(() => {
          if (nuevaPaginaId && seleccionarPaginaRef.current) {
            seleccionarPaginaRef.current(nuevaPaginaId);
          }
          setShowCentroEjecucion(true);
        }, 500);
      }
    };

    window.addEventListener('open-centro-ejecucion', handleOpenCentroEjecucion);
    return () => {
      window.removeEventListener('open-centro-ejecucion', handleOpenCentroEjecucion);
    };
  }, [paginas]);

  // Escuchar evento para abrir Visual Code con un proyecto
  useEffect(() => {
    const handleOpenVisualCode = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { projectPath, projectTitle, projectColor, theme, fontSize, extensions, openMode } = e.detail || {};
      
      if (!projectPath) {
        console.error('[LocalEditor] No se recibió projectPath en el evento');
        alert('Error: No se recibió la ruta del proyecto');
        return;
      }
      
      // Si el modo es 'fullscreen', abrir en modal independiente
      if (openMode === 'fullscreen') {
        
        // Verificar si ya existe un modal para este proyecto
        const existingModalIndex = visualCodeFullscreenModals.findIndex(
          m => m.projectPath === projectPath
        );
        
        if (existingModalIndex >= 0) {
          // Si existe, restaurarlo y traerlo al frente
          setVisualCodeFullscreenModals(prev => {
            const updated = [...prev];
            updated[existingModalIndex] = {
              ...updated[existingModalIndex],
              isMinimized: false,
              zIndex: Math.max(...prev.map(m => m.zIndex || 70000), 70000) + 1
            };
            return updated;
          });
        } else {
          // Si no existe, crear uno nuevo
          const newModal = {
            id: `visual-code-${Date.now()}-${Math.random()}`,
            projectPath,
            projectTitle,
            projectColor,
            theme,
            fontSize,
            extensions,
            isMinimized: false,
            zIndex: Math.max(...visualCodeFullscreenModals.map(m => m.zIndex || 70000), 70000) + 1
          };
          setVisualCodeFullscreenModals(prev => [...prev, newModal]);
        }
        return;
      }
      
      // Si el editor no está disponible, buscar/seleccionar la página "Centro de Ejecución"
      if (!editor) {
        console.warn('[LocalEditor] Editor no está disponible, buscando página Centro de Ejecución...');
        
        // Buscar la página "Centro de Ejecución"
        const paginaCentro = paginas.find(p => 
          p.titulo === 'Centro de Ejecución' || 
          p.titulo === '⚡ Centro de Ejecución' ||
          (p.titulo && p.titulo.includes('Centro de Ejecución'))
        );
        
        if (paginaCentro) {
          // Si existe, seleccionarla y esperar a que se cargue
          if (seleccionarPaginaRef.current) {
            seleccionarPaginaRef.current(paginaCentro.id);
          }
          setTimeout(() => {
            if (editor) {
              window.dispatchEvent(new CustomEvent('open-visual-code', { 
                detail: e.detail,
                bubbles: true,
                cancelable: true
              }));
            } else {
              console.error('[LocalEditor] Editor aún no disponible después de seleccionar página');
              alert('⚠️ El editor no está disponible.\n\n' +
                    'Por favor, espera un momento y vuelve a intentar abrir el proyecto.');
            }
          }, 1000);
          return;
        } else {
          // Si no existe, crearla
          const contenido = {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "⚡ Centro de Ejecución" }]
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Esta es tu página centralizada para gestionar terminales, proyectos y servicios de ejecución." }
                ]
              }
            ]
          };
          
          const nuevaPaginaId = crearPaginaRef.current 
            ? await crearPaginaRef.current('⚡ Centro de Ejecución', '⚡', null, [], contenido)
            : null;
          // Esperar a que se cree y seleccione la página
          setTimeout(() => {
            if (nuevaPaginaId && seleccionarPaginaRef.current) {
              seleccionarPaginaRef.current(nuevaPaginaId);
            }
            // Esperar un poco más para que el editor esté listo
            setTimeout(() => {
              if (editor) {
                window.dispatchEvent(new CustomEvent('open-visual-code', { 
                  detail: e.detail,
                  bubbles: true,
                  cancelable: true
                }));
              } else {
                alert('⚠️ No se pudo crear la página. Por favor, crea una página manualmente y vuelve a intentar.');
              }
            }, 500);
          }, 500);
          return;
        }
      }
      
      try {
        // 1) Intentar reutilizar un bloque Visual Code existente con el mismo projectPath
        let existingPos = null;
        let existingNode = null;

        editor.state.doc.descendants((node, pos) => {
          if (node.type?.name === 'visualCodeBlock' && node.attrs?.projectPath === projectPath) {
            existingPos = pos;
            existingNode = node;
            return false; // detener búsqueda
          }
          return true;
        });

        if (existingPos !== null) {
          // Actualizar atributos principales si llegan desde el Centro (sin tocar archivos abiertos/contenidos)
          const nextAttrs = {
            ...existingNode.attrs,
            projectPath: projectPath || existingNode.attrs.projectPath,
            fontSize: (fontSize || parseInt(existingNode.attrs.fontSize) || 14).toString(),
            theme: theme || existingNode.attrs.theme || 'oneDark',
            projectTitle: projectTitle ?? existingNode.attrs.projectTitle,
            projectColor: projectColor ?? existingNode.attrs.projectColor,
            extensions: extensions
              ? JSON.stringify(extensions)
              : existingNode.attrs.extensions,
          };

          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              tr.setNodeMarkup(existingPos, undefined, nextAttrs);
              return true;
            })
            .setNodeSelection(existingPos)
            .scrollIntoView()
            .run();

          // Pedirle al bloque que abra el explorador / panel de archivos
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('focus-visual-code', {
              detail: {
                projectPath,
                openExplorer: true,
                openMode: openMode || 'page', // 'page' o 'fullscreen'
              }
            }));
          }, 50);

          return;
        }

        // 2) Si no existe, insertar bloque Visual Code nuevo
        // Obtener la posición actual del cursor
        const { from } = editor.state.selection;
        
        editor.chain()
          .focus()
          .insertContentAt(from, {
            type: 'visualCodeBlock',
            attrs: {
              projectPath: projectPath || '',
              openFiles: '[]',
              activeFile: '',
              fileContents: '{}',
              fontSize: (fontSize || 14).toString(),
              theme: theme || 'oneDark',
              projectTitle: projectTitle || '',
              projectColor: projectColor || '#1e1e1e',
              extensions: extensions ? JSON.stringify(extensions) : JSON.stringify({
                errorLens: true,
                betterComments: true,
                es7ReactRedux: true,
                reactSimpleSnippets: true,
                autoCloseTag: true,
                pasteJsonAsCode: true,
                backticks: true,
                tokyoNight: false,
                beardedIcons: true
              }),
            },
          })
          .run();
        
        // Scroll al bloque insertado y disparar evento para abrir explorador
        setTimeout(() => {
          const visualCodeBlocks = document.querySelectorAll('visual-code-block');
          if (visualCodeBlocks.length > 0) {
            const lastBlock = visualCodeBlocks[visualCodeBlocks.length - 1];
            lastBlock.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Disparar evento para abrir explorador en el nuevo bloque
            window.dispatchEvent(new CustomEvent('focus-visual-code', {
              detail: {
                projectPath,
                openExplorer: true,
                openMode: openMode || 'page', // 'page' o 'fullscreen'
              }
            }));
          }
        }, 200);
      } catch (error) {
        console.error('[LocalEditor] Error insertando bloque Visual Code:', error);
        alert('Error al insertar bloque Visual Code: ' + error.message);
      }
    };
    
    window.addEventListener('open-visual-code', handleOpenVisualCode);
    
    return () => {
      window.removeEventListener('open-visual-code', handleOpenVisualCode);
    };
  }, [editor]);

  // Escuchar evento para navegar a una página desde SQLScriptNode
  useEffect(() => {
    const handleNavigateToPage = (event) => {
      const { pageId } = event.detail;
      if (pageId) {
        seleccionarPagina(pageId);
      }
    };

    window.addEventListener('navigate-to-page', handleNavigateToPage);
    return () => {
      window.removeEventListener('navigate-to-page', handleNavigateToPage);
    };
  }, []);

  // Escuchar evento para abrir scripts SQL de una página específica
  useEffect(() => {
    const handleOpenPageSQLScripts = (event) => {
      const { pageId } = event.detail;
      if (pageId && pageId !== paginaSeleccionada) {
        // Solo actualizar si es una página diferente para evitar bucles
        seleccionarPagina(pageId);
        // Esperar un momento para que la página se cargue y luego abrir el modal
        setTimeout(() => {
          setShowPageSQLScripts(true);
        }, 300);
      } else if (pageId === paginaSeleccionada) {
        // Si ya es la página actual, solo abrir el modal
        setShowPageSQLScripts(true);
      }
    };

    window.addEventListener('open-page-sql-scripts', handleOpenPageSQLScripts);
    return () => {
      window.removeEventListener('open-page-sql-scripts', handleOpenPageSQLScripts);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No incluir paginaSeleccionada para evitar bucles

  // Manejar inserción de plantilla desde slash command
  const handleTemplateInsert = (template) => {
    if (templateInsertEditor.current && template.content) {
      templateInsertEditor.current.chain().focus().insertContent(template.content).run();
      templateInsertRange.current = null;
      templateInsertEditor.current = null;
    }
    setShowTemplateSelectorForSlash(false);
  };

  const crearPagina = useCallback(async (titulo, emoji = null, parentId = null, tags = [], templateContent = null) => {
    if (!titulo || !titulo.trim()) return;

    // Extraer emoji si no se pasó explícitamente
    const emojiFinal = emoji || extraerEmojiDelTitulo(titulo);
    // Quitar el emoji del título para guardarlo limpio
    let tituloSinEmoji = quitarEmojiDelTitulo(titulo);
    
    // Validar que después de quitar el emoji, el título no esté vacío
    // Si solo hay emoji, usar el emoji como título o rechazar la creación
    if (!tituloSinEmoji || tituloSinEmoji.trim() === '' || tituloSinEmoji === 'Sin título') {
      // Si el título original tiene contenido (aunque sea solo emoji), usar el título original
      if (titulo && titulo.trim()) {
        tituloSinEmoji = titulo.trim();
      } else {
        // Si no hay título válido, no crear la página
        return;
      }
    }

    // Generar UUID único para la página (usar crypto.randomUUID() si está disponible, sino fallback a timestamp)
    const id = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `pagina-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Usar contenido de plantilla si está disponible, sino contenido vacío
    const contenido = templateContent || {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
    
    // Validación final: asegurar que el título no esté vacío
    if (!tituloSinEmoji || tituloSinEmoji.trim() === '') {
      return; // No crear la página si el título final está vacío
    }

    const nuevaPagina = {
      id,
      titulo: tituloSinEmoji.trim(),
      emoji: emojiFinal || null,
      parentId: parentId || null, // ID de la página padre (null para páginas raíz)
      tags: tags || [], // IDs de tags
      contenido: contenido,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    try {
      await LocalStorageService.saveJSONFile(`${id}.json`, nuevaPagina, 'data');
      
      setPaginas([nuevaPagina, ...paginas]);
      setPaginaSeleccionada(id);
      setTitulo(tituloSinEmoji);
      setTituloPaginaActual(tituloSinEmoji);
      
      // Actualizar índice de páginas
      await PageIndexService.updatePageInIndex(id, nuevaPagina);
      
      // Cargar el contenido en el editor (incluyendo contenido de plantilla si existe)
      editor?.commands.setContent(contenido);
      
      // Verificar scripts SQL asociados
      if (checkPageSQLScriptsRef.current) {
        checkPageSQLScriptsRef.current(id);
      }
      
      return id; // Devolver el ID de la página creada
    } catch (error) {
      setModalError({ 
        isOpen: true, 
        message: `No se pudo crear la página. Error: ${error.message}. Verifica la consola para más detalles.`, 
        title: "Error al crear página" 
      });
      return null;
    }
  }, [paginas, editor, extraerEmojiDelTitulo, quitarEmojiDelTitulo, setPaginas, setPaginaSeleccionada, setTitulo, setTituloPaginaActual, setModalError]);

  // Crear página de Centro de Ejecución automáticamente si no existe
  useEffect(() => {
    const crearPaginaCentroEjecucion = async () => {
      try {
        // Verificar configuración y handle
        const config = LocalStorageService.config;
        const hasHandle = !!LocalStorageService.baseDirectoryHandle;
        
        if (config.useLocalStorage && !hasHandle) {
          return; // No crear si no hay handle
        }

        // Buscar si ya existe una página con el título "Centro de Ejecución"
        const files = await LocalStorageService.listFiles('data');
        
        // Verificar de forma más simple
        let paginaExiste = false;
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          // Excluir archivos que no son páginas
          if (file.startsWith('quick-note-') || file === 'calendar-events.json' || file === '_pages-index.json') continue;
          try {
            const data = await LocalStorageService.readJSONFile(file, 'data');
            if (data?.titulo === 'Centro de Ejecución' || data?.titulo === '⚡ Centro de Ejecución') {
              paginaExiste = true;
              break;
            }
          } catch {
            continue;
          }
        }

        if (!paginaExiste) {
          // Crear la página automáticamente usando la función crearPagina
          const contenido = {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "⚡ Centro de Ejecución" }]
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Esta es tu página centralizada para gestionar terminales, proyectos y servicios de ejecución." }
                ]
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Escribe " },
                  { type: "text", marks: [{ type: "code" }], text: "/centro ejecucion" },
                  { type: "text", text: " o usa el botón flotante para abrir el Centro de Ejecución." }
                ]
              },
              {
                type: "paragraph"
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "code" }], text: "/centro ejecucion" }
                ]
              }
            ]
          };

          // Usar crearPagina que ya está definida en el componente
          if (crearPaginaRef.current) {
            await crearPaginaRef.current('⚡ Centro de Ejecución', '⚡', null, [], contenido);
          }
        }
      } catch (error) {
        console.error('Error creando página de Centro de Ejecución:', error);
      }
    };

    // Esperar un poco para que el sistema esté listo y las páginas se hayan cargado
    const timeoutId = setTimeout(() => {
      crearPaginaCentroEjecucion();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [crearPagina]); // Incluir crearPagina en dependencias

  // Verificar scripts SQL asociados a una página
  const checkPageSQLScripts = useCallback(async (pageId) => {
    if (!pageId) {
      setPageSQLScriptsCount(0);
      return;
    }
    
    // Evitar verificaciones duplicadas simultáneas para la misma página
    if (checkingSQLScriptsRef.current.has(pageId)) {
      return;
    }
    
    checkingSQLScriptsRef.current.add(pageId);
    
    try {
      const result = await SQLFileService.getFilesByPage(pageId);
      const count = result.files?.length || 0;
      setPageSQLScriptsCount(count);
    } catch (error) {
      console.error('Error verificando scripts SQL:', error);
      setPageSQLScriptsCount(0);
    } finally {
      // Remover después de un pequeño delay para evitar llamadas muy rápidas
      setTimeout(() => {
        checkingSQLScriptsRef.current.delete(pageId);
      }, 100);
    }
  }, []); // No tiene dependencias, solo usa refs y setState

  const seleccionarPagina = useCallback(async (paginaId) => {
    if (!paginaId || !editor) return;
    setPaginaSeleccionada(paginaId);
    PageContext.setCurrentPageId(paginaId);
    setSelectorAbierto(false);
    
    // Verificar si hay scripts SQL asociados a esta página usando el ref
    if (checkPageSQLScriptsRef.current) {
      checkPageSQLScriptsRef.current(paginaId);
    }
  }, [editor]); // Solo depende de editor

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
                target: '_self', // Usar _self en lugar de null para asegurar que se renderice
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

  // Escuchar evento para abrir el selector de emojis
  useEffect(() => {
    const handleOpenEmojiPicker = (event) => {
      if (!editor) return;
      
      // Si hay un toggleId en el evento, siempre manejarlo (viene del toggle)
      const hasToggleId = event.detail?.toggleId;
      
      // Verificar si el evento viene de un editor dentro de un Portal
      // Si es así, ignorar este evento (será manejado por EditorDescripcion.jsx)
      if (event.detail && event.detail.editor && !hasToggleId) {
        const eventEditor = event.detail.editor;
        
        // Verificar si hay un modal del Portal abierto
        const isPortalOpen = document.querySelector('[data-drawer="table-drawer-modal"]');
        
        // Si hay un Portal abierto y el editor del evento no es el editor principal,
        // entonces el evento viene del Portal, no manejarlo aquí
        if (isPortalOpen) {
          if (eventEditor !== editor) {
            // El evento viene del Portal, no manejarlo aquí
            return;
          }
          // Si el editor es el mismo pero hay un Portal abierto, verificar si el editor principal tiene focus
          // Si no tiene focus, probablemente el evento viene del Portal
          if (!editor.isFocused) {
            return;
          }
        }
        
        // Si el editor del evento no es el editor principal, también ignorar
        if (eventEditor !== editor) {
          return;
        }
      }
      
      // Si hay posición personalizada en el evento (viene del toggle), usarla directamente
      const customPosition = event.detail?.position;
      if (customPosition) {
        setEmojiPickerPosition({
          top: customPosition.top,
          left: customPosition.left
        });
      } else {
        // Obtener la posición del cursor
        if (!editor || !editor.state) return;
        const { state } = editor;
        if (!state || !state.selection) return;
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
      }
      
      // Guardar información del toggle si viene en el evento
      if (event.detail?.toggleId) {
        setEmojiPickerToggleId(event.detail.toggleId);
        setEmojiPickerCurrentEmoji(event.detail.currentEmoji || '');
      } else {
        setEmojiPickerToggleId(null);
        setEmojiPickerCurrentEmoji('');
      }
      
      setShowEmojiPicker(true);
    };

    // Usar capture: false para que EditorDescripcion.jsx (con capture: true) se ejecute primero
    window.addEventListener('open-emoji-picker', handleOpenEmojiPicker, false);
    return () => {
      window.removeEventListener('open-emoji-picker', handleOpenEmojiPicker);
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
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  // Manejar selección de emoji
  const handleEmojiSelect = (emoji) => {
    if (!editor) return;
    
    // Si hay un toggleId, actualizar el toggle en lugar de insertar texto
    if (emojiPickerToggleId && editor.storage?.toggleEditing?.[emojiPickerToggleId]) {
      const toggleData = editor.storage.toggleEditing[emojiPickerToggleId];
      toggleData.updateIcono(emoji);
      // Limpiar la referencia
      delete editor.storage.toggleEditing[emojiPickerToggleId];
    } else {
      // Insertar el emoji en la posición actual del cursor
      editor.chain().focus().insertContent({
        type: 'text',
        text: emoji
      }).run();
    }
    
    setShowEmojiPicker(false);
    setEmojiPickerToggleId(null);
    setEmojiPickerCurrentEmoji('');
  };

  // Ref para seleccionarPagina para evitar dependencias
  const seleccionarPaginaRef = useRef(null);
  
  // Mantener el ref actualizado con seleccionarPagina
  useEffect(() => {
    seleccionarPaginaRef.current = seleccionarPagina;
  }, [seleccionarPagina]);
  
  // Mantener el ref de checkPageSQLScripts actualizado
  useEffect(() => {
    checkPageSQLScriptsRef.current = checkPageSQLScripts;
  }, [checkPageSQLScripts]);
  
  // Mantener el ref de crearPagina actualizado
  useEffect(() => {
    crearPaginaRef.current = crearPagina;
  }, [crearPagina]);
  
  // Configurar manejo de clics en enlaces internos
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    
    const handleClick = (event) => {
      const target = event.target;
      // Verificar si el clic fue en un enlace o en un elemento dentro de un enlace
      let linkElement = target.closest('a');
      
      // Si el target es un nodo de texto, buscar el enlace en el padre
      if (!linkElement && target.parentElement) {
        linkElement = target.parentElement.closest('a');
      }
      
      // Si aún no encontramos el enlace, buscar en todos los ancestros
      if (!linkElement) {
        let current = target;
        while (current && current !== editorElement) {
          if (current.tagName === 'A') {
            linkElement = current;
            break;
          }
          current = current.parentElement;
        }
      }
      
      if (linkElement) {
        const href = linkElement.getAttribute('href');
        if (href && href.startsWith('page:')) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          const paginaId = href.replace('page:', '');
          
          // Verificar que la página existe en la lista de páginas
          const paginaExiste = paginas.some(p => p.id === paginaId);
          if (!paginaExiste) {
            setToast({
              message: 'La página no existe o no está disponible',
              type: 'error'
            });
            return false;
          }
          
          // Usar el ref para seleccionar la página (esto disparará el useEffect que carga el contenido)
          if (seleccionarPaginaRef.current) {
            seleccionarPaginaRef.current(paginaId);
          } else if (typeof seleccionarPagina === 'function') {
            // Fallback: usar la función directamente si el ref no está disponible
            seleccionarPagina(paginaId);
          }
          return false;
        }
      }
    };

    // Usar capture phase para asegurar que capturamos el evento antes que otros manejadores
    editorElement.addEventListener('click', handleClick, true);
    return () => {
      editorElement.removeEventListener('click', handleClick, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, seleccionarPagina, paginas]); // Incluir paginas para verificar existencia

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
      
      // Extraer emoji del nuevo título
      const nuevoEmoji = extraerEmojiDelTitulo(nuevoTitulo);
      // Quitar el emoji del título para guardarlo limpio
      const tituloSinEmoji = quitarEmojiDelTitulo(nuevoTitulo);
      
      // Guardar con el nuevo título y emoji
      await LocalStorageService.saveJSONFile(
        `${paginaId}.json`,
        {
          ...data,
          titulo: tituloSinEmoji,
          emoji: nuevoEmoji || null,
          actualizadoEn: new Date().toISOString(),
          creadoEn: data.creadoEn || new Date().toISOString()
        },
        'data'
      );
      
      // Actualizar la lista de páginas
      const nuevasPaginas = paginas.map(p => 
        p.id === paginaId ? { ...p, titulo: tituloSinEmoji, emoji: nuevoEmoji || null } : p
      );
      setPaginas(nuevasPaginas);
      
      // Si es la página seleccionada, actualizar el título
      if (paginaSeleccionada === paginaId) {
        setTitulo(tituloSinEmoji);
        setTituloPaginaActual(tituloSinEmoji);
      }
      
      // Actualizar índice de páginas
      await PageIndexService.updatePageInIndex(paginaId, {
        ...data,
        titulo: tituloSinEmoji,
        emoji: nuevoEmoji || null
      });
      
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

  const cambiarParentIdPagina = async (paginaId, nuevoParentId) => {
    try {
      // Cargar datos actuales de la página
      const data = await LocalStorageService.readJSONFile(`${paginaId}.json`, 'data');
      if (!data) {
        return;
      }
      
      // Verificar que no se esté creando un ciclo (la página destino no puede ser hija de la página origen)
      const esDescendiente = (id, parentId) => {
        if (!parentId) return false;
        if (id === parentId) return true;
        const parent = paginas.find(p => p.id === parentId);
        if (!parent || !parent.parentId) return false;
        return esDescendiente(id, parent.parentId);
      };
      
      if (esDescendiente(paginaId, nuevoParentId)) {
        setToast({
          message: 'No se puede mover una página dentro de sus propios descendientes',
          type: 'error'
        });
        return;
      }
      
      // Guardar con el nuevo parentId
      await LocalStorageService.saveJSONFile(
        `${paginaId}.json`,
        {
          ...data,
          parentId: nuevoParentId || null,
          actualizadoEn: new Date().toISOString()
        },
        'data'
      );
      
      // Actualizar la lista de páginas
      const nuevasPaginas = paginas.map(p => 
        p.id === paginaId 
          ? { ...p, parentId: nuevoParentId || null } 
          : p
      );
      setPaginas(nuevasPaginas);
      
      // Actualizar índice de páginas
      await PageIndexService.updatePageInIndex(paginaId, {
        ...data,
        parentId: nuevoParentId || null
      });
      
      // Disparar evento para recargar páginas
      window.dispatchEvent(new Event('paginasReordenadas'));
      
      setToast({
        message: nuevoParentId ? 'Página movida correctamente' : 'Página convertida en página principal',
        type: 'success'
      });
    } catch (error) {
      setToast({
        message: 'Error al mover la página',
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
      const errores = [];
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
              console.warn(`[LocalEditor] Error eliminando archivo ${filename}:`, error);
            }
          }
          
          // Eliminar el archivo JSON de la página
          const eliminado = await LocalStorageService.deleteJSONFile(`${pagina.id}.json`, 'data');
          if (eliminado) {
            paginasEliminadas++;
          } else {
            const errorMsg = `No se pudo eliminar el archivo de la página ${pagina.id}`;
            console.error(`[LocalEditor] Error: ${errorMsg}`);
            errores.push(errorMsg);
          }
        } catch (error) {
          const errorMsg = `Error eliminando página ${pagina.id}: ${error.message}`;
          console.error(`[LocalEditor] ${errorMsg}`);
          errores.push(errorMsg);
        }
      }
      
      // Si hubo errores, lanzar excepción
      if (errores.length > 0) {
        throw new Error(`Errores al eliminar: ${errores.join('; ')}`);
      }
      
      // Actualizar la lista de páginas (eliminar todas las páginas eliminadas)
      const idsAEliminar = todasLasPaginasAEliminar.map(p => p.id);
      setPaginas(paginas.filter(p => !idsAEliminar.includes(p.id)));
      
      // Si la página eliminada (o alguna hija) era la seleccionada, limpiar la selección
      if (idsAEliminar.includes(paginaSeleccionada)) {
        setPaginaSeleccionada(null);
        PageContext.clearCurrentPageId();
        setTituloPaginaActual('');
        setPageTags([]);
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

  // Guardar tags de la página actual
  const handleSaveTags = async (newTags) => {
    if (!paginaSeleccionada) return;
    
    try {
      const data = await LocalStorageService.readJSONFile(`${paginaSeleccionada}.json`, 'data') || {};
      data.tags = newTags || [];
      await LocalStorageService.saveJSONFile(`${paginaSeleccionada}.json`, data, 'data');
      setPageTags(newTags || []);
      
      // Actualizar la lista de páginas para reflejar los cambios
      const updatedPaginas = paginas.map(p => 
        p.id === paginaSeleccionada ? { ...p, tags: newTags || [] } : p
      );
      setPaginas(updatedPaginas);
      
      setToast({
        message: 'Tags guardados correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error al guardar tags:', error);
      setModalError({
        isOpen: true,
        message: `Error al guardar tags: ${error.message}`,
        title: "Error"
      });
    }
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
    <div className="w-full h-screen flex bg-gray-50 dark:bg-gray-900 relative transition-colors">
      {/* Advertencia de almacenamiento - Posicionada de forma absoluta */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <StorageWarning onOpenConfig={() => setShowConfigModal(true)} />
      </div>

      {/* Botón de menú en la parte superior derecha */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => setShowKeyboardShortcuts(true)}
          className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          title="Ver atajos de teclado"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
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
        onOpenCentroEjecucion={() => setShowCentroEjecucion(true)}
        filtroPagina={filtroPagina}
        setFiltroPagina={setFiltroPagina}
        onSidebarStateChange={setSidebarColapsado}
        onEliminarPagina={abrirModalEliminar}
        onReordenarPaginas={setPaginas}
        onRenombrarPagina={renombrarPagina}
        onCambiarParentId={cambiarParentIdPagina}
      />

      {/* Búsqueda Global */}
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onSelectResult={handleSearchResultSelect}
      />

      {/* Guardar como Plantilla */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        pageTitle={tituloPaginaActual}
        pageContent={editor?.getJSON() || null}
      />

      {/* Selector de Plantillas para Slash Command */}
      <TemplateSelector
        isOpen={showTemplateSelectorForSlash}
        onClose={() => {
          setShowTemplateSelectorForSlash(false);
          templateInsertRange.current = null;
          templateInsertEditor.current = null;
        }}
        onSelectTemplate={handleTemplateInsert}
      />

      {/* Modal de Exportación */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        pageTitle={tituloPaginaActual}
        pageContent={editor?.getJSON()}
        editor={editor}
      />

      {/* Panel de Comentarios */}
      <CommentPanel
        isOpen={showCommentPanel}
        onClose={() => setShowCommentPanel(false)}
        pageId={paginaSeleccionada}
        editor={editor}
        onShowToast={setToast}
      />

      {/* Nota Rápida */}
      <QuickNote
        isOpen={showQuickNote}
        onClose={() => {
          setShowQuickNote(false);
          setQuickNoteToLoad(null);
        }}
        onShowHistory={() => setShowQuickNotesHistory(true)}
        onShowGeneralNotes={() => setShowGeneralNotesHistory(true)}
        initialNote={quickNoteToLoad}
      />

      {/* Historial de Notas Rápidas */}
      <QuickNotesHistory
        isOpen={showQuickNotesHistory}
        onClose={() => setShowQuickNotesHistory(false)}
        onOpenNote={(note) => {
          setQuickNoteToLoad(note);
          setShowQuickNote(true);
        }}
      />

      {/* Historial de Notas Generales */}
      <GeneralNotesHistory
        isOpen={showGeneralNotesHistory}
        onClose={() => {
          setShowGeneralNotesHistory(false);
          setGeneralNoteToEdit(null);
        }}
        onEditNote={(note) => {
          setGeneralNoteToEdit(note);
          setShowGeneralNotesHistory(false);
          // Abrir modal de edición después de un momento
          setTimeout(() => {
            // Se abrirá desde GeneralNotesHistory
          }, 100);
        }}
        initialNoteToEdit={generalNoteToEdit}
      />

      {/* Consola de Ejecución */}
      <ConsolePanel
        isOpen={showConsole}
        onClose={() => setShowConsole(false)}
        editor={editor}
      />

      {/* Centro de Ejecución - Panel abrible/cerrable */}
      <div className={`fixed inset-0 z-[60000] bg-white dark:bg-gray-900 transition-transform duration-300 ease-in-out ${
        showCentroEjecucion ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <CentroEjecucionPage onClose={() => setShowCentroEjecucion(false)} />
      </div>

      {/* Botón flotante para abrir Centro de Ejecución cuando está cerrado - Solo mostrar si hay una página seleccionada */}
      {!showCentroEjecucion && paginaSeleccionada && (
        <button
          onClick={() => setShowCentroEjecucion(true)}
          className="fixed bottom-6 right-6 z-[50000] bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center gap-2 group"
          title="Abrir Centro de Ejecución"
        >
          <Zap className="w-5 h-5" />
          <span className="hidden group-hover:inline-block text-sm font-medium pr-2">
            Centro de Ejecución
          </span>
        </button>
      )}

      {/* Atajos de Teclado */}
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        onExecuteAction={(actionId) => {
          switch (actionId) {
            case 'globalSearch':
              setShowGlobalSearch(true);
              break;
            case 'quickNote':
              setShowQuickNote(true);
              break;
            case 'quickNotesHistory':
              setShowQuickNotesHistory(true);
              break;
            default:
              break;
          }
        }}
      />

      {/* Gestor de Archivos SQL */}
      <SQLFileManager
        isOpen={showSQLFileManager}
        onClose={() => {
          setShowSQLFileManager(false);
          setSqlFileToLoad(null);
        }}
        onSelectFile={async (file) => {
          // Insertar el archivo SQL en el editor
          if (editor) {
            const fileId = file.id || SQLFileService.generateFileId(file.name);
            editor.chain().focus().insertContent({
              type: 'sqlScript',
              attrs: {
                scriptId: fileId,
                content: file.content || '',
                version: file.version || '',
                fileName: file.name || '',
                fileDescription: file.description || '',
                pageId: file.pageId || null,
                pageName: file.pageName || null,
              },
            }).run();
          }
        }}
        onNewFile={() => {
          // Crear nuevo archivo SQL en el editor
          if (editor) {
            const fileId = SQLFileService.generateFileId();
            editor.chain().focus().insertContent({
              type: 'sqlScript',
              attrs: {
                scriptId: fileId,
                content: '',
                version: '',
                fileName: '',
                fileDescription: '',
                pageId: null,
                pageName: null,
              },
            }).run();
          }
        }}
      />

      {/* Modal de Scripts SQL de la Página */}
      <PageSQLScriptsModal
        isOpen={showPageSQLScripts}
        onClose={() => {
          setShowPageSQLScripts(false);
          if (paginaSeleccionada) {
            checkPageSQLScripts(paginaSeleccionada);
          }
        }}
        pageId={paginaSeleccionada}
        pageName={tituloPaginaActual}
      />

      {/* Modal de Comandos desde el botón - COMPLETAMENTE INDEPENDIENTE */}
      {showSlashCommandModal && editor && (
        <CommandButtonModal
          isOpen={showSlashCommandModal}
          onClose={() => {
            setShowSlashCommandModal(false);
          }}
          items={getSlashCommandItems()}
          onSelectCommand={(item) => {
            // Cerrar el modal
            setShowSlashCommandModal(false);
            
            // Ejecutar el comando después de un pequeño delay
            setTimeout(() => {
              if (!editor || !editor.state || !editor.state.selection) return;
              const { from, to } = editor.state.selection;
              const range = { from, to };
              
              if (item.command) {
                item.command({ editor, range });
              }
            }, 50);
          }}
        />
      )}

      {/* Modal de Historial de Versiones */}
      <VersionHistory
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        pageId={paginaSeleccionada}
        onRestore={async () => {
          // Recargar la página después de restaurar
          if (paginaSeleccionada && editor) {
            try {
              const data = await LocalStorageService.readJSONFile(`${paginaSeleccionada}.json`, 'data');
              if (data) {
                setTituloPaginaActual(data.titulo || '');
                setPageTags(data.tags || []);
                
                // Cargar contenido procesado
                const contenidoProcesado = await procesarContenidoParaEditor(data.contenido);
                editor.commands.setContent(contenidoProcesado);
                ultimoContenidoRef.current = JSON.stringify(contenidoProcesado);
                ultimoContenidoGuardadoRef.current = JSON.stringify(data.contenido);
                setHayCambiosSinGuardar(false);
              }
            } catch (error) {
              console.error('Error recargando página:', error);
            }
          }
        }}
      />

      {/* Modal de selección */}
      {selectorAbierto && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" 
          onClick={() => setSelectorAbierto(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden transition-colors" 
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
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Editor */}
        {paginaSeleccionada ? (
          <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra de herramientas compacta */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-1 flex gap-1.5 items-center transition-colors">
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
              onClick={() => setShowExportModal(true)}
              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-xs"
              title="Exportar página"
            >
              <Download className="w-3 h-3" />
              Exportar
            </button>
            <button
              onClick={() => setShowCommentPanel(true)}
              className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center gap-1 text-xs"
              title="Comentarios"
            >
              <MessageSquare className="w-3 h-3" />
              Comentarios
            </button>
            <button
              onClick={() => setShowVersionHistory(true)}
              className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1 text-xs"
              title="Historial de versiones"
            >
              <Clock className="w-3 h-3" />
              Versiones
            </button>
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1 text-xs"
              title="Guardar como plantilla"
            >
              <Save className="w-3 h-3" />
              Plantilla
            </button>
            <button
              onClick={() => setShowSQLFileManager(true)}
              className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 text-xs"
              title="Gestor de Scripts SQL - Ver todos los scripts versionados"
            >
              <Database className="w-3 h-3" />
              Scripts SQL
            </button>
          </div>

          {/* Título compacto con tags */}
          <PageTagsDisplay tags={pageTags} />
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={tituloPaginaActual}
                  onChange={(e) => setTituloPaginaActual(e.target.value)}
                  onBlur={actualizarTitulo}
                  placeholder="Título de la página"
                  className="flex-1 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  onClick={() => {
                    // Guardar los tags actuales antes de abrir el modal
                    pageTagsRef.current = [...pageTags];
                    setShowTagEditor(true);
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                  title="Editar tags"
                >
                  <TagIcon className="w-4 h-4" />
                  <span>Tags</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {pageSQLScriptsCount > 0 && (
                  <button
                    onClick={() => setShowPageSQLScripts(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    title={`${pageSQLScriptsCount} script${pageSQLScriptsCount !== 1 ? 's' : ''} SQL asociado${pageSQLScriptsCount !== 1 ? 's' : ''}`}
                  >
                    <Database className="w-4 h-4" />
                    <span>{pageSQLScriptsCount} SQL</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Área de edición */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-colors relative" ref={editorContainerRef}>
            {/* Botón flotante de comandos - fijo a la izquierda, sigue el cursor verticalmente */}
            {paginaSeleccionada && editor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowSlashCommandModal(true);
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
            
            <div className="max-w-4xl mx-auto px-4 py-4">
              <EditorContent editor={editor} className="tiptap" ref={editorRef} />
            </div>
          </div>
          
          {/* Navegación rápida */}
          <QuickScrollNavigation containerRef={editorContainerRef} />
        </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
            <div className="max-w-7xl mx-auto px-6 py-12">
              {/* Hero Section */}
              <div className="text-center mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 mb-6 shadow-lg">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                  Bienvenido a tu Espacio de Trabajo
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                  Organiza tus ideas, gestiona proyectos y potencia tu productividad con herramientas poderosas y fáciles de usar
                </p>
                <button
                  onClick={() => setShowNewPageModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Crear tu primera página
                </button>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {/* Feature 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Notas y Documentación
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Crea páginas ricas con títulos, listas, tablas y más. Perfecto para documentar ideas, reuniones y proyectos.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                    <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Tablas Dinámicas
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Gestiona datos complejos con tablas estilo Notion. Organiza proyectos, inventarios, contactos y más.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Comandos Rápidos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Inserta elementos con un clic: títulos, listas, tablas, código, imágenes y más. Todo al alcance de tu mano.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Calendarios y Eventos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Visualiza fechas importantes y eventos en calendarios interactivos. Nunca pierdas una fecha clave.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                    <ImageIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Galerías de Imágenes
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Organiza y visualiza tus imágenes en galerías elegantes. Perfecto para portfolios, catálogos y más.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <FolderOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Organización Total
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Organiza tus páginas en carpetas, usa tags, favoritos y búsqueda avanzada. Todo bajo control.
                  </p>
                </div>
              </div>

              {/* Use Cases Section */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  Casos de Uso Reales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Use Case 1 */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      Gestión de Proyectos
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                      Crea páginas para cada proyecto con tablas de tareas, seguimiento de progreso, notas de reuniones y documentación técnica.
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>✓ Tablas para tareas y asignaciones</li>
                      <li>✓ Documentación de requisitos</li>
                      <li>✓ Seguimiento de hitos y fechas</li>
                    </ul>
                  </div>

                  {/* Use Case 2 */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-2xl">📚</span>
                      Notas de Estudio
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                      Organiza tus apuntes, resúmenes y materiales de estudio. Usa bloques de código para ejemplos y fórmulas.
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>✓ Apuntes estructurados por tema</li>
                      <li>✓ Bloques de código para ejemplos</li>
                      <li>✓ Tablas para comparaciones</li>
                    </ul>
                  </div>

                  {/* Use Case 3 */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-2xl">💼</span>
                      Planificación Personal
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                      Gestiona tus metas, hábitos y planes personales. Usa calendarios para eventos y tablas para seguimiento.
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>✓ Calendarios para eventos importantes</li>
                      <li>✓ Listas de tareas y hábitos</li>
                      <li>✓ Seguimiento de objetivos</li>
                    </ul>
                  </div>

                  {/* Use Case 4 */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Brainstorming e Ideas
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
                      Captura ideas rápidamente, organiza conceptos y desarrolla proyectos creativos con total libertad.
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>✓ Captura rápida de ideas</li>
                      <li>✓ Organización con tags</li>
                      <li>✓ Desarrollo de conceptos</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Ejemplos Visuales */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                  Ejemplos Visuales
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  Descubre cómo puedes usar nuestras herramientas con estos ejemplos reales
                </p>
                <WelcomeExamples />
              </div>

              {/* Quick Start */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white text-center shadow-xl">
                <h2 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h2>
                <p className="text-lg mb-6 opacity-90">
                  Crea tu primera página y descubre todas las posibilidades que tienes a tu alcance
                </p>
                <button
                  onClick={() => setShowNewPageModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Crear nueva página
                </button>
              </div>

              {/* Favoritas Section (si hay favoritas) */}
              {(() => {
                const paginasFavoritas = paginas.filter(p => favoritos.includes(p.id));
                if (paginasFavoritas.length > 0) {
                  return (
                    <div className="mt-16">
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Tus Páginas Favoritas
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginasFavoritas.map((pagina) => (
                          <div
                            key={pagina.id}
                            onClick={() => seleccionarPagina(pagina.id)}
                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                                {pagina.titulo || 'Sin título'}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                                title="Quitar de favoritos"
                              >
                                <svg 
                                  className="w-5 h-5 text-yellow-500 fill-current" 
                                  fill="currentColor" 
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </button>
                            </div>
                            {pagina.actualizadoEn && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Actualizado: {new Date(pagina.actualizadoEn).toLocaleDateString('es-ES', {
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
                }
                return null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmación de recarga */}
      {showReloadConfirmModal && (
        <div 
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[50000] flex items-center justify-center p-4"
          onClick={handleCancelReload}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">¿Recargar la página?</h3>
              </div>
              <button
                onClick={handleCancelReload}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                Tienes cambios sin guardar. Si recargas la página, es posible que estos cambios se pierdan.
              </p>
              
              {/* Footer */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelReload}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recargar de todas formas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        onCreate={(titulo, emoji, tags, templateContent) => {
          if (crearPaginaRef.current) {
            crearPaginaRef.current(titulo, emoji, paginaPadreParaNueva, tags, templateContent);
          }
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

      {/* Modal de Tags */}
      <Modal
        isOpen={showTagEditor}
        onClose={() => setShowTagEditor(false)}
        title="Editar Tags"
      >
        <TagSelector
          selectedTags={pageTags}
          onChange={(newTags) => {
            setPageTags(newTags);
          }}
          allowCreate={true}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              // Restaurar tags originales al cancelar
              setPageTags([...pageTagsRef.current]);
              setShowTagEditor(false);
            }}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              await handleSaveTags(pageTags);
              setShowTagEditor(false);
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Guardar
          </button>
        </div>
      </Modal>

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
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">Se eliminará permanentemente:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-yellow-700 dark:text-yellow-300">
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

      {/* Selector de Emojis Global */}
      {showEmojiPicker && !document.querySelector('[data-drawer="table-drawer-modal"]') && (
        <div
          ref={emojiPickerRef}
          className="fixed z-50"
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
            onClose={() => {
              setShowEmojiPicker(false);
              setEmojiPickerToggleId(null);
              setEmojiPickerCurrentEmoji('');
            }}
            currentEmoji={emojiPickerCurrentEmoji}
          />
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

      {/* Botón de guardar flotante - Ajustado según estado del sidebar */}
      {paginaSeleccionada && (
        <div 
          className={`fixed bottom-4 z-50 transition-all duration-300 ${
            sidebarColapsado ? 'left-20' : 'left-80'
          }`}
        >
          <button
            onClick={async () => {
              if (!editor || guardando || autoguardandoRef.current || !hayCambiosSinGuardar) return;
              
              const json = editor.getJSON();
              setGuardando(true);
              try {
                const guardado = await guardarContenido(json, true);
                if (guardado) {
                  setToast({
                    message: 'Cambios guardados',
                    type: 'success'
                  });
                }
              } catch (error) {
                setToast({
                  message: 'Error al guardar',
                  type: 'error'
                });
              } finally {
                setGuardando(false);
              }
            }}
            disabled={guardando || autoguardandoRef.current || !hayCambiosSinGuardar}
            className={`
              px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium transition-all
              ${guardando || autoguardandoRef.current
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : hayCambiosSinGuardar
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
                : 'bg-green-500 text-white cursor-default'
              }
            `}
            title={
              guardando || autoguardandoRef.current
                ? 'Guardando...'
                : hayCambiosSinGuardar
                ? 'Guardar cambios (Ctrl+S)'
                : 'Todo guardado'
            }
          >
            {guardando || autoguardandoRef.current ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : hayCambiosSinGuardar ? (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardado</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Indicador de guardando (mantener para compatibilidad) */}
      {guardando && (
        <div className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Guardando...</span>
        </div>
      )}

      {/* Visual Code Fullscreen Modals - Múltiples instancias independientes */}
      {visualCodeFullscreenModals.map((modalData) => (
        <VisualCodeFullscreenModal
          key={modalData.id}
          isOpen={true}
          isMinimized={modalData.isMinimized}
          zIndex={modalData.zIndex}
          onMinimize={() => {
            setVisualCodeFullscreenModals(prev =>
              prev.map(m =>
                m.id === modalData.id
                  ? { ...m, isMinimized: true }
                  : m
              )
            );
          }}
          onRestore={() => {
            setVisualCodeFullscreenModals(prev =>
              prev.map(m =>
                m.id === modalData.id
                  ? { ...m, isMinimized: false, zIndex: Math.max(...prev.map(m => m.zIndex || 70000), 70000) + 1 }
                  : m
              )
            );
          }}
          onFocus={() => {
            setVisualCodeFullscreenModals(prev =>
              prev.map(m =>
                m.id === modalData.id
                  ? { ...m, zIndex: Math.max(...prev.map(m => m.zIndex || 70000), 70000) + 1 }
                  : m
              )
            );
          }}
          onClose={() => {
            setVisualCodeFullscreenModals(prev => prev.filter(m => m.id !== modalData.id));
          }}
          projectPath={modalData.projectPath}
          projectTitle={modalData.projectTitle}
          projectColor={modalData.projectColor}
          theme={modalData.theme}
          fontSize={modalData.fontSize}
          extensions={modalData.extensions}
          onUpdateProject={(updates) => {
            setVisualCodeFullscreenModals(prev =>
              prev.map(m =>
                m.id === modalData.id
                  ? { ...m, ...updates }
                  : m
              )
            );
          }}
        />
      ))}

      {/* Barra de tareas para proyectos Visual Code (abiertos y minimizados) */}
      {visualCodeFullscreenModals.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[60000] bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl overflow-hidden">
          {/* Header de la barra de tareas */}
          <div className="px-3 py-2 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#4ec9b0]" />
              <span className="text-[#cccccc] text-[12px] font-medium">
                Visual Code ({visualCodeFullscreenModals.length})
              </span>
            </div>
            {visualCodeFullscreenModals.filter(m => m.isMinimized).length > 0 && (
              <span className="text-[#858585] text-[10px]">
                {visualCodeFullscreenModals.filter(m => m.isMinimized).length} minimizado(s)
              </span>
            )}
          </div>
          
          {/* Lista de proyectos */}
          <div className="max-h-[400px] overflow-y-auto">
            {visualCodeFullscreenModals.map((modalData) => {
              const projectName = modalData.projectTitle || modalData.projectPath.split(/[/\\]/).pop() || 'Proyecto';
              const isMinimized = modalData.isMinimized;
              const isActive = !isMinimized && modalData.zIndex === Math.max(...visualCodeFullscreenModals.map(m => m.zIndex || 70000));
              
              return (
                <div
                  key={modalData.id}
                  className={`px-3 py-2 flex items-center gap-2 group border-b border-[#2d2d30] last:border-b-0 transition-colors ${
                    isActive 
                      ? 'bg-[#094771] hover:bg-[#0a5a8a]' 
                      : isMinimized
                      ? 'bg-[#2d2d30] hover:bg-[#37373d]'
                      : 'bg-[#1e1e1e] hover:bg-[#2d2d30]'
                  }`}
                >
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#4ec9b0]' : 'text-[#858585]'}`} />
                  <button
                    onClick={() => {
                      if (isMinimized) {
                        setVisualCodeFullscreenModals(prev =>
                          prev.map(m =>
                            m.id === modalData.id
                              ? { ...m, isMinimized: false, zIndex: Math.max(...prev.map(m => m.zIndex || 70000), 70000) + 1 }
                              : m
                          )
                        );
                      } else {
                        // Si ya está abierto, traerlo al frente
                        setVisualCodeFullscreenModals(prev =>
                          prev.map(m =>
                            m.id === modalData.id
                              ? { ...m, zIndex: Math.max(...prev.map(m => m.zIndex || 70000), 70000) + 1 }
                              : m
                          )
                        );
                      }
                    }}
                    className="flex-1 text-left min-w-0"
                    title={isMinimized ? `Restaurar: ${projectName}` : `Enfocar: ${projectName}`}
                  >
                    <span className={`truncate block text-sm ${isActive ? 'text-white font-medium' : 'text-[#cccccc]'}`}>
                      {projectName}
                    </span>
                    {isMinimized && (
                      <span className="text-[10px] text-[#858585]">Minimizado</span>
                    )}
                  </button>
                  <div className="flex items-center gap-1">
                    {!isMinimized && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVisualCodeFullscreenModals(prev =>
                            prev.map(m =>
                              m.id === modalData.id
                                ? { ...m, isMinimized: true }
                                : m
                            )
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3e3e42] rounded transition-opacity"
                        title="Minimizar"
                      >
                        <Minimize2 className="w-3.5 h-3.5 text-[#858585] hover:text-[#cccccc]" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVisualCodeFullscreenModals(prev => prev.filter(m => m.id !== modalData.id));
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3e3e42] rounded transition-opacity"
                      title="Cerrar proyecto"
                    >
                      <X className="w-3.5 h-3.5 text-[#858585] hover:text-[#f48771]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

