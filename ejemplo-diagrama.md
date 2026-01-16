# Ejemplos de Diagramas Mermaid

Este archivo contiene varios ejemplos de diagramas que puedes usar para probar la funcionalidad de subir archivos.

## Diagrama de Flujo

```mermaid
graph TD
    A[Inicio] --> B{¿Usuario autenticado?}
    B -->|Sí| C[Mostrar Dashboard]
    B -->|No| D[Mostrar Login]
    D --> E[Validar Credenciales]
    E -->|Válidas| C
    E -->|Inválidas| F[Mostrar Error]
    F --> D
    C --> G[Fin]
```

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as Cliente
    participant S as Servidor
    participant DB as Base de Datos
    U->>C: Hacer clic en "Guardar"
    C->>S: POST /api/guardar
    S->>DB: INSERT datos
    DB-->>S: Confirmación
    S-->>C: Respuesta 200 OK
    C-->>U: Mostrar "Guardado exitosamente"
```

## Diagrama de Clases

```mermaid
classDiagram
    class Usuario {
        +String nombre
        +String email
        +void login()
        +void logout()
    }
    
    class Administrador {
        +void crearUsuario()
        +void eliminarUsuario()
    }
    
    class Producto {
        +String nombre
        +Float precio
        +void actualizarPrecio()
    }
    
    Usuario <|-- Administrador
    Usuario "1" --> "*" Producto : compra
```

## Diagrama de Estado

```mermaid
stateDiagram-v2
    [*] --> Inactivo
    Inactivo --> Cargando: Iniciar
    Cargando --> Activo: Carga exitosa
    Cargando --> Error: Error de carga
    Activo --> Guardando: Guardar cambios
    Guardando --> Activo: Guardado exitoso
    Guardando --> Error: Error al guardar
    Error --> Inactivo: Reiniciar
    Activo --> [*]: Cerrar
```

## Diagrama Gantt

```mermaid
gantt
    title Plan de Proyecto
    dateFormat YYYY-MM-DD
    section Fase 1
    Análisis de Requisitos    :2024-01-01, 10d
    Diseño de Arquitectura    :2024-01-11, 15d
    section Fase 2
    Desarrollo Backend        :2024-01-26, 20d
    Desarrollo Frontend       :2024-02-15, 20d
    section Fase 3
    Pruebas                   :2024-03-06, 10d
    Despliegue                :2024-03-16, 5d
```

## Diagrama Entidad-Relación

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : realiza
    PEDIDO ||--|{ ITEM_PEDIDO : contiene
    PRODUCTO ||--o{ ITEM_PEDIDO : incluye
    CATEGORIA ||--o{ PRODUCTO : clasifica
    
    USUARIO {
        int id PK
        string nombre
        string email
        string telefono
    }
    
    PEDIDO {
        int id PK
        date fecha
        decimal total
        int usuario_id FK
    }
    
    PRODUCTO {
        int id PK
        string nombre
        decimal precio
        int categoria_id FK
    }
    
    CATEGORIA {
        int id PK
        string nombre
        string descripcion
    }
    
    ITEM_PEDIDO {
        int id PK
        int cantidad
        decimal subtotal
        int pedido_id FK
        int producto_id FK
    }
```

