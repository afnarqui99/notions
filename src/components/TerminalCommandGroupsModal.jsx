import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, Folder, Tag } from 'lucide-react';
import terminalCommandService from '../services/TerminalCommandService';

export default function TerminalCommandGroupsModal({ 
  isOpen, 
  onClose, 
  terminalId 
}) {
  const [groups, setGroups] = useState({});
  const [commands, setCommands] = useState([]);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Cargar grupos y comandos
  useEffect(() => {
    if (isOpen && terminalId) {
      loadData();
    }
  }, [isOpen, terminalId]);

  const loadData = async () => {
    const groupsData = await terminalCommandService.getGroups(terminalId);
    setGroups(groupsData || {});

    // Cargar todos los comandos (sin filtro de grupo)
    const allCommands = await terminalCommandService.getFrequentCommands(terminalId, 1000, null);
    setCommands(allCommands);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    const groupId = await terminalCommandService.createGroup(
      terminalId,
      newGroupName.trim(),
      newGroupColor
    );

    if (groupId) {
      setNewGroupName('');
      setNewGroupColor('#3b82f6');
      await loadData();
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el grupo "${groups[groupId]?.name}"?`)) {
      return;
    }

    await terminalCommandService.deleteGroup(terminalId, groupId);
    await loadData();
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    await terminalCommandService.updateGroup(terminalId, groupId, updates);
    await loadData();
    setEditingGroup(null);
  };

  const handleAssignCommand = async (command, groupId) => {
    await terminalCommandService.assignCommandToGroup(terminalId, command, groupId);
    await loadData();
  };

  const handleRemoveCommandFromGroup = async (command) => {
    await terminalCommandService.removeCommandFromGroup(terminalId, command);
    await loadData();
  };

  // Agrupar comandos por grupo
  const commandsByGroup = {};
  const ungroupedCommands = [];

  commands.forEach(({ command, count, groupId }) => {
    if (groupId && groups[groupId]) {
      if (!commandsByGroup[groupId]) {
        commandsByGroup[groupId] = [];
      }
      commandsByGroup[groupId].push({ command, count });
    } else {
      ungroupedCommands.push({ command, count });
    }
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[60001] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Gestión de Grupos de Comandos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Crear nuevo grupo */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Crear Nuevo Grupo
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nombre del grupo (ej: Git, Docker, npm...)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateGroup();
                  }
                }}
              />
              <input
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                title="Color del grupo"
              />
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear
              </button>
            </div>
          </div>

          {/* Lista de grupos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Grupos ({Object.keys(groups).length})
            </h3>
            
            {Object.keys(groups).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay grupos creados. Crea uno para organizar tus comandos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(groups).map(([groupId, group]) => {
                  const isEditing = editingGroup === groupId;
                  const groupCommands = commandsByGroup[groupId] || [];
                  
                  return (
                    <div
                      key={groupId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                    >
                      {/* Header del grupo */}
                      <div className="flex items-center justify-between mb-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              defaultValue={group.name}
                              onBlur={(e) => {
                                if (e.target.value.trim() && e.target.value !== group.name) {
                                  handleUpdateGroup(groupId, { name: e.target.value.trim() });
                                }
                                setEditingGroup(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                } else if (e.key === 'Escape') {
                                  setEditingGroup(null);
                                }
                              }}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                              autoFocus
                            />
                            <input
                              type="color"
                              defaultValue={group.color}
                              onChange={(e) => handleUpdateGroup(groupId, { color: e.target.value })}
                              className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: group.color }}
                            />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {group.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({groupCommands.length} comandos)
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => setEditingGroup(groupId)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Editar grupo"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(groupId)}
                                className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                                title="Eliminar grupo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Comandos del grupo */}
                      {groupCommands.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {groupCommands.map(({ command, count }) => (
                            <div
                              key={command}
                              className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <code className="text-xs text-gray-700 dark:text-gray-300 font-mono truncate">
                                  {command}
                                </code>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({count} veces)
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveCommandFromGroup(command)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                title="Remover del grupo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Comandos sin grupo */}
          {ungroupedCommands.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Comandos sin Grupo ({ungroupedCommands.length})
              </h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {ungroupedCommands.map(({ command, count }) => (
                  <div
                    key={command}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <code className="text-xs text-gray-700 dark:text-gray-300 font-mono truncate">
                        {command}
                      </code>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({count} veces)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignCommand(command, e.target.value);
                          }
                        }}
                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Asignar a grupo...</option>
                        {Object.entries(groups).map(([groupId, group]) => (
                          <option key={groupId} value={groupId}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2.5 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

