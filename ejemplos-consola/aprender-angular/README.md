# 🅰️ Aprender Angular - Ejemplos Educativos

Curso completo de Angular con ejemplos progresivos desde básico hasta avanzado.

## 📚 Ejemplos Incluidos

### Ejemplo 1: Componentes Básicos
- Estructura de un componente Angular
- Interpolación de strings
- Event binding
- Métodos del componente

### Ejemplo 2: Data Binding
- Property binding `[prop]`
- Two-way binding `[(ngModel)]`
- String interpolation
- Expresiones y getters

### Ejemplo 3: Directivas Estructurales
- `*ngIf` - Condicionales
- `*ngFor` - Iteraciones
- `*ngSwitch` - Switch case
- Índices y referencias

### Ejemplo 4: Servicios
- Creación de servicios
- Inyección de dependencias
- Lifecycle hooks (ngOnInit)
- Compartir datos entre componentes

### Ejemplo 5: Formularios
- Template-driven forms
- Validación de formularios
- Estado del formulario
- JSON pipe

## 🚀 Cómo Ejecutar

### Opción 1: Desde la Consola de la Aplicación

1. Abre la consola con `/consola`
2. Selecciona **Node.js** como lenguaje
3. En "Ejecutar Proyecto Completo", ingresa la ruta:
   ```
   C:\projects\san\notion-local-editor\ejemplos-consola\aprender-angular
   ```
4. Presiona **Ejecutar Proyecto**

### Opción 2: Desde la Terminal

```bash
# Navega al directorio del proyecto
cd ejemplos-consola\aprender-angular

# Instala las dependencias (solo la primera vez)
npm install

# Inicia el servidor de desarrollo
npm start
```

El proyecto se abrirá automáticamente en `http://localhost:4200`

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm (viene con Node.js)
- Angular CLI (se instala automáticamente con npm install)

## 🎯 Estructura del Proyecto

```
aprender-angular/
├── src/
│   ├── app/
│   │   ├── app.component.ts       # Componente principal
│   │   ├── app.component.html     # Template principal
│   │   ├── app.module.ts          # Módulo principal
│   │   ├── ejemplos/              # Carpeta con ejemplos
│   │   │   ├── ejemplo1/         # Componente básico
│   │   │   ├── ejemplo2/         # Data binding
│   │   │   ├── ejemplo3/         # Directivas
│   │   │   ├── ejemplo4/         # Servicios
│   │   │   └── ejemplo5/         # Formularios
│   │   └── services/             # Servicios
│   │       └── data.service.ts   # Servicio de ejemplo
│   ├── index.html                 # HTML principal
│   ├── main.ts                    # Punto de entrada
│   └── styles.css                 # Estilos globales
├── angular.json                   # Configuración de Angular
├── package.json                   # Dependencias
└── tsconfig.json                  # Configuración TypeScript
```

## 💡 Conceptos Clave de Angular

### Componentes
Un componente es la unidad básica de una aplicación Angular. Consta de:
- **TypeScript (.ts)**: Lógica del componente
- **HTML (.html)**: Template/plantilla
- **CSS (.css)**: Estilos del componente

### Módulos
Los módulos agrupan componentes, servicios y otros elementos relacionados.

### Data Binding
Angular ofrece 4 tipos de data binding:
1. **Interpolación**: `{{ valor }}`
2. **Property Binding**: `[propiedad]="valor"`
3. **Event Binding**: `(evento)="metodo()"`
4. **Two-way Binding**: `[(ngModel)]="valor"`

### Directivas
- **Estructurales**: Modifican la estructura del DOM (`*ngIf`, `*ngFor`, `*ngSwitch`)
- **De atributo**: Modifican el comportamiento de elementos (`[ngClass]`, `[ngStyle]`)

### Servicios
Los servicios contienen lógica reutilizable y datos compartidos. Se inyectan mediante Dependency Injection.

## 🎓 Orden de Aprendizaje Recomendado

1. **Ejemplo 1**: Entiende qué es un componente
2. **Ejemplo 2**: Aprende cómo pasar datos entre componente y template
3. **Ejemplo 3**: Domina las directivas estructurales
4. **Ejemplo 4**: Aprende a compartir datos con servicios
5. **Ejemplo 5**: Crea formularios interactivos

## 🔧 Comandos Útiles

```bash
# Generar un nuevo componente
ng generate component nombre-componente

# Generar un servicio
ng generate service nombre-servicio

# Construir para producción
ng build --prod

# Ejecutar tests
ng test
```

## 📖 Recursos Adicionales

- [Documentación oficial de Angular](https://angular.io/docs)
- [Angular CLI](https://cli.angular.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🐛 Solución de Problemas

### Error: "ng no se reconoce como comando"
```bash
npm install -g @angular/cli
```

### Error: "Cannot find module"
```bash
npm install
```

### Puerto 4200 ya está en uso
```bash
ng serve --port 4201
```

---

¡Disfruta aprendiendo Angular! 🚀


