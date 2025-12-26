import { useState, useEffect } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import TagInputNotionLike from "./TagInputNotionLike";
import EditorDescripcion from './EditorDescripcion'

const tipos = [
  { value: "text", label: "📝 Texto" },
  { value: "number", label: "# Número" },
  { value: "checkbox", label: "✅ Check" },
  { value: "percent", label: "📊 Porcentaje" },
  { value: "select", label: "🎨 Select con color" },
  { value: "tags", label: "🏷️ Tags" },
];

export default function TablaNotionStyle({ node, updateAttributes, getPos, editor }) {
  const [filas, setFilas] = useState(() => node.attrs.filas || []);
  const [propiedades, setPropiedades] = useState(() => node.attrs.propiedades || []);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [nuevoCampo, setNuevoCampo] = useState({ name: "", type: "text" });
  const [sortBy, setSortBy] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [filtro, setFiltro] = useState("");

  const actualizarValor = (filaIdx, key, valor) => {
    const nuevas = [...filas];
    nuevas[filaIdx].properties[key].value = valor;
    setFilas(nuevas);
  };

  const agregarFila = () => {
    const nuevaFila = {
      Name: "Nueva tarea",
      properties: {},
    };

    propiedades.forEach((prop) => {
      nuevaFila.properties[prop.name] = {
        type: prop.type,
        value: prop.type === "checkbox" ? false : prop.type === "tags" ? [] : "",
        color: prop.type === "select" ? "#3b82f6" : undefined,
      };
    });

    setFilas([...filas, nuevaFila]);
  };

  const abrirDrawer = (fila) => {
    const index = filas.findIndex((f) => f === fila);
    setFilaSeleccionada(index);
    setShowDrawer(true);
  };

  const cerrarDrawer = () => {
    // Los datos se guardan automáticamente en el nodo del editor
    // No necesitamos Firebase, se guarda en el contenido del editor
    setShowDrawer(false);
    setFilaSeleccionada(null);
  };

  const agregarPropiedad = () => {
    if (!nuevoCampo.name) return;
    const nuevas = [...propiedades, { ...nuevoCampo }];
    setPropiedades(nuevas);

    const nuevasFilas = filas.map((fila) => {
      return {
        ...fila,
        properties: {
          ...fila.properties,
          [nuevoCampo.name]: {
            type: nuevoCampo.type,
            value: nuevoCampo.type === "checkbox" ? false : nuevoCampo.type === "tags" ? [] : "",
            color: nuevoCampo.type === "select" ? "#3b82f6" : undefined,
          },
        },
      };
    });
    setFilas(nuevasFilas);
    setNuevoCampo({ name: "", type: "text" });
  };

  const filasFiltradas = filas.filter(
    (f) =>
      f.Name.toLowerCase().includes(filtro.toLowerCase()) ||
      Object.values(f.properties || {}).some(
        (p) =>
          (typeof p.value === "string" && p.value.toLowerCase().includes(filtro.toLowerCase())) ||
          (Array.isArray(p.value) && p.value.join(",").toLowerCase().includes(filtro.toLowerCase()))
      )
  );

  const filasOrdenadas = [...filasFiltradas].sort((a, b) => {
    if (!sortBy) return 0;
    const valA = a.properties?.[sortBy]?.value || "";
    const valB = b.properties?.[sortBy]?.value || "";
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (colName) => {
    if (sortBy === colName) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(colName);
      setSortAsc(true);
    }
  };

  // Actualizar atributos del nodo cuando cambian filas o propiedades
  useEffect(() => {
    updateAttributes({ filas, propiedades });
  }, [filas, propiedades, updateAttributes]);

  return (
    <NodeViewWrapper className="relative group border rounded bg-white shadow p-4 text-sm">
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            const pos = getPos?.();
            const view = editor?.view;

            if (view && typeof pos === "number") {
              view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
            }
          }}
          className="bg-white border rounded px-2 py-1 text-xs shadow hover:bg-red-100"
        >
          🗑️
        </button>
        <button className="bg-white border rounded px-2 py-1 text-xs shadow hover:bg-gray-100 mt-1">↕️</button>
      </div>

      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="🔍 Filtrar..."
          className="border px-2 py-1 rounded w-64"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
        <button onClick={agregarFila} className="bg-blue-600 text-white px-3 py-1 rounded">
          ➕ Agregar fila
        </button>
      </div>

      {/* Vista de escritorio - Tabla tradicional */}
      <div className="hidden md:block overflow-x-auto notion-table-desktop">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-2 py-1 border cursor-pointer" onClick={() => toggleSort("Name")}>
                 {sortBy === "Name" ? (sortAsc ? "⬆️" : "⬇️") : ""}
              </th>
              {propiedades.map((p, idx) => (
                <th
                  key={idx}
                  className="text-left px-2 py-1 border cursor-pointer"
                  onClick={() => toggleSort(p.name)}
                >
                  {p.name} {sortBy === p.name ? (sortAsc ? "⬆️" : "⬇️") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filasOrdenadas.map((fila, fi) => (
              <tr key={fi} className="hover:bg-gray-50">
                <td
                  className="border px-2 py-1 font-semibold cursor-pointer"
                  onClick={() => abrirDrawer(fila)}
                >
                  {fila.Name}
                </td>

                {propiedades.map((prop, pi) => (
                  <td key={pi} className="border px-2 py-1">
                    {prop.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={fila.properties?.[prop.name]?.value || false}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.checked)}
                      />
                    ) : prop.type === "number" || prop.type === "percent" ? (
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-right min-w-[80px]"
                        value={fila.properties?.[prop.name]?.value || 0}
                        onChange={(e) => actualizarValor(fi, prop.name, Number(e.target.value))}
                        style={{ minWidth: '80px' }}
                      />
                    ) : prop.type === "select" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={fila.properties?.[prop.name]?.value || ""}
                          onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                          className="px-2 py-1 border rounded"
                          style={{ 
                            minWidth: '120px',
                            width: 'auto'
                          }}
                          size={15}
                        />
                        <input
                          type="color"
                          value={fila.properties?.[prop.name]?.color || "#3b82f6"}
                          onChange={(e) => {
                            const nuevas = [...filas];
                            nuevas[fi].properties[prop.name].color = e.target.value;
                            setFilas(nuevas);
                          }}
                        />
                      </div>
                    ) : prop.type === "tags" ? (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <div className="flex-1 min-w-[150px]">
                          <TagInputNotionLike
                            value={fila.properties?.[prop.name]?.value || []}
                            onChange={(val) => actualizarValor(fi, prop.name, val)}
                          />
                        </div>
                        <button
                          title="Copiar tags"
                          className="p-1 rounded hover:bg-gray-200 flex-shrink-0"
                          onClick={() => {
                            const tagsArr = fila.properties?.[prop.name]?.value || [];
                            const tags = tagsArr.map(tag => tag.label || tag.value || tag).join(", ");
                            navigator.clipboard.writeText(tags);
                          }}
                          style={{ lineHeight: 0 }}
                        >
                          <span role="img" aria-label="copiar">📋</span>
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full px-2 py-1 border rounded"
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                        style={{ 
                          minWidth: prop.name.toLowerCase().includes('fecha') || prop.name.toLowerCase().includes('hora') ? '180px' : '120px',
                          width: 'auto'
                        }}
                        size={prop.name.toLowerCase().includes('fecha') || prop.name.toLowerCase().includes('hora') ? 25 : 15}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista móvil - Tarjetas */}
      <div className="md:hidden space-y-3 notion-table-mobile">
        {filasOrdenadas.map((fila, fi) => (
          <div key={fi} className="notion-table-card">
            <div 
              className="notion-table-card-title"
              onClick={() => abrirDrawer(fila)}
            >
              {fila.Name}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {propiedades.map((prop, pi) => (
                <div key={pi} className="notion-table-card-field">
                  <label className="notion-table-card-field-label">
                    {prop.name}
                  </label>
                  <div className="notion-table-card-field-value">
                    {prop.type === "checkbox" ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fila.properties?.[prop.name]?.value || false}
                          onChange={(e) => actualizarValor(fi, prop.name, e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {fila.properties?.[prop.name]?.value ? "✅ Completado" : "⏳ Pendiente"}
                        </span>
                      </div>
                    ) : prop.type === "number" || prop.type === "percent" ? (
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded text-right"
                        value={fila.properties?.[prop.name]?.value || 0}
                        onChange={(e) => actualizarValor(fi, prop.name, Number(e.target.value))}
                      />
                    ) : prop.type === "select" ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={fila.properties?.[prop.name]?.value || ""}
                          onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                          className="flex-1 px-2 py-1 border rounded"
                        />
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: fila.properties?.[prop.name]?.color || "#3b82f6" }}
                          ></div>
                          <input
                            type="color"
                            value={fila.properties?.[prop.name]?.color || "#3b82f6"}
                            onChange={(e) => {
                              const nuevas = [...filas];
                              nuevas[fi].properties[prop.name].color = e.target.value;
                              setFilas(nuevas);
                            }}
                            className="w-6 h-6 border rounded"
                          />
                        </div>
                      </div>
                    ) : prop.type === "tags" ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <TagInputNotionLike
                            value={fila.properties?.[prop.name]?.value || []}
                            onChange={(val) => actualizarValor(fi, prop.name, val)}
                          />
                        </div>
                        <button
                          title="Copiar tags"
                          className="p-1 rounded hover:bg-gray-200"
                          onClick={() => {
                            const tagsArr = fila.properties?.[prop.name]?.value || [];
                            const tags = tagsArr.map(tag => tag.label || tag.value || tag).join(", ");
                            navigator.clipboard.writeText(tags);
                          }}
                        >
                          <span role="img" aria-label="copiar">📋</span>
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="w-full px-2 py-1 border rounded"
                        value={fila.properties?.[prop.name]?.value || ""}
                        onChange={(e) => actualizarValor(fi, prop.name, e.target.value)}
                        placeholder={`Ingresa ${prop.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => abrirDrawer(fila)}
                className="notion-table-card-edit-button"
              >
                ✏️ Editar detalles
              </button>
            </div>
          </div>
        ))}
      </div>

{showDrawer && (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-center items-center">
    <div className="bg-white w-full h-full overflow-y-auto p-6 shadow-xl rounded-none">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Editar fila</h2>
        <button onClick={cerrarDrawer} className="text-red-500 text-2xl font-bold">×</button>
      </div>

      {filaSeleccionada !== null && (
        <>
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">Título</label>
            <input
              type="text"
              className="border w-full px-2 py-1 rounded"
              value={filas[filaSeleccionada].Name}
              onChange={(e) => {
                const nuevas = [...filas];
                nuevas[filaSeleccionada].Name = e.target.value;
                setFilas(nuevas);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {propiedades.map((prop, pi) => (
              <div key={pi}>
                <label className="block text-xs text-gray-600 mb-1">{prop.name}</label>
                {prop.type === "tags" ? (
                  <TagInputNotionLike
                    value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || []}
                    onChange={(val) => actualizarValor(filaSeleccionada, prop.name, val)}
                  />
                ) : prop.type === "text" ? (
                  <input
                    type="text"
                    className="border w-full px-2 py-1 rounded"
                    value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                    onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                  />
                ) : prop.type === "number" || prop.type === "percent" ? (
                  <input
                    type="number"
                    className="border w-full px-2 py-1 rounded"
                    value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || 0}
                    onChange={(e) => actualizarValor(filaSeleccionada, prop.name, Number(e.target.value))}
                  />
                ) : prop.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={filas[filaSeleccionada]?.properties?.[prop.name]?.value || false}
                    onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.checked)}
                  />
                ) : prop.type === "select" ? (
                  <>
                    <input
                      type="text"
                      className="border w-full px-2 py-1 rounded mb-1"
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.value || ""}
                      onChange={(e) => actualizarValor(filaSeleccionada, prop.name, e.target.value)}
                    />
                    <input
                      type="color"
                      value={filas[filaSeleccionada]?.properties?.[prop.name]?.color || "#3b82f6"}
                      onChange={(e) => {
                        const nuevas = [...filas];
                        nuevas[filaSeleccionada].properties[prop.name].color = e.target.value;
                        setFilas(nuevas);
                      }}
                    />
                  </>
                ) : null}
              </div>
            ))}
          </div>
 <div className="mt-4">
                <h3 className="font-semibold text-sm mb-1">➕ Agregar propiedad</h3>
                <input
                  type="text"
                  placeholder="Nombre"
                  className="border w-full px-2 py-1 mb-2 rounded"
                  value={nuevoCampo.name}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, name: e.target.value })}
                />
                <select
                  value={nuevoCampo.type}
                  onChange={(e) => setNuevoCampo({ ...nuevoCampo, type: e.target.value })}
                  className="border w-full px-2 py-1 mb-2 rounded"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={agregarPropiedad}
                  className="bg-green-600 text-white px-3 py-1 rounded w-full"
                >
                  Agregar propiedad
                </button>
              </div>
         <EditorDescripcion
  content={filas[filaSeleccionada]?.descripcion || ""}
  onChange={(nuevoContenido) => {
    const nuevas = [...filas];
    nuevas[filaSeleccionada].descripcion = nuevoContenido;
    setFilas(nuevas);
  }}
/>
        </>
      )}
    </div>
  </div>
)}

    </NodeViewWrapper>
  );
}

