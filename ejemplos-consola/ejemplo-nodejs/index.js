// index.js
console.log("¡Hola Mundo desde Node.js!");
console.log("Esto solo funciona en Electron");

// Ejemplo con módulos de Node.js
const os = require('os');
console.log(`Sistema operativo: ${os.platform()}`);
console.log(`Arquitectura: ${os.arch()}`);
console.log(`Memoria total: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);

// Ejemplo con operaciones
const numeros = [1, 2, 3, 4, 5];
const suma = numeros.reduce((a, b) => a + b, 0);
console.log(`Suma de ${numeros.join(' + ')} = ${suma}`);

// Ejemplo con funciones
function saludar(nombre) {
    return `¡Hola ${nombre}!`;
}
console.log(saludar("Mundo"));

// Ejemplo con objetos
const persona = {
    nombre: "Juan",
    edad: 30,
    ciudad: "Madrid"
};
console.log("Persona:", persona);
console.log(`Nombre: ${persona.nombre}`);

// Ejemplo con arrays
const datos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pares = datos.filter(n => n % 2 === 0);
const cuadrados = datos.map(n => n * n);
console.log("Datos originales:", datos);
console.log("Números pares:", pares);
console.log("Cuadrados:", cuadrados);

