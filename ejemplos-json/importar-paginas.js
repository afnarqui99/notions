/**
 * Script para importar páginas JSON de ejemplo a la aplicación
 * 
 * Este script:
 * 1. Lee los archivos JSON de ejemplo
 * 2. Genera UUIDs únicos para cada página
 * 3. Mantiene un mapeo de IDs antiguos a nuevos UUIDs
 * 4. Actualiza los parentId con los nuevos UUIDs
 * 5. Guarda los archivos en la carpeta data/
 * 
 * USO:
 * 1. Copia este script a la raíz del proyecto
 * 2. Ejecuta: node importar-paginas.js
 * 3. Los archivos se importarán a la carpeta data/ de tu aplicación
 */

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Mapeo de IDs antiguos a nuevos UUIDs
const idMapping = new Map();

// Función para generar UUID
function generateUUID() {
  return randomUUID();
}

// Función para leer todos los archivos JSON de ejemplo
function leerArchivosEjemplo() {
  const ejemplosDir = path.join(__dirname, 'ejemplos-json');
  const archivos = fs.readdirSync(ejemplosDir)
    .filter(file => file.endsWith('.json') && file !== 'package.json');
  
  const paginas = [];
  
  for (const archivo of archivos) {
    const rutaCompleta = path.join(ejemplosDir, archivo);
    const contenido = fs.readFileSync(rutaCompleta, 'utf8');
    const pagina = JSON.parse(contenido);
    
    // Extraer el ID del nombre del archivo (sin .json)
    const idAntiguo = archivo.replace('.json', '');
    pagina.idAntiguo = idAntiguo;
    
    paginas.push(pagina);
  }
  
  return paginas;
}

// Función para generar nuevos UUIDs y crear mapeo
function generarMapeoIds(paginas) {
  for (const pagina of paginas) {
    const nuevoId = generateUUID();
    idMapping.set(pagina.idAntiguo, nuevoId);
    pagina.nuevoId = nuevoId;
  }
}

// Función para actualizar parentId en el contenido
function actualizarParentIdEnContenido(contenido, idMapping) {
  if (!contenido || typeof contenido !== 'object') {
    return contenido;
  }
  
  // Si es un array, procesar cada elemento
  if (Array.isArray(contenido)) {
    return contenido.map(item => actualizarParentIdEnContenido(item, idMapping));
  }
  
  // Si tiene parentId, actualizarlo
  if (contenido.parentId && idMapping.has(contenido.parentId)) {
    contenido.parentId = idMapping.get(contenido.parentId);
  }
  
  // Procesar recursivamente las propiedades
  for (const key in contenido) {
    if (contenido[key] && typeof contenido[key] === 'object') {
      contenido[key] = actualizarParentIdEnContenido(contenido[key], idMapping);
    }
  }
  
  return contenido;
}

// Función para importar páginas
function importarPaginas(paginas, carpetaDestino) {
  // Primero, crear todas las páginas sin parentId o con parentId que ya existe
  // Ordenar: primero las que no tienen parentId, luego las que tienen parentId que ya fue procesado
  const paginasOrdenadas = [];
  const procesadas = new Set();
  
  // Primera pasada: páginas sin parentId o con parentId null
  for (const pagina of paginas) {
    if (!pagina.parentId || pagina.parentId === null) {
      paginasOrdenadas.push(pagina);
      procesadas.add(pagina.idAntiguo);
    }
  }
  
  // Segunda pasada: páginas con parentId que ya fue procesado
  let cambios = true;
  while (cambios) {
    cambios = false;
    for (const pagina of paginas) {
      if (!procesadas.has(pagina.idAntiguo)) {
        const parentIdAntiguo = pagina.parentId;
        if (!parentIdAntiguo || procesadas.has(parentIdAntiguo)) {
          paginasOrdenadas.push(pagina);
          procesadas.add(pagina.idAntiguo);
          cambios = true;
        }
      }
    }
  }
  
  // Procesar cada página en orden
  for (const pagina of paginasOrdenadas) {
    // Actualizar parentId
    if (pagina.parentId && idMapping.has(pagina.parentId)) {
      pagina.parentId = idMapping.get(pagina.parentId);
    } else if (pagina.parentId === null || !pagina.parentId) {
      pagina.parentId = null;
    }
    
    // Actualizar contenido (por si hay referencias a otras páginas)
    if (pagina.contenido) {
      pagina.contenido = actualizarParentIdEnContenido(pagina.contenido, idMapping);
    }
    
    // Crear objeto final sin idAntiguo y nuevoId
    const paginaFinal = {
      titulo: pagina.titulo,
      emoji: pagina.emoji || null,
      contenido: pagina.contenido,
      tags: pagina.tags || [],
      parentId: pagina.parentId,
      creadoEn: pagina.creadoEn || new Date().toISOString(),
      actualizadoEn: pagina.actualizadoEn || new Date().toISOString()
    };
    
    // Guardar archivo
    const nombreArchivo = `${pagina.nuevoId}.json`;
    const rutaArchivo = path.join(carpetaDestino, nombreArchivo);
    
    fs.writeFileSync(rutaArchivo, JSON.stringify(paginaFinal, null, 2), 'utf8');
    console.log(`✅ Importada: ${pagina.titulo} -> ${nombreArchivo}`);
  }
  
  // Guardar mapeo de IDs para referencia
  const mapeoArchivo = path.join(carpetaDestino, 'mapeo-ids.json');
  const mapeoObj = Object.fromEntries(idMapping);
  fs.writeFileSync(mapeoArchivo, JSON.stringify(mapeoObj, null, 2), 'utf8');
  console.log(`\n📋 Mapeo de IDs guardado en: mapeo-ids.json`);
}

// Función principal
function main() {
  console.log('🚀 Iniciando importación de páginas...\n');
  
  // Leer archivos de ejemplo
  console.log('📖 Leyendo archivos de ejemplo...');
  const paginas = leerArchivosEjemplo();
  console.log(`   Encontradas ${paginas.length} páginas\n`);
  
  // Generar mapeo de IDs
  console.log('🔑 Generando UUIDs únicos...');
  generarMapeoIds(paginas);
  console.log(`   Generados ${idMapping.size} UUIDs\n`);
  
  // Solicitar carpeta destino
  const carpetaDestino = process.argv[2] || path.join(__dirname, '..', 'data');
  
  // Crear carpeta si no existe
  if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
    console.log(`📁 Carpeta creada: ${carpetaDestino}\n`);
  }
  
  // Importar páginas
  console.log('💾 Importando páginas...\n');
  importarPaginas(paginas, carpetaDestino);
  
  console.log(`\n✨ Importación completada! ${paginas.length} páginas importadas.`);
  console.log(`\n📝 Nota: Copia la carpeta 'data' a tu aplicación o usa la ruta:`);
  console.log(`   ${carpetaDestino}`);
}

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { main, leerArchivosEjemplo, generarMapeoIds, importarPaginas };


