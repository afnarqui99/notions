using System;

namespace AprenderDotNet
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("=== Aprender .NET Core ===\n");

            // Ejemplo 1: Variables y Tipos
            Console.WriteLine("--- Ejemplo 1: Variables y Tipos ---");
            int numero = 42;
            string texto = "Hola desde C#";
            double decimalNum = 3.14;
            bool esVerdadero = true;
            char caracter = 'A';

            Console.WriteLine($"Entero: {numero}");
            Console.WriteLine($"String: {texto}");
            Console.WriteLine($"Decimal: {decimalNum}");
            Console.WriteLine($"Booleano: {esVerdadero}");
            Console.WriteLine($"Carácter: {caracter}\n");

            // Ejemplo 2: Arrays y Listas
            Console.WriteLine("--- Ejemplo 2: Arrays y Listas ---");
            int[] numeros = { 1, 2, 3, 4, 5 };
            var lista = new List<int> { 10, 20, 30, 40, 50 };

            Console.WriteLine("Array:");
            foreach (var num in numeros)
            {
                Console.Write($"{num} ");
            }
            Console.WriteLine("\nLista:");
            foreach (var num in lista)
            {
                Console.Write($"{num} ");
            }
            Console.WriteLine("\n");

            // Ejemplo 3: Diccionarios
            Console.WriteLine("--- Ejemplo 3: Diccionarios ---");
            var diccionario = new Dictionary<string, int>
            {
                { "Juan", 30 },
                { "Ana", 25 },
                { "Carlos", 35 }
            };

            foreach (var kvp in diccionario)
            {
                Console.WriteLine($"{kvp.Key}: {kvp.Value} años");
            }
            Console.WriteLine();

            // Ejemplo 4: Bucles
            Console.WriteLine("--- Ejemplo 4: Bucles ---");
            Console.WriteLine("For loop:");
            for (int i = 0; i < 5; i++)
            {
                Console.Write($"{i} ");
            }
            Console.WriteLine("\nWhile loop:");
            int j = 0;
            while (j < 5)
            {
                Console.Write($"{j} ");
                j++;
            }
            Console.WriteLine("\n");

            // Ejemplo 5: Funciones
            Console.WriteLine("--- Ejemplo 5: Funciones ---");
            int resultado = Sumar(10, 20);
            Console.WriteLine($"Suma de 10 + 20 = {resultado}");
            Console.WriteLine($"Multiplicación de 5 * 3 = {Multiplicar(5, 3)}\n");

            // Ejemplo 6: Clases y Objetos
            Console.WriteLine("--- Ejemplo 6: Clases y Objetos ---");
            var persona = new Persona("Juan", 30);
            persona.Saludar();
            Console.WriteLine($"Edad: {persona.Edad}\n");

            // Ejemplo 7: LINQ
            Console.WriteLine("--- Ejemplo 7: LINQ ---");
            var numerosPares = numeros.Where(n => n % 2 == 0).ToList();
            Console.WriteLine("Números pares:");
            foreach (var num in numerosPares)
            {
                Console.Write($"{num} ");
            }
            Console.WriteLine("\n");

            Console.WriteLine("¡Ejemplos completados!");
        }

        static int Sumar(int a, int b)
        {
            return a + b;
        }

        static int Multiplicar(int a, int b) => a * b;
    }

    class Persona
    {
        public string Nombre { get; set; }
        public int Edad { get; set; }

        public Persona(string nombre, int edad)
        {
            Nombre = nombre;
            Edad = edad;
        }

        public void Saludar()
        {
            Console.WriteLine($"Hola, soy {Nombre}");
        }
    }
}


