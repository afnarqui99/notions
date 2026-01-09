# ============================================
# 4. BUCLES Y RECORRIDOS
# ============================================

print("=" * 50)
print("4. BUCLES Y RECORRIDOS")
print("=" * 50)

# Bucle for con range
print("Bucle for con range:")
for i in range(5):
    print(f"  Iteración {i}")

print("\nBucle for con range personalizado:")
for i in range(2, 8, 2):
    print(f"  Número: {i}")

# Bucle for con lista
print("\nBucle for con lista:")
frutas = ["manzana", "banana", "naranja"]
for fruta in frutas:
    print(f"  Fruta: {fruta}")

# Bucle for con enumerate (índice y valor)
print("\nBucle for con enumerate:")
for indice, fruta in enumerate(frutas):
    print(f"  [{indice}] {fruta}")

# Bucle for con diccionario
print("\nBucle for con diccionario:")
persona = {"nombre": "Juan", "edad": 30, "ciudad": "Madrid"}
for clave, valor in persona.items():
    print(f"  {clave}: {valor}")

# Bucle while
print("\nBucle while:")
contador = 0
while contador < 5:
    print(f"  Contador: {contador}")
    contador += 1

# Bucle con break (salir)
print("\nBucle con break:")
for i in range(10):
    if i == 5:
        break
    print(f"  Número: {i}")

# Bucle con continue (saltar)
print("\nBucle con continue:")
for i in range(10):
    if i % 2 == 0:
        continue
    print(f"  Número impar: {i}")

# Bucle anidado
print("\nBucle anidado (tabla de multiplicar):")
for i in range(1, 4):
    for j in range(1, 4):
        print(f"  {i} x {j} = {i*j}")

