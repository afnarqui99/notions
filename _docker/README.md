# Docker Setup para Bases de Datos

Este directorio contiene configuraciones Docker para PostgreSQL, MySQL y SQL Server que puedes usar con el comando `connectbd` en Notions.

> 📖 **Para instrucciones completas, consulta [README-GENERAL.md](./README-GENERAL.md)**

## Estructura

```
docker/
├── postgresql/
│   ├── docker-compose.yml
│   └── README.md
├── mysql/
│   ├── docker-compose.yml
│   └── README.md
├── sqlserver/
│   ├── docker-compose.yml
│   └── README.md
└── README.md (este archivo)
```

## Requisitos

- Docker instalado en tu sistema
- Docker Compose instalado (generalmente viene con Docker Desktop)

## Inicio Rápido

### PostgreSQL

```bash
cd docker/postgresql
docker-compose up -d
```

**Datos de conexión:**
- Tipo: PostgreSQL
- Host: localhost
- Puerto: 5432
- Base de Datos: notions_db
- Usuario: notions_user
- Contraseña: notions_password

### MySQL

```bash
cd docker/mysql
docker-compose up -d
```

**Datos de conexión:**
- Tipo: MySQL
- Host: localhost
- Puerto: 3306
- Base de Datos: notions_db
- Usuario: notions_user
- Contraseña: notions_password

### SQL Server

```bash
cd docker/sqlserver
docker-compose up -d
```

**Espera 30-60 segundos** para que SQL Server inicie completamente.

**Datos de conexión:**
- Tipo: SQL Server
- Host: localhost
- Puerto: 1433
- Base de Datos: master (o crea una nueva)
- Usuario: SA
- Contraseña: NotionsPassword123!

## Usar con connectbd

1. Inicia el contenedor Docker de la base de datos que necesites
2. Abre Notions y escribe `/connectbd`
3. Completa los datos de conexión según la base de datos que elegiste
4. Haz clic en "Conectar"
5. ¡Listo! Ya puedes ejecutar consultas SQL

## Comandos Útiles

### Ver contenedores corriendo
```bash
docker ps
```

### Detener un contenedor
```bash
cd docker/[postgresql|mysql|sqlserver]
docker-compose down
```

### Detener y eliminar datos
```bash
cd docker/[postgresql|mysql|sqlserver]
docker-compose down -v
```

### Ver logs
```bash
cd docker/[postgresql|mysql|sqlserver]
docker-compose logs -f
```

### Reiniciar un contenedor
```bash
cd docker/[postgresql|mysql|sqlserver]
docker-compose restart
```

## Ejecutar Múltiples Bases de Datos

Puedes ejecutar las tres bases de datos simultáneamente ya que usan puertos diferentes:
- PostgreSQL: 5432
- MySQL: 3306
- SQL Server: 1433

## Personalizar Configuración

Cada directorio tiene su propio `README.md` con instrucciones detalladas para personalizar la configuración (cambiar contraseñas, nombres de base de datos, etc.).

## Solución de Problemas

### Puerto ya en uso
Si un puerto ya está en uso, puedes cambiarlo en el archivo `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Cambia el primer número (puerto del host)
```

### Contenedor no inicia
Verifica los logs:
```bash
docker-compose logs
```

### Eliminar todo y empezar de nuevo
```bash
docker-compose down -v
docker-compose up -d
```

## Seguridad

⚠️ **IMPORTANTE:** Estas configuraciones están diseñadas para desarrollo local. No uses estas contraseñas en producción.

Para producción:
- Cambia todas las contraseñas por defecto
- Usa variables de entorno para las credenciales
- Configura SSL/TLS
- Restringe el acceso a la red

