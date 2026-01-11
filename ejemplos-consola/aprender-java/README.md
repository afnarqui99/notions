# ☕ Aprender Java

Ejemplos educativos para aprender Java desde cero.

## 📚 Contenido

Este proyecto incluye ejemplos de:
- Variables y tipos de datos
- Arrays
- Listas (ArrayList)
- Mapas (HashMap)
- Bucles (for, while, for-each)
- Funciones y métodos
- Clases y objetos
- Streams (Java 8+)

## 🚀 Cómo Ejecutar

### Opción 1: Desde la Consola de la Aplicación

1. Abre la consola con `/consola`
2. Selecciona **Java** como lenguaje
3. En "Ejecutar Proyecto Completo", ingresa la ruta:
   ```
   C:\projects\san\notion-local-editor\ejemplos-consola\aprender-java
   ```
4. Presiona **Ejecutar Proyecto**

### Opción 2: Desde la Terminal

```bash
# Navega al directorio del proyecto
cd ejemplos-consola\aprender-java

# Compila el código
javac Main.java

# Ejecuta el programa
java Main
```

## 📋 Requisitos Previos

- Java JDK 8 o superior
- Puedes descargarlo desde: https://www.oracle.com/java/technologies/downloads/

## 💡 Conceptos Clave

### Variables y Tipos Primitivos
- `int` - Enteros
- `String` - Cadenas de texto (clase, no primitivo)
- `double` - Números decimales
- `boolean` - Booleanos (true/false)
- `char` - Caracteres individuales

### Colecciones
- **Array**: `int[] numeros = {1, 2, 3}`
- **ArrayList**: `ArrayList<Integer> lista = new ArrayList<>()`
- **HashMap**: `HashMap<String, Integer> mapa = new HashMap<>()`

### Programación Orientada a Objetos
- **Clases**: Plantillas para crear objetos
- **Objetos**: Instancias de clases
- **Encapsulación**: Uso de private, getters y setters
- **Constructores**: Métodos especiales para inicializar objetos

### Streams (Java 8+)
Los Streams permiten procesar colecciones de forma funcional:
```java
lista.stream()
    .filter(n -> n % 2 == 0)
    .collect(Collectors.toList());
```

## 🎓 Próximos Pasos

Después de estos ejemplos, puedes aprender:
- Herencia y polimorfismo
- Interfaces y clases abstractas
- Excepciones y manejo de errores
- Colecciones avanzadas (Set, TreeMap, etc.)
- Spring Framework para aplicaciones web
- Hibernate para bases de datos

---

¡Disfruta aprendiendo Java! 🚀


