/**
 * Servicio para manejar el almacenamiento local de páginas y archivos
 * Usa la File System Access API del navegador para guardar en el sistema de archivos
 */

class LocalStorageService {
  constructor() {
    this.baseDirectoryHandle = null;
    this.config = this.loadConfig();
    this.restoreAttempted = false;
    // Intentar restaurar el acceso al directorio al inicializar (asíncrono, no bloquea)
    this.attemptRestoreDirectoryAccess().catch(err => {
      // Error al restaurar acceso al directorio
    });
  }

  // Cargar configuración desde localStorage
  loadConfig() {
    try {
      const saved = localStorage.getItem('notion-local-config');
      if (saved) {
        const config = JSON.parse(saved);
        // Asegurar que cursosExternosPath esté presente
        if (!config.hasOwnProperty('cursosExternosPath')) {
          config.cursosExternosPath = null;
        }
        return config;
      }
      return {
        useLocalStorage: false,
        basePath: null,
        lastSelectedPath: null,
        cursosExternosPath: null
      };
    } catch (error) {
      return {
        useLocalStorage: false,
        basePath: null,
        lastSelectedPath: null,
        cursosExternosPath: null
      };
    }
  }

  // Intentar restaurar el acceso al directorio usando permisos persistentes
  async attemptRestoreDirectoryAccess(force = false) {
    // Si ya hay handle, no necesitamos restaurar
    if (this.baseDirectoryHandle) {
      return true;
    }

    // Solo intentar si hay configuración guardada pero no hay handle
    if (!this.config.useLocalStorage || !this.config.lastSelectedPath) {
      return false;
    }

    // Si ya intentamos y no forzamos, no intentar de nuevo inmediatamente
    if (this.restoreAttempted && !force) {
      return false;
    }

    this.restoreAttempted = true;

    // Intentar restaurar usando IndexedDB si guardamos el handle allí
    // NOTA: Los DirectoryHandle no se pueden serializar completamente en IndexedDB,
    // pero algunos navegadores pueden mantener la referencia durante la sesión
    try {
      const storedHandle = await this.getStoredDirectoryHandle();
      
      if (storedHandle) {
        // Verificar que el handle sigue siendo válido
        try {
          await storedHandle.getDirectoryHandle('data', { create: false });
          this.baseDirectoryHandle = storedHandle;
          this.restoreAttempted = false; // Resetear para permitir futuros intentos si se pierde
          // Disparar evento para notificar que el handle fue restaurado
          window.dispatchEvent(new Event('directoryHandleChanged'));
          return true;
        } catch (error) {
          await this.clearStoredDirectoryHandle();
        }
      }
    } catch (error) {
      // Error restaurando handle desde IndexedDB
    }

    // Si no se pudo restaurar, el usuario necesitará seleccionar la carpeta de nuevo
    return false;
  }

  // Guardar configuración
  saveConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('notion-local-config', JSON.stringify(this.config));
  }

  // Solicitar acceso a directorio (File System Access API)
  async requestDirectoryAccess() {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await window.showDirectoryPicker({
          mode: 'readwrite' // Solicitar permisos de lectura y escritura
        });
        this.baseDirectoryHandle = handle;
        
        // Guardar el handle en IndexedDB para intentar restaurarlo después
        await this.storeDirectoryHandle(handle);
        
        this.saveConfig({ 
          basePath: handle.name,
          lastSelectedPath: handle.name,
          useLocalStorage: true 
        });
        
        // Disparar evento para notificar que el handle fue establecido
        window.dispatchEvent(new Event('directoryHandleChanged'));
        
        return handle;
      } else {
        throw new Error('File System Access API no está disponible en este navegador');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Usuario canceló
      }
      throw error;
    }
  }

  // Guardar el handle del directorio en IndexedDB
  async storeDirectoryHandle(handle) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('notion-directory-handles', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['handles'], 'readwrite');
        const store = transaction.objectStore('handles');
        
        // Guardar el handle (aunque no se puede serializar completamente,
        // algunos navegadores pueden mantener la referencia)
        const putRequest = store.put(handle, 'baseDirectoryHandle');
        putRequest.onsuccess = () => {
          resolve();
        };
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
        }
      };
    });
  }

  // Obtener el handle del directorio desde IndexedDB
  async getStoredDirectoryHandle() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('notion-directory-handles', 1);
      
      request.onerror = () => {
        reject(request.error);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('handles')) {
          resolve(null);
          return;
        }
        const transaction = db.transaction(['handles'], 'readonly');
        const store = transaction.objectStore('handles');
        const getRequest = store.get('baseDirectoryHandle');
        getRequest.onsuccess = () => {
          const handle = getRequest.result;
          resolve(handle || null);
        };
        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
        }
      };
    });
  }

  // Limpiar el handle almacenado
  async clearStoredDirectoryHandle() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('notion-directory-handles', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('handles')) {
          resolve();
          return;
        }
        const transaction = db.transaction(['handles'], 'readwrite');
        const store = transaction.objectStore('handles');
        const deleteRequest = store.delete('baseDirectoryHandle');
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
        }
      };
    });
  }

  // Obtener o crear subdirectorio (soporta rutas anidadas como 'data/comments')
  async getOrCreateSubdirectory(path) {
    if (!this.baseDirectoryHandle) {
      throw new Error('No hay directorio base seleccionado');
    }

    try {
      const parts = path.split('/').filter(p => p);
      let currentDir = this.baseDirectoryHandle;
      
      for (const part of parts) {
        currentDir = await currentDir.getDirectoryHandle(part, { create: true });
      }
      
      return currentDir;
    } catch (error) {
      throw new Error(`Error al crear subdirectorio ${path}: ${error.message}`);
    }
  }

  // Guardar archivo JSON
  async saveJSONFile(filename, data, subdirectory = 'data') {
    // Si hay configuración de almacenamiento local pero no hay handle,
    // NO usar localStorage como fallback - lanzar error
    if (this.config.useLocalStorage && !this.baseDirectoryHandle) {
      const error = new Error('No hay baseDirectoryHandle. Por favor, selecciona la carpeta nuevamente en Configuración.');
      throw error;
    }
    
    // Si no hay configuración de almacenamiento local, usar localStorage
    if (!this.config.useLocalStorage) {
      return this.saveToBrowserStorage(filename, data);
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (error) {
      // Solo usar localStorage como fallback si NO hay configuración de almacenamiento local
      if (!this.config.useLocalStorage) {
        return this.saveToBrowserStorage(filename, data);
      }
      throw error; // Si hay configuración pero falla, lanzar error
    }
  }

  // Leer archivo JSON
  async readJSONFile(filename, subdirectory = 'data') {
    // Si hay configuración de almacenamiento local pero no hay handle,
    // NO usar localStorage como fallback - los archivos están en el sistema de archivos
    if (this.config.useLocalStorage && !this.baseDirectoryHandle) {
      return null; // Retornar null en lugar de leer desde localStorage
    }
    
    // Si no hay configuración de almacenamiento local, usar localStorage
    if (!this.config.useLocalStorage) {
      return this.readFromBrowserStorage(filename);
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const fileHandle = await dir.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (error) {
      // Solo usar localStorage como fallback si NO hay configuración de almacenamiento local
      if (!this.config.useLocalStorage) {
        return this.readFromBrowserStorage(filename);
      }
      return null; // Si hay configuración pero falla, retornar null
    }
  }

  // Listar archivos en un directorio
  async listFiles(subdirectory = 'data') {
    // Si hay configuración de almacenamiento local pero no hay handle,
    // NO usar localStorage como fallback - los archivos están en el sistema de archivos
    if (this.config.useLocalStorage && !this.baseDirectoryHandle) {
      return []; // Retornar array vacío en lugar de leer desde localStorage
    }
    
    // Si no hay configuración de almacenamiento local, usar localStorage
    if (!this.config.useLocalStorage) {
      return this.listFromBrowserStorage();
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const files = [];
      for await (const entry of dir.values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }
      return files;
    } catch (error) {
      // Solo usar localStorage como fallback si NO hay configuración de almacenamiento local
      if (!this.config.useLocalStorage) {
        return this.listFromBrowserStorage();
      }
      return []; // Si hay configuración pero falla, retornar vacío
    }
  }

  // Guardar archivo binario (imágenes, etc.)
  async saveBinaryFile(filename, blob, subdirectory = 'files') {
    if (!this.config.useLocalStorage || !this.baseDirectoryHandle) {
      // Para archivos binarios, usar IndexedDB como fallback
      return this.saveToIndexedDB(filename, blob);
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      
      // Retornar ruta relativa para usar en el editor
      return `./files/${filename}`;
    } catch (error) {
      return this.saveToIndexedDB(filename, blob);
    }
  }

  // Leer archivo binario
  async readBinaryFile(filename, subdirectory = 'files') {
    if (!this.config.useLocalStorage || !this.baseDirectoryHandle) {
      return this.readFromIndexedDB(filename);
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const fileHandle = await dir.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return file;
    } catch (error) {
      return this.readFromIndexedDB(filename);
    }
  }

  // Obtener URL para mostrar imagen/archivo
  async getFileURL(filename, subdirectory = 'files') {
    if (!this.config.useLocalStorage || !this.baseDirectoryHandle) {
      return this.getIndexedDBURL(filename);
    }

    try {
      const file = await this.readBinaryFile(filename, subdirectory);
      return URL.createObjectURL(file);
    } catch (error) {
      return this.getIndexedDBURL(filename);
    }
  }

  // Métodos de fallback usando localStorage del navegador
  saveToBrowserStorage(filename, data) {
    try {
      localStorage.setItem(`notion-${filename}`, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  readFromBrowserStorage(filename) {
    try {
      const data = localStorage.getItem(`notion-${filename}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  listFromBrowserStorage() {
    const files = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('notion-') && key.endsWith('.json')) {
        files.push(key.replace('notion-', ''));
      }
    }
    return files;
  }

  // Métodos usando IndexedDB para archivos binarios
  async saveToIndexedDB(filename, blob) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('notion-files', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const putRequest = store.put(blob, filename);
        putRequest.onsuccess = () => resolve(`indexeddb://${filename}`);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
    });
  }

  async readFromIndexedDB(filename) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('notion-files', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const getRequest = store.get(filename);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
    });
  }

  async getIndexedDBURL(filename) {
    const blob = await this.readFromIndexedDB(filename);
    return blob ? URL.createObjectURL(blob) : null;
  }

  // Eliminar archivo JSON
  async deleteJSONFile(filename, subdirectory = 'data') {
    if (!this.config.useLocalStorage || !this.baseDirectoryHandle) {
      // Eliminar de localStorage
      try {
        localStorage.removeItem(`notion-${filename}`);
        return true;
      } catch (error) {
        return false;
      }
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      await dir.removeEntry(filename);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Eliminar archivo binario
  async deleteBinaryFile(filename, subdirectory = 'files') {
    if (!this.config.useLocalStorage || !this.baseDirectoryHandle) {
      // Eliminar de IndexedDB
      try {
        return await this.deleteFromIndexedDB(filename);
      } catch (error) {
        return false;
      }
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      await dir.removeEntry(filename);
      return true;
    } catch (error) {
      // Intentar eliminar de IndexedDB como fallback
      return await this.deleteFromIndexedDB(filename);
    }
  }

  // Eliminar de IndexedDB
  async deleteFromIndexedDB(filename) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('notion-files', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('files')) {
          resolve(true);
          return;
        }
        const transaction = db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const deleteRequest = store.delete(filename);
        deleteRequest.onsuccess = () => {
          resolve(true);
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
    });
  }

  // Verificar si hay acceso persistente al directorio
  async verifyDirectoryAccess() {
    if (!this.config.lastSelectedPath) {
      return false;
    }

    // Si ya hay handle, verificar que sigue siendo válido
    if (this.baseDirectoryHandle) {
      try {
        await this.baseDirectoryHandle.getDirectoryHandle('data', { create: false });
        return true;
      } catch (error) {
        this.baseDirectoryHandle = null;
        return false;
      }
    }

    // Intentar restaurar el handle
    await this.attemptRestoreDirectoryAccess();
    return !!this.baseDirectoryHandle;
  }
}

export default new LocalStorageService();

