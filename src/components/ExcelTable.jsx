import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Camera, Copy, Download, Trash2, Maximize2 } from 'lucide-react';

export default function ExcelTable({ node, updateAttributes, editor }) {
  const [rows, setRows] = useState(node.attrs.rows || 5);
  const [cols, setCols] = useState(node.attrs.cols || 5);
  const [data, setData] = useState(node.attrs.data || {});
  const [columnWidths, setColumnWidths] = useState(node.attrs.columnWidths || {});
  const [rowHeights, setRowHeights] = useState(node.attrs.rowHeights || {});
  const [isResizing, setIsResizing] = useState({ type: null, index: null });
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [copiedCells, setCopiedCells] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const tableRef = useRef(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Inicializar datos si no existen
  useEffect(() => {
    const newData = {};
    const newColumnWidths = {};
    const newRowHeights = {};
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}-${c}`;
        if (!data[key]) {
          newData[key] = '';
        }
        if (!columnWidths[c]) {
          newColumnWidths[c] = 120; // Ancho por defecto
        }
        if (!rowHeights[r]) {
          newRowHeights[r] = 30; // Alto por defecto
        }
      }
    }
    
    if (Object.keys(newData).length > 0 || Object.keys(newColumnWidths).length > 0 || Object.keys(newRowHeights).length > 0) {
      setData(prev => ({ ...prev, ...newData }));
      setColumnWidths(prev => ({ ...prev, ...newColumnWidths }));
      setRowHeights(prev => ({ ...prev, ...newRowHeights }));
    }
  }, [rows, cols]);

  // Guardar cambios en el nodo
  useEffect(() => {
    updateAttributes({
      rows,
      cols,
      data,
      columnWidths,
      rowHeights
    });
  }, [rows, cols, data, columnWidths, rowHeights, updateAttributes]);

  // Manejar redimensionamiento de columnas
  const handleMouseDown = (e, type, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing({ type, index });
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (type === 'column') {
      const colElement = e.currentTarget.previousElementSibling || e.currentTarget.parentElement.querySelector(`th:nth-child(${index + 1}), td:nth-child(${index + 1})`);
      if (colElement) {
        resizeStartPos.current = {
          x: e.clientX,
          y: e.clientY,
          width: colElement.offsetWidth,
          height: 0
        };
      }
    } else if (type === 'row') {
      const rowElement = e.currentTarget.parentElement;
      if (rowElement) {
        resizeStartPos.current = {
          x: e.clientX,
          y: e.clientY,
          width: 0,
          height: rowElement.offsetHeight
        };
      }
    }
  };

  // Manejar movimiento del mouse durante redimensionamiento
  useEffect(() => {
    if (!isResizing.type && isResizing.index === null) return;

    const handleMouseMove = (e) => {
      if (isResizing.type === 'column') {
        const diff = e.clientX - resizeStartPos.current.x;
        const newWidth = Math.max(50, resizeStartPos.current.width + diff);
        setColumnWidths(prev => ({
          ...prev,
          [isResizing.index]: newWidth
        }));
      } else if (isResizing.type === 'row') {
        const diff = e.clientY - resizeStartPos.current.y;
        const newHeight = Math.max(20, resizeStartPos.current.height + diff);
        setRowHeights(prev => ({
          ...prev,
          [isResizing.index]: newHeight
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing({ type: null, index: null });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Manejar cambio de valor en celda
  const handleCellChange = (row, col, value) => {
    const key = `${row}-${col}`;
    setData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Manejar selección de celdas
  const handleCellClick = (e, row, col) => {
    if (e.shiftKey && selectedCells.size > 0) {
      // Selección múltiple
      const firstSelected = Array.from(selectedCells)[0].split('-').map(Number);
      const [startRow, startCol] = firstSelected;
      const [endRow, endCol] = [row, col];
      
      const newSelection = new Set();
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          newSelection.add(`${r}-${c}`);
        }
      }
      setSelectedCells(newSelection);
    } else if (e.ctrlKey || e.metaKey) {
      // Selección múltiple con Ctrl/Cmd
      const key = `${row}-${col}`;
      const newSelection = new Set(selectedCells);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      setSelectedCells(newSelection);
    } else {
      // Selección simple
      setSelectedCells(new Set([`${row}-${col}`]));
    }
  };

  // Copiar celdas seleccionadas
  const handleCopy = () => {
    if (selectedCells.size === 0) return;
    
    const cells = Array.from(selectedCells).map(key => key.split('-').map(Number));
    const minRow = Math.min(...cells.map(([r]) => r));
    const maxRow = Math.max(...cells.map(([r]) => r));
    const minCol = Math.min(...cells.map(([, c]) => c));
    const maxCol = Math.max(...cells.map(([, c]) => c));
    
    const copiedData = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        const key = `${r}-${c}`;
        row.push(data[key] || '');
      }
      copiedData.push(row);
    }
    
    setCopiedCells({ data: copiedData, startRow: minRow, startCol: minCol });
    
    // Copiar al portapapeles
    const text = copiedData.map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text);
  };

  // Pegar celdas
  const handlePaste = (e) => {
    if (!copiedCells) return;
    
    const activeCell = Array.from(selectedCells)[0];
    if (!activeCell) return;
    
    const [startRow, startCol] = activeCell.split('-').map(Number);
    const { data: copiedData } = copiedCells;
    
    const newData = { ...data };
    copiedData.forEach((row, rOffset) => {
      row.forEach((value, cOffset) => {
        const key = `${startRow + rOffset}-${startCol + cOffset}`;
        newData[key] = value;
      });
    });
    
    setData(newData);
  };

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleCopy();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          handlePaste(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCells, copiedCells, data]);

  // Capturar imagen de la tabla
  const handleCapture = async () => {
    if (!tableRef.current) return;
    
    try {
      // html2canvas está disponible globalmente desde index.html
      if (typeof window !== 'undefined' && window.html2canvas) {
        const canvas = await window.html2canvas(tableRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `tabla-excel-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Fallback: usar la API nativa de captura si está disponible
        alert('La funcionalidad de captura requiere html2canvas. Por favor, usa la función de captura de pantalla del sistema (Win+Shift+S en Windows o Cmd+Shift+4 en Mac).');
      }
    } catch (error) {
      console.error('Error al capturar imagen:', error);
      alert('Error al capturar la imagen. Por favor, usa la función de captura de pantalla del sistema (Win+Shift+S en Windows o Cmd+Shift+4 en Mac).');
    }
  };

  // Agregar/eliminar filas y columnas
  const addRow = () => {
    setRows(prev => prev + 1);
    setRowHeights(prev => ({ ...prev, [rows]: 30 }));
  };

  const removeRow = () => {
    if (rows > 1) {
      setRows(prev => prev - 1);
      const newData = { ...data };
      const newRowHeights = { ...rowHeights };
      for (let c = 0; c < cols; c++) {
        delete newData[`${rows - 1}-${c}`];
      }
      delete newRowHeights[rows - 1];
      setData(newData);
      setRowHeights(newRowHeights);
    }
  };

  const addColumn = () => {
    setCols(prev => prev + 1);
    setColumnWidths(prev => ({ ...prev, [cols]: 120 }));
  };

  const removeColumn = () => {
    if (cols > 1) {
      setCols(prev => prev - 1);
      const newData = { ...data };
      const newColumnWidths = { ...columnWidths };
      for (let r = 0; r < rows; r++) {
        delete newData[`${r}-${cols - 1}`];
      }
      delete newColumnWidths[cols - 1];
      setData(newData);
      setColumnWidths(newColumnWidths);
    }
  };

  const tableContent = (
    <div className="excel-table-container bg-white border border-gray-300 rounded-lg shadow-sm overflow-auto" ref={tableRef}>
      <div className="excel-table-toolbar bg-gray-50 border-b border-gray-300 p-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCapture}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-sm"
            title="Capturar imagen"
          >
            <Camera className="w-4 h-4" />
            <span>Capturar</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-sm"
            title="Copiar (Ctrl+C)"
          >
            <Copy className="w-4 h-4" />
            <span>Copiar</span>
          </button>
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
            <span className="text-sm text-gray-600">Filas:</span>
            <button onClick={removeRow} className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">-</button>
            <span className="text-sm font-medium w-8 text-center">{rows}</span>
            <button onClick={addRow} className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">+</button>
          </div>
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2 ml-2">
            <span className="text-sm text-gray-600">Columnas:</span>
            <button onClick={removeColumn} className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">-</button>
            <span className="text-sm font-medium w-8 text-center">{cols}</span>
            <button onClick={addColumn} className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">+</button>
          </div>
        </div>
        <button
          onClick={() => {
            if (editor) {
              editor.chain().focus().deleteNode('excelTable').run();
            }
          }}
          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1.5 text-sm"
          title="Eliminar tabla"
        >
          <Trash2 className="w-4 h-4" />
          <span>Eliminar</span>
        </button>
      </div>
      
      <table className="excel-table w-full border-collapse" style={{ minWidth: '100%' }}>
        <thead>
          <tr>
            <th className="excel-header-cell bg-gray-100 border border-gray-300 p-1 text-xs font-semibold text-gray-700 sticky left-0 z-10" style={{ width: '40px', minWidth: '40px' }}>
              #
            </th>
            {Array.from({ length: cols }).map((_, colIndex) => (
              <th
                key={colIndex}
                className="excel-header-cell bg-gray-100 border border-gray-300 p-1 text-xs font-semibold text-gray-700 relative"
                style={{ 
                  width: columnWidths[colIndex] || 120,
                  minWidth: columnWidths[colIndex] || 120,
                  position: 'relative'
                }}
              >
                <div className="flex items-center justify-center">
                  {String.fromCharCode(65 + colIndex)}
                </div>
                <div
                  className="excel-resize-handle absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                  onMouseDown={(e) => handleMouseDown(e, 'column', colIndex)}
                  style={{ zIndex: 20 }}
                />
              </th>
            ))}
            <th className="excel-header-cell bg-gray-100 border border-gray-300 p-1 text-xs font-semibold text-gray-700" style={{ width: '20px', minWidth: '20px' }}>
              <div
                className="excel-resize-handle w-full h-1 cursor-row-resize hover:bg-blue-500 bg-transparent"
                onMouseDown={(e) => handleMouseDown(e, 'row', -1)}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} style={{ height: rowHeights[rowIndex] || 30 }}>
              <td className="excel-row-header bg-gray-50 border border-gray-300 p-1 text-xs font-semibold text-gray-700 text-center sticky left-0 z-10">
                {rowIndex + 1}
              </td>
              {Array.from({ length: cols }).map((_, colIndex) => {
                const cellKey = `${rowIndex}-${colIndex}`;
                const isSelected = selectedCells.has(cellKey);
                return (
                  <td
                    key={colIndex}
                    className={`excel-cell border border-gray-300 p-0 relative ${
                      isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'
                    }`}
                    style={{ 
                      width: columnWidths[colIndex] || 120,
                      minWidth: columnWidths[colIndex] || 120
                    }}
                    onClick={(e) => handleCellClick(e, rowIndex, colIndex)}
                  >
                    <input
                      type="text"
                      value={data[cellKey] || ''}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full h-full px-2 py-1 text-sm border-none outline-none bg-transparent"
                      style={{ height: rowHeights[rowIndex] || 30 }}
                    />
                  </td>
                );
              })}
              <td className="excel-row-resize bg-gray-50 border border-gray-300 p-0" style={{ width: '20px', position: 'relative' }}>
                <div
                  className="excel-resize-handle w-full h-1 cursor-row-resize hover:bg-blue-500 bg-transparent absolute bottom-0"
                  onMouseDown={(e) => handleMouseDown(e, 'row', rowIndex)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <NodeViewWrapper className="excel-table-wrapper my-4">
      {tableContent}
    </NodeViewWrapper>
  );
}

