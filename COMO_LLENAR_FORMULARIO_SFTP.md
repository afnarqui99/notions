# 📝 Cómo Llenar el Formulario de Conexión SFTP

## 🎯 Guía Paso a Paso para Conectarte

---

## 📋 Campos del Formulario

### 1. **Host** (Requerido)
```
Ejemplo: servidor.com
O: 192.168.1.100
O: ftp.miempresa.com
```
- El nombre del servidor o la IP
- **NO incluyas** `http://` o `ftp://`

---

### 2. **Puerto** (Opcional, default: 22)
```
Ejemplo: 22
```
- Puerto SFTP (generalmente 22)
- Si no lo llenas, usará 22 por defecto

---

### 3. **Usuario** (Requerido)
```
Ejemplo: juan
O: root
O: ftpuser
```
- Tu nombre de usuario en el servidor

---

### 4. **Usar clave privada SSH** (Checkbox)
- ✅ **Marca esta casilla** si vas a usar una clave privada
- ❌ **Desmarca** si vas a usar contraseña

---

### 5. **Contraseña** (Solo si NO usas clave privada)
```
Ejemplo: mi_contraseña_secreta
```
- Solo se muestra si NO marcaste "Usar clave privada SSH"

---

### 6. **Clave privada SSH** (Solo si usas clave privada) ⭐

Tienes **2 OPCIONES**:

#### **OPCIÓN A: Pegar el Contenido Completo (Recomendado para PEM)**

1. Abre tu archivo de clave PEM (el que generaste con `ssh-keygen -t rsa`)
2. Copia **TODO** el contenido, incluyendo las líneas `-----BEGIN` y `-----END`
3. Pégalo en el campo "Clave privada SSH"

**Ejemplo de cómo debe verse:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA7xK8v...
(mucho más texto aquí)
...xyzABC123
-----END RSA PRIVATE KEY-----
```

**✅ VENTAJAS:**
- Funciona inmediatamente
- No necesitas recordar rutas
- Más seguro (no dejas rutas en el código)

---

#### **OPCIÓN B: Ruta del Archivo (Windows)**

1. Guarda tu clave en un archivo (ej: `C:\Users\Juan\.ssh\mi_clave.txt`)
2. En el campo "Clave privada SSH", pega la ruta completa:

**Ejemplo:**
```
C:\Users\Juan\.ssh\mi_clave.txt
```

**⚠️ IMPORTANTE:**
- Usa barras invertidas `\` o barras normales `/` (ambas funcionan)
- La ruta debe ser completa (no relativa)
- El archivo debe existir y ser legible

---

### 7. **Frase de contraseña** (Opcional)
```
Ejemplo: mi_frase_secreta
```
- Solo si tu clave privada tiene una frase de contraseña
- Si tu clave NO tiene frase, déjalo vacío

---

### 8. **Directorio remoto inicial** (Opcional)
```
Ejemplo: /home/juan/proyectos
O: /var/www/html
O: /uploads
```
- Directorio al que quieres conectarte automáticamente
- Si lo dejas vacío, te conectarás al directorio home del usuario

---

### 9. **Nombre de conexión** (Opcional)
```
Ejemplo: Servidor Producción
O: Mi Servidor SFTP
```
- Un nombre descriptivo para identificar esta conexión
- Si lo dejas vacío, usará `host:puerto`

---

## 🎯 Ejemplo Completo de Formulario Lleno

### **Caso 1: Usando Clave PEM (Pegando Contenido)**

```
Host: servidor.com
Puerto: 22
Usuario: juan
☑ Usar clave privada SSH
Clave privada SSH:
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA7xK8v...
(mucho más texto)
-----END RSA PRIVATE KEY-----
Frase de contraseña: (vacío si no tiene)
Directorio remoto inicial: /home/juan/proyectos
Nombre de conexión: Mi Servidor
```

---

### **Caso 2: Usando Clave PEM (Ruta de Archivo)**

```
Host: servidor.com
Puerto: 22
Usuario: juan
☑ Usar clave privada SSH
Clave privada SSH: C:\Users\Juan\.ssh\mi_clave.txt
Frase de contraseña: (vacío si no tiene)
Directorio remoto inicial: /home/juan/proyectos
Nombre de conexión: Mi Servidor
```

---

### **Caso 3: Usando Contraseña**

```
Host: servidor.com
Puerto: 22
Usuario: juan
☐ Usar clave privada SSH (desmarcado)
Contraseña: mi_contraseña_secreta
Directorio remoto inicial: /home/juan/proyectos
Nombre de conexión: Mi Servidor
```

---

## ✅ Checklist Antes de Conectar

- [ ] Host correcto (sin http:// o ftp://)
- [ ] Puerto correcto (generalmente 22)
- [ ] Usuario correcto
- [ ] Si usas clave privada:
  - [ ] Clave en formato PEM (-----BEGIN RSA PRIVATE KEY-----)
  - [ ] Contenido completo pegado O ruta de archivo correcta
  - [ ] Frase de contraseña (si la clave la tiene)
- [ ] Si usas contraseña:
  - [ ] Contraseña correcta
- [ ] Clave pública agregada al servidor (si es clave nueva)

---

## 🔍 Solución de Problemas

### Error: "Formato de clave no compatible"
- **Causa**: Estás usando formato OpenSSH y ssh-keygen no está disponible
- **Solución**: Convierte la clave a PEM o instala Git para Windows

### Error: "Autenticación fallida"
- **Causa**: La clave pública no está en el servidor
- **Solución**: Agrega tu clave pública al archivo `~/.ssh/authorized_keys` en el servidor

### Error: "El archivo de clave privada no existe"
- **Causa**: La ruta del archivo es incorrecta
- **Solución**: Verifica que la ruta sea correcta y el archivo exista

---

## 💡 Tips

1. **Para claves PEM**: Usa la opción de "pegar contenido" - es más fácil y seguro
2. **Para claves nuevas**: Recuerda agregar la clave pública al servidor
3. **Guarda la conexión**: Usa el botón "Guardar" para no tener que llenar todo cada vez
4. **Revisa la consola**: Si hay errores, abre la consola del navegador (F12) para ver logs detallados

---

¡Con esta guía deberías poder conectarte sin problemas! 🎉

