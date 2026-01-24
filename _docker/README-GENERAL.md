# 🐳 Configuraciones Docker para Bases de Datos

Este directorio contiene configuraciones Docker listas para usar con el comando `connectbd` en Notions.

## 📍 Ubicación de los Archivos

### En Desarrollo
Los archivos se encuentran en: `docker/` (raíz del proyecto)

### En el Ejecutable Instalado
Después de instalar la aplicación, los archivos Docker se encuentran en:

**Windows:**
```
C:\Users\[TuUsuario]\AppData\Local\Programs\Notas afnarqui\resources\docker\
```

O puedes encontrarlos navegando a:
- Abre el menú de inicio
- Busca "Notas afnarqui"
- Clic derecho → "Abrir ubicación del archivo"
- Navega a `resources\docker\`

**Ubicación alternativa (si instalaste en otra carpeta):**
```
[Directorio de Instalación]\resources\docker\
```

## 🚀 Inicio Rápido

### Opción 1: Usar los Scripts (Recomendado)

**Windows:**
1. Abre PowerShell o CMD como Administrador
2. Navega a la carpeta `docker`:
   ```powershell
   cd "C:\Users\[TuUsuario]\AppData\Local\Programs\Notas afnarqui\resources\docker"
   ```
3. Ejecuta el script:
   ```powershell
   .\start-all.bat
   ```
   Para detener todas las bases de datos:
   ```powershell
   .\stop-all.bat
   ```

**Linux/Mac:**
1. Abre una terminal
2. Navega a la carpeta `docker`
3. Ejecuta:
   ```bash
   chmod +x start-all.sh stop-all.sh
   ./start-all.sh
   ```
   Para detener:
   ```bash
   ./stop-all.sh
   ```

### Opción 2: Iniciar Base de Datos Individual

**PostgreSQL:**
```bash
cd docker/postgresql
docker-compose up -d
```

**MySQL:**
```bash
cd docker/mysql
docker-compose up -d
```

**SQL Server:**
```bash
cd docker/sqlserver
docker-compose up -d
```

## 📋 Datos de Conexión para connectbd

Una vez que hayas iniciado una base de datos, usa estos datos en el comando `/connectbd`:

### PostgreSQL
- **Tipo:** PostgreSQL
- **Host:** `localhost`
- **Puerto:** `5432`
- **Base de Datos:** `notions_db`
- **Usuario:** `notions_user`
- **Contraseña:** `notions_password`
- **SSL:** Desactivado

### MySQL
- **Tipo:** MySQL
- **Host:** `localhost`
- **Puerto:** `3306`
- **Base de Datos:** `notions_db`
- **Usuario:** `notions_user`
- **Contraseña:** `notions_password`
- **SSL:** Desactivado

### SQL Server
- **Tipo:** SQL Server
- **Host:** `localhost`
- **Puerto:** `1433`
- **Base de Datos:** `master` (o crea una nueva con `CREATE DATABASE notions_db;`)
- **Usuario:** `SA`
- **Contraseña:** `NotionsPassword123!`
- **SSL:** Desactivado

⚠️ **Nota:** SQL Server puede tardar 30-60 segundos en iniciarse completamente. Espera hasta ver el mensaje "SQL Server is now ready for client connections" en los logs.

## 📖 Guía Paso a Paso

### 1. Verificar que Docker está Instalado

Abre una terminal y ejecuta:
```bash
docker --version
docker-compose --version
```

Si no tienes Docker instalado:
- **Windows/Mac:** Descarga [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** Sigue las instrucciones para tu distribución

### 2. Iniciar una Base de Datos

Elige una base de datos y navega a su carpeta:
```bash
cd docker/postgresql  # o mysql, o sqlserver
docker-compose up -d
```

### 3. Verificar que Está Corriendo

```bash
docker ps
```

Deberías ver un contenedor corriendo con el nombre `postgresql-notions`, `mysql-notions` o `sqlserver-notions`.

### 4. Conectar desde Notions

1. Abre Notions
2. Escribe `/connectbd` en el editor
3. Completa los datos de conexión según la base de datos que elegiste (ver sección anterior)
4. Haz clic en "Conectar"
5. ¡Listo! Ya puedes ejecutar consultas SQL

### 5. Probar la Conexión

Ejecuta una consulta de prueba:

**PostgreSQL:**
```sql
SELECT version();
```

**MySQL:**
```sql
SELECT VERSION();
```

**SQL Server:**
```sql
SELECT @@VERSION;
```

## 🛠️ Comandos Útiles

### Ver contenedores corriendo
```bash
docker ps
```

### Ver logs de un contenedor
```bash
cd docker/postgresql  # o mysql, o sqlserver
docker-compose logs -f
```

### Detener un contenedor
```bash
cd docker/postgresql  # o mysql, o sqlserver
docker-compose down
```

### Detener y eliminar datos (⚠️ elimina toda la información)
```bash
cd docker/postgresql  # o mysql, o sqlserver
docker-compose down -v
```

### Reiniciar un contenedor
```bash
cd docker/postgresql  # o mysql, o sqlserver
docker-compose restart
```

## 📁 Estructura de Archivos

```
docker/
├── README-GENERAL.md          (este archivo)
├── README.md                  (guía general)
├── start-all.bat              (iniciar todas - Windows)
├── start-all.sh               (iniciar todas - Linux/Mac)
├── stop-all.bat               (detener todas - Windows)
├── stop-all.sh                (detener todas - Linux/Mac)
├── postgresql/
│   ├── docker-compose.yml
│   └── README.md
├── mysql/
│   ├── docker-compose.yml
│   └── README.md
└── sqlserver/
    ├── docker-compose.yml
    └── README.md
```

## ⚙️ Personalizar Configuración

Cada base de datos tiene su propio `README.md` con instrucciones detalladas para:
- Cambiar contraseñas
- Cambiar nombres de base de datos
- Cambiar puertos
- Configurar SSL

Consulta el `README.md` dentro de cada carpeta para más detalles.

## 🔒 Seguridad

⚠️ **IMPORTANTE:** Estas configuraciones están diseñadas para **desarrollo local únicamente**.

**NO uses estas contraseñas en producción.** Para entornos de producción:
- Cambia todas las contraseñas por defecto
- Usa variables de entorno para las credenciales
- Configura SSL/TLS
- Restringe el acceso a la red
- Implementa políticas de seguridad adecuadas

## ❓ Solución de Problemas

### Puerto ya en uso
Si un puerto ya está en uso, edita el archivo `docker-compose.yml` correspondiente:
```yaml
ports:
  - "5433:5432"  # Cambia el primer número (puerto del host)
```

### Contenedor no inicia
Verifica los logs:
```bash
docker-compose logs
```

### Error de permisos (Linux/Mac)
Asegúrate de que tu usuario esté en el grupo docker:
```bash
sudo usermod -aG docker $USER
```
Luego cierra sesión y vuelve a iniciar sesión.

### SQL Server no conecta
- Espera 30-60 segundos después de iniciar el contenedor
- Verifica los logs: `docker-compose logs -f sqlserver`
- Asegúrate de que la contraseña cumple con los requisitos de seguridad

### Eliminar todo y empezar de nuevo
```bash
cd docker/[postgresql|mysql|sqlserver]
docker-compose down -v
docker-compose up -d
```

## 📚 Más Información

- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [SQL Server Docker Hub](https://hub.docker.com/_/microsoft-mssql-server)

## 💡 Consejos

- Puedes ejecutar las tres bases de datos simultáneamente (usan puertos diferentes)
- Los datos se guardan en volúmenes Docker y persisten aunque detengas los contenedores
- Usa `docker-compose down -v` solo si quieres eliminar todos los datos
- Guarda tus conexiones en `connectbd` para acceso rápido

---

¿Necesitas ayuda? Consulta los README.md individuales de cada base de datos para más detalles específicos.

