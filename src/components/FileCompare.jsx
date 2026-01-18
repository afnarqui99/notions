import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X, FileText, Upload, Copy, Trash2, RefreshCw } from 'lucide-react';

/**
 * Componente para comparar dos archivos mostrando diferencias
 * Similar al diff viewer de Visual Studio Code
 */
export default function FileCompare({ 
  onClose, 
  // Props para control desde FileCompareBlock (opcional)
  leftContent: controlledLeftContent,
  rightContent: controlledRightContent,
  leftFileName: controlledLeftFileName,
  rightFileName: controlledRightFileName,
  onLeftContentChange,
  onRightContentChange,
  onLeftFileNameChange,
  onRightFileNameChange,
  onDelete,
}) {
  // Si se pasan props controlados, usarlos; si no, usar estado interno
  const [internalLeftContent, setInternalLeftContent] = useState('');
  const [internalRightContent, setInternalRightContent] = useState('');
  const [internalLeftFileName, setInternalLeftFileName] = useState('archivo1.txt');
  const [internalRightFileName, setInternalRightFileName] = useState('archivo2.txt');
  
  const isControlled = controlledLeftContent !== undefined;
  
  const leftContent = isControlled ? controlledLeftContent : internalLeftContent;
  const rightContent = isControlled ? controlledRightContent : internalRightContent;
  const leftFileName = isControlled ? (controlledLeftFileName || 'archivo1.txt') : internalLeftFileName;
  const rightFileName = isControlled ? (controlledRightFileName || 'archivo2.txt') : internalRightFileName;
  
  const setLeftContent = (value) => {
    if (isControlled && onLeftContentChange) {
      onLeftContentChange(value);
    } else {
      setInternalLeftContent(value);
    }
  };
  
  const setRightContent = (value) => {
    if (isControlled && onRightContentChange) {
      onRightContentChange(value);
    } else {
      setInternalRightContent(value);
    }
  };
  
  const setLeftFileName = (value) => {
    if (isControlled && onLeftFileNameChange) {
      onLeftFileNameChange(value);
    } else {
      setInternalLeftFileName(value);
    }
  };
  
  const setRightFileName = (value) => {
    if (isControlled && onRightFileNameChange) {
      onRightFileNameChange(value);
    } else {
      setInternalRightFileName(value);
    }
  };
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const leftFileInputRef = useRef(null);
  const rightFileInputRef = useRef(null);
  const leftTextareaRef = useRef(null);
  const rightTextareaRef = useRef(null);

  // Calcular diferencias usando algoritmo de Longest Common Subsequence (LCS)
  const calculateDiff = (left, right) => {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    
    // Matriz para LCS
    const m = leftLines.length;
    const n = rightLines.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Calcular LCS
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (leftLines[i - 1] === rightLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    // Reconstruir diff
    const diff = [];
    let i = m, j = n;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
        // Líneas iguales
        diff.unshift({
          type: 'equal',
          left: leftLines[i - 1],
          right: rightLines[j - 1],
          leftIndex: i - 1,
          rightIndex: j - 1,
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        // Línea agregada en right
        diff.unshift({
          type: 'added',
          left: null,
          right: rightLines[j - 1],
          leftIndex: null,
          rightIndex: j - 1,
        });
        j--;
      } else {
        // Línea eliminada en left
        diff.unshift({
          type: 'removed',
          left: leftLines[i - 1],
          right: null,
          leftIndex: i - 1,
          rightIndex: null,
        });
        i--;
      }
    }
    
    return diff;
  };

  const diff = calculateDiff(leftContent, rightContent);

  // Manejar carga de archivos
  const handleFileLoad = (file, side) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (side === 'left') {
        setLeftContent(e.target.result);
        setLeftFileName(file.name);
      } else {
        setRightContent(e.target.result);
        setRightFileName(file.name);
      }
    };
    reader.onerror = () => {
      alert('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  // Copiar contenido al portapapeles
  const handleCopy = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      alert('Contenido copiado al portapapeles');
    });
  };

  // Limpiar archivos
  const handleClear = (side) => {
    if (side === 'left') {
      setLeftContent('');
      setLeftFileName('archivo1.txt');
      if (leftFileInputRef.current) leftFileInputRef.current.value = '';
    } else {
      setRightContent('');
      setRightFileName('archivo2.txt');
      if (rightFileInputRef.current) rightFileInputRef.current.value = '';
    }
  };

  // Limpiar todo
  const handleClearAll = () => {
    setLeftContent('');
    setRightContent('');
    setLeftFileName('archivo1.txt');
    setRightFileName('archivo2.txt');
    if (leftFileInputRef.current) leftFileInputRef.current.value = '';
    if (rightFileInputRef.current) rightFileInputRef.current.value = '';
  };
  
  // Si se pasa onDelete y no onClose, usar onDelete para cerrar
  const handleClose = onDelete || onClose;

  // Obtener clase CSS según tipo de diferencia (solo para el contenedor)
  const getDiffClass = (type, side) => {
    if (type === 'equal') return '';
    if (type === 'added' && side === 'right') {
      return 'bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500';
    }
    if (type === 'removed' && side === 'left') {
      return 'bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500';
    }
    if (type === 'modified') {
      return side === 'left' 
        ? 'bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-500'
        : 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500';
    }
    return '';
  };
  
  // Verificar si una línea tiene diferencias para aplicar color de texto
  const hasDiff = (type) => type !== 'equal';
  
  // Obtener clase CSS para modal de pantalla completa (fondo oscuro)
  const getDiffClassFullscreen = (type, side) => {
    if (type === 'equal') return '';
    if (type === 'added' && side === 'right') {
      return 'bg-green-900/60 border-l-4 border-green-500';
    }
    if (type === 'removed' && side === 'left') {
      return 'bg-red-900/60 border-l-4 border-red-500';
    }
    if (type === 'modified') {
      return side === 'left' 
        ? 'bg-yellow-900/60 border-l-4 border-yellow-500'
        : 'bg-blue-900/60 border-l-4 border-blue-500';
    }
    return '';
  };

  // Obtener símbolo para diferencias
  const getDiffSymbol = (type, side) => {
    if (type === 'equal') return '';
    if (type === 'added' && side === 'right') return '+';
    if (type === 'removed' && side === 'left') return '-';
    if (type === 'modified') return side === 'left' ? '-' : '+';
    return '';
  };

  return (
    <div className={`flex flex-col ${isExpanded ? 'h-screen' : 'h-[600px]'} border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Comparar Archivos</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {diff.filter(d => d.type !== 'equal').length} diferencias
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón expandir/colapsar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title={isExpanded ? "Colapsar" : "Expandir"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          {/* Botón fullscreen */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="Pantalla completa"
          >
            <Maximize2 size={16} />
          </button>
          
          {/* Botón cerrar */}
          {handleClose && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400 hover:text-red-600"
              title={onDelete ? "Eliminar bloque" : "Cerrar"}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Botón cargar archivo izquierdo */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
            <Upload size={14} />
            <span>Cargar Izquierdo</span>
            <input
              ref={leftFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0], 'left')}
            />
          </label>

          {/* Botón cargar archivo derecho */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
            <Upload size={14} />
            <span>Cargar Derecho</span>
            <input
              ref={rightFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0], 'right')}
            />
          </label>

          {/* Botón limpiar todo */}
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <RefreshCw size={14} />
            <span>Limpiar Todo</span>
          </button>
        </div>
      </div>

      {/* Contenedor principal - Vista lado a lado */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel Izquierdo */}
        <div className="flex-1 flex flex-col border-r border-gray-300 dark:border-gray-700">
          {/* Header del panel izquierdo */}
          <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{leftFileName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({leftContent.split('\n').length} líneas)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy(leftContent)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="Copiar contenido"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => handleClear('left')}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400"
                title="Limpiar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Editor izquierdo */}
          <div 
            className="flex-1 overflow-auto bg-white dark:bg-gray-900"
            id="left-panel"
            onScroll={(e) => {
              const rightPanel = document.getElementById('right-panel');
              if (rightPanel) {
                rightPanel.scrollTop = e.target.scrollTop;
              }
            }}
          >
            <div className="font-mono text-sm">
              {diff.map((item, index) => {
                if (item.left === null) {
                  // Línea vacía para mantener sincronización visual
                  return (
                    <div key={`left-empty-${index}`} className="flex min-h-[20px]">
                      <div className="w-12 px-2 text-right text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 select-none">
                      </div>
                      <div className="px-2"></div>
                      <div className="flex-1 px-2 py-0.5">
                        {'\u00A0'}
                      </div>
                    </div>
                  );
                }
                const lineNum = item.leftIndex !== null ? item.leftIndex + 1 : '';
                return (
                  <div
                    key={`left-${index}`}
                    className={`flex ${getDiffClass(item.type, 'left')} min-h-[20px] hover:bg-opacity-70 transition-colors`}
                  >
                    <div className="w-12 px-2 text-right text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 select-none">
                      {lineNum}
                    </div>
                    <div className="px-2 text-red-600 dark:text-red-400 font-bold">
                      {getDiffSymbol(item.type, 'left')}
                    </div>
                    <div className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-words ${hasDiff(item.type) ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}`}>
                      {item.left || '\u00A0'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Textarea para pegar texto (oculto inicialmente, puede activarse) */}
          <div className="border-t border-gray-300 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900">
            <textarea
              ref={leftTextareaRef}
              value={leftContent}
              onChange={(e) => setLeftContent(e.target.value)}
              placeholder="Pega el contenido del archivo izquierdo aquí..."
              className="w-full h-24 p-2 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none"
            />
          </div>
        </div>

        {/* Panel Derecho */}
        <div className="flex-1 flex flex-col">
          {/* Header del panel derecho */}
          <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rightFileName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({rightContent.split('\n').length} líneas)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy(rightContent)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="Copiar contenido"
              >
                <Copy size={14} />
              </button>
              <button
                onClick={() => handleClear('right')}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-400"
                title="Limpiar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Editor derecho */}
          <div 
            className="flex-1 overflow-auto bg-white dark:bg-gray-900"
            id="right-panel"
            onScroll={(e) => {
              const leftPanel = document.getElementById('left-panel');
              if (leftPanel) {
                leftPanel.scrollTop = e.target.scrollTop;
              }
            }}
          >
            <div className="font-mono text-sm">
              {diff.map((item, index) => {
                if (item.right === null) {
                  // Línea vacía para mantener sincronización visual
                  return (
                    <div key={`right-empty-${index}`} className="flex min-h-[20px]">
                      <div className="w-12 px-2 text-right text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 select-none">
                      </div>
                      <div className="px-2"></div>
                      <div className="flex-1 px-2 py-0.5">
                        {'\u00A0'}
                      </div>
                    </div>
                  );
                }
                const lineNum = item.rightIndex !== null ? item.rightIndex + 1 : '';
                return (
                  <div
                    key={`right-${index}`}
                    className={`flex ${getDiffClass(item.type, 'right')} min-h-[20px] hover:bg-opacity-70 transition-colors`}
                  >
                    <div className="w-12 px-2 text-right text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 select-none">
                      {lineNum}
                    </div>
                    <div className="px-2 text-green-600 dark:text-green-400 font-bold">
                      {getDiffSymbol(item.type, 'right')}
                    </div>
                    <div className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-words ${hasDiff(item.type) ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}`}>
                      {item.right || '\u00A0'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Textarea para pegar texto */}
          <div className="border-t border-gray-300 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900">
            <textarea
              ref={rightTextareaRef}
              value={rightContent}
              onChange={(e) => setRightContent(e.target.value)}
              placeholder="Pega el contenido del archivo derecho aquí..."
              className="w-full h-24 p-2 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Footer con estadísticas */}
      <div className="p-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            <span className="text-green-600 dark:text-green-400">●</span> Agregadas: {diff.filter(d => d.type === 'added').length}
          </span>
          <span>
            <span className="text-red-600 dark:text-red-400">●</span> Eliminadas: {diff.filter(d => d.type === 'removed').length}
          </span>
          <span>
            <span className="text-yellow-600 dark:text-yellow-400">●</span> Modificadas: {diff.filter(d => d.type === 'modified').length}
          </span>
          <span>
            <span className="text-gray-400">●</span> Iguales: {diff.filter(d => d.type === 'equal').length}
          </span>
        </div>
      </div>

      {/* Modal de pantalla completa */}
      {isFullscreen && createPortal(
        <div 
          className="fixed inset-0 z-[10001] bg-gray-900 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-white" />
              <h2 className="text-white text-lg font-semibold">Comparar Archivos - Pantalla Completa</h2>
              <span className="text-xs text-gray-400">
                {diff.filter(d => d.type !== 'equal').length} diferencias
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsFullscreen(false);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors flex items-center gap-2"
                title="Salir de pantalla completa"
                type="button"
              >
                <Minimize2 size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>

          {/* Toolbar en pantalla completa */}
          <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
                <Upload size={14} />
                <span>Cargar Izquierdo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0], 'left')}
                />
              </label>
              <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
                <Upload size={14} />
                <span>Cargar Derecho</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileLoad(e.target.files[0], 'right')}
                />
              </label>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                <RefreshCw size={14} />
                <span>Limpiar Todo</span>
              </button>
            </div>
          </div>

          {/* Contenedor principal en pantalla completa */}
          <div className="flex flex-1 overflow-hidden">
            {/* Panel Izquierdo */}
            <div className="flex-1 flex flex-col border-r border-gray-700">
              <div className="flex items-center justify-between p-2 bg-gray-750 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{leftFileName}</span>
                  <span className="text-xs text-gray-400">({leftContent.split('\n').length} líneas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(leftContent)}
                    className="p-1 rounded hover:bg-gray-700 text-gray-300"
                    title="Copiar contenido"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleClear('left')}
                    className="p-1 rounded hover:bg-red-900/30 text-gray-300"
                    title="Limpiar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div 
                className="flex-1 overflow-auto bg-gray-900"
                id="left-panel-fs"
                onScroll={(e) => {
                  const rightPanel = document.getElementById('right-panel-fs');
                  if (rightPanel) {
                    rightPanel.scrollTop = e.target.scrollTop;
                  }
                }}
              >
                <div className="font-mono text-sm text-gray-100">
                  {diff.map((item, index) => {
                    if (item.left === null) {
                      return (
                        <div key={`left-empty-fs-${index}`} className="flex min-h-[20px]">
                          <div className="w-12 px-2 text-right text-xs text-gray-500 bg-gray-800 border-r border-gray-700 select-none"></div>
                          <div className="px-2"></div>
                          <div className="flex-1 px-2 py-0.5">{'\u00A0'}</div>
                        </div>
                      );
                    }
                    const lineNum = item.leftIndex !== null ? item.leftIndex + 1 : '';
                    return (
                      <div
                        key={`left-fs-${index}`}
                        className={`flex ${getDiffClassFullscreen(item.type, 'left')} min-h-[20px] hover:bg-opacity-70 transition-colors`}
                      >
                        <div className="w-12 px-2 text-right text-xs text-gray-500 bg-gray-800 border-r border-gray-700 select-none">{lineNum}</div>
                        <div className="px-2 text-red-400 font-bold">{getDiffSymbol(item.type, 'left')}</div>
                        <div className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-words ${hasDiff(item.type) ? 'text-gray-100 font-medium' : 'text-gray-300'}`}>{item.left || '\u00A0'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-gray-700 p-2 bg-gray-800">
                <textarea
                  value={leftContent}
                  onChange={(e) => setLeftContent(e.target.value)}
                  placeholder="Pega el contenido del archivo izquierdo aquí..."
                  className="w-full h-24 p-2 text-xs font-mono border border-gray-600 rounded bg-gray-900 text-gray-100 resize-none"
                />
              </div>
            </div>

            {/* Panel Derecho */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between p-2 bg-gray-750 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-200">{rightFileName}</span>
                  <span className="text-xs text-gray-400">({rightContent.split('\n').length} líneas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(rightContent)}
                    className="p-1 rounded hover:bg-gray-700 text-gray-300"
                    title="Copiar contenido"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => handleClear('right')}
                    className="p-1 rounded hover:bg-red-900/30 text-gray-300"
                    title="Limpiar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div 
                className="flex-1 overflow-auto bg-gray-900"
                id="right-panel-fs"
                onScroll={(e) => {
                  const leftPanel = document.getElementById('left-panel-fs');
                  if (leftPanel) {
                    leftPanel.scrollTop = e.target.scrollTop;
                  }
                }}
              >
                <div className="font-mono text-sm text-gray-100">
                  {diff.map((item, index) => {
                    if (item.right === null) {
                      return (
                        <div key={`right-empty-fs-${index}`} className="flex min-h-[20px]">
                          <div className="w-12 px-2 text-right text-xs text-gray-500 bg-gray-800 border-r border-gray-700 select-none"></div>
                          <div className="px-2"></div>
                          <div className="flex-1 px-2 py-0.5">{'\u00A0'}</div>
                        </div>
                      );
                    }
                    const lineNum = item.rightIndex !== null ? item.rightIndex + 1 : '';
                    return (
                      <div
                        key={`right-fs-${index}`}
                        className={`flex ${getDiffClassFullscreen(item.type, 'right')} min-h-[20px] hover:bg-opacity-70 transition-colors`}
                      >
                        <div className="w-12 px-2 text-right text-xs text-gray-500 bg-gray-800 border-r border-gray-700 select-none">{lineNum}</div>
                        <div className="px-2 text-green-400 font-bold">{getDiffSymbol(item.type, 'right')}</div>
                        <div className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-words ${hasDiff(item.type) ? 'text-gray-100 font-medium' : 'text-gray-300'}`}>{item.right || '\u00A0'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-gray-700 p-2 bg-gray-800">
                <textarea
                  value={rightContent}
                  onChange={(e) => setRightContent(e.target.value)}
                  placeholder="Pega el contenido del archivo derecho aquí..."
                  className="w-full h-24 p-2 text-xs font-mono border border-gray-600 rounded bg-gray-900 text-gray-100 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer con estadísticas */}
          <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span><span className="text-green-400">●</span> Agregadas: {diff.filter(d => d.type === 'added').length}</span>
              <span><span className="text-red-400">●</span> Eliminadas: {diff.filter(d => d.type === 'removed').length}</span>
              <span><span className="text-yellow-400">●</span> Modificadas: {diff.filter(d => d.type === 'modified').length}</span>
              <span><span className="text-gray-500">●</span> Iguales: {diff.filter(d => d.type === 'equal').length}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

