// ============================================
// 3. OBJETOS Y JSON
// ============================================

console.log("=".repeat(50));
console.log("3. OBJETOS Y JSON");
console.log("=".repeat(50));

// Crear objetos
let persona = {
    nombre: "Juan",
    edad: 30,
    ciudad: "Madrid",
    activo: true
};

console.log("Persona:", persona);

// Acceder a propiedades
console.log(`Nombre: ${persona.nombre}`);
console.log(`Edad: ${persona['edad']}`);
console.log(`Ciudad: ${persona.ciudad || 'No especificada'}`);

// Modificar propiedades
persona.edad = 31;
persona.email = "juan@example.com";
console.log("Después de modificar:", persona);

// Eliminar propiedades
delete persona.activo;
console.log("Después de eliminar:", persona);

// Recorrer objeto
console.log("\nRecorriendo objeto:");
for (let clave in persona) {
    console.log(`  ${clave}: ${persona[clave]}`);
}

// Object.keys, Object.values, Object.entries
console.log("\nClaves:", Object.keys(persona));
console.log("Valores:", Object.values(persona));
console.log("Entradas:", Object.entries(persona));

// Objetos anidados
let empresa = {
    nombre: "Tech Corp",
    empleados: [
        { nombre: "Ana", edad: 28 },
        { nombre: "Luis", edad: 35 }
    ],
    direccion: {
        calle: "Calle Principal 123",
        ciudad: "Barcelona"
    }
};

console.log("\nEmpresa:", empresa);
console.log(`Primer empleado:`, empresa.empleados[0]);
console.log(`Ciudad: ${empresa.direccion.ciudad}`);

// Convertir objeto a JSON string
let jsonString = JSON.stringify(persona, null, 2);
console.log("\nJSON string (formateado):");
console.log(jsonString);

// Convertir JSON string a objeto
let personaRecuperada = JSON.parse(jsonString);
console.log("\nObjeto recuperado del JSON:");
console.log(personaRecuperada);

// Trabajar con JSON más complejo
let productos = [
    {
        id: 1,
        nombre: "Laptop",
        precio: 999.99,
        stock: 10,
        categorias: ["electrónica", "computadoras"]
    },
    {
        id: 2,
        nombre: "Mouse",
        precio: 29.99,
        stock: 50,
        categorias: ["electrónica", "accesorios"]
    },
    {
        id: 3,
        nombre: "Teclado",
        precio: 79.99,
        stock: 30,
        categorias: ["electrónica", "accesorios"]
    }
];

console.log("\nLista de productos:");
productos.forEach(producto => {
    console.log(`  ${producto.nombre}: $${producto.precio}`);
});

// Filtrar productos
let productosEconomicos = productos.filter(p => p.precio < 100);
console.log("\nProductos económicos (< $100):");
productosEconomicos.forEach(producto => {
    console.log(`  ${producto.nombre}: $${producto.precio}`);
});

// Calcular total
let totalStock = productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);
console.log(`\nValor total del inventario: $${totalStock.toFixed(2)}`);

// Buscar producto por ID
function buscarProducto(idBuscado) {
    return productos.find(p => p.id === idBuscado);
}

let productoEncontrado = buscarProducto(2);
console.log(`\nProducto con ID 2:`, productoEncontrado);

// Agregar nuevo producto
let nuevoProducto = {
    id: 4,
    nombre: "Monitor",
    precio: 199.99,
    stock: 15,
    categorias: ["electrónica", "monitores"]
};
productos.push(nuevoProducto);
console.log(`\nProductos después de agregar: ${productos.length} productos`);

// Convertir toda la lista a JSON
let productosJSON = JSON.stringify(productos, null, 2);
console.log("\nLista completa en JSON:");
console.log(productosJSON);

