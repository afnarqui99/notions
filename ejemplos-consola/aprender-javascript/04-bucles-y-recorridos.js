// ============================================
// 4. BUCLES Y RECORRIDOS
// ============================================

console.log("=".repeat(50));
console.log("4. BUCLES Y RECORRIDOS");
console.log("=".repeat(50));

// Bucle for clásico
console.log("Bucle for clásico:");
for (let i = 0; i < 5; i++) {
    console.log(`  Iteración ${i}`);
}

// Bucle for...of (recorrer arrays)
console.log("\nBucle for...of:");
let frutas = ["manzana", "banana", "naranja"];
for (let fruta of frutas) {
    console.log(`  Fruta: ${fruta}`);
}

// Bucle for...in (recorrer objetos)
console.log("\nBucle for...in:");
let persona = { nombre: "Juan", edad: 30, ciudad: "Madrid" };
for (let clave in persona) {
    console.log(`  ${clave}: ${persona[clave]}`);
}

// forEach (método de arrays)
console.log("\nforEach:");
frutas.forEach((fruta, indice) => {
    console.log(`  [${indice}] ${fruta}`);
});

// Bucle while
console.log("\nBucle while:");
let contador = 0;
while (contador < 5) {
    console.log(`  Contador: ${contador}`);
    contador++;
}

// Bucle do...while
console.log("\nBucle do...while:");
let i = 0;
do {
    console.log(`  Número: ${i}`);
    i++;
} while (i < 3);

// Bucle con break (salir)
console.log("\nBucle con break:");
for (let i = 0; i < 10; i++) {
    if (i === 5) {
        break;
    }
    console.log(`  Número: ${i}`);
}

// Bucle con continue (saltar)
console.log("\nBucle con continue:");
for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) {
        continue;
    }
    console.log(`  Número impar: ${i}`);
}

// Bucle anidado
console.log("\nBucle anidado (tabla de multiplicar):");
for (let i = 1; i < 4; i++) {
    for (let j = 1; j < 4; j++) {
        console.log(`  ${i} x ${j} = ${i * j}`);
    }
}

// Recorrer array con map
console.log("\nRecorrer con map:");
let numeros = [1, 2, 3, 4, 5];
let cuadrados = numeros.map(n => n * n);
console.log(`  Original:`, numeros);
console.log(`  Cuadrados:`, cuadrados);

// Recorrer array con filter
console.log("\nRecorrer con filter:");
let pares = numeros.filter(n => n % 2 === 0);
console.log(`  Pares:`, pares);

// Recorrer array con reduce
console.log("\nRecorrer con reduce:");
let suma = numeros.reduce((acc, n) => acc + n, 0);
console.log(`  Suma: ${suma}`);

