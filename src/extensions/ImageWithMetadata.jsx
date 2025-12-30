import { useState, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import LocalStorageService from '../services/LocalStorageService';
import { Edit2, X, Calendar, FileText, Tag } from 'lucide-react';
import ImageMetadataModal from '../components/ImageMetadataModal';

export default function ImageWithMetadata({ node, updateAttributes }) {
  const [imagenUrl, setImagenUrl] = useState(null);
  const [mostrarMetadata, setMostrarMetadata] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [esNuevaImagen, setEsNuevaImagen] = useState(false);

  const filename = node.attrs['data-filename'];
  const nombre = node.attrs['data-nombre'] || node.attrs.alt || '';
  const descripcion = node.attrs['data-descripcion'] || '';
  const grupo = node.attrs['data-grupo'] || '';
  const fecha = node.attrs['data-fecha'] || '';

  // Si la imagen es nueva (sin nombre), abrir el modal automáticamente
  useEffect(() => {
    if (filename && !nombre && !esNuevaImagen) {
      setEsNuevaImagen(true);
      // Pequeño delay para que la imagen se cargue primero
      setTimeout(() => {
        setMostrarModal(true);
      }, 300);
    }
  }, [filename, nombre, esNuevaImagen]);

  // Cargar imagen
  useEffect(() => {
    const cargarImagen = async () => {
      if (filename) {
        try {
          const url = await LocalStorageService.getFileURL(filename, 'files');
          if (url) {
            setImagenUrl(url);
          }
        } catch (error) {
          console.error('Error cargando imagen:', error);
        }
      } else if (node.attrs.src) {
        // Si no hay filename pero hay src, usar directamente
        setImagenUrl(node.attrs.src);
      }
    };
    cargarImagen();
  }, [filename, node.attrs.src]);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
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

  const handleGuardarMetadata = (metadata) => {
    updateAttributes({
      'data-nombre': metadata.nombre,
      'data-descripcion': metadata.descripcion,
      'data-grupo': metadata.grupo,
      'data-fecha': metadata.fecha,
      alt: metadata.nombre, // También actualizar alt
      title: metadata.descripcion || metadata.nombre, // Y title
    });
    
    // Guardar el grupo en localStorage para futuras sugerencias
    if (metadata.grupo && metadata.grupo.trim()) {
      try {
        const grupos = JSON.parse(localStorage.getItem('notion-imagenes-grupos') || '[]');
        const grupoNormalizado = metadata.grupo.trim().toLowerCase();
        const existe = grupos.some(g => g.trim().toLowerCase() === grupoNormalizado);
        if (!existe) {
          grupos.unshift(metadata.grupo.trim());
          const gruposLimitados = grupos.slice(0, 50);
          localStorage.setItem('notion-imagenes-grupos', JSON.stringify(gruposLimitados));
        }
      } catch (error) {
        console.error('Error guardando grupo:', error);
      }
    }
  };

  if (!imagenUrl) {
    return (
      <NodeViewWrapper className="image-with-metadata-wrapper my-4">
        <div className="border rounded-lg p-4 bg-gray-50 text-center text-gray-500">
          Cargando imagen...
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="image-with-metadata-wrapper my-4" contentEditable={false}>
      <div 
        className="relative border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow"
        onMouseEnter={() => setMostrarMetadata(true)}
        onMouseLeave={() => setMostrarMetadata(false)}
      >
        {/* Imagen */}
        <div className="relative">
          <img
            src={imagenUrl}
            alt={nombre}
            title={descripcion || nombre}
            className="w-full h-auto max-w-full"
          />
          
          {/* Botón de editar */}
          <button
            onClick={() => setMostrarModal(true)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            style={{ opacity: mostrarMetadata ? 1 : 0 }}
            title="Editar información"
          >
            <Edit2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Panel de metadata (se muestra al hover o si hay información) */}
        {(mostrarMetadata || nombre || descripcion || grupo || fecha) && (
          <div 
            className="bg-white border-t p-3 text-sm transition-all"
            style={{ display: mostrarMetadata || nombre || descripcion || grupo || fecha ? 'block' : 'none' }}
          >
            {nombre && (
              <div className="font-semibold text-gray-800 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {nombre}
              </div>
            )}
            {grupo && (
              <div className="text-blue-600 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {grupo}
              </div>
            )}
            {descripcion && (
              <p className="text-gray-600 mb-1 text-xs line-clamp-2">
                {descripcion}
              </p>
            )}
            {fecha && (
              <div className="text-gray-400 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatearFecha(fecha)}
              </div>
            )}
            {!nombre && !descripcion && !grupo && !fecha && (
              <div className="text-gray-400 text-xs italic">
                Haz clic en el botón de editar para agregar información
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <ImageMetadataModal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        onSave={handleGuardarMetadata}
        defaultNombre={nombre}
        defaultDescripcion={descripcion}
        defaultGrupo={grupo}
        filename={filename}
      />
    </NodeViewWrapper>
  );
}

