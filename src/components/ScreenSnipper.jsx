import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Camera, Square, ArrowRight, Type, Save, Trash2, X, Check, Palette, Triangle, Maximize2, Minimize2 } from 'lucide-react';

const TOOL_RECTANGLE = 'rectangle';
const TOOL_TRIANGLE = 'triangle';
const TOOL_ARROW = 'arrow';
const TOOL_TEXT = 'text';

export default function ScreenSnipper({ node, updateAttributes, editor }) {
  const [capturedImage, setCapturedImage] = useState(node.attrs.image || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null); // {x, y, width, height}
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [isCropped, setIsCropped] = useState(false); // Indica si ya se aplicó el recorte
  const [selectedTool, setSelectedTool] = useState(TOOL_RECTANGLE);
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [annotations, setAnnotations] = useState(node.attrs.annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const selectionCanvasRef = useRef(null);
  const fullscreenContainerRef = useRef(null);

  // Guardar cambios en el nodo
  useEffect(() => {
    if (capturedImage && selectedArea) {
      updateAttributes({
        image: capturedImage,
        selectedArea: selectedArea,
        annotations: annotations
      });
    }
  }, [capturedImage, selectedArea, annotations, updateAttributes]);

  // Capturar pantalla completa
  const captureFullScreen = async () => {
    try {
      setIsCapturing(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        alert('Tu navegador no soporta la captura de pantalla. Por favor, usa Chrome, Edge o Firefox.');
        setIsCapturing(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'monitor'
          },
          audio: false
        });

        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        video.onloadedmetadata = () => {
          video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);
            setSelectedArea(null);
            setAnnotations([]);
            setIsCropped(false);
            
            stream.getTracks().forEach(track => track.stop());
            setIsCapturing(false);
          };
        };

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

  // Manejar inicio de selección de área
  const handleSelectionStart = (e) => {
    if (!capturedImage || isCropped) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = selectionCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectedArea({ x, y, width: 0, height: 0 });
  };

  // Manejar movimiento durante selección
  const handleSelectionMove = (e) => {
    if (!isSelecting || !selectionStart || !selectionCanvasRef.current) return;
    
    const rect = selectionCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = x - selectionStart.x;
    const height = y - selectionStart.y;
    
    setSelectedArea({
      x: Math.min(selectionStart.x, x),
      y: Math.min(selectionStart.y, y),
      width: Math.abs(width),
      height: Math.abs(height)
    });
  };

  // Manejar fin de selección
  const handleSelectionEnd = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
    }
  };

  // Dibujar en el canvas de selección
  const drawSelection = useCallback(() => {
    const canvas = selectionCanvasRef.current;
    if (!canvas || !capturedImage || isCropped) return;

    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (img && img.complete) {
      const rect = img.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Dibujar área seleccionada
      if (selectedArea && selectedArea.width > 0 && selectedArea.height > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar overlay oscuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Recortar área seleccionada (mostrar transparente)
        ctx.clearRect(selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height);
        
        // Dibujar borde de selección
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(selectedArea.x, selectedArea.y, selectedArea.width, selectedArea.height);
        ctx.setLineDash([]);
        
        // Mostrar dimensiones
        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Arial';
        ctx.fillText(
          `${Math.round(selectedArea.width)} x ${Math.round(selectedArea.height)}`,
          selectedArea.x + 5,
          selectedArea.y - 5
        );
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [capturedImage, selectedArea, isCropped]);

  // Dibujar anotaciones en el canvas principal
  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !isCropped) return;

    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    // La imagen ya está recortada, dibujarla
    if (img.complete) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const maxWidth = 1200;
      const maxHeight = 600;
      let displayWidth = img.naturalWidth;
      let displayHeight = img.naturalHeight;
      
      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }
      
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Dibujar anotaciones
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 3;

      if (annotation.type === TOOL_RECTANGLE) {
        const { x, y, width, height } = annotation;
        ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
      } else if (annotation.type === TOOL_TRIANGLE) {
        const { x, y, width, height } = annotation;
        ctx.beginPath();
        ctx.moveTo((x + width / 2) * scaleX, y * scaleY);
        ctx.lineTo(x * scaleX, (y + height) * scaleY);
        ctx.lineTo((x + width) * scaleX, (y + height) * scaleY);
        ctx.closePath();
        ctx.stroke();
      } else if (annotation.type === TOOL_ARROW) {
        const { x1, y1, x2, y2 } = annotation;
        const headlen = 20;
        const dx = (x2 - x1) * scaleX;
        const dy = (y2 - y1) * scaleY;
        const angle = Math.atan2(dy, dx);
        
        const x1Scaled = x1 * scaleX;
        const y1Scaled = y1 * scaleY;
        const x2Scaled = x2 * scaleX;
        const y2Scaled = y2 * scaleY;
        
        // Dibujar línea principal
        ctx.beginPath();
        ctx.moveTo(x1Scaled, y1Scaled);
        ctx.lineTo(x2Scaled, y2Scaled);
        ctx.stroke();
        
        // Dibujar punta de flecha
        ctx.beginPath();
        ctx.moveTo(x2Scaled, y2Scaled);
        ctx.lineTo(
          x2Scaled - headlen * Math.cos(angle - Math.PI / 6),
          y2Scaled - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x2Scaled, y2Scaled);
        ctx.lineTo(
          x2Scaled - headlen * Math.cos(angle + Math.PI / 6),
          y2Scaled - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (annotation.type === TOOL_TEXT) {
        ctx.fillStyle = annotation.color || selectedColor;
        ctx.font = `bold ${annotation.fontSize || 16}px Arial`;
        ctx.textBaseline = 'top';
        // Agregar sombra para mejor visibilidad
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.fillText(annotation.text, annotation.x * scaleX, annotation.y * scaleY);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    });

    // Dibujar anotación actual en progreso
    if (currentAnnotation) {
      ctx.strokeStyle = selectedColor;
      ctx.fillStyle = selectedColor;
      ctx.lineWidth = 3;

      if (currentAnnotation.type === TOOL_RECTANGLE) {
        const { x, y, width, height } = currentAnnotation;
        ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
      } else if (currentAnnotation.type === TOOL_TRIANGLE) {
        const { x, y, width, height } = currentAnnotation;
        ctx.beginPath();
        ctx.moveTo((x + width / 2) * scaleX, y * scaleY);
        ctx.lineTo(x * scaleX, (y + height) * scaleY);
        ctx.lineTo((x + width) * scaleX, (y + height) * scaleY);
        ctx.closePath();
        ctx.stroke();
      } else if (currentAnnotation.type === TOOL_ARROW) {
        const { x1, y1, x2, y2 } = currentAnnotation;
        const headlen = 20;
        const dx = (x2 - x1) * scaleX;
        const dy = (y2 - y1) * scaleY;
        const angle = Math.atan2(dy, dx);
        
        const x1Scaled = x1 * scaleX;
        const y1Scaled = y1 * scaleY;
        const x2Scaled = x2 * scaleX;
        const y2Scaled = y2 * scaleY;
        
        // Dibujar línea principal
        ctx.beginPath();
        ctx.moveTo(x1Scaled, y1Scaled);
        ctx.lineTo(x2Scaled, y2Scaled);
        ctx.stroke();
        
        // Dibujar punta de flecha
        ctx.beginPath();
        ctx.moveTo(x2Scaled, y2Scaled);
        ctx.lineTo(
          x2Scaled - headlen * Math.cos(angle - Math.PI / 6),
          y2Scaled - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(x2Scaled, y2Scaled);
        ctx.lineTo(
          x2Scaled - headlen * Math.cos(angle + Math.PI / 6),
          y2Scaled - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }
  }, [selectedArea, annotations, currentAnnotation, selectedColor]);

  // Manejar mouse down para anotaciones
  const handleMouseDown = (e) => {
    if (!isCropped) return;
    
    if (selectedTool === TOOL_TEXT) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTextInput({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        text: ''
      });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });

    if (selectedTool === TOOL_RECTANGLE || selectedTool === TOOL_TRIANGLE) {
      setCurrentAnnotation({ 
        type: selectedTool, 
        x, 
        y, 
        width: 0, 
        height: 0, 
        color: selectedColor 
      });
    } else if (selectedTool === TOOL_ARROW) {
      setCurrentAnnotation({ 
        type: TOOL_ARROW, 
        x1: x, 
        y1: y, 
        x2: x, 
        y2: y, 
        color: selectedColor 
      });
    }
  };

  // Manejar mouse move para anotaciones
  const handleMouseMove = (e) => {
    if (!isDrawing || !startPos || !currentAnnotation) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === TOOL_RECTANGLE || selectedTool === TOOL_TRIANGLE) {
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

  // Manejar mouse up para anotaciones
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setAnnotations(prev => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
    setStartPos(null);
  };

  // Guardar texto
  const handleTextSave = () => {
    if (textInput.text.trim() && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      
      setAnnotations(prev => [...prev, {
        type: TOOL_TEXT,
        x: textInput.x * scaleX,
        y: textInput.y * scaleY,
        text: textInput.text,
        color: selectedColor,
        fontSize: 16
      }]);
    }
    setTextInput({ visible: false, x: 0, y: 0, text: '' });
  };

  // Aplicar recorte con un área específica
  const applyCropWithArea = (area) => {
    if (!area || !imageRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    
    // Calcular escala entre el tamaño de visualización y el tamaño natural
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    // Calcular coordenadas y dimensiones en la imagen natural
    const sourceX = area.x * scaleX;
    const sourceY = area.y * scaleY;
    const sourceWidth = area.width * scaleX;
    const sourceHeight = area.height * scaleY;
    
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    
    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    const croppedDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(croppedDataUrl);
    setSelectedArea(null);
    setAnnotations([]);
    setIsCropped(true);
    setIsFullscreen(true); // Mostrar automáticamente en pantalla completa después del recorte
  };

  // Aplicar recorte y preparar para anotaciones
  const applyCrop = () => {
    if (!selectedArea || !imageRef.current) return;
    applyCropWithArea(selectedArea);
  };

  // Guardar imagen final
  const handleSave = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    const link = document.createElement('a');
    link.download = `recorte-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Event listeners para selección
  useEffect(() => {
    if (!capturedImage || isCropped) return;

    const canvas = selectionCanvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e) => {
      handleSelectionStart(e);
    };
    
    const handleMouseMove = (e) => {
      handleSelectionMove(e);
    };
    
    const handleMouseUp = () => {
      handleSelectionEnd();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [capturedImage, isCropped, isSelecting, selectionStart]);

  // Actualizar canvas de selección
  useEffect(() => {
    if (!isCropped) {
      drawSelection();
    }
  }, [drawSelection, isCropped, selectedArea, isSelecting]);

  // Actualizar canvas de anotaciones cuando cambia la imagen o las anotaciones
  useEffect(() => {
    if (!imageRef.current || !isCropped) return;
    
    const img = imageRef.current;
    if (img.complete) {
      drawAnnotations();
    } else {
      img.onload = () => {
        drawAnnotations();
      };
    }
  }, [capturedImage, annotations, currentAnnotation, drawAnnotations, isCropped]);

  // Cerrar color picker al hacer clic fuera
  useEffect(() => {
    if (!showColorPicker) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative')) {
        setShowColorPicker(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showColorPicker]);

  // Cerrar pantalla completa con Escape
  useEffect(() => {
    if (!isFullscreen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  return (
    <NodeViewWrapper className="screen-snipper-wrapper my-4">
      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4" ref={containerRef}>
        {!capturedImage ? (
          <div className="text-center py-8">
            <button
              onClick={captureFullScreen}
              disabled={isCapturing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              {isCapturing ? 'Capturando...' : 'Capturar Pantalla Completa'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Captura toda la pantalla y selecciona el área que deseas recortar
            </p>
          </div>
        ) : !isCropped ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Selecciona el área que deseas recortar arrastrando el mouse sobre la imagen
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm flex items-center gap-1.5"
                  title={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  {isFullscreen ? "Salir" : "Pantalla Completa"}
                </button>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setSelectedArea(null);
                    setAnnotations([]);
                    setIsCropped(false);
                  }}
                  className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Capturar de nuevo
                </button>
                <button
                  onClick={() => {
                    // Seleccionar toda la imagen como recorte
                    if (imageRef.current) {
                      const img = imageRef.current;
                      const rect = img.getBoundingClientRect();
                      applyCropWithArea({
                        x: 0,
                        y: 0,
                        width: rect.width,
                        height: rect.height
                      });
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  Usar toda la imagen
                </button>
                <button
                  onClick={() => {
                    if (editor) {
                      editor.chain().focus().deleteNode('screenSnipper').run();
                    }
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
            {isFullscreen ? (
              <div 
                ref={fullscreenContainerRef}
                className="fixed inset-0 bg-black z-[99999] flex items-center justify-center"
                style={{ padding: '20px' }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    ref={imageRef}
                    src={capturedImage}
                    alt="Captura"
                    style={{ 
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      height: 'auto',
                      cursor: 'crosshair',
                      objectFit: 'contain'
                    }}
                    onLoad={() => {
                      if (imageRef.current && selectionCanvasRef.current) {
                        const img = imageRef.current;
                        const rect = img.getBoundingClientRect();
                        selectionCanvasRef.current.width = rect.width;
                        selectionCanvasRef.current.height = rect.height;
                        selectionCanvasRef.current.style.width = `${rect.width}px`;
                        selectionCanvasRef.current.style.height = `${rect.height}px`;
                        drawSelection();
                      }
                    }}
                  />
                  <canvas
                    ref={selectionCanvasRef}
                    className="absolute top-0 left-0 cursor-crosshair"
                    style={{ 
                      pointerEvents: 'all', 
                      zIndex: 10,
                      touchAction: 'none',
                      margin: 'auto'
                    }}
                  />
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors z-20"
                    title="Cerrar pantalla completa"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded overflow-auto" style={{ maxHeight: '80vh' }}>
                <div className="relative inline-block">
                  <img
                    ref={imageRef}
                    src={capturedImage}
                    alt="Captura"
                    style={{ 
                      display: 'block',
                      maxWidth: '100%',
                      height: 'auto',
                      cursor: 'crosshair'
                    }}
                    onLoad={() => {
                      if (imageRef.current && selectionCanvasRef.current) {
                        const img = imageRef.current;
                        const rect = img.getBoundingClientRect();
                        selectionCanvasRef.current.width = rect.width;
                        selectionCanvasRef.current.height = rect.height;
                        selectionCanvasRef.current.style.width = `${rect.width}px`;
                        selectionCanvasRef.current.style.height = `${rect.height}px`;
                        drawSelection();
                      }
                    }}
                  />
                  <canvas
                    ref={selectionCanvasRef}
                    className="absolute top-0 left-0 cursor-crosshair"
                    style={{ 
                      pointerEvents: 'all', 
                      zIndex: 10,
                      touchAction: 'none'
                    }}
                  />
                </div>
              </div>
            )}
            {selectedArea && selectedArea.width > 0 && selectedArea.height > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={applyCrop}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Aplicar Recorte
                </button>
                <button
                  onClick={() => setSelectedArea(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </>
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
                  onClick={() => setSelectedTool(TOOL_TRIANGLE)}
                  className={`p-2 rounded ${selectedTool === TOOL_TRIANGLE ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
                  title="Triángulo"
                >
                  <Triangle className="w-5 h-5" />
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
                  title="Texto - Haz clic en el canvas para agregar texto"
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
                  title="Color de las anotaciones"
                />
              </div>

              {selectedTool === TOOL_TEXT && (
                <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                  💡 Haz clic en el canvas donde quieres agregar texto
                </div>
              )}

              {!isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-sm"
                  title="Ver en pantalla completa"
                >
                  <Maximize2 className="w-4 h-4" />
                  Pantalla Completa
                </button>
              )}

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
                onClick={() => {
                  if (editor) {
                    editor.chain().focus().deleteNode('screenSnipper').run();
                  }
                }}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1.5 text-sm ml-auto"
                title="Cerrar y eliminar"
              >
                <X className="w-4 h-4" />
                Cerrar
              </button>
            </div>

            {/* Canvas de anotaciones */}
            {isFullscreen ? (
              <div 
                ref={fullscreenContainerRef}
                className="fixed inset-0 bg-black z-[99999] flex items-center justify-center"
                style={{ padding: '20px' }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    ref={imageRef}
                    src={capturedImage}
                    alt="Recorte"
                    className="hidden"
                    onLoad={() => {
                      if (imageRef.current && canvasRef.current) {
                        const img = imageRef.current;
                        canvasRef.current.width = img.naturalWidth;
                        canvasRef.current.height = img.naturalHeight;
                        const maxWidth = window.innerWidth - 40;
                        const maxHeight = window.innerHeight - 100;
                        let displayWidth = img.naturalWidth;
                        let displayHeight = img.naturalHeight;
                        
                        if (displayWidth > maxWidth) {
                          displayHeight = (displayHeight * maxWidth) / displayWidth;
                          displayWidth = maxWidth;
                        }
                        if (displayHeight > maxHeight) {
                          displayWidth = (displayWidth * maxHeight) / displayHeight;
                          displayHeight = maxHeight;
                        }
                        
                        canvasRef.current.style.width = `${displayWidth}px`;
                        canvasRef.current.style.height = `${displayHeight}px`;
                        drawAnnotations();
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
                    style={{ 
                      display: 'block', 
                      maxWidth: '100%', 
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                  <button
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors z-20"
                    title="Salir de pantalla completa"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded overflow-auto" style={{ maxHeight: '80vh' }}>
                <img
                  ref={imageRef}
                  src={capturedImage}
                  alt="Recorte"
                  className="hidden"
                  onLoad={() => {
                    if (imageRef.current && canvasRef.current) {
                      const img = imageRef.current;
                      const maxWidth = 1200;
                      const maxHeight = 600;
                      let width = img.naturalWidth;
                      let height = img.naturalHeight;
                      
                      if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                      }
                      if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                      }
                      
                      canvasRef.current.width = img.naturalWidth;
                      canvasRef.current.height = img.naturalHeight;
                      canvasRef.current.style.width = `${width}px`;
                      canvasRef.current.style.height = `${height}px`;
                      drawAnnotations();
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
            )}

            {/* Input de texto */}
            {textInput.visible && canvasRef.current && (
              <div
                style={{
                  position: 'fixed',
                  left: `${textInput.x + canvasRef.current.getBoundingClientRect().left}px`,
                  top: `${textInput.y + canvasRef.current.getBoundingClientRect().top}px`,
                  zIndex: 100000,
                  transform: 'translate(-50%, -50%)'
                }}
                className="bg-white border-2 border-gray-400 rounded shadow-2xl p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={textInput.text}
                  onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTextSave();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setTextInput({ visible: false, x: 0, y: 0, text: '' });
                    }
                  }}
                  autoFocus
                  className="px-3 py-2 border-2 border-gray-300 rounded outline-none w-full text-base font-semibold"
                  style={{ 
                    color: selectedColor,
                    minWidth: '200px'
                  }}
                  placeholder="Escribe aquí..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleTextSave}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => setTextInput({ visible: false, x: 0, y: 0, text: '' })}
                    className="px-3 py-1.5 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors"
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

