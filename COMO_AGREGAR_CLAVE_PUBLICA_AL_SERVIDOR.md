# 🔑 Cómo Agregar tu Clave Pública al Servidor SFTP

## 📋 Problema
Si generaste una **nueva clave** con `ssh-keygen -t rsa`, tienes:
- ✅ Clave **privada** (la que usas en la aplicación)
- ❌ Clave **pública** (que debe estar en el servidor)

**El servidor necesita tu clave pública para autenticarte.**

---

## 🎯 Solución: Agregar la Clave Pública al Servidor

### Paso 1: Encontrar tu Clave Pública

Cuando generaste la clave con:
```powershell
ssh-keygen -t rsa -b 2048 -m PEM -f "ruta"
```

Se crearon **DOS archivos**:
1. **Clave privada**: `ruta` (sin extensión o .key) - Esta la usas en la app
2. **Clave pública**: `ruta.pub` - Esta va al servidor

**Ejemplo:**
- Si guardaste en: `C:\Users\Juan\.ssh\mi_clave.txt`
- Tu clave pública está en: `C:\Users\Juan\.ssh\mi_clave.txt.pub`

### Paso 2: Ver el Contenido de tu Clave Pública

Abre el archivo `.pub` con el Bloc de notas. Debería verse así:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... (mucho texto) ... usuario@equipo
```

### Paso 3: Agregar la Clave Pública al Servidor

Tienes varias opciones:

#### Opción A: Si tienes acceso SSH al servidor

1. **Conéctate al servidor** (puedes usar tu aplicación Python que funciona):
   ```bash
   ssh usuario@servidor
   ```

2. **Edita el archivo authorized_keys**:
   ```bash
   nano ~/.ssh/authorized_keys
   ```
   O con vi:
   ```bash
   vi ~/.ssh/authorized_keys
   ```

3. **Pega tu clave pública** (todo el contenido del archivo .pub) en una nueva línea

4. **Guarda y cierra** (en nano: Ctrl+X, luego Y, luego Enter)

5. **Asegura los permisos correctos**:
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

#### Opción B: Si tienes acceso con contraseña (temporal)

1. **Conéctate con contraseña** usando tu aplicación Python o cualquier cliente SFTP

2. **Crea/edita el archivo** `~/.ssh/authorized_keys` en el servidor

3. **Agrega tu clave pública** (contenido del archivo .pub)

#### Opción C: Usando ssh-copy-id (si está disponible)

```bash
ssh-copy-id -i "C:\Users\Juan\.ssh\mi_clave.txt.pub" usuario@servidor
```

---

## 📝 Ejemplo Completo

### 1. Generaste la clave:
```powershell
ssh-keygen -t rsa -b 2048 -m PEM -f "C:\Users\Juan\.ssh\mi_clave.txt"
```

### 2. Se crearon dos archivos:
- `C:\Users\Juan\.ssh\mi_clave.txt` (privada - usas en la app)
- `C:\Users\Juan\.ssh\mi_clave.txt.pub` (pública - va al servidor)

### 3. Contenido del archivo .pub:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC7xK8v... (mucho más texto) ... juan@equipo
```

### 4. En el servidor, agrega esa línea a `~/.ssh/authorized_keys`

### 5. Ahora puedes usar la clave privada en la aplicación

---

## ✅ Verificación

Después de agregar la clave pública al servidor:

1. **Prueba la conexión** desde la aplicación
2. **Debería funcionar** sin el error de autenticación

---

## 🔍 Si Aún No Funciona

### Verifica:

1. **Usuario correcto**: Asegúrate de usar el mismo usuario que tiene la clave pública en el servidor

2. **Clave pública correcta**: La clave pública debe corresponder a la clave privada que estás usando

3. **Permisos en el servidor**:
   ```bash
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

4. **Formato correcto**: El archivo `authorized_keys` debe tener una clave por línea

5. **Servidor SSH configurado**: Algunos servidores requieren configuración adicional en `/etc/ssh/sshd_config`

---

## 💡 Consejo

Si ya tenías una clave que funcionaba con Python (paramiko), puedes:
- Usar esa misma clave privada en esta aplicación
- O agregar la nueva clave pública al servidor junto con la anterior

---

## 🆘 Alternativa Temporal

Si necesitas conectarte ahora mismo y no puedes agregar la clave pública:
- Usa **autenticación por contraseña** temporalmente
- Luego agrega la clave pública al servidor
- Cambia a autenticación por clave

---

¡Con estos pasos deberías poder resolver el error de autenticación! 🎉

