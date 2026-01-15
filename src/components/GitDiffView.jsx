import { useState, useEffect, useRef } from 'react';
import { X, File } from 'lucide-react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { lineNumbers } from '@codemirror/view';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import gitService from '../services/GitService';

export default function GitDiffView({ projectPath, filePath, onClose }) {
  const [originalContent, setOriginalContent] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const originalEditorRef = useRef(null);
  const currentEditorRef = useRef(null);
  const originalContainerRef = useRef(null);
  const currentContainerRef = useRef(null);

  // Obtener el lenguaje del archivo
  const getLanguage = (filePath) => {
    if (!filePath) return null;
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (['js', 'jsx', 'mjs', 'cjs'].includes(ext)) return javascript({ jsx: true });
    if (['ts', 'tsx'].includes(ext)) return javascript({ jsx: true, typescript: true });
    if (['py'].includes(ext)) return python();
    if (['html', 'htm'].includes(ext)) return html();
    if (['css', 'scss', 'sass'].includes(ext)) return css();
    if (['json'].includes(ext)) return json();
    // Para SQL y otros lenguajes, usar javascript como fallback
    if (['sql'].includes(ext)) return javascript();
    return null;
  };

  // Cargar contenidos
  useEffect(() => {
    const loadContents = async () => {
      if (!projectPath || !filePath) return;

      setLoading(true);
      try {
        // Obtener la ruta relativa al repositorio
        const repoRoot = await gitService.getRepositoryRoot(projectPath);
        let relativePath = filePath;
        
        if (repoRoot && filePath.startsWith(repoRoot)) {
          // Si la ruta completa incluye el root, usar la ruta relativa
          relativePath = filePath.replace(repoRoot, '').replace(/^[/\\]/, '');
        } else if (filePath.startsWith(projectPath)) {
          // Si la ruta incluye projectPath, obtener la relativa
          relativePath = filePath.replace(projectPath, '').replace(/^[/\\]/, '');
        }

        const [original, current] = await Promise.all([
          gitService.getOriginalFileContent(projectPath, relativePath),
          gitService.getCurrentFileContent(projectPath, filePath)
        ]);

        // Asegurar que siempre sean cadenas
        setOriginalContent(typeof original === 'string' ? original : (original || ''));
        setCurrentContent(typeof current === 'string' ? current : (current || ''));
      } catch (error) {
        console.error('[GitDiffView] Error cargando contenidos:', error);
        setOriginalContent('');
        setCurrentContent('');
      } finally {
        setLoading(false);
      }
    };

    loadContents();
  }, [projectPath, filePath]);

  // Inicializar editores
  useEffect(() => {
    if (loading || !originalContainerRef.current || !currentContainerRef.current) return;

    // Asegurar que los contenidos sean cadenas válidas
    const originalText = typeof originalContent === 'string' ? originalContent : String(originalContent || '');
    const currentText = typeof currentContent === 'string' ? currentContent : String(currentContent || '');

    // Limpiar editores anteriores si existen
    if (originalEditorRef.current) {
      originalEditorRef.current.destroy();
      originalEditorRef.current = null;
    }
    if (currentEditorRef.current) {
      currentEditorRef.current.destroy();
      currentEditorRef.current = null;
    }

    const language = getLanguage(filePath);

    // Editor para contenido original
    try {
      const originalState = EditorState.create({
        doc: originalText,
        extensions: [
          basicSetup,
          EditorView.editable.of(false),
          lineNumbers(),
          oneDark,
          syntaxHighlighting(defaultHighlightStyle),
          ...(language ? [language] : [])
        ]
      });

      originalEditorRef.current = new EditorView({
        state: originalState,
        parent: originalContainerRef.current
      });
    } catch (error) {
      console.error('[GitDiffView] Error creando editor original:', error);
    }

    // Editor para contenido actual
    try {
      const currentState = EditorState.create({
        doc: currentText,
        extensions: [
          basicSetup,
          EditorView.editable.of(false),
          lineNumbers(),
          oneDark,
          syntaxHighlighting(defaultHighlightStyle),
          ...(language ? [language] : [])
        ]
      });

      currentEditorRef.current = new EditorView({
        state: currentState,
        parent: currentContainerRef.current
      });
    } catch (error) {
      console.error('[GitDiffView] Error creando editor actual:', error);
    }

    return () => {
      if (originalEditorRef.current) {
        originalEditorRef.current.destroy();
        originalEditorRef.current = null;
      }
      if (currentEditorRef.current) {
        currentEditorRef.current.destroy();
        currentEditorRef.current = null;
      }
    };
  }, [originalContent, currentContent, loading, filePath]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-[#858585]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007acc] mx-auto mb-2"></div>
          <p className="text-[12px]">Cargando comparación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#3e3e42] bg-[#252526] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <File className="w-4 h-4 text-[#cccccc]" />
          <span className="text-[12px] font-semibold text-[#cccccc]">{filePath}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#3e3e42] rounded transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4 text-[#cccccc]" />
        </button>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lado izquierdo - Original */}
        <div className="flex-1 flex flex-col border-r border-[#3e3e42]">
          <div className="px-3 py-1.5 bg-[#2d2d30] border-b border-[#3e3e42]">
            <span className="text-[11px] font-semibold text-[#858585] uppercase">
              ORIGINAL (HEAD)
            </span>
          </div>
          <div 
            ref={originalContainerRef}
            className="flex-1 overflow-auto"
            style={{ height: '100%' }}
          />
        </div>

        {/* Lado derecho - Actual */}
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-1.5 bg-[#2d2d30] border-b border-[#3e3e42]">
            <span className="text-[11px] font-semibold text-[#4ec9b0] uppercase">
              MODIFICADO
            </span>
          </div>
          <div 
            ref={currentContainerRef}
            className="flex-1 overflow-auto"
            style={{ height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}

