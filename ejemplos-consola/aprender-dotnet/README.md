# 🔷 Aprender .NET Core / C#

Ejemplos educativos para aprender .NET Core y C# desde cero.

## 📚 Contenido

Este proyecto incluye ejemplos de:
- Variables y tipos de datos
- Arrays y Listas
- Diccionarios
- Bucles (for, while, foreach)
- Funciones y métodos
- Clases y objetos
- LINQ (Language Integrated Query)

## 🚀 Cómo Ejecutar

### Opción 1: Desde la Consola de la Aplicación

1. Abre la consola con `/consola`
2. Selecciona **.NET Core** como lenguaje
3. En "Ejecutar Proyecto Completo", ingresa la ruta:
   ```
   C:\projects\san\notion-local-editor\ejemplos-consola\aprender-dotnet
   ```
4. Presiona **Ejecutar Proyecto**

### Opción 2: Desde la Terminal

```bash
# Navega al directorio del proyecto
cd ejemplos-consola\aprender-dotnet

# Restaura las dependencias (solo la primera vez)
dotnet restore

# Ejecuta el proyecto
dotnet run
```

## 📋 Requisitos Previos

- .NET SDK 8.0 o superior
- Puedes descargarlo desde: https://dotnet.microsoft.com/download

## 💡 Conceptos Clave

### Variables y Tipos
- `int` - Enteros
- `string` - Cadenas de texto
- `double` - Números decimales
- `bool` - Booleanos (true/false)
- `char` - Caracteres individuales

### Colecciones
- **Array**: `int[] numeros = {1, 2, 3}`
- **List**: `var lista = new List<int>()`
- **Dictionary**: `var dict = new Dictionary<string, int>()`

### LINQ
LINQ permite consultar colecciones de forma declarativa:
```csharp
var pares = numeros.Where(n => n % 2 == 0).ToList();
```

## 🎓 Próximos Pasos

Después de estos ejemplos, puedes aprender:
- Programación orientada a objetos avanzada
- Async/Await para programación asíncrona
- Entity Framework para bases de datos
- ASP.NET Core para aplicaciones web
- WPF o MAUI para aplicaciones de escritorio

---

¡Disfruta aprendiendo .NET Core! 🚀


