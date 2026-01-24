# PostgreSQL Docker Setup

Este archivo configura un contenedor Docker con PostgreSQL para usar con el comando `connectbd`.

## Inicio Rápido

1. **Iniciar el contenedor:**
   ```bash
   docker-compose up -d
   ```

2. **Verificar que está corriendo:**
   ```bash
   docker ps
   ```

3. **Detener el contenedor:**
   ```bash
   docker-compose down
   ```

4. **Detener y eliminar los datos:**
   ```bash
   docker-compose down -v
   ```

## Configuración de Conexión en connectbd

Una vez que el contenedor esté corriendo, usa estos datos en el comando `connectbd`:

- **Tipo de Base de Datos:** PostgreSQL
- **Host:** localhost
- **Puerto:** 5432
- **Base de Datos:** notions_db
- **Usuario:** notions_user
- **Contraseña:** notions_password
- **SSL:** Desactivado

## Datos por Defecto

- **Base de Datos:** notions_db
- **Usuario:** notions_user
- **Contraseña:** notions_password
- **Puerto:** 5432

## Personalizar Configuración

Para cambiar la configuración, edita el archivo `docker-compose.yml` y modifica las variables de entorno:

```yaml
environment:
  POSTGRES_DB: tu_base_de_datos
  POSTGRES_USER: tu_usuario
  POSTGRES_PASSWORD: tu_contraseña
```

Luego reinicia el contenedor:
```bash
docker-compose down -v
docker-compose up -d
```

## Acceder a la Base de Datos desde la Terminal

```bash
docker exec -it postgresql-notions psql -U notions_user -d notions_db
```

## Ver Logs

```bash
docker-compose logs -f postgresql
```

