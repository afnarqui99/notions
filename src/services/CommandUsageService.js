/**
 * Servicio para rastrear el uso de comandos slash
 * Almacena estadísticas de uso y orden personalizado en archivos
 */

import LocalStorageService from './LocalStorageService';

class CommandUsageService {
  constructor() {
    this.filename = 'slash-command-usage.json';
    this.usageData = null;
    this.customOrder = null;
    this.loadUsageData();
  }

  // Cargar datos de uso desde archivo
  async loadUsageData() {
    try {
      const data = await LocalStorageService.readJSONFile(this.filename, 'data');
      if (data) {
        this.usageData = data.usageData || {};
        this.customOrder = data.customOrder || null;
      } else {
        // Si no existe, inicializar vacío
        this.usageData = {};
        this.customOrder = null;
        // Crear el archivo inicial
        await this.saveUsageData();
      }
    } catch (error) {
      console.error('Error cargando datos de uso de comandos:', error);
      this.usageData = {};
      this.customOrder = null;
      // Intentar crear el archivo si no existe
      await this.saveUsageData();
    }
  }

  // Guardar datos de uso en archivo
  async saveUsageData() {
    try {
      const dataToSave = {
        usageData: this.usageData || {},
        customOrder: this.customOrder || null,
        lastUpdated: Date.now()
      };
      await LocalStorageService.saveJSONFile(this.filename, dataToSave, 'data');
    } catch (error) {
      console.error('Error guardando datos de uso de comandos:', error);
    }
  }

  // Asegurar que los datos estén cargados
  async ensureDataLoaded() {
    if (this.usageData === null) {
      await this.loadUsageData();
    }
  }

  // Registrar el uso de un comando
  async recordUsage(commandLabel) {
    if (!commandLabel) return;
    await this.ensureDataLoaded();

    if (!this.usageData[commandLabel]) {
      this.usageData[commandLabel] = {
        count: 0,
        lastUsed: null
      };
    }

    this.usageData[commandLabel].count += 1;
    this.usageData[commandLabel].lastUsed = Date.now();
    await this.saveUsageData();
  }

  // Obtener el conteo de uso de un comando
  getUsageCount(commandLabel) {
    return this.usageData?.[commandLabel]?.count || 0;
  }

  // Obtener la última vez que se usó un comando
  getLastUsed(commandLabel) {
    return this.usageData?.[commandLabel]?.lastUsed || null;
  }

  // Guardar orden personalizado
  async saveCustomOrder(commandLabels) {
    await this.ensureDataLoaded();
    this.customOrder = commandLabels;
    await this.saveUsageData();
  }

  // Obtener orden personalizado
  getCustomOrder() {
    return this.customOrder || null;
  }

  // Ordenar comandos: primero por orden personalizado, luego por uso
  async sortCommandsByUsage(commands) {
    await this.ensureDataLoaded();
    
    // Si hay orden personalizado, usarlo primero
    if (this.customOrder && this.customOrder.length > 0) {
      const ordered = [];
      const unordered = [];
      
      // Separar comandos en ordenados y no ordenados
      const customOrderMap = new Map();
      this.customOrder.forEach((label, index) => {
        customOrderMap.set(label, index);
      });
      
      commands.forEach(cmd => {
        if (customOrderMap.has(cmd.label)) {
          ordered.push({ cmd, order: customOrderMap.get(cmd.label) });
        } else {
          unordered.push(cmd);
        }
      });
      
      // Ordenar los que están en el orden personalizado
      ordered.sort((a, b) => a.order - b.order);
      
      // Ordenar los que no están en el orden personalizado por uso
      const sortedUnordered = unordered.sort((a, b) => {
        const aCount = this.getUsageCount(a.label);
        const bCount = this.getUsageCount(b.label);
        
        if (aCount === bCount) {
          const aLastUsed = this.getLastUsed(a.label);
          const bLastUsed = this.getLastUsed(b.label);
          
          if (!aLastUsed && !bLastUsed) return 0;
          if (!aLastUsed) return 1;
          if (!bLastUsed) return -1;
          
          return bLastUsed - aLastUsed;
        }
        
        return bCount - aCount;
      });
      
      // Combinar: primero los ordenados personalmente, luego los ordenados por uso
      return [...ordered.map(item => item.cmd), ...sortedUnordered];
    }
    
    // Si no hay orden personalizado, ordenar solo por uso
    return [...commands].sort((a, b) => {
      const aCount = this.getUsageCount(a.label);
      const bCount = this.getUsageCount(b.label);
      
      if (aCount === bCount) {
        const aLastUsed = this.getLastUsed(a.label);
        const bLastUsed = this.getLastUsed(b.label);
        
        if (!aLastUsed && !bLastUsed) return 0;
        if (!aLastUsed) return 1;
        if (!bLastUsed) return -1;
        
        return bLastUsed - aLastUsed;
      }
      
      return bCount - aCount;
    });
  }

  // Limpiar datos de uso (útil para testing o reset)
  async clearUsageData() {
    await this.ensureDataLoaded();
    this.usageData = {};
    this.customOrder = null;
    await this.saveUsageData();
  }
}

export default new CommandUsageService();

