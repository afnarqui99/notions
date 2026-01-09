import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Code2, Maximize2, Minimize2, Search, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function CodeBlockWithCopy({ node, updateAttributes, editor }) {
  const [copied, setCopied] = useState(false);
  const [isInDrawer, setIsInDrawer] = useState(false);
  const [isInModal, setIsInModal] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [showSearch, setShowSearch] = useState(false);
  const language = node.attrs.language || '';
  const contentRef = useRef(null);
  const wrapperRef = useRef(null);
  const fullscreenRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Actualizar el contenido del modal cuando se abre (solo la primera vez)
  useEffect(() => {
    if (isFullscreen && !fullscreenContent) {
      const currentText = getCodeText();
      setFullscreenContent(currentText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  // Función auxiliar para limpiar resaltados
  const clearHighlights = (element) => {
    if (!element) return;
    const highlights = element.querySelectorAll('.search-highlight, .search-highlight-current');
    highlights.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        const textNode = document.createTextNode(el.textContent);
        parent.replaceChild(textNode, el);
        parent.normalize();
      }
    });
  };

  // Función auxiliar para aplicar resaltados
  const applyHighlights = useCallback(() => {
    // Intentar obtener el elemento code de diferentes formas
    let codeElement = contentRef.current;
    
    console.log('applyHighlights: Buscando elemento', {
      hasContentRef: !!contentRef.current,
      hasWrapperRef: !!wrapperRef.current,
      contentRefTag: contentRef.current?.tagName,
      contentRefClassName: contentRef.current?.className
    });
    
    // Si contentRef existe pero no es un code, buscar dentro de él
    if (codeElement && codeElement.tagName !== 'CODE') {
      const codeInside = codeElement.querySelector('code');
      if (codeInside) {
        codeElement = codeInside;
        console.log('applyHighlights: Encontrado code dentro de contentRef');
      }
    }
    
    // Si contentRef no está disponible, intentar encontrarlo en wrapperRef
    if (!codeElement && wrapperRef.current) {
      codeElement = wrapperRef.current.querySelector('code');
      if (codeElement) {
        console.log('applyHighlights: Usando elemento de wrapperRef');
      }
    }
    
    // Si aún no está disponible, intentar encontrarlo directamente en wrapperRef
    if (!codeElement && wrapperRef.current) {
      codeElement = wrapperRef.current.querySelector('[class*="language-"]') || 
                    wrapperRef.current.querySelector('code') ||
                    wrapperRef.current.querySelector('pre code');
      if (codeElement) {
        console.log('applyHighlights: Encontrado elemento alternativo');
      }
    }
    
    // Último intento: buscar en todo el documento dentro del wrapper
    if (!codeElement && wrapperRef.current) {
      const allCodes = wrapperRef.current.getElementsByTagName('code');
      if (allCodes.length > 0) {
        codeElement = allCodes[0];
        console.log('applyHighlights: Usando primer code encontrado en wrapper');
      }
    }
    
    console.log('applyHighlights llamado:', { 
      hasContentRef: !!contentRef.current,
      hasCodeElement: !!codeElement,
      showSearch, 
      searchTerm, 
      isFullscreen, 
      resultsCount: searchResults.length 
    });
    
    if (!codeElement || !showSearch || !searchTerm || isFullscreen || searchResults.length === 0) {
      console.log('applyHighlights: Condiciones no cumplidas, saliendo', {
        hasCodeElement: !!codeElement,
        showSearch,
        searchTerm,
        isFullscreen,
        resultsCount: searchResults.length
      });
      return;
    }
    console.log('applyHighlights: Limpiando resaltados anteriores');
    
    // Limpiar resaltados anteriores
    clearHighlights(codeElement);

    // Guardar referencia al elemento para usar en el closure
    const elementToHighlight = codeElement;
    
    // Esperar un momento para que el DOM esté estable, pero usar requestAnimationFrame para mejor sincronización
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Verificar que el elemento aún existe
        if (!elementToHighlight || !document.contains(elementToHighlight)) {
          console.log('Elemento no disponible o removido del DOM');
          return;
        }
        
        const text = getCodeText();
        if (!text) {
          console.log('No se pudo obtener el texto para resaltar');
          return;
        }
        
        console.log('Aplicando resaltados:', { 
          searchResults: searchResults.length, 
          currentIndex: currentResultIndex,
          textLength: text.length,
          searchTerm,
          elementTag: elementToHighlight.tagName
        });

        // Crear un TreeWalker para encontrar todos los nodos de texto
        const walker = document.createTreeWalker(
          elementToHighlight,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let textNode;
        let currentIndex = 0;
        const textNodes = [];

        // Recopilar todos los nodos de texto con sus índices
        while ((textNode = walker.nextNode())) {
          // Saltar nodos que ya son parte de un highlight
          if (textNode.parentElement?.classList?.contains('search-highlight') || 
              textNode.parentElement?.classList?.contains('search-highlight-current')) {
            continue;
          }
          
          const textLength = textNode.textContent.length;
          textNodes.push({
            node: textNode,
            start: currentIndex,
            end: currentIndex + textLength
          });
          currentIndex += textLength;
        }

        console.log('Nodos de texto encontrados:', textNodes.length);

        // Ordenar resultados por índice descendente para procesarlos de atrás hacia adelante
        const sortedResults = [...searchResults].sort((a, b) => b.index - a.index);

        let highlightsApplied = 0;

        // Procesar cada resultado
        for (const result of sortedResults) {
          const isCurrent = searchResults.indexOf(result) === currentResultIndex;
          
          // Encontrar el nodo de texto que contiene este resultado
          for (const textNodeInfo of textNodes) {
            if (result.index >= textNodeInfo.start && result.index < textNodeInfo.end) {
              const node = textNodeInfo.node;
              
            // Verificar que el nodo aún existe y no ha sido modificado
            if (!node.parentNode || !elementToHighlight.contains(node)) {
              console.log('Nodo no válido, saltando');
              continue;
            }

              const nodeText = node.textContent;
              const relativeStart = result.index - textNodeInfo.start;
              const relativeEnd = Math.min(result.index + result.length - textNodeInfo.start, nodeText.length);

              // Verificar que el texto coincide
              const actualMatch = nodeText.substring(relativeStart, relativeEnd);
              if (actualMatch.toLowerCase() !== result.text.toLowerCase()) {
                console.log('Texto no coincide:', { actualMatch, expected: result.text });
                continue;
              }

              // Dividir el nodo en tres partes: antes, coincidencia, después
              const beforeText = nodeText.substring(0, relativeStart);
              const matchText = nodeText.substring(relativeStart, relativeEnd);
              const afterText = nodeText.substring(relativeEnd);

              // Crear los elementos
              const fragment = document.createDocumentFragment();
              if (beforeText) {
                fragment.appendChild(document.createTextNode(beforeText));
              }
              const highlightSpan = document.createElement('span');
              highlightSpan.className = isCurrent ? 'search-highlight-current' : 'search-highlight';
              highlightSpan.textContent = matchText;
              highlightSpan.setAttribute('data-search-index', searchResults.indexOf(result).toString());
              fragment.appendChild(highlightSpan);
              if (afterText) {
                fragment.appendChild(document.createTextNode(afterText));
              }

              // Reemplazar el nodo original
              const parent = node.parentNode;
              if (parent && parent.contains(node)) {
                try {
                  parent.replaceChild(fragment, node);
                  highlightsApplied++;
                  console.log('Resaltado aplicado:', { index: result.index, isCurrent, matchText });
                } catch (error) {
                  console.error('Error al reemplazar nodo:', error);
                }
              }

              // Actualizar los índices de los nodos restantes
              textNodeInfo.start = result.index + result.length;
              break;
            }
          }
        }

        console.log('Resaltados aplicados:', highlightsApplied, 'de', searchResults.length);

        // Normalizar el DOM
        elementToHighlight.normalize();
      }, 50);
    });
  }, [showSearch, searchTerm, searchResults, currentResultIndex, isFullscreen]);

  // Efecto para resaltar coincidencias en el modo fullscreen (usando overlay)
  useEffect(() => {
    if (!showSearch || !searchTerm || !isFullscreen || searchResults.length === 0 || !fullscreenRef.current) {
      // Limpiar overlay si existe
      const existingOverlay = document.getElementById('search-highlight-overlay');
      if (existingOverlay && existingOverlay.parentElement) {
        existingOverlay.parentElement.removeChild(existingOverlay);
      }
      return;
    }

    const textarea = fullscreenRef.current;
    const content = fullscreenContent || getCodeText();
    if (!content) return;

    // Obtener estilos calculados del textarea
    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = parseFloat(computedStyle.fontSize) || 16;
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.6;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 24;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 24;
    
    // Crear o actualizar overlay para resaltados
    let overlay = document.getElementById('search-highlight-overlay');
    const textareaParent = textarea.parentElement;
    
    if (!overlay && textareaParent) {
      overlay = document.createElement('div');
      overlay.id = 'search-highlight-overlay';
      textareaParent.style.position = 'relative';
      textareaParent.appendChild(overlay);
    }

    if (!overlay) return;

    // Configurar overlay para que coincida exactamente con el textarea
    const textareaRect = textarea.getBoundingClientRect();
    const parentRect = textareaParent.getBoundingClientRect();
    
    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      top: ${textareaRect.top - parentRect.top + paddingTop}px;
      left: ${textareaRect.left - parentRect.left + paddingLeft}px;
      width: ${textarea.clientWidth - (paddingLeft * 2)}px;
      height: ${textarea.clientHeight - (paddingTop * 2)}px;
      z-index: 10;
      font-family: ${computedStyle.fontFamily};
      font-size: ${fontSize}px;
      line-height: ${lineHeight}px;
      white-space: pre;
      word-break: normal;
      overflow-wrap: normal;
      color: transparent;
      overflow: hidden;
    `;

    // Calcular posiciones de los resaltados
    const getLineAndColumn = (text, index) => {
      const textBefore = text.substring(0, index);
      const lines = textBefore.split('\n');
      const lineNum = lines.length - 1;
      const colNum = lines[lines.length - 1].length;
      return { line: lineNum, col: colNum };
    };
    
    // Limpiar overlay anterior
    overlay.innerHTML = '';
    
    // Crear spans para cada resultado
    searchResults.forEach((result, index) => {
      const isCurrent = index === currentResultIndex;
      const { line, col } = getLineAndColumn(content, result.index);
      
      // Calcular posición exacta
      const top = line * lineHeight;
      const charWidth = fontSize * 0.6; // Aproximado para fuente monospace
      const left = col * charWidth;
      
      const span = document.createElement('span');
      span.style.cssText = `
        position: absolute;
        top: ${top}px;
        left: ${left}px;
        background-color: ${isCurrent ? '#FFC107' : '#FFEB3B'};
        color: #000000;
        padding: 0;
        border-radius: 1px;
        font-weight: ${isCurrent ? '600' : '500'};
        ${isCurrent ? 'box-shadow: 0 0 0 1px rgba(255, 193, 7, 0.5);' : ''}
        pointer-events: none;
        white-space: pre;
        line-height: ${lineHeight}px;
      `;
      span.textContent = result.text;
      overlay.appendChild(span);
    });

    // Sincronizar scroll del overlay con el textarea
    const syncScroll = () => {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    };
    
    textarea.addEventListener('scroll', syncScroll);
    syncScroll();
    
    // Actualizar posición cuando cambie el tamaño de la ventana
    const updatePosition = () => {
      const textareaRect = textarea.getBoundingClientRect();
      const parentRect = textareaParent.getBoundingClientRect();
      overlay.style.top = `${textareaRect.top - parentRect.top + paddingTop}px`;
      overlay.style.left = `${textareaRect.left - parentRect.left + paddingLeft}px`;
    };
    
    window.addEventListener('resize', updatePosition);
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(textarea);

    return () => {
      textarea.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', updatePosition);
      resizeObserver.disconnect();
      if (overlay && overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    };
  }, [showSearch, searchTerm, isFullscreen, searchResults, currentResultIndex, fullscreenContent]);


  // Limpiar timeout cuando el componente se desmonte o cuando se cierre la búsqueda
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Inicializar búsqueda cuando se abre el panel de búsqueda
  useEffect(() => {
    if (showSearch && searchTerm) {
      // Limpiar timeout anterior si existe
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
      // Usar un pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        const content = isFullscreen && fullscreenRef.current 
          ? fullscreenRef.current.value 
          : (isFullscreen ? fullscreenContent : getCodeText());
        if (content) {
          performSearch(content, searchTerm);
        }
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSearch]);

  // Detectar si estamos dentro del drawer y si el drawer está abierto
  useEffect(() => {
    const checkContext = () => {
      if (!wrapperRef.current) return;

      // Verificar si el componente está dentro de un drawer o modal
      // Buscar un elemento padre que tenga el atributo data-drawer
      let parent = wrapperRef.current.parentElement;
      let foundDrawer = false;
      let foundModal = false;
      
      while (parent && parent !== document.body) {
        // Verificar si tiene el atributo data-drawer (método más confiable)
        const drawerAttr = parent.getAttribute('data-drawer');
        if (drawerAttr === 'table-drawer' || drawerAttr === 'table-drawer-modal') {
          foundDrawer = true;
          if (drawerAttr === 'table-drawer-modal') {
            foundModal = true;
          }
          break;
        }
        
        // Fallback: verificar por clases y estilos
        const computedStyle = getComputedStyle(parent);
        const zIndex = computedStyle.zIndex;
        const position = computedStyle.position;
        
        if (position === 'fixed' && (zIndex === '100' || zIndex === '10000' || parent.classList.toString().includes('z-[100]') || parent.classList.toString().includes('z-[10000]'))) {
          if (parent.classList.toString().includes('bg-white') || 
              parent.classList.toString().includes('shadow-2xl')) {
            foundDrawer = true;
            if (zIndex === '10000' || parent.classList.toString().includes('z-[10000]')) {
              foundModal = true;
            }
            break;
          }
        }
        parent = parent.parentElement;
      }

      setIsInDrawer(foundDrawer);
      setIsInModal(foundModal);

      // Verificar si hay un drawer o modal abierto buscando el overlay o panel
      const drawerOverlay = Array.from(document.querySelectorAll('.fixed.inset-0')).find(
        el => {
          const zIndex = getComputedStyle(el).zIndex;
          return zIndex === '100' || zIndex === '9999' || zIndex === '10000' || 
                 el.classList.toString().includes('z-[100]') || 
                 el.classList.toString().includes('z-[9999]') ||
                 el.classList.toString().includes('z-[10000]');
        }
      );
      const drawerPanel = Array.from(document.querySelectorAll('.fixed.top-0.bottom-0, .fixed.inset-0')).find(
        el => {
          const zIndex = getComputedStyle(el).zIndex;
          return (zIndex === '100' || zIndex === '10000' || 
                  el.classList.toString().includes('z-[100]') || 
                  el.classList.toString().includes('z-[10000]')) &&
                 (el.classList.toString().includes('bg-white') || 
                  el.getAttribute('data-drawer') === 'table-drawer-modal');
        }
      );
      const isDrawerOpen = !!(drawerOverlay || drawerPanel);

      // Mostrar el botón siempre si estamos en un drawer/modal, o si no hay drawer/modal abierto
      setShouldShowButton((foundDrawer && isDrawerOpen) || (!foundDrawer && !isDrawerOpen));
    };

    // Verificar inmediatamente
    const timeout = setTimeout(checkContext, 0);

    // Verificar periódicamente para detectar cambios (menos frecuente)
    const interval = setInterval(checkContext, 300);

    // También escuchar cambios en el DOM
    const observer = new MutationObserver(() => {
      setTimeout(checkContext, 50);
    });
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Obtener el texto del código para copiar
  const getCodeText = () => {
    // Intentar obtener el texto del elemento del DOM
    if (contentRef.current) {
      const text = contentRef.current.textContent || contentRef.current.innerText || '';
      if (text.trim()) {
        return text;
      }
    }
    
    // Si no hay texto en el ref, usar el nodo directamente
    if (node && node.textContent) {
      return node.textContent;
    }
    
    // Último recurso: intentar obtener del editor
    if (editor) {
      const { state } = editor;
      const { doc } = state;
      let text = '';
      doc.descendants((n) => {
        if (n.type.name === 'codeBlock' && n.attrs.language === language) {
          text = n.textContent;
          return false;
        }
      });
      if (text) return text;
    }
    
    return '';
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const codeText = getCodeText();
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleFullscreen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentText = getCodeText();
    setFullscreenContent(currentText);
    setIsFullscreen(true);
    // Si hay búsqueda activa, actualizarla con el nuevo contenido
    if (searchTerm) {
      performSearch(currentText, searchTerm);
    }
  };

  const handleExitFullscreen = () => {
    // Guardar cambios antes de cerrar
    if (fullscreenContent !== getCodeText() && editor) {
      updateEditorContent(fullscreenContent);
    }
    setIsFullscreen(false);
  };

  // Función para actualizar el contenido del editor
  const updateEditorContent = (newContent) => {
    if (!editor) return;

    const { state } = editor;
    const { doc } = state;
    
    // Buscar el nodo codeBlock actual por su posición en el documento
    // Usamos el nodo actual del componente
    let targetPos = null;
    const currentText = getCodeText();
    
    doc.descendants((node, pos) => {
      if (node.type.name === 'codeBlock' && 
          node.attrs.language === 'json') {
        // Comparar el contenido del nodo con el contenido actual
        const nodeText = node.textContent;
        if (nodeText === currentText || 
            (currentText && nodeText.includes(currentText.substring(0, 50)))) {
          targetPos = pos;
          return false;
        }
      }
    });

    if (targetPos !== null) {
      const tr = state.tr;
      const targetNode = doc.nodeAt(targetPos);
      if (targetNode) {
        const from = targetPos + 1;
        const to = from + targetNode.content.size;
        tr.replaceWith(from, to, state.schema.text(newContent));
        tr.setMeta('jsonFormatter', true);
        editor.view.dispatch(tr);
        
        // Actualizar el contenido del modal después de guardar
        setTimeout(() => {
          setFullscreenContent(newContent);
        }, 100);
      }
    }
  };

  // Manejar cambios en el textarea del modal
  const handleFullscreenContentChange = (e) => {
    setFullscreenContent(e.target.value);
    // Si hay búsqueda activa, actualizar resultados
    if (searchTerm) {
      performSearch(e.target.value, searchTerm);
    }
  };

  // Función para buscar en el contenido (optimizada para textos largos)
  const performSearch = (content, term) => {
    if (!term || !term.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    // Obtener el texto del contenido pasado como parámetro
    let text = content;
    
    // Si no hay contenido, intentar obtenerlo del textarea en fullscreen o del editor
    if (!text || text.trim() === '') {
      if (isFullscreen && fullscreenRef.current) {
        text = fullscreenRef.current.value;
      } else {
        text = getCodeText();
      }
    }
    
    // Asegurarse de que tenemos texto
    if (!text || typeof text !== 'string' || text.trim() === '') {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    // Limpiar el término de búsqueda (trim y normalizar espacios)
    const cleanTerm = term.trim();
    
    if (!cleanTerm) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }

    const startTime = performance.now();
    const results = [];
    const termLength = cleanTerm.length;
    const textLength = text.length;
    
    // Para textos muy largos (>100KB), usar indexOf que es más eficiente que regex
    // Para textos más pequeños, usar regex para búsqueda case-insensitive
    const useIndexOf = textLength > 100000 || cleanTerm.length > 20;
    
    if (useIndexOf) {
      // Método optimizado para textos largos: usar indexOf con búsqueda case-insensitive manual
      const lowerText = text.toLowerCase();
      const lowerTerm = cleanTerm.toLowerCase();
      let searchIndex = 0;
      
      while (searchIndex < textLength) {
        const foundIndex = lowerText.indexOf(lowerTerm, searchIndex);
        if (foundIndex === -1) {
          break;
        }
        
        // Obtener el texto real en esa posición para preservar el case original
        const actualText = text.substring(foundIndex, foundIndex + termLength);
        
        results.push({
          index: foundIndex,
          length: termLength,
          text: actualText
        });
        
        // Continuar buscando desde la siguiente posición
        searchIndex = foundIndex + 1;
      }
    } else {
      // Método con regex para textos más pequeños (más preciso con case-insensitive)
      try {
        // Escapar caracteres especiales para la búsqueda regex
        const escapedTerm = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedTerm, 'gi');
        
        let match;
        let lastIndex = -1;
        let iterations = 0;
        const maxIterations = 50000; // Aumentado para textos grandes

        searchRegex.lastIndex = 0;

        while ((match = searchRegex.exec(text)) !== null && iterations < maxIterations) {
          iterations++;
          
          // Evitar bucles infinitos si el regex no avanza
          if (match.index === lastIndex && match[0].length === 0) {
            break;
          }
          
          if (match.index >= 0 && match[0].length > 0) {
            lastIndex = match.index;
            
            results.push({
              index: match.index,
              length: match[0].length,
              text: match[0]
            });
          } else {
            break;
          }
        }
      } catch (error) {
        console.error('Error al crear regex:', error, { term: cleanTerm });
        setSearchResults([]);
        setCurrentResultIndex(-1);
        return;
      }
    }
    
    const endTime = performance.now();
    const searchTime = endTime - startTime;

    // Logging optimizado (solo para debugging cuando es necesario)
    if (results.length === 0) {
      console.log('🔍 Búsqueda sin resultados:', { 
        term: cleanTerm,
        textLength: text.length,
        searchTime: `${searchTime.toFixed(2)}ms`,
        method: useIndexOf ? 'indexOf' : 'regex'
      });
    } else {
      console.log('✅ Búsqueda exitosa:', { 
        term: cleanTerm, 
        textLength: text.length, 
        resultsCount: results.length,
        searchTime: `${searchTime.toFixed(2)}ms`,
        method: useIndexOf ? 'indexOf' : 'regex',
        firstResult: results[0]
      });
    }
    
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentResultIndex(0);
      scrollToResult(0, results);
    } else {
      setCurrentResultIndex(-1);
    }
  };

  // Función para resaltar coincidencias en el texto
  const highlightMatches = (text, term) => {
    if (!term || !term.trim()) {
      return text;
    }

    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-400 dark:bg-yellow-600 text-gray-900 dark:text-gray-100">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Función para desplazarse a un resultado específico
  const scrollToResult = (index, results = searchResults) => {
    if (index < 0 || index >= results.length) return;

    const result = results[index];
    const textarea = fullscreenRef.current;
    const codeElement = contentRef.current;
    const wrapperElement = wrapperRef.current;

    if (isFullscreen && textarea) {
      const content = fullscreenContent || getCodeText();
      
      // Guardar la posición actual del cursor
      const currentCursorPos = textarea.selectionStart;
      const currentSelectionEnd = textarea.selectionEnd;
      
      // Calcular la posición de scroll para centrar el resultado
      const textBeforeMatch = content.substring(0, result.index);
      const linesBefore = textBeforeMatch.split('\n').length - 1;
      const lineHeight = 24; // Aproximado basado en fontSize y lineHeight
      const textareaHeight = textarea.clientHeight;
      const scrollPosition = linesBefore * lineHeight - (textareaHeight / 2);
      
      // Hacer scroll sin mover el cursor
      textarea.scrollTop = Math.max(0, scrollPosition);
      
      // Restaurar la posición del cursor después de un pequeño delay
      // Solo si el usuario no estaba seleccionando texto (cursor y selección en la misma posición)
      setTimeout(() => {
        if (currentCursorPos === currentSelectionEnd) {
          // El usuario no tenía texto seleccionado, mantener la posición del cursor
          textarea.setSelectionRange(currentCursorPos, currentCursorPos);
        } else {
          // El usuario tenía texto seleccionado, restaurar la selección
          textarea.setSelectionRange(currentCursorPos, currentSelectionEnd);
        }
      }, 0);
    }
  };

  // Navegar al siguiente resultado
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    scrollToResult(nextIndex);
  };

  // Navegar al resultado anterior
  const goToPreviousResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentResultIndex <= 0 ? searchResults.length - 1 : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    scrollToResult(prevIndex);
  };

  // Manejar cambio en el término de búsqueda (con debounce para textos largos)
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Si el término está vacío, limpiar resultados inmediatamente
    if (!term.trim()) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      setSearchResults([]);
      setCurrentResultIndex(-1);
      return;
    }
    
    // Limpiar timeout anterior si existe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Obtener el contenido actual
    let content;
    if (isFullscreen) {
      if (fullscreenRef.current) {
        content = fullscreenRef.current.value;
      } else {
        content = fullscreenContent || getCodeText();
      }
    } else {
      content = getCodeText();
    }
    
    if (!content) {
      return;
    }
    
    // Para textos largos, usar debounce para mejorar el rendimiento
    // Para textos pequeños, buscar inmediatamente
    const contentLength = content.length;
    const debounceDelay = contentLength > 50000 ? 300 : 100; // 300ms para textos >50KB, 100ms para otros
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(content, term);
      searchTimeoutRef.current = null;
    }, debounceDelay);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
    setShowSearch(false);
  };

  // Cerrar fullscreen con Escape
  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen]);

  const handleFormat = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (language !== 'json') return;

    // Si estamos en fullscreen, usar el contenido del modal, sino el del editor
    let currentText = isFullscreen ? fullscreenContent : getCodeText();
    if (!currentText || !currentText.trim()) return;

    // Limpiar el texto: eliminar espacios al inicio y final
    currentText = currentText.trim();

    // Función para limpiar y convertir JSON con comillas simples
    const cleanAndConvertJSON = (text) => {
      let result = text;
      
      // Paso 1: Reemplazar valores de Python a JSON
      // None -> null (Python)
      result = result.replace(/\bNone\b/g, 'null');
      // True -> true (Python)
      result = result.replace(/\bTrue\b/g, 'true');
      // False -> false (Python)
      result = result.replace(/\bFalse\b/g, 'false');
      
      // Paso 2: Reemplazar valores JavaScript no válidos en JSON
      // NaN -> null
      result = result.replace(/\bNaN\b/g, 'null');
      // undefined -> null
      result = result.replace(/\bundefined\b/g, 'null');
      // Asegurar que null esté en minúsculas (por si acaso)
      result = result.replace(/\bNull\b/g, 'null');
      
      // Paso 3: Convertir comillas simples a dobles
      result = result.replace(/'/g, '"');
      
      return result;
    };

    // Función para formatear JSON
    let formatted;
    try {
      // Primero intentar parsear directamente
      const parsed = JSON.parse(currentText);
      formatted = JSON.stringify(parsed, null, 2);
    } catch (error) {
      // Si falla, intentar limpiar y convertir
      try {
        const cleanedText = cleanAndConvertJSON(currentText);
        console.log('Texto original:', currentText);
        console.log('Texto limpiado:', cleanedText);
        const parsed = JSON.parse(cleanedText);
        formatted = JSON.stringify(parsed, null, 2);
      } catch (secondError) {
        // Si aún falla, intentar usar eval (solo para objetos JavaScript válidos)
        try {
          // Limpiar el texto antes de usar eval
          const cleanedForEval = cleanAndConvertJSON(currentText);
          // Usar eval para convertir objetos JavaScript a JSON
          // Esto maneja casos como {key: value} sin comillas
          const evalResult = eval('(' + cleanedForEval + ')');
          formatted = JSON.stringify(evalResult, null, 2);
        } catch (thirdError) {
          // Si todo falla, mostrar un mensaje con más detalles
          console.error('Error al formatear JSON:', thirdError);
          console.error('Texto original:', currentText);
          const cleanedText = cleanAndConvertJSON(currentText);
          console.error('Texto después de limpiar:', cleanedText);
          alert('El contenido no es un JSON válido.\n\nError: ' + thirdError.message + '\n\nRevisa la consola para más detalles.');
          return;
        }
      }
    }

    // Si el formato no cambió, no hacer nada
    if (formatted === currentText || formatted === currentText.trim()) {
      return;
    }

    // Si estamos en fullscreen, actualizar solo el contenido del modal
    if (isFullscreen) {
      setFullscreenContent(formatted);
      return;
    }

    // Si no estamos en fullscreen, actualizar el editor
    if (!editor) return;

    // Encontrar la posición del nodo en el editor
    const { state } = editor;
    const { doc } = state;
    
    // Buscar el nodo codeBlock actual
    let targetPos = null;
    doc.descendants((node, pos) => {
      if (node.type.name === 'codeBlock' && 
          node.attrs.language === 'json' &&
          node.textContent === currentText) {
        targetPos = pos;
        return false;
      }
    });

    if (targetPos !== null) {
      // Actualizar el contenido del nodo
      const tr = state.tr;
      const node = doc.nodeAt(targetPos);
      if (node) {
        const from = targetPos + 1;
        const to = from + node.content.size;
        tr.replaceWith(from, to, state.schema.text(formatted));
        tr.setMeta('jsonFormatter', true);
        editor.view.dispatch(tr);
      }
    }
  };

  // Inyectar estilos CSS para el resaltado
  useEffect(() => {
    const styleId = 'code-block-search-highlight-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .search-highlight {
          background-color: #FFEB3B !important;
          color: #000000 !important;
          padding: 1px 2px !important;
          border-radius: 3px !important;
          font-weight: 500 !important;
        }
        .search-highlight-current {
          background-color: #FFC107 !important;
          color: #000000 !important;
          padding: 1px 2px !important;
          border-radius: 3px !important;
          font-weight: 600 !important;
          box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.5) !important;
          outline: 2px solid #FFC107 !important;
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      // No remover los estilos ya que pueden ser usados por otros componentes
    };
  }, []);

  // Actualizar referencia cuando el componente se monta
  useEffect(() => {
    // Buscar el elemento code dentro del NodeViewContent
    const findCodeElement = () => {
      // Primero intentar con contentRef
      if (contentRef.current) {
        const codeEl = contentRef.current.querySelector('code') || contentRef.current;
        if (codeEl && codeEl !== contentRef.current) {
          // Guardar el elemento original en una variable temporal
          const originalRef = contentRef.current;
          // Actualizar la referencia
          contentRef.current = codeEl;
          console.log('Elemento code encontrado en contentRef');
        }
      }
      
      // Si contentRef no está disponible, intentar con wrapperRef
      if (!contentRef.current && wrapperRef.current) {
        const codeEl = wrapperRef.current.querySelector('code');
        if (codeEl) {
          // Usar una variable para mantener la referencia
          // No podemos cambiar contentRef directamente, pero podemos usar el elemento encontrado
          console.log('Elemento code encontrado en wrapperRef');
        }
      }
    };
    
    // Intentar encontrar el elemento múltiples veces
    const timeout1 = setTimeout(findCodeElement, 0);
    const timeout2 = setTimeout(findCodeElement, 100);
    const timeout3 = setTimeout(findCodeElement, 300);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, []);

  return (
    <NodeViewWrapper 
      ref={wrapperRef}
      className="code-block-wrapper relative" 
      as="pre" 
      style={{ position: 'relative' }}
    >
      <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto relative max-h-[600px]" style={{ position: 'relative' }}>
        <NodeViewContent 
          ref={contentRef}
          as="code" 
          className={`language-${language}`}
          style={{ 
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            color: '#e5e7eb',
            background: 'transparent',
            padding: 0,
            margin: 0,
            outline: 'none',
            display: 'block',
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
          }}
        />
        {shouldShowButton && (
          <div className="absolute top-2 right-2 flex gap-2" style={{ 
            zIndex: isInModal ? 10002 : 110 // Mayor z-index cuando está en el Portal
          }}>
            <button
              onClick={handleFullscreen}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
              title="Pantalla completa"
              type="button"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            {language === 'json' && (
              <button
                onClick={handleFormat}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
                title="Formatear JSON"
                type="button"
              >
                <Code2 className="w-3 h-3" />
                <span>Formatear</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-1 text-xs"
              title="Copiar código"
              type="button"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      {isFullscreen && createPortal(
        <div 
          className="fixed inset-0 z-[10001] bg-gray-900 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
            }
          }}
        >
          {/* Header con botones */}
          <div className="flex flex-col bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between p-4">
              <h2 className="text-white text-lg font-semibold">
                {language ? `${language.toUpperCase()} - Pantalla Completa` : 'Código - Pantalla Completa'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSearch(!showSearch);
                    if (!showSearch && searchInputRef.current) {
                      setTimeout(() => searchInputRef.current?.focus(), 0);
                    }
                  }}
                  className={`px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2 ${showSearch ? 'bg-blue-600' : ''}`}
                  title="Buscar en código"
                  type="button"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
                {language === 'json' && (
                  <button
                    onClick={handleFormat}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                    title="Formatear JSON"
                    type="button"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Formatear</span>
                  </button>
                )}
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(fullscreenContent || getCodeText());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Error al copiar:', err);
                  }
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                title="Copiar código"
                type="button"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (editor && fullscreenContent !== getCodeText()) {
                    updateEditorContent(fullscreenContent);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-2"
                title="Guardar cambios"
                type="button"
              >
                <Check className="w-4 h-4" />
                <span>Guardar</span>
              </button>
              <button
                onClick={handleExitFullscreen}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                title="Salir de pantalla completa"
                type="button"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Salir</span>
              </button>
              </div>
            </div>
            {/* Barra de búsqueda en fullscreen */}
            {showSearch && (
              <div className="px-4 py-3 bg-gray-750 border-b border-gray-700 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar en código..."
                className="flex-1 bg-gray-900 text-gray-100 border border-gray-600 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    clearSearch();
                  } else if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    goToPreviousResult();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    goToNextResult();
                  }
                }}
              />
              {searchTerm && (
                <>
                  <span className="text-sm text-gray-400 flex-shrink-0">
                    {searchResults.length > 0 
                      ? `${currentResultIndex + 1} / ${searchResults.length}`
                      : '0 resultados'}
                  </span>
                  <button
                    onClick={goToPreviousResult}
                    disabled={searchResults.length === 0}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Resultado anterior (Shift+Enter)"
                    type="button"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNextResult}
                    disabled={searchResults.length === 0}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Siguiente resultado (Enter)"
                    type="button"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearSearch}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                    title="Cerrar búsqueda (Esc)"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              </div>
            )}
          </div>
          
          {/* Contenido del código editable */}
          <div className="flex-1 overflow-auto p-6">
            <textarea
              ref={fullscreenRef}
              value={fullscreenContent || getCodeText()}
              onChange={handleFullscreenContentChange}
              className="w-full h-full bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-base resize-none border-none outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                lineHeight: '1.6',
                color: '#e5e7eb',
                whiteSpace: 'pre',
                wordBreak: 'normal',
                overflowWrap: 'normal',
                tabSize: 2,
              }}
              spellCheck={false}
                placeholder={`Escribe o pega tu código ${language ? language.toUpperCase() : ''} aquí...`}
            />
          </div>
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
}

