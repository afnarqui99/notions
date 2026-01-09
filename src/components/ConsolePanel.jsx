import { useState, useEffect, useRef } from 'react';
import { X, Play, Maximize2, Minimize2, FolderOpen, Terminal, Settings, BookOpen, Eye, Code, Sidebar, Info, CheckCircle, AlertCircle, FilePlus, Sparkles, Copy, Check, Layout, Split } from 'lucide-react';
import cursosService from '../services/CursosService';
import codeIntelligenceService from '../services/CodeIntelligenceService';
import hljs from 'highlight.js';
// Importar estilos de highlight.js - Tema oscuro tipo VS Code
import 'highlight.js/styles/vs2015.css';
import FileExplorer from './FileExplorer';
import ConsolePluginsModal from './ConsolePluginsModal';

export default function ConsolePanel({ isOpen, onClose, editor = null }) {
  // Debug: verificar si el componente se está renderizando
  useEffect(() => {
    console.log('ConsolePanel renderizado, isOpen:', isOpen);
  }, [isOpen]);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [language, setLanguage] = useState('nodejs'); // 'nodejs' o 'python'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [projectPath, setProjectPath] = useState('');
  const [isExecutingProject, setIsExecutingProject] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [previewMode, setPreviewMode] = useState('code'); // 'code', 'preview', 'split'
  const [previewContent, setPreviewContent] = useState('');
  const [isHTMLCode, setIsHTMLCode] = useState(false);
  const [codeAreaHeight, setCodeAreaHeight] = useState(50); // Porcentaje de altura para el área de código
  const [previewSplitWidth, setPreviewSplitWidth] = useState(50); // Porcentaje de ancho para split view
  const [isResizing, setIsResizing] = useState(false);
  const [isResizingPreview, setIsResizingPreview] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [explorerProjectPath, setExplorerProjectPath] = useState('');
  const [projectHandle, setProjectHandle] = useState(null); // Handle del proyecto para navegador
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [detectedProjectType, setDetectedProjectType] = useState(null);
  const [showBrowserModeInfo, setShowBrowserModeInfo] = useState(false);
  const [showPluginsModal, setShowPluginsModal] = useState(false);
  const [plugins, setPlugins] = useState({
    autocomplete: true,
    snippets: true,
    syntaxValidation: true,
    codeFormatting: false,
    linting: false
  });
  const [syntaxErrors, setSyntaxErrors] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [completionIndex, setCompletionIndex] = useState(-1);
  const [copied, setCopied] = useState(false);
  const outputRef = useRef(null);
  const codeTextareaRef = useRef(null);
  const codeHighlightRef = useRef(null);
  const previewIframeRef = useRef(null);
  const resizeRef = useRef(null);

  // Auto-scroll en la salida
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Enfocar el textarea cuando se abre
  useEffect(() => {
    if (isOpen && codeTextareaRef.current) {
      setTimeout(() => {
        codeTextareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Cerrar menú de proyecto cuando se cierra el panel
  useEffect(() => {
    if (!isOpen) {
      setShowProjectMenu(false);
    }
  }, [isOpen]);

  // Cerrar menú de proyecto al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProjectMenu && !event.target.closest('.relative')) {
        setShowProjectMenu(false);
      }
    };

    if (showProjectMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProjectMenu]);

  // Mapeo de lenguajes a highlight.js
  const getHighlightLanguage = (lang) => {
    const langMap = {
      'nodejs': 'javascript',
      'python': 'python',
      'dotnet': 'csharp',
      'java': 'java',
      'sqlite': 'sql'
    };
    return langMap[lang] || 'javascript';
  };

  // Aplicar resaltado de sintaxis
  useEffect(() => {
    if (codeHighlightRef.current && code.trim()) {
      const lang = getHighlightLanguage(language);
      try {
        const highlighted = hljs.highlight(code, { language: lang }).value;
        codeHighlightRef.current.innerHTML = highlighted;
        // Hacer el texto del pre transparente para que solo se vea el resaltado de colores
        if (codeHighlightRef.current) {
          codeHighlightRef.current.style.color = 'transparent';
          codeHighlightRef.current.style.WebkitTextFillColor = 'transparent';
        }
      } catch (err) {
        // Si falla el resaltado, mostrar el código sin resaltar (escapar HTML)
        codeHighlightRef.current.textContent = code;
        if (codeHighlightRef.current.style) {
          codeHighlightRef.current.style.color = 'transparent';
          codeHighlightRef.current.style.WebkitTextFillColor = 'transparent';
        }
      }
    } else if (codeHighlightRef.current) {
      codeHighlightRef.current.textContent = '';
      if (codeHighlightRef.current.style) {
        codeHighlightRef.current.style.color = 'transparent';
        codeHighlightRef.current.style.WebkitTextFillColor = 'transparent';
      }
    }
  }, [code, language]);

  // Inyectar estilos CSS para el resaltado de sintaxis
  useEffect(() => {
    const styleId = 'console-syntax-highlight-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Ajustes para el resaltado de sintaxis en la consola - Mismo estilo que la salida */
        .console-code-highlight {
          background: #111827 !important; /* bg-gray-900 - mismo que la salida */
        }
        .console-code-highlight pre {
          margin: 0;
          padding: 0;
          background: #111827 !important;
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        .console-code-highlight pre code {
          background: #111827 !important;
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        /* Asegurar que el texto resaltado sea visible solo por los colores */
        .console-code-highlight .hljs {
          background: #111827 !important;
        }
        /* El texto base debe ser transparente, pero los spans de highlight.js mantienen sus colores */
        .console-code-highlight pre,
        .console-code-highlight pre code {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
        /* Los elementos span de highlight.js deben mantener sus colores para el resaltado */
        .console-code-highlight .hljs span {
          color: inherit !important;
          -webkit-text-fill-color: inherit !important;
        }
        /* Editor de código visible - mismo estilo que la salida */
        .console-code-editor {
          background: transparent !important;
          color: #4ade80 !important; /* text-green-400 - mismo que la salida */
          -webkit-text-fill-color: #4ade80 !important;
        }
        .console-code-editor::placeholder {
          color: #6a9955 !important; /* Color de placeholder verde oscuro */
          -webkit-text-fill-color: #6a9955 !important;
        }
        /* Modo oscuro - ajustar colores si es necesario */
        .dark .console-code-highlight .hljs {
          background: #111827 !important;
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Sincronizar scroll entre textarea y highlight
  const handleCodeScroll = () => {
    if (codeTextareaRef.current && codeHighlightRef.current) {
      codeHighlightRef.current.scrollTop = codeTextareaRef.current.scrollTop;
      codeHighlightRef.current.scrollLeft = codeTextareaRef.current.scrollLeft;
    }
  };

  // Función para obtener el placeholder según el lenguaje
  const getPlaceholderText = () => {
    switch (language) {
      case 'nodejs':
        return 'Escribe tu código JavaScript/Node.js aquí...\n\nEjemplo:\nconsole.log("Hola desde Node.js!");\nconst sum = (a, b) => a + b;\nconsole.log(sum(2, 3));';
      case 'python':
        return 'Escribe tu código Python aquí...\n\nEjemplo:\nprint("Hola desde Python!")\nsum = lambda a, b: a + b\nprint(sum(2, 3))';
      case 'dotnet':
        return 'Escribe tu código C# aquí...\n\nEjemplo:\nConsole.WriteLine("Hola desde C#!");\nint sum(int a, int b) => a + b;\nConsole.WriteLine(sum(2, 3));';
      case 'java':
        return 'Escribe tu código Java aquí...\n\nEjemplo:\nSystem.out.println("Hola desde Java!");\nint sum = 2 + 3;\nSystem.out.println(sum);';
      case 'sqlite':
        return 'Escribe tus consultas SQL aquí...\n\nEjemplo:\nSELECT * FROM usuarios;\nCREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT);';
      default:
        return 'Escribe tu código aquí...';
    }
  };

  // Detectar si el código es HTML/CSS/React
  useEffect(() => {
    const codigo = code.trim().toLowerCase();
    const esHTML = codigo.includes('<!doctype html') || 
                   codigo.includes('<html') || 
                   codigo.includes('<div') || 
                   codigo.includes('<body') ||
                   codigo.includes('react') ||
                   codigo.includes('jsx') ||
                   (codigo.includes('<style') || codigo.includes('<script'));
    setIsHTMLCode(esHTML);
  }, [code]);

  // Actualizar preview cuando cambia el código
  const actualizarPreview = () => {
    if (!code.trim()) {
      setPreviewContent('');
      return;
    }

    let contenido = code;
    
    // Si no tiene estructura HTML completa, envolverlo
    if (!code.includes('<!DOCTYPE') && !code.includes('<html')) {
      // Detectar si tiene <style> o <script>
      const tieneStyle = code.includes('<style');
      const tieneScript = code.includes('<script');
      
      if (tieneStyle || tieneScript || code.includes('<div') || code.includes('<p') || code.includes('<h1')) {
        contenido = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
${code}
</body>
</html>`;
      }
    }
    
    setPreviewContent(contenido);
    
    // Actualizar iframe
    if (previewIframeRef.current) {
      const iframe = previewIframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(contenido);
      doc.close();
    }
  };

  // Actualizar preview cuando se muestra o cambia el código (en tiempo real)
  useEffect(() => {
    if ((previewMode === 'preview' || previewMode === 'split') && isHTMLCode && code.trim()) {
      // Delay pequeño para asegurar que el iframe esté listo y evitar actualizaciones excesivas
      const timeoutId = setTimeout(() => {
        actualizarPreview();
      }, 200); // Debounce de 200ms para actualización más rápida en tiempo real
      
      return () => clearTimeout(timeoutId);
    }
  }, [previewMode, isHTMLCode, code]);

  // Autocompletado y cambio de código
  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    
    // Pequeño delay para asegurar que el cursor esté actualizado
    setTimeout(() => {
      if (plugins.autocomplete && codeTextareaRef.current) {
        const cursorPos = codeTextareaRef.current.selectionStart || newCode.length;
        const completions = codeIntelligenceService.getCompletions(newCode, cursorPos, language);
        if (completions.length > 0) {
          setCompletions(completions);
          setShowCompletions(true);
          setCompletionIndex(-1);
        } else {
          setShowCompletions(false);
          setCompletions([]);
        }
      } else {
        setShowCompletions(false);
        setCompletions([]);
      }
    }, 50);
  };

  // Validación de sintaxis en tiempo real
  useEffect(() => {
    if (plugins.syntaxValidation && code.trim()) {
      try {
        const errors = codeIntelligenceService.validateSyntax(code, language);
        setSyntaxErrors(errors);
        // Debug: mostrar errores en consola
        if (errors.length > 0) {
          console.log('Errores de sintaxis detectados:', errors);
        }
      } catch (error) {
        console.error('Error en validación de sintaxis:', error);
        setSyntaxErrors([]);
      }
    } else {
      setSyntaxErrors([]);
    }
  }, [code, language, plugins.syntaxValidation]);

  // Cargar plugins guardados al montar
  useEffect(() => {
    const savedPlugins = localStorage.getItem('console-plugins');
    if (savedPlugins) {
      try {
        const parsed = JSON.parse(savedPlugins);
        setPlugins(parsed);
        console.log('✅ Plugins cargados desde localStorage:', parsed);
      } catch (e) {
        console.error('❌ Error al cargar plugins:', e);
      }
    } else {
      console.log('ℹ️ No hay plugins guardados, usando valores por defecto');
      // Guardar los valores por defecto
      const defaultPlugins = {
        autocomplete: true,
        snippets: true,
        syntaxValidation: true,
        codeFormatting: false,
        linting: false
      };
      localStorage.setItem('console-plugins', JSON.stringify(defaultPlugins));
      console.log('💾 Plugins por defecto guardados:', defaultPlugins);
    }
  }, []);
  
  // Debug: mostrar estado de plugins cuando cambian
  useEffect(() => {
    console.log('🔧 Estado actual de plugins:', plugins);
    console.log('🔍 Validación de sintaxis activa:', plugins.syntaxValidation);
    console.log('✨ Autocompletado activo:', plugins.autocomplete);
    console.log('📝 Snippets activo:', plugins.snippets);
  }, [plugins]);

  const executeCode = async () => {
    if (!code.trim()) {
      setOutput('❌ Error: No hay código para ejecutar');
      return;
    }

    // Si es HTML, actualizar preview automáticamente
    if (isHTMLCode && (previewMode === 'preview' || previewMode === 'split')) {
      actualizarPreview();
    }

    // Detectar si el código es parte de un framework/proyecto que requiere ejecución completa
    const codigoLower = code.toLowerCase();
    const codigoTrimmed = code.trim();
    
    // Detección de Angular
    const esAngular = codigoLower.includes('@angular') || 
                     codigoLower.includes('angular/core') ||
                     codigoLower.includes('angular/common') ||
                     codigoLower.includes('angular/platform-browser') ||
                     codigoLower.includes('import {') && (codigoLower.includes('component') || codigoLower.includes('module')) && codigoLower.includes('@angular');
    
    // Detección de React
    const esReact = (codigoLower.includes('import react') || codigoLower.includes('from \'react\'') || codigoLower.includes('from "react"')) ||
                   (codigoLower.includes('jsx') && (codigoLower.includes('import') || codigoLower.includes('export'))) ||
                   codigoLower.includes('react.createelement') ||
                   codigoLower.includes('<') && codigoLower.includes('>') && (codigoLower.includes('function') || codigoLower.includes('const') || codigoLower.includes('class'));
    
    // Detección de .NET Core (C#)
    const esDotNet = language === 'dotnet' || 
                    codigoLower.includes('using system') ||
                    codigoLower.includes('namespace') && codigoLower.includes('{') ||
                    codigoLower.includes('class ') && codigoLower.includes('{') && codigoLower.includes('static void main') ||
                    codigoLower.includes('program.cs') ||
                    codigoTrimmed.startsWith('using ');
    
    // Detección de Java
    const esJava = language === 'java' ||
                  codigoLower.includes('package ') ||
                  codigoLower.includes('public class') ||
                  codigoLower.includes('public static void main') ||
                  codigoLower.includes('import java.') ||
                  codigoLower.includes('system.out.println') ||
                  codigoTrimmed.startsWith('package ') || codigoTrimmed.startsWith('import ');
    
    // Detección de SQL
    const esSQL = language === 'sqlite' ||
                 codigoLower.includes('create table') ||
                 codigoLower.includes('select ') ||
                 codigoLower.includes('insert into') ||
                 codigoLower.includes('update ') ||
                 codigoLower.includes('delete from') ||
                 codigoLower.includes('alter table') ||
                 codigoLower.includes('drop table');
    
    // Detección de Python con imports de proyectos
    const esPythonProyecto = language === 'python' && (
      codigoLower.includes('from ') && codigoLower.includes('import ') ||
      codigoLower.includes('import ') && (codigoLower.includes('django') || codigoLower.includes('flask') || codigoLower.includes('fastapi') || codigoLower.includes('requests') || codigoLower.includes('pandas') || codigoLower.includes('numpy'))
    );
    
    const esProyectoCompleto = esAngular || esReact || esDotNet || esJava || esSQL || esPythonProyecto;

    // Si detectamos un proyecto completo y hay un projectPath configurado, sugerir ejecutar el proyecto
    if (esProyectoCompleto && projectPath && window.electronAPI && window.electronAPI.detectProjectType) {
      try {
        const detection = await window.electronAPI.detectProjectType(projectPath);
        if (detection.type) {
          setOutput(`⚠️ Este código es parte de un proyecto ${detection.type}.\n\n` +
            `Para ejecutar el proyecto completo:\n` +
            `1. Haz clic en el botón de carpeta (📁) en la parte superior\n` +
            `2. Selecciona "Ejecutar Proyecto Completo"\n\n` +
            `Comando sugerido: ${detection.command || 'Ver menú de proyecto'}`);
          setIsExecuting(false);
          return;
        }
      } catch (error) {
        console.error('Error detectando tipo de proyecto:', error);
      }
    }

    // Mensajes específicos por tipo de proyecto sin projectPath
    if (esAngular && !projectPath && language === 'nodejs') {
      setOutput(`⚠️ Este código es de Angular.\n\n` +
        `Los proyectos Angular requieren compilación y no se pueden ejecutar directamente.\n\n` +
        `Para ejecutar un proyecto Angular:\n` +
        `1. Haz clic en el botón de carpeta (📁) en la parte superior\n` +
        `2. Selecciona la carpeta del proyecto Angular (donde está angular.json)\n` +
        `3. Haz clic en "Ejecutar Proyecto Completo"\n\n` +
        `Esto ejecutará: npm start o ng serve`);
      setIsExecuting(false);
      return;
    }

    if (esReact && !projectPath && language === 'nodejs') {
      setOutput(`⚠️ Este código es de React.\n\n` +
        `Los proyectos React requieren compilación y no se pueden ejecutar directamente.\n\n` +
        `Para ejecutar un proyecto React:\n` +
        `1. Haz clic en el botón de carpeta (📁) en la parte superior\n` +
        `2. Selecciona la carpeta del proyecto React (donde está package.json)\n` +
        `3. Haz clic en "Ejecutar Proyecto Completo"\n\n` +
        `Esto ejecutará: npm start o npm run dev`);
      setIsExecuting(false);
      return;
    }

    if (esDotNet && !projectPath) {
      setOutput(`⚠️ Este código es de .NET Core (C#).\n\n` +
        `Los proyectos .NET Core requieren compilación y no se pueden ejecutar directamente.\n\n` +
        `Para ejecutar un proyecto .NET Core:\n` +
        `1. Haz clic en el botón de carpeta (📁) en la parte superior\n` +
        `2. Selecciona la carpeta del proyecto .NET (donde está el archivo .csproj)\n` +
        `3. Haz clic en "Ejecutar Proyecto Completo"\n\n` +
        `Esto ejecutará: dotnet run`);
      setIsExecuting(false);
      return;
    }

    if (esJava && !projectPath) {
      setOutput(`⚠️ Este código es de Java.\n\n` +
        `Los proyectos Java requieren compilación y no se pueden ejecutar directamente.\n\n` +
        `Para ejecutar un proyecto Java:\n` +
        `1. Haz clic en el botón de carpeta (📁) en la parte superior\n` +
        `2. Selecciona la carpeta del proyecto Java (donde está Main.java o pom.xml/build.gradle)\n` +
        `3. Haz clic en "Ejecutar Proyecto Completo"\n\n` +
        `Esto ejecutará: javac + java, mvn exec:java, o gradle run`);
      setIsExecuting(false);
      return;
    }

    // SQL puede ejecutarse directamente si el lenguaje es correcto, así que no bloquear
    // Solo advertir si el lenguaje no es SQLite pero el código es SQL
    if (esSQL && language !== 'sqlite' && !projectPath) {
      setOutput(`⚠️ Este código es SQL pero el lenguaje seleccionado es ${language}.\n\n` +
        `Para ejecutar SQL:\n` +
        `1. Cambia el lenguaje a "SQLite" en el selector de arriba\n` +
        `2. Ejecuta el código SQL directamente\n\n` +
        `Nota: SQLite está disponible directamente desde el editor y puedes ejecutar consultas SQL.`);
      setIsExecuting(false);
      return;
    }

    // Python con frameworks completos (Django/Flask/FastAPI) requiere ejecución de proyecto completo
    if (esPythonProyecto && !projectPath && (codigoLower.includes('django') || codigoLower.includes('flask') || codigoLower.includes('fastapi'))) {
      setOutput(`⚠️ Este código Python parece ser de un framework completo (Django/Flask/FastAPI).\n\n` +
        `Los frameworks Python requieren configuración y ejecución completa del proyecto.\n\n` +
        `Para ejecutar un proyecto Python completo:\n` +
        `1. Haz clic en el botón de carpeta (📁) en la parte superior\n` +
        `2. Selecciona la carpeta del proyecto Python (donde está requirements.txt o main.py)\n` +
        `3. Haz clic en "Ejecutar Proyecto Completo"\n\n` +
        `Esto instalará las dependencias y ejecutará el proyecto correctamente.\n\n` +
        `Nota: Si solo usas bibliotecas simples (requests, pandas, numpy), puedes ejecutar directamente si están instaladas.`);
      setIsExecuting(false);
      return;
    }
    // Si es Python con imports pero no es un framework completo, permitir ejecución (dará error si faltan dependencias)

    setIsExecuting(true);
    setOutput('⏳ Ejecutando código...\n');

    try {
      // Verificar si estamos en Electron
      if (window.electronAPI && window.electronAPI.executeCode) {
        // Verificaciones finales antes de ejecutar (por seguridad, validar todos los tipos de proyectos)
        if (esAngular && language === 'nodejs') {
          setOutput(`❌ Error: Este código es de Angular y no se puede ejecutar directamente.\n\n` +
            `Angular requiere un proceso de compilación y ejecución completo del proyecto.\n\n` +
            `💡 Solución:\n` +
            `${projectPath ? `1. Ya tienes la carpeta del proyecto seleccionada: ${projectPath}\n` : `1. Haz clic en el botón de carpeta (📁) y selecciona la carpeta del proyecto Angular\n`}` +
            `${projectPath ? `2. Usa el botón "Ejecutar Proyecto Completo" en el menú de proyecto\n` : `2. Luego usa el botón "Ejecutar Proyecto Completo"\n`}` +
            `3. Esto ejecutará el proyecto con: npm start o ng serve\n\n` +
            `El proyecto se ejecutará y podrás verlo en tu navegador.`);
          setIsExecuting(false);
          return;
        }
        
        if (esReact && language === 'nodejs') {
          setOutput(`❌ Error: Este código es de React y no se puede ejecutar directamente.\n\n` +
            `React requiere un proceso de compilación (webpack/vite) y no se puede ejecutar directamente.\n\n` +
            `💡 Solución:\n` +
            `${projectPath ? `1. Ya tienes la carpeta del proyecto seleccionada: ${projectPath}\n` : `1. Haz clic en el botón de carpeta (📁) y selecciona la carpeta del proyecto React\n`}` +
            `${projectPath ? `2. Usa el botón "Ejecutar Proyecto Completo" en el menú de proyecto\n` : `2. Luego usa el botón "Ejecutar Proyecto Completo"\n`}` +
            `3. Esto ejecutará el proyecto con: npm start o npm run dev`);
          setIsExecuting(false);
          return;
        }
        
        if (esDotNet && language !== 'dotnet') {
          setOutput(`❌ Error: Este código es de .NET Core (C#) y no se puede ejecutar en modo ${language}.\n\n` +
            `Debes cambiar el lenguaje a ".NET" o ejecutar el proyecto completo.\n\n` +
            `💡 Solución:\n` +
            `${projectPath ? `1. Ya tienes la carpeta del proyecto: ${projectPath}\n` : `1. Haz clic en el botón de carpeta (📁) y selecciona la carpeta del proyecto .NET\n`}` +
            `${projectPath ? `2. Usa el botón "Ejecutar Proyecto Completo" en el menú de proyecto\n` : `2. Cambia el lenguaje a ".NET" o usa "Ejecutar Proyecto Completo"\n`}` +
            `3. Esto ejecutará el proyecto con: dotnet run`);
          setIsExecuting(false);
          return;
        }
        
        if (esJava && language !== 'java') {
          setOutput(`❌ Error: Este código es de Java y no se puede ejecutar en modo ${language}.\n\n` +
            `Debes cambiar el lenguaje a "Java" o ejecutar el proyecto completo.\n\n` +
            `💡 Solución:\n` +
            `${projectPath ? `1. Ya tienes la carpeta del proyecto: ${projectPath}\n` : `1. Haz clic en el botón de carpeta (📁) y selecciona la carpeta del proyecto Java\n`}` +
            `${projectPath ? `2. Usa el botón "Ejecutar Proyecto Completo" en el menú de proyecto\n` : `2. Cambia el lenguaje a "Java" o usa "Ejecutar Proyecto Completo"\n`}` +
            `3. Esto ejecutará el proyecto con: javac + java, mvn exec:java, o gradle run`);
          setIsExecuting(false);
          return;
        }
        
        if (esSQL && language !== 'sqlite') {
          setOutput(`❌ Error: Este código es SQL pero el lenguaje seleccionado es ${language}.\n\n` +
            `Debes cambiar el lenguaje a "SQLite" para ejecutar SQL.\n\n` +
            `💡 Solución:\n` +
            `1. Cambia el lenguaje a "SQLite" en el selector de arriba\n` +
            `2. Ejecuta el código SQL directamente\n\n` +
            `Nota: SQLite está disponible directamente desde el editor y puedes ejecutar consultas SQL sin necesidad de un proyecto completo.`);
          setIsExecuting(false);
          return;
        }
        
        // Si es código con imports de módulos npm (probablemente parte de un proyecto), verificar primero
        if (codigoLower.includes('import') && codigoLower.includes('from') && codigoLower.includes('@') && language === 'nodejs') {
          // Si tiene imports de módulos npm (empiezan con @), no ejecutar directamente
          setOutput(`⚠️ Este código contiene imports de módulos npm (empiezan con @).\n\n` +
            `No se puede ejecutar directamente como código JavaScript.\n\n` +
            `${projectPath ? `Ya tienes la carpeta del proyecto: ${projectPath}\n` : `Selecciona la carpeta del proyecto usando el botón de carpeta (📁)\n`}` +
            `Luego usa "Ejecutar Proyecto Completo" para ejecutar el proyecto correctamente.`);
          setIsExecuting(false);
          return;
        }
        
        // Python con imports puede ejecutarse directamente si las dependencias están instaladas
        // Ya validamos frameworks completos (Django/Flask/FastAPI) antes, así que aquí permitimos ejecución directa
        // Si faltan dependencias, el error se mostrará en la salida
        
        const result = await window.electronAPI.executeCode(code, language);
        setOutput(result.output || result.error || 'Sin salida');
      } else {
        // Si es HTML/CSS, solo mostrar preview, no ejecutar como código
        if (isHTMLCode) {
          setOutput('✅ Código HTML/CSS detectado. Usa los botones de vista para ver el código, la preview o ambos (split view).\n\n' +
            'Nota: Para ejecutar JavaScript dentro del HTML, abre el archivo en un navegador.');
          setIsExecuting(false);
          return;
        }
        
        // Ejecución en navegador (solo JavaScript/Node.js)
        if (language === 'nodejs') {
          // Capturar console.log y otros métodos
          let capturedOutput = '';
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;
          
          const captureOutput = (...args) => {
            capturedOutput += args.map(arg => {
              if (typeof arg === 'function') {
                // Mostrar la definición completa de la función
                return arg.toString();
              } else if (typeof arg === 'object' && arg !== null) {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' ') + '\n';
          };
          
          console.log = captureOutput;
          console.error = captureOutput;
          console.warn = captureOutput;
          console.info = captureOutput;
          
          try {
            // Ejecutar código JavaScript de forma segura
            const result = new Function(code)();
            
            // Restaurar console original
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            
            if (capturedOutput) {
              setOutput(capturedOutput);
            } else if (result !== undefined) {
              setOutput(String(result));
            } else {
              setOutput('✅ Código ejecutado correctamente (sin salida)');
            }
          } catch (error) {
            // Restaurar console original en caso de error
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            console.info = originalInfo;
            
            setOutput(`❌ Error: ${error.message}\n${error.stack || ''}`);
          }
        } else {
          // Python no se puede ejecutar en el navegador
          setOutput('⚠️ Python no se puede ejecutar en el navegador.\n\n' +
            'Para ejecutar Python:\n' +
            '1. Ejecuta la aplicación con Electron: npm run electron:dev\n' +
            '2. O usa la versión compilada de la aplicación\n\n' +
            'Nota: JavaScript/Node.js sí se puede ejecutar en el navegador.');
        }
      }
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeProject = async () => {
    if (!projectPath.trim()) {
      setOutput('❌ Error: Debes especificar una ruta de proyecto');
      return;
    }

    setIsExecutingProject(true);
    setOutput(`⏳ Detectando tipo de proyecto desde: ${projectPath}\n`);

    try {
      if (window.electronAPI && window.electronAPI.executeProject) {
        // Electron: usar API de Electron
        const result = await window.electronAPI.executeProject(projectPath, language);
        
        // Si es un proyecto HTML, mostrar el contenido en el previewer
        if (result.type === 'html' && result.htmlContent) {
          setCode(result.htmlContent);
          setIsHTMLCode(true);
          setPreviewMode('split'); // Mostrar split view por defecto para proyectos HTML
          // actualizarPreview se ejecutará automáticamente cuando cambie el código
          setOutput(result.output || '✅ Proyecto HTML cargado en el previewer');
        } else {
          setOutput(result.output || result.error || 'Sin salida');
        }
      } else {
        // Navegador: detectar tipo de proyecto manualmente
        const projectType = await detectProjectTypeInBrowser(projectPath);
        
        if (projectType === 'html') {
          // Proyecto HTML: puede ejecutarse en el navegador
          try {
            const htmlContent = await loadHTMLProjectInBrowser(projectPath);
            if (htmlContent) {
              setCode(htmlContent);
              setIsHTMLCode(true);
              setPreviewMode('split');
              setOutput('✅ Proyecto HTML cargado en el previewer\n\nEl proyecto HTML se puede ver y editar en tiempo real.');
            } else {
              setOutput('❌ Error: No se pudo cargar el archivo HTML principal del proyecto.');
            }
          } catch (error) {
            setOutput(`❌ Error al cargar proyecto HTML: ${error.message}`);
          }
        } else if (projectType) {
          // Otros tipos de proyectos requieren Electron
          const projectTypeNames = {
            'angular': 'Angular',
            'react': 'React',
            'python': 'Python',
            'dotnet': '.NET Core',
            'java': 'Java',
            'nodejs': 'Node.js'
          };
          
          const projectName = projectTypeNames[projectType] || projectType;
          
          setOutput(`⚠️ Este proyecto es de tipo ${projectName} y requiere Electron para ejecutarse.\n\n` +
            `Los proyectos ${projectName} necesitan:\n` +
            `• Compilación y construcción\n` +
            `• Gestión de dependencias\n` +
            `• Ejecución de procesos del sistema\n\n` +
            `💡 Solución:\n` +
            `1. Ejecuta la aplicación con Electron: npm run electron:dev\n` +
            `2. O instala la versión compilada de la aplicación\n\n` +
            `Nota: Los proyectos HTML sí se pueden ejecutar en el navegador.`);
        } else {
          setOutput('❌ No se pudo detectar el tipo de proyecto.\n\n' +
            'Asegúrate de que la carpeta contenga archivos de configuración válidos (package.json, angular.json, requirements.txt, etc.)');
        }
      }
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setIsExecutingProject(false);
    }
  };

  // Detectar tipo de proyecto en el navegador (usando File System Access API)
  const detectProjectTypeInBrowser = async (projectPath) => {
    try {
      if (!projectHandle || projectHandle.kind !== 'directory') {
        return null;
      }
      
      // Buscar archivos de configuración en el directorio raíz del proyecto
      const configFiles = {
        angularJson: false,
        packageJson: false,
        requirements: false,
        csproj: false,
        mainJava: false,
        pomXml: false,
        buildGradle: false,
        htmlFiles: false
      };
      
      // Leer el directorio raíz
      for await (const [name, handle] of projectHandle.entries()) {
        if (name.startsWith('.')) continue; // Ignorar archivos ocultos
        
        if (name === 'angular.json') configFiles.angularJson = true;
        if (name === 'package.json') configFiles.packageJson = true;
        if (name === 'requirements.txt') configFiles.requirements = true;
        if (name.endsWith('.csproj')) configFiles.csproj = true;
        if (name === 'Main.java') configFiles.mainJava = true;
        if (name === 'pom.xml') configFiles.pomXml = true;
        if (name === 'build.gradle') configFiles.buildGradle = true;
        if (name.endsWith('.html')) configFiles.htmlFiles = true;
      }
      
      // Determinar tipo de proyecto según los archivos encontrados
      if (configFiles.angularJson) return 'angular';
      if (configFiles.packageJson) return 'react'; // Asumir React/Node.js si hay package.json
      if (configFiles.requirements) return 'python';
      if (configFiles.csproj) return 'dotnet';
      if (configFiles.pomXml || configFiles.buildGradle || configFiles.mainJava) return 'java';
      if (configFiles.htmlFiles) return 'html';
      
      return null;
    } catch (error) {
      console.error('Error detectando tipo de proyecto:', error);
      return null;
    }
  };

  // Cargar proyecto HTML en el navegador
  const loadHTMLProjectInBrowser = async (projectPath) => {
    try {
      if (!projectHandle || projectHandle.kind !== 'directory') {
        return null;
      }
      
      let htmlFile = null;
      let htmlHandle = null;
      
      // Buscar index.html primero en la raíz
      try {
        htmlHandle = await projectHandle.getFileHandle('index.html');
        htmlFile = await htmlHandle.getFile();
      } catch (error) {
        // Si no existe index.html, buscar Index.html
        try {
          htmlHandle = await projectHandle.getFileHandle('Index.html');
          htmlFile = await htmlHandle.getFile();
        } catch (error2) {
          // Buscar cualquier archivo HTML en la raíz
          for await (const [name, handle] of projectHandle.entries()) {
            if (name.endsWith('.html') && handle.kind === 'file') {
              htmlHandle = handle;
              htmlFile = await handle.getFile();
              break;
            }
          }
        }
      }
      
      if (htmlFile) {
        const content = await htmlFile.text();
        return content;
      }
      
      // Si no está en la raíz, buscar recursivamente en subcarpetas (solo primer nivel)
      for await (const [name, handle] of projectHandle.entries()) {
        if (handle.kind === 'directory') {
          try {
            // Buscar index.html en esta subcarpeta
            try {
              const subHtmlHandle = await handle.getFileHandle('index.html');
              const subHtmlFile = await subHtmlHandle.getFile();
              const content = await subHtmlFile.text();
              return content;
            } catch (error) {
              // Si no hay index.html, buscar cualquier HTML
              for await (const [subName, subHandle] of handle.entries()) {
                if (subName.endsWith('.html') && subHandle.kind === 'file') {
                  const subHtmlFile = await subHandle.getFile();
                  const content = await subHtmlFile.text();
                  return content;
                }
              }
            }
          } catch (error) {
            // Continuar buscando en otras carpetas
            console.error('Error buscando HTML en subcarpeta:', error);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error cargando proyecto HTML:', error);
      return null;
    }
  };

  const selectProjectPath = async () => {
    try {
      if (window.electronAPI && window.electronAPI.selectDirectory) {
        const selectedPath = await window.electronAPI.selectDirectory();
        if (selectedPath) {
          setProjectPath(selectedPath);
          setExplorerProjectPath(selectedPath);
          setDetectedProjectType(null);
          
          // Detectar tipo de proyecto
          if (window.electronAPI.detectProjectType) {
            try {
              const detection = await window.electronAPI.detectProjectType(selectedPath);
              if (detection.type) {
                setDetectedProjectType(detection);
              } else {
                setDetectedProjectType({ error: detection.error || 'No se pudo detectar el tipo de proyecto' });
              }
            } catch (error) {
              console.error('Error detectando tipo de proyecto:', error);
            }
          }
        }
      } else {
        alert('Esta funcionalidad solo está disponible en la versión Electron de la aplicación.\n\nPor favor, ejecuta: npm run electron:dev');
      }
    } catch (error) {
      console.error('Error seleccionando directorio:', error);
      alert('Error al seleccionar carpeta: ' + error.message);
    }
  };

  // Cargar un curso específico en el explorador
  const loadCourse = async (nombreCurso, nombreDisplay) => {
    try {
      setOutput(`⏳ Cargando curso: ${nombreDisplay}...\n`);
      
      if (window.electronAPI && window.electronAPI.getCursosPath) {
        // Electron: obtener ruta del curso
        const cursosPath = await window.electronAPI.getCursosPath();
        let cursoPath = `${cursosPath}\\${nombreCurso}`;
        
        // Verificar si existe en cursos incluidos
        if (window.electronAPI.pathExists) {
          const existeIncluido = await window.electronAPI.pathExists(cursoPath);
          
          if (!existeIncluido) {
            // Intentar con cursos externos
            const cursosExternos = cursosService.getCursosExternosPath();
            if (cursosExternos) {
              const cursoExternoPath = `${cursosExternos}\\${nombreCurso}`;
              const existeExterno = await window.electronAPI.pathExists(cursoExternoPath);
              if (existeExterno) {
                cursoPath = cursoExternoPath;
              } else {
                setOutput(`❌ No se encontró el curso "${nombreDisplay}" en ninguna ubicación.\n\n` +
                  `Buscado en:\n` +
                  `• ${cursoPath}\n` +
                  `• ${cursoExternoPath}`);
                return;
              }
            } else {
              setOutput(`❌ No se encontró el curso "${nombreDisplay}" en: ${cursoPath}`);
              return;
            }
          }
        }
        
        // Establecer la ruta del proyecto
        setProjectPath(cursoPath);
        setExplorerProjectPath(cursoPath);
        
        // Abrir el explorador automáticamente
        setShowFileExplorer(true);
        
        // Detectar tipo de proyecto si es posible
        if (window.electronAPI.detectProjectType) {
          try {
            const detection = await window.electronAPI.detectProjectType(cursoPath);
            if (detection.type) {
              setDetectedProjectType(detection);
            }
          } catch (error) {
            console.error('Error detectando tipo de proyecto:', error);
          }
        }
        
        setOutput(`✅ Curso "${nombreDisplay}" cargado en el explorador de archivos.\n\n` +
          `El curso está listo para estudiar. Haz clic en los archivos del sidebar para abrirlos.`);
      } else {
        // Navegador: mostrar instrucciones
        setOutput(`⚠️ En el navegador, necesitas seleccionar la carpeta manualmente.\n\n` +
          `Por favor, selecciona la carpeta del curso "${nombreDisplay}" usando el botón de carpeta (📁) en el sidebar.\n\n` +
          `El curso debería estar en: cursos/${nombreCurso}`);
        
        // Abrir el explorador para que el usuario seleccione la carpeta
        setShowFileExplorer(true);
      }
    } catch (error) {
      console.error('Error cargando curso:', error);
      setOutput(`❌ Error al cargar el curso "${nombreDisplay}": ${error.message}`);
    }
  };

  // Manejar teclas para autocompletado y plugins
  const handleKeyDownWithPlugins = (e) => {
    // Si hay autocompletado activo
    if (showCompletions && completions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCompletionIndex(prev => (prev < completions.length - 1 ? prev + 1 : prev));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCompletionIndex(prev => (prev > 0 ? prev - 1 : -1));
        return;
      }
      if (e.key === 'Enter' && completionIndex >= 0) {
        e.preventDefault();
        const selected = completions[completionIndex];
        if (selected.snippet) {
          const expanded = codeIntelligenceService.expandSnippet(selected.snippet);
          const lines = code.split('\n');
          const currentLine = lines[lines.length - 1] || '';
          const beforeCursor = codeTextareaRef.current?.selectionStart || 0;
          const lineStart = code.lastIndexOf('\n', beforeCursor - 1) + 1;
          const wordMatch = currentLine.match(/(\w+)$/);
          if (wordMatch) {
            const newCode = code.substring(0, lineStart + currentLine.length - wordMatch[1].length) + 
                          expanded + 
                          code.substring(lineStart + currentLine.length);
            setCode(newCode);
            setShowCompletions(false);
          }
        } else {
          const lines = code.split('\n');
          const currentLine = lines[lines.length - 1] || '';
          const wordMatch = currentLine.match(/(\w+)$/);
          if (wordMatch) {
            const newCode = code.replace(new RegExp(`\\b${wordMatch[1]}\\b$`, 'm'), selected.label);
            setCode(newCode);
            setShowCompletions(false);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowCompletions(false);
        return;
      }
    }

    // Snippets: detectar prefijos con Tab
    if (plugins.snippets && e.key === 'Tab' && !e.shiftKey) {
      const lines = code.split('\n');
      const currentLine = lines[lines.length - 1] || '';
      const wordMatch = currentLine.match(/(\w+)$/);
      if (wordMatch) {
        const prefix = wordMatch[1];
        const snippets = codeIntelligenceService.getSnippets(language);
        const snippet = Object.values(snippets).find(s => s.prefix === prefix);
        if (snippet) {
          e.preventDefault();
          const expanded = codeIntelligenceService.expandSnippet(snippet);
          const newCode = code.replace(new RegExp(`\\b${prefix}\\b$`, 'm'), expanded);
          setCode(newCode);
          return;
        }
      }
    }

    // Formateo automático (Ctrl+Shift+F)
    if (plugins.codeFormatting && e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      const formatted = codeIntelligenceService.formatCode(code, language);
      setCode(formatted);
      return;
    }

    // Ctrl+Enter para ejecutar código
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      executeCode();
      return;
    }

    // Escape para cerrar (solo si no está en fullscreen y no hay autocompletado)
    if (e.key === 'Escape' && !isFullscreen && !showCompletions) {
      onClose();
      return;
    }
  };

  const handleKeyDown = handleKeyDownWithPlugins;

  // Manejar redimensionamiento
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !resizeRef.current) return;

      // Buscar el contenedor padre que tiene flex-1 (el contenedor principal)
      let container = resizeRef.current.parentElement;
      while (container && !container.classList.contains('flex-1')) {
        container = container.parentElement;
      }
      
      if (!container) {
        // Fallback: buscar cualquier contenedor con flex-col
        container = resizeRef.current.closest('.flex-col');
      }
      
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const mouseY = e.clientY - containerRect.top;
      const newHeightPercent = (mouseY / containerHeight) * 100;

      // Limitar entre 20% y 80%
      const clampedHeight = Math.max(20, Math.min(80, newHeightPercent));
      setCodeAreaHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Manejar redimensionamiento del divisor horizontal de código/preview en split view
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingPreview) return;

      // Buscar el contenedor del split view
      const splitContainer = document.querySelector('[data-split-container]');
      if (splitContainer) {
        const containerRect = splitContainer.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setPreviewSplitWidth(Math.max(20, Math.min(80, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingPreview(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizingPreview) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingPreview]);

  if (!isOpen) return null;

  // Verificar si estamos en Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI && window.electronAPI.executeCode;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 z-[60000] flex items-center justify-center p-4 ${
        isFullscreen ? '' : ''
      }`}
      style={{ zIndex: 60000 }}
      onClick={(e) => {
        // Solo cerrar si se hace clic en el backdrop, no en el contenido
        if (!isFullscreen && e.target === e.currentTarget) {
          onClose();
          setShowProjectMenu(false);
        }
      }}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transition-all ${
          isFullscreen 
            ? 'w-full h-full max-w-none max-h-none rounded-none' 
            : 'w-full max-w-6xl h-[95vh] max-h-[95vh]'
        } overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            {/* Botón para insertar consola en la página */}
            {editor && (
              <>
                <button
                  onClick={() => {
                    if (editor) {
                      // Insertar bloque de consola en la página
                      editor.chain().focus().insertContent({
                        type: 'consoleBlock',
                        attrs: {
                          code: code,
                          language: language,
                          output: output,
                        },
                      }).run();
                      // Cerrar el modal después de insertar
                      onClose();
                    }
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-xs flex items-center gap-1"
                  title="Insertar consola en la página (se guarda en el documento)"
                >
                  <FilePlus className="w-3 h-3" />
                  Insertar en página
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              </>
            )}
            {/* Selector de lenguaje y botón ejecutar */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="nodejs">Node.js</option>
              <option value="python">Python</option>
              <option value="dotnet">.NET</option>
              <option value="java">Java</option>
              <option value="sqlite">SQLite</option>
            </select>
            <button
              onClick={executeCode}
              disabled={isExecuting || !code.trim() || (!isElectron && (language === 'python' || language === 'dotnet' || language === 'java' || language === 'sqlite'))}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors text-xs flex items-center gap-1"
              title={!isElectron && (language === 'python' || language === 'dotnet' || language === 'java' || language === 'sqlite') ? `${language} solo disponible en Electron` : 'Ejecutar código (Ctrl+Enter)'}
            >
              <Play className="w-3 h-3" />
              {isExecuting ? '...' : 'Ejecutar'}
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            {!isElectron && (
              <div className="relative">
                <button
                  onClick={() => setShowBrowserModeInfo(!showBrowserModeInfo)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Información sobre modo navegador"
                >
                  <Info className="w-5 h-5" />
                </button>
                {showBrowserModeInfo && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      💡 Modo Navegador
                    </h4>
                    <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                      <p>Puedes ejecutar código <strong>JavaScript</strong> aquí mismo.</p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>JavaScript funciona en el navegador</li>
                        <li>Python requiere Electron (usa <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">npm run electron:dev</code>)</li>
                        <li>Los proyectos completos requieren Electron</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              className={`p-2 transition-colors ${
                showFileExplorer 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              title="Explorador de archivos"
            >
              <Sidebar className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowProjectMenu(!showProjectMenu);
                  setShowHelp(false);
                }}
                className={`p-2 transition-colors ${
                  showProjectMenu 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Ejecutar proyecto completo"
              >
                <FolderOpen className="w-5 h-5" />
              </button>
              {showProjectMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Ejecutar Proyecto Completo
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={projectPath}
                          onChange={async (e) => {
                            const newPath = e.target.value;
                            setProjectPath(newPath);
                            setDetectedProjectType(null);
                            
                            // Detectar tipo de proyecto cuando se escribe una ruta
                            if (newPath.trim() && window.electronAPI && window.electronAPI.detectProjectType) {
                              try {
                                const detection = await window.electronAPI.detectProjectType(newPath.trim());
                                if (detection.type) {
                                  setDetectedProjectType(detection);
                                } else if (detection.error && !detection.error.includes('no existe')) {
                                  setDetectedProjectType({ error: detection.error });
                                }
                              } catch (error) {
                                // Ignorar errores silenciosamente si la ruta no existe aún
                              }
                            }
                          }}
                          placeholder="Ruta del proyecto"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          readOnly
                        />
                        <button
                          onClick={async () => {
                            await selectProjectPath();
                            setShowProjectMenu(false);
                          }}
                          disabled={!isElectron}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                          title={!isElectron ? 'Solo disponible en Electron' : 'Abrir diálogo para seleccionar carpeta'}
                        >
                          <FolderOpen className="w-4 h-4" />
                          Buscar
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            executeProject();
                            setShowProjectMenu(false);
                          }}
                          disabled={isExecutingProject || !projectPath.trim() || !isElectron}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                          title={!isElectron ? 'Solo disponible en Electron' : ''}
                        >
                          {isExecutingProject ? 'Ejecutando...' : 'Ejecutar Proyecto'}
                        </button>
                        <button
                          onClick={() => {
                            executeProject();
                            setShowProjectMenu(false);
                          }}
                          disabled={isExecutingProject || !projectPath.trim() || !isElectron}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                          title={!isElectron ? 'Solo disponible en Electron' : ''}
                        >
                          {isExecutingProject ? 'Ejecutando...' : 'Ejecutar'}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        {detectedProjectType && detectedProjectType.type ? (
                          <div className="relative group">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                              title="Ver detalles del proyecto detectado"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Proyecto: {detectedProjectType.type}</span>
                            </button>
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              <p className="text-xs text-green-800 dark:text-green-200">
                                <strong>✓ Proyecto detectado:</strong> {detectedProjectType.type}
                                {detectedProjectType.command && (
                                  <span className="block mt-1 text-green-600 dark:text-green-400">
                                    Comando: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{detectedProjectType.command}</code>
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ) : detectedProjectType && detectedProjectType.error ? (
                          <div className="relative group">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                              title="Ver error de detección"
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>Error de detección</span>
                            </button>
                            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                ⚠️ {detectedProjectType.error}
                              </p>
                            </div>
                          </div>
                        ) : projectPath ? (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Selecciona la carpeta del proyecto. Se detectará automáticamente si es React, Angular, Python, .NET, Java, etc."
                          >
                            <Info className="w-3 h-3" />
                            <span>Ayuda</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Selecciona la carpeta raíz de tu proyecto (donde está package.json, angular.json, requirements.txt, etc.)"
                          >
                            <Info className="w-3 h-3" />
                            <span>Ayuda</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setShowPluginsModal(true);
                  setShowHelp(false);
                  setShowProjectMenu(false);
                }}
                className={`p-2 transition-colors ${
                  plugins.autocomplete || plugins.snippets || plugins.syntaxValidation
                    ? 'text-purple-600 dark:text-purple-400' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title="Plugins de Inteligencia de Código (VS Code)"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => {
                setShowHelp(true);
                setShowProjectMenu(false);
              }}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Ayuda y ejemplos"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          {showFileExplorer && (
            <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 h-full">
              <FileExplorer
                isOpen={showFileExplorer}
                onClose={() => setShowFileExplorer(false)}
                projectPath={explorerProjectPath}
                onFileSelect={async (filePath, content) => {
                  setCode(content);
                  
                  // Detectar si el archivo pertenece a un proyecto Angular/React
                  // Extraer el directorio del proyecto desde la ruta del archivo
                  const pathParts = filePath.split(/[/\\]/);
                  let projectDir = pathParts.slice(0, -1).join(/[/\\]/.test(filePath) ? (filePath.includes('/') ? '/' : '\\') : '/');
                  
                  // Intentar detectar el directorio raíz del proyecto (donde está package.json o angular.json)
                  if (window.electronAPI && window.electronAPI.detectProjectType) {
                    // Buscar desde el directorio del archivo hacia arriba hasta encontrar un proyecto
                    let currentDir = projectDir;
                    let found = false;
                    for (let i = 0; i < 5 && currentDir; i++) { // Buscar hasta 5 niveles arriba
                      try {
                        const detection = await window.electronAPI.detectProjectType(currentDir);
                        if (detection && detection.type) {
                          setProjectPath(currentDir);
                          setExplorerProjectPath(currentDir);
                          setDetectedProjectType(detection);
                          found = true;
                          break;
                        }
                      } catch (error) {
                        // Continuar buscando
                      }
                      // Subir un nivel
                      const parts = currentDir.split(/[/\\]/);
                      parts.pop();
                      currentDir = parts.join(/[/\\]/.test(currentDir) ? (currentDir.includes('/') ? '/' : '\\') : '/');
                    }
                  }
                  
                  // Detectar lenguaje por extensión
                  const ext = filePath.split('.').pop()?.toLowerCase();
                  const langMap = {
                    'js': 'nodejs',
                    'jsx': 'nodejs',
                    'ts': 'nodejs',
                    'tsx': 'nodejs',
                    'py': 'python',
                    'cs': 'dotnet',
                    'java': 'java',
                    'sql': 'sqlite',
                    'html': 'nodejs',
                    'css': 'nodejs'
                  };
                  if (langMap[ext]) {
                    setLanguage(langMap[ext]);
                  }
                }}
                onProjectPathChange={(path) => {
                  setExplorerProjectPath(path);
                  setProjectPath(path); // También actualizar la ruta del proyecto
                }}
                onProjectHandleChange={(handle) => {
                  setProjectHandle(handle); // Guardar el handle del proyecto para uso en navegador
                }}
              />
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2" ref={resizeRef}>
          

          {/* Editor de código y Preview - Área redimensionable */}
          <div 
            className="flex flex-col min-h-0 overflow-hidden"
            style={{ height: `${codeAreaHeight}%` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Código:
                </label>
                {plugins.syntaxValidation && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                    ✓ Validación activa
                  </span>
                )}
                {plugins.autocomplete && (
                  <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                    ✨ Autocompletado activo
                  </span>
                )}
                {plugins.snippets && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                    📝 Snippets activo
                  </span>
                )}
              </div>
              {isHTMLCode && (
                <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setPreviewMode('code')}
                    className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-2 ${
                      previewMode === 'code'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Ver solo código"
                  >
                    <Code className="w-4 h-4" />
                    <span className="hidden sm:inline">Código</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('split')}
                    className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-2 border-l border-r border-gray-300 dark:border-gray-600 ${
                      previewMode === 'split'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Ver código y preview juntos (split view)"
                  >
                    <Split className="w-4 h-4" />
                    <span className="hidden sm:inline">Split</span>
                  </button>
                  <button
                    onClick={() => setPreviewMode('preview')}
                    className={`px-3 py-1.5 text-sm transition-colors flex items-center gap-2 ${
                      previewMode === 'preview'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="Ver solo preview"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Vista dividida (Split) */}
            {previewMode === 'split' && isHTMLCode ? (
              <div className="flex-1 flex min-h-0 gap-2" data-split-container>
                {/* Panel de código - izquierda */}
                <div 
                  className="relative min-h-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-900 console-code-highlight flex-shrink-0"
                  style={{ width: `${previewSplitWidth}%`, minWidth: '200px' }}
                >
                  {/* Código resaltado (fondo) */}
                  <pre
                    ref={codeHighlightRef}
                    className="absolute inset-0 m-0 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap break-words pointer-events-none"
                    style={{ 
                      zIndex: 1,
                      background: '#111827',
                      lineHeight: '1.5rem',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent'
                    }}
                  />
                  {/* Textarea visible (encima) */}
                  <textarea
                    ref={codeTextareaRef}
                    value={code}
                    onChange={handleCodeChange}
                    onScroll={handleCodeScroll}
                    onKeyDown={handleKeyDownWithPlugins}
                    placeholder={getPlaceholderText()}
                    className="console-code-editor relative w-full h-full px-4 py-3 border-0 focus:outline-none font-mono text-sm resize-none min-h-0"
                    style={{ 
                      zIndex: 10,
                      caretColor: '#4ade80',
                      background: 'transparent',
                      lineHeight: '1.5rem',
                      color: '#4ade80',
                      WebkitTextFillColor: '#4ade80'
                    }}
                    spellCheck={false}
                  />
                  {/* Autocompletado - Dropdown */}
                  {showCompletions && completions.length > 0 && plugins.autocomplete && (
                    <div 
                      className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[100] max-h-48 overflow-y-auto"
                      style={{
                        top: '60px',
                        left: '20px',
                        minWidth: '250px',
                        maxWidth: '400px'
                      }}
                    >
                      <div className="px-2 py-1 text-xs text-gray-400 border-b border-gray-700">
                        Sugerencias ({completions.length})
                      </div>
                      {completions.map((completion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            if (completion.snippet) {
                              const expanded = codeIntelligenceService.expandSnippet(completion.snippet);
                              const lines = code.split('\n');
                              const currentLine = lines[lines.length - 1] || '';
                              const wordMatch = currentLine.match(/(\w+)$/);
                              if (wordMatch) {
                                const newCode = code.replace(new RegExp(`\\b${wordMatch[1]}\\b$`, 'm'), expanded);
                                setCode(newCode);
                              }
                            } else {
                              const lines = code.split('\n');
                              const currentLine = lines[lines.length - 1] || '';
                              const wordMatch = currentLine.match(/(\w+)$/);
                              if (wordMatch) {
                                const newCode = code.replace(new RegExp(`\\b${wordMatch[1]}\\b$`, 'm'), completion.label);
                                setCode(newCode);
                              }
                            }
                            setShowCompletions(false);
                          }}
                          className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-2 ${
                            index === completionIndex
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <span className="font-semibold">{completion.label}</span>
                          {completion.detail && (
                            <span className="text-xs opacity-75">- {completion.detail}</span>
                          )}
                        </div>
                      ))}
                      <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-700">
                        Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
                      </div>
                    </div>
                  )}
                  
                  {/* Errores de sintaxis - Indicador */}
                  {syntaxErrors.length > 0 && plugins.syntaxValidation && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-xs z-50 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{syntaxErrors.length} error(es) de sintaxis</span>
                    </div>
                  )}
                </div>
                
                {/* Divisor redimensionable horizontal */}
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizingPreview(true);
                  }}
                  className="w-2 cursor-col-resize hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors flex items-center justify-center group relative flex-shrink-0"
                  title="Arrastra para redimensionar"
                >
                  <div className="h-20 w-1 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
                </div>

                {/* Panel de preview - derecha */}
                <div 
                  className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white min-h-0 flex-1"
                  style={{ minWidth: 0 }}
                >
                  <iframe
                    ref={previewIframeRef}
                    className="w-full h-full border-0"
                    title="Preview HTML"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            ) : previewMode === 'preview' && isHTMLCode ? (
              /* Solo preview */
              <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white min-h-0">
                <iframe
                  ref={previewIframeRef}
                  className="w-full h-full border-0"
                  title="Preview HTML"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              /* Solo código */
              <div className="relative flex-1 min-h-0 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-900 console-code-highlight">
                {/* Código resaltado (fondo) */}
                <pre
                  ref={codeHighlightRef}
                  className="absolute inset-0 m-0 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap break-words pointer-events-none"
                  style={{ 
                    zIndex: 1,
                    background: '#111827',
                    lineHeight: '1.5rem',
                    color: 'transparent',
                    WebkitTextFillColor: 'transparent'
                  }}
                />
                {/* Textarea visible (encima) */}
                <textarea
                  ref={codeTextareaRef}
                  value={code}
                  onChange={handleCodeChange}
                  onScroll={handleCodeScroll}
                  onKeyDown={handleKeyDownWithPlugins}
                  placeholder={getPlaceholderText()}
                  className="console-code-editor relative w-full h-full px-4 py-3 border-0 focus:outline-none font-mono text-sm resize-none min-h-0"
                  style={{ 
                    zIndex: 10,
                    caretColor: '#4ade80',
                    background: 'transparent',
                    lineHeight: '1.5rem',
                    color: '#4ade80',
                    WebkitTextFillColor: '#4ade80'
                  }}
                  spellCheck={false}
                />
                
                {/* Autocompletado - Dropdown */}
                {showCompletions && completions.length > 0 && plugins.autocomplete && (
                  <div 
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[100] max-h-48 overflow-y-auto"
                    style={{
                      top: '60px',
                      left: '20px',
                      minWidth: '250px',
                      maxWidth: '400px'
                    }}
                  >
                    <div className="px-2 py-1 text-xs text-gray-400 border-b border-gray-700">
                      Sugerencias ({completions.length})
                    </div>
                    {completions.map((completion, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          if (completion.snippet) {
                            const expanded = codeIntelligenceService.expandSnippet(completion.snippet);
                            const lines = code.split('\n');
                            const currentLine = lines[lines.length - 1] || '';
                            const wordMatch = currentLine.match(/(\w+)$/);
                            if (wordMatch) {
                              const newCode = code.replace(new RegExp(`\\b${wordMatch[1]}\\b$`, 'm'), expanded);
                              setCode(newCode);
                            }
                          } else {
                            const lines = code.split('\n');
                            const currentLine = lines[lines.length - 1] || '';
                            const wordMatch = currentLine.match(/(\w+)$/);
                            if (wordMatch) {
                              const newCode = code.replace(new RegExp(`\\b${wordMatch[1]}\\b$`, 'm'), completion.label);
                              setCode(newCode);
                            }
                          }
                          setShowCompletions(false);
                        }}
                        className={`px-3 py-2 cursor-pointer text-sm flex items-center gap-2 ${
                          index === completionIndex
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className="font-semibold">{completion.label}</span>
                        {completion.detail && (
                          <span className="text-xs opacity-75">- {completion.detail}</span>
                        )}
                      </div>
                    ))}
                    <div className="px-2 py-1 text-xs text-gray-500 border-t border-gray-700">
                      Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
                    </div>
                  </div>
                )}
                
                {/* Errores de sintaxis - Indicador */}
                {syntaxErrors.length > 0 && plugins.syntaxValidation && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-xs z-50 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{syntaxErrors.length} error(es) de sintaxis</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Panel de errores de sintaxis - Fuera del condicional de preview */}
            {previewMode === 'code' && syntaxErrors.length > 0 && plugins.syntaxValidation && (
              <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-semibold text-red-800 dark:text-red-200">
                    Errores de Sintaxis:
                  </span>
                </div>
                <div className="space-y-1">
                  {syntaxErrors.map((error, index) => (
                    <div key={index} className="text-xs text-red-700 dark:text-red-300">
                      Línea {error.line}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isHTMLCode && previewMode === 'code' && (
              <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>Este código parece HTML/CSS. Usa los botones de vista para ver el código, la preview o ambos juntos.</span>
              </div>
            )}
          </div>

          {/* Divisor redimensionable */}
          <div
            ref={resizeRef}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizing(true);
            }}
            className="h-2 cursor-row-resize hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors flex items-center justify-center group relative"
            title="Arrastra para redimensionar"
          >
            <div className="w-20 h-1 bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors" />
          </div>

          {/* Salida - Área redimensionable */}
          <div 
            className="flex flex-col min-h-0 overflow-hidden"
            style={{ height: `${100 - codeAreaHeight}%` }}
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Salida:
              </label>
              {output && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(output);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (err) {
                      console.error('Error al copiar:', err);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copiar salida al portapapeles"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      <span className="text-green-600 dark:text-green-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div
              ref={outputRef}
              className="flex-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900 text-green-400 font-mono text-sm overflow-auto min-h-0 whitespace-pre-wrap"
            >
              {output || <span className="text-gray-500">La salida aparecerá aquí...</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ayuda */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60001] flex items-center justify-center p-4"
          style={{ zIndex: 60001 }}
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Guía de Uso de la Consola
                </h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Acceso Rápido a Cursos */}
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  📚 Acceso Rápido a Cursos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Haz clic en cualquier botón para abrir el curso en el explorador de archivos (sidebar izquierdo) y comenzar a estudiar:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {/* JavaScript */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-javascript', 'JavaScript');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">💻</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">JavaScript</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Variables, Arrays, Objetos, Funciones, JSON</p>
                  </button>

                  {/* Python */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-python', 'Python');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🐍</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Python</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Variables, Listas, Diccionarios, Bucles, JSON</p>
                  </button>

                  {/* Web (HTML/CSS/JS) */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-web', 'Desarrollo Web');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🌐</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Web</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">HTML, CSS, JavaScript, DOM</p>
                  </button>

                  {/* Angular */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-angular', 'Angular');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🅰️</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Angular</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Componentes, Data Binding, Servicios</p>
                  </button>

                  {/* .NET Core */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-dotnet', '.NET Core');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🔷</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">.NET Core</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">C#, Clases, LINQ</p>
                  </button>

                  {/* Java */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-java', 'Java');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">☕</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Java</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Variables, Clases, Streams</p>
                  </button>

                  {/* SQL */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-sql', 'SQL/SQLite');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🗄️</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">SQL</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Consultas, Tablas, JOINs</p>
                  </button>

                  {/* DevOps */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-devops', 'DevOps');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🚀</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">DevOps</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Git, CI/CD, Docker, Kubernetes</p>
                  </button>

                  {/* Inglés */}
                  <button
                    onClick={async () => {
                      await loadCourse('aprender-ingles', 'Inglés');
                      setShowHelp(false);
                    }}
                    className="px-4 py-3 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">🇬🇧</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Inglés</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">A1, A2, B1</p>
                  </button>
                </div>
              </section>

              {/* Cómo usar la consola */}
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  🚀 Cómo Usar la Consola
                </h4>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <p><strong>1. Ejecutar código directamente:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Escribe tu código en el editor</li>
                    <li>Selecciona el lenguaje (Node.js o Python)</li>
                    <li>Presiona "Ejecutar Código" o <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Ctrl+Enter</code></li>
                    <li>Ve la salida en el área de resultados</li>
                  </ul>
                  
                  <p className="mt-4"><strong>2. Ejecutar proyectos completos:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Ingresa la ruta del proyecto o usa el botón de carpeta 📁</li>
                    <li>La consola detecta automáticamente el tipo de proyecto</li>
                    <li>Presiona "Ejecutar Proyecto"</li>
                  </ul>

                  <p className="mt-4"><strong>3. Atajos de teclado:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Ctrl+Enter</code> - Ejecutar código</li>
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">Escape</code> - Cerrar consola</li>
                  </ul>
                </div>
              </section>

              {/* Ejemplos disponibles */}
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  📚 Ejemplos Disponibles
                </h4>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🐍 Ejemplos de Python
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Ejemplo básico:</strong>
                        <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('ejemplo-python')}
                        </code>
                        <span className="text-xs text-blue-600 dark:text-blue-400">📦 Incluido (todos los cursos vienen con la app)</span>
                      </div>
                      <div>
                        <strong>Curso completo:</strong>
                        <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-python')}
                        </code>
                        <span className="text-xs text-blue-600 dark:text-blue-400">📦 Incluido (todos los cursos vienen con la app)</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Variables, Listas, Diccionarios, Bucles, JSON, Funciones
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      💻 Ejemplos de JavaScript/Node.js
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Ejemplo básico:</strong>
                        <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('ejemplo-nodejs')}
                        </code>
                        <span className="text-xs text-blue-600 dark:text-blue-400">📦 Incluido (todos los cursos vienen con la app)</span>
                      </div>
                      <div>
                        <strong>Curso completo:</strong>
                        <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-javascript')}
                        </code>
                        <span className="text-xs text-blue-600 dark:text-blue-400">📦 Incluido (todos los cursos vienen con la app)</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Variables, Arrays, Objetos, Bucles, Funciones, JSON avanzado
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🌐 Ejemplos de Desarrollo Web (HTML, CSS, JavaScript)
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo web:</strong>
                        <code className="block bg-purple-100 dark:bg-purple-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-web')}
                        </code>
                        <span className="text-xs text-blue-600 dark:text-blue-400">📦 Incluido (todos los cursos vienen con la app)</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: HTML básico/intermedio, CSS básico/layout, HTML+CSS, JavaScript+DOM, Proyectos completos
                        </p>
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          💡 Nota: Los archivos HTML se abren mejor directamente en el navegador (doble clic)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🅰️ Ejemplos de Angular
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo Angular:</strong>
                        <code className="block bg-red-100 dark:bg-red-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-angular')}
                        </code>
                        <span className="text-xs text-orange-600 dark:text-orange-400">🔧 También incluido, pero puedes agregar versión externa para actualizar sin reinstalar</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Componentes, Data Binding, Directivas, Servicios, Formularios
                        </p>
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          💡 Nota: Ejecuta el proyecto con "Ejecutar Proyecto" y se abrirá en http://localhost:4200
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🔷 Ejemplos de .NET Core / C#
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo .NET Core:</strong>
                        <code className="block bg-blue-100 dark:bg-blue-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-dotnet')}
                        </code>
                        <span className="text-xs text-orange-600 dark:text-orange-400">🔧 También incluido, pero puedes agregar versión externa para actualizar sin reinstalar</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Variables, Arrays, Diccionarios, Bucles, Funciones, Clases, LINQ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      ☕ Ejemplos de Java
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo Java:</strong>
                        <code className="block bg-orange-100 dark:bg-orange-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-java')}
                        </code>
                        <span className="text-xs text-orange-600 dark:text-orange-400">🔧 También incluido, pero puedes agregar versión externa para actualizar sin reinstalar</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Variables, Arrays, Listas, Mapas, Bucles, Funciones, Clases, Streams
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🗄️ Ejemplos de SQL / SQLite
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo SQL:</strong>
                        <code className="block bg-green-100 dark:bg-green-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-sql')}
                        </code>
                        <span className="text-xs text-blue-600 dark:text-blue-400">📦 Incluido (todos los cursos vienen con la app)</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: CREATE TABLE, INSERT, SELECT, JOINs, UPDATE, DELETE, Vistas, Transacciones
                        </p>
                        <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                          💡 Nota: Copia y pega las consultas del archivo ejemplos.sql en el editor
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🚀 Ejemplos de DevOps
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo DevOps:</strong>
                        <code className="block bg-indigo-100 dark:bg-indigo-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-devops')}
                        </code>
                        <span className="text-xs text-orange-600 dark:text-orange-400">🔧 También incluido, pero puedes agregar versión externa para actualizar sin reinstalar</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Fundamentos DevOps, Arquitectura, Desarrollo, Seguridad, Herramientas
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      🇬🇧 Curso de Inglés
                    </h5>
                    <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <strong>Curso completo Inglés (A1-B1):</strong>
                        <code className="block bg-pink-100 dark:bg-pink-900 p-2 rounded mt-1 text-xs">
                          {cursosService.getRutaFormateada('aprender-ingles')}
                        </code>
                        <span className="text-xs text-orange-600 dark:text-orange-400">🔧 También incluido, pero puedes agregar versión externa para actualizar sin reinstalar</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          Contiene: Nivel A1 (Principiante), A2 (Elemental), B1 (Pre-Intermedio), Vocabulario, Gramática, Práctica
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cómo ejecutar ejemplos */}
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  📖 Cómo Ejecutar los Ejemplos
                </h4>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <p className="font-semibold mb-2">Opción 1: Ejecutar proyecto completo</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>En "Ejecutar Proyecto Completo", ingresa la ruta del ejemplo</li>
                      <li>O haz clic en el botón 📁 para seleccionar la carpeta</li>
                      <li>Selecciona el lenguaje apropiado (Python o Node.js)</li>
                      <li>Presiona "Ejecutar Proyecto"</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <p className="font-semibold mb-2">Opción 2: Copiar y pegar código</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Abre el archivo del ejemplo que quieres probar</li>
                      <li>Copia todo el contenido del archivo</li>
                      <li>Pégalo en el editor de código de la consola</li>
                      <li>Presiona "Ejecutar Código"</li>
                    </ol>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <p className="font-semibold mb-2">Opción 3: Ejecutar ejemplo individual</p>
                    <p className="text-sm">
                      Cada ejemplo está en un archivo separado. Puedes ejecutar solo el que te interese:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2 text-sm">
                      <li><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">01-variables-y-tipos</code> - Conceptos básicos</li>
                      <li><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">02-listas-y-arrays</code> - Trabajar con listas</li>
                      <li><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">03-diccionarios</code> - Estructuras de datos</li>
                      <li><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">04-bucles-y-recorridos</code> - Iteraciones</li>
                      <li><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">05-manipulacion-json</code> - Trabajar con JSON</li>
                      <li><code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">06-funciones</code> - Funciones y reutilización</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Notas importantes */}
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  ⚠️ Notas Importantes
                </h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <p><strong>JavaScript</strong> funciona tanto en el navegador como en Electron</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <p><strong>Python</strong> solo funciona en Electron (requiere instalación de Python)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <p><strong>Proyectos completos</strong> requieren Electron para ejecutarse</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400">•</span>
                    <p>Los <strong>timeouts</strong> son de 30 segundos para código y 60 segundos para proyectos</p>
                  </div>
                </div>
              </section>

              {/* Enlaces útiles */}
              <section>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  🔗 Documentación
                </h4>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p>Para más información detallada, consulta:</p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">README_CONSOLA.md</code> - Guía completa de uso</li>
                    <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ejemplos-consola/README-APRENDER.md</code> - Guía de los ejemplos educativos</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Modal de Plugins */}
    <ConsolePluginsModal
      isOpen={showPluginsModal}
      onClose={() => setShowPluginsModal(false)}
      plugins={plugins}
      onPluginsChange={(newPlugins) => {
        setPlugins(newPlugins);
        // Guardar en localStorage
        localStorage.setItem('console-plugins', JSON.stringify(newPlugins));
      }}
    />
    </div>
  );
}

