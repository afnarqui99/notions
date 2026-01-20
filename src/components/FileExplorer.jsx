import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  X,
  Loader2,
  Plus,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  MoreVertical,
  GitCompare,
  Copy,
  Clipboard,
  Eye
} from 'lucide-react';

const STORAGE_KEY = 'console-file-explorer-state';

export default function FileExplorer({ 
  isOpen, 
  onClose, 
  projectPath, 
  onFileSelect,
  onProjectPathChange,
  onProjectHandleChange, // Nuevo callback para pasar el handle del proyecto
  directoryHandle = null, // Handle del directorio para proyectos del navegador
  hideHeader = false, // Opción para ocultar el header cuando se usa dentro de otro componente
  vscodeStyle = false, // Estilo VS Code/Cursor con colores oscuros
  openFiles = [], // Lista de archivos abiertos para resaltarlos en amarillo
  onCompareFile = null, // Callback para comparar archivos (opcional)
  fileToCompare = null, // Archivo seleccionado para comparar (opcional)
  onSetFileToCompare = null, // Callback para establecer archivo a comparar (opcional)
  onPreviewMarkdown = null // Callback para previsualizar archivos markdown (opcional)
}) {
  const [fileTree, setFileTree] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-expanded`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null); // { x, y, item, parentPath }
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [renameItem, setRenameItem] = useState(null);
  const [createParentPath, setCreateParentPath] = useState(null);
  const [copiedFile, setCopiedFile] = useState(null); // Archivo copiado para pegar
  const contextMenuRef = useRef(null);

  // Cargar ruta guardada al abrir
  useEffect(() => {
    if (isOpen) {
      const savedPath = localStorage.getItem(`${STORAGE_KEY}-path`);
      if (savedPath && !projectPath) {
        onProjectPathChange(savedPath);
      }
    }
  }, [isOpen]);

  // Cargar estructura de archivos
  useEffect(() => {
    if (isOpen && projectPath) {
      // Guardar ruta en localStorage
      localStorage.setItem(`${STORAGE_KEY}-path`, projectPath);
      
      // Primero intentar usar el directoryHandle pasado como prop
      if (directoryHandle) {
        console.log('[FileExplorer] Usando directoryHandle pasado como prop para:', projectPath);
        loadFilesFromBrowserHandle(directoryHandle, projectPath);
        return;
      }
      
      // Si hay un handle del navegador disponible, usarlo
      if (typeof window !== 'undefined' && window.directoryHandles) {
        // Buscar el handle por el projectPath (que puede ser el nombre del directorio)
        const handle = Array.from(window.directoryHandles.values()).find(
          h => h.name === projectPath || projectPath.includes(h.name)
        );
        if (handle) {
          console.log('[FileExplorer] Usando handle del navegador para:', projectPath);
          loadFilesFromBrowserHandle(handle, projectPath);
          return;
        }
      }
      
      loadFilesRecursive(projectPath);
    }
  }, [isOpen, projectPath, directoryHandle]);

  // Guardar estado de expansión
  useEffect(() => {
    if (expandedFolders.size > 0) {
      localStorage.setItem(`${STORAGE_KEY}-expanded`, JSON.stringify(Array.from(expandedFolders)));
    }
  }, [expandedFolders]);

  const loadFilesRecursive = async (rootPath, parentPath = null) => {
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.listDirectory) {
        // Electron: usar API de Electron
        const result = await window.electronAPI.listDirectory(rootPath);
        if (result.error) {
          console.error('Error cargando directorio:', result.error);
          return;
        }

        const items = (result.files || []).map(item => ({
          ...item,
          children: item.type === 'folder' ? {} : null,
          loaded: false
        }));

        setFileTree(prev => {
          const newTree = { ...prev };
          const key = parentPath || rootPath;
          newTree[key] = items;
          return newTree;
        });

        // Expandir la carpeta raíz por defecto
        if (!parentPath) {
          setExpandedFolders(prev => new Set([...prev, rootPath]));
        }
      } else {
        // Navegador: buscar en el fileTree si ya tenemos un handle guardado
        // Si no está disponible, el usuario necesita seleccionar la carpeta primero
        console.warn('Para usar el explorador en el navegador, primero selecciona una carpeta usando el botón "Abrir Carpeta"');
      }
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = async (folderPath) => {
    const newExpanded = new Set(expandedFolders);
    const isExpanded = newExpanded.has(folderPath);

    if (isExpanded) {
      // Colapsar
      newExpanded.delete(folderPath);
    } else {
      // Expandir
      newExpanded.add(folderPath);
      
      // Cargar contenido de la carpeta si no está cargado
      const folderData = fileTree[folderPath];
      if (!folderData || folderData.length === 0 || !folderData[0]?.loaded) {
        setLoadingFolders(prev => new Set([...prev, folderPath]));
        try {
          if (window.electronAPI && window.electronAPI.listDirectory) {
            // Electron: usar API de Electron
            const result = await window.electronAPI.listDirectory(folderPath);
            if (result.files) {
              const items = (result.files || []).map(item => ({
                ...item,
                children: item.type === 'folder' ? {} : null,
                loaded: false
              }));

              setFileTree(prev => {
                const newTree = { ...prev };
                newTree[folderPath] = items;
                return newTree;
              });
            }
          } else {
            // Navegador: buscar el handle en el fileTree
            // Buscar el item en todas las carpetas del árbol
            const findItemInTree = (tree, targetPath) => {
              for (const [key, items] of Object.entries(tree)) {
                const found = items.find(item => item.path === targetPath);
                if (found) return found;
              }
              return null;
            };
            
            const folderItem = findItemInTree(fileTree, folderPath);
            if (folderItem?.handle && folderItem.handle.kind === 'directory') {
              // Cargar desde el DirectoryHandle del navegador
              await loadFilesFromBrowserHandle(folderItem.handle, folderPath);
            }
          }
        } catch (error) {
          console.error('Error al cargar carpeta:', error);
        } finally {
          setLoadingFolders(prev => {
            const newSet = new Set(prev);
            newSet.delete(folderPath);
            return newSet;
          });
        }
      }
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = useCallback(async (filePath, isFolder) => {
    if (isFolder) {
      toggleFolder(filePath);
    } else {
      setSelectedFile(filePath);
      // Leer contenido del archivo
      try {
        if (window.electronAPI && window.electronAPI.readFile) {
          // Electron: usar API de Electron
          const result = await window.electronAPI.readFile(filePath);
          if (result.content !== undefined) {
            onFileSelect(filePath, result.content);
          } else if (result.error) {
            console.error('Error leyendo archivo:', result.error);
          }
        } else {
          // Navegador: buscar el handle en el fileTree
          const fileItem = Object.values(fileTree).flat().find(item => item.path === filePath);
          if (fileItem?.handle && fileItem.handle.kind === 'file') {
            try {
              const file = await fileItem.handle.getFile();
              const content = await file.text();
              onFileSelect(filePath, content);
            } catch (error) {
              console.error('Error leyendo archivo desde handle:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error al leer archivo:', error);
      }
    }
  }, [fileTree, onFileSelect, toggleFolder]);

  const selectProjectFolder = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        // Electron: usar diálogo nativo
        const selectedPath = await window.electronAPI.selectDirectory();
        if (selectedPath) {
          onProjectPathChange(selectedPath);
          // loadFilesRecursive se ejecutará automáticamente en el useEffect
        }
      } else if ('showDirectoryPicker' in window) {
        // Navegador: usar File System Access API
        try {
          const handle = await window.showDirectoryPicker({
            mode: 'read' // Solo lectura para explorar archivos
          });
          
          // Guardar el handle para uso futuro
          const folderName = handle.name;
          const folderPath = folderName; // En navegador, usamos el nombre como identificador
          
          // Establecer el handle y cargar archivos
          onProjectPathChange(folderPath);
          
          // Pasar el handle al padre para uso futuro
          if (onProjectHandleChange) {
            onProjectHandleChange(handle);
          }
          
          // Cargar archivos usando el handle del navegador
          await loadFilesFromBrowserHandle(handle, folderPath);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error seleccionando carpeta:', error);
            alert('Error al seleccionar carpeta: ' + error.message);
          }
        }
      } else {
        // Navegador sin soporte para File System Access API
        alert('Tu navegador no soporta la selección de carpetas.\n\n' +
          'Funciones disponibles:\n' +
          '• Chrome/Edge: Funciona con File System Access API\n' +
          '• Firefox/Safari: Usa la versión Electron de la aplicación\n\n' +
          'Para usar todas las funciones, ejecuta: npm run electron:dev');
      }
    } catch (error) {
      console.error('Error seleccionando carpeta:', error);
      alert('Error al seleccionar carpeta: ' + error.message);
    }
  };

  // Cargar archivos desde un DirectoryHandle del navegador
  const loadFilesFromBrowserHandle = async (dirHandle, basePath) => {
    try {
      const items = [];
      
      for await (const [name, handle] of dirHandle.entries()) {
        // Ignorar archivos y carpetas ocultas y node_modules
        if (name.startsWith('.') || name === 'node_modules') {
          continue;
        }
        
        const item = {
          name: name,
          path: `${basePath}/${name}`,
          type: handle.kind === 'directory' ? 'folder' : 'file',
          handle: handle // Guardar el handle para acceso futuro
        };
        
        items.push(item);
      }
      
      // Convertir a formato compatible con el resto del código
      const formattedItems = items.map(item => ({
        ...item,
        children: item.type === 'folder' ? {} : null,
        loaded: false
      }));
      
      setFileTree(prev => {
        const newTree = { ...prev };
        newTree[basePath] = formattedItems;
        return newTree;
      });
      
      // Expandir la carpeta raíz por defecto
      if (!expandedFolders.has(basePath)) {
        setExpandedFolders(prev => new Set([...prev, basePath]));
      }
    } catch (error) {
      console.error('Error cargando archivos desde handle:', error);
    }
  };

  // Función para manejar clic derecho (menú contextual)
  const handleContextMenu = useCallback((e, item, parentPath) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item: item,
      parentPath: parentPath || projectPath
    });
  }, [projectPath]);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Crear nuevo archivo
  const handleCreateFile = async () => {
    if (!newItemName.trim()) {
      alert('Por favor ingresa un nombre para el archivo');
      return;
    }
    
    try {
      const parentPath = createParentPath || projectPath;
      const newFilePath = await pathJoin(parentPath, newItemName);
      
      if (window.electronAPI && window.electronAPI.createFile) {
        const result = await window.electronAPI.createFile(newFilePath, '');
        if (result.success) {
          // Recargar el árbol de archivos
          await loadFilesRecursive(parentPath, parentPath === projectPath ? null : parentPath);
          // Expandir la carpeta padre
          setExpandedFolders(prev => new Set([...prev, parentPath]));
          setShowCreateFileModal(false);
          setNewItemName('');
          setCreateParentPath(null);
          // Abrir el archivo recién creado
          if (onFileSelect) {
            onFileSelect(newFilePath, '');
          }
        } else {
          alert('Error al crear archivo: ' + result.error);
        }
      } else {
        alert('La funcionalidad de crear archivos solo está disponible en Electron');
      }
    } catch (error) {
      console.error('Error creando archivo:', error);
      alert('Error al crear archivo: ' + error.message);
    }
  };

  // Crear nueva carpeta
  const handleCreateFolder = async () => {
    if (!newItemName.trim()) {
      alert('Por favor ingresa un nombre para la carpeta');
      return;
    }
    
    try {
      const parentPath = createParentPath || projectPath;
      const newFolderPath = await pathJoin(parentPath, newItemName);
      
      if (window.electronAPI && window.electronAPI.createDirectory) {
        const result = await window.electronAPI.createDirectory(newFolderPath);
        if (result.success) {
          // Recargar el árbol de archivos
          await loadFilesRecursive(parentPath, parentPath === projectPath ? null : parentPath);
          // Expandir la carpeta padre y la nueva carpeta
          setExpandedFolders(prev => new Set([...prev, parentPath, newFolderPath]));
          setShowCreateFolderModal(false);
          setNewItemName('');
          setCreateParentPath(null);
        } else {
          alert('Error al crear carpeta: ' + result.error);
        }
      } else {
        alert('La funcionalidad de crear carpetas solo está disponible en Electron');
      }
    } catch (error) {
      console.error('Error creando carpeta:', error);
      alert('Error al crear carpeta: ' + error.message);
    }
  };

  // Renombrar archivo o carpeta
  const handleRename = async () => {
    if (!newItemName.trim() || !renameItem) {
      alert('Por favor ingresa un nuevo nombre');
      return;
    }
    
    if (newItemName === renameItem.name) {
      setShowRenameModal(false);
      setRenameItem(null);
      setNewItemName('');
      return;
    }
    
    try {
      const oldPath = renameItem.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/')) || oldPath.substring(0, oldPath.lastIndexOf('\\')) || projectPath;
      const newPath = await pathJoin(parentPath, newItemName);
      
      if (window.electronAPI && window.electronAPI.renameFile) {
        const result = await window.electronAPI.renameFile(oldPath, newPath);
        if (result.success) {
          // Recargar el árbol de archivos
          const reloadPath = renameItem.type === 'folder' ? parentPath : parentPath;
          await loadFilesRecursive(reloadPath === projectPath ? projectPath : reloadPath, reloadPath === projectPath ? null : reloadPath);
          setShowRenameModal(false);
          setRenameItem(null);
          setNewItemName('');
        } else {
          alert('Error al renombrar: ' + result.error);
        }
      } else {
        alert('La funcionalidad de renombrar solo está disponible en Electron');
      }
    } catch (error) {
      console.error('Error renombrando:', error);
      alert('Error al renombrar: ' + error.message);
    }
  };

  // Eliminar archivo o carpeta
  const handleDelete = async (item) => {
    if (!item) return;
    
    const itemType = item.type === 'folder' ? 'carpeta' : 'archivo';
    const confirmMessage = `¿Estás seguro de que quieres eliminar ${itemType === 'carpeta' ? 'la carpeta' : 'el archivo'} "${item.name}"?\n\n${itemType === 'carpeta' ? 'Esto eliminará todos los archivos dentro de la carpeta.' : 'Esta acción no se puede deshacer.'}`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      if (window.electronAPI && window.electronAPI.deleteFile) {
        const result = await window.electronAPI.deleteFile(item.path);
        if (result.success) {
          // Recargar el árbol de archivos
          const parentPath = item.path.substring(0, item.path.lastIndexOf('/')) || item.path.substring(0, item.path.lastIndexOf('\\'));
          const reloadPath = parentPath || projectPath;
          await loadFilesRecursive(reloadPath === projectPath ? projectPath : reloadPath, reloadPath === projectPath ? null : reloadPath);
          setContextMenu(null);
        } else {
          alert('Error al eliminar: ' + result.error);
        }
      } else {
        alert('La funcionalidad de eliminar solo está disponible en Electron');
      }
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar: ' + error.message);
    }
  };

  // Copiar archivo o carpeta
  const handleCopy = async (item) => {
    if (!item) return;
    setCopiedFile(item);
    setContextMenu(null);
    // Guardar en localStorage para persistir entre sesiones
    localStorage.setItem(`${STORAGE_KEY}-copied`, JSON.stringify(item));
  };

  // Pegar archivo o carpeta
  const handlePaste = async (targetPath) => {
    if (!copiedFile) {
      // Intentar cargar desde localStorage
      try {
        const saved = localStorage.getItem(`${STORAGE_KEY}-copied`);
        if (saved) {
          const item = JSON.parse(saved);
          setCopiedFile(item);
          await performPaste(item, targetPath);
        } else {
          alert('No hay ningún archivo copiado');
        }
      } catch (error) {
        alert('No hay ningún archivo copiado');
      }
      return;
    }
    await performPaste(copiedFile, targetPath);
  };

  const performPaste = async (item, targetPath) => {
    try {
      if (window.electronAPI && window.electronAPI.copyFile) {
        // Electron: usar API de Electron
        const targetItemPath = await pathJoin(targetPath, item.name);
        const result = await window.electronAPI.copyFile(item.path, targetItemPath);
        if (result.success) {
          // Recargar el árbol de archivos
          await loadFilesRecursive(targetPath === projectPath ? projectPath : targetPath, targetPath === projectPath ? null : targetPath);
          setContextMenu(null);
          // Limpiar el archivo copiado después de pegar
          setCopiedFile(null);
          localStorage.removeItem(`${STORAGE_KEY}-copied`);
        } else {
          alert('Error al pegar: ' + result.error);
        }
      } else {
        // Navegador: usar File System Access API
        // Buscar el handle del archivo/carpeta copiado en el fileTree
        const findItemInTree = (tree, targetPath) => {
          for (const [key, items] of Object.entries(tree)) {
            const found = items.find(item => item.path === targetPath);
            if (found) return found;
          }
          return null;
        };
        
        const sourceItem = findItemInTree(fileTree, item.path);
        if (!sourceItem || !sourceItem.handle) {
          alert('No se pudo encontrar el archivo copiado. Por favor, copia el archivo nuevamente.');
          return;
        }

        // Buscar el handle del directorio destino
        const targetItem = findItemInTree(fileTree, targetPath);
        let targetDirHandle = null;
        
        if (targetItem && targetItem.handle && targetItem.handle.kind === 'directory') {
          targetDirHandle = targetItem.handle;
        } else if (targetPath === projectPath) {
          // Si el destino es la raíz del proyecto, buscar el directoryHandle principal
          if (directoryHandle) {
            targetDirHandle = directoryHandle;
          } else if (typeof window !== 'undefined' && window.directoryHandles) {
            const handle = Array.from(window.directoryHandles.values()).find(
              h => h.name === projectPath || projectPath.includes(h.name)
            );
            if (handle) {
              targetDirHandle = handle;
            }
          }
        }

        if (!targetDirHandle) {
          alert('No se pudo encontrar el directorio destino. Por favor, asegúrate de que el directorio esté abierto.');
          return;
        }

        // Copiar archivo o carpeta
        if (item.type === 'file') {
          // Copiar archivo
          try {
            const sourceFile = await sourceItem.handle.getFile();
            const content = await sourceFile.text();
            
            // Generar nombre único si ya existe
            let newName = item.name;
            let counter = 1;
            while (await targetDirHandle.getFileHandle(newName, { create: false }).catch(() => null)) {
              const ext = item.name.split('.').pop();
              const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
              newName = `${base} (${counter})${ext ? '.' + ext : ''}`;
              counter++;
            }
            
            const newFileHandle = await targetDirHandle.getFileHandle(newName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            // Recargar el árbol de archivos
            if (targetPath === projectPath) {
              await loadFilesFromBrowserHandle(targetDirHandle, projectPath);
            } else {
              // Recargar la carpeta específica
              await loadFilesFromBrowserHandle(targetDirHandle, targetPath);
            }
            
            setContextMenu(null);
            setCopiedFile(null);
            localStorage.removeItem(`${STORAGE_KEY}-copied`);
            alert('Archivo copiado exitosamente');
          } catch (error) {
            console.error('Error copiando archivo:', error);
            alert('Error al copiar archivo: ' + error.message);
          }
        } else if (item.type === 'folder') {
          // Copiar carpeta recursivamente
          alert('La copia de carpetas en el navegador aún no está implementada. Por favor, usa la versión Electron para esta funcionalidad.');
        }
      }
    } catch (error) {
      console.error('Error pegando:', error);
      alert('Error al pegar: ' + error.message);
    }
  };

  // Cargar archivo copiado desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-copied`);
      if (saved) {
        const item = JSON.parse(saved);
        setCopiedFile(item);
      }
    } catch (error) {
      console.error('Error cargando archivo copiado:', error);
    }
  }, []);

  // Manejar Ctrl+C y Ctrl+V
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo manejar si el FileExplorer está abierto
      if (!isOpen) return;
      
      // Verificar si el foco está en el FileExplorer (no en un input o textarea)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedFile) {
        e.preventDefault();
        e.stopPropagation();
        // Buscar el archivo seleccionado en el árbol
        const findItem = (tree, path) => {
          for (const [key, items] of Object.entries(tree)) {
            for (const item of items) {
              if (item.path === path) {
                return item;
              }
              if (item.type === 'folder' && tree[item.path]) {
                const found = findItem({ [item.path]: tree[item.path] }, path);
                if (found) return found;
              }
            }
          }
          return null;
        };
        const item = findItem(fileTree, selectedFile);
        if (item) {
          handleCopy(item);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedFile) {
        e.preventDefault();
        e.stopPropagation();
        // Pegar en la carpeta actual o en la ruta del proyecto
        const targetPath = contextMenu?.parentPath || (contextMenu?.item?.type === 'folder' ? contextMenu.item.path : projectPath);
        if (targetPath) {
          handlePaste(targetPath);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isOpen, selectedFile, fileTree, contextMenu, projectPath, copiedFile]);

  // Función auxiliar para unir rutas
  const pathJoin = async (base, ...parts) => {
    if (window.electronAPI && window.electronAPI.pathJoin) {
      return await window.electronAPI.pathJoin(base, ...parts);
    }
    // Fallback manual
    const separator = base.includes('\\') ? '\\' : '/';
    return [base, ...parts].join(separator).replace(/[/\\]+/g, separator);
  };

  const renderFileTree = useCallback((parentPath, level = 0) => {
    const currentPath = parentPath || projectPath;
    const folderItems = fileTree[currentPath] || [];

    if (folderItems.length === 0) return null;

    // Ordenar: carpetas primero, luego archivos
    const sortedItems = [...folderItems].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return sortedItems.map((item) => {
      const isExpanded = expandedFolders.has(item.path);
      const isSelected = selectedFile === item.path;
      const isFolder = item.type === 'folder';
      const isLoading = loadingFolders.has(item.path);
      const isOpen = openFiles.includes(item.path);

      // Estilos VS Code/Cursor
      if (vscodeStyle) {
        const hoverBg = '#2a2d2e';
        const selectedBg = isSelected ? '#094771' : 'transparent';
        // Archivos abiertos en amarillo claro, archivos normales en blanco/gris muy claro para mejor visibilidad
        const textColor = isOpen ? '#dcdcaa' : '#d4d4d4'; // Amarillo para archivos abiertos, blanco/gris claro para normales
        const folderColor = '#4ec9b0'; // Cyan para carpetas
        const chevronColor = '#858585';
        const fileIconColor = isOpen ? '#dcdcaa' : '#d4d4d4'; // Icono de archivo con mismo color que texto
        
        return (
          <div key={item.path}>
            <div
              onClick={() => handleFileClick(item.path, isFolder)}
              onContextMenu={(e) => handleContextMenu(e, item, currentPath)}
              className="flex items-center gap-1 px-2 py-1 cursor-pointer text-sm transition-colors group"
              style={{ 
                paddingLeft: `${level * 16 + 8}px`,
                backgroundColor: isSelected ? selectedBg : 'transparent',
                color: textColor
              }}
              title={item.path} // Tooltip con la ruta completa
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = hoverBg;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {isFolder ? (
                <>
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin" style={{ color: chevronColor }} />
                  ) : isExpanded ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: chevronColor }} />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: chevronColor }} />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: folderColor }} />
                  ) : (
                    <Folder className="w-4 h-4 flex-shrink-0" style={{ color: folderColor }} />
                  )}
                </>
              ) : (
                <>
                  <div className="w-3 h-3 flex-shrink-0" /> {/* Spacer para alineación */}
                  <File className="w-4 h-4 flex-shrink-0" style={{ color: fileIconColor }} />
                </>
              )}
              <span className="truncate flex-1 select-none" style={{ color: textColor, fontWeight: isOpen ? '500' : '400' }}>
                {item.name}
              </span>
            </div>
            {isFolder && isExpanded && (
              <div>
                {renderFileTree(item.path, level + 1)}
              </div>
            )}
          </div>
        );
      }

      // Estilos por defecto (original)
      return (
        <div key={item.path}>
          <div
            onClick={() => handleFileClick(item.path, isFolder)}
            className={`
              flex items-center gap-1 px-2 py-1 cursor-pointer text-sm
              hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
              ${isSelected ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}
            `}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            title={item.path} // Tooltip con la ruta completa
          >
            {isFolder ? (
              <>
                {isLoading ? (
                  <Loader2 className="w-3 h-3 flex-shrink-0 animate-spin text-gray-400" />
                ) : isExpanded ? (
                  <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                )}
              </>
            ) : (
              <>
                <div className="w-3 h-3 flex-shrink-0" /> {/* Spacer para alineación */}
                <File className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
              </>
            )}
            <span className="truncate flex-1 select-none">{item.name}</span>
          </div>
          {isFolder && isExpanded && (
            <div>
              {renderFileTree(item.path, level + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [fileTree, expandedFolders, selectedFile, loadingFolders, projectPath, handleFileClick, vscodeStyle, openFiles]);

  if (!isOpen) return null;

  return (
    <div 
      className="flex flex-col h-full"
      style={vscodeStyle ? {
        backgroundColor: '#252526', // Fondo del sidebar de VS Code (más claro que el editor)
        color: '#d4d4d4' // Color de texto por defecto más visible
      } : {}}
    >

      {/* Botón para seleccionar carpeta */}
      <div 
        className={`px-4 py-2 ${!hideHeader ? 'border-b' : ''}`}
        style={vscodeStyle ? {
          borderColor: '#3e3e42'
        } : {}}
      >
        <button
          onClick={selectProjectFolder}
          className="w-full px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          style={vscodeStyle ? {
            backgroundColor: '#0e639c',
            color: '#ffffff'
          } : {
            backgroundColor: '#2563eb',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => {
            if (vscodeStyle) {
              e.currentTarget.style.backgroundColor = '#1177bb';
            }
          }}
          onMouseLeave={(e) => {
            if (vscodeStyle) {
              e.currentTarget.style.backgroundColor = '#0e639c';
            }
          }}
        >
          <Folder className="w-4 h-4" />
          {projectPath ? 'Cambiar Carpeta' : 'Abrir Carpeta'}
        </button>
        {projectPath && (
          <>
            <p 
              className="text-xs mt-2 truncate" 
              title={projectPath}
              style={vscodeStyle ? {
                color: '#858585'
              } : {}}
            >
              {projectPath}
            </p>
            {/* Botones de acción rápida */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setCreateParentPath(projectPath);
                  setNewItemName('');
                  setShowCreateFileModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1.5"
                style={vscodeStyle ? {
                  backgroundColor: '#2d2d30',
                  color: '#cccccc',
                  border: '1px solid #3e3e42'
                } : {
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb'
                }}
                onMouseEnter={(e) => {
                  if (vscodeStyle) {
                    e.currentTarget.style.backgroundColor = '#37373d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (vscodeStyle) {
                    e.currentTarget.style.backgroundColor = '#2d2d30';
                  }
                }}
                title="Crear nuevo archivo (o clic derecho en el explorador)"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Archivo</span>
              </button>
              <button
                onClick={() => {
                  setCreateParentPath(projectPath);
                  setNewItemName('');
                  setShowCreateFolderModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1.5"
                style={vscodeStyle ? {
                  backgroundColor: '#2d2d30',
                  color: '#cccccc',
                  border: '1px solid #3e3e42'
                } : {
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb'
                }}
                onMouseEnter={(e) => {
                  if (vscodeStyle) {
                    e.currentTarget.style.backgroundColor = '#37373d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (vscodeStyle) {
                    e.currentTarget.style.backgroundColor = '#2d2d30';
                  }
                }}
                title="Crear nueva carpeta (o clic derecho en el explorador)"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Carpeta</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Lista de archivos */}
      <div className="flex-1 overflow-y-auto">
        {loading && !projectPath ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 
              className="w-6 h-6 animate-spin" 
              style={vscodeStyle ? { color: '#858585' } : {}}
            />
          </div>
        ) : projectPath && fileTree[projectPath] && fileTree[projectPath].length > 0 ? (
          <div className="py-1">
            {renderFileTree(projectPath)}
          </div>
        ) : projectPath ? (
          <div 
            className="px-4 py-8 text-center"
            style={vscodeStyle ? { color: '#858585' } : {}}
            onContextMenu={(e) => handleContextMenu(e, null, projectPath)}
          >
            <p className="text-sm mb-4">No se encontraron archivos</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setCreateParentPath(projectPath);
                  setNewItemName('');
                  setShowCreateFileModal(true);
                }}
                className="px-3 py-1.5 text-sm rounded flex items-center gap-2"
                style={vscodeStyle ? {
                  backgroundColor: '#0e639c',
                  color: '#ffffff'
                } : {
                  backgroundColor: '#2563eb',
                  color: '#ffffff'
                }}
              >
                <FilePlus className="w-4 h-4" />
                Nuevo archivo
              </button>
              <button
                onClick={() => {
                  setCreateParentPath(projectPath);
                  setNewItemName('');
                  setShowCreateFolderModal(true);
                }}
                className="px-3 py-1.5 text-sm rounded flex items-center gap-2"
                style={vscodeStyle ? {
                  backgroundColor: '#0e639c',
                  color: '#ffffff'
                } : {
                  backgroundColor: '#2563eb',
                  color: '#ffffff'
                }}
              >
                <FolderPlus className="w-4 h-4" />
                Nueva carpeta
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="px-4 py-8 text-center text-sm"
            style={vscodeStyle ? { color: '#858585' } : {}}
          >
            Selecciona una carpeta para explorar
          </div>
        )}
      </div>

      {/* Menú contextual */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-[#252526] border border-[#3e3e42] rounded shadow-lg py-1 z-[10000] min-w-[180px]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            ...(vscodeStyle ? {
              backgroundColor: '#252526',
              borderColor: '#3e3e42'
            } : {})
          }}
        >
          {/* Opciones para carpeta o espacio vacío */}
          {(!contextMenu.item || contextMenu.item.type === 'folder') && (
            <>
              {copiedFile && (
                <>
                  <button
                    onClick={() => {
                      const targetPath = contextMenu.item ? contextMenu.item.path : (contextMenu.parentPath || projectPath);
                      handlePaste(targetPath);
                    }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                    style={vscodeStyle ? { color: '#cccccc' } : {}}
                  >
                    <Clipboard className="w-4 h-4" />
                    Pegar {copiedFile.name}
                  </button>
                  <div className="border-t border-[#3e3e42] my-1" />
                </>
              )}
              <button
                onClick={() => {
                  setCreateParentPath(contextMenu.item ? contextMenu.item.path : contextMenu.parentPath);
                  setNewItemName('');
                  setShowCreateFileModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                style={vscodeStyle ? { color: '#cccccc' } : {}}
              >
                <FilePlus className="w-4 h-4" />
                Nuevo archivo
              </button>
              <button
                onClick={() => {
                  setCreateParentPath(contextMenu.item ? contextMenu.item.path : contextMenu.parentPath);
                  setNewItemName('');
                  setShowCreateFolderModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                style={vscodeStyle ? { color: '#cccccc' } : {}}
              >
                <FolderPlus className="w-4 h-4" />
                Nueva carpeta
              </button>
            </>
          )}
          
          {/* Opciones para archivo o carpeta seleccionada */}
          {contextMenu.item && (
            <>
              <div className="border-t border-[#3e3e42] my-1" />
              {onCompareFile && contextMenu.item.type === 'file' && (
                <>
                  {fileToCompare ? (
                    <button
                      onClick={() => {
                        if (onCompareFile && contextMenu.item) {
                          onCompareFile(fileToCompare, contextMenu.item.path);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                      style={vscodeStyle ? { color: '#cccccc' } : {}}
                    >
                      <GitCompare className="w-4 h-4" />
                      Comparar con {fileToCompare.split(/[/\\]/).pop()}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (onSetFileToCompare && contextMenu.item) {
                          onSetFileToCompare(contextMenu.item.path);
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                      style={vscodeStyle ? { color: '#cccccc' } : {}}
                    >
                      <GitCompare className="w-4 h-4" />
                      Comparar
                    </button>
                  )}
                  <div className="border-t border-[#3e3e42] my-1" />
                </>
              )}
              {/* Opción de previsualizar para archivos .md */}
              {onPreviewMarkdown && contextMenu.item && contextMenu.item.type === 'file' && (() => {
                const fileName = contextMenu.item.name || '';
                const fileExt = fileName.split('.').pop()?.toLowerCase();
                const isMarkdown = fileExt && ['md', 'markdown'].includes(fileExt);
                console.log('[FileExplorer] Verificando previsualización:', { 
                  fileName, 
                  fileExt, 
                  isMarkdown, 
                  hasOnPreviewMarkdown: !!onPreviewMarkdown,
                  itemPath: contextMenu.item.path 
                });
                return isMarkdown ? (
                  <>
                    <button
                      onClick={async () => {
                        console.log('[FileExplorer] Click en Previsualizar:', contextMenu.item);
                        if (onPreviewMarkdown && contextMenu.item) {
                          // Cargar el contenido del archivo si no está disponible
                          let content = null;
                          try {
                            if (window.electronAPI && window.electronAPI.readFile) {
                              // Electron: usar API de Electron
                              console.log('[FileExplorer] Leyendo archivo con Electron API:', contextMenu.item.path);
                              const result = await window.electronAPI.readFile(contextMenu.item.path);
                              content = result.content !== undefined ? result.content : result;
                              console.log('[FileExplorer] Contenido cargado (Electron):', content ? `${content.length} caracteres` : 'vacío');
                            } else {
                              console.log('[FileExplorer] Leyendo archivo con File System API');
                              // Navegador: buscar el handle en el fileTree recursivamente
                              const findItemInTree = (tree, targetPath) => {
                                for (const [key, items] of Object.entries(tree)) {
                                  for (const item of items) {
                                    if (item.path === targetPath) {
                                      return item;
                                    }
                                    // Si es una carpeta, buscar recursivamente (aunque para archivos no debería ser necesario)
                                    if (item.type === 'folder' && tree[item.path]) {
                                      const found = findItemInTree({ [item.path]: tree[item.path] }, targetPath);
                                      if (found) return found;
                                    }
                                  }
                                }
                                return null;
                              };
                              
                              const fileItem = findItemInTree(fileTree, contextMenu.item.path);
                              if (fileItem?.handle && fileItem.handle.kind === 'file') {
                                const file = await fileItem.handle.getFile();
                                content = await file.text();
                              } else {
                                console.error('No se encontró el handle del archivo en el fileTree:', contextMenu.item.path);
                                alert('No se pudo cargar el archivo. Asegúrate de que el archivo esté disponible.');
                                setContextMenu(null);
                                return;
                              }
                            }
                            if (content !== null && content !== undefined) {
                              onPreviewMarkdown(contextMenu.item.path, content);
                            } else {
                              alert('No se pudo cargar el contenido del archivo.');
                            }
                          } catch (error) {
                            console.error('Error cargando archivo para previsualizar:', error);
                            alert('Error al cargar el archivo: ' + error.message);
                          }
                        }
                        setContextMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                      style={vscodeStyle ? { color: '#cccccc' } : {}}
                    >
                      <Eye className="w-4 h-4" />
                      Previsualizar
                    </button>
                    <div className="border-t border-[#3e3e42] my-1" />
                  </>
                ) : null;
              })()}
              <button
                onClick={() => {
                  handleCopy(contextMenu.item);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                style={vscodeStyle ? { color: '#cccccc' } : {}}
              >
                <Copy className="w-4 h-4" />
                Copiar
              </button>
              {copiedFile && (
                <button
                  onClick={() => {
                    const targetPath = contextMenu.parentPath || projectPath;
                    handlePaste(targetPath);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                  style={vscodeStyle ? { color: '#cccccc' } : {}}
                >
                  <Clipboard className="w-4 h-4" />
                  Pegar {copiedFile.name}
                </button>
              )}
              <div className="border-t border-[#3e3e42] my-1" />
              <button
                onClick={() => {
                  setRenameItem(contextMenu.item);
                  setNewItemName(contextMenu.item.name);
                  setShowRenameModal(true);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors"
                style={vscodeStyle ? { color: '#cccccc' } : {}}
              >
                <Edit2 className="w-4 h-4" />
                Renombrar
              </button>
              <button
                onClick={() => {
                  handleDelete(contextMenu.item);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#2a2d2e] flex items-center gap-2 transition-colors text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </>
          )}
        </div>
      )}

      {/* Modal para crear archivo */}
      {showCreateFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div 
            className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg p-4 min-w-[400px]"
            style={vscodeStyle ? {
              backgroundColor: '#1e1e1e',
              borderColor: '#3e3e42'
            } : {}}
          >
            <h3 className="text-lg font-semibold mb-4" style={vscodeStyle ? { color: '#cccccc' } : {}}>
              Nuevo archivo
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setShowCreateFileModal(false);
                  setNewItemName('');
                }
              }}
              placeholder="nombre-del-archivo.js"
              className="w-full px-3 py-2 mb-4 rounded border"
              style={vscodeStyle ? {
                backgroundColor: '#252526',
                borderColor: '#3e3e42',
                color: '#cccccc'
              } : {}}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateFileModal(false);
                  setNewItemName('');
                }}
                className="px-4 py-2 rounded text-sm"
                style={vscodeStyle ? {
                  backgroundColor: '#3e3e42',
                  color: '#cccccc'
                } : {}}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 rounded text-sm text-white"
                style={vscodeStyle ? {
                  backgroundColor: '#0e639c'
                } : {
                  backgroundColor: '#2563eb'
                }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear carpeta */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div 
            className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg p-4 min-w-[400px]"
            style={vscodeStyle ? {
              backgroundColor: '#1e1e1e',
              borderColor: '#3e3e42'
            } : {}}
          >
            <h3 className="text-lg font-semibold mb-4" style={vscodeStyle ? { color: '#cccccc' } : {}}>
              Nueva carpeta
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setShowCreateFolderModal(false);
                  setNewItemName('');
                }
              }}
              placeholder="nombre-de-la-carpeta"
              className="w-full px-3 py-2 mb-4 rounded border"
              style={vscodeStyle ? {
                backgroundColor: '#252526',
                borderColor: '#3e3e42',
                color: '#cccccc'
              } : {}}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateFolderModal(false);
                  setNewItemName('');
                }}
                className="px-4 py-2 rounded text-sm"
                style={vscodeStyle ? {
                  backgroundColor: '#3e3e42',
                  color: '#cccccc'
                } : {}}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 rounded text-sm text-white"
                style={vscodeStyle ? {
                  backgroundColor: '#0e639c'
                } : {
                  backgroundColor: '#2563eb'
                }}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para renombrar */}
      {showRenameModal && renameItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div 
            className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg p-4 min-w-[400px]"
            style={vscodeStyle ? {
              backgroundColor: '#1e1e1e',
              borderColor: '#3e3e42'
            } : {}}
          >
            <h3 className="text-lg font-semibold mb-4" style={vscodeStyle ? { color: '#cccccc' } : {}}>
              Renombrar {renameItem.type === 'folder' ? 'carpeta' : 'archivo'}
            </h3>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRename();
                } else if (e.key === 'Escape') {
                  setShowRenameModal(false);
                  setRenameItem(null);
                  setNewItemName('');
                }
              }}
              className="w-full px-3 py-2 mb-4 rounded border"
              style={vscodeStyle ? {
                backgroundColor: '#252526',
                borderColor: '#3e3e42',
                color: '#cccccc'
              } : {}}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setRenameItem(null);
                  setNewItemName('');
                }}
                className="px-4 py-2 rounded text-sm"
                style={vscodeStyle ? {
                  backgroundColor: '#3e3e42',
                  color: '#cccccc'
                } : {}}
              >
                Cancelar
              </button>
              <button
                onClick={handleRename}
                className="px-4 py-2 rounded text-sm text-white"
                style={vscodeStyle ? {
                  backgroundColor: '#0e639c'
                } : {
                  backgroundColor: '#2563eb'
                }}
              >
                Renombrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

