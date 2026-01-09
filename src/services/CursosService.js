/**
 * Servicio para gestionar cursos educativos
 * Soporta cursos incluidos en el build y cursos externos configurables
 */

class CursosService {
  constructor() {
    this.cursosIncluidosPath = null; // Se establecerá desde Electron
    this.cursosExternosPath = null; // Se establecerá desde configuración
  }

  /**
   * Obtener la ruta base de los cursos incluidos
   * En Electron, esto apunta a resources/cursos
   * En desarrollo, apunta a ejemplos-consola
   */
  async getCursosIncluidosPath() {
    // En Electron, usar la ruta de recursos
    if (window.electronAPI && window.electronAPI.getCursosPath) {
      return await window.electronAPI.getCursosPath();
    }
    
    // En desarrollo o navegador, usar ruta relativa
    // Esto se resuelve desde el contexto de la aplicación
    return null; // Se manejará desde el backend
  }

  /**
   * Obtener la ruta de cursos externos desde configuración
   */
  getCursosExternosPath() {
    const config = JSON.parse(localStorage.getItem('notion-local-config') || '{}');
    return config.cursosExternosPath || null;
  }

  /**
   * Establecer la ruta de cursos externos
   */
  setCursosExternosPath(path) {
    const config = JSON.parse(localStorage.getItem('notion-local-config') || '{}');
    config.cursosExternosPath = path;
    localStorage.setItem('notion-local-config', JSON.stringify(config));
    this.cursosExternosPath = path;
  }

  /**
   * Obtener todas las rutas donde buscar cursos
   * PRIORIDAD: Externos primero (para poder agregar sin reinstalar), luego incluidos
   */
  async getRutasCursos() {
    const rutas = [];
    
    // 1. Cursos externos PRIMERO (prioridad alta - para agregar sin reinstalar)
    const externos = this.getCursosExternosPath();
    if (externos) {
      rutas.push({
        path: externos,
        tipo: 'externo',
        nombre: 'Cursos Externos',
        prioridad: 1
      });
    }

    // 2. Cursos incluidos (siempre disponibles - todos los cursos vienen incluidos)
    const incluidos = await this.getCursosIncluidosPath();
    if (incluidos) {
      rutas.push({
        path: incluidos,
        tipo: 'incluido',
        nombre: 'Cursos Incluidos',
        prioridad: 2
      });
    }

    // 3. Ruta por defecto (fallback en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      const defaultPath = 'C:\\projects\\san\\notion-local-editor\\ejemplos-consola';
      rutas.push({
        path: defaultPath,
        tipo: 'desarrollo',
        nombre: 'Cursos de Desarrollo',
        prioridad: 3
      });
    }

    // Ordenar por prioridad
    return rutas.sort((a, b) => a.prioridad - b.prioridad);
  }

  /**
   * Obtener la ruta completa de un curso específico
   * Busca en todas las ubicaciones disponibles
   */
  async getRutaCurso(nombreCurso) {
    const rutas = this.getRutasCursos();
    
    for (const rutaInfo of rutas) {
      const rutaCompleta = `${rutaInfo.path}\\${nombreCurso}`;
      
      // Verificar si existe (solo en Electron)
      if (window.electronAPI && window.electronAPI.pathExists) {
        const existe = await window.electronAPI.pathExists(rutaCompleta);
        if (existe) {
          return {
            path: rutaCompleta,
            tipo: rutaInfo.tipo,
            nombre: rutaInfo.nombre
          };
        }
      } else {
        // En navegador, devolver la primera ruta disponible
        return {
          path: rutaCompleta,
          tipo: rutaInfo.tipo,
          nombre: rutaInfo.nombre
        };
      }
    }

    return null;
  }

  /**
   * Obtener información de todos los cursos disponibles
   */
  async getCursosDisponibles() {
    const cursos = [];
    const rutas = this.getRutasCursos();

    for (const rutaInfo of rutas) {
      if (window.electronAPI && window.electronAPI.listCursos) {
        const cursosEnRuta = await window.electronAPI.listCursos(rutaInfo.path);
        cursosEnRuta.forEach(curso => {
          cursos.push({
            ...curso,
            origen: rutaInfo.nombre,
            tipo: rutaInfo.tipo,
            rutaCompleta: `${rutaInfo.path}\\${curso.nombre}`
          });
        });
      }
    }

    return cursos;
  }

  /**
   * Obtener la ruta formateada para mostrar en la UI
   * Esta función es síncrona para uso en renderizado
   */
  getRutaFormateada(nombreCurso) {
    // Primero intentar cursos externos (si están configurados)
    const externos = this.getCursosExternosPath();
    if (externos) {
      return `${externos}\\${nombreCurso}`;
    }

    // Luego usar cursos incluidos (async, pero para UI usamos fallback)
    // En producción, los cursos están en resources/cursos
    // En desarrollo, en ejemplos-consola
    if (process.env.NODE_ENV === 'development') {
      return `C:\\projects\\san\\notion-local-editor\\ejemplos-consola\\${nombreCurso}`;
    }

    // En producción, la ruta se resuelve dinámicamente desde Electron
    // Por ahora devolvemos una ruta relativa que se completará
    return `cursos\\${nombreCurso}`;
  }

  /**
   * Obtener la ruta formateada de forma asíncrona (más precisa)
   */
  async getRutaFormateadaAsync(nombreCurso) {
    const rutas = await this.getRutasCursos();
    
    // Buscar en orden de prioridad
    for (const ruta of rutas) {
      const rutaCompleta = `${ruta.path}\\${nombreCurso}`;
      
      // Verificar si existe (solo en Electron)
      if (window.electronAPI && window.electronAPI.pathExists) {
        const existe = await window.electronAPI.pathExists(rutaCompleta);
        if (existe) {
          return rutaCompleta;
        }
      } else {
        // En navegador, devolver la primera disponible
        return rutaCompleta;
      }
    }

    // Fallback
    return this.getRutaFormateada(nombreCurso);
  }
}

// Exportar instancia singleton
const cursosService = new CursosService();
export default cursosService;

