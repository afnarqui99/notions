# main.py
import sys

print("¡Hola desde Python con dependencias!")
print(f"Versión de Python: {sys.version}")

# Si tienes requests instalado, puedes usarlo
try:
    import requests
    print("✅ Módulo 'requests' disponible")
    print("Puedes hacer peticiones HTTP con este módulo")
except ImportError:
    print("⚠️ Módulo 'requests' no instalado")
    print("Instala con: pip install -r requirements.txt")

# Ejemplo con listas y diccionarios
datos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
pares = [n for n in datos if n % 2 == 0]
cuadrados = [n * n for n in datos]
suma = sum(datos)

print("\n--- Ejemplos con listas ---")
print("Datos originales:", datos)
print("Números pares:", pares)
print("Cuadrados:", cuadrados)
print("Suma total:", suma)

# Diccionarios
persona = {
    "nombre": "Juan",
    "edad": 30,
    "ciudad": "Madrid"
}

print("\n--- Ejemplos con diccionarios ---")
print("Persona:", persona)
print("Nombre:", persona["nombre"])

# Funciones avanzadas
def procesar_datos(lista):
    return {
        "suma": sum(lista),
        "promedio": sum(lista) / len(lista) if lista else 0,
        "maximo": max(lista) if lista else None,
        "minimo": min(lista) if lista else None
    }

resultado = procesar_datos(datos)
print("\n--- Estadísticas de los datos ---")
for clave, valor in resultado.items():
    print(f"{clave.capitalize()}: {valor}")

