// ============================================
// 6. MANIPULACIÓN DE JSON AVANZADA
// ============================================

console.log("=".repeat(50));
console.log("6. MANIPULACIÓN DE JSON AVANZADA");
console.log("=".repeat(50));

// JSON complejo con múltiples niveles
let tienda = {
    nombre: "TechStore",
    direccion: {
        calle: "Calle Principal 123",
        ciudad: "Madrid",
        codigoPostal: "28001"
    },
    productos: [
        {
            id: 1,
            nombre: "Laptop",
            precio: 999.99,
            stock: 10,
            especificaciones: {
                procesador: "Intel i7",
                ram: "16GB",
                almacenamiento: "512GB SSD"
            },
            categorias: ["electrónica", "computadoras"],
            disponible: true
        },
        {
            id: 2,
            nombre: "Mouse",
            precio: 29.99,
            stock: 50,
            especificaciones: {
                tipo: "Inalámbrico",
                dpi: 1600
            },
            categorias: ["electrónica", "accesorios"],
            disponible: true
        },
        {
            id: 3,
            nombre: "Teclado",
            precio: 79.99,
            stock: 30,
            especificaciones: {
                tipo: "Mecánico",
                switches: "Cherry MX"
            },
            categorias: ["electrónica", "accesorios"],
            disponible: true
        }
    ],
    clientes: [
        {
            id: 1,
            nombre: "Ana García",
            email: "ana@example.com",
            pedidos: [1, 2]
        },
        {
            id: 2,
            nombre: "Luis Martínez",
            email: "luis@example.com",
            pedidos: [3]
        }
    ]
};

console.log("Tienda completa:");
console.log(JSON.stringify(tienda, null, 2));

// Operaciones comunes con JSON

// 1. Buscar producto por ID
function buscarProducto(id) {
    return tienda.productos.find(p => p.id === id);
}
console.log("\nProducto con ID 2:");
console.log(buscarProducto(2));

// 2. Filtrar productos por categoría
function productosPorCategoria(categoria) {
    return tienda.productos.filter(p => 
        p.categorias.includes(categoria)
    );
}
console.log("\nProductos de 'accesorios':");
console.log(productosPorCategoria("accesorios"));

// 3. Productos con stock bajo
function productosStockBajo(limite = 20) {
    return tienda.productos.filter(p => p.stock < limite);
}
console.log("\nProductos con stock bajo (< 20):");
console.log(productosStockBajo());

// 4. Calcular valor total del inventario
function valorTotalInventario() {
    return tienda.productos.reduce((total, p) => 
        total + (p.precio * p.stock), 0
    );
}
console.log(`\nValor total del inventario: $${valorTotalInventario().toFixed(2)}`);

// 5. Agregar nuevo producto
function agregarProducto(producto) {
    producto.id = tienda.productos.length + 1;
    tienda.productos.push(producto);
    return producto;
}

let nuevoProducto = {
    nombre: "Monitor",
    precio: 199.99,
    stock: 15,
    especificaciones: {
        tamaño: "27 pulgadas",
        resolucion: "4K"
    },
    categorias: ["electrónica", "monitores"],
    disponible: true
};

agregarProducto(nuevoProducto);
console.log("\nProductos después de agregar:", tienda.productos.length);

// 6. Actualizar stock de producto
function actualizarStock(idProducto, nuevaCantidad) {
    let producto = buscarProducto(idProducto);
    if (producto) {
        producto.stock = nuevaCantidad;
        return true;
    }
    return false;
}
actualizarStock(1, 5);
console.log("\nStock actualizado del producto 1:", buscarProducto(1).stock);

// 7. Obtener estadísticas
function obtenerEstadisticas() {
    return {
        totalProductos: tienda.productos.length,
        totalClientes: tienda.clientes.length,
        valorInventario: valorTotalInventario(),
        productosDisponibles: tienda.productos.filter(p => p.disponible).length,
        categoriaMasComun: obtenerCategoriaMasComun()
    };
}

function obtenerCategoriaMasComun() {
    let categorias = {};
    tienda.productos.forEach(p => {
        p.categorias.forEach(cat => {
            categorias[cat] = (categorias[cat] || 0) + 1;
        });
    });
    return Object.keys(categorias).reduce((a, b) => 
        categorias[a] > categorias[b] ? a : b
    );
}

console.log("\nEstadísticas de la tienda:");
console.log(obtenerEstadisticas());

// 8. Convertir a JSON y guardar (simulado)
let tiendaJSON = JSON.stringify(tienda, null, 2);
console.log("\nTienda en formato JSON (primeros 500 caracteres):");
console.log(tiendaJSON.substring(0, 500) + "...");

// 9. Parsear JSON (simulado - cargar desde string)
let tiendaCargada = JSON.parse(tiendaJSON);
console.log("\nTienda cargada desde JSON:");
console.log(`Nombre: ${tiendaCargada.nombre}`);
console.log(`Total productos: ${tiendaCargada.productos.length}`);

// 10. Transformar datos (mapear estructura)
function transformarProductos() {
    return tienda.productos.map(p => ({
        nombre: p.nombre,
        precio: p.precio,
        disponible: p.disponible,
        categoria: p.categorias[0] // Primera categoría
    }));
}
console.log("\nProductos transformados:");
console.log(transformarProductos());

