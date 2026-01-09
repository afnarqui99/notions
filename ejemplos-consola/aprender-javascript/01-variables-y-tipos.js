// ============================================
// 1. VARIABLES Y TIPOS DE DATOS
// ============================================

console.log("=".repeat(50));
console.log("1. VARIABLES Y TIPOS DE DATOS");
console.log("=".repeat(50));

// Variables con let (puede cambiar)
let edad = 25;
let cantidad = 100;
console.log(`Edad: ${edad}, Tipo: ${typeof edad}`);

// Variables con const (no puede cambiar)
const PI = 3.14159;
const nombre = "Juan";
console.log(`PI: ${PI}, Tipo: ${typeof PI}`);
console.log(`Nombre: ${nombre}, Tipo: ${typeof nombre}`);

// Números
let precio = 19.99;
let temperatura = 36.5;
console.log(`Precio: ${precio}, Tipo: ${typeof precio}`);

// Cadenas de texto (strings)
let apellido = 'Pérez';
let mensaje = `Este es un mensaje
de múltiples líneas`;
console.log(`Mensaje: ${mensaje}`);

// Booleanos
let esActivo = true;
let tienePermiso = false;
console.log(`Es activo: ${esActivo}, Tipo: ${typeof esActivo}`);

// null y undefined
let valor = null;
let sinValor = undefined;
console.log(`Valor: ${valor}, Tipo: ${typeof valor}`);
console.log(`Sin valor: ${sinValor}, Tipo: ${typeof sinValor}`);

// Conversión de tipos
let numeroTexto = "123";
let numeroEntero = parseInt(numeroTexto);
let numeroDecimal = parseFloat(numeroTexto);
let textoNumero = String(123);
console.log(`Conversión: '${numeroTexto}' -> ${numeroEntero}`);

// Template strings (interpolación)
let nombreCompleto = `${nombre} ${apellido}`;
console.log(`Nombre completo: ${nombreCompleto}`);

