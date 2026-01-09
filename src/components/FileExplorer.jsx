import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  X,
  Loader2
} from 'lucide-react';

const STORAGE_KEY = 'console-file-explorer-state';

export default function FileExplorer({ 
  isOpen, 
  onClose, 
  projectPath, 
  onFileSelect,
  onProjectPathChange,
  onProjectHandleChange // Nuevo callback para pasar el handle del proyecto
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
      loadFilesRecursive(projectPath);
    }
  }, [isOpen, projectPath]);

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

  const handleFileClick = async (filePath, isFolder) => {
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
  };

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
  }, [fileTree, expandedFolders, selectedFile, loadingFolders, projectPath, handleFileClick]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Explorador
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Botón para seleccionar carpeta */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={selectProjectFolder}
          className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Folder className="w-4 h-4" />
          {projectPath ? 'Cambiar Carpeta' : 'Abrir Carpeta'}
        </button>
        {projectPath && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate" title={projectPath}>
            {projectPath}
          </p>
        )}
      </div>

      {/* Lista de archivos */}
      <div className="flex-1 overflow-y-auto">
        {loading && !projectPath ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : projectPath && fileTree[projectPath] ? (
          <div className="py-1">
            {renderFileTree(projectPath)}
          </div>
        ) : projectPath ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No se encontraron archivos
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Selecciona una carpeta para explorar
          </div>
        )}
      </div>
    </div>
  );
}

