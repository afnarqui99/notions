/**
 * Servicio para gestionar el registro global de tablas
 * Permite registrar, consultar y actualizar información sobre todas las tablas del sistema
 */

class TableRegistryService {
  constructor() {
    this.registryKey = 'notion-tables-registry';
  }

  // Generar UUID simple (v4-like)
  generateTableId() {
    return 'table-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Cargar registro desde localStorage
  loadRegistry() {
    try {
      const saved = localStorage.getItem(this.registryKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      // Error cargando registro de tablas
      return {};
    }
  }

  // Guardar registro en localStorage
  saveRegistry(registry) {
    try {
      localStorage.setItem(this.registryKey, JSON.stringify(registry));
      return true;
    } catch (error) {
      // Error guardando registro de tablas
      return false;
    }
  }

  // Registrar una nueva tabla
  registerTable(tableId, tableInfo) {
    const registry = this.loadRegistry();
    registry[tableId] = {
      tableId,
      tipo: tableInfo.tipo || null,
      nombre: tableInfo.nombre || 'Sin nombre',
      paginaId: tableInfo.paginaId || null,
      comportamiento: tableInfo.comportamiento || null,
      columnas: tableInfo.columnas || [],
      createdAt: tableInfo.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tablasVinculadas: tableInfo.tablasVinculadas || []
    };
    this.saveRegistry(registry);
    return registry[tableId];
  }

  // Actualizar información de una tabla
  updateTable(tableId, updates) {
    const registry = this.loadRegistry();
    if (!registry[tableId]) {
      // Tabla no encontrada en el registro
      return null;
    }
    
    registry[tableId] = {
      ...registry[tableId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveRegistry(registry);
    return registry[tableId];
  }

  // Eliminar una tabla del registro
  unregisterTable(tableId) {
    const registry = this.loadRegistry();
    if (registry[tableId]) {
      delete registry[tableId];
      this.saveRegistry(registry);
      
      // Limpiar referencias a esta tabla en otras tablas
      Object.keys(registry).forEach(id => {
        if (registry[id].tablasVinculadas) {
          registry[id].tablasVinculadas = registry[id].tablasVinculadas.filter(
            v => v.tableId !== tableId
          );
        }
      });
      this.saveRegistry(registry);
      return true;
    }
    return false;
  }

  // Obtener información de una tabla
  getTable(tableId) {
    const registry = this.loadRegistry();
    return registry[tableId] || null;
  }

  // Obtener todas las tablas
  getAllTables() {
    return this.loadRegistry();
  }

  // Obtener tablas por tipo/comportamiento
  getTablesByType(tipo) {
    const registry = this.loadRegistry();
    return Object.values(registry).filter(table => table.tipo === tipo || table.comportamiento === tipo);
  }

  // Obtener tablas por página
  getTablesByPage(paginaId) {
    const registry = this.loadRegistry();
    return Object.values(registry).filter(table => table.paginaId === paginaId);
  }

  // Buscar tabla por nombre (parcial)
  searchTables(query) {
    const registry = this.loadRegistry();
    const queryLower = query.toLowerCase();
    return Object.values(registry).filter(table => 
      table.nombre.toLowerCase().includes(queryLower) ||
      table.tipo?.toLowerCase().includes(queryLower)
    );
  }

  // Vincular dos tablas
  linkTables(tableId1, tableId2, linkInfo = {}) {
    const registry = this.loadRegistry();
    
    if (!registry[tableId1] || !registry[tableId2]) {
      // Una o ambas tablas no existen en el registro
      return false;
    }

    // Agregar vínculo en tabla1
    if (!registry[tableId1].tablasVinculadas) {
      registry[tableId1].tablasVinculadas = [];
    }
    const existingLink1 = registry[tableId1].tablasVinculadas.find(v => v.tableId === tableId2);
    if (!existingLink1) {
      registry[tableId1].tablasVinculadas.push({
        tableId: tableId2,
        relacion: linkInfo.relacion || 'referencia',
        columnas: linkInfo.columnas || {},
        ...linkInfo
      });
    }

    this.saveRegistry(registry);
    return true;
  }

  // Desvincular dos tablas
  unlinkTables(tableId1, tableId2) {
    const registry = this.loadRegistry();
    
    if (registry[tableId1] && registry[tableId1].tablasVinculadas) {
      registry[tableId1].tablasVinculadas = registry[tableId1].tablasVinculadas.filter(
        v => v.tableId !== tableId2
      );
    }
    
    if (registry[tableId2] && registry[tableId2].tablasVinculadas) {
      registry[tableId2].tablasVinculadas = registry[tableId2].tablasVinculadas.filter(
        v => v.tableId !== tableId1
      );
    }
    
    this.saveRegistry(registry);
    return true;
  }

  // Obtener tablas vinculadas a una tabla
  getLinkedTables(tableId) {
    const table = this.getTable(tableId);
    if (!table || !table.tablasVinculadas) return [];
    
    const registry = this.loadRegistry();
    return table.tablasVinculadas
      .map(link => {
        const linkedTable = registry[link.tableId];
        return linkedTable ? { ...link, tableInfo: linkedTable } : null;
      })
      .filter(Boolean);
  }

  // Limpiar registro (útil para testing o reset)
  clearRegistry() {
    localStorage.removeItem(this.registryKey);
  }
}

// Exportar instancia singleton
const tableRegistryService = new TableRegistryService();
export default tableRegistryService;

