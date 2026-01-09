// ============================================
// 5. FUNCIONES
// ============================================

console.log("=".repeat(50));
console.log("5. FUNCIONES");
console.log("=".repeat(50));

// Función declarada
function saludar() {
    console.log("¡Hola!");
}
saludar();

// Función con parámetros
function saludarNombre(nombre) {
    console.log(`¡Hola ${nombre}!`);
}
saludarNombre("Juan");
saludarNombre("María");

// Función con múltiples parámetros
function sumar(a, b) {
    return a + b;
}
let resultado = sumar(5, 3);
console.log(`Suma: ${resultado}`);

// Función con parámetros por defecto
function presentar(nombre, edad = 18, ciudad = "Desconocida") {
    console.log(`${nombre}, ${edad} años, de ${ciudad}`);
}
presentar("Ana");
presentar("Luis", 25);
presentar("María", 30, "Barcelona");

// Función con argumentos variables (rest parameters)
function sumarVarios(...numeros) {
    return numeros.reduce((acc, n) => acc + n, 0);
}
console.log(`Suma de varios: ${sumarVarios(1, 2, 3, 4, 5)}`);

// Función con argumentos con nombre (destructuring)
function crearPersona({ nombre, edad, ciudad }) {
    return { nombre, edad, ciudad };
}
let persona = crearPersona({ nombre: "Juan", edad: 30, ciudad: "Madrid" });
console.log("Persona creada:", persona);

// Arrow functions (funciones flecha)
let multiplicar = (x, y) => x * y;
console.log(`Multiplicación: ${multiplicar(4, 5)}`);

// Arrow function con map
let numeros = [1, 2, 3, 4, 5];
let cuadrados = numeros.map(x => x * x);
console.log(`Cuadrados:`, cuadrados);

// Arrow function con filter
let pares = numeros.filter(x => x % 2 === 0);
console.log(`Pares:`, pares);

// Arrow function con reduce
let suma = numeros.reduce((acc, x) => acc + x, 0);
console.log(`Suma: ${suma}`);

// Función que retorna múltiples valores (array)
function dividirYResto(a, b) {
    return [Math.floor(a / b), a % b];
}
let [cociente, resto] = dividirYResto(17, 5);
console.log(`17 ÷ 5 = ${cociente} con resto ${resto}`);

// Función recursiva
function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
console.log(`Factorial de 5: ${factorial(5)}`);

// Funciones de orden superior (higher-order functions)
function operar(a, b, operacion) {
    return operacion(a, b);
}

let sumaFunc = (x, y) => x + y;
let restaFunc = (x, y) => x - y;
let multiFunc = (x, y) => x * y;

console.log(`Operar(5, 3, suma): ${operar(5, 3, sumaFunc)}`);
console.log(`Operar(5, 3, resta): ${operar(5, 3, restaFunc)}`);
console.log(`Operar(5, 3, multi): ${operar(5, 3, multiFunc)}`);

// Callbacks
function procesarDatos(datos, callback) {
    let resultado = datos.map(callback);
    return resultado;
}

let datos = [1, 2, 3, 4, 5];
let duplicados = procesarDatos(datos, x => x * 2);
console.log(`Datos duplicados:`, duplicados);

