import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Componente de navegación rápida que permite desplazarse por la página
 * con botones arriba/abajo. Se posiciona de forma flotante siguiendo el viewport.
 */
export default function QuickScrollNavigation({ containerRef = null }) {
  const [isVisible, setIsVisible] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const navRef = useRef(null);
  const timeoutRef = useRef(null);

  // Obtener el contenedor de scroll (el contenedor proporcionado o el body)
  const getScrollContainer = () => {
    if (containerRef?.current) {
      return containerRef.current;
    }
    // Si no hay contenedor específico, buscar el contenedor con scroll más cercano
    const body = document.body;
    const html = document.documentElement;
    // Preferir body si tiene scroll, sino html
    return (body.scrollHeight > body.clientHeight) ? body : html;
  };

  // Calcular si se puede hacer scroll
  const canScroll = () => {
    const container = getScrollContainer();
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    return scrollHeight > clientHeight;
  };

  // Verificar si se puede hacer scroll y mostrar/ocultar botones
  useEffect(() => {
    const checkScroll = () => {
      if (canScroll()) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkScroll();
    const container = getScrollContainer();
    
    // Escuchar cambios en el scroll y resize
    const handleScroll = () => {
      checkScroll();
      // Mostrar botones temporalmente al hacer scroll
      setShowButtons(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShowButtons(false);
      }, 2000);
    };

    const handleResize = () => {
      checkScroll();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    // Verificar periódicamente (por si el contenido cambia)
    const interval = setInterval(checkScroll, 1000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef]);

  // Scroll hacia arriba
  const scrollUp = useCallback(() => {
    const container = getScrollContainer();
    if (!container) return;
    
    const viewportHeight = container.clientHeight || window.innerHeight;
    const currentScroll = container.scrollTop || window.pageYOffset || 0;
    
    // Calcular nueva posición: una página hacia arriba (80% del viewport) o hasta arriba
    const scrollAmount = viewportHeight * 0.8;
    const newScroll = Math.max(0, currentScroll - scrollAmount);
    
    container.scrollTo({
      top: newScroll,
      behavior: 'smooth'
    });
  }, []);

  // Scroll hacia abajo
  const scrollDown = useCallback(() => {
    const container = getScrollContainer();
    if (!container) return;
    
    const viewportHeight = container.clientHeight || window.innerHeight;
    const scrollHeight = container.scrollHeight;
    const currentScroll = container.scrollTop || window.pageYOffset || 0;
    const maxScroll = Math.max(0, scrollHeight - viewportHeight);
    
    // Calcular nueva posición: una página hacia abajo (80% del viewport) o hasta abajo
    const scrollAmount = viewportHeight * 0.8;
    const newScroll = Math.min(maxScroll, currentScroll + scrollAmount);
    
    container.scrollTo({
      top: newScroll,
      behavior: 'smooth'
    });
  }, []);

  // Manejar teclado (flechas arriba/abajo cuando el componente está visible)
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      // Solo activar si no hay un input/textarea/editor con focus
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                             activeElement?.tagName === 'TEXTAREA' ||
                             activeElement?.contentEditable === 'true' ||
                             activeElement?.closest('[contenteditable="true"]');
      
      if (isInputFocused) return;

      // Verificar si se presionan las flechas con Ctrl/Cmd para navegación rápida
      if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          scrollUp();
        } else {
          scrollDown();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, scrollUp, scrollDown]);

  if (!isVisible) return null;

  return (
    <div
      ref={navRef}
      className={`fixed right-4 z-[40000] transition-all duration-300 ${
        showButtons ? 'opacity-100' : 'opacity-30 hover:opacity-100'
      }`}
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
      }}
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setShowButtons(false);
        }, 2000);
      }}
    >
      <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1">
        <button
          onClick={scrollUp}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors group"
          title="Desplazar hacia arriba (Ctrl+↑)"
          aria-label="Desplazar hacia arriba"
        >
          <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
        </button>
        <button
          onClick={scrollDown}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors group"
          title="Desplazar hacia abajo (Ctrl+↓)"
          aria-label="Desplazar hacia abajo"
        >
          <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
        </button>
      </div>
    </div>
  );
}

