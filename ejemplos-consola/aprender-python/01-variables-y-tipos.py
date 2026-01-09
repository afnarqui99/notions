# ============================================
# 1. VARIABLES Y TIPOS DE DATOS
# ============================================

print("=" * 50)
print("1. VARIABLES Y TIPOS DE DATOS")
print("=" * 50)

# Números enteros
edad = 25
cantidad = 100
print(f"Edad: {edad}, Tipo: {type(edad)}")

# Números decimales (float)
precio = 19.99
temperatura = 36.5
print(f"Precio: {precio}, Tipo: {type(precio)}")

# Cadenas de texto (strings)
nombre = "Juan"
apellido = 'Pérez'
mensaje = """Este es un mensaje
de múltiples líneas"""
print(f"Nombre: {nombre}, Tipo: {type(nombre)}")
print(f"Mensaje: {mensaje}")

# Booleanos
es_activo = True
tiene_permiso = False
print(f"Es activo: {es_activo}, Tipo: {type(es_activo)}")

# None (equivalente a null)
valor = None
print(f"Valor: {valor}, Tipo: {type(valor)}")

# Conversión de tipos
numero_texto = "123"
numero_entero = int(numero_texto)
numero_decimal = float(numero_texto)
texto_numero = str(123)
print(f"Conversión: '{numero_texto}' -> {numero_entero}")

