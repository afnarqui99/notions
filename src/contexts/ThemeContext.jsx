import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Función para obtener tema inicial (síncrona)
  const getInitialTheme = () => {
    // Aplicar inmediatamente antes de cualquier render
    const root = document.documentElement;
    
    // Cargar tema desde localStorage
    try {
      const savedTheme = localStorage.getItem('notion-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        // Aplicar inmediatamente
        if (savedTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        return savedTheme;
      }
    } catch (error) {
      // Error al cargar, usar tema por defecto
    }
    
    // Detectar preferencia del sistema
    let initialTheme = 'light';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initialTheme = 'dark';
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    return initialTheme;
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Aplicar tema al documento (esto se ejecuta en cada cambio)
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    
    // Forzar re-render para asegurar que Tailwind detecte el cambio
    // Esto es necesario porque a veces Tailwind no detecta cambios dinámicos
    root.style.display = 'none';
    root.offsetHeight; // Trigger reflow
    root.style.display = '';
    
    // Guardar preferencia
    try {
      localStorage.setItem('notion-theme', theme);
    } catch (error) {
      // Error al guardar
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLightTheme = () => {
    setTheme('light');
  };

  const setDarkTheme = () => {
    setTheme('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setLightTheme, setDarkTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

