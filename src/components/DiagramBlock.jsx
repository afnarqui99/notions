import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Settings, Maximize2, Minimize2, Download, Copy, Check, Upload, Square, Triangle, Circle, Minus, ArrowRight, Type, Image as ImageIcon, Layout, Hexagon, Star, Diamond, Zap } from 'lucide-react';
import mermaid from 'mermaid';

const getDefaultContent = (type) => {
    const defaults = {
      flowchart: `graph TD
    A[Inicio] --> B{¿Condición?}
    B -->|Sí| C[Acción 1]
    B -->|No| D[Acción 2]
    C --> E[Fin]
    D --> E`,
      sequence: `sequenceDiagram
    participant A as Usuario
    participant B as Sistema
    A->>B: Solicitud
    B-->>A: Respuesta`,
      class: `classDiagram
    class Animal {
      +String nombre
      +void comer()
    }
    class Perro {
      +void ladrar()
    }
    Animal <|-- Perro`,
      state: `stateDiagram-v2
    [*] --> Inactivo
    Inactivo --> Activo: Activar
    Activo --> Inactivo: Desactivar`,
      gantt: `gantt
    title Proyecto
    dateFormat YYYY-MM-DD
    section Fase 1
    Tarea 1: 2024-01-01, 5d
    Tarea 2: 2024-01-06, 3d`,
      er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }`,
    };
  return defaults[type] || defaults.flowchart;
};

export default function DiagramBlock({ node, updateAttributes, deleteNode }) {
  const [diagramType, setDiagramType] = useState(node.attrs.diagramType || 'flowchart');
  const [content, setContent] = useState(node.attrs.content || getDefaultContent(node.attrs.diagramType || 'flowchart'));
  const [isEditing, setIsEditing] = useState(!node.attrs.content);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [visualMode, setVisualMode] = useState(false);
  const [visualElements, setVisualElements] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [isMovingConnectionPoint, setIsMovingConnectionPoint] = useState(false);
  const [movingPointType, setMovingPointType] = useState(null); // 'from' o 'to'
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState(null);
  const [editingConnectionText, setEditingConnectionText] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [connectingFromPoint, setConnectingFromPoint] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const diagramRef = useRef(null);
  const canvasRef = useRef(null);
  const mermaidInitialized = useRef(false);

  // Inicializar Mermaid
  useEffect(() => {
    if (!mermaidInitialized.current) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 50,
          },
          sequence: {
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            mirrorActors: true,
            bottomMarginAdj: 1,
            useMaxWidth: true,
            rightAngles: false,
            showSequenceNumbers: false,
          },
          gantt: {
            titleTopMargin: 25,
            barHeight: 20,
            barGap: 4,
            topPadding: 50,
            leftPadding: 75,
            gridLineStartPadding: 35,
            fontSize: 11,
            fontFamily: '"Open-Sans", "sans-serif"',
            numberSectionStyles: 4,
            axisFormat: '%Y-%m-%d',
            topAxis: false,
          },
          logLevel: 'error',
          maxTextSize: 50000,
        });
        mermaidInitialized.current = true;
      } catch (err) {
        console.error('Error inicializando Mermaid:', err);
        setError('Error al inicializar el renderizador de diagramas');
      }
    }
  }, []);

  // Cargar elementos visuales y conexiones desde atributos
  useEffect(() => {
    if (visualMode) {
      try {
        const savedElements = node.attrs.visualElements ? JSON.parse(node.attrs.visualElements) : [];
        const savedConnections = node.attrs.connections ? JSON.parse(node.attrs.connections) : [];
        setVisualElements(savedElements);
        setConnections(savedConnections);
      } catch (err) {
        console.error('Error cargando elementos visuales:', err);
      }
    }
  }, [visualMode, node.attrs.visualElements, node.attrs.connections]);

  // Guardar elementos visuales y conexiones cuando cambian (con debounce)
  useEffect(() => {
    if (!visualMode) return;
    
    const timeoutId = setTimeout(() => {
      updateAttributes({
        visualElements: JSON.stringify(visualElements),
        connections: JSON.stringify(connections),
      });
    }, 500); // Debounce de 500ms
    
    return () => clearTimeout(timeoutId);
  }, [visualElements, connections, visualMode]);

  // Renderizar diagrama cuando cambia el contenido o tipo
  useEffect(() => {
    if (!isEditing && content && content.trim() && diagramRef.current && mermaidInitialized.current && !visualMode) {
      const timeoutId = setTimeout(() => {
        renderDiagram();
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [content, diagramType, isEditing, visualMode]);

  // Manejar arrastre de elementos ya colocados
  useEffect(() => {
    if (!isDraggingElement) return;

    const handleMouseMove = (e) => {
      if (!selectedElement || !canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      // Obtener la posición anterior del elemento
      setVisualElements(prev => {
        const oldElement = prev.find(el => el.id === selectedElement.id);
        if (!oldElement) return prev;
        
        const deltaX = newX - oldElement.x;
        const deltaY = newY - oldElement.y;
        
        // Actualizar posición del elemento
        const updatedElements = prev.map(el => 
          el.id === selectedElement.id 
            ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
            : el
        );
        
        const newElement = updatedElements.find(el => el.id === selectedElement.id);
        if (!newElement) return updatedElements;
        
        // Actualizar conexiones asociadas al elemento
        setConnections(prevConnections => prevConnections.map(conn => {
          let updated = false;
          const newConn = { ...conn };
          
          // Si el elemento es el origen de la conexión
          if (conn.from === selectedElement.id && conn.fromPoint) {
            // Calcular la posición relativa del punto respecto al elemento original
            const relativeX = conn.fromPoint.x - oldElement.x;
            const relativeY = conn.fromPoint.y - oldElement.y;
            
            // Calcular la nueva posición manteniendo la posición relativa
            let newPointX = newElement.x + relativeX;
            let newPointY = newElement.y + relativeY;
            
            // Asegurar que el punto esté dentro de los límites del elemento
            // Si el punto original estaba en un borde o esquina, mantenerlo ahí
            newPointX = Math.max(newElement.x, Math.min(newElement.x + newElement.width, newPointX));
            newPointY = Math.max(newElement.y, Math.min(newElement.y + newElement.height, newPointY));
            
            newConn.fromPoint = {
              ...conn.fromPoint,
              x: newPointX,
              y: newPointY,
            };
            updated = true;
          }
          
          // Si el elemento es el destino de la conexión
          if (conn.to === selectedElement.id && conn.toPoint) {
            // Calcular la posición relativa del punto respecto al elemento original
            const relativeX = conn.toPoint.x - oldElement.x;
            const relativeY = conn.toPoint.y - oldElement.y;
            
            // Calcular la nueva posición manteniendo la posición relativa
            let newPointX = newElement.x + relativeX;
            let newPointY = newElement.y + relativeY;
            
            // Asegurar que el punto esté dentro de los límites del elemento
            newPointX = Math.max(newElement.x, Math.min(newElement.x + newElement.width, newPointX));
            newPointY = Math.max(newElement.y, Math.min(newElement.y + newElement.height, newPointY));
            
            newConn.toPoint = {
              ...conn.toPoint,
              x: newPointX,
              y: newPointY,
            };
            updated = true;
          }
          
          return updated ? newConn : conn;
        }));
        
        return updatedElements;
      });
    };

    const handleMouseUp = () => {
      setIsDraggingElement(false);
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingElement, selectedElement, dragOffset]);

  // Manejar redimensionamiento
  useEffect(() => {
    if (!isResizing || !selectedElement || !resizeHandle) return;

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setVisualElements(prev => prev.map(el => {
        if (el.id !== selectedElement.id) return el;
        
        let newWidth = el.width;
        let newHeight = el.height;
        let newX = el.x;
        let newY = el.y;
        
        if (resizeHandle.includes('e')) {
          newWidth = Math.max(20, mouseX - el.x);
        }
        if (resizeHandle.includes('w')) {
          const diff = el.x - mouseX;
          newWidth = Math.max(20, el.width + diff);
          newX = Math.min(mouseX, el.x + el.width - 20);
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(20, mouseY - el.y);
        }
        if (resizeHandle.includes('n')) {
          const diff = el.y - mouseY;
          newHeight = Math.max(20, el.height + diff);
          newY = Math.min(mouseY, el.y + el.height - 20);
        }
        
        return { ...el, x: newX, y: newY, width: newWidth, height: newHeight };
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, selectedElement, resizeHandle]);

  // Función para obtener el punto de conexión más cercano en un elemento
  const getClosestConnectionPoint = (element, x, y) => {
    const points = [
      { x: element.x + element.width / 2, y: element.y, side: 'top' }, // Centro superior
      { x: element.x + element.width, y: element.y + element.height / 2, side: 'right' }, // Centro derecho
      { x: element.x + element.width / 2, y: element.y + element.height, side: 'bottom' }, // Centro inferior
      { x: element.x, y: element.y + element.height / 2, side: 'left' }, // Centro izquierdo
      { x: element.x, y: element.y, side: 'top-left' }, // Esquina superior izquierda
      { x: element.x + element.width, y: element.y, side: 'top-right' }, // Esquina superior derecha
      { x: element.x, y: element.y + element.height, side: 'bottom-left' }, // Esquina inferior izquierda
      { x: element.x + element.width, y: element.y + element.height, side: 'bottom-right' }, // Esquina inferior derecha
    ];
    
    let minDist = Infinity;
    let closestPoint = points[0];
    
    points.forEach(point => {
      const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
      }
    });
    
    return closestPoint;
  };

  // Manejar conexiones temporales mientras se arrastra
  useEffect(() => {
    if (!connectingFrom) return;

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const handleMouseUp = (e) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Buscar si se soltó sobre otro elemento
      const targetElement = visualElements.find(el => {
        if (el.id === connectingFrom.id) return false;
        return mouseX >= el.x && mouseX <= el.x + el.width &&
               mouseY >= el.y && mouseY <= el.y + el.height;
      });
      
      if (targetElement && connectingFromPoint) {
        // Obtener el punto de conexión más cercano en el elemento destino
        const toPoint = getClosestConnectionPoint(targetElement, mouseX, mouseY);
        
        // Crear conexión con puntos específicos
        const newConnection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom.id,
          to: targetElement.id,
          fromPoint: connectingFromPoint,
          toPoint: toPoint,
          label: '', // Etiqueta vacía por defecto
        };
        setConnections(prev => [...prev, newConnection]);
      }
      
      setConnectingFrom(null);
      setConnectingFromPoint(null);
      setTempConnection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectingFrom, connectingFromPoint, visualElements]);

  // Manejar movimiento de puntos de conexión
  useEffect(() => {
    if (!isMovingConnectionPoint || !selectedConnection) return;

    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setConnections(prev => prev.map(conn => {
        if (conn.id !== selectedConnection.id) return conn;
        
        if (movingPointType === 'from') {
          const fromEl = visualElements.find(el => el.id === conn.from);
          if (fromEl) {
            const closestPoint = getClosestConnectionPoint(fromEl, mouseX, mouseY);
            return { ...conn, fromPoint: closestPoint };
          }
        } else if (movingPointType === 'to') {
          const toEl = visualElements.find(el => el.id === conn.to);
          if (toEl) {
            const closestPoint = getClosestConnectionPoint(toEl, mouseX, mouseY);
            return { ...conn, toPoint: closestPoint };
          }
        }
        
        return conn;
      }));
    };

    const handleMouseUp = () => {
      setIsMovingConnectionPoint(false);
      setMovingPointType(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMovingConnectionPoint, selectedConnection, movingPointType, visualElements]);

  const renderDiagram = async () => {
    if (!diagramRef.current || !content || !mermaidInitialized.current) return;

    try {
      setError(null);
      diagramRef.current.innerHTML = '';
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const diagramElement = document.createElement('div');
      diagramElement.id = id;
      diagramElement.className = 'mermaid';
      diagramElement.textContent = content.trim();
      diagramRef.current.appendChild(diagramElement);

      await new Promise(resolve => requestAnimationFrame(resolve));

      try {
        await mermaid.parse(content.trim());
      } catch (parseError) {
        throw new Error(`Error de sintaxis: ${parseError.message || 'El código del diagrama tiene errores de sintaxis.'}`);
      }

      try {
        await mermaid.run({
          nodes: [diagramElement],
          suppressErrors: false,
        });
      } catch (mermaidError) {
        const errorMsg = mermaidError.message || mermaidError.str || 'Error al renderizar el diagrama.';
        throw new Error(`Error de renderizado: ${errorMsg}. Verifica que el diagrama sea válido y no tenga demasiadas conexiones complejas.`);
      }
    } catch (err) {
      console.error('Error renderizando diagrama:', err);
      const errorMessage = err.message || err.str || 'Error al renderizar el diagrama. Verifica la sintaxis.';
      setError(errorMessage);
      
      if (diagramRef.current) {
        diagramRef.current.innerHTML = `
          <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p class="text-red-800 dark:text-red-200 font-semibold mb-2">Error al renderizar:</p>
            <p class="text-red-700 dark:text-red-300 text-sm mb-3">${errorMessage}</p>
            <details class="text-xs">
              <summary class="cursor-pointer text-red-600 dark:text-red-400 mb-2">Ver código del diagrama</summary>
              <pre class="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto">${content}</pre>
            </details>
          </div>
        `;
      }
    }
  };

  const handleTypeChange = (newType) => {
    setDiagramType(newType);
    const newContent = getDefaultContent(newType);
    setContent(newContent);
    updateAttributes({
      diagramType: newType,
      content: newContent,
    });
    setIsEditing(true);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    updateAttributes({
      content: newContent,
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    renderDiagram();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleDownload = () => {
    if (visualMode) {
      // Descargar diagrama visual como PNG
      const svg = canvasRef.current?.querySelector('svg');
      if (!svg) return;

      // Calcular el tamaño real del contenido
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      // Revisar todos los elementos visuales
      visualElements.forEach(element => {
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + element.width);
        maxY = Math.max(maxY, element.y + element.height);
      });
      
      // Revisar todas las conexiones
      connections.forEach(conn => {
        const fromEl = visualElements.find(el => el.id === conn.from);
        const toEl = visualElements.find(el => el.id === conn.to);
        if (fromEl && conn.fromPoint) {
          minX = Math.min(minX, conn.fromPoint.x);
          minY = Math.min(minY, conn.fromPoint.y);
          maxX = Math.max(maxX, conn.fromPoint.x);
          maxY = Math.max(maxY, conn.fromPoint.y);
        }
        if (toEl && conn.toPoint) {
          minX = Math.min(minX, conn.toPoint.x);
          minY = Math.min(minY, conn.toPoint.y);
          maxX = Math.max(maxX, conn.toPoint.x);
          maxY = Math.max(maxY, conn.toPoint.y);
        }
      });
      
      // Si no hay elementos, usar el tamaño del SVG
      if (minX === Infinity) {
        const bbox = svg.getBBox();
        minX = bbox.x;
        minY = bbox.y;
        maxX = bbox.x + bbox.width;
        maxY = bbox.y + bbox.height;
      }
      
      const padding = 40;
      const width = Math.max(maxX - minX + padding * 2, 800);
      const height = Math.max(maxY - minY + padding * 2, 600);
      
      // Crear un nuevo SVG limpio sin elementos de selección
      const svgClone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);
      svgClone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
      svgClone.setAttribute('style', 'background: white;');
      
      // Copiar solo los elementos necesarios (sin handles de selección)
      const defs = svg.querySelector('defs');
      if (defs) {
        svgClone.appendChild(defs.cloneNode(true));
      }
      
      // Copiar conexiones
      connections.forEach(conn => {
        const fromEl = visualElements.find(el => el.id === conn.from);
        const toEl = visualElements.find(el => el.id === conn.to);
        if (!fromEl || !toEl) return;
        
        const fromX = conn.fromPoint?.x ?? (fromEl.x + fromEl.width / 2);
        const fromY = conn.fromPoint?.y ?? (fromEl.y + fromEl.height);
        const toX = conn.toPoint?.x ?? (toEl.x + toEl.width / 2);
        const toY = conn.toPoint?.y ?? (toEl.y);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', fromX);
        line.setAttribute('y1', fromY);
        line.setAttribute('x2', toX);
        line.setAttribute('y2', toY);
        line.setAttribute('stroke', '#000000');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svgClone.appendChild(line);
        
        // Agregar etiqueta si existe
        if (conn.label) {
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', midX - (conn.label.length * 4 + 10));
          rect.setAttribute('y', midY - 12);
          rect.setAttribute('width', conn.label.length * 8 + 20);
          rect.setAttribute('height', '24');
          rect.setAttribute('fill', 'white');
          rect.setAttribute('stroke', '#000');
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('rx', '4');
          svgClone.appendChild(rect);
          
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', midX);
          text.setAttribute('y', midY + 5);
          text.setAttribute('fill', '#000');
          text.setAttribute('font-size', '12');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.textContent = conn.label;
          svgClone.appendChild(text);
        }
      });
      
      // Copiar elementos visuales (sin handles de selección)
      visualElements.forEach(element => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        if (element.type === 'rectangle') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', element.x);
          rect.setAttribute('y', element.y);
          rect.setAttribute('width', element.width);
          rect.setAttribute('height', element.height);
          rect.setAttribute('fill', element.color || 'white');
          rect.setAttribute('stroke', element.strokeColor || '#000');
          rect.setAttribute('stroke-width', element.strokeWidth || 2);
          rect.setAttribute('rx', '5');
          g.appendChild(rect);
          
          if (element.text) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', element.x + element.width / 2);
            text.setAttribute('y', element.y + element.height / 2);
            text.setAttribute('fill', '#000');
            text.setAttribute('font-size', '14');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = element.text;
            g.appendChild(text);
          }
        } else if (element.type === 'circle') {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', element.x + element.width / 2);
          circle.setAttribute('cy', element.y + element.height / 2);
          circle.setAttribute('r', element.width / 2);
          circle.setAttribute('fill', element.color || 'white');
          circle.setAttribute('stroke', element.strokeColor || '#000');
          circle.setAttribute('stroke-width', element.strokeWidth || 2);
          g.appendChild(circle);
          
          if (element.text) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', element.x + element.width / 2);
            text.setAttribute('y', element.y + element.height / 2);
            text.setAttribute('fill', '#000');
            text.setAttribute('font-size', '14');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = element.text;
            g.appendChild(text);
          }
        } else if (element.type === 'triangle') {
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          const points = `${element.x + element.width / 2},${element.y} ${element.x + element.width},${element.y + element.height} ${element.x},${element.y + element.height}`;
          polygon.setAttribute('points', points);
          polygon.setAttribute('fill', element.color || 'white');
          polygon.setAttribute('stroke', element.strokeColor || '#000');
          polygon.setAttribute('stroke-width', element.strokeWidth || 2);
          g.appendChild(polygon);
        } else if (element.type === 'diamond') {
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          const points = `${element.x + element.width / 2},${element.y} ${element.x + element.width},${element.y + element.height / 2} ${element.x + element.width / 2},${element.y + element.height} ${element.x},${element.y + element.height / 2}`;
          polygon.setAttribute('points', points);
          polygon.setAttribute('fill', element.color || 'white');
          polygon.setAttribute('stroke', element.strokeColor || '#000');
          polygon.setAttribute('stroke-width', element.strokeWidth || 2);
          g.appendChild(polygon);
          
          if (element.text) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', element.x + element.width / 2);
            text.setAttribute('y', element.y + element.height / 2);
            text.setAttribute('fill', '#000');
            text.setAttribute('font-size', '14');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.textContent = element.text;
            g.appendChild(text);
          }
        } else if (element.type === 'hexagon') {
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          const points = `${element.x + element.width * 0.25},${element.y} ${element.x + element.width * 0.75},${element.y} ${element.x + element.width},${element.y + element.height / 2} ${element.x + element.width * 0.75},${element.y + element.height} ${element.x + element.width * 0.25},${element.y + element.height} ${element.x},${element.y + element.height / 2}`;
          polygon.setAttribute('points', points);
          polygon.setAttribute('fill', element.color || 'white');
          polygon.setAttribute('stroke', element.strokeColor || '#000');
          polygon.setAttribute('stroke-width', element.strokeWidth || 2);
          g.appendChild(polygon);
        } else if (element.type === 'star') {
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          const points = `${element.x + element.width / 2},${element.y} ${element.x + element.width * 0.6},${element.y + element.height * 0.35} ${element.x + element.width},${element.y + element.height * 0.35} ${element.x + element.width * 0.7},${element.y + element.height * 0.6} ${element.x + element.width * 0.85},${element.y + element.height} ${element.x + element.width / 2},${element.y + element.height * 0.75} ${element.x + element.width * 0.15},${element.y + element.height} ${element.x + element.width * 0.3},${element.y + element.height * 0.6} ${element.x},${element.y + element.height * 0.35} ${element.x + element.width * 0.4},${element.y + element.height * 0.35}`;
          polygon.setAttribute('points', points);
          polygon.setAttribute('fill', element.color || 'white');
          polygon.setAttribute('stroke', element.strokeColor || '#000');
          polygon.setAttribute('stroke-width', element.strokeWidth || 2);
          g.appendChild(polygon);
        } else if (element.type === 'text') {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', element.x);
          rect.setAttribute('y', element.y);
          rect.setAttribute('width', element.width);
          rect.setAttribute('height', element.height);
          rect.setAttribute('fill', 'transparent');
          rect.setAttribute('stroke', '#000');
          rect.setAttribute('stroke-width', '1');
          rect.setAttribute('stroke-dasharray', '5,5');
          g.appendChild(rect);
          
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', element.x + 5);
          text.setAttribute('y', element.y + 20);
          text.setAttribute('fill', '#000');
          text.setAttribute('font-size', '14');
          text.textContent = element.text || 'Texto';
          g.appendChild(text);
        } else if (element.type === 'line') {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', element.x);
          line.setAttribute('y1', element.y);
          line.setAttribute('x2', element.x + element.width);
          line.setAttribute('y2', element.y);
          line.setAttribute('stroke', element.color || '#000000');
          line.setAttribute('stroke-width', '3');
          g.appendChild(line);
        } else if (element.type === 'arrow') {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', element.x);
          line.setAttribute('y1', element.y);
          line.setAttribute('x2', element.x + element.width);
          line.setAttribute('y2', element.y);
          line.setAttribute('stroke', element.color || '#000000');
          line.setAttribute('stroke-width', '3');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          g.appendChild(line);
        } else if (element.type === 'image' && element.imageUrl) {
          const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
          image.setAttribute('href', element.imageUrl);
          image.setAttribute('x', element.x);
          image.setAttribute('y', element.y);
          image.setAttribute('width', element.width);
          image.setAttribute('height', element.height);
          image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          g.appendChild(image);
        }
        
        svgClone.appendChild(g);
      });
      
      // Crear un canvas para renderizar el SVG
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      // Convertir SVG a imagen
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `diagrama-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
          }
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.onerror = () => {
        console.error('Error cargando imagen SVG');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } else {
      // Descargar diagrama Mermaid como SVG
      const svg = diagramRef.current?.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagrama-${Date.now()}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt,.mmd,.mermaid';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        let mermaidCode = text.trim();
        
        if (file.name.endsWith('.md')) {
          const mermaidBlockRegex = /```(?:mermaid|mmd)\s*\n([\s\S]*?)```/g;
          const matches = [...text.matchAll(mermaidBlockRegex)];
          
          if (matches.length > 0) {
            mermaidCode = matches[0][1].trim();
          } else {
            const lines = text.split('\n');
            const mermaidStartKeywords = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'gantt', 'erDiagram', 'pie', 'gitgraph', 'journey'];
            let startIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();
              if (mermaidStartKeywords.some(keyword => line.startsWith(keyword))) {
                startIndex = i;
                break;
              }
            }
            
            if (startIndex >= 0) {
              mermaidCode = lines.slice(startIndex).join('\n').trim();
            } else {
              mermaidCode = text.trim();
            }
          }
        }
        
        let detectedType = diagramType;
        const codeLower = mermaidCode.toLowerCase().trim();
        if (codeLower.startsWith('graph') || codeLower.startsWith('flowchart')) {
          detectedType = 'flowchart';
        } else if (codeLower.startsWith('sequencediagram')) {
          detectedType = 'sequence';
        } else if (codeLower.startsWith('classdiagram')) {
          detectedType = 'class';
        } else if (codeLower.startsWith('statediagram')) {
          detectedType = 'state';
        } else if (codeLower.startsWith('gantt')) {
          detectedType = 'gantt';
        } else if (codeLower.startsWith('erdiagram')) {
          detectedType = 'er';
        }
        
        setDiagramType(detectedType);
        setContent(mermaidCode);
        updateAttributes({
          diagramType: detectedType,
          content: mermaidCode,
        });
        setIsEditing(true);
        setError(null);
      } catch (err) {
        console.error('Error leyendo archivo:', err);
        setError('Error al leer el archivo. Asegúrate de que sea un archivo de texto válido.');
      }
    };
    input.click();
  };

  const handleImageUpload = (elementId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          setVisualElements(prev => prev.map(el => 
            el.id === elementId ? { ...el, imageUrl } : el
          ));
          if (selectedElement?.id === elementId) {
            setSelectedElement({ ...selectedElement, imageUrl });
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error cargando imagen:', err);
        setError('Error al cargar la imagen');
      }
    };
    input.click();
  };

  const handleElementMouseDown = (e, element) => {
    e.stopPropagation();
    
    // Si hay una conexión seleccionada, deseleccionarla al hacer clic en un elemento
    if (selectedConnection) {
      setSelectedConnection(null);
    }
    
    setSelectedElement(element);
    
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - element.x;
      const offsetY = e.clientY - rect.top - element.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setIsDraggingElement(true);
    }
  };

  const handleDoubleClick = (element) => {
    if (element.type === 'text' || element.type === 'rectangle' || element.type === 'circle') {
      setEditingText(element.id);
    }
  };

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#64748b'
  ];

  const diagramTypes = [
    { value: 'flowchart', label: 'Flujo', icon: '🔄' },
    { value: 'sequence', label: 'Secuencia', icon: '📊' },
    { value: 'class', label: 'Clase', icon: '📦' },
    { value: 'state', label: 'Estado', icon: '🔄' },
    { value: 'gantt', label: 'Gantt', icon: '📅' },
    { value: 'er', label: 'ER', icon: '🗄️' },
  ];

  return (
    <NodeViewWrapper className="diagram-block-wrapper my-4">
      <div className={`border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <select
              value={diagramType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {diagramTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setVisualMode(!visualMode)}
              className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-1"
              title="Modo visual (arrastrar y soltar)"
            >
              <Layout className="w-4 h-4" />
              {visualMode ? 'Código' : 'Visual'}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              {isEditing ? 'Ver' : 'Editar'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="Subir archivo (.md, .txt, .mmd, .mermaid)"
            >
              <Upload className="w-4 h-4" />
            </button>
            {visualMode && (
              <button
                onClick={handleDownload}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Descargar diagrama como imagen (PNG)"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {!isEditing && !visualMode && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Descargar SVG"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'min-h-[300px] max-h-[600px]'} overflow-auto flex`}>
          {visualMode ? (
            /* Modo Visual - Editor con paleta lateral */
            <div className="flex w-full h-full">
              {/* Paleta lateral izquierda */}
              <div className="w-64 border-r border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 overflow-y-auto">
                <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Elementos</h3>
                <div className="space-y-2">
                  {/* Rectángulo */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'rectangle', id: `rect-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Square className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Rectángulo</span>
                  </div>
                  
                  {/* Círculo */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'circle', id: `circle-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Circle className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Círculo</span>
                  </div>
                  
                  {/* Triángulo */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'triangle', id: `triangle-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Triangle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm">Triángulo</span>
                  </div>

                  {/* Rombo */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'diamond', id: `diamond-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Diamond className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm">Rombo</span>
                  </div>

                  {/* Hexágono */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'hexagon', id: `hexagon-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Hexagon className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm">Hexágono</span>
                  </div>

                  {/* Estrella */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'star', id: `star-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="text-sm">Estrella</span>
                  </div>
                  
                  {/* Texto */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'text', id: `text-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Type className="w-5 h-5 text-orange-600" />
                    <span className="text-sm">Texto</span>
                  </div>
                  
                  {/* Línea */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'line', id: `line-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                    <span className="text-sm">Línea</span>
                  </div>
                  
                  {/* Flecha */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'arrow', id: `arrow-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-5 h-5 text-red-600" />
                    <span className="text-sm">Flecha</span>
                  </div>
                  
                  {/* Imagen */}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDraggedElement({ type: 'image', id: `image-${Date.now()}` });
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5 text-pink-600" />
                    <span className="text-sm">Imagen</span>
                  </div>
                </div>
              </div>
              
              {/* Canvas principal */}
              <div
                ref={canvasRef}
                className="flex-1 relative bg-white dark:bg-gray-800 overflow-auto"
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggedElement) return;
                  
                  const rect = canvasRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  
                  const newElement = {
                    ...draggedElement,
                    x,
                    y,
                    width: draggedElement.type === 'text' ? 120 : draggedElement.type === 'line' || draggedElement.type === 'arrow' ? 150 : 80,
                    height: draggedElement.type === 'text' ? 30 : draggedElement.type === 'line' || draggedElement.type === 'arrow' ? 2 : 80,
                    text: (draggedElement.type === 'text' || draggedElement.type === 'rectangle' || draggedElement.type === 'circle' || draggedElement.type === 'diamond') ? 'Texto' : '',
                    color: draggedElement.type === 'line' || draggedElement.type === 'arrow' ? '#000000' : 'transparent',
                    strokeColor: '#000000',
                    strokeWidth: 2,
                  };
                  
                  setVisualElements([...visualElements, newElement]);
                  setDraggedElement(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                }}
                onClick={(e) => {
                  if (e.target === canvasRef.current) {
                    setSelectedElement(null);
                    setSelectedConnection(null);
                    setEditingText(null);
                  }
                }}
              >
                <svg className="w-full h-full" style={{ minHeight: '500px' }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill="#000000" />
                    </marker>
                  </defs>
                  {/* Renderizar conexiones */}
                  {connections.map((conn) => {
                    const fromEl = visualElements.find(el => el.id === conn.from);
                    const toEl = visualElements.find(el => el.id === conn.to);
                    if (!fromEl || !toEl) return null;
                    
                    // Usar puntos específicos si existen, sino usar puntos por defecto
                    const fromX = conn.fromPoint?.x ?? (fromEl.x + fromEl.width / 2);
                    const fromY = conn.fromPoint?.y ?? (fromEl.y + fromEl.height);
                    const toX = conn.toPoint?.x ?? (toEl.x + toEl.width / 2);
                    const toY = conn.toPoint?.y ?? (toEl.y);
                    const isSelected = selectedConnection?.id === conn.id;
                    
                    return (
                      <g key={conn.id}>
                        <line
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke={isSelected ? "#ef4444" : "#000000"}
                          strokeWidth={isSelected ? "3" : "2"}
                          markerEnd="url(#arrowhead)"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConnection(conn);
                            setSelectedElement(null);
                          }}
                        />
                        {isSelected && (
                          <>
                            {/* Handle para mover el punto de inicio */}
                            <circle
                              cx={fromX}
                              cy={fromY}
                              r="8"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="2"
                              className="cursor-move"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsMovingConnectionPoint(true);
                                setMovingPointType('from');
                              }}
                              title="Mover punto de inicio"
                            />
                            {/* Handle para mover el punto de fin */}
                            <circle
                              cx={toX}
                              cy={toY}
                              r="8"
                              fill="#3b82f6"
                              stroke="white"
                              strokeWidth="2"
                              className="cursor-move"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsMovingConnectionPoint(true);
                                setMovingPointType('to');
                              }}
                              title="Mover punto de fin"
                            />
                            {/* Botón para eliminar (en el centro) */}
                            <circle
                              cx={(fromX + toX) / 2}
                              cy={(fromY + toY) / 2}
                              r="8"
                              fill="#ef4444"
                              stroke="white"
                              strokeWidth="2"
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConnections(prev => prev.filter(c => c.id !== conn.id));
                                setSelectedConnection(null);
                              }}
                              title="Eliminar conexión"
                            />
                          </>
                        )}
                      </g>
                    );
                  })}
                  
                  {/* Conexión temporal mientras se arrastra */}
                  {tempConnection && connectingFrom && connectingFromPoint && (
                    <line
                      x1={connectingFromPoint.x}
                      y1={connectingFromPoint.y}
                      x2={tempConnection.x}
                      y2={tempConnection.y}
                      stroke="#000000"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      markerEnd="url(#arrowhead)"
                    />
                  )}
                  
                  {/* Renderizar elementos */}
                  {visualElements.map((element) => (
                    <g key={element.id}>
                      {element.type === 'rectangle' && (
                        <g>
                          <rect
                            x={element.x}
                            y={element.y}
                            width={element.width}
                            height={element.height}
                            fill={element.color || 'white'}
                            stroke={element.strokeColor || '#000'}
                            strokeWidth={element.strokeWidth || 2}
                            rx="5"
                            className="cursor-move"
                            onMouseDown={(e) => handleElementMouseDown(e, element)}
                            onDoubleClick={() => handleDoubleClick(element)}
                          />
                          {element.text && (
                            <text
                              x={element.x + element.width / 2}
                              y={element.y + element.height / 2}
                              fill="#000"
                              fontSize="14"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none select-none"
                            >
                              {element.text}
                            </text>
                          )}
                        </g>
                      )}
                      {element.type === 'circle' && (
                        <g>
                          <circle
                            cx={element.x + element.width / 2}
                            cy={element.y + element.height / 2}
                            r={element.width / 2}
                            fill={element.color || 'white'}
                            stroke={element.strokeColor || '#000'}
                            strokeWidth={element.strokeWidth || 2}
                            className="cursor-move"
                            onMouseDown={(e) => handleElementMouseDown(e, element)}
                            onDoubleClick={() => handleDoubleClick(element)}
                          />
                          {element.text && (
                            <text
                              x={element.x + element.width / 2}
                              y={element.y + element.height / 2}
                              fill="#000"
                              fontSize="14"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none select-none"
                            >
                              {element.text}
                            </text>
                          )}
                        </g>
                      )}
                      {element.type === 'triangle' && (
                        <polygon
                          points={`${element.x + element.width / 2},${element.y} ${element.x + element.width},${element.y + element.height} ${element.x},${element.y + element.height}`}
                          fill={element.color || 'white'}
                          stroke={element.strokeColor || '#000'}
                          strokeWidth={element.strokeWidth || 2}
                          className="cursor-move"
                          onMouseDown={(e) => handleElementMouseDown(e, element)}
                        />
                      )}
                      {element.type === 'diamond' && (
                        <polygon
                          points={`${element.x + element.width / 2},${element.y} ${element.x + element.width},${element.y + element.height / 2} ${element.x + element.width / 2},${element.y + element.height} ${element.x},${element.y + element.height / 2}`}
                          fill={element.color || 'white'}
                          stroke={element.strokeColor || '#000'}
                          strokeWidth={element.strokeWidth || 2}
                          className="cursor-move"
                          onMouseDown={(e) => handleElementMouseDown(e, element)}
                          onDoubleClick={() => handleDoubleClick(element)}
                        />
                      )}
                      {element.type === 'hexagon' && (
                        <polygon
                          points={`${element.x + element.width * 0.25},${element.y} ${element.x + element.width * 0.75},${element.y} ${element.x + element.width},${element.y + element.height / 2} ${element.x + element.width * 0.75},${element.y + element.height} ${element.x + element.width * 0.25},${element.y + element.height} ${element.x},${element.y + element.height / 2}`}
                          fill={element.color || 'white'}
                          stroke={element.strokeColor || '#000'}
                          strokeWidth={element.strokeWidth || 2}
                          className="cursor-move"
                          onMouseDown={(e) => handleElementMouseDown(e, element)}
                        />
                      )}
                      {element.type === 'star' && (
                        <polygon
                          points={`${element.x + element.width / 2},${element.y} ${element.x + element.width * 0.6},${element.y + element.height * 0.35} ${element.x + element.width},${element.y + element.height * 0.35} ${element.x + element.width * 0.7},${element.y + element.height * 0.6} ${element.x + element.width * 0.85},${element.y + element.height} ${element.x + element.width / 2},${element.y + element.height * 0.75} ${element.x + element.width * 0.15},${element.y + element.height} ${element.x + element.width * 0.3},${element.y + element.height * 0.6} ${element.x},${element.y + element.height * 0.35} ${element.x + element.width * 0.4},${element.y + element.height * 0.35}`}
                          fill={element.color || 'white'}
                          stroke={element.strokeColor || '#000'}
                          strokeWidth={element.strokeWidth || 2}
                          className="cursor-move"
                          onMouseDown={(e) => handleElementMouseDown(e, element)}
                        />
                      )}
                      {element.type === 'text' && (
                        <g>
                          {editingText === element.id ? (
                            <foreignObject x={element.x} y={element.y} width={Math.max(element.width, 200)} height={element.height}>
                              <input
                                type="text"
                                value={element.text || ''}
                                onChange={(e) => {
                                  const updated = visualElements.map(el =>
                                    el.id === element.id ? { ...el, text: e.target.value } : el
                                  );
                                  setVisualElements(updated);
                                }}
                                onBlur={() => setEditingText(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingText(null);
                                  }
                                }}
                                onFocus={(e) => {
                                  // Seleccionar todo el texto al enfocarse
                                  e.target.select();
                                }}
                                autoFocus
                                className="w-full h-full px-2 text-sm border-2 border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                style={{ outline: 'none' }}
                              />
                            </foreignObject>
                          ) : (
                            <>
                              <rect
                                x={element.x}
                                y={element.y}
                                width={element.width}
                                height={element.height}
                                fill="transparent"
                                stroke="#000"
                                strokeWidth="1"
                                strokeDasharray="5,5"
                                className="cursor-move"
                                onMouseDown={(e) => handleElementMouseDown(e, element)}
                                onDoubleClick={() => handleDoubleClick(element)}
                              />
                              <text
                                x={element.x + 5}
                                y={element.y + 20}
                                fill="#000"
                                fontSize="14"
                                className="pointer-events-none select-none"
                              >
                                {element.text || 'Texto'}
                              </text>
                            </>
                          )}
                        </g>
                      )}
                      {element.type === 'line' && (
                        <line
                          x1={element.x}
                          y1={element.y}
                          x2={element.x + element.width}
                          y2={element.y}
                          stroke={element.color || '#000000'}
                          strokeWidth="3"
                          className="cursor-move"
                          onMouseDown={(e) => handleElementMouseDown(e, element)}
                        />
                      )}
                      {element.type === 'arrow' && (
                        <line
                          x1={element.x}
                          y1={element.y}
                          x2={element.x + element.width}
                          y2={element.y}
                          stroke={element.color || '#000000'}
                          strokeWidth="3"
                          markerEnd="url(#arrowhead)"
                          className="cursor-move"
                          onMouseDown={(e) => handleElementMouseDown(e, element)}
                        />
                      )}
                      {element.type === 'image' && (
                        <g>
                          <rect
                            x={element.x}
                            y={element.y}
                            width={element.width}
                            height={element.height}
                            fill="#f3f4f6"
                            stroke="#000"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            className="cursor-move"
                            onMouseDown={(e) => handleElementMouseDown(e, element)}
                          />
                          {element.imageUrl ? (
                            <image
                              href={element.imageUrl}
                              x={element.x}
                              y={element.y}
                              width={element.width}
                              height={element.height}
                              preserveAspectRatio="xMidYMid meet"
                              className="pointer-events-none"
                            />
                          ) : (
                            <text
                              x={element.x + element.width / 2}
                              y={element.y + element.height / 2}
                              fill="#9ca3af"
                              fontSize="12"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none"
                            >
                              Sin imagen
                            </text>
                          )}
                        </g>
                      )}
                      {selectedElement?.id === element.id && (
                        <g>
                          {/* Borde de selección */}
                          <rect
                            x={element.x - 5}
                            y={element.y - 5}
                            width={element.width + 10}
                            height={element.height + 10}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          {/* Handles de redimensionamiento */}
                          {element.type !== 'line' && element.type !== 'arrow' && (
                            <>
                              {/* Esquinas */}
                              <circle
                                cx={element.x}
                                cy={element.y}
                                r="5"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-nwse-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('nw');
                                }}
                              />
                              <circle
                                cx={element.x + element.width}
                                cy={element.y}
                                r="5"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-nesw-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('ne');
                                }}
                              />
                              <circle
                                cx={element.x}
                                cy={element.y + element.height}
                                r="5"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-nesw-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('sw');
                                }}
                              />
                              <circle
                                cx={element.x + element.width}
                                cy={element.y + element.height}
                                r="5"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-nwse-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('se');
                                }}
                              />
                              {/* Bordes */}
                              <rect
                                x={element.x + element.width / 2 - 5}
                                y={element.y - 5}
                                width="10"
                                height="10"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-ns-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('n');
                                }}
                              />
                              <rect
                                x={element.x + element.width / 2 - 5}
                                y={element.y + element.height - 5}
                                width="10"
                                height="10"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-ns-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('s');
                                }}
                              />
                              <rect
                                x={element.x - 5}
                                y={element.y + element.height / 2 - 5}
                                width="10"
                                height="10"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-ew-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('w');
                                }}
                              />
                              <rect
                                x={element.x + element.width - 5}
                                y={element.y + element.height / 2 - 5}
                                width="10"
                                height="10"
                                fill="#3b82f6"
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-ew-resize"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setIsResizing(true);
                                  setResizeHandle('e');
                                }}
                              />
                              {/* Conectores para conexiones */}
                              {/* Centro superior */}
                              <circle
                                cx={element.x + element.width / 2}
                                cy={element.y}
                                r="5"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x + element.width / 2, y: element.y };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde arriba"
                              />
                              {/* Centro derecho */}
                              <circle
                                cx={element.x + element.width}
                                cy={element.y + element.height / 2}
                                r="5"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x + element.width, y: element.y + element.height / 2 };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde la derecha"
                              />
                              {/* Centro inferior */}
                              <circle
                                cx={element.x + element.width / 2}
                                cy={element.y + element.height}
                                r="5"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x + element.width / 2, y: element.y + element.height };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde abajo"
                              />
                              {/* Centro izquierdo */}
                              <circle
                                cx={element.x}
                                cy={element.y + element.height / 2}
                                r="5"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="2"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x, y: element.y + element.height / 2 };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde la izquierda"
                              />
                              {/* Esquinas */}
                              <circle
                                cx={element.x}
                                cy={element.y}
                                r="4"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="1.5"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x, y: element.y };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde esquina superior izquierda"
                              />
                              <circle
                                cx={element.x + element.width}
                                cy={element.y}
                                r="4"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="1.5"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x + element.width, y: element.y };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde esquina superior derecha"
                              />
                              <circle
                                cx={element.x}
                                cy={element.y + element.height}
                                r="4"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="1.5"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x, y: element.y + element.height };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde esquina inferior izquierda"
                              />
                              <circle
                                cx={element.x + element.width}
                                cy={element.y + element.height}
                                r="4"
                                fill="#10b981"
                                stroke="white"
                                strokeWidth="1.5"
                                className="cursor-pointer"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  const point = { x: element.x + element.width, y: element.y + element.height };
                                  setConnectingFrom(element);
                                  setConnectingFromPoint(point);
                                  setTempConnection(point);
                                }}
                                title="Conectar desde esquina inferior derecha"
                              />
                            </>
                          )}
                        </g>
                      )}
                    </g>
                  ))}
                </svg>
                
                {/* Panel de propiedades cuando hay un elemento seleccionado */}
                {selectedElement && (
                  <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 w-64 z-10">
                    <h4 className="font-semibold mb-3">Propiedades</h4>
                    <div className="space-y-3">
                      {(selectedElement.type === 'text' || selectedElement.type === 'rectangle' || selectedElement.type === 'circle' || selectedElement.type === 'diamond') && (
                        <div>
                          <label className="block text-sm mb-1">Texto:</label>
                          <input
                            type="text"
                            value={selectedElement.text || ''}
                            onChange={(e) => {
                              const updated = visualElements.map(el =>
                                el.id === selectedElement.id ? { ...el, text: e.target.value } : el
                              );
                              setVisualElements(updated);
                              setSelectedElement({ ...selectedElement, text: e.target.value });
                            }}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                            placeholder="Escribe aquí..."
                          />
                        </div>
                      )}
                      {selectedElement.type === 'image' && (
                        <div>
                          <button
                            onClick={() => handleImageUpload(selectedElement.id)}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                          >
                            {selectedElement.imageUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
                          </button>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm mb-2">Color:</label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                const updated = visualElements.map(el =>
                                  el.id === selectedElement.id ? { ...el, color } : el
                                );
                                setVisualElements(updated);
                                setSelectedElement({ ...selectedElement, color });
                              }}
                              className={`w-8 h-8 rounded border-2 ${selectedElement.color === color ? 'border-blue-600' : 'border-gray-300'}`}
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={selectedElement.color}
                          onChange={(e) => {
                            const updated = visualElements.map(el =>
                              el.id === selectedElement.id ? { ...el, color: e.target.value } : el
                            );
                            setVisualElements(updated);
                            setSelectedElement({ ...selectedElement, color: e.target.value });
                          }}
                          className="w-full h-8"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setVisualElements(visualElements.filter(el => el.id !== selectedElement.id));
                              setConnections(prev => prev.filter(conn => 
                                conn.from !== selectedElement.id && conn.to !== selectedElement.id
                              ));
                              setSelectedElement(null);
                            }}
                            className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => {
                              const element = visualElements.find(el => el.id === selectedElement.id);
                              if (element) {
                                const newElement = {
                                  ...element,
                                  id: `${element.type}-${Date.now()}`,
                                  x: element.x + 20,
                                  y: element.y + 20,
                                };
                                setVisualElements([...visualElements, newElement]);
                              }
                            }}
                            className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          >
                            Duplicar
                          </button>
                        </div>
                        {connections.filter(conn => 
                          conn.from === selectedElement.id || conn.to === selectedElement.id
                        ).length > 0 && (
                          <div>
                            <label className="block text-sm mb-1">Conexiones:</label>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {connections.filter(conn => 
                                conn.from === selectedElement.id || conn.to === selectedElement.id
                              ).map(conn => {
                                const otherEl = visualElements.find(el => 
                                  el.id === (conn.from === selectedElement.id ? conn.to : conn.from)
                                );
                                return (
                                  <div key={conn.id} className="flex items-center justify-between text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">
                                    <span className="truncate">{otherEl?.type || 'Elemento'}</span>
                                    <button
                                      onClick={() => {
                                        setConnections(prev => prev.filter(c => c.id !== conn.id));
                                      }}
                                      className="text-red-600 hover:text-red-700 ml-2"
                                      title="Eliminar conexión"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isEditing ? (
            <div className="p-4">
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={handleSave}
                className="w-full h-full min-h-[250px] p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Escribe el código del diagrama aquí..."
                spellCheck={false}
              />
              {error && (
                <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 flex items-center justify-center">
              <div ref={diagramRef} className="w-full flex items-center justify-center">
                {!content && (
                  <div className="text-gray-400 dark:text-gray-500 text-center">
                    <p>Haz clic en "Editar" para crear tu diagrama</p>
                  </div>
                )}
              </div>
              {error && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm shadow-lg">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
