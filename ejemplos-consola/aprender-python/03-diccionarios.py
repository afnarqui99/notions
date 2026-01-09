# ============================================
# 3. DICCIONARIOS (JSON-like)
# ============================================

print("=" * 50)
print("3. DICCIONARIOS (JSON-like)")
print("=" * 50)

# Crear diccionarios
persona = {
    "nombre": "Juan",
    "edad": 30,
    "ciudad": "Madrid",
    "activo": True
}

print(f"Persona: {persona}")

# Acceder a valores
print(f"Nombre: {persona['nombre']}")
print(f"Edad: {persona.get('edad', 'No especificada')}")

# Modificar valores
persona["edad"] = 31
persona["email"] = "juan@example.com"
print(f"Después de modificar: {persona}")

# Eliminar elementos
del persona["activo"]
print(f"Después de eliminar: {persona}")

# Recorrer diccionario
print("\nRecorriendo diccionario:")
for clave, valor in persona.items():
    print(f"  {clave}: {valor}")

# Diccionarios anidados
empresa = {
    "nombre": "Tech Corp",
    "empleados": [
        {"nombre": "Ana", "edad": 28},
        {"nombre": "Luis", "edad": 35}
    ],
    "direccion": {
        "calle": "Calle Principal 123",
        "ciudad": "Barcelona"
    }
}

print(f"\nEmpresa: {empresa}")
print(f"Primer empleado: {empresa['empleados'][0]}")
print(f"Ciudad: {empresa['direccion']['ciudad']}")

