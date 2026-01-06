# 📚 Guía de Organización Diaria - Versión Completa

Estructura recomendada para organizar tu trabajo diario: sprints, proyectos, credenciales, comandos, dailys, y toda la información técnica que necesitas.

---

## 🎯 Estructura Recomendada

### Estructura Principal con Páginas Anidadas

```
📊 Dashboard Personal
│
├── 🎯 Sprints
│   ├── 📋 Sprint 2025-01
│   ├── 📋 Sprint 2025-02
│   ├── 📋 Sprint 2025-03 (Activo)
│   └── 📦 Sprints Archivados
│
├── 🏗️ Proyectos
│   ├── Proyecto A
│   ├── Proyecto B
│   └── Proyectos Archivados
│
├── 📝 Notas y Documentación
│   ├── 📅 Dailys y Reuniones
│   ├── 💬 Explicaciones de Compañeros
│   ├── 📚 Documentación de Proyectos
│   └── 💡 Ideas y Notas Rápidas
│
├── 🔐 Credenciales y Accesos
│   ├── 🔑 Credenciales
│   ├── 🌐 Accesos Web (Jira, Wiki, etc.)
│   └── ☁️ AWS y Azure DevOps
│
├── 💻 Comandos y Referencias
│   ├── 🐙 Git
│   ├── 🐍 Python
│   ├── ⚛️ React/NPM
│   └── 🖥️ Comandos de Aplicaciones
│
├── 📁 Archivos y Recursos
│   ├── 🖼️ Imágenes y Capturas
│   ├── 📄 Documentos y PDFs
│   └── 📦 Entregas de Compañeros
│
└── 📅 Tareas del Día
```

---

## 📋 1. Dashboard Personal

**Página raíz principal**

1. Crea la página: Botón **"+"** → Título: `📊 Dashboard Personal`
2. Usa esta página como punto de entrada o deja que la estructura del sidebar sea tu navegación principal

---

## 🎯 2. Sprints

### Estructura

```
🎯 Sprints (página padre)
├── 📋 Sprint 2025-01 (página hija)
├── 📋 Sprint 2025-02 (página hija)
├── 📋 Sprint 2025-03 (página hija - Activo)
└── 📦 Sprints Archivados (página hija)
    ├── 📋 Sprint 2024-23 (página nieta)
    └── 📋 Sprint 2024-24 (página nieta)
```

### Cómo crear

1. **Crear página padre "Sprints":**
   - Pasa el mouse sobre "Dashboard Personal" en el sidebar
   - Haz clic en el botón **"+"** que aparece
   - Título: `🎯 Sprints`

2. **Crear cada sprint:**
   - Pasa el mouse sobre "Sprints" en el sidebar
   - Haz clic en el botón **"+"**
   - Título: `📋 Sprint 2025-01` (usa formato: `Sprint YYYY-NN`)

3. **Dentro de cada sprint:**
   - Escribe `/` → Busca "tabla" → Selecciona "📋 Tabla estilo Notion"
   - Haz clic en "🎯 Plantilla Scrum" en el menú de la tabla
   - Configura las fechas del sprint en la parte superior de la tabla
   - Agrega tus tareas

### Ejemplo de contenido en un Sprint

```
📋 Sprint 2025-03 (15 Ene - 29 Ene)

[Tabla Scrum con tareas]

## 📝 Notas del Sprint

### Objetivos
- Implementar sistema de comentarios
- Mejorar rendimiento de tablas
- Documentar API

### Bloqueadores
- Esperando aprobación de diseño para feature X

### Logros
- ✅ Sistema de comentarios funcionando
- ✅ Optimización de queries completada
```

---

## 🏗️ 3. Proyectos

### Estructura

```
🏗️ Proyectos (página padre)
├── Proyecto E-Commerce (página hija)
├── Proyecto API Gateway (página hija)
└── Proyectos Archivados (página hija)
```

### Ejemplo Real: Proyecto E-Commerce

**Dentro de la página del proyecto:**

```
# 🛒 Proyecto E-Commerce

## 📍 Información General

**Ruta Local:** `C:\projects\ecommerce-app`

**Repositorio Azure DevOps:**
- Organización: `mi-empresa`
- Proyecto: `E-Commerce`
- Repo: `ecommerce-frontend`
- URL: https://dev.azure.com/mi-empresa/E-Commerce/_git/ecommerce-frontend

**Proyecto AWS:**
- Nombre: `ecommerce-prod`
- Región: `us-east-1`
- Stack: `ecommerce-stack-prod`

## 🚀 Comandos de Aplicación

Escribe `/` → "Bloque de código" para cada comando:

```bash
# Desarrollo
npm run dev          # Iniciar servidor desarrollo (puerto 3000)
npm run build        # Construir para producción
npm run test         # Ejecutar tests
npm run lint         # Verificar código

# Producción
npm start            # Iniciar servidor producción
```

## 🗂️ Estructura del Proyecto

Escribe `/` → "Lista con viñetas":

- `src/` - Código fuente
  - `components/` - Componentes React
  - `services/` - Servicios y APIs
  - `utils/` - Utilidades
- `public/` - Archivos estáticos
- `tests/` - Tests unitarios

## 🔗 Enlaces Importantes

Escribe `/` → "Enlace a página" o simplemente pega URLs:

- [Dashboard AWS](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1)
- [Pipeline CI/CD](https://dev.azure.com/mi-empresa/E-Commerce/_build)
- [Documentación API](https://api-docs.ecommerce.com)

## 📸 Capturas y Diagramas

Escribe `/` → "Galería de Imágenes":

[Galería con capturas de pantalla del proyecto, diagramas de arquitectura, etc.]

## 📄 Documentación

Escribe `/` → "Galería de Archivos":

[Galería con PDFs de diseño, documentos de arquitectura, etc.]
```

---

## 📝 4. Notas y Documentación

### Estructura

```
📝 Notas y Documentación (página padre)
├── 📅 Dailys y Reuniones (página hija)
├── 💬 Explicaciones de Compañeros (página hija)
├── 📚 Documentación de Proyectos (página hija)
└── 💡 Ideas y Notas Rápidas (página hija)
```

### 📅 Dailys y Reuniones

**Ejemplo real de contenido:**

```
# 📅 Dailys y Reuniones

## 2025-01-20 - Daily Standup

### Lo que hice ayer
- ✅ Completé la implementación del sistema de comentarios
- ✅ Revisé PR #123 del equipo
- ✅ Actualicé documentación de API

### Lo que haré hoy
- 🔄 Implementar tests para comentarios
- 🔄 Revisar diseño de nueva feature
- 📋 Preparar demo para sprint review

### Bloqueadores
- ⚠️ Esperando respuesta de diseño para feature X

---

## 2025-01-19 - Reunión de Arquitectura

### Puntos Clave
- Decidimos migrar a microservicios
- Nueva estructura de base de datos aprobada
- Timeline: 3 meses

### Acciones
- [ ] Crear documento de arquitectura
- [ ] Evaluar tecnologías para microservicios
- [ ] Planificar migración de datos

### Participantes
- Juan (Tech Lead)
- María (Backend)
- Pedro (DevOps)
```

**Cómo organizar:**
- Usa encabezados (H2) para cada fecha: `## 2025-01-20 - Daily Standup`
- Usa bloques desplegables (`/` → "Bloque desplegable") para organizar por semana o mes
- Usa listas con viñetas para puntos clave

### 💬 Explicaciones de Compañeros

**Ejemplo real:**

```
# 💬 Explicaciones de Compañeros

## 🔧 Sistema de Autenticación - Juan (15 Ene 2025)

<Bloque desplegable: "Cómo funciona el JWT">

**Explicación de Juan sobre JWT:**

1. El token se genera en el login
2. Se almacena en localStorage
3. Se envía en header `Authorization: Bearer <token>`
4. El backend valida con la clave secreta

**Código de ejemplo:**
```javascript
const token = localStorage.getItem('token');
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Notas importantes:**
- El token expira en 24 horas
- Si expira, redirigir a login
- No almacenar datos sensibles en el token

</Bloque desplegable>

---

## 🗄️ Estructura de Base de Datos - María (10 Ene 2025)

<Bloque desplegable: "Esquema de tablas">

**Explicación de María:**

Tablas principales:
- `users` - Usuarios del sistema
- `products` - Productos del catálogo
- `orders` - Pedidos

Relaciones:
- `users` 1:N `orders`
- `products` N:M `orders` (tabla intermedia `order_items`)

**Diagrama:**
[Insertar imagen del diagrama usando `/` → "Insertar imagen"]

</Bloque desplegable>
```

**Cómo organizar:**
- Un bloque desplegable por explicación
- Título del bloque: `Tema - Nombre (Fecha)`
- Dentro: explicación, código, diagramas, notas

### 📚 Documentación de Proyectos

**Ejemplo:**

```
# 📚 Documentación de Proyectos

## 🛒 E-Commerce - Documentación

<Bloque desplegable: "API Endpoints">

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto (admin)

</Bloque desplegable>

<Bloque desplegable: "Configuración de Entornos">

### Desarrollo
- Base de datos: `localhost:5432/ecommerce_dev`
- API: `http://localhost:3001`
- Frontend: `http://localhost:3000`

### Producción
- Base de datos: `prod-db.ecommerce.com:5432`
- API: `https://api.ecommerce.com`
- Frontend: `https://ecommerce.com`

</Bloque desplegable>
```

---

## 🔐 5. Credenciales y Accesos

### Estructura

```
🔐 Credenciales y Accesos (página padre)
├── 🔑 Credenciales (página hija)
├── 🌐 Accesos Web (página hija)
└── ☁️ AWS y Azure DevOps (página hija)
```

### 🔑 Credenciales

**Ejemplo real (usa bloques desplegables para información sensible):**

```
# 🔑 Credenciales

## 🗄️ Bases de Datos

### PostgreSQL Local
- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`

<Bloque desplegable: "🔒 Contraseña PostgreSQL">
mi-contraseña-segura-123
</Bloque desplegable>

### MongoDB Producción
- Host: `mongodb-prod.company.com`
- Puerto: `27017`
- Base de datos: `ecommerce_prod`

<Bloque desplegable: "🔒 Credenciales MongoDB">
Usuario: admin
Contraseña: P@ssw0rd!2025
</Bloque desplegable>

---

## 🔌 APIs Externas

### Stripe
- API Key: `sk_live_...` (en bloque desplegable)
- Webhook Secret: `whsec_...` (en bloque desplegable)

### SendGrid
- API Key: `SG.xxx...` (en bloque desplegable)

---

## 🔐 Servicios Internos

### Jira API Token
<Bloque desplegable: "Token Jira">
ATATT3xFfGF0...
</Bloque desplegable>

### Azure DevOps Personal Access Token
<Bloque desplegable: "PAT Azure DevOps">
ghp_xxxxxxxxxxxx
</Bloque desplegable>
```

**Recomendación:** Usa bloques desplegables para TODA la información sensible.

### 🌐 Accesos Web

**Ejemplo real:**

```
# 🌐 Accesos Web

## 📋 Gestión de Proyectos

### Jira
- URL Principal: https://mi-empresa.atlassian.net
- Proyecto E-Commerce: https://mi-empresa.atlassian.net/projects/ECO
- Mi Dashboard: https://mi-empresa.atlassian.net/secure/Dashboard.jspa
- Board Sprint: https://mi-empresa.atlassian.net/secure/RapidBoard.jspa?projectKey=ECO

### Azure DevOps
- Organización: https://dev.azure.com/mi-empresa
- Proyecto E-Commerce: https://dev.azure.com/mi-empresa/E-Commerce
- Repositorios: https://dev.azure.com/mi-empresa/E-Commerce/_git
- Pipelines: https://dev.azure.com/mi-empresa/E-Commerce/_build

---

## 📚 Documentación

### Wiki Empresarial
- URL: https://wiki.empresa.com
- Sección Desarrollo: https://wiki.empresa.com/desarrollo
- Guías de Onboarding: https://wiki.empresa.com/onboarding

### Confluence
- URL: https://mi-empresa.atlassian.net/wiki
- Espacio E-Commerce: https://mi-empresa.atlassian.net/wiki/spaces/ECO

---

## 🎫 Tickets y Soporte

### Sistema de Tickets Interno
- URL: https://tickets.empresa.com
- Crear Ticket: https://tickets.empresa.com/new
- Mis Tickets: https://tickets.empresa.com/my-tickets

### Portal de Soporte
- URL: https://support.empresa.com
- Chat en Vivo: https://support.empresa.com/chat

---

## 📖 Manuales y Guías

### Manual de Usuario
- URL: https://docs.empresa.com/user-manual
- PDF: [Descargar PDF] (usar Galería de Archivos)

### Guía de Desarrollo
- URL: https://docs.empresa.com/dev-guide
- API Reference: https://docs.empresa.com/api

---

## 📧 Comunicación

### Correo Empresarial
- Outlook Web: https://outlook.office.com
- Outlook Desktop: `outlook://` (protocolo)

### Slack
- Workspace: https://mi-empresa.slack.com
- Canal #desarrollo: https://mi-empresa.slack.com/archives/C01234ABCD

### Teams
- URL: https://teams.microsoft.com
- Equipo Desarrollo: [Enlace directo]
```

**Cómo organizar:**
- Usa encabezados (H2) para categorías
- Lista con viñetas para cada URL
- Puedes usar enlaces directos o texto descriptivo

### ☁️ AWS y Azure DevOps

**Ejemplo real:**

```
# ☁️ AWS y Azure DevOps

## ☁️ AWS

### Proyectos/Stacks

#### E-Commerce Producción
- Stack Name: `ecommerce-prod-stack`
- Región: `us-east-1`
- Account ID: `123456789012`
- Console: https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks

#### E-Commerce Desarrollo
- Stack Name: `ecommerce-dev-stack`
- Región: `us-east-1`
- Console: https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks

### Recursos Importantes

#### S3 Buckets
- `ecommerce-prod-assets`: s3://ecommerce-prod-assets
- `ecommerce-dev-assets`: s3://ecommerce-dev-assets

#### RDS Instances
- `ecommerce-prod-db`: `ecommerce-prod-db.xxxxx.us-east-1.rds.amazonaws.com`
- `ecommerce-dev-db`: `ecommerce-dev-db.xxxxx.us-east-1.rds.amazonaws.com`

#### Lambda Functions
- `process-payments`: arn:aws:lambda:us-east-1:123456789012:function:process-payments
- `send-notifications`: arn:aws:lambda:us-east-1:123456789012:function:send-notifications

<Bloque desplegable: "🔒 AWS Access Keys">
Access Key ID: AKIA...
Secret Access Key: xxx... (guardar en lugar seguro)
</Bloque desplegable>

---

## 🔷 Azure DevOps

### Organizaciones y Proyectos

#### Organización Principal
- Nombre: `mi-empresa`
- URL: https://dev.azure.com/mi-empresa

#### Proyectos

##### E-Commerce
- Nombre: `E-Commerce`
- URL: https://dev.azure.com/mi-empresa/E-Commerce
- Repositorios:
  - `ecommerce-frontend`: https://dev.azure.com/mi-empresa/E-Commerce/_git/ecommerce-frontend
  - `ecommerce-backend`: https://dev.azure.com/mi-empresa/E-Commerce/_git/ecommerce-backend
  - `ecommerce-api`: https://dev.azure.com/mi-empresa/E-Commerce/_git/ecommerce-api

##### API Gateway
- Nombre: `API-Gateway`
- URL: https://dev.azure.com/mi-empresa/API-Gateway
- Repositorio: https://dev.azure.com/mi-empresa/API-Gateway/_git/api-gateway

### Pipelines

#### E-Commerce CI/CD
- Pipeline: `ecommerce-build-deploy`
- URL: https://dev.azure.com/mi-empresa/E-Commerce/_build?definitionId=1
- Branch principal: `main`

### Work Items y Sprints

#### Sprint Actual
- Board: https://dev.azure.com/mi-empresa/E-Commerce/_boards/board/t/Sprint%20Board
- Queries guardadas: https://dev.azure.com/mi-empresa/E-Commerce/_queries

### Artifacts

#### Paquetes NPM
- Feed: `ecommerce-npm-feed`
- URL: https://dev.azure.com/mi-empresa/E-Commerce/_packaging

<Bloque desplegable: "🔒 Azure DevOps PAT">
Personal Access Token: ghp_xxxxxxxxxxxx
Expira: 2025-12-31
</Bloque desplegable>
```

---

## 💻 6. Comandos y Referencias

### Estructura

```
💻 Comandos y Referencias (página padre)
├── 🐙 Git (página hija)
├── 🐍 Python (página hija)
├── ⚛️ React/NPM (página hija)
└── 🖥️ Comandos de Aplicaciones (página hija)
```

### 🐙 Git

**Ejemplo real con bloques de código:**

```
# 🐙 Git - Comandos y Referencias

## 📥 Clonar Repositorios

### Clonar desde Azure DevOps
```bash
git clone https://dev.azure.com/mi-empresa/E-Commerce/_git/ecommerce-frontend
cd ecommerce-frontend
```

### Clonar desde GitHub
```bash
git clone https://github.com/usuario/repositorio.git
cd repositorio
```

### Clonar con SSH
```bash
git clone git@github.com:usuario/repositorio.git
```

---

## 🌿 Ramas (Branches)

### Crear y cambiar de rama
```bash
# Crear nueva rama
git checkout -b feature/nueva-funcionalidad

# Cambiar a rama existente
git checkout main
git checkout develop

# Ver todas las ramas
git branch -a
```

### Feature Branches
```bash
# Crear rama feature desde develop
git checkout develop
git pull origin develop
git checkout -b feature/autenticacion-oauth

# Trabajar en la feature
# ... hacer commits ...

# Subir la rama al remoto
git push origin feature/autenticacion-oauth
```

---

## 💾 Commits

### Hacer commit
```bash
# Agregar archivos específicos
git add archivo1.js archivo2.js

# Agregar todos los cambios
git add .

# Hacer commit con mensaje
git commit -m "feat: agregar sistema de autenticación OAuth"

# Hacer commit con mensaje largo
git commit -m "feat: agregar sistema de autenticación OAuth

- Implementar login con Google
- Agregar validación de tokens
- Actualizar documentación"
```

### Convenciones de mensajes
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Documentación
- `style:` - Formato, punto y coma, etc.
- `refactor:` - Refactorización
- `test:` - Tests
- `chore:` - Tareas de mantenimiento

---

## 📤 Subir Cambios

### Push básico
```bash
# Subir rama actual
git push origin nombre-rama

# Subir y establecer upstream
git push -u origin nombre-rama

# Forzar push (¡cuidado!)
git push --force origin nombre-rama
```

### Push con tags
```bash
# Crear tag
git tag v1.0.0

# Subir tag
git push origin v1.0.0

# Subir todos los tags
git push --tags
```

---

## 🔀 Comparar Archivos

### Ver diferencias
```bash
# Comparar working directory con staging
git diff

# Comparar staging con último commit
git diff --staged

# Comparar dos commits
git diff commit1 commit2

# Comparar dos ramas
git diff main..develop

# Comparar archivo específico entre ramas
git diff main..develop -- archivo.js
```

### Ver historial de cambios
```bash
# Ver log de commits
git log

# Ver log con gráfico
git log --oneline --graph --all

# Ver cambios en archivo específico
git log -p archivo.js
```

---

## 🔄 Sincronizar con Remoto

### Pull y Fetch
```bash
# Descargar cambios y fusionar
git pull origin main

# Solo descargar cambios (sin fusionar)
git fetch origin

# Ver diferencias antes de pull
git fetch origin
git diff main origin/main
```

### Merge y Rebase
```bash
# Fusionar rama en actual
git merge feature/nueva-funcionalidad

# Rebase (reorganizar commits)
git rebase main

# Rebase interactivo
git rebase -i HEAD~3
```

---

## 🗑️ Limpiar y Resetear

### Deshacer cambios
```bash
# Descartar cambios en working directory
git checkout -- archivo.js

# Descartar todos los cambios
git reset --hard HEAD

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (descartar cambios)
git reset --hard HEAD~1
```

### Limpiar archivos no rastreados
```bash
# Ver qué se eliminaría
git clean -n

# Eliminar archivos no rastreados
git clean -f

# Eliminar archivos y directorios
git clean -fd
```

---

## 🔍 Búsqueda y Filtrado

### Buscar en historial
```bash
# Buscar texto en commits
git log --grep="autenticación"

# Buscar texto en código
git log -S "function login" --source --all

# Buscar por autor
git log --author="Juan"
```

### Filtrar archivos
```bash
# Ver archivos en commit
git show --name-only commit-hash

# Ver archivos modificados entre commits
git diff --name-only commit1 commit2
```
```

### 🐍 Python

**Ejemplo real:**

```
# 🐍 Python - Comandos y Referencias

## 🐍 Entornos Virtuales

### Crear entorno virtual
```bash
# Python 3
python -m venv venv

# O con python3 explícito
python3 -m venv venv

# Con nombre específico
python -m venv mi-entorno
```

### Activar entorno virtual

#### Windows (PowerShell)
```powershell
.\venv\Scripts\Activate.ps1
```

#### Windows (CMD)
```cmd
venv\Scripts\activate.bat
```

#### Linux/Mac
```bash
source venv/bin/activate
```

### Desactivar entorno virtual
```bash
deactivate
```

### Instalar paquetes
```bash
# Instalar desde requirements.txt
pip install -r requirements.txt

# Instalar paquete específico
pip install nombre-paquete

# Instalar con versión específica
pip install django==4.2.0

# Instalar en modo desarrollo
pip install -e .
```

### Exportar dependencias
```bash
# Generar requirements.txt
pip freeze > requirements.txt

# Con versiones específicas
pip freeze > requirements.txt
```

---

## 🚀 Ejecutar Aplicaciones Python

### Django
```bash
# Crear proyecto
django-admin startproject mi-proyecto

# Crear app
python manage.py startapp mi-app

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Ejecutar servidor
python manage.py runserver
python manage.py runserver 8000  # Puerto específico
```

### Flask
```bash
# Ejecutar aplicación
flask run
flask run --port 5000
flask run --host 0.0.0.0  # Accesible desde red
```

### Scripts Python
```bash
# Ejecutar script
python script.py

# Con argumentos
python script.py arg1 arg2

# Ejecutar módulo
python -m mi_modulo
```

---

## 📦 Gestión de Paquetes

### pip
```bash
# Actualizar pip
python -m pip install --upgrade pip

# Listar paquetes instalados
pip list

# Mostrar información de paquete
pip show nombre-paquete

# Desinstalar paquete
pip uninstall nombre-paquete
```

### Conda (si usas Anaconda)
```bash
# Crear entorno
conda create -n mi-entorno python=3.11

# Activar entorno
conda activate mi-entorno

# Instalar paquete
conda install nombre-paquete

# Listar entornos
conda env list
```
```

### ⚛️ React/NPM

**Ejemplo real:**

```
# ⚛️ React/NPM - Comandos y Referencias

## 📦 NPM - Gestión de Paquetes

### Instalar dependencias
```bash
# Instalar desde package.json
npm install

# Instalar paquete específico
npm install nombre-paquete

# Instalar como dependencia de desarrollo
npm install --save-dev nombre-paquete

# Instalar globalmente
npm install -g nombre-paquete
```

### Actualizar paquetes
```bash
# Actualizar todos los paquetes
npm update

# Actualizar paquete específico
npm update nombre-paquete

# Verificar paquetes desactualizados
npm outdated
```

### Eliminar paquetes
```bash
# Desinstalar paquete
npm uninstall nombre-paquete

# Limpiar node_modules
rm -rf node_modules
npm install
```

---

## ⚛️ React - Comandos de Desarrollo

### Crear proyecto React
```bash
# Con Create React App
npx create-react-app mi-proyecto
cd mi-proyecto

# Con Vite (más rápido)
npm create vite@latest mi-proyecto -- --template react
cd mi-proyecto
npm install
```

### Ejecutar aplicación
```bash
# Desarrollo (Create React App)
npm start
# Abre en http://localhost:3000

# Desarrollo (Vite)
npm run dev
# Abre en http://localhost:5173

# Producción
npm run build
npm run preview  # Previsualizar build
```

### Scripts comunes
```bash
# Desarrollo
npm run dev
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test
npm run test:watch

# Linter
npm run lint
npm run lint:fix

# Formatear código
npm run format
```

---

## 🔧 Configuración y Herramientas

### package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx",
    "test": "jest"
  }
}
```

### Variables de entorno
```bash
# Crear archivo .env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_KEY=tu-api-key

# Usar en código
const apiUrl = process.env.REACT_APP_API_URL;
```

---

## 🛠️ Herramientas Adicionales

### TypeScript
```bash
# Instalar TypeScript
npm install --save-dev typescript @types/react

# Inicializar TypeScript
npx tsc --init

# Compilar TypeScript
npx tsc
```

### Testing
```bash
# Instalar Jest
npm install --save-dev jest @testing-library/react

# Ejecutar tests
npm test

# Coverage
npm test -- --coverage
```
```

### 🖥️ Comandos de Aplicaciones

**Ejemplo real:**

```
# 🖥️ Comandos de Aplicaciones

## 🛒 E-Commerce App

### Desarrollo
```bash
# Iniciar servidor desarrollo
npm run dev

# Con puerto específico
PORT=3001 npm run dev

# Con variables de entorno
NODE_ENV=development npm run dev
```

### Producción
```bash
# Build
npm run build

# Iniciar servidor producción
npm start

# Con PM2
pm2 start npm --name "ecommerce" -- start
```

---

## 🗄️ Base de Datos

### PostgreSQL
```bash
# Conectar a base de datos
psql -h localhost -U postgres -d ecommerce_dev

# Ejecutar script SQL
psql -h localhost -U postgres -d ecommerce_dev -f script.sql

# Backup
pg_dump -h localhost -U postgres ecommerce_dev > backup.sql

# Restaurar
psql -h localhost -U postgres -d ecommerce_dev < backup.sql
```

### MongoDB
```bash
# Conectar
mongo mongodb://localhost:27017/ecommerce_dev

# Ejecutar script
mongo ecommerce_dev script.js
```

---

## 🐳 Docker

### Comandos básicos
```bash
# Construir imagen
docker build -t ecommerce-app .

# Ejecutar contenedor
docker run -p 3000:3000 ecommerce-app

# Ver contenedores
docker ps
docker ps -a

# Detener contenedor
docker stop container-id

# Ver logs
docker logs container-id
```

### Docker Compose
```bash
# Iniciar servicios
docker-compose up

# En segundo plano
docker-compose up -d

# Detener servicios
docker-compose down
```
```

---

## 📁 7. Archivos y Recursos

### Estructura

```
📁 Archivos y Recursos (página padre)
├── 🖼️ Imágenes y Capturas (página hija)
├── 📄 Documentos y PDFs (página hija)
└── 📦 Entregas de Compañeros (página hija)
```

### 🖼️ Imágenes y Capturas

**Cómo usar:**
1. Escribe `/` → "Galería de Imágenes"
2. Sube imágenes organizadas por grupos
3. Agrega nombres descriptivos y descripciones

**Ejemplo de organización:**
- Grupo: "Diagramas de Arquitectura"
- Grupo: "Capturas de Pantalla - E-Commerce"
- Grupo: "Wireframes y Diseños"
- Grupo: "Documentación Visual"

### 📄 Documentos y PDFs

**Cómo usar:**
1. Escribe `/` → "Galería de Archivos"
2. Sube PDFs, documentos Word, Excel, etc.
3. Organiza por grupos temáticos

**Ejemplo de organización:**
- Grupo: "Manuales de Usuario"
- Grupo: "Documentación Técnica"
- Grupo: "Especificaciones de Proyecto"
- Grupo: "Contratos y Acuerdos"

### 📦 Entregas de Compañeros

**Ejemplo real:**

```
# 📦 Entregas de Compañeros

## 👤 Juan - Entrega Proyecto X (15 Ene 2025)

### 📝 Información
- **Fecha de entrega:** 15 de Enero 2025
- **Proyecto:** Sistema de Autenticación
- **Estado:** Completado

### 📂 Archivos Entregados

[Galería de Archivos con:]
- `auth-system.zip` - Código fuente completo
- `documentacion.pdf` - Documentación técnica
- `diagrama-arquitectura.png` - Diagrama del sistema

### 🎥 Videos y Tutoriales

[Galería de Archivos con videos:]
- `demo-autenticacion.mp4` - Demo del sistema funcionando
- `tutorial-setup.mp4` - Tutorial de configuración

### 📚 Documentación

**Estructura del código:**
```
auth-system/
├── src/
│   ├── controllers/
│   ├── models/
│   └── routes/
├── tests/
└── docs/
```

**Comandos para ejecutar:**
```bash
npm install
npm run dev
```

### 🔗 Enlaces Relacionados
- [Repositorio Azure DevOps](https://dev.azure.com/...)
- [Documentación Online](https://docs...)

### 📝 Notas Importantes
- El sistema usa JWT para tokens
- La configuración está en `.env.example`
- Requiere Node.js 18+
```

**Cómo organizar:**
- Una sección por entrega
- Usa encabezados (H2) con nombre y fecha
- Galerías de archivos para código, documentos, videos
- Bloques de código para comandos
- Enlaces a repositorios si aplica

---

## 📅 8. Tareas del Día

### Estructura

```
📅 Tareas del Día (página única, actualizarla diariamente)
```

### Ejemplo Real

```
# 📅 Tareas del Día - 20 de Enero 2025

## ✅ Completadas
- [x] Revisar PR #123 del equipo
- [x] Actualizar documentación de API
- [x] Daily standup (9:00 AM)
- [x] Revisar código de autenticación

## 🔄 En Progreso
- [ ] Implementar tests para comentarios
- [ ] Revisar diseño de nueva feature X
- [ ] Preparar demo para sprint review

## 📋 Pendientes
- [ ] Reunión con equipo de diseño (2:00 PM)
- [ ] Revisar feedback de code review
- [ ] Actualizar tickets en Jira

## ⚠️ Bloqueadores
- Esperando respuesta de diseño para feature X
- Pendiente aprobación de arquitectura

## 📝 Notas del Día
- El sistema de comentarios está funcionando bien
- Necesito revisar el rendimiento de las queries
- Recordar actualizar documentación después del merge
```

**Cómo mantener:**
- Actualiza cada mañana con tareas del día
- Marca completadas durante el día
- Agrega notas importantes
- Al final del día, mueve pendientes al siguiente día

---

## 💡 Componentes Disponibles (Comando `/`)

### 📋 Tablas y Organización
- **`tabla`** → Tabla estilo Notion (para sprints, datos estructurados)
- **`plantilla financiero`** → Sistema financiero completo

### 🖼️ Medios
- **`galeria imagenes`** → Galería de imágenes organizadas
- **`galeria archivos`** → Galería de archivos (PDFs, videos, ZIP, etc.)
- **`insertar imagen`** → Imagen individual con metadata

### 📝 Texto y Estructura
- **`titulo grande`** → Encabezado H1
- **`encabezado`** → Encabezado H2
- **`parrafo`** → Texto normal
- **`lista con viñetas`** → Lista con bullets
- **`lista numerada`** → Lista numerada
- **`bloque desplegable`** → Contenido colapsable (ideal para información sensible)

### 💻 Código
- **`bloque de código`** → Código con resaltado de sintaxis

### 🔗 Enlaces
- **`enlace a pagina`** → Enlace interno a otra página

### 📅 Calendario
- **`calendario`** → Calendario interactivo con eventos

### 📄 Plantillas
- **`plantilla`** → Insertar contenido de plantilla guardada

---

## 📖 Flujo de Trabajo Diario

### Inicio del día
1. Abre "📅 Tareas del Día" y revisa las pendientes
2. Abre el sprint activo (dentro de "🎯 Sprints")
3. Actualiza el progreso en la tabla del sprint
4. Revisa "📅 Dailys y Reuniones" si hay notas importantes

### Durante el día
1. Marca tareas completadas en "📅 Tareas del Día"
2. Actualiza el sprint con progreso
3. Agrega notas en "💬 Explicaciones de Compañeros" si alguien te explica algo
4. Documenta comandos útiles en "💻 Comandos y Referencias"
5. Guarda capturas y archivos en las galerías correspondientes

### Fin del día
1. Revisa y actualiza el sprint
2. Completa "📅 Tareas del Día"
3. Agrega notas importantes del día
4. Actualiza "📅 Dailys y Reuniones" con lo que hiciste

### Fin de sprint (cada 15 días)
1. Archiva el sprint completado (arrastra a "Sprints Archivados")
2. Crea nuevo sprint (dentro de "🎯 Sprints")
3. Inserta tabla → "🎯 Plantilla Scrum"
4. Configura fechas y agrega tareas iniciales

---

## ✅ Checklist de Configuración Inicial

- [ ] Crear página "📊 Dashboard Personal"
- [ ] Crear página "🎯 Sprints" (dentro de Dashboard)
- [ ] Crear página "🏗️ Proyectos" (dentro de Dashboard)
- [ ] Crear página "📝 Notas y Documentación" (dentro de Dashboard)
  - [ ] Crear "📅 Dailys y Reuniones"
  - [ ] Crear "💬 Explicaciones de Compañeros"
  - [ ] Crear "📚 Documentación de Proyectos"
  - [ ] Crear "💡 Ideas y Notas Rápidas"
- [ ] Crear página "🔐 Credenciales y Accesos" (dentro de Dashboard)
  - [ ] Crear "🔑 Credenciales"
  - [ ] Crear "🌐 Accesos Web"
  - [ ] Crear "☁️ AWS y Azure DevOps"
- [ ] Crear página "💻 Comandos y Referencias" (dentro de Dashboard)
  - [ ] Crear "🐙 Git"
  - [ ] Crear "🐍 Python"
  - [ ] Crear "⚛️ React/NPM"
  - [ ] Crear "🖥️ Comandos de Aplicaciones"
- [ ] Crear página "📁 Archivos y Recursos" (dentro de Dashboard)
  - [ ] Crear "🖼️ Imágenes y Capturas"
  - [ ] Crear "📄 Documentos y PDFs"
  - [ ] Crear "📦 Entregas de Compañeros"
- [ ] Crear página "📅 Tareas del Día" (dentro de Dashboard)
- [ ] Crear página "📦 Sprints Archivados" (dentro de Sprints)
- [ ] Crear sprint actual (dentro de Sprints)
- [ ] Configurar tabla Scrum en el sprint actual
- [ ] Agregar primera entrada en "📅 Dailys y Reuniones"
- [ ] Agregar comandos básicos en "💻 Comandos y Referencias"
- [ ] Agregar credenciales importantes en "🔐 Credenciales y Accesos"

---

## 🎯 Consejos Finales

### Organización
1. **Usa páginas anidadas** para crear una estructura clara en el sidebar
2. **Máximo 3-4 niveles de anidación** (Dashboard → Sección → Item → Sub-item)
3. **Arrastra y suelta** para reorganizar páginas
4. **Colapsa secciones** que no usas frecuentemente (clic en el chevron)

### Nomenclatura
- **Sprints:** `Sprint 2025-01`, `Sprint 2025-02` (formato consistente)
- **Proyectos:** Nombre descriptivo del proyecto
- **Dailys:** `2025-01-20 - Daily Standup` (fecha al inicio)
- **Usa emojis** para identificación visual rápida

### Seguridad
- **NUNCA** pongas credenciales en texto plano
- **SIEMPRE** usa bloques desplegables para información sensible
- Considera usar un gestor de contraseñas para información muy sensible

### Mantenimiento
- **Archiva sprints completados** moviéndolos a "Sprints Archivados"
- **Actualiza "Tareas del Día"** cada mañana y al final del día
- **Revisa y limpia** proyectos archivados periódicamente
- **Actualiza comandos** cuando descubras nuevos útiles
- **Documenta explicaciones** de compañeros inmediatamente después de recibirlas

---

¡Listo! Con esta estructura tendrás todo organizado y fácil de acceder. 🎉
