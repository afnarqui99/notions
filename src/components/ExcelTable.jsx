import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Camera, Copy, Download, Trash2, Maximize2, Palette, Type } from 'lucide-react';

export default function ExcelTable({ node, updateAttributes, editor }) {
  // Inicializar con valores por defecto si no existen
  const initialRows = node.attrs.rows || 5;
  const initialCols = node.attrs.cols || 5;
  
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [data, setData] = useState(node.attrs.data || {});
  const [columnWidths, setColumnWidths] = useState(node.attrs.columnWidths || {});
  const [rowHeights, setRowHeights] = useState(node.attrs.rowHeights || {});
  const [columnNames, setColumnNames] = useState(node.attrs.columnNames || {});
  const [cellTextColors, setCellTextColors] = useState(node.attrs.cellTextColors || {});
  const [cellBackgroundColors, setCellBackgroundColors] = useState(node.attrs.cellBackgroundColors || {});
  const [columnBackgroundColors, setColumnBackgroundColors] = useState(node.attrs.columnBackgroundColors || {});
  const [isResizing, setIsResizing] = useState({ type: null, index: null });
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [copiedCells, setCopiedCells] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState(null); // 'text', 'background', 'columnBackground'
  const [selectedTextColor, setSelectedTextColor] = useState('#000000');
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#ffffff');
  
  const tableRef = useRef(null);
  const tableContentRef = useRef(null); // Ref para la tabla sin toolbar
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Inicializar datos si no existen
  useEffect(() => {
    const newData = { ...data };
    const newColumnWidths = { ...columnWidths };
    const newRowHeights = { ...rowHeights };
    let hasChanges = false;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}-${c}`;
        if (!newData[key] && newData[key] !== '') {
          newData[key] = '';
          hasChanges = true;
        }
        if (!newColumnWidths[c]) {
          newColumnWidths[c] = 120; // Ancho por defecto
          hasChanges = true;
        }
        if (!newRowHeights[r]) {
          newRowHeights[r] = 30; // Alto por defecto
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      setData(newData);
      setColumnWidths(newColumnWidths);
      setRowHeights(newRowHeights);
    }
  }, [rows, cols]);

  // Guardar cambios en el nodo
  useEffect(() => {
    updateAttributes({
      rows,
      cols,
      data,
      columnWidths,
      rowHeights,
      columnNames,
      cellTextColors,
      cellBackgroundColors,
      columnBackgroundColors
    });
  }, [rows, cols, data, columnWidths, rowHeights, columnNames, cellTextColors, cellBackgroundColors, columnBackgroundColors, updateAttributes]);

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
      // Buscar el tr padre (puede estar en td > div o directamente en el tr)
      let rowElement = e.currentTarget.closest('tr');
      if (!rowElement) {
        rowElement = e.currentTarget.parentElement?.closest('tr');
      }
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
        // Si el índice es -1, aplicar a todas las filas
        if (isResizing.index === -1) {
          setRowHeights(prev => {
            const newHeights = {};
            for (let i = 0; i < rows; i++) {
              newHeights[i] = newHeight;
            }
            return { ...prev, ...newHeights };
          });
        } else {
          setRowHeights(prev => ({
            ...prev,
            [isResizing.index]: newHeight
          }));
        }
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

  // Manejar cambio de nombre de columna
  const handleColumnNameChange = (colIndex, value) => {
    setColumnNames(prev => ({
      ...prev,
      [colIndex]: value
    }));
  };

  // Aplicar color a celdas seleccionadas
  const applyColorToSelectedCells = (color, type) => {
    if (selectedCells.size === 0) {
      // Si no hay celdas seleccionadas, aplicar a todas las celdas visibles
      const newColors = { ...(type === 'text' ? cellTextColors : cellBackgroundColors) };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${r}-${c}`;
          newColors[key] = color;
        }
      }
      if (type === 'text') {
        setCellTextColors(newColors);
      } else {
        setCellBackgroundColors(newColors);
      }
    } else {
      const newColors = { ...(type === 'text' ? cellTextColors : cellBackgroundColors) };
      
      selectedCells.forEach(cellKey => {
        newColors[cellKey] = color;
      });
      
      if (type === 'text') {
        setCellTextColors(newColors);
      } else {
        setCellBackgroundColors(newColors);
      }
    }
  };

  // Aplicar color de fondo a columna completa
  const applyColorToColumn = (colIndex, color) => {
    const newColumnColors = { ...columnBackgroundColors };
    newColumnColors[colIndex] = color;
    setColumnBackgroundColors(newColumnColors);
    setShowColorPicker(false);
  };

  // Obtener color de texto de una celda
  const getCellTextColor = (row, col) => {
    const key = `${row}-${col}`;
    return cellTextColors[key] || '#000000';
  };

  // Obtener color de fondo de una celda
  const getCellBackgroundColor = (row, col) => {
    const key = `${row}-${col}`;
    return cellBackgroundColors[key] || columnBackgroundColors[col] || '#ffffff';
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

  // Capturar imagen de la tabla (sin toolbar)
  const handleCapture = async () => {
    if (!tableContentRef.current) return;
    
    try {
      // html2canvas está disponible globalmente desde index.html
      if (typeof window !== 'undefined' && window.html2canvas) {
        // Ocultar temporalmente la toolbar
        const toolbar = tableRef.current?.querySelector('.excel-table-toolbar');
        if (toolbar) {
          toolbar.style.display = 'none';
        }
        
        const canvas = await window.html2canvas(tableContentRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          ignoreElements: (element) => {
            // Ignorar la toolbar si aún está visible
            return element.classList?.contains('excel-table-toolbar');
          }
        });
        
        // Restaurar la toolbar
        if (toolbar) {
          toolbar.style.display = '';
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `tabla-excel-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        alert('La funcionalidad de captura requiere html2canvas.');
      }
    } catch (error) {
      console.error('Error al capturar imagen:', error);
      alert('Error al capturar la imagen.');
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

  // Obtener nombre de columna o letra por defecto
  const getColumnName = (colIndex) => {
    return columnNames[colIndex] || String.fromCharCode(65 + colIndex);
  };

  // Cerrar color picker al hacer clic fuera
  useEffect(() => {
    if (!showColorPicker) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.relative')) {
        setShowColorPicker(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showColorPicker]);

  return (
    <NodeViewWrapper className="excel-table-wrapper my-4">
      <div className="excel-table-container bg-white border border-gray-300 rounded-lg shadow-sm overflow-auto" ref={tableRef}>
        {/* Toolbar */}
        <div className="excel-table-toolbar bg-gray-50 border-b border-gray-300 p-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
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
            
            {/* Selector de color de texto */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newState = !showColorPicker || colorPickerType !== 'text';
                  setShowColorPicker(newState);
                  setColorPickerType('text');
                }}
                className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center gap-1.5 text-sm"
                title="Color de texto"
              >
                <Type className="w-4 h-4" />
                <span>Texto</span>
              </button>
              {showColorPicker && colorPickerType === 'text' && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="color"
                    value={selectedTextColor}
                    onChange={(e) => {
                      setSelectedTextColor(e.target.value);
                      applyColorToSelectedCells(e.target.value, 'text');
                    }}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
              )}
            </div>
            
            {/* Selector de color de fondo */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newState = !showColorPicker || colorPickerType !== 'background';
                  setShowColorPicker(newState);
                  setColorPickerType('background');
                }}
                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1.5 text-sm"
                title="Color de fondo"
              >
                <Palette className="w-4 h-4" />
                <span>Fondo</span>
              </button>
              {showColorPicker && colorPickerType === 'background' && (
                <div 
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="color"
                    value={selectedBackgroundColor}
                    onChange={(e) => {
                      setSelectedBackgroundColor(e.target.value);
                      applyColorToSelectedCells(e.target.value, 'background');
                    }}
                    className="w-full h-8 cursor-pointer"
                  />
                </div>
              )}
            </div>
            
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
        
        {/* Tabla (sin toolbar para captura) */}
        <div ref={tableContentRef} className="excel-table-content">
          <table className="excel-table w-full border-collapse" style={{ minWidth: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th 
                  className="excel-header-cell bg-gray-100 border border-gray-300 p-1 text-xs font-semibold text-gray-700 sticky left-0 z-10" 
                  style={{ 
                    width: '40px', 
                    minWidth: '40px',
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}
                >
                  #
                </th>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="excel-header-cell border border-gray-300 p-1 text-xs font-semibold text-gray-700 relative"
                    style={{ 
                      width: columnWidths[colIndex] || 120,
                      minWidth: columnWidths[colIndex] || 120,
                      position: 'relative',
                      backgroundColor: columnBackgroundColors[colIndex] || '#f3f4f6'
                    }}
                  >
                    <input
                      type="text"
                      value={getColumnName(colIndex)}
                      onChange={(e) => handleColumnNameChange(colIndex, e.target.value)}
                      className="w-full text-center bg-transparent border-none outline-none font-semibold text-gray-700"
                      style={{ 
                        color: columnBackgroundColors[colIndex] ? '#ffffff' : '#374151'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="excel-resize-handle absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 bg-transparent"
                      onMouseDown={(e) => handleMouseDown(e, 'column', colIndex)}
                      style={{ zIndex: 20 }}
                    />
                  </th>
                ))}
                <th 
                  className="excel-header-cell bg-gray-100 border border-gray-300 p-0 text-xs font-semibold text-gray-700 relative" 
                  style={{ 
                    width: '20px', 
                    minWidth: '20px',
                    padding: 0
                  }}
                >
                  <div
                    className="excel-resize-handle w-full cursor-ns-resize hover:bg-blue-500 bg-transparent"
                    onMouseDown={(e) => handleMouseDown(e, 'row', -1)}
                    style={{ 
                      height: '6px',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      cursor: 'ns-resize'
                    }}
                    title="Arrastra para cambiar la altura de todas las filas"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} style={{ height: rowHeights[rowIndex] || 30 }}>
                  <td 
                    className="excel-row-header bg-gray-50 border border-gray-300 text-xs font-semibold text-gray-700 sticky left-0 z-10"
                    style={{ 
                      height: `${rowHeights[rowIndex] || 30}px`,
                      minHeight: `${rowHeights[rowIndex] || 30}px`,
                      width: '40px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '4px',
                      display: 'table-cell'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      lineHeight: '1'
                    }}>
                      {rowIndex + 1}
                    </div>
                  </td>
                  {Array.from({ length: cols }).map((_, colIndex) => {
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const isSelected = selectedCells.has(cellKey);
                    const textColor = getCellTextColor(rowIndex, colIndex);
                    const backgroundColor = getCellBackgroundColor(rowIndex, colIndex);
                    return (
                      <td
                        key={colIndex}
                        className={`excel-cell border border-gray-300 p-0 relative ${
                          isSelected ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ 
                          width: columnWidths[colIndex] || 120,
                          minWidth: columnWidths[colIndex] || 120,
                          backgroundColor: backgroundColor
                        }}
                        onClick={(e) => handleCellClick(e, rowIndex, colIndex)}
                      >
                        <input
                          type="text"
                          value={data[cellKey] || ''}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className="w-full px-2 py-1 text-sm border-none outline-none bg-transparent"
                          style={{ 
                            height: `${rowHeights[rowIndex] || 30}px`,
                            minHeight: `${rowHeights[rowIndex] || 30}px`,
                            color: textColor,
                            boxSizing: 'border-box'
                          }}
                        />
                      </td>
                    );
                  })}
                  <td 
                    className="excel-row-resize bg-gray-50 border border-gray-300 p-0 relative" 
                    style={{ 
                      width: '20px', 
                      height: `${rowHeights[rowIndex] || 30}px`,
                      minHeight: `${rowHeights[rowIndex] || 30}px`,
                      position: 'relative',
                      padding: 0
                    }}
                  >
                    <div
                      className="excel-resize-handle w-full cursor-ns-resize hover:bg-blue-500 bg-transparent absolute bottom-0 left-0"
                      onMouseDown={(e) => handleMouseDown(e, 'row', rowIndex)}
                      style={{ 
                        zIndex: 10,
                        height: '6px',
                        marginBottom: '-3px',
                        cursor: 'ns-resize'
                      }}
                      title="Arrastra para cambiar la altura de la fila"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
