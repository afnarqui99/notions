# ============================================
# 2. LISTAS Y ARRAYS
# ============================================

print("=" * 50)
print("2. LISTAS Y ARRAYS")
print("=" * 50)

# Crear listas
numeros = [1, 2, 3, 4, 5]
nombres = ["Ana", "Juan", "María"]
mezclado = [1, "dos", 3.0, True]

print(f"Lista de números: {numeros}")
print(f"Lista de nombres: {nombres}")
print(f"Lista mezclada: {mezclado}")

# Acceder a elementos
print(f"Primer elemento: {numeros[0]}")
print(f"Último elemento: {numeros[-1]}")
print(f"Elementos del 1 al 3: {numeros[1:4]}")

# Modificar elementos
numeros[0] = 10
print(f"Después de modificar: {numeros}")

# Agregar elementos
numeros.append(6)
numeros.insert(0, 0)
print(f"Después de agregar: {numeros}")

# Eliminar elementos
numeros.remove(10)
del numeros[0]
print(f"Después de eliminar: {numeros}")

# Operaciones con listas
print(f"Longitud: {len(numeros)}")
print(f"Suma: {sum(numeros)}")
print(f"Máximo: {max(numeros)}")
print(f"Mínimo: {min(numeros)}")

# Listas anidadas
matriz = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
print(f"Matriz: {matriz}")
print(f"Elemento [1][2]: {matriz[1][2]}")

# Lista por comprensión (list comprehension)
cuadrados = [x**2 for x in range(1, 6)]
pares = [x for x in range(1, 11) if x % 2 == 0]
print(f"Cuadrados: {cuadrados}")
print(f"Pares: {pares}")

