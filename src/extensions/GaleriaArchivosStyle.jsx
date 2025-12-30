import { useState, useEffect, useRef } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import LocalStorageService from '../services/LocalStorageService';
import { X, Download, Trash2, Plus, Search, File, Edit2, Save, FileText, FileImage, FileVideo, FileAudio, Archive, FileSpreadsheet } from 'lucide-react';
import GroupSelector from '../components/GroupSelector';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

// Función para obtener icono según tipo de archivo
const obtenerIconoPorTipo = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Imágenes
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return { icon: FileImage, color: 'text-blue-600' };
  }
  // Videos
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return { icon: FileVideo, color: 'text-purple-600' };
  }
  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(extension)) {
    return { icon: FileAudio, color: 'text-green-600' };
  }
  // Archivos comprimidos
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return { icon: Archive, color: 'text-orange-600' };
  }
  // Excel
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return { icon: FileSpreadsheet, color: 'text-green-700' };
  }
  // PDF y documentos de texto
  if (['pdf', 'txt', 'doc', 'docx'].includes(extension)) {
    return { icon: FileText, color: 'text-red-600' };
  }
  // Por defecto
  return { icon: File, color: 'text-gray-600' };
};

// Función para verificar si es imagen o video (para mostrar preview)
const esMedia = (filename, tipo) => {
  // Primero verificar el tipo MIME si está disponible
  if (tipo) {
    if (tipo.startsWith('image/')) return { esImagen: true, esVideo: false };
    if (tipo.startsWith('video/')) return { esImagen: false, esVideo: true };
  }
  
  // Fallback: verificar por extensión
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const imagenes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videos = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp'];
  
  return {
    esImagen: imagenes.includes(extension),
    esVideo: videos.includes(extension)
  };
};

export default function GaleriaArchivosStyle({ node, updateAttributes }) {
  const [archivos, setArchivos] = useState(() => node.attrs.archivos || []);
  const [archivosCargados, setArchivosCargados] = useState({}); // { id: url }
  const [archivoAmpliado, setArchivoAmpliado] = useState(null);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [edicionTemp, setEdicionTemp] = useState({});
  const [mostrarConfirmEliminar, setMostrarConfirmEliminar] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const fileInputRef = useRef(null);

  // Obtener grupos únicos para el filtro
  const grupos = [...new Set(archivos.map(archivo => archivo.grupo).filter(Boolean))].sort();

  // Sincronizar con node.attrs
  useEffect(() => {
    if (node.attrs.archivos) {
      setArchivos(node.attrs.archivos);
    }
  }, [node.attrs.archivos]);

  // Actualizar node.attrs cuando cambian los archivos
  useEffect(() => {
    updateAttributes({ archivos });
  }, [archivos, updateAttributes]);

  // Cargar URLs de los archivos
  useEffect(() => {
    const cargarArchivos = async () => {
      const urls = {};
      for (const archivo of archivos) {
        if (archivo.filename && !urls[archivo.id]) {
          try {
            const url = await LocalStorageService.getFileURL(archivo.filename, 'files');
            if (url) {
              urls[archivo.id] = url;
            }
          } catch (error) {
            console.error(`Error cargando archivo ${archivo.id}:`, error);
          }
        }
      }
      setArchivosCargados(prev => ({ ...prev, ...urls }));
    };
    cargarArchivos();
  }, [archivos]);

  // Filtrar archivos
  const archivosFiltrados = archivos.filter(archivo => {
    const coincideGrupo = !filtroGrupo || archivo.grupo === filtroGrupo;
    const coincideBusqueda = !busqueda || 
      archivo.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      archivo.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      archivo.grupo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      archivo.filename?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideGrupo && coincideBusqueda;
  });

  // Subir archivos
  const handleSubirArchivos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevosArchivos = [];
    
    for (const file of files) {
      try {
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
        await LocalStorageService.saveBinaryFile(filename, file, 'files');
        
        const nuevoArchivo = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename,
          nombre: file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
          grupo: '',
          fecha: new Date().toISOString(),
          descripcion: '',
          tipo: file.type || '', // Guardar MIME type para identificación más precisa
          tamaño: file.size || 0
        };
        
        nuevosArchivos.push(nuevoArchivo);
      } catch (error) {
        console.error('Error subiendo archivo:', error);
        alert(`Error al subir ${file.name}`);
      }
    }

    if (nuevosArchivos.length > 0) {
      setArchivos(prev => [...prev, ...nuevosArchivos]);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Iniciar proceso de eliminación
  const handleEliminar = (id) => {
    setIdAEliminar(id);
    setMostrarConfirmEliminar(true);
  };

  // Confirmar eliminación
  const confirmarEliminacion = async () => {
    if (!idAEliminar) return;

    const archivo = archivos.find(arch => arch.id === idAEliminar);
    if (!archivo) return;

    try {
      // Eliminar archivo del storage
      if (archivo.filename) {
        await LocalStorageService.deleteBinaryFile(archivo.filename, 'files');
      }
      
      // Eliminar de la lista
      setArchivos(prev => prev.filter(arch => arch.id !== idAEliminar));
      setArchivosCargados(prev => {
        const nuevo = { ...prev };
        delete nuevo[idAEliminar];
        return nuevo;
      });

      // Si estaba ampliado, cerrar
      if (archivoAmpliado?.id === idAEliminar) {
        setArchivoAmpliado(null);
      }
      setIdAEliminar(null);
    } catch (error) {
      console.error('Error eliminando archivo:', error);
      alert('Error al eliminar el archivo');
    }
  };

  // Descargar archivo
  const handleDescargar = async (id) => {
    const archivo = archivos.find(arch => arch.id === id);
    if (!archivo || !archivosCargados[id]) return;

    try {
      const url = archivosCargados[id];
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = archivo.filename || `archivo-${id}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo');
    }
  };

  // Formatear tamaño de archivo
  const formatearTamaño = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Iniciar edición
  const iniciarEdicion = (archivo) => {
    setEditandoId(archivo.id);
    setEdicionTemp({
      nombre: archivo.nombre || '',
      grupo: archivo.grupo || '',
      descripcion: archivo.descripcion || ''
    });
  };

  // Guardar edición
  const guardarEdicion = () => {
    if (!editandoId) return;

    setArchivos(prev => prev.map(arch => 
      arch.id === editandoId 
        ? { ...arch, ...edicionTemp }
        : arch
    ));
    
    // Guardar el grupo en localStorage para futuras sugerencias
    if (edicionTemp.grupo && edicionTemp.grupo.trim()) {
      try {
        const grupos = JSON.parse(localStorage.getItem('notion-archivos-grupos') || '[]');
        const grupoNormalizado = edicionTemp.grupo.trim().toLowerCase();
        const existe = grupos.some(g => g.trim().toLowerCase() === grupoNormalizado);
        if (!existe) {
          grupos.unshift(edicionTemp.grupo.trim());
          const gruposLimitados = grupos.slice(0, 50);
          localStorage.setItem('notion-archivos-grupos', JSON.stringify(gruposLimitados));
        }
      } catch (error) {
        console.error('Error guardando grupo:', error);
      }
    }
    
    setEditandoId(null);
    setEdicionTemp({});
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditandoId(null);
    setEdicionTemp({});
  };

  // Formatear fecha
  const formatearFecha = (fechaISO) => {
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return fechaISO;
    }
  };

  return (
    <NodeViewWrapper className="galeria-archivos-wrapper my-6">
      <div className="border rounded-lg p-4 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📁 Galería de Archivos</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Archivos
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleSubirArchivos}
          className="hidden"
        />

        {/* Filtros y búsqueda */}
        {(grupos.length > 0 || archivos.length > 0) && (
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, grupo o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            {grupos.length > 0 && (
              <select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="">Todos los grupos</option>
                {grupos.map(grupo => (
                  <option key={grupo} value={grupo}>{grupo}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Grid de archivos */}
        {archivosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {archivos.length === 0 
              ? "No hay archivos. Haz clic en 'Agregar Archivos' para comenzar."
              : "No se encontraron archivos con los filtros aplicados."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {archivosFiltrados.map((archivo) => {
              const { icon: IconComponent, color } = obtenerIconoPorTipo(archivo.filename);
              const mediaInfo = esMedia(archivo.filename, archivo.tipo);
              const esMediaArchivo = mediaInfo.esImagen || mediaInfo.esVideo;
              const url = archivosCargados[archivo.id];
              
              return (
                <div
                  key={archivo.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-gray-50"
                >
                  {/* Preview o Icono */}
                  <div 
                    className={`relative ${esMediaArchivo ? 'aspect-square bg-gray-100 cursor-pointer group' : 'h-32 bg-gray-100 flex items-center justify-center group'}`}
                    onClick={() => esMediaArchivo && setArchivoAmpliado(archivo)}
                  >
                    {esMediaArchivo && url ? (
                      <>
                        {mediaInfo.esVideo ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            controls={false}
                          />
                        ) : mediaInfo.esImagen ? (
                          <img
                            src={url}
                            alt={archivo.nombre || 'Archivo'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <IconComponent className={`w-12 h-12 ${color}`} />
                        )}
                      </>
                    ) : esMediaArchivo && !url ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <IconComponent className={`w-8 h-8 ${color} mx-auto mb-2`} />
                          <div className="text-xs">Cargando...</div>
                        </div>
                      </div>
                    ) : (
                      <IconComponent className={`w-12 h-12 ${color}`} />
                    )}
                    
                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {esMediaArchivo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setArchivoAmpliado(archivo);
                          }}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Ver"
                        >
                          <File className="w-4 h-4 text-gray-800" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDescargar(archivo.id);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4 text-gray-800" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminar(archivo.id);
                        }}
                        className="p-2 bg-white rounded-full hover:bg-red-100 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Información */}
                  <div className="p-3">
                    {editandoId === archivo.id ? (
                      // Modo edición
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={edicionTemp.nombre}
                          onChange={(e) => setEdicionTemp(prev => ({ ...prev, nombre: e.target.value }))}
                          placeholder="Nombre"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          autoFocus
                        />
                        <GroupSelector
                          value={edicionTemp.grupo || ''}
                          onChange={(grupo) => setEdicionTemp(prev => ({ ...prev, grupo }))}
                          placeholder="Grupo (selecciona o crea uno nuevo)"
                          tipo="archivos"
                        />
                        <textarea
                          value={edicionTemp.descripcion}
                          onChange={(e) => setEdicionTemp(prev => ({ ...prev, descripcion: e.target.value }))}
                          placeholder="Descripción (opcional)"
                          rows="2"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={guardarEdicion}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Guardar
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Modo visualización
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-sm text-gray-800 truncate flex-1">
                            {archivo.nombre || 'Sin nombre'}
                          </h4>
                          <button
                            onClick={() => iniciarEdicion(archivo)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors ml-1"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                          {archivo.filename.split('.').pop()?.toUpperCase()} • {formatearTamaño(archivo.tamaño)}
                        </div>
                        {archivo.grupo && (
                          <div className="text-xs text-blue-600 mb-1">
                            📁 {archivo.grupo}
                          </div>
                        )}
                        {archivo.descripcion && (
                          <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                            {archivo.descripcion}
                          </p>
                        )}
                        <div className="text-xs text-gray-400">
                          📅 {formatearFecha(archivo.fecha)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {archivosFiltrados.length > 0 && (
          <div className="text-right text-sm text-gray-600 mt-4">
            Mostrando {archivosFiltrados.length} de {archivos.length} archivos
          </div>
        )}
      </div>

      {/* Modal de archivo ampliado (solo para imágenes y videos) */}
      {archivoAmpliado && (esMedia(archivoAmpliado.filename, archivoAmpliado.tipo).esImagen || esMedia(archivoAmpliado.filename, archivoAmpliado.tipo).esVideo) && archivosCargados[archivoAmpliado.id] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setArchivoAmpliado(null)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setArchivoAmpliado(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
            {esMedia(archivoAmpliado.filename, archivoAmpliado.tipo).esVideo ? (
              <video
                src={archivosCargados[archivoAmpliado.id]}
                controls
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : esMedia(archivoAmpliado.filename, archivoAmpliado.tipo).esImagen ? (
              <img
                src={archivosCargados[archivoAmpliado.id]}
                alt={archivoAmpliado.nombre || 'Archivo'}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : null}
            {/* Información en el modal */}
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-800">{archivoAmpliado.nombre}</h4>
              {archivoAmpliado.grupo && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mt-1">
                  {archivoAmpliado.grupo}
                </span>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Guardado el: {formatearFecha(archivoAmpliado.fecha)} • {formatearTamaño(archivoAmpliado.tamaño)}
              </p>
              {archivoAmpliado.descripcion && (
                <p className="text-sm text-gray-700 mt-2">{archivoAmpliado.descripcion}</p>
              )}
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    iniciarEdicion(archivoAmpliado);
                    setArchivoAmpliado(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDescargar(archivoAmpliado.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEliminar(archivoAmpliado.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        isOpen={mostrarConfirmEliminar}
        onClose={() => {
          setMostrarConfirmEliminar(false);
          setIdAEliminar(null);
        }}
        onConfirm={confirmarEliminacion}
        title="¿Eliminar archivo?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este archivo?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </NodeViewWrapper>
  );
}

