# 🗄️ Aprender SQL con SQLite

Ejemplos educativos para aprender SQL desde cero usando SQLite.

## 📚 Contenido

Este proyecto incluye ejemplos de:
- Crear tablas (CREATE TABLE)
- Insertar datos (INSERT)
- Consultas básicas (SELECT)
- Funciones agregadas (COUNT, SUM, AVG, MAX, MIN)
- Joins (INNER JOIN, LEFT JOIN)
- Subconsultas
- Actualizar datos (UPDATE)
- Eliminar datos (DELETE)
- Índices
- Vistas (Views)
- Transacciones
- Consultas avanzadas (LIKE, BETWEEN, IN, CASE)

## 🚀 Cómo Usar

### Opción 1: Desde la Consola de la Aplicación

1. Abre la consola con `/consola`
2. Selecciona **SQLite** como lenguaje
3. Puedes copiar y pegar las consultas del archivo `ejemplos.sql`
4. O ejecuta el archivo completo

### Opción 2: Desde la Terminal con SQLite

```bash
# Navega al directorio del proyecto
cd ejemplos-consola\aprender-sql

# Abre SQLite (crea la base de datos automáticamente)
sqlite3 mi_base_datos.db

# Dentro de SQLite, ejecuta el archivo:
.read ejemplos.sql

# O ejecuta consultas individuales
SELECT * FROM usuarios;
```

### Opción 3: Usar un Cliente SQL

Puedes usar herramientas como:
- **DB Browser for SQLite** (GUI)
- **SQLiteStudio** (GUI)
- **DBeaver** (Multi-base de datos)
- **VS Code** con extensión SQLite

## 📋 Requisitos Previos

- SQLite 3 (viene preinstalado en la mayoría de sistemas)
- O descarga desde: https://www.sqlite.org/download.html

## 💡 Conceptos Clave

### Tipos de Datos en SQLite
- `INTEGER` - Números enteros
- `TEXT` - Cadenas de texto
- `REAL` - Números decimales
- `BLOB` - Datos binarios
- `NULL` - Valor nulo

### Comandos Principales

**DDL (Data Definition Language):**
- `CREATE TABLE` - Crear tablas
- `ALTER TABLE` - Modificar tablas
- `DROP TABLE` - Eliminar tablas

**DML (Data Manipulation Language):**
- `SELECT` - Consultar datos
- `INSERT` - Insertar datos
- `UPDATE` - Actualizar datos
- `DELETE` - Eliminar datos

**DCL (Data Control Language):**
- `GRANT` - Otorgar permisos
- `REVOKE` - Revocar permisos

### Relaciones
- **PRIMARY KEY**: Identificador único
- **FOREIGN KEY**: Referencia a otra tabla
- **UNIQUE**: Valor único en la columna
- **NOT NULL**: Campo obligatorio

### Joins
- **INNER JOIN**: Solo registros que coinciden en ambas tablas
- **LEFT JOIN**: Todos los registros de la tabla izquierda
- **RIGHT JOIN**: Todos los registros de la tabla derecha
- **FULL OUTER JOIN**: Todos los registros de ambas tablas

## 🎓 Estructura de la Base de Datos de Ejemplo

### Tabla: usuarios
- id (PRIMARY KEY)
- nombre
- email (UNIQUE)
- edad
- fecha_registro

### Tabla: productos
- id (PRIMARY KEY)
- nombre
- precio
- categoria
- stock

### Tabla: pedidos
- id (PRIMARY KEY)
- usuario_id (FOREIGN KEY → usuarios)
- producto_id (FOREIGN KEY → productos)
- cantidad
- fecha_pedido

## 📖 Consultas de Ejemplo

### Consulta Simple
```sql
SELECT * FROM usuarios WHERE edad > 30;
```

### Consulta con JOIN
```sql
SELECT u.nombre, p.nombre AS producto
FROM pedidos ped
INNER JOIN usuarios u ON ped.usuario_id = u.id
INNER JOIN productos p ON ped.producto_id = p.id;
```

### Agregación
```sql
SELECT categoria, COUNT(*) AS cantidad, AVG(precio) AS precio_promedio
FROM productos
GROUP BY categoria;
```

## 🔧 Próximos Pasos

Después de estos ejemplos, puedes aprender:
- Normalización de bases de datos
- Triggers (disparadores)
- Stored Procedures
- Optimización de consultas
- Índices avanzados
- Migración a SQL Server, PostgreSQL, MySQL

---

¡Disfruta aprendiendo SQL! 🚀

