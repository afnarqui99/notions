# ============================================
# 6. FUNCIONES
# ============================================

print("=" * 50)
print("6. FUNCIONES")
print("=" * 50)

# Función simple
def saludar():
    print("¡Hola!")

saludar()

# Función con parámetros
def saludar_nombre(nombre):
    print(f"¡Hola {nombre}!")

saludar_nombre("Juan")
saludar_nombre("María")

# Función con múltiples parámetros
def sumar(a, b):
    return a + b

resultado = sumar(5, 3)
print(f"Suma: {resultado}")

# Función con parámetros por defecto
def presentar(nombre, edad=18, ciudad="Desconocida"):
    print(f"{nombre}, {edad} años, de {ciudad}")

presentar("Ana")
presentar("Luis", 25)
presentar("María", 30, "Barcelona")

# Función con argumentos variables
def sumar_varios(*numeros):
    return sum(numeros)

print(f"Suma de varios: {sumar_varios(1, 2, 3, 4, 5)}")

# Función con argumentos con nombre
def crear_persona(**datos):
    return datos

persona = crear_persona(nombre="Juan", edad=30, ciudad="Madrid")
print(f"Persona creada: {persona}")

# Función lambda (anónima)
multiplicar = lambda x, y: x * y
print(f"Multiplicación: {multiplicar(4, 5)}")

# Usar lambda con map
numeros = [1, 2, 3, 4, 5]
cuadrados = list(map(lambda x: x**2, numeros))
print(f"Cuadrados: {cuadrados}")

# Usar lambda con filter
pares = list(filter(lambda x: x % 2 == 0, numeros))
print(f"Pares: {pares}")

# Función que retorna múltiples valores
def dividir_y_resto(a, b):
    cociente = a // b
    resto = a % b
    return cociente, resto

cociente, resto = dividir_y_resto(17, 5)
print(f"17 ÷ 5 = {cociente} con resto {resto}")

# Función recursiva
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"Factorial de 5: {factorial(5)}")


