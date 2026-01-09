# ============================================
# 5. MANIPULACIÓN DE JSON
# ============================================

import json

print("=" * 50)
print("5. MANIPULACIÓN DE JSON")
print("=" * 50)

# Datos en formato diccionario (similar a JSON)
datos = {
    "nombre": "Juan Pérez",
    "edad": 30,
    "ciudad": "Madrid",
    "hobbies": ["leer", "programar", "viajar"],
    "contacto": {
        "email": "juan@example.com",
        "telefono": "+34 123 456 789"
    }
}

print("Datos originales:")
print(datos)

# Convertir diccionario a JSON string
json_string = json.dumps(datos, indent=2, ensure_ascii=False)
print("\nJSON string (formateado):")
print(json_string)

# Convertir JSON string a diccionario
datos_recuperados = json.loads(json_string)
print("\nDatos recuperados del JSON:")
print(datos_recuperados)

# Trabajar con JSON más complejo
productos = [
    {
        "id": 1,
        "nombre": "Laptop",
        "precio": 999.99,
        "stock": 10,
        "categorias": ["electrónica", "computadoras"]
    },
    {
        "id": 2,
        "nombre": "Mouse",
        "precio": 29.99,
        "stock": 50,
        "categorias": ["electrónica", "accesorios"]
    },
    {
        "id": 3,
        "nombre": "Teclado",
        "precio": 79.99,
        "stock": 30,
        "categorias": ["electrónica", "accesorios"]
    }
]

print("\nLista de productos:")
for producto in productos:
    print(f"  {producto['nombre']}: ${producto['precio']}")

# Filtrar productos
productos_economicos = [p for p in productos if p['precio'] < 100]
print("\nProductos económicos (< $100):")
for producto in productos_economicos:
    print(f"  {producto['nombre']}: ${producto['precio']}")

# Calcular total
total_stock = sum(p['precio'] * p['stock'] for p in productos)
print(f"\nValor total del inventario: ${total_stock:.2f}")

# Buscar producto por ID
def buscar_producto(id_buscado):
    for producto in productos:
        if producto['id'] == id_buscado:
            return producto
    return None

producto_encontrado = buscar_producto(2)
print(f"\nProducto con ID 2: {producto_encontrado}")

# Agregar nuevo producto
nuevo_producto = {
    "id": 4,
    "nombre": "Monitor",
    "precio": 199.99,
    "stock": 15,
    "categorias": ["electrónica", "monitores"]
}
productos.append(nuevo_producto)
print(f"\nProductos después de agregar: {len(productos)} productos")

# Convertir toda la lista a JSON
productos_json = json.dumps(productos, indent=2, ensure_ascii=False)
print("\nLista completa en JSON:")
print(productos_json)

