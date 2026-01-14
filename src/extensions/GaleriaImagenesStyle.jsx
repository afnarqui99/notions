import { useState, useEffect, useRef } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import LocalStorageService from '../services/LocalStorageService';
import { X, Download, Trash2, Plus, Search, Maximize2, Edit2, Save } from 'lucide-react';
import GroupSelector from '../components/GroupSelector';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import BlockWithDeleteButton from '../components/BlockWithDeleteButton';

export default function GaleriaImagenesStyle({ node, updateAttributes, editor, getPos }) {
  const [imagenes, setImagenes] = useState(() => node.attrs.imagenes || []);
  const [imagenesCargadas, setImagenesCargadas] = useState({}); // { id: url }
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [edicionTemp, setEdicionTemp] = useState({});
  const [mostrarConfirmEliminar, setMostrarConfirmEliminar] = useState(false);
  const [idAEliminar, setIdAEliminar] = useState(null);
  const fileInputRef = useRef(null);

  // Obtener grupos únicos para el filtro
  const grupos = [...new Set(imagenes.map(img => img.grupo).filter(Boolean))].sort();

  // Sincronizar con node.attrs
  useEffect(() => {
    if (node.attrs.imagenes) {
      setImagenes(node.attrs.imagenes);
    }
  }, [node.attrs.imagenes]);

  // Actualizar node.attrs cuando cambian las imágenes
  useEffect(() => {
    updateAttributes({ imagenes });
  }, [imagenes, updateAttributes]);

  // Cargar URLs de las imágenes
  useEffect(() => {
    const cargarImagenes = async () => {
      const urls = {};
      for (const imagen of imagenes) {
        if (imagen.filename && !urls[imagen.id]) {
          try {
            const url = await LocalStorageService.getFileURL(imagen.filename, 'files');
            if (url) {
              urls[imagen.id] = url;
            }
          } catch (error) {
            console.error(`Error cargando imagen ${imagen.id}:`, error);
          }
        }
      }
      setImagenesCargadas(prev => ({ ...prev, ...urls }));
    };
    cargarImagenes();
  }, [imagenes]);

  // Filtrar imágenes
  const imagenesFiltradas = imagenes.filter(img => {
    const coincideGrupo = !filtroGrupo || img.grupo === filtroGrupo;
    const coincideBusqueda = !busqueda || 
      img.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      img.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      img.grupo?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideGrupo && coincideBusqueda;
  });

  // Subir imágenes
  const handleSubirImagenes = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevasImagenes = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
        await LocalStorageService.saveBinaryFile(filename, file, 'files');
        
        const nuevaImagen = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename,
          nombre: file.name.replace(/\.[^/.]+$/, ''), // Nombre sin extensión
          grupo: '',
          fecha: new Date().toISOString(),
          descripcion: ''
        };
        
        nuevasImagenes.push(nuevaImagen);
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        alert(`Error al subir ${file.name}`);
      }
    }

    if (nuevasImagenes.length > 0) {
      setImagenes(prev => [...prev, ...nuevasImagenes]);
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

    const imagen = imagenes.find(img => img.id === idAEliminar);
    if (!imagen) return;

    try {
      // Eliminar archivo del storage
      if (imagen.filename) {
        await LocalStorageService.deleteBinaryFile(imagen.filename, 'files');
      }
      
      // Eliminar de la lista
      setImagenes(prev => prev.filter(img => img.id !== idAEliminar));
      setImagenesCargadas(prev => {
        const nuevo = { ...prev };
        delete nuevo[idAEliminar];
        return nuevo;
      });

      // Si estaba ampliada, cerrar
      if (imagenAmpliada?.id === idAEliminar) {
        setImagenAmpliada(null);
      }
      setIdAEliminar(null);
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  // Descargar imagen
  const handleDescargar = async (id) => {
    const imagen = imagenes.find(img => img.id === id);
    if (!imagen || !imagenesCargadas[id]) return;

    try {
      const url = imagenesCargadas[id];
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = imagen.filename || `imagen-${id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando imagen:', error);
      alert('Error al descargar la imagen');
    }
  };

  // Iniciar edición
  const iniciarEdicion = (imagen) => {
    setEditandoId(imagen.id);
    setEdicionTemp({
      nombre: imagen.nombre || '',
      grupo: imagen.grupo || '',
      descripcion: imagen.descripcion || ''
    });
  };

  // Guardar edición
  const guardarEdicion = () => {
    if (!editandoId) return;

    setImagenes(prev => prev.map(img => 
      img.id === editandoId 
        ? { ...img, ...edicionTemp }
        : img
    ));
    
    // Guardar el grupo en localStorage para futuras sugerencias
    if (edicionTemp.grupo && edicionTemp.grupo.trim()) {
      try {
        const grupos = JSON.parse(localStorage.getItem('notion-imagenes-grupos') || '[]');
        const grupoNormalizado = edicionTemp.grupo.trim().toLowerCase();
        const existe = grupos.some(g => g.trim().toLowerCase() === grupoNormalizado);
        if (!existe) {
          grupos.unshift(edicionTemp.grupo.trim());
          const gruposLimitados = grupos.slice(0, 50);
          localStorage.setItem('notion-imagenes-grupos', JSON.stringify(gruposLimitados));
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
    <NodeViewWrapper className="galeria-imagenes-wrapper my-6">
      <BlockWithDeleteButton editor={editor} getPos={getPos} node={node}>
      <div className="border rounded-lg p-4 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">🖼️ Galería de Imágenes</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Imágenes
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleSubirImagenes}
          className="hidden"
        />

        {/* Filtros y búsqueda */}
        {(grupos.length > 0 || imagenes.length > 0) && (
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

        {/* Grid de imágenes */}
        {imagenesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {imagenes.length === 0 
              ? "No hay imágenes. Haz clic en 'Agregar Imágenes' para comenzar."
              : "No se encontraron imágenes con los filtros aplicados."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagenesFiltradas.map((imagen) => (
              <div
                key={imagen.id}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-gray-50"
              >
                {/* Imagen */}
                <div 
                  className="relative aspect-square bg-gray-100 cursor-pointer group"
                  onClick={() => setImagenAmpliada(imagen)}
                >
                  {imagenesCargadas[imagen.id] ? (
                    <img
                      src={imagenesCargadas[imagen.id]}
                      alt={imagen.nombre || 'Imagen'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Cargando...
                    </div>
                  )}
                  {/* Overlay con acciones */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagenAmpliada(imagen);
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Ampliar"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-800" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDescargar(imagen.id);
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4 text-gray-800" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminar(imagen.id);
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
                  {editandoId === imagen.id ? (
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
                          {imagen.nombre || 'Sin nombre'}
                        </h4>
                        <button
                          onClick={() => iniciarEdicion(imagen)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors ml-1"
                          title="Editar"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      {imagen.grupo && (
                        <div className="text-xs text-blue-600 mb-1">
                          📁 {imagen.grupo}
                        </div>
                      )}
                      {imagen.descripcion && (
                        <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                          {imagen.descripcion}
                        </p>
                      )}
                      <div className="text-xs text-gray-400">
                        📅 {formatearFecha(imagen.fecha)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contador */}
        {imagenes.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Mostrando {imagenesFiltradas.length} de {imagenes.length} imagen{imagenes.length !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {/* Modal de imagen ampliada */}
      {imagenAmpliada && imagenesCargadas[imagenAmpliada.id] && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
            <img
              src={imagenesCargadas[imagenAmpliada.id]}
              alt={imagenAmpliada.nombre || 'Imagen'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            {/* Información en el modal */}
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-1">{imagenAmpliada.nombre || 'Sin nombre'}</h3>
              {imagenAmpliada.grupo && (
                <div className="text-sm text-blue-600 mb-1">📁 {imagenAmpliada.grupo}</div>
              )}
              {imagenAmpliada.descripcion && (
                <p className="text-sm text-gray-700 mb-1">{imagenAmpliada.descripcion}</p>
              )}
              <div className="text-xs text-gray-500">📅 {formatearFecha(imagenAmpliada.fecha)}</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleDescargar(imagenAmpliada.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={() => {
                    iniciarEdicion(imagenAmpliada);
                    setImagenAmpliada(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    handleEliminar(imagenAmpliada.id);
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
        title="¿Eliminar imagen?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta imagen?"
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
      </BlockWithDeleteButton>
    </NodeViewWrapper>
  );
}

