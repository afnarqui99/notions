// ============================================
// CURSO COMPLETO DE JAVASCRIPT/NODE.JS
// Ejecuta cada archivo individualmente o este index para ver todos
// ============================================

const fs = require('fs');
const path = require('path');

console.log("=".repeat(60));
console.log("CURSO COMPLETO DE JAVASCRIPT/NODE.JS - EJEMPLOS PRÁCTICOS");
console.log("=".repeat(60));
console.log("\nEste directorio contiene ejemplos educativos de JavaScript:");
console.log("\n1. 01-variables-y-tipos.js - Variables y tipos de datos");
console.log("2. 02-arrays-y-listas.js - Arrays y listas");
console.log("3. 03-objetos-y-json.js - Objetos y JSON");
console.log("4. 04-bucles-y-recorridos.js - Bucles y recorridos");
console.log("5. 05-funciones.js - Funciones");
console.log("6. 06-manipulacion-json-avanzada.js - Manipulación JSON avanzada");
console.log("\nPara ejecutar un ejemplo específico, usa ese archivo.");
console.log("Para ver todos, ejecuta este index.js");
console.log("\n" + "=".repeat(60));

// Ejecutar todos los ejemplos
const archivos = [
    "01-variables-y-tipos.js",
    "02-arrays-y-listas.js",
    "03-objetos-y-json.js",
    "04-bucles-y-recorridos.js",
    "05-funciones.js",
    "06-manipulacion-json-avanzada.js"
];

archivos.forEach(archivo => {
    const ruta = path.join(__dirname, archivo);
    if (fs.existsSync(ruta)) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`Ejecutando: ${archivo}`);
        console.log("=".repeat(60));
        try {
            require(ruta);
        } catch (error) {
            console.error(`Error ejecutando ${archivo}:`, error.message);
        }
        console.log("\n");
    }
});

