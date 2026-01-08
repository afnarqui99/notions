import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { Eye, Edit, Columns, Maximize, Minimize, Download, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import jsPDF from 'jspdf';

export default function MarkdownNode({ node, updateAttributes, editor }) {
  const [content, setContent] = useState(node.attrs.content || '');
  const [viewMode, setViewMode] = useState(node.attrs.viewMode || 'split'); // 'edit', 'preview', 'split'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  // Actualizar atributos cuando cambia el contenido o viewMode
  useEffect(() => {
    updateAttributes({
      content,
      viewMode,
    });
  }, [content, viewMode]);

  // Sincronizar con el nodo
  useEffect(() => {
    if (node.attrs.content !== content) {
      setContent(node.attrs.content || '');
    }
    if (node.attrs.viewMode !== viewMode) {
      setViewMode(node.attrs.viewMode || 'split');
    }
  }, [node.attrs.content, node.attrs.viewMode]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
  };

  const handleExportPDF = async () => {
    if (!content || !content.trim()) {
      alert('No hay contenido para exportar.');
      return;
    }

    // Usar html2pdf si está disponible (mejor para caracteres especiales y emojis)
    if (typeof window.html2pdf !== 'undefined') {
      try {
        console.log('Exportando con html2pdf (preserva caracteres especiales)');
        
        // Intentar usar el previewRef directamente si está disponible y visible
        let sourceElement = null;
        if (previewRef.current && previewRef.current.querySelector('.markdown-preview')) {
          sourceElement = previewRef.current.querySelector('.markdown-preview');
          console.log('Usando preview existente');
        }
        
        // Si no hay preview, crear uno temporal
        if (!sourceElement) {
          console.log('Creando elemento temporal para exportación');
          
          // Convertir markdown a HTML usando marked
          const html = marked(content);
          
          // Crear elemento temporal con estilos completos
          const tempDiv = document.createElement('div');
          tempDiv.className = 'markdown-preview';
          tempDiv.innerHTML = html;
          
          // Aplicar estilos inline para asegurar renderizado correcto
          // Usar pixels para mejor compatibilidad con html2canvas
          const a4WidthPx = 794; // 210mm en pixels a 96 DPI
          const a4HeightPx = 1123; // 297mm en pixels a 96 DPI
          const paddingPx = 40; // 20mm en pixels
          
          tempDiv.style.position = 'fixed';
          tempDiv.style.left = '0';
          tempDiv.style.top = '0';
          tempDiv.style.width = `${a4WidthPx}px`;
          tempDiv.style.maxWidth = `${a4WidthPx}px`;
          tempDiv.style.minHeight = 'auto';
          tempDiv.style.height = 'auto';
          tempDiv.style.padding = `${paddingPx}px`;
          tempDiv.style.margin = '0';
          tempDiv.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
          tempDiv.style.fontSize = '12pt';
          tempDiv.style.lineHeight = '1.6';
          tempDiv.style.backgroundColor = 'white';
          tempDiv.style.color = '#000000';
          tempDiv.style.boxSizing = 'border-box';
          tempDiv.style.overflow = 'visible';
          tempDiv.style.zIndex = '999999';
          tempDiv.style.display = 'block';
          tempDiv.style.visibility = 'visible';
          tempDiv.style.opacity = '1';
          tempDiv.style.wordWrap = 'break-word';
          tempDiv.style.overflowWrap = 'break-word';
          tempDiv.style.textAlign = 'left';
          
          document.body.appendChild(tempDiv);
          sourceElement = tempDiv;
          
          // Agregar estilos CSS para elementos markdown
          const style = document.createElement('style');
          style.id = 'pdf-export-styles';
          style.textContent = `
            .markdown-preview h1 { font-size: 2em; font-weight: bold; margin-top: 0.67em; margin-bottom: 0.67em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; color: #111827; }
            .markdown-preview h2 { font-size: 1.5em; font-weight: bold; margin-top: 0.83em; margin-bottom: 0.83em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; color: #111827; }
            .markdown-preview h3 { font-size: 1.17em; font-weight: bold; margin-top: 1em; margin-bottom: 1em; color: #111827; }
            .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 { font-weight: bold; margin-top: 1em; margin-bottom: 1em; color: #111827; }
            .markdown-preview p { margin-top: 1em; margin-bottom: 1em; color: #374151; }
            .markdown-preview code { background-color: #f3f4f6; padding: 0.2em 0.4em; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 0.9em; color: #111827; }
            .markdown-preview pre { background-color: #1f2937; color: #f9fafb; padding: 1em; border-radius: 6px; overflow-x: auto; margin-top: 1em; margin-bottom: 1em; }
            .markdown-preview pre code { background-color: transparent; padding: 0; color: inherit; }
            .markdown-preview blockquote { border-left: 4px solid #3b82f6; padding-left: 1em; margin-left: 0; color: #6b7280; font-style: italic; }
            .markdown-preview ul, .markdown-preview ol { margin-top: 1em; margin-bottom: 1em; padding-left: 2em; }
            .markdown-preview li { margin-top: 0.5em; margin-bottom: 0.5em; color: #374151; }
            .markdown-preview table { border-collapse: collapse; width: 100%; margin-top: 1em; margin-bottom: 1em; }
            .markdown-preview table th, .markdown-preview table td { border: 1px solid #e5e7eb; padding: 0.5em; text-align: left; }
            .markdown-preview table th { background-color: #f9fafb; font-weight: bold; }
            .markdown-preview a { color: #3b82f6; text-decoration: underline; }
            .markdown-preview img { max-width: 100%; height: auto; margin-top: 1em; margin-bottom: 1em; }
            .markdown-preview hr { border: none; border-top: 2px solid #e5e7eb; margin: 2em 0; }
          `;
          document.head.appendChild(style);
        }
        
        // Guardar posición de scroll original
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        
        // Asegurar que el elemento esté visible para html2canvas
        window.scrollTo(0, 0);
        
        // Forzar reflow
        sourceElement.offsetHeight;
        
        // Esperar a que las imágenes se carguen
        const images = sourceElement.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = resolve;
                img.onerror = resolve;
              }
            });
          })
        );
        
        // Esperar un poco más para asegurar renderizado completo
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('Elemento a exportar:', sourceElement);
        console.log('Dimensiones:', {
          width: sourceElement.offsetWidth,
          height: sourceElement.offsetHeight,
          scrollWidth: sourceElement.scrollWidth,
          scrollHeight: sourceElement.scrollHeight,
          innerHTML: sourceElement.innerHTML.substring(0, 200)
        });
        
        // Calcular dimensiones correctas
        // Forzar un reflow completo antes de medir
        sourceElement.style.display = 'block';
        const elementWidth = sourceElement.scrollWidth || sourceElement.offsetWidth || 794;
        const elementHeight = sourceElement.scrollHeight || sourceElement.offsetHeight || 1123;
        
        console.log('Dimensiones finales:', {
          offsetWidth: sourceElement.offsetWidth,
          offsetHeight: sourceElement.offsetHeight,
          scrollWidth: sourceElement.scrollWidth,
          scrollHeight: sourceElement.scrollHeight,
          clientWidth: sourceElement.clientWidth,
          clientHeight: sourceElement.clientHeight,
          computedStyle: window.getComputedStyle(sourceElement).width
        });
        
        // Esperar un frame más para asegurar que todo esté renderizado
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Generar PDF con html2pdf
        await window.html2pdf()
          .set({
            margin: [0, 0, 0, 0], // Sin márgenes adicionales, el padding del elemento ya los incluye
            filename: 'markdown-document.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              logging: false,
              width: elementWidth,
              height: elementHeight,
              windowWidth: elementWidth,
              windowHeight: elementHeight,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .from(sourceElement)
          .save();
        
        // Limpiar solo si creamos elementos temporales
        if (sourceElement.parentElement === document.body && sourceElement.style.position === 'fixed') {
          document.body.removeChild(sourceElement);
          const style = document.getElementById('pdf-export-styles');
          if (style) {
            document.head.removeChild(style);
          }
        }
        
        window.scrollTo(originalScrollX, originalScrollY);
        
        console.log('PDF generado exitosamente con html2pdf');
        return;
      } catch (error) {
        console.error('Error con html2pdf:', error);
        alert('Error al exportar PDF: ' + error.message);
        return;
      }
    }

    // Fallback: usar jsPDF directo
    try {
      console.log('Usando jsPDF directo como fallback');
      
      // Función para limpiar emojis pero preservar caracteres especiales válidos
      const cleanText = (text) => {
        if (!text) return text;
        // Remover solo emojis, pero mantener caracteres especiales como acentos
        let cleaned = text.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
        cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols
        cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport
        cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
        cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
        cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
        cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols
        cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, ''); // Chess Symbols
        cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs
        // Limpiar espacios múltiples pero mantener el texto
        cleaned = cleaned.replace(/\s+/g, ' ');
        return cleaned.trim();
      };
      
      // Crear nuevo documento PDF
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      });

      // Configuración de página
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Función para agregar nueva página si es necesario
      const checkNewPage = (requiredHeight) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Convertir markdown a texto plano para jsPDF
      // Dividir por líneas
      const lines = content.split('\n');
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      // Habilitar soporte UTF-8 (jsPDF 2.x+ lo soporta por defecto)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
          yPosition += 5; // Espacio en blanco
          checkNewPage(5);
          continue;
        }

        // Limpiar emojis pero mantener el texto
        const processedLine = cleanText(line);
        
        // Detectar títulos
        if (processedLine.startsWith('# ')) {
          checkNewPage(15);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          const text = processedLine.substring(2);
          const wrapped = doc.splitTextToSize(text, maxWidth);
          doc.text(wrapped, margin, yPosition);
          yPosition += wrapped.length * 7;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
        } else if (processedLine.startsWith('## ')) {
          checkNewPage(12);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          const text = processedLine.substring(3);
          const wrapped = doc.splitTextToSize(text, maxWidth);
          doc.text(wrapped, margin, yPosition);
          yPosition += wrapped.length * 6;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
        } else if (processedLine.startsWith('### ')) {
          checkNewPage(10);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          const text = processedLine.substring(4);
          const wrapped = doc.splitTextToSize(text, maxWidth);
          doc.text(wrapped, margin, yPosition);
          yPosition += wrapped.length * 5;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
        } else if (processedLine.startsWith('#### ')) {
          checkNewPage(10);
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          const text = processedLine.substring(5);
          const wrapped = doc.splitTextToSize(text, maxWidth);
          doc.text(wrapped, margin, yPosition);
          yPosition += wrapped.length * 5;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
        } else if (processedLine.startsWith('- ') || processedLine.startsWith('* ')) {
          // Lista con viñetas
          checkNewPage(6);
          const text = processedLine.substring(2);
          const wrapped = doc.splitTextToSize('- ' + text, maxWidth - 5);
          doc.text(wrapped, margin + 5, yPosition);
          yPosition += wrapped.length * 5;
        } else if (/^\d+\.\s/.test(processedLine)) {
          // Lista numerada
          checkNewPage(6);
          const text = processedLine.replace(/^\d+\.\s/, '');
          const wrapped = doc.splitTextToSize(text, maxWidth - 5);
          doc.text(wrapped, margin + 5, yPosition);
          yPosition += wrapped.length * 5;
        } else if (processedLine.startsWith('```')) {
          // Bloque de código (saltar inicio y fin)
          checkNewPage(8);
          doc.setFont('courier', 'normal');
          doc.setFontSize(10);
          // Buscar el final del bloque de código
          let codeContent = '';
          i++;
          while (i < lines.length) {
            const codeLine = cleanText(lines[i]);
            if (codeLine.trim().startsWith('```')) break;
            codeContent += lines[i] + '\n';
            i++;
          }
          const wrapped = doc.splitTextToSize(codeContent, maxWidth);
          doc.text(wrapped, margin + 5, yPosition);
          yPosition += wrapped.length * 4;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
        } else if (processedLine.startsWith('> ')) {
          // Blockquote
          checkNewPage(6);
          const text = processedLine.substring(2);
          const wrapped = doc.splitTextToSize(text, maxWidth - 10);
          doc.text(wrapped, margin + 10, yPosition);
          yPosition += wrapped.length * 5;
        } else {
          // Texto normal
          checkNewPage(6);
          const wrapped = doc.splitTextToSize(processedLine, maxWidth);
          doc.text(wrapped, margin, yPosition);
          yPosition += wrapped.length * 5;
        }
      }

      // Guardar PDF
      doc.save('markdown-document.pdf');
      console.log('PDF generado exitosamente con jsPDF');
      
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar PDF: ' + error.message);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      setIsEditorFullscreen(false);
      setIsPreviewFullscreen(false);
      document.exitFullscreen?.();
    } else {
      setIsFullscreen(true);
      const element = textareaRef.current?.parentElement?.parentElement;
      if (element) {
        element.requestFullscreen?.();
      }
    }
  };

  const toggleEditorFullscreen = () => {
    setIsEditorFullscreen(!isEditorFullscreen);
    setIsPreviewFullscreen(false);
    setIsFullscreen(false);
  };

  const togglePreviewFullscreen = () => {
    setIsPreviewFullscreen(!isPreviewFullscreen);
    setIsEditorFullscreen(false);
    setIsFullscreen(false);
  };

  // Renderizar contenido
  const renderContent = () => {
    const showEditor = viewMode === 'edit' || viewMode === 'split';
    const showPreview = viewMode === 'preview' || viewMode === 'split';

    return (
      <div className="markdown-node-wrapper border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'edit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Solo edición"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Dividido"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'preview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Solo preview"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {showPreview && (
              <button
                onClick={handleExportPDF}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Exportar a PDF"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {showEditor && (
              <button
                onClick={toggleEditorFullscreen}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Pantalla completa editor"
              >
                {isEditorFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            )}
            {showPreview && (
              <button
                onClick={togglePreviewFullscreen}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Pantalla completa preview"
              >
                {isPreviewFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="flex" style={{ height: '500px' }}>
          {/* Editor */}
          {showEditor && (
            <div
              className={`${
                viewMode === 'split' ? 'w-1/2' : 'w-full'
              } border-r border-gray-200 flex flex-col ${
                isEditorFullscreen ? 'fixed inset-0 z-[10000] bg-white' : ''
              }`}
            >
              {isEditorFullscreen && (
                <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2">
                  <span className="font-semibold text-gray-700">Editor Markdown</span>
                  <button
                    onClick={toggleEditorFullscreen}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder="Escribe tu markdown aquí..."
                className="flex-1 w-full p-4 font-mono text-sm border-0 resize-none focus:outline-none"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          )}

          {/* Preview */}
          {showPreview && (
            <div
              ref={previewRef}
              className={`${
                viewMode === 'split' ? 'w-1/2' : 'w-full'
              } overflow-y-auto p-4 bg-gray-50 ${
                isPreviewFullscreen ? 'fixed inset-0 z-[10000] bg-white' : ''
              }`}
            >
              {isPreviewFullscreen && (
                <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-4 py-2 sticky top-0">
                  <span className="font-semibold text-gray-700">Vista Previa Markdown</span>
                  <button
                    onClick={togglePreviewFullscreen}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div 
                ref={previewRef}
                className="prose prose-sm max-w-none markdown-preview"
                style={{
                  color: '#374151',
                }}
              >
                <ReactMarkdown>{content || '*Escribe markdown para ver la vista previa*'}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <NodeViewWrapper className="markdown-node my-4">
      {renderContent()}
    </NodeViewWrapper>
  );
}

