import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import LocalStorageService from '../services/LocalStorageService';
import Modal from './Modal';

export default function ImportPagesModal({ isOpen, onClose, onImportComplete }) {
  const [importing, setImporting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // Generar UUID
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'pagina-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  };

  // Manejar selección de archivos
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files).filter(f => f.name.endsWith('.json'));
    setSelectedFiles(files);
    setStatus({ type: '', message: '' });
  };

  // Procesar y actualizar parentId en contenido (por si hay referencias)
  const actualizarParentIdEnContenido = (contenido, idMapping) => {
    if (!contenido || typeof contenido !== 'object') {
      return contenido;
    }
    
    if (Array.isArray(contenido)) {
      return contenido.map(item => actualizarParentIdEnContenido(item, idMapping));
    }
    
    if (contenido.parentId && idMapping.has(contenido.parentId)) {
      contenido.parentId = idMapping.get(contenido.parentId);
    }
    
    for (const key in contenido) {
      if (contenido[key] && typeof contenido[key] === 'object') {
        contenido[key] = actualizarParentIdEnContenido(contenido[key], idMapping);
      }
    }
    
    return contenido;
  };

  // Importar páginas
  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      setStatus({ type: 'error', message: 'Por favor selecciona al menos un archivo JSON' });
      return;
    }

    setImporting(true);
    setStatus({ type: 'info', message: 'Importando páginas...' });

    try {
      // Leer todos los archivos y generar UUIDs
      const paginas = [];
      const idMapping = new Map();

      for (const file of selectedFiles) {
        try {
          const text = await file.text();
          const pagina = JSON.parse(text);
          const idAntiguo = file.name.replace('.json', '');
          pagina.idAntiguo = idAntiguo;
          const nuevoId = generateUUID();
          idMapping.set(idAntiguo, nuevoId);
          pagina.nuevoId = nuevoId;
          paginas.push(pagina);
        } catch (error) {
          console.error(`Error leyendo ${file.name}:`, error);
          setStatus({ type: 'error', message: `Error leyendo ${file.name}: ${error.message}` });
          setImporting(false);
          return;
        }
      }

      // Ordenar páginas: primero las que no tienen parentId
      const paginasOrdenadas = [];
      const procesadas = new Set();
      const parentIdsNuevos = new Set(); // Para rastrear qué parentIds existen

      // Primera pasada: páginas sin parentId
      for (const pagina of paginas) {
        if (!pagina.parentId || pagina.parentId === null) {
          paginasOrdenadas.push(pagina);
          procesadas.add(pagina.idAntiguo);
          parentIdsNuevos.add(pagina.nuevoId); // Agregar a la lista de IDs disponibles
        }
      }

      // Segunda pasada: páginas con parentId que ya fue procesado
      let cambios = true;
      let intentos = 0;
      const maxIntentos = paginas.length * 2; // Evitar loops infinitos
      
      while (cambios && intentos < maxIntentos) {
        cambios = false;
        intentos++;
        
        for (const pagina of paginas) {
          if (!procesadas.has(pagina.idAntiguo)) {
            const parentIdAntiguo = pagina.parentId;
            // Verificar si el parentId existe en el mapeo Y ya fue procesado
            if (!parentIdAntiguo) {
              // Sin parentId, agregar directamente
              paginasOrdenadas.push(pagina);
              procesadas.add(pagina.idAntiguo);
              parentIdsNuevos.add(pagina.nuevoId);
              cambios = true;
            } else if (idMapping.has(parentIdAntiguo) && procesadas.has(parentIdAntiguo)) {
              // El parentId existe y ya fue procesado
              paginasOrdenadas.push(pagina);
              procesadas.add(pagina.idAntiguo);
              parentIdsNuevos.add(pagina.nuevoId);
              cambios = true;
            } else if (!idMapping.has(parentIdAntiguo)) {
              // El parentId no existe en el mapeo (página padre no está en los archivos)
              // Importar como página raíz (parentId = null)
              console.warn(`ParentId "${parentIdAntiguo}" no encontrado para "${pagina.titulo}". Se importará como página raíz.`);
              paginasOrdenadas.push(pagina);
              procesadas.add(pagina.idAntiguo);
              parentIdsNuevos.add(pagina.nuevoId);
              cambios = true;
            }
          }
        }
      }

      // Agregar páginas que no se pudieron procesar (por si acaso)
      for (const pagina of paginas) {
        if (!procesadas.has(pagina.idAntiguo)) {
          console.warn(`Página "${pagina.titulo}" no pudo ser ordenada. Se importará como página raíz.`);
          paginasOrdenadas.push(pagina);
          procesadas.add(pagina.idAntiguo);
        }
      }

      // Importar cada página
      let importadas = 0;
      let errores = 0;
      const erroresDetalle = [];

      for (const pagina of paginasOrdenadas) {
        try {
          // Actualizar parentId
          let nuevoParentId = null;
          if (pagina.parentId && idMapping.has(pagina.parentId)) {
            nuevoParentId = idMapping.get(pagina.parentId);
          } else if (pagina.parentId) {
            // Si el parentId no existe en el mapeo, importar como página raíz
            console.warn(`ParentId "${pagina.parentId}" no encontrado para "${pagina.titulo}". Se importará como página raíz.`);
            nuevoParentId = null;
          }

          // Actualizar contenido si tiene referencias
          let contenidoFinal = pagina.contenido;
          if (contenidoFinal) {
            contenidoFinal = actualizarParentIdEnContenido(JSON.parse(JSON.stringify(contenidoFinal)), idMapping);
          }

          // Crear objeto final
          const paginaFinal = {
            titulo: pagina.titulo || 'Sin título',
            emoji: pagina.emoji || null,
            contenido: contenidoFinal || { type: 'doc', content: [{ type: 'paragraph' }] },
            tags: pagina.tags || [],
            parentId: nuevoParentId,
            creadoEn: pagina.creadoEn || new Date().toISOString(),
            actualizadoEn: pagina.actualizadoEn || new Date().toISOString()
          };

          // Guardar archivo
          await LocalStorageService.saveJSONFile(
            `${pagina.nuevoId}.json`,
            paginaFinal,
            'data'
          );

          importadas++;
        } catch (error) {
          console.error(`Error importando ${pagina.titulo}:`, error);
          errores++;
          erroresDetalle.push(`${pagina.titulo}: ${error.message}`);
        }
      }

      let mensaje = `✅ Importación completada: ${importadas} páginas importadas`;
      if (errores > 0) {
        mensaje += `, ${errores} errores`;
        if (erroresDetalle.length > 0) {
          mensaje += `\n\nErrores:\n${erroresDetalle.slice(0, 3).join('\n')}`;
          if (erroresDetalle.length > 3) {
            mensaje += `\n... y ${erroresDetalle.length - 3} más`;
          }
        }
      }
      
      setStatus({
        type: errores > 0 ? 'error' : 'success',
        message: mensaje
      });

      // Limpiar selección
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Disparar evento para recargar páginas
      window.dispatchEvent(new Event('paginasReordenadas'));

      // Notificar al componente padre
      if (onImportComplete) {
        setTimeout(() => {
          onImportComplete();
          onClose();
        }, 2000);
      } else {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Error en importación:', error);
      setStatus({ type: 'error', message: `Error: ${error.message}` });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setSelectedFiles([]);
      setStatus({ type: '', message: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Páginas JSON"
      type="info"
    >
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Instrucciones:</strong>
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
            <li>Selecciona uno o más archivos JSON de páginas</li>
            <li>Se generarán UUIDs únicos automáticamente</li>
            <li>Las relaciones parentId se mantendrán correctamente</li>
            <li>Los archivos se guardarán en la carpeta <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">data/</code></li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar archivos JSON
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            multiple
            onChange={handleFileSelect}
            disabled={importing}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              file:cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivos seleccionados ({selectedFiles.length}):
            </p>
            <div className="space-y-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status.message && (
          <div className={`p-3 rounded-lg flex items-start gap-2 ${
            status.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : status.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}>
            {status.type === 'success' && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            {status.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            {status.type === 'info' && <Loader className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />}
            <p className="text-sm flex-1">{status.message}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={importing}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={selectedFiles.length === 0 || importing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importar Páginas
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

