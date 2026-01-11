import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("=== Aprender Java ===\n");

        // Ejemplo 1: Variables y Tipos
        System.out.println("--- Ejemplo 1: Variables y Tipos ---");
        int numero = 42;
        String texto = "Hola desde Java";
        double decimalNum = 3.14;
        boolean esVerdadero = true;
        char caracter = 'A';

        System.out.println("Entero: " + numero);
        System.out.println("String: " + texto);
        System.out.println("Decimal: " + decimalNum);
        System.out.println("Booleano: " + esVerdadero);
        System.out.println("Carácter: " + caracter);
        System.out.println();

        // Ejemplo 2: Arrays
        System.out.println("--- Ejemplo 2: Arrays ---");
        int[] numeros = {1, 2, 3, 4, 5};
        System.out.print("Array: ");
        for (int num : numeros) {
            System.out.print(num + " ");
        }
        System.out.println("\n");

        // Ejemplo 3: Listas (ArrayList)
        System.out.println("--- Ejemplo 3: Listas (ArrayList) ---");
        ArrayList<Integer> lista = new ArrayList<>();
        lista.add(10);
        lista.add(20);
        lista.add(30);
        lista.add(40);
        lista.add(50);

        System.out.print("Lista: ");
        for (int num : lista) {
            System.out.print(num + " ");
        }
        System.out.println("\n");

        // Ejemplo 4: Mapas (HashMap)
        System.out.println("--- Ejemplo 4: Mapas (HashMap) ---");
        HashMap<String, Integer> mapa = new HashMap<>();
        mapa.put("Juan", 30);
        mapa.put("Ana", 25);
        mapa.put("Carlos", 35);

        for (Map.Entry<String, Integer> entrada : mapa.entrySet()) {
            System.out.println(entrada.getKey() + ": " + entrada.getValue() + " años");
        }
        System.out.println();

        // Ejemplo 5: Bucles
        System.out.println("--- Ejemplo 5: Bucles ---");
        System.out.print("For loop: ");
        for (int i = 0; i < 5; i++) {
            System.out.print(i + " ");
        }
        System.out.print("\nWhile loop: ");
        int j = 0;
        while (j < 5) {
            System.out.print(j + " ");
            j++;
        }
        System.out.println("\n");

        // Ejemplo 6: Funciones
        System.out.println("--- Ejemplo 6: Funciones ---");
        int resultado = sumar(10, 20);
        System.out.println("Suma de 10 + 20 = " + resultado);
        System.out.println("Multiplicación de 5 * 3 = " + multiplicar(5, 3));
        System.out.println();

        // Ejemplo 7: Clases y Objetos
        System.out.println("--- Ejemplo 7: Clases y Objetos ---");
        Persona persona = new Persona("Juan", 30);
        persona.saludar();
        System.out.println("Edad: " + persona.getEdad());
        System.out.println();

        // Ejemplo 8: Streams (Java 8+)
        System.out.println("--- Ejemplo 8: Streams ---");
        List<Integer> numerosPares = lista.stream()
            .filter(n -> n % 2 == 0)
            .collect(java.util.stream.Collectors.toList());
        System.out.print("Números pares: ");
        numerosPares.forEach(n -> System.out.print(n + " "));
        System.out.println("\n");

        System.out.println("¡Ejemplos completados!");
    }

    // Método estático
    static int sumar(int a, int b) {
        return a + b;
    }

    static int multiplicar(int a, int b) {
        return a * b;
    }
}

// Clase Persona
class Persona {
    private String nombre;
    private int edad;

    public Persona(String nombre, int edad) {
        this.nombre = nombre;
        this.edad = edad;
    }

    public void saludar() {
        System.out.println("Hola, soy " + nombre);
    }

    public String getNombre() {
        return nombre;
    }

    public int getEdad() {
        return edad;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public void setEdad(int edad) {
        this.edad = edad;
    }
}


