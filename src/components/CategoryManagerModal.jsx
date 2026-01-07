import { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save, Tag } from 'lucide-react';
import CalendarEventService from '../services/CalendarEventService';

export default function CategoryManagerModal({ isOpen, onClose, onCategoriesChange }) {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [showAddForm, setShowAddForm] = useState(false);

  // Cargar categorías
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    const cats = await CalendarEventService.loadCategories();
    setCategories(cats);
  };

  // Guardar cambios
  const saveCategories = async (newCategories) => {
    await CalendarEventService.saveCategories(newCategories);
    setCategories(newCategories);
    if (onCategoriesChange) {
      onCategoriesChange(newCategories);
    }
  };

  // Iniciar edición
  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  // Guardar edición
  const saveEdit = async () => {
    if (!editName.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    const updated = categories.map(cat =>
      cat.id === editingId
        ? { ...cat, name: editName.trim(), color: editColor }
        : cat
    );

    await saveCategories(updated);
    setEditingId(null);
    setEditName('');
    setEditColor('#3B82F6');
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('#3B82F6');
  };

  // Eliminar categoría
  const handleDelete = async (categoryId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    const filtered = categories.filter(cat => cat.id !== categoryId);
    await saveCategories(filtered);
  };

  // Agregar categoría
  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      alert('El nombre de la categoría es requerido');
      return;
    }

    const newCategory = {
      id: CalendarEventService.generateUUID(),
      name: newCategoryName.trim(),
      color: newCategoryColor
    };

    const updated = [...categories, newCategory];
    await saveCategories(updated);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    setShowAddForm(false);
  };

  // Colores predefinidos
  const predefinedColors = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#EF4444', // Rojo
    '#8B5CF6', // Morado
    '#F59E0B', // Naranja
    '#EC4899', // Rosa
    '#06B6D4', // Cyan
    '#84CC16', // Lima
    '#F97316', // Naranja oscuro
    '#6366F1', // Índigo
  ];

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Gestionar Categorías
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Botón Agregar */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar Categoría
            </button>
          )}

          {/* Formulario Agregar */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3">Nueva Categoría</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre de la categoría"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div 
                      className="w-12 h-12 rounded border border-gray-300"
                      style={{ backgroundColor: newCategoryColor }}
                    />
                    <div className="flex gap-1 flex-1">
                      {predefinedColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewCategoryColor(color)}
                          className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewCategoryName('');
                      setNewCategoryColor('#3B82F6');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Categorías */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay categorías. Agrega una nueva categoría para comenzar.
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* Color */}
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />

                  {/* Nombre */}
                  {editingId === category.id ? (
                    <div className="flex-1 flex items-center gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <button
                        onClick={saveEdit}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Guardar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-sm text-gray-500">{category.color}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}







