import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, History, X, GitBranch, Eye, CheckCircle, AlertCircle, FolderOpen, FileText, Download, FileDown, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';
import BlockWithDeleteButton from '../components/BlockWithDeleteButton';
import SQLVersionService from '../services/SQLVersionService';
import SQLFileService from '../services/SQLFileService';
import SQLFileSaveModal from '../components/SQLFileSaveModal';
import jsPDF from 'jspdf';

export default function SQLScriptNode({ node, updateAttributes, editor, getPos }) {
  const [content, setContent] = useState(node.attrs.content || '');
  const [version, setVersion] = useState(node.attrs.version || '');
  const [fileName, setFileName] = useState(node.attrs.fileName || '');
  const [fileDescription, setFileDescription] = useState(node.attrs.fileDescription || '');
  const [pageId, setPageId] = useState(node.attrs.pageId || null);
  const [pageName, setPageName] = useState(node.attrs.pageName || null);
  const [scriptId] = useState(() => node.attrs.scriptId || null);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenContent, setFullscreenContent] = useState('');
  const textareaRef = useRef(null);
  const fullscreenRef = useRef(null);

  // Cargar información del archivo si existe scriptId
  useEffect(() => {
    if (scriptId) {
      loadFileInfo();
      loadVersions();
    }
  }, [scriptId]);

  // Actualizar atributos cuando cambia el contenido
  useEffect(() => {
    updateAttributes({
      content,
      version,
      scriptId,
      fileName,
      fileDescription,
      pageId,
      pageName,
    });
  }, [content, version, scriptId, fileName, fileDescription, pageId, pageName]);

  const loadFileInfo = async () => {
    if (!scriptId) return;
    try {
      const file = await SQLFileService.getFile(scriptId);
      if (file) {
        setFileName(file.name || '');
        setFileDescription(file.description || '');
        setContent(file.content || '');
        setVersion(file.version || '');
        setPageId(file.pageId || null);
        setPageName(file.pageName || null);
      }
    } catch (error) {
      console.error('Error cargando información del archivo:', error);
    }
  };

  const loadVersions = async () => {
    try {
      const vers = await SQLVersionService.getVersions(scriptId);
      setVersions(vers);
    } catch (error) {
      console.error('Error cargando versiones:', error);
    }
  };

  const handleSaveVersion = async () => {
    // Si no hay nombre de archivo, abrir modal para guardar
    if (!fileName || !scriptId) {
      setShowSaveModal(true);
      return;
    }

    // Si ya está guardado pero queremos permitir editar asociación, abrir modal
    // Por ahora, guardar directamente pero en el futuro se puede agregar opción para editar
    // Por ahora, siempre abrir modal para permitir cambiar asociación si se desea
    setShowSaveModal(true);
  };

  const handleSaveFile = async (fileData) => {
    try {
      let currentScriptId = scriptId;
      
      // Si no hay scriptId, crear uno nuevo
      if (!currentScriptId) {
        currentScriptId = SQLFileService.generateFileId(fileData.name);
      }

      // Guardar archivo
      await SQLFileService.saveFile(currentScriptId, {
        name: fileData.name,
        description: fileData.description,
        content,
        version: fileData.version,
        pageId: fileData.pageId || null,
        pageName: fileData.pageName || null,
      });

      // Guardar versión en base de datos (archivos JSON)
      // Esto asegura que el versionamiento sea persistente
      await SQLVersionService.createVersion(currentScriptId, {
        content,
        version: fileData.version || null,
      });

      // Actualizar estado
      setFileName(fileData.name);
      setFileDescription(fileData.description);
      setVersion(fileData.version || '');
      setPageId(fileData.pageId || null);
      setPageName(fileData.pageName || null);
      updateAttributes({
        scriptId: currentScriptId,
        fileName: fileData.name,
        fileDescription: fileData.description,
        content,
        version: fileData.version || '',
        pageId: fileData.pageId || null,
        pageName: fileData.pageName || null,
      });

      await loadVersions();
      setShowSaveModal(false);
      
      // Si se cambió la página asociada, actualizar el estado
      if (fileData.pageId !== pageId || fileData.pageName !== pageName) {
        setPageId(fileData.pageId || null);
        setPageName(fileData.pageName || null);
      }
      
      setToast({
        message: 'Archivo guardado correctamente',
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error guardando archivo:', error);
      setToast({
        message: 'Error al guardar el archivo',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      const versionData = await SQLVersionService.getVersion(versionId);
      if (versionData) {
        setContent(versionData.content);
        setVersion(versionData.version || '');
        setSelectedVersion(null);
        setShowHistory(false);
        setToast({
          message: 'Versión restaurada correctamente',
          type: 'success'
        });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Error restaurando versión:', error);
      setToast({
        message: 'Error al restaurar la versión',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCompareVersions = (version1, version2) => {
    const diff = SQLVersionService.compareVersions(version1, version2);
    setShowDiff(true);
    // Aquí podrías mostrar un modal con el diff
    console.log('Diff:', diff);
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(fileName, 14, 20);
      
      if (fileDescription) {
        doc.setFontSize(12);
        doc.text(`Descripción: ${fileDescription}`, 14, 30);
      }

      if (version) {
        doc.setFontSize(10);
        doc.text(`Versión: ${version}`, 14, 40);
      }

      doc.setFontSize(10);
      doc.setFont('courier');
      const lines = content.split('\n');
      let y = 50;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 14;
      const maxWidth = doc.internal.pageSize.width - (margin * 2);

      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        doc.text(wrappedLines, margin, y);
        y += wrappedLines.length * 5;
      });

      doc.save(`${fileName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      
      setToast({
        message: 'PDF exportado correctamente',
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      setToast({
        message: 'Error al exportar PDF',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleExportTXT = async () => {
    try {
      // Si no hay nombre de archivo, usar un nombre por defecto
      const nombreArchivo = fileName || 'script-sql';
      
      let txtContent = `Script SQL: ${nombreArchivo}\n`;
      txtContent += `========================================\n\n`;
      
      if (fileDescription) {
        txtContent += `Descripción: ${fileDescription}\n\n`;
      }
      
      if (version) {
        txtContent += `Versión: ${version}\n\n`;
      }
      
      if (pageName) {
        txtContent += `Página asociada: ${pageName}\n\n`;
      }
      
      txtContent += `========================================\n\n`;
      txtContent += content || '';

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${nombreArchivo.replace(/[^a-z0-9]/gi, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToast({
        message: 'TXT exportado correctamente',
        type: 'success'
      });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error exportando TXT:', error);
      setToast({
        message: 'Error al exportar TXT',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const textToCopy = isFullscreen ? fullscreenContent : content;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
      setToast({
        message: 'Error al copiar el contenido',
        type: 'error'
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleFullscreen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFullscreenContent(content);
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    // Guardar cambios antes de cerrar
    if (fullscreenContent !== content) {
      setContent(fullscreenContent);
      updateAttributes({
        content: fullscreenContent,
        version,
        scriptId,
        fileName,
        fileDescription,
        pageId,
        pageName,
      });
    }
    setIsFullscreen(false);
  };

  const handleFullscreenContentChange = (e) => {
    setFullscreenContent(e.target.value);
  };

  // Actualizar el contenido del modal cuando se abre
  useEffect(() => {
    if (isFullscreen && !fullscreenContent) {
      setFullscreenContent(content);
    }
  }, [isFullscreen]);

  return (
    <NodeViewWrapper className="sql-script-node my-4">
      <BlockWithDeleteButton editor={editor} getPos={getPos} node={node}>
      <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            {fileName ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                  {fileName}
                </span>
                {version && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex-shrink-0">
                    v{version}
                  </span>
                )}
                {pageName && pageId && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Disparar evento para navegar a la página
                      window.dispatchEvent(new CustomEvent('navigate-to-page', {
                        detail: { pageId }
                      }));
                    }}
                    className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded flex-shrink-0 flex items-center gap-1 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                    title={`Ir a página: ${pageName}`}
                  >
                    <FileText className="w-3 h-3" />
                    {pageName}
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Script SQL sin guardar
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {content && content.trim() && (
              <>
                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title="Copiar contenido"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title="Ampliar pantalla"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportTXT();
                  }}
                  className="p-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  title="Descargar como .txt"
                >
                  <FileDown className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleSaveVersion}
              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              title={fileName ? "Guardar nueva versión" : "Guardar archivo"}
            >
              <Save className="w-4 h-4" />
            </button>
            {scriptId && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                title="Ver historial de versiones"
              >
                <History className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe tu script SQL aquí..."
            className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-none outline-none resize-none min-h-[200px]"
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        {/* Historial de versiones */}
        {showHistory && (
          <div className="border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Historial de Versiones ({versions.length})
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {versions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay versiones guardadas</p>
            ) : (
              <div className="space-y-2">
                {versions.map((ver) => (
                  <div
                    key={ver.id}
                    className="border border-gray-300 dark:border-gray-600 rounded p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {ver.version && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            v{ver.version}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {SQLVersionService.formatDate(ver.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRestoreVersion(ver.id)}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          title="Restaurar esta versión"
                        >
                          Restaurar
                        </button>
                        {selectedVersion && selectedVersion.id !== ver.id && (
                          <button
                            onClick={() => handleCompareVersions(selectedVersion, ver)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            title="Comparar con versión seleccionada"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                        {!selectedVersion && (
                          <button
                            onClick={() => setSelectedVersion(ver)}
                            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            title="Seleccionar para comparar"
                          >
                            Seleccionar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {ver.metadata?.lineCount || 0} líneas, {ver.metadata?.contentLength || 0} caracteres
                    </div>
                    <pre className="text-xs mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto max-h-20">
                      {ver.content.substring(0, 200)}
                      {ver.content.length > 200 && '...'}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Toast de notificaciones */}
      {toast && (
        <div
          className={`
            fixed bottom-4 right-4 z-50
            ${toast.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }
            border rounded-lg shadow-lg
            px-4 py-3 flex items-center gap-3
            min-w-[300px] max-w-[400px]
            transition-all duration-300 ease-in-out
            animate-in slide-in-from-bottom-4
          `}
        >
          <div className={toast.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className={`${toast.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} hover:opacity-70 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal para guardar archivo */}
      <SQLFileSaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveFile}
        initialName={fileName}
        initialDescription={fileDescription}
      />

      {/* Modal Fullscreen */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[50000] bg-gray-900 flex flex-col">
          {/* Header del modal */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {fileName || 'Script SQL'}
                </h2>
                {fileDescription && (
                  <p className="text-sm text-gray-400">{fileDescription}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(fullscreenContent || content);
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
                  if (fullscreenContent !== content) {
                    setContent(fullscreenContent);
                    updateAttributes({
                      content: fullscreenContent,
                      version,
                      scriptId,
                      fileName,
                      fileDescription,
                      pageId,
                      pageName,
                    });
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
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2"
                title="Cerrar"
                type="button"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
          
          {/* Contenido del editor editable */}
          <div className="flex-1 overflow-auto p-6">
            <textarea
              ref={fullscreenRef}
              value={fullscreenContent || content}
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
              placeholder="Escribe o pega tu script SQL aquí..."
            />
          </div>
        </div>,
        document.body
      )}
      </BlockWithDeleteButton>
    </NodeViewWrapper>
  );
}

