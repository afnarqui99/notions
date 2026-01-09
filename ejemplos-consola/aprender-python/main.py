# ============================================
# CURSO COMPLETO DE PYTHON
# Ejecuta cada archivo individualmente o este main para ver todos
# ============================================

import os
import sys

print("=" * 60)
print("CURSO COMPLETO DE PYTHON - EJEMPLOS PRÁCTICOS")
print("=" * 60)
print("\nEste directorio contiene ejemplos educativos de Python:")
print("\n1. 01-variables-y-tipos.py - Variables y tipos de datos")
print("2. 02-listas-y-arrays.py - Listas y arrays")
print("3. 03-diccionarios.py - Diccionarios (JSON-like)")
print("4. 04-bucles-y-recorridos.py - Bucles y recorridos")
print("5. 05-manipulacion-json.py - Manipulación de JSON")
print("6. 06-funciones.py - Funciones")
print("\nPara ejecutar un ejemplo específico, usa ese archivo.")
print("Para ver todos, ejecuta este main.py")
print("\n" + "=" * 60)

# Ejecutar todos los ejemplos
archivos = [
    "01-variables-y-tipos.py",
    "02-listas-y-arrays.py",
    "03-diccionarios.py",
    "04-bucles-y-recorridos.py",
    "05-manipulacion-json.py",
    "06-funciones.py"
]

for archivo in archivos:
    ruta = os.path.join(os.path.dirname(__file__), archivo)
    if os.path.exists(ruta):
        print(f"\n{'='*60}")
        print(f"Ejecutando: {archivo}")
        print('='*60)
        with open(ruta, 'r', encoding='utf-8') as f:
            codigo = f.read()
            exec(codigo)
        print("\n")

