import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Camera, Square, ArrowRight, Type, Save, Trash2, X, Check, Palette } from 'lucide-react';

const TOOL_RECTANGLE = 'rectangle';
const TOOL_ARROW = 'arrow';
const TOOL_TEXT = 'text';

export default function ScreenCapture({ node, updateAttributes, editor }) {
  const [capturedImage, setCapturedImage] = useState(node.attrs.image || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedTool, setSelectedTool] = useState(TOOL_RECTANGLE);
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [annotations, setAnnotations] = useState(node.attrs.annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, text: '' });
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Guardar cambios en el nodo
  useEffect(() => {
    if (capturedImage) {
      updateAttributes({
        image: capturedImage,
        annotations: annotations
      });
    }
  }, [capturedImage, annotations, updateAttributes]);

  // Capturar pantalla
  const captureScreen = async () => {
    try {
      setIsCapturing(true);
      
      // Usar Screen Capture API (funciona en Electron y navegadores modernos)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Tu navegador no soporta la captura de pantalla. Por favor, usa Chrome, Edge o Firefox.');
        setIsCapturing(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor' // Preferir pantalla completa
          },
          audio: false
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          // Esperar un frame para asegurar que el video esté listo
          video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            setAnnotations([]);
            
            stream.getTracks().forEach(track => track.stop());
            setIsCapturing(false);
          };
        };

        // Manejar cuando el usuario cancela
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsCapturing(false);
        });
      } catch (error) {
        console.error('Error capturando pantalla:', error);
        if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
          alert('Error al capturar la pantalla. Asegúrate de permitir el acceso a la pantalla.');
        }
        setIsCapturing(false);
      }
    } catch (error) {
      console.error('Error capturando pantalla:', error);
      alert('Error al capturar la pantalla');
      setIsCapturing(false);
    }
  };

  // Dibujar en el canvas
  const drawOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !capturedImage) return;

    const ctx = canvas.getContext('2d');
    
    // Obtener dimensiones originales de la imagen
    const img = new Image();
    img.src = capturedImage;
    
    // Calcular escala
    const rect = canvas.getBoundingClientRect();
    const scaleX = image.width / rect.width;
    const scaleY = image.height / rect.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar imagen escalada
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Dibujar anotaciones (las coordenadas ya están en escala del canvas)
    annotations.forEach((annotation, index) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 3;

      if (annotation.type === TOOL_RECTANGLE) {
        const { x, y, width, height } = annotation;
        ctx.strokeRect(x, y, width, height);
      } else if (annotation.type === TOOL_ARROW) {
        const { x1, y1, x2, y2 } = annotation;
        const headlen = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Dibujar punta de flecha
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle + Math.PI / 6),
          y2 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (annotation.type === TOOL_TEXT) {
        ctx.fillStyle = annotation.color;
        ctx.font = `${annotation.fontSize || 16}px Arial`;
        ctx.fillText(annotation.text, annotation.x, annotation.y);
      }
    });

    // Dibujar anotación actual en progreso
    if (currentAnnotation) {
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = 3;

      if (currentAnnotation.type === TOOL_RECTANGLE) {
        const { x, y, width, height } = currentAnnotation;
        ctx.strokeRect(x, y, width, height);
      } else if (currentAnnotation.type === TOOL_ARROW) {
        const { x1, y1, x2, y2 } = currentAnnotation;
        const headlen = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle - Math.PI / 6),
          y2 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headlen * Math.cos(angle + Math.PI / 6),
          y2 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  }, [capturedImage, annotations, currentAnnotation, selectedColor]);

  // Manejar mouse down
  const handleMouseDown = (e) => {
    if (!capturedImage || selectedTool === TOOL_TEXT) {
      if (selectedTool === TOOL_TEXT) {
        const rect = containerRef.current.getBoundingClientRect();
        setTextInput({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          text: ''
        });
      }
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    if (selectedTool === TOOL_RECTANGLE) {
      setCurrentAnnotation({ type: TOOL_RECTANGLE, x, y, width: 0, height: 0, color: selectedColor });
    } else if (selectedTool === TOOL_ARROW) {
      setCurrentAnnotation({ type: TOOL_ARROW, x1: x, y1: y, x2: x, y2: y, color: selectedColor });
    }
  };

  // Manejar mouse move
  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos || !currentAnnotation) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === TOOL_RECTANGLE) {
      setCurrentAnnotation({
        ...currentAnnotation,
        width: x - startPos.x,
        height: y - startPos.y
      });
    } else if (selectedTool === TOOL_ARROW) {
      setCurrentAnnotation({
        ...currentAnnotation,
        x2: x,
        y2: y
      });
    }
  };

  // Manejar mouse up
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
    setStartPos(null);
  };

  // Guardar texto
  const handleTextSave = () => {
    if (textInput.text.trim()) {
      const rect = containerRef.current.getBoundingClientRect();
      setAnnotations(prev => [...prev, {
        type: TOOL_TEXT,
        x: textInput.x,
        y: textInput.y,
        text: textInput.text,
        color: selectedColor,
        fontSize: 16
      }]);
    }
    setTextInput({ visible: false, x: 0, y: 0, text: '' });
  };

  // Guardar imagen final
  const handleSave = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    // Crear enlace de descarga
    const link = document.createElement('a');
    link.download = `captura-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Insertar imagen en el editor
  const handleInsert = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    if (editor) {
      editor.chain().focus().setImage({ src: dataUrl }).run();
    }
  };

  // Actualizar canvas cuando cambia la imagen o anotaciones
  useEffect(() => {
    if (capturedImage && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          drawOnCanvas();
        }
      };
      img.src = capturedImage;
    }
  }, [capturedImage, drawOnCanvas]);

  // Redibujar cuando cambian las anotaciones
  useEffect(() => {
    drawOnCanvas();
  }, [annotations, currentAnnotation, drawOnCanvas]);

  return (
    <NodeViewWrapper className="screen-capture-wrapper my-4">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4" ref={containerRef}>
        {!capturedImage ? (
          <div className="text-center py-8">
            <button
              onClick={captureScreen}
              disabled={isCapturing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              {isCapturing ? 'Capturando...' : 'Capturar Pantalla'}
            </button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex items-center gap-2 flex-wrap border-b pb-3">
              <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <button
                  onClick={() => setSelectedTool(TOOL_RECTANGLE)}
                  className={`p-2 rounded ${selectedTool === TOOL_RECTANGLE ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  title="Rectángulo"
                >
                  <Square className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedTool(TOOL_ARROW)}
                  className={`p-2 rounded ${selectedTool === TOOL_ARROW ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  title="Flecha"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedTool(TOOL_TEXT)}
                  className={`p-2 rounded ${selectedTool === TOOL_TEXT ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  title="Texto"
                >
                  <Type className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 border-r pr-2 mr-2">
                <Palette className="w-5 h-5 text-gray-600" />
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-10 h-8 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setAnnotations([])}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1.5 text-sm"
                title="Limpiar anotaciones"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>

              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm"
                title="Guardar imagen"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>

              <button
                onClick={handleInsert}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm"
                title="Insertar en editor"
              >
                <Check className="w-4 h-4" />
                Insertar
              </button>

              <button
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().deleteNode('screenCapture').run();
                  }
                }}
                className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-sm ml-auto"
                title="Eliminar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canvas container */}
            <div className="relative border border-gray-300 rounded overflow-auto max-h-[600px]" style={{ position: 'relative' }}>
              <img
                ref={imageRef}
                src={capturedImage}
                alt="Captura"
                className="hidden"
                onLoad={() => {
                  if (imageRef.current && canvasRef.current) {
                    const img = imageRef.current;
                    // Ajustar tamaño del canvas manteniendo proporción
                    const maxWidth = 1200;
                    const maxHeight = 600;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                      height = (height * maxWidth) / width;
                      width = maxWidth;
                    }
                    if (height > maxHeight) {
                      width = (width * maxHeight) / height;
                      height = maxHeight;
                    }
                    
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;
                    canvasRef.current.style.width = `${width}px`;
                    canvasRef.current.style.height = `${height}px`;
                    drawOnCanvas();
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />
            </div>

            {/* Input de texto */}
            {textInput.visible && (
              <div
                style={{
                  position: 'absolute',
                  left: `${textInput.x}px`,
                  top: `${textInput.y}px`,
                  zIndex: 1000,
                  transform: 'translate(-50%, -50%)'
                }}
                className="bg-white border border-gray-300 rounded shadow-lg p-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={textInput.text}
                  onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTextSave();
                    } else if (e.key === 'Escape') {
                      setTextInput({ visible: false, x: 0, y: 0, text: '' });
                    }
                  }}
                  autoFocus
                  className="px-2 py-1 border border-gray-300 rounded outline-none w-full"
                  style={{ color: selectedColor }}
                />
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={handleTextSave}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setTextInput({ visible: false, x: 0, y: 0, text: '' })}
                    className="px-2 py-1 bg-gray-200 rounded text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

