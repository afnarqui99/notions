// ============================================
// 2. ARRAYS Y LISTAS
// ============================================

console.log("=".repeat(50));
console.log("2. ARRAYS Y LISTAS");
console.log("=".repeat(50));

// Crear arrays
let numeros = [1, 2, 3, 4, 5];
let nombres = ["Ana", "Juan", "María"];
let mezclado = [1, "dos", 3.0, true];

console.log(`Array de números: ${numeros}`);
console.log(`Array de nombres:`, nombres);
console.log(`Array mezclado:`, mezclado);

// Acceder a elementos
console.log(`Primer elemento: ${numeros[0]}`);
console.log(`Último elemento: ${numeros[numeros.length - 1]}`);
console.log(`Elementos del 1 al 3:`, numeros.slice(1, 4));

// Modificar elementos
numeros[0] = 10;
console.log(`Después de modificar:`, numeros);

// Agregar elementos
numeros.push(6);        // Al final
numeros.unshift(0);    // Al inicio
console.log(`Después de agregar:`, numeros);

// Eliminar elementos
numeros.pop();          // Del final
numeros.shift();        // Del inicio
numeros.splice(0, 1);   // Eliminar desde índice
console.log(`Después de eliminar:`, numeros);

// Operaciones con arrays
console.log(`Longitud: ${numeros.length}`);
console.log(`Suma: ${numeros.reduce((a, b) => a + b, 0)}`);
console.log(`Máximo: ${Math.max(...numeros)}`);
console.log(`Mínimo: ${Math.min(...numeros)}`);

// Arrays anidados (matrices)
let matriz = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
console.log(`Matriz:`, matriz);
console.log(`Elemento [1][2]: ${matriz[1][2]}`);

// Array methods útiles
let cuadrados = numeros.map(x => x * x);
let pares = numeros.filter(x => x % 2 === 0);
let suma = numeros.reduce((acc, x) => acc + x, 0);
let todosMayores = numeros.every(x => x > 0);
let algunoMayor = numeros.some(x => x > 10);

console.log(`Cuadrados:`, cuadrados);
console.log(`Pares:`, pares);
console.log(`Suma: ${suma}`);
console.log(`Todos mayores que 0: ${todosMayores}`);
console.log(`Alguno mayor que 10: ${algunoMayor}`);

// Spread operator
let masNumeros = [...numeros, 6, 7, 8];
console.log(`Con spread:`, masNumeros);

// Destructuring
let [primero, segundo, ...resto] = numeros;
console.log(`Primero: ${primero}, Segundo: ${segundo}, Resto:`, resto);


