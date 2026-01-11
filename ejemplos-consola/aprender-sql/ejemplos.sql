-- ============================================
-- Aprender SQL - Ejemplos Educativos
-- ============================================

-- Crear base de datos (SQLite)
-- SQLite crea automáticamente la base de datos al ejecutar comandos

-- ============================================
-- 1. CREAR TABLAS
-- ============================================

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    edad INTEGER,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL NOT NULL,
    categoria TEXT,
    stock INTEGER DEFAULT 0
);

-- Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ============================================
-- 2. INSERTAR DATOS
-- ============================================

-- Insertar usuarios
INSERT INTO usuarios (nombre, email, edad) VALUES
    ('Juan Pérez', 'juan@example.com', 30),
    ('Ana García', 'ana@example.com', 25),
    ('Carlos López', 'carlos@example.com', 35),
    ('María Rodríguez', 'maria@example.com', 28),
    ('Pedro Martínez', 'pedro@example.com', 42);

-- Insertar productos
INSERT INTO productos (nombre, precio, categoria, stock) VALUES
    ('Laptop', 999.99, 'Electrónica', 10),
    ('Mouse', 25.50, 'Electrónica', 50),
    ('Teclado', 75.00, 'Electrónica', 30),
    ('Monitor', 299.99, 'Electrónica', 15),
    ('Auriculares', 49.99, 'Audio', 40);

-- Insertar pedidos
INSERT INTO pedidos (usuario_id, producto_id, cantidad) VALUES
    (1, 1, 1),
    (1, 2, 2),
    (2, 3, 1),
    (3, 4, 1),
    (2, 5, 3),
    (4, 1, 1),
    (5, 2, 1);

-- ============================================
-- 3. CONSULTAS BÁSICAS (SELECT)
-- ============================================

-- Seleccionar todos los usuarios
SELECT * FROM usuarios;

-- Seleccionar columnas específicas
SELECT nombre, email FROM usuarios;

-- Seleccionar con condición WHERE
SELECT * FROM usuarios WHERE edad > 30;

-- Seleccionar con múltiples condiciones
SELECT * FROM productos WHERE precio < 100 AND stock > 20;

-- Ordenar resultados
SELECT * FROM usuarios ORDER BY edad DESC;

-- Limitar resultados
SELECT * FROM productos LIMIT 3;

-- ============================================
-- 4. FUNCIONES AGREGADAS
-- ============================================

-- Contar registros
SELECT COUNT(*) AS total_usuarios FROM usuarios;

-- Sumar valores
SELECT SUM(precio) AS total_precios FROM productos;

-- Promedio
SELECT AVG(precio) AS precio_promedio FROM productos;

-- Máximo y mínimo
SELECT MAX(precio) AS precio_maximo, MIN(precio) AS precio_minimo FROM productos;

-- Agrupar por categoría
SELECT categoria, COUNT(*) AS cantidad, AVG(precio) AS precio_promedio
FROM productos
GROUP BY categoria;

-- ============================================
-- 5. JOINS (UNIONES)
-- ============================================

-- INNER JOIN - Pedidos con información de usuario y producto
SELECT 
    p.id AS pedido_id,
    u.nombre AS usuario,
    pr.nombre AS producto,
    p.cantidad,
    pr.precio * p.cantidad AS total
FROM pedidos p
INNER JOIN usuarios u ON p.usuario_id = u.id
INNER JOIN productos pr ON p.producto_id = pr.id;

-- LEFT JOIN - Todos los usuarios y sus pedidos (si tienen)
SELECT 
    u.nombre,
    COUNT(p.id) AS total_pedidos
FROM usuarios u
LEFT JOIN pedidos p ON u.id = p.usuario_id
GROUP BY u.id, u.nombre;

-- ============================================
-- 6. SUBCONSULTAS
-- ============================================

-- Usuarios que han hecho pedidos
SELECT nombre, email
FROM usuarios
WHERE id IN (SELECT DISTINCT usuario_id FROM pedidos);

-- Productos más caros que el promedio
SELECT nombre, precio
FROM productos
WHERE precio > (SELECT AVG(precio) FROM productos);

-- ============================================
-- 7. ACTUALIZAR DATOS (UPDATE)
-- ============================================

-- Actualizar un registro
UPDATE usuarios SET edad = 31 WHERE nombre = 'Juan Pérez';

-- Actualizar múltiples registros
UPDATE productos SET stock = stock + 10 WHERE categoria = 'Electrónica';

-- ============================================
-- 8. ELIMINAR DATOS (DELETE)
-- ============================================

-- Eliminar un registro específico
-- DELETE FROM usuarios WHERE id = 5;

-- Eliminar todos los registros (¡CUIDADO!)
-- DELETE FROM pedidos;

-- ============================================
-- 9. ÍNDICES (Para mejorar rendimiento)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_producto_categoria ON productos(categoria);

-- ============================================
-- 10. VISTAS (Views)
-- ============================================

CREATE VIEW IF NOT EXISTS vista_pedidos_completos AS
SELECT 
    p.id AS pedido_id,
    u.nombre AS usuario,
    pr.nombre AS producto,
    pr.precio,
    p.cantidad,
    pr.precio * p.cantidad AS total,
    p.fecha_pedido
FROM pedidos p
INNER JOIN usuarios u ON p.usuario_id = u.id
INNER JOIN productos pr ON p.producto_id = pr.id;

-- Usar la vista
SELECT * FROM vista_pedidos_completos;

-- ============================================
-- 11. TRANSACCIONES
-- ============================================

BEGIN TRANSACTION;
    INSERT INTO usuarios (nombre, email, edad) VALUES ('Test', 'test@example.com', 20);
    INSERT INTO pedidos (usuario_id, producto_id, cantidad) VALUES (last_insert_rowid(), 1, 1);
COMMIT;

-- Para revertir cambios:
-- ROLLBACK;

-- ============================================
-- 12. CONSULTAS AVANZADAS
-- ============================================

-- LIKE - Búsqueda de patrones
SELECT * FROM usuarios WHERE nombre LIKE '%Juan%';

-- BETWEEN - Rango de valores
SELECT * FROM productos WHERE precio BETWEEN 50 AND 200;

-- IN - Múltiples valores
SELECT * FROM usuarios WHERE edad IN (25, 30, 35);

-- CASE - Condicionales
SELECT 
    nombre,
    precio,
    CASE 
        WHEN precio < 50 THEN 'Económico'
        WHEN precio < 200 THEN 'Medio'
        ELSE 'Caro'
    END AS categoria_precio
FROM productos;

-- ============================================
-- FIN DE EJEMPLOS
-- ============================================


