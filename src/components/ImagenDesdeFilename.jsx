import { useState, useEffect } from 'react';
import LocalStorageService from '../services/LocalStorageService';

export default function ImagenDesdeFilename({ fila, className, alt }) {
  const [imagenUrl, setImagenUrl] = useState(null);
  const [esIconoPredefinido, setEsIconoPredefinido] = useState(false);
  
  useEffect(() => {
    const cargarImagen = async () => {
      // Si es un icono predefinido (empezando con icon-), mostrar el emoji directamente
      if (fila.imageFilename && fila.imageFilename.startsWith('icon-')) {
        setEsIconoPredefinido(true);
        setImagenUrl(fila.image); // El emoji está en fila.image
        return;
      }
      
      if (fila.imageFilename || fila.image) {
        try {
          let filename = fila.imageFilename;
          
          // Si no hay imageFilename pero hay image, intentar extraerlo
          if (!filename && fila.image) {
            if (fila.image.startsWith('./files/')) {
              filename = fila.image.replace('./files/', '');
            } else if (fila.image.startsWith('blob:')) {
              // Si es una URL blob, usarla directamente
              setImagenUrl(fila.image);
              setEsIconoPredefinido(false);
              return;
            } else if (fila.image.startsWith('http')) {
              // Si es una URL HTTP, usarla directamente
              setImagenUrl(fila.image);
              setEsIconoPredefinido(false);
              return;
            }
          }
          
          // Si tenemos filename, cargar desde el archivo
          if (filename) {
            const url = await LocalStorageService.getFileURL(filename, 'files');
            if (url) {
              setImagenUrl(url);
              setEsIconoPredefinido(false);
            } else {
              setImagenUrl(null);
            }
          } else {
            setImagenUrl(null);
          }
        } catch (error) {
          setImagenUrl(null);
        }
      } else {
        setImagenUrl(null);
        setEsIconoPredefinido(false);
      }
    };
    cargarImagen();
  }, [fila.image, fila.imageFilename]);
  
  if (!imagenUrl && !esIconoPredefinido) return null;
  
  if (esIconoPredefinido) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-lg">{imagenUrl}</span>
      </div>
    );
  }
  
  return <img src={imagenUrl} alt={alt || fila.Name || "Sin nombre"} className={className} />;
}

