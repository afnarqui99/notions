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
      console.warn('Error al intentar restaurar acceso al directorio:', err);
    });
  }

  // Cargar configuración desde localStorage
  loadConfig() {
    try {
      const saved = localStorage.getItem('notion-local-config');
      console.log('📋 loadConfig: localStorage.getItem result:', saved ? '✅ Encontrado' : '❌ No encontrado');
      if (saved) {
        const config = JSON.parse(saved);
        console.log('📋 loadConfig: Configuración cargada:', config);
        return config;
      }
      console.log('📋 loadConfig: No hay configuración guardada, usando valores por defecto');
      return {
        useLocalStorage: false,
        basePath: null,
        lastSelectedPath: null
      };
    } catch (error) {
      console.error('❌ loadConfig: Error cargando configuración:', error);
      return {
        useLocalStorage: false,
        basePath: null,
        lastSelectedPath: null
      };
    }
  }

  // Intentar restaurar el acceso al directorio usando permisos persistentes
  async attemptRestoreDirectoryAccess(force = false) {
    console.log('🔄 attemptRestoreDirectoryAccess: Iniciando restauración...', { 
      force, 
      restoreAttempted: this.restoreAttempted,
      config: this.config,
      hasHandle: !!this.baseDirectoryHandle
    });
    
    // Si ya hay handle, no necesitamos restaurar
    if (this.baseDirectoryHandle) {
      console.log('✅ attemptRestoreDirectoryAccess: Ya hay handle, no es necesario restaurar');
      return true;
    }

    // Solo intentar si hay configuración guardada pero no hay handle
    if (!this.config.useLocalStorage || !this.config.lastSelectedPath) {
      console.log('⚠️ attemptRestoreDirectoryAccess: No hay configuración de almacenamiento local', {
        useLocalStorage: this.config.useLocalStorage,
        lastSelectedPath: this.config.lastSelectedPath,
        config: this.config
      });
      console.log('💡 Esto es normal la primera vez que ejecutas la aplicación. Ve a Configuración para seleccionar una carpeta.');
      return false;
    }

    // Si ya intentamos y no forzamos, no intentar de nuevo inmediatamente
    if (this.restoreAttempted && !force) {
      console.log('⚠️ attemptRestoreDirectoryAccess: Ya se intentó restaurar y no se fuerza, omitiendo');
      return false;
    }

    this.restoreAttempted = true;
    console.log('🔍 attemptRestoreDirectoryAccess: Intentando obtener handle desde IndexedDB...');

    // Intentar restaurar usando IndexedDB si guardamos el handle allí
    // NOTA: Los DirectoryHandle no se pueden serializar completamente en IndexedDB,
    // pero algunos navegadores pueden mantener la referencia durante la sesión
    try {
      const storedHandle = await this.getStoredDirectoryHandle();
      console.log('🔍 attemptRestoreDirectoryAccess: Handle obtenido desde IndexedDB:', storedHandle ? '✅ Existe' : '❌ No existe');
      
      if (storedHandle) {
        // Verificar que el handle sigue siendo válido
        try {
          console.log('🔍 attemptRestoreDirectoryAccess: Verificando validez del handle...');
          await storedHandle.getDirectoryHandle('data', { create: false });
          this.baseDirectoryHandle = storedHandle;
          console.log('✅ Handle de directorio restaurado desde IndexedDB');
          this.restoreAttempted = false; // Resetear para permitir futuros intentos si se pierde
          // Disparar evento para notificar que el handle fue restaurado
          window.dispatchEvent(new Event('directoryHandleChanged'));
          return true;
        } catch (error) {
          console.warn('⚠️ Handle almacenado ya no es válido, se necesita seleccionar de nuevo:', error);
          await this.clearStoredDirectoryHandle();
        }
      } else {
        console.log('⚠️ attemptRestoreDirectoryAccess: No se encontró handle en IndexedDB');
      }
    } catch (error) {
      console.warn('⚠️ No se pudo restaurar handle desde IndexedDB:', error);
    }

    // Si no se pudo restaurar, el usuario necesitará seleccionar la carpeta de nuevo
    console.log('❌ attemptRestoreDirectoryAccess: No se pudo restaurar el handle');
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
          console.log('💾 Handle de directorio guardado en IndexedDB');
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
        console.error('❌ Error abriendo IndexedDB:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('handles')) {
          console.log('⚠️ No existe el objectStore "handles" en IndexedDB');
          resolve(null);
          return;
        }
        const transaction = db.transaction(['handles'], 'readonly');
        const store = transaction.objectStore('handles');
        const getRequest = store.get('baseDirectoryHandle');
        getRequest.onsuccess = () => {
          const handle = getRequest.result;
          console.log('🔍 getStoredDirectoryHandle: Handle obtenido:', handle ? '✅ Existe' : '❌ No existe');
          resolve(handle || null);
        };
        getRequest.onerror = () => {
          console.error('❌ Error obteniendo handle desde IndexedDB:', getRequest.error);
          reject(getRequest.error);
        };
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles');
          console.log('📦 ObjectStore "handles" creado en IndexedDB');
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

  // Obtener o crear subdirectorio
  async getOrCreateSubdirectory(name) {
    if (!this.baseDirectoryHandle) {
      throw new Error('No hay directorio base seleccionado');
    }

    try {
      return await this.baseDirectoryHandle.getDirectoryHandle(name, { create: true });
    } catch (error) {
      throw new Error(`Error al crear subdirectorio ${name}: ${error.message}`);
    }
  }

  // Guardar archivo JSON
  async saveJSONFile(filename, data, subdirectory = 'data') {
    // Si hay configuración de almacenamiento local pero no hay handle,
    // NO usar localStorage como fallback - lanzar error
    if (this.config.useLocalStorage && !this.baseDirectoryHandle) {
      const error = new Error('No hay baseDirectoryHandle. Por favor, selecciona la carpeta nuevamente en Configuración.');
      console.error('❌ Error guardando JSON:', error);
      throw error;
    }
    
    // Si no hay configuración de almacenamiento local, usar localStorage
    if (!this.config.useLocalStorage) {
      console.warn('⚠️ Guardando en localStorage del navegador (no hay configuración de almacenamiento local)');
      return this.saveToBrowserStorage(filename, data);
    }

    try {
      console.log(`💾 Guardando archivo: ${subdirectory}/${filename}`);
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      console.log(`✅ Archivo guardado exitosamente: ${subdirectory}/${filename}`);
      return true;
    } catch (error) {
      console.error('❌ Error guardando JSON:', error);
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
      console.warn(`⚠️ No hay baseDirectoryHandle pero hay configuración. No se puede leer ${filename} desde localStorage porque está en el sistema de archivos.`);
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
      console.error('Error leyendo JSON:', error);
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
      console.warn('⚠️ No hay baseDirectoryHandle pero hay configuración de almacenamiento local. Los archivos están en el sistema de archivos, no en localStorage.');
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
      console.error('Error listando archivos:', error);
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
      console.warn('⚠️ Guardando archivo binario en IndexedDB (no hay baseDirectoryHandle)');
      // Para archivos binarios, usar IndexedDB como fallback
      return this.saveToIndexedDB(filename, blob);
    }

    try {
      console.log(`💾 Guardando archivo binario: ${subdirectory}/${filename}`);
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      const fileHandle = await dir.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      console.log(`✅ Archivo binario guardado exitosamente: ${subdirectory}/${filename}`);
      
      // Retornar ruta relativa para usar en el editor
      return `./files/${filename}`;
    } catch (error) {
      console.error('❌ Error guardando archivo binario:', error);
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
      console.error('Error leyendo archivo binario:', error);
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
      console.error('Error obteniendo URL:', error);
      return this.getIndexedDBURL(filename);
    }
  }

  // Métodos de fallback usando localStorage del navegador
  saveToBrowserStorage(filename, data) {
    try {
      localStorage.setItem(`notion-${filename}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
      return false;
    }
  }

  readFromBrowserStorage(filename) {
    try {
      const data = localStorage.getItem(`notion-${filename}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error leyendo de localStorage:', error);
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
        console.error('Error eliminando de localStorage:', error);
        return false;
      }
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      await dir.removeEntry(filename);
      console.log(`✅ Archivo eliminado: ${subdirectory}/${filename}`);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo JSON:', error);
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
        console.error('Error eliminando de IndexedDB:', error);
        return false;
      }
    }

    try {
      const dir = await this.getOrCreateSubdirectory(subdirectory);
      await dir.removeEntry(filename);
      console.log(`✅ Archivo binario eliminado: ${subdirectory}/${filename}`);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo binario:', error);
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
          console.log(`✅ Archivo eliminado de IndexedDB: ${filename}`);
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
        console.warn('⚠️ Handle de directorio ya no es válido');
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

